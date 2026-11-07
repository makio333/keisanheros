import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {kanaPrintChoice} from '../kana_choice_print.js';
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('../kanji_data.js',import.meta.url),'utf8'),context);
for(const script of ['hira','kata'])for(const n of [3,4,5]){
 const rows=context.window.KANJI_POOLS[`kana_${script}_${n}`];
 assert.equal(rows.length,30);assert.equal(new Set(rows.map(p=>p.answer)).size,30);
 assert.equal(rows.filter(p=>p.sentenceChoice).length,24);
 for(const p of rows.filter(p=>p.sentenceChoice)){
  assert.ok(p.prompt.includes('（ ）'));assert.notEqual(p.answer,p.wrongAnswer);
  assert.equal(p.choiceCount,2);
  const choice={options:[p.answer,p.wrongAnswer],correctIndex:0};
  assert.deepEqual(kanaPrintChoice(p,choice),choice);
 }
}
console.log('PASS: six expanded pools, 30 unique questions each, 24 sentence additions and six original entries preserved, exact print distractors');
