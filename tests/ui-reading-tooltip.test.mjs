import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {SINGLE_KANJI_READINGS,WORD_KANJI_READINGS} from '../kanji_readings_data.js';
import {UI_READING_WORDS,UI_READING_CHARS} from '../ui_reading_words.js';
const source=fs.readFileSync(new URL('../ui_reading_tooltip.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replaceAll('export ','');
const c=vm.createContext({SINGLE_KANJI_READINGS,WORD_KANJI_READINGS,UI_READING_WORDS,UI_READING_CHARS});vm.runInContext(source+';globalThis.api={createUiReadingDictionary,READING_EXCLUDED};',c);
const d=c.api.createUiReadingDictionary({勇者:'ゆうしゃ'});
for(const word of ['経験値','幽霊王','修練場','報酬','装備','交換所'])for(let i=0;i<word.length;i++){const hit=d.lookup(word,i);assert.equal(hit.word,word);assert.ok(hit.readings.length>0);assert.equal(hit.characters.length,new Set(word).size);assert.ok(hit.characters.every(c=>c.readings.length));}
assert.equal(d.lookup('今回の経験値は10',4).word,'経験値');assert.equal(d.lookup('月影の幽霊王',4).word,'月影の幽霊王');assert.equal(d.lookup('学校',0).readings.includes('がっこう'),true);
assert.equal(d.lookup('MP',0),null);assert.equal(d.lookup('ひらがな',1),null);
assert.ok(c.api.READING_EXCLUDED.includes('#challenge-problem-text'));assert.ok(c.api.READING_EXCLUDED.includes('.kp-question'));assert.ok(c.api.READING_EXCLUDED.includes('#unified-problems-list'));
console.log('PASS: longest known compound, full word plus individual characters, education dictionary, non-Han ignored, problem exclusions');
