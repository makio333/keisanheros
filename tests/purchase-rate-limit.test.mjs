import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createDurableRateLimiter} from '../server/durable-rate-limiter.mjs';
import {createStripePaymentHandler} from '../server/stripe-payments-http.mjs';

const directory=await mkdtemp(path.join(tmpdir(),'legend-purchase-limit-'));
const origin='http://127.0.0.1:49121';
const policy={
  'payment.checkout':{limit:2,windowMs:60_000},
  'payment.cancel':{limit:1,windowMs:60_000},
};
let now=1_000_000,store=await openLocalAccountStore(directory),checkoutCalls=0,cancelCalls=0;
const accountFor=session=>session.startsWith('a-')?'fixture-account-a':session.startsWith('b-')?'fixture-account-b':null;
const payments={
  accounts:{async summary(session){const accountId=accountFor(session);if(!accountId)throw Error('authentication_required');return {accountId,saveLimit:0};}},
  async checkout(_session,productId){checkoutCalls++;return {url:'https://checkout.stripe.com/fixture',productId};},
  async cancelCheckout(){cancelCalls++;return {cancelled:true};},
  async checkoutStatus(){return {state:'none'};},
  async listProducts(){return [];},
  async webhook(){return {received:true};},
  legalReferences(){return {};},
};
const makeHandler=(db=store,limiter=createDurableRateLimiter({store:db,now:()=>now,policies:policy}))=>createStripePaymentHandler({payments,origin,rateLimiter:limiter});
let handler=makeHandler();
async function request(route,{session='a-device-one',body='{"productId":"personal"}',remoteAddress='10.0.0.1',handlerOverride}={}){
  const method=route.endsWith('/products')||route.endsWith('/status')?'GET':'POST';
  const req=Readable.from(method==='GET'?[]:[Buffer.from(route.endsWith('/cancel')?'':body)]);
  Object.assign(req,{url:route,method,headers:{origin,cookie:`legend-local-session=${session}`,'content-type':'application/json'},socket:{remoteAddress}});
  const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(text){this.text=text;}};
  await (handlerOverride||handler)(req,res);return {status:res.status,headers:res.headers,body:JSON.parse(res.text||'null')};
}

try{
  const unauthorized=await request('/api/payments/checkout',{session:'invalid-session'});
  assert.equal(unauthorized.status,401,'unauthenticated calls do not enter an IP/global limiter bucket');assert.equal(checkoutCalls,0);
  const instances=[makeHandler(),makeHandler()];
  const results=await Promise.all(Array.from({length:10},(_,i)=>request('/api/payments/checkout',{session:i%2?'a-device-two':'a-device-one',handlerOverride:instances[i%instances.length]})));
  assert.equal(results.filter(row=>row.status===200).length,2,'concurrent sessions/devices for one owner share the transactional limit');
  assert.equal(results.filter(row=>row.status===429).length,8);
  assert.equal(checkoutCalls,2,'limited requests never reach the Stripe checkout operation');
  const blocked=results.find(row=>row.status===429);
  assert.equal(blocked.headers['Retry-After'],'60');assert.equal(blocked.body.error,'rate_limited');

  const otherAccount=await request('/api/payments/checkout',{session:'b-device-one',remoteAddress:'10.0.0.1'});
  assert.equal(otherAccount.status,200,'a shared IP does not consume another account’s limit');
  assert.equal(checkoutCalls,3);

  const cancel1=await request('/api/payments/checkout/cancel',{session:'a-device-one'});
  const cancel2=await request('/api/payments/checkout/cancel',{session:'a-device-two'});
  assert.equal(cancel1.status,200);assert.equal(cancel2.status,429,'cancel has its own account-wide policy');
  assert.equal(cancelCalls,1);

  const saved=JSON.parse(await readFile(path.join(directory,'accounts.json'),'utf8'));
  assert.ok(saved.attempts.length>=2);
  for(const [key,row] of saved.attempts){
    if(row.kind==='rate-limit'){
      assert.match(key,/^rate-[a-f0-9]{64}$/);
      assert.ok(!key.includes('fixture-account-'));
      assert.ok(row.timestamps.every(Number.isFinite));
    }
  }

  await store.close();store=await openLocalAccountStore(directory);handler=makeHandler(store);
  assert.equal((await request('/api/payments/checkout',{session:'a-device-three'})).status,429,'counter survives process/store restart');
  now+=60_001;
  assert.equal((await request('/api/payments/checkout',{session:'a-device-three'})).status,200,'expired window admits again');

  const unavailable=makeHandler({transaction:async()=>{throw Error('fixture_store_unavailable');}});
  const prior=handler;handler=unavailable;
  const before=checkoutCalls;
  const failed=await request('/api/payments/checkout',{session:'b-device-two'});
  assert.equal(failed.status,503,'rate-store failure fails closed');assert.equal(failed.body.error,'payment_service_unavailable');
  assert.equal(checkoutCalls,before,'Stripe is not called when the shared limiter is unavailable');
  handler=prior;
  console.log('PASS: account-scoped concurrent checkout/cancel limits, cross-device persistence, shared-IP isolation, restart recovery, hashed keys and fail-closed store errors. Fixture-only; no Stripe network or live data.');
}finally{await store.close();await rm(directory,{recursive:true,force:true});}
