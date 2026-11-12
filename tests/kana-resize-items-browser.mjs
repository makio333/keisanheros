import assert from 'node:assert/strict';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.fulfill({status:200,body:''}));
try{
 await page.goto('http://127.0.0.1:5195/?v=fit2');await page.locator('.christmas-hub [data-action=start]').click();await page.locator('#btn-toggle-kana-board').waitFor();
 for(const size of [{width:1440,height:900},{width:665,height:706},{width:320,height:568}]){
  await page.setViewportSize(size);await page.waitForTimeout(250);
  const board=page.locator('#kanji-challenge'),handle=page.locator('.kana-resize-handle[data-corner=se]');
  const before=await board.boundingBox(),grip=await handle.boundingBox();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();await page.mouse.move(grip.x+grip.width/2-40,grip.y+grip.height/2-65,{steps:8});await page.mouse.up();await page.waitForTimeout(180);
  const smaller=await board.boundingBox();assert.ok(smaller.width<before.width-5);
  const grip2=await handle.boundingBox();await page.mouse.move(grip2.x+grip2.width/2,grip2.y+grip2.height/2);await page.mouse.down();await page.mouse.move(grip2.x+grip2.width/2+60,grip2.y+grip2.height/2+90,{steps:8});await page.mouse.up();await page.waitForTimeout(180);
  const bigger=await board.boundingBox();assert.ok(bigger.width>smaller.width+5);assert.ok(bigger.x>=0&&bigger.y>=0&&bigger.x+bigger.width<=size.width+1&&bigger.y+bigger.height<=size.height+1);
  const key=await page.getByRole('button',{name:'あ',exact:true}).boundingBox();assert.ok(Math.abs(key.width-key.height)<.1);
  await page.screenshot({path:`/private/tmp/adventure-viewport-check/resized-${size.width}.png`});
  await handle.dblclick();await page.waitForTimeout(150);
  await page.locator('#btn-kanji-item').click();await page.waitForTimeout(200);
  const icons=page.locator('.battle-item-icon');assert.ok(await icons.count()>0);assert.ok((await icons.allTextContents()).every(t=>/^\d+$/.test(t.trim())));
  assert.equal(await page.locator('[data-item-use]').isDisabled(),true);await icons.first().click();assert.equal(await page.locator('[data-item-use]').isEnabled(),true);assert.ok(await page.locator('#global-tooltip .equip-unified-card').count());
  await page.waitForTimeout(180);const menu=await page.locator('#battle-sub-menu').boundingBox();await page.screenshot({path:`/private/tmp/adventure-viewport-check/item-icons-${size.width}.png`});assert.ok(menu.x>=0&&menu.y>=0&&menu.x+menu.width<=size.width+1&&menu.y+menu.height<=size.height+1);
  await page.screenshot({path:`/private/tmp/adventure-viewport-check/item-icons-${size.width}.png`});
  await page.locator('[data-item-back]').click();await page.waitForTimeout(200);assert.equal(await page.locator('#challenge-input').getAttribute('readonly'),null);
 }
 await page.evaluate(()=>{window.christmasStageLocalPreview.state().game.player.hp=800;});await page.locator('#btn-kanji-item').click();await page.locator('.battle-item-icon').first().click();await page.locator('[data-item-use]').click();await page.locator('#challenge-input').waitFor({state:'visible'});
 assert.deepEqual(errors,[]);console.log('PASS: corner resize, square keys, viewport bounds, icon items selection/back/use');
}finally{await browser.close();}
