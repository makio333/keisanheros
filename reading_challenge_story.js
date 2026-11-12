import {useHihiruLetterVoice} from './hihiru_letter_voice.js';
import {lowerGradeChallenges} from './reading_challenge_lower_grades.js';
import {READING_QUESTS} from './reading_quests.js';
// Five solved challenges unlock the duel. No map assembly.
export function applySealedChallengeStory(quests){
 for(const q of quests){
  const low=q.grade===1;
  q.title=low?'かいとうからの ちょうせんじょう':'怪盗ヒルルからの五つの挑戦状';
  q.request=low?'「すずを ぬすんだ ヒルルから、ちょうせんじょうが とどいたよ。いつつの なぞを とけたら、しょうぶするって。いっしょに とりもどそう！」':`「${q.stolenItem}を盗んだヒルルから、挑戦状が届いたんだ。五つの謎を全部解いたら、勝負を受けるらしい。一緒に取り戻してくれないか？」`;
  q.challengeOpening=low?'「おれの ちょうせんじょうを、いつつ とけるかな？ ぜんぶ とけたら、おれが しょうぶしてやる。かてたら、ぬすんだ ものは かえす。ひひひ！」':'「盗んだ品を返してほしければ、おれの挑戦状を五つ解いてみろ。最後まで解けた者の挑戦だけを受けよう。勝てたら、盗んだ品は返してやる。ひひひ！」';
  q.steps=READING_QUESTS.filter(p=>p.grade===q.grade).slice(0,5).map((p,i)=>({id:q.id+'-'+(i+1),title:low?'ちょうせんじょう '+(i+1):'挑戦状 '+(i+1),source:low?'ヒルルが のこした なぞ':'ヒルルが封じた物語の謎',letter:p.passage,question:p.dialogueSpeaker==='self'?`（${low?'こころの こえ':'心の声'}）${p.question}`:`${q.npc}「${p.question}」`,scene:p.scene||'',extraction:p.extraction||null,dialogueSpeaker:p.dialogueSpeaker||'npc',answer:p.answer,acceptedAnswers:[...p.acceptedAnswers],evidence:p.evidence,hints:[low?'「こたえが ありそうな ぶんを、もういちど よんでみよう。」':'「物語の中の言葉を手がかりに、一緒に確かめよう。」',low?`「${p.evidence}」の ところを よんでみよう。`:`「${p.evidence}」の部分が手がかりになりそうだ。`,low?`「${p.answer}」かな？ ぶんと くらべてみよう。`:`「${p.answer}」と考えると、話の内容に合うね。`],wrongRoute:low?'「この こたえで いいか、たしかめよう。いっしょに よみなおそう。」':'「この答えが合うか、本文の手がかりと比べてみよう。」'}));
  if(q.grade<=2){q.steps=lowerGradeChallenges(q);const first=q.steps[0];Object.assign(q,{letter:first.letter,question:first.question,answer:first.answer,acceptedAnswers:[...first.acceptedAnswers],evidence:first.evidence});}
  useHihiruLetterVoice(q);
  q.question=q.steps[0].question;
  q.arrival=low?'いつつの ちょうせんじょうを ときおえた！ ヒルルが あらわれ、つるぎを かまえた。':'五つの挑戦状をすべて解き終えた。怪盗ヒルルが姿を現し、剣を構える。';
  q.enemy.opening=low?'「いつつ とも といたか！ やくそくどおり、おれと しょうぶだ！」':'「五つとも解いたか！ 見事だ。約束どおり、おれが勝負を受けよう！」';
  q.storyMode='five-challenges-then-duel';
 }
}
