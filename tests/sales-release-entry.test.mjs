import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createSalesReleaseEntry,startSalesReleaseEntry} from '../server/sales-release-entry.mjs';
import vm from 'node:vm';
import {createSalesReleaseBootstrap} from '../scripts/lib/sales-release-artifact.mjs';

const origin='https://legend-heroes2.web.app';
async function dispatch(entry,url,{method='POST',body={},cookie='',headers={}}={}){
  const req=Readable.from([Buffer.from(typeof body==='string'?body:JSON.stringify(body))]);
  Object.assign(req,{url,method,headers:{origin,'content-type':'application/json',cookie,...headers}});
  const res={writeHead(status,h){this.status=status;this.headers=h;this.headersSent=true;},end(text){this.body=JSON.parse(text);}};
  await entry.handler(req,res);return res;
}
async function fixture(run){
  const directory=await mkdtemp(path.join(tmpdir(),'legend-sales-release-entry-')),store=await openLocalAccountStore(directory);
  const now=()=>Date.parse('2026-11-02T00:00:00.000Z');let gameCalls=0,blocked=false,authCalls=0,sessionReads=0;
  const uid='synthetic-buyer',email='synthetic@example.test';
  const cfg={enabled:true,stage:'rehearsal',salesMode:'disabled',projectId:'ailandgames',origin,emailPolicyStartAt:'2026-11-01T00:00:00.000Z',complimentaryAccountCutoff:'2026-10-28T05:37:12.494Z'};
  const deps={profile:'synthetic',store,auth:{verifyIdToken:async(token,revoked)=>{
    authCalls++;assert.equal(revoked,true);if(token!=='synthetic-token')throw Error('revoked');return {uid,aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:now()/1000+600,auth_time:now()/1000,email,email_verified:true,firebase:{sign_in_provider:'google.com'}};
  },getUser:async()=>({uid,email,emailVerified:true,metadata:{creationTime:'2024-01-01T00:00:00.000Z'}})},readPrivateSaves:async()=>[],isUidBlocked:async()=>blocked,isAccountIdBlocked:async()=>blocked,
  gameService:{call:async()=>{gameCalls++;return {result:'synthetic-owner-only',saves:[]};}}};
  const get=store.sessions.get;store.sessions.get=(...args)=>{sessionReads++;return get(...args);};
  try{await run({cfg,deps,store,now,state:()=>({gameCalls,authCalls,sessionReads}),setBlocked:value=>blocked=value});}
  finally{await store.close();await rm(directory,{recursive:true,force:true});}
}

test('default and unapproved production entries fail before provider construction or socket creation',async()=>{
  const defaultEntry=createSalesReleaseEntry();assert.equal(defaultEntry.ready,false);
  assert.equal((await dispatch(defaultEntry,'/api/auth/email-verification-config',{method:'GET'})).status,503);
  let calls=0;assert.deepEqual(startSalesReleaseEntry({createHttpServer:()=>{calls++;}}),{started:false,error:'sales_listener_disabled'});assert.equal(calls,0);
  await fixture(async({cfg,deps,now})=>{
    const entry=createSalesReleaseEntry({configuration:{...cfg,stage:'production'},dependencies:{...deps,createPayments:()=>{calls++;throw Error('must not construct');}},now});
    assert.equal(entry.ready,false);assert.equal(calls,0);assert.ok(entry.blockers.includes('sales_release_pending:costsApproved'));
    for(const requestLimits of [null,[],{monthlyMoneyCap:3000}]){
      const malformed=createSalesReleaseEntry({configuration:{...cfg,requestLimits},dependencies:deps,now});
      assert.equal(malformed.ready,false);assert.ok(malformed.blockers.includes('sales_release_request_limits_invalid'));
    }
  });
});

