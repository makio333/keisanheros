import test from 'node:test';
import assert from 'node:assert/strict';
import {JAPANESE_READING_QUESTS_V2 as bank,JAPANESE_READING_GRADES_V2 as grades,countReadingCharacters,normalizeReadingAnswerV2,evaluateJapaneseReadingAnswerV2 as evaluate,getJapaneseReadingQuestsV2} from '../japanese_reading_quests_v2.js';
const slice=(s,a,b)=>[...s].slice(a,b).join('');
const ids=new Set();
const unique=id=>{assert.ok(!ids.has(id),`duplicate ${id}`);ids.add(id);};
test('six independent grade selections, 60 unique passages, 300 questions',()=>{
 assert.equal(bank.length,60);assert.equal(grades.length,6);
 assert.equal(new Set(bank.map(q=>q.passage)).size,60);
 assert.equal(new Set(bank.map(q=>q.title)).size,60);
 for(let grade=1;grade<=6;grade++){
  const group=getJapaneseReadingQuestsV2(grade);assert.equal(group.length,10);
  assert.equal(group.flatMap(q=>q.questions).length,50);
  assert.deepEqual(grades[grade-1].questIds,group.map(q=>q.id));
  for(const genre of ['物語','説明文','実用文'])assert.ok(group.some(q=>q.genre===genre));
 }
 assert.deepEqual(getJapaneseReadingQuestsV2(7),[]);
});
test('all spans, paragraph boundaries, unique IDs, character counts and print contracts',()=>{
 for(const quest of bank){
  unique(quest.id);assert.equal(quest.characterCount,countReadingCharacters(quest.passage));
  assert.equal(quest.segments.map(s=>s.text).join('\n'),quest.passage);
  for(const segment of quest.segments){unique(segment.id);assert.equal(slice(quest.passage,segment.start,segment.end),segment.text);}
  for(const question of quest.questions){
   unique(question.id);assert.equal(question.grade,quest.grade);assert.ok(question.prompt);assert.ok(question.explanation);
   for(const e of question.evidence){unique(e.id);assert.equal(slice(quest.passage,e.start,e.end),e.text);assert.ok(quest.segments.some(s=>s.id===e.segmentId&&e.start>=s.start&&e.end<=s.end));}
   for(const id of question.referenceIds){const ref=quest.references.find(r=>r.id===id&&r.questionId===question.id);assert.ok(ref);assert.ok(question.prompt.includes(`下線${ref.label}の「${ref.text}」`));}
  }
  for(const ref of quest.references){unique(ref.id);assert.equal(slice(quest.passage,ref.start,ref.end),ref.text);assert.ok(quest.questions.some(q=>q.id===ref.questionId));}
 }
});
test('180 choices: one unique answer, balanced positions, all distractors rejected',()=>{
 const positions=[0,0,0];let n=0;
 for(const quest of bank)for(const q of quest.questions.filter(q=>q.input.type==='single-choice')){
  n++;const options=q.input.options;assert.equal(options.length,3);
  assert.equal(new Set(options.map(o=>normalizeReadingAnswerV2(o.text))).size,3,q.id);
  assert.equal(q.accepted.length,1);assert.equal(q.accepted[0],q.correct);
  assert.equal(q.answerText,options.find(o=>o.id===q.correct).text);positions[options.findIndex(o=>o.id===q.correct)]++;
  for(const o of options){const result=evaluate(q,o.id);assert.equal(result.correct,o.id===q.correct);}
  assert.equal(evaluate(q,'ア').status,'invalid-input');assert.equal(evaluate(q,'').status,'invalid-input');
  assert.ok(q.evidence.length>=1);assert.equal(q.print.answerMode,'circle-one');
 }
 assert.equal(n,180);assert.deepEqual(positions,[60,60,60]);
});
test('60 extraction answers reachable with existing kana board; printed length is separate',()=>{
 let n=0;let differentLengths=0;
 // The existing board supports these base kana, small kana and voiced transformations.
 const reachable=/^[ぁ-ゖー]+$/u;
 for(const quest of bank)for(const q of quest.questions.filter(q=>q.input.type==='extraction')){
  n++;assert.ok(quest.passage.includes(q.correct));assert.equal(q.evidence[0].text,q.correct);
  assert.equal(q.print.cells,countReadingCharacters(q.correct));assert.equal(q.characterCondition.sourceCount,q.print.cells);
  const kana=q.accepted.find(a=>reachable.test(normalizeReadingAnswerV2(a)));assert.ok(kana,q.id);
  assert.equal(evaluate(q,kana).correct,true);assert.equal(evaluate(q,' '+kana+' ').correct,true);
  const katakana=kana.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));assert.equal(evaluate(q,katakana).correct,true);
  for(const accepted of q.accepted)assert.equal(evaluate(q,accepted).correct,true);
  assert.equal(evaluate(q,kana+'あ').correct,false);assert.equal(evaluate(q,'').status,'invalid-input');
  assert.equal(q.print.kanaAlternativeCells,countReadingCharacters(kana));
  differentLengths+=q.print.cells!==q.print.kanaAlternativeCells?1:0;
 }
 assert.equal(n,60);assert.ok(differentLengths>=25);
});
test('60 open responses always need human review, including negation and synonyms',()=>{
 const open=bank.flatMap(q=>q.questions).filter(q=>q.input.type==='open-response');assert.equal(open.length,60);
 for(const q of open){
  assert.equal(q.correct,null);assert.deepEqual(q.accepted,[]);assert.equal(q.scoring.autoGrade,false);
  assert.equal(q.scoring.criteria.length,3);assert.ok(q.scoring.equivalentAnswers.includes('同義表現'));
  for(const text of ['','いいと思う','よいと考える','よくないと思う']){
   assert.equal(evaluate(q,text).status,'needs-review');assert.equal(evaluate(q,text).correct,null);
  }
  assert.equal(q.characterCondition.enforced,false);assert.equal(q.print.answerMode,'free-lines');
 }
});
test('curated ruby spans are literal, nonoverlapping and unsafe single keys are absent',()=>{
 const unsafe=new Set(['太','面','日','足','光','細','軽','未','指','表','余','湿','慣','縫','響','見開','見習','洞']);
 let n=0;
 for(const quest of bank){let end=-1;
  for(const r of quest.ruby.overrides){n++;assert.equal(slice(quest.passage,r.start,r.end),r.base);assert.ok(!unsafe.has(r.base),r.base);assert.match(r.reading,/^[ぁ-ゖー]+$/u);assert.ok(r.start>=end,quest.id);end=r.end;}
  if(quest.grade===1)assert.doesNotMatch(quest.passage,/\p{Script=Han}/u);
 }
 assert.ok(n>300);
});
test('upper grades cover synthesis, constraints, summary and uncertainty',()=>{
 for(const grade of [5,6]){
  const group=getJapaneseReadingQuestsV2(grade),skills=group.flatMap(q=>q.questions).map(q=>q.skill);
  assert.ok(skills.some(s=>/要旨/.test(s)));assert.ok(skills.some(s=>/条件/.test(s)));
  assert.ok(skills.some(s=>/統合|複数資料/.test(s)));assert.ok(group.some(q=>/確定|未確認|限界/.test(q.passage)));
 }
});
test('Unicode normalization preserves content and never infers semantic equivalence',()=>{
 assert.equal(countReadingCharacters(' 木\n。 '),2);
 assert.equal(normalizeReadingAnswerV2(' ｶﾞｯｺｳ '),'がっこう');
 const q=bank[0].questions.find(q=>q.input.type==='extraction');
 assert.equal(evaluate(q,'すずではない').correct,false);
});

test('underline targets the pronoun, not the surrounding quotation',()=>{
 const q=bank.find(q=>q.id==='jr-v2-g2-01');assert.equal(q.references[0].text,'これ');
 for(const quest of bank)for(const [i,ref]of quest.references.entries())assert.equal(ref.label,['ア','イ','ウ'][i]);
});
