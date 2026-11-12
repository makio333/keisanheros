import {evaluateJapaneseReadingAnswerV2,normalizeReadingAnswerV2} from './japanese_reading_quests_v2.js';

export const READING_TOTAL_REWARD=Object.freeze({medals:10,gold:2400,exp:1800});
export const READING_PART_REWARD=Object.freeze({medals:1,gold:240,exp:180});
export function readingState(game){
 const s=game.japaneseReadingV2 ||= {};for(const key of ['progress','claimed','sessions','reviewClaimed','rewardLedger'])s[key] ||= {};return s;
}
export function readingSession(game,record,restart=false){
 const s=readingState(game);
 if(restart||!s.sessions[record.id])s.sessions[record.id]={answers:Array(5).fill(null),phase:'answering',reviewed:[],reviewAnswers:{},rewardVersion:2};
 const run=s.sessions[record.id];if(run.rewardVersion!==2){run.reviewed=[];run.reviewAnswers={};run.rewardVersion=2;}run.reviewAnswers||={};
 for(let i=0;i<5;i++){
  const q=record.questions[i];
  if(run.answers[i]==='口頭で答えました'){run.answers[i]=null;run.reviewed=run.reviewed.filter(n=>n!==i);delete run.reviewAnswers[i];}
  if(q.input.type==='single-choice'&&run.answers[i]&&!q.input.options.some(o=>o.id===run.answers[i]))run.answers[i]=(q.legacyAcceptedAnswers||[]).some(a=>normalizeReadingAnswerV2(a)===normalizeReadingAnswerV2(run.answers[i]))?q.accepted[0]:null;
  if(q.input.type==='single-choice'&&run.reviewAnswers[i]&&!q.input.options.some(o=>o.id===run.reviewAnswers[i])){delete run.reviewAnswers[i];run.reviewed=run.reviewed.filter(n=>n!==i);}
 }
 return run;
}
function ledger(game,record){
 const s=readingState(game);
 if(!s.rewardLedger[record.id]){
  // Credit payouts from both earlier reward schemes; never revoke or repeat them.
  const completed=!!s.claimed[record.id],reviewed=!!s.reviewClaimed[record.id],legacy=Math.max(0,Math.min(5,Number(s.progress[record.id])||0));
  s.rewardLedger[record.id]={answered:Array(5).fill(completed),mastered:Array(5).fill(reviewed),paid:reviewed?{...READING_TOTAL_REWARD}:completed?{medals:5,gold:900,exp:s.sessions[record.id]?.completionReward?.exp||60}:{medals:legacy,gold:0,exp:0}};
 }
 return s.rewardLedger[record.id];
}
function pay(game,record){
 const l=ledger(game,record),units=l.answered.filter(Boolean).length+l.mastered.filter(Boolean).length;
 const reward=Object.fromEntries(Object.keys(READING_TOTAL_REWARD).map(key=>[key,Math.max(0,READING_PART_REWARD[key]*units-l.paid[key])]));
 for(const key of Object.keys(reward))l.paid[key]+=reward[key];
 game.questMedals=(Number(game.questMedals)||0)+reward.medals;game.player.gold=(Number(game.player.gold)||0)+reward.gold;
 return Object.values(reward).some(n=>n>0)?reward:null;
}
export function readingRewardProgress(game,record){
 const l=ledger(game,record),paid={...l.paid};return {paid,percent:Math.min(100,Math.floor(paid.gold/READING_TOTAL_REWARD.gold*100)),remaining:Object.fromEntries(Object.keys(paid).map(k=>[k,Math.max(0,READING_TOTAL_REWARD[k]-paid[k])])),complete:l.answered.every(Boolean)&&l.mastered.every(Boolean)};
}
export function storeReadingAnswer(game,record,index,answer){
 const run=readingSession(game,record);if(run.phase!=='answering'||!Number.isInteger(index)||index<0||index>=5||!String(answer??'').trim()||answer==='口頭で答えました')return false;
 const q=record.questions[index];if(q.input.type==='single-choice'&&!q.input.options.some(o=>o.id===answer))return false;
 run.answers[index]=String(answer);return true;
}
export function claimReadingAnswerReward(game,record,index){
 const run=readingSession(game,record);if(run.phase!=='answering'||!Number.isInteger(index)||index<0||index>=5||!run.answers[index])return null;
 ledger(game,record).answered[index]=true;return pay(game,record);
}
export function readingResults(record,run){return record.questions.map((q,i)=>{
 const original=evaluateJapaneseReadingAnswerV2(q,run.answers[i]),answer=run.reviewAnswers?.[i]??run.answers[i];
 const result=run.reviewed.includes(i)?{status:'correct',correct:true}:evaluateJapaneseReadingAnswerV2(q,answer);
 return {question:q,answer:run.answers[i],reviewAnswer:run.reviewAnswers?.[i],originalStatus:original.status,...result};
});}
export function finishReadingSession(game,record){
 const s=readingState(game),run=readingSession(game,record);
 if(run.phase!=='answering'||run.answers.length!==5||run.answers.some(a=>a==null||!String(a).trim()))return null;
 const l=ledger(game,record);run.phase='results';s.claimed[record.id]=true;
 readingResults(record,run).forEach((r,i)=>{l.answered[i]=true;if(r.status==='correct')l.mastered[i]=true;});
 s.progress[record.id]=Math.max(Number(s.progress[record.id])||0,l.mastered.filter(Boolean).length);
 return pay(game,record);
}
export function readingReviewTargets(record,run){return readingResults(record,run).flatMap((r,i)=>r.status!=='correct'?[i]:[]);}
export function confirmReadingReview(game,record,index,answer,humanConfirmed=false){
 const s=readingState(game),run=readingSession(game,record);
 if(run.phase==='answering'||!readingReviewTargets(record,run).includes(index)||!String(answer??'').trim()||answer==='口頭で答えました')return {status:'invalid-input',reward:null};
 const q=record.questions[index],result=evaluateJapaneseReadingAnswerV2(q,answer);
 if(result.status==='needs-review'&&!humanConfirmed)return {status:'needs-review',reward:null};
 if(!['correct','needs-review'].includes(result.status))return {...result,reward:null};
 run.reviewAnswers[index]=String(answer);run.reviewed.push(index);ledger(game,record).mastered[index]=true;s.progress[record.id]=Math.max(Number(s.progress[record.id])||0,ledger(game,record).mastered.filter(Boolean).length);
 if(!readingReviewTargets(record,run).length){run.phase='reviewed';s.reviewClaimed[record.id]=true;}
 return {status:'correct',reward:pay(game,record)};
}
export function readingAnswerText(question,answer){return question.input.type==='single-choice'?question.input.options.find(o=>o.id===answer)?.text||'未回答':answer||'未回答';}
