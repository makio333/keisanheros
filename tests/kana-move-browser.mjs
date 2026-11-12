import assert from 'node:assert/strict';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const board=page.locator('#kanji-challenge'),header=page.locator('.kana-board-header span');
async function move(dx,dy){const r=await header.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+dx,r.y+r.height/2+dy,{steps:10});await page.mouse.up();await page.waitForTimeout(150);}
async function bounds(){const r=await board.boundingBox(),v=page.viewportSize();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1);}
await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.fulfill({status:200,body:''}));
try{
 await page.goto('http://127.0.0.1:5195/?v=fit3');await page.locator('.christmas-hub [data-action=start]').click();await header.waitFor();await page.waitForTimeout(250);
 const before=await board.boundingBox(),question=await page.locator('#kanji-problem-center').boundingBox();await move(-180,60);const after=await board.boundingBox();console.log('move',before,after);assert.ok(Math.abs(after.x-before.x+180)<2&&Math.abs(after.y-before.y-60)<2);
 assert.deepEqual(await page.locator('#kanji-problem-center').boundingBox(),question);
 await page.locator('#challenge-input').fill('ひ');await page.getByRole('button',{name:'あ',exact:true}).click();assert.equal(await page.locator('#challenge-input').inputValue(),'ひあ');
 await page.locator('#btn-toggle-kana-board').click();await page.waitForTimeout(100);await move(-60,-30);await page.locator('#btn-toggle-kana-board').click();await page.waitForTimeout(150);await bounds();
 await move(3000,3000);await bounds();await move(-3000,-3000);await bounds();
 await header.dblclick();await page.waitForTimeout(180);assert.ok((await board.boundingBox()).x>1000);
 await move(-180,0);const moved=await board.boundingBox();await page.locator('#btn-kanji-item').click();await page.locator('[data-item-back]').click();await header.waitFor();await page.waitForTimeout(200);await bounds();assert.ok(Math.abs((await board.boundingBox()).x-moved.x)<2);
 await page.screenshot({path:'/private/tmp/adventure-viewport-check/board-moved.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await bounds();await move(-80,-150);await bounds();await page.screenshot({path:'/private/tmp/adventure-viewport-check/board-moved-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: board drag, edge limits, centered question, input, minimized movement, auto reset and viewport resize');
}finally{await browser.close();}
