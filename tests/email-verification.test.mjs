import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createEmailVerificationService} from '../server/email-verification.mjs';
import {createEmailVerificationHandler} from '../server/email-verification-http.mjs';
import {createFirebaseAccountLogin} from '../server/firebase-account-login.mjs';

const cutoff='2026-10-25T00:00:00.000Z',now=()=>Date.parse('2026-10-26T00:00:00.000Z');
const origin='https://email-fixture.invalid';
async function fixture(run){
  const directory=await mkdtemp(path.join(tmpdir(),'legend-email-verification-')),store=await openLocalAccountStore(directory);
  const users=new Map(),tokens=new Map();
  function issue(uid,{provider='password',email=null,emailVerified=false,exp=now()/1000+300}={}){
    const token='fixture-'+uid+'-'+tokens.size,claims={uid,aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp,email:email||undefined,email_verified:emailVerified,firebase:{sign_in_provider:provider}};
    tokens.set(token,claims);return token;
  }
  const verifyIdToken=async(token,checkRevoked)=>{assert.equal(checkRevoked,true,'Firebase revoked-token check is mandatory');const claims=tokens.get(token);if(!claims)throw Error('revoked_or_invalid');return structuredClone(claims);};
  const getUser=async uid=>{const user=users.get(uid);if(!user){const error=Error('missing');error.code='auth/user-not-found';throw error;}return structuredClone(user);};
  const service=createEmailVerificationService({verifyIdToken,getUser,store,policyStartAt:cutoff,now});
  const makeUser=(uid,{email=null,emailVerified=false,disabled=false,creationTime='2024-01-01T00:00:00.000Z'}={})=>users.set(uid,{uid,email,emailVerified,disabled,metadata:{creationTime}});
  const result=await run({store,users,tokens,issue,service,makeUser,verifyIdToken});
  await store.close();await rm(directory,{recursive:true,force:true});return result;
}
function request(url,body,{requestOrigin=origin}={}){
  const req=Readable.from([Buffer.from(JSON.stringify(body))]);Object.assign(req,{url,method:'POST',headers:{origin:requestOrigin,'content-type':'application/json'}});
  const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(value){this.text=value;}};return {req,res};
}
async function dispatch(handler,req,res){await handler(req,res);return {status:res.status,headers:res.headers,body:JSON.parse(res.text||'null')};}

test('Google, LINE and email entries use Firebase Admin state; pre-cutoff users are grandfathered server-side only',()=>fixture(async({makeUser,issue,service,store})=>{
  makeUser('legacy',{email:'old@example.test',emailVerified:false});
  makeUser('google-new',{email:'google@example.test',emailVerified:true,creationTime:'2026-10-25T00:00:00.001Z'});
  makeUser('email-new',{email:'new@example.test',emailVerified:false,creationTime:'2026-10-25T00:00:00.003Z'});
  const legacy=await service.status(issue('legacy',{email:'attacker@example.test',emailVerified:true}));
  assert.deepEqual({state:legacy.state,verified:legacy.emailVerified,hasEmail:legacy.hasEmail},{state:'legacy',verified:false,hasEmail:true},'client token claims cannot grant the pre-cutoff exception');
  assert.equal((await service.status(issue('google-new',{provider:'google.com',email:'google@example.test',emailVerified:true}))).state,'complete');
  assert.equal((await service.status(issue('line-new',{provider:'oidc.line'})).catch(()=>null)),null,'unknown Firebase UID cannot self-create an account record');
  makeUser('line-new',{creationTime:'2026-10-25T00:00:00.002Z'});
  const line=await service.status(issue('line-new',{provider:'oidc.line'}));assert.equal(line.state,'pending');assert.equal(line.hasEmail,false);
  const email=await service.status(issue('email-new',{email:'new@example.test'}));assert.equal(email.state,'pending');assert.equal(email.emailVerified,false);
  const records=await store.transaction(tx=>tx.listGameDocuments('emailRegistrations'));
  assert.equal(records.length,4);assert.ok(records.every(([,row])=>!JSON.stringify(row).includes('@example.test')),'registration store keeps no email address');
}));

test('status endpoint ignores browser-supplied state and returns generic, safe failures',()=>fixture(async({makeUser,issue,service})=>{
  makeUser('line-user',{creationTime:'2026-10-25T00:00:00.001Z'});
  const token=issue('line-user',{provider:'oidc.line'}),logged=[];
  const handler=createEmailVerificationHandler({service,origin,logFailure:({request})=>{logged.push(request.url);return 'fixture-request';}});
  let pair=request('/api/auth/email-registration',{idToken:token,registrationState:'legacy',emailVerified:true});
  const response=await dispatch(handler,pair.req,pair.res);
  assert.equal(response.status,200);assert.deepEqual(response.body,{registrationState:'pending',emailVerified:false,hasEmail:false});
  pair=request('/api/auth/email-registration',{idToken:token},{requestOrigin:'https://other.invalid'});
  assert.equal((await dispatch(handler,pair.req,pair.res)).status,403);
  const expired=issue('line-user',{provider:'oidc.line',exp:1});pair=request('/api/auth/email-registration',{idToken:expired});
  assert.equal((await dispatch(handler,pair.req,pair.res)).status,401);
  assert.deepEqual(logged,[]);
}));

