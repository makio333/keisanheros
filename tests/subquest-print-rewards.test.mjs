import test from 'node:test';import assert from 'node:assert/strict';
import {getJapaneseReadingQuestsV2} from '../japanese_reading_quests_v2.js';
import {getMathWordQuestsV2} from '../math_word_quests_v2.js';
import {subquestPrintMeta,claimSubquestPrintReward} from '../subquest_print.js';
import {storeMathAnswer,finishMathRun} from '../math_word_session.js';
import {readingRewardProgress} from '../japanese_reading_session_v2.js';
const make=()=>({player:{gold:0}}),full=[true,true,true,true,true],partial=[true,true,false,false,false],blank=full.map(()=>false);
for(const subject of ['math','japanese']){
 const records=subject==='math'?getMathWordQuestsV2(2).slice(0,5):getJapaneseReadingQuestsV2(2)[1],meta=subquestPrintMeta(subject,records);
 test(subject+' full print equals subquest reward, no ordinary print consumables',()=>{const g=make();assert.deepEqual(claimSubquestPrintReward(g,meta,full),{gold:2400,exp:1800,medals:10,equip:0,skin:0});assert.equal(g.items,undefined);assert.deepEqual(claimSubquestPrintReward(g,meta,full),{gold:0,exp:0,medals:0,equip:0,skin:0});});
 test(subject+' unanswered gives nothing; answering and correcting follow shared portions',()=>{const g=make();assert.equal(claimSubquestPrintReward(g,meta,blank,blank).gold,0);assert.deepEqual(claimSubquestPrintReward(g,meta,partial),{gold:1680,exp:1260,medals:7,equip:0,skin:0});assert.deepEqual(claimSubquestPrintReward(g,meta,full),{gold:720,exp:540,medals:3,equip:0,skin:0});});
}
test('screen math and paper share one payout cap in both orders',()=>{const group=getMathWordQuestsV2(1).slice(0,5),meta=subquestPrintMeta('math',group);for(const paperFirst of [false,true]){const g=make();if(paperFirst)claimSubquestPrintReward(g,meta,full);let exp=0;for(const p of group)exp+=storeMathAnswer(g,group,p,{value:p.answer},0).exp;exp+=finishMathRun(g,group).exp;if(paperFirst)assert.equal(exp,0);else assert.equal(exp,1800);assert.equal(claimSubquestPrintReward(g,meta,full).exp,0);assert.equal(g.player.gold,2400);assert.equal(g.questMedals,10);}});
test('paper updates reading progress and full source ledger',()=>{const record=getJapaneseReadingQuestsV2(2)[1],g=make();claimSubquestPrintReward(g,subquestPrintMeta('japanese',record),full);assert.equal(readingRewardProgress(g,record).percent,100);assert.equal(g.japaneseReadingV2.progress[record.id],5);});
