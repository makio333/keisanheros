// ==========================================
// 漢字データ＆出題ロジック (kanji_data.js)
// 学年別漢字配当表（教育漢字）に そって、1年〜6年の 漢字を 収録。
// 1つの 学年を 5つの ステージに わけている（ステージごとに ちがう 漢字が でる）。
// ボスは その学年 ぜんぶから 出題される。
//   tier の なまえ: 'kanji_g3_2' → 3年の ステージ2 ／ 'kanji_g3' → 3年 ぜんぶ
// ==========================================

/* ================= 1年（80字） ================= */
const KANJI_G1_S1 = [
  { answer: 'ひとつ', text: '一つ' }, { answer: 'ふたつ', text: '二つ' }, { answer: 'みっつ', text: '三つ' },
  { answer: 'よっつ', text: '四つ' }, { answer: 'いつつ', text: '五つ' }, { answer: 'むっつ', text: '六つ' },
  { answer: 'ななつ', text: '七つ' }, { answer: 'やっつ', text: '八つ' }, { answer: 'ここのつ', text: '九つ' },
  { answer: 'じゅう', text: '十' }, { answer: 'ひゃく', text: '百' }, { answer: 'せん', text: '千' },
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
  { answer: 'まなぶ', text: '学ぶ' }, { answer: 'がっこう', text: '学校' }, { answer: 'ぶん', text: '文' },
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
  { answer: 'ごご', text: '午後' }, { answer: 'とき', text: '時' }, { answer: 'こんしゅう', text: '今週' },
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
  { answer: 'おとうと', text: '弟' }, { answer: 'あね', text: '姉' }, { answer: 'いもうと', text: '妹' },
  { answer: 'ちち', text: '父' }, { answer: 'はは', text: '母' }, { answer: 'おや', text: '親' },
  { answer: 'ともだち', text: '友だち' }, { answer: 'じぶん', text: '自分' }, { answer: 'なに', text: '何' },
  { answer: 'いえ', text: '家' }, { answer: 'きょうしつ', text: '教室' }, { answer: 'と', text: '戸' },
  { answer: 'もん', text: '門' }, { answer: 'だい', text: '台' }, { answer: 'みせ', text: '店' },
  { answer: 'ひろば', text: '広場' }, { answer: 'かいしゃ', text: '会社' }, { answer: 'とうきょう', text: '東京' },
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
  { answer: 'ひく', text: '引く' }, { answer: 'きょうかしょ', text: '教科書' }, { answer: 'うた', text: '歌' },
  { answer: 'かいが', text: '絵画' }, { answer: 'まわる', text: '回る' }, { answer: 'あう', text: '会う' },
  { answer: 'え', text: '絵' }, { answer: 'たのしい', text: '楽しい' }, { answer: 'せいかつ', text: '生活' },
  { answer: 'あいだ', text: '間' }, { answer: 'にっき', text: '日記' }, { answer: 'かえる', text: '帰る' },
  { answer: 'つよい', text: '強い' }, { answer: 'おしえる', text: '教える' }, { answer: 'かたち', text: '形' },
  { answer: 'はかる', text: '計る' }, { answer: 'いう', text: '言う' }, { answer: 'こくご', text: '国語' },
  { answer: 'こうさく', text: '工作' }, { answer: 'こうえん', text: '公園' }, { answer: 'こうばん', text: '交番' },
  { answer: 'かんがえる', text: '考える' }, { answer: 'いく', text: '行く' }, { answer: 'ごうけい', text: '合計' },
  { answer: 'くに', text: '国' }, { answer: 'ほそい', text: '細い' }, { answer: 'つくる', text: '作る' },
  { answer: 'けいさん', text: '計算' }, { answer: 'とまる', text: '止まる' }, { answer: 'いちば', text: '市場' },
  { answer: 'や', text: '矢' }, { answer: 'きしゃ', text: '汽車' },
];
const KANJI_G2_S5 = [
  { answer: 'おもう', text: '思う' }, { answer: 'かみ', text: '紙' }, { answer: 'てら', text: '寺' },
  { answer: 'よわい', text: '弱い' }, { answer: 'かく', text: '書く' }, { answer: 'すくない', text: '少ない' },
  { answer: 'たべる', text: '食べる' }, { answer: 'としょ', text: '図書' }, { answer: 'かず', text: '数' },
  { answer: 'こえ', text: '声' }, { answer: 'きる', text: '切る' }, { answer: 'くみ', text: '組' },
  { answer: 'おおい', text: '多い' }, { answer: 'ふとい', text: '太い' }, { answer: 'しる', text: '知る' },
  { answer: 'おちゃ', text: 'お茶' }, { answer: 'てん', text: '点' }, { answer: 'でんき', text: '電気' },
  { answer: 'あたる', text: '当たる' }, { answer: 'こたえる', text: '答える' }, { answer: 'あたま', text: '頭' },
  { answer: 'おなじ', text: '同じ' }, { answer: 'みち', text: '道' }, { answer: 'よむ', text: '読む' },
  { answer: 'うる', text: '売る' }, { answer: 'かう', text: '買う' }, { answer: 'きく', text: '聞く' },
  { answer: 'いちまん', text: '一万' }, { answer: 'なく', text: '鳴く' }, { answer: 'ようし', text: '用紙' },
  { answer: 'りか', text: '理科' }, { answer: 'はなす', text: '話す' },
];

