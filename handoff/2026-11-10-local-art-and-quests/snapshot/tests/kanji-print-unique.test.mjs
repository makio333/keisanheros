import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {kanjiPrintContext} from '../kanji_print_context.js';

const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const context=vm.createContext({kanjiPrintContext,window:{}});
vm.runInContext(fs.readFileSync(new URL('../kanji_data.js',import.meta.url),'utf8'),context);
vm.runInContext(game.slice(game.indexOf('function uniqueKanjiPrintProblems('),game.indexOf('function kanjiPrintSheetHtml(')),context);

for(const [tier,pool] of Object.entries(context.window.KANJI_POOLS)){
  if(!tier.startsWith('kanji'))continue;
  // Force repeated draws to exercise deterministic recovery from the same pool.
  const problems=context.uniqueKanjiPrintProblems(()=>({...pool[0],tier}));
  assert.equal(problems.length,10,tier);
  assert.equal(new Set(problems.map(p=>p.text)).size,10,tier);
  assert.equal(new Set(problems.map(p=>p.answer)).size,10,tier);
  assert.ok(problems.every(p=>pool.some(candidate=>candidate.text===p.text && candidate.answer===p.answer)));
}
const candidates=[{text:'橋',answer:'はし'},{text:'箸',answer:'はし'},{text:'橋',answer:'きょう'},{text:'山',answer:'やま'}];
let calls=0;
const problems=context.uniqueKanjiPrintProblems(()=>candidates[calls++ % candidates.length]);
assert.deepEqual(Array.from(problems,p=>p.text),['橋','山']);
assert.equal(calls,400,'repeated or insufficient candidates cannot loop forever');
for(let i=0;i<10;i++)assert.equal(context.kanjiPrintQuestionParts({text:'山',answer:'やま'},i,'mix').mode,i<5?'yomi':'kaki');
console.log('PASS: all kanji pools provide ten distinct words/readings; mix has reading above writing.');
