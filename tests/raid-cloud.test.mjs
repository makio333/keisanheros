import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {raidRankCoins} from '../economy.js';
import {createGameCloudAPIs} from '../game_cloud_apis.js';
import {raidDamageCoins,grantRaidRun,raidInitialHp} from '../raid_run_rules.js';
import {GHOST_RAID_FRAME,GHOST_RAID_DEFEAT_DECORATION} from '../ghost_raid_content.js';

// Run the production API with serialized, in-memory Firestore transactions.
const documents = new Map();
let queue = Promise.resolve();
let now = Date.parse('2026-10-01T00:00:00+09:00');
const copy = value => structuredClone(value);
const context = {
  window: {}, db: {}, console, raidRankCoins,
  Date: class extends Date { static now() { return now; } }, JSON,
  RAID_SETTLEMENT_MS: 10 * 60 * 1000,
  slotKeyToDocId: encodeURIComponent,
  doc: (_db, collection, id) => `${collection}/${id}`,
  collection: (_db, name) => name,
  query: name => name,
  orderBy: () => {},
  limit: () => {},
  getDocs: async name => {
    const prefix = `${name}/`;
    const rows = [...documents.entries()].filter(([key]) => key.startsWith(prefix));
    return { docs: rows.map(([key, value]) => ({ id: key.slice(prefix.length), data: () => copy(value) })), forEach(fn) { this.docs.forEach(fn); } };
  },
  getDoc: async key => ({ exists: () => documents.has(key), data: () => copy(documents.get(key)) }),
  runTransaction: (_db, callback) => {
    const task = queue.then(async () => {
      const writes = [];
      const result = await callback({
        get: async key => {
          assert.equal(writes.length, 0, 'Firestore reads must precede writes');
          return { exists: () => documents.has(key), data: () => copy(documents.get(key)) };
        },
        set: (key, value, options) => writes.push({ key, value, options })
      });
      for (const { key, value, options } of writes) documents.set(key, copy(options?.merge ? { ...documents.get(key), ...value } : value));
      return result;
    });
    queue = task.catch(() => {});
    return task;
  }
};
vm.createContext(context);
Object.assign(context.window,createGameCloudAPIs({...context,now:()=>now,settlementMs:context.RAID_SETTLEMENT_MS}));
const api = context.window.RaidBossAPI;
const profile = { playerName: 'Test Hero', avatar: 'spellblade', level: 7 };
const rank = (key, boss = 'boss_50') => documents.get(`raidRankings_${boss}/${encodeURIComponent(key)}`);
const global = () => documents.get('raidGlobal/currentBoss');

await api.syncPlayer('a', profile, { participated: true });
assert.equal(rank('a').totalDamage, 0, 'Participation without damage is recorded');
await Promise.all([
  api.syncPlayer('a', profile, { bossId: 'boss_50', legacyDamage: 200 }),
  api.syncPlayer('a', profile, { bossId: 'boss_50', legacyDamage: 200 })
]);
assert.equal(global().totalDamageDealt, 200, 'Cloned legacy scores are imported once');
const threeChallengeState = { playerName: 'Test Hero', player: { lvl: 7, gold: 0 }, equipGachaTenPullTickets: 0, skinGachaTickets: 0 };
const threeChallenges = await api.syncPlayer('a', profile, { bossId: 'boss_50', events: [
  { id: 'battle-a1', bossId: 'boss_50', damage: 200 },
  { id: 'battle-a2', bossId: 'boss_50', damage: 200 },
  { id: 'battle-a3', bossId: 'boss_50', damage: 100 }
], state: threeChallengeState });
await Promise.all([
  api.syncPlayer('b', profile, { bossId: 'boss_50', events: [{ id: 'battle-b', bossId: 'boss_50', damage: 400 }] }),
  api.syncPlayer('a', profile, { bossId: 'boss_50', events: [{ id: 'battle-a1', bossId: 'boss_50', damage: 200 }], state: threeChallengeState })
]);
assert.equal(global().totalDamageDealt, 1100);
assert.equal(rank('a').totalDamage, 700);
assert.equal(rank('b').totalDamage, 400);
assert.ok(global().defeatedAt);
assert.equal(threeChallenges.challengeCount, 3, 'Unique raid challenge events are counted once');
assert.equal(threeChallenges.challenge2EquipTenCount, null, 'No new second-challenge reward');
assert.equal(threeChallenges.challenge3SkinTicketCount, null, 'No new third-challenge reward');
assert.equal(documents.get('saves/a'),undefined,'participation does not write a reward save');

