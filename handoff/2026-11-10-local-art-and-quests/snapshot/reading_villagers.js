// Stable presentation mapping: original problem IDs, passages and answers stay intact.
const npc=(id,name,role,image)=>({id,name,role,image:`画像/NPC/${image}.png`});
export const READING_VILLAGERS=[
 npc('fumi','としょがかり フミ','図書係','npc_librarian_fumi'),
 npc('reto','ゆうびんや レト','郵便屋','npc_postman_reto'),
 npc('mina','みはりの ミナ','見張り','npc_watch_mina'),
 npc('nono','むらのこ ノノ','村の子','npc_child_nono'),
 npc('tom','むらびとトム','農家','npc_farmer_tom_transparent_v2'),
 npc('sara','パンやのサラ','パン屋','npc_baker_sara_transparent_v2'),
 npc('gondo','ろうけんじゃ ゴンド','賢者','npc_wiseman_gondo_transparent_v2'),
 npc('lina','しょうにんリナ','商人','npc_merchant_lina_transparent_v2'),
 npc('ken','かじやのケン','鍛冶屋','npc_blacksmith_ken_transparent_v2'),
 npc('dan','つりびとダン','釣り人','npc_fisherman_dan_transparent_v2'),
];
const groups={
 fumi:['古文書係','旅の学者','魔物学者','調査官','探偵','調査隊長'],
 reto:['郵便屋','運び屋','案内人','旅人','探検家'],
 mina:['みはり','見張り','門番','きし','作戦係'],
 nono:['子ども','村の子','うさぎ','ようせい','妖精'],
 sara:['パンや','料理人'],gondo:['まほうつかい','魔法使い','師匠','村の長','薬屋','錬金術師'],
 lina:['どうぐや','道具屋'],ken:['大工','かぎ職人'],dan:['ふねのひと','船頭'],tom:['むらびと','畑の番人','鳥の世話係'],
};
export function readingVillager(q){
 const key=Object.keys(groups).find(key=>groups[key].includes(q.npc))||'fumi';
 return READING_VILLAGERS.find(n=>n.id===key);
}
export function readingConversation(q){
 const villager=readingVillager(q),low=q.grade===1;
 // NPC describes an in-world document, never claims to be the character inside it.
 const intros={
 fumi:low?'この おはなしを いっしょに よんでくれる？ たしかめたい ことが あるんだ。':'村の図書室に届いた記録なんだ。一緒に読んで、内容を確かめてくれる？',
 reto:low?'こんな おてがみが とどいたよ。いっしょに よんでくれる？':'配達中にこんな手紙を受け取ったんだ。一緒に読んで、内容を確かめてくれる？',
 mina:low?'みまわりの メモを よんで、いっしょに たしかめてくれる？':'見回り中に集めた記録なんだ。見落としがないか、一緒に確かめてほしいな。',
 nono:low?'きになる おはなしを みつけたよ。いっしょに よんでみよう！':'気になるお話を見つけたんだ。うまく読み取れなくて、一緒に考えてくれる？',
 tom:low?'むらに とどいた メモだよ。いっしょに よんで、てつだってくれる？':'村に届いたメモだよ。仕事を始める前に、一緒に内容を確かめてくれる？',
 sara:low?'おみせに とどいた おはなしだよ。いっしょに よんでくれる？':'お店に届いたお話だよ。気になるところがあるから、一緒に読んでくれる？',
 gondo:low?'この おはなしを よんで、いっしょに かんがえてみよう。':'この記録を一緒に読んでみよう。言葉を手がかりに考えれば、分かることがあるはずじゃ。',
 lina:low?'おみせに とどいた メモだよ。なにが かいてあるか、たしかめよう。':'お店にこんな記録が届いたの。内容を確かめるのを手伝ってくれる？',
 ken:low?'しごとの あいまに、この メモを みつけたんだ。いっしょに よもう。':'作業場に届いた記録なんだ。読み違いがないか、一緒に確かめてくれる？',
 dan:low?'たびの おはなしを きろくしたよ。いっしょに よんでくれる？':'旅先の出来事を書いた記録だよ。一緒に読んで、内容を確かめてくれる？',
 };
 const question=q.dialogueSpeaker==='self'?`（こころのこえ）${q.question}`:`${villager.name}「${q.question}」`;
 return {villager,intro:intros[villager.id],question,thanks:low?`ありがとう！ 「${q.answer}」だね。いっしょに よんでくれて、たすかったよ！`:`ありがとう！ 「${q.answer}」と読み取れるね。一緒に確かめてくれて助かったよ。`,documentLabel:low?'いっしょに よむ おはなし':'村人と一緒に読む記録'};
}
