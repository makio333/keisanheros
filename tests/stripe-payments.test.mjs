import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import Stripe from 'stripe';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createStripePayments} from '../server/stripe-payments.mjs';
import {createStripePaymentHandler} from '../server/stripe-payments-http.mjs';
import {createStripePaymentIntegration} from '../server/stripe-payment-integration.mjs';
import {PURCHASE_PRICES,purchaseQuote} from '../server/purchase-pricing.mjs';

const directory=await mkdtemp(path.join(tmpdir(),'legend-stripe-'));
let db=await openLocalAccountStore(directory),handler;
const server=createServer((req,res)=>handler(req,res).then(found=>{if(!found){res.writeHead(404);res.end();}}));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,secret='whsec_local_fixture_only',sdk=new Stripe('sk_test_fixture_only');
const price={id:'price_fixture',active:true,type:'one_time',currency:'jpy',unit_amount:4980,tax_behavior:'inclusive',livemode:false};
const organizationPrices=Object.fromEntries([10,20,30].map(n=>['organization'+n,{...price,id:'price_org'+n,unit_amount:PURCHASE_PRICES['organization'+n].amount}]));
const catalog=new Map([price,...Object.values(organizationPrices)].map(row=>[row.id,row]));
const checkouts=new Map(),calls=[];
const stripe={prices:{retrieve:async id=>catalog.get(id)},webhooks:sdk.webhooks,checkout:{sessions:{
  async create(params,options){
    calls.push({params,options});const id='cs_'+options.idempotencyKey;
    const item=params.line_items[0],linePrice=item.price_data?{id:'price_inline_'+id,type:'one_time',...item.price_data}:structuredClone(catalog.get(item.price));
    if(!checkouts.has(id))checkouts.set(id,{...params,id,object:'checkout.session',livemode:false,status:'open',payment_status:'unpaid',currency:'jpy',amount_total:linePrice.unit_amount,expires_at:Math.floor(Date.now()/1000)+86400,
      url:'https://checkout.stripe.com/c/pay/'+id,line_items:{has_more:false,data:[{quantity:1,price:linePrice}]}});
    return checkouts.get(id);
  },
  async retrieve(id){if(!checkouts.has(id))throw Error('unknown_checkout');return structuredClone(checkouts.get(id));},
  async expire(id){const row=checkouts.get(id);if(row.status!=='open')throw Error('not_open');row.status='expired';return row;},
}}};
try{
  const idA=(await db.auth.resolveIdentity({provider:'line',providerId:'fixture',subject:'a'})).accountId;
  const idB=(await db.auth.resolveIdentity({provider:'line',providerId:'fixture',subject:'b'})).accountId;
  const session='a'.repeat(64),second='b'.repeat(64);
  await db.sessions.create(session,{accountId:idA,expiresAt:Date.now()+86400000});
  await db.sessions.create(second,{accountId:idB,expiresAt:Date.now()+86400000});
  const config=()=>({stripe,store:db,sessions:db.sessions,origin,webhookSecret:secret,personalPriceId:price.id,priceIds:Object.fromEntries(Object.entries(organizationPrices).map(([id,row])=>[id,row.id]))});
  let payments=createStripePayments(config());handler=createStripePaymentHandler({payments,origin});
  const post=(route,body='',headers={})=>fetch(origin+route,{method:'POST',headers,body});
  const checkout=(productId='personal')=>post('/api/payments/checkout',JSON.stringify({productId,accountId:idB,price:'price_attacker',saveLimit:999}),{Origin:origin,Cookie:'legend-local-session='+session});
  const signed=(event,override={})=>{const payload=JSON.stringify(event);return post('/api/payments/stripe/webhook',payload,{'stripe-signature':sdk.webhooks.generateTestHeaderString({payload,secret,...override})});};
  assert.equal((await post('/api/payments/checkout')).status,403);
  assert.equal((await post('/api/payments/checkout','',{Origin:origin})).status,401);
  assert.equal((await fetch(origin+'/api/payments/checkout')).status,405);
  const list=()=>fetch(origin+'/api/payments/products',{headers:{Cookie:'legend-local-session='+session}}).then(r=>r.json());
  assert.deepEqual((await list()).map(p=>p.saveLimit),[3,10,20,30]);
  assert.deepEqual((await list()).map(p=>p.amount),[4980,19800,34800,49800]);
  assert.equal((await fetch(origin+'/api/payments/products')).status,401);
  assert.equal((await checkout('organization999')).status,400);assert.equal((await checkout('__proto__')).status,400);
  assert.equal((await checkout()).status,200);await checkout();
  assert.equal(checkouts.size,1);assert.equal(calls[0].params.mode,'payment');assert.equal(calls[0].params.client_reference_id,idA);
  assert.deepEqual(calls[0].params.line_items,[{price:price.id,quantity:1}]);
  assert.equal(calls[0].options.idempotencyKey,calls[1].options.idempotencyKey);
  assert.equal((await checkout('organization10')).status,409,'parallel plan purchases cannot reuse the same upgrade credit');
  assert.equal((await payments.accounts.summary(session)).saveLimit,0,'opening checkout never grants access');
  await assert.rejects(payments.accounts.applyPurchaseEvidence({accountId:idA,eventId:'forged',purchaseId:'forged',productId:'personal'}),/unverified_purchase/);
  const [row]=checkouts.values(),event={id:'evt_fixture_paid',object:'event',livemode:false,type:'checkout.session.completed',data:{object:{id:row.id}}};
  assert.equal((await signed(event,{secret:'whsec_wrong'})).status,400);
  assert.equal((await signed(event,{timestamp:Math.floor(Date.now()/1000)-600})).status,400);
  assert.equal((await signed({...event,livemode:true})).status,400);
  assert.equal((await signed(event)).status,200);assert.equal((await payments.accounts.summary(session)).saveLimit,0,'unpaid completion is not fulfilled');
  row.payment_status='paid';row.status='complete';
  row.client_reference_id=idB;assert.equal((await signed(event)).status,400);row.client_reference_id=idA;
  row.line_items.data[0].price.id='price_attacker';assert.equal((await signed(event)).status,400);row.line_items.data[0].price.id=price.id;
  row.mode='subscription';assert.equal((await signed(event)).status,400);row.mode='payment';
  row.amount_total=1;assert.equal((await signed(event)).status,400);row.amount_total=4980;
  assert.equal((await post('/api/payments/checkout/cancel','',{Origin:origin,Cookie:'legend-local-session='+session})).status,409,'paid sessions cannot be cancelled to begin another charge');
  const results=await Promise.all([signed(event),signed(event),signed({...event,id:'evt_fixture_async',type:'checkout.session.async_payment_succeeded'})]);
  assert.ok(results.every(response=>response.status===200));
  assert.equal((await payments.accounts.summary(session)).saveLimit,3);assert.equal((await payments.accounts.summary(second)).saveLimit,0);
  assert.equal((await db.transaction(tx=>tx.listPurchases(idA))).length,1);assert.equal((await checkout()).status,409);
  const saves=await Promise.all([1,2,3,4].map(n=>payments.accounts.createSave(session,{name:'fixture'+n,gameState:{playerName:'fixture'+n}}).then(()=>true,()=>false)));
  assert.equal(saves.filter(Boolean).length,3);
  const originalKeys=(await payments.accounts.listSaves(session)).map(row=>row.key);
  const paidAmounts=[4980];
  for(const n of [10,20,30]){
    assert.equal((await checkout('organization'+n)).status,200);
    const current=[...checkouts.values()].at(-1);
    const expected=n===10?14820:15000;
    assert.equal(current.line_items.data[0].price.unit_amount,expected);assert.equal(current.amount_total,expected);
    assert.equal(calls.at(-1).params.line_items[0].price_data.unit_amount,expected);paidAmounts.push(expected);
    assert.equal((await payments.accounts.summary(session)).saveLimit,n===10?3:n-10,'checkout alone does not upgrade');
    current.status='complete';current.payment_status='paid';
    const notification={...event,id:'evt_org'+n,data:{object:{id:current.id}}};
    assert.equal((await signed(notification)).status,200);assert.equal((await signed(notification)).status,200);
    assert.equal((await payments.accounts.summary(session)).saveLimit,n,'capacity is total, not additive');
    assert.deepEqual((await payments.accounts.listSaves(session)).map(row=>row.key),originalKeys);
    assert.equal((await checkout('organization'+n)).status,409);
    assert.deepEqual((await list()).map(p=>p.saveLimit),[10,20,30].filter(limit=>limit>n));
  }
  assert.equal(paidAmounts.reduce((sum,amount)=>sum+amount,0),49800,'sequential upgrades cost the same as buying 30 slots directly');
  const extra=await Promise.all(Array.from({length:35},(_,n)=>payments.accounts.createSave(session,{name:'group'+n,gameState:{playerName:'group'+n}}).then(()=>true,()=>false)));
  assert.equal(extra.filter(Boolean).length,27,'30 total saves, including the original three');
  await db.close();db=await openLocalAccountStore(directory);payments=createStripePayments(config());handler=createStripePaymentHandler({payments,origin});
  const restored='c'.repeat(64);await db.sessions.create(restored,{accountId:idA,expiresAt:Date.now()+86400000});
  assert.equal((await payments.accounts.summary(restored)).saveLimit,30);assert.equal((await payments.accounts.listSaves(restored)).length,30);
  assert.equal((await signed(event)).status,200);assert.equal((await db.transaction(tx=>tx.listPurchases(idA))).length,4);
  assert.equal((await checkout('personal')).status,409);
  price.type='recurring';await assert.rejects(payments.checkout(second),/invalid_stripe_price/);price.type='one_time';
  price.unit_amount=100;await assert.rejects(payments.checkout(second),/invalid_stripe_price/);price.unit_amount=4980;
  await payments.checkout(second,'personal');const cancelled=[...checkouts.values()].at(-1);
  await assert.rejects(payments.checkout(second,'organization30'),/checkout_in_progress/);
  assert.equal((await post('/api/payments/checkout/cancel')).status,403);
  assert.equal((await post('/api/payments/checkout/cancel','',{Origin:origin,Cookie:'legend-local-session='+session})).status,200);
  assert.equal(cancelled.status,'open','another purchaser cannot cancel this checkout');
  assert.equal((await post('/api/payments/checkout/cancel','',{Origin:origin,Cookie:'legend-local-session='+second})).status,200);
  assert.equal(cancelled.status,'expired');
  assert.equal((await payments.accounts.summary(second)).saveLimit,0);
  await payments.checkout(second,'organization30');const direct=[...checkouts.values()].at(-1);
  direct.status='complete';direct.payment_status='paid';
  assert.equal((await signed({...event,id:'evt_direct_org',data:{object:{id:direct.id}}})).status,200);
  assert.equal((await payments.accounts.summary(second)).saveLimit,30,'organization can be the first purchase');
  assert.equal((await payments.accounts.listSaves(second)).length,0,'no other purchaser saves are imported');
  const plans=Object.entries(PURCHASE_PRICES);
  for(const [fromId,from] of plans)for(const [toId,to] of plans){
    if(to.saveLimit>from.saveLimit){
      assert.equal(purchaseQuote(from.saveLimit,toId).amount,to.amount-from.amount);
      const key=`fixture-${fromId}-${toId}`,identity=await db.auth.resolveIdentity({provider:'line',providerId:'fixture',subject:key});
      await db.sessions.create(key,{accountId:identity.accountId,expiresAt:Date.now()+86400000});
      await db.transaction(tx=>tx.putPurchase({purchaseId:key,accountId:identity.accountId,productId:fromId,active:true}));
      await payments.checkout(key,toId);const checkoutRow=[...checkouts.values()].at(-1);
      assert.equal(checkoutRow.amount_total,to.amount-from.amount);checkoutRow.status='complete';checkoutRow.payment_status='paid';
      assert.equal((await signed({...event,id:'evt_'+key,data:{object:{id:checkoutRow.id}}})).status,200);
      assert.equal((await payments.accounts.summary(key)).saveLimit,to.saveLimit);
    }
    else assert.throws(()=>purchaseQuote(from.saveLimit,toId),/already_purchased/);
  }
  assert.throws(()=>purchaseQuote(42,'organization30'),/already_purchased/);
  assert.throws(()=>createStripePaymentIntegration({store:db,sessions:db.sessions,origin,env:{}}),/stripe_not_configured/);
  assert.throws(()=>createStripePayments({...config(),liveMode:true}),/unsafe_payment_origin/);
  console.log('PASS: offline Stripe signatures + HTTP, personal 3 and organization 10/20/30, direct purchase and upgrades preserving saves, no addition/downgrade, concurrent cap, owner isolation, persistent restoration. No Stripe network or real charges.');
}finally{await new Promise(resolve=>server.close(resolve));await db.close();await rm(directory,{recursive:true,force:true});}
