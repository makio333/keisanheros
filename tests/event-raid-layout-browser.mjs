import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out=path.join(tmpdir(),'keisanheros-event-raid-layout');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1366,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/firebase_init.js*',route=>route.fulfill({contentType:'text/javascript',body:`window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};window.EventRaidAPI={getRankings:async()=>Array.from({length:12},(_,i)=>({slotKey:'fixture-'+i,playerName:'検証プレイヤー'+(i+1),bestKills:50-i,totalKills:100-i,avatar:'ai_hero_spellblade',level:10}))};`}));
 await context.route('**/game.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:await r.text()+`\nwindow.layoutQA=async()=>{G=newGameState('検証','ai_hero_spellblade');currentSlotKey='qa-layout';const state=eventRaidState('kanji');state.bestKills=8;state.bonusClaims={'breakthrough:5':true};state.rewardClaims={'kills:5':5};showHome();document.getElementById('boot-loader-screen')?.remove();await showEventRaidMenu();};`});});
 await page.goto('http://127.0.0.1:5174/');await page.waitForFunction(()=>!!window.layoutQA);await page.evaluate(()=>window.layoutQA());await page.waitForTimeout(350);
 assert.equal(await page.locator('#screen-event-raid .raid-boss-overview .event-raid-rewards').count(),1);assert.equal(await page.locator('#screen-event-raid .raid-ranking-section .event-raid-rewards').count(),0);assert.equal(await page.locator('.event-raid-reward-row').count(),5);assert.equal(await page.locator('.event-raid-reward-row.is-received').count(),1);assert.equal(await page.locator('.event-raid-reward-row img[src*="cost_seed_pixel"]').count(),3);assert.ok(await page.locator('.event-raid-reward-row img[src*="ticket_icon"]').count()>=3);
 const rank=await page.locator('#event-raid-ranking-list').boundingBox(),rewards=await page.locator('.event-raid-rewards').boundingBox(),overview=await page.locator('#screen-event-raid .raid-boss-overview').boundingBox();assert.ok(rank.height>450);assert.ok(rewards.x<rank.x);await page.screenshot({path:path.join(out,'desktop.png')});console.log({rankHeight:rank.height,rewardsHeight:rewards.height,overviewHeight:overview.height});
 await page.locator('.event-raid-reward-row [data-reward-id="cost_seed"]').first().click();await page.locator('.reward-artwork-preview').waitFor();await page.locator('.reward-artwork-close').click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.locator('.event-raid-rewards').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'mobile.png')});assert.deepEqual(errors,[]);console.log('PASS: left milestone rewards, full-height rankings, real icons, claim/progress states and clickable reward artwork. '+out);
}finally{await browser.close();}
