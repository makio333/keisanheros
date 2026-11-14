import {claimGradeClearRewards,gradeRewardSummary} from './subquest_grade_rewards.js';
import {startSubquestTimer} from './subquest_results.js';
import {questMedalImage} from './quest_medal_art.js';
import './quest_board_notice.css';
import {getJapaneseReadingQuestsV2} from './japanese_reading_quests_v2.js';
import {readingRetryHint} from './reading_retry_hints.js';
import {READING_VILLAGERS} from './reading_villagers.js';
import {mountReadingAnswerBoard} from './reading_answer_board.js';
import {mountFittedQuestPages} from './quest_board_pagination.js';
import {installQuestAnswerPanelWheelScroll} from './quest_answer_panel_scroll.js';
import './reading_quest_letter.css';
import {readingState,readingSession,storeReadingAnswer,finishReadingSession,readingResults,readingReviewTargets,confirmReadingReview,readingAnswerText,claimReadingAnswerReward,readingRewardProgress,READING_TOTAL_REWARD} from './japanese_reading_session_v2.js';

const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined&&text!==null)el.textContent=text;if(cls)el.className=cls;return el;};
function appendAnnotatedText(target,record,hints=[]){
 const chars=[...record.passage],ruby=new Map((record.ruby?.overrides||[]).map(span=>[span.start,span])),refs=record.references||[];
 const annotatedRange=(from,to)=>{const fragment=document.createDocumentFragment();let pencil=null;for(let i=from;i<to;i++){
  const ref=refs.find(item=>i>=item.start&&i<item.end);let part=document.createTextNode(chars[i]);
  if(ref){const underline=document.createElement('u');if(i===ref.start){const mark=document.createElement('sup');mark.className='reading-v2-reference-label';mark.textContent=ref.label;underline.append(mark);}underline.append(part);part=underline;}
  if(hints.some(range=>i>=range.start&&i<range.end)){if(!pencil){pencil=node('span',null,'reading-v2-pencil-hint');fragment.append(pencil);}pencil.append(part);}else{pencil=null;fragment.append(part);}
 }return fragment;};
 for(let i=0;i<chars.length;){
  const span=ruby.get(i);
  if(span&&span.end<=chars.length){const r=document.createElement('ruby');r.append(annotatedRange(span.start,span.end));const rt=document.createElement('rt');rt.textContent=span.reading;r.append(rt);target.append(r);i=span.end;continue;}
  target.append(annotatedRange(i,i+1));i++;
 }
 target.setAttribute('lang','ja');target.setAttribute('aria-label','ルビ・下線のある本文');
}

