import assert from 'node:assert/strict';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const b=await chromium.launch({channel:'chrome',headless:true});try {
const c=await b.newContext({serviceWorkers:'block',viewport:{width:1366,height:768}});const p=await c.newPage();let downloads=0;const errors=[];p.on('pageerror',e=>errors.push(e.message));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNwsAAAAASUVORK5CYII=','base64');
await p.route('**/*',r=>{
const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.fulfill({status:200,body:''});
if(r.request().resourceType()==='fetch'&& /\.(png|jpg|jpeg|webp|svg|mp3|m4a)(\?|$)/.test(u.pathname+u.search)){downloads++;return r.fulfill({contentType:u.pathname.includes('assets_audio/')?'audio/mp4':'image/png',body:png});}
return r.continue();});
await p.goto('http://127.0.0.1:5196/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready',{timeout:30000});
assert.equal(await p.evaluate(()=>!!window.latestQA),false);await p.screenshot({path:'/private/tmp/asset-boot-check/game-ready.png'});
const first=downloads;assert.equal(first,1,'only the small initial sprite blocks startup');
assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('main')).display),'none','game screens stay inactive during boot');
await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready');assert.equal(downloads,first);
await p.locator('#btn-boot-start').click();await p.waitForFunction(()=>!document.getElementById('boot-loader-screen'));assert.equal(await p.locator('#screen-title').isVisible(),true);assert.deepEqual(errors,[]);
p.on('dialog',d=>d.accept());await p.locator('#btn-newgame').click();await p.locator('#new-save-name').fill('起動確認');await p.locator('#btn-new-save-start').click();await p.locator('#btn-intro-sword').click();await p.locator('#screen-home').waitFor({state:'visible'});await p.waitForFunction(()=>{const img=document.querySelector('#town-map > .town-map-img');return img?.complete&&img.naturalWidth>0;});assert.equal(await p.locator('#town-map > .town-map-img').getAttribute('loading'),'eager');
console.log(JSON.stringify({passed:true,initialDownloads:first,warmDownloads:downloads-first,titleVisible:true,errors}));
await c.close();
// Even permanently stalled decorative images must not prevent starting the game.
const slow=await b.newContext({serviceWorkers:'block'});const q=await slow.newPage();const held=[];
await q.route('**/*',r=>{
 const url=new URL(r.request().url());
 if(url.hostname!=='127.0.0.1')return r.fulfill({body:''});
 if(/\.(webp|jpe?g)(?:\?|$)/.test(url.pathname+url.search) || (r.request().resourceType()==='image'&&!url.pathname.includes('hero_female_1-'))){held.push(r);return;}
 return r.continue();
});
const started=Date.now();await q.goto('http://127.0.0.1:5196/',{waitUntil:'domcontentloaded'});await q.waitForFunction(()=>window.assetBootState?.phase==='ready',null,{timeout:3000});
assert(Date.now()-started<3000,'decoration does not gate readiness');
await q.locator('#btn-boot-start').click();await q.locator('#btn-newgame').waitFor({state:'visible'});
for(const route of held)await route.abort().catch(()=>{});
console.log(JSON.stringify({passed:true,stalledDecorationDoesNotBlock:true,readyMs:Date.now()-started}));
await slow.close();}finally{await b.close();}
