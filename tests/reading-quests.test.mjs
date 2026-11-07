import assert from 'node:assert/strict';
import {READING_QUESTS as quests,READING_QUEST_GRADES as grades,readingAnswerMatches} from '../reading_quests.js';
assert.equal(quests.length,60);assert.equal(grades.length,6);assert.equal(new Set(quests.map(q=>q.id)).size,60);assert.equal(new Set(quests.map(q=>q.passage)).size,60);
for(let grade=1;grade<=6;grade++)assert.equal(quests.filter(q=>q.grade===grade).length,10);
for(const q of quests){
 for(const field of ['title','npc','passage','question','answer','evidence','explanation'])assert.ok(q[field]?.trim(),`${q.id} ${field}`);
 assert.ok(q.passage.includes(q.evidence),`${q.id}: evidence occurs verbatim`);
 if(q.grade!==2)assert.ok(q.passage.includes(q.answer)||q.evidence.includes(q.answer),`${q.id}: answer traceable`);
 assert.ok(readingAnswerMatches(q,q.answer));for(const a of q.acceptedAnswers)assert.ok(readingAnswerMatches(q,` ${a}。 `));
 assert.equal(readingAnswerMatches(q,''),false);assert.equal(readingAnswerMatches(q,'でたらめ'),false);
 const sentenceCount=(q.passage.match(/。/g)||[]).length;
 if(q.grade===1){assert.ok(!/\p{Script=Han}/u.test(q.passage+q.question));assert.match(q.answer,/^[ぁ-ん]{2,4}$/u);assert.ok(sentenceCount>=1&&sentenceCount<=2);}
 if(q.grade===2)assert.ok(sentenceCount>=2&&sentenceCount<=3);
 if(q.grade===3)assert.ok(sentenceCount>=3&&sentenceCount<=4);
 if(q.grade===4)assert.ok(sentenceCount>=4&&sentenceCount<=5);
}
const witness=quests.find(q=>q.id==='reading-g6-03');assert.equal(readingAnswerMatches(witness,'東の塔'),false);
console.log('PASS: 60 original passages, 10/grade, traceable evidence/answers, grade 1 kana and short answers, sentence counts, exact accepted variants and wrong-answer rejection');
