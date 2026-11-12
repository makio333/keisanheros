import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});const out='/private/tmp/gacha-icon-check';await mkdir(out,{recursive:true});
try{
 for(const stale of [false,true]){
 const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.hostname!=='127.0.0.1')return route.fulfill({status:200,body:''});if(stale&&url.pathname.endsWith('/christmas_event_hub.css')){const res=await route.fetch();return route.fulfill({response:res,body:(await res.text()).replace(/\.skin-gacha-theme>\.equipment-card-icon\{[^}]*\}/g,'').replace(/\.skin-gacha-theme>\.equipment-card-icon/g,'.unused-gacha-icon-rule')});}return route.continue();});
 await page.goto('http://127.0.0.1:5195/?v=gacha-frame1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.latestQA&&window.christmasStageLocalPreview?.state().game);
 await page.locator('.christmas-hub').waitFor();await page.evaluate(()=>latestQA.gacha('christmas-items'));
 await page.waitForFunction(()=>[...document.querySelectorAll('#christmas-equip-gacha-section .equipment-card-art img')].every(i=>i.complete&&i.naturalWidth>0));
 const rows=await page.locator('#christmas-equip-gacha-section .equipment-gacha-preview').evaluateAll(nodes=>nodes.map(n=>{const box=n.querySelector('.equipment-card-icon'),img=n.querySelector('.equipment-card-art img'),r=box.getBoundingClientRect(),i=img.getBoundingClientRect();return {name:n.dataset.equipId,w:r.width,h:r.height,iw:i.width,ih:i.height,border:getComputedStyle(box).borderTopWidth,color:getComputedStyle(box).borderTopColor,radius:getComputedStyle(box).borderTopLeftRadius,loaded:img.complete&&img.naturalWidth>0};}));
 console.log(stale?'stale CSS':'fresh CSS',JSON.stringify(rows.slice(0,4)));
 if(process.env.DIAGNOSE_ONLY!=='1')for(const r of rows){assert.equal(r.border,'2px');assert.equal(r.radius,'8px');assert.equal(r.color,'rgb(255, 224, 102)');assert.ok(r.loaded&&r.w>=80&&r.h>=80&&r.iw>=40&&r.ih>=40,JSON.stringify(r));}
 await page.locator('#christmas-equipment-gacha-collection').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/normal-${stale?'stale':'fresh'}.png`});
 await page.locator('#christmas-equipment-gacha-featured').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/pickup-${stale?'stale':'fresh'}.png`});
 await page.locator('#btn-gacha-back').click();await page.locator('#hotspot-item-shop').click();assert.equal(await page.locator('#btn-item-shop-goto-use').count(),0);assert.ok(await page.locator('#item-shop-list img').count()>0);await page.screenshot({path:out+'/item-shop.png'});assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: every Christmas equipment gacha icon visible with fresh and older cached CSS');
}finally{await browser.close();}