const repeatedMilestones = await api.syncPlayer('a', profile, { bossId: 'boss_50', events: [{ id: 'battle-a3', bossId: 'boss_50', damage: 100 }], state: threeChallengeState });
assert.equal(repeatedMilestones.challenge2EquipTenCount, null, 'Equipment ticket cannot be claimed twice');
assert.equal(repeatedMilestones.challenge3SkinTicketCount, null, 'Background skin ticket cannot be claimed twice');

const state = { playerName: 'Test Hero', player: { lvl: 7, gold: 20 } };
now = global().settlesAt + 1;
const finalized = await api.syncPlayer('a', profile, { bossId: 'boss_50' });
assert.ok(finalized.finalizedAt, 'Defeated raid finalizes after its ten-minute settlement window');
const snapshotProfile = documents.get('raidGlobal/currentBoss').finalRankings.find(row => row.slotKey === 'a');
assert.equal(snapshotProfile.playerName, profile.playerName, 'Final rankings preserve player names');
assert.equal(snapshotProfile.avatar, profile.avatar, 'Final rankings preserve avatars');
assert.equal(snapshotProfile.level, profile.level, 'Final rankings preserve levels');
assert.equal(global().startsAt, now, 'Next boss opens as soon as aggregation finalizes');
const rewards = await Promise.all([
  api.settleReward('a', 'boss_50', state, game => { game.player.gold += 500; }),
  api.settleReward('a', 'boss_50', state, game => { game.player.gold += 500; })
]);
assert.equal(rewards.filter(result => !result.alreadyClaimed).length, 1);
assert.equal(JSON.parse(documents.get('saves/a').gameData).player.gold, 520);

const next = await api.syncPlayer('b', profile, { bossId: 'boss_50', participated: true, legacyDamage: 400, events: [{ id: 'late-old-fight', bossId: 'boss_50', damage: 250 }] });
assert.equal(next.bossId, 'boss_60');
assert.equal(next.settledBossId, 'boss_50');
assert.equal(global().totalDamageDealt, 0, 'Old-boss damage must not leak into the newly unlocked boss');
assert.equal(global().maxHp, 2000);
assert.ok(documents.get('raidHistory/boss_50')?.finalizedAt, 'Previous results are archived for rankings and payouts');
const archivedReward = await api.settleReward('b', 'boss_50', state);
assert.equal(archivedReward.eligible, true, 'Archived rankings remain payable after the next boss starts');
assert.equal(archivedReward.rank, 2);
console.log('PASS: participation, legacy migration, concurrent damage, ten-minute finalization, instant next boss, archived results and reward claim-once');

assert.equal(JSON.parse(documents.get('saves/a').gameData).raidCoins,20,'first place coin reward is paid once');
assert.equal(JSON.parse(documents.get('saves/b').gameData).raidCoins,15,'second place archived coin reward');
const old=documents.get('raidClaims/a_boss_50');documents.delete('raidCoinRankClaims/a_boss_50');const oldState=JSON.parse(documents.get('saves/a').gameData);oldState.raidCoins=0;documents.set('saves/a',{gameData:JSON.stringify(oldState)});await api.settleReward('a','boss_50',state);await api.settleReward('a','boss_50',state);assert.equal(JSON.parse(documents.get('saves/a').gameData).raidCoins,20,'legacy rank payouts receive adjusted coins exactly once');

// Removed legacy scores never return through an old browser cache; a new fight may score again.
const activeBoss=global().bossId;documents.set('raidRankings_'+activeBoss+'/removed',{slotKey:'removed',playerName:'Removed',totalDamage:0,legacyDamage:1023,excludedFromRanking:true,participated:false});
await api.syncPlayer('removed',profile,{bossId:activeBoss,participated:true,legacyDamage:1023});assert.equal(documents.get('raidRankings_'+activeBoss+'/removed').totalDamage,0);assert.ok(!(await api.getRankings(activeBoss)).some(row=>row.slotKey==='removed'));
await api.syncPlayer('removed',profile,{bossId:activeBoss,participated:true,legacyDamage:1023,events:[{id:'new-valid-fight',bossId:activeBoss,damage:4}]});assert.equal(documents.get('raidRankings_'+activeBoss+'/removed').totalDamage,4);assert.ok((await api.getRankings(activeBoss)).some(row=>row.slotKey==='removed'));
const totalBefore=global().totalDamageDealt;await api.syncPlayer('wrong-boss',profile,{legacyDamage:9999,participated:true});assert.equal(global().totalDamageDealt,totalBefore,'unscoped old scores cannot migrate to a newer boss');

