import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {homedir,tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const out=path.join(tmpdir(),'legend-google-login-browser');await mkdir(out,{recursive:true});
const vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),define:{'import.meta.env.VITE_ACCOUNT_BACKEND':'"1"','import.meta.env.VITE_STRIPE_CHECKOUT':'"0"'},server:{host:'127.0.0.1',port:0},plugins:[{name:'google-skill-fixture',configureServer(server){server.middlewares.use((req,res,next)=>{
 if(req.url==='/api/auth/providers'){res.setHeader('Content-Type','application/json');res.end('{"line":true,"google":true}');return;}
 if(req.url==='/api/account'){res.writeHead(401,{'Content-Type':'application/json'});res.end('{"error":"authentication_required"}');return;}
 next();
});}}]});
await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];let enabled=true,signedIn=false,lastIntent;
  await context.route('**/*',route=>{
   const url=new URL(route.request().url()),json=(value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
   if(url.origin==='https://accounts.google.com')return route.fulfill({contentType:'text/html',body:'<h1>Offline Google fixture</h1>'});
   if(url.origin!==origin)return route.fulfill({body:''});
   if(url.pathname==='/api/auth/providers')return json({line:true,google:enabled});
   if(url.pathname==='/api/account')return signedIn?json({accountId:'same-owner',saveLimit:3,used:0}):json({error:'authentication_required'},401);
   if(url.pathname==='/api/saves')return json([]);
   if(url.pathname==='/api/auth/google/start'){assert.equal(route.request().method(),'POST');lastIntent=url.searchParams.get('intent')||'login';return json({authorizationUrl:'https://accounts.google.com/o/oauth2/v2/auth?fixture=1'});}
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.locator('#btn-account-google').waitFor();assert.equal(await page.locator('#btn-account-login').count(),1);
  await page.screenshot({path:path.join(out,'login-'+width+'.png')});
  const rect=await page.locator('.account-login-panel').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width&&rect.y>=0&&rect.y+rect.height<=900);
  await page.locator('#btn-account-google').click();await page.waitForURL('https://accounts.google.com/**');assert.equal(lastIntent,'login');
  signedIn=true;await page.goto(origin);await page.locator('.account-login-gate').waitFor({state:'detached'});
  await page.evaluate(()=>{document.getElementById('boot-loader-screen')?.remove();document.getElementById('title-white-fade')?.remove();document.getElementById('screen-title').classList.add('active');});
  await page.locator('#btn-goto-admin').click();await page.locator('#admin-password-overlay:not(.hidden)').waitFor();
  const passcode=await page.evaluate(()=>{const d=new Date();return String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');});
  await page.locator('#admin-password-input').fill(passcode);await page.locator('#btn-admin-password-submit').click();await page.locator('#admin-tab-btn-account').click();
  await page.locator('#btn-account-google-link').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'link-'+width+'.png')});
  await page.locator('#btn-account-google-link').click();await page.waitForURL('https://accounts.google.com/**');assert.equal(lastIntent,'link');
  enabled=false;signedIn=false;await page.goto(origin);await page.locator('#btn-account-login').waitFor();assert.equal(await page.locator('#btn-account-google').count(),0);
  assert.deepEqual(errors,[]);await context.close();
 }
 await new Promise((resolve,reject)=>{const child=spawn('node',['scripts/run-web-skill-client.mjs','--url',origin,'--actions-json','{"steps":[{"buttons":[],"frames":1}]}','--iterations','1','--pause-ms','100','--screenshot-dir',path.join(out,'skill')],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Skill failed')));});
 console.log('PASS: desktop/mobile Google login, LINE retained, account linking behind parent settings, unavailable provider hidden; offline fixtures only. '+out);
}finally{await browser.close();await vite.close();}
