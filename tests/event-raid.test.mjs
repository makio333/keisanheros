import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {EVENT_RAID_RULES,EVENT_RAID_BONUSES,EventRaidRun,eventRaidTargetCount,sampleEventRaidTargets,rankEventRaidRecords,eventRaidRewardEntitlements,eventRaidBonusEntitlements,eventRaidGaugeRatio,formatEventRaidTime} from '../event_raid.js';

for(const [ms,count] of [[0,4],[10000,4],[10001,3],[20000,3],[20001,2],[30000,2],[90000,2]]) assert.equal(eventRaidTargetCount(ms),count);
const run=new EventRaidRun(1000,EVENT_RAID_RULES,()=>0.99);
assert.equal(run.endsAt,121000); assert.equal(run.enemies.length,7);
assert.ok(run.enemies.every(enemy=>enemy.monsterIndex===6),'random enemies never select boss index seven');
const growth=new EventRaidRun(1000,EVENT_RAID_RULES,()=>0);
assert.deepEqual([growth.enemies[0].hp,growth.enemies[0].atk,growth.enemies[0].def],[10,2,0]);
const survivor=growth.enemies[1];survivor.hp=6;
growth.hit(growth.enemies[0],1100,10);growth.refill();
assert.deepEqual([growth.enemies[0].hp,growth.enemies[0].atk,growth.enemies[0].def,growth.enemies[0].level],[15,3,1,2]);
assert.equal(survivor.hp,6,'survivors do not heal when another enemy dies');
assert.equal(survivor.level,1,'survivors retain their original visible level');
for(const kills of [5,10,25,50]) {growth.kills=kills;const enemy=growth.spawn(0);assert.deepEqual([enemy.hp,enemy.atk,enemy.def,enemy.level],[10+5*kills,2+kills,kills,kills+1]);}
for(let i=0;i<5;i++) {run.beginQuestion(1000);const answer=run.answer(true,1100,()=>0);assert.equal(answer.targets.length,4);assert.equal(answer.special,false);assert.equal(new Set(answer.targets).size,4);assert.equal(run.answer(true,1100),null,'double submission is ignored');}
assert.equal(run.charge,5);
run.beginQuestion(2000); assert.equal(run.answer(false,3000).correct,false);assert.equal(run.charge,5,'wrong answers retain ready charge');
run.beginQuestion(3000);const special=run.answer(true,3300,()=>0.99);assert.equal(special.targets.length,7);assert.equal(special.special,true);assert.equal(run.charge,0);
assert.equal(run.kills,0); for(const enemy of special.targets) {run.hit(enemy,3500,5);assert.equal(enemy.hp,5);assert.equal(run.kills,0,'hits are not kills');}
for(const enemy of special.targets) run.hit(enemy,3600,5);
assert.equal(run.kills,7); for(const enemy of special.targets) run.hit(enemy,3600,5);assert.equal(run.kills,7,'deaths count once');
const dead=special.targets[0];run.refill();assert.equal(run.enemies.filter(enemy=>enemy.hp>0).length,7);assert.equal(new Set(run.enemies.map(enemy=>enemy.spawnId)).size,7);assert.equal(run.hit(dead,3700,5),false,'stale targets cannot score after replacement');
assert.equal(sampleEventRaidTargets(run.enemies.slice(0,3),7).length,3);
for(let i=0;i<100;i++) assert.equal(new Set(sampleEventRaidTargets(run.enemies,7).map(enemy=>enemy.partyId)).size,7);
run.beginQuestion(121000);assert.equal(run.answer(true,121000),null);assert.equal(run.hit(run.enemies[0],121000,5),false,'no hit after deadline');
assert.equal(run.end(),true);assert.equal(run.end(),false);assert.equal(run.answer(true,120000),null);
assert.deepEqual(rankEventRaidRecords([{slotKey:'c',bestKills:9},{slotKey:'a',bestKills:15},{slotKey:'b',bestKills:15}]).map(row=>row.rank),[1,1,3]);
assert.deepEqual(eventRaidRewardEntitlements(50,'2026-10-14'),{'participation:2026-10-14':2,'kills:5':5,'kills:10':10,'kills:20':20,'kills:30':30,'kills:50':50});
assert.deepEqual(eventRaidRewardEntitlements(4,'2026-10-99'),{});
assert.equal(EVENT_RAID_BONUSES.reduce((n,row)=>n+(row.halloweenTickets || 0),0),3,'Halloween ticket bonuses total three');