test('release entry mounts Firebase bridge, registration, saves and logout while refusing payment and all admin-gift methods',()=>fixture(async({cfg,deps,store,now,state,setBlocked})=>{
  const entry=createSalesReleaseEntry({configuration:cfg,dependencies:deps,now});assert.equal(entry.ready,true);
  assert.equal((await dispatch(entry,'/api/auth/email-registration',{body:{idToken:'synthetic-token'}})).body.emailVerified,true);
  assert.deepEqual((await dispatch(entry,'/api/auth/email-verification-config',{method:'GET'})).body,{enabled:false});
  const auth=await dispatch(entry,'/api/auth/firebase/session',{body:{idToken:'synthetic-token'}});assert.equal(auth.status,200);
  const cookie=auth.headers['Set-Cookie'].split(';')[0],id=cookie.split('=')[1],session=await store.sessions.get(id,now());
  const summary=await dispatch(entry,'/api/account',{method:'GET',cookie});assert.equal(summary.body.saveLimit,3);
  assert.equal((await dispatch(entry,'/api/payments/checkout',{cookie})).status,403);
  await store.transaction(async tx=>{const row=await tx.getAccount(session.accountId);tx.putAccount({...row,roles:['admin']});});
  for(const method of ['send','listTargets','listRecent','permissions','fetchPending','claim','claimToSave']){
    const result=await dispatch(entry,'/api/game',{cookie,body:{api:'AdminGiftAPI',method,args:[]}});assert.equal(result.status,400);
  }
  assert.equal(state().gameCalls,0,'even an admin role cannot reach gifts or cross-account listing');
  assert.equal((await dispatch(entry,'/api/game',{cookie,body:{api:'RaidBossAPI',method:'getRankings',args:[]}})).status,200);assert.equal(state().gameCalls,1);
  setBlocked(true);assert.equal((await dispatch(entry,'/api/account',{method:'GET',cookie})).status,403);
  assert.equal((await dispatch(entry,'/api/auth/logout',{cookie})).status,200);
  assert.equal((await dispatch(entry,'/api/account',{method:'GET',cookie})).status,401);
}));

test('the actual locked artifact bootstrap and mounted sales entry jointly resist frontend bypass to administrative methods',()=>fixture(async({cfg,deps,now,state})=>{
  const entry=createSalesReleaseEntry({configuration:cfg,dependencies:deps,now});
  const login=await dispatch(entry,'/api/auth/firebase/session',{body:{idToken:'synthetic-token'}});
  const cookie=login.headers['Set-Cookie'].split(';')[0];let imports=0;
  for(const page of ['email','deletion','cleanup']){
    const status={textContent:''},field={disabled:false},form={inert:false};
    const bootstrap=createSalesReleaseBootstrap({page,modulePath:'/fixture/'+page+'.mjs'});
    await vm.runInNewContext('(async()=>{'+bootstrap+'})()',{
      location:{origin},SALES_RELEASE_RUNTIME:{ready:true},fetch(){throw Error('network forbidden');},
      document:{querySelectorAll:selector=>selector==='form'?[form]:[field],getElementById:()=>status},
    },{importModuleDynamically:()=>{imports++;throw Error('provider import forbidden');}});
    assert.equal(field.disabled,true);assert.equal(form.inert,true);
    const response=await dispatch(entry,'/api/game',{cookie,body:{api:'AdminGiftAPI',method:'listTargets',args:[]}});
    assert.equal(response.status,400);
  }
  assert.equal(imports,0);assert.equal(state().gameCalls,0);assert.equal(entry.productionVerified,false);
}));

test('unknown/admin/legacy paths and foreign origin reject before data reads; oversized and rate-limited requests cannot reach providers',()=>fixture(async({cfg,deps,now,state})=>{
  const entry=createSalesReleaseEntry({configuration:cfg,dependencies:deps,now});
  for(const url of ['/not-a-route','/api/admin/list','/api/legacy/claim','/api/internal/deletion-worker'])assert.equal((await dispatch(entry,url)).status,404);
  assert.equal((await dispatch(entry,'/api/auth/firebase/session',{body:{idToken:'synthetic-token'},headers:{origin:'https://foreign.invalid'}})).status,403);
  assert.equal(state().sessionReads,0);assert.equal(state().authCalls,0);
  assert.equal((await dispatch(entry,'/api/auth/firebase/session',{body:'x'.repeat(16001)})).status,413);assert.equal(state().authCalls,0);
  const bounded=createSalesReleaseEntry({configuration:{...cfg,requestLimits:{maxPerMinute:1,maxInFlight:1}},dependencies:deps,now});
  assert.equal((await dispatch(bounded,'/api/auth/providers',{method:'GET'})).status,200);
  assert.equal((await dispatch(bounded,'/api/auth/providers',{method:'GET'})).status,429);
  assert.equal(bounded.requestLimits.spendingCap,false);
}));
