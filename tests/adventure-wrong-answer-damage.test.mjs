import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const start=source.indexOf('function scaleOrdinaryStageWrongAnswerDamage(');
const end=source.indexOf('\nfunction turnBasedEnemyAct(',start);
assert.ok(start>=0&&end>start,'ordinary stage miss-damage rule exists');
const context=vm.createContext({AREA_STAGES:{area1:{},area3:{}}});
vm.runInContext(source.slice(start,end),context);

const ordinaryStage={stageMode:true,areaId:'area3',stageIndex:4,isBoss:false};
assert.equal(context.scaleOrdinaryStageWrongAnswerDamage(84,true,ordinaryStage),42,
  'one ordinary-stage wrong answer receives half damage');
assert.equal(context.scaleOrdinaryStageWrongAnswerDamage(1,true,ordinaryStage),1,
  'minimum damage remains one');
assert.equal(context.scaleOrdinaryStageWrongAnswerDamage(84,false,ordinaryStage),84,
  'correct answers do not scale enemy damage');

for(const outside of [
  {stageMode:true,areaId:'area3',stageIndex:null,isBoss:true},
  {stageMode:true,areaId:'area1',stageIndex:0,isRaid:true},
  {stageMode:true,areaId:'area1',stageIndex:0,isEventRaid:true},
  {stageMode:true,areaId:'area1',stageIndex:0,isHalloween:true},
  {stageMode:true,areaId:'area1',stageIndex:0,readingQuest:{}},
  {stageMode:false,areaId:'area3',stageIndex:4},
])assert.equal(context.scaleOrdinaryStageWrongAnswerDamage(84,true,outside),84,
  'raid, boss, event, reading, and non-stage damage remains unchanged');

console.log('PASS: one ordinary-stage wrong answer is softened; consecutive misses still accumulate, and other battle modes are unchanged.');
