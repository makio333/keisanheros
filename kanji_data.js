// ==========================================
// 漢字データ＆出題ロジック (kanji_data.js)
// 学年別漢字配当表（教育漢字）に そって、1年〜6年の 漢字を 収録。
// 1つの 学年を 5つの ステージに わけている（ステージごとに ちがう 漢字が でる）。
// ボスは その学年 ぜんぶから 出題される。
//   tier の なまえ: 'kanji_g3_2' → 3年の ステージ2 ／ 'kanji_g3' → 3年 ぜんぶ
// ==========================================


/* ================= ひらがな（長音・促音・拗音・特殊） ================= */
const KANA_HIRA_S1 = [
  { answer: 'おかあさん', text: 'おかあさん', wrongAnswer: 'おかさん', explanation: '「かあ」と のばして、「あ」を かくよ。' },
  { answer: 'おにいさん', text: 'おにいさん', wrongAnswer: 'おにさん', explanation: '「にい」と のばして、「い」を かくよ。' },
  { answer: 'おねえさん', text: 'おねえさん', wrongAnswer: 'おねさん', explanation: '「ねえ」と のばして、「え」を かくよ。' },
  { answer: 'こおり', text: 'こおり', wrongAnswer: 'こうり', explanation: '「こおり」は「お」で のばすよ。' },
  { answer: 'ふうせん', text: 'ふうせん', wrongAnswer: 'ふせん', prompt: 'ふくらませて あそぶものは、どっち？', explanation: '「ふう」と のばして、「う」を かくよ。' },
  { answer: 'ほうき', text: 'ほうき', wrongAnswer: 'ほおき', explanation: '「ほうき」は「う」で のばすよ。' },
];
const KANA_HIRA_S2 = [
  { answer: 'がっき', text: 'がっき', special: 'っ' },
  { answer: 'きっぷ', text: 'きっぷ', special: 'っ' },
  { answer: 'しっぽ', text: 'しっぽ', special: 'っ' },
  { answer: 'らっぱ', text: 'らっぱ', special: 'っ' },
  { answer: 'はっぱ', text: 'はっぱ', special: 'っ' },
  { answer: 'ほっぺ', text: 'ほっぺ', special: 'っ' },
  { answer: 'あさって', text: 'あさって', special: 'っ' },
  { answer: 'けっこん', text: 'けっこん', special: 'っ' },
  { answer: 'ねっこ', text: 'ねっこ', special: 'っ' },
  { answer: 'にっき', text: 'にっき', special: 'っ' },
  { answer: 'さっき', text: 'さっき', special: 'っ' },
  { answer: 'ずっと', text: 'ずっと', special: 'っ' },
  { answer: 'どっち', text: 'どっち', special: 'っ' },
  { answer: 'こっち', text: 'こっち', special: 'っ' },
  { answer: 'やっと', text: 'やっと', special: 'っ' },
  { answer: 'ばった', text: 'ばった', special: 'っ' },
  { answer: 'まっちゃ', text: 'まっちゃ', special: 'っ' },
  { answer: 'よっか', text: 'よっか', special: 'っ' },
  { answer: 'みっか', text: 'みっか', special: 'っ' },
  { answer: 'ざっし', text: 'ざっし', special: 'っ' },
];
const KANA_HIRA_S3 = [
  { answer: 'きゅうり', text: 'きゅうり', wrongAnswer: 'きゆうり', explanation: '「きゅ」は 小さい「ゅ」を つかうよ。' },
  { answer: 'にんじゃ', text: 'にんじゃ', wrongAnswer: 'にんじや', explanation: '「じゃ」は 小さい「ゃ」を つかうよ。' },
  { answer: 'きゃく', text: 'きゃく', wrongAnswer: 'きやく', prompt: 'おみせに くる ひとは、どっち？', explanation: 'おきゃくさんの「きゃ」は 小さい「ゃ」だよ。' },
  { answer: 'きんぎょ', text: 'きんぎょ', wrongAnswer: 'きんぎよ', explanation: '「ぎょ」は 小さい「ょ」を つかうよ。' },
  { answer: 'ちゅうしゃ', text: 'ちゅうしゃ', wrongAnswer: 'ちゆうしや', explanation: '「ゅ」と「ゃ」は どちらも 小さく かくよ。' },
  { answer: 'でんしゃ', text: 'でんしゃ', wrongAnswer: 'でんしや', explanation: '「しゃ」は 小さい「ゃ」を つかうよ。' },
];
const KANA_HIRA_S4 = [
  { answer: 'がっこう', text: 'がっこう', wrongAnswer: 'がつこう', explanation: '小さい「っ」と、のばす「う」を つかうよ。' },
  { answer: 'がっきゅう', text: 'がっきゅう', wrongAnswer: 'がっきゆう', explanation: '「っ」と「ゅ」は 小さく、「う」で のばすよ。' },
  { answer: 'きゅうしょく', text: 'きゅうしょく', wrongAnswer: 'きゆうしよく', explanation: '「ゅ」と「ょ」は 小さく、「う」で のばすよ。' },
  { answer: 'ちゅうがっこう', text: 'ちゅうがっこう', wrongAnswer: 'ちゆうがつこう', explanation: '「ゅ」と「っ」は 小さく、のばす音には「う」を かくよ。' },
  { answer: 'びょういん', text: 'びょういん', wrongAnswer: 'びよういん', prompt: 'おいしゃさんが いるのは、どっち？', explanation: 'びょういんの「ょ」は 小さく、「う」で のばすよ。' },
  { answer: 'しょうぼうしゃ', text: 'しょうぼうしゃ', wrongAnswer: 'しようぼうしや', explanation: '「ょ」と「ゃ」は 小さく、のばす音には「う」を かくよ。' },
];
const KANA_HIRA_S5 = [
  { answer: 'こんにちは', text: 'こんにちは', wrongAnswer: 'こんにちわ', explanation: 'あいさつの「こんにちは」は、さいごに「は」を かくよ。' },
  { answer: 'こんばんは', text: 'こんばんは', wrongAnswer: 'こんばんわ', explanation: 'あいさつの「こんばんは」は、さいごに「は」を かくよ。' },
  { answer: 'わたしは いちねんせい', text: 'わたしは いちねんせい', wrongAnswer: 'わたしわ いちねんせい', explanation: '「わたしは」の「は」は「わ」と よむよ。' },
  { answer: 'がっこうへ いく', text: 'がっこうへ いく', wrongAnswer: 'がっこうえ いく', explanation: 'いく ばしょを あらわす「へ」は「え」と よむよ。' },
  { answer: 'ほんを よむ', text: 'ほんを よむ', wrongAnswer: 'ほんお よむ', explanation: 'なにを するかを つなぐときは「を」を かくよ。' },
  { answer: 'みずを のむ', text: 'みずを のむ', wrongAnswer: 'みずお のむ', explanation: 'のむ ものを つなぐときは「を」を かくよ。' },
];

/* ================= カタカナ（長音・促音・拗音・外来音） ================= */
const KANA_KATA_S1 = [
  { answer: 'ケーキ', text: 'ケーキ', wrongAnswer: 'ケキ', explanation: 'カタカナで のばす音は「ー」を つかうよ。' },
  { answer: 'ジュース', text: 'ジュース', wrongAnswer: 'ジュス', explanation: '「ジュ」の あとに「ー」を かいて のばすよ。' },
  { answer: 'ノート', text: 'ノート', wrongAnswer: 'ノト', explanation: '「ノ」の あとに「ー」を かいて のばすよ。' },
  { answer: 'ゲーム', text: 'ゲーム', wrongAnswer: 'ゲム', explanation: '「ゲ」の あとに「ー」を かいて のばすよ。' },
  { answer: 'スポーツ', text: 'スポーツ', wrongAnswer: 'スポツ', explanation: '「ポ」の あとに「ー」を かいて のばすよ。' },
  { answer: 'プール', text: 'プール', wrongAnswer: 'プル', explanation: '「プ」の あとに「ー」を かいて のばすよ。' },
];
const KANA_KATA_S2 = [
  { answer: 'コップ', text: 'コップ', special: 'ッ' }, { answer: 'ベッド', text: 'ベッド', special: 'ッ' },
  { answer: 'ヨット', text: 'ヨット', special: 'ッ' }, { answer: 'ロボット', text: 'ロボット', special: 'ッ' },
  { answer: 'ペット', text: 'ペット', special: 'ッ' }, { answer: 'チケット', text: 'チケット', special: 'ッ' },
];
const KANA_KATA_S3 = [
  { answer: 'シャツ', text: 'シャツ', wrongAnswer: 'シヤツ', explanation: '「シャ」は 小さい「ャ」を つかうよ。' },
  { answer: 'チョコ', text: 'チョコ', wrongAnswer: 'チヨコ', explanation: '「チョ」は 小さい「ョ」を つかうよ。' },
  { answer: 'ジャム', text: 'ジャム', wrongAnswer: 'ジヤム', explanation: '「ジャ」は 小さい「ャ」を つかうよ。' },
  { answer: 'キャベツ', text: 'キャベツ', wrongAnswer: 'キヤベツ', explanation: '「キャ」は 小さい「ャ」を つかうよ。' },
  { answer: 'シュート', text: 'シュート', wrongAnswer: 'シユート', explanation: '「シュ」は 小さい「ュ」を つかうよ。' },
  { answer: 'リュック', text: 'リュック', wrongAnswer: 'リユック', explanation: '「リュ」は 小さい「ュ」を つかうよ。' },
];
const KANA_KATA_S4 = [
  { answer: 'コンピューター', text: 'コンピューター', wrongAnswer: 'コンピユータ', explanation: '小さい「ュ」と、のばす「ー」を つかうよ。' },
  { answer: 'チョコレート', text: 'チョコレート', wrongAnswer: 'チヨコレート', explanation: '「チョ」の「ョ」は 小さく、「レ」の あとは「ー」だよ。' },
  { answer: 'ハンバーグ', text: 'ハンバーグ', wrongAnswer: 'ハンバグ', explanation: '「バ」の あとに「ー」を かいて のばすよ。' },
  { answer: 'サンドイッチ', text: 'サンドイッチ', wrongAnswer: 'サンドイツチ', explanation: '「ッチ」の「ッ」は 小さく かくよ。' },
  { answer: 'サッカー', text: 'サッカー', wrongAnswer: 'サツカ', explanation: '小さい「ッ」と、のばす「ー」を つかうよ。' },
  { answer: 'カレンダー', text: 'カレンダー', wrongAnswer: 'カレンダ', explanation: '「ダ」の あとに「ー」を かいて のばすよ。' },
];
const KANA_KATA_S5 = [
  { answer: 'パーティー', text: 'パーティー', wrongAnswer: 'パーテイー', explanation: '「ティ」は 小さい「ィ」を つかうよ。' },
  { answer: 'ファイト', text: 'ファイト', wrongAnswer: 'フアイト', explanation: '「ファ」は 小さい「ァ」を つかうよ。' },
  { answer: 'ウェディング', text: 'ウェディング', wrongAnswer: 'ウエデイング', explanation: '「ウェ」「ディ」の「ェ」「ィ」は 小さく かくよ。' },
  { answer: 'ウォーター', text: 'ウォーター', wrongAnswer: 'ウオーター', explanation: '「ウォ」は 小さい「ォ」を つかうよ。' },
  { answer: 'チェック', text: 'チェック', wrongAnswer: 'チエック', explanation: '「チェ」は 小さい「ェ」を つかうよ。' },
  { answer: 'シェフ', text: 'シェフ', wrongAnswer: 'シエフ', explanation: '「シェ」は 小さい「ェ」を つかうよ。' },
];

