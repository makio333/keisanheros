import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createDurableRateLimiter} from '../server/durable-rate-limiter.mjs';
import {createFirebaseAccountLogin,createFirebaseAccountLoginHandler} from '../server/firebase-account-login.mjs';
import {createLineLoginHandler} from '../server/line-login-http.mjs';
import {logSafeApiFailure} from '../server/safe-api-logging.mjs';

const directory=await mkdtemp(path.join(tmpdir(),'legend-auth-limit-'));
const origin='https://auth-fixture.invalid',now=1_800_000_000_000;
const policies={
  'auth.firebase.session':{limit:1,windowMs:60_000},
  'auth.line.start':{limit:2,windowMs:60_000},
  'auth.google.start':{limit:1,windowMs:60_000},
};
let store=await openLocalAccountStore(directory),logLines=[];
const limiter=createDurableRateLimiter({store,now:()=>now,policies});
const safeLog=options=>logSafeApiFailure({...options,logger:{error:line=>logLines.push(line)},requestId:'fixture-request-id'});
const claims=uid=>({uid,aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:now/1000+300,firebase:{sign_in_provider:'google.com'}});
function fakeRequest(url,{method='POST',body='',headers={}}={}){
  const request=Readable.from(body?[Buffer.from(body)]:[]);
  Object.assign(request,{url,method,headers:{origin, ...(method==='POST'?{'content-type':'application/json'}:{}),...headers}});
  return request;
}
async function call(handler,request){
  const response={writeHead(status,headers){this.status=status;this.headers=headers;},end(text){this.text=text;}};
  await handler(request,response);return {...response,body:JSON.parse(response.text||'null')};
}

try{
  const firebaseLoginCore=createFirebaseAccountLogin({store,sessions:store.sessions,rateLimiter:limiter,now:()=>now,
    verifyIdToken:async token=>claims(token),readPrivateSaves:async()=>[],migrationEnabled:true});
  const firebase=createFirebaseAccountLoginHandler({login:firebaseLoginCore,origin,logFailure:safeLog});
  const firebaseReq=token=>fakeRequest('/api/auth/firebase/session',{body:JSON.stringify({idToken:token})});
  const first=await call(firebase,firebaseReq('uid-a'));assert.equal(first.status,200);
  const limited=await call(firebase,firebaseReq('uid-a'));assert.equal(limited.status,429);
  assert.equal(limited.headers['Retry-After'],'60');assert.equal(limited.body.error,'rate_limited');
  assert.equal((await call(firebase,firebaseReq('uid-b'))).status,200,'one user cannot exhaust another UID budget');

  let protocolLogin={async begin(){return {authorizationUrl:'https://line.example/fixture'};},async complete(){return {accountId:'fixture-linked-account'};}};
  const line=createLineLoginHandler({login:protocolLogin,sessions:store.sessions,rateLimiter:limiter,origin,now:()=>now,logFailure:safeLog});
  async function start(handler,route,cookie=''){
    return call(handler,fakeRequest(route,{headers:{...(cookie?{cookie}:{}),origin}}));
  }
  const line1=await start(line,'/api/auth/line/start');assert.equal(line1.status,200);
  const lineCookie=line1.headers['Set-Cookie'].split(';')[0];
  const line2=await start(line,'/api/auth/line/start',lineCookie);assert.equal(line2.status,200);
  const line3=await start(line,'/api/auth/line/start',lineCookie);assert.equal(line3.status,429);

  const google=createLineLoginHandler({login:protocolLogin,sessions:store.sessions,rateLimiter:limiter,origin,now:()=>now,
    startPath:'/api/auth/google/start',callbackPath:'/api/auth/google/callback',sharedRoutes:false,logFailure:safeLog});
  const google1=await start(google,'/api/auth/google/start',lineCookie);assert.equal(google1.status,200,'Google and LINE have independent budgets');
  const googleCookie=google1.headers['Set-Cookie'].split(';')[0];
  assert.equal((await start(google,'/api/auth/google/start',googleCookie)).status,429);

  protocolLogin={async begin(){throw Error('Bearer fixture-token; cookie=fixture-cookie; email=child@example.test');},async complete(){throw Error('code=fixture-code; idToken=fixture-token');}};
  const failing=createLineLoginHandler({login:protocolLogin,sessions:store.sessions,rateLimiter:null,origin,now:()=>now,logFailure:safeLog});
  const failure=await start(failing,'/api/auth/line/start');
  assert.equal(failure.status,503);assert.equal(failure.body.error,'login_unavailable');
  assert.equal(failure.headers['X-Request-Id'],'fixture-request-id');
  const output=logLines.join('\n');
  for(const secret of ['fixture-token','fixture-cookie','child@example.test','fixture-code','idToken'])assert.ok(!output.includes(secret),`logs must omit ${secret}`);
  assert.ok(output.includes('auth.line.start'));assert.ok(output.includes('fixture-request-id'));

  const callbackSession='a'.repeat(64);
  await store.sessions.create(callbackSession,{accountId:null,expiresAt:now+60_000});
  assert.ok(await store.sessions.get(callbackSession,now));
  const callback=await call(failing,fakeRequest('/api/auth/line/callback?state=private-state&code=private-code&error=private-provider-error',{
    method:'GET',headers:{cookie:`__Host-legend-session=${callbackSession}`},
  }));
  assert.equal(callback.status,303,JSON.stringify(callback.body));assert.equal(callback.headers['X-Request-Id'],'fixture-request-id');
  const callbackLogs=logLines.join('\n');
  for(const secret of ['private-state','private-code','private-provider-error'])assert.ok(!callbackLogs.includes(secret),`callback logs must omit ${secret}`);
  assert.ok(callbackLogs.includes('auth.line.callback'));

  const badFirebase=createFirebaseAccountLoginHandler({origin,login:async()=>{throw Error('Bearer fixture-token cookie=fixture-cookie');},logFailure:safeLog});
  const bad=await call(badFirebase,firebaseReq('private-token'));
  assert.equal(bad.status,503);assert.equal(bad.body.error,'login_unavailable');
  assert.ok(!logLines.join('\n').includes('private-token'));

  console.log('PASS: UID-scoped Firebase bridge limit, separate LINE/Google start limits, durable browser/account counters, Retry-After, generic failure responses and redacted structured logs. Firebase provider popup itself remains outside this API. Fixture-only.');
}finally{await store.close();await rm(directory,{recursive:true,force:true});}
