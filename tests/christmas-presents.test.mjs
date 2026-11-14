import test from 'node:test';import assert from 'node:assert/strict';
import {christmasPresentBalance,CHRISTMAS_EXCHANGE_PRIZES,recoverChristmasPresents,exchangeChristmasPrize,christmasEventState} from '../christmas_presents.js';
const fresh=()=>({ownedEquips:[],unlockedSkins:[],unlockedAvatarBackgrounds:['default'],nextUid:1});
test('old saves start at zero and invalid balances are clamped',()=>{assert.equal(christmasPresentBalance({}),0);assert.equal(christmasPresentBalance({christmasPresents:-3}),0);assert.equal(christmasPresentBalance({christmasPresents:'4.9'}),4);assert.equal(christmasPresentBalance({christmasPresents:Infinity}),0);});
test('every event enemy awards presents exactly once; repeat victories do not duplicate',()=>{const g=fresh(),run={isChristmas:true},b={};assert.equal(recoverChristmasPresents(g,run,{},b,()=>0).count,2);assert.equal(g.christmasPresents,2);assert.equal(recoverChristmasPresents(g,run,{},b),null);assert.equal(g.christmasPresents,2);assert.equal(recoverChristmasPresents(g,run,{},{},()=>.999).count,4);assert.equal(run.christmasRecovered,6);assert.equal(christmasEventState(g).recoveredTotal,6);assert.equal(recoverChristmasPresents(g,{}, {},{}),null);});
test('boss recovery has guaranteed 10..15 range and survives serialization',()=>{const g=fresh(),r={isChristmas:true};assert.equal(recoverChristmasPresents(g,r,{isBoss:true},{},()=>0).count,10);assert.equal(recoverChristmasPresents(g,r,{isBoss:true},{},()=>1).count,15);const restored=JSON.parse(JSON.stringify(g));assert.equal(christmasPresentBalance(restored),25);assert.equal(christmasEventState(restored).recoveredTotal,25);});
test('insufficient funds and invalid prize never mutate the save',()=>{const g=fresh(),before=JSON.stringify(g);assert.equal(exchangeChristmasPrize(g,'christmas_santa_helper').ok,false);assert.equal(exchangeChristmasPrize(g,'unknown').ok,false);assert.equal(JSON.stringify(g),before);});
test('skin, background, frame exchanges grant once and subtract only their price',()=>{for(const kind of ['skin','background','decoration']){const p=CHRISTMAS_EXCHANGE_PRIZES.find(p=>p.kind===kind),g=fresh();g.christmasPresents=200;assert.equal(exchangeChristmasPrize(g,p.id).ok,true);assert.equal(g.christmasPresents,200-p.cost);assert.equal(exchangeChristmasPrize(g,p.id).ok,false);assert.equal(g.christmasPresents,200-p.cost);assert.equal(christmasEventState(g).collectedPrizes.length,1);}});
test('equipment is repeatable with unique UIDs and its special ability',()=>{const g=fresh(),p=CHRISTMAS_EXCHANGE_PRIZES.find(p=>p.kind==='equip');g.christmasPresents=100;assert.equal(exchangeChristmasPrize(g,p.id).ok,true);assert.equal(exchangeChristmasPrize(g,p.id).ok,true);assert.equal(g.christmasPresents,100-2*p.cost);assert.equal(g.ownedEquips.length,2);assert.notEqual(g.ownedEquips[0].uid,g.ownedEquips[1].uid);assert.equal(g.ownedEquips[0].ability,p.ability);});

test('five unique encounters, rare Santa can replace one of them',async()=>{
 const {createChristmasEncounters}=await import('../christmas_presents.js');
 const monsters=[...Array.from({length:8},(_,i)=>({id:'normal'+i})),{id:'santa',isBoss:true}];
 const ordinary=createChristmasEncounters(monsters,()=>.99);assert.equal(ordinary.length,5);assert.ok(ordinary.every(m=>!m.isBoss));assert.equal(new Set(ordinary.map(m=>m.id)).size,5);
 const rare=createChristmasEncounters(monsters,()=>0);assert.equal(rare.length,5);assert.equal(rare.filter(m=>m.isBoss).length,1);assert.equal(new Set(rare.map(m=>m.id)).size,5);
 let seed=12345;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 let rareRuns=0;for(let i=0;i<1000;i++)if(createChristmasEncounters(monsters,random).some(m=>m.isBoss))rareRuns++;
 assert.ok(rareRuns>150&&rareRuns<250,String(rareRuns));assert.deepEqual(monsters[0],{id:'normal0'});
});
test('clears advance one reference stage; Santa uses one extra without moving the base',async()=>{
 const {christmasStageAt}=await import('../christmas_presents.js');const stages=[{areaId:'area5',stageIndex:0},{areaId:'area5',stageIndex:1},{areaId:'area6',stageIndex:0}],base=stages[0];
 assert.deepEqual(christmasStageAt(stages,base,0),stages[0]);assert.deepEqual(christmasStageAt(stages,base,1),stages[1]);assert.deepEqual(christmasStageAt(stages,base,1,1),stages[2]);assert.deepEqual(christmasStageAt(stages,base,999),stages[2]);assert.deepEqual(base,stages[0]);
});
test('replay gives one third of presents while normal rewards and once-only grants remain',()=>{
 for(const isBoss of [false,true])for(const roll of [0,.5,.99]){
  const normal=recoverChristmasPresents(fresh(),{isChristmas:true},{isBoss},{},()=>roll);
  const game=fresh(),run={isChristmas:true,christmasReplay:true},encounter={};
  const reduced=recoverChristmasPresents(game,run,{isBoss},encounter,()=>roll);
  assert.equal(reduced.count,Math.max(1,Math.floor(normal.count/3)));
  assert.equal(recoverChristmasPresents(game,run,{isBoss},encounter,()=>roll),null);
 }
});
