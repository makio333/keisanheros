import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import path from 'node:path';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const out=path.join(tmpdir(),'legend-trial-browser');await mkdir(out,{recursive:true});
const vite=await createServer({define:{'import.meta.env.VITE_ACCOUNT_BACKEND':'"1"','import.meta.env.VITE_STRIPE_CHECKOUT':'"1"'},server:{host:'127.0.0.1',port:0}});
await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});let active=false,expired=false;const now=Date.now(),errors=[];
  await context.route('**/*',route=>{
   const url=new URL(route.request().url()),json=value=>route.fulfill({contentType:'application/json',body:JSON.stringify(value)});
   if(url.origin!==origin)return route.fulfill({body:''});
   if(url.pathname==='/api/trial/start'){active=true;return json({});}
   if(url.pathname==='/api/account')return json({accountId:'fixture',saveLimit:active&&!expired?3:0,paidSaveLimit:0,used:expired?3:0,serverNow:now,trial:{available:!active,active:active&&!expired,startedAt:active?now-7*86400000:null,expiresAt:active?(expired?now-1:now+7*86400000):null}});
   if(url.pathname==='/api/payments/products')return json([{id:'personal',kind:'personal',saveLimit:3,amount:4980,credit:0},{id:'organization10',kind:'organization',saveLimit:10,amount:19800,credit:0},{id:'organization20',kind:'organization',saveLimit:20,amount:34800,credit:0},{id:'organization30',kind:'organization',saveLimit:30,amount:49800,credit:0}]);
   if(url.pathname==='/api/saves')return json([]);
   if(url.pathname==='/api/auth/providers')return json({line:true,google:false});
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(origin);
  await page.locator('#btn-account-trial').waitFor();await page.screenshot({path:path.join(out,'start-'+width+'.png')});
  const rect=await page.locator('.account-login-panel').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width);
  await page.locator('#btn-account-trial').click();await page.locator('.account-login-gate').waitFor({state:'detached'});
  assert.match(await page.locator('.account-title-controls').textContent(),/3人分/);
  expired=true;await page.reload();await page.getByText('無料体験は終了しました。セーブは残っています。購入すると続きから遊べます。',{exact:true}).waitFor();
  await page.locator('#btn-account-purchase').waitFor();assert.equal(await page.locator('#btn-account-trial').count(),0);
  await page.screenshot({path:path.join(out,'expired-'+width+'.png')});assert.deepEqual(errors,[]);await context.close();
 }
 await new Promise((resolve,reject)=>{const child=spawn('node',['scripts/run-web-skill-client.mjs','--url',origin,'--actions-json','{"steps":[{"buttons":[],"frames":1}]}','--iterations','1','--pause-ms','100','--screenshot-dir',path.join(out,'skill')],{stdio:'inherit'});child.on('exit',code=>code===0?resolve():reject(Error('skill failed')));});
 console.log('PASS: three-slot trial start and expired purchase screen on mobile/desktop. '+out);
}finally{await browser.close();await vite.close();}
