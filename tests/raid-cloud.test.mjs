import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Run the production API with serialized, in-memory Firestore transactions.
const documents = new Map();
let queue = Promise.resolve();
let now = Date.now();
const copy = value => structuredClone(value);
const context = {
  window: {}, db: {}, console,
  Date: class extends Date { static now() { return now; } }, JSON,
  RAID_SETTLEMENT_MS: 0,
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
const threeChallengeState = { playerName: 'Test Hero', player: { lvl: 7, gold: 0 }, skinGachaTenPullTickets: 0 };
const threeChallenges = await api.syncPlayer('a', profile, { bossId: 'boss_50', events: [
  { id: 'battle-a1', bossId: 'boss_50', damage: 200 },
  { id: 'battle-a2', bossId: 'boss_50', damage: 200 },
  { id: 'battle-a3', bossId: 'boss_50', damage: 100 }
], state: threeChallengeState });
const repeatedMilestones = await api.syncPlayer('a', profile, { bossId: 'boss_50', events: [{ id: 'battle-a3', bossId: 'boss_50', damage: 100 }], state: threeChallengeState });
assert.equal(repeatedMilestones.challenge2SeedCount, null, 'Challenge milestone rewards cannot be claimed twice');
assert.equal(repeatedMilestones.challenge3TicketCount, null, '10-pull ticket cannot be claimed twice');
const finishing = await api.syncPlayer('b', profile, { bossId: 'boss_50', events: [{ id: 'battle-b', bossId: 'boss_50', damage: 400 }] });
assert.ok(finishing.finalizedAt, 'Defeating the boss finalizes it immediately with no waiting window');
assert.equal(global().totalDamageDealt, 1100);
assert.equal(rank('a').totalDamage, 700);
assert.equal(rank('b').totalDamage, 400);
assert.ok(global().defeatedAt);
assert.equal(threeChallenges.challengeCount, 3, 'Unique raid challenge events are counted once');
assert.equal(threeChallenges.challenge2SeedCount, 3, 'The second challenge grants three cost seeds');
assert.equal(threeChallenges.challenge3TicketCount, 1, 'The third challenge grants one 10-pull ticket');
assert.equal(JSON.parse(documents.get('saves/a').gameData).skinGachaTenPullTickets, 1);
assert.equal(JSON.parse(documents.get('saves/a').gameData).items.find(item => item.id === 'cost_seed').count, 3);

const state = { playerName: 'Test Hero', player: { lvl: 7, gold: 20 } };
assert.equal(global().startsAt, now, 'Next boss opens as soon as the boss is defeated');
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
// 旧仕様で「集計中」のまま止まっているデータも、次の同期で即確定する
documents.set('raidGlobal/currentBoss', { bossLevel: 60, bossId: 'boss_60', maxHp: 2000, totalDamageDealt: 2000, defeatedAt: now - 1000, settlesAt: now + 600000, finisherSlotKeys: ['a'], startsAt: null });
documents.set('raidRankings_boss_60/a', { slotKey: 'a', participated: true, totalDamage: 2000 });
const unstuck = await api.syncPlayer('b', profile, { bossId: 'boss_60' });
assert.ok(unstuck.finalizedAt, 'A raid stuck in the old settlement window finalizes on the next sync');
console.log('PASS: participation, legacy migration, concurrent damage, ten-minute finalization, instant next boss, archived results and reward claim-once');
