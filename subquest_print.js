import {getJapaneseReadingQuestsV2,evaluateJapaneseReadingAnswerV2} from './japanese_reading_quests_v2.js';
import {getMathWordQuestsV2,scoreMathWordAnswerV2} from './math_word_quests_v2.js';

export function subquestPrintMeta(subject,record){
 const records=Array.isArray(record)?record:[record];
 const problems=subject==='japanese'?record.questions.map(q=>({text:q.prompt,answer:q.answerText,subquestQuestion:q,subject})):
 records.map(q=>({text:q.story+'\n'+q.question,answer:q.answerDisplay,subquestQuestion:q,subject}));
 return {type:'subquest-print',subject,sourceId:records[0].id,name:`${subject==='japanese'?'国語':'算数'}・${records[0].grade}年・${Array.isArray(record)?'文章問題':record.title}`,problems};
}
export function legacySubquestPrint(id){
 const match=String(id).match(/^(jr|mwq)-v2-g([1-6])-\d+$/);if(!match)return null;
 if(match[1]==='jr'){const record=getJapaneseReadingQuestsV2(Number(match[2])).find(q=>q.id===id);return record?subquestPrintMeta('japanese',record):null;}
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
 return {correct,input,expected:p.answer};
}
