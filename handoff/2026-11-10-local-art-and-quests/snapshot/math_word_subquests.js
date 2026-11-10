import {groupQuestProblems} from './gameplay_review_settings.js';
import {getMathWordQuestsV2,scoreMathWordAnswerV2} from './math_word_quests_v2.js';
import {READING_VILLAGERS} from './reading_villagers.js';
import {mountFittedQuestPages} from './quest_board_pagination.js';
import {installQuestAnswerPanelWheelScroll} from './quest_answer_panel_scroll.js';

let selectedGrade=1;
const pageByGrade=new Map();
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined&&text!==null)el.textContent=text;if(cls)el.className=cls;return el;};


export function renderMathWordSubquests(root,api){
 const game=api.game();
 const state=game.mathWordQuestsV2 ||= {completed:{}};
 state.completed ||= {};
 const tabs=node('div',null,'reading-grade-tabs');
 const progressSummary=node('div',null,'quest-board-progress-summary');progressSummary.setAttribute('role','status');
 const grid=node('div',null,'reading-quest-grid math-word-quest-grid');
 const pager=node('nav',null,'quest-board-pager');
 root.replaceChildren(node('h3','学年別・文章問題','math-word-quest-heading'),tabs,progressSummary,grid,pager);
 for(let grade=1;grade<=6;grade++){
  const button=node('button',`${grade}年`,'btn');button.type='button';button.setAttribute('aria-pressed',String(grade===selectedGrade));
  button.onclick=()=>{selectedGrade=grade;pageByGrade.set(grade,0);render();};tabs.append(button);
 }
 function render(){
  [...tabs.children].forEach((button,index)=>button.setAttribute('aria-pressed',String(index+1===selectedGrade)));
  const problems=getMathWordQuestsV2(selectedGrade);
  const completed=problems.filter(problem=>state.completed[problem.id]).length;
  progressSummary.classList.toggle('is-complete',completed===problems.length&&problems.length>0);
  progressSummary.replaceChildren(node('span','この学年の進みぐあい','quest-board-progress-label'),node('span',`★ ${completed} / ${problems.length} 依頼クリア`,'quest-board-progress-count'));
  const meter=node('span',null,'quest-board-progress-meter'),fill=node('span',null,'quest-board-progress-fill');fill.style.width=`${problems.length?completed/problems.length*100:0}%`;meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','算数の依頼のクリア数');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax',String(problems.length));meter.setAttribute('aria-valuenow',String(completed));meter.append(fill);progressSummary.append(meter);
  const cards=groupQuestProblems(problems).map((group,index)=>{
   const problem=group[0],solved=group.filter(p=>state.completed[p.id]).length;
   const villager=READING_VILLAGERS[index%READING_VILLAGERS.length];
   const card=node('article',null,'quest-card reading-quest-card');card.dataset.questNoticeKey='math:'+group.map(q=>q.id).join('/');
   const completedQuest=solved===group.length;
   const ribbon=node('div',null,'quest-card-ribbon'),stars=node('span',null,`quest-card-stars${completedQuest?' is-complete':''}`);stars.setAttribute('aria-label',`${solved}問 / ${group.length}問クリア`);for(let i=0;i<group.length;i++)stars.append(node('span','★',state.completed[group[i].id]?'on':''));ribbon.append(stars);
   const art=node('div',null,'quest-card-art'),portrait=node('img');portrait.src=api.asset(villager.image);portrait.alt='';art.append(portrait);
   const reward=node('div',null,'quest-card-rewards reading-card-rewards');
   const cell=node('div',null,`qc-reward${completedQuest?' is-claimed':''}`),icons=node('span',null,'qc-icons');icons.innerHTML=api.rewardIcon('medal','quest-medal',1,24);icons.append(node('small',`最大${group.length}枚`));
   cell.append(icons,node('span',`最大 💰${(300*group.length).toLocaleString()}　✨${20*group.length}EXP`,'qc-gold'));reward.append(cell);
   card.append(ribbon,art,node('div',villager.name,'quest-card-name'),node('h4',problem.title,'quest-card-title'),node('div',`${problem.topic}・${group.length}問`,'quest-card-tag'),reward);
   const actions=node('div',null,'reading-quest-card-actions');
   const open=node('button',completedQuest?'もう一度':solved?`つづき（${solved}/${group.length}）`:'依頼を受ける','btn');open.type='button';open.onclick=()=>showProblem(group.find(p=>!state.completed[p.id])||group[0],villager,group);
   const print=node('button','🖨','btn quest-card-print');print.type='button';print.setAttribute('aria-label',`${problem.title}の問題・解答を印刷`);print.onclick=()=>api.print?.(group);
   actions.append(open,print);card.append(actions);card.onclick=event=>{if(!event.target.closest('button'))showProblem(group.find(p=>!state.completed[p.id])||group[0],villager,group);};return card;
  });
  mountFittedQuestPages(grid,pager,[...cards,...(api.extraCards||[])],{page:pageByGrade.get(selectedGrade)||0,onPage:page=>pageByGrade.set(selectedGrade,page),bind:api.bindRewards});
 }
 function showProblem(problem,villager,group){
  document.querySelector('.reading-subquest-overlay')?.remove();
  const overlay=node('div',null,'reading-subquest-overlay');
  const panel=node('section',null,'reading-subquest-panel quest-answer-panel math-word-answer-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',problem.title);
  const back=node('button','← 依頼一覧へ','btn');back.type='button';back.onclick=()=>{overlay.remove();render();};
  const title=node('h2',`${group.indexOf(problem)+1}／${group.length}問　${problem.title}`),conversation=node('section',null,'reading-villager-dialogue');
  const portrait=node('img');portrait.src=api.asset(villager.image);portrait.alt=villager.name;portrait.className='reading-villager-portrait';
  const speech=node('div'),speaker=node('b',villager.name),quote=node('p',`${problem.grade===1?'この ぶんしょうもんだい':'この文章問題'}を一緒に読んで、答えを確かめてくれる？`);speech.append(speaker,quote);conversation.append(portrait,speech);
  const content=node('div',null,'quest-answer-content math-word-answer-content');
  const context=node('div',null,'quest-question-context math-word-question-context');
  const answerCenter=node('div',null,'quest-answer-center math-word-answer-center');
  const story=node('div',problem.story,'math-word-story'),question=node('div',problem.question,'challenge-problem challenge-problem-word math-word-question');context.append(story);
  const form=node('form',null,'math-word-answer-fields');form.autocomplete='off';const inputs={};
  for(const field of problem.input.fields){
   const label=node('label',null,'math-word-answer-field');label.append(node('span',field.label));
   const input=node('input');input.type='text';input.inputMode=field.keyboard==='integer'?'numeric':'text';input.autocomplete='off';input.autocapitalize='off';input.spellcheck=false;input.name=field.name;input.setAttribute('aria-label',field.label);inputs[field.name]=input;label.append(input);
   if(field.unit)label.append(node('span',field.unit,'math-word-unit'));form.append(label);
  }
  const submit=node('button','けってい','btn btn-primary');submit.type='submit';form.append(submit);
  const feedback=node('p',null,'math-word-feedback');feedback.setAttribute('role','status');
  form.onsubmit=event=>{
   event.preventDefault();if(event.isComposing)return;
   const values=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,input.value]));
   const result=scoreMathWordAnswerV2(problem,values);
   if(!result.correct){feedback.textContent=result.reason==='both_fields_required'?'すべての答えを入れてみよう。':'もう一度、本文と問いを見て考えよう。';api.answerFeedback?.(false);return;}
   form.querySelectorAll('input,button').forEach(input=>input.disabled=true);
   feedback.textContent=`${problem.equation}　${problem.answerDisplay}。${problem.explanation}`;api.answerFeedback?.(true);
   const firstCompletion=!state.completed[problem.id];
   if(firstCompletion){
    state.completed[problem.id]=true;game.player.gold=(Number(game.player.gold)||0)+300;game.questMedals=(Number(game.questMedals)||0)+1;api.exp(20);api.save();api.refresh?.();
   }
   const done=node('p',firstCompletion?'★ 文章問題クリア！　初回報酬：300G・20EXP・クエストメダル1枚':'★ もう一度クリア！　初回報酬は受け取り済みです','reading-story-complete');
   const next=node('button','一覧へもどる','btn btn-primary');next.type='button';next.onclick=()=>{overlay.remove();render();};const nextProblem=group[group.indexOf(problem)+1];
   if(nextProblem){const advance=node('button','次の問題','btn btn-primary');advance.type='button';advance.onclick=()=>{overlay.remove();showProblem(nextProblem,villager,group);};answerCenter.append(advance);}
   answerCenter.append(done,next);
   render();
  };
  answerCenter.append(question,form,feedback);content.append(context,answerCenter);
  panel.append(back,title,content,conversation);overlay.append(panel);document.body.append(overlay);installQuestAnswerPanelWheelScroll(panel);inputs[problem.input.fields[0].name]?.focus({preventScroll:true});
 }
 render();
}
