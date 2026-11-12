import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const dir=path.join(tmpdir(),'legend-mobile-home-flow');mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR:',e.message);});
 await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'text/javascript',body:''}));
 await context.route('**/local_game_client.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'}));
 await context.route('**/game.js*',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:await res.text()+`\nwindow.awakeningQA={setup(){G=newGameState('覚醒検証','ai_hero_spellblade');currentSlotKey='qa-awakening';G.ownedEquips=['anc_w1','anc_a1','anc_c1'].map((id,i)=>({id,uid:i+1,rarity:6,ability:null}));G.nextUid=4;['weapon','armor','accessory'].forEach((slot,i)=>G.equipment[slot]={uid:i+1});Object.assign(G.player,{lvl:50,hp:999,maxHp:999,mp:999,maxMp:999});SM.playBeep=()=>{};document.getElementById('boot-loader-screen')?.remove();enterAreaStage('area1',0);},prepareHome(background){destroyChallenge();battle=null;explore=null;G=newGameState('検証勇者','ai_hero_spellblade');currentSlotKey='qa-ui';G.avatarBackground=background;G.unlockedAvatarBackgrounds=['default','forest','ocean'];document.getElementById('boot-loader-screen')?.remove();showHome();},regular(){G=newGameState('反撃検証','ai_hero_spellblade');currentSlotKey='qa-combat';Object.assign(G.player,{hp:100,maxHp:100,def:0,spd:0});G.ownedEquips=[];G.equipment={};SM.playBeep=()=>{};SM.playCorrectAnswer=()=>{};document.getElementById('boot-loader-screen')?.remove();enterAreaStage('area1',0);},answer:()=>String(battle.currentTurnProblem.problem.answer),state:()=>JSON.parse(JSON.stringify(G)),gain:amount=>grantExp(amount,{fromEnemy:true}),quest:amount=>grantExp(amount),clear(){G.equipment={};updateHud();},restore(data){G=data;updateHud();},master(){masterExistingAncients(G);updateHud();},win(){battle.enemy.exp=30;battle.enemy.hp=0;winBattle();},detail(){showStatus();renderEquipmentSlots();}};`});});
 await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5174/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.awakeningQA);
 await page.evaluate(()=>window.awakeningQA.regular());await page.locator('#ch-submit').waitFor();await page.waitForTimeout(1100);const before=await page.evaluate(()=>window.awakeningQA.state().player.hp);assert.equal(before,100,'waiting alone does not trigger enemy attacks');
 await page.locator('#ch-input').fill(await page.evaluate(()=>window.awakeningQA.answer()));await page.locator('#ch-submit').click();await page.waitForTimeout(1100);assert.equal(await page.evaluate(()=>window.awakeningQA.state().player.hp),before,'correct answer keeps player turn');
 await page.locator('#ch-input').fill('-99999');await page.locator('#ch-submit').click();await page.waitForFunction(()=>window.awakeningQA.state().player.hp<100);const after=await page.evaluate(()=>window.awakeningQA.state().player.hp);assert.equal(await page.locator('.floating-damage.player-dmg').last().textContent(),`−${before-after}`);await page.waitForTimeout(150);assert.ok(await page.locator('.floating-damage.player-dmg').last().evaluate(el=>Number(getComputedStyle(el).opacity)>0));await page.screenshot({path:path.join(dir,'wrong-answer-counterattack.png')});
 for(const [width,height]of [[390,844],[430,932],[375,667],[768,1024]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>window.awakeningQA.prepareHome('forest'));await page.waitForTimeout(1100);
  assert.ok((await page.locator('#town-map').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('bg_skin_forest'));
  const issues=await page.locator('#town-map > .town-hotspot').evaluateAll(buttons=>buttons.filter(el=>el.getClientRects().length).flatMap(el=>{const r=el.getBoundingClientRect();return r.x<0||r.y<0||r.right>innerWidth+1||r.bottom>innerHeight+1?[{id:el.id,rect:r.toJSON()}]:[];}));assert.deepEqual(issues,[],`mobile controls fit ${width}x${height}`);
  await page.screenshot({path:path.join(dir,`home-${width}.png`)});
 }
 for(const [id,screen]of [['hotspot-training','screen-skills'],['hotspot-item-shop','screen-item-shop'],['hotspot-weapon-shop','screen-weapon-shop'],['hotspot-status','screen-status'],['hotspot-gacha','screen-gacha'],['hotspot-synthesis','screen-synthesis'],['hotspot-quest-board','screen-quest-board'],['hotspot-raid-boss','screen-raid-boss']]){
  await page.evaluate(()=>window.awakeningQA.prepareHome('ocean'));await page.locator('#'+id).click();await page.locator('#'+screen+(['hotspot-quest-board','hotspot-raid-boss'].includes(id)?'':'.active')).waitFor();if(id==='hotspot-quest-board')await page.locator('#btn-quest-board-back').click();
 }
 await page.evaluate(()=>window.awakeningQA.prepareHome('ocean'));assert.ok((await page.locator('#town-map').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('bg_skin_ocean'));
 await page.setViewportSize({width:1280,height:900});assert.equal(await page.locator('#town-map > .town-map-img').isVisible(),true,'desktop town remains unchanged');
 assert.deepEqual(errors,[]);console.log('PASS: real correct/wrong-answer flow, enemy counterattack, HP and damage label, mobile home four sizes, chosen backgrounds, eight facility actions, desktop preserved; '+dir);
}finally{await browser.close();}
