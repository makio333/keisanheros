import {japanesePrintHeader,japanesePrintHeaderCss} from './japanese_print_header.js';
import {renderAncientStyledPrint,renderKanjiStagePrint} from './stage_print_layout.js';
import {japaneseReadingPrintConfigV2} from './japanese_reading_print_adapter_v2.js';
import {annotatedPrintTextV2} from './word_problem_print_layout_v2.js';
import {renderPrintRewardIcons,standardPrintRewards} from './print_reward_icons.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ancientReadingTestPlan(input){
 const {calculations,stories,readings,writings,readingPassage}=input;
 if(calculations?.length!==10||stories?.length!==3||readings?.length!==5||writings?.length!==5||readingPassage?.questions?.length!==5)throw new Error('計算10・文章3・読み5・書き5・読解5問が必要です');
 const count=28,passCount=Math.ceil(count*.8),record=readingPassage;
 const rewards=renderPrintRewardIcons(standardPrintRewards({count,ancientReward:true}));
 function render(mode){
  const math=renderAncientStyledPrint({...input,mathOnly:true,questionCount:count},mode);
  const kanji=renderKanjiStagePrint([...readings,...writings],'mix','古代からの挑戦状・漢字',input.name,input.printId,{grade:input.grade,mode,numberOffset:13,rewardsHtml:rewards,rewardCaption:`全${count}問・${passCount}問以上正解で古代装備`});
  const config=japaneseReadingPrintConfigV2(record,{mode});
  const question=(q,i)=>{
   const answer=mode==='teacher'?`<div class="art-answer sp-source-answer wpp2-source-answer">${esc(q.answer)}${q.reviewCriteria?`<p>${q.reviewCriteria.map(esc).join('／')}</p>`:''}</div>`:q.response.kind==='choice'?'<p>答え：＿＿</p>':q.response.kind==='cells'?`<div class="art-extract">本文の表記<span class="art-cells">${'<i></i>'.repeat(q.response.cells)}</span>かな<span class="art-cells">${'<i></i>'.repeat(q.response.kanaCells)}</span></div>`:'<div class="art-open-lines"><i></i><i></i><i></i></div>';
   return `<section class="art-question" data-number="${24+i}"><p><b><span class="jp-print-number">${24+i}</span>.</b> <span class="wpp2-source-question">${esc(q.question)}</span></p>${q.options?`<ol>${q.options.map(o=>`<li>${esc(o.label)} ${esc(o.text)}</li>`).join('')}</ol>`:''}${answer}</section>`;
  };
  return `${math}${kanji}<style>
.art-reading{overflow:hidden}.art-reading .art-body{display:grid;grid-template-rows:76mm minmax(0,1fr);gap:4mm;flex:1;min-width:0;height:179mm}.art-passage{writing-mode:vertical-rl;text-orientation:upright;font:11pt/1.9 'Yu Mincho',serif;white-space:pre-wrap;margin:0;overflow-wrap:anywhere;border-bottom:.25mm solid #777;padding-bottom:3mm}.art-passage rt{font-size:.5em}.art-passage u{text-underline-offset:1mm}
.art-questions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));direction:rtl;min-height:0;gap:2mm}.art-question{direction:ltr;writing-mode:vertical-rl;text-orientation:upright;font:10pt/1.6 'Yu Mincho',serif;padding-left:2mm;border-left:.2mm dotted #888;min-width:0;min-height:0;display:flex;flex-direction:column;gap:1.5mm}.art-question p{margin:0}.art-question ol{list-style:none;padding:0;margin:0}.art-question li{margin-left:1.5mm}.art-open-lines{display:flex;flex-direction:column;flex:1;gap:3mm}.art-open-lines i{display:block;border-left:.2mm solid #777;min-width:3mm;height:100%;flex:1}.art-extract{display:flex;flex-direction:column;gap:1mm}.art-cells{display:flex;flex-wrap:wrap;max-height:100%;gap:0}.art-cells i{display:block;width:4.5mm;height:4.5mm;border:.2mm solid #555}.art-answer{font-size:9pt;white-space:pre-wrap}.art-answer p{margin-right:1mm}.art-reading header h1{font-size:14pt}
</style><article class="sp-page sp-landscape art-reading" data-mode="${mode}">${japanesePrintHeader('古代からの挑戦状・読解',`<p>${input.grade}年 国語</p><p>なまえ<span class="sp-name-line">${esc(input.name)}</span></p><p>日付<span class="sp-name-line sp-date-line"></span></p>`,`<div class="sp-rewards"><span class="sp-reward-caption">全28問・23問以上正解</span>${renderPrintRewardIcons(standardPrintRewards({count}).slice(0,3))}</div>`)}<main class="art-body"><div class="art-passage"><b>${esc(record.title)}</b>
${annotatedPrintTextV2(record.passage,config.storyAnnotations)}</div><div class="art-questions">${config.questions.map(question).join('')}</div></main><footer>番号：${esc(input.printId)} ／ 国語24〜28問・記述問題は先生が内容を確認</footer></article>`;
 }
 return {questionCount:count,passCount,consumeCount:1,automaticStudentHtml:render('student'),teacherHtml:render('teacher'),records:[...calculations,...stories,...readings,...writings,...record.questions]};
}