// Fixtures only: new November data uses a separate event and cumulative month ranking.
documents.clear();
now=Date.parse('2026-11-01T00:00:00+09:00');
documents.set('raidGlobal/currentBoss',{bossId:'boss_50',bossLevel:50,monsterId:'darkBahamutFinal',maxHp:100000,totalDamageDealt:61234});
documents.set('raidRankings_boss_50/ghost',{slotKey:'ghost',totalDamage:61234,legacyDamage:61234,participated:true});
const firstGhost=await api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:'boss_50',participated:true,legacyDamage:61234,events:[{id:'october-retry',bossId:'boss_50',damage:500}]});
assert.equal(firstGhost.periodKey,'202611');assert.equal(firstGhost.bossId,'boss_m202611_50');assert.equal(firstGhost.maxHp,50000);
assert.equal(documents.get('raidGlobal/currentBoss').totalDamageDealt,61234,'old global state is preserved');
assert.equal(documents.get('raidRankings_boss_50/ghost').totalDamage,61234,'old boss ranking is preserved');
assert.equal(documents.get('raidGlobal/month_202611').totalDamageDealt,0,'October damage does not enter November HP');
assert.equal((await api.getMonthlyRankings('202611')).length,0,'legacy high scores are not fabricated into the November monthly ranking');
assert.equal(raidInitialHp('moonWraith'),50000);

const currentGhost=firstGhost.bossId;
await api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:currentGhost,events:[
  {id:'nov-valid',bossId:currentGhost,damage:19},
  {id:'nov-low',bossId:currentGhost,damage:1},
  {id:'nov-zero',bossId:currentGhost,damage:0},
  {id:'nov-infinity',bossId:currentGhost,damage:Infinity},
  {id:'nov-negative',bossId:currentGhost,damage:-10},
  {id:'nov-string',bossId:currentGhost,damage:'100'}
]});
assert.equal(documents.get('raidGlobal/month_202611').totalDamageDealt,20,'positive low damage counts; zero and invalid values do not');
assert.equal(documents.get(`raidMonthlyRankings_202611/${encodeURIComponent('ghost')}`).totalDamage,20,'monthly ranking accumulates accepted hits');
await Promise.all([
  api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:currentGhost,events:[{id:'nov-valid',bossId:currentGhost,damage:19}]}),
  api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:currentGhost,events:[{id:'nov-valid',bossId:currentGhost,damage:19}]})
]);
assert.equal(documents.get('raidGlobal/month_202611').totalDamageDealt,20,'concurrent retries credit a run once');
assert.equal((await api.getMonthlyRankings('202611'))[0].totalDamage,20);
assert.equal((await api.getRankings(currentGhost))[0].totalDamage,20,'the active boss ranking is scoped to its instance');

await api.syncPlayer('guest',profile,{monsterId:'moonWraith',bossId:currentGhost,events:[{id:'ghost50-guest',bossId:currentGhost,damage:30}]});
const defeatGhost50=await api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:currentGhost,events:[{id:'ghost50-final-hit',bossId:currentGhost,damage:49950}]});
assert.ok(defeatGhost50.defeatedAt,'the boss instance enters settlement after reaching its own HP');
assert.equal((await api.getRankings(currentGhost)).find(row=>row.slotKey==='ghost').totalDamage,49970);
now=defeatGhost50.settlesAt+1;
const finalizedGhost50=await api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:currentGhost});
assert.ok(finalizedGhost50.finalizedAt,'the defeated boss instance finalizes after settlement');
assert.deepEqual(documents.get('raidGlobal/month_202611').finalRankings.map(row=>[row.slotKey,row.totalDamage]),[['ghost',49970],['guest',30]]);
now=finalizedGhost50.finalizedAt+1;
const ghost60=await api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:currentGhost});
assert.equal(ghost60.bossId,'boss_m202611_60','finalization advances to a distinct boss instance');
assert.equal((await api.getRankings(ghost60.bossId)).length,0,'the next boss starts with a clean ranking');
assert.deepEqual((await api.getRankings(currentGhost)).map(row=>[row.slotKey,row.totalDamage]),[['ghost',49970],['guest',30]],'the previous boss ranking remains preserved');
assert.deepEqual(documents.get(`raidHistory/${currentGhost}`).finalRankings.map(row=>[row.slotKey,row.totalDamage]),[['ghost',49970],['guest',30]],'the finalized per-boss order is retained in history');
await api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:ghost60.bossId,events:[{id:'ghost60-run',bossId:ghost60.bossId,damage:123}]});
assert.equal((await api.getRankings(ghost60.bossId))[0].totalDamage,123,'the next instance accumulates only its own damage');
assert.equal((await api.getMonthlyRankings('202611')).find(row=>row.slotKey==='ghost').totalDamage,50093,'the separate monthly aggregate can continue across boss instances');