/* ================= 3年（200字） ================= */
const KANJI_G3_S1 = [
  { answer: 'わるい', text: '悪い' }, { answer: 'やすい', text: '安い' }, { answer: 'くらい', text: '暗い' },
  { answer: 'いしゃ', text: '医者' }, { answer: 'いいん', text: '委員' }, { answer: 'いけん', text: '意見' },
  { answer: 'そだてる', text: '育てる' }, { answer: 'てんいん', text: '店員' }, { answer: 'びょういん', text: '病院' },
  { answer: 'のむ', text: '飲む' }, { answer: 'はこぶ', text: '運ぶ' }, { answer: 'およぐ', text: '泳ぐ' },
  { answer: 'えき', text: '駅' }, { answer: 'ちゅうおう', text: '中央' }, { answer: 'よこ', text: '横' },
  { answer: 'やね', text: '屋根' }, { answer: 'あたたかい', text: '温かい' }, { answer: 'ばける', text: '化ける' },
  { answer: 'にもつ', text: '荷もつ' }, { answer: 'せかい', text: '世界' }, { answer: 'あける', text: '開ける' },
  { answer: 'かいだん', text: '階だん' }, { answer: 'さむい', text: '寒い' }, { answer: 'かんじる', text: '感じる' },
  { answer: 'かんじ', text: '漢字' }, { answer: 'としょかん', text: '図書館' }, { answer: 'きし', text: '岸' },
  { answer: 'おきる', text: '起きる' }, { answer: 'がっき', text: '学期' }, { answer: 'きゃく', text: '客' },
  { answer: 'けんきゅう', text: '研究' }, { answer: 'いそぐ', text: '急ぐ' }, { answer: 'がっきゅう', text: '学級' },
  { answer: 'おみや', text: 'お宮' }, { answer: 'やきゅう', text: '野球' }, { answer: 'きょねん', text: '去年' },
  { answer: 'はし', text: '橋' }, { answer: 'さぎょう', text: '作業' }, { answer: 'まがる', text: '曲がる' },
  { answer: 'ゆうびんきょく', text: 'ゆうびん局' },
];
const KANJI_G3_S2 = [
  { answer: 'ぎん', text: '銀' }, { answer: 'く', text: '区' }, { answer: 'くるしい', text: '苦しい' },
  { answer: 'どうぐ', text: '道具' }, { answer: 'きみ', text: '君' }, { answer: 'かかり', text: '係' },
  { answer: 'かるい', text: '軽い' }, { answer: 'ち', text: '血' }, { answer: 'きめる', text: '決める' },
  { answer: 'けんきゅうじょ', text: '研究所' }, { answer: 'けん', text: '県' }, { answer: 'しゃこ', text: '車庫' },
  { answer: 'みずうみ', text: '湖' }, { answer: 'むく', text: '向く' }, { answer: 'しあわせ', text: '幸せ' },
  { answer: 'みなと', text: '港' }, { answer: 'ばんごう', text: '番号' }, { answer: 'ね', text: '根' },
  { answer: 'まつり', text: '祭り' }, { answer: 'さら', text: '皿' }, { answer: 'しごと', text: '仕事' },
  { answer: 'しぬ', text: '死ぬ' }, { answer: 'つかう', text: '使う' }, { answer: 'はじまる', text: '始まる' },
  { answer: 'ゆび', text: '指' }, { answer: 'は', text: '歯' }, { answer: 'し', text: '詩' },
  { answer: 'つぎ', text: '次' }, { answer: 'できごと', text: '出来事' }, { answer: 'もつ', text: '持つ' },
  { answer: 'しき', text: '式' }, { answer: 'み', text: '実' }, { answer: 'うつす', text: '写す' },
  { answer: 'さくしゃ', text: '作者' }, { answer: 'しゅじん', text: '主人' }, { answer: 'まもる', text: '守る' },
  { answer: 'とる', text: '取る' }, { answer: 'さけ', text: '酒' }, { answer: 'うける', text: '受ける' },
  { answer: 'しゅう', text: '州' },
];
const KANJI_G3_S3 = [
  { answer: 'ひろう', text: '拾う' }, { answer: 'おわる', text: '終わる' }, { answer: 'ならう', text: '習う' },
  { answer: 'あつめる', text: '集める' }, { answer: 'すむ', text: '住む' }, { answer: 'おもい', text: '重い' },
  { answer: 'しゅくだい', text: '宿題' }, { answer: 'ところ', text: '所' }, { answer: 'あつい', text: '暑い' },
  { answer: 'たすける', text: '助ける' }, { answer: 'しょうわ', text: '昭和' }, { answer: 'けす', text: '消す' },
  { answer: 'しょうてん', text: '商店' }, { answer: 'ぶんしょう', text: '文章' }, { answer: 'かつ', text: '勝つ' },
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
  { answer: 'ちょうめ', text: '丁目' }, { answer: 'てちょう', text: '手帳' }, { answer: 'しらべる', text: '調べる' },
  { answer: 'おう', text: '追う' }, { answer: 'さだめる', text: '定める' }, { answer: 'にわ', text: '庭' },
  { answer: 'ふえ', text: '笛' }, { answer: 'てつ', text: '鉄' }, { answer: 'ころがる', text: '転がる' },
  { answer: 'とかい', text: '都会' }, { answer: 'いちど', text: '一度' }, { answer: 'なげる', text: '投げる' },
  { answer: 'まめ', text: '豆' }, { answer: 'しま', text: '島' }, { answer: 'ゆ', text: '湯' },
  { answer: 'のぼる', text: '登る' }, { answer: 'ひとしい', text: '等しい' }, { answer: 'うごく', text: '動く' },
  { answer: 'どうわ', text: '童話' }, { answer: 'のうか', text: '農家' }, { answer: 'なみ', text: '波' },
  { answer: 'くばる', text: '配る' }, { answer: 'にばい', text: '二倍' }, { answer: 'はこ', text: '箱' },
  { answer: 'はたけ', text: '畑' }, { answer: 'はっぴょう', text: '発表' }, { answer: 'はんたい', text: '反対' },
  { answer: 'さか', text: '坂' }, { answer: 'いた', text: '板' }, { answer: 'かわ', text: '皮' },
  { answer: 'かなしい', text: '悲しい' }, { answer: 'うつくしい', text: '美しい' }, { answer: 'はな', text: '鼻' },
  { answer: 'ふで', text: '筆' },
];
const KANJI_G3_S5 = [
  { answer: 'こおり', text: '氷' }, { answer: 'あらわす', text: '表す' }, { answer: 'いちびょう', text: '一秒' },
  { answer: 'びょうき', text: '病気' }, { answer: 'しなもの', text: '品もの' }, { answer: 'まける', text: '負ける' },
  { answer: 'へや', text: '部屋' }, { answer: 'ふく', text: '服' }, { answer: 'こうふく', text: '幸福' },
  { answer: 'もの', text: '物' }, { answer: 'たいら', text: '平ら' }, { answer: 'かえす', text: '返す' },
  { answer: 'べんきょう', text: '勉強' }, { answer: 'はなす', text: '放す' }, { answer: 'あじ', text: '味' },
  { answer: 'いのち', text: '命' }, { answer: 'がめん', text: '画面' }, { answer: 'とう', text: '問う' },
  { answer: 'やくめ', text: '役目' }, { answer: 'くすり', text: '薬' }, { answer: 'りゆう', text: '理由' },
  { answer: 'あぶら', text: '油' }, { answer: 'ある', text: '有る' }, { answer: 'あそぶ', text: '遊ぶ' },
  { answer: 'よてい', text: '予定' }, { answer: 'ひつじ', text: '羊' }, { answer: 'ようふく', text: '洋服' },
  { answer: 'は', text: '葉' }, { answer: 'たいよう', text: '太陽' }, { answer: 'おうさま', text: '王様' },
  { answer: 'おちる', text: '落ちる' }, { answer: 'ながれる', text: '流れる' }, { answer: 'たび', text: '旅' },
  { answer: 'りょうて', text: '両手' }, { answer: 'みどり', text: '緑' }, { answer: 'おれい', text: 'お礼' },
  { answer: 'ぎょうれつ', text: '行列' }, { answer: 'れんしゅう', text: '練習' }, { answer: 'どうろ', text: '道路' },
  { answer: 'へいわ', text: '平和' },
];

