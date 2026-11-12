import test from 'node:test';
import assert from 'node:assert/strict';
import {createSalesEmailFlow,salesEmailReturnPath} from '../sales-pages/sales-email-flow.mjs';
import {validateSalesEmailCutover} from '../server/sales-email-cutover.mjs';
import {createSalesEmailDelivery} from '../server/sales-email-delivery.mjs';
import {createSalesEmailHandler} from '../server/sales-email-http.mjs';
import {createSalesEmailLedger} from '../server/sales-email-ledger.mjs';
import {Readable} from 'node:stream';

const origin='https://legend-heroes2.web.app',start='2026-11-20T00:00:00.000Z';
function fixture(provider='google.com',options={}){
  const calls=[],user={uid:'synthetic-owner',email:'owner@example.test',emailVerified:false,providerData:[{providerId:provider}],getIdToken:async force=>{assert.equal(force,true);calls.push('token');return 'synthetic-token';}};
  const auth={currentUser:user},sdk={reload:async()=>calls.push('reload'),emailCredential:(email,password)=>({email,password}),linkWithCredential:async(current,credential)=>{calls.push('link');assert.equal(current,user);user.email=credential.email;return {user};},verifyBeforeUpdateEmail:async(current,email,settings)=>{assert.equal(current,user);calls.push(['verify-change',email,settings]);}};
  const flow=createSalesEmailFlow({auth,sdk,inspect:async token=>{assert.equal(token,'synthetic-token');calls.push('inspect');return {emailVerified:user.emailVerified,registrationState:user.emailVerified?'complete':'pending'};},deliver:async body=>{calls.push(['send',body]);return {sent:true};},enabled:true,origin,returnTo:'/?purchase=resume',...options});
  return {auth,user,sdk,calls,flow};
}
for(const provider of ['google.com','oidc.line','password'])test(provider+': current UID, refreshed token, explicit return and no Checkout',async()=>{
  const {user,calls,flow}=fixture(provider);
  assert.equal((await flow.refresh()).complete,false);assert.throws(()=>flow.continue(),/email_verification_required/);
  await flow.send();user.emailVerified=true;assert.equal((await flow.refresh()).complete,true);
  assert.equal(flow.continue(),'/?purchase=resume');assert.equal(calls.filter(x=>x==='inspect').length,2);assert.ok(calls.indexOf('reload')<calls.indexOf('token'));
  assert.equal(calls.some(x=>String(x).includes('checkout')),false);
});
test('LINE without email links a credential to the current UID and remains pending until confirmed',async()=>{
  const f=fixture('oidc.line');f.user.email=null;
  await assert.rejects(f.flow.send(),/email_link_required/);
  assert.deepEqual(await f.flow.addEmail({email:'linked@example.test',password:'synthetic-password'}),{sent:true});
  assert.equal(f.auth.currentUser.uid,'synthetic-owner');assert.equal(f.calls.filter(x=>x==='link').length,1);assert.equal(f.user.email,'linked@example.test');
  assert.equal((await f.flow.refresh()).complete,false);
});
test('address change verifies before updating and never marks the new address complete',async()=>{
  const {flow,user,calls}=fixture('password');
  await flow.changeEmail('new@example.test');assert.equal(user.email,'owner@example.test');
  const request=calls.find(x=>Array.isArray(x)&&x[0]==='verify-change');assert.equal(request[2].handleCodeInApp,false);assert.ok(request[2].url.startsWith(origin+'/purchase-email-verification.html?returnTo='));
  assert.throws(()=>flow.continue(),/email_verification_required/);
});
test('a switched UID during async reload cannot inspect or send under the previous identity',async()=>{
  const f=fixture();f.sdk.reload=async()=>{f.auth.currentUser={...f.user,uid:'another-synthetic-owner'};};
  await assert.rejects(f.flow.refresh(),/email_identity_changed/);assert.equal(f.calls.includes('inspect'),false);
});
test('link collision does not sign in as a replacement UID or send mail',async()=>{
  const f=fixture('oidc.line');f.user.email=null;f.sdk.linkWithCredential=async()=>{throw Object.assign(Error('collision'),{code:'auth/credential-already-in-use'});};
  await assert.rejects(f.flow.addEmail({email:'taken@example.test',password:'synthetic-password'}),{code:'auth/credential-already-in-use'});
  assert.equal(f.auth.currentUser.uid,'synthetic-owner');assert.equal(f.calls.some(x=>Array.isArray(x)&&x[0]==='send'),false);
});
test('return allowlist and disabled configuration fail before mutations',async()=>{
  for(const value of ['https://other.invalid','//other.invalid','/api/payments/checkout','/?purchase=processing','/?purchase=resume&next=evil','/%2fother'])assert.throws(()=>salesEmailReturnPath(value),/unsafe_email_return/);
  const f=fixture('google.com',{enabled:false});await assert.rejects(f.flow.send(),/sales_email_disabled/);assert.deepEqual(f.calls,[]);
});
test('cutover is explicit, target fixed, canonical and immutable',()=>{
  assert.equal(validateSalesEmailCutover().enabled,false);
  for(const policyStartAt of [undefined,'2026-02-30T00:00:00.000Z','2026-11-20T00:00:00Z'])assert.throws(()=>validateSalesEmailCutover({enabled:true,policyStartAt}),/sales_email_cutover_required/);
  assert.throws(()=>validateSalesEmailCutover({enabled:true,policyStartAt:start,previousPolicyStartAt:'2026-11-19T00:00:00.000Z'}),/sales_email_cutover_changed/);
  assert.throws(()=>validateSalesEmailCutover({enabled:true,policyStartAt:start,projectId:'other'}),/target_mismatch/);
  assert.equal(validateSalesEmailCutover({enabled:true,policyStartAt:start}).ready,true);
});
function transactionStore(){
  const rows=new Map();let chain=Promise.resolve();
  return {rows,transaction(fn){const work=chain.then(async()=>{const pending=new Map(rows);const result=await fn({getGameDocument:async key=>structuredClone(pending.get(key)),putGameDocument:(key,row)=>pending.set(key,structuredClone(row))});rows.clear();for(const row of pending)rows.set(...row);return result;});chain=work.catch(()=>{});return work;}};
}
function deliveryFixture({sendResult={accepted:true},failSend=false,host='ailandgames.firebaseapp.com'}={}){
  const calls=[],store=transactionStore();let current=100000;
  const config=validateSalesEmailCutover({enabled:true,policyStartAt:start});
  const state={claims:{uid:'synthetic-uid'},user:{uid:'synthetic-uid',email:'owner@example.test',disabled:false},emailVerified:false};
  const options={enabled:true,config,now:()=>current,emailVerification:{status:async token=>{if(token!=='synthetic-token')throw Error('authentication_required');return structuredClone(state);}},generateVerificationLink:async(email,settings)=>{calls.push(['generate',email,settings]);return 'https://'+host+'/__/auth/action?oobCode=synthetic-only';},sendMessage:async message=>{calls.push(['deliver',message]);if(failSend)throw Error('provider-timeout');return sendResult;},ledger:createSalesEmailLedger({store})};
  return {delivery:createSalesEmailDelivery(options),calls,state,options,store,advance:()=>{current+=61000;}};
}
test('delivery gets email only from authenticated state; a durable cooldown survives a new adapter',async()=>{
  const f=deliveryFixture();assert.deepEqual(await f.delivery.send({idToken:'synthetic-token',returnTo:'/?purchase=resume'}),{sent:true});
  const sent=f.calls.find(x=>x[0]==='deliver')[1];assert.equal(sent.to,'owner@example.test');assert.ok(sent.deliveryId);assert.match(sent.text,/確認だけで購入・決済は行われません/);
  await assert.rejects(createSalesEmailDelivery({...f.options,ledger:createSalesEmailLedger({store:f.store})}).send({idToken:'synthetic-token'}),/rate_limited/);assert.equal(f.calls.filter(x=>x[0]==='deliver').length,1);
  f.advance();await f.delivery.send({idToken:'synthetic-token'});assert.equal(f.calls.filter(x=>x[0]==='deliver').length,2);
});
test('uncertain delivery stays held after cooldown and adapter restart; no address/link in error',async()=>{
  const f=deliveryFixture({failSend:true});await assert.rejects(f.delivery.send({idToken:'synthetic-token'}),/^Error: email_delivery_uncertain$/);
  f.advance();await assert.rejects(createSalesEmailDelivery({...f.options,ledger:createSalesEmailLedger({store:f.store})}).send({idToken:'synthetic-token'}),/email_delivery_uncertain/);assert.equal(f.calls.filter(x=>x[0]==='deliver').length,1);
});
test('missing provider, untrusted action link, and verified account avoid sending',async()=>{
  assert.equal(createSalesEmailDelivery().ready,false);await assert.rejects(createSalesEmailDelivery().send({}),/unavailable/);
  const f=deliveryFixture({host:'other.invalid'});await assert.rejects(f.delivery.send({idToken:'synthetic-token'}),/uncertain/);assert.equal(f.calls.some(x=>x[0]==='deliver'),false);
  const verified=deliveryFixture();verified.state.emailVerified=true;assert.deepEqual(await verified.delivery.send({idToken:'synthetic-token'}),{sent:false,alreadyVerified:true});assert.deepEqual(verified.calls,[]);
});
test('parallel delivery reserves once and never unlocks a pending send',async()=>{
  const f=deliveryFixture();const results=await Promise.allSettled([f.delivery.send({idToken:'synthetic-token'}),f.delivery.send({idToken:'synthetic-token'})]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(f.calls.filter(x=>x[0]==='deliver').length,1);
});
async function dispatch(handler,{url='/api/auth/email-verification/send',method='POST',body={},requestOrigin=origin}={}){
  const req=Readable.from([Buffer.from(JSON.stringify(body))]);Object.assign(req,{url,method,headers:{origin:requestOrigin,'content-type':'application/json'}});
  const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(body){this.body=JSON.parse(body);}};
  assert.equal(await handler(req,res),true);return res;
}
test('HTTP protects origin/body scope and default-disabled config reveals no rollout values',async()=>{
  assert.throws(()=>createSalesEmailHandler({origin:'https://other.invalid'}),/target_mismatch/);
  const disabled=createSalesEmailHandler();assert.deepEqual((await dispatch(disabled,{url:'/api/auth/email-verification-config',method:'GET'})).body,{enabled:false});
  const f=deliveryFixture(),handler=createSalesEmailHandler({delivery:f.delivery,config:f.options.config,origin});
  assert.equal((await dispatch(handler,{requestOrigin:'https://other.invalid'})).status,403);
  assert.equal((await dispatch(handler,{body:{idToken:'synthetic-token',email:'victim@example.test'}})).status,400);
  assert.deepEqual(f.calls,[]);assert.equal((await dispatch(handler,{body:{idToken:'synthetic-token',returnTo:'/?purchase=resume'}})).status,200);
});