// Exercise the production question UI: gauge, actual attacks, old callbacks and death.
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
class Element {
  children=new Map(); style={}; attrs={}; html='';
  classList={add(){},remove(){},toggle(){}};
  set innerHTML(value){this.html=value;this.children=new Map();}
  get innerHTML(){return this.html;}
  querySelector(key){if(!this.children.has(key))this.children.set(key,new Element());return this.children.get(key);}
  setAttribute(key,value){this.attrs[key]=value;}
  insertAdjacentHTML(_position,value){this.html+=value;}
  nodes=[];
  appendChild(node){if(node.parentNode)node.remove();node.parentNode=this;this.nodes.push(node);}
  insertBefore(node){this.appendChild(node);}
  closest(selector){let node=this;while(node){if(selector==='.event-raid-status'&&node.className?.includes('event-raid-status'))return node;node=node.parentNode;}return null;}
  remove(){if(this.parentNode)this.parentNode.nodes=this.parentNode.nodes.filter(node=>node!==this);this.parentNode=null;}
}
const elements=new Map(), element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const uiStart=Date.parse('2026-10-14T12:00:00+09:00');
let now=uiStart, delayed=[], pendingTimeouts=[], saved=0, menuMessage='';
function flushAttacks(){while(pendingTimeouts.length)pendingTimeouts.shift().fn();}
const uiRun=new EventRaidRun(now,EVENT_RAID_RULES,()=>0);
const context=vm.createContext({EVENT_RAID_RULES,EventRaidRun,eventRaidTargetCount,eventRaidRewardEntitlements,eventRaidBonusEntitlements,eventRaidGaugeRatio,formatEventRaidTime,Math,
 Date:class extends Date{static now(){return now;}},currentChallenge:null,eventRaidMenuMode:'math',
 G:{player:{hp:10,lvl:1},halloweenCandy:0,ownedEquips:[],equipment:{}},currentSlotKey:'qa',
 explore:{isEventRaid:true,eventRaid:uiRun},battle:{enemies:uiRun.enemies,enemy:uiRun.enemies[0],over:false},
 $:element,document:{createElement:()=>new Element(),querySelector(selector){return selector==='.event-raid-status'?element('screen-battle').nodes.find(node=>node.className==='event-raid-status event-raid-side') || null:null;}},setInterval(fn){delayed.push(fn);return fn;},clearInterval(){},setTimeout(fn,ms){pendingTimeouts.push({fn,ms});},
 destroyChallenge(){context.currentChallenge?.destroy();context.currentChallenge=null;},hideBattleMenus(){},renderHalloweenParty(){},updateBattleBars(){},blog(){},playPlayerAttackAnim(){},playEnemyAttackAnim(){},flashScreenRed(){},spawnFloatingDamage(){},
 SM:{play(){},playBeep(){}},CM:{stop(){}},showHome(){},showEventRaidMenu(message){menuMessage=message;},save(){saved++;},
 halloweenCandyBalance(game){return game.halloweenCandy || 0;},eventRaidState(){return context.state;},state:{bestKills:0},
 eventRaidEnemy(e){return e;},eventRaidProfile(kills){return {bestKills:kills};},
 getOrGenerateTurnProblem(){return {problem:{text:'既存チャレンジの問題',answer:5},timeLimit:30000};},
 getChallengePrompt(){return '答えを入力しよう';},isKanjiProblem(){return false;},halloweenChallengeSource(){return {areaId:'area14',stageIndex:3};},
 AREA_STAGES:{area1:{stages:[{}]},area2:{stages:[{},{}]},area14:{stages:[{},{},{},{}]}},raidReviewCandidates(){return [];},stageDropDifficulty(_area,stage){return stage;},
 startChallenge(_container,opts,callback){context.questionCallback=callback;context.challengeOptions=opts;}
 ,effectiveAtk:()=>5,basicAttackDamage:atk=>atk,equippedAncientIds:()=>new Set(),equippedAbilities:()=>new Set(),calcSpdRate:()=>0,totalStat:()=>0,ancientCritBonus:()=>0,
 BALANCE:{atkMinRatio:.3,timeBonus:.2,critMult:2},renderEventRaidBattleHud(){},ancientDamageReduction:damage=>damage,playEventRaidUltimate(){}
});
vm.runInContext(source.slice(source.indexOf('function applyEventRaidRewards('),source.indexOf('async function syncEventRaidRecord(')),context);
vm.runInContext(source.slice(source.indexOf('const EVENT_RAID_MATH_AREA_IDS='),source.indexOf('function eventRaidEnemy(')),context);
for(let grade=1;grade<=6;grade++)context.AREA_STAGES['area'+(grade+4)]={name:grade+'年漢字',stages:Array.from({length:5},(_,i)=>({name:'ステージ'+i,generateProblem:()=>({tier:'kanji_g'+grade+'_'+(i+1),answer:'いち'})}))};
for(const [answers,areaId,stageIndex,grade]of [[0,'area5',0,1],[4,'area5',0,1],[5,'area5',1,1],[24,'area5',4,1],[25,'area6',0,2],[125,'area10',0,6],[145,'area10',4,6],[999,'area10',4,6]]) {
 const stage=context.eventRaidKanjiSource(answers);assert.equal(stage.areaId,areaId);assert.equal(stage.stageIndex,stageIndex);assert.equal(stage.grade,grade);
}
assert.equal(context.eventRaidChallengeSource().areaId,'area1','kana-only records fall back to math');
context.raidReviewCandidates=()=>[{areaId:'area14',stageIndex:3},{areaId:'area2',stageIndex:1}];
assert.equal(context.eventRaidChallengeSource().areaId,'area2','filters kana out of raid review candidates');
context.raidReviewCandidates=()=>[];context.G.studyStats={stageHistory:{area14_3:{total:99},area2_1:{total:4}}};
assert.equal(context.eventRaidChallengeSource().stageIndex,1,'uses attempted math when current challenge is kana');
context.G.studyStats={};
vm.runInContext(source.slice(source.indexOf('function startEventRaidQuestion('),source.indexOf('function showHalloweenSeason2Stages(')),context);
vm.runInContext(source.slice(source.indexOf('function clearEventRaidSidePanel('),source.indexOf('function startEventRaidQuestion(')),context);
context.startEventRaidQuestion();
let gauge=element('event-raid-gauge');
assert.equal(context.challengeOptions.problem.text,'既存チャレンジの問題');assert.equal(context.challengeOptions.showBattleCommands,false);
assert.equal(context.battle.season2Question,null,'enemy numbers are not used as answers');
assert.equal(gauge.attrs['aria-valuenow'],'4');
assert.equal(gauge.querySelector('i').style.width,'100%');
now=uiStart+5000;delayed[0]();assert.equal(gauge.querySelector('i').style.width,'87.5%','blue gauge animates before the target count changes');
now=uiStart+20001;delayed[0]();assert.equal(gauge.attrs['aria-valuenow'],'2');
const beeps=[];context.SM.playBeep=type=>beeps.push(type);
context.challengeOptions.onAnswered(20001,true);assert.deepEqual(beeps,['correct'],'successful answer plays a clear success chime');
let oldQuestion=context.questionCallback;
oldQuestion({success:true,elapsedMs:20001});assert.equal(uiRun.enemies.filter(e=>e.hp===5).length,1,'only the first target is hit immediately');
assert.equal(pendingTimeouts[0].ms,120,'subsequent hits are paced');
flushAttacks();assert.equal(uiRun.enemies.filter(e=>e.hp===5).length,2,'gauge and actual targets agree');
assert.ok(context.battle.eventRaidQuestion);oldQuestion({success:true});assert.equal(uiRun.charge,1,'stale question callbacks are ignored');
context.questionCallback({success:false,elapsedMs:1000});assert.equal(uiRun.charge,1);assert.equal(context.G.player.hp,7);
flushAttacks();uiRun.charge=5;
delayed.at(-1)();
gauge=element('event-raid-gauge');
assert.equal(gauge.attrs['aria-valuenow'],'7');assert.equal(gauge.attrs['aria-valuemax'],'7');
context.questionCallback({success:true,elapsedMs:1000});assert.equal(uiRun.charge,0);
flushAttacks();assert.equal(uiRun.kills*10+uiRun.enemies.reduce((n,e)=>n+e.maxHp-e.hp,0),45,'special deals seven separate hits');
context.G.player.hp=1;context.questionCallback({success:false,elapsedMs:1000});
assert.equal(uiRun.over,true);assert.equal(context.battle,null);assert.equal(context.explore,null);assert.ok(saved);assert.match(menuMessage,/HPが0/);
assert.equal(context.G.halloweenCandy,2,'one daily participation reward');
assert.equal(context.applyEventRaidRewards(context.state,eventRaidRewardEntitlements(50,'2026-10-01')),117);
assert.equal(context.applyEventRaidRewards(context.state,eventRaidRewardEntitlements(50,'2026-10-01')),0);
const legacyRewardState={rewardClaims:{'kills:10':true,'kills:25':true,'kills:50':true,'participation:2026-10-14':true}};
const legacyGame={halloweenCandy:0,items:[],nextUid:1};
assert.equal(context.applyEventRaidRewards(legacyRewardState,eventRaidRewardEntitlements(50,'2026-10-14'),legacyGame),97,'old 18 candy is credited, so only the difference is granted');
assert.equal(context.applyEventRaidRewards(legacyRewardState,eventRaidRewardEntitlements(50,'2026-10-14'),legacyGame),0);
assert.equal(context.applyEventRaidBonuses(legacyRewardState,eventRaidBonusEntitlements(50),legacyGame).length,5);
assert.equal(legacyGame.halloweenTickets,3);assert.equal(legacyGame.skinGachaTickets,1);assert.equal(legacyGame.equipGachaTenPullTickets,1);
assert.equal(legacyGame.items[0].count,6);assert.equal(legacyGame.items[0].id,'cost_seed');
assert.equal(context.applyEventRaidBonuses(legacyRewardState,eventRaidBonusEntitlements(50),legacyGame).length,0,'repeated sync cannot duplicate tickets or seeds');
// Production session timer records once at the deadline, even without an answer.
context.eventRaidMenuRequest=0;context.isHalloweenActive=()=>true;
context.startBattle=()=>{context.battle={enemies:context.explore.eventRaid.enemies,over:false};};
vm.runInContext(source.slice(source.indexOf('function startEventRaidBattle('),source.indexOf('function startEventRaidQuestion(')),context);
delayed=[];pendingTimeouts=[];context.G.player.hp=10;
context.startEventRaidBattle({areaId:'area1',stageIndex:0},'math');const timedRun=context.explore.eventRaid;
assert.equal(element('event-raid-digital-timer').textContent,'02:00');
assert.equal(timedRun.mode,'kanji','event raid always uses kanji even if a legacy math mode is supplied');
assert.equal(context.explore.areaId,'area5');assert.equal(context.explore.stageIndex,0,'starts at the first kanji stage');
now=timedRun.endsAt;const savedBefore=saved;delayed[0]();
assert.equal(timedRun.over,true);assert.equal(context.battle,null);assert.match(menuMessage,/2分間終了/);
assert.equal(saved,savedBefore+1);delayed[0]();assert.equal(saved,savedBefore+1,'late timer callback cannot resubmit the result');
pendingTimeouts=[];const kanaRun=new EventRaidRun(now,EVENT_RAID_RULES,()=>0);
context.explore={isEventRaid:true,eventRaid:kanaRun};context.battle={enemies:kanaRun.enemies,over:false};
context.isKanjiProblem=()=>true;
context.startEventRaidQuestion();
assert.match(element('screen-battle').nodes.at(-1).innerHTML,/event-raid-gauge/,'status appears in the separate side panel');
assert.equal(element('kanji-input-toggle').closest('.event-raid-status'),null,'input mode switch remains with the answer field');
for(const enemy of kanaRun.enemies)enemy.hp=5;
context.questionCallback({success:true,elapsedMs:10000});assert.equal(kanaRun.kills,1,'only first strike is applied');
now=kanaRun.endsAt;flushAttacks();assert.equal(kanaRun.kills,1,'expiry cancels remaining sequential strikes');assert.equal(kanaRun.over,true);
pendingTimeouts=[];const gearedRun=new EventRaidRun(now,EVENT_RAID_RULES,()=>0);
context.explore={isEventRaid:true,eventRaid:gearedRun};context.battle={enemies:gearedRun.enemies,over:false};
context.Math=Object.create(Math);context.Math.random=()=>0;
context.effectiveAtk=()=>20;context.startEventRaidQuestion();context.questionCallback({success:true,elapsedMs:1000,timeFrac:1});
assert.equal(gearedRun.kills,1,'equipped attack power replaces fixed five damage');
assert.equal(element('event-raid-kill-counter').textContent,'1体討伐！');flushAttacks();
assert.equal(gearedRun.kills,4);assert.equal(element('event-raid-kill-counter').textContent,'4体討伐！');
now+=5000;context.renderEventRaidBattleHud(gearedRun);assert.equal(element('event-raid-digital-timer').textContent,'01:55');
for(const enemy of gearedRun.enemies){enemy.hp=100;enemy.maxHp=100;enemy.def=0;}
context.effectiveAtk=()=>5;context.equippedAncientIds=()=>new Set(['anc_w1']);
context.questionCallback({success:true,elapsedMs:1000,timeFrac:0});flushAttacks();
assert.equal(gearedRun.enemies.reduce((sum,e)=>sum+100-e.hp,0),32,'ancient dual swords retain two 0.8-power hits on each target');
for(const enemy of gearedRun.enemies){enemy.hp=100;enemy.def=4;}
context.questionCallback({success:true,elapsedMs:1000,timeFrac:0});flushAttacks();
assert.equal(gearedRun.enemies.reduce((sum,e)=>sum+100-e.hp,0),8,'increased enemy defense reduces actual outgoing damage');
for(const enemy of gearedRun.enemies)enemy.atk=12;
context.G.player.hp=100;context.eventRaidCounterattack(context.battle);assert.equal(context.G.player.hp,82,'higher attack power increases retaliation damage');
context.totalStat=()=>5;context.eventRaidCounterattack(context.battle);assert.equal(context.G.player.hp,69,'player defense mitigates retaliation');
context.HALLOWEEN_MONSTERS=Array.from({length:7},(_,i)=>({name:'enemy'+i,id:'enemy'+i}));
vm.runInContext(source.slice(source.indexOf('function eventRaidEnemy('),source.indexOf('function eventRaidProfile(')),context);
const decorated=growth.spawn(0);context.eventRaidEnemy(decorated);assert.equal(decorated.atk,52);assert.equal(decorated.def,50,'sprite decoration preserves scaled combat stats');
// Kanji starts from grade one every run and advances on five submitted answers.
pendingTimeouts=[];delayed=[];context.G.player.hp=100;context.totalStat=()=>0;
context.startEventRaidBattle(null,'kanji');const kanjiRun=context.explore.eventRaid;
assert.equal(kanjiRun.mode,'kanji');assert.equal(context.explore.areaId,'area5');assert.equal(context.explore.stageIndex,0);
context.explore.usedProblems=new Set(['old']);
context.getOrGenerateTurnProblem=()=>({problem:context.AREA_STAGES[context.explore.areaId].stages[context.explore.stageIndex].generateProblem(),timeLimit:30000});
context.escapeHtml=value=>value;
context.startEventRaidQuestion();assert.equal(context.challengeOptions.problem.tier,'kanji_g1_1');
for(let index=0;index<5;index++){context.questionCallback({success:false,elapsedMs:1000});flushAttacks();}
assert.equal(kanjiRun.answers,5);assert.equal(context.challengeOptions.problem.tier,'kanji_g1_2','wrong answers also count as submitted answers');
assert.equal(context.explore.usedProblems.size,0,'stage transitions reset repeated-question tracking');
kanjiRun.answers=25;context.battle.eventRaidQuestion=null;context.startEventRaidQuestion();assert.equal(context.challengeOptions.problem.tier,'kanji_g2_1');
context.startEventRaidBattle(null,'kanji');assert.equal(context.explore.stageIndex,0);assert.equal(context.explore.areaId,'area5','a new kanji run resets difficulty');
const modeContext=vm.createContext({halloweenEventState:()=>modeContext.eventState,eventState:{raid:{bestKills:30,rewardClaims:{'kills:10':true}}}});
vm.runInContext(source.slice(source.indexOf('const EVENT_RAID_ID ='),source.indexOf('const EVENT_RAID_MATH_AREA_IDS=')),modeContext);
const mathState=modeContext.eventRaidState('math'),kanjiState=modeContext.eventRaidState('kanji');
assert.notEqual(mathState,kanjiState);assert.equal(mathState.bestKills,30);assert.equal(kanjiState.bestKills,0,'separate highest scores for each mode');
assert.notEqual(modeContext.eventRaidId('math'),modeContext.eventRaidId('kanji'),'cloud rankings use separate collections');
assert.equal(kanjiState.rewardClaims['kills:10'],true,'existing reward claims carry over between modes');
kanjiState.rewardClaims['kills:25']=true;assert.equal(modeContext.eventRaidState('math').rewardClaims['kills:25'],true);
modeContext.eventState=JSON.parse(JSON.stringify(modeContext.eventState));
assert.equal(modeContext.eventRaidState('kanji').rewardClaims['kills:10'],true,'shared reward claims survive reload');
assert.equal(formatEventRaidTime(0),'00:00');assert.equal(formatEventRaidTime(59999),'01:00');
assert.equal(eventRaidGaugeRatio(20000),.5);assert.equal(eventRaidGaugeRatio(30000),.5,'two-target minimum remains visible');
console.log('PASS: 120 seconds, 4/3/2 targets, unique random targets, five-charge/seventh-target special, wrong-answer retention, kills only, refill, gauge, stale callbacks, HP end, tied ranks and bounded rewards');
