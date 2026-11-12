import {AREA_STAGES} from 'virtual:regular-print-catalog';
import {uniquePrintProblems} from './print_uniqueness.js';
import {formatPrintAnswer} from './print_answers.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);
const grade=Number(params.get('grade')||4),mode=params.get('mode')==='teacher'?'teacher':'student';
if(!Number.isInteger(grade)||grade<1||grade>6)throw Error('学年は1〜6年を指定してください');
const areas={1:['area1','area13'],2:['area2'],3:['area3'],4:['area4'],5:['area11'],6:['area12']};
const units=areas[grade].flatMap(id=>AREA_STAGES[id].stages.filter(s=>!s.name.includes('まとめ')));
const select=document.getElementById('unit');select.add(new Option('学年の単元をミックス','mix'));
units.forEach((unit,i)=>select.add(new Option(unit.name,String(i))));
function render(){
  window.reviewReady=false;
  const chosen=select.value==='mix'?units:[units[Number(select.value)]];
  const problems=uniquePrintProblems((i,attempt)=>chosen[(i+Math.floor(attempt/20))%chosen.length].generateProblem(),20);
  document.getElementById('preview').innerHTML=`<article class="sheet"><h1 class="title">${grade}年 算数・${esc(select.selectedOptions[0].textContent)}（${problems.length}問）${mode==='teacher'?'【先生用解答】':''}</h1><p class="meta">${mode==='teacher'?'確認用の解答':'なまえ：________________________　日付：_______________'}</p><div class="questions">${problems.map((p,i)=>`<section class="question"><span class="number">${i+1}.</span><div class="expression">${esc(p.text)}${/[？?。]$/.test(p.text)?'':' ＝'}${mode==='teacher'?`<div class="solution">答え：${esc(formatPrintAnswer(p))}</div>`:`<span class="blank">${Number(p.remainder)>0?'商：　　　　　　　余り：':''}</span>`}</div></section>`).join('')}</div></article>`;
  window.reviewProblems=problems;window.reviewGrade=grade;window.reviewReady=true;
}
select.onchange=render;document.getElementById('refresh').onclick=render;render();
