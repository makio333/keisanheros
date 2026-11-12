import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import Stripe from 'stripe';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createStripePayments} from '../server/stripe-payments.mjs';
import {PURCHASE_PRICES} from '../server/purchase-pricing.mjs';

const directory=await mkdtemp(path.join(tmpdir(),'legend-order-recovery-'));
let db=await openLocalAccountStore(directory),now=Date.now(),loseResponse=false,failRetrieval=false;
const secret='whsec_recovery_fixture_only',sdk=new Stripe('sk_test_fixture_only'),rows=new Map(),calls=[];
const catalog=new Map(Object.entries(PURCHASE_PRICES).map(([id,plan])=>['price_'+id,{id:'price_'+id,active:true,type:'one_time',currency:'jpy',tax_behavior:'inclusive',livemode:false,unit_amount:plan.amount}]));
const stripe={webhooks:sdk.webhooks,prices:{retrieve:async id=>catalog.get(id)},checkout:{sessions:{
  async create(params,options){
    calls.push(structuredClone({params,options}));
    const id='cs_'+options.idempotencyKey,item=params.line_items[0];
    const price=item.price_data?{id:'price_inline',type:'one_time',...item.price_data}:catalog.get(item.price);
    if(!rows.has(id))rows.set(id,{...structuredClone(params),id,livemode:false,status:'open',payment_status:'unpaid',expires_at:now/1000+86400,url:'https://checkout.stripe.com/c/pay/'+id,currency:'jpy',amount_total:price.unit_amount,line_items:{has_more:false,data:[{quantity:1,price}]}});
    if(loseResponse){loseResponse=false;throw Error('fixture_lost_response');}
    return structuredClone(rows.get(id));
  },
  async retrieve(id){if(failRetrieval)throw Error('fixture_network_error');return structuredClone(rows.get(id));},
  async expire(id){const row=rows.get(id);if(row.status!=='open')throw Error('fixture_not_open');row.status='expired';return structuredClone(row);},
}}};
const create=()=>createStripePayments({stripe,store:db,sessions:db.sessions,origin:'https://fixture.example',webhookSecret:secret,priceIds:Object.fromEntries([...catalog].map(([id])=>[id.slice(6),id])),now:()=>now});
let payments=create();
async function purchaser(subject){
  const {accountId}=await db.auth.resolveIdentity({provider:'line',providerId:'fixture',subject});
  await db.sessions.create(subject,{accountId,expiresAt:now+10*86400000});return {session:subject,accountId};
}
const order=accountId=>db.transaction(tx=>tx.getGameDocument('stripeCheckout/'+accountId));
async function paid(row){
  row.status='complete';row.payment_status='paid';
  const payload=JSON.stringify({id:'evt_'+row.id,livemode:false,type:'checkout.session.async_payment_succeeded',data:{object:{id:row.id}}});
  return payments.webhook(Buffer.from(payload),sdk.webhooks.generateTestHeaderString({payload,secret}));
}
try{
  const a=await purchaser('timeout-restart');loseResponse=true;
  await assert.rejects(payments.checkout(a.session),/fixture_lost_response/);
  const reserved=await order(a.accountId);assert.ok(reserved.id);assert.equal(reserved.stripeSessionId,undefined);
  assert.equal(rows.size,1);const originalCall=calls.at(-1);
  await db.close();db=await openLocalAccountStore(directory);payments=create();
  const resumed=await payments.checkout(a.session);assert.match(resumed.url,/checkout.stripe.com/);
  assert.equal((await order(a.accountId)).id,reserved.id);assert.equal(rows.size,1);
  assert.deepEqual(calls.at(-1),originalCall,'restart retries the exact request and idempotency key');
  await paid([...rows.values()].at(-1));assert.equal((await payments.accounts.summary(a.session)).saveLimit,3);

  const b=await purchaser('webhook-before-response');loseResponse=true;
  await assert.rejects(payments.checkout(b.session),/fixture_lost_response/);
  const bRow=[...rows.values()].at(-1);await paid(bRow);await paid(bRow);
  assert.equal((await payments.accounts.summary(b.session)).saveLimit,3);
  assert.equal((await order(b.accountId)).fulfilled,true);
  assert.equal((await db.transaction(tx=>tx.listPurchases(b.accountId))).length,1);

  const c=await purchaser('late-async');await payments.checkout(c.session);
  const cRow=[...rows.values()].at(-1),count=rows.size;cRow.status='complete';
  now+=2*86400000;
  await assert.rejects(payments.checkout(c.session,'organization10'),/payment_processing/);
  await assert.rejects(payments.cancelCheckout(c.session),/payment_processing/);
  assert.equal(rows.size,count,'elapsed expiry never releases a completed payment still awaiting success');
  await paid(cRow);assert.equal((await payments.accounts.summary(c.session)).saveLimit,3);

  const d=await purchaser('expired');await payments.checkout(d.session);
  const expired=[...rows.values()].at(-1);expired.status='expired';
  await payments.checkout(d.session,'organization20');assert.equal(rows.size,count+2);
  assert.equal((await db.transaction(tx=>tx.getGameDocument('stripeOrders/'+expired.metadata.orderId))).cancelled,true);
  assert.equal((await payments.accounts.summary(d.session)).saveLimit,0);

  const e=await purchaser('ambiguous-old');loseResponse=true;
  await assert.rejects(payments.checkout(e.session),/fixture_lost_response/);
  const unresolved=[...rows.values()].at(-1),before=calls.length;now+=24*60*60*1000;
  await assert.rejects(payments.checkout(e.session),/payment_processing/);
  await assert.rejects(payments.cancelCheckout(e.session),/payment_processing/);
  assert.equal(calls.length,before,'an aged ambiguous request cannot reuse a pruned key');
  await paid(unresolved);assert.equal((await payments.accounts.summary(e.session)).saveLimit,3);

  const f=await purchaser('concurrent-plans'),previousCount=rows.size;
  const outcomes=await Promise.allSettled([payments.checkout(f.session,'organization10'),payments.checkout(f.session,'organization20')]);
  assert.equal(outcomes.filter(row=>row.status==='fulfilled').length,1);
  assert.equal(outcomes.find(row=>row.status==='rejected').reason.message,'checkout_in_progress');
  assert.equal(rows.size,previousCount+1);
  failRetrieval=true;
  await assert.rejects(payments.checkout(f.session,'organization30'),/fixture_network_error/);
  assert.equal(rows.size,previousCount+1);failRetrieval=false;
  await payments.cancelCheckout(f.session);await payments.checkout(f.session,'organization30');
  assert.equal(rows.size,previousCount+2);
  console.log('PASS: durable intent before Stripe, exact restart retries, webhook before response, late async payment lock, verified expiry, aged ambiguity hold and concurrent plan isolation. Offline fixtures only.');
}finally{await db.close();await rm(directory,{recursive:true,force:true});}
