import {ancientReadingTestPlan} from './ancient_reading_test_print.js';
import {renderAncientStyledPrint} from './stage_print_layout.js';
import {standardPrintRewards,renderPrintRewardIcons} from './print_reward_icons.js';
import {ancientChallengeSheetHtml} from './ancient_challenge_sheet.js';
import {renderWordProblemPrintV2,paginateWordProblemPrintV2} from './word_problem_print_layout_v2.js';
/** Presentation only. Accepts the existing, already generated four lists. */
export function ancientPrintPlanV2(input){
 if(input.readingPassage)return ancientReadingTestPlan(input);
 const {calculations,stories,readings,writings}=input;
 for(const [list,count] of [[calculations,10],[stories,3],[readings,10],[writings,10]])if(!Array.isArray(list)||list.length!==count)throw new RangeError('Ancient requires 10 + 3 + 10 + 10');
 for(const p of [...calculations,...stories,...readings,...writings])if(typeof p.text!=='string'||p.answer==null)throw new TypeError('Existing text and answer required');
 const record=(p,number,category,question=p.text,answer=p.answer)=>({number,category,question,answer,source:p});
 const records=[...calculations.map((p,i)=>record(p,i+1,'calculation')),...stories.map((p,i)=>record(p,i+11,'story')),...readings.map((p,i)=>record(p,i+14,'reading',`${p.printContext?.before??''}${p.text}${p.printContext?.after??''}`)),...writings.map((p,i)=>record(p,i+24,'writing',`${p.printContext?.before??''}${p.answer}${p.printContext?.after??''}`,p.text))];
 const title=`古代からの挑戦状　番号：${input.printId??''}`;
 const question=(r,workMm)=>({number:r.number,question:r.question,answer:r.answer,workMm,promptLabel:r.category==='reading'?'読み':r.category==='writing'?'書き':'',promptParts:['reading','writing'].includes(r.category)?{before:r.source.printContext?.before??'',target:r.category==='reading'?r.source.text:r.source.answer,after:r.source.printContext?.after??''}:undefined});
 function automatic(mode){if(stories.every(p=>p.text.length<=500))return renderAncientStyledPrint(input,mode);return [
  renderWordProblemPrintV2({title:title+' 計算1〜10',subject:'math',grade:input.grade??2,questions:records.slice(0,10).map(r=>question(r,12)),mode,rewardText:'プリント報酬',rewardEntries:standardPrintRewards({count:33,ancientReward:true})}),
  ...records.slice(10,13).map(r=>renderWordProblemPrintV2({title:title+` 文章問題${r.number}`,subject:'math',grade:input.grade??2,story:r.question,questions:[{...question(r,35),question:''}],mode,rewardText:'プリント報酬',rewardEntries:standardPrintRewards({count:33,ancientReward:true})})),
  renderWordProblemPrintV2({title:title+' 読み14〜23',subject:'japanese',grade:input.grade??2,questions:records.slice(13,23).map(r=>question(r,12)),mode,rewardText:'プリント報酬',rewardEntries:standardPrintRewards({count:33,ancientReward:true})}),
  renderWordProblemPrintV2({title:title+' 書き24〜33',subject:'japanese',grade:input.grade??2,questions:records.slice(23).map(r=>question(r,12)),mode,rewardText:'プリント報酬',rewardEntries:standardPrintRewards({count:33,ancientReward:true})})
 ].join('');}
 return {questionCount:33,passCount:27,consumeCount:1,records,legacyHtml:ancientChallengeSheetHtml({...input,rewardsHtml:renderPrintRewardIcons(standardPrintRewards({count:33,ancientReward:true}))}),automaticStudentHtml:automatic('student'),teacherHtml:automatic('teacher')};
}
/** Measure legacy in an isolated same-origin frame. No resizing, omission, or state writes. */
export async function inspectAncientTwoPageV2(doc,html){
 const frame=doc.createElement('iframe');frame.style.cssText='position:absolute;left:-12000px;width:1000px;height:1200px;visibility:hidden';doc.body.append(frame);
 try{
  const loaded=new Promise(resolve=>frame.onload=resolve);frame.srcdoc=`<!doctype html><meta charset="utf-8">${html}`;await loaded;await frame.contentDocument.fonts.ready;
  const sheets=[...frame.contentDocument.querySelectorAll('.ac-sheet')],issues=[];
  for(const [index,sheet] of sheets.entries()){
   const bounds=sheet.getBoundingClientRect();
   for(const node of sheet.querySelectorAll('*')){
    const r=node.getBoundingClientRect();
    if(r.top<bounds.top-1||r.bottom>bounds.bottom+1||r.left<bounds.left-1||r.right>bounds.right+1||node.scrollHeight>node.clientHeight+2||node.scrollWidth>node.clientWidth+2){issues.push({page:index+1,className:node.className});break;}
   }
  }
  return {fits:sheets.length===2&&issues.length===0,pages:2,issues};
 }finally{frame.remove();}
}
/** Preview only: call before opening a print window or consuming an item. */
export async function prepareAncientPrintPreviewV2(container,plan,strategy){
 if(!['two-page','readability'].includes(strategy))throw new TypeError('Explicit strategy required');
 if(strategy==='two-page'){
  const check=await inspectAncientTwoPageV2(container.ownerDocument,plan.legacyHtml);
  if(!check.fits)return {ready:false,reason:'two-page-overflow',check};
  // Keep legacy CSS isolated from the preview and other app styles.
  const frame=container.ownerDocument.createElement('iframe');frame.title='古代挑戦状 既存2面';frame.style.cssText='width:215mm;height:610mm;border:0';container.replaceChildren(frame);frame.srcdoc=`<!doctype html><meta charset="utf-8">${plan.legacyHtml}`;
  return {ready:true,pages:2,paperSheets:1,strategy,html:plan.legacyHtml,css:'legacy-inline'};
 }
 container.innerHTML=plan.automaticStudentHtml;
 await paginateAncientAutomaticV2(container);
 const pages=[...container.querySelectorAll('.wpp2-page,.sp-page')];pages.forEach((p,i)=>{p.querySelector('footer').textContent=`全33問・27問以上正解　児童用 ${i+1} / ${pages.length}`;});
 return {ready:true,pages:pages.length,paperSheets:Math.ceil(pages.length/2),strategy,html:container.innerHTML,css:'word_problem_print_layout_v2.css'};
}
/** Pack related sections without forcing a new page for every story or mode. */
export async function paginateAncientAutomaticV2(container){
 if(container.querySelector('.sp-page')){
  await container.ownerDocument.fonts.ready;
  const reading=container.querySelector('.art-reading');
  if(reading)for(const pt of [10,9.5,9,8.5]){reading.querySelectorAll('.art-question').forEach(p=>p.style.fontSize=pt+'pt');if([...reading.querySelectorAll('.art-question')].every(p=>p.scrollWidth<=p.clientWidth+2&&p.scrollHeight<=p.clientHeight+2))break;}
  const stories=[...container.querySelectorAll('.sp-story p')];
  for(const pt of [13,12,11,10]){stories.forEach(p=>p.style.fontSize=pt+'pt');if([...container.querySelectorAll('.sp-story')].every(p=>p.scrollHeight<=p.clientHeight+1))break;}
  for(const el of container.querySelectorAll('.sp-page header,.sp-stories,.sp-story,.sp-kanji-grid,.sp-kanji-question,.art-passage,.art-questions,.art-question'))if(el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2)throw new Error('問題が紙面に収まりません。印刷を停止しました。');
  return container.querySelectorAll('.sp-page').length;
 }
 const roots=[...container.querySelectorAll('.wpp2-root')];
 if(roots.length!==6)throw new Error('Expected six ancient sections');
 const doc=container.ownerDocument;
 function pair(source){const nodes=[...source.children];source.replaceChildren();for(let i=0;i<nodes.length;i+=2){const row=doc.createElement('section');row.className='wpp2-block wpp2-ancient-pair';row.append(...nodes.slice(i,i+2));source.append(row);}}
 const math=roots[0],ms=math.querySelector('.wpp2-source');pair(ms);
 math.querySelector('template').content.querySelector('h1').textContent=math.querySelector('template').content.querySelector('h1').textContent.replace('計算1〜10','算数1〜13');
 for(const root of roots.slice(1,4)){
  const source=root.querySelector('.wpp2-source'),story=source.firstElementChild,question=source.lastElementChild;
  const label=doc.createElement('p');
  // The source number is rendered inside the question; use it for continuation headers too.
  label.textContent='文章問題 '+question.querySelector('b').textContent;
  story.prepend(label);
  if(story.querySelector('.wpp2-text').textContent.length<=500){const group=doc.createElement('section');group.className='wpp2-block';group.append(story,question);ms.append(group);}else ms.append(story,question);
  root.remove();
 }
 const japanese=roots[4],js=japanese.querySelector('.wpp2-source');
 js.append(...roots[5].querySelector('.wpp2-source').children);roots[5].remove();pair(js);
 japanese.querySelector('template').content.querySelector('h1').textContent=japanese.querySelector('template').content.querySelector('h1').textContent.replace('読み14〜23','国語14〜33（前半読み・後半書き）');
 for(const root of [math,japanese])await paginateWordProblemPrintV2(root);
 const pages=[...container.querySelectorAll('.wpp2-page,.sp-page')];pages.forEach((p,i)=>{p.querySelector('footer').textContent=`${p.closest('.wpp2-root').dataset.mode==='teacher'?'指導者用解答':'児童用問題'} ${i+1} / ${pages.length}`;});
 return pages.length;
}
/** One confirmed test session. onFirstOpen is the integration seam, never a game import.
 * Browser cancel does not reset this session. Popup failure never calls the callback.
 */
export function createAncientPrintSessionV2({openWindow,onFirstOpen}){
 let consumed=false,opened=null,lockedHtml=null;
 return {open(prepared){
  if(!prepared?.ready)throw new Error('Confirm a successful preview first');
  if(consumed&&prepared.html!==lockedHtml)throw new Error('A consumed session cannot change its test content');
  const candidate=openWindow(prepared);if(!candidate)return {opened:false,consumed};
  opened=candidate;
  if(!consumed){lockedHtml=prepared.html;consumed=true;onFirstOpen({consumeCount:1,questionCount:33,passCount:27});}
  return {opened:true,consumed};
 },printAgain(){if(!opened||opened.closed)return false;opened.print();return true;},get consumed(){return consumed;}};
}
