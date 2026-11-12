import assert from 'node:assert/strict';
import {QUEST_NOTICE_VARIANTS as variants,questNoticeVariant as variant} from '../quest_notice_variants.js';
import {JAPANESE_READING_QUESTS_V2 as records} from '../japanese_reading_quests_v2.js';
assert.equal(variants.length,4);const first=new Map(records.map(q=>[q.id,variant(q.id)]));
for(const r of [...records].reverse())assert.equal(variant(r.id),first.get(r.id));
assert.equal(new Set(first.values()).size,4);
const counts=Object.fromEntries(variants.map(v=>[v,0]));for(let i=0;i<10000;i++)counts[variant('quest-'+i)]++;for(const n of Object.values(counts))assert.ok(n>2200&&n<2800);
console.log('PASS: all four notice styles, stable per quest across ordering/pages, well-distributed seeded draw');
