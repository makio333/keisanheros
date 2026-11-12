import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {OAuth2Client} from 'google-auth-library';
import {createGoogleLogin} from '../server/google-login.mjs';
import {createLocalAuthStore} from './helpers/local-auth-store.mjs';
const store=createLocalAuthStore(),browser='a'.repeat(64),other='b'.repeat(64);
let time=Date.now(),nonce,subject='google-person',patch={},badSignature=false,failToken=false;
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const verifier=new OAuth2Client();
const config={clientId:'fixture.apps.googleusercontent.com',clientSecret:'fixture-secret',redirectUri:'https://game.example/api/auth/google/callback',store,now:()=>time,
 fetchImpl:async(url,options)=>{
  assert.equal(url,'https://oauth2.googleapis.com/token');assert.equal(options.body.get('client_secret'),config.clientSecret);assert.equal(options.redirect,'error');
  const claims={iss:'https://accounts.google.com',aud:config.clientId,sub:subject,nonce,iat:Math.floor(time/1000),exp:Math.floor(time/1000)+300,email:'same@example.com',...patch};
  const header=Buffer.from(JSON.stringify({alg:'RS256',kid:'fixture'})).toString('base64url'),body=Buffer.from(JSON.stringify(claims)).toString('base64url');
  const input=header+'.'+body,signature=sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
  return {ok:!failToken,json:async()=>({id_token:input+'.'+(badSignature?'invalid':signature)})};
 },
 verifyIdToken:async token=>(await verifier.verifySignedJwtWithCertsAsync(token,{fixture:publicKey.export({type:'spki',format:'pem'})},config.clientId,['https://accounts.google.com'])).getPayload(),
};
const login=createGoogleLogin(config);
async function start(intent='login'){
 const url=new URL((await login.begin({browserSessionId:browser,intent})).authorizationUrl);nonce=url.searchParams.get('nonce');
 assert.equal(url.origin,'https://accounts.google.com');assert.equal(url.searchParams.get('scope'),'openid email');
 assert.equal(url.href.includes(config.clientSecret),false);
 const attempt=[...store.attempts.values()].at(-1);
 assert.equal(url.searchParams.get('code_challenge'),createHash('sha256').update(attempt.verifier).digest('base64url'));
 return url.searchParams.get('state');
}
assert.throws(()=>createGoogleLogin({...config,clientSecret:''}),/google_not_configured/);
assert.throws(()=>createGoogleLogin({...config,redirectUri:'http://untrusted.example'}),/unsafe_callback/);
let state=await start();await assert.rejects(login.complete({browserSessionId:other,state,code:'code'}),/invalid_login_state/);
const first=await login.complete({browserSessionId:browser,state,code:'code'});assert.equal(first.created,true);
await assert.rejects(login.complete({browserSessionId:browser,state,code:'code'}),/invalid_login_state/);
state=await start();assert.equal((await login.complete({browserSessionId:browser,state,code:'again'})).accountId,first.accountId);
subject='different-google-person';state=await start();const separate=await login.complete({browserSessionId:browser,state,code:'same-email'});assert.notEqual(separate.accountId,first.accountId,'email never proves shared ownership');
store.accounts.set('line-account',{id:'line-account',entitlements:['paid'],saveKeys:['old-save']});store.sessions.set(browser,'line-account');
subject='new-google';state=await start('link');assert.equal((await login.complete({browserSessionId:browser,state,code:'link'})).accountId,'line-account');
assert.deepEqual(store.accounts.get('line-account').saveKeys,['old-save']);
subject='google-person';state=await start('link');await assert.rejects(login.complete({browserSessionId:browser,state,code:'conflict'}),/identity_already_linked/);
subject='new-google';state=await start('link');store.sessions.set(browser,first.accountId);await assert.rejects(login.complete({browserSessionId:browser,state,code:'changed'}),/link_session_changed/);
for(const changed of [{nonce:'wrong'},{aud:'wrong-client'},{iss:'https://attacker.example'},{exp:Math.floor(time/1000)-1000},{iat:Math.floor(time/1000)+120},{sub:''},{azp:'another-client'}]){
 state=await start();patch=changed;await assert.rejects(login.complete({browserSessionId:browser,state,code:'bad'}),/invalid_google_identity|google_verification_failed/);patch={};
}
state=await start();badSignature=true;await assert.rejects(login.complete({browserSessionId:browser,state,code:'forged'}),/google_verification_failed/);badSignature=false;
state=await start();failToken=true;await assert.rejects(login.complete({browserSessionId:browser,state,code:'fail'}),/google_verification_failed/);failToken=false;
state=await start();time+=300001;await assert.rejects(login.complete({browserSessionId:browser,state,code:'expired'}),/invalid_login_state/);
state=await start();await assert.rejects(login.complete({browserSessionId:browser,state,error:'access_denied'}),/google_login_cancelled/);
console.log('PASS: Google server OAuth, PKCE/browser/nonce binding, official RSA JWT verification, expiry/replay/forgery denial, repeat login, explicit linking and no email auto-merge.');
