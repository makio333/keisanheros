import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const context=vm.createContext({
  G:{studyStats:{totalAnswers:0,totalCorrect:0,units:{},stageHistory:{}}},
  explore:{areaId:'area1',stageIndex:0},
  AREA_STAGES:{area1:{name:'たし算',stages:[{name:'さいしょの10もん'}]}},
  getProblemUnitInfo:()=>({key:'math_add',label:'たし算'}),
  save(){},
});
vm.runInContext(source.slice(source.indexOf('function recordStudyAnswer('),source.indexOf('function renderStudySummary(')),context);
vm.runInContext(source.slice(source.indexOf('function stageDailyGraphRows('),source.indexOf('function drawStageLineChart(')),context);
context.recordStudyAnswer({text:'1+1'},false,7200,false,8000);
const stage=context.G.studyStats.stageHistory.area1_0;
assert.equal(stage.history[0].ms,7200,'stage history stores elapsed answer time');
assert.equal(stage.history[0].limitMs,8000,'stage history stores the allowed answer time');
assert.equal(context.G.studyStats.units.math_add.totalTimeMs,7200,'unit stats accumulate answer time');
assert.equal(context.G.studyStats.units.math_add.timeCount,1,'unit stats count timed responses');
const date=context.stageDailyGraphRows(stage)[0].date;
assert.equal(stage.days[date].total,1,'lifetime daily stage totals are stored');
assert.equal(stage.days[date].totalTimeMs,7200,'lifetime daily answer duration is stored');
assert.equal(context.stageDailyGraphRows(stage)[0].avgSeconds,7.2,'the graph receives daily average response time in seconds');
assert.equal(context.stageDailyGraphRows({history:[{t:Date.now(),ok:1}]}).length,1,'legacy records remain graphable when no daily rollup exists');
console.log('PASS: answer duration and per-question time limit are persisted for the stage.');
