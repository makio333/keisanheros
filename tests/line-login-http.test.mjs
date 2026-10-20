import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createLineLogin} from '../server/line-login.mjs';
import {createLineLoginHandler} from '../server/line-login-http.mjs';
import {createLocalAuthStore} from './helpers/local-auth-store.mjs';

const time=1800000000000,store=createLocalAuthStore(),data=new Map();
const sessions={
  async get(id,now){const entry=data.get(id);return entry?.expiresAt>now?entry:null;},
  async create(id,value){assert.ok(!data.has(id));data.set(id,value);},
  async rotate(old,id,value){assert.ok(data.has(old));data.delete(old);store.sessions.delete(old);data.set(id,value);store.sessions.set(id,value.accountId);},
  async remove(id){data.delete(id);store.sessions.delete(id);},
};
let handler,nonce,subject='mock-line-user';
const server=createServer((req,res)=>handler(req,res).then(handled=>{if(!handled){res.writeHead(404);res.end();}}));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  const origin=`http://127.0.0.1:${server.address().port}`;
  const login=createLineLogin({channelId:'test',channelSecret:'NOT_A_REAL_SECRET',providerId:'test-provider',redirectUri:origin+'/api/auth/line/callback',store,now:()=>time,fetchImpl:async url=>({ok:true,json:async()=>url.endsWith('/token')?{id_token:'mock'}:{iss:'https://access.line.me',aud:'test',sub:subject,nonce,exp:time/1000+60,iat:time/1000,auth_time:time/1000}})});
  handler=createLineLoginHandler({login,sessions,origin,now:()=>time});
  async function call(path,{method='GET',cookie='',requestOrigin=origin}={}){
    return fetch(origin+path,{method,redirect:'manual',headers:{Origin:requestOrigin,...(cookie?{Cookie:cookie}:{})}});
  }
  const cookieOf=res=>res.headers.get('set-cookie')?.split(';')[0];
  let response=await call('/api/auth/session');assert.deepEqual(await response.json(),{authenticated:false});
  response=await call('/api/auth/line/start');assert.equal(response.status,405);
  response=await call('/api/auth/line/start',{method:'POST',requestOrigin:'https://attacker.invalid'});assert.equal(response.status,403);assert.equal(data.size,0);
  response=await call('/api/auth/line/start?intent=link',{method:'POST'});assert.equal(response.status,401);
  async function begin(cookie=''){
    const response=await call('/api/auth/line/start?qr=1',{method:'POST',cookie});assert.equal(response.status,200);
    const url=new URL((await response.json()).authorizationUrl);nonce=url.searchParams.get('nonce');
    assert.equal(url.searchParams.get('initial_amr_display'),'lineqr');assert.equal(response.headers.get('cache-control'),'no-store');
    assert.ok(response.headers.get('set-cookie').includes('HttpOnly'));assert.ok(response.headers.get('set-cookie').includes('SameSite=Lax'));
    return {cookie:cookieOf(response),state:url.searchParams.get('state')};
  }
  let flow=await begin();
  response=await call(`/api/auth/line/callback?state=${flow.state}&code=test`);assert.equal(response.status,400,'missing browser binding rejected');
  response=await call(`/api/auth/line/callback?state=${flow.state}&code=test`,{cookie:flow.cookie});
  assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/?login=success');
  const authenticatedCookie=cookieOf(response);assert.notEqual(authenticatedCookie,flow.cookie,'session fixation prevented');
  const accountId=[...store.accounts.keys()][0];store.accounts.get(accountId).entitlements.push('test-purchase');
  assert.equal(data.has(flow.cookie.split('=')[1]),false);
  response=await call('/api/auth/session',{cookie:authenticatedCookie});assert.deepEqual(await response.json(),{authenticated:true});
  response=await call('/api/auth/session',{cookie:flow.cookie});assert.deepEqual(await response.json(),{authenticated:false});
  response=await call('/api/auth/line/start',{method:'POST',cookie:authenticatedCookie});assert.equal(response.status,409,'cannot silently change signed-in account');
  response=await call('/api/auth/logout',{method:'POST',cookie:authenticatedCookie,requestOrigin:'https://attacker.invalid'});assert.equal(response.status,403);
  response=await call('/api/auth/logout',{method:'POST',cookie:authenticatedCookie});assert.equal(response.status,200);assert.ok(response.headers.get('set-cookie').includes('Max-Age=0'));
  flow=await begin();response=await call(`/api/auth/line/callback?state=${flow.state}&code=other-device`,{cookie:flow.cookie});assert.equal(response.status,303);
  assert.equal(store.accounts.size,1,'same LINE restores internal account on another browser');assert.deepEqual(store.accounts.get(accountId).entitlements,['test-purchase']);
  flow=await begin();response=await call(`/api/auth/line/callback?state=${flow.state}&error=access_denied`,{cookie:flow.cookie});assert.equal(response.headers.get('location'),'/?login=cancelled');
  response=await call(`/api/auth/line/callback?state=${flow.state}&code=replay`,{cookie:flow.cookie});assert.equal(response.headers.get('location'),'/?login=failed');
  response=await call('/api/auth/line/callback?state=a&state=b',{cookie:flow.cookie});assert.equal(response.status,400);
  assert.throws(()=>createLineLoginHandler({login,sessions,origin:'http://public.example'}),/unsafe_auth_origin/);
  console.log('PASS: local HTTP login/callback, origin checks, HttpOnly cookie, session rotation/logout, denial/replay and cross-browser account retention. Provider mocked; no cloud writes.');
}finally{await new Promise(resolve=>server.close(resolve));}
