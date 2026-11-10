import { SINGLE_KANJI_READINGS, WORD_KANJI_READINGS } from './kanji_readings_data.js';

export function normalizeReading(value) {
  return String(value ?? '').normalize('NFKC').trim().replace(/[ァ-ヶ]/g,char=>String.fromCharCode(char.charCodeAt(0)-0x60));
}

export function getAcceptedKanjiReadings(text, answer, alternatives = []) {
  const kanji=/[\p{Script=Han}]/u.test(String(text || ''));
  // Kana spelling exercises remain strict (small kana, long vowels, script).
  if(!kanji)return new Set([answer,...alternatives].filter(Boolean));
  const set=new Set();
  const add=reading=>{const value=normalizeReading(reading);if(value)set.add(value);};
  add(answer);alternatives.forEach(add);
  (WORD_KANJI_READINGS[text] || []).forEach(add);
  if(/^[\p{Script=Han}]$/u.test(text)) (SINGLE_KANJI_READINGS[text] || []).forEach(add);
  // As before, accept the kanji part with or without displayed okurigana.
  const lead=text.match(/^[\p{Script=Hiragana}\p{Script=Katakana}ー]+/u)?.[0] || '';
  const tail=text.match(/[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u)?.[0] || '';
  for(const reading of [...set]) {
    let core=reading;
    if(lead && core.startsWith(normalizeReading(lead)))core=core.slice(normalizeReading(lead).length);
    if(tail && core.endsWith(normalizeReading(tail)))core=core.slice(0,-normalizeReading(tail).length);
    if(core)add(core);
  }
  return set;
}
