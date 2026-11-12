// Read the game's current generators for the local print review, without starting
// the game, accessing saves, or maintaining a second set of math questions.
export function regularPreviewCatalogSource(source) {
  const start=source.indexOf('function generateProblem(');
  const end=source.indexOf('/* 1つの ステージ',start);
  if(start<0||end<start)throw Error('Regular preview generator boundaries missing');
  return `const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const generateKanjiProblem=()=>{throw Error('Use the separate kanji preview');};
${source.slice(start,end)}
export {AREA_STAGES};`;
}
