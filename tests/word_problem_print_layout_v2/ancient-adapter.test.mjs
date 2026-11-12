import assert from 'node:assert/strict';
import {ancientPrintPlanV2,createAncientPrintSessionV2} from '../../ancient_word_problem_print_adapter_v2.js';
import {ancientFixture} from './ancient-fixture.js';
const source=ancientFixture(),snapshot=JSON.stringify(source),plan=ancientPrintPlanV2(source);
assert.equal(JSON.stringify(source),snapshot);assert.equal(plan.records.length,33);assert.deepEqual(plan.records.map(r=>r.number),Array.from({length:33},(_,i)=>i+1));
assert.deepEqual([plan.questionCount,plan.passCount,plan.consumeCount],[33,27,1]);assert.equal(plan.records[0].question,'4 + 3 − 2');assert.equal(plan.records[0].answer,'5');assert.equal(plan.records[23].question,'近くにかわが流れる。');assert.equal(plan.records[23].answer,'川');
for(let i=0;i<33;i++)assert.equal(plan.records[i].source,[...source.calculations,...source.stories,...source.readings,...source.writings][i]);
assert.ok(!plan.automaticStudentHtml.includes('wpp2-source-answer'));assert.equal((plan.teacherHtml.match(/wpp2-source-answer/g)||[]).length,33);
let opens=0,consumes=0,prints=0,blocked=true;const session=createAncientPrintSessionV2({openWindow(){opens++;return blocked?null:{closed:false,print(){prints++;}};},onFirstOpen(data){consumes++;assert.equal(data.consumeCount,1);}});
assert.throws(()=>session.open({ready:false}));assert.equal(opens,0);assert.equal(session.open({ready:true}).opened,false);assert.equal(consumes,0);blocked=false;session.open({ready:true});assert.equal(consumes,1);
// Closing the browser print dialog/cancel has no callback into the consumption seam.
session.printAgain();session.printAgain();session.open({ready:true});assert.equal(consumes,1);assert.equal(prints,2);assert.equal(session.consumed,true);
assert.throws(()=>ancientPrintPlanV2({...source,stories:source.stories.slice(1)}),RangeError);
console.log('Ancient adapter: 33 records, exact source preservation, 27 threshold, once-only consumption seam: PASS');