export function renderJapaneseReadingV2Subquests(root,grade,api){
 const game=api.game(),state=readingState(game),visualRewards=new Map();
 const heading=node('h3',`${grade}年・村人と読む文章問題`,'reading-v2-section-heading');
 const progressSummary=node('div',null,'quest-board-progress-summary');progressSummary.setAttribute('role','status');
 const grid=node('div',null,'reading-quest-grid reading-v2-quest-grid'),pager=node('nav',null,'quest-board-pager');
 const passages=getJapaneseReadingQuestsV2(grade),cards=passages.map((record,index)=>{
  const villager=READING_VILLAGERS[index%READING_VILLAGERS.length],solved=Math.max(0,Math.min(5,Number(state.progress[record.id])||0));
  const card=node('article',null,'quest-card reading-quest-card reading-v2-quest-card');card.dataset.questNoticeKey=record.id;
  const ribbon=node('div',null,'quest-card-ribbon'),stars=node('span',null,`quest-card-stars${solved===5?' is-complete':''}`);stars.setAttribute('aria-label',`${solved}問 / 5問クリア`);for(let i=0;i<5;i++)stars.append(node('span','★',i<solved?'on':''));ribbon.append(stars);
  const art=node('div',null,'quest-card-art'),portrait=node('img');portrait.src=api.asset(villager.image);portrait.alt='';art.append(portrait);
  const rewards=node('div',null,'quest-card-rewards reading-card-rewards'),reward=node('div',null,`qc-reward${readingRewardProgress(game,record).complete?' is-claimed':''}`),icons=node('span',null,'qc-icons');icons.innerHTML=api.rewardIcon('medal','quest-medal',10,24);icons.append(node('small','最大10枚'));
  reward.append(node('b',`報酬 ${readingRewardProgress(game,record).percent}％ 受取済み`),icons,node('span','最大 💰2,400　✨1,800EXP','qc-gold'));rewards.append(reward);
  card.append(ribbon,art,node('div',villager.name,'quest-card-name'),node('h4',record.title,'quest-card-title'),node('div',`${record.genre}・5問`,'quest-card-tag'),rewards);
  const actions=node('div',null,'reading-quest-card-actions');
  const saved=state.sessions[record.id];
  const open=node('button',saved?.phase==='answering'?'回答のつづき':saved?'答え合わせ・再挑戦':solved===5?'もう一度読む':'依頼を受ける','btn');open.type='button';open.onclick=()=>{
   const run=readingSession(game,record);if(run.phase==='answering')showQuestion(record,villager,Math.max(0,run.answers.findIndex(a=>a===null)));else showResults(record,villager);
  };
  const print=node('button','🖨','btn quest-card-print');print.type='button';print.setAttribute('aria-label',`${record.title}の問題・解答を印刷`);print.onclick=()=>api.print?.(record);
  actions.append(open,print);card.append(actions);card.onclick=event=>{if(!event.target.closest('button'))open.click();};return card;
 });
 const earnedStars=passages.reduce((sum,record)=>sum+Math.max(0,Math.min(5,Number(state.progress[record.id])||0)),0),totalStars=passages.length*5;
 progressSummary.classList.toggle('is-complete',totalStars>0&&earnedStars===totalStars);
 progressSummary.replaceChildren(node('span','この学年の進みぐあい','quest-board-progress-label'),node('span',`★ ${earnedStars} / ${totalStars} 問クリア`,'quest-board-progress-count'));
 const meter=node('span',null,'quest-board-progress-meter'),fill=node('span',null,'quest-board-progress-fill');fill.style.width=`${totalStars?earnedStars/totalStars*100:0}%`;meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','国語の文章問題のクリア数');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax',String(totalStars));meter.setAttribute('aria-valuenow',String(earnedStars));meter.append(fill);progressSummary.append(meter);
 const suggested=passages.find(r=>state.sessions[r.id]&&state.sessions[r.id].phase!=='answering'&&readingReviewTargets(r,state.sessions[r.id]).length>0&&!readingRewardProgress(game,r).complete);
 const suggestion=node('section',null,'reading-v2-reward-card reading-v2-suggestion');suggestion.hidden=!suggested;
 if(suggested){suggestion.append(node('b','🎁 今のおすすめ：'+suggested.title+' の解き直し'),rewardLine(readingRewardProgress(game,suggested).remaining),node('span','まだ受け取っていない報酬です。解き直して正解すると100％まで受け取れます。'));const go=node('button','✎ ヒント付き再挑戦を再開','btn btn-primary');go.type='button';go.onclick=()=>showReview(suggested,READING_VILLAGERS[passages.indexOf(suggested)%READING_VILLAGERS.length]);suggestion.append(go);}
 progressSummary.append(node('small',gradeRewardSummary(grade),'subquest-grade-reward-note'));root.replaceChildren(heading,progressSummary,suggestion,grid,pager);
 mountFittedQuestPages(grid,pager,[...cards,...(api.extraCards||[])],{page:api.pageForGrade?.(grade)||0,onPage:page=>api.setPageForGrade?.(grade,page),bind:api.bindRewards});

 function createScene(record,villager,hint=null){
  document.querySelector('.reading-subquest-overlay')?.remove();
  const overlay=node('div',null,'reading-subquest-overlay'),panel=node('section',null,'reading-subquest-panel quest-answer-panel reading-v2-answer-panel');
  panel.dataset.grade=String(grade);
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','reading-v2-title');
  const back=node('button','← 依頼一覧へ','btn');back.type='button';back.onclick=()=>{overlay.remove();renderJapaneseReadingV2Subquests(root,grade,api);};
  const title=node('h2',record.title);title.id='reading-v2-title';
  const dialogue=node('section',null,'reading-villager-dialogue'),portrait=node('img');portrait.src=api.asset(villager.image);portrait.alt=villager.name;portrait.className='reading-v2-scene-villager';portrait.draggable=false;
  const speech=node('div');speech.append(node('b',villager.name),node('p',grade===1?'この おはなしを いっしょに よんで、五つのことを たしかめよう。':'村に届いた記録を一緒に読んで、五つの問いを確かめてくれる？'));dialogue.append(speech);
  const content=node('div',null,'quest-answer-content reading-v2-answer-content');
  const context=node('div',null,'quest-question-context reading-v2-question-context');
  const answerStage=node('div',null,'quest-answer-center reading-v2-answer-center');
  const answerCenter=node('div',null,'reading-v2-answer-foreground');answerStage.append(portrait,answerCenter);
  const letter=node('article',null,'reading-v2-letter');letter.setAttribute('aria-label','村人から届いた読書の手紙');
  const letterHeader=node('header',null,'reading-v2-letter-header');letterHeader.append(node('span','村人からの読書便り','reading-v2-letter-eyebrow'),title);
  const passage=node('div',null,'reading-passage reading-v2-passage');appendAnnotatedText(passage,record,hint?.ranges||[]);passage.tabIndex=0;if(hint?.ranges.length){passage.setAttribute('aria-label','鉛筆の下線がある本文の手がかり');requestAnimationFrame(()=>{if(passage.isConnected){const mark=passage.querySelector('.reading-v2-pencil-hint');if(mark)passage.scrollTop=Math.max(0,mark.getBoundingClientRect().top-passage.getBoundingClientRect().top-35);}});}
  const signature=node('footer',null,'reading-v2-letter-signature');signature.append(node('span','勇者へ'),node('b',villager.name+' より'));
  letter.append(letterHeader,passage,signature);context.append(letter);
  const hud=createRewardHud(record),header=node('header',null,'reading-v2-scene-header');header.append(back,hud.element);
  content.append(context,answerStage);panel.append(header,content);overlay.append(panel);document.body.append(overlay);installQuestAnswerPanelWheelScroll(panel);
  return {body:answerCenter,dialogue,overlay,panel,hud};
 }
 function createRewardHud(record){
  const element=node('section',null,'reading-v2-reward-hud');element.setAttribute('aria-label','この依頼で受け取った報酬');
  const label=node('div',null,'reading-v2-hud-heading'),percent=node('b'),gain=node('span',null,'reading-v2-hud-gain');gain.setAttribute('role','status');
  label.append(node('span','🎁 つみあげた報酬'),percent,gain);
  const counters=node('div',null,'reading-v2-hud-counters'),values={};
  for(const [key,icon,unit] of [['medals','🏅','枚'],['gold','💰','G'],['exp','✨','EXP']]){
   const item=node('div',null,'reading-v2-hud-counter');item.dataset.reward=key;
   const value=node('b','0');values[key]=value;item.append(key==='medals'?questMedalImage(26):node('span',icon),value,node('small',` / ${READING_TOTAL_REWARD[key].toLocaleString()} ${unit}`));counters.append(item);
  }
  const meter=node('div',null,'reading-v2-hud-meter');meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','報酬の受取率');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');
  for(let i=0;i<10;i++)meter.append(node('span'));
  element.append(label,counters,meter);let frame=0;
  function update(){
   const current=readingRewardProgress(game,record),previous=visualRewards.get(record.id)||current.paid;
   cancelAnimationFrame(frame);visualRewards.set(record.id,{...current.paid});
   percent.textContent=`${current.percent}％`;meter.setAttribute('aria-valuenow',String(current.percent));
   [...meter.children].forEach((part,i)=>part.classList.toggle('is-earned',i<Math.floor(current.percent/10)));
   const diff=Object.fromEntries(Object.keys(values).map(k=>[k,Math.max(0,current.paid[k]-previous[k])]));
   const increased=Object.values(diff).some(n=>n>0);
   gain.textContent=increased?`＋🏅${diff.medals}枚　💰${diff.gold.toLocaleString()}　✨${diff.exp.toLocaleString()}`:'';
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now();
   function tick(now){
    const t=increased&&!reduced?Math.min(1,(now-start)/650):1,ease=1-Math.pow(1-t,3);
    for(const key of Object.keys(values))values[key].textContent=Math.round(previous[key]+(current.paid[key]-previous[key])*ease).toLocaleString();
    if(t<1&&(element.isConnected||now===start))frame=requestAnimationFrame(tick);
   }
   tick(start);if(increased&&!reduced){element.classList.remove('is-gaining');requestAnimationFrame(()=>{if(element.isConnected)element.classList.add('is-gaining');});}
  }
  update();return {element,update};
 }
 function saveReward(reward){if(reward)api.exp(reward.exp);const bonus=claimGradeClearRewards(game);if(bonus.exp)api.exp(bonus.exp);if(bonus.messages.length){game.lastSubquestGradeReward=bonus.messages;}api.save();api.refresh?.();}
 function rewardLine(reward){
  const row=node('div',null,'reading-v2-reward-icons');const medal=node('span');medal.innerHTML=api.rewardIcon('medal','quest-medal',reward.medals,24);medal.append(node('b',`${reward.medals}枚`));
  row.append(medal,node('span',`💰 ${reward.gold.toLocaleString()} G`),node('span',`✨ ${reward.exp.toLocaleString()} EXP`));return row;
 }
 function showQuestion(record,villager,index,review=false){
  const run=readingSession(game,record),question=record.questions[index],hint=review?readingRetryHint(record,question):null,{body,dialogue,hud}=createScene(record,villager,hint);
  let stopTime=startSubquestTimer(body);const progress=node('p',`${index+1}／5問め　${question.skill}`,'reading-story-progress');
  const prompt=node('div',question.prompt,'challenge-problem challenge-problem-word quest-reading-question reading-v2-prompt');
  const area=node('div',null,'reading-v2-answer-area'),feedback=node('p',null,'reading-v2-feedback');feedback.setAttribute('role','status');
  const next=node('button',review?'この答えを確認する':index===4?'5問まとめて答え合わせ':'回答を保存して次へ','btn btn-primary quest-answer-next');next.type='button';
  let answer=review?(run.reviewAnswers[index]||''):(run.answers[index]||''),humanConfirmed=false;
  function update(){next.disabled=!answer.trim()||(review&&question.input.type==='open-response'&&!humanConfirmed);}
  update();
  function choose(value){answer=value;update();feedback.textContent='';}
  next.onclick=()=>{
   if(review){
    const result=confirmReadingReview(game,record,index,answer,humanConfirmed,stopTime());
    if(result.status!=='correct'){api.save();stopTime=startSubquestTimer(body);feedback.textContent=result.status==='needs-review'?'大人と確認してから進もう。':'もう一度、本文の手がかりを確かめよう。';return;}
    saveReward(result.reward);showReview(record,villager);return;
   }
   if(!storeReadingAnswer(game,record,index,answer,stopTime())){feedback.textContent='答えを入れてね。';return;}
   saveReward(claimReadingAnswerReward(game,record,index));
   if(index<4)showQuestion(record,villager,index+1);
   else{saveReward(finishReadingSession(game,record));showResults(record,villager);}
  };
  body.append(progress,node('p',review?'正解すると残りの10％を受け取れます。':'答え合わせは5問のあと。1問回答で10％、正解でさらに10％。','reading-v2-batch-note'),prompt,area,feedback);
  if(review){const tip=node('aside',null,'reading-v2-retry-hint');tip.append(node('b','✎ ヒントを見て、もう一度考えよう'),node('p',hint.text));body.insertBefore(tip,prompt);}
  if(question.input.type==='single-choice'){
   const options=node('div',null,'reading-v2-options');question.input.options.forEach((option,i)=>{
    const choice=node('button',`${question.print.optionLabels[i]}　${option.text}`,'btn reading-v2-choice');choice.type='button';choice.setAttribute('aria-pressed',String(answer===option.id));
    choice.onclick=()=>{choose(option.id);options.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===choice)));if(!review&&storeReadingAnswer(game,record,index,option.id)){saveReward(claimReadingAnswerReward(game,record,index));hud.update();}};options.append(choice);
   });area.append(options);
  }else if(question.input.type==='extraction'){
   const form=node('form',null,'quest-answer-form reading-v2-extraction-form');form.autocomplete='off';
   const input=node('input');input.type='text';input.value=answer;input.className='challenge-input quest-reading-input';input.setAttribute('aria-label','本文から抜き出す答え');input.autocomplete='off';input.spellcheck=false;input.addEventListener('input',()=>choose(input.value));form.append(input);form.onsubmit=e=>{e.preventDefault();if(!e.isComposing&&!next.disabled)next.click();};
   const board=node('div',null,'quest-reading-kana-board');board.hidden=true;mountReadingAnswerBoard(input,board);
   const toggle=node('button','50音ボード','btn');toggle.type='button';toggle.onclick=()=>{board.hidden=!board.hidden;};area.append(form,toggle,board);
  }else{
   const label=node('label',null,'reading-v2-response-label');label.append(node('span','自分の考えと、本文の手がかりを書こう'));
   const response=node('textarea');response.rows=3;response.maxLength=question.characterCondition.max;response.value=answer;response.setAttribute('aria-label','自分の考えと本文の手がかり');response.addEventListener('input',()=>choose(response.value));label.append(response);area.append(label);
  }
  if(review&&question.input.type==='open-response'){
   const criteria=node('fieldset',null,'reading-v2-review-criteria');criteria.append(node('legend','大人と一緒に確認しよう'));
   for(const item of question.scoring.criteria){const row=node('label',null,'reading-v2-criterion'),check=node('input');check.type='checkbox';row.append(check,node('span',item.description));criteria.append(row);}
   criteria.onchange=()=>{humanConfirmed=criteria.querySelectorAll('input:checked').length===question.scoring.criteria.length;update();};area.append(criteria);
  }
  body.append(next);
  if(!review&&index>0){const previous=node('button','前の問題に戻る','btn');previous.type='button';previous.onclick=()=>{if(answer.trim()&&storeReadingAnswer(game,record,index,answer,stopTime()))saveReward(claimReadingAnswerReward(game,record,index));showQuestion(record,villager,index-1);};body.append(previous);}
  if(review){const cancel=node('button','答え合わせに戻る','btn');cancel.type='button';cancel.onclick=()=>showResults(record,villager);body.append(cancel);}
  body.append(dialogue);
 }
 function showResults(record,villager){
  const run=readingSession(game,record),{body}=createScene(record,villager);body.classList.add('reading-v2-results');
  const results=readingResults(record,run),correct=results.filter(r=>r.status==='correct').length;
  if(game.lastSubquestGradeReward){for(const text of game.lastSubquestGradeReward)body.append(node('p',text,'reading-v2-reward-card'));delete game.lastSubquestGradeReward;api.save();}body.append(node('h3','📖 5問の答え合わせ'),node('p',`5問中 ${correct}問 正解・確認済み。考えを書く問題は、大人と確認できたら正解として記録します。`));
  results.forEach((r,i)=>{
   const row=node('details',null,'reading-v2-result-row');row.dataset.status=r.status;
   row.append(node('summary',`${r.status==='correct'?'✅':r.status==='needs-review'?'💬':'🔍'} ${i+1}問め　${r.status==='correct'?(r.originalStatus==='correct'?'正解':'解き直して正解'):r.status==='needs-review'?'人と確認':'再挑戦しよう'}　${r.question.skill}`));
   row.append(node('p',r.question.prompt),node('p','最初の答え：'+readingAnswerText(r.question,r.answer)));
   if(r.status==='correct'){if(r.reviewAnswer)row.append(node('p','解き直しの答え：'+readingAnswerText(r.question,r.reviewAnswer)));row.append(node('p',r.question.explanation));}
   else row.append(node('p','正解はまだ表示しません。本文のヒントを見ながら、もう一度考えてみよう。'));
   body.append(row);
  });
  const earned=readingRewardProgress(game,record),base=node('section',null,'reading-v2-reward-card');
  base.append(node('b',`🎒 報酬 ${earned.percent}％ 受取済み`),rewardLine(earned.paid),node('small','1問回答で10％、正解でさらに10％。各問題の報酬は一度だけ。'));body.append(base);
  const bonus=node('section',null,'reading-v2-reward-card reading-v2-review-offer');
  if(earned.complete)bonus.append(node('b','🎉 報酬100％達成！'),node('p','解き直しも含めて、すべての報酬を受け取りました。'));
  else{
   const remaining=readingReviewTargets(record,run).length;
   bonus.append(node('b','🎁 100％まで、あとこれだけ！'),rewardLine(earned.remaining),node('p',`あと${remaining}問をヒント付きで解き直そう。正解すると残りの報酬を受け取れます。`));
   const review=node('button','✎ ヒント付きで再挑戦','btn btn-primary');review.type='button';review.onclick=()=>showReview(record,villager);bonus.append(review,node('small','やめた場合は受取済みの分だけ残ります。あとで再開しても100％まで受け取れます。'));
  }body.append(bonus);
  const close=node('button',earned.complete?'依頼一覧へ':'ここで終わる（残りの報酬は未受取）','btn');close.type='button';close.onclick=()=>{document.querySelector('.reading-subquest-overlay')?.remove();renderJapaneseReadingV2Subquests(root,grade,api);};
  const again=node('button','もう一度5問に挑戦','btn');again.type='button';again.onclick=()=>{readingSession(game,record,true);api.save();showQuestion(record,villager,0);};body.append(close,again);
 }
 function showReview(record,villager){
  const run=readingSession(game,record),index=readingReviewTargets(record,run)[0];
  if(index===undefined){showResults(record,villager);return;}
  showQuestion(record,villager,index,true);
 }
}
