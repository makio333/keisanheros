import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Run the production API with serialized, in-memory Firestore transactions.
const documents = new Map();
let queue = Promise.resolve();
const copy = value => structuredClone(value);
const context = {
  window: {}, db: {}, console, Date, JSON,
  slotKeyToDocId: encodeURIComponent,
  doc: (_db, collection, id) => `${collection}/${id}`,
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
const rank = key => documents.get(`raidRankings/${encodeURIComponent(key)}`);
const global = () => documents.get('raidGlobal/currentBoss');

await api.syncPlayer('a', profile, { participated: true });
assert.equal(rank('a').totalDamage, 0, 'Participation without damage is recorded');
await Promise.all([
  api.syncPlayer('a', profile, { legacyDamage: 200 }),
  api.syncPlayer('a', profile, { legacyDamage: 200 })
]);
assert.equal(global().totalDamageDealt, 200, 'Cloned legacy scores are imported once');
await Promise.all([
  api.syncPlayer('a', profile, { events: [{ id: 'battle-a', damage: 500 }] }),
  api.syncPlayer('b', profile, { events: [{ id: 'battle-b', damage: 400 }] }),
  api.syncPlayer('a', profile, { events: [{ id: 'battle-a', damage: 500 }] })
]);
assert.equal(global().totalDamageDealt, 1100);
assert.equal(rank('a').totalDamage, 700);
assert.equal(rank('b').totalDamage, 400);
assert.ok(global().defeatedAt);

const state = { playerName: 'Test Hero', player: { lvl: 7, gold: 20 } };
const rewards = await Promise.all([
  api.settleReward('a', 'boss1', state, game => { game.player.gold += 500; }),
  api.settleReward('a', 'boss1', state, game => { game.player.gold += 500; })
]);
assert.equal(rewards.filter(result => !result.alreadyClaimed).length, 1);
assert.equal(JSON.parse(documents.get('saves/a').gameData).player.gold, 520);
assert.equal(await api.sendCheer('a', 'b', '2026-10-04'), true);
assert.equal(await api.sendCheer('a', 'b', '2026-10-04'), false);
assert.equal(await api.receiveCheers('b', state), 50);
assert.equal(await api.receiveCheers('b', state), 0);
assert.equal(JSON.parse(documents.get('saves/b').gameData).player.gold, 70);
console.log('PASS: participation, legacy migration, concurrent damage, replay, reward and cheers');
