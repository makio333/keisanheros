import {printQuestVillager} from './print_quest_villagers.js';
import {questPrintRewards} from './print_reward_icons.js';
import {REVIEW_SETTINGS,groupQuestProblems} from './gameplay_review_settings.js';
import {MATH_WORD_QUESTS_V2,getMathWordQuestV2} from './math_word_quests_v2.js';
import {renderWordProblemPrintV2} from './word_problem_print_layout_v2.js';
const mathPrintVillager=p=>printQuestVillager(groupQuestProblems(MATH_WORD_QUESTS_V2.filter(q=>q.grade===p.grade)).findIndex(group=>group.some(q=>q.id===p.id)));
/** Exact presentation projection. Scoring/source data remain owned by the material module. */
export function mathWordPrintConfigV2(problemOrId,{mode='student',scale=1,color=false}={}){
 const p=typeof problemOrId==='string'?getMathWordQuestV2(problemOrId):problemOrId;
 if(!p||typeof p.story!=='string'||typeof p.question!=='string'||typeof p.answerDisplay!=='string')throw new TypeError('Final math record required');
 return {villager:mathPrintVillager(p),title:p.title,subject:'math',grade:p.grade,story:p.story,mode,scale,color,rewardText:'クエスト初回報酬（ゲーム内でクリア）',rewardEntries:questPrintRewards({gold:480,exp:360,medals:2}),
 questions:[{question:p.question,answer:p.answerDisplay,explanation:p.explanation,workMm:45,answerFields:p.input.fields.map(f=>({label:f.label,unit:f.unit??''}))}]};
}
export function renderMathWordPrintV2(problemOrId,options){return renderWordProblemPrintV2(mathWordPrintConfigV2(problemOrId,options));}
export function selectMathPrintAuditV2(){
 const selected=new Map();const add=(p,reason)=>{if(!selected.has(p.id))selected.set(p.id,{problem:p,reasons:[]});selected.get(p.id).reasons.push(reason);};
 for(let grade=1;grade<=6;grade++){const items=MATH_WORD_QUESTS_V2.filter(p=>p.grade===grade);add(items[0],`grade${grade}-representative`);add(items.reduce((a,b)=>a.text.length>=b.text.length?a:b),`grade${grade}-longest`);}
 for(const kind of new Set(MATH_WORD_QUESTS_V2.map(p=>p.answerKind)))add(MATH_WORD_QUESTS_V2.find(p=>p.answerKind===kind),`input-${kind}`);
 return [...selected.values()];
}
/** Final Japanese contract is intentionally supplied by its owner, never inferred from drafts. */
export function renderConfirmedReadingPrintV2(source,project){
 if(typeof project!=='function')throw new TypeError('Explicit final Japanese projection required');
 const config=project(source);
 if(config.subject!=='japanese'||!Array.isArray(config.questions))throw new TypeError('Final Japanese print contract required');
 return renderWordProblemPrintV2(config);
}

/** Five source records, with their own story and response fields preserved. */
export function renderMathWordSetPrintV2(records,{mode='student',calculationSpace='standard'}={}){
 if(!Array.isArray(records)||!records.length)throw new TypeError('Math quest set required');
 return renderWordProblemPrintV2({villager:mathPrintVillager(records[0]),title:`村人からの文章問題（${records.length}問）`,subject:'math',grade:records[0].grade,showGrade:records[0].showGrade!==false,mode,pageLayout:calculationSpace==='double'?'auto':records.length===5?REVIEW_SETTINGS.wordPrintLayout:'auto',rewardText:'1問ごとの報酬上限（回答・正解で段階獲得）',rewardEntries:questPrintRewards({gold:480,exp:360,medals:2}),
  questions:records.map(p=>({sourceId:p.id,question:`${p.story}\n${p.question}`,answer:p.answerDisplay,explanation:p.explanation,workMm:52,answerFields:p.input.fields.map(f=>({label:f.label,unit:f.unit??''}))}))}).replace('wpp2-root ', 'wpp2-root wpp2-math-set ');
}
