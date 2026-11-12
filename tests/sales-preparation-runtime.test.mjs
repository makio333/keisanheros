import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createSalesPreparationRuntime} from '../server/sales-preparation-runtime.mjs';

const origin='https://legend-heroes2.web.app';
async function dispatch(runtime,url,{method='POST',body={},requestOrigin=origin}={}){
  const req=Readable.from([Buffer.from(JSON.stringify(body))]);
  Object.assign(req,{url,method,headers:{origin:requestOrigin,'content-type':'application/json'}});
  const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(value){this.body=JSON.parse(value);}};
  const handled=await runtime.handler(req,res);return {handled,status:res.status,body:res.body};
}

test('unconfigured candidate exposes only a disabled mail config and cannot dispatch a worker through HTTP',async()=>{
  const runtime=createSalesPreparationRuntime();
  assert.deepEqual((await dispatch(runtime,'/api/auth/email-verification-config',{method:'GET'})).body,{enabled:false});
  assert.equal((await dispatch(runtime,'/api/auth/email-verification/send')).status,503);
  assert.equal((await dispatch(runtime,'/api/account/deletion/confirm')).handled,false);
  assert.equal((await dispatch(runtime,'/api/internal/deletion-worker')).handled,false);
  assert.deepEqual(await runtime.runDeletionWorker(),{ok:false,error:'deletion_runtime_disabled'});
  assert.equal(runtime.readiness.productionVerified,false);
});

test('configured mail routes derive identity server-side, reject foreign origin and do not accept destination or account overrides',async()=>{
  let sent=0,inspected=0;
  const runtime=createSalesPreparationRuntime({emailCutover:{enabled:true,policyStartAt:'2026-11-01T00:00:00.000Z'},
    emailVerification:{status:async token=>{inspected++;if(token!=='synthetic-token')throw Error('authentication_required');return {claims:{uid:'synthetic-user'},user:{uid:'synthetic-user',email:'synthetic@example.test'},emailVerified:false,state:'pending'};}},
    mail:{enabled:true,generateVerificationLink:async()=> 'https://ailandgames.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=synthetic',
      sendMessage:async()=>{sent++;return {accepted:true};},ledger:{reserve:async()=>({status:'reserved',deliveryId:'synthetic-send'}),complete:async()=>{}}},
  });
  const route='/api/auth/email-verification/send';
  assert.equal((await dispatch(runtime,route,{body:{idToken:'synthetic-token'},requestOrigin:'https://other.invalid'})).status,403);
  assert.equal((await dispatch(runtime,route,{body:{idToken:'synthetic-token',to:'other@example.test'}})).status,400);
  assert.equal((await dispatch(runtime,route,{body:{idToken:'synthetic-token',accountId:'other'}})).status,400);
  assert.equal(inspected,0);assert.equal(sent,0);
  assert.equal((await dispatch(runtime,route,{body:{idToken:'synthetic-token',returnTo:'/?purchase=resume'}})).status,200);
  assert.equal(sent,1);
  const state=await dispatch(runtime,'/api/auth/email-registration',{body:{idToken:'synthetic-token'}});
  assert.equal(state.body.emailVerified,false);
  assert.equal(runtime.readiness.productionVerified,false);
});
