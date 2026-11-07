import {getJapaneseReadingQuestsV2,evaluateJapaneseReadingAnswerV2} from './japanese_reading_quests_v2.js';
import {READING_VILLAGERS} from './reading_villagers.js';
import {mountReadingAnswerBoard} from './reading_answer_board.js';
import {renderQuestPageControls} from './quest_board_pagination.js';
import {installQuestAnswerPanelWheelScroll} from './quest_answer_panel_scroll.js';

const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined&&text!==null)el.textContent=text;if(cls)el.className=cls;return el;};
function visiblePageSize(){const columns=window.matchMedia('(max-width: 640px)').matches?2:3;const height=document.querySelector('#screen-quest-board .quest-board-wood')?.clientHeight||window.innerHeight;return columns*Math.max(1,Math.min(4,Math.floor(Math.max(1,height-180)/220)));}
function appendAnnotatedText(target,record){
 const chars=[...record.passage],ruby=new Map((record.ruby?.overrides||[]).map(span=>[span.start,span])),refs=record.references||[];
 const annotatedRange=(from,to)=>{const fragment=document.createDocumentFragment();for(let i=from;i<to;i++){
  const ref=refs.find(item=>i>=item.start&&i<item.end);let part=document.createTextNode(chars[i]);
  if(ref){const underline=document.createElement('u');if(i===ref.start){const mark=document.createElement('sup');mark.className='reading-v2-reference-label';mark.textContent=ref.label;underline.append(mark);}underline.append(part);part=underline;}
  fragment.append(part);
 }return fragment;};
 for(let i=0;i<chars.length;){
  const span=ruby.get(i);
  if(span&&span.end<=chars.length){const r=document.createElement('ruby');r.append(annotatedRange(span.start,span.end));const rt=document.createElement('rt');rt.textContent=span.reading;r.append(rt);target.append(r);i=span.end;continue;}
  target.append(annotatedRange(i,i+1));i++;
 }
 target.setAttribute('lang','ja');target.setAttribute('aria-label','ルビ・下線のある本文');
}

