import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { ancientCalculationProblem, ancientStoryProblem } from '../ancient_challenge_sheet.js';
import { isPrintAnswerCorrect } from '../print_answers.js';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const start = source.indexOf('function generateProblem(');
const end = source.indexOf('/* 1つの ステージ', start);
assert.ok(start >= 0 && end > start, 'production problem and stage definitions must be extractable');
let seed = 0x4a6f7921;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
}
const math = Object.create(Math);
math.random = random;
const context = vm.createContext({ Math: math });
for (const name of ['rnd', 'pick']) {
  const line = source.split('\n').find(value => value.startsWith(`function ${name}(`));
  assert.ok(line, `missing production helper: ${name}`);
  vm.runInContext(line, context);
}
vm.runInContext(source.slice(start, end), context, { timeout: 5000 });
vm.runInContext('globalThis.areas = AREA_STAGES', context);

function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
function rational(n, d = 1n) {
  if (d < 0n) { n = -n; d = -d; }
  const factor = gcd(n, d);
  return [n / factor, d / factor];
}
function valueOf(token) {
  const value = String(token);
  if (/^\d+\/\d+$/.test(value)) {
    const [n, d] = value.split('/').map(BigInt);
    return rational(n, d);
  }
  assert.match(value, /^\d+(?:\.\d+)?$/);
  const places = value.split('.')[1]?.length ?? 0;
  return rational(BigInt(value.replace('.', '')), 10n ** BigInt(places));
}
function calculate(a, operator, b) {
  const [n, d] = a, [m, e] = b;
  if (operator === '+') return rational(n * e + m * d, d * e);
  if (operator === '-') return rational(n * e - m * d, d * e);
  if (operator === '×') return rational(n * m, d * e);
  if (operator === '÷') return rational(n * e, d * m);
  throw new Error(`unsupported operator ${operator}`);
}
const equal = (a, b) => a[0] === b[0] && a[1] === b[1];

// Re-evaluate the displayed expression using a standalone parser, not the generator operands.
function expression(text) {
  const tokens = text.match(/\d+\/\d+|\d+(?:\.\d+)?|[()+\-×÷]/g) || [];
  assert.equal(tokens.join(''), text.replace(/\s/g, ''), `unparsed expression: ${text}`);
  let index = 0;
  function primary() {
    if (tokens[index] === '(') {
      index++;
      const value = sum();
      assert.equal(tokens[index++], ')');
      return value;
    }
    return valueOf(tokens[index++]);
  }
  function product() {
    let value = primary();
    while (tokens[index] === '×' || tokens[index] === '÷') {
      const operator = tokens[index++];
      value = calculate(value, operator, primary());
    }
    return value;
  }
  function sum() {
    let value = product();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++];
      value = calculate(value, operator, product());
    }
    return value;
  }
  const result = sum();
  assert.equal(index, tokens.length, `extra tokens in expression: ${text}`);
  return result;
}

function independentAnswer(stageIndex, problem) {
  if (stageIndex <= 1) {
    const match = problem.text.match(/^(\d+) ÷ (\d+)$/);
    assert.ok(match, `division prompt is incomplete: ${problem.text}`);
    const [dividend, divisor] = match.slice(1).map(BigInt);
    const quotient = dividend / divisor, remainder = dividend % divisor;
    assert.equal(BigInt(problem.answer), quotient, problem.text);
    assert.equal(BigInt(problem.remainder), remainder, problem.text);
    return rational(quotient);
  }
  if (stageIndex === 2 || stageIndex === 3 || stageIndex === 4) return expression(problem.text);
  if (stageIndex === 5) {
    let match = problem.text.match(/^縦(\d+)cm、横(\d+)cmの長方形の面積は何cm²ですか。$/);
    if (match) return rational(BigInt(match[1]) * BigInt(match[2]));
    match = problem.text.match(/^1辺が(\d+)cmの正方形の面積は何cm²ですか。$/);
    if (match) return rational(BigInt(match[1]) ** 2n);
    match = problem.text.match(/^縦(\d+)cm、横(\d+)cmの長方形と、1辺(\d+)cmの正方形があります。面積の差は何cm²ですか。$/);
    assert.ok(match, `area prompt is incomplete: ${problem.text}`);
    return rational(BigInt(match[1]) * BigInt(match[2]) - BigInt(match[3]) ** 2n);
  }
  let match = problem.text.match(/^直角は90°です。2つに分けた一方が(\d+)°です。もう一方は何度ですか。$/);
  if (match) return rational(90n - BigInt(match[1]));
  match = problem.text.match(/^一直線上の隣り合う2つの角は合わせて180°です。一方が(\d+)°なら、もう一方は何度ですか。$/);
  if (match) return rational(180n - BigInt(match[1]));
  match = problem.text.match(/^1回転を3つの角に分けました。2つが(\d+)°と(\d+)°なら、残りは何度ですか。$/);
  assert.ok(match, `angle prompt is incomplete: ${problem.text}`);
  return rational(360n - BigInt(match[1]) - BigInt(match[2]));
}

