import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const dir=path.join(tmpdir(),'legend-hit-reactions');mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR:',e.message);});
 await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'text/javascript',body:''}));
 await context.route('**/local_game_client.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'}));
 await context.route('**/game.js*',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:await res.text()+`\nwindow.awakeningQA={setup(){G=newGameState('覚醒検証','ai_hero_spellblade');currentSlotKey='qa-awakening';G.ownedEquips=['anc_w1','anc_a1','anc_c1'].map((id,i)=>({id,uid:i+1,rarity:6,ability:null}));G.nextUid=4;['weapon','armor','accessory'].forEach((slot,i)=>G.equipment[slot]={uid:i+1});Object.assign(G.player,{lvl:50,hp:999,maxHp:999,mp:999,maxMp:999});SM.playBeep=()=>{};document.getElementById('boot-loader-screen')?.remove();enterAreaStage('area1',0);battle.enemy.hp=1000;battle.enemy.maxHp=1000;},noCanvas(){CM.stop();spawnFloatingDamage($('battle-player-hp'),12,'player-dmg');},hp:()=>({player:G.player.hp,enemy:battle.enemy.hp}),receive(){const random=Math.random;Math.random=()=>.99;try{turnBasedEnemyAct(()=>{});}finally{Math.random=random;}},hit(){playEnemyAttackAnim();dealToEnemy(1,'こうげき',false,()=>{});},state:()=>JSON.parse(JSON.stringify(G)),gain:amount=>grantExp(amount,{fromEnemy:true}),quest:amount=>grantExp(amount),clear(){G.equipment={};updateHud();},restore(data){G=data;updateHud();},master(){masterExistingAncients(G);updateHud();},win(){battle.enemy.exp=30;battle.enemy.hp=0;winBattle();},detail(){showStatus();renderEquipmentSlots();}};`});});
 await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5174/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.awakeningQA);await page.evaluate(()=>window.awakeningQA.setup());await page.waitForTimeout(1200);
 for(const [width,height] of [[1280,900],[390,844]]){
  await page.setViewportSize({width,height});
  const before=await page.evaluate(()=>window.awakeningQA.hp());
  await page.evaluate(()=>window.awakeningQA.receive());
  const after=await page.evaluate(()=>window.awakeningQA.hp());assert.ok(after.player<before.player);assert.equal(await page.locator('.floating-damage.player-dmg').last().textContent(),`−${before.player-after.player}`);await page.waitForTimeout(100);
  assert.ok((await page.locator('#battle-player-window').evaluate(el=>getComputedStyle(el).animationName)).includes('player-hit-flash'));
  await page.screenshot({path:path.join(dir,`player-hit-${width}.png`)});
  await page.waitForTimeout(400);assert.equal(await page.locator('#battle-enemy-emoji').evaluate(el=>el.classList.contains('enemy-attack-lean')),false);
  for(let hit=0;hit<2;hit++){
   const hp=await page.evaluate(()=>window.awakeningQA.hp());await page.evaluate(()=>window.awakeningQA.hit());
   await page.waitForFunction(()=>document.getElementById('battle-enemy-emoji').classList.contains('enemy-damage-hit'));
   const animation=await page.locator('#battle-enemy-emoji').evaluate(el=>({name:getComputedStyle(el).animationName,running:el.getAnimations().some(a=>a.playState==='running')}));
   assert.ok(animation.name.includes('enemy-flash'),JSON.stringify(animation));assert.ok(animation.running,'actual hit animation is running');assert.ok((await page.evaluate(()=>window.awakeningQA.hp())).enemy<hp.enemy);
   if(hit===0)await page.screenshot({path:path.join(dir,`enemy-hit-${width}.png`)});
   await page.waitForTimeout(450);
  }
 }
 await page.evaluate(()=>window.awakeningQA.noCanvas());assert.equal(await page.locator('.floating-damage.player-dmg').last().textContent(),'−12');await page.screenshot({path:path.join(dir,'damage-numbers-no-canvas.png')});
 assert.deepEqual(errors,[]);console.log('PASS: real player damage reaction, enemy attack cleanup, hit interrupts attack, repeated enemy hits restart actual animations; desktop/mobile; '+dir);
}finally{await browser.close();}
