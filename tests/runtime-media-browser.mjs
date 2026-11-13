import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const base=process.env.RUNTIME_MEDIA_URL || 'http://127.0.0.1:5196';const out=process.env.RUNTIME_MEDIA_OUTPUT || '/private/tmp/runtime-media-check';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const c=await browser.newContext({serviceWorkers:'block',viewport:{width:1366,height:900}});const p=await c.newPage();const errors=[];const held=[];let block=true;
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 await p.route('**/*',r=>{
  const u=new URL(r.request().url());if(u.origin!==new URL(base).origin)return r.fulfill({body:''});
  if(block && /\.(webp|png|jpe?g)$/.test(u.pathname) && !u.pathname.includes('preview-atlas') && u.pathname.startsWith('/assets/')){held.push(r);return;}
  return r.continue();
 });
 const start=Date.now();await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready',null,{timeout:20000});
 assert.equal(await p.evaluate(()=>GameMedia.stats.atlasReady),true);const bootMs=Date.now()-start;
 await p.locator('#btn-boot-start').click();await p.locator('#btn-newgame').click();await p.waitForFunction(()=>document.getElementById('title-white-fade')?.classList.contains('hidden'));
 async function imagesReady(selector){await p.waitForFunction(sel=>[...document.querySelectorAll(sel)].every(i=>i.complete&&i.naturalWidth>0),selector,{timeout:3000});}
 await imagesReady('.hero-thumb-btn img');assert.equal(await p.locator('.hero-thumb-btn').count(),11);
 const registration=await p.locator('.hero-thumb-btn img').evaluateAll(imgs=>imgs.map(i=>({width:i.clientWidth,height:i.clientHeight,quality:i.dataset.mediaQuality,inline:i.src.startsWith('data:')})));
 assert(registration.every(i=>i.width>=26&&i.height>=26&&i.inline),'every thumbnail is readable without a full-size download');
 await p.screenshot({path:out+'/registration-preview.png'});
 const first=await p.locator('#hero-preview-img').getAttribute('src');await p.locator('.hero-thumb-btn').last().click();await p.waitForTimeout(80);assert.notEqual(await p.locator('#hero-preview-img').getAttribute('src'),first);await imagesReady('#hero-preview-img');
 await p.locator('#new-save-name').fill('画像確認');await p.locator('#btn-new-save-start').click();await p.locator('#btn-intro-sword').click();await p.locator('#screen-home').waitFor({state:'visible'});await p.waitForTimeout(2400);
 await imagesReady('#town-map > .town-map-img,#home-player-avatar');assert((await p.locator('#town-map > .town-map-img').getAttribute('src')).startsWith('data:'));
 assert((await p.locator('.town-service-icon').first().evaluate(e=>getComputedStyle(e).backgroundImage)).includes('data:image/'));
 const homeMissing=await p.locator('#screen-home img').evaluateAll(imgs=>imgs.filter(i=>i.getBoundingClientRect().width>0&&i.getAttribute('src')&&(!i.complete||!i.naturalWidth)).map(i=>i.getAttribute('src')));assert.deepEqual(homeMissing,[]);
 await p.screenshot({path:out+'/home-preview.png'});
 const checks=[];
 for(const [button,screen] of [['hotspot-item-shop','screen-item-shop'],['hotspot-status','screen-status'],['hotspot-gacha','screen-gacha']]){
  await p.locator('#'+button).click();await p.locator('#'+screen).waitFor({state:'visible'});await p.waitForTimeout(200);
  const missing=await p.locator('#'+screen+' img').evaluateAll(imgs=>imgs.filter(i=>i.getBoundingClientRect().width>0&&i.getAttribute('src')&&!i.getAttribute('src').startsWith('blob:')&&(!i.complete||!i.naturalWidth)).map(i=>i.getAttribute('src')));
  assert.deepEqual(missing,[],screen+' has no missing visible artwork while full images are stalled');checks.push(screen);await p.screenshot({path:out+'/'+screen+'-preview.png'});
  if(screen==='screen-gacha')break;
  await p.evaluate(()=>document.getElementById('menu-container').querySelector('button').click());
  const home=p.locator('#btn-menu-home');if(await home.count())await home.click();else await p.locator('#'+screen+' .window-back-btn').first().click();
  await p.locator('#screen-home').waitFor({state:'visible'});
 }
 await p.locator('#btn-gacha-back').click();await p.locator('#hotspot-adventure').click();await p.locator('#area-card-tower').click();await p.locator('.stage-select-row').first().click();await p.locator('#screen-battle').waitFor({state:'visible'});await imagesReady('#battle-enemy-emoji img');await p.screenshot({path:out+'/battle-preview.png'});checks.push('screen-battle');
 block=false;await Promise.all(held.map(r=>r.continue().catch(()=>{})));
 await p.waitForFunction(()=>document.querySelector('.screen.active img[data-media-quality="full"]'),null,{timeout:20000});
 const warmStart=Date.now();await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready');const warmMs=Date.now()-warmStart;assert.equal(await p.evaluate(()=>assetBootState.total),0);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,bootMs,warmMs,registration,checks,stats:await p.evaluate(()=>GameMedia.stats),out}));await c.close();
}finally{await browser.close();}