/* 短い言葉は2択、応用は意味を手がかりに4択で表記を学ぶ。 */
function kanaSpellingRow(word, clue, choiceCount, type, longIndex) {
  const small = word.includes('っ') ? 'っ' : 'ッ';
  const index = type === 'sokuon' ? word.indexOf(small) : longIndex ?? word.indexOf('ー');
  const remove = word.slice(0,index) + word.slice(index+1);
  let wrongAnswers;
  if (type === 'sokuon') {
    wrongAnswers = [word.replaceAll(small,small === 'っ' ? 'つ' : 'ツ'),remove,remove + small];
  } else {
    const char = word[index];
    const alternative = {'あ':'お','い':'え','う':'お','え':'い','お':'う','ー':'ア'}[char];
    wrongAnswers = [remove,word.slice(0,index) + alternative + word.slice(index+1),word.slice(0,index) + char + word.slice(index)];
  }
  return {answer:word,text:word,choiceCount,wrongAnswer:wrongAnswers[0],wrongAnswers,
    prompt:`${clue}。ただしい かきかたを えらぼう。`,
    explanation:type === 'sokuon' ? `音をつまらせるところには、小さい「${small}」を書くよ。` : `のばす音には「${word[index]}」を書くよ。`};
}
const HIRA_EASY_SOKUON_CLUES = {がっき:'音楽で使うもの',きっぷ:'電車に乗るための券',しっぽ:'動物の体の後ろにあるもの',らっぱ:'息をふいて鳴らす楽器',はっぱ:'木のえだについているもの',ほっぺ:'顔の両側のやわらかいところ',ねっこ:'植物が土の中にのばすもの',にっき:'その日のことを書くもの',さっき:'少し前のこと',ずっと:'長いあいだ続くこと',どっち:'二つのうち、どちらかをたずねる言葉',こっち:'こちらを指す言葉',やっと:'長く待って、ようやくできたときの言葉',ばった:'大きな後ろ足でとぶ虫',よっか:'四日と書く日',みっか:'三日と書く日',ざっし:'いろいろな記事がのった本',きって:'手紙の封筒にはるもの'};
KANA_HIRA_S2.splice(0,KANA_HIRA_S2.length,...Object.entries(HIRA_EASY_SOKUON_CLUES).map(([word,clue])=>kanaSpellingRow(word,clue,2,'sokuon')));
KANA_KATA_S2.splice(0,KANA_KATA_S2.length,...[
  ['コップ','水を飲むための入れ物'],['ベッド','ねるための家具'],['ヨット','風で進む船'],['ペット','家でかわいがう動物'],['バット','野球でボールを打つ道具'],['ハット','ふちのある帽子'],['カップ','飲み物を入れる器'],['ネット','あみ'],['キック','足でけること'],['バック','後ろへ進むこと'],['マッチ','火をつける細い棒'],['ロック','鍵をかけること'],['タッチ','軽くふれること'],['ナッツ','食べられる木の実'],['ラッコ','海にすむ、おなかで貝を割る動物'],['ニット','毛糸で編んだ服']
].map(([word,clue])=>kanaSpellingRow(word,clue,2,'sokuon')));
KANA_HIRA_S1.splice(0,KANA_HIRA_S1.length,...[
  ['こおり',1,'水が冷えて固まったもの'],['とおい',1,'近いの反対'],['おおい',1,'少ないの反対'],['ほうき',1,'床をはく道具'],['とうふ',1,'大豆から作る白い食べ物'],['すうじ',1,'一、二、三などを表す文字'],['くうき',1,'息をするときに吸うもの'],['けいと',1,'セーターを編む糸'],['こうま',1,'馬の赤ちゃん'],['こおる',1,'水が冷えて固くなること']
].map(([word,index,clue])=>kanaSpellingRow(word,clue,2,'tone',index)));
KANA_KATA_S1.splice(0,KANA_KATA_S1.length,...[
  ['ケーキ','誕生日に食べることもある甘いお菓子'],['ノート','文字を書きとめる冊子'],['ゲーム','ルールにしたがって遊ぶもの'],['プール','泳ぐための場所'],['コート','寒いときに服の上に着るもの'],['ボート','水の上を進む小さな船'],['カード','小さな四角い紙や札'],['マーク','目印'],['チーム','一緒に競技をする仲間'],['リード','犬の散歩で使うひも'],['ソース','料理にかける調味料'],['スープ','温かい汁の料理'],['ルール','守る決まり'],['メール','コンピューターなどで送る手紙'],['シール','裏にのりがついた小さな紙'],['ソーダ','あわの出る飲み物']
].map(([word,clue])=>kanaSpellingRow(word,clue,2,'tone')));
const KANA_HIRA_SOKUON_ADV = [
  ['けっこん','二人が家族になること'],['まっちゃ','お茶の葉を細かい粉にしたもの'],
  ['がっこう','勉強をしに通う場所'],['がっきゅう','学校のクラス'],['しょうがっこう','六年間通う学校'],['ちゅうがっこう','小学校の次に通う学校'],['がっこうせいかつ','学校で過ごす毎日の暮らし'],['はっぴょう','みんなの前で考えを伝えること'],['はっぴょうかい','練習したことをみんなに見せる会'],['しゅっぱつ','目的の場所へ向かって出ること'],['しゅっぱつじかん','乗り物などが出る時刻'],['しゅっせき','学校や集まりに出ること'],['しゅっせきばんごう','学校で一人ずつにつける番号'],['しゅっせきひょう','学校に来たかを記録する表'],['けっせき','学校を休むこと'],['けっせきとどけ','学校を休むことを知らせる紙'],['にっきちょう','毎日の出来事を書く帳面'],['えにっき','絵と文で書く日記'],['えにっきちょう','絵と文で毎日のことを書く帳面'],['おひっこし','住む家を変えること'],['ひっこしさき','新しく住む場所'],['おにごっこ','鬼がみんなを追いかける遊び'],['おいかけっこ','走って相手を追いかける遊び'],['かけっこ','走って速さを競うこと'],['にらめっこ','変な顔をして笑わせる遊び'],['ほっきょく','地球のいちばん北の場所'],['ほっきょくぐま','北の寒い地方にすむ白い熊'],['らっかせい','殻の中にピーナッツがある植物'],['びっくりばこ','ふたを開けると中から飛び出すおもちゃ'],['せっけん','手や体を洗うもの'],['せっけんあわ','手を洗うものからできる泡'],['まっしろ','とても白いこと'],['まっしろなくも','雪のように白い雲'],['まっくらやみ','光がなく、とても暗いこと'],['まっすぐなみち','曲がっていない道'],['まっかなたいよう','とても赤く見える太陽'],['にっこうよく','体に太陽の光をあてること'],['いっしょうけんめい','力いっぱい頑張ること'],['いっとうしょう','競争で一番になること'],['とっきゅう','駅を少なく止まって速く進む列車'],['とっきゅうでんしゃ','駅を少なく止まる電車'],['きっぷうりば','電車などの券を買う場所'],['あさって','明日の次の日'],['けっこんしき','二人が結婚したことを祝う式']
].map(([word,clue])=>kanaSpellingRow(word,clue,4,'sokuon'));
const KANA_KATA_SOKUON_ADV = [
  ['ロボット','人の代わりに仕事をする機械'],['チケット','会場などに入るための券'],['ポケット','服についている小さな入れ物'],['サンドイッチ','パンの間に具をはさんだ食べ物'],['ホットケーキ','フライパンで焼く甘い丸いお菓子'],['ホットドッグ','パンにソーセージをはさんだ食べ物'],['チョコチップ','お菓子に入れる小さなチョコ'],['ポテトチップス','薄いじゃがいもを揚げたお菓子'],['アップルパイ','りんごの入ったパイ'],['アップルジュース','りんごの果汁の飲み物'],['バスケットボール','高いかごにボールを入れる競技'],['サッカーボール','足でける競技に使うボール'],['キャッチボール','二人でボールを投げて受け取ること'],['ベッドルーム','ねるための部屋'],['ペットボトル','飲み物などを入れるプラスチックの容器'],['ジェットコースター','遊園地でレールの上を速く走る乗り物'],['ジェットスキー','水の上を走る小さな乗り物'],['ジャケット','上半身に着る上着'],['レインジャケット','雨の日に着る上着'],['スウェットシャツ','厚い布でできた運動用の上着'],['キッチン','料理をする場所'],['キッチンペーパー','料理などで使う使い捨ての紙'],['キッチンタイマー','料理の時間をはかる道具'],['リュックサック','背中に背負うかばん'],['ビスケット','小麦粉などで作る焼き菓子'],['チョコクッキー','チョコの入った焼き菓子'],['スリッパ','家の中で履く履物'],['トランペット','金色の管に息をふいて鳴らす楽器'],['ピクニック','外へ出かけてお弁当などを食べること'],['ピクニックバッグ','外でお弁当を食べるときのかばん'],['スケッチブック','絵を描くための帳面'],['スケッチセット','簡単な絵を描くための道具一式'],['パンフレット','案内などをまとめた小さな冊子'],['ヘッドホン','両耳にあてて音を聞く道具'],['ヘッドライト','乗り物の前を照らすライト'],['ホイッスル','スポーツなどで使う笛'],['ブロックセット','組み立てて遊ぶおもちゃ一式'],['ドッジボール','ボールを投げて相手にあてる競技'],['トラック','荷物を運ぶ大きな車'],['マスコット','応援などのためのキャラクター'],['カセットテープ','音を記録する昔の道具'],['ロケット','宇宙へ飛んでいく乗り物'],['ロケットエンジン','宇宙へ飛ぶ乗り物の動力']
].map(([word,clue])=>kanaSpellingRow(word,clue,4,'sokuon'));
const KANA_HIRA_TONE_ADV = [
  ['おかあさん',2,'家族の母を呼ぶ言葉'],['おとうさん',2,'家族の父を呼ぶ言葉'],['おにいさん',2,'年上の兄を呼ぶ言葉'],['おねえさん',2,'年上の姉を呼ぶ言葉'],['おじいさん',2,'祖父を呼ぶ言葉'],['おばあさん',2,'祖母を呼ぶ言葉'],['おおかみ',1,'犬に似た野生の動物'],['おおきなやま',1,'小さくない山'],['おおきなこえ',1,'よく聞こえる声'],['おおきなとけい',1,'小さくない時刻を見る道具'],['こおりみず',1,'水が固まったものを入れた冷たい水'],['とおいくに',1,'近くにはない国'],['とおりみち',1,'歩いたり乗り物で進んだりする道'],['こおりざとう',1,'透明なかたまりになった砂糖'],['ふうせん',1,'空気でふくらませる遊び道具'],['ふうせんあそび',1,'空気でふくらませたものを使う遊び'],['ふうりん',1,'風がふくと音を出す飾り'],['くうこう',1,'飛行機が出たり入ったりする場所'],['くうこういりぐち',1,'飛行機が出入りする施設へ入る場所'],['くうきいれ',1,'自転車のタイヤをふくらませる道具'],['すうがく',1,'数や図形を学ぶ勉強'],['すうじあそび',1,'一、二、三などを使う遊び'],['こうえん',1,'すべり台などがある遊び場'],['こうえんあそび',1,'すべり台などがある場所でする遊び'],['こうさてん',1,'二つ以上の道が交わる場所'],['こうつうあんぜん',1,'道を通るとき事故にあわないようにすること'],['こうつうしんごう',1,'赤・青・黄で進んでよいか知らせるもの'],['とうきょう',1,'日本の首都'],['とうきょうえき',1,'日本の首都にある大きな駅'],['とけい',2,'時刻を見る道具'],['めいろ',1,'出口までの道を探す遊び'],['せいかつ',1,'毎日の暮らし'],['けいさつかん',1,'町の安全を守る仕事の人'],['けいさつしょ',1,'町の安全を守る人たちが働く建物'],['きゅうきゅうしゃ',2,'急病の人などを病院へ運ぶ車'],['しょうぼうしゃ',2,'火を消すための車'],['ぎゅうにゅう',2,'牛の乳からできる飲み物'],['ぎゅうにゅうびん',2,'牛の乳の飲み物を入れるびん'],['さとうきび',2,'砂糖を作る材料になる植物'],['れいぞうこ',1,'食べ物を冷やして保存する道具'],['ゆうえんち',1,'たくさんの乗り物で遊べる場所'],['ゆうびんきょく',1,'手紙や荷物を届ける仕事をする場所']
].map(([word,index,clue])=>kanaSpellingRow(word,clue,4,'tone',index));
const KANA_KATA_TONE_ADV = [
  ['ジュース','果物などから作る飲み物'],['スポーツ','体を動かして楽しむ競技'],['アイスクリーム','冷たくて甘いお菓子'],['チョコレート','カカオなどから作る甘いお菓子'],['チーズケーキ','乳製品の入った甘いケーキ'],['バースデーケーキ','誕生日を祝うケーキ'],['ショートケーキ','生クリームなどを使ったケーキ'],['ハンバーガー','丸いパンに肉などをはさんだ食べ物'],['ハンバーグ','ひき肉を丸めて焼く料理'],['クリームシチュー','白くて温かい煮込み料理'],['コーンスープ','とうもろこしを使った汁の料理'],['コンピューター','情報を計算したり処理したりする機械'],['ゲームセンター','いろいろなゲーム機で遊べる店'],['スーパーマーケット','食べ物や日用品を売る大きな店'],['エレベーター','箱に乗って建物の階を移動するもの'],['エスカレーター','動く階段'],['カレンダー','日付を見るもの'],['カーテン','窓にかける布'],['キーボード','文字などを入力する鍵盤'],['モーターボート','エンジンで進む小さな船'],['ボールペン','先の小さな球でインクを出す筆記具'],['ビニールプール','空気でふくらませる水遊び用のもの'],['スケートボード','車輪のついた板に乗る遊び道具'],['ローラースケート','車輪のついた靴で滑る遊び'],['ロールケーキ','生地を巻いて作るケーキ'],['メロンソーダ','緑色であわの出る飲み物'],['ヨーグルト','牛乳を発酵させた食べ物'],['グレープジュース','ぶどうの果汁の飲み物'],['オレンジジュース','オレンジの果汁の飲み物'],['トースター','パンを焼く道具'],['ヘアドライヤー','髪を乾かす道具'],['ペーパータオル','手をふく使い捨ての紙'],['リコーダー','音楽の授業でふく笛'],['ハーモニカ','口にあてて息をふいて鳴らす楽器'],['オーケストラ','いろいろな楽器で演奏する大きな集団'],['マフラー','寒いとき首に巻くもの'],['シートベルト','乗り物で体を座席に固定する帯'],['キャンピングカー','中で泊まることもできる車']
].map(([word,clue])=>kanaSpellingRow(word,clue,4,'tone'));