test('Firebase bridge blocks only new pending registrations and preserves legacy unverified access',()=>fixture(async({makeUser,issue,service,store})=>{
  makeUser('legacy-login',{email:'legacy@example.test',emailVerified:false});
  makeUser('new-login',{email:'new@example.test',emailVerified:false,creationTime:'2026-10-25T00:00:00.001Z'});
  const login=createFirebaseAccountLogin({store,sessions:store.sessions,verifyIdToken:async token=>{
    if(token==='legacy')return {uid:'legacy-login',aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:now()/1000+300,email:'legacy@example.test',email_verified:false,firebase:{sign_in_provider:'password'}};
    if(token==='new')return {uid:'new-login',aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:now()/1000+300,email:'new@example.test',email_verified:false,firebase:{sign_in_provider:'password'}};
    throw Error('invalid');
  },emailVerification:service,now});
  const legacy=await login('legacy');assert.equal(legacy.registrationState,'legacy');assert.ok(await store.sessions.get(legacy.sessionId,now()));
  await assert.rejects(login('new'),/email_verification_required/);
  const newIdentity=await store.transaction(tx=>tx.getIdentity(JSON.stringify(['firebase','ailandgames','new-login'])));assert.equal(newIdentity,undefined,'pending account cannot acquire a game session or server identity');
}));

test('Admin outage falls back only to recorded gameplay state; fresh status and Checkout stay closed',()=>fixture(async({makeUser,issue,service,store,tokens})=>{
  makeUser('known-legacy',{email:'old@example.test',emailVerified:false});
  const token=issue('known-legacy',{email:'old@example.test'});
  assert.equal((await service.status(token)).state,'legacy');
  const unavailable=createEmailVerificationService({verifyIdToken:async id=>tokens.get(id),getUser:async()=>{throw Error('auth/network-request-failed');},store,policyStartAt:cutoff,now});
  const gameplay=await unavailable.statusForGameplay(token);
  assert.equal(gameplay.state,'legacy');assert.equal(gameplay.stale,true);
  await assert.rejects(unavailable.status(token),/email_verification_unavailable/);
  const handler=createEmailVerificationHandler({service:unavailable,origin});
  const pair=request('/api/auth/email-registration',{idToken:token,purpose:'gameplay'});
  assert.deepEqual((await dispatch(handler,pair.req,pair.res)).body,{registrationState:'legacy',emailVerified:false,hasEmail:true});
  const pendingToken=issue('never-recorded',{email:'new@example.test',emailVerified:true});
  await assert.rejects(unavailable.statusForGameplay(pendingToken),/email_verification_unavailable/,'unknown users cannot use outage fallback');
  const identity=await store.transaction(tx=>tx.getIdentity(JSON.stringify(['firebase','ailandgames','known-legacy'])));
  assert.equal(identity,undefined);
}));

test('Checkout rechecks revoked token, exact Firebase UID/account mapping and current verified email',()=>fixture(async({makeUser,issue,service,store,users})=>{
  makeUser('buyer',{email:'buyer@example.test',emailVerified:true,creationTime:'2026-10-25T00:00:00.001Z'});
  makeUser('other',{email:'buyer@example.test',emailVerified:true,creationTime:'2026-10-25T00:00:00.002Z'});
  const buyerToken=issue('buyer',{provider:'google.com',email:'buyer@example.test',emailVerified:true});
  const buyerLogin=createFirebaseAccountLogin({store,sessions:store.sessions,verifyIdToken:async(token,revoked)=>{assert.equal(revoked,true);return structuredClone((await service.status(token)).claims);},emailVerification:service,now});
  const login=await buyerLogin(buyerToken);
  assert.deepEqual(await service.assertCheckoutEligible({accountId:login.accountId,idToken:buyerToken}),{eligible:true});
  const otherToken=issue('other',{provider:'google.com',email:'buyer@example.test',emailVerified:true});
  await assert.rejects(service.assertCheckoutEligible({accountId:login.accountId,idToken:otherToken}),/email_identity_mismatch/,'same email never merges separate UIDs or transfers purchase rights');
  users.set('buyer',{uid:'buyer',email:'new@example.test',emailVerified:true,disabled:false,metadata:{creationTime:'2026-10-25T00:00:00.001Z'}});
  await assert.rejects(service.assertCheckoutEligible({accountId:login.accountId,idToken:buyerToken}),/email_verification_refresh_required/,'old verified-email token cannot authorize a changed email');
  const freshToken=issue('buyer',{provider:'google.com',email:'new@example.test',emailVerified:true});
  assert.deepEqual(await service.assertCheckoutEligible({accountId:login.accountId,idToken:freshToken}),{eligible:true});
  users.set('buyer',{...users.get('buyer'),emailVerified:false});
  await assert.rejects(service.assertCheckoutEligible({accountId:login.accountId,idToken:issue('buyer',{provider:'google.com',email:'new@example.test',emailVerified:true})}),/email_verification_required/,'newest Admin email state wins over stale verified claims');
  users.set('buyer',{...users.get('buyer'),emailVerified:true,disabled:true});
  await assert.rejects(service.assertCheckoutEligible({accountId:login.accountId,idToken:freshToken}),/account_disabled/);
  await assert.rejects(service.assertCheckoutEligible({accountId:login.accountId,idToken:'revoked-token'}),/authentication_required/);
}));
