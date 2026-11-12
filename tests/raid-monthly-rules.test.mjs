import assert from 'node:assert/strict';
import {raidJstMonthKey,raidMonthlyBossId,raidMonthlyGlobalDocId,parseRaidMonthlyBossId,raidGlobalDocIdForBossId,isValidRaidBossId} from '../raid_monthly_rules.js';

assert.equal(raidJstMonthKey(Date.parse('2026-10-31T14:59:59.999Z')),'202610');
assert.equal(raidJstMonthKey(Date.parse('2026-10-31T15:00:00.000Z')),'202611');
assert.equal(raidMonthlyBossId('202611',50),'boss_m202611_50');
assert.equal(raidMonthlyGlobalDocId('202611'),'month_202611');
assert.deepEqual(parseRaidMonthlyBossId('boss_m202611_60'),{periodKey:'202611',bossLevel:60});
assert.equal(parseRaidMonthlyBossId('boss_60'),null);
assert.equal(raidGlobalDocIdForBossId('boss_m202611_50'),'month_202611');
assert.equal(raidGlobalDocIdForBossId('boss_50'),'currentBoss');
assert.ok(isValidRaidBossId('boss_m202611_50'));
assert.ok(isValidRaidBossId('boss_50_final_1793500000000'));
assert.ok(!isValidRaidBossId('boss_m202611_50/extra'));
assert.throws(()=>raidMonthlyBossId('202613',50));
assert.throws(()=>raidMonthlyGlobalDocId('../bad'));
console.log('PASS: JST month boundaries and isolated monthly raid identities');
