import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  children = [];
  style = {};
  disabled = false;
  attributes = {};
  setAttribute(name,value){this.attributes[name]=value;}
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
context.spawnInputEffect=()=>{};
context.window.initKanjiInputUI(()=>{});
const keyboard=elements.get('software-keyboard');
const mainKeys=keyboard.children[0].children[0].children;
assert.deepEqual(mainKeys.slice(0,6).map(key=>key.textContent),['あ行','あ','い','う','え','お']);
assert.ok(mainKeys.filter(key=>key.classes?.has('key-blank') || key.className==='key-btn key-blank').every(key=>key.disabled&&key.attributes['aria-hidden']==='true'));
const input=elements.get('challenge-input');input.value='';
const modifiers=keyboard.children[1].children;
assert.deepEqual(modifiers.map(key=>key.textContent),['゛','゜','小さく','⌫ けす']);
assert.equal(modifiers[0].attributes['aria-label'],'濁点');
assert.equal(modifiers[1].attributes['aria-label'],'半濁点');
assert.deepEqual(mainKeys.filter(key=>key.className==='kana-row-label'&&key.style.gridColumn==='1').map(key=>key.textContent),['あ行','か行','さ行','た行','な行']);
assert.deepEqual(mainKeys.filter(key=>key.className==='kana-row-label'&&key.style.gridColumn==='7').map(key=>key.textContent),['は行','ま行','や行','ら行','わ行']);
const extras=['わ','を','ん','ー'].map(char=>mainKeys.find(key=>key.textContent===char));
assert.ok(extras.every(key=>key.style.gridRow==='5'&&Number(key.style.gridColumn)>=8),'wa/wo/n/long vowel are in the bottom right row');
mainKeys.find(key=>key.textContent==='き').onclick();modifiers[0].onclick();assert.equal(input.value,'ぎ');
mainKeys.find(key=>key.textContent==='や').onclick();modifiers[2].onclick();assert.equal(input.value,'ぎゃ');
for(const key of extras)key.onclick();assert.equal(input.value,'ぎゃわをんー');
modifiers[3].onclick();assert.equal(input.value,'ぎゃわをん','delete removes exactly one character');
input.value='は';modifiers[1].onclick();assert.equal(input.value,'ぱ');modifiers[0].onclick();assert.equal(input.value,'ば');modifiers[0].onclick();assert.equal(input.value,'は');
input.value='つ';modifiers[2].onclick();assert.equal(input.value,'っ');modifiers[2].onclick();assert.equal(input.value,'つ');
input.value='ん';modifiers[0].onclick();modifiers[1].onclick();modifiers[2].onclick();assert.equal(input.value,'ん','unsupported modifiers do not damage the answer');
input.value='';modifiers[0].onclick();assert.equal(input.value,'');
let total = 0;
for (const [tier, rows] of Object.entries(context.window.KANJI_POOLS).filter(([key]) => /^kana_(hira|kata)_\d$/.test(key))) {
  for (const row of rows) {
    const problem = { ...row, tier };
    for (const random of [0.1, 0.9]) {
      context.Math.random = () => random;
      const choice = context.window.createKanaChoiceProblem(problem);
      assert.ok(choice, `${tier}: ${row.answer} has choices`);
      assert.notEqual(choice.optionA, choice.optionB);
      assert.equal(choice.options[choice.correctIndex], row.answer);
      assert.equal(new Set(choice.options).size,choice.options.length,'no duplicate choices');
      if (!tier.endsWith('_2')) assert.ok(choice.explanation, 'non-sokuon questions explain the spelling');
      const results = [];
      context.window.initKanjiInputUI(value => results.push(value));
      context.window.setupKanjiChallenge(problem);
      const buttons = elements.get('kana-choice-buttons').children;
      assert.equal(buttons.length, row.choiceCount || 2);
      assert.ok(elements.get('kanji-challenge').classes.has('hidden'), 'choice questions hide the keyboard');
      const wrong = choice.correctIndex === 0 ? 1 : 0;
      buttons[wrong].onclick();
      assert.deepEqual(results, [false]);
      assert.equal(elements.get('result-text').textContent, '不正解...', 'wrong choices show central judgment');
      assert.equal(elements.get('result-overlay').classes.has('hidden'), false);
      assert.ok(buttons.every(button => button.disabled), 'one answer per question');
      assert.ok(elements.get('kana-choice-feedback').textContent.includes(row.answer), 'wrong answer shows correct spelling');
      buttons[choice.correctIndex].onclick();
      assert.deepEqual(results, [false], 'double clicks cannot score again');
      context.window.setupKanjiChallenge(problem);
      elements.get('kana-choice-buttons').children[choice.correctIndex].onclick();
      assert.deepEqual(results, [false, true], 'correct option is accepted');
      assert.equal(elements.get('result-text').textContent, '正解！！', 'correct choices show central judgment');
      total++;
    }
  }
}
assert.ok(total >= 120);
console.log(`PASS: ${total} kana choices, both option orders, spelling feedback and single submission`);
