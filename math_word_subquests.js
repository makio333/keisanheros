import {questRewardFlight,revealQuestResults} from './quest_reward_flight.js';
import {claimGradeClearRewards,gradeRewardSummary} from './subquest_grade_rewards.js';
import {mathRun,mathRewardProgress,storeMathAnswer,finishMathRun,mathResults,retryMathAnswer} from './math_word_session.js';
import {startSubquestTimer} from './subquest_results.js';
import {getMathWordQuestionVisualV2,mathWordGroupRenderPlanV2,mathWordSetsRenderPlanV2} from './math_word_visuals_v2.js';
import itemAtlas from './assets/items/math-word-icons/manifest.json';
import './math_word_subquests.css';
import './reading_quest_letter.css';
const QUEUE_PERSON_URL=new URL('./assets/items/math-word-icons/adventurer_left.png',import.meta.url).href;
const ITEM_ATLAS_URL=new URL('./assets/items/math-word-icons/atlas.png',import.meta.url).href;
const ITEM_SPRITES=Object.fromEntries(itemAtlas.sprites.map(s=>[s.key,s]));
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
   const cell=node('div',null,`qc-reward${completedQuest?' is-claimed':''}`),icons=node('span',null,'qc-icons');icons.innerHTML=api.rewardIcon('medal','quest-medal',1,24);icons.append(node('small',`最大${group.length*2}枚`));
   cell.append(icons,node('span',`最大 💰${(2400).toLocaleString()}　✨${1800}EXP`,'qc-gold'));reward.append(cell);
   card.append(ribbon,art,node('div',villager.name,'quest-card-name'),node('h4',problem.title,'quest-card-title'),node('div',`${problem.topic}・${group.length}問`,'quest-card-tag'),reward);
   const actions=node('div',null,'reading-quest-card-actions');
   const open=node('button',completedQuest?'もう一度':solved?`つづき（${solved}/${group.length}）`:'依頼を受ける','btn');open.type='button';open.onclick=()=>openGroup(group,villager);
   const print=node('button','🖨','btn quest-card-print');print.type='button';print.setAttribute('aria-label',`${problem.title}の問題・解答を印刷`);print.onclick=()=>api.print?.(group);
   actions.append(open,print);card.append(actions);card.onclick=event=>{if(!event.target.closest('button'))openGroup(group,villager);};return card;
  });
  const rewardNote=node('small',gradeRewardSummary(selectedGrade),'subquest-grade-reward-note');progressSummary.append(rewardNote);
  mountFittedQuestPages(grid,pager,[...cards,...(api.extraCards||[])],{page:pageByGrade.get(selectedGrade)||0,onPage:page=>pageByGrade.set(selectedGrade,page),bind:api.bindRewards});
 }
 function rewardHud(group){
  const earned=mathRewardProgress(game,group),hud=node('section',null,'reading-v2-reward-hud is-gaining');hud.append(node('div',`🎁 つみあげた報酬　${earned.percent}％`,'reading-v2-hud-heading'));const counters=node('div',null,'reading-v2-hud-counters');
  for(const [key,icon,unit] of [['medals','🏅','枚'],['gold','💰','G'],['exp','✨','EXP']]){const cell=node('div',null,'reading-v2-hud-counter');if(key==='medals'){const art=node('span');art.innerHTML=api.rewardIcon('medal','quest-medal',1,26);cell.append(art);}else cell.append(node('span',icon));cell.append(node('b',earned.paid[key].toLocaleString()),node('small',` / ${earned.total[key].toLocaleString()} ${unit}`));counters.append(cell);}
  const meter=node('div',null,'reading-v2-hud-meter');meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','報酬の受取率');meter.setAttribute('aria-valuenow',String(earned.percent));for(let i=0;i<group.length*2;i++)meter.append(node('span',null,i<Math.round(earned.percent/100*group.length*2)?'is-earned':''));hud.append(counters,meter);return hud;
 }
 function openGroup(group,villager){const run=mathRun(game,group);if(run.phase==='results')return showResults(group,villager);showProblem(group.find(p=>!run.answers[p.id])||group[0],villager,group);}
 function showResults(group,villager){
  const bonus=claimGradeClearRewards(game);if(bonus.exp)api.exp(bonus.exp);
  document.querySelector('.reading-subquest-overlay')?.remove();const overlay=node('div',null,'reading-subquest-overlay'),panel=node('section',null,'reading-subquest-panel math-word-results');panel.setAttribute('role','dialog');panel.setAttribute('aria-label','サブクエストの答え合わせ');const back=node('button','← 依頼一覧へ','btn');back.onclick=()=>{overlay.remove();render();api.onClose?.();};panel.append(back,rewardHud(group));for(const text of bonus.messages)panel.append(node('p',text,'reading-v2-reward-card'));panel.append(node('h2',`${group.length}問の答え合わせ`));
  for(const [i,r] of mathResults(game,group).entries()){const row=node('section',null,'math-word-result-row'+(r.correct?'':' is-wrong'));row.append(node('b',`${i+1}問め　${r.correct?'正解':'ヒント付きで再挑戦'}`),node('p',r.problem.story+'\n'+r.problem.question),node('p','あなたの答え：'+Object.values(r.answer||{}).join(' ・ ')));if(r.correct){if(JSON.stringify(r.answer)!==JSON.stringify(r.reviewAnswer))row.append(node('p','解き直しの答え：'+Object.values(r.reviewAnswer||{}).join(' ・ ')));row.append(node('p',r.problem.explanation));}else{const retry=node('button','✎ ヒント付きで解き直す','btn btn-primary');retry.onclick=()=>showProblem(r.problem,villager,group,true);row.append(retry);}panel.append(row);}
  const remaining=100-mathRewardProgress(game,group).percent;if(!remaining&&api.onComplete){const done=node('button','依頼を完了する','btn btn-primary');done.onclick=()=>{overlay.remove();api.onComplete();};panel.append(done);}panel.append(node('p',remaining?`積み上げた報酬はそのまま。解き直すと残り${remaining}％を受け取れます。`:'報酬100％！ 全問クリア！'));overlay.append(panel);document.body.append(overlay);revealQuestResults(panel);api.save();render();
 }
 function showProblem(problem,villager,group,review=false){
  document.querySelector('.reading-subquest-overlay')?.remove();
  const overlay=node('div',null,'reading-subquest-overlay');
  const panel=node('section',null,'reading-subquest-panel quest-answer-panel math-word-reading-answer-panel reading-v2-answer-panel');panel.dataset.grade=String(problem.grade);panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',problem.title);
  const stopTime=startSubquestTimer(panel);const back=node('button','← 依頼一覧へ','btn');back.type='button';back.onclick=()=>{stopTime();overlay.remove();render();api.onClose?.();};
  const title=node('h2',`${group.indexOf(problem)+1}／${group.length}問　${problem.title}`),conversation=node('section',null,'reading-villager-dialogue');
  const portrait=node('img');portrait.src=api.asset(villager.image);portrait.alt=villager.name;portrait.className='reading-villager-portrait';
  const speech=node('div'),speaker=node('b',villager.name),quote=node('p',`${problem.grade===1?'この ぶんしょうもんだい':'この文章問題'}を一緒に読んで、答えを確かめてくれる？`);speech.append(speaker,quote);conversation.append(portrait,speech);
  const content=node('div',null,'quest-answer-content math-word-answer-content');
  const context=node('div',null,'quest-question-context math-word-question-context');
  const answerCenter=node('div',null,'quest-answer-center math-word-answer-center');
  const story=node('div',problem.story,'math-word-story'),question=node('div',problem.question,'challenge-problem challenge-problem-word math-word-question');const letter=node('article',null,'reading-v2-letter');
  const letterHeader=node('header',null,'reading-v2-letter-header');letterHeader.append(node('span',problem.subject==='reading'?'村人からの読書便り':'村人からの算数の手紙','reading-v2-letter-eyebrow'),node('h2',problem.title));
  story.classList.add('reading-v2-passage','math-word-letter-story');if(review){story.replaceChildren();for(const text of problem.story.split(/([0-9０-９]+)/)){const part=node(/^[0-9０-９]+$/.test(text)?'mark':'span',text);if(part.tagName==='MARK')part.className='reading-v2-pencil-hint';story.append(part);}}
  letter.append(letterHeader,story);const visual=renderMathWordVisual(problem);
  const signature=node('footer',null,'reading-v2-letter-signature');signature.append(node('span','勇者へ'),node('b',villager.name+' より'));question.classList.add('math-word-letter-question');letter.append(question);if(visual&&problem.grade<=2)letter.append(visual);letter.append(signature);context.append(letter);
  const form=node('form',null,'math-word-answer-fields');form.autocomplete='off';const inputs={};
  for(const field of problem.input.fields){
   const label=node('label',null,'math-word-answer-field');label.append(node('span',field.label));
   const input=node('input');input.type='text';input.inputMode=field.keyboard==='integer'?'numeric':'text';input.autocomplete='off';input.autocapitalize='off';input.spellcheck=false;input.name=field.name;input.setAttribute('aria-label',field.label);input.value=mathRun(game,group).answers[problem.id]?.[field.name]||'';inputs[field.name]=input;label.append(input);
   if(field.unit)label.append(node('span',field.unit,'math-word-unit'));form.append(label);
  }
  const submit=node('button',review?'この答えを確認する':group.indexOf(problem)===group.length-1?'全問まとめて答え合わせ':'回答を保存して次へ','btn btn-primary');submit.type='submit';form.append(submit);
  const feedback=node('p',null,'math-word-feedback');feedback.setAttribute('role','status');
  form.onsubmit=async event=>{
   event.preventDefault();if(event.isComposing||submit.disabled)return;
   const values=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,input.value]));
   if(Object.values(values).some(value=>!value.trim())){feedback.textContent='すべての答えを入れてね。';return;}
   submit.disabled=true;await questRewardFlight(submit);
   const ms=stopTime();
   if(review){const result=retryMathAnswer(game,group,problem,values,ms);if(result.reward)api.exp(result.reward.exp);api.save();api.refresh?.();if(result.correct){showResults(group,villager);return;}feedback.textContent='もう一度、本文の数字と問いを確かめよう。';submit.disabled=true;const again=node('button','もう一度考える','btn');again.onclick=()=>showProblem(problem,villager,group,true);foreground.append(again);return;}
   const reward=storeMathAnswer(game,group,problem,values,ms);api.exp(reward.exp);api.save();api.refresh?.();const next=group[group.indexOf(problem)+1];if(next)showProblem(next,villager,group);else{const completion=finishMathRun(game,group);if(completion)api.exp(completion.exp);api.save();showResults(group,villager);}

  };
  const scenePortrait=node('img',null,'reading-v2-scene-villager');scenePortrait.src=api.asset(villager.image);scenePortrait.alt=villager.name;
  const foreground=node('section',null,'reading-v2-answer-foreground');foreground.append(node('h3',`${group.indexOf(problem)+1}／${group.length}問め`,'reading-story-progress'),node('p',review?(problem.hint||'ヒント：本文にある数字と、何を求めるかを確かめよう。'):'答え合わせは全問回答のあと。回答と正解で報酬が半分ずつ積み上がります。','reading-v2-batch-note'),form,feedback);
  answerCenter.append(scenePortrait,foreground);content.classList.add('reading-v2-answer-content');context.classList.add('reading-v2-question-context');answerCenter.classList.add('reading-v2-answer-center');
  const header=node('header',null,'reading-v2-scene-header');const rewardSummary=rewardHud(group);header.append(back,rewardSummary);content.append(context,answerCenter);panel.append(header,content);overlay.append(panel);document.body.append(overlay);installQuestAnswerPanelWheelScroll(panel);inputs[problem.input.fields[0].name]?.focus({preventScroll:true});
 }
 if(api.records){openGroup(api.records,api.villager);return;}render();
}

