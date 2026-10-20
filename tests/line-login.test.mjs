import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createLineLogin} from '../server/line-login.mjs';
import {createLocalAuthStore} from './helpers/local-auth-store.mjs';

const browser='a'.repeat(48),other='b'.repeat(48);
let time=1800000000000,subject='line-subject',nonce='',patch={},tokenFail=false;
const store=createLocalAuthStore(),requests=[];
const config={channelId:'test-channel',channelSecret:'TEST_ONLY_NOT_A_REAL_SECRET',providerId:'test-provider',redirectUri:'https://example.invalid/auth/line/callback',store,now:()=>time,fetchImpl:async(url,options)=>{
  requests.push({url,options});
  if(url.endsWith('/token'))return {ok:!tokenFail,json:async()=>({id_token:'TEST_ID_TOKEN',access_token:'TEST_ACCESS_TOKEN'})};
  assert.equal(options.body.get('nonce'),nonce);
  return {ok:true,json:async()=>({iss:'https://access.line.me',aud:config.channelId,sub:subject,nonce,exp:time/1000+60,iat:time/1000,auth_time:time/1000,...patch})};
}};
const service=createLineLogin(config);
async function start(intent='login',preferQr=false){
  const result=await service.begin({browserSessionId:browser,intent,preferQr});
  const url=new URL(result.authorizationUrl);nonce=url.searchParams.get('nonce');
  assert.equal(url.origin,'https://access.line.me');assert.equal(url.searchParams.get('scope'),'openid');
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert.equal(url.href.includes(config.channelSecret),false);
  const attempt=[...store.attempts.values()].at(-1);
  assert.equal(url.searchParams.get('code_challenge'),createHash('sha256').update(attempt.verifier).digest('base64url'));
  return {url,state:url.searchParams.get('state')};
}
assert.throws(()=>createLineLogin({...config,channelSecret:''}),/line_not_configured/);
assert.throws(()=>createLineLogin({...config,redirectUri:'http://example.invalid/callback'}),/unsafe_callback/);
await assert.rejects(service.begin({browserSessionId:browser,intent:'link'}),/link_requires_authenticated_account/);
let flow=await start('login',true);assert.equal(flow.url.searchParams.get('initial_amr_display'),'lineqr');
assert.equal(flow.url.searchParams.has('prompt'),false,'normal mobile flow does not force silent or password login');
await assert.rejects(service.complete({browserSessionId:other,state:flow.state,code:'code'}),/invalid_login_state/);
const first=await service.complete({browserSessionId:browser,state:flow.state,code:'code'});
assert.equal(first.created,true);assert.deepEqual(Object.keys(first).sort(),['accountId','created']);
assert.equal(requests[0].options.body.get('client_secret'),config.channelSecret);
assert.equal(requests[0].options.redirect,'error');
await assert.rejects(service.complete({browserSessionId:browser,state:flow.state,code:'code'}),/invalid_login_state/);
store.accounts.get(first.accountId).entitlements.push('example-purchase');
flow=await start();assert.equal((await service.complete({browserSessionId:browser,state:flow.state,code:'next'})).accountId,first.accountId);
assert.deepEqual(store.accounts.get(first.accountId).entitlements,['example-purchase'],'repeat login preserves purchase ownership');
store.accounts.set('existing-internal-id',{id:'existing-internal-id',entitlements:['existing-purchase'],saveKeys:['unchanged-slot']});
store.sessions.set(browser,'existing-internal-id');subject='another-line-subject';
flow=await start('link');assert.equal(flow.url.searchParams.get('prompt'),'login');
const linked=await service.complete({browserSessionId:browser,state:flow.state,code:'link'});
assert.equal(linked.accountId,'existing-internal-id');assert.equal(linked.created,false);
assert.deepEqual(store.accounts.get('existing-internal-id'),{id:'existing-internal-id',entitlements:['existing-purchase'],saveKeys:['unchanged-slot']});
subject='line-subject';flow=await start('link');
await assert.rejects(service.complete({browserSessionId:browser,state:flow.state,code:'conflict'}),/identity_already_linked/);
assert.equal(store.accounts.size,2,'conflict never merges or duplicates accounts');
flow=await start('link');store.sessions.set(browser,first.accountId);
await assert.rejects(service.complete({browserSessionId:browser,state:flow.state,code:'changed'}),/link_session_changed/);
for(const claims of [{nonce:'wrong'},{aud:'other-channel'},{iss:'https://attacker.invalid'},{exp:time/1000-1},{iat:time/1000+120},{sub:''}]){
  flow=await start();patch=claims;
  await assert.rejects(service.complete({browserSessionId:browser,state:flow.state,code:'bad'}),/invalid_line_identity/);
  patch={};
}
flow=await start('link');patch={auth_time:time/1000-400};
await assert.rejects(service.complete({browserSessionId:browser,state:flow.state,code:'stale'}),/link_requires_recent_line_login/);patch={};
flow=await start();tokenFail=true;await assert.rejects(service.complete({browserSessionId:browser,state:flow.state,code:'failure'}),/line_verification_failed/);tokenFail=false;
flow=await start();time+=300001;await assert.rejects(service.complete({browserSessionId:browser,state:flow.state,code:'expired'}),/invalid_login_state/);
flow=await start();await assert.rejects(service.complete({browserSessionId:browser,state:flow.state,error:'access_denied'}),/line_login_cancelled/);
assert.equal(store.accounts.size,2);
console.log('PASS: LINE PKCE, QR preference, browser-bound one-use state, verified claims, cancellation/expiry, existing-ID linkage and purchase/save retention. Mock provider only; no live login.');
