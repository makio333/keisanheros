import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const dir=path.join(tmpdir(),'legend-ancient-awakening');mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR:',e.message);});
 await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'text/javascript',body:''}));
 await context.route('**/local_game_client.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'}));
 await context.route('**/game.js*',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:await res.text()+`\nwindow.awakeningQA={setup(){G=newGameState('覚醒検証','ai_hero_spellblade');currentSlotKey='qa-awakening';G.ownedEquips=['anc_w1','anc_a1','anc_c1'].map((id,i)=>({id,uid:i+1,rarity:6,ability:null}));G.nextUid=4;['weapon','armor','accessory'].forEach((slot,i)=>G.equipment[slot]={uid:i+1});Object.assign(G.player,{lvl:50,hp:999,maxHp:999,mp:999,maxMp:999});SM.playBeep=()=>{};document.getElementById('boot-loader-screen')?.remove();enterAreaStage('area1',0);},state:()=>JSON.parse(JSON.stringify(G)),gain:amount=>grantExp(amount,{fromEnemy:true}),quest:amount=>grantExp(amount),clear(){G.equipment={};updateHud();},restore(data){G=data;updateHud();},master(){masterExistingAncients(G);updateHud();},win(){battle.enemy.exp=30;battle.enemy.hp=0;winBattle();},detail(){showStatus();renderEquipmentSlots();}};`});});
 await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5174/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.awakeningQA,{},{timeout:20000});await page.evaluate(()=>window.awakeningQA.setup());await page.waitForTimeout(800);
 assert.equal(await page.locator('#battle-awakening .awakening-chip').count(),3);
 assert.equal(await page.locator('#battle-awakening .equipment-card-art img').evaluateAll(imgs=>imgs.filter(i=>!i.naturalWidth).length),0);
 await page.evaluate(()=>document.getElementById('battle-floor-title').textContent='算数の魔王城 さんすうの まおう（フェーズ1：総復習）');
 for(const [width,height] of [[1280,900],[1024,768],[940,760],[821,760],[820,900],[600,900],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const result=await page.evaluate(()=>{const rail=document.getElementById('battle-awakening').getBoundingClientRect();return {x:rail.x,right:rail.right,overlaps:['#battle-floor-title','#battle-player-window','#analog-clock-widget'].filter(selector=>{const node=document.querySelector(selector);if(!node)return false;const box=node.getBoundingClientRect();return rail.left<box.right&&rail.right>box.left&&rail.top<box.bottom&&rail.bottom>box.top;})};});
  const status=await page.evaluate(()=>{const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,bottom:r.bottom,right:r.right};};return {name:rect('#battle-player-window > .status-header-row'),exp:rect('.battle-stat-exp'),hp:rect('.battle-stat-hp'),mp:rect('.battle-stat-mp')};});
  assert.ok(status.name.x<status.exp.x&&status.hp.x<status.mp.x,`two columns at ${width}`);
  assert.ok(status.name.bottom<=status.hp.y&&status.exp.bottom<=status.mp.y,`two rows at ${width}`);
  assert.ok(Math.abs(status.hp.y-status.mp.y)<2,`HP/MP row at ${width}`);
  assert.ok(result.x>=0&&result.right<=width+1,JSON.stringify({width,...result}));assert.deepEqual(result.overlaps,[],`overlap at ${width}: ${result.overlaps}`);
  if(width===940||width===390)await page.screenshot({path:path.join(dir,`battle-layout-${width}.png`)});
 }
 await page.setViewportSize({width:1280,height:900});
 await page.screenshot({path:path.join(dir,'battle-desktop.png')});
 await page.evaluate(()=>window.awakeningQA.gain(29));assert.equal((await page.evaluate(()=>window.awakeningQA.state())).ownedEquips[0].awakeningExp,29);
 await page.evaluate(()=>window.awakeningQA.gain(1));let game=await page.evaluate(()=>window.awakeningQA.state());assert.ok(game.ownedEquips.every(e=>e.awakeningLevel===2));assert.ok((await page.locator('#awakening-notice').textContent()).includes('覚醒Lv1 → 2'));
 await page.screenshot({path:path.join(dir,'level-up.png')});
 await page.evaluate(()=>window.awakeningQA.quest(1000));assert.deepEqual((await page.evaluate(()=>window.awakeningQA.state())).ownedEquips,game.ownedEquips);
 await page.evaluate(()=>window.awakeningQA.restore(JSON.parse(JSON.stringify(window.awakeningQA.state()))));assert.ok((await page.locator('#battle-awakening').textContent()).includes('Lv2'));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.screenshot({path:path.join(dir,'battle-mobile.png')});
 const bounds=await page.locator('#battle-awakening').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=391);
 await page.locator('.awakening-chip').first().click();await page.locator('#global-tooltip .awakening-detail').waitFor();assert.ok((await page.locator('#global-tooltip').textContent()).includes('次のLv'));await page.screenshot({path:path.join(dir,'detail-mobile.png')});await page.mouse.move(0,0);
 await page.evaluate(()=>window.awakeningQA.master());assert.ok((await page.locator('#battle-awakening').textContent()).includes('完全覚醒'));await page.evaluate(()=>window.awakeningQA.gain(1e6));assert.ok((await page.evaluate(()=>window.awakeningQA.state())).ownedEquips.every(e=>e.awakeningLevel===50));
 await page.evaluate(()=>{window.awakeningQA.setup();window.awakeningQA.win();});assert.ok((await page.evaluate(()=>window.awakeningQA.state())).ownedEquips.every(e=>e.awakeningLevel===2));
 await page.evaluate(()=>window.awakeningQA.clear());assert.equal(await page.locator('#battle-awakening').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS: actual battle, three icons, shared enemy XP, quest isolation, levels, restore, desktop/mobile, detail, max, unequip; '+dir);
}finally{await browser.close();}
