import {readingConversation,readingVillager} from './reading_villagers.js';
import {createChallengeLetter} from './challenge_letter.js';
import {readingAnswerMatches} from './reading_quests.js';
import {READING_STORY_QUESTS} from './reading_story_quests.js';
import {readingProgress,readingSolvedCount,claimReadingReward} from './reading_subquest_progress.js';
export {readingProgress,claimReadingReward} from './reading_subquest_progress.js';
import {READING_PURSUIT_QUESTS} from './reading_pursuit_quests.js';
import {mountReadingAnswerBoard} from './reading_answer_board.js';
import {appendReadingReferenceText} from './reading_reference_marks.js';
import {renderJapaneseReadingV2Subquests} from './japanese_reading_subquests_v2.js';
import './reading_subquests.css';
import './quest_board_notice.css';
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,fn)=>{const b=node('button',text,'btn');b.type='button';b.onclick=fn;return b;};
const CORRECT_FEEDBACK_HOLD_MS=1300;
let readingGrade=1;
const readingPageByGrade=new Map();
export function renderReadingSubquests(root,api){
 const game=api.game(),state=readingProgress(game);let grade=readingGrade;
 const tabs=node('div',null,'reading-grade-tabs'),v2=node('section',null,'reading-v2-subquests');root.replaceChildren(tabs,v2);
 const hasLegacy=READING_STORY_QUESTS.some(p=>state.solved?.[p.id]||Number(state.parts?.[p.id])>0);
 for(let g=1;g<=6;g++)tabs.append(button(`${g}年`,()=>{grade=g;readingGrade=g;readingPageByGrade.set(g,0);readingPageByGrade.set(`v2-${g}`,0);render();}));
 function render(){
  [...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i+1===grade)));
  const cards=[];
  const q=READING_PURSUIT_QUESTS.find(q=>q.grade===grade),solved=state.letters[q.id]||0;
  const card=questCard({noticeKey:q.id,title:'✉ 怪盗ヒルルの挑戦状',villager:readingVillager(q),total:5,solved,tag:`${grade}年・5問のあとに対決`,gold:1500,exp:100,medals:5,claimed:!!state.defeated[q.id],action:state.defeated[q.id]?'もう一度読む・戦う':solved===5?'怪盗と対決する':solved?'挑戦状のつづき':'挑戦状を読む',open:()=>showDuel(q,0)});
  card.classList.add('reading-duel-card');
  for(const p of READING_STORY_QUESTS.filter(p=>p.grade===grade)){
   cards.push(questCard({noticeKey:p.id,title:p.title,villager:readingVillager(p),total:3,solved:readingSolvedCount(game,p.id),tag:`${grade}年・同じ文章で3問`,gold:900,exp:60,medals:3,claimed:!!state.solved[p.id],action:state.solved[p.id]?'もう一度読む':readingSolvedCount(game,p.id)?'依頼のつづき':'依頼を受ける',open:()=>showQuestion(p)}));
  }
  renderJapaneseReadingV2Subquests(v2,grade,{
   extraCards:grade>=4?[card,...(hasLegacy?cards:[])]:[],game:()=>game,asset:api.asset,rewardIcon:api.rewardIcon,bindRewards:api.bindRewards,
   save:api.save,exp:api.exp,refresh:api.refresh,answerFeedback:api.answerFeedback,
   print:api.printJapanese,pageForGrade:g=>readingPageByGrade.get(`v2-${g}`)||0,
   setPageForGrade:(g,p)=>readingPageByGrade.set(`v2-${g}`,p),
  });

 }
 function questCard({noticeKey,title,villager,total,solved,tag,gold,exp,medals,claimed,action,open}){
  const card=node('article',null,'quest-card reading-quest-card');if(noticeKey)card.dataset.questNoticeKey=noticeKey;
  const ribbon=node('div',null,'quest-card-ribbon'),stars=node('span',null,'quest-card-stars');
  stars.setAttribute('aria-label',`${total}問中${solved}問クリア`);
  if(solved>=total)stars.classList.add('is-complete');
  for(let i=0;i<total;i++)stars.append(node('span','★',i<solved?'on':''));
  ribbon.append(stars);const art=node('div',null,'quest-card-art');art.append(portrait(villager));
  const rewards=node('div',null,'quest-card-rewards reading-card-rewards'),reward=node('div',null,`qc-reward${claimed?' is-claimed':''}`),icons=node('span',null,'qc-icons');
  icons.innerHTML=api.rewardIcon('medal','quest-medal',1,24);icons.append(node('span',`×${medals}`));
  reward.append(node('b',claimed?'獲得済み':'初回のごほうび'),icons,node('span',`💰${gold}　✨${exp}EXP`,'qc-gold'));
  rewards.append(reward);
  card.append(ribbon,art,node('div',villager.name,'quest-card-name'),node('h4',title,'quest-card-title'),node('div',tag,'quest-card-tag'),rewards,button(action,open));
  card.onclick=e=>{if(!e.target.closest('button'))open();};return card;
 }
 function portrait(villager,small=false){const img=node('img',null,small?'reading-villager-thumbnail':'reading-villager-portrait');img.src=api.asset(villager.image);img.alt=villager.name;return img;}
 function dialogue(villager,text,kind='request'){
  const row=node('section',null,'reading-villager-dialogue');row.dataset.dialogue=kind;const speech=node('div');speech.append(node('b',villager.name),node('p',text));row.append(portrait(villager),speech);return row;
 }
 function panel(title,{answer=false}={}){
  document.querySelector('.reading-subquest-overlay')?.remove();
  const overlay=node('div',null,'reading-subquest-overlay'),p=node('section',null,`reading-subquest-panel${answer?' quest-answer-panel':''}`);p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label',title);
  const back=button('← 依頼一覧へ',()=>{overlay.remove();render();});p.append(back,node('h2',title));overlay.append(p);document.body.append(overlay);back.focus();return {overlay,p};
 }
 function questionUI(p,problem,onCorrect,letter=false){
  const window=node('section',null,'quest-answer-window quest-reading-answer-window');
  const main=node('div',null,'challenge-main quest-reading-answer-main');
  const prompt=node('div',letter?'手紙の謎に答えよう！':'文章を読んで答えよう！','challenge-prompt');
  if(!letter){
   if(problem.scene)main.append(node('p',problem.scene,'quest-answer-scene'));
   const passage=node('div',null,'reading-passage quest-answer-passage');appendReadingReferenceText(passage,problem.passage||problem.letter,problem.references||[]);passage.tabIndex=0;passage.setAttribute('aria-label','問題の文章');main.append(passage);
  }
  const question=node('div',problem.question,'challenge-problem challenge-problem-word quest-reading-question');
  const form=node('form',null,'quest-answer-form');form.autocomplete='off';
  const input=node('input');input.type='text';input.setAttribute('aria-label','答え');input.inputMode='text';input.autocomplete='off';input.autocapitalize='off';input.spellcheck=false;input.className='challenge-input quest-reading-input';
  const submit=button('けってい',null);submit.type='submit';submit.classList.add('challenge-submit-btn');form.append(input,submit);
  const tools=node('div',null,'quest-reading-answer-tools');
  const board=node('div',null,'quest-reading-kana-board');board.hidden=true;mountReadingAnswerBoard(input,board);
  const toggle=button('50音ボード',()=>{board.hidden=!board.hidden;toggle.setAttribute('aria-expanded',String(!board.hidden));});toggle.setAttribute('aria-expanded','false');
  const hint=node('p',null,'quest-reading-answer-hint');hint.setAttribute('aria-live','polite');let hints=0,done=false;
  const help=button('ヒント',()=>{const list=problem.hints||['本文の中に答えの手がかりがあるよ。',`「${problem.evidence}」を読んでみよう。`];hint.textContent=list[Math.min(hints++,list.length-1)];});
  const feedback=node('p',null,'result-text quest-reading-answer-feedback');feedback.setAttribute('role','status');
  tools.append(toggle,help);main.append(prompt,question,form,tools,board,hint,feedback);window.append(main);p.append(window);
  form.onsubmit=e=>{
   e.preventDefault();if(e.isComposing||done)return;
   if(!readingAnswerMatches(problem,input.value)){feedback.textContent='もう一度、本文の手がかりを見てみよう。';api.answerFeedback?.(false);return;}
   done=true;input.readOnly=true;submit.disabled=true;board.hidden=true;toggle.disabled=true;help.disabled=true;
   feedback.textContent=problem.explanation||`手がかりは「${problem.evidence}」。`;api.answerFeedback?.(true);onCorrect(feedback);
  };
  input.focus({preventScroll:true});
 }
 function grant(id,duel,partIndex=0){const r=claimReadingReward(game,id,duel,partIndex);if(r){api.exp(r.exp);api.save();api.refresh();}return r?` ${r.gold}G・${r.exp}EXP${r.medals?'・メダル'+r.medals+'枚':''}を獲得！`:' 初回報酬は受け取り済みです。';}
 function showQuestion(q,replayStep=0){
  const solved=readingSolvedCount(game,q.id),index=solved===3?replayStep:solved;
  const part=q.parts[index],story=readingConversation(part),{p,overlay}=panel(q.title,{answer:true});
  p.append(node('p',`${index+1}／3問め・同じ文章を読んで答えよう`,'reading-story-progress'),dialogue(story.villager,index===0?story.intro:q.grade===1?'おなじ おはなしから、もうひとつ たしかめたいことが あるんだ。':'同じお話から、もう一つ確かめたいことがあるんだ。'),node('small',story.documentLabel));
  questionUI(p,{...part,question:story.question},feedback=>{
   feedback.textContent+=grant(q.id,false,index);
   p.append(dialogue(story.villager,index===2?story.thanks:(q.grade===1?'ありがとう！ つぎも おなじ おはなしから たしかめよう。':'ありがとう！ 次も同じ文章を手がかりに考えよう。'),'thanks'));
   if(index<2){const next=button('次の問題',()=>{overlay.remove();showQuestion(q,index+1);});next.classList.add('quest-answer-next');next.disabled=true;p.append(next);setTimeout(()=>{if(next.isConnected){next.disabled=false;next.focus({preventScroll:true});}},CORRECT_FEEDBACK_HOLD_MS);}
   else p.append(node('p','★ ★ ★　3問クリア！ 依頼完了！','reading-story-complete'));
   render();
  });
 }

 function showDuel(q,replayStep){
  const index=state.defeated[q.id]?replayStep:state.letters[q.id]||0;
  const {p,overlay}=panel(q.title,{answer:index>0});
  if(index>=5){
   p.append(node('p',q.arrival));const img=node('img',null,'reading-duel-enemy');img.src=api.asset(q.enemy.image);img.alt=q.enemy.name;p.append(img,node('p',q.enemy.opening),button('怪盗と戦う',()=>{overlay.remove();api.fight(q,won=>{const result=panel(won?'怪盗に勝った！':'もう一度挑もう');result.p.append(node('p',won?q.victory:'挑戦状は解読済み。戦闘から再挑戦できます。'));if(won)result.p.append(dialogue(readingVillager(q),q.returnDialogue,'thanks'),node('p',grant(q.id,true)));else result.p.append(button('再挑戦',()=>{result.overlay.remove();showDuel(q,5);}));render();});}));return;
  }
  const companion=readingVillager(q);p.append(dialogue(companion,index===0?(q.grade===1?'かいとうから おてがみが とどいたよ。いっしょに よんで、ぬすまれた ものを とりもどそう！':'怪盗から挑戦状が届いたんだ。一緒に五つの謎を解いて、盗まれた品を取り戻そう！'):'次の挑戦状も、一緒に読んでみよう。'),node('p',`✉ 挑戦状 ${index+1}/5`));const letterScroll=node('div',null,'quest-letter-scroll'),reply=node('div',null,'quest-letter-reply');reply.hidden=index===0;letterScroll.append(createChallengeLetter({step:q.steps[index],index,grade,intro:q.challengeOpening,alreadyOpen:index>0,onOpen:()=>{p.classList.add('quest-answer-panel');reply.hidden=false;reply.querySelector('.quest-reading-input')?.focus({preventScroll:true});}}));p.append(letterScroll,reply);p.querySelectorAll('.letter-corner-mark').forEach(img=>{img.src=api.asset('assets/quest_enemies/hihiru-letter-mark.svg');});questionUI(reply,q.steps[index],()=>{if(!state.defeated[q.id]&&(state.letters[q.id]||0)===index){game.questMedals=(Number(game.questMedals)||0)+1;api.refresh();}state.letters[q.id]=Math.max(state.letters[q.id]||0,index+1);api.save();render();const next=button(index===4?'怪盗に挑む':'次の挑戦状',()=>{overlay.remove();showDuel(q,index+1);});next.disabled=true;next.classList.add('quest-answer-next');p.append(next);setTimeout(()=>{if(next.isConnected){next.disabled=false;next.focus({preventScroll:true});}},CORRECT_FEEDBACK_HOLD_MS);},true);
 }
 render();
}
