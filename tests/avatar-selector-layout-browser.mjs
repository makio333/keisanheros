import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import {createMediaTestServer} from './runtime-media-server.mjs';
const server=await createMediaTestServer(),browser=await (process.env.ENGINE==='webkit'?webkit.launch():chromium.launch({channel:'chrome'}));
const out=process.env.LAYOUT_OUTPUT || '/private/tmp/avatar-selector-layout';await mkdir(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:713}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(server.url);await page.waitForFunction(()=>assetBootState?.phase==='ready',null,{timeout:180000});await page.locator('#btn-boot-start').click();await page.locator('#btn-newgame').click();await page.locator('#new-save-name').fill('配置確認');await page.locator('#btn-new-save-start').click();await page.locator('#btn-intro-sword').click();await page.locator('#screen-home').waitFor({state:'visible'});await page.locator('#home-avatar-window').click();
 for(const [width,height] of [[1280,713],[1366,900],[390,844],[844,390]]){
  await page.setViewportSize({width,height});await page.locator('#btn-avatar-tab-frames').click();await page.waitForTimeout(150);
  assert.equal(await page.locator('#avatar-change-modal > .avatar-selector-panel > .window-dismiss-bar').count(),0,'confirmation cancel must not become a separate panel row');
  assert.equal(await page.locator('#avatar-confirm-popover .confirm-actions > #btn-avatar-confirm-cancel').count(),1);
  const geometry=await page.evaluate(()=>{const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};return {panel:rect('.avatar-selector-panel'),header:rect('.avatar-selector-header'),layout:rect('.avatar-selector-layout'),preview:rect('.avatar-selector-preview'),apply:rect('#btn-avatar-preview-apply'),bodyWidth:document.documentElement.scrollWidth};});
  assert(geometry.header.h<100,JSON.stringify(geometry));assert(geometry.panel.y>=0 && geometry.panel.bottom<=height+1,JSON.stringify(geometry));assert(geometry.apply.bottom<=height+1,JSON.stringify(geometry));assert(geometry.preview.w>80 && Math.abs(geometry.preview.w-geometry.preview.h)<2,JSON.stringify(geometry));assert(geometry.bodyWidth<=width+1,JSON.stringify(geometry));
  await page.screenshot({path:`${out}/frames-${width}x${height}.png`});
  await page.locator('#btn-avatar-preview-apply').click();await page.locator('#btn-avatar-confirm-cancel').click();assert(await page.locator('#avatar-confirm-popover').evaluate(el=>el.classList.contains('hidden')));assert(await page.locator('#avatar-change-modal').isVisible());
  for(const id of ['characters','backgrounds'])await page.locator('#btn-avatar-tab-'+id).click();
 }
 await page.locator('#btn-avatar-change-close').click();assert(await page.locator('#avatar-change-modal').evaluate(el=>el.classList.contains('hidden')));assert.deepEqual(errors,[]);console.log('PASS: four viewports; compact header, square preview, visible apply button, three tabs and confirmation cancel/close');
}finally{await browser.close();await server.stop();}