now=Date.parse('2026-11-30T15:00:00.000Z'); // JST: December 1, 00:00
const firstDecember=await api.syncPlayer('ghost',profile,{monsterId:'moonWraith',bossId:currentGhost,events:[{id:'nov-valid',bossId:currentGhost,damage:19}]});
assert.equal(firstDecember.periodKey,'202612');assert.equal(firstDecember.bossId,'boss_m202612_50');
assert.equal(documents.get('raidGlobal/month_202612').totalDamageDealt,0,'a retry across the month boundary cannot enter December');
assert.equal((await api.getMonthlyRankings('202612')).length,0);
assert.equal((await api.getMonthlyRankings('202611'))[0].totalDamage,50093,'November aggregate remains in its own month across boss instances');

// Synthetic defeated-Ghost payout: all positive-damage participants get the frame, not only the last hitter.
now=Date.parse('2026-12-01T00:01:00+09:00');
const ghostBoss='boss_m202611_50';
documents.set('raidGlobal/month_202611',{bossId:ghostBoss,bossLevel:50,monsterId:'moonWraith',maxHp:50000,totalDamageDealt:50000,defeatedAt:now-1000,settlesAt:now-500,finalizedAt:now-400,finisherSlotKeys:['last'],finalRankings:[{slotKey:'participant',totalDamage:30000},{slotKey:'last',totalDamage:20000}]});
documents.set(`raidRankings_${ghostBoss}/${encodeURIComponent('participant')}`,{slotKey:'participant',totalDamage:30000,participated:true});
documents.set(`raidRankings_${ghostBoss}/${encodeURIComponent('last')}`,{slotKey:'last',totalDamage:20000,participated:true});
const fallback=name=>({playerName:name,player:{lvl:10,gold:0},raidCoins:0,skinGachaTickets:0,items:[],updatedAt:0});
const participantFixture={...fallback('Participant'),unlockedDecorations:[GHOST_RAID_FRAME.id]};
const [participantPayout,lastPayout,participantRetry]=await Promise.all([
  api.settleReward('participant',ghostBoss,participantFixture),
  api.settleReward('last',ghostBoss,fallback('Last hitter')),
  api.settleReward('participant',ghostBoss,fallback('Participant'))
]);
assert.equal(participantPayout.reward.bonusDecoration,GHOST_RAID_DEFEAT_DECORATION.id,'a non-finisher receives the separate commemorative mark');
assert.equal(lastPayout.reward.bonusDecoration,GHOST_RAID_DEFEAT_DECORATION.id,'the last hitter receives the same participation bonus');
assert.equal(participantPayout.reward.finisherBonus,false,'the Ghost King bonus is not a last-hit race');
assert.equal(lastPayout.reward.tickets,1,'the last hit does not add a generic ticket bonus');
assert.equal(participantRetry.alreadyClaimed,true,'the participant reward is idempotent');
const participantSave=JSON.parse(documents.get('saves/participant').gameData);
assert.deepEqual(participantSave.unlockedDecorations,[GHOST_RAID_FRAME.id,GHOST_RAID_DEFEAT_DECORATION.id],'past exchange ownership is retained alongside the distinct participation mark');

const coinGame={raidCoins:0,raidBestSingleDamage:0};
assert.deepEqual(grantRaidRun(coinGame,{id:'coin-run',damage:19,bossId:ghostBoss}),{damage:19,coins:1,bossId:ghostBoss,applied:true});
assert.equal(grantRaidRun(coinGame,{id:'coin-run',damage:19,bossId:ghostBoss}).applied,false);
assert.equal(raidDamageCoins(9),0);assert.equal(coinGame.raidCoins,1,'retry does not duplicate per-hit coins');
console.log('PASS: November isolation, 50k HP, monthly cumulative ranking, retry/concurrency/month-boundary idempotency, per-hit coins and all-participant visual defeat reward');