/* ================= 4年 ================= */
const KANJI_G4_S1 = [
  { answer: 'あいする', text: '愛する' }, { answer: 'あんない', text: '案内' }, { answer: 'いじょう', text: '以上' },
  { answer: 'ころも', text: '衣' }, { answer: 'いちい', text: '一位' }, { answer: 'かこむ', text: '囲む' },
  { answer: 'い', text: '胃' }, { answer: 'めじるし', text: '目印' }, { answer: 'えいご', text: '英語' },
  { answer: 'さかえる', text: '栄える' }, { answer: 'しお', text: '塩' }, { answer: 'いちおく', text: '一億' },
  { answer: 'くわえる', text: '加える' }, { answer: 'くだもの', text: '果物' }, { answer: 'かもつ', text: '貨物' },
  { answer: 'かだい', text: '課題' }, { answer: 'め', text: '芽' }, { answer: 'あらためる', text: '改める' },
  { answer: 'きかい', text: '機械' }, { answer: 'がいちゅう', text: '害虫' }, { answer: 'まち', text: '街' },
  { answer: 'かくじ', text: '各自' }, { answer: 'おぼえる', text: '覚える' }, { answer: 'にいがた', text: '新潟' },
  { answer: 'かんせい', text: '完成' }, { answer: 'かん', text: '官' }, { answer: 'くだ', text: '管' },
  { answer: 'かんけい', text: '関係' }, { answer: 'かんこう', text: '観光' }, { answer: 'ねがう', text: '願う' },
  { answer: 'ぎふ', text: '岐阜' }, { answer: 'きぼう', text: '希望' }, { answer: 'きせつ', text: '季節' },
  { answer: 'せいき', text: '世紀' }, { answer: 'はた', text: '旗' }, { answer: 'しょっき', text: '食器' },
  { answer: 'ひこうき', text: '飛行機' }, { answer: 'かいぎ', text: '会議' }, { answer: 'もとめる', text: '求める' },
  { answer: 'なく', text: '泣く' }, { answer: 'すくう', text: '救う' },
];
const KANJI_G4_S2 = [
  { answer: 'きゅうしょく', text: '給食' }, { answer: 'あげる', text: '挙げる' }, { answer: 'ぎょぎょう', text: '漁業' },
  { answer: 'ともに', text: '共に' }, { answer: 'きょうりょく', text: '協力' }, { answer: 'かがみ', text: '鏡' },
  { answer: 'きょうそう', text: '競走' }, { answer: 'ほっきょく', text: '北極' }, { answer: 'くま', text: '熊' },
  { answer: 'くんれん', text: '訓練' }, { answer: 'ぐんたい', text: '軍隊' }, { answer: 'ぐん', text: '郡' },
  { answer: 'むれ', text: '群れ' }, { answer: 'ちょっけい', text: '直径' }, { answer: 'けしき', text: '景色' },
  { answer: 'げい', text: '芸' }, { answer: 'かける', text: '欠ける' }, { answer: 'むすぶ', text: '結ぶ' },
  { answer: 'たてる', text: '建てる' }, { answer: 'けんこう', text: '健康' }, { answer: 'じっけん', text: '実験' },
  { answer: 'かたい', text: '固い' }, { answer: 'せいこう', text: '成功' }, { answer: 'すき', text: '好き' },
  { answer: 'かおり', text: '香り' }, { answer: 'てんこう', text: '天候' }, { answer: 'さが', text: '佐賀' },
  { answer: 'さす', text: '差す' }, { answer: 'やさい', text: '野菜' }, { answer: 'もっとも', text: '最も' },
  { answer: 'さいたま', text: '埼玉' }, { answer: 'もくざい', text: '木材' }, { answer: 'ながさき', text: '長崎' },
  { answer: 'きのう', text: '昨日' }, { answer: 'ふだ', text: '札' }, { answer: 'いんさつ', text: '印刷' },
  { answer: 'かんさつ', text: '観察' }, { answer: 'さんか', text: '参加' }, { answer: 'せいさん', text: '生産' },
];
const KANJI_G4_S3 = [
  { answer: 'ちる', text: '散る' }, { answer: 'のこる', text: '残る' }, { answer: 'しめい', text: '氏名' },
  { answer: 'しかい', text: '司会' }, { answer: 'ためす', text: '試す' }, { answer: 'じどう', text: '児童' },
  { answer: 'なおる', text: '治る' }, { answer: 'しが', text: '滋賀' }, { answer: 'じしょ', text: '辞書' },
  { answer: 'しか', text: '鹿' }, { answer: 'うしなう', text: '失う' }, { answer: 'かりる', text: '借りる' },
  { answer: 'たね', text: '種' }, { answer: 'まわり', text: '周り' }, { answer: 'いわう', text: '祝う' },
  { answer: 'じゅんばん', text: '順番' }, { answer: 'はじめ', text: '初め' }, { answer: 'まつ', text: '松' },
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
  { answer: 'そつぎょう', text: '卒業' }, { answer: 'まご', text: '孫' }, { answer: 'おび', text: '帯' },
  { answer: 'たい', text: '隊' }, { answer: 'ともだち', text: '友達' }, { answer: 'たんご', text: '単語' },
  { answer: 'おく', text: '置く' }, { answer: 'なか', text: '仲' }, { answer: 'おき', text: '沖' },
  { answer: 'いっちょう', text: '一兆' }, { answer: 'ひくい', text: '低い' }, { answer: 'そこ', text: '底' },
  { answer: 'まと', text: '的' }, { answer: 'じてん', text: '辞典' }, { answer: 'つたえる', text: '伝える' },
  { answer: 'せいと', text: '生徒' }, { answer: 'つとめる', text: '努める' }, { answer: 'でんとう', text: '電灯' },
  { answer: 'はたらく', text: '働く' }, { answer: 'とくに', text: '特に' }, { answer: 'とくしま', text: '徳島' },
  { answer: 'とちぎ', text: '栃木' }, { answer: 'なら', text: '奈良' }, { answer: 'やまなし', text: '山梨' },
  { answer: 'あつい', text: '熱い' }, { answer: 'きねん', text: '記念' }, { answer: 'やぶれる', text: '敗れる' },
  { answer: 'うめ', text: '梅' }, { answer: 'はくぶつかん', text: '博物館' }, { answer: 'おおさか', text: '大阪' },
  { answer: 'ごはん', text: 'ご飯' }, { answer: 'とぶ', text: '飛ぶ' }, { answer: 'かならず', text: '必ず' },
  { answer: 'とうひょう', text: '投票' },
];
const KANJI_G4_S5 = [
  { answer: 'もくひょう', text: '目標' }, { answer: 'ふしぎ', text: '不思議' }, { answer: 'くふう', text: '工夫' },
  { answer: 'つける', text: '付ける' }, { answer: 'ふ', text: '府' }, { answer: 'ふじさん', text: '富士山' },
  { answer: 'ふくかいちょう', text: '副会長' }, { answer: 'へいたい', text: '兵隊' }, { answer: 'わかれる', text: '別れる' },
  { answer: 'あたり', text: '辺り' }, { answer: 'かわる', text: '変わる' }, { answer: 'たより', text: '便り' },
  { answer: 'つつむ', text: '包む' }, { answer: 'ほうほう', text: '方法' }, { answer: 'のぞむ', text: '望む' },
  { answer: 'ぼくじょう', text: '牧場' }, { answer: 'しゅうまつ', text: '週末' }, { answer: 'みちる', text: '満ちる' },
  { answer: 'みらい', text: '未来' }, { answer: 'こくみん', text: '国民' }, { answer: 'ない', text: '無い' },
  { answer: 'やくそく', text: '約そく' }, { answer: 'ゆうき', text: '勇気' }, { answer: 'いる', text: '要る' },
  { answer: 'やしなう', text: '養う' }, { answer: 'あびる', text: '浴びる' }, { answer: 'りよう', text: '利用' },
  { answer: 'りく', text: '陸' }, { answer: 'よい', text: '良い' }, { answer: 'ざいりょう', text: '材料' },
  { answer: 'はかる', text: '量る' }, { answer: 'わ', text: '輪' }, { answer: 'しゅるい', text: '種類' },
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
  { answer: 'さくら', text: '桜' }, { answer: 'おんじん', text: '恩人' }, { answer: 'きょか', text: '許可' },
  { answer: 'かり', text: '仮' }, { answer: 'ていか', text: '定価' }, { answer: 'かせん', text: '河川' },
  { answer: 'すぎる', text: '過ぎる' }, { answer: 'こころよい', text: '快い' }, { answer: 'とく', text: '解く' },
  { answer: 'ごうかく', text: '合格' }, { answer: 'たしかめる', text: '確かめる' }, { answer: 'きんがく', text: '金額' },
  { answer: 'しゅうかん', text: '週刊' }, { answer: 'みき', text: '幹' }, { answer: 'なれる', text: '慣れる' },
  { answer: 'めがね', text: '眼鏡' }, { answer: 'きほん', text: '基本' }, { answer: 'よる', text: '寄る' },
  { answer: 'きそく', text: '規則' }, { answer: 'わざ', text: '技' }, { answer: 'せいぎ', text: '正義' },
  { answer: 'ぎゃく', text: '逆' }, { answer: 'ひさしぶり', text: '久しぶり' }, { answer: 'きゅうしき', text: '旧式' },
  { answer: 'いる', text: '居る' }, { answer: 'ゆるす', text: '許す' }, { answer: 'さかい', text: '境' },
];
const KANJI_G5_S2 = [
  { answer: 'へいきん', text: '平均' }, { answer: 'きんし', text: '禁止' }, { answer: 'もんく', text: '文句' },
  { answer: 'けいけん', text: '経験' }, { answer: 'せいけつ', text: '清潔' }, { answer: 'じけん', text: '事件' },
  { answer: 'けん', text: '券' }, { answer: 'ほけん', text: '保険' }, { answer: 'けんさ', text: '検査' },
  { answer: 'かぎる', text: '限る' }, { answer: 'あらわれる', text: '現れる' }, { answer: 'へる', text: '減る' },
  { answer: 'じこ', text: '事故' }, { answer: 'いっこ', text: '一個' }, { answer: 'ほご', text: '保護' },
  { answer: 'きく', text: '効く' }, { answer: 'あつい', text: '厚い' }, { answer: 'たがやす', text: '耕す' },
  { answer: 'こうかい', text: '航海' }, { answer: 'こうざん', text: '鉱山' }, { answer: 'かまえる', text: '構える' },
  { answer: 'きょうみ', text: '興味' }, { answer: 'こうぎ', text: '講義' }, { answer: 'つげる', text: '告げる' },
  { answer: 'まぜる', text: '混ぜる' }, { answer: 'ちょうさ', text: '調査' }, { answer: 'ふたたび', text: '再び' },
  { answer: 'さいがい', text: '災害' }, { answer: 'つま', text: '妻' }, { answer: 'とる', text: '採る' },
  { answer: 'こくさい', text: '国際' }, { answer: 'げんざい', text: '現在' }, { answer: 'ざいさん', text: '財産' },
  { answer: 'つみ', text: '罪' }, { answer: 'ころす', text: '殺す' }, { answer: 'ざっそう', text: '雑草' },
  { answer: 'さんそ', text: '酸素' }, { answer: 'さんせい', text: '賛成' }, { answer: 'はかせ', text: '博士' },
];
const KANJI_G5_S3 = [
  { answer: 'れきし', text: '歴史' }, { answer: 'ささえる', text: '支える' }, { answer: 'こころざし', text: '志' },
  { answer: 'えだ', text: '枝' }, { answer: 'きょうし', text: '教師' }, { answer: 'しりょう', text: '資料' },
  { answer: 'かう', text: '飼う' }, { answer: 'しめす', text: '示す' }, { answer: 'にる', text: '似る' },
  { answer: 'ちしき', text: '知識' }, { answer: 'しつもん', text: '質問' }, { answer: 'こうしゃ', text: '校舎' },
  { answer: 'あやまる', text: '謝る' }, { answer: 'じゅぎょう', text: '授業' }, { answer: 'しゅうり', text: '修理' },
  { answer: 'のべる', text: '述べる' }, { answer: 'しゅじゅつ', text: '手術' }, { answer: 'じゅんび', text: '準備' },
  { answer: 'じゅんじょ', text: '順序' }, { answer: 'まねく', text: '招く' }, { answer: 'しょうち', text: '承知' },
  { answer: 'しょうめい', text: '証明' }, { answer: 'じょうけん', text: '条件' }, { answer: 'しょうじょう', text: '賞状' },
  { answer: 'にちじょう', text: '日常' }, { answer: 'ひょうじょう', text: '表情' }, { answer: 'おる', text: '織る' },
  { answer: 'しょくぎょう', text: '職業' }, { answer: 'せいふく', text: '制服' }, { answer: 'せいかく', text: '性格' },
  { answer: 'せいじ', text: '政治' }, { answer: 'いきおい', text: '勢い' }, { answer: 'せいしん', text: '精神' },
  { answer: 'せいひん', text: '製品' }, { answer: 'ぜいきん', text: '税金' }, { answer: 'せめる', text: '責める' },
  { answer: 'せいせき', text: '成績' }, { answer: 'ちょくせつ', text: '直接' }, { answer: 'もうける', text: '設ける' },
];
const KANJI_G5_S4 = [
  { answer: 'たえる', text: '絶える' }, { answer: 'そふ', text: '祖父' }, { answer: 'すなお', text: '素直' },
  { answer: 'そうごう', text: '総合' }, { answer: 'つくる', text: '造る' }, { answer: 'どうぞう', text: '銅像' },
  { answer: 'ふえる', text: '増える' }, { answer: 'げんそく', text: '原則' }, { answer: 'はかる', text: '測る' },
  { answer: 'きんぞく', text: '金属' }, { answer: 'かくりつ', text: '確率' }, { answer: 'そんする', text: '損する' },
  { answer: 'しりぞく', text: '退く' }, { answer: 'かす', text: '貸す' }, { answer: 'たいど', text: '態度' },
  { answer: 'だんたい', text: '団体' }, { answer: 'ことわる', text: '断る' }, { answer: 'きずく', text: '築く' },
  { answer: 'ためる', text: '貯める' }, { answer: 'はる', text: '張る' }, { answer: 'ていしゃ', text: '停車' },
  { answer: 'ていしゅつ', text: '提出' }, { answer: 'ていど', text: '程度' }, { answer: 'てきする', text: '適する' },
  { answer: 'てき', text: '敵' }, { answer: 'でんとう', text: '伝統' }, { answer: 'どう', text: '銅' },
  { answer: 'みちびく', text: '導く' }, { answer: 'ひとり', text: '独り' }, { answer: 'まかせる', text: '任せる' },
  { answer: 'もえる', text: '燃える' }, { answer: 'のうりょく', text: '能力' }, { answer: 'やぶる', text: '破る' },
  { answer: 'はんにん', text: '犯人' }, { answer: 'はんだん', text: '判断' }, { answer: 'しゅっぱん', text: '出版' },
  { answer: 'くらべる', text: '比べる' }, { answer: 'こえる', text: '肥える' },
];
const KANJI_G5_S5 = [
  { answer: 'ひじょう', text: '非常' }, { answer: 'ひよう', text: '費用' }, { answer: 'そなえる', text: '備える' },
  { answer: 'ひょうばん', text: '評判' }, { answer: 'まずしい', text: '貧しい' }, { answer: 'ぬの', text: '布' },
  { answer: 'ふうふ', text: '夫婦' }, { answer: 'ぶし', text: '武士' }, { answer: 'ふくしゅう', text: '復習' },
  { answer: 'ふくざつ', text: '複雑' }, { answer: 'ほとけ', text: '仏' }, { answer: 'こな', text: '粉' },
  { answer: 'あむ', text: '編む' }, { answer: 'べんとう', text: '弁当' }, { answer: 'たもつ', text: '保つ' },
  { answer: 'はか', text: '墓' }, { answer: 'しらせ', text: '報せ' }, { answer: 'ゆたか', text: '豊か' },
  { answer: 'ふせぐ', text: '防ぐ' }, { answer: 'ぼうえき', text: '貿易' }, { answer: 'あばれる', text: '暴れる' },
  { answer: 'みゃく', text: '脈' }, { answer: 'つとめる', text: '務める' }, { answer: 'ゆめ', text: '夢' },
  { answer: 'まよう', text: '迷う' }, { answer: 'わた', text: '綿' }, { answer: 'ゆにゅう', text: '輸入' },
  { answer: 'あまる', text: '余る' }, { answer: 'あずける', text: '預ける' }, { answer: 'ないよう', text: '内容' },
  { answer: 'しょうりゃく', text: '省略' }, { answer: 'とめる', text: '留める' }, { answer: 'だいとうりょう', text: '大統領' },
  { answer: 'れきだい', text: '歴代' }, { answer: 'しょうひん', text: '賞品' }, { answer: 'ぞう', text: '象' },
  { answer: 'ぜに', text: '銭' }, { answer: 'おおがた', text: '大型' },
];