const el=node;
function itemSprite(key, size = 22) {
  const sprite = ITEM_SPRITES[key];
  if (!sprite) return null;
  const node = el('span', null, 'math-word-item-icon');
  node.setAttribute('aria-hidden', 'true');
  node.style.cssText=`display:inline-block;flex:0 0 ${size}px;min-width:0;min-height:0;padding:0;border:0;box-sizing:content-box;line-height:0;background-repeat:no-repeat;overflow:hidden;max-height:${size}px`;
  node.style.width = `${size}px`;
  node.style.height = `${size}px`;
  node.style.backgroundImage = `url("${ITEM_ATLAS_URL}")`;
  node.style.backgroundSize = `${size * itemAtlas.columns}px ${size * itemAtlas.rows}px`;
  node.style.backgroundPosition = `${-size * (sprite.column - 1)}px ${-size * (sprite.row - 1)}px`;
  return node;
}

function visualOperator(text) {
  const node = el('span', text, 'math-word-visual-operator');
  node.setAttribute('aria-hidden', 'true');
  return node;
}

function renderMathWordVisual(problem) {
  const visual = getMathWordQuestionVisualV2(problem.id);
  if (!visual) return null;
  const compact = window.matchMedia?.('(max-width: 600px)').matches;
  const regularSize = compact ? (problem.grade === 1 ? 30 : 27) : (problem.grade === 1 ? 44 : 38);
  const figure = el('figure', null, 'math-word-item-visual');
  figure.setAttribute('role', 'img');
  figure.setAttribute('aria-label', visual.alt || '問題文に出てくるもの');

  if (visual.groups) {
    const groups = el('div', null, 'math-word-visual-groups');
    visual.groups.forEach((group, index) => {
      if (index && group.operator) groups.append(visualOperator(group.operator));
      const groupNode = el('div', null, 'math-word-visual-group');
      if (group.tone) groupNode.dataset.tone = group.tone;
      const renderPlan = mathWordGroupRenderPlanV2(group);
      if (renderPlan.mode === 'bundles') {
        const bundleRows = el('div', null, 'math-word-visual-bundles');
        for (const bundle of renderPlan.bundles) {
          const row = el('div', null, 'math-word-visual-bundle-row');
          row.append(el('span', bundle.label, 'math-word-visual-bundle-label'));
          const icons = el('span', null, 'math-word-visual-bundle-icons');
          for (let i = 0; i < bundle.count; i++) icons.append(itemSprite(group.icon, compact ? 26 : 32));
          row.append(icons);
          bundleRows.append(row);
        }
        groupNode.append(bundleRows);
      } else {
        for (let i = 0; i < renderPlan.count; i++) {
          const icon = itemSprite(group.icon, regularSize);
          if (!icon) continue;
          const removal = renderPlan.removalGroups.find(item => i >= item.start && i < item.end);
          if (removal) icon.classList.add('is-removed', `is-removed-${removal.kind}`);
          else if (!renderPlan.removalGroups.length && i < renderPlan.removedCount) icon.classList.add('is-removed');
          if (i < renderPlan.highlightedCount) icon.classList.add('is-highlighted');
          groupNode.append(icon);
        }
      }
      if (renderPlan.removalGroups.length) {
        const removalKey = el('span', null, 'math-word-visual-removal-key');
        for (const removal of renderPlan.removalGroups) {
          const note = el('span', `${removal.label} ${removal.count}${group.unit || ''}`, 'math-word-visual-removal-note');
          note.dataset.kind = removal.kind;
          removalKey.append(note);
        }
        groupNode.append(removalKey);
      }
      if (group.label) groupNode.append(el('span', group.label, 'math-word-visual-note'));
      groupNode.append(el('span', renderPlan.countLabel, 'math-word-visual-count'));
      groups.append(groupNode);
    });
    figure.append(groups);
  }

  if (visual.sequence) {
    const sequence = el('div', null, 'math-word-visual-sequence');sequence.style.setProperty('--queue-count',visual.sequence.count);sequence.append(el('b','← まえ','math-word-queue-front'));
    const marks = new Map((visual.sequence.marks || []).map(mark => [mark.position, mark.label]));
    for (let position = 1; position <= visual.sequence.count; position++) {
      const person = el('span', null, 'math-word-visual-person');
      if (marks.has(position)) person.classList.add('is-marked');
      const sprite=el('img',null,'math-word-queue-person');sprite.src=QUEUE_PERSON_URL;sprite.alt='左向きのなかま';person.append(sprite);
      if (marks.has(position)) person.append(el('small', marks.get(position), 'math-word-visual-person-label'));
      sequence.append(person);
    }
    sequence.append(el('b','うしろ','math-word-queue-back'));figure.append(sequence);
  }

  if (visual.sets) {
    const sets = el('div', null, 'math-word-visual-sets');
    const renderPlan = mathWordSetsRenderPlanV2(visual.sets);
    for (const group of renderPlan.groups) {
      const set = el('div', null, 'math-word-visual-set');
      set.append(itemSprite(group.contextIcon, compact ? 32 : 38));
      const itemIcons = el('span', null, 'math-word-visual-set-items');
      for (let index = 0; index < group.itemCount; index++) itemIcons.append(itemSprite(group.itemIcon, compact ? 20 : 25));
      set.append(itemIcons, el('small', group.label, 'math-word-visual-set-count'));
      sets.append(set);
    }
    if (renderPlan.extra) {
      const extra = el('div', null, 'math-word-visual-group');
      const extraSize = compact ? 26 : 32;
      for (let i = 0; i < renderPlan.extra.itemCount; i++) extra.append(itemSprite(renderPlan.extra.icon, extraSize));
      extra.append(el('span', renderPlan.extra.countLabel, 'math-word-visual-count'));
      sets.append(extra);
    }
    figure.append(sets);
  }

  if (visual.grid) {
    const grid = el('div', null, 'math-word-visual-grid');
    const gridIconSize = compact ? 23 : 30;
    grid.style.gridTemplateColumns = `repeat(${visual.grid.columns}, ${gridIconSize}px)`;
    for (let index = 0; index < visual.grid.rows * visual.grid.columns; index++) grid.append(itemSprite(visual.grid.icon, gridIconSize));
    figure.append(grid);
  }

  return figure;
}
