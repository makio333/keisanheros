export function ancientStoryProblem(p){
 const a=String(p.a??''),b=String(p.b??'');let text=typeof p.storyText==='string'?p.storyText.trim():'';
 const whole=Number.isInteger(Number(a))&&Number.isInteger(Number(b))&&Number(a)>=0&&Number(b)>0;
 if(['+','-','×','÷','平均','の'].includes(p.op)&&(!a||!b))return null;
 if(p.op==='+')text=whole?`ほうせきを${a}こ もっています。さらに${b}こ もらいました。ぜんぶで なんこ ありますか。`:`リボンを${a}m持っています。さらに${b}mもらいました。全部で何mありますか。`;
 if(p.op==='-')text=whole?`ほうせきを${a}こ もっています。${b}こ つかいました。のこりは なんこですか。`:`${a}mのリボンから${b}mを切り取りました。残りは何mですか。`;
 if(p.op==='×')text=whole?`1ふくろに ほうせきを${a}こずつ 入れます。${b}ふくろでは、ぜんぶで なんこですか。`:`長さ${a}mのリボンを、元の${b}倍の長さにします。何mになりますか。`;
 if(p.op==='÷')text=p.remainder!=null?`宝石${a}個を、袋1つに${b}個ずつ入れます。いっぱいの袋はいくつできて、何個余りますか。`:`${a}Lのジュースを${b}人で同じ量ずつ分けます。1人分は何Lですか。`;
 if(p.op==='平均')text=`勇者は1日目に${a}km、2日目に${b}km歩きました。1日あたり平均何km歩きましたか。`;
 if(p.op==='の')text=`${a}円の代金の${b}を先に払います。先に払う金額は何円ですか。`;
 if(p.op==='かんたん'){const [x,y]=a.split(':');if(x&&y)text=`赤い玉が${x}個、青い玉が${y}個あります。赤と青の個数の比を、最も簡単な整数の比で答えましょう。`;}
 if(p.op==='道のり')text=`馬車が${a}で${b}走ります。進んだ道のりは何kmですか。`;
 if(p.op==='面積')text=`${a}の丸い花壇を作ります。面積は何cm²ですか。円周率は3.14とします。`;
 if(p.op==='yの値'){const k=a.match(/y=(\d+)x/)?.[1],x=b.match(/x=(\d+)/)?.[1];if(k&&x)text=`1箱に${k}個ずつ石を入れます。${x}箱では石は全部で何個になりますか。`;}
 if(p.op==='並び方')text=`${a}の勇者が1列に並びます。並び方は全部で何通りありますか。`;
 if(!text&&p.op==='+-'){const n=String(p.text).match(/^(\d+)\s*\+\s*(\d+)\s*-\s*(\d+)$/);if(n)text=`石を${n[1]}個持っています。${n[2]}個もらい、${n[3]}個使いました。残りは何個ですか。`;}
 return text?{...p,text,isWordProblem:true,category:'story',originalExpression:p.text}:null;
}
export function ancientCalculationProblem(p){
 let text=p.text;const a=String(p.a??''),b=String(p.b??'');
 if(p.op==='平均')text=`(${a} + ${b}) ÷ 2`;
 if(p.op==='の'&&b.endsWith('%'))text=`${a} × (${b.slice(0,-1)} ÷ 100)`;
 if(p.op==='道のり'){const speed=a.match(/時速(\d+)km/)?.[1],hours=b.match(/(\d+)時間/)?.[1];if(speed&&hours)text=`${speed} × ${hours}`;}
 if(p.op==='面積'){const r=a.match(/半径(\d+)cm/)?.[1];if(r)text=`${r} × ${r} × 3.14`;}
 if(p.op==='grade4_area'){
  let m=p.text.match(/^縦(\d+)cm、横(\d+)cmの長方形の面積は何cm²ですか。$/);
  if(m)text=`${m[1]} × ${m[2]}`;
  m=p.text.match(/^1辺が(\d+)cmの正方形の面積は何cm²ですか。$/);
  if(m)text=`${m[1]} × ${m[1]}`;
  m=p.text.match(/^縦(\d+)cm、横(\d+)cmの長方形と、1辺(\d+)cmの正方形があります。面積の差は何cm²ですか。$/);
  if(m)text=`${m[1]} × ${m[2]} - ${m[3]} × ${m[3]}`;
 }
 if(p.op==='grade4_angle'){
  let m=p.text.match(/^直角は90°です。2つに分けた一方が(\d+)°です。もう一方は何度ですか。$/);
  if(m)text=`90 - ${m[1]}`;
  m=p.text.match(/^一直線上の隣り合う2つの角は合わせて180°です。一方が(\d+)°なら、もう一方は何度ですか。$/);
  if(m)text=`180 - ${m[1]}`;
  m=p.text.match(/^1回転を3つの角に分けました。2つが(\d+)°と(\d+)°なら、残りは何度ですか。$/);
  if(m)text=`360 - ${m[1]} - ${m[2]}`;
 }
 if(p.op==='yの値'){const k=a.match(/y=(\d+)x/)?.[1],x=b.match(/x=(\d+)/)?.[1];if(k&&x)text=`${k} × ${x}`;}
 if(p.op==='並び方'){const n=Number(a.match(/^(\d+)人$/)?.[1]);if(n>0&&n<=10)text=Array.from({length:n},(_,i)=>n-i).join(' × ');}
 return {...p,text,originalExpression:p.text,isWordProblem:false};
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ancientChallengeSheetHtml({calculations,stories,readings,writings,name,printId,mathLabel,kanjiLabel,rewardsHtml}){
 const calc=calculations.map((p,i)=>`<div class="ac-calc-row"><b>${i+1}.</b><span>${esc(p.text)} =</span><span class="ac-blank">${p.remainder!=null?'商　　　　 あまり　　　　':''}</span></div>`).join('');
 const story=stories.map((p,i)=>`<section class="ac-story"><p><b>${i+11}.</b> ${esc(p.text)}</p><div class="ac-work">式</div><div class="ac-answer">答え <span class="ac-blank"></span></div></section>`).join('');
 const kanji=(list,mode,start)=>list.map((p,i)=>{const c=p.printContext||{},prompt=mode==='yomi'?p.text:p.answer;const answer=mode==='yomi'?'<span class="ac-reading-line"></span>':`<span class="ac-writing-boxes">${[...p.text].map(c=>/[\p{Script=Han}]/u.test(c)?'<i></i>':`<span>${esc(c)}</span>`).join('')}</span>`;return `<section class="ac-kanji-question ac-${mode}"><p><b>${i+start}.</b> ${esc(c.before)}<u>${esc(prompt)}</u>${esc(c.after)}</p><div class="ac-kanji-answer">${answer}</div></section>`;}).join('');
 const header=(side,subject,label,count)=>`<header class="ac-header"><h1>古代からの挑戦状【${side}】 ${subject}</h1><p class="ac-meta">なまえ：${esc(name)}　　番号：${esc(printId)} ／ ${count}問（全33問）</p><p class="ac-source">${esc(label)}</p></header>`;
 return `<style>
 @page{size:A4 portrait;margin:10mm}html,body{margin:0!important;padding:0!important;color:#111;background:white}*{box-sizing:border-box}
 .ac-sheet{width:190mm;height:277mm;font:10pt/1.45 "Yu Mincho","Hiragino Mincho ProN",serif;display:flex;flex-direction:column;overflow:hidden}.ac-front{break-after:page;page-break-after:always}.ac-sheet h1{font-size:16pt;margin:0 0 2mm}.ac-sheet h2{font-size:11pt;margin:3mm 0 2mm;border-bottom:1px solid #555;padding-bottom:1mm}.ac-header{flex:none;border-bottom:1px solid #333;padding-bottom:2mm}.ac-meta,.ac-source{font-size:9pt;margin:1mm 0}.ac-source{font-size:8pt}.ac-calculations{display:grid;grid-template-columns:1fr 1fr;gap:2mm 6mm;flex:none}.ac-calc-row{display:flex;gap:2mm;align-items:baseline;min-height:10mm;font-size:12pt}.ac-blank{display:inline-block;flex:1;min-width:18mm;min-height:7mm;border-bottom:1px solid #444}.ac-calc-row .ac-blank{font-size:8pt}
 .ac-stories{display:grid;grid-template-rows:repeat(3,minmax(0,1fr));flex:1;min-height:0;gap:2mm}.ac-story{display:flex;flex-direction:column;border-bottom:1px dotted #888;min-height:0;padding:1mm 0}.ac-story p{margin:0;font-size:10pt;line-height:1.5}.ac-work{flex:1;min-height:7mm;margin-top:2mm;font-size:9pt}.ac-answer{display:flex;gap:2mm;align-items:end;font-size:10pt;padding-bottom:1mm}
 .ac-kanji-grid{display:grid;grid-template-columns:1fr 1fr;gap:6mm;flex:1;min-height:0;padding-top:2mm}.ac-kanji-column{display:flex;flex-direction:column;min-height:0}.ac-kanji-column h2{margin:0 0 2mm}.ac-kanji-list{display:grid;grid-template-rows:repeat(10,minmax(0,1fr));flex:1;min-height:0}.ac-kanji-question{border-bottom:1px dotted #999;padding:1mm 0;min-height:0}.ac-kanji-question p{font-size:10pt;line-height:1.45;margin:0;overflow-wrap:anywhere}.ac-kanji-question u{text-underline-offset:1mm;font-weight:bold}.ac-kanji-answer{margin-top:1mm;min-height:8mm;padding-left:4mm}.ac-reading-line{display:block;height:7mm;border-bottom:1px solid #444;width:90%}.ac-writing-boxes{display:flex;align-items:center;gap:1mm;flex-wrap:wrap}.ac-writing-boxes i{display:inline-block;width:8mm;height:8mm;border:1px solid #444}.ac-footer{font:8pt/1.3 sans-serif;text-align:right;flex:none;margin-top:2mm}
 </style><article class="ac-sheet ac-front">${header('表','算数',mathLabel,13)}${rewardsHtml}<h2>計算問題（1〜10）</h2><div class="ac-calculations">${calc}</div><h2>文章問題（11〜13）</h2><div class="ac-stories">${story}</div><footer class="ac-footer">裏の国語20問と合わせて全33問。古代装備は27問以上正解で獲得。</footer></article><article class="ac-sheet ac-back">${header('裏','国語',kanjiLabel,20)}<div class="ac-kanji-grid"><section class="ac-kanji-column"><h2>漢字の読み（14〜23）</h2><div class="ac-kanji-list">${kanji(readings,'yomi',14)}</div></section><section class="ac-kanji-column"><h2>漢字の書き（24〜33）</h2><div class="ac-kanji-list">${kanji(writings,'kaki',24)}</div></section></div><footer class="ac-footer">番号：${esc(printId)} ／ 国語20問</footer></article>`;
}
