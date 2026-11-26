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

const {raidActiveGlobalDocId,raidRankingSeason,raidRankingPeriodAllowed,raidMonthEndBoost}=await import('../raid_monthly_rules.js');
const at=text=>Date.parse(text+'+09:00');
assert.equal(raidActiveGlobalDocId(at('2026-11-30T23:59:59')),'month_202611');
assert.equal(raidActiveGlobalDocId(at('2026-12-01T00:00:00')),'month_202611');
assert.equal(raidActiveGlobalDocId(at('2027-01-01T00:00:00')),'month_202611');
assert.equal(raidRankingSeason('202611').label,'初代ランキング');
assert.equal(raidRankingSeason('202612').label,'2026年12月ランキング');
assert.ok(raidRankingPeriodAllowed('202611',at('2027-01-01T00:00:00')));
assert.ok(!raidRankingPeriodAllowed('202702',at('2027-01-01T00:00:00')));
for(const [timestamp,active] of [['2026-11-23T23:59:59',false],['2026-11-24T00:00:00',true],['2026-11-30T23:59:59',true],['2026-12-01T00:00:00',false],['2026-12-24T23:59:59',false],['2026-12-25T00:00:00',true],['2026-12-31T23:59:59',true],['2027-01-01T00:00:00',false],['2027-02-21T00:00:00',false],['2027-02-22T00:00:00',true],['2028-02-23T00:00:00',true]]){
 const boost=raidMonthEndBoost(at(timestamp));assert.equal(boost.active,active,timestamp);assert.equal(boost.multiplier,active?2:1,timestamp);
}
console.log('PASS shared boss continuity, founder/month history, JST 7-day double attack across short and leap months');
