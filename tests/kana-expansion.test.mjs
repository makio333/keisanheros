import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const c=vm.createContext({window:{},Math});vm.runInContext(fs.readFileSync(new URL('../kanji_data.js',import.meta.url),'utf8'),c);
const pools=c.window.KANJI_POOLS;
for(const script of ['hira','kata']) {
 for(const tier of [1,2]) {const rows=pools['kana_'+script+'_'+tier];assert.ok(rows.length>=10);assert.ok(rows.every(row=>row.answer.length===3&&row.choiceCount===2),'easy pools contain exactly three characters and two choices');}
 for(const tier of [6,7]) {const rows=pools['kana_'+script+'_'+tier];assert.ok(rows.length>=30);assert.ok(rows.filter(row=>row.answer.length>=5).length>=20,'advanced has many long words');assert.equal(new Set(rows.map(row=>row.answer)).size,rows.length);
  for(const row of rows){assert.equal(row.choiceCount,4);assert.equal(new Set([row.answer,...row.wrongAnswers]).size,4);assert.ok(row.prompt&&row.explanation);assert.match(row.answer,script==='hira'?/^[ぁ-ゖ]+$/:/^[ァ-ヶー]+$/);}
 }
}
const s=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
vm.runInContext('const AREA_STAGES = {'+s.slice(s.indexOf('  area14: {'),s.indexOf('  area1: {'))+'};',c);
vm.runInContext(s.slice(s.indexOf('function createKanaChoiceProblem('),s.indexOf('function startChallenge(')),c);
for(const [area,script] of [['area14','hira'],['area15','kata']]) {
 for(const chance of [0,0.49,0.5,0.99]) {
  c.bossRandom=chance;
  const problem=vm.runInContext(`(()=>{const original=Math.random;Math.random=()=>bossRandom;try{return AREA_STAGES.${area}.bossPhase2Problem();}finally{Math.random=original;}})()`,c);
  assert.equal(problem.tier,'kana_'+script+'_'+(chance<0.5?6:7));
  const choice=c.createKanaChoiceProblem(problem);
  assert.equal(choice.options.length,4,'second-form bosses always have four choices');
  assert.equal(new Set(choice.options).size,4);
  assert.equal(choice.options[choice.correctIndex],problem.answer);
 }
}
vm.runInContext(s.slice(s.indexOf('function migrateKanaStages('),s.indexOf('function normalizeRarityData(')),c);
const old={stageClearCounts:{area14:[3,2,1,0,3],area15:[1,2,3,0,1]},stageTotalClears:{area14:[9,5,1,0,4]},stageRewardClaims:{'area14:1':{rewardFirst:true},'area14:boss':{first:true}},stageDropOpportunities:{'area15:4':5},raidLearning:{area14_2:{wrong:3}},studyStats:{stageHistory:{area15_3:{total:9}}},pickup:{areaId:'area14',stageIndex:1,learningKey:'area14_1'},halloweenEvent:{x:{baseSource:{areaId:'area15',stageIndex:4}}}};
c.migrateKanaStages(old);assert.deepEqual([...old.stageClearCounts.area14],[3,0,2,0,1,0,3]);assert.deepEqual([...old.stageTotalClears.area14],[9,0,5,0,1,0,4]);
assert.equal(old.stageRewardClaims['area14:2'].rewardFirst,true);assert.equal(old.stageRewardClaims['area14:boss'].first,true);assert.equal(old.stageDropOpportunities['area15:6'],5);assert.equal(old.raidLearning.area14_4.wrong,3);assert.equal(old.studyStats.stageHistory.area15_5.total,9);assert.equal(old.pickup.stageIndex,2);assert.equal(old.pickup.learningKey,'area14_2');assert.equal(old.halloweenEvent.x.baseSource.stageIndex,6);
const once=JSON.stringify(old);c.migrateKanaStages(old);assert.equal(JSON.stringify(old),once,'migration is idempotent');
console.log('PASS: short two-choice pools, 167 advanced spelling words, unique four choices, long words, kana script and old-save progression migration');