/* ================= 1年（80字） ================= */
const KANJI_G1_S1 = [
  { answer: 'ひとつ', text: '一つ' }, { answer: 'ふたつ', text: '二つ' }, { answer: 'みっつ', text: '三つ', special: 'っ' },
  { answer: 'よっつ', text: '四つ', special: 'っ' }, { answer: 'いつつ', text: '五つ' }, { answer: 'むっつ', text: '六つ', special: 'っ' },
  { answer: 'ななつ', text: '七つ' }, { answer: 'やっつ', text: '八つ', special: 'っ' }, { answer: 'ここのつ', text: '九つ' },
  { answer: 'じゅう', text: '十', special: 'ゅ' }, { answer: 'ひゃく', text: '百', special: 'ゃ' }, { answer: 'せん', text: '千' },
  { answer: 'おおきい', text: '大きい' }, { answer: 'ちいさい', text: '小さい' },
  { answer: 'うえ', text: '上' }, { answer: 'した', text: '下' },
];
const KANJI_G1_S2 = [
  { answer: 'め', text: '目' }, { answer: 'みみ', text: '耳' }, { answer: 'くち', text: '口' },
  { answer: 'て', text: '手' }, { answer: 'あし', text: '足' }, { answer: 'ちから', text: '力' },
  { answer: 'ひと', text: '人' }, { answer: 'なまえ', text: '名まえ' }, { answer: 'おんな', text: '女' },
  { answer: 'おとこ', text: '男' }, { answer: 'こども', text: '子ども' }, { answer: 'おうさま', text: '王さま' },
  { answer: 'せんせい', text: '先生' }, { answer: 'いきる', text: '生きる' },
  { answer: 'たつ', text: '立つ' }, { answer: 'やすむ', text: '休む' },
];
const KANJI_G1_S3 = [
  { answer: 'やま', text: '山' }, { answer: 'かわ', text: '川' }, { answer: 'たんぼ', text: '田んぼ' },
  { answer: 'てんき', text: '天気' }, { answer: 'そら', text: '空' }, { answer: 'あめ', text: '雨' },
  { answer: 'きもち', text: '気もち' }, { answer: 'ひ', text: '日' }, { answer: 'つき', text: '月' },
  { answer: 'かじ', text: '火じ' }, { answer: 'みず', text: '水' }, { answer: 'き', text: '木' },
  { answer: 'おかね', text: 'お金' }, { answer: 'つち', text: '土' }, { answer: 'いし', text: '石' },
  { answer: 'はな', text: '花' },
];
const KANJI_G1_S4 = [
  { answer: 'まなぶ', text: '学ぶ' }, { answer: 'がっこう', text: '学校', special: 'っ' }, { answer: 'ぶん', text: '文' },
  { answer: 'じ', text: '字' }, { answer: 'ほん', text: '本' }, { answer: 'おと', text: '音' },
  { answer: 'みる', text: '見る' }, { answer: 'でる', text: '出る' }, { answer: 'はいる', text: '入る' },
  { answer: 'ただしい', text: '正しい' }, { answer: 'はやい', text: '早い' }, { answer: 'なか', text: '中' },
  { answer: 'まち', text: '町' }, { answer: 'むら', text: '村' }, { answer: 'くるま', text: '車' },
  { answer: 'ひだり', text: '左' },
];
const KANJI_G1_S5 = [
  { answer: 'みぎ', text: '右' }, { answer: 'えん', text: '円' }, { answer: 'かい', text: '貝' },
  { answer: 'たま', text: '玉' }, { answer: 'いぬ', text: '犬' }, { answer: 'いと', text: '糸' },
  { answer: 'もり', text: '森' }, { answer: 'あおい', text: '青い' }, { answer: 'ゆうがた', text: '夕がた' },
  { answer: 'あかい', text: '赤い' }, { answer: 'くさ', text: '草' }, { answer: 'たけ', text: '竹' },
  { answer: 'むし', text: '虫' }, { answer: 'しろい', text: '白い' }, { answer: 'とし', text: '年' },
  { answer: 'はやし', text: '林' },
];

