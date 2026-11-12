export function fixture(params=new URLSearchParams()){
 const subject=params.get('subject')||'math',grade=Number(params.get('grade')||2),long=params.has('long');
 return {title:'小さな図書室の調査（独自の架空教材）',subject,grade,mode:params.has('teacher')?'teacher':'student',scale:Number(params.get('scale')||1),color:params.has('color'),writingMode:params.has('vertical')?'vertical-rl':'horizontal-tb',
 story:subject==='math'?'図書室に本が125さつあります。月曜日に28さつ、水曜日に17さつ借りられました。金曜日には9さつ返されました。':Array.from({length:long?35:5},(_,i)=>`　${i+1}日目、みなは図書室の窓を開けました。庭の小さな木には、新しい葉が出ています。みなは友だちと相談し、毎朝、葉の様子を記録することにしました。`).join('\n'),
 diagram:subject==='math'?{type:'rectangle',caption:'長方形の図（長さは数値を参照）',alt:'縦3cm、横5cmの長方形。縮尺は正確ではありません。',left:'3cm',bottom:'5cm'}:null,
 table:subject==='math'?{caption:'調べた記録（架空）',rows:[['曜日','貸出','返却'],['月','28','0'],['水','17','0'],['金','0','9']]}:null,
 questions:Array.from({length:long?12:4},(_,i)=>subject==='math'?{question:i===0?'図書室に残った本は何さつですか。式の第3項も省かず書きましょう。':i===1?'1.25mのリボンから0.75mを切りました。残りは何mですか。':i===2?'3/4 Lの水から1/4 Lを使いました。残りは何Lですか。':'記録を使い、あなたの考えを説明しましょう。',expression:i===0?'125 − 28 − 17 + 9':undefined,answer:['89さつ','0.5m','2/4 L（1/2 L）','独自の説明例'][i%4],workMm:35}:{question:`本文の${i+1}日目の様子を読み、みながしたことを説明しましょう。`,answer:'友だちと相談して葉の様子を記録することにした。',workMm:25})};
}
