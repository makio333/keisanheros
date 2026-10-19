import {getAcceptedKanjiReadings,normalizeReading} from '../kanji_readings.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor() {
    this.innerHTML = '';
    this.value = '';
    this.style = {};
    this.classList = { add() {}, remove() {} };
  }
  set textContent(value) {
    this.text = String(value);
    // DOM textContent replaces all children, including previous hint elements.
    this.innerHTML = '';
  }
  get textContent() { return this.text; }
}
const elements = new Map();
const context = vm.createContext({
  window: {}, getAcceptedKanjiReadings,normalizeReading,
  document: { getElementById(id) {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  } },
});
const gameSource = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
vm.runInContext(gameSource.slice(gameSource.indexOf('const READING_HINT_WORDS ='), gameSource.indexOf('function getChallengePrompt(')), context);
const renderHints = context.window.renderReadingHints;
assert.match(renderHints('勇者'), /reading-hint/, 'ordinary text still has reading hints');
context.window.renderReadingHints = () => { throw new Error('Reading questions must not invoke hint rendering'); };
context.window.createKanaLocationProblem = () => null;
vm.runInContext(fs.readFileSync(new URL('../kanji_input_ui.js', import.meta.url), 'utf8').replace(/^import .*;$/gm,''), context);
const problem = context.document.getElementById('challenge-problem-text');
for (const [text, answer, tier] of [
  ['牛', 'うし', 'kanji_g1'],
  ['海', 'うみ', 'kanji_g2'],
  ['小さい', 'ちいさい', 'kanji_g1'],
  ['あ', 'あ', 'kana_hira_1'],
  ['<b>牛</b>', 'うし', 'kanji_g1'],
]) {
  problem.innerHTML = '<span class="reading-hint" tabindex="0" data-yomi="うし">牛</span>';
  context.window.setupKanjiChallenge({ text, answer, tier });
  assert.equal(problem.textContent, text);
  assert.equal(problem.innerHTML, '', 'old hint nodes are removed, and no new answer metadata is inserted');
}
assert.ok(context.window.kanjiAcceptedAnswers('牛', 'うし').has('うし'), 'answer checking still accepts the correct reading');
assert.match(renderHints('勇者'), /data-yomi=/, 'hints outside reading questions remain available');
console.log('PASS: kanji questions do not expose answer hints; ordinary hints and answer checking remain intact');
