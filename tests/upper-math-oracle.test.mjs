import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const start = source.indexOf('function generateProblem(');
const end = source.indexOf('/* 1つの ステージ', start);
assert.ok(start >= 0 && end > start, 'VM extraction markers must exist');
let state = 0x4a6f7921;
function random() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 0x100000000;
}
const math = Object.create(Math);
math.random = random;
const context = vm.createContext({ Math: math });
// Use the production random helpers during seeded runs, without loading the UI.
for (const name of ['rnd', 'pick']) {
  const line = source.split('\n').find(line => line.startsWith(`function ${name}(`));
  assert.ok(line, `Missing production helper: ${name}`);
  vm.runInContext(line, context);
}
vm.runInContext(source.slice(start, end), context, { timeout: 5000 });
vm.runInContext('globalThis.areas = AREA_STAGES', context);
const realRnd = context.rnd;
const realPick = context.pick;

function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
function rational(n, d = 1n) {
  assert.notEqual(d, 0n, 'Zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d);
  return [n / g, d / g];
}
function number(value) {
  const s = String(value);
  if (s.includes('/')) {
    assert.match(s, /^-?\d+\/\d+$/);
    const [n, d] = s.split('/').map(BigInt);
    return rational(n, d);
  }
  assert.match(s, /^-?\d+(?:\.\d+)?$/, 'Finite decimal or fraction required');
  const places = s.split('.')[1]?.length ?? 0;
  return rational(BigInt(s.replace('.', '')), 10n ** BigInt(places));
}
function calc(a, op, b) {
  const [n, d] = a, [m, e] = b;
  if (op === '+') return rational(n * e + m * d, d * e);
  if (op === '-') return rational(n * e - m * d, d * e);
  if (op === '×') return rational(n * m, d * e);
  if (op === '÷') return rational(n * e, d * m);
  throw new Error(`Unsupported operator: ${op}`);
}
const equal = (a, b) => a[0] === b[0] && a[1] === b[1];
const show = a => a[1] === 1n ? String(a[0]) : `${a[0]}/${a[1]}`;

// Parse displayed operands, including the actual second operator in 3-term text.
function expression(text) {
  const tokens = text.trim().split(/\s+/);
  assert.ok(tokens.length === 3 || tokens.length === 5, `Unknown expression: ${text}`);
  const values = [number(tokens[0])], ops = [];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i], rhs = number(tokens[i + 1]);
    if (op === '×' || op === '÷') values.push(calc(values.pop(), op, rhs));
    else { assert.ok(op === '+' || op === '-'); ops.push(op); values.push(rhs); }
  }
  return ops.reduce((a, op, i) => calc(a, op, values[i + 1]), values[0]);
}
function expected(p) {
  let m;
  if ((m = p.text.match(/^(\d+) : (\d+) をかんたんに$/))) {
    const a = BigInt(m[1]), b = BigInt(m[2]), g = gcd(a, b);
    return { kind: 'ratio', value: `${a / g}:${b / g}` };
  }
  if ((m = p.text.match(/^(\d+) と (\d+) の平均$/))) {
    return { kind: 'average', value: calc(calc(number(m[1]), '+', number(m[2])), '÷', number(2)) };
  }
  if ((m = p.text.match(/^(\d+) の (\d+)%$/))) {
    return { kind: 'percent', value: calc(number(m[1]), '×', rational(BigInt(m[2]), 100n)) };
  }
  if ((m = p.text.match(/^時速(\d+)km で (\d+)時間(?:の道のり（km）)?$/))) {
    return { kind: 'distance', value: calc(number(m[1]), '×', number(m[2])) };
  }
  if ((m = p.text.match(/^半径(\d+)cmの円の面積(?:（cm²、円周率3\.14）)?$/))) {
    return { kind: 'circle', value: calc(calc(number(m[1]), '×', number(m[1])), '×', number('3.14')) };
  }
  if ((m = p.text.match(/^y=(\d+)x で x=(\d+) のとき y$/))) {
    return { kind: 'proportion', value: calc(number(m[1]), '×', number(m[2])) };
  }
  if ((m = p.text.match(/^(\d+)人が1列に並ぶ並び方$/))) {
    // Enumerate arrangements instead of copying the generator's 6/24 lookup.
    function arrangements(items) {
      return items.length === 0 ? 1 : items.reduce((n, _, i) =>
        n + arrangements(items.filter((_, j) => i !== j)), 0);
    }
    return { kind: 'permutations', value: number(arrangements(Array.from({ length: +m[1] }, (_, i) => i))) };
  }
  const value = expression(p.text);
  const fields = p.c === undefined ? `${p.a} ${p.op} ${p.b}` :
    `${p.a} ${p.text.trim().split(/\s+/)[1]} ${p.b} ${p.text.trim().split(/\s+/)[3]} ${p.c}`;
  assert.ok(equal(value, expression(fields)), `Operand/text disagreement: ${JSON.stringify(p)}`);
  return { kind: `arithmetic:${p.text.replace(/\d+(?:\.\d+)?(?:\/\d+)?/g, '#')}`, value };
}