/* ================= 2年（160字） ================= */
const KANJI_G2_S1 = [
  { answer: 'いま', text: '今' }, { answer: 'てんさい', text: '天才' }, { answer: 'ごぜん', text: '午前' },
  { answer: 'ごご', text: '午後' }, { answer: 'とき', text: '時' }, { answer: 'こんしゅう', text: '今週', special: 'ゅ' },
  { answer: 'はる', text: '春' }, { answer: 'なつ', text: '夏' }, { answer: 'あき', text: '秋' },
  { answer: 'ふゆ', text: '冬' }, { answer: 'あさ', text: '朝' }, { answer: 'ひる', text: '昼' },
  { answer: 'よる', text: '夜' }, { answer: 'ようび', text: '曜日' }, { answer: 'まいにち', text: '毎日' },
  { answer: 'まえ', text: '前' }, { answer: 'はんぶん', text: '半分' }, { answer: 'わける', text: '分ける' },
  { answer: 'あかるい', text: '明るい' }, { answer: 'はれ', text: '晴れ' }, { answer: 'ゆき', text: '雪' },
  { answer: 'くも', text: '雲' }, { answer: 'ほし', text: '星' }, { answer: 'ひかる', text: '光る' },
  { answer: 'げんき', text: '元気' }, { answer: 'ふるい', text: '古い' }, { answer: 'あたらしい', text: '新しい' },
  { answer: 'ながい', text: '長い' }, { answer: 'なおす', text: '直す' }, { answer: 'とおる', text: '通る' },
  { answer: 'くる', text: '来る' }, { answer: 'いちばん', text: '一番' },
];
const KANJI_G2_S2 = [
  { answer: 'かお', text: '顔' }, { answer: 'くび', text: '首' }, { answer: 'け', text: '毛' },
  { answer: 'こころ', text: '心' }, { answer: 'からだ', text: '体' }, { answer: 'あに', text: '兄' },
  { answer: 'おとうと', text: '弟', special: 'う' }, { answer: 'あね', text: '姉' }, { answer: 'いもうと', text: '妹', special: 'う' },
  { answer: 'ちち', text: '父' }, { answer: 'はは', text: '母' }, { answer: 'おや', text: '親' },
  { answer: 'ともだち', text: '友だち' }, { answer: 'じぶん', text: '自分' }, { answer: 'なに', text: '何' },
  { answer: 'いえ', text: '家' }, { answer: 'きょうしつ', text: '教室', special: 'ょ' }, { answer: 'と', text: '戸' },
  { answer: 'もん', text: '門' }, { answer: 'だい', text: '台' }, { answer: 'みせ', text: '店' },
  { answer: 'ひろば', text: '広場' }, { answer: 'かいしゃ', text: '会社', special: 'ゃ' }, { answer: 'とうきょう', text: '東京', special: 'ょ' },
  { answer: 'さと', text: '里' }, { answer: 'のはら', text: '野原' }, { answer: 'がくえん', text: '学園' },
  { answer: 'たに', text: '谷' }, { answer: 'いわ', text: '岩' }, { answer: 'はら', text: '原' },
  { answer: 'たかい', text: '高い' }, { answer: 'ひろい', text: '広い' },
];
const KANJI_G2_S3 = [
  { answer: 'うみ', text: '海' }, { answer: 'いけ', text: '池' }, { answer: 'とち', text: '土地' },
  { answer: 'かぜ', text: '風' }, { answer: 'こめ', text: '米' }, { answer: 'むぎ', text: '麦' },
  { answer: 'にく', text: '肉' }, { answer: 'うし', text: '牛' }, { answer: 'さかな', text: '魚' },
  { answer: 'とり', text: '鳥' }, { answer: 'うま', text: '馬' }, { answer: 'ゆみ', text: '弓' },
  { answer: 'かたな', text: '刀' }, { answer: 'ふね', text: '船' }, { answer: 'せん', text: '線' },
  { answer: 'まる', text: '丸' }, { answer: 'かど', text: '角' }, { answer: 'はね', text: '羽' },
  { answer: 'きいろ', text: '黄色' }, { answer: 'くろい', text: '黒い' }, { answer: 'いろ', text: '色' },
  { answer: 'ひがし', text: '東' }, { answer: 'にし', text: '西' }, { answer: 'みなみ', text: '南' },
  { answer: 'きた', text: '北' }, { answer: 'ゆうがた', text: '夕方' }, { answer: 'とおい', text: '遠い' },
  { answer: 'ちかい', text: '近い' }, { answer: 'うち', text: '内' }, { answer: 'そと', text: '外' },
  { answer: 'はしる', text: '走る' }, { answer: 'あるく', text: '歩く' },
];
const KANJI_G2_S4 = [
  { answer: 'ひく', text: '引く' }, { answer: 'きょうかしょ', text: '教科書', special: 'ょ' }, { answer: 'うた', text: '歌' },
  { answer: 'かいが', text: '絵画' }, { answer: 'まわる', text: '回る' }, { answer: 'あう', text: '会う' },
  { answer: 'え', text: '絵' }, { answer: 'たのしい', text: '楽しい' }, { answer: 'せいかつ', text: '生活' },
  { answer: 'あいだ', text: '間' }, { answer: 'にっき', text: '日記', special: 'っ' }, { answer: 'かえる', text: '帰る' },
  { answer: 'つよい', text: '強い' }, { answer: 'おしえる', text: '教える' }, { answer: 'かたち', text: '形' },
  { answer: 'はかる', text: '計る' }, { answer: 'いう', text: '言う' }, { answer: 'こくご', text: '国語' },
  { answer: 'こうさく', text: '工作' }, { answer: 'こうえん', text: '公園' }, { answer: 'こうばん', text: '交番' },
  { answer: 'かんがえる', text: '考える' }, { answer: 'いく', text: '行く' }, { answer: 'ごうけい', text: '合計' },
  { answer: 'くに', text: '国' }, { answer: 'ほそい', text: '細い' }, { answer: 'つくる', text: '作る' },
  { answer: 'けいさん', text: '計算' }, { answer: 'とまる', text: '止まる' }, { answer: 'いちば', text: '市場' },
  { answer: 'や', text: '矢' }, { answer: 'きしゃ', text: '汽車', special: 'ゃ' },
];
const KANJI_G2_S5 = [
  { answer: 'おもう', text: '思う' }, { answer: 'かみ', text: '紙' }, { answer: 'てら', text: '寺' },
  { answer: 'よわい', text: '弱い' }, { answer: 'かく', text: '書く' }, { answer: 'すくない', text: '少ない' },
  { answer: 'たべる', text: '食べる' }, { answer: 'としょ', text: '図書', special: 'ょ' }, { answer: 'かず', text: '数' },
  { answer: 'こえ', text: '声' }, { answer: 'きる', text: '切る' }, { answer: 'くみ', text: '組' },
  { answer: 'おおい', text: '多い' }, { answer: 'ふとい', text: '太い' }, { answer: 'しる', text: '知る' },
  { answer: 'おちゃ', text: 'お茶', special: 'ゃ' }, { answer: 'てん', text: '点' }, { answer: 'でんき', text: '電気' },
  { answer: 'あたる', text: '当たる' }, { answer: 'こたえる', text: '答える' }, { answer: 'あたま', text: '頭' },
  { answer: 'おなじ', text: '同じ' }, { answer: 'みち', text: '道' }, { answer: 'よむ', text: '読む' },
  { answer: 'うる', text: '売る' }, { answer: 'かう', text: '買う' }, { answer: 'きく', text: '聞く' },
  { answer: 'いちまん', text: '一万' }, { answer: 'なく', text: '鳴く' }, { answer: 'ようし', text: '用紙' },
  { answer: 'りか', text: '理科' }, { answer: 'はなす', text: '話す' },
];

