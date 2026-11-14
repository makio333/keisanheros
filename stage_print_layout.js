import {japanesePrintHeader,japanesePrintHeaderCss} from './japanese_print_header.js';
import {renderPrintRewardIcons,standardPrintRewards} from './print_reward_icons.js';
import {kanjiPrintContext} from './kanji_print_context.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=japanesePrintHeaderCss+`
@page sp-portrait{size:A4 portrait;margin:8mm}@page sp-landscape{size:A4 landscape;margin:8mm}
.sp-page,.sp-page *{box-sizing:border-box}.sp-page{font:12pt/1.8 'Yu Mincho','Hiragino Mincho ProN',serif;color:#111;background:white;position:relative;margin:8mm auto;break-after:auto;break-inside:avoid;box-shadow:0 1px 8px #aaa}.sp-page~.sp-page{break-before:page;page-break-before:always}
.sp-portrait{page:sp-portrait;width:210mm;height:296mm;padding:12mm 15mm;display:flex;flex-direction:column;gap:5mm}
.sp-page h1{font:bold 16pt/1.4 sans-serif;margin:0 0 2mm}.sp-page header p{font:10pt/1.6 sans-serif;margin:0}.sp-rewards{font:8pt/1.5 sans-serif;margin-top:2mm;padding:2mm 0;border-bottom:.25mm solid #777}.sp-page footer{position:absolute;bottom:4mm;left:15mm;font:8pt sans-serif}
.sp-calculations{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-flow:column;grid-template-rows:repeat(var(--rows),1fr);gap:0 8mm}.sp-calculation{display:flex;gap:2mm;align-items:baseline;padding:2mm 0;border-bottom:.2mm dotted #aaa;font-size:15pt}.sp-calculation>span{flex:1}.sp-calculation i{display:inline-block;min-width:18mm;border-bottom:.25mm solid #555;font-style:normal}
.sp-stories{flex:1;display:flex;flex-direction:column;gap:5mm;min-height:0}.sp-story{flex:1;display:flex;flex-direction:column;min-height:0}.sp-story p{margin:0;font-size:13pt;line-height:2.1;white-space:pre-wrap}.sp-work{flex:1;min-height:20mm}.sp-story-answer{display:flex;gap:3mm;align-items:end;padding-bottom:2mm}.sp-story-answer i{flex:1;border-bottom:.25mm solid #555;min-height:7mm;font-style:normal}.sp-solution{white-space:pre-wrap;font-size:12pt}
.sp-landscape{page:sp-landscape;width:297mm;height:209mm;padding:10mm 12mm;display:flex;flex-direction:row-reverse;gap:5mm}
.sp-landscape header{writing-mode:vertical-rl;text-orientation:upright;flex:0 0 47mm;height:179mm;border-left:.25mm solid #777;padding-left:3mm}.sp-landscape h1{font-size:15pt;margin:0 0 0 3mm}.sp-landscape header p{margin:0 0 0 2mm;font-size:9pt;white-space:nowrap}.sp-name-line{display:inline-block;width:4mm;height:65mm;border-left:.25mm solid #555;vertical-align:middle;margin-top:3mm}.sp-date-line{height:40mm}
.sp-landscape .sp-rewards{border:0;padding:0;margin:0;font-size:7pt}.sp-landscape .sp-reward-caption{display:block;margin-left:2mm}.sp-landscape .print-reward-icons{display:flex!important;flex-direction:row;flex-wrap:wrap!important;gap:2mm!important;height:172mm;align-content:flex-start}.sp-landscape .print-reward-icon-entry{flex-direction:row;white-space:nowrap}
.sp-kanji-grid{flex:1;min-width:0;display:grid;grid-template-rows:repeat(2,minmax(0,1fr));gap:5mm}.sp-kanji-band{min-width:0;display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));direction:rtl;min-height:0;gap:1mm}.sp-kanji-band+.sp-kanji-band{border-top:.25mm solid #888;padding-top:3mm}.sp-kanji-question{direction:ltr;display:flex;flex-direction:row-reverse;gap:2mm;min-width:0;min-height:0;padding:0 1mm;border:0}
.sp-kanji-prompt{min-width:0;min-height:0;writing-mode:vertical-rl;text-orientation:upright;font-size:11pt;line-height:1.5;white-space:normal;margin:0}.sp-kanji-prompt u{text-underline-offset:1mm;font-weight:bold}.sp-kanji-answer{writing-mode:vertical-rl;text-orientation:upright;min-width:8mm;font-size:11pt;display:flex;flex-direction:row;align-items:center;gap:0}.sp-reading-target{position:relative;display:inline;vertical-align:baseline;margin:0}.sp-reading-target>u{white-space:nowrap}.sp-reading-target>.sp-kanji-answer{position:absolute;top:50%;transform:translateY(-50%);right:-9mm;padding:0;min-width:7mm;width:7mm}
.sp-reading-parentheses{display:flex;flex-direction:row;align-items:center;writing-mode:vertical-rl;text-orientation:upright;font-size:14pt;line-height:1}.sp-reading-space{display:block;width:7mm;height:var(--reading-space,32mm)}.sp-kanji-cell{display:block;width:var(--cell,7mm);height:var(--cell,7mm);border:.25mm solid #555;flex:none}.sp-kanji-cell+.sp-kanji-cell{border-top:0}.sp-landscape footer{left:12mm}
.sp-writing-target{display:inline-block;position:relative;vertical-align:middle;width:8mm;margin:1mm 4mm 1mm 0;line-height:1;break-inside:avoid}.sp-writing-hint{position:absolute;top:0;right:-4mm;font:8pt/1.35 'Yu Mincho',serif;writing-mode:vertical-rl;text-orientation:upright;border:0;padding-right:.6mm;white-space:nowrap}
.sp-writing-target:has(.sp-writing-parentheses) .sp-writing-hint{top:50%;transform:translateY(-50%)}
.sp-writing-inline,.sp-writing-cells,.sp-writing-parentheses{display:inline-flex;flex-direction:row;align-items:center;vertical-align:middle}.sp-writing-inline{margin:0}.sp-writing-parentheses{font-size:15pt;line-height:1}.sp-writing-parentheses i{display:inline-block;width:7mm}.sp-kanji-question[data-kind=kaki] .sp-kanji-prompt{line-height:2}.sp-kanji-question[data-kind=yomi]{padding-right:10mm}.sp-kanji-question[data-kind=yomi] .sp-kanji-prompt{padding-right:0}
@media print{html,body{margin:0!important;padding:0!important;background:white!important;height:auto!important;min-height:0!important}.sp-page{margin:0;box-shadow:none}.sp-portrait{width:194mm;height:280mm;padding:4mm 7mm}.sp-landscape{width:281mm;height:193mm;padding:2mm 4mm}.sp-page footer{left:7mm;bottom:1mm}}
`;
function header({title,name='',printId='',grade,mode,rewardsHtml,landscape=false,caption=''}){
 const meta=landscape?`<p>${esc(grade)}年 国語</p><p>なまえ<span class="sp-name-line">${esc(name)}</span></p><p>日付<span class="sp-name-line sp-date-line"></span></p>`:`<p>${grade}年 算数　なまえ：${esc(name)}＿＿＿＿＿＿　日付：＿＿＿＿＿＿</p>`;
 const reward=rewardsHtml?`<div class="sp-rewards"><span class="sp-reward-caption">${esc(caption||'1問正解につきメダル1枚')}</span>${rewardsHtml}</div>`:'';
 if(landscape)return japanesePrintHeader(esc(title)+(mode==='teacher'?'【解答】':''),meta,reward);
 return `<header><h1>${esc(title)}${mode==='teacher'?'【解答】':''}</h1>${meta}${rewardsHtml?`<div class="sp-rewards"><span class="sp-reward-caption">${esc(caption||'1問正解につきメダル1枚')}</span>${rewardsHtml}</div>`:''}</header>`;
}
export function renderKanjiStagePrint(problems,variant,title,name,printId,options={}){
 const mode=options.mode??'student',offset=options.numberOffset??0,grade=options.grade??3;
 const entries=standardPrintRewards({count:problems.length,ancientReward:!!options.blueprint});
 if(options.challengePrint){for(const [i,label] of [[1,'1問60EXP'],[2,'1問30G'],[3,`傷薬×3（${Math.ceil(problems.length*.5)}問以上）`],[4,`秘薬×9 または エーテル×3（${Math.ceil(problems.length*.8)}問以上）`],[5,'たね×3（全問正解）'],[6,'1500G（全問正解）']])entries[i].label=label;entries.push({icon:'🎫',label:`装備10連券×1（${Math.ceil(problems.length*.8)}問以上）`});}
 const rewardsHtml=options.rewardsHtml??renderPrintRewardIcons(entries);
 const pages=[];
 for(let start=0;start<problems.length;start+=20){
  const list=problems.slice(start,start+20),columns=Math.ceil(list.length/2),rows=[list.slice(0,columns),list.slice(columns)];
  const question=(p,i)=>{
   const type=variant==='mix'?(start+i<problems.length/2?'yomi':'kaki'):variant,c=kanjiPrintContext(p),number=start+i+1+offset;
   const okurigana=/[\p{Script=Han}々][ぁ-ゖァ-ヺー]/u.test(p.text);
   const solution=text=>`<span class="sp-source-answer wpp2-source-answer">${esc(text)}</span>`;
   let target,answer='';
   if(type==='kaki'){
    const spaceMm=Math.min(42,Math.max(24,[...p.text].length*7));
    const field=mode==='teacher'?solution(p.text):okurigana?`<span class="sp-writing-parentheses">（<i style="height:${spaceMm}mm"></i>）</span>`:`<span class="sp-writing-cells">${[...p.text].map(()=>'<i class="sp-kanji-cell"></i>').join('')}</span>`;
    const targetMm=mode==='teacher'?Math.max([...p.text].length,[...p.answer].length)*4.2+3:okurigana?spaceMm+11:[...p.text].length*Math.min(7,38/Math.max(1,[...p.text].length));
    target=`<span class="sp-writing-target" style="height:${targetMm}mm"><span class="sp-writing-inline" aria-label="書き取りの解答欄">${field}</span><span class="sp-writing-hint">${esc(p.answer)}</span></span>`;
   }else{
    target=`<span class="sp-reading-target"><u>${esc(p.text)}</u><span class="sp-kanji-answer" style="height:${mode==='teacher'?[...p.answer].length*4.5+2:Math.max(15,Math.min(24,[...p.answer].length*4))+11}mm" aria-label="読みの解答欄">${mode==='teacher'?solution(p.answer):'<span class="sp-reading-parentheses">（<i class="sp-reading-space"></i>）</span>'}</span></span>`;

   }
   return `<section class="sp-kanji-question" data-number="${number}" data-kind="${type}" data-okurigana="${okurigana}" style="--cell:${Math.min(7,38/Math.max(1,[...p.text].length))}mm;--reading-space:${Math.max(15,Math.min(24,[...p.answer].length*4))}mm"><p class="sp-kanji-prompt"><b>（<span class="jp-print-number">${number}</span>）</b> <span class="sp-source-question wpp2-source-question">${esc(c.before)}${target}${esc(c.after)}</span></p>${answer}</section>`;
  };
  pages.push(`<article class="sp-page sp-landscape" data-mode="${mode}">${header({title,grade,name,printId,mode,rewardsHtml,landscape:true,caption:options.rewardCaption})}<main class="sp-kanji-grid">${rows.map((row,band)=>`<div class="sp-kanji-band" style="--columns:${columns}">${row.map((p,i)=>question(p,band*columns+i)).join('')}</div>`).join('')}</main><footer>プリント番号：${esc(printId)} ／ ${offset+start+1}〜${offset+start+list.length}問</footer></article>`);
 }
 return `<style>${css}</style>${pages.join('')}`;
}
export function renderAncientStyledPrint(input,mode='student'){
 const {calculations,stories,readings,writings}=input,count=input.questionCount??33,rewardsHtml=renderPrintRewardIcons(standardPrintRewards({count,ancientReward:true})),common={title:'古代からの挑戦状',grade:input.grade??2,name:input.name??'',printId:input.printId??'',mode,rewardsHtml,caption:`全${count}問・${Math.ceil(count*.8)}問以上正解で古代装備`};
 const calc=`<article class="sp-page sp-portrait" data-mode="${mode}">${header({...common,title:common.title+'・計算'})}<main class="sp-calculations" style="--rows:5">${calculations.map((p,i)=>`<section class="sp-calculation" data-number="${i+1}"><b>${i+1}.</b><span class="sp-source-question wpp2-source-question">${esc(p.text)} ＝ <i>${mode==='teacher'?`<span class="sp-source-answer wpp2-source-answer">${esc(p.answer)}</span>`:''}</i></span></section>`).join('')}</main><footer>番号：${esc(input.printId)} ／ 算数1〜10問</footer></article>`;
 const story=`<article class="sp-page sp-portrait" data-mode="${mode}">${header({...common,title:common.title+'・文章問題'})}<main class="sp-stories">${stories.map((p,i)=>`<section class="sp-story" data-number="${i+11}"><p><b>${i+11}.</b> <span class="sp-source-question wpp2-source-question">${esc(p.text)}</span></p><div class="sp-work"></div><div class="sp-story-answer">答え：<i>${mode==='teacher'?`<span class="sp-source-answer wpp2-source-answer">${esc(p.answer)}</span>`:''}</i></div></section>`).join('')}</main><footer>番号：${esc(input.printId)} ／ 算数11〜13問</footer></article>`;
 if(input.mathOnly)return `<style>${css}</style>${calc}${story}`;
 const kanji=renderKanjiStagePrint([...readings,...writings],'mix',common.title+'・国語',common.name,common.printId,{grade:common.grade,mode,numberOffset:13,rewardsHtml:rewardsHtml,rewardCaption:common.caption});
 return `<style>${css}</style>${calc}${story}${kanji}`;
}