export function renderJapaneseReadingV2Subquests(root,grade,api){
 const game=api.game(),state=game.japaneseReadingV2 ||= {progress:{},claimed:{}};state.progress||={};state.claimed||={};
 const heading=node('h3',`${grade}年・村人と読む文章問題`,'reading-v2-section-heading');
 const progressSummary=node('div',null,'quest-board-progress-summary');progressSummary.setAttribute('role','status');
 const grid=node('div',null,'reading-quest-grid reading-v2-quest-grid'),pager=node('nav',null,'quest-board-pager');
 const passages=getJapaneseReadingQuestsV2(grade),cards=passages.map((record,index)=>{
  const villager=READING_VILLAGERS[index%READING_VILLAGERS.length],solved=Math.max(0,Math.min(5,Number(state.progress[record.id])||0));
  const card=node('article',null,'quest-card reading-quest-card reading-v2-quest-card');
  const ribbon=node('div',null,'quest-card-ribbon'),stars=node('span',null,`quest-card-stars${solved===5?' is-complete':''}`);stars.setAttribute('aria-label',`${solved}問 / 5問クリア`);for(let i=0;i<5;i++)stars.append(node('span','★',i<solved?'on':''));ribbon.append(stars);
  const art=node('div',null,'quest-card-art'),portrait=node('img');portrait.src=api.asset(villager.image);portrait.alt='';art.append(portrait);
  const rewards=node('div',null,'quest-card-rewards reading-card-rewards'),reward=node('div',null,`qc-reward${state.claimed[record.id]?' is-claimed':''}`),icons=node('span',null,'qc-icons');icons.innerHTML=api.rewardIcon('medal','quest-medal',1,24);icons.append(node('small','1問×1'));
  reward.append(node('b',state.claimed[record.id]?'獲得済み':'初回のごほうび'),icons,node('span','💰900　✨60EXP','qc-gold'));rewards.append(reward);
  card.append(ribbon,art,node('div',villager.name,'quest-card-name'),node('h4',record.title,'quest-card-title'),node('div',`${record.genre}・${record.topic}／同じ文章で5問`,'quest-card-tag'),rewards);
  const actions=node('div',null,'reading-quest-card-actions');
  const open=node('button',solved===5?'もう一度読む':solved?`つづき（${solved}/5）`:'依頼を受ける','btn');open.type='button';open.onclick=()=>showQuestion(record,villager,state.progress[record.id]>=5?0:solved,state.progress[record.id]>=5);
  const print=node('button','🖨 印刷','btn');print.type='button';print.setAttribute('aria-label',`${record.title}の問題・解答を印刷`);print.onclick=()=>api.print?.(record);
  actions.append(open,print);card.append(actions);card.onclick=event=>{if(!event.target.closest('button'))open.click();};return card;
 });
 const earnedStars=passages.reduce((sum,record)=>sum+Math.max(0,Math.min(5,Number(state.progress[record.id])||0)),0),totalStars=passages.length*5;
 progressSummary.classList.toggle('is-complete',totalStars>0&&earnedStars===totalStars);
 progressSummary.replaceChildren(node('span','この学年の進みぐあい','quest-board-progress-label'),node('span',`★ ${earnedStars} / ${totalStars} 問クリア`,'quest-board-progress-count'));
 const meter=node('span',null,'quest-board-progress-meter'),fill=node('span',null,'quest-board-progress-fill');fill.style.width=`${totalStars?earnedStars/totalStars*100:0}%`;meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','国語の文章問題のクリア数');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax',String(totalStars));meter.setAttribute('aria-valuenow',String(earnedStars));meter.append(fill);progressSummary.append(meter);
 root.replaceChildren(heading,progressSummary,grid,pager);
 grid.replaceChildren(...cards);
 const pageSize=visiblePageSize(),page=renderQuestPageControls(pager,{page:api.pageForGrade?.(grade)||0,total:cards.length,pageSize,onChange:next=>{api.setPageForGrade?.(grade,next);renderJapaneseReadingV2Subquests(root,grade,api);}});
 grid.replaceChildren(...cards.slice(page*pageSize,(page+1)*pageSize));api.bindRewards(grid);

 function showQuestion(record,villager,index,replay){
  document.querySelector('.reading-subquest-overlay')?.remove();
  const overlay=node('div',null,'reading-subquest-overlay'),panel=node('section',null,'reading-subquest-panel quest-answer-panel reading-v2-answer-panel');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','reading-v2-title');
  const back=node('button','← 依頼一覧へ','btn');back.type='button';back.onclick=()=>{overlay.remove();renderJapaneseReadingV2Subquests(root,grade,api);};
  const title=node('h2',record.title);title.id='reading-v2-title';
  const dialogue=node('section',null,'reading-villager-dialogue'),portrait=node('img');portrait.src=api.asset(villager.image);portrait.alt=villager.name;portrait.className='reading-villager-portrait';
  const speech=node('div');speech.append(node('b',villager.name),node('p',grade===1?'この おはなしを いっしょに よんで、五つのことを たしかめよう。':'村に届いた記録を一緒に読んで、五つの問いを確かめてくれる？'));dialogue.append(portrait,speech);
  const content=node('div',null,'quest-answer-content reading-v2-answer-content');
  const context=node('div',null,'quest-question-context reading-v2-question-context');
  const answerCenter=node('div',null,'quest-answer-center reading-v2-answer-center');
  const passage=node('div',null,'reading-passage reading-v2-passage');appendAnnotatedText(passage,record);passage.tabIndex=0;context.append(passage);
  const progress=node('p',`${index+1}／5問め　${record.questions[index].skill}`,'reading-story-progress');
  const question=record.questions[index],prompt=node('div',question.prompt,'challenge-problem challenge-problem-word quest-reading-question reading-v2-prompt');
  const feedback=node('p',null,'reading-v2-feedback');feedback.setAttribute('role','status');
  const answerArea=node('div',null,'reading-v2-answer-area');answerCenter.append(progress,prompt,answerArea,feedback);content.append(context,answerCenter);panel.append(back,title,content,dialogue);overlay.append(panel);document.body.append(overlay);installQuestAnswerPanelWheelScroll(panel);

  function completeQuestion(result){
   if(result.status==='invalid-input'){feedback.textContent='答えを入れてから、もう一度ためしてね。';api.answerFeedback?.(false);return false;}
   if(result.status==='incorrect'){feedback.textContent='本文のことばをもう一度たしかめてみよう。';api.answerFeedback?.(false);return false;}
   if(result.status!=='correct'&&result.status!=='needs-review')return false;
   if(result.status==='correct')feedback.textContent=`正解！ ${question.explanation}`;
   else feedback.textContent='大人に答えと本文の手がかりを確認してもらいました。考え方には一つだけの正解はありません。';
   if(result.status==='correct')api.answerFeedback?.(true);
   const firstCompletion=!replay&&index===4&&!state.claimed[record.id];
   if(!replay){if(index===(Number(state.progress[record.id])||0)&&!state.claimed[record.id])game.questMedals=(Number(game.questMedals)||0)+1;const nextIndex=index+1;state.progress[record.id]=nextIndex;if(nextIndex===5&&!state.claimed[record.id]){
     state.claimed[record.id]=true;game.player.gold=(Number(game.player.gold)||0)+900;api.exp(60);
    }api.save();api.refresh?.();}
   const next=node('button',index<4?'次の問題':'依頼をおわる','btn btn-primary');next.type='button';next.className='btn btn-primary quest-answer-next';next.onclick=()=>{
    overlay.remove();if(index<4)showQuestion(record,villager,index+1,replay);else renderJapaneseReadingV2Subquests(root,grade,api);
   };
   if(index===4){const thanks=node('section',null,'reading-villager-dialogue');thanks.dataset.dialogue='thanks';thanks.append(node('b',villager.name),node('p',firstCompletion?'最後まで読んでくれてありがとう！ 初回報酬：900G・60EXPを受け取ったよ。メダルは1問正解するごとに1枚ずつ獲得！':replay?'もう一度最後まで読んでくれてありがとう。初回報酬は受け取り済みだよ。':'最後まで読んでくれてありがとう！'));answerCenter.append(thanks);}
   answerCenter.append(next);
   return true;
  }
  if(question.input.type==='single-choice'){
   const options=node('div',null,'reading-v2-options');question.input.options.forEach((option,optionIndex)=>{
    const choice=node('button',`${question.print.optionLabels[optionIndex]}　${option.text}`,'btn reading-v2-choice');choice.type='button';choice.onclick=()=>{if(completeQuestion(evaluateJapaneseReadingAnswerV2(question,option.id)))options.querySelectorAll('button').forEach(button=>button.disabled=true);};options.append(choice);
   });answerArea.append(options);
  }else if(question.input.type==='extraction'){
   const form=node('form',null,'quest-answer-form reading-v2-extraction-form');form.autocomplete='off';const input=node('input');input.type='text';input.inputMode='text';input.autocomplete='off';input.autocapitalize='off';input.spellcheck=false;input.className='challenge-input quest-reading-input';input.setAttribute('aria-label','本文から抜き出す答え');
   const submit=node('button','けってい','btn btn-primary challenge-submit-btn');submit.type='submit';form.append(input,submit);const board=node('div',null,'quest-reading-kana-board');board.hidden=true;mountReadingAnswerBoard(input,board);const toggle=node('button','50音ボード','btn');toggle.type='button';toggle.onclick=()=>{board.hidden=!board.hidden;};
   form.onsubmit=event=>{event.preventDefault();if(event.isComposing)return;const result=evaluateJapaneseReadingAnswerV2(question,input.value);if(result.status==='correct'){input.disabled=true;submit.disabled=true;toggle.disabled=true;}completeQuestion(result);};answerArea.append(form,toggle,board);input.focus({preventScroll:true});
  }else{
   const hint=node('p',question.scoring.equivalentAnswers,'reading-v2-review-hint'),label=node('label',null,'reading-v2-response-label');label.append(node('span',grade<=2?'自分の考えを話すか書こう（口頭でも答えられます）':'自分の考えと、本文の手がかりを書こう'));
   const response=node('textarea');response.rows=3;response.maxLength=question.characterCondition.max;response.setAttribute('aria-label','自分の考えと本文の手がかり');label.append(response);
   const criteria=node('fieldset',null,'reading-v2-review-criteria');criteria.append(node('legend','大人と一緒に確認'));
   for(const item of question.scoring.criteria){const row=node('label',null,'reading-v2-criterion');const check=node('input');check.type='checkbox';check.value=item.id;row.append(check,node('span',item.description));criteria.append(row);}
   const submit=node('button','人に確認してもらって次へ','btn btn-primary');submit.type='button';submit.disabled=true;
   submit.disabled=true;
   criteria.addEventListener('change',()=>{submit.disabled=criteria.querySelectorAll('input:checked').length!==question.scoring.criteria.length;});
   submit.onclick=()=>{if(!response.value.trim())response.value='口頭で答えました';completeQuestion(evaluateJapaneseReadingAnswerV2(question,response.value));};
   answerArea.append(hint,label,criteria,submit);
  }
 }
}
