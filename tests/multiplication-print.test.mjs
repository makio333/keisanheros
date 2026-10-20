import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
let randomCalls = 0;
const context = vm.createContext({
  G: { playerName:'確認用' },
  escapeHtml:text=>String(text),
  AREA_STAGES: { area2:{name:'かけ算の森',stages:Array.from({length:9},(_,index)=>({name:`${index+1}の段`,generateProblem:()=>({a:index+1,b:1,op:'×',answer:index+1,text:`${index+1} × 1`})}))},
    area1:{name:'たし算',stages:[{name:'足し算',generateProblem:()=>({a:1,b:2,op:'+',answer:3,text:'1 + 2'})}]} },
  Math: Object.assign(Object.create(Math), {random:()=>{randomCalls++;return 0;}}),
  isKanjiProblem:()=>false,
  showPrintChoiceModal(variants){context.variants=variants;},
  fractionTextHtml:text=>text,
  printBlankHtml:()=>'<input>',
  addPrintCode(target,code,meta){context.meta=meta;return '1234';},
  save(){},
  openPrintWindow(html){context.html=html;},
});
vm.runInContext(source.slice(source.indexOf('function stageProblem('), source.indexOf('function pickHardStageProblem(')), context);
vm.runInContext(source.slice(source.indexOf('function printRewardStripHtml('), source.indexOf('function uniqueKanjiPrintProblems(')), context);
vm.runInContext(source.slice(source.indexOf('function printAreaStage('), source.indexOf('function printAreaBoss(')), context);
for(let table=1;table<=9;table++) {
  for(const mode of ['normal','challenge','blueprint']) {
    context.printAreaStage('area2',table-1,mode==='challenge',mode==='blueprint'?{bp:{id:'bp_ancient'},uid:42}:null);
    assert.equal(context.variants.length,3);
    for(const variant of context.variants) {
      assert.equal(variant.problems.length,10);
      const factors=Array.from(variant.problems,p=>p.b);
      assert.deepEqual([...factors].sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10]);
      assert.notDeepEqual(factors,[1,2,3,4,5,6,7,8,9,10],'shuffle must affect question order');
      for(const p of variant.problems){assert.equal(p.a,table);assert.equal(p.answer,table*p.b);assert.equal(p.text,`${table} × ${p.b}`);}
      variant.onSelect();
      assert.equal(context.meta.problems,variant.problems,'grading stores the displayed shuffled question order');
      assert.equal(context.meta.challengePrint,mode==='challenge');
      assert.equal(context.meta.type,mode==='blueprint'?'blueprint':'stage');
      assert.equal((context.html.match(/class="p-row"/g)||[]).length,10);
    }
  }
}
assert.ok(randomCalls>0);
context.printAreaStage('area1',0);
assert.ok(context.variants.every(v=>v.problems.every(p=>p.op==='+' && p.answer===3)),'other stage generators are preserved');
console.log('PASS: tables 1–9, all three print modes and sets cover multipliers 1–10 once, shuffled display/grade order and other stage behavior');
