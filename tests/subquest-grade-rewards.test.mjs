import assert from 'node:assert/strict';
import {getMathWordQuestsV2} from '../math_word_quests_v2.js';
import {getJapaneseReadingQuestsV2} from '../japanese_reading_quests_v2.js';
import {claimGradeClearRewards} from '../subquest_grade_rewards.js';
import {rewriteLegacyStory} from '../legacy_story_variants.js';
const g={player:{gold:0},mathWordQuestsV2:{completed:{}},japaneseReadingV2:{progress:{}}};assert.equal(claimGradeClearRewards(g).exp,0);for(const q of getMathWordQuestsV2(1))g.mathWordQuestsV2.completed[q.id]=true;assert.equal(claimGradeClearRewards(g).exp,1500);assert.equal(g.equipGachaTenPullTickets,1);for(const r of getJapaneseReadingQuestsV2(1))g.japaneseReadingV2.progress[r.id]=5;assert.equal(claimGradeClearRewards(g).exp,4500);assert.equal(g.equipGachaTenPullTickets,4);assert.equal(g.skinGachaTickets,7);assert.equal(g.player.gold,16000);assert.equal(claimGradeClearRewards(JSON.parse(JSON.stringify(g))).exp,0);
for(const family of ['add','sub','mul','div']){const titles=new Set();for(let scene=0;scene<6;scene++){const q=rewriteLegacyStory({uid:scene,tier:family+'1',parts:Array.from({length:5},()=>({a:8,b:2,answer:family==='add'?10:family==='sub'?6:family==='mul'?16:4}))},scene);titles.add(q.title);assert.equal(new Set(q.parts.map(p=>p.text)).size,5);assert.equal(new Set(q.parts.map(p=>p.semanticPattern)).size,5);}assert.equal(titles.size,6);}
console.log('PASS grade rewards paid once, both subjects, six situations, five semantic structures per family');