/* ================= 6年 ================= */
const KANJI_G6_S1 = [
  { answer: 'ことなる', text: '異なる' }, { answer: 'いさん', text: '遺産' }, { answer: 'ちいき', text: '地域' },
  { answer: 'うちゅう', text: '宇宙' }, { answer: 'うつる', text: '映る' }, { answer: 'のびる', text: '延びる' },
  { answer: 'そう', text: '沿う' }, { answer: 'われ', text: '我' }, { answer: 'はい', text: '灰' },
  { answer: 'かくだい', text: '拡大' }, { answer: 'かくめい', text: '革命' }, { answer: 'ないかく', text: '内閣' },
  { answer: 'わる', text: '割る' }, { answer: 'かぶ', text: '株' }, { answer: 'ほす', text: '干す' },
  { answer: 'まく', text: '巻く' }, { answer: 'かんご', text: '看護' }, { answer: 'かんたん', text: '簡単' },
  { answer: 'あぶない', text: '危ない' }, { answer: 'つくえ', text: '机' }, { answer: 'しき', text: '指揮' },
  { answer: 'きちょう', text: '貴重' }, { answer: 'うたがう', text: '疑う' }, { answer: 'すう', text: '吸う' },
  { answer: 'そなえる', text: '供える' }, { answer: 'むね', text: '胸' }, { answer: 'こきょう', text: '故郷' },
  { answer: 'つとめる', text: '勤める' }, { answer: 'すじ', text: '筋' }, { answer: 'たいようけい', text: '太陽系' },
  { answer: 'うやまう', text: '敬う' }, { answer: 'けいさつ', text: '警察' }, { answer: 'げき', text: '劇' },
  { answer: 'はげしい', text: '激しい' }, { answer: 'あな', text: '穴' }, { answer: 'きぬ', text: '絹' },
  { answer: 'けんり', text: '権利' }, { answer: 'けんぽう', text: '憲法' },
];
const KANJI_G6_S2 = [
  { answer: 'みなもと', text: '源' }, { answer: 'きびしい', text: '厳しい' }, { answer: 'じこ', text: '自己' },
  { answer: 'よぶ', text: '呼ぶ' }, { answer: 'あやまる', text: '誤る' }, { answer: 'こうごう', text: '皇后' },
  { answer: 'こうこう', text: '孝行' }, { answer: 'てんのう', text: '天皇' }, { answer: 'こうちゃ', text: '紅茶' },
  { answer: 'おりる', text: '降りる' }, { answer: 'てっこう', text: '鉄鋼' }, { answer: 'きざむ', text: '刻む' },
  { answer: 'こくもつ', text: '穀物' }, { answer: 'ほね', text: '骨' }, { answer: 'こまる', text: '困る' },
  { answer: 'すな', text: '砂' }, { answer: 'すわる', text: '座る' }, { answer: 'すませる', text: '済ませる' },
  { answer: 'さいばん', text: '裁判' }, { answer: 'たいさく', text: '対策' }, { answer: 'いっさつ', text: '一冊' },
  { answer: 'かいこ', text: '蚕' }, { answer: 'いたる', text: '至る' }, { answer: 'わたし', text: '私' },
  { answer: 'すがた', text: '姿' }, { answer: 'しりょく', text: '視力' }, { answer: 'かし', text: '歌詞' },
  { answer: 'ざっし', text: '雑誌' }, { answer: 'じしゃく', text: '磁石' }, { answer: 'いる', text: '射る' },
  { answer: 'すてる', text: '捨てる' }, { answer: 'しゃく', text: '尺' }, { answer: 'わかい', text: '若い' },
  { answer: 'じゅもく', text: '樹木' }, { answer: 'おさめる', text: '収める' }, { answer: 'しゅうきょう', text: '宗教' },
  { answer: 'しゅうしょく', text: '就職' }, { answer: 'たいしゅう', text: '大衆' },
];
const KANJI_G6_S3 = [
  { answer: 'したがう', text: '従う' }, { answer: 'たて', text: '縦' }, { answer: 'ちぢむ', text: '縮む' },
  { answer: 'じゅくご', text: '熟語' }, { answer: 'たんじゅん', text: '単純' }, { answer: 'しょり', text: '処理' },
  { answer: 'しょうぼうしょ', text: '消防署' }, { answer: 'しょとう', text: '諸島' }, { answer: 'のぞく', text: '除く' },
  { answer: 'しょうらい', text: '将来' }, { answer: 'きず', text: '傷' }, { answer: 'こしょう', text: '故障' },
  { answer: 'むす', text: '蒸す' }, { answer: 'はり', text: '針' }, { answer: 'じん', text: '仁' },
  { answer: 'たれる', text: '垂れる' }, { answer: 'すいり', text: '推理' }, { answer: 'すん', text: '寸' },
  { answer: 'もる', text: '盛る' }, { answer: 'せいなる', text: '聖なる' }, { answer: 'せいじつ', text: '誠実' },
  { answer: 'した', text: '舌' }, { answer: 'せんげん', text: '宣言' }, { answer: 'せんもん', text: '専門' },
  { answer: 'いずみ', text: '泉' }, { answer: 'あらう', text: '洗う' }, { answer: 'そめる', text: '染める' },
  { answer: 'よい', text: '善い' }, { answer: 'えんそう', text: '演奏' }, { answer: 'まど', text: '窓' },
  { answer: 'そうさく', text: '創作' }, { answer: 'ふくそう', text: '服装' }, { answer: 'ちそう', text: '地層' },
  { answer: 'たいそう', text: '体操' }, { answer: 'れいぞうこ', text: '冷蔵庫' }, { answer: 'しんぞう', text: '心臓' },
  { answer: 'いちょう', text: '胃腸' },
];
const KANJI_G6_S4 = [
  { answer: 'そんざい', text: '存在' }, { answer: 'とうとい', text: '尊い' }, { answer: 'じたく', text: '自宅' },
  { answer: 'たんとう', text: '担当' }, { answer: 'さがす', text: '探す' }, { answer: 'たんじょうび', text: '誕生日' },
  { answer: 'かいだん', text: '階段' }, { answer: 'あたたかい', text: '暖かい' }, { answer: 'ねだん', text: '値段' },
  { answer: 'ちゅうがえり', text: '宙がえり' }, { answer: 'ちゅうじつ', text: '忠実' }, { answer: 'ちょしゃ', text: '著者' },
  { answer: 'けんちょう', text: '県庁' }, { answer: 'ちょうじょう', text: '頂上' }, { answer: 'しお', text: '潮' },
  { answer: 'やちん', text: '家賃' }, { answer: 'いたい', text: '痛い' }, { answer: 'はってん', text: '発展' },
  { answer: 'とうろん', text: '討論' }, { answer: 'せいとう', text: '政党' }, { answer: 'さとう', text: '砂糖' },
  { answer: 'とどく', text: '届く' }, { answer: 'むずかしい', text: '難しい' }, { answer: 'ぎゅうにゅう', text: '牛乳' },
  { answer: 'みとめる', text: '認める' }, { answer: 'おさめる', text: '納める' }, { answer: 'ずのう', text: '頭脳' },
  { answer: 'りっぱ', text: '立派' }, { answer: 'おがむ', text: '拝む' }, { answer: 'せなか', text: '背中' },
  { answer: 'はい', text: '肺' }, { answer: 'はいく', text: '俳句' }, { answer: 'はんちょう', text: '班長' },
  { answer: 'こんばん', text: '今晩' }, { answer: 'ひてい', text: '否定' }, { answer: 'ひはん', text: '批判' },
];
const KANJI_G6_S5 = [
  { answer: 'ひみつ', text: '秘密' }, { answer: 'どひょう', text: '土俵' }, { answer: 'はら', text: '腹' },
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
    answer: data.answer,
    text: data.text,
    tier: tier
  };
}

if (typeof window !== 'undefined') {
  window.KANJI_POOLS = KANJI_POOLS;
  window.KANJI_STAGE_LABELS = KANJI_STAGE_LABELS;
  window.generateKanjiProblem = generateKanjiProblem;
}
