import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {createGoogleLogin} from '../server/google-login.mjs';
import {createLineLoginHandler} from '../server/line-login-http.mjs';
import {createGoogleLoginIntegration} from '../server/google-login-integration.mjs';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
const directory=await mkdtemp(path.join(tmpdir(),'google-http-')),store=await openLocalAccountStore(directory);
let handler,nonce;const server=createServer((req,res)=>handler(req,res));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
try{
 const login=createGoogleLogin({clientId:'fixture-client',clientSecret:'fixture-secret',redirectUri:origin+'/api/auth/google/callback',store:store.auth,
  fetchImpl:async()=>({ok:true,json:async()=>({id_token:'fixture-signed-token'})}),verifyIdToken:async()=>({iss:'https://accounts.google.com',aud:'fixture-client',sub:'same-person',nonce,exp:Date.now()/1000+60,iat:Date.now()/1000})});
 handler=createLineLoginHandler({login,sessions:store.sessions,origin,startPath:'/api/auth/google/start',callbackPath:'/api/auth/google/callback',sharedRoutes:false});
 const request=(url,options={})=>fetch(origin+url,{redirect:'manual',...options,headers:{Origin:origin,...options.headers}});
 let response=await request('/api/auth/google/start',{method:'POST',headers:{Origin:'https://attacker.example'}});assert.equal(response.status,403);
 response=await request('/api/auth/google/start?intent=link',{method:'POST'});assert.equal(response.status,401);
 response=await request('/api/auth/google/start',{method:'POST'});const before=response.headers.get('set-cookie').split(';')[0];
 const url=new URL((await response.json()).authorizationUrl);nonce=url.searchParams.get('nonce');const state=url.searchParams.get('state');
 response=await request('/api/auth/google/callback?code=fixture&state='+state,{headers:{Cookie:before}});
 assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/?login=success');
 const after=response.headers.get('set-cookie');assert.ok(after.includes('HttpOnly'));assert.ok(after.includes('Max-Age=28800'));assert.notEqual(after.split(';')[0],before);
 const session=await store.sessions.get(after.split(';')[0].split('=')[1],Date.now());assert.ok(session.accountId);assert.equal(await store.sessions.get(before.split('=')[1],Date.now()),null);
 response=await request('/api/auth/google/callback?code=fixture&state='+state,{headers:{Cookie:after.split(';')[0]}});assert.equal(response.headers.get('location'),'/?login=failed');
 const discovery=createGoogleLoginIntegration({store:store.auth,sessions:store.sessions,origin,env:{}});handler=discovery;
 response=await request('/api/auth/providers');assert.deepEqual(await response.json(),{line:true,google:false});
 console.log('PASS: Google HTTP CSRF/origin, explicit linking, cookie/session rotation, 8h expiry, callback replay denial and disabled-provider discovery.');
}finally{await new Promise(resolve=>server.close(resolve));await store.close();await rm(directory,{recursive:true,force:true});}
