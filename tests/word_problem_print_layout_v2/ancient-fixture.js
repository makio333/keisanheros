export function ancientFixture(long=false){
 return {name:'架空の勇者',printId:'FIXTURE-33',grade:2,mathLabel:'架空算数',kanjiLabel:'架空国語',
 calculations:Array.from({length:10},(_,i)=>({text:`${i+4} + 3 − 2`,answer:String(i+5)})),
 stories:Array.from({length:3},(_,i)=>({text:long?`第${i+11}問。`+'庭に木があり、葉の数を記録しました。'.repeat(100):'玉が5こあります。3こもらい、2こ使いました。残りは何こですか。',answer:'6'})),
 readings:Array.from({length:10},()=>({text:'山',answer:'やま',printContext:{before:'大きな',after:'が見える。'}})),
 writings:Array.from({length:10},()=>({text:'川',answer:'かわ',printContext:{before:'近くに',after:'が流れる。'}}))};
}

// Normal grade-3 material length, kept separate from the artificial 1900-character stress stories.
export function ancientPracticalFixture(mathRecords){const f=ancientFixture(false);f.grade=3;f.printId='FIXTURE-G3-PRACTICAL';f.stories=mathRecords.map(p=>({text:p.text,answer:p.answerDisplay,sourceId:p.id}));return f;}
