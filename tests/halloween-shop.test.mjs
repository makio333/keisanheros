import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
let now = Date.parse('2026-10-13T12:00:00+09:00'), clearCount=100, review={areaId:'area1',stageIndex:0};
const context=vm.createContext({
 G:{halloweenCandy:300,halloweenTickets:2,player:{gold:4000},nextUid:1},explore:null,
 Date:class extends Date {static now(){return now;}},
 Math:Object.create(Math),rnd:(min)=>min,save(){},updateHud(){},
 rewardSettings:{repeatThreshold:3},stageTotalClearCount:()=>clearCount,
 choosePickupStage:()=>review,stageDropDifficulty:()=>1,
 AREA_STAGES:{area1:{stages:[{},{}]},area13:{stages:[{}]},area2:{stages:[{},{}]}},
 getDefaultAreaDifficultyMultiplier:()=>1,startBattle(){},
});
vm.runInContext(source.slice(source.indexOf('const HALLOWEEN_EVENT ='),source.indexOf('const PICKUP_STAGE_MAP =')),context);
const exchange=vm.runInContext('HALLOWEEN_EXCHANGE_PRIZES',context), pool=vm.runInContext('HALLOWEEN_GACHA_PRIZES',context);
assert.equal(pool.length,9);
assert.equal(exchange.length,4);
assert.equal(exchange.filter(p=>p.kind==='skin').length,2);
assert.equal(new Set([...exchange,...pool].map(p=>p.id)).size,13,'exchange and gacha catalogs are disjoint');
const heroesBlock=source.slice(source.indexOf('const HERO_AVATARS'),source.indexOf('const INITIAL_AVATAR_IDS'));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const id of ['btn-gacha-tab-halloween','halloween-gacha-section']) assert.ok(html.includes('id="'+id+'"'),'Halloween tab has its real DOM control: '+id);
assert.match(heroesBlock,/halloween_festival_king[^\n]*gender:'male'/);
assert.match(heroesBlock,/halloween_festival_queen[^\n]*gender:'female'/);
for(const name of ['HERO_AVATARS','AVATAR_BACKGROUNDS','HALLOWEEN_EQUIP_DB']) {
  const start=source.indexOf('const '+name+' =');
  const end=source.indexOf('\n];',start)+3;
  const catalog=vm.runInNewContext(source.slice(start,end)+'\n'+name);
  for(const prize of [...exchange,...pool]) {
    const entry=catalog.find(value=>value.id===prize.id);
    if(entry) assert.ok(fs.existsSync(new URL('../'+(entry.image || entry.emoji),import.meta.url)),'prize artwork saved: '+prize.id);
  }
}
assert.equal(context.exchangeHalloweenPrize(pool[0].id).ok,false,'gacha items cannot be purchased in exchange');
assert.equal(context.G.halloweenCandy,300);
assert.equal(context.exchangeHalloweenPrize(exchange[0].id).ok,true);
assert.equal(context.G.halloweenCandy,200);
assert.equal(context.exchangeHalloweenPrize(exchange[0].id).ok,false,'duplicate exchange is free of charges');
assert.equal(context.G.halloweenCandy,200);
context.G.halloweenCandy=0;
assert.equal(context.exchangeHalloweenPrize(exchange[1].id).ok,false);
assert.equal(context.drawHalloweenGacha('ticket',()=>0).prize.id,pool[0].id);
assert.equal(context.G.halloweenTickets,1);assert.equal(context.G.player.gold,4000);
assert.equal(context.G.halloweenCandy,0,'gacha never spends candy');
assert.equal(context.drawHalloweenGacha('gold',()=>0).prize.id,pool[1].id,'no duplicate skins');
assert.equal(context.G.player.gold,2000);assert.equal(context.G.halloweenTickets,1);
context.G.player.gold=1999;context.G.halloweenTickets=0;
assert.equal(context.drawHalloweenGacha('gold').ok,false);
assert.equal(context.drawHalloweenGacha('ticket').ok,false);
assert.equal(context.G.player.gold,1999);
context.G.halloweenTickets=20;
for(let i=0;i<7;i++)assert.equal(context.drawHalloweenGacha('ticket',()=>0).ok,true);
assert.equal(context.drawHalloweenGacha('ticket').ok,false,'complete collection does not charge');
assert.equal(context.G.halloweenTickets,13);
assert.equal(context.G.ownedEquips.length,3);
assert.equal(context.G.unlockedAvatarBackgrounds.length,3);
context.G.halloweenCandy=80;
assert.equal(context.exchangeHalloweenPrize('halloween_lantern_staff').ok,true);
assert.equal(context.G.ownedEquips.at(-1).rarity,5);
context.explore={stageMode:true,isHalloween:true,areaId:'area1',stageIndex:0};
context.Math.random=()=>0.94;
assert.equal(context.rollHalloweenCandyDrop({isBoss:false}).count,1,'event candy drops never decrease on repeated challenges');
context.Math.random=()=>0.95;
assert.equal(context.rollHalloweenCandyDrop({isBoss:false}),null);
context.Math.random=()=>0.999;
assert.equal(context.rollHalloweenCandyDrop({isBoss:true}).count,3);
assert.equal(context.rollHalloweenTicketDrop({isBoss:true}),null,'boss ticket is no longer guaranteed');
context.Math.random=()=>0.49;
assert.equal(context.rollHalloweenTicketDrop({isBoss:true}).count,1);
context.Math.random=()=>0.5;
assert.equal(context.rollHalloweenTicketDrop({isBoss:true}),null);
context.Math.random=()=>0.09;
assert.equal(context.rollHalloweenTicketDrop({isBoss:false}).count,1);
context.Math.random=()=>0.1;assert.equal(context.rollHalloweenTicketDrop({isBoss:false}),null);
context.Math.random=()=>0;
context.rnd=(_min,max)=>max;
assert.equal(context.rollHalloweenCandyDrop({isBoss:false}).count,2);
assert.equal(context.rollHalloweenCandyDrop({isBoss:true}).count,4);
context.rnd=min=>min;
context.explore.isHalloween=false;
assert.equal(context.rollHalloweenTicketDrop({isBoss:true}),null,'Halloween tickets only drop in the event');
context.Math.random=()=>0.2;assert.equal(context.rollHalloweenCandyDrop({isBoss:false}),null,'normal repeats reduce candy chance');
clearCount=0;assert.equal(context.rollHalloweenCandyDrop({isBoss:false}).count,1);
context.G.halloweenEvent={};
context.startHalloweenChallenge();
const initial=context.generateHalloweenEnemy(context.explore);
assert.equal(context.explore.stageIndex,0);
context.grantHalloweenClearReward();
review={areaId:'area2',stageIndex:1};
const next=context.halloweenChallengeSource();
assert.equal(next.areaId,'area1');assert.equal(next.stageIndex,1,'progress from frozen first source');
context.startHalloweenChallenge();
assert.equal(context.explore.halloweenLevel,1);
const strengthened=context.generateHalloweenEnemy(context.explore);
assert.equal(strengthened.hp,Math.round(initial.hp*1.1));
assert.equal(strengthened.spd,initial.spd*1.1);
assert.equal(context.halloweenChallengeSource().stageIndex,1,'retries do not advance');
context.grantHalloweenClearReward();
assert.equal(context.halloweenChallengeSource().areaId,'area13','next area follows the raid curriculum');
context.startHalloweenChallenge();
assert.equal(context.generateHalloweenEnemy(context.explore).hp,Math.round(initial.hp*1.1**2),'enemy scaling remains based on the initial area');
context.G.halloweenEvent.halloween_2026.clears=999;
assert.equal(context.halloweenChallengeSource().areaId,'area2');
assert.equal(context.halloweenChallengeSource().stageIndex,1,'hardest problem retained after curriculum exhaustion');
now=Date.parse('2026-11-01T00:00:00+09:00');
assert.equal(context.rollHalloweenCandyDrop({isBoss:true}),null);
assert.equal(context.rollHalloweenTicketDrop({isBoss:true}),null);
assert.equal(context.exchangeHalloweenPrize(exchange[1].id).ok,false);
assert.equal(context.drawHalloweenGacha('ticket').ok,false);
context.battle={enemy:{isBoss:false}};context.explore={isHalloween:true};
vm.runInContext(source.slice(source.indexOf('function bgmKeyForScreen('),source.indexOf('function ',source.indexOf('function bgmKeyForScreen(')+10)),context);
assert.equal(context.bgmKeyForScreen('screen-battle'),'bgm_halloween_normal');
context.battle.enemy.isBoss=true;
assert.equal(context.bgmKeyForScreen('screen-battle'),'bgm_halloween_boss');
console.log('PASS: exclusive catalogs, two genders, consumption, ticket/gold draws, duplicate prevention, drop rates and stage-by-stage progression');
