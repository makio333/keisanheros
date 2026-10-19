import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {raidRankCoins} from '../economy.js';

// Run the production API with serialized, in-memory Firestore transactions.
const documents = new Map();
let queue = Promise.resolve();
let now = Date.now();
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
const source = fs.readFileSync(new URL('../firebase_init.js', import.meta.url), 'utf8');
vm.runInContext(source.slice(source.indexOf('window.RaidBossAPI =')), context);
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
assert.equal(threeChallenges.challenge2EquipTenCount, 1, 'The second challenge grants one equipment 10-pull ticket');
assert.equal(threeChallenges.challenge3SkinTicketCount, 1, 'The third challenge grants one background skin ticket');
assert.equal(JSON.parse(documents.get('saves/a').gameData).equipGachaTenPullTickets, 1);
assert.equal(JSON.parse(documents.get('saves/a').gameData).skinGachaTickets, 1);
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
assert.equal(JSON.parse(documents.get('saves/a').gameData).player.gold, 500);

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

assert.equal(JSON.parse(documents.get('saves/a').gameData).raidCoins,50,'first place coin reward is paid once');
assert.equal(JSON.parse(documents.get('saves/b').gameData).raidCoins,30,'second place archived coin reward');
const old=documents.get('raidClaims/a_boss_50');documents.delete('raidCoinRankClaims/a_boss_50');const oldState=JSON.parse(documents.get('saves/a').gameData);oldState.raidCoins=0;documents.set('saves/a',{gameData:JSON.stringify(oldState)});await api.settleReward('a','boss_50',state);await api.settleReward('a','boss_50',state);assert.equal(JSON.parse(documents.get('saves/a').gameData).raidCoins,50,'legacy rank payouts receive coins exactly once');

// Removed legacy scores never return through an old browser cache; a new fight may score again.
const activeBoss=global().bossId;documents.set('raidRankings_'+activeBoss+'/removed',{slotKey:'removed',playerName:'Removed',totalDamage:0,legacyDamage:1023,excludedFromRanking:true,participated:false});
await api.syncPlayer('removed',profile,{bossId:activeBoss,participated:true,legacyDamage:1023});assert.equal(documents.get('raidRankings_'+activeBoss+'/removed').totalDamage,0);assert.ok(!(await api.getRankings(activeBoss)).some(row=>row.slotKey==='removed'));
await api.syncPlayer('removed',profile,{bossId:activeBoss,participated:true,legacyDamage:1023,events:[{id:'new-valid-fight',bossId:activeBoss,damage:4}]});assert.equal(documents.get('raidRankings_'+activeBoss+'/removed').totalDamage,4);assert.ok((await api.getRankings(activeBoss)).some(row=>row.slotKey==='removed'));
const totalBefore=global().totalDamageDealt;await api.syncPlayer('wrong-boss',profile,{legacyDamage:9999,participated:true});assert.equal(global().totalDamageDealt,totalBefore,'unscoped old scores cannot migrate to a newer boss');