/* ================= 3年（200字） ================= */
const KANJI_G3_S1 = [
  { answer: 'わるい', text: '悪い' }, { answer: 'やすい', text: '安い' }, { answer: 'くらい', text: '暗い' },
  { answer: 'いしゃ', text: '医者', special: 'ゃ' }, { answer: 'いいん', text: '委員' }, { answer: 'いけん', text: '意見' },
  { answer: 'そだてる', text: '育てる' }, { answer: 'てんいん', text: '店員' }, { answer: 'びょういん', text: '病院', special: 'ょ' },
  { answer: 'のむ', text: '飲む' }, { answer: 'はこぶ', text: '運ぶ' }, { answer: 'およぐ', text: '泳ぐ' },
  { answer: 'えき', text: '駅' }, { answer: 'ちゅうおう', text: '中央', special: 'ゅ' }, { answer: 'よこ', text: '横' },
  { answer: 'やね', text: '屋根' }, { answer: 'あたたかい', text: '温かい' }, { answer: 'ばける', text: '化ける' },
  { answer: 'にもつ', text: '荷もつ' }, { answer: 'せかい', text: '世界' }, { answer: 'あける', text: '開ける' },
  { answer: 'かいだん', text: '階だん' }, { answer: 'さむい', text: '寒い' }, { answer: 'かんじる', text: '感じる' },
  { answer: 'かんじ', text: '漢字' }, { answer: 'としょかん', text: '図書館', special: 'ょ' }, { answer: 'きし', text: '岸' },
  { answer: 'おきる', text: '起きる' }, { answer: 'がっき', text: '学期', special: 'っ' }, { answer: 'きゃく', text: '客', special: 'ゃ' },
  { answer: 'けんきゅう', text: '研究', special: 'ゅ' }, { answer: 'いそぐ', text: '急ぐ' }, { answer: 'がっきゅう', text: '学級', special: 'っ' },
  { answer: 'おみや', text: 'お宮' }, { answer: 'やきゅう', text: '野球', special: 'ゅ' }, { answer: 'きょねん', text: '去年', special: 'ょ' },
  { answer: 'はし', text: '橋' }, { answer: 'さぎょう', text: '作業', special: 'ょ' }, { answer: 'まがる', text: '曲がる' },
  { answer: 'ゆうびんきょく', text: 'ゆうびん局', special: 'ょ' },
];
const KANJI_G3_S2 = [
  { answer: 'ぎん', text: '銀' }, { answer: 'く', text: '区' }, { answer: 'くるしい', text: '苦しい' },
  { answer: 'どうぐ', text: '道具' }, { answer: 'きみ', text: '君' }, { answer: 'かかり', text: '係' },
  { answer: 'かるい', text: '軽い' }, { answer: 'ち', text: '血' }, { answer: 'きめる', text: '決める' },
  { answer: 'けんきゅうじょ', text: '研究所', special: 'ゅ' }, { answer: 'けん', text: '県' }, { answer: 'しゃこ', text: '車庫', special: 'ゃ' },
  { answer: 'みずうみ', text: '湖' }, { answer: 'むく', text: '向く' }, { answer: 'しあわせ', text: '幸せ' },
  { answer: 'みなと', text: '港' }, { answer: 'ばんごう', text: '番号' }, { answer: 'ね', text: '根' },
  { answer: 'まつり', text: '祭り' }, { answer: 'さら', text: '皿' }, { answer: 'しごと', text: '仕事' },
  { answer: 'しぬ', text: '死ぬ' }, { answer: 'つかう', text: '使う' }, { answer: 'はじまる', text: '始まる' },
  { answer: 'ゆび', text: '指' }, { answer: 'は', text: '歯' }, { answer: 'し', text: '詩' },
  { answer: 'つぎ', text: '次' }, { answer: 'できごと', text: '出来事' }, { answer: 'もつ', text: '持つ' },
  { answer: 'しき', text: '式' }, { answer: 'み', text: '実' }, { answer: 'うつす', text: '写す' },
  { answer: 'さくしゃ', text: '作者', special: 'ゃ' }, { answer: 'しゅじん', text: '主人', special: 'ゅ' }, { answer: 'まもる', text: '守る' },
  { answer: 'とる', text: '取る' }, { answer: 'さけ', text: '酒' }, { answer: 'うける', text: '受ける' },
  { answer: 'しゅう', text: '州', special: 'ゅ' },
];
const KANJI_G3_S3 = [
  { answer: 'ひろう', text: '拾う' }, { answer: 'おわる', text: '終わる' }, { answer: 'ならう', text: '習う' },
  { answer: 'あつめる', text: '集める' }, { answer: 'すむ', text: '住む' }, { answer: 'おもい', text: '重い' },
  { answer: 'しゅくだい', text: '宿題', special: 'ゅ' }, { answer: 'ところ', text: '所' }, { answer: 'あつい', text: '暑い' },
  { answer: 'たすける', text: '助ける' }, { answer: 'しょうわ', text: '昭和', special: 'ょ' }, { answer: 'けす', text: '消す' },
  { answer: 'しょうてん', text: '商店', special: 'ょ' }, { answer: 'ぶんしょう', text: '文章', special: 'ょ' }, { answer: 'かつ', text: '勝つ' },
  { answer: 'のる', text: '乗る' }, { answer: 'うえる', text: '植える' }, { answer: 'もうす', text: '申す' },
  { answer: 'み', text: '身' }, { answer: 'かみさま', text: '神さま' }, { answer: 'まんなか', text: '真ん中' },
  { answer: 'ふかい', text: '深い' }, { answer: 'すすむ', text: '進む' }, { answer: 'よのなか', text: '世の中' },
  { answer: 'ととのえる', text: '整える' }, { answer: 'むかし', text: '昔' }, { answer: 'ぜんぶ', text: '全ぶ' },
  { answer: 'あいて', text: '相手' }, { answer: 'おくる', text: '送る' }, { answer: 'かんそう', text: '感想' },
  { answer: 'いき', text: '息' }, { answer: 'はやい', text: '速い' }, { answer: 'かぞく', text: '家族' },
  { answer: 'ほか', text: '他' }, { answer: 'うつ', text: '打つ' }, { answer: 'たいする', text: '対する' },
  { answer: 'まつ', text: '待つ' }, { answer: 'かわる', text: '代わる' }, { answer: 'だいいち', text: '第一' },
  { answer: 'もんだい', text: '問題' },
];
const KANJI_G3_S4 = [
  { answer: 'すみ', text: '炭' }, { answer: 'みじかい', text: '短い' }, { answer: 'そうだん', text: '相談' },
  { answer: 'きる', text: '着る' }, { answer: 'そそぐ', text: '注ぐ' }, { answer: 'はしら', text: '柱' },
  { answer: 'ちょうめ', text: '丁目', special: 'ょ' }, { answer: 'てちょう', text: '手帳', special: 'ょ' }, { answer: 'しらべる', text: '調べる' },
  { answer: 'おう', text: '追う' }, { answer: 'さだめる', text: '定める' }, { answer: 'にわ', text: '庭' },
  { answer: 'ふえ', text: '笛' }, { answer: 'てつ', text: '鉄' }, { answer: 'ころがる', text: '転がる' },
  { answer: 'とかい', text: '都会' }, { answer: 'いちど', text: '一度' }, { answer: 'なげる', text: '投げる' },
  { answer: 'まめ', text: '豆' }, { answer: 'しま', text: '島' }, { answer: 'ゆ', text: '湯' },
  { answer: 'のぼる', text: '登る' }, { answer: 'ひとしい', text: '等しい' }, { answer: 'うごく', text: '動く' },
  { answer: 'どうわ', text: '童話' }, { answer: 'のうか', text: '農家' }, { answer: 'なみ', text: '波' },
  { answer: 'くばる', text: '配る' }, { answer: 'にばい', text: '二倍' }, { answer: 'はこ', text: '箱' },
  { answer: 'はたけ', text: '畑' }, { answer: 'はっぴょう', text: '発表', special: 'っ' }, { answer: 'はんたい', text: '反対' },
  { answer: 'さか', text: '坂' }, { answer: 'いた', text: '板' }, { answer: 'かわ', text: '皮' },
  { answer: 'かなしい', text: '悲しい' }, { answer: 'うつくしい', text: '美しい' }, { answer: 'はな', text: '鼻' },
  { answer: 'ふで', text: '筆' },
];
const KANJI_G3_S5 = [
  { answer: 'こおり', text: '氷', special: 'お' }, { answer: 'あらわす', text: '表す' }, { answer: 'いちびょう', text: '一秒', special: 'ょ' },
  { answer: 'びょうき', text: '病気', special: 'ょ' }, { answer: 'しなもの', text: '品もの' }, { answer: 'まける', text: '負ける' },
  { answer: 'へや', text: '部屋' }, { answer: 'ふく', text: '服' }, { answer: 'こうふく', text: '幸福' },
  { answer: 'もの', text: '物' }, { answer: 'たいら', text: '平ら' }, { answer: 'かえす', text: '返す' },
  { answer: 'べんきょう', text: '勉強', special: 'ょ' }, { answer: 'はなす', text: '放す' }, { answer: 'あじ', text: '味' },
  { answer: 'いのち', text: '命' }, { answer: 'がめん', text: '画面' }, { answer: 'とう', text: '問う' },
  { answer: 'やくめ', text: '役目' }, { answer: 'くすり', text: '薬' }, { answer: 'りゆう', text: '理由' },
  { answer: 'あぶら', text: '油' }, { answer: 'ある', text: '有る' }, { answer: 'あそぶ', text: '遊ぶ' },
  { answer: 'よてい', text: '予定' }, { answer: 'ひつじ', text: '羊' }, { answer: 'ようふく', text: '洋服' },
  { answer: 'は', text: '葉' }, { answer: 'たいよう', text: '太陽' }, { answer: 'おうさま', text: '王様' },
  { answer: 'おちる', text: '落ちる' }, { answer: 'ながれる', text: '流れる' }, { answer: 'たび', text: '旅' },
  { answer: 'りょうて', text: '両手', special: 'ょ' }, { answer: 'みどり', text: '緑' }, { answer: 'おれい', text: 'お礼' },
  { answer: 'ぎょうれつ', text: '行列', special: 'ょ' }, { answer: 'れんしゅう', text: '練習', special: 'ゅ' }, { answer: 'どうろ', text: '道路' },
  { answer: 'へいわ', text: '平和' },
];

