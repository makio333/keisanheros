import {LEGACY_READING_PRINT_QUESTIONS} from './reading_quest_legacy_questions.js';
import {claimMathPrintReward} from './math_word_session.js';
import {claimReadingPrintReward} from './japanese_reading_session_v2.js';
import {claimGradeClearRewards} from './subquest_grade_rewards.js';
import {getJapaneseReadingQuestsV2,evaluateJapaneseReadingAnswerV2} from './japanese_reading_quests_v2.js';
import {getMathWordQuestsV2,scoreMathWordAnswerV2} from './math_word_quests_v2.js';

export function subquestPrintMeta(subject,record){
 const records=Array.isArray(record)?record:[record];
 const problems=subject==='japanese'?record.questions.map(q=>({text:q.prompt,answer:q.answerText,subquestQuestion:q,subject})):
 records.map(q=>({text:q.story+'\n'+q.question,answer:q.answerDisplay,subquestQuestion:q,subject}));
 return {type:'subquest-print',subject,sourceId:records[0].id,name:`${subject==='japanese'?'国語':'算数'}・${records[0].grade}年・${Array.isArray(record)?'文章問題':record.title}`,problems};
}
export function normalizeSubquestPrintId(value){
 const id=String(value??'').normalize('NFKC').trim(),match=id.match(/^(国語|算数)[・\s]+([1-6])年[・\s]+(\d+)$/);
 return match?`${match[1]==='国語'?'jr':'mwq'}-v2-g${match[2]}-${match[3].padStart(match[1]==='国語'?2:3,'0')}`:id;
}
export function legacySubquestPrint(id){
 id=normalizeSubquestPrintId(id);
 const match=String(id).match(/^(jr|mwq)-v2-g([1-6])-\d+$/);if(!match)return null;
 if(match[1]==='jr'){const record=getJapaneseReadingQuestsV2(Number(match[2])).find(q=>q.id===id);return record?subquestPrintMeta('japanese',{...record,questions:record.questions.map((q,i)=>LEGACY_READING_PRINT_QUESTIONS[record.id]?.[i]||q)}):null;}
 const records=getMathWordQuestsV2(Number(match[2])),index=records.findIndex(q=>q.id===id);return index<0?null:subquestPrintMeta('math',records.slice(index,index+5));
}
export function mountSubquestPrintAnswers(root,problems){
 root.replaceChildren();root.classList.remove('unified-many-problems');
 root.style.setProperty('--unified-rows',problems.length);
 problems.forEach((p,i)=>{
  const q=p.subquestQuestion,row=document.createElement('section');row.className='subquest-print-answer';row.dataset.number=i;
  const title=document.createElement('p');title.textContent=`${i+1}問目　${p.text}`;row.append(title);
  const input=(label,key,type='text')=>{const wrap=document.createElement('label');wrap.textContent=label;const field=document.createElement('input');field.type=type;field.dataset.key=key;field.setAttribute('aria-label',`${i+1}問目 ${label}`);if(type!=='checkbox')field.className='challenge-input';wrap.append(field);row.append(wrap);return field;};
  if(p.subject==='math'){for(const f of q.input.fields)input(`${f.label}${f.unit?'（'+f.unit+'）':''}`,f.name);}
  else if(q.input.type==='single-choice'){
   q.input.options.forEach((o,n)=>{const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name=`subquest-print-${i}`;radio.dataset.key='answer';radio.value=o.id;label.append(radio,document.createTextNode(`${q.print.optionLabels[n]}　${o.text}`));row.append(label);});
  }else{
   input('紙に書いた答え','answer');
   if(q.scoring.mode==='human-rubric'){const note=document.createElement('p');note.textContent='大人と紙の答えを確認し、満たした項目にチェックしてください。すべて満たすと正解になります。';row.append(note);q.scoring.criteria.forEach((c,n)=>input(c.description,'criterion-'+n,'checkbox'));}
  }
  const mark=document.createElement('span');mark.id=`unified-mark-${i}`;row.append(mark);root.append(row);
 });
}
export function readSubquestPrintAnswer(root,p,i){
 const row=root.querySelector(`[data-number="${i}"]`),values=Object.fromEntries([...row.querySelectorAll('[data-key]')].filter(el=>el.type!=='radio'||el.checked).map(el=>[el.dataset.key,el.type==='checkbox'?el.checked:el.value.trim()])),q=p.subquestQuestion;
 const input=p.subject==='math'?Object.values(values).join(' ・ '):q.input.type==='single-choice'?(q.input.options.find(o=>o.id===values.answer)?.text||''):values.answer;
 const correct=p.subject==='math'?scoreMathWordAnswerV2(q,values).correct:q.scoring.mode==='human-rubric'?!!values.answer&&q.scoring.criteria.every((_,n)=>values['criterion-'+n]):evaluateJapaneseReadingAnswerV2(q,values.answer).correct===true;
 const answered=p.subject==='math'?q.input.fields.every(f=>String(values[f.name]??'').trim()):!!String(values.answer??'').trim();
 return {correct,input,answered,expected:p.answer};
}

export function claimSubquestPrintReward(game,meta,correctFlags,answeredFlags=meta.problems.map(()=>true)){
 const questions=meta.problems.map(p=>p.subquestQuestion);
 if(!questions.length||correctFlags.length!==questions.length)throw Error('invalid_subquest_print');
 const before={gold:game.player.gold||0,medals:game.questMedals||0,equip:game.equipGachaTenPullTickets||0,skin:game.skinGachaTickets||0};
 const reward=meta.subject==='japanese'?claimReadingPrintReward(game,{id:meta.sourceId,grade:questions[0].grade,questions},correctFlags,answeredFlags):claimMathPrintReward(game,questions,correctFlags,answeredFlags);
 const bonus=claimGradeClearRewards(game);
 return {gold:(game.player.gold||0)-before.gold,medals:(game.questMedals||0)-before.medals,exp:reward.exp+bonus.exp,equip:(game.equipGachaTenPullTickets||0)-before.equip,skin:(game.skinGachaTickets||0)-before.skin};
}
export function subquestPrintRewardEntries(){
 return [{icon:'💰',label:'5問全問正解 2,400G'},{icon:'✨',label:'5問全問正解 1,800EXP'},{icon:'🏅',label:'5問全問正解 メダル10枚'}];
}
