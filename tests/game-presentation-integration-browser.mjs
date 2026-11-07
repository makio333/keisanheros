import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {awakeningState} from '../ancient_awakening.js';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[],remoteRequests=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{const url=new URL(request.url());if(!['127.0.0.1','localhost'].includes(url.hostname)&&!['data:','blob:'].includes(url.protocol))remoteRequests.push(url.origin);});
 await context.route('https://**',route=>route.fulfill({status:204,body:''}));
 await context.route('**/firebase_init.js*',route=>route.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'}));
 await context.route('**/game.js*',async route=>{
  const response=await route.fetch();
  const bridge=`
const qaOriginalGrantExp=grantExp;window.__qaEnemyExpCalls=[];grantExp=(amount,options={})=>{window.__qaEnemyExpCalls.push({amount,fromEnemy:options.fromEnemy===true});return qaOriginalGrantExp(amount,options);};
window.presentationIntegrationQA={
 setup(){
  G=newGameState('表示接続のローカル検証','ai_hero_spellblade');currentSlotKey='qa-presentation-integration';
  G.ownedEquips=[{uid:1,id:'anc_w1',rarity:6,ability:null,awakeningLevel:1,awakeningExp:0}];G.nextUid=2;G.equipment={weapon:{uid:1},armor:null,accessory:null};
  Object.assign(G.player,{lvl:50,hp:999,maxHp:999,mp:999,maxMp:999});SM.play=()=>{};SM.playBeep=()=>{};
  document.getElementById('boot-loader-screen')?.remove();enterAreaStage('area1',0);
 },
 multiHit(){
  battle.enemy={...battle.enemy,name:'合成検証の敵',emoji:'👾',hp:10000,maxHp:10000,def:0,atk:1,exp:45,goldMin:0,goldMax:0};
  battle.running=true;battle.over=false;CM.start();dealToEnemy(200,'れんぞく斬り',false,()=>{},'renzoku2');
 },
 awardEnemyExp(){battle.enemy.hp=0;battle.enemy.goldMin=0;battle.enemy.goldMax=0;winBattle();},
 exitBattle(){showScreen('screen-home');},
 snapshot(){return {enemyHp:battle?.enemy?.hp,equipment:JSON.parse(JSON.stringify(G?.ownedEquips||[])),enemyExpCalls:[...window.__qaEnemyExpCalls],floats:damageFloatsV2.snapshot(),floatElements:document.querySelectorAll('.dfq-v2-number').length,toast:ancientToastV2.snapshot(),toastHidden:document.getElementById('ancient-exp-toast-v2')?.hidden,toastText:document.getElementById('ancient-exp-toast-v2')?.textContent};}
};`;
  await route.fulfill({response,body:await response.text()+bridge});
 });
 const base=process.env.BASE_URL||'http://127.0.0.1:5186/';
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.presentationIntegrationQA,{}, {timeout:20000});
 await page.evaluate(()=>window.presentationIntegrationQA.setup());
 await page.waitForFunction(()=>document.querySelector('#screen-battle.active'),{}, {timeout:10000});
 await page.evaluate(()=>window.presentationIntegrationQA.multiHit());
 await page.waitForFunction(()=>document.querySelectorAll('.dfq-v2-number').length>=5,{}, {timeout:5000});
 const hitState=await page.evaluate(()=>window.presentationIntegrationQA.snapshot());
 assert.equal(hitState.floats.visible.length,5,'the real renzoku2 event sends all five hits into the in-game queue');
 assert.deepEqual(hitState.floats.visible.map(item=>Number(item.text)),[36,36,36,36,56]);
 assert.equal(hitState.floats.visible.reduce((sum,item)=>sum+Number(item.text),0),200);
 assert.equal(hitState.enemyHp,9800,'five presentation hits match the actual enemy damage total');
 await page.evaluate(()=>window.presentationIntegrationQA.awardEnemyExp());
 await page.waitForFunction(()=>{const node=document.getElementById('ancient-exp-toast-v2');return node&&!node.hidden&&window.__qaEnemyExpCalls.some(call=>call.fromEnemy&&call.amount>0);},{},{timeout:5000});
 const rewardState=await page.evaluate(()=>window.presentationIntegrationQA.snapshot());
 const enemyAward=rewardState.enemyExpCalls.find(call=>call.fromEnemy&&call.amount>0);
 assert.ok(enemyAward,'winBattle must call the shared enemy EXP award path');
 const actualAwakening=awakeningState(rewardState.equipment[0]);
 assert.equal(actualAwakening.level,rewardState.toast.active.after.level,'the toast level matches persisted equipment progression');
 assert.equal(actualAwakening.exp,rewardState.toast.active.after.exp,'the toast EXP matches the post-level remainder');
 assert.equal(rewardState.toast.active.amount,enemyAward.amount,'the toast reflects the amount awarded by winBattle');
 assert.match(rewardState.toastText,/古代装備に経験値/);
 await page.evaluate(()=>window.presentationIntegrationQA.exitBattle());
 const cleanup=await page.evaluate(()=>window.presentationIntegrationQA.snapshot());
 assert.equal(cleanup.toastHidden,true,'leaving battle cancels the live EXP toast');
 assert.equal(cleanup.toast.active,null,'leaving battle clears queued EXP presentation');
 assert.equal(cleanup.floatElements,0,'leaving battle removes all floating hit elements');
 assert.equal(cleanup.floats.lanes,0,'leaving battle clears pending damage lanes');
 assert.deepEqual(errors,[]);
 assert.deepEqual(remoteRequests,[],'the app stayed on the loopback fixture');
 console.log('PASS: real game.js renzoku2 applies/displays five hits; winBattle enemy EXP updates ancient equipment and shows the toast; leaving battle clears both presentations; loopback-only fixture.');
}finally{await browser.close();}
