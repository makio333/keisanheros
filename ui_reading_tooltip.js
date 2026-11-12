import {SINGLE_KANJI_READINGS,WORD_KANJI_READINGS} from './kanji_readings_data.js';
import {UI_READING_WORDS,UI_READING_CHARS} from './ui_reading_words.js';
import './ui_reading_tooltip.css';
const HAN=/[\p{Script=Han}々]/u;
export const READING_EXCLUDED='script,style,noscript,input,textarea,select,option,svg,canvas,[contenteditable]:not([contenteditable="false"]),[data-no-reading-hint],#kanji-problem-center,#kanji-challenge,#challenge-problem-text,#unified-problems-list,.kanji-print-preview-row,.kp-sheet,.kp-question,.print-choice-problems,.ui-reading-tooltip';
export function createUiReadingDictionary(extraWords={},extraChars={}){
 const words=new Map(Object.entries(WORD_KANJI_READINGS));
 for(const [word,reading] of Object.entries({...extraWords,...UI_READING_WORDS}))if(HAN.test(word))words.set(word,Array.isArray(reading)?reading:[reading]);
 const maxLength=Math.max(...[...words.keys()].map(w=>w.length));
 const characters=char=>UI_READING_CHARS[char]||SINGLE_KANJI_READINGS[char]||(extraChars[char]?[extraChars[char]]:[]);
 const describe=(word,readings)=>({word,readings,characters:[...new Set([...word].filter(c=>HAN.test(c)))].map(char=>({char,readings:characters(char)}))});
 return {describe,
  lookup(text,index){
   if(!HAN.test(text[index]||''))return null;
   let match=null;
   for(let start=Math.max(0,index-maxLength+1);start<=index;start++)for(let end=Math.min(text.length,start+maxLength);end>index;end--){const word=text.slice(start,end);if(words.has(word)&&(!match||word.length>match.word.length))match={word,readings:words.get(word),start,end};}
   if(!match){const word=text[index];const readings=characters(word);if(!readings.length)return null;match={word,readings,start:index,end:index+1};}
   return {...match,...describe(match.word,match.readings)};
  }
 };
}
export function initializeUiReadingTooltips({words={},chars={}}={}){
 const dictionary=createUiReadingDictionary(words,chars);
 let popup=null,owner=null,key='',pending=0,lastEvent=null;
 document.documentElement.classList.add('ui-reading-tooltips-active');
 function hide(){popup?.hidePopover?.();popup?.remove();popup=null;owner=null;key='';}
 function eligible(node){const el=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;return !!el&&!el.closest(READING_EXCLUDED)&&el.getClientRects().length>0;}
 function show(hit,el,x,y){
  const nextKey=hit.word+'|'+hit.readings.join('|');
  if(key===nextKey&&owner===el&&popup?.isConnected)return;
  hide();owner=el;key=nextKey;
  popup=document.createElement('div');popup.className='ui-reading-tooltip';popup.id='ui-reading-tooltip';popup.setAttribute('role','tooltip');popup.setAttribute('popover','manual');
  const word=document.createElement('strong');word.textContent=hit.word;popup.append(word);
  const reading=document.createElement('p');reading.className='ui-reading-word';reading.textContent=hit.readings.join('／');popup.append(reading);
  if([...hit.word].filter(c=>HAN.test(c)).length>1){const heading=document.createElement('small');heading.textContent='漢字それぞれの読み（代表例）';popup.append(heading);const list=document.createElement('dl');for(const entry of hit.characters){const dt=document.createElement('dt');dt.textContent=entry.char;const dd=document.createElement('dd');dd.textContent=entry.readings.slice(0,8).join('・')||'読みは未登録';list.append(dt,dd);}popup.append(list);}
  (document.querySelector('dialog[open]')||document.body).append(popup);
  if(popup.showPopover)popup.showPopover();
  const r=popup.getBoundingClientRect(),left=Math.max(8,Math.min(x+12,innerWidth-r.width-8));let top=y+20;if(top+r.height>innerHeight-8)top=Math.max(8,y-r.height-12);
  popup.style.left=left+'px';popup.style.top=top+'px';
 }
 function point(e){
  if(!eligible(e.target)){hide();return;}
  const pos=document.caretPositionFromPoint?.(e.clientX,e.clientY);const range=!pos&&document.caretRangeFromPoint?.(e.clientX,e.clientY);const node=pos?.offsetNode||range?.startContainer,offset=pos?.offset??range?.startOffset;
  if(node?.nodeType!==Node.TEXT_NODE||!eligible(node)){hide();return;}
  const text=node.textContent;
  for(const index of [offset,offset-1]){
   if(index<0||index>=text.length||!HAN.test(text[index]))continue;
   const r=document.createRange();r.setStart(node,index);r.setEnd(node,index+1);const rect=r.getBoundingClientRect();
   if(e.clientX<rect.left-1||e.clientX>rect.right+1||e.clientY<rect.top-1||e.clientY>rect.bottom+1)continue;
   const annotated=node.parentElement.closest('.reading-hint[data-yomi]');const hit=annotated?dictionary.describe(annotated.textContent,[annotated.dataset.yomi]):dictionary.lookup(text,index);if(hit){show(hit,node.parentElement,e.clientX,e.clientY);return;}
  }
  hide();
 }
 const move=e=>{if(e.pointerType==='touch')return;lastEvent=e;if(!pending)pending=requestAnimationFrame(()=>{pending=0;point(lastEvent);});};
 const focus=e=>{if(!eligible(e.target))return hide();const el=e.target.closest('.reading-hint');if(!el)return hide();const text=el.textContent,index=[...text].findIndex(c=>HAN.test(c)),hit=el.dataset.yomi?dictionary.describe(text,[el.dataset.yomi]):dictionary.lookup(text,index);if(hit){const r=el.getBoundingClientRect();show(hit,el,r.left,r.bottom);}};
 const escape=e=>{if(e.key==='Escape')hide();};
 const out=e=>{if(!e.relatedTarget)hide();};
 document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerout',out);document.addEventListener('focusin',focus);document.addEventListener('keydown',escape);document.addEventListener('pointerdown',hide);document.addEventListener('scroll',hide,true);window.addEventListener('blur',hide);window.addEventListener('resize',hide);
 const observer=new MutationObserver(()=>{if(owner&&(!owner.isConnected||owner.closest('.hidden,.screen:not(.active),[hidden],dialog:not([open])')||!owner.getClientRects().length||!owner.textContent.includes(key.split('|')[0])))hide();});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open']});
 return ()=>{hide();cancelAnimationFrame(pending);observer.disconnect();document.removeEventListener('pointermove',move);document.removeEventListener('pointerout',out);document.removeEventListener('focusin',focus);document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',hide);document.removeEventListener('scroll',hide,true);window.removeEventListener('blur',hide);window.removeEventListener('resize',hide);document.documentElement.classList.remove('ui-reading-tooltips-active');};
}
