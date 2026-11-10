import assert from 'node:assert/strict';
import {READING_QUESTS,readingAnswerMatches} from '../reading_quests.js';
import {READING_STORY_QUESTS} from '../reading_story_quests.js';
import {claimReadingReward,readingProgress,readingSolvedCount} from '../reading_subquest_progress.js';
assert.equal(READING_STORY_QUESTS.length,60);
for(const [i,q] of READING_STORY_QUESTS.entries()){
 assert.equal(q.parts.length,3);assert.equal(q.id,READING_QUESTS[i].id);
 if(q.references.length){assert.match(q.parts[0].question,/下線部[アイウ]/);assert.ok(q.references.every(ref=>q.passage.includes(ref.text)));assert.equal(q.references.some(ref=>q.passage.indexOf(ref.text)!==q.passage.lastIndexOf(ref.text)),false,`${q.id}: each marked passage phrase is unique`);}
 else {assert.equal(q.parts[0].question,READING_QUESTS[i].question);assert.deepEqual(q.parts[0].acceptedAnswers,READING_QUESTS[i].acceptedAnswers);}
 assert.ok(q.passage.startsWith(READING_QUESTS[i].passage));
 assert.equal(new Set(q.parts.map(p=>p.question)).size,3);
 for(const p of q.parts){assert.equal(p.passage,q.passage);assert.ok(q.passage.includes(p.evidence),`${p.id}: ${p.evidence}`);assert.ok(readingAnswerMatches(p,p.answer));assert.ok(!readingAnswerMatches(p,'ありえないこたえ'));for(const answer of p.acceptedAnswers)assert.ok(readingAnswerMatches(p,answer));}
 if(q.grade===1){assert.ok(!/\p{Script=Han}/u.test(q.passage));for(const p of q.parts)assert.ok(!/\p{Script=Han}/u.test(p.question));}
 const game={player:{gold:0},questMedals:0};
 assert.equal(claimReadingReward(game,q.id,false,1),null,'cannot skip question 1');
 for(let part=0;part<3;part++){
  assert.deepEqual(claimReadingReward(game,q.id,false,part),{gold:300,exp:20,medals:1});
  assert.equal(claimReadingReward(game,q.id,false,part),null,'cannot claim twice');
  assert.equal(readingSolvedCount(game,q.id),part+1);
  const restored=JSON.parse(JSON.stringify(game));assert.equal(readingSolvedCount(restored,q.id),part+1);
 }
 assert.equal(game.player.gold,900);assert.equal(game.questMedals,3);assert.equal(readingProgress(game).solved[q.id],true);
 const legacy={player:{gold:123},questMedals:2,readingSubquests:{solved:{[q.id]:true},letters:{},defeated:{}}};
 assert.equal(readingSolvedCount(legacy,q.id),3);for(let part=0;part<3;part++)assert.equal(claimReadingReward(legacy,q.id,false,part),null);assert.equal(legacy.player.gold,123);
}
console.log('PASS: 60 shared passages x 3 related questions, traceable evidence, original question compatibility, sequential rewards, save/resume, no duplicates and legacy completion');
