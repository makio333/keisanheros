import assert from 'node:assert/strict';
import {getJapaneseReadingQuestsV2} from '../japanese_reading_quests_v2.js';
import {readingRetryHint} from '../reading_retry_hints.js';
let count=0,pronouns=0;
for(let grade=1;grade<=6;grade++)for(const r of getJapaneseReadingQuestsV2(grade))for(const q of r.questions){const hint=readingRetryHint(r,q),chars=[...r.passage];assert.ok(hint.text);if(q.evidence.length)assert.ok(hint.ranges.length);for(const range of hint.ranges)assert.ok(range.start>=0&&range.end<=chars.length&&range.end>range.start);for(const e of q.evidence)assert.ok(hint.ranges.some(h=>h.start<=e.start&&h.end>=e.end));if(q.input.type==='extraction')assert.ok(hint.ranges.some(h=>h.end-h.start>[...q.answerText].length));if(/指示/.test(q.skill)){pronouns++;assert.ok(hint.text.includes('置きかえて')||hint.text.includes('ことば')||hint.text.includes('前後'));for(const ref of r.references.filter(ref=>q.referenceIds.includes(ref.id)))assert.ok(hint.ranges.some(h=>h.start<=ref.start&&h.end>=ref.end));}count++;}
assert.equal(count,300);assert.ok(pronouns>0);console.log('PASS: 300 sentence-context hints, pronoun references, extraction search regions, bounded Unicode offsets');
