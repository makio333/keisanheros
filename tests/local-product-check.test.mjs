import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const directory=await mkdtemp(path.join(root,'.local-product-fixture-'));
const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));
const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
const publicOrigin='https://fixture-tunnel.example',origin='http://127.0.0.1:'+port;
const env={...process.env,PRODUCT_PUBLIC_ORIGIN:publicOrigin,LINE_CHANNEL_ID:'fixture',LINE_CHANNEL_SECRET:'fixture',LINE_PROVIDER_ID:'fixture',LINE_REDIRECT_URI:publicOrigin+'/api/auth/line/callback',STRIPE_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fixture_only',STRIPE_WEBHOOK_SECRET:'whsec_fixture_only',STRIPE_PERSONAL_PRICE_ID:'price_personal',STRIPE_ORGANIZATION10_PRICE_ID:'price_org10',STRIPE_ORGANIZATION20_PRICE_ID:'price_org20',STRIPE_ORGANIZATION30_PRICE_ID:'price_org30',LOCAL_PRODUCT_PORT:String(port),LOCAL_PRODUCT_DATA_DIR:directory};
let child;
async function start(){
  child=spawn(process.execPath,['server/local-product-check.mjs'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
  child.finished=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
  let output='';
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('local product startup timed out')),15000);
    child.once('error',error=>{clearTimeout(timeout);reject(error);});
    child.once('exit',()=>{clearTimeout(timeout);reject(Error('local product exited: '+output));});
    child.stdout.on('data',chunk=>{output+=chunk;if(output.includes('LINE is real')){clearTimeout(timeout);resolve();}});
    child.stderr.on('data',chunk=>output+=chunk);
  });
}
async function stop(){
  child.kill('SIGTERM');let timeout;
  const result=await Promise.race([child.finished,new Promise((_,reject)=>timeout=setTimeout(()=>reject(Error('shutdown timed out')),10000))]).finally(()=>clearTimeout(timeout));
  assert.deepEqual(result,{code:0,signal:null});child=null;
  await assert.rejects(stat(path.join(directory,'account-store.lock')),{code:'ENOENT'});
}
try{
  await start();
  const session=await fetch(origin+'/api/auth/session');assert.equal(session.status,200);assert.deepEqual(await session.json(),{authenticated:false});
  assert.equal((await fetch(origin+'/api/account')).status,401);
  assert.equal((await fetch(origin+'/api/payments/products')).status,401);
  assert.equal((await fetch(origin+'/api/payments/checkout',{method:'POST',headers:{Origin:publicOrigin}})).status,401);
  assert.equal((await fetch(origin+'/api/payments/stripe/webhook',{method:'POST',body:'{}'})).status,400);
  const login=await fetch(origin+'/api/auth/line/start',{method:'POST',headers:{Origin:publicOrigin}});
  assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/__Host-legend-session=.*Secure/);
  const authUrl=new URL((await login.json()).authorizationUrl);assert.equal(authUrl.origin,'https://access.line.me');
  assert.equal(authUrl.searchParams.get('redirect_uri'),publicOrigin+'/api/auth/line/callback');
  assert.equal((await fetch(origin+'/api/auth/line/start',{method:'POST',headers:{Origin:'https://wrong.example'}})).status,403);
  for(const route of ['/'+path.basename(directory)+'/accounts.json','/@fs'+directory+'/accounts.json','/.env.example']){
    assert.equal((await fetch(origin+route)).status,403,'private files must not be served: '+route);
  }
  // Simulate the public tunnel Host header using a raw HTTP request.
  const {request}=await import('node:http');
  const hostStatus=host=>new Promise((resolve,reject)=>{const req=request(origin+'/',{headers:{Host:host}},res=>{res.resume();res.once('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end();});
  assert.equal(await hostStatus(new URL(publicOrigin).host),200);assert.equal(await hostStatus('unexpected.example'),403);
  await stop();await start();await stop();
  console.log('PASS: real local launcher routes auth/account/payment APIs, validates origins and tunnel Host, blocks private store and env files, and restarts after clean shutdown. No LINE/Stripe network.');
}finally{if(child && child.exitCode===null){child.kill('SIGKILL');await child.finished;}await rm(directory,{recursive:true,force:true});}
