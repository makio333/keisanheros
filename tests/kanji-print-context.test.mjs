import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {kanjiPrintContext} from '../kanji_print_context.js';

const bridge={text:'橋',answer:'はし'};
const chopsticks={text:'箸',answer:'はし'};
assert.deepEqual(kanjiPrintContext(bridge),{before:'しろへ つづく',after:'を わたる。'});
assert.deepEqual(kanjiPrintContext(chopsticks),{before:'やどやで',after:'を つかって たべる。'});
assert.equal(bridge.text,'橋');assert.equal(bridge.answer,'はし');
assert.deepEqual(kanjiPrintContext({text:'学校',answer:'がっこう'}),{before:'むらの',after:'で まほうを ならう。'});
assert.deepEqual(kanjiPrintContext({text:'村',answer:'むら'}),{before:'まものから',after:'を まもる。'});
assert.ok(kanjiPrintContext({text:'未知の語'}).before.includes('ギルド'));
assert.deepEqual(kanjiPrintContext({text:'角',answer:'かど'}),{before:'しろの',after:'を まがる。'},'corner context must not imply the different reading つの');
const custom={before:'きのう、',after:'を みつけた。'};
assert.equal(kanjiPrintContext({...bridge,printContext:custom}),custom,'saved sentences stay stable even if the catalog changes');
const data={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../kanji_data.js',import.meta.url),'utf8'),data);
const examples=new Map();
for(const [tier,pool] of Object.entries(data.window.KANJI_POOLS)){
  if(!tier.startsWith('kanji'))continue;
  for(const p of pool){
    const context=kanjiPrintContext(p);
    assert.equal(typeof context.before,'string');assert.equal(typeof context.after,'string');
    assert.ok(context.before.length+context.after.length>0);
    assert.ok(!context.before.includes('|') && !context.after.includes('|'));
    examples.set(p.text,context);
  }
}
assert.ok(examples.size>1000);
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const test=vm.createContext({kanjiPrintContext,showPrintChoiceModal:v=>{test.variants=v;},escapeHtml:s=>String(s),AREA_STAGES:{area5:{}},G:{playerName:'確認用'},save(){},addPrintCode(target,code,meta){test.meta=meta;return '1234';},openPrintWindow(html){test.html=html;}});
vm.runInContext(game.slice(game.indexOf('function showKanjiPrintVariants('),game.indexOf('function challengePrintSource(')),test);
test.showKanjiPrintVariants({generateProblem:()=>({...bridge}),printName:'橋の問題',targetId:'area5_0',meta:{areaId:'area5',stageIndex:0,type:'stage'}});
test.variants[1].onSelect();
assert.equal(test.meta.problems[0].text,'橋');assert.equal(test.meta.problems[0].answer,'はし');
assert.equal(test.meta.problems[0].printContext.before,'しろへ つづく');
assert.ok(test.html.includes('しろへ つづく') && test.html.includes('を わたる。'));
assert.ok(test.variants[1].previewHtml.includes('<u>はし</u>'));
console.log('PASS: contextual disambiguation, valid context for all kanji words, saved sentence stability and unchanged target/answer grading data');
