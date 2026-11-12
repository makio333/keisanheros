import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const dir=path.join(tmpdir(),'legend-test-correct-skip');mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR:',e.message);});
 await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'text/javascript',body:''}));
 await context.route('**/local_game_client.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'}));
 await context.route('**/game.js*',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:await res.text()+`\nwindow.skipQA={challenge(test,problem){G=newGameState('スキップ検証','ai_hero_spellblade');G.isTestMode=test;battle=null;explore=null;window.skipResults=[];window.skipAnswered=[];SM.playCorrectAnswer=()=>{};document.getElementById('boot-loader-screen')?.remove();showScreen('screen-battle');startChallenge($('battle-challenge'),{problem,timeLimit:30000,onAnswered:(elapsed,success)=>window.skipAnswered.push(success)},result=>window.skipResults.push(result));},result:()=>({results:window.skipResults,answered:window.skipAnswered,correct:G.studyStats?.totalCorrect || 0}),disableTest(){G.isTestMode=false;},cancel:destroyChallenge,battle(){window.awakeningQA.setup();G.isTestMode=true;enterAreaStage('area1',0);battle.enemy.exp=30;}};window.awakeningQA={setup(){G=newGameState('覚醒検証','ai_hero_spellblade');currentSlotKey='qa-awakening';G.ownedEquips=['anc_w1','anc_a1','anc_c1'].map((id,i)=>({id,uid:i+1,rarity:6,ability:null}));G.nextUid=4;['weapon','armor','accessory'].forEach((slot,i)=>G.equipment[slot]={uid:i+1});Object.assign(G.player,{lvl:50,hp:999,maxHp:999,mp:999,maxMp:999});SM.playBeep=()=>{};document.getElementById('boot-loader-screen')?.remove();enterAreaStage('area1',0);},state:()=>JSON.parse(JSON.stringify(G)),gain:amount=>grantExp(amount,{fromEnemy:true}),quest:amount=>grantExp(amount),clear(){G.equipment={};updateHud();},restore(data){G=data;updateHud();},master(){masterExistingAncients(G);updateHud();},win(){battle.enemy.exp=30;battle.enemy.hp=0;winBattle();},detail(){showStatus();renderEquipmentSlots();}};`});});
 await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5174/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.skipQA);
 await page.evaluate(()=>window.skipQA.challenge(false,{text:'3 + 5',answer:8,tier:'add1'}));assert.equal(await page.locator('#ch-test-correct').count(),0);
 for(const problem of [{text:'3 + 5',answer:8,tier:'add1'},{text:'17 ÷ 5',answer:3,remainder:2,tier:'div2'},{text:'1/2 + 1/4',answer:'3/4',tier:'add1'},{text:'比',answer:'2:3',tier:'add1'}]){
  await page.evaluate(p=>window.skipQA.challenge(true,p),problem);await page.locator('#ch-test-correct').click();assert.equal(await page.locator('#ch-test-correct').isDisabled(),true);await page.evaluate(()=>document.getElementById('ch-test-correct').click());await page.waitForTimeout(550);
  const state=await page.evaluate(()=>window.skipQA.result());assert.equal(state.results.length,1);assert.equal(state.results[0].success,true);assert.deepEqual(state.answered,[true]);assert.equal(state.correct,1);
 }
 await page.evaluate(()=>window.skipQA.challenge(true,{text:'3 + 5',answer:8,tier:'add1'}));await page.screenshot({path:path.join(dir,'skip-desktop.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'skip-mobile.png')});
 const submit=await page.locator('#ch-submit').boundingBox(),skip=await page.locator('#ch-test-correct').boundingBox();assert.ok(Math.abs(submit.y-skip.y)<2);assert.ok(skip.x+skip.width<=390);
 await page.evaluate(()=>window.skipQA.disableTest());await page.locator('#ch-test-correct').click();await page.waitForTimeout(500);assert.equal((await page.evaluate(()=>window.skipQA.result())).results.length,0);
 await page.evaluate(()=>window.skipQA.challenge(true,{text:'3 + 5',answer:8,tier:'add1'}));await page.locator('#ch-test-correct').click();await page.evaluate(()=>window.skipQA.cancel());await page.waitForTimeout(550);assert.equal((await page.evaluate(()=>window.skipQA.result())).results.length,0);
 await page.evaluate(()=>window.skipQA.battle());await page.locator('#ch-test-correct').waitFor();await page.locator('#ch-test-correct').click();await page.waitForFunction(()=>window.awakeningQA.state().ownedEquips[0].awakeningLevel===2,{},{timeout:10000});
 assert.deepEqual(errors,[]);console.log('PASS: test-only correct skip, normal/remainder/fraction/ratio answers, once-only callback, normal-mode guard, cancelled challenge, mobile adjacency, actual enemy defeat and awakening XP; '+dir);
}finally{await browser.close();}
