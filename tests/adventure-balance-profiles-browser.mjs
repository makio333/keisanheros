import assert from 'node:assert/strict';
import {homedir} from 'node:os';

const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
const profiles=[
 {key:'early',label:'序盤',level:2,area:'area1',stage:1,displayCode:'1-2',points:{atk:2,def:1,spd:0},rewardSource:null,clears:{area1:[1,0,0,0,0,0,0]}},
 {key:'middle',label:'中盤',level:6,area:'area13',stage:3,displayCode:'2-4',points:{atk:6,def:5,spd:4},rewardSource:{area:'area13',stage:2},clears:{area1:[1,1,1,1,1,1,1],area13:[1,1,1,0,0,0,0]}},
 {key:'late',label:'後半',level:12,area:'area3',stage:4,displayCode:'4-5',points:{atk:13,def:12,spd:8},rewardSource:{area:'area3',stage:3},purchaseArmor:{id:'a4',name:'てつの鎧',price:80,goldBefore:80},clears:{area1:[1,1,1,1,1,1,1],area13:[1,1,1,1,1,1,1],area2:[1,1,1,1,1,1,1,1,1],area3:[1,1,1,1,0,0,0]}},
];
const scenarios=[
 {key:'correct',label:'全問正答',pattern:['correct']},
 {key:'mixed',label:'正答中心・誤答混在',pattern:['correct','wrong','correct','correct']},
 {key:'consecutive',label:'連続誤答',pattern:['correct','wrong','wrong','correct']},
];
const profilesToRun=process.env.ADVENTURE_BALANCE_PROFILE?profiles.filter(profile=>profile.key===process.env.ADVENTURE_BALANCE_PROFILE):profiles;
const scenariosToRun=process.env.ADVENTURE_BALANCE_SCENARIO?scenarios.filter(scenario=>scenario.key===process.env.ADVENTURE_BALANCE_SCENARIO):scenarios;
assert.ok(profilesToRun.length,'requested synthetic profile exists');assert.ok(scenariosToRun.length,'requested answer scenario exists');
const scriptedThinkDelayMs=1000;