function stageIndexFor(problem) {
  if (problem.op === 'grade4_expression') return 4;
  if (problem.op === 'grade4_area') return 5;
  if (problem.op === 'grade4_angle') return 6;
  if (String(problem.answer).includes('/')) return 3;
  if (problem.remainder != null) return Number(problem.b) < 10 ? 0 : 1;
  if (/[+\-×÷]/.test(problem.text) && problem.text.includes('.')) return 2;
  throw new Error(`unknown area4 problem kind: ${problem.text}`);
}

test('4年通常7ステージは表示問題と答えが一致し、負の答えを生成しない', () => {
  const area = context.areas.area4;
  assert.equal(area.stages.length, 7);
  assert.equal(area.displayNum, '4年');
  assert.equal(area.opLabel, '4年生の算数');
  assert.deepEqual(Array.from(area.stages, stage => stage.name), [
    '1けたでわる筆算', '2けたでわる筆算', '小数の計算', '同分母の分数',
    '四則と（ ）の計算', '面積（長方形・正方形）', '角度の大きさ'
  ]);

  const witnesses = Array.from({ length: 7 }, () => new Set());
  let checked = 0;
  for (let stageIndex = 0; stageIndex < area.stages.length; stageIndex++) {
    const generate = area.stages[stageIndex].generateProblem;
    for (let sample = 0; sample < 2000; sample++) {
      const problem = generate();
      const expected = independentAnswer(stageIndex, problem);
      const actual = valueOf(problem.answer);
      assert.ok(actual[0] >= 0n, `${area.stages[stageIndex].name} generated a negative answer: ${problem.text}`);
      assert.ok(equal(actual, expected), `${problem.text} = ${problem.answer}`);
      const entered = problem.remainder == null ? String(problem.answer) : `${problem.answer} あまり ${problem.remainder}`;
      assert.ok(isPrintAnswerCorrect(problem, entered), `current answer parser rejected ${entered}`);
      if (problem.remainder != null) {
        const divisor = BigInt(problem.b);
        assert.ok(BigInt(problem.remainder) >= 0n && BigInt(problem.remainder) < divisor);
        assert.ok(isPrintAnswerCorrect(problem, `${problem.answer} あまり ${problem.remainder}`));
        witnesses[stageIndex].add(problem.remainder === 0 ? 'exact' : 'remainder');
      }
      if (stageIndex === 2) {
        const operator = problem.text.match(/[+\-×÷]/)?.[0];
        if (operator) witnesses[stageIndex].add(operator);
        if (/\.\d{2}/.test(problem.text)) witnesses[stageIndex].add('hundredths');
        else witnesses[stageIndex].add('tenths');
      }
      if (stageIndex === 3) {
        witnesses[stageIndex].add(problem.op);
        const [numerator, denominator] = String(problem.answer).split('/').map(Number);
        assert.notEqual(numerator % denominator, 0, 'fraction slot format must not hide a whole-number answer');
        if (problem.op === '+' && numerator > denominator) witnesses[stageIndex].add('improper-sum');
      }
      if (stageIndex === 4) for (const symbol of problem.text.match(/[+\-×÷]/g) || []) witnesses[stageIndex].add(symbol);
      if (stageIndex === 4 && problem.text.includes('(')) witnesses[stageIndex].add('parentheses');
      if (stageIndex === 5 && problem.text.includes('面積の差')) witnesses[stageIndex].add('difference');
      if (stageIndex === 5 && problem.text.includes('長方形')) witnesses[stageIndex].add('rectangle');
      if (stageIndex === 5 && problem.text.includes('正方形')) witnesses[stageIndex].add('square');
      if (stageIndex === 6 && problem.text.includes('直角')) witnesses[stageIndex].add('right-angle');
      if (stageIndex === 6 && problem.text.includes('一直線')) witnesses[stageIndex].add('straight-angle');
      if (stageIndex === 6 && problem.text.includes('1回転')) witnesses[stageIndex].add('full-turn');
      if (stageIndex === 4 || stageIndex === 5 || stageIndex === 6) {
        const story = ancientStoryProblem(problem);
        assert.ok(story?.isWordProblem, `ancient worksheet story failed for ${problem.text}`);
        assert.ok(story.text.length > 10);
        assert.ok(isPrintAnswerCorrect(story, String(problem.answer)));
        const calculation = ancientCalculationProblem(problem);
        assert.ok(equal(expression(calculation.text), actual), `ancient calculation prompt changed the answer: ${calculation.text}`);
      }
      if (stageIndex === 5) {
        assert.equal(isPrintAnswerCorrect(problem, `${problem.answer}cm²`), false, 'regular battle answers remain numeric only');
      }
      checked++;
    }
  }
  assert.equal(checked, 14000);
  assert.deepEqual([...witnesses[0]].sort(), ['exact', 'remainder']);
  assert.deepEqual([...witnesses[1]].sort(), ['exact', 'remainder']);
  for (const symbol of ['+', '-', '×', '÷']) assert.ok(witnesses[2].has(symbol), `decimal operation ${symbol} was not sampled`);
  assert.ok(witnesses[2].has('hundredths'));
  for (const symbol of ['+', '-', 'improper-sum']) assert.ok(witnesses[3].has(symbol));
  for (const symbol of ['+', '-', '×', '÷', 'parentheses']) assert.ok(witnesses[4].has(symbol));
  for (const kind of ['rectangle', 'square', 'difference']) assert.ok(witnesses[5].has(kind));
  for (const kind of ['right-angle', 'straight-angle', 'full-turn']) assert.ok(witnesses[6].has(kind));

  assert.ok(area.stages[0].timeLimit >= 8000 && area.stages[1].timeLimit >= 9000);
  assert.ok(area.stages[4].timeLimit >= 9000);
  assert.ok(area.stages[5].timeLimit >= 9000 && area.stages[6].timeLimit >= 9000);
  for (const phase of [1, 2]) {
    for (let sample = 0; sample < 1000; sample++) {
      const problem = area[`bossPhase${phase}Problem`]();
      const actual = valueOf(problem.answer);
      const expected = independentAnswer(stageIndexFor(problem), problem);
      assert.ok(actual[0] >= 0n, `boss${phase} generated a negative answer: ${problem.text}`);
      assert.ok(equal(actual, expected), `boss${phase}: ${problem.text} = ${problem.answer}`);
    }
  }
  assert.match(source, /const STAGE_REWARD_MATH_ORDER = \['area1', 'area13', 'area2', 'area3', 'area4', 'area11', 'area12'\]/);
  assert.equal(context.areas.area11.stages[6].generateProblem, context.generateArea4MixedProblem);
  assert.equal(context.areas.area12.stages[6].generateProblem, context.generateArea4MixedProblem);
  assert.notEqual(area.stages[0].generateProblem, context.generateArea4MixedProblem);
  assert.match(source, /inputmode="numeric" id="ch-input"/);
  assert.match(source, /filter\(symbol => '\.\/:%-'\.includes\(symbol\)\)/);
});

