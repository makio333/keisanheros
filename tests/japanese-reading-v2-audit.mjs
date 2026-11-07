// Only original, non-personal bank data is written to this bank's audit directory.
import fs from 'node:fs/promises';
import {JAPANESE_READING_QUESTS_V2 as bank} from '../japanese_reading_quests_v2.js';
const dir=new URL('../docs/japanese-reading-v2/',import.meta.url);
const notes=[
'拾得→持ち主確認→返却→帰路の音。発見者と所有者を区別。','こりすの後→橋前停止→一人ずつ。揺れが禁止の理由。','色と用途を対応。隠す白袋と選べる青袋。','失敗→板変更→再試行。レンの考えが変化。','穴→種→土→水→札。最初と直後を区別。','蓄光→使用→消光。布袋は充光の妨げ。','店員→ノノ→次客へ椅子。発話者と行為者を区別。','緑は可、赤は不可。掃除終了→旗交換。','絵は行先、矢印は向き。二情報を併用。','先に隣人、後に父。父の識別根拠は歌。',
'上着→紙袋案否定→箱→乾燥→翌日の買物。','名前→帳面→受取→翌日返却。右棚と左かごを区別。','羽は回転、布は方向。強風時停止は破損防止。','急ぐ理由→穴発見→変化→帰路の協働。','晴雨で会場と順序が変化。袋は持帰り用。','火禁止に加え充光確認。光る石も無期限ではない。','色の推測→印→帳面→係確認→札と配達。','水桶は洗浄用。空かつ井戸閉鎖なら札。','二回の往復は聞く準備。短文分割は伝達の工夫。','採取→他者の困難→配分→残す考え。',
'細板試験→太板運搬と柱点検→試し渡り→薬。並行作業を区別。','場所別の音、無風の限界。石と待機を補助に。','西門→温室→屋外→休憩所。葉に触れる条件を区別。','疑い→水跡→注水→修理→謝罪。結果だけで原因断定しない。','線と余白、事実と推測、日付の役割。','火曜朝白・夕方青。工事完了と使用可は別。','不満→案内→感謝→札の手入れ。描写で変化。','同容器同時間→三回→当たる物比較。音と量を区別。','品別管理→留守時持帰り→三角の記録。','不安→地図の日付→修理札と川→沈黙の再解釈。',
'使い方への断定→台調整→説明見直し。性能不良とはしない。','粘土比較→水の層→幅の二条件→手入れ。','集合→説明→観察。時刻方角は再探索用。中止は掲示。','沖の船と岸の作業を対比。合図は泊所が空いてから。','名前と作業印を区別。色形併用と人の確認。','訂正は元記録を保持。多数決で事実にしない。','余布→場所確保→保持→開幕中修理。役と目的の関係。','初期の汚れた雨を別経路へ。飲用可ではない。井戸併用。','申込→実物確認→参加票→説明→希望。余りは持帰り。','不安→砂の音→落石→共同判断→声掛け。',
'倉庫賛成→視認条件→点検必要→調査保留。保留は反対確定でない。','水位と流量、雨と掃除を区別。局所改善と総量は別。','三条件＋翌朝期限。Ａ湿度不可、Ｂ遮光不可、Ｃは点検後。','線の意味未共有→修理記録→現場→説明追加。','日計人数と時点混雑を区別。相席改善は全面解決でない。','実演＋三時期限でＢのみ候補。空き照会と予約は別。','聞き逃し→範囲試験→時刻併用→失敗共有。注意放棄でない。','別名と共通名を対応。名称と具体的性質を補う。','雨侵入は事実、屋根交換は方法。雨よけ原因は未確定。','休みの誤解→応答の由来→短い紹介→共有。',
'待機と裏通路作業、曜日需要を統合。条件付き試行。','回数・人数・好みを区別。工事、市場、聞取対象の偏り。','旧施設表＋新調査。階段撤去でなく別通路増設。未手配を残す。','署名と内容の価値を分離。匿名の無条件採用でない。','地域と一件の定義変更。比較限界と新記録の利点。','修理年と建設年を区別。楽しさ・村初は未確認。','塔の外観変更→別目印→相手別説明。地図否定でない。','森林育成の共通目的→場所別条件→検証。単純中間は不十分。','曜日・品・支払確認・箱を比較。品名だけで火使用を決めない。','削除→理由と次準備を復元→未知の地図。読者の判断可能性。'];
if(notes.length!==bank.length)throw Error('Missing editorial notes');
const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
const headers=['id','grade','title','genre','topic','characters','paragraphs','choice','extraction','human_review','references','ruby_spans','han_occurrences','max_evidence_pieces','editorial_chronology_and_reason','review_limit'];
const rows=bank.map((q,i)=>[q.id,q.grade,q.title,q.genre,q.topic,q.characterCount,q.segments.length,3,1,1,q.references.length,q.ruby.overrides.length,(q.passage.match(/\p{Script=Han}/gu)||[]).length,q.difficulty.evidencePieces,notes[i],q.grade===1?'著者点検。独立二重読解・実地校正は未実施':'著者点検。部分ルビ。全配当漢字認定・独立二重読解・実地校正は未実施']);
await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL('audit-passages.csv',dir),[headers,...rows].map(r=>r.map(quote).join(',')).join('\n')+'\n');
const summary={date:'2026-11-01',passages:60,questions:300,automatic:240,humanReview:60,grades:[1,2,3,4,5,6].map(grade=>{const group=bank.filter(q=>q.grade===grade),lengths=group.map(q=>q.characterCount).sort((a,b)=>a-b);return {grade,passages:group.length,questions:group.flatMap(q=>q.questions).length,characters:{min:lengths[0],max:lengths.at(-1),median:(lengths[4]+lengths[5])/2},genres:Object.fromEntries(['物語','説明文','実用文'].map(g=>[g,group.filter(q=>q.genre===g).length]))};}),counting:'Unicode codepoints; punctuation included; whitespace excluded; passage only',nationalStandard:false,limits:['著者による全件読解点検と機械検査。独立二重読解・児童による実地難度校正は未実施','2〜6年は部分ルビ。配当漢字の完全認定なし','自由記述は人手評価で自動正誤を返さない']};
await fs.writeFile(new URL('audit-summary.json',dir),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
// Han runs are an exhaustive script inventory, NOT dictionary segmentation or a
// claim about which vocabulary an individual child has already acquired.
const scriptRows=[['quest_id','grade','field','han_run','start_codepoint','end_codepoint','ruby_covered_in_passage','support_policy']];
for(const quest of bank){
 const fields=[['passage',quest.passage],...quest.questions.flatMap(q=>[[q.id+':prompt',q.prompt],...(q.input.options||[]).map(o=>[o.id,o.text])])];
 for(const [field,text]of fields)for(const match of text.matchAll(/\p{Script=Han}+/gu)){
  const start=[...text.slice(0,match.index)].length,end=start+[...match[0]].length;
  const covered=field==='passage'&&quest.ruby.overrides.some(r=>r.start<=start&&r.end>=end);
  scriptRows.push([quest.id,quest.grade,field,match[0],start,end,covered?'yes':'no','読み上げ・辞書可。既習語の認定ではない']);
 }
}
await fs.writeFile(new URL('audit-script-inventory.csv',dir),scriptRows.map(r=>r.map(quote).join(',')).join('\n')+'\n');
console.log(`Han-run inventory: ${scriptRows.length-1} occurrences in passages, prompts and options`);
