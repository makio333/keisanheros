import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
let now=Date.parse('2026-10-20T23:59:59+09:00'),rolls=0,won=0;
const c=vm.createContext({Date:class extends Date{static now(){return now;}},G:{halloweenEvent:{},player:{gold:0},raidTickets:0},explore:null,Math,
 getDefaultAreaDifficultyMultiplier:()=>1,save(){},startBattle(){},choosePickupStage:()=>null,AREA_STAGES:{area1:{stages:[{}]}},
 showKillProgressPopup:(_from,_to,_total,cb)=>cb(),totalMaxHp:()=>30,totalMaxMp:()=>10,stageClearRewardsHtml:()=>'',bindDropItemTooltips(){},
 document:{createElement:()=>({querySelector:()=>({})}),body:{appendChild(){}}},
 blog(){},SM:{playBGM(){}},$:()=>({}),renderBattleProgressStars(){},updateBattleBars(){},resumeBattle(){},
 rnd:min=>min,grantExp:()=>({leveledUp:false}),rollBattleDrops(){rolls++;return [{kind:'halloween-candy',count:1}];},winBattle(){won++;c.battle.over=true;}
});
vm.runInContext(source.slice(source.indexOf('const HALLOWEEN_EVENT ='),source.indexOf('const PICKUP_STAGE_MAP =')),c);
assert.equal(c.halloweenSeason(),1);c.startHalloweenChallenge({areaId:'area1',stageIndex:0});const oldRun=c.explore;
now=Date.parse('2026-10-21T00:00:00+09:00');assert.equal(c.halloweenSeason(),2);
assert.equal(c.generateHalloweenParty(oldRun),null,'season freezes at entry');
c.startHalloweenChallenge({areaId:'area1',stageIndex:0});assert.equal(c.explore.halloweenSeason,1);
c.startHalloweenSeason2Challenge('night-party');assert.equal(c.halloweenEncounterTotal(c.explore),5);
const party=c.generateHalloweenParty(c.explore);assert.equal(party.length,10);assert.equal(new Set(party.map(e=>e.partyId)).size,10);
assert.equal(party.some(e=>e.isBoss),false);
for(const enemy of party)assert.ok(fs.existsSync(new URL('../'+enemy.emoji,import.meta.url)));
c.battle={enemies:party,enemy:party[0],over:false};const run=c.explore;
for(let i=0;i<4;i++){
 c.battle.enemies.forEach(e=>e.hp=0);c.battle.halloweenAnswerOutcome={correct:true,submitted:true};c.finishHalloweenSeason2Action();
 assert.equal(c.explore,run);assert.equal(run.halloweenAnswers,i+1);
 assert.equal(c.battle.enemies.filter(e=>e.hp>0).length,10,'choices replenished even after all ten die');
 assert.equal(c.battle.enemies.filter(e=>e.isBoss).length,i===3?1:0,'boss only on last star');
}
assert.equal(won,0);assert.equal(rolls,4,'four normal rolls regardless of kill count');
c.finishHalloweenSeason2Action();assert.equal(run.halloweenAnswers,4);assert.equal(rolls,4,'no-question callback cannot grant loot');
c.battle.enemies.find(e=>e.isBoss).hp=0;c.battle.halloweenAnswerOutcome={correct:true,submitted:true};c.finishHalloweenSeason2Action();
assert.equal(won,1);c.finishHalloweenSeason2Action();assert.equal(won,1);
c.proceedHalloweenBattle();assert.equal(c.explore,null);assert.equal(c.G.halloweenEvent.halloween_2026.season2StageClears['night-party'],1);
assert.equal(c.G.halloweenEvent.halloween_2026.clears,0);assert.equal(c.G.raidTickets,0);
now=Date.parse('2026-10-14T12:00:00+09:00');assert.equal(c.startHalloweenSeason2Challenge('candy-path'),false);
assert.equal(c.startHalloweenSeason2Challenge('candy-path',true),true);assert.equal(c.halloweenEncounterTotal(c.explore),5);
c.battle={enemies:c.generateHalloweenParty(c.explore),over:false};c.battle.enemy=c.battle.enemies[0];
c.battle.halloweenAnswerOutcome={correct:false,submitted:false};c.finishHalloweenSeason2Action();assert.equal(c.explore.halloweenAnswers,0,'timeout is not an answer');
c.battle.halloweenAnswerOutcome={correct:false,submitted:true};c.finishHalloweenSeason2Action();assert.equal(c.explore.halloweenAnswers,1);assert.equal(rolls,4,'wrong answer has no loot');
c.startHalloweenSeason2Challenge('moon-square',true);assert.equal(c.halloweenEncounterTotal(c.explore),5);
assert.equal(c.startHalloweenSeason2Challenge('invalid-stage',true),false);now=Date.parse('2026-11-01T00:00:00+09:00');assert.equal(c.isHalloweenActive(),false);
let finalRolls=0,exp=0;
const r=vm.createContext({battle:{enemies:[{exp:5},{name:'boss',exp:12,goldMin:3,goldMax:6}]},G:{player:{gold:0}},explore:{isHalloween:true,halloweenSeason:2,stageMode:true},endBattleLoop(){},rnd:min=>min,rollBattleDrops(){finalRolls++;return [];},grantExp(n){exp+=n;return {leveledUp:false};},save(){},playItemRevealSequence(){}});
r.battle.enemy=r.battle.enemies[1];vm.runInContext(source.slice(source.indexOf('function winBattle(){'),source.indexOf('/* db.emoji')),r);
r.winBattle();r.winBattle();assert.equal(finalRolls,1,'boss only, not all ten enemies');assert.equal(exp,12);
console.log('PASS: ten persistent targets, answer progress, last-star boss, timeout, four normal + one boss loot cap, release gate and once-only completion');
