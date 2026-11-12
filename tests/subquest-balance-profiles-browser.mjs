import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {READING_STORY_QUESTS} from '../reading_story_quests.js';

const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
const profiles=[
 {key:'early',label:'初期',grade:1,level:3,clears:{area1:[1,0,0,0,0,0,0]},stats:{atk:2,def:2,spd:2},gear:['w1','a1','c1']},
 {key:'middle',label:'中盤',grade:4,level:12,clears:{area1:[1,1,1,1,1,1,1],area13:[1,1,1,1,0,0,0]},stats:{atk:15,def:12,spd:6},gear:['w5','a4','c1']},
 {key:'late',label:'高進行',grade:6,level:30,clears:{area1:[1,1,1,1,1,1,1],area13:[1,1,1,1,1,1,1],area2:[1,1,1,1,1,1,1],area3:[1,1,1,1,1,0,0]},stats:{atk:39,def:30,spd:18},gear:['w8','a7','c4']},
];
const pattern=['correct','correct','wrong','correct','correct'];

try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/game.js*',async route=>{
  const response=await route.fetch();
  const code=await response.text()+`\nlet balanceChallengeGeneration=0;let balanceExpAwarded=0;let balanceEnemyActionCount=0;const balanceStartChallenge=startChallenge;startChallenge=(...args)=>{balanceChallengeGeneration++;return balanceStartChallenge(...args);};const balanceOriginalGrantExp=grantExp;grantExp=function(amount,...args){balanceExpAwarded+=Number(amount)||0;return balanceOriginalGrantExp(amount,...args);};const balanceOriginalEnemyAct=turnBasedEnemyAct;turnBasedEnemyAct=function(callback,attacker=null,isWrongAnswer=false){if(isWrongAnswer&&(attacker||!battle?.enemies))balanceEnemyActionCount++;return balanceOriginalEnemyAct(callback,attacker,isWrongAnswer);};window.subquestBalanceQA={
   setup(profile,seed=101){
    window.raidLocalPreview.open();G.isTestMode=true;
    // The local test-mode fixture resets its generous admin supplies in showHome();
    // apply the synthetic profile after that reset so it cannot overwrite our values.
    showHome();G.isTestMode=true;G.player.lvl=profile.level;G.player.exp=0;G.player.points=0;
    G.player.maxHp=30+4*(profile.level-1);G.player.hp=G.player.maxHp;G.player.maxMp=10+2*(profile.level-1);G.player.mp=G.player.maxMp;
    G.player.atk=5+profile.stats.atk;G.player.def=3+profile.stats.def;G.player.spd=6+profile.stats.spd;G.player.gold=0;
    window.balanceSelectedGear=profile.gear;
    G.ownedEquips=profile.gear.map((id,index)=>({uid:index+1,id,rarity:1,ability:null}));
    G.equipment={weapon:null,armor:null,accessory:null};
    for(const owned of G.ownedEquips){const db=getEquipTemplate(owned.id);G.equipment[db.slot]={uid:owned.uid};}
    G.nextUid=profile.gear.length+1;G.stageClearCounts=structuredClone(profile.clears);G.stageTotalClears={};G.stageDropOpportunities={};balanceExpAwarded=0;balanceEnemyActionCount=0;
    G.questMedals=0;G.questMedalExchanged={};G.questBoard=[];G.readingSubquests={solved:{},parts:{},letters:{},defeated:{}};
    G.items=[];G.skills={};G.pickup=null;G.activePrints={};balanceChallengeGeneration=0;window.balanceBattleResult=null;
    let randomState=seed>>>0;Math.random=()=>{randomState=(randomState*1664525+1013904223)>>>0;return randomState/4294967296;};
    updateHud();
   },
   rewardProfile(){
    const tiers=questAllowedTiers(),savedUid=G.nextUid,counts={},rewards=[];
    for(let i=0;i<250;i++){const q=generateStoryQuest(),r=questRewardFor(q.tier);counts[q.tier]=(counts[q.tier]||0)+1;rewards.push({tier:q.tier,gold:r.total,exp:r.exp});}
    G.nextUid=savedUid;
    return {allowed:tiers.map(x=>({family:x.family,tiers:x.tiers,isFront:x.isFront})),counts,reward:{minGold:Math.min(...rewards.map(x=>x.gold)),maxGold:Math.max(...rewards.map(x=>x.gold)),meanGold:rewards.reduce((a,x)=>a+x.gold,0)/rewards.length,minExp:Math.min(...rewards.map(x=>x.exp)),maxExp:Math.max(...rewards.map(x=>x.exp)),meanExp:rewards.reduce((a,x)=>a+x.exp,0)/rewards.length},medalBalance:G.questMedals,stats:{level:G.player.lvl,hp:totalMaxHp(),atk:totalStat('atk'),def:totalStat('def'),spd:totalStat('spd'),gear:window.balanceSelectedGear}};
   },
   startBattle(grade){
    const {READING_PURSUIT_QUESTS}=window.__balancePursuits;
    const q=READING_PURSUIT_QUESTS.find(x=>x.grade===grade);if(!q)throw new Error('missing pursuit');
    window.balanceBattleResult=null;startReadingQuestBattle(q,won=>{window.balanceBattleResult=won;});
   },
   progress(){return {gold:G.player.gold,exp:G.player.exp,expAwarded:balanceExpAwarded,medals:G.questMedals,parts:{...G.readingSubquests.parts},solved:{...G.readingSubquests.solved}};},
   state(){return {result:window.balanceBattleResult,generation:balanceChallengeGeneration,enemyActions:balanceEnemyActionCount,hp:G.player.hp,maxHp:totalMaxHp(),gold:G.player.gold,exp:G.player.exp,medals:G.questMedals,battle:battle?{over:battle.over,enemyHp:battle.enemy?.hp,enemyMaxHp:battle.enemy?.maxHp,enemyAtk:battle.enemy?.atk,enemyDef:battle.enemy?.def,enemyName:battle.enemy?.name,turnProblem:battle.currentTurnProblem?.problem}:null,area:explore?{areaId:explore.areaId,stageIndex:explore.stageIndex,readingQuest:!!explore.readingQuest}:null};},
   startReadingBoard(){questSubject='reading';showQuestBoard();},
   cleanup(){if(battle&&!battle.over)endBattleLoop();if(explore?.readingQuest)finishReadingQuestBattle(false);else showHome();},
   reward:function(){return QUEST_MEDAL_MILESTONES.map(m=>({medals:m.medals,key:m.key}));}
  };`;
  await route.fulfill({response,body:code});
 });
 await page.addInitScript(()=>{window.__balancePursuits=[];});
 await page.goto('http://127.0.0.1:5186/');
 await page.waitForFunction(()=>window.subquestBalanceQA&&window.raidLocalPreview);
 // Publish the read-only pursuit definitions from this test module into the isolated page.
 const pursuitsModule=await import('../reading_pursuit_quests.js');
 await page.evaluate(quests=>{window.__balancePursuits.READING_PURSUIT_QUESTS=quests;},pursuitsModule.READING_PURSUIT_QUESTS);

 async function playReadingQuest(profile){
  await page.evaluate(p=>window.subquestBalanceQA.setup(p,1001),profile);
  const before=await page.evaluate(()=>window.subquestBalanceQA.rewardProfile());
  const initial=await page.evaluate(()=>window.subquestBalanceQA.progress());
  await page.evaluate(()=>window.subquestBalanceQA.startReadingBoard());
  await page.getByRole('tab',{name:'国語'}).click();await page.locator('.reading-grade-tabs button').nth(profile.grade-1).click();
  const quests=READING_STORY_QUESTS.filter(x=>x.grade===profile.grade).slice(0,5);
  const started=Date.now(),outcomes=[];let cursor=0;const cleared=[];
  for(const q of quests){
   const card=page.locator('.reading-quest-card:not(.reading-duel-card)').filter({has:page.getByRole('heading',{name:q.title,exact:true})});
   for(let n=0;n<12&&!(await card.count());n++){const next=page.getByRole('button',{name:'次のクエストページ'});assert.ok(await next.count(),`${profile.key}: story quest ${q.id} has a page control`);assert.ok(!(await next.isDisabled()),`${profile.key}: story quest ${q.id} remains in the grade list`);await next.click();}
   assert.equal(await card.count(),1,`${profile.key}: quest ${q.id} card present`);await card.locator('button.btn').click();
   for(let part=0;part<3;part++){
    await page.getByRole('textbox',{name:'答え',exact:true}).waitFor();
    for(;;){
     const outcome=pattern[cursor++%pattern.length];outcomes.push(outcome);await page.waitForTimeout(1000);
     const input=page.getByRole('textbox',{name:'答え',exact:true});
     await input.fill(outcome==='correct'?String(q.parts[part].answer):`ちがう${part+1}`);
     await page.getByRole('button',{name:'けってい',exact:true}).click();
     if(outcome==='wrong'){
      await page.waitForFunction(()=>/もう一度/.test(document.querySelector('.quest-reading-answer-feedback')?.textContent||''));
      continue;
     }
     if(part<2){const next=page.getByRole('button',{name:'次の問題',exact:true});await page.waitForFunction(()=>{const el=document.querySelector('.quest-answer-next');return !!el&&!el.disabled;});await next.click();}
     break;
    }
   }
   cleared.push(q.id);await page.getByRole('button',{name:'← 依頼一覧へ'}).click();
  }
  const elapsedMs=Date.now()-started;
  const result=await page.evaluate(()=>window.subquestBalanceQA.progress());
  assert.equal(result.gold-initial.gold,4500,`${profile.key}: 15 first-clear reading rewards`);assert.equal(result.expAwarded-initial.expAwarded,300);assert.equal(result.medals-initial.medals,30);assert.equal(cleared.length,5);
  return {profile:profile.key,grade:profile.grade,questCount:cleared.length,questionCount:cleared.length*3,attempts:outcomes.length,correct:outcomes.filter(x=>x==='correct').length,wrong:outcomes.filter(x=>x==='wrong').length,accuracy:outcomes.filter(x=>x==='correct').length/outcomes.length,scriptedThinkDelayMs:1000,elapsedMs,rewards:{gold:result.gold-initial.gold,expAwarded:result.expAwarded-initial.expAwarded,medals:result.medals-initial.medals,thresholdsReached:[3,6,10,15,20,30].filter(x=>result.medals-initial.medals>=x)},mathTiers:before.allowed,mathSample:before.counts,mathRewardRange:before.reward,stats:before.stats};
 }

 async function playReadingBattle(profile,seed,battlePattern=pattern){
  await page.evaluate(([p,s])=>window.subquestBalanceQA.setup(p,s),[profile,seed]);
  const before=await page.evaluate(()=>window.subquestBalanceQA.state());
  const setup=await page.evaluate(()=>window.subquestBalanceQA.rewardProfile());
  await page.evaluate(grade=>window.subquestBalanceQA.startBattle(grade),profile.grade);
  await page.locator('#ch-input').waitFor({timeout:10000});
  const initial=await page.evaluate(()=>window.subquestBalanceQA.state());
  const record={profile:profile.key,seed,answerPattern:battlePattern[0]==='wrong'?'wrong-first':'correct-first',area:initial.area,player:{hp:before.maxHp,atk:setup.stats.atk,def:setup.stats.def,spd:setup.stats.spd,gear:setup.stats.gear},enemy:{name:initial.battle.enemyName,hp:initial.battle.enemyHp,maxHp:initial.battle.enemyMaxHp,atk:initial.battle.enemyAtk,def:initial.battle.enemyDef},attempts:[],scriptedThinkDelayMs:1000};
  let cursor=0;
  while(record.attempts.length<80){
   const pre=await page.evaluate(()=>window.subquestBalanceQA.state());
   if(pre.result!==null||pre.battle?.over)break;
   if(!await page.locator('#ch-input').count()){
    await page.waitForFunction(()=>window.subquestBalanceQA.state().result!==null||!!document.querySelector('#ch-input'),{timeout:10000});
    continue;
   }
   const outcome=battlePattern[cursor++%battlePattern.length],answer=pre.battle.turnProblem?.answer;
   assert.notEqual(answer,undefined,`${profile.key}: actual combat question exposed`);
   await page.waitForTimeout(1000);
   const input=page.locator('#ch-input');await input.fill(outcome==='correct'?String(answer):String(Number(answer)+137));
   await input.press('Enter');
   await page.waitForFunction(({generation})=>{const s=window.subquestBalanceQA.state();return s.result!==null||s.generation>generation;},{generation:pre.generation},{timeout:12000});
   const post=await page.evaluate(()=>window.subquestBalanceQA.state());
   record.attempts.push({outcome,enemyDamage:Math.max(0,(pre.battle?.enemyHp??0)-(post.battle?.enemyHp??0)),hpLost:Math.max(0,pre.hp-post.hp),enemyActions:Math.max(0,post.enemyActions-pre.enemyActions),hpAfter:post.hp,enemyHpAfter:post.battle?.enemyHp??0});
   if(post.result!==null||post.battle?.over)break;
  }
  const final=await page.evaluate(()=>window.subquestBalanceQA.state());
  record.result=final.result?'victory':final.result===false?'defeat':'unfinished';
  record.correct=record.attempts.filter(x=>x.outcome==='correct').length;record.wrong=record.attempts.filter(x=>x.outcome==='wrong').length;
  record.enemyTurns=record.attempts.reduce((n,x)=>n+x.enemyActions,0);record.hpLost=record.attempts.reduce((n,x)=>n+x.hpLost,0);record.hpAfter=final.hp;record.enemyHpAfter=final.battle?.enemyHp??0;
  record.battleGold=final.gold-before.gold;record.battleExp=final.exp-before.exp;record.battleMedals=final.medals-before.medals;
  assert.ok(record.attempts.length<80,`${profile.key}: battle terminated or reached a bounded answer count`);
  await page.evaluate(()=>window.subquestBalanceQA.cleanup());
  return record;
 }

 const readingResults=[],battleResults=[];
 for(const profile of profiles){
  if(process.env.SUBQUEST_BALANCE_MODE!=='battle')readingResults.push(await playReadingQuest(profile));
  if(process.env.SUBQUEST_BALANCE_MODE!=='reading'){
   battleResults.push(await playReadingBattle(profile,401,pattern));
   battleResults.push(await playReadingBattle(profile,402,['wrong','correct','correct','wrong','correct']));
  }
 }
 const compactBattle=battleResults.map(({profile,seed,answerPattern,area,player,enemy,scriptedThinkDelayMs,result,correct,wrong,enemyTurns,hpLost,hpAfter,enemyHpAfter,battleGold,battleExp,battleMedals,attempts})=>({profile,seed,answerPattern,area,player,enemy,scriptedThinkDelayMs,result,correct,wrong,enemyTurns,hpLost,hpAfter,enemyHpAfter,battleGold,battleExp,battleMedals,attemptCount:attempts.length}));
 const compactReading=readingResults.map(({profile,grade,questCount,questionCount,attempts,correct,wrong,accuracy,scriptedThinkDelayMs,elapsedMs,rewards,mathTiers,mathSample,mathRewardRange,stats})=>({profile,grade,questCount,questionCount,attempts,correct,wrong,accuracy,scriptedThinkDelayMs,elapsedMs,rewards,mathTiers,mathSample,mathRewardRange,stats}));
 const result={accuracyPattern:'correct, correct, wrong, correct, correct (repeating)',readingResults:compactReading,battleResults:compactBattle,medalModel:(await page.evaluate(()=>window.subquestBalanceQA.reward())).map(m=>({key:m.key,medals:m.medals})),limitations:'Synthetic profiles and seeded enemy/game randomness; no real-user accuracy. Correct-answer delay is scripted; browser feedback animations remain active. No training, raid, payment or CloudSave.'};
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
