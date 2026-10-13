import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  children = [];
  style = {};
  disabled = false;
  classes = new Set();
  classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name) };
  set innerHTML(value) { this.children = []; this.html = value; }
  appendChild(child) { this.children.push(child); }
}
const elements = new Map();
const context = vm.createContext({
  window: {}, Math: Object.create(Math), setTimeout() {},
  document: { getElementById(id) {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  }, createElement: () => new Element() },
});
vm.runInContext(fs.readFileSync(new URL('../kanji_data.js', import.meta.url), 'utf8'), context);
const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
vm.runInContext(source.slice(source.indexOf('function createSokuonChoiceProblem('), source.indexOf('function startChallenge(')), context);
vm.runInContext(fs.readFileSync(new URL('../kanji_input_ui.js', import.meta.url), 'utf8'), context);
let total = 0;
for (const [tier, rows] of Object.entries(context.window.KANJI_POOLS).filter(([key]) => /^kana_(hira|kata)_\d$/.test(key))) {
  for (const row of rows) {
    const problem = { ...row, tier };
    for (const random of [0.1, 0.9]) {
      context.Math.random = () => random;
      const choice = context.window.createKanaChoiceProblem(problem);
      assert.ok(choice, `${tier}: ${row.answer} has choices`);
      assert.notEqual(choice.optionA, choice.optionB);
      assert.equal(choice[choice.correctOption === 'A' ? 'optionA' : 'optionB'], row.answer);
      if (!tier.endsWith('_2')) assert.ok(choice.explanation, 'non-sokuon questions explain the spelling');
      const results = [];
      context.window.initKanjiInputUI(value => results.push(value));
      context.window.setupKanjiChallenge(problem);
      const buttons = elements.get('kana-choice-buttons').children;
      assert.equal(buttons.length, 2);
      assert.ok(elements.get('kanji-challenge').classes.has('hidden'), 'choice questions hide the keyboard');
      const wrong = choice.correctOption === 'A' ? 1 : 0;
      buttons[wrong].onclick();
      assert.deepEqual(results, [false]);
      assert.equal(elements.get('result-text').textContent, '不正解...', 'wrong choices show central judgment');
      assert.equal(elements.get('result-overlay').classes.has('hidden'), false);
      assert.ok(buttons.every(button => button.disabled), 'one answer per question');
      assert.ok(elements.get('kana-choice-feedback').textContent.includes(row.answer), 'wrong answer shows correct spelling');
      buttons[1 - wrong].onclick();
      assert.deepEqual(results, [false], 'double clicks cannot score again');
      context.window.setupKanjiChallenge(problem);
      elements.get('kana-choice-buttons').children[1 - wrong].onclick();
      assert.deepEqual(results, [false, true], 'correct option is accepted');
      assert.equal(elements.get('result-text').textContent, '正解！！', 'correct choices show central judgment');
      total++;
    }
  }
}
assert.ok(total >= 120);
console.log(`PASS: ${total} kana choices, both option orders, spelling feedback and single submission`);
