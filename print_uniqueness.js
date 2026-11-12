export function printProblemKey(p){
 return String(p.kanjiSourceText||p.text||p.answer||'').normalize('NFKC').replace(/\s/gu,'');
}
export function uniquePrintProblems(generate,count=10,{key=printProblemKey,fallback=[]}={}){
 const out=[],seen=new Set();
 const add=p=>{if(!p)return;const value=key(p);if(!value||seen.has(value))return;seen.add(value);out.push(p);};
 for(let attempt=0;attempt<600&&out.length<count;attempt++)add(generate(out.length,attempt));
 for(const p of fallback){if(out.length>=count)break;add(p);}
 return out;
}
