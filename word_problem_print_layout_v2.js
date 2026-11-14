import {japanesePrintHeader,japanesePrintHeaderCss} from './japanese_print_header.js';
import {renderPrintRewardIcons} from './print_reward_icons.js';
/** Pure, escaped HTML renderer. Never derives or recalculates question/answer content. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function annotatedPrintTextV2(text,annotations={},start=0,end=[...text].length){
 const chars=[...text],ruby=annotations.ruby??[],refs=annotations.references??[];
 for(const r of ruby)if(chars.slice(r.start,r.end).join('')!==r.base)throw new Error('Ruby span mismatch');
 for(const r of refs)if(chars.slice(r.start,r.end).join('')!==r.text)throw new Error('Reference span mismatch');
 const decorate=(from,to)=>{let result='';for(let j=from;j<to;j++){const ref=refs.find(r=>j>=r.start&&j<r.end);let c=esc(chars[j]);if(ref)c=`<u class="wpp2-reference" data-ref="${esc(ref.id)}">${j===ref.start?`<sup class="wpp2-reference-label">${esc(ref.label)}</sup>`:''}${c}</u>`;result+=c;}return result;};
 let html='';for(let i=start;i<end;){
  if(annotations.paragraphIndent && (i===0 || chars[i-1]==='\n') && !/[\s「『]/u.test(chars[i]))html+='<span class="wpp2-paragraph-indent" aria-hidden="true"></span>';
  const r=ruby.find(r=>r.start===i&&r.end<=end);const next=r?r.end:i+1;
  html+=r?`<ruby>${decorate(i,next)}<rt>${esc(r.reading)}</rt></ruby>`:decorate(i,next);i=next;
 }return html;
}
function renderPrintResponseV2(r){
 if(r.kind==='choice')return '<p class="wpp2-response-choice">答えの記号：＿＿＿＿</p>';
 if(r.kind==='cells'){const cells=n=>`<span class="wpp2-cells">${Array.from({length:n},()=>'<i></i>').join('')}</span>`;return `<p>本文の表記、またはかなのどちらか一方に記入。</p><p>本文の表記 ${cells(r.cells)}</p><p>かな ${cells(r.kanaCells)}</p>`;}
 if(r.kind==='lines')return `<p>字数は${esc(r.guideline)}字程度までの目安。口頭での説明も可。</p><div class="wpp2-response-lines">${Array.from({length:r.lines},()=>'<div></div>').join('')}</div>`;
 throw new TypeError('Response kind');
}
export function renderWordProblemPrintV2({title='文章問題', subject='math', grade=1, showGrade=true, story='', storyAnnotations=null, questions=[], mode='student', scale=1, color=false, writingMode='horizontal-tb', table=null, diagram=null, pageLayout='auto', rewardText='', rewardEntries=[], villager=null}={}) {
 if(!['auto','duplex-2-3'].includes(pageLayout))throw new TypeError('pageLayout');
 if(pageLayout==='duplex-2-3'&&questions.length!==5)throw new RangeError('Duplex layout requires five questions');
 if (!['math','japanese'].includes(subject) || !['student','teacher'].includes(mode)) throw new TypeError('subject / mode');
 if (!Number.isInteger(grade) || grade<1 || grade>6 || !Number.isFinite(scale) || scale<1 || scale>1.5) throw new RangeError('grade 1..6 / scale 1..1.5');
 if (!['horizontal-tb','vertical-rl'].includes(writingMode)) throw new TypeError('writingMode');
 if (writingMode==='vertical-rl' && subject!=='japanese') throw new TypeError('vertical math requires editorial review');
 const textBlock=(text,kind,extra='')=>`<section class="wpp2-block ${kind}" ${extra}><div class="wpp2-text">${esc(text)}</div></section>`;
 let blocks='';
 if(story) blocks+=storyAnnotations?`<section class="wpp2-block wpp2-story" data-splittable="true" data-vertical="${writingMode==='vertical-rl'}" data-raw="${esc(story)}" data-annotations="${esc(JSON.stringify(storyAnnotations))}"><div class="wpp2-text wpp2-annotated">${annotatedPrintTextV2(story,storyAnnotations)}</div></section>`:textBlock(story,'wpp2-story',`data-splittable="true" data-vertical="${writingMode==='vertical-rl'}"`);
 if(table){
  if(!Array.isArray(table.rows) || table.rows.some(r=>!Array.isArray(r))) throw new TypeError('table.rows');
  blocks+=`<section class="wpp2-block"><figure><figcaption>${esc(table.caption)}</figcaption><table>${table.rows.map((r,i)=>`<tr>${r.map(v=>`<${i?'td':'th'}>${esc(v)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table></figure></section>`;
 }
 if(diagram){
  if(diagram.type!=='rectangle')throw new TypeError('diagram.type');
  blocks+=`<section class="wpp2-block"><figure><figcaption>${esc(diagram.caption)}</figcaption><svg viewBox="0 0 500 150" role="img" aria-label="${esc(diagram.alt)}" style="display:block;width:100%;height:40mm"><rect x="100" y="25" width="280" height="90" fill="none" stroke="black" stroke-width="2"/><text x="240" y="140" text-anchor="middle" font-size="20">${esc(diagram.bottom)}</text><text x="15" y="75" font-size="20">${esc(diagram.left)}</text></svg></figure></section>`;
 }
 questions.forEach((q,i)=>{
  if(typeof q.question!=='string') throw new TypeError(`question ${i+1} must be a string`);
  if(q.promptParts && String(q.promptParts.before??'')+String(q.promptParts.target??'')+String(q.promptParts.after??'')!==q.question)throw new Error('Prompt emphasis must preserve the exact question');
  const work=q.workMm??(subject==='math'?35:20);
  if(!Number.isFinite(work)||work<12||work>120) throw new RangeError('workMm 12..120');
  blocks+=`<section class="wpp2-block wpp2-question" data-question="${i+1}" data-source-id="${esc(q.sourceId??'')}"><p><b><span class="jp-print-number">${esc(q.number??i+1)}</span>.</b> ${q.promptLabel?`【${esc(q.promptLabel)}】 `:''}<span class="wpp2-source-question">${q.promptParts?`${esc(q.promptParts.before)}<u class="wpp2-prompt-target">${esc(q.promptParts.target)}</u>${esc(q.promptParts.after)}`:esc(q.question)}</span></p>${q.options?`<ol class="wpp2-options">${q.options.map(o=>`<li><b>${esc(o.label)}</b> ${esc(o.text)}</li>`).join('')}</ol>`:''}${q.expression!=null?`<p class="wpp2-expression">${esc(q.expression)}</p>`:''}${mode==='teacher'?`<div class="wpp2-solution">解答：<span class="wpp2-source-answer">${esc(q.answer)}</span>${q.explanation!=null?`<p>${esc(q.explanation)}</p>`:''}${q.reviewCriteria?`<ul>${q.reviewCriteria.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`:''}</div>`:`${q.response?renderPrintResponseV2(q.response):`<div class="wpp2-work" aria-label="${subject==='math'?'計算スペース':'解答スペース'}" style="min-height:${work}mm;${subject==='math'?'border:0;background:transparent;padding:0;':''}">${subject==='math'?'':'答え'}</div>`}${subject==='math'?(q.answerFields?.length?`<div class="wpp2-fields">${q.answerFields.map(f=>`<div class="wpp2-answer">${esc(f.label)}：<span></span>${esc(f.unit)}</div>`).join('')}</div>`:'<div class="wpp2-answer">答え：<span></span></div>'):''}`}</section>`;
 });
 const crop=villager?.faceCrop??[0,0,1254];
 const portrait=villager?`<span class="wpp2-quest-face"><img class="wpp2-quest-portrait" src="${esc(villager.image)}" alt="${esc(villager.name)}" title="${esc(villager.name)}" style="width:${1254/crop[2]*100}%;height:${1254/crop[2]*100}%;left:${-crop[0]/crop[2]*100}%;top:${-crop[1]/crop[2]*100}%"></span>`:'';
 const metadata=writingMode==='vertical-rl'?`<div class="wpp2-metadata"><p>${grade}年 国語</p>${mode==='student'?'<p>なまえ<span class="wpp2-name-line"></span></p><p>日付<span class="wpp2-date-line"></span></p>':'<p>児童用とは別に印刷してください</p>'}</div>`:`<p>${showGrade?grade+'年 ':''}${subject==='math'?'算数':'国語'}　${mode==='student'?'なまえ：________________　日付：____________':'児童用とは別に印刷してください'}</p>`;
 const reward=rewardText||rewardEntries.length?`<div class="wpp2-reward">${rewardText?`<span class="wpp2-reward-caption">${esc(rewardText)}</span>`:''}${renderPrintRewardIcons(rewardEntries)}</div>`:'';
 const titleMarkup=`${portrait}${esc(title)}${mode==='teacher'?'【指導者用解答】':''}`;
 const printHeader=writingMode==='vertical-rl'?`<style>${japanesePrintHeaderCss}</style>${japanesePrintHeader(titleMarkup,metadata,reward)}`:`<header><h1>${titleMarkup}</h1>${metadata}${reward}</header>`;
 return `<article class="wpp2-root ${color?'wpp2-color':''}" data-mode="${mode}" data-writing-mode="${writingMode}" data-layout="${pageLayout}" data-grade="${grade}" style="--wpp2-font:${(grade<=2?14:grade<=4?13:12)*scale}pt">${writingMode==='vertical-rl'&&pageLayout==='duplex-2-3'?'<style media="print">@page{size:A4 landscape;margin:8mm}</style>':''}<template class="wpp2-header">${printHeader}</template><div class="wpp2-source">${blocks}</div></article>`;
}
/** Browser-only physical pagination, independent of game state and popup/consumption. */
export async function paginateWordProblemPrintV2(root) {
 await root.ownerDocument.fonts.ready;
 if(root.dataset.paginated) throw new Error('Already paginated');
 if(root.dataset.layout==='duplex-2-3')return paginateDuplexFiveQuestionsV2(root);
 const doc=root.ownerDocument, source=root.querySelector('.wpp2-source'), blocks=[...source.children];
 let page,body;
 function next(){page=doc.createElement('section');page.className='wpp2-page';page.append(root.querySelector('template').content.cloneNode(true));body=doc.createElement('div');body.className='wpp2-page-body';page.append(body);root.append(page);return body;}
 function fits(){return body.scrollHeight<=body.clientHeight+0.5 && body.scrollWidth<=body.clientWidth+0.5 && [...body.querySelectorAll('.wpp2-text')].every(n=>n.scrollWidth<=n.clientWidth+0.5);}
 next();
 for(const block of blocks){
  source.removeChild(block);body.append(block);
  if(fits())continue;
  block.remove();if(body.children.length)next();body.append(block);
  if(fits())continue;
  if(!block.dataset.splittable) {root.dataset.error='oversize';throw new Error('A question/table exceeds one page; editorial split required. Printing blocked.');}
  const annotations=block.dataset.annotations?JSON.parse(block.dataset.annotations):null;const raw=block.dataset.raw??block.querySelector('.wpp2-text').textContent;const original=[...raw];let offset=0;
  block.remove();
  while(offset<original.length){
   const part=block.cloneNode(true),text=part.querySelector('.wpp2-text');body.append(part);
   let lo=0,hi=original.length-offset;
   while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(annotations)text.innerHTML=annotatedPrintTextV2(raw,annotations,offset,offset+mid);else text.textContent=original.slice(offset,offset+mid).join('');if(fits())lo=mid;else hi=mid-1;}
   if(!lo)throw new Error('No room for story text');
   // Prefer a paragraph/sentence boundary; exact characters are preserved across fragments.
   let cut=lo;const candidate=original.slice(offset,offset+lo).join('');const boundary=Math.max(candidate.lastIndexOf('。'),candidate.lastIndexOf('\n'));
   if(boundary>candidate.length*0.65)cut=[...candidate.slice(0,boundary+1)].length;
   if(annotations){const overlapping=(annotations.ruby??[]).find(r=>r.start<offset+cut&&r.end>offset+cut);if(overlapping&&overlapping.start>offset)cut=overlapping.start-offset;text.innerHTML=annotatedPrintTextV2(raw,annotations,offset,offset+cut);part.dataset.chunkStart=offset;part.dataset.chunkEnd=offset+cut;}else text.textContent=original.slice(offset,offset+cut).join('');offset+=cut;
   if(offset<original.length)next();
  }
 }
 source.remove();const pages=[...root.querySelectorAll('.wpp2-page')];pages.forEach((p,i)=>{const f=doc.createElement('footer');f.textContent=`${root.dataset.mode==='teacher'?'指導者用解答':'児童用問題'}　${i+1} / ${pages.length}`;p.append(f);});
 root.dataset.paginated='true';return {pages:pages.length,mode:root.dataset.mode};
}