test('upper-grade real generators agree with an independent rational oracle', () => {
  // Guard the oracle itself against fraction, decimal and precedence mistakes.
  assert.equal(show(expression('1/3 + 1/6')), '1/2');
  assert.equal(show(expression('0.3 × 3')), '9/10');
  assert.equal(show(expression('10 - 3 - 7')), '0');
  assert.equal(show(expression('2 + 3 × 4')), '14');
  const counts = { exhaustive: 0, boundary: 0, seeded: 0 };
  const entries = new Map(), kinds = new Map(), failures = [], uncovered = [];
  const witnesses = new Set();
  let wrongAnswers = 0;
  function audit(label, mode, p) {
    counts[mode]++;
    entries.set(label, (entries.get(label) ?? 0) + 1);
    try {
      const oracle = expected(p);
      kinds.set(oracle.kind, (kinds.get(oracle.kind) ?? 0) + 1);
      if (oracle.kind === 'ratio') {
        if (p.answer !== oracle.value) {
          wrongAnswers++;
          if (failures.length < 20) failures.push({ label, mode, text: p.text, actual: p.answer, expected: oracle.value });
        }
        if (/^(\d+):\1$/.test(p.a)) witnesses.add('equal-ratio');
      } else {
        if (!equal(number(p.answer), oracle.value)) {
          wrongAnswers++;
          if (failures.length < 20) failures.push({ label, mode, text: p.text, actual: p.answer, expected: show(oracle.value) });
        }
        if (oracle.value[0] === 0n) witnesses.add('zero');
        if (oracle.kind === 'average' && oracle.value[1] === 2n) witnesses.add('half-average');
        if (String(p.a).includes('/') && String(p.b).includes('/')) witnesses.add('fractions');
        if (String(p.a).includes('.') || String(p.b).includes('.')) witnesses.add('decimals');
      }
    } catch (error) {
      if (uncovered.length < 20) uncovered.push({ label, mode, problem: p, error: error.message });
    }
  }
  function restore() { context.rnd = realRnd; context.pick = realPick; math.random = random; }
  function forced(label, generate, draws, picks = [], coins = []) {
    const ints = [...draws], choices = [...picks], flips = [...coins];
    context.rnd = (lo, hi) => {
      assert.ok(ints.length, `Missing rnd draw for ${label}`);
      const n = ints.shift();
      assert.ok(Number.isInteger(n) && n >= lo && n <= hi, `Invalid draw ${n} for [${lo},${hi}]`);
      return n;
    };
    context.pick = array => {
      assert.ok(choices.length, `Missing pick for ${label}`);
      const index = choices.shift();
      assert.ok(index >= 0 && index < array.length);
      return array[index];
    };
    math.random = () => { assert.ok(flips.length, `Missing random draw for ${label}`); return flips.shift(); };
    try {
      audit(label, 'boundary', generate());
      assert.equal(ints.length + choices.length + flips.length, 0, `Unused forced draws: ${label}`);
    } finally { restore(); }
  }
  // Exhaust every finite rnd/pick decision in the twelve specialized stages.
  // Replaying a prefix discovers dependent ranges (e.g. fraction numerators).
  class NextChoice { constructor(values) { this.values = values; } }
  function exhaust(label, generate, prefix = []) {
    let cursor = 0;
    const choose = values => {
      if (cursor === prefix.length) throw new NextChoice(values);
      const v = prefix[cursor++];
      assert.ok(values.includes(v));
      return v;
    };
    context.rnd = (lo, hi) => choose(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i));
    context.pick = array => array[choose(Array.from({ length: array.length }, (_, i) => i))];
    math.random = () => { throw new Error(`Unexpected continuous random choice in ${label}`); };
    let next;
    try { audit(label, 'exhaustive', generate()); }
    catch (error) { if (error instanceof NextChoice) next = error.values; else throw error; }
    finally { restore(); }
    if (next) for (const v of next) exhaust(label, generate, [...prefix, v]);
  }
  for (const areaId of ['area11', 'area12']) {
    context.areas[areaId].stages.slice(0, 6).forEach((stage, i) => exhaust(`${areaId}/stage${i + 1}`, stage.generateProblem));
  }
  const edges = (lo, hi) => [...new Set([lo, Math.floor((lo + hi) / 2), hi])];
  for (const hard of [false, true]) {
    const generate = hard ? context.generateArea4HardMixedProblem : context.generateArea4MixedProblem;
    const label = hard ? 'helper/hard' : 'helper/mixed';
    const ranges = hard ? [[45, 99, 35, 99], [45, 99, 15, 98], [6, 9, 6, 9], [6, 9, 4, 9]] :
      [[10, 99, 1, 99], [10, 99, 1, 99], [1, 9, 1, 9], [2, 9, 1, 9]];
    ranges.forEach(([lo, hi, low, high], i) => {
      for (const a of edges(lo, hi)) for (const b of edges(low, high)) forced(label, generate, [i + 1, a, b]);
    });
    forced(label, generate, [2, 45, 45]);
    for (const a of edges(hard ? 30 : 10, hard ? 70 : 50)) {
      for (const b of edges(hard ? 10 : 1, hard ? 40 : 20)) {
        for (const c of edges(hard ? 10 : 1, hard ? 40 : 20)) {
          for (let branch = 0; branch < (hard ? 2 : 3); branch++) {
            // Normal -- always redraws; choose valid triples, with explicit rejection below.
            if (!hard && branch === 2 && (a < 20 || a < b + c)) continue;
            const draws = [5, a, b, c, ...(!hard && branch === 2 ? [a, b, c] : [])];
            forced(label, generate, draws, hard ? [] : [branch], hard ? [branch ? 0.999999 : 0] : []);
          }
        }
      }
    }
  }
  forced('helper/mixed/retry', context.generateArea4MixedProblem, [5, 10, 1, 1, 20, 20, 20, 20, 1, 19], [2]);
  forced('helper/hard/zero', context.generateArea4HardMixedProblem, [5, 30, 10, 40], [], [0.999999]);
  // Actual boss weighted selection boundaries: first bucket, threshold, last bucket.
  for (const areaId of ['area11', 'area12']) for (const phase of [1, 2]) {
    for (const coin of [0, 1 / 3 - Number.EPSILON, 1 / 3, 1 - Number.EPSILON]) {
      math.random = () => coin;
      try { audit(`${areaId}/boss${phase}/selection`, 'boundary', context.areas[areaId][`bossPhase${phase}Problem`]()); }
      finally { restore(); }
    }
  }
  for (const areaId of ['area4', 'area11', 'area12']) {
    const area = context.areas[areaId];
    const generators = area.stages.map((stage, i) => [`stage${i + 1}`, () => stage.generateProblem()]);
    for (const phase of [1, 2]) generators.push([`boss${phase}`, () => area[`bossPhase${phase}Problem`]()] );
    for (const [name, generate] of generators) {
      for (let i = 0; i < 1000; i++) audit(`${areaId}/${name}`, 'seeded', generate());
    }
  }
  const required = ['equal-ratio', 'zero', 'half-average', 'fractions', 'decimals'];
  assert.deepEqual(required.filter(key => !witnesses.has(key)), [], 'Missing boundary witnesses');
  console.log(JSON.stringify({ seed: '0x4a6f7921', counts, total: Object.values(counts).reduce((a, b) => a + b, 0),
    entries: Object.fromEntries(entries), kinds: Object.fromEntries(kinds), witnesses: [...witnesses].sort(),
    wrongAnswers, failures, uncovered,
    limits: ['Mixed operand combinations are boundary/seed sampled, not exhaustive.',
      'No inverse-proportion question exists in area12 stage5; only y=kx is generated.',
      'No fraction division or unlike-denominator addition/subtraction is generated by these stages.',
      'UI, answer-input acceptance, timing and pedagogy are outside this generator audit.'] }, null, 2));
  assert.equal(uncovered.length, 0, 'Oracle could not cover generated questions (see report)');
  assert.equal(wrongAnswers, 0, 'Confirmed generator/answer discrepancies (see report)');
});
