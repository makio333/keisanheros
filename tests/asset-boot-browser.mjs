import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const out=process.env.BOOT_TEST_OUTPUT || '/private/tmp/asset-boot-check';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const base='http://127.0.0.1:5197';
try {
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1366,height:768}});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 let fail=true,audioFetches=0,mediaFetches=0;
 p.on('request',r=>{if(r.resourceType()==='fetch')mediaFetches++;});
 await p.route('**/assets_audio/*',async r=>{
   audioFetches++;await new Promise(resolve=>setTimeout(resolve,250));
   if(fail && r.request().url().includes('se_decide.')){await r.fulfill({status:503,body:'offline'});return;}
   await r.fulfill({status:200,contentType:'audio/wav',body:Buffer.alloc(128)});
 });
 await p.route('**/adventurer.webp',async r=>{await new Promise(resolve=>setTimeout(resolve,1200));await r.continue();});
 await p.goto(base+'/tests/fixtures/asset-boot.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.assetBootState?.phase==='updating');
 await p.waitForTimeout(450);assert(await p.locator('#boot-character').evaluate(img=>img.naturalWidth>0),'small sprite is visible while HD skin loads');await p.screenshot({path:out+'/update-desktop.png'});
 await p.waitForFunction(()=>window.assetBootState?.phase==='error');
 assert.equal(await p.evaluate(()=>assetBootState.failed),1);
 await p.screenshot({path:out+'/interrupted.png'});
 fail=false;const beforeRetry=mediaFetches;await p.locator('#boot-download-retry').click();
 await p.waitForFunction(()=>document.getElementById('boot-loader-screen')?.dataset.phase==='loading');await p.screenshot({path:out+'/normal-loading.png'});
 await p.waitForFunction(()=>window.assetBootState?.phase==='ready');assert.equal(mediaFetches-beforeRetry,1,'retry only failed data');
 assert.equal(await p.locator('#boot-start-area').isVisible(),true);
 const beforeReload=mediaFetches;await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready');
 assert.equal(mediaFetches-beforeReload,0,'warm start performs no media downloads');
 // A single changed hashed asset downloads alone, using the same real boot controller.
 const beforeChanged=mediaFetches;
 await p.evaluate(async()=>{
  const {startAssetBoot}=await import('/asset_boot.js');
  document.getElementById('boot-start-area').classList.add('hidden');document.getElementById('boot-loading-bar-area').classList.remove('hidden');
  const keys=['assets/boot/forest.webp','assets/boot/adventurer.webp','assets/boot/knight.webp','assets/boot/scout.webp','assets_audio/se_decide.mp3?v=dev'];
  await startAssetBoot({screen:document.getElementById('boot-loader-screen'),resolve:s=>'/'+s,assetMap:Object.fromEntries(keys.map((k,i)=>[k,'/'+k+(i===1?'?revision=2':'')])),onReady(){}});
 });
 assert.equal(mediaFetches-beforeChanged,1,'update downloads only the changed asset');
 // A cached HTML fallback must be rejected and downloaded again as real media.
 await p.evaluate(async()=>{const cache=await caches.open('legend-heroes-media-v1');await cache.put(location.origin+'/assets/boot/knight.webp',new Response('<html>missing</html>',{headers:{'Content-Type':'text/html'}}));});
 const beforeInvalid=mediaFetches;await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready');assert.equal(mediaFetches-beforeInvalid,1);
 await p.locator('#btn-boot-start').click();assert.equal(await p.locator('#boot-loader-screen').count(),0);
 const portrait=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});const phone=await portrait.newPage();
 await phone.route('**/assets_audio/*',async r=>{await new Promise(resolve=>setTimeout(resolve,700));await r.fulfill({contentType:'audio/wav',body:Buffer.alloc(128)});});
 await phone.goto(base+'/tests/fixtures/asset-boot.html',{waitUntil:'domcontentloaded'});await phone.waitForFunction(()=>window.assetBootState?.phase==='updating');await phone.waitForTimeout(400);
 await phone.screenshot({path:out+'/update-portrait.png'});
 const bounds=await phone.locator('#boot-loading-bar-area').boundingBox();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=390&&bounds.y+bounds.height<=844,'portrait panel fits');
 await phone.setViewportSize({width:844,height:390});await phone.screenshot({path:out+'/update-short-landscape.png'});
 const short=await phone.locator('#boot-loading-bar-area').boundingBox();assert(short.y>=0&&short.y+short.height<=390,'short landscape fits');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['initial update','interrupted download','resume only missing','normal loading','warm cache','one changed asset','reject invalid cached media','start button','portrait fit','short landscape fit'],audioFetches,mediaFetches,out}));
 await context.close();await portrait.close();
} finally {await browser.close();}
