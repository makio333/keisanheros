import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const context = vm.createContext({
  G: {},
  AREA_STAGES: {
    area1: { name:'はじまり', stages: [{name:'1'}, {name:'2'}, {name:'3'}] },
    area11: { name:'高学年', stages: [{name:'1'}, {name:'2'}, {name:'3'}, {name:'4'}, {name:'5'}] },
  },
  stageDropDifficulty: (areaId, index) => (areaId === 'area11' ? 500 : 100) + index,
  getStageClearCounts: areaId => context.G.stageClearCounts?.[areaId] || [],
  stageTotalClearCount: (areaId,index,game=context.G) => Math.max(game.stageClearCounts?.[areaId]?.[index]||0,game.stageTotalClears?.[areaId]?.[index]||0),
});
vm.runInContext(source.slice(source.indexOf('function blueprintChallengeSource('), source.indexOf('function printBlueprintSheet(')), context);
vm.runInContext(source.slice(source.indexOf('const PICKUP_STAGE_MAP ='), source.indexOf('function isValidPickup(')), context);
vm.runInContext(source.slice(source.indexOf('function challengePrintSource('), source.indexOf('function suggestChallengePrintBeforeSave(')), context);
const selection = () => {
  const { areaId, stageIndex } = context.challengePrintSource();
  return { areaId, stageIndex };
};
assert.deepEqual(selection(), { areaId:'area1', stageIndex:0 });
context.G.stageClearCounts = { area1:[1, 1, 0], area11:[1, 0, 0, 0, 0] };
assert.deepEqual(selection(), { areaId:'area11', stageIndex:0 }, 'use the furthest cleared stage without raid recommendations');
context.G.stageTotalClears = { area11:[0, 0, 2] };
assert.deepEqual(selection(), { areaId:'area11', stageIndex:2 }, 'legacy cumulative clear records also count');
const recentHistory = (okValues, start = Date.now()-okValues.length) => okValues.map((ok,index)=>({t:start+index,ok}));
context.G.studyStats = { stageHistory:{
  area1_1:{total:5,history:recentHistory([0,0,1,0,0])},
  area11_2:{total:5,history:recentHistory([1,1,1,1,1])},
} };
assert.deepEqual(selection(), { areaId:'area1', stageIndex:1 }, 'recent low accuracy on a practiced stage takes priority');
context.G.studyStats.stageHistory.area1_1.history = recentHistory([0,0,1]);
assert.deepEqual(selection(), { areaId:'area1', stageIndex:1 }, 'three answers with two wrong is enough to identify a weakness');
context.G.studyStats.stageHistory.area1_1.history = recentHistory([0,1]);
assert.deepEqual(selection(), { areaId:'area11', stageIndex:2 }, 'fewer than three answers is insufficient to label a weakness');
context.G.studyStats.stageHistory.area1_1.history = recentHistory([1,1,1,1,1], Date.now()-100*24*60*60*1000);
assert.deepEqual(selection(), { areaId:'area11', stageIndex:2 }, 'stale low accuracy is not treated as a current weakness');
context.G.stageClearCounts = {};
context.G.stageTotalClears = {};
context.G.studyStats.stageHistory = { area1_1:{total:5,history:recentHistory([1,1,1,1,1])} };
assert.deepEqual(selection(), { areaId:'area1', stageIndex:1 }, 'without a current weakness, select the hardest actually attempted stage, including an uncleared stage');
context.G.stageClearCounts = { area11:[0,0,1] };
context.G.studyStats.stageHistory.area1_1.history = recentHistory([1,1,1]).map(entry=>({...entry,ms:800,limitMs:1000}));
assert.equal(context.recentWeakStudyStageSource().slowStreak,3,'three consecutive answers taking at least 70% of the time limit identify unfamiliarity');
assert.deepEqual(selection(), { areaId:'area1', stageIndex:1 }, 'repeatedly slow but correct answers also get recommended');
context.G.studyStats.stageHistory.area1_1.history[2].ms=500;
assert.equal(context.recentWeakStudyStageSource(),null,'a fast answer resets the consecutive slow streak');
assert.deepEqual(selection(), { areaId:'area11', stageIndex:2 }, 'fast streak reset falls back to the hardest practiced stage');
context.G.studyStats.stageHistory = {};
context.G.raidLearning = { area1_1:{ attempts:4, wrong:2, correct:2, label:'addition' } };
assert.deepEqual(selection(), { areaId:'area1', stageIndex:1 }, 'raid-derived review takes priority over progression');
context.G.raidLearning = { area99_0:{ attempts:4, wrong:4 }, area1_0:{ attempts:1, wrong:1 } };
assert.deepEqual(selection(), { areaId:'area11', stageIndex:2 }, 'invalid or insufficient raid records fall back to the hardest cleared stage');
context.G={studyStats:{stageHistory:{area1_2:{total:3,history:recentHistory([0,0,0])}}}};
const separateSave={studyStats:{stageHistory:{area1_1:{total:5,history:recentHistory([1,1,1,1,1])}}},stageClearCounts:{area11:[0,0,1]}};
assert.deepEqual(selection(),{areaId:'area1',stageIndex:2},'active save recommendation continues to use active save data');
assert.deepEqual(JSON.parse(JSON.stringify(context.challengePrintDecisionForGame(separateSave))),{areaId:'area11',stageIndex:2,label:'高学年・3',reason:'苦手候補なし → 取り組み済みの最難関'},'admin decision is computed from the selected save, not the active save');

const averageLine = source.split('\n').find(line => line.includes("name: '平均の計算'"));
const generator = averageLine.slice(averageLine.indexOf('generateProblem: ') + 'generateProblem: '.length, averageLine.lastIndexOf(' },'));
let values = [];
const math = vm.createContext({ rnd(min, max) {
  const value = values.shift();
  assert.ok(Number.isInteger(value) && value >= min && value <= max);
  return value;
} });
const generate = vm.runInContext(`(${generator})`, math);
let integerCount = 0, decimalCount = 0;
for (let center = 5; center <= 15; center++) {
  for (let left = 1; left <= 3; left++) {
    for (let right = 1; right <= 3; right++) {
      values = [center, left, right];
      const problem = generate();
      assert.equal(problem.answer, (problem.a + problem.b) / 2);
      assert.ok(Number.isInteger(problem.answer * 2));
      if (Number.isInteger(problem.answer)) integerCount++; else decimalCount++;
      assert.equal(problem.text, `${problem.a} と ${problem.b} の平均`);
    }
  }
}
assert.ok(integerCount > 0 && decimalCount > 0, 'both integer and decimal answers remain available');
values = [7, 1, 3];
const regression = generate();
assert.equal(regression.a, 6);
assert.equal(regression.b, 10);
assert.equal(regression.answer, 8, 'the mean of 6 and 10 must be 8');
values = [7, 1, 2];
const decimal = generate();
assert.equal(decimal.a, 6);
assert.equal(decimal.b, 9);
assert.equal(decimal.answer, 7.5, 'the mean of 6 and 9 must be 7.5');
console.log('PASS: save print progression/raid priority and all 99 average combinations with integer and decimal answers');