/* ================= 4年 ================= */
const KANJI_G4_S1 = [
  { answer: 'あいする', text: '愛する' }, { answer: 'あんない', text: '案内' }, { answer: 'いじょう', text: '以上', special: 'ょ' },
  { answer: 'ころも', text: '衣' }, { answer: 'いちい', text: '一位' }, { answer: 'かこむ', text: '囲む' },
  { answer: 'い', text: '胃' }, { answer: 'めじるし', text: '目印' }, { answer: 'えいご', text: '英語' },
  { answer: 'さかえる', text: '栄える' }, { answer: 'しお', text: '塩' }, { answer: 'いちおく', text: '一億' },
  { answer: 'くわえる', text: '加える' }, { answer: 'くだもの', text: '果物' }, { answer: 'かもつ', text: '貨物' },
  { answer: 'かだい', text: '課題' }, { answer: 'め', text: '芽' }, { answer: 'あらためる', text: '改める' },
  { answer: 'きかい', text: '機械' }, { answer: 'がいちゅう', text: '害虫', special: 'ゅ' }, { answer: 'まち', text: '街' },
  { answer: 'かくじ', text: '各自' }, { answer: 'おぼえる', text: '覚える' }, { answer: 'にいがた', text: '新潟' },
  { answer: 'かんせい', text: '完成' }, { answer: 'かん', text: '官' }, { answer: 'くだ', text: '管' },
  { answer: 'かんけい', text: '関係' }, { answer: 'かんこう', text: '観光' }, { answer: 'ねがう', text: '願う' },
  { answer: 'ぎふ', text: '岐阜' }, { answer: 'きぼう', text: '希望' }, { answer: 'きせつ', text: '季節' },
  { answer: 'せいき', text: '世紀' }, { answer: 'はた', text: '旗' }, { answer: 'しょっき', text: '食器', special: 'ょ' },
  { answer: 'ひこうき', text: '飛行機' }, { answer: 'かいぎ', text: '会議' }, { answer: 'もとめる', text: '求める' },
  { answer: 'なく', text: '泣く' }, { answer: 'すくう', text: '救う' },
];
const KANJI_G4_S2 = [
  { answer: 'きゅうしょく', text: '給食', special: 'ゅ' }, { answer: 'あげる', text: '挙げる' }, { answer: 'ぎょぎょう', text: '漁業', special: 'ょ' },
  { answer: 'ともに', text: '共に' }, { answer: 'きょうりょく', text: '協力', special: 'ょ' }, { answer: 'かがみ', text: '鏡' },
  { answer: 'きょうそう', text: '競走', special: 'ょ' }, { answer: 'ほっきょく', text: '北極', special: 'っ' }, { answer: 'くま', text: '熊' },
  { answer: 'くんれん', text: '訓練' }, { answer: 'ぐんたい', text: '軍隊' }, { answer: 'ぐん', text: '郡' },
  { answer: 'むれ', text: '群れ' }, { answer: 'ちょっけい', text: '直径', special: 'ょ' }, { answer: 'けしき', text: '景色' },
  { answer: 'げい', text: '芸' }, { answer: 'かける', text: '欠ける' }, { answer: 'むすぶ', text: '結ぶ' },
  { answer: 'たてる', text: '建てる' }, { answer: 'けんこう', text: '健康' }, { answer: 'じっけん', text: '実験', special: 'っ' },
  { answer: 'かたい', text: '固い' }, { answer: 'せいこう', text: '成功' }, { answer: 'すき', text: '好き' },
  { answer: 'かおり', text: '香り' }, { answer: 'てんこう', text: '天候' }, { answer: 'さが', text: '佐賀' },
  { answer: 'さす', text: '差す' }, { answer: 'やさい', text: '野菜' }, { answer: 'もっとも', text: '最も', special: 'っ' },
  { answer: 'さいたま', text: '埼玉' }, { answer: 'もくざい', text: '木材' }, { answer: 'ながさき', text: '長崎' },
  { answer: 'きのう', text: '昨日' }, { answer: 'ふだ', text: '札' }, { answer: 'いんさつ', text: '印刷' },
  { answer: 'かんさつ', text: '観察' }, { answer: 'さんか', text: '参加' }, { answer: 'せいさん', text: '生産' },
];
const KANJI_G4_S3 = [
  { answer: 'ちる', text: '散る' }, { answer: 'のこる', text: '残る' }, { answer: 'しめい', text: '氏名' },
  { answer: 'しかい', text: '司会' }, { answer: 'ためす', text: '試す' }, { answer: 'じどう', text: '児童' },
  { answer: 'なおる', text: '治る' }, { answer: 'しが', text: '滋賀' }, { answer: 'じしょ', text: '辞書', special: 'ょ' },
  { answer: 'しか', text: '鹿' }, { answer: 'うしなう', text: '失う' }, { answer: 'かりる', text: '借りる' },
  { answer: 'たね', text: '種' }, { answer: 'まわり', text: '周り' }, { answer: 'いわう', text: '祝う' },
  { answer: 'じゅんばん', text: '順番', special: 'ゅ' }, { answer: 'はじめ', text: '初め' }, { answer: 'まつ', text: '松' },
  { answer: 'わらう', text: '笑う' }, { answer: 'となえる', text: '唱える' }, { answer: 'やく', text: '焼く' },
  { answer: 'てらす', text: '照らす' }, { answer: 'しろ', text: '城' }, { answer: 'おきなわ', text: '沖縄' },
  { answer: 'だいじん', text: '大臣' }, { answer: 'しんじる', text: '信じる' }, { answer: 'いど', text: '井戸' },
  { answer: 'なる', text: '成る' }, { answer: 'はんせい', text: '反省' }, { answer: 'きよい', text: '清い' },
  { answer: 'しずか', text: '静か' }, { answer: 'せき', text: '席' }, { answer: 'つむ', text: '積む' },
  { answer: 'おる', text: '折る' }, { answer: 'せつぶん', text: '節分' }, { answer: 'せつめい', text: '説明' },
  { answer: 'あさい', text: '浅い' }, { answer: 'たたかう', text: '戦う' }, { answer: 'えらぶ', text: '選ぶ' },
  { answer: 'しぜん', text: '自然' },
];
const KANJI_G4_S4 = [
  { answer: 'あらそう', text: '争う' }, { answer: 'くら', text: '倉' }, { answer: 'す', text: '巣' },
  { answer: 'たば', text: '束' }, { answer: 'がわ', text: '側' }, { answer: 'つづく', text: '続く' },
  { answer: 'そつぎょう', text: '卒業', special: 'ょ' }, { answer: 'まご', text: '孫' }, { answer: 'おび', text: '帯' },
  { answer: 'たい', text: '隊' }, { answer: 'ともだち', text: '友達' }, { answer: 'たんご', text: '単語' },
  { answer: 'おく', text: '置く' }, { answer: 'なか', text: '仲' }, { answer: 'おき', text: '沖' },
  { answer: 'いっちょう', text: '一兆', special: 'っ' }, { answer: 'ひくい', text: '低い' }, { answer: 'そこ', text: '底' },
  { answer: 'まと', text: '的' }, { answer: 'じてん', text: '辞典' }, { answer: 'つたえる', text: '伝える' },
  { answer: 'せいと', text: '生徒' }, { answer: 'つとめる', text: '努める' }, { answer: 'でんとう', text: '電灯' },
  { answer: 'はたらく', text: '働く' }, { answer: 'とくに', text: '特に' }, { answer: 'とくしま', text: '徳島' },
  { answer: 'とちぎ', text: '栃木' }, { answer: 'なら', text: '奈良' }, { answer: 'やまなし', text: '山梨' },
  { answer: 'あつい', text: '熱い' }, { answer: 'きねん', text: '記念' }, { answer: 'やぶれる', text: '敗れる' },
  { answer: 'うめ', text: '梅' }, { answer: 'はくぶつかん', text: '博物館' }, { answer: 'おおさか', text: '大阪' },
  { answer: 'ごはん', text: 'ご飯' }, { answer: 'とぶ', text: '飛ぶ' }, { answer: 'かならず', text: '必ず' },
  { answer: 'とうひょう', text: '投票', special: 'ょ' },
];
const KANJI_G4_S5 = [
  { answer: 'もくひょう', text: '目標', special: 'ょ' }, { answer: 'ふしぎ', text: '不思議' }, { answer: 'くふう', text: '工夫' },
  { answer: 'つける', text: '付ける' }, { answer: 'ふ', text: '府' }, { answer: 'ふじさん', text: '富士山' },
  { answer: 'ふくかいちょう', text: '副会長', special: 'ょ' }, { answer: 'へいたい', text: '兵隊' }, { answer: 'わかれる', text: '別れる' },
  { answer: 'あたり', text: '辺り' }, { answer: 'かわる', text: '変わる' }, { answer: 'たより', text: '便り' },
  { answer: 'つつむ', text: '包む' }, { answer: 'ほうほう', text: '方法' }, { answer: 'のぞむ', text: '望む' },
  { answer: 'ぼくじょう', text: '牧場', special: 'ょ' }, { answer: 'しゅうまつ', text: '週末', special: 'ゅ' }, { answer: 'みちる', text: '満ちる' },
  { answer: 'みらい', text: '未来' }, { answer: 'こくみん', text: '国民' }, { answer: 'ない', text: '無い' },
  { answer: 'やくそく', text: '約そく' }, { answer: 'ゆうき', text: '勇気' }, { answer: 'いる', text: '要る' },
  { answer: 'やしなう', text: '養う' }, { answer: 'あびる', text: '浴びる' }, { answer: 'りよう', text: '利用' },
  { answer: 'りく', text: '陸' }, { answer: 'よい', text: '良い' }, { answer: 'ざいりょう', text: '材料', special: 'ょ' },
  { answer: 'はかる', text: '量る' }, { answer: 'わ', text: '輪' }, { answer: 'しゅるい', text: '種類', special: 'ゅ' },
  { answer: 'めいれい', text: '命令' }, { answer: 'つめたい', text: '冷たい' }, { answer: 'たとえば', text: '例えば' },
  { answer: 'つれる', text: '連れる' }, { answer: 'おいる', text: '老いる' }, { answer: 'くろう', text: '苦労' },
  { answer: 'きろく', text: '記録' }, { answer: 'ねんが', text: '年賀' }, { answer: 'いばらき', text: '茨城' },
  { answer: 'えひめ', text: '愛媛' }, { answer: 'ふくおか', text: '福岡' },
];

/* ================= 5年 ================= */
const KANJI_G5_S1 = [
  { answer: 'きあつ', text: '気圧' }, { answer: 'うつる', text: '移る' }, { answer: 'げんいん', text: '原因' },
  { answer: 'ながい', text: '永い' }, { answer: 'いとなむ', text: '営む' }, { answer: 'えいせい', text: '衛星' },
  { answer: 'やさしい', text: '易しい' }, { answer: 'りえき', text: '利益' }, { answer: 'えきたい', text: '液体' },
  { answer: 'えんじる', text: '演じる' }, { answer: 'こたえる', text: '応える' }, { answer: 'おうふく', text: '往復' },
  { answer: 'さくら', text: '桜' }, { answer: 'おんじん', text: '恩人' }, { answer: 'きょか', text: '許可', special: 'ょ' },
  { answer: 'かり', text: '仮' }, { answer: 'ていか', text: '定価' }, { answer: 'かせん', text: '河川' },
  { answer: 'すぎる', text: '過ぎる' }, { answer: 'こころよい', text: '快い' }, { answer: 'とく', text: '解く' },
  { answer: 'ごうかく', text: '合格' }, { answer: 'たしかめる', text: '確かめる' }, { answer: 'きんがく', text: '金額' },
  { answer: 'しゅうかん', text: '週刊', special: 'ゅ' }, { answer: 'みき', text: '幹' }, { answer: 'なれる', text: '慣れる' },
  { answer: 'めがね', text: '眼鏡' }, { answer: 'きほん', text: '基本' }, { answer: 'よる', text: '寄る' },
  { answer: 'きそく', text: '規則' }, { answer: 'わざ', text: '技' }, { answer: 'せいぎ', text: '正義' },
  { answer: 'ぎゃく', text: '逆', special: 'ゃ' }, { answer: 'ひさしぶり', text: '久しぶり' }, { answer: 'きゅうしき', text: '旧式', special: 'ゅ' },
  { answer: 'いる', text: '居る' }, { answer: 'ゆるす', text: '許す' }, { answer: 'さかい', text: '境' },
];
const KANJI_G5_S2 = [
  { answer: 'へいきん', text: '平均' }, { answer: 'きんし', text: '禁止' }, { answer: 'もんく', text: '文句' },
  { answer: 'けいけん', text: '経験' }, { answer: 'せいけつ', text: '清潔' }, { answer: 'じけん', text: '事件' },
  { answer: 'けん', text: '券' }, { answer: 'ほけん', text: '保険' }, { answer: 'けんさ', text: '検査' },
  { answer: 'かぎる', text: '限る' }, { answer: 'あらわれる', text: '現れる' }, { answer: 'へる', text: '減る' },
  { answer: 'じこ', text: '事故' }, { answer: 'いっこ', text: '一個', special: 'っ' }, { answer: 'ほご', text: '保護' },
  { answer: 'きく', text: '効く' }, { answer: 'あつい', text: '厚い' }, { answer: 'たがやす', text: '耕す' },
  { answer: 'こうかい', text: '航海' }, { answer: 'こうざん', text: '鉱山' }, { answer: 'かまえる', text: '構える' },
  { answer: 'きょうみ', text: '興味', special: 'ょ' }, { answer: 'こうぎ', text: '講義' }, { answer: 'つげる', text: '告げる' },
  { answer: 'まぜる', text: '混ぜる' }, { answer: 'ちょうさ', text: '調査', special: 'ょ' }, { answer: 'ふたたび', text: '再び' },
  { answer: 'さいがい', text: '災害' }, { answer: 'つま', text: '妻' }, { answer: 'とる', text: '採る' },
  { answer: 'こくさい', text: '国際' }, { answer: 'げんざい', text: '現在' }, { answer: 'ざいさん', text: '財産' },
  { answer: 'つみ', text: '罪' }, { answer: 'ころす', text: '殺す' }, { answer: 'ざっそう', text: '雑草', special: 'っ' },
  { answer: 'さんそ', text: '酸素' }, { answer: 'さんせい', text: '賛成' }, { answer: 'はかせ', text: '博士' },
];
const KANJI_G5_S3 = [
  { answer: 'れきし', text: '歴史' }, { answer: 'ささえる', text: '支える' }, { answer: 'こころざし', text: '志' },
  { answer: 'えだ', text: '枝' }, { answer: 'きょうし', text: '教師', special: 'ょ' }, { answer: 'しりょう', text: '資料', special: 'ょ' },
  { answer: 'かう', text: '飼う' }, { answer: 'しめす', text: '示す' }, { answer: 'にる', text: '似る' },
  { answer: 'ちしき', text: '知識' }, { answer: 'しつもん', text: '質問' }, { answer: 'こうしゃ', text: '校舎', special: 'ゃ' },
  { answer: 'あやまる', text: '謝る' }, { answer: 'じゅぎょう', text: '授業', special: 'ゅ' }, { answer: 'しゅうり', text: '修理', special: 'ゅ' },
  { answer: 'のべる', text: '述べる' }, { answer: 'しゅじゅつ', text: '手術', special: 'ゅ' }, { answer: 'じゅんび', text: '準備', special: 'ゅ' },
  { answer: 'じゅんじょ', text: '順序', special: 'ゅ' }, { answer: 'まねく', text: '招く' }, { answer: 'しょうち', text: '承知', special: 'ょ' },
  { answer: 'しょうめい', text: '証明', special: 'ょ' }, { answer: 'じょうけん', text: '条件', special: 'ょ' }, { answer: 'しょうじょう', text: '賞状', special: 'ょ' },
  { answer: 'にちじょう', text: '日常', special: 'ょ' }, { answer: 'ひょうじょう', text: '表情', special: 'ょ' }, { answer: 'おる', text: '織る' },
  { answer: 'しょくぎょう', text: '職業', special: 'ょ' }, { answer: 'せいふく', text: '制服' }, { answer: 'せいかく', text: '性格' },
  { answer: 'せいじ', text: '政治' }, { answer: 'いきおい', text: '勢い' }, { answer: 'せいしん', text: '精神' },
  { answer: 'せいひん', text: '製品' }, { answer: 'ぜいきん', text: '税金' }, { answer: 'せめる', text: '責める' },
  { answer: 'せいせき', text: '成績' }, { answer: 'ちょくせつ', text: '直接', special: 'ょ' }, { answer: 'もうける', text: '設ける' },
];
const KANJI_G5_S4 = [
  { answer: 'たえる', text: '絶える' }, { answer: 'そふ', text: '祖父' }, { answer: 'すなお', text: '素直' },
  { answer: 'そうごう', text: '総合' }, { answer: 'つくる', text: '造る' }, { answer: 'どうぞう', text: '銅像' },
  { answer: 'ふえる', text: '増える' }, { answer: 'げんそく', text: '原則' }, { answer: 'はかる', text: '測る' },
  { answer: 'きんぞく', text: '金属' }, { answer: 'かくりつ', text: '確率' }, { answer: 'そんする', text: '損する' },
  { answer: 'しりぞく', text: '退く' }, { answer: 'かす', text: '貸す' }, { answer: 'たいど', text: '態度' },
  { answer: 'だんたい', text: '団体' }, { answer: 'ことわる', text: '断る' }, { answer: 'きずく', text: '築く' },
  { answer: 'ためる', text: '貯める' }, { answer: 'はる', text: '張る' }, { answer: 'ていしゃ', text: '停車', special: 'ゃ' },
  { answer: 'ていしゅつ', text: '提出', special: 'ゅ' }, { answer: 'ていど', text: '程度' }, { answer: 'てきする', text: '適する' },
  { answer: 'てき', text: '敵' }, { answer: 'でんとう', text: '伝統' }, { answer: 'どう', text: '銅' },
  { answer: 'みちびく', text: '導く' }, { answer: 'ひとり', text: '独り' }, { answer: 'まかせる', text: '任せる' },
  { answer: 'もえる', text: '燃える' }, { answer: 'のうりょく', text: '能力', special: 'ょ' }, { answer: 'やぶる', text: '破る' },
  { answer: 'はんにん', text: '犯人' }, { answer: 'はんだん', text: '判断' }, { answer: 'しゅっぱん', text: '出版', special: 'ゅ' },
  { answer: 'くらべる', text: '比べる' }, { answer: 'こえる', text: '肥える' },
];
const KANJI_G5_S5 = [
  { answer: 'ひじょう', text: '非常', special: 'ょ' }, { answer: 'ひよう', text: '費用' }, { answer: 'そなえる', text: '備える' },
  { answer: 'ひょうばん', text: '評判', special: 'ょ' }, { answer: 'まずしい', text: '貧しい' }, { answer: 'ぬの', text: '布' },
  { answer: 'ふうふ', text: '夫婦' }, { answer: 'ぶし', text: '武士' }, { answer: 'ふくしゅう', text: '復習', special: 'ゅ' },
  { answer: 'ふくざつ', text: '複雑' }, { answer: 'ほとけ', text: '仏' }, { answer: 'こな', text: '粉' },
  { answer: 'あむ', text: '編む' }, { answer: 'べんとう', text: '弁当' }, { answer: 'たもつ', text: '保つ' },
  { answer: 'はか', text: '墓' }, { answer: 'しらせ', text: '報せ' }, { answer: 'ゆたか', text: '豊か' },
  { answer: 'ふせぐ', text: '防ぐ' }, { answer: 'ぼうえき', text: '貿易' }, { answer: 'あばれる', text: '暴れる' },
  { answer: 'みゃく', text: '脈', special: 'ゃ' }, { answer: 'つとめる', text: '務める' }, { answer: 'ゆめ', text: '夢' },
  { answer: 'まよう', text: '迷う' }, { answer: 'わた', text: '綿' }, { answer: 'ゆにゅう', text: '輸入', special: 'ゅ' },
  { answer: 'あまる', text: '余る' }, { answer: 'あずける', text: '預ける' }, { answer: 'ないよう', text: '内容' },
  { answer: 'しょうりゃく', text: '省略', special: 'ょ' }, { answer: 'とめる', text: '留める' }, { answer: 'だいとうりょう', text: '大統領', special: 'ょ' },
  { answer: 'れきだい', text: '歴代' }, { answer: 'しょうひん', text: '賞品', special: 'ょ' }, { answer: 'ぞう', text: '象' },
  { answer: 'ぜに', text: '銭' }, { answer: 'おおがた', text: '大型' },
];

