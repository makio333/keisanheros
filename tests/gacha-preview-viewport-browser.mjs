import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});const out='/private/tmp/gacha-preview-check';await mkdir(out,{recursive:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({status:200,body:''}));
 await page.goto('http://127.0.0.1:5195/?v=gacha-preview2');await page.waitForFunction(()=>window.latestQA&&window.christmasStageLocalPreview?.state().game);await page.locator('.christmas-hub').waitFor();
 for(const size of [{width:720,height:900},{width:390,height:844},{width:1280,height:705}]){
  await page.setViewportSize(size);
  for(const [tab,selector] of [['skins','#skin-gacha-collection .skin-gacha-preview-trigger'],['items','#equipment-gacha-collection .equipment-gacha-preview'],['christmas-items','#christmas-equipment-gacha-collection .equipment-gacha-preview']]){
   await page.evaluate(view=>latestQA.gacha(view),tab);
   await page.locator(selector).last().click();
   const modal=page.locator('#skin-gacha-preview-modal');await modal.waitFor({state:'visible'});
   const r=await page.locator('.skin-gacha-preview-panel').boundingBox(),close=await page.locator('#btn-skin-gacha-preview-close').boundingBox();
   assert.ok(r.y>=11&&r.y+r.height<=size.height-11,JSON.stringify({size,tab,r}));assert.ok(close.y>=0&&close.y+close.height<=size.height);
   assert.equal(await modal.evaluate(n=>n.parentElement===document.body&&getComputedStyle(n).position==='fixed'),true);
   await page.screenshot({path:`${out}/${tab}-${size.width}.png`});
   await page.locator('#btn-skin-gacha-preview-close').click();await modal.waitFor({state:'hidden'});
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS: 9 scrolled skin/equipment previews stay within viewport with visible close button');
}finally{await browser.close();}