/** Preserve the complete passage and questions; front = 1–2, back = 3–5. */
function paginateDuplexFiveQuestionsV2(root){
 const doc=root.ownerDocument,source=root.querySelector('.wpp2-source');
 const questions=[...source.querySelectorAll(':scope > .wpp2-question')];
 if(questions.length!==5)throw new Error('Five questions are required');
 const context=[...source.children].filter(el=>!el.classList.contains('wpp2-question'));
 root.classList.add('wpp2-duplex');
 if(root.dataset.writingMode==='vertical-rl')root.classList.add('wpp2-landscape-vertical');
 const pages=[];
 for(let side=0;side<2;side++){
  const page=doc.createElement('section');page.className=`wpp2-page wpp2-${side?'back':'front'}`;page.dataset.side=side?'back':'front';
  const header=root.querySelector('template').content.cloneNode(true);
  if(side){header.querySelector('header').classList.add('wpp2-back-header');header.querySelectorAll('p,.wpp2-metadata,.jp-print-meta,.wpp2-reward,.wpp2-quest-face').forEach(p=>p.remove());}
  page.append(header);
  const body=doc.createElement('div');body.className='wpp2-page-body';
  if(!side)body.append(...context);
  else if(context.length){const note=doc.createElement('p');note.className='wpp2-context-note';note.textContent='本文は表面を見て答えましょう。';body.append(note);}
  body.append(...questions.slice(side?2:0,side?5:2));page.append(body);
  const footer=doc.createElement('footer');footer.textContent=`${root.dataset.mode==='teacher'?'先生用解答':'児童用問題'}　${side?'裏面：3〜5問':'表面：1〜2問'}　${side+1} / 2`;page.append(footer);root.append(page);pages.push(page);
 }
 source.remove();
 const automaticMathSpace=root.classList.contains('wpp2-math-set')&&root.dataset.mode==='student';
 function distributeCalculationSpace(){
  let enough=true;
  for(const page of pages){
   const body=page.querySelector('.wpp2-page-body'),parts=[...body.querySelectorAll(':scope > .wpp2-question')],spaces=parts.map(q=>q.querySelector('.wpp2-work'));
   if(!spaces.length||spaces.some(w=>!w))continue;
   // Measure the actual text and fields first; the remaining paper is all available for work.
   parts.forEach(q=>q.style.flex='0 0 auto');
   for(const space of spaces){space.style.flex='0 0 auto';space.style.height='0px';space.style.setProperty('min-height','0px','important');}
   const children=[...body.children],gap=parseFloat(getComputedStyle(body).rowGap)||0;
   const fixed=children.reduce((sum,q)=>sum+q.getBoundingClientRect().height,0)+gap*Math.max(0,children.length-1);
   const height=Math.max(0,(body.clientHeight-fixed)/spaces.length-.5);
   if(height<20*96/25.4)enough=false;
   const mm=height*25.4/96;page.dataset.calculationSpaceMm=mm.toFixed(1);
   for(const space of spaces){space.style.height=height+'px';space.style.setProperty('min-height',height+'px','important');space.dataset.targetMm='52';space.dataset.actualMm=mm.toFixed(1);}
  }
  return enough;
 }
 const fits=page=>{const body=page.querySelector('.wpp2-page-body');return body.scrollHeight<=body.clientHeight+1&&body.scrollWidth<=body.clientWidth+1&&[...body.querySelectorAll('.wpp2-text,.wpp2-question,.wpp2-cells')].every(el=>el.scrollWidth<=el.clientWidth+1);};
 // Long passages keep all text and annotations. Tighten only these two review pages if needed.
 for(let level=0;level<=4;level++){
  root.dataset.compact=String(level);
  const spaceFits=!automaticMathSpace||distributeCalculationSpace();
  if(spaceFits&&pages.every(fits)){root.dataset.paginated='true';return {pages:2,mode:root.dataset.mode};}
 }
 root.dataset.error='oversize';throw new Error('表2問・裏3問に収まりません。本文や問題を削らず、印刷を停止しました。');
}