/* ================= 6年 ================= */
const KANJI_G6_S1 = [
  { answer: 'ことなる', text: '異なる' }, { answer: 'いさん', text: '遺産' }, { answer: 'ちいき', text: '地域' },
  { answer: 'うちゅう', text: '宇宙', special: 'ゅ' }, { answer: 'うつる', text: '映る' }, { answer: 'のびる', text: '延びる' },
  { answer: 'そう', text: '沿う' }, { answer: 'われ', text: '我' }, { answer: 'はい', text: '灰' },
  { answer: 'かくだい', text: '拡大' }, { answer: 'かくめい', text: '革命' }, { answer: 'ないかく', text: '内閣' },
  { answer: 'わる', text: '割る' }, { answer: 'かぶ', text: '株' }, { answer: 'ほす', text: '干す' },
  { answer: 'まく', text: '巻く' }, { answer: 'かんご', text: '看護' }, { answer: 'かんたん', text: '簡単' },
  { answer: 'あぶない', text: '危ない' }, { answer: 'つくえ', text: '机' }, { answer: 'しき', text: '指揮' },
  { answer: 'きちょう', text: '貴重', special: 'ょ' }, { answer: 'うたがう', text: '疑う' }, { answer: 'すう', text: '吸う' },
  { answer: 'そなえる', text: '供える' }, { answer: 'むね', text: '胸' }, { answer: 'こきょう', text: '故郷', special: 'ょ' },
  { answer: 'つとめる', text: '勤める' }, { answer: 'すじ', text: '筋' }, { answer: 'たいようけい', text: '太陽系' },
  { answer: 'うやまう', text: '敬う' }, { answer: 'けいさつ', text: '警察' }, { answer: 'げき', text: '劇' },
  { answer: 'はげしい', text: '激しい' }, { answer: 'あな', text: '穴' }, { answer: 'きぬ', text: '絹' },
  { answer: 'けんり', text: '権利' }, { answer: 'けんぽう', text: '憲法' },
];
const KANJI_G6_S2 = [
  { answer: 'みなもと', text: '源' }, { answer: 'きびしい', text: '厳しい' }, { answer: 'じこ', text: '自己' },
  { answer: 'よぶ', text: '呼ぶ' }, { answer: 'あやまる', text: '誤る' }, { answer: 'こうごう', text: '皇后' },
  { answer: 'こうこう', text: '孝行' }, { answer: 'てんのう', text: '天皇' }, { answer: 'こうちゃ', text: '紅茶', special: 'ゃ' },
  { answer: 'おりる', text: '降りる' }, { answer: 'てっこう', text: '鉄鋼', special: 'っ' }, { answer: 'きざむ', text: '刻む' },
  { answer: 'こくもつ', text: '穀物' }, { answer: 'ほね', text: '骨' }, { answer: 'こまる', text: '困る' },
  { answer: 'すな', text: '砂' }, { answer: 'すわる', text: '座る' }, { answer: 'すませる', text: '済ませる' },
  { answer: 'さいばん', text: '裁判' }, { answer: 'たいさく', text: '対策' }, { answer: 'いっさつ', text: '一冊', special: 'っ' },
  { answer: 'かいこ', text: '蚕' }, { answer: 'いたる', text: '至る' }, { answer: 'わたし', text: '私' },
  { answer: 'すがた', text: '姿' }, { answer: 'しりょく', text: '視力', special: 'ょ' }, { answer: 'かし', text: '歌詞' },
  { answer: 'ざっし', text: '雑誌', special: 'っ' }, { answer: 'じしゃく', text: '磁石', special: 'ゃ' }, { answer: 'いる', text: '射る' },
  { answer: 'すてる', text: '捨てる' }, { answer: 'しゃく', text: '尺', special: 'ゃ' }, { answer: 'わかい', text: '若い' },
  { answer: 'じゅもく', text: '樹木', special: 'ゅ' }, { answer: 'おさめる', text: '収める' }, { answer: 'しゅうきょう', text: '宗教', special: 'ゅ' },
  { answer: 'しゅうしょく', text: '就職', special: 'ゅ' }, { answer: 'たいしゅう', text: '大衆', special: 'ゅ' },
];
const KANJI_G6_S3 = [
  { answer: 'したがう', text: '従う' }, { answer: 'たて', text: '縦' }, { answer: 'ちぢむ', text: '縮む' },
  { answer: 'じゅくご', text: '熟語', special: 'ゅ' }, { answer: 'たんじゅん', text: '単純', special: 'ゅ' }, { answer: 'しょり', text: '処理', special: 'ょ' },
  { answer: 'しょうぼうしょ', text: '消防署', special: 'ょ' }, { answer: 'しょとう', text: '諸島', special: 'ょ' }, { answer: 'のぞく', text: '除く' },
  { answer: 'しょうらい', text: '将来', special: 'ょ' }, { answer: 'きず', text: '傷' }, { answer: 'こしょう', text: '故障', special: 'ょ' },
  { answer: 'むす', text: '蒸す' }, { answer: 'はり', text: '針' }, { answer: 'じん', text: '仁' },
  { answer: 'たれる', text: '垂れる' }, { answer: 'すいり', text: '推理' }, { answer: 'すん', text: '寸' },
  { answer: 'もる', text: '盛る' }, { answer: 'せいなる', text: '聖なる' }, { answer: 'せいじつ', text: '誠実' },
  { answer: 'した', text: '舌' }, { answer: 'せんげん', text: '宣言' }, { answer: 'せんもん', text: '専門' },
  { answer: 'いずみ', text: '泉' }, { answer: 'あらう', text: '洗う' }, { answer: 'そめる', text: '染める' },
  { answer: 'よい', text: '善い' }, { answer: 'えんそう', text: '演奏' }, { answer: 'まど', text: '窓' },
  { answer: 'そうさく', text: '創作' }, { answer: 'ふくそう', text: '服装' }, { answer: 'ちそう', text: '地層' },
  { answer: 'たいそう', text: '体操' }, { answer: 'れいぞうこ', text: '冷蔵庫' }, { answer: 'しんぞう', text: '心臓' },
  { answer: 'いちょう', text: '胃腸', special: 'ょ' },
];
const KANJI_G6_S4 = [
  { answer: 'そんざい', text: '存在' }, { answer: 'とうとい', text: '尊い' }, { answer: 'じたく', text: '自宅' },
  { answer: 'たんとう', text: '担当' }, { answer: 'さがす', text: '探す' }, { answer: 'たんじょうび', text: '誕生日', special: 'ょ' },
  { answer: 'かいだん', text: '階段' }, { answer: 'あたたかい', text: '暖かい' }, { answer: 'ねだん', text: '値段' },
  { answer: 'ちゅうがえり', text: '宙がえり', special: 'ゅ' }, { answer: 'ちゅうじつ', text: '忠実', special: 'ゅ' }, { answer: 'ちょしゃ', text: '著者', special: 'ょ' },
  { answer: 'けんちょう', text: '県庁', special: 'ょ' }, { answer: 'ちょうじょう', text: '頂上', special: 'ょ' }, { answer: 'しお', text: '潮' },
  { answer: 'やちん', text: '家賃' }, { answer: 'いたい', text: '痛い' }, { answer: 'はってん', text: '発展', special: 'っ' },
  { answer: 'とうろん', text: '討論' }, { answer: 'せいとう', text: '政党' }, { answer: 'さとう', text: '砂糖' },
  { answer: 'とどく', text: '届く' }, { answer: 'むずかしい', text: '難しい' }, { answer: 'ぎゅうにゅう', text: '牛乳', special: 'ゅ' },
  { answer: 'みとめる', text: '認める' }, { answer: 'おさめる', text: '納める' }, { answer: 'ずのう', text: '頭脳' },
  { answer: 'りっぱ', text: '立派', special: 'っ' }, { answer: 'おがむ', text: '拝む' }, { answer: 'せなか', text: '背中' },
  { answer: 'はい', text: '肺' }, { answer: 'はいく', text: '俳句' }, { answer: 'はんちょう', text: '班長', special: 'ょ' },
  { answer: 'こんばん', text: '今晩' }, { answer: 'ひてい', text: '否定' }, { answer: 'ひはん', text: '批判' },
];
const KANJI_G6_S5 = [
  { answer: 'ひみつ', text: '秘密' }, { answer: 'どひょう', text: '土俵', special: 'ょ' }, { answer: 'はら', text: '腹' },
  { answer: 'こうふん', text: '興奮' }, { answer: 'ならぶ', text: '並ぶ' }, { answer: 'へいか', text: '陛下' },
  { answer: 'とじる', text: '閉じる' }, { answer: 'かたて', text: '片手' }, { answer: 'おぎなう', text: '補う' },
  { answer: 'くらす', text: '暮らす' }, { answer: 'たから', text: '宝' }, { answer: 'たずねる', text: '訪ねる' },
  { answer: 'なくす', text: '亡くす' }, { answer: 'わすれる', text: '忘れる' }, { answer: 'ぼう', text: '棒' },
  { answer: 'いちまい', text: '一枚' }, { answer: 'まく', text: '幕' }, { answer: 'みつりん', text: '密林' },
  { answer: 'どうめい', text: '同盟' },
  { answer: 'もけい', text: '模型' }, { answer: 'わけ', text: '訳' }, { answer: 'ゆうびん', text: '郵便' },
  { answer: 'やさしい', text: '優しい' }, { answer: 'おさない', text: '幼い' }, { answer: 'ほしい', text: '欲しい' },
  { answer: 'よくじつ', text: '翌日' }, { answer: 'みだれる', text: '乱れる' }, { answer: 'たまご', text: '卵' },
  { answer: 'てんらんかい', text: '展覧会' }, { answer: 'うら', text: '裏' }, { answer: 'ほうりつ', text: '法律' },
  { answer: 'のぞむ', text: '臨む' }, { answer: 'ろうどく', text: '朗読' }, { answer: 'ぎろん', text: '議論' },
];

