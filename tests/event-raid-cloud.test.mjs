import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {applyGiftPayload} from '../economy.js';
import {eventRaidRewardEntitlements,eventRaidBonusEntitlements,EVENT_RAID_FINAL_AT,eventRaidFinalGift} from '../event_raid.js';
import {createGameCloudAPIs} from '../game_cloud_apis.js';
const docs=new Map();let queue=Promise.resolve();
const context=vm.createContext({window:{},db:{},Date,applyGiftPayload,EVENT_RAID_FINAL_AT,eventRaidFinalGift,eventRaidRewardEntitlements,eventRaidBonusEntitlements,slotKeyToDocId:encodeURIComponent,
 doc:(_db,collection,id)=>collection+'/'+id,
 collection:(_db,name)=>name,query:name=>name,orderBy(){},limit(){},
 getDoc:async key=>({exists:()=>docs.has(key),data:()=>structuredClone(docs.get(key))}),
 getDocs:async name=>({docs:[...docs.entries()].filter(([key])=>key.startsWith(name+'/')).map(([,row])=>({data:()=>structuredClone(row)}))}),
 runTransaction:(_db,fn)=>{
  const task=queue.then(async()=>{
   const writes=[];const result=await fn({get:async key=>{assert.equal(writes.length,0);return {exists:()=>docs.has(key),data:()=>structuredClone(docs.get(key))};},set:(key,row)=>writes.push([key,row])});
   for(const [key,row]of writes)docs.set(key,structuredClone(row));return result;
  });queue=task.catch(()=>{});return task;
 }
});
Object.assign(context.window,createGameCloudAPIs({...context,now:()=>context.Date.now()}));
const api=context.window.EventRaidAPI;
const record=(bestKills,day='2026-10-14')=>({bestKills,playerName:'勇者',participationDay:day});
await Promise.all([api.recordBest('event','me',record(25)),api.recordBest('event','me',record(10)),api.recordBest('event','me',record(50))]);
let result=await api.recordBest('event','me',record(2));assert.equal(result.bestKills,50);assert.equal(Object.values(result.rewards).reduce((a,b)=>a+b,0),117);
assert.equal(Object.keys(result.bonuses).length,5);assert.equal(Object.values(result.bonuses).reduce((n,row)=>n+(row.halloweenTickets || 0),0),3);
result=await api.recordBest('event','me',{...record(50),participationDays:['2026-10-14','2026-10-15']});assert.equal(Object.values(result.rewards).reduce((a,b)=>a+b,0),119);
const rows=await api.getRankings('event');assert.equal(rows.length,1);assert.equal(rows[0].bestKills,50);assert.equal(rows[0].totalDamage,undefined);assert.equal(rows[0].rewards,undefined);
assert.equal([...docs.keys()].some(key=>key.startsWith('raidGlobal/')),false);
await assert.rejects(api.recordBest('event','me',record(-1)));
console.log('PASS: isolated event collections, maximum record under concurrent/repeated submissions, daily and milestone reward ledger, offline-day retry and no world-raid damage writes');

const runRecord={...record(7),runs:[{id:'run1',kills:7,finishedAt:Date.now()}]};
await api.recordBest('cumulative','runner',runRecord);await api.recordBest('cumulative','runner',runRecord);
result=await api.recordBest('cumulative','runner',{...record(7),runs:[{id:'run2',kills:5,finishedAt:Date.now()}]});assert.equal(result.totalKills,12,'unique runs accumulate, repeated sync does not');
context.Date=class extends Date{static now(){return EVENT_RAID_FINAL_AT+1;}};
const finalState={player:{gold:0,lvl:1}};
const final=await api.claimFinalReward('cumulative','runner',finalState);assert.equal(final.rank,1);assert.equal(await api.claimFinalReward('cumulative','runner',finalState),null);
const awarded=JSON.parse(docs.get('saves/runner').gameData);assert.equal(awarded.ownedEquips[0].id,'halloween_rank_blade');assert.equal(awarded.unlockedDecorations[0],'rank_gold');
await assert.rejects(api.recordBest('cumulative','runner',record(999)),/締め切/);
