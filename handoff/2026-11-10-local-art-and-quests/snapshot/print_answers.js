import {getAcceptedKanjiReadings,normalizeReading} from './kanji_readings.js';

const normalizeMath = value => String(value ?? '').normalize('NFKC').trim().replace(/[−－]/g,'-');
const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const decimalParts = value => {
  const [whole,fraction=''] = value.replace(/^\+/,'').split('.');
  const sign = whole.startsWith('-') ? -1n : 1n;
  return [sign*BigInt((whole.replace(/^-/,'') || '0')+fraction),10n**BigInt(fraction.length)];
};

export function formatPrintAnswer(problem) {
  return problem.remainder != null ? `${problem.answer} あまり ${problem.remainder}` : String(problem.answer);
}

export function isPrintAnswerCorrect(problem, input) {
  const expected = String(problem.answer ?? '');
  if (typeof problem.answer === 'string' && !/^[\d+\-.:/\s]+$/.test(expected)) {
    const accepted = getAcceptedKanjiReadings(String(problem.text || ''),expected,problem.alternatives || []);
    return accepted.has(/[\p{Script=Han}]/u.test(problem.text || '') ? normalizeReading(input) : String(input).trim());
  }
  let answer = normalizeMath(input);
  if (!answer || answer.length>100) return false;
  // Only units belonging to this question may be omitted from a numeric answer.
  if (problem.op === '道のり' && /時速\d+km/.test(problem.text || '')) answer = answer.replace(/\s*(?:km|キロメートル)$/i,'').trim();
  if (problem.op === '面積' && /半径\d+cm/.test(problem.text || '')) answer = answer.replace(/\s*(?:cm\^?2|平方センチメートル)$/i,'').trim();
  if (problem.remainder != null) {
    const match = answer.match(/^(\d+)\s*(?:あまり|余り|余|[rR]|…|\.{3})\s*(\d+)$/);
    if (!match) return Number(problem.remainder) === 0 && /^\d+$/.test(answer) && Number(answer) === Number(problem.answer);
    return Number(match[1]) === Number(problem.answer) && Number(match[2]) === Number(problem.remainder);
  }
  const fraction = /^(-?\d+)\s*\/\s*(\d+)$/;
  const targetFraction = expected.match(fraction);
  if (targetFraction) {
    const match = answer.match(fraction);
    return !!match && BigInt(match[2])>0n && BigInt(targetFraction[2])>0n && BigInt(match[1])*BigInt(targetFraction[2]) === BigInt(match[2])*BigInt(targetFraction[1]);
  }
  const ratio = /^(\d+)\s*:\s*(\d+)$/;
  const targetRatio = expected.match(ratio);
  if (targetRatio) {
    const match = answer.match(ratio);
    if (!match) return false;
    let a = BigInt(match[1]), b = BigInt(match[2]);
    if(b===0n || BigInt(targetRatio[2])===0n)return false;
    if (a*BigInt(targetRatio[2]) !== b*BigInt(targetRatio[1])) return false;
    if (problem.op !== 'かんたん') return a === BigInt(targetRatio[1]) && b === BigInt(targetRatio[2]);
    while (b) [a,b] = [b,a%b];
    return a === 1n;
  }
  if(!decimal.test(answer) || !decimal.test(expected) || !Number.isFinite(Number(answer)))return false;
  const [a,b]=decimalParts(answer),[c,d]=decimalParts(expected);
  return a*d===c*b;
}