/* 学年ぜんぶを まとめた リスト（ボスや まとめ出題で つかう） */
const KANJI_WORDS_G1 = [...KANJI_G1_S1, ...KANJI_G1_S2, ...KANJI_G1_S3, ...KANJI_G1_S4, ...KANJI_G1_S5];
const KANJI_WORDS_G2 = [...KANJI_G2_S1, ...KANJI_G2_S2, ...KANJI_G2_S3, ...KANJI_G2_S4, ...KANJI_G2_S5];
const KANJI_WORDS_G3 = [...KANJI_G3_S1, ...KANJI_G3_S2, ...KANJI_G3_S3, ...KANJI_G3_S4, ...KANJI_G3_S5];
const KANJI_WORDS_G4 = [...KANJI_G4_S1, ...KANJI_G4_S2, ...KANJI_G4_S3, ...KANJI_G4_S4, ...KANJI_G4_S5];
const KANJI_WORDS_G5 = [...KANJI_G5_S1, ...KANJI_G5_S2, ...KANJI_G5_S3, ...KANJI_G5_S4, ...KANJI_G5_S5];

const KANA_WORDS_HIRA = [...KANA_HIRA_S1, ...KANA_HIRA_S2, ...KANA_HIRA_S3, ...KANA_HIRA_S4, ...KANA_HIRA_S5, ...KANA_HIRA_SOKUON_ADV, ...KANA_HIRA_TONE_ADV];
const KANA_WORDS_KATA = [...KANA_KATA_S1, ...KANA_KATA_S2, ...KANA_KATA_S3, ...KANA_KATA_S4, ...KANA_KATA_S5, ...KANA_KATA_SOKUON_ADV, ...KANA_KATA_TONE_ADV];

const KANJI_WORDS_G6 = [...KANJI_G6_S1, ...KANJI_G6_S2, ...KANJI_G6_S3, ...KANJI_G6_S4, ...KANJI_G6_S5];

/* がくねん（tier）と ことばリストの たいおうひょう。
   'kanji_gN' = その学年ぜんぶ ／ 'kanji_gN_M' = その学年の ステージM */
const KANJI_POOLS = {
  kanji_g1: KANJI_WORDS_G1,
  kanji_g2: KANJI_WORDS_G2,
  kanji_g3: KANJI_WORDS_G3,
  kanji_g4: KANJI_WORDS_G4,
  kanji_g5: KANJI_WORDS_G5,
  kanji_g6: KANJI_WORDS_G6,
  kanji_g1_1: KANJI_G1_S1, kanji_g1_2: KANJI_G1_S2, kanji_g1_3: KANJI_G1_S3, kanji_g1_4: KANJI_G1_S4, kanji_g1_5: KANJI_G1_S5,
  kanji_g2_1: KANJI_G2_S1, kanji_g2_2: KANJI_G2_S2, kanji_g2_3: KANJI_G2_S3, kanji_g2_4: KANJI_G2_S4, kanji_g2_5: KANJI_G2_S5,
  kanji_g3_1: KANJI_G3_S1, kanji_g3_2: KANJI_G3_S2, kanji_g3_3: KANJI_G3_S3, kanji_g3_4: KANJI_G3_S4, kanji_g3_5: KANJI_G3_S5,
  kanji_g4_1: KANJI_G4_S1, kanji_g4_2: KANJI_G4_S2, kanji_g4_3: KANJI_G4_S3, kanji_g4_4: KANJI_G4_S4, kanji_g4_5: KANJI_G4_S5,
  kanji_g5_1: KANJI_G5_S1, kanji_g5_2: KANJI_G5_S2, kanji_g5_3: KANJI_G5_S3, kanji_g5_4: KANJI_G5_S4, kanji_g5_5: KANJI_G5_S5,
  
  kana_hira: KANA_WORDS_HIRA,
  kana_kata: KANA_WORDS_KATA,
  kana_hira_1: KANA_HIRA_S1, kana_hira_2: KANA_HIRA_S2, kana_hira_3: KANA_HIRA_S3, kana_hira_4: KANA_HIRA_S4, kana_hira_5: KANA_HIRA_S5,
  kana_kata_1: KANA_KATA_S1, kana_kata_2: KANA_KATA_S2, kana_kata_3: KANA_KATA_S3, kana_kata_4: KANA_KATA_S4, kana_kata_5: KANA_KATA_S5,
  kana_hira_6: KANA_HIRA_SOKUON_ADV, kana_hira_7: KANA_HIRA_TONE_ADV,
  kana_kata_6: KANA_KATA_SOKUON_ADV, kana_kata_7: KANA_KATA_TONE_ADV,
  kanji_g6_1: KANJI_G6_S1, kanji_g6_2: KANJI_G6_S2, kanji_g6_3: KANJI_G6_S3, kanji_g6_4: KANJI_G6_S4, kanji_g6_5: KANJI_G6_S5,
};

/* ステージ名に つかう 見出し（エリアの ステージ表示で つかう） */
const KANJI_STAGE_LABELS = {
  g1: ['かず・大きさ', 'からだ・ひと', 'しぜん', 'がっこう・まち', 'いろ・いきもの'],
  g2: ['とき・こよみ', 'ひと・いえ・まち', 'しぜん・いきもの', 'がっこう・べんきょう', 'せいかつ・ことば'],
  g3: ['その1', 'その2', 'その3', 'その4', 'その5'],
  g4: ['その1', 'その2', 'その3', 'その4', 'その5'],
  g5: ['その1', 'その2', 'その3', 'その4', 'その5'],
  g6: ['その1', 'その2', 'その3', 'その4', 'その5'],
  kana_hira: ['かんたんな長音・2択', '3文字の促音・2択', '拗音', '複合', '特殊・助詞', '長い言葉の促音・4択', '長い言葉の長音・4択'],
  kana_kata: ['かんたんな長音・2択', '3文字の促音・2択', '拗音・その他', '複合１', '複合２', '長い言葉の促音・4択', '長い言葉の長音・4択'],

};

/**
 * 指定された難易度（学年・ステージ）の漢字問題をランダムに1つ返す
 * @param {string} tier - 'kanji_g1'〜'kanji_g6' / 'kanji_g1_1'〜'kanji_g6_5'
 * @returns {Object} { answer: 'ひらがな', text: '問題文の漢字', tier: '難易度' }
 */
function generateKanjiProblem(tier) {
  const pool = KANJI_POOLS[tier] || KANJI_WORDS_G1;

  const idx = Math.floor(Math.random() * pool.length);
  const data = pool[idx];

  return {
    ...data,
    tier: tier
  };
}

if (typeof window !== 'undefined') {
  window.KANJI_POOLS = KANJI_POOLS;
  window.KANJI_STAGE_LABELS = KANJI_STAGE_LABELS;
  window.generateKanjiProblem = generateKanjiProblem;
}
