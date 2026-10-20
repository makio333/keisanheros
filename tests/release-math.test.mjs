import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {isPrintAnswerCorrect,formatPrintAnswer} from '../print_answers.js';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const context=vm.createContext({generateKanjiProblem:()=>({answer:'stub'})});
vm.runInContext('function rnd(a,b){return a;} function pick(a){return a[0];}',context);
vm.runInContext(source.slice(source.indexOf('function generateProblem('),source.indexOf('/* 1つの ステージ')),context);
vm.runInContext('globalThis.areas=AREA_STAGES',context);
for(let m=2;m<=5;m++)for(let a=1;a<=4;a++)for(let b=1;b<=4;b++){
  let draws=[m,a,b];context.rnd=()=>draws.shift();
  const p=context.areas.area12.stages[1].generateProblem();
  let x=a,y=b;while(y)[x,y]=[y,x%y];
  assert.equal(p.answer,`${a/x}:${b/x}`);
  assert.ok(isPrintAnswerCorrect(p,p.answer));
  assert.equal(isPrintAnswerCorrect(p,`${a/x*2}:${b/x*2}`),false);
}
const oldRatio={text:'4 : 4 をかんたんに',op:'かんたん',answer:'2:2'};
assert.ok(isPrintAnswerCorrect(oldRatio,'１：１'));
assert.equal(isPrintAnswerCorrect(oldRatio,'2:2'),false);
for(let b=2;b<=9;b++)for(let a=b+1;a<=100;a++){
  if(a%b===0)continue;
  const p={a,b,op:'÷',answer:Math.floor(a/b),remainder:a%b};
  assert.ok(isPrintAnswerCorrect(p,formatPrintAnswer(p)));
  assert.ok(isPrintAnswerCorrect(p,`${p.answer}余り${p.remainder}`));
  assert.equal(isPrintAnswerCorrect(p,String(p.answer)),false);
  assert.equal(isPrintAnswerCorrect(p,`${p.answer}あまり0`),false);
}
for(const input of ['1+2','1x2','1×2','1 2','12abc','12円','12/','Infinity','NaN','', '0xC'])assert.equal(isPrintAnswerCorrect({answer:12},input),false,input);
assert.ok(isPrintAnswerCorrect({answer:12},'１２'));
assert.ok(isPrintAnswerCorrect({answer:8},'8.0'));
assert.ok(isPrintAnswerCorrect({answer:7.5},'７．５'));
assert.ok(isPrintAnswerCorrect({answer:-2},'−2'));
assert.ok(isPrintAnswerCorrect({answer:'4/12'},'1/3'));
assert.ok(isPrintAnswerCorrect({answer:'4/12'},'01/03'));
assert.equal(isPrintAnswerCorrect({answer:'4/12'},'1/0'),false);
assert.equal(isPrintAnswerCorrect({answer:8},'8.0000000000000000001'),false);
assert.ok(isPrintAnswerCorrect({answer:8},'08.0000000000000000000'));
assert.ok(isPrintAnswerCorrect({op:'かんたん',answer:'1:1'},'01:01'));
const distance={op:'道のり',text:'時速60km で 3時間',answer:180};
for(const value of ['180','１８０ｋｍ','180 km','180キロメートル'])assert.ok(isPrintAnswerCorrect(distance,value),value);
for(const value of ['180m','180時間','180km/h','18km0'])assert.equal(isPrintAnswerCorrect(distance,value),false,value);
const area={op:'面積',text:'半径2cmの円の面積',answer:12.56};
for(const value of ['12.56','12.56cm²','12.56cm^2','１２．５６㎠','12.56平方センチメートル'])assert.ok(isPrintAnswerCorrect(area,value),value);
for(const value of ['12.56cm','12.56m²','1256cm²','12.56%'])assert.equal(isPrintAnswerCorrect(area,value),false,value);
assert.equal(isPrintAnswerCorrect({op:'の',text:'100 の 10%',answer:10},'10%'),false);
assert.ok(isPrintAnswerCorrect({text:'日',answer:'ひ'},'ニチ'));
assert.equal(isPrintAnswerCorrect({text:'学校',answer:'がっこう'},'やま'),false);
assert.equal(isPrintAnswerCorrect({text:'がっこう',answer:'がっこう'},'がつこう'),false);

const nodes={};let result;
const grade=vm.createContext({window:{},isPrintAnswerCorrect,showPrintScoreResult:(_cur,correct,total)=>{result={correct,total};},$:id=>nodes[id]||={value:'',innerHTML:''}});
vm.runInContext(source.slice(source.indexOf('function gradeUnifiedPrint()'),source.indexOf('function showPrintScoreResult(')),grade);
for(const [p,input,correct] of [[{answer:12},'1+2',0],[{a:7,b:2,answer:3,remainder:1},'3あまり1',1],[oldRatio,'1:1',1],[{text:'日',answer:'ひ'},'にち',1]]){
  grade.window.unifiedCurrentPrint={meta:{problems:[p]}};grade.$('unified-ans-0').value=input;grade.gradeUnifiedPrint();assert.equal(result.correct,correct);
}
for(const [quotient,remainder,correct] of [['3','1',1],['3','',0],['3','0',0],['3あまり1','1',0]]){
  grade.window.unifiedCurrentPrint={meta:{problems:[{answer:3,remainder:1}]}};
  grade.$('unified-ans-0').value=quotient;grade.$('unified-ans-0').dataset={mathParts:'remainder'};grade.$('unified-rem-0').value=remainder;
  grade.gradeUnifiedPrint();assert.equal(result.correct,correct);
}
vm.runInContext(source.slice(source.indexOf('function printBlankHtml('),source.indexOf('/* もんだいの ぶんすう')),context);
assert.ok(context.printBlankHtml({answer:3,remainder:1}).includes('あまり'));
console.log('PASS: 64 simplest ratios, all remainder cases, strict math tokens, equivalent fractions, alternate kanji readings and real print grading.');
