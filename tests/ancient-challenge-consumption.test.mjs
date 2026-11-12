import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createAncientPrintSessionV2} from '../ancient_word_problem_print_adapter_v2.js';

let blocked=true,consumeCalls=0,printCalls=0;
const prepared={ready:true,html:'same-student-and-teacher-payload'};
const opened=[];
const session=createAncientPrintSessionV2({
  openWindow:value=>{
    assert.equal(value,prepared);
    if(blocked)return null;
    const window={closed:false,print(){printCalls++;}};opened.push(window);return window;
  },
  onFirstOpen:detail=>{assert.deepEqual(detail,{consumeCount:1,questionCount:33,passCount:27});consumeCalls++;}
});
assert.deepEqual(session.open(prepared),{opened:false,consumed:false});
assert.equal(consumeCalls,0,'a blocked popup never consumes');
assert.throws(()=>session.open({ready:false,html:'bad'}));
blocked=false;
assert.deepEqual(session.open(prepared),{opened:true,consumed:true});
assert.equal(consumeCalls,1,'the item is consumed after the print window opens');
assert.deepEqual(session.open(prepared),{opened:true,consumed:true});
assert.equal(consumeCalls,1,'reopening the same print content does not consume again');
assert.throws(()=>session.open({ready:true,html:'different questions'}),/cannot change/);
assert.equal(session.printAgain(),true);assert.equal(printCalls,1);
opened.at(-1).closed=true;assert.equal(session.printAgain(),false);assert.equal(session.consumed,true,'closing the print window does not refund the already opened print');

// Test actual grading's compatibility branch: new prints were spent when their
// popup opened; old records still spend once when a passing result is claimed.
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
let removed=0;
const rewardContext=vm.createContext({
  G:{player:{gold:0},items:[],ownedEquips:[],nextUid:1},
  $:()=>({classList:{add(){}}}),removeResolvedPrint(){},
  ITEM_DB:['potion','hipotion','ether','cost_seed'].map(id=>({id,name:id})),
  pick:values=>values[0],addItem(){},grantExp:()=>({leveledUp:false}),save(){},playItemRevealSequence(){},
  rollAncientBlueprintReward:()=>({id:'ancient',name:'古代装備'}),rollAbility:()=>null,removeItem(){removed++;}
});
vm.runInContext(source.slice(source.indexOf('function grantPrintRewards('),source.indexOf('// Make print functions available')),rewardContext);
const before=rewardContext.G.ownedEquips.length;
rewardContext.grantPrintRewards({meta:{type:'blueprint',uid:7,itemConsumedAtPrint:true}},26,33,26/33);
assert.equal(rewardContext.G.ownedEquips.length,before,'26/33 is below the reward threshold');
rewardContext.grantPrintRewards({meta:{type:'blueprint',uid:7,itemConsumedAtPrint:true}},27,33,27/33);
assert.equal(rewardContext.G.ownedEquips.length,before+1,'27/33 grants the ancient equipment');
assert.equal(removed,0,'grading a new print does not spend a second blueprint');
rewardContext.grantPrintRewards({meta:{type:'blueprint',uid:7}},16,20,.8);
assert.equal(removed,1,'legacy print records keep their prior reward-time spend');

console.log('PASS: popup failure/cancel before opening spends nothing; successful open spends once; same print reopens without a second spend; closing the opened print does not refund; new/legacy grading spend compatibility');