test('4年ステージの乱数上下端と保存インデックス互換を確認', () => {
  const area = context.areas.area4;
  const originalRnd = context.rnd;
  const originalPick = context.pick;
  const originalRandom = math.random;
  try {
    for (const edge of ['min', 'max']) {
      context.rnd = (low, high) => edge === 'min' ? low : high;
      context.pick = values => edge === 'min' ? values[0] : values.at(-1);
      math.random = () => edge === 'min' ? 0 : 1 - Number.EPSILON;
      for (let index = 0; index < area.stages.length; index++) {
        const problem = area.stages[index].generateProblem();
        const expected = independentAnswer(index, problem);
        const actual = valueOf(problem.answer);
        assert.ok(actual[0] >= 0n, `${edge} boundary generated a negative result: ${problem.text}`);
        assert.ok(equal(actual, expected), `${edge} boundary: ${problem.text} = ${problem.answer}`);
      }
      for (const phase of [1, 2]) {
        const problem = area[`bossPhase${phase}Problem`]();
        const actual = valueOf(problem.answer);
        assert.ok(actual[0] >= 0n, `${edge} boss boundary generated a negative result: ${problem.text}`);
        assert.ok(equal(actual, independentAnswer(stageIndexFor(problem), problem)));
      }
    }
  } finally {
    context.rnd = originalRnd;
    context.pick = originalPick;
    math.random = originalRandom;
  }

  // Saved progress and rewards are addressed by areaId and array index, not stage name.
  assert.match(source, /stageClearCounts: \{\}, \/\/ 新ステージ制（1-1など個別ステージ）ごとの クリアかいすう（areaId → \[0〜3, \.\.\.\]）/);
  assert.match(source, /G\.stageClearCounts\[areaId\] = \(area && area\.stages \? area\.stages\.map\(\(\) => 0\) : \[\]\)/);
  assert.match(source, /STAGE_REWARD_MATH_ORDER = \['area1', 'area13', 'area2', 'area3', 'area4', 'area11', 'area12'\]/);
  assert.equal(area.stages.length, 7, 'persisted indexes 0–6 remain present');
});