try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],externalRequests=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:5186/'))externalRequests.push(request.url());});
 await page.route('**/game.js*',async route=>{
  const response=await route.fetch();
  const code=await response.text()+`\nlet adventureChallengeGeneration=0,adventureExpAwarded=0,adventureEnemyActions=0,adventureEnemyDamageLog=[],adventureBattleId=0,adventureEnemySpawns=[],adventureStageRewards=null,adventureStageHpBeforeRecovery=null,adventureLevelUpHealing=0,adventureDisableTestSupplies=false,adventureCloudSaveCalls=0,adventureNoopSaveCalls=0,adventurePreventSaves=false,adventureLatestProblem=null;const adventureOriginalSave=save;save=function(...args){if(adventurePreventSaves){adventureNoopSaveCalls++;return;}return adventureOriginalSave(...args);};const adventureStartChallenge=startChallenge;startChallenge=(...args)=>{adventureChallengeGeneration++;adventureLatestProblem=args[1]?.problem?structuredClone(args[1].problem):null;return adventureStartChallenge(...args);};const adventureOriginalGrantExp=grantExp;grantExp=function(amount,...args){const hpBefore=G.player.hp;const levelBefore=G.player.lvl;adventureExpAwarded+=Number(amount)||0;const result=adventureOriginalGrantExp(amount,...args);if(G.player.lvl>levelBefore)adventureLevelUpHealing+=Math.max(0,G.player.hp-hpBefore);return result;};const adventureOriginalEnemyAct=turnBasedEnemyAct;turnBasedEnemyAct=function(callback,attacker=null,isWrongAnswer=false){if(isWrongAnswer&&(attacker||!battle?.enemies))adventureEnemyActions++;const hpBefore=G.player.hp;const enemy=attacker||battle?.enemy;const result=adventureOriginalEnemyAct(callback,attacker,isWrongAnswer);if(isWrongAnswer&&enemy&&hpBefore>G.player.hp)adventureEnemyDamageLog.push({enemy:enemy.name,attack:enemy.atk,defense:totalStat('def'),baseDamage:Math.max(1,Math.round(enemy.atk*2.25)-totalStat('def')),damage:hpBefore-G.player.hp});return result;};const adventureOriginalStartBattle=startBattle;startBattle=function(...args){const result=adventureOriginalStartBattle(...args);if(explore?.stageMode&&!explore.isBoss&&!explore.isHalloween){adventureBattleId++;adventureEnemySpawns.push({battleId:adventureBattleId,killIndex:(explore.stageKillCount||0)+1,name:battle.enemy.name,hp:battle.enemy.hp,maxHp:battle.enemy.maxHp,atk:battle.enemy.atk,def:battle.enemy.def,spd:battle.enemy.spd,exp:battle.enemy.exp,gold:[battle.enemy.goldMin,battle.enemy.goldMax]});}return result;};const adventureOriginalStageClear=showStageClearOverlay;showStageClearOverlay=function(...args){adventureStageRewards=structuredClone(args[2]);return adventureOriginalStageClear(...args);};const adventureOriginalRecordClear=recordStageClear;recordStageClear=function(...args){adventureStageHpBeforeRecovery={hp:G.player.hp,maxHp:totalMaxHp()};return adventureOriginalRecordClear(...args);};const adventureOriginalEnsureSupplies=ensureTestModeSupplies;ensureTestModeSupplies=function(...args){if(adventureDisableTestSupplies)return;return adventureOriginalEnsureSupplies(...args);};if(window.CloudSave?.saveSlot){const adventureOriginalCloudSave=window.CloudSave.saveSlot;window.CloudSave.saveSlot=(...args)=>{adventureCloudSaveCalls++;return adventureOriginalCloudSave(...args);};}window.normalAdventureQA={
   setup(profile,seed){
    window.raidLocalPreview.open();adventurePreventSaves=true;showHome();G.isTestMode=false;G.testStatsInit=false;adventureDisableTestSupplies=false;
    const expectedPointCount=(profile.level-1)*3;if(profile.points.atk+profile.points.def+profile.points.spd!==expectedPointCount)throw new Error('synthetic stat points must match level-up points');
    const baseEquipment=[{id:'a1',rarity:1,source:'newGameStateの初期防具'},{id:'w1',rarity:1,source:'導入で選べる木の剣'}];
    const historicalRewards=[];
    for(const [areaId,counts] of Object.entries(profile.clears))for(let index=0;index<counts.length;index++)if(counts[index]>0&&!(areaId===profile.area&&index===profile.stage)){
     const reward=stageWeaponReward(areaId,index);historicalRewards.push({area:areaId,stage:index,id:reward.db.id,rarity:reward.rarity,atk:reward.atk,source:'そのステージ初回クリア報酬'});
    }
    let selectedWeapon=baseEquipment[1];
    if(profile.rewardSource){const reward=stageWeaponReward(profile.rewardSource.area,profile.rewardSource.stage);selectedWeapon={id:reward.db.id,rarity:reward.rarity,source:profile.rewardSource.area+' '+(profile.rewardSource.stage+1)+'面の初回クリア報酬'};}
    const allGear=[...baseEquipment,...historicalRewards.map(reward=>({id:reward.id,rarity:reward.rarity,source:reward.source,area:reward.area,stage:reward.stage}))];
    let uid=1;G.ownedEquips=allGear.map(item=>({uid:uid++,id:item.id,rarity:item.rarity,ability:null}));
    const armor=G.ownedEquips.find(item=>item.id==='a1');
    const weapon=[...G.ownedEquips].reverse().find(item=>item.id===selectedWeapon.id&&item.rarity===selectedWeapon.rarity);
    G.equipment={weapon:{uid:weapon.uid},armor:{uid:armor.uid},accessory:null};G.nextUid=uid;
    G.player.lvl=profile.level;G.player.exp=0;G.player.points=0;G.player.maxHp=30+4*(profile.level-1);G.player.hp=G.player.maxHp;G.player.maxMp=10+2*(profile.level-1);G.player.mp=G.player.maxMp;G.player.atk=5+profile.points.atk;G.player.def=3+profile.points.def;G.player.spd=6+profile.points.spd;G.player.gold=Number(profile.purchaseArmor?.goldBefore)||0;
    G.playerName='通常冒険の合成プロフィール';G.items=[];G.skills={};G.testStatsInit=true;G.stageClearCounts=structuredClone(profile.clears);G.stageTotalClears=structuredClone(profile.clears);G.stageRewardClaims={};G.stageDropOpportunities={};G.questMedals=0;G.questMedalExchanged={};G.questBoard=[];G.readingSubquests={solved:{},parts:{},letters:{},defeated:{}};G.failTracking={gameOvers:{},mistakes:{}};G.pickup=null;G.activePrints={};G.areaBossLevel={};G.clearCounts={tower:3,dungeon:3,crypt:3,bandit:0};activeProfileArea=profile.area;activeProfileStage=profile.stage;
    for(const reward of historicalRewards){const key=reward.area+':'+reward.stage;G.stageRewardClaims[key]={first:true,rewardFirst:true,firstWeapon:{id:reward.id,rarity:reward.rarity}};}
    adventureDisableTestSupplies=true;adventureChallengeGeneration=0;adventureExpAwarded=0;adventureEnemyActions=0;adventureEnemyDamageLog=[];adventureBattleId=0;adventureEnemySpawns=[];adventureStageRewards=null;adventureStageHpBeforeRecovery=null;adventureLevelUpHealing=0;adventureCloudSaveCalls=0;adventureNoopSaveCalls=0;adventureLatestProblem=null;
    let randomState=seed>>>0;Math.random=()=>{randomState=(randomState*1664525+1013904223)>>>0;return randomState/4294967296;};
    showHome();updateHud();
    return {historyGear:allGear,equipped:{weapon:selectedWeapon,armor:{id:'a1',rarity:1,source:'newGameStateの初期防具'},accessory:null},seed};
   },
   prepareRetry(seed){let randomState=seed>>>0;Math.random=()=>{randomState=(randomState*1664525+1013904223)>>>0;return randomState/4294967296;};adventureChallengeGeneration=0;adventureExpAwarded=0;adventureEnemyActions=0;adventureEnemyDamageLog=[];adventureBattleId=0;adventureEnemySpawns=[];adventureStageRewards=null;adventureStageHpBeforeRecovery=null;adventureLevelUpHealing=0;adventureCloudSaveCalls=0;adventureNoopSaveCalls=0;adventureLatestProblem=null;return this.state();},
   state(){return {challengeGeneration:adventureChallengeGeneration,challengeProblem:adventureLatestProblem?structuredClone(adventureLatestProblem):null,battleId:adventureBattleId,enemyActions:adventureEnemyActions,enemyDamageLog:adventureEnemyDamageLog.map(item=>({...item})),expAwarded:adventureExpAwarded,levelUpHealing:adventureLevelUpHealing,player:{level:G.player.lvl,hp:G.player.hp,maxHp:totalMaxHp(),atk:totalStat('atk'),def:totalStat('def'),spd:totalStat('spd'),gold:G.player.gold,exp:G.player.exp,points:G.player.points},battle:battle?{over:battle.over,enemyHp:battle.enemy?.hp,enemyMaxHp:battle.enemy?.maxHp,enemyAtk:battle.enemy?.atk,enemyDef:battle.enemy?.def,name:battle.enemy?.name,problem:battle.currentTurnProblem}:null,explore:explore?{area:explore.areaId,stage:explore.stageIndex,killCount:explore.stageKillCount,stageMode:explore.stageMode}:null,stageClear:!!document.querySelector('.stage-clear-overlay'),stageClearStars:G.stageClearCounts?.[activeProfileArea]?.[activeProfileStage]||0,stageRewards:adventureStageRewards?structuredClone(adventureStageRewards):null,stageHpBeforeRecovery:adventureStageHpBeforeRecovery?{...adventureStageHpBeforeRecovery}:null,gameOver:!!document.querySelector('#screen-gameover.active'),levelUp:!!document.querySelector('.levelup-overlay'),testMode:!!G.isTestMode,testSkipVisible:!!document.querySelector('#ch-test-correct'),suppliesDisabled:adventureDisableTestSupplies,savingSuppressed:adventurePreventSaves,noopSaveCalls:adventureNoopSaveCalls,ownedEquipment:G.ownedEquips.map(item=>({id:item.id,rarity:item.rarity})),equipped:Object.fromEntries(Object.entries(G.equipment).map(([slot,eq])=>[slot,eq?G.ownedEquips.find(item=>item.uid===eq.uid)?.id:null])),equippedDetails:Object.fromEntries(Object.entries(G.equipment).map(([slot,eq])=>{const item=eq?G.ownedEquips.find(candidate=>candidate.uid===eq.uid):null;const db=item?getEquipTemplate(item.id):null;return [slot,item&&db?{id:item.id,name:db.name,rarity:item.rarity,stat:calcEquipStat(db.stat,item.rarity,item)}:null];})),ownedItems:G.items.map(item=>({id:item.id,count:item.count})),ownedItemCount:G.items.reduce((n,item)=>n+item.count,0),ownedSkillCount:Object.values(G.skills||{}).filter(skill=>skill?.level>=1).length,usedCost:usedCost(),costCap:costCap(),enemySpawns:adventureEnemySpawns.map(enemy=>({...enemy}))};},
   enterAdventure(){openAdventure();},
   selectArea(areaId){showStageSelectNew(areaId);},
   selectStage(areaId,index){activeProfileArea=areaId;activeProfileStage=index;},
   reward(){return adventureStageRewards?structuredClone(adventureStageRewards):null;},
   cloudSaveCalls(){return adventureCloudSaveCalls;},
   cleanup(){if(battle&&!battle.over)endBattleLoop();showHome();}
  };let activeProfileArea=null,activeProfileStage=null;`;
  await route.fulfill({response,body:code});
 });
 await page.goto('http://127.0.0.1:5186/');
 await page.waitForFunction(()=>window.normalAdventureQA&&window.raidLocalPreview);

 async function buyAndEquipArmor(profile){
  const purchase=profile.purchaseArmor;if(!purchase)return null;
  const goldBefore=(await page.evaluate(()=>window.normalAdventureQA.state())).player.gold;
  assert.equal(goldBefore,purchase.goldBefore,`${profile.label}: synthetic accumulated gold matches the ordinary-shop budget`);
  await page.locator('#hotspot-weapon-shop').click();
  await page.locator('#weapon-shop-tabs [data-slot="armor"]').click();
  const shopItem=page.locator(`#weapon-shop-list .shop-icon[aria-label*="${purchase.name}"]`);
  assert.equal(await shopItem.count(),1,`${purchase.name} appears in the ordinary armor shop`);
  await shopItem.click();
  await page.locator('#btn-confirm-yes').click();
  await page.locator('#btn-purchase-reveal-equip').click();
  await page.locator('#screen-status.active').waitFor();
  await page.locator('#equip-slot-filter [data-slot-filter="armor"]').click();
  const ownedArmor=page.locator(`#equip-list-grid .equip-grid-cell[aria-label*="${purchase.name}"]`);
  await ownedArmor.waitFor();
  await ownedArmor.click();
  await page.locator('#btn-confirm-yes').click();
  await page.locator('#screen-training.active').waitFor();
  await page.locator('#ch-input').waitFor();
  const equipQuestion=await page.evaluate(()=>window.normalAdventureQA.state().challengeProblem);
  assert.notEqual(equipQuestion?.answer,undefined,'armor must be equipped by solving its normal calculation');
  await page.locator('#ch-input').fill(String(equipQuestion.answer));
  await page.locator('#ch-input').press('Enter');
  await page.locator('#training-progress .mastered').waitFor();
  await page.locator('#btn-training-quit').click();
  await page.locator('#screen-status.active').waitFor();
  await page.locator('#btn-status-back').click();
  await page.locator('#screen-home.active').waitFor();
  const after=await page.evaluate(()=>window.normalAdventureQA.state());
  assert.equal(after.equipped.armor,purchase.id,'purchased armor equipped after the visible calculation flow');
  assert.equal(after.player.gold,goldBefore-purchase.price,'ordinary purchase deducted the listed price');
  return {id:purchase.id,name:purchase.name,price:purchase.price,goldBefore,goldAfter:after.player.gold,rarity:1,source:'武器屋で購入し、表示された計算に正解して装備',equippedStat:after.equippedDetails.armor.stat};
 }

 async function enterStageFromHome(profile){
  await page.locator('#hotspot-adventure').click();
  const areaCard=profile.area==='area1'?'#area-card-tower':profile.area==='area13'?'#stage-card-area13':'#stage-card-area3';
  await page.locator(areaCard).click();
  const stageRow=page.locator('.stage-select-row').filter({has:page.locator('.stage-select-num').filter({hasText:profile.displayCode})});
  assert.equal(await stageRow.count(),1,`${profile.label}: ${profile.displayCode} visible in ordinary stage list`);
  await stageRow.click();
  await page.locator('#ch-input').waitFor({timeout:10000});
 }

 async function launchStage(profile,seed,fromExistingHome=false){
  let armorPurchase=null;
  if(fromExistingHome){
   await page.evaluate(s=>window.normalAdventureQA.prepareRetry(s),seed);
  }else{
   await page.evaluate(([p,s])=>window.normalAdventureQA.setup(p,s),[profile,seed]);
   await page.locator('#screen-raid-boss .window-close-btn').click();
   armorPurchase=await buyAndEquipArmor(profile);
  }
  const startState=await page.evaluate(()=>window.normalAdventureQA.state());
  assert.equal(startState.testMode,false,'ordinary play rules remain active; save suppression is isolated separately');
  assert.equal(startState.savingSuppressed,true,'all synthetic-profile saves are intercepted');
  assert.equal(startState.suppliesDisabled,true,'admin test supplies disabled after profile setup');
  const expectedOwnedGear=2+Object.values(profile.clears).flat().reduce((sum,count)=>sum+count,0)+Number(!!profile.purchaseArmor);
  if(fromExistingHome){
   assert.ok(startState.ownedEquipment.length>=expectedOwnedGear,'normal gear retained after returning home');
  }else{
   assert.equal(startState.ownedItemCount,0,'no admin items');
   assert.equal(startState.ownedSkillCount,0,'no test skills');
   assert.equal(startState.ownedEquipment.length,expectedOwnedGear,'only initial, earned, and visibly purchased normal equipment is present');
  }
  assert.equal(startState.player.hp,startState.player.maxHp,'full HP on stage entry');
  assert.equal(startState.costCap,profile.level,`ordinary equipment-cost cap is Lv.${profile.level}`);
  assert.ok(startState.usedCost<=startState.costCap,`equipped cost ${startState.usedCost} <= cap ${startState.costCap}`);
  await enterStageFromHome(profile);
  const opened=await page.evaluate(()=>window.normalAdventureQA.state());
  assert.equal(opened.explore.area,profile.area);assert.equal(opened.explore.stage,profile.stage);assert.equal(opened.testMode,false);
  return {startState,opened,armorPurchase};
 }

 async function awaitNextTurn(previousGeneration){
  for(let guard=0;guard<8;guard++){
   await page.waitForFunction(generation=>{
    const state=window.normalAdventureQA.state();
    return state.challengeGeneration>generation||state.stageClear||state.gameOver||state.levelUp;
   },previousGeneration,{timeout:30000});
   const state=await page.evaluate(()=>window.normalAdventureQA.state());
   if(state.levelUp){await page.locator('#btn-levelup-close').click();continue;}
   if(await page.locator('.gacha-reveal-overlay').count()){
    await page.locator('.gacha-reveal-overlay').waitFor({state:'detached',timeout:15000});continue;
   }
   if(state.stageClear||state.gameOver||state.challengeGeneration>previousGeneration)return state;
  }
  throw new Error('post-answer transition did not reach a new turn or a terminal screen');
 }

 async function playStage(profile,scenario,seed,fromExistingHome=false){
  const {startState,opened,armorPurchase}=await launchStage(profile,seed,fromExistingHome);
  const started=Date.now(),attempts=[];let cursor=0;
  while(attempts.length<160){
   const pre=await page.evaluate(()=>window.normalAdventureQA.state());
   if(pre.stageClear||pre.gameOver)break;
   const input=page.locator('#ch-input');
   if(!(await input.count())){
    if(await page.locator('.levelup-overlay').count()){await page.locator('#btn-levelup-close').click();continue;}
    if(await page.locator('.gacha-reveal-overlay').count()){await page.locator('.gacha-reveal-overlay').waitFor({state:'detached',timeout:15000});continue;}
    await page.waitForFunction(()=>window.normalAdventureQA.state().stageClear||window.normalAdventureQA.state().gameOver||!!document.querySelector('#ch-input'),null,{timeout:30000});
    continue;
   }
   const problem=pre.battle?.problem?.problem;
   const answer=problem?.answer;
   assert.notEqual(answer,undefined,`${profile.label}: ordinary adventure question generated`);
   const outcome=scenario.pattern[cursor++%scenario.pattern.length];
   await page.waitForTimeout(scriptedThinkDelayMs);
   await input.fill(outcome==='correct'?String(answer):String(Number(answer)+137));
   await input.press('Enter');
   const post=await awaitNextTurn(pre.challengeGeneration);
   const incomingDamage=post.enemyDamageLog.slice(pre.enemyDamageLog.length);
   if(outcome==='wrong')for(const hit of incomingDamage)assert.equal(hit.damage,Math.max(1,Math.round(hit.baseDamage*0.5)),`${profile.label}: normal stage wrong answer applies its half-damage rule`);
   attempts.push({battleId:pre.battleId,outcome,problem:problem?.text||`${problem?.a} ${problem?.op} ${problem?.b}`,answer:String(answer),enemyName:pre.battle?.name,enemyHpBefore:pre.battle?.enemyHp??0,enemyHpAfter:post.battle?.enemyHp??0,playerHpBefore:pre.player.hp,playerHpAfter:post.player.hp,enemyActions:Math.max(0,post.enemyActions-pre.enemyActions),incomingDamage,expAwarded:post.expAwarded-pre.expAwarded,goldAfter:post.player.gold});
   if(post.stageClear||post.gameOver)break;
  }
  const final=await page.evaluate(()=>window.normalAdventureQA.state());
  assert.ok(attempts.length<160,`${profile.label} ${scenario.key}: bounded stage answers`);
  const equippedForReport=structuredClone(startState.equippedDetails);
  if(equippedForReport.weapon)equippedForReport.weapon.source=profile.rewardSource?`${profile.rewardSource.area} ${profile.rewardSource.stage+1}面の初回クリア報酬`:'導入で選べる木の剣';
  if(equippedForReport.armor)equippedForReport.armor.source=armorPurchase?.source||(profile.purchaseArmor?'武器屋で購入し、計算に正解して装備':'newGameStateの初期防具');
  const priorFirstClears=Object.values(profile.clears).flat().reduce((sum,count)=>sum+count,0);
  const result={
   profile:profile.key,scenario:scenario.key,seed,stage:{area:profile.area,index:profile.stage,code:profile.displayCode},
   normalProgress:{level:startState.player.level,statPoints:profile.points,player:{hp:startState.player.maxHp,atk:startState.player.atk,def:startState.player.def,spd:startState.player.spd},equipped:equippedForReport,armorPurchase:armorPurchase?{...armorPurchase,goldSource:'進行済みステージの通常敵報酬から80Gを保持'}:null,goldAtEntry:startState.player.gold,ownedFirstClearWeapons:priorFirstClears,cost:`${startState.usedCost}/${startState.costCap}`,items:startState.ownedItemCount,skills:startState.ownedSkillCount},
   enemySpawns:final.enemySpawns,answerPattern:scenario.label,scriptedThinkDelayMs,elapsedMs:Date.now()-started,
   attempts:attempts.length,correct:attempts.filter(item=>item.outcome==='correct').length,wrong:attempts.filter(item=>item.outcome==='wrong').length,enemyTurns:attempts.reduce((n,item)=>n+item.enemyActions,0),hpLost:attempts.reduce((n,item)=>n+Math.max(0,item.playerHpBefore-item.playerHpAfter),0),
   turnLog:attempts.map(({battleId,outcome,enemyName,enemyHpBefore,enemyHpAfter,playerHpBefore,playerHpAfter,enemyActions,incomingDamage})=>({battleId,outcome,enemyName,enemyHpBefore,enemyHpAfter,playerHpBefore,playerHpAfter,enemyActions,incomingDamage})),
   levelUpHealing:final.levelUpHealing-startState.levelUpHealing,finalState:final.gameOver?'defeat':final.stageClear?'stage-clear':'unfinished',finalPlayer:final.player,stageStars:final.stageClearStars,
   stageRecovery:final.stageHpBeforeRecovery?{before:final.stageHpBeforeRecovery.hp,max:final.stageHpBeforeRecovery.max,healed:Math.max(0,final.player.maxHp-final.stageHpBeforeRecovery.hp),after:final.player.hp}:null,
   rewards:final.stageRewards?{gold:final.stageRewards.gold,exp:final.stageRewards.exp,drops:final.stageRewards.drops.map(drop=>({kind:drop.kind,id:drop.id,name:drop.name,count:drop.count,rarity:drop.rarity})),milestones:final.stageRewards.milestoneRewards.map(reward=>({title:reward.title,gold:reward.gold,drops:reward.drops.map(drop=>({kind:drop.kind,id:drop.id,name:drop.name,rarity:drop.rarity}))}))}:{goldEarned:final.player.gold-startState.player.gold,expAwarded:final.expAwarded-startState.expAwarded,drops:[]},
   inventoryAfter:{items:final.ownedItems,equipment:final.ownedEquipment},testProtection:{isTestMode:final.testMode,saveSuppressed:final.savingSuppressed,noOpSaveCalls:final.noopSaveCalls,testSuppliesDisabled:final.suppliesDisabled,challengeSkipVisible:final.testSkipVisible,skipUsed:false,ownedItems:final.ownedItemCount,ownedEquipment:final.ownedEquipment.length,cloudSaveCalls:await page.evaluate(()=>window.normalAdventureQA.cloudSaveCalls())}
  };
  if(final.stageClear){assert.equal(final.stageClearStars,(profile.clears[profile.area]?.[profile.stage]||0)+1,`${profile.label}: stage clear recorded`);assert.ok(result.rewards,'stage rewards captured');await page.locator('#btn-stage-clear-back').click();}
  if(final.gameOver){await page.locator('#btn-gameover-continue').click();await page.locator('#screen-home.active').waitFor({timeout:5000});const home=await page.evaluate(()=>window.normalAdventureQA.state());result.homeRecovery={hp:home.player.hp,maxHp:home.player.maxHp,gold:home.player.gold,exp:home.player.exp,equipped:home.equipped};}
  return result;
 }

 const results=[];
 for(const profile of profilesToRun){for(let index=0;index<scenariosToRun.length;index++){
  const scenario=scenariosToRun[index],seed=({early:1100,middle:2200,late:3300}[profile.key])+index;
  const result=await playStage(profile,scenario,seed);results.push(result);
  if(result.finalState==='defeat'){
   const retry=await playStage(profile,{key:'correct-retry',label:'通常画面から同じプロフィールで再挑戦',pattern:['correct']},seed+100,true);
   result.retry={sameInMemoryProfile:true,fixtureReinitialized:false,homeRecovery:result.homeRecovery,start:{hp:retry.normalProgress.player.hp,gold:retry.normalProgress.goldAtEntry,equipped:retry.normalProgress.equipped},finalState:retry.finalState,attempts:retry.attempts,correct:retry.correct,wrong:retry.wrong,hpLost:retry.hpLost,rewards:retry.rewards};results.push(retry);
  }
 }}
 assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);
 for(const result of results)assert.equal(result.testProtection.cloudSaveCalls,0,'CloudSave remains unused');
 console.log(JSON.stringify({method:{profiles:profilesToRun.map(p=>({key:p.key,level:p.level,area:p.area,stage:p.stage,previousClears:p.clears,assignedPoints:p.points,rewardSource:p.rewardSource,purchaseArmor:p.purchaseArmor})),patterns:scenariosToRun.map(s=>({label:s.label,answers:s.pattern})),scriptedThinkDelayMs,noWaitingTimeSkipped:'A fixed 1-second answer delay was applied on every response; challenge timers, combat animations, level-up, reward reveals, kill progression and stage transitions were allowed to run. This is automation pacing, not child solve time.',fixture:'127.0.0.1:5186 offline-only, normal G.isTestMode=false and normal equipment-cost cap retained; only save() is intercepted, test supplies disabled; no real save or CloudSave.'},results},null,2));
}finally{await browser.close();}
