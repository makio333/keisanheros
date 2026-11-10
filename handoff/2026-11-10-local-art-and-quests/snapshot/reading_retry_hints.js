// Mark a sentence-sized search area, never just the answer word.
export function readingRetryHint(record,question){
 const chars=[...record.passage],boundary=c=>'。！？\n'.includes(c);
 const anchors=[...(question.evidence||[]),...(record.references||[]).filter(r=>(question.referenceIds||[]).includes(r.id))];
 const pronoun=/指示/.test(question.skill)&&((question.referenceIds||[]).length>0||/それ|これ|その|あれ/.test(question.prompt));
 const ranges=anchors.map(anchor=>{
  let start=anchor.start,end=anchor.end;
  while(start>0&&!boundary(chars[start-1]))start--;
  // Include the preceding sentence: pronouns often refer to something just before them.
  if(start>0){start--;while(start>0&&!boundary(chars[start-1]))start--;}
  while(end<chars.length&&!boundary(chars[end]))end++;
  if(end<chars.length)end++;
  return {start,end};
 }).sort((a,b)=>a.start-b.start);
 const merged=[];for(const range of ranges){const last=merged.at(-1);if(last&&range.start<=last.end)last.end=Math.max(last.end,range.end);else merged.push({...range});}
 const low=record.grade<=2;
 if(low)return {ranges:merged,text:pronoun?'えんぴつの せんが ある ぶんと、その まえを よもう。「それ」などを、まえに でた ことばに かえて よんでみよう。':question.input.type==='open-response'?'おはなしの どの ことばから そう おもったかな。おとなに はなしてみよう。':'えんぴつの せんが ある ぶんと、その まえや あとを よもう。だれが、なにを したのかな。'};
 return {ranges:merged,text:pronoun?'「それ」「この」などの言葉を、前に出てきた言葉に置きかえて読んでみよう。鉛筆の線がある文と、その前後を見てみよう。':question.input.type==='extraction'?'鉛筆の線がある文を読み、問いに合う言葉を自分で探して抜き出そう。線の全部が答えとは限らないよ。':question.input.type==='open-response'?'自分の考えにつながる本文の言葉を一つ選び、どうしてそう考えたのか、大人に説明してみよう。':'鉛筆の線がある文と、その前後を読み直そう。だれが、何をしたか、気持ちや理由に気をつけて選んでみよう。'};
}
