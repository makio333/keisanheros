import {printQuestVillager} from './print_quest_villagers.js';
import {questPrintRewards} from './print_reward_icons.js';
import {REVIEW_SETTINGS} from './gameplay_review_settings.js';
import {JAPANESE_READING_QUESTS_V2} from './japanese_reading_quests_v2.js';
import {renderWordProblemPrintV2} from './word_problem_print_layout_v2.js';
export function japaneseReadingPrintConfigV2(recordOrId,{mode='student',scale=1,writingMode='vertical-rl'}={}){
 const p=typeof recordOrId==='string'?JAPANESE_READING_QUESTS_V2.find(p=>p.id===recordOrId):recordOrId;
 if(!p?.passage||p.questions?.length!==5)throw new TypeError('Final reading record required');
 return {villager:printQuestVillager(JAPANESE_READING_QUESTS_V2.filter(q=>q.grade===p.grade).findIndex(q=>q.id===p.id)),title:p.title,subject:'japanese',grade:p.grade,story:p.passage,mode,scale,writingMode,pageLayout:REVIEW_SETTINGS.wordPrintLayout,rewardText:'クエスト報酬（G・EXPは5問クリア時、メダルは1問ごと）',rewardEntries:questPrintRewards({gold:900,exp:60,medals:1,medalPerQuestion:true}),
 storyAnnotations:{paragraphIndent:true,ruby:p.ruby.overrides,references:p.references,segments:p.segments},
 questions:p.questions.map(q=>({question:q.prompt,sourceId:q.id,options:q.input.type==='single-choice'?q.input.options.map((o,i)=>({label:q.print.optionLabels[i],text:o.text})):null,
 answer:q.scoring.mode==='human-rubric'?'人による確認（唯一の正解なし）':q.input.type==='single-choice'?`${q.print.optionLabels[q.input.options.findIndex(o=>o.id===q.correct)]}：${q.answerText}`:q.answerText,
 explanation:q.explanation,reviewCriteria:q.scoring.mode==='human-rubric'?q.scoring.criteria.map(c=>c.description):null,
 response:q.print.answerMode==='character-cells'?{kind:'cells',cells:q.print.cells,kanaCells:q.print.kanaAlternativeCells}:q.print.answerMode==='free-lines'?{kind:'lines',lines:q.print.lines,guideline:q.characterCondition.max}: {kind:'choice'},workMm:20}))};
}
export function renderJapaneseReadingPrintV2(record,options){return renderWordProblemPrintV2(japaneseReadingPrintConfigV2(record,options));}
export function selectJapanesePrintAuditV2(){const result=new Map();const add=(p,reason)=>{if(!result.has(p.id))result.set(p.id,{problem:p,reasons:[]});result.get(p.id).reasons.push(reason);};for(let grade=1;grade<=6;grade++){const a=JAPANESE_READING_QUESTS_V2.filter(p=>p.grade===grade);add(a[0],`grade${grade}-representative`);add(a.reduce((a,b)=>a.characterCount>=b.characterCount?a:b),`grade${grade}-longest`);}const ref=JAPANESE_READING_QUESTS_V2.find(p=>p.references.length);if(ref)add(ref,'underline-reference');return [...result.values()];}
