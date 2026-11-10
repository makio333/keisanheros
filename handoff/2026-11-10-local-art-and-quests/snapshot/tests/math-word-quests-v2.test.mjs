import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {MATH_WORD_QUESTS_V2,getMathWordQuestsV2,getMathWordQuestV2,scoreMathWordAnswerV2} from '../math_word_quests_v2.js';

// Independent rational arithmetic oracle; no production scoring helpers imported.
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const rat=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
const dec=s=>{s=String(s);assert.match(s,/^[+-]?\d+(?:\.\d+)?$/);const sign=s.startsWith('-')?-1n:1n;const parts=s.replace(/^[+-]/,'').split('.');return rat(sign*BigInt(parts.join('')),10n**BigInt(parts[1]?.length||0));};
const add=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const sub=(a,b)=>rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
const mul=(a,b)=>rat(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>rat(a[0]*b[1],a[1]*b[0]);
const eq=(a,b)=>a[0]*b[1]===b[0]*a[1];
function expression(source){
 assert.equal(typeof source,'string');const tokens=source.match(/\d+(?:\.\d+)?|[()+*/-]/g)||[];
 assert.equal(tokens.join(''),source.replace(/\s/g,''),'unrecognized expression characters');let pos=0;
 function atom(){const token=tokens[pos++];if(token==='('){const value=sum();assert.equal(tokens[pos++],')');return value;}if(token==='-')return mul(rat(-1),atom());if(token==='+')return atom();return dec(token);}
 function product(){let value=atom();while(['*','/'].includes(tokens[pos])){const op=tokens[pos++],other=atom();value=op==='*'?mul(value,other):div(value,other);}return value;}
 function sum(){let value=product();while(['+','-'].includes(tokens[pos])){const op=tokens[pos++],other=product();value=op==='+'?add(value,other):sub(value,other);}return value;}
 const value=sum();assert.equal(pos,tokens.length);return value;
}
const answerRational=s=>expression(String(s));
function expected(p){
 const c=p.check,v=c.values||[];
 if(c.kind==='arithmetic')return expression(c.expression);
 if(['ceil_div','floor_div','remainder'].includes(c.kind)){
  assert.ok(v.every(Number.isInteger));assert.ok(v[0]>=0&&v[1]>0);const [a,b]=v.map(BigInt),q=a/b,r=a%b;
  return c.kind==='remainder'?{quotient:q,remainder:r}:rat(c.kind==='ceil_div'&&r?q+1n:q);
 }
 if(c.kind==='clock_add'){const [h,m,d]=v;assert.ok(h>=0&&h<24&&m>=0&&m<60&&d>=0&&d<1440);return{clock:(h*60+m+d)%1440};}
 if(c.kind==='elapsed_minutes'){const[a,b,c1,d]=v;assert.ok([a,c1].every(x=>x>=0&&x<24)&&[b,d].every(x=>x>=0&&x<60));return rat((c1*60+d-a*60-b+1440)%1440);}
 if(c.kind==='ratio_reduce'){const[a,b]=v.map(BigInt),g=gcd(a,b);assert.ok(a>=0n&&b>0n&&g>0n);return{ratio:[a/g,b/g]};}
 if(['round','floor_to','ceil_to'].includes(c.kind)){
  const places=v[1];assert.ok(Number.isInteger(places)&&Math.abs(places)<10);
  const scale=places>=0?rat(10n**BigInt(places)):rat(1n,10n**BigInt(-places));
  const x=mul(dec(v[0]),scale);assert.ok(x[0]>=0n);let rounded=x[0]/x[1],remainder=x[0]%x[1];
  if(c.kind==='round'&&2n*remainder>=x[1])rounded++;
  if(c.kind==='ceil_to'&&remainder)rounded++;
  return div(rat(rounded),scale);
 }
 assert.fail(`unsupported independent check kind: ${c.kind}`);
}

test('independent oracle arithmetic, fractions and precision boundaries',()=>{
 assert.ok(eq(expression('0.1+0.2'),rat(3,10)));
 assert.ok(eq(expression('(2/5)/(3/4)'),rat(8,15)));
 assert.ok(eq(expression('8*12-3*4'),rat(84)));
 assert.ok(eq(expected({check:{kind:'ceil_div',values:[29,4]}}),rat(8)));
 assert.ok(eq(expected({check:{kind:'round',values:[12500,-3]}}),rat(13000)));
 assert.deepEqual(expected({check:{kind:'clock_add',values:[9,35,45]}}),{clock:620});
});

test('180 stable original records with exactly 30 per grade and complete contracts',()=>{
 assert.equal(MATH_WORD_QUESTS_V2.length,180);assert.equal(new Set(MATH_WORD_QUESTS_V2.map(p=>p.id)).size,180);
 for(let grade=1;grade<=6;grade++){
  const items=getMathWordQuestsV2(grade);assert.equal(items.length,30);
  assert.ok(new Set(items.map(p=>p.topic)).size>=6,`grade ${grade} topic coverage`);
  assert.ok(new Set(items.map(p=>p.semanticPattern)).size>=15,`grade ${grade} semantic diversity`);
 }
 const complete=new Set(),numericTemplates=new Set();
 for(const p of MATH_WORD_QUESTS_V2){
  assert.match(p.id,new RegExp(`^mwq-v2-g${p.grade}-\\d{3}$`));
  for(const key of ['topic','questionType','title','story','question','answer','unit','equation','explanation','semanticPattern','curriculumNote'])assert.equal(typeof p[key],'string',`${p.id}/${key}`);
  assert.ok(p.story.length>10&&p.question.length>4&&p.explanation.length>8,p.id);
  assert.ok(p.prerequisites.length>0&&p.input.fields.length>0&&p.scoring,p.id);
  assert.ok(!complete.has(p.story+p.question),`exact repeated wording ${p.id}`);complete.add(p.story+p.question);
  const normalized=(p.story+p.question).replace(/[0-9０-９]+(?:[.:/][0-9０-９]+)*/g,'#').replace(/\s/g,'');
  assert.ok(!numericTemplates.has(normalized),`number-only wording variant ${p.id}`);numericTemplates.add(normalized);
  assert.ok(!p.story.includes('undefined')&&!p.question.includes('undefined'),p.id);
  assert.equal(getMathWordQuestV2(p.id),p);
 }
 assert.deepEqual(getMathWordQuestsV2(0),[]);assert.equal(getMathWordQuestV2('missing'),null);
});

for(const p of MATH_WORD_QUESTS_V2)test(`${p.id}: independent model, correct answer, input fields, rejection`,()=>{
 const result=expected(p),canonical=p.answer;
 if(p.answerKind==='time'){
  const [h,m]=canonical.split(':').map(Number);assert.equal(h*60+m,result.clock,p.id);
  assert.equal(scoreMathWordAnswerV2(p,{hours:h,minutes:m}).correct,true);
  assert.equal(scoreMathWordAnswerV2(p,{hours:h,minutes:60}).correct,false);
 }else if(p.answerKind==='ratio'){
  const pair=canonical.split(':').map(BigInt);assert.deepEqual(pair,result.ratio,p.id);
  assert.equal(scoreMathWordAnswerV2(p,{left:String(pair[0]),right:String(pair[1])}).correct,true);
  assert.equal(scoreMathWordAnswerV2(p,{left:String(pair[0]),right:'0'}).correct,false);
 }else if(p.answerKind==='remainder'){
  assert.equal(BigInt(canonical),result.quotient);assert.equal(BigInt(p.remainder),result.remainder);
  assert.equal(scoreMathWordAnswerV2(p,{quotient:canonical,remainder:p.remainder}).correct,true);
  assert.equal(scoreMathWordAnswerV2(p,{quotient:canonical,remainder:p.remainder+1}).correct,false);
  assert.equal(scoreMathWordAnswerV2(p,canonical).correct,false);
 }else{
  assert.ok(eq(answerRational(canonical),result),`${p.id}: expected from independent check`);assert.ok(result[0]>=0n,`negative elementary quantity ${p.id}`);
  if(p.answerKind==='integer')assert.equal(result[1],1n,p.id);
  if(p.answerKind==='fraction'){
   const [n,d]=canonical.split('/');assert.ok(n!==undefined&&d!==undefined,p.id);
   assert.equal(scoreMathWordAnswerV2(p,{numerator:n,denominator:d}).correct,true);
   assert.equal(scoreMathWordAnswerV2(p,{numerator:n,denominator:0}).correct,false);
  }else assert.equal(scoreMathWordAnswerV2(p,{value:canonical}).correct,true);
  const wrong=String(Number(result[0])/Number(result[1])+1);assert.equal(scoreMathWordAnswerV2(p,wrong).correct,false,p.id);
  assert.equal(scoreMathWordAnswerV2(p,'NaN').correct,false,p.id);assert.equal(scoreMathWordAnswerV2(p,canonical+'xyz').correct,false,p.id);
 }
 assert.equal(scoreMathWordAnswerV2(p,p.answerKind==='remainder'?`${canonical}あまり${p.remainder}`:canonical).correct,true,p.id);
 const fullwidth=canonical.replace(/[0-9]/g,x=>String.fromCharCode(x.charCodeAt(0)+0xfee0));
 if(p.answerKind!=='remainder')assert.equal(scoreMathWordAnswerV2(p,fullwidth).correct,true,p.id);
});

test('candidate module stays disconnected from existing game/release entries',()=>{
 for(const file of ['main.js','game.js','index.html','package.json'])assert.ok(!fs.readFileSync(new URL('../'+file,import.meta.url),'utf8').includes('math_word_quests_v2'),file);
 assert.equal(scoreMathWordAnswerV2('missing','1').correct,false);
});


test('scoring boundaries: exact precision, same-value fractions, units and clock',()=>{
 const base={id:'probe',answer:'0.3',answerKind:'decimal',unit:'m',scoring:{unitAliases:['メートル']}};
 assert.equal(scoreMathWordAnswerV2(base,'０．３００ m').correct,true);
 assert.equal(scoreMathWordAnswerV2(base,'0.30000000000000004').correct,false);
 assert.equal(scoreMathWordAnswerV2(base,'0.3cm').correct,false);
 assert.equal(scoreMathWordAnswerV2(base,'3e-1').correct,false);
 const f={...base,answer:'1/2',answerKind:'fraction',unit:''};
 assert.equal(scoreMathWordAnswerV2(f,'2/4').correct,true);
 assert.equal(scoreMathWordAnswerV2(f,'0.5').correct,true);
 assert.equal(scoreMathWordAnswerV2(f,'-1/-2').correct,false);
 assert.equal(scoreMathWordAnswerV2({...f,scoring:{requireSimplestFraction:true}},'2/4').correct,false);
 assert.equal(scoreMathWordAnswerV2({...f,scoring:{requireFractionNotation:true}},'0.5').correct,false);
 const ratio={...base,answer:'2:3',answerKind:'ratio',scoring:{requireSimplest:true}};
 assert.equal(scoreMathWordAnswerV2(ratio,'4:6').correct,false);
 assert.equal(scoreMathWordAnswerV2({...ratio,scoring:{requireSimplest:false}},'4:6').correct,true);
 const clock={...base,answer:'10:20',answerKind:'time'};
 assert.equal(scoreMathWordAnswerV2(clock,'１０時２０分').correct,true);
 assert.equal(scoreMathWordAnswerV2(clock,'9:80').correct,false);
 assert.equal(scoreMathWordAnswerV2(clock,'24:00').correct,false);
});
