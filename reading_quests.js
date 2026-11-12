// Original RPG reading quests. Review bank only: no save/reward/progression changes.
export const READING_QUEST_GRADES = [
  {
    "grade": 1,
    "title": "事実の抜き出し",
    "goal": "だれ・なに・どこ・いつを見つける"
  },
  {
    "grade": 2,
    "title": "理由と順序",
    "goal": "理由や手順を表す言葉を手がかりにする"
  },
  {
    "grade": 3,
    "title": "指示語",
    "goal": "これ・それ・そこが指す内容をたどる"
  },
  {
    "grade": 4,
    "title": "接続詞と心情",
    "goal": "状況や気持ちの変化を読み取る"
  },
  {
    "grade": 5,
    "title": "条件整理と要約",
    "goal": "複数の条件や文章全体の目的を整理する"
  },
  {
    "grade": 6,
    "title": "意図と論理",
    "goal": "証拠と条件から矛盾や本当の目的を考える"
  }
];
export const READING_QUESTS = [
  {
    "id": "reading-g1-01",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "まいごのこねこ",
    "npc": "むらびと",
    "passage": "こねこは、いどの そばに いました。",
    "question": "こねこが いたのは、なにの そばだった？ 2もじだったと おもうんだけどなぁ。",
    "answer": "いど",
    "acceptedAnswers": [
      "いど"
    ],
    "evidence": "いどの そば",
    "explanation": "「いどの そば」と かいてあるね。",
    "dialogueSpeaker": "npc",
    "extraction": {
      "sourceText": "いど",
      "characterCount": 2,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": ""
  },
  {
    "id": "reading-g1-02",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "おとしもののかさ",
    "npc": "みはり",
    "passage": "もんの まえに、あかい かさが おちて いました。",
    "question": "かさは、なにいろ だった？",
    "answer": "あか",
    "acceptedAnswers": [
      "あか"
    ],
    "evidence": "あかい かさ",
    "explanation": "「あかい」から、いろは「あか」だね。"
  },
  {
    "id": "reading-g1-03",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "パンをかったひと",
    "npc": "パンや",
    "passage": "りすが、パンを かいました。うさぎは、みずを のみました。",
    "question": "パンを かったのは、だれだろう。2もじの あのこかな？",
    "answer": "りす",
    "acceptedAnswers": [
      "りす"
    ],
    "evidence": "りすが、パンを かいました",
    "explanation": "パンを かったのは、りすだよ。",
    "dialogueSpeaker": "self",
    "extraction": {
      "sourceText": "りす",
      "characterCount": 2,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": "すこし さきで、ひとりで つぎの てがみを ひらいた。"
  },
  {
    "id": "reading-g1-04",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "ほしのかぎ",
    "npc": "ようせい",
    "passage": "ようせいが、ほしの かぎを みつけました。",
    "question": "ようせいが みつけたのは、ほしの なに？",
    "answer": "かぎ",
    "acceptedAnswers": [
      "かぎ"
    ],
    "evidence": "ほしの かぎ",
    "explanation": "みつけた ものは、かぎだね。"
  },
  {
    "id": "reading-g1-05",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "たびだちのじかん",
    "npc": "ふねのひと",
    "passage": "ふねは、あさに でます。よるは、みなとに とまります。",
    "question": "ふねが でるのは、いつ？",
    "answer": "あさ",
    "acceptedAnswers": [
      "あさ"
    ],
    "evidence": "ふねは、あさに でます",
    "explanation": "「でます」の まえに「あさ」と かいてあるね。"
  },
  {
    "id": "reading-g1-06",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "きのみのおくりもの",
    "npc": "うさぎ",
    "passage": "くまが、きのみを くれました。きのみは、かごに はいって いました。",
    "question": "きのみを くれたのは、だれ？",
    "answer": "くま",
    "acceptedAnswers": [
      "くま"
    ],
    "evidence": "くまが、きのみを くれました",
    "explanation": "くれた ひとは、くまだね。"
  },
  {
    "id": "reading-g1-07",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "まほうのおと",
    "npc": "まほうつかい",
    "passage": "もりの おくで、すずが なりました。",
    "question": "もりの おくで、なにが なった？",
    "answer": "すず",
    "acceptedAnswers": [
      "すず"
    ],
    "evidence": "すずが なりました",
    "explanation": "おとを だしたのは、すずだよ。"
  },
  {
    "id": "reading-g1-08",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "はこびもの",
    "npc": "どうぐや",
    "passage": "ろばが、はこを はこびました。",
    "question": "ろばは、なにを はこんだ？",
    "answer": "はこ",
    "acceptedAnswers": [
      "はこ"
    ],
    "evidence": "はこを はこびました",
    "explanation": "はこんだ ものは、はこだね。"
  },
  {
    "id": "reading-g1-09",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "はたのしるし",
    "npc": "きし",
    "passage": "おしろの はたは、しろい いろです。",
    "question": "はたは、なにいろ？",
    "answer": "しろ",
    "acceptedAnswers": [
      "しろ"
    ],
    "evidence": "しろい いろ",
    "explanation": "「しろい」から、いろは「しろ」だね。"
  },
  {
    "id": "reading-g1-10",
    "grade": 1,
    "skill": "事実の抜き出し",
    "title": "おまつりのばしょ",
    "npc": "むらびと",
    "passage": "きょうは、ひろばで おまつりを します。",
    "question": "おまつりを するのは、どこ？",
    "answer": "ひろば",
    "acceptedAnswers": [
      "ひろば"
    ],
    "evidence": "ひろばで おまつり",
    "explanation": "ばしょは、ひろばだよ。"
  },
  {
    "id": "reading-g2-01",
    "grade": 2,
    "skill": "理由と順序",
    "title": "しおれた草",
    "npc": "薬屋",
    "passage": "まほうの草が、しおれてしまいました。水をあげなかったからです。",
    "question": "草がしおれたのは、何をしなかったから？",
    "answer": "水をあげなかった",
    "acceptedAnswers": [
      "水をあげなかった",
      "みずをあげなかった",
      "水をあげなかったから",
      "みずをあげなかったから"
    ],
    "evidence": "水をあげなかったから",
    "explanation": "「から」の前に、しおれた理由が書いてあります。"
  },
  {
    "id": "reading-g2-02",
    "grade": 2,
    "skill": "理由と順序",
    "title": "薬の作り方",
    "npc": "薬屋",
    "passage": "はじめに、葉をあらいます。つぎに、なべに入れます。さいごに、水を入れてにます。",
    "question": "いちばんはじめに、何をする？",
    "answer": "葉をあらう",
    "acceptedAnswers": [
      "葉をあらう",
      "はをあらう",
      "葉をあらいます",
      "はをあらいます"
    ],
    "evidence": "はじめに、葉をあらいます",
    "explanation": "「はじめに」が、最初の手順の目じるしです。"
  },
  {
    "id": "reading-g2-03",
    "grade": 2,
    "skill": "理由と順序",
    "title": "橋をわたれない理由",
    "npc": "旅人",
    "passage": "旅人は、川の前でとまっています。橋がこわれたからです。",
    "question": "旅人がとまっているのは、どうして？",
    "answer": "橋がこわれた",
    "acceptedAnswers": [
      "橋がこわれた",
      "はしがこわれた",
      "橋がこわれたから",
      "はしがこわれたから"
    ],
    "evidence": "橋がこわれたから",
    "explanation": "旅人の行動のあとに、理由が書いてあります。"
  },
  {
    "id": "reading-g2-04",
    "grade": 2,
    "skill": "理由と順序",
    "title": "ランタンのしたく",
    "npc": "門番",
    "passage": "はじめに、ランタンに油を入れます。つぎに、火をつけます。さいごに、門につるします。",
    "question": "油を入れたつぎに、何をする？",
    "answer": "火をつける",
    "acceptedAnswers": [
      "火をつける",
      "ひをつける",
      "火をつけます",
      "ひをつけます"
    ],
    "evidence": "つぎに、火をつけます",
    "explanation": "「つぎに」のあとを見つけましょう。"
  },
  {
    "id": "reading-g2-05",
    "grade": 2,
    "skill": "理由と順序",
    "title": "赤い実をさがすわけ",
    "npc": "料理人",
    "passage": "料理人は、赤い実をさがしています。おいわいのケーキにかざるからです。",
    "question": "赤い実をかざる食べ物、3文字だったと思うんだけどなぁ。手紙から見つけてくれる？",
    "answer": "ケーキ",
    "acceptedAnswers": [
      "ケーキ",
      "けーき"
    ],
    "evidence": "ケーキにかざるから",
    "explanation": "さがしている理由の文に、使い道があります。",
    "dialogueSpeaker": "npc",
    "extraction": {
      "sourceText": "ケーキ",
      "characterCount": 3,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": ""
  },
  {
    "id": "reading-g2-06",
    "grade": 2,
    "skill": "理由と順序",
    "title": "手紙のとどけ方",
    "npc": "郵便屋",
    "passage": "はじめに、手紙をふくろに入れます。つぎに、ふくろを馬にのせます。さいごに、お城へ出発します。",
    "question": "さいごに、どこへ出発する？",
    "answer": "お城",
    "acceptedAnswers": [
      "お城",
      "おしろ"
    ],
    "evidence": "さいごに、お城へ出発",
    "explanation": "「さいごに」の文から、行き先を読み取れます。"
  },
  {
    "id": "reading-g2-07",
    "grade": 2,
    "skill": "理由と順序",
    "title": "店が休みのわけ",
    "npc": "道具屋",
    "passage": "きょう、道具屋はお休みです。店のゆかをなおすからです。",
    "question": "店を休むのは、何をなおすから？",
    "answer": "店のゆか",
    "acceptedAnswers": [
      "店のゆか",
      "みせのゆか"
    ],
    "evidence": "店のゆかをなおすから",
    "explanation": "休む理由は、ゆかをなおすことです。"
  },
  {
    "id": "reading-g2-08",
    "grade": 2,
    "skill": "理由と順序",
    "title": "たねをまくじゅんばん",
    "npc": "畑の番人",
    "passage": "はじめに、土にあなをほります。つぎに、たねを入れます。さいごに、土をかぶせます。",
    "question": "たねを入れたあと、何をする？",
    "answer": "土をかぶせる",
    "acceptedAnswers": [
      "土をかぶせる",
      "つちをかぶせる",
      "土をかぶせます",
      "つちをかぶせます"
    ],
    "evidence": "さいごに、土をかぶせます",
    "explanation": "たねを入れるのは二番目なので、その次を選びます。"
  },
  {
    "id": "reading-g2-09",
    "grade": 2,
    "skill": "理由と順序",
    "title": "ぬれた地図",
    "npc": "案内人",
    "passage": "地図がぬれて、道が読めません。雨の中で地図をひらいたからです。",
    "question": "地図がぬれたのは、どんな中でひらいたから？",
    "answer": "雨の中",
    "acceptedAnswers": [
      "雨の中",
      "あめのなか"
    ],
    "evidence": "雨の中で地図をひらいたから",
    "explanation": "理由の文の中から、天気を表す言葉を見つけます。"
  },
  {
    "id": "reading-g2-10",
    "grade": 2,
    "skill": "理由と順序",
    "title": "門をあけるしたく",
    "npc": "門番",
    "passage": "はじめに、門のかぎをあけます。つぎに、左右のとびらをおします。さいごに、開いたとびらをひもでとめます。",
    "question": "とびらをおす前に、何をする？",
    "answer": "門のかぎをあける",
    "acceptedAnswers": [
      "門のかぎをあける",
      "もんのかぎをあける",
      "門のかぎをあけます",
      "もんのかぎをあけます"
    ],
    "evidence": "はじめに、門のかぎをあけます",
    "explanation": "「前に」と聞かれたら、一つ前の手順をたどります。"
  },
  {
    "id": "reading-g3-01",
    "grade": 3,
    "skill": "指示語",
    "title": "月のかぎ",
    "npc": "古文書係",
    "passage": "石の箱に、月のかぎが入っていた。勇者はふたを開けた。それがないと、北の門は開かない。",
    "question": "この「それ」って、4文字の道具だったと思うんだけどなぁ。手紙の言葉で教えてくれる？",
    "answer": "月のかぎ",
    "acceptedAnswers": [
      "月のかぎ",
      "つきのかぎ"
    ],
    "evidence": "月のかぎが入っていた",
    "explanation": "門を開ける道具として紹介された「月のかぎ」を指します。",
    "dialogueSpeaker": "npc",
    "extraction": {
      "sourceText": "月のかぎ",
      "characterCount": 4,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": ""
  },
  {
    "id": "reading-g3-02",
    "grade": 3,
    "skill": "指示語",
    "title": "薬草のしおり",
    "npc": "薬屋",
    "passage": "森で、青い薬草を見つけた。薬屋は葉の形をたしかめた。これを使って、ねむりをさます薬を作るそうだ。",
    "question": "「これ」は、何のこと？",
    "answer": "青い薬草",
    "acceptedAnswers": [
      "青い薬草",
      "あおいやくそう"
    ],
    "evidence": "青い薬草を見つけた",
    "explanation": "薬を作る材料として見つけた「青い薬草」を指します。"
  },
  {
    "id": "reading-g3-03",
    "grade": 3,
    "skill": "指示語",
    "title": "光る道しるべ",
    "npc": "案内人",
    "passage": "道のわきに、光る石がならんでいる。旅人は一列になって歩いた。それをたどると、村へ帰れる。",
    "question": "「それ」って、3文字のあれかな？ 道にそってならんでいた物を読み返そう。",
    "answer": "光る石",
    "acceptedAnswers": [
      "光る石",
      "ひかるいし"
    ],
    "evidence": "光る石がならんでいる",
    "explanation": "「たどる」ものは、道にそってならぶ石です。",
    "dialogueSpeaker": "self",
    "extraction": {
      "sourceText": "光る石",
      "characterCount": 3,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": "少し先で、ひとりで次の手紙を開いた。"
  },
  {
    "id": "reading-g3-04",
    "grade": 3,
    "skill": "指示語",
    "title": "古い井戸",
    "npc": "村の長",
    "passage": "広場の西に、古い井戸がある。人々は朝早く起きた。そこに集まって、水をくんだ。",
    "question": "「そこ」は、どこのこと？",
    "answer": "古い井戸",
    "acceptedAnswers": [
      "古い井戸",
      "ふるいいど"
    ],
    "evidence": "広場の西に、古い井戸がある",
    "explanation": "水をくむために集まった場所を指しています。"
  },
  {
    "id": "reading-g3-05",
    "grade": 3,
    "skill": "指示語",
    "title": "見張りの合図",
    "npc": "見張り",
    "passage": "塔の上で、赤い旗がふられた。門番は空を見上げた。あれは、船が近づいている合図だ。",
    "question": "「あれ」は、何のこと？",
    "answer": "赤い旗",
    "acceptedAnswers": [
      "赤い旗",
      "あかいはた"
    ],
    "evidence": "赤い旗がふられた",
    "explanation": "見上げた先にある、合図の旗を指します。"
  },
  {
    "id": "reading-g3-06",
    "grade": 3,
    "skill": "指示語",
    "title": "勇者の持ち物",
    "npc": "旅の学者",
    "passage": "勇者は、銀の鏡を持っていた。暗いほらあなに一人で入った。これに月の光をうつすと、かくれた文字が見えた。",
    "question": "「これ」は、何のこと？",
    "answer": "銀の鏡",
    "acceptedAnswers": [
      "銀の鏡",
      "銀のかがみ",
      "ぎんのかがみ"
    ],
    "evidence": "銀の鏡を持っていた",
    "explanation": "光をうつせる持ち物は「銀の鏡」です。"
  },
  {
    "id": "reading-g3-07",
    "grade": 3,
    "skill": "指示語",
    "title": "合言葉のメモ",
    "npc": "門番",
    "passage": "メモに「朝の星」と書いてあった。旅人は声に出して読んだ。それを門番に伝えると、中へ入れた。",
    "question": "「それ」は、どの合言葉のこと？",
    "answer": "朝の星",
    "acceptedAnswers": [
      "朝の星",
      "あさのほし"
    ],
    "evidence": "「朝の星」と書いてあった",
    "explanation": "伝えた内容は、メモに書かれた合言葉です。"
  },
  {
    "id": "reading-g3-08",
    "grade": 3,
    "skill": "指示語",
    "title": "帰りの約束",
    "npc": "妖精",
    "passage": "妖精は「日がしずむ前に帰る」と言った。勇者はうなずいた。その約束を守るため、早めに森を出た。",
    "question": "「その約束」は、どんな約束？",
    "answer": "日がしずむ前に帰る",
    "acceptedAnswers": [
      "日がしずむ前に帰る",
      "ひがしずむまえにかえる"
    ],
    "evidence": "日がしずむ前に帰る",
    "explanation": "妖精が言った約束の内容を、そのまま抜き出します。"
  },
  {
    "id": "reading-g3-09",
    "grade": 3,
    "skill": "指示語",
    "title": "橋を直す道具",
    "npc": "大工",
    "passage": "大工は、長い板を川岸に置いた。村人たちは手伝いに来た。それを橋にわたして、こわれた部分を直した。",
    "question": "「それ」は、何のこと？",
    "answer": "長い板",
    "acceptedAnswers": [
      "長い板",
      "ながいいた"
    ],
    "evidence": "長い板を川岸に置いた",
    "explanation": "橋にわたして使える、最初に出てきた材料です。"
  },
  {
    "id": "reading-g3-10",
    "grade": 3,
    "skill": "指示語",
    "title": "星の粉",
    "npc": "魔法使い",
    "passage": "小びんに、星の粉が入っていた。魔法使いはふたを開けた。これをまくと、見えない足あとが光った。",
    "question": "「これ」は、何のこと？",
    "answer": "星の粉",
    "acceptedAnswers": [
      "星の粉",
      "ほしのこな"
    ],
    "evidence": "星の粉が入っていた",
    "explanation": "まいたものは、びんの中に入っていた粉です。"
  },
  {
    "id": "reading-g4-01",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "二つの通路",
    "npc": "案内人",
    "passage": "古い地図には、左の通路が安全だと書いてある。しかし、今朝の地震で左の天井がくずれた。右の通路は、門番がさきほど点検した。右には落石もひびもなかった。",
    "question": "今、安全に進めるのは、左右どちらの通路？",
    "answer": "右",
    "acceptedAnswers": [
      "右",
      "みぎ",
      "右の通路",
      "みぎのつうろ"
    ],
    "evidence": "右には落石もひびもなかった",
    "explanation": "「しかし」の後で状況が変わっています。古い地図より、今の点検結果を使います。"
  },
  {
    "id": "reading-g4-02",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "なくした手紙",
    "npc": "郵便屋",
    "passage": "リナは、大切な手紙をなくして悲しんでいた。ところが、友達が道で見つけて持ってきた。封も中身も無事だった。リナはほっとして、友達に何度もお礼を言った。",
    "question": "最後にリナがどう感じたか、3文字だったと思うんだけどなぁ。手紙から見つけられる？",
    "answer": "ほっと",
    "acceptedAnswers": [
      "ほっと",
      "ほっとした",
      "ほっとする"
    ],
    "evidence": "ほっとして",
    "explanation": "初めの悲しさではなく、最後の安心した様子を読み取ります。",
    "dialogueSpeaker": "npc",
    "extraction": {
      "sourceText": "ほっと",
      "characterCount": 3,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": ""
  },
  {
    "id": "reading-g4-03",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "薬草の注意書き",
    "npc": "薬屋",
    "passage": "この薬草は、昼に集めるとよいと伝えられてきた。しかし、今の季節は昼の強い日ざしで葉がいたむ。朝なら、葉の力が残っている。だから、今は朝に集めること。",
    "question": "今の季節、薬草はいつ集めればよい？",
    "answer": "朝",
    "acceptedAnswers": [
      "朝",
      "あさ"
    ],
    "evidence": "今は朝に集める",
    "explanation": "「しかし」で古い説明が修正され、「だから」の後に結論があります。"
  },
  {
    "id": "reading-g4-04",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "こわかった番犬",
    "npc": "子ども",
    "passage": "ぼくは、大きな番犬がこわかった。しかし、道にまよったとき、その犬が村まで案内してくれた。何度もふり返って、ぼくを待ってくれた。今はその犬に会えるのが楽しみだ。",
    "question": "犬に会う、今の気持ちは……3文字のあれかな？ 最後の文をもう一度読もう。",
    "answer": "楽しみ",
    "acceptedAnswers": [
      "楽しみ",
      "たのしみ"
    ],
    "evidence": "会えるのが楽しみ",
    "explanation": "「こわかった」は初めの気持ちです。助けられた後の変化を読みます。",
    "dialogueSpeaker": "self",
    "extraction": {
      "sourceText": "楽しみ",
      "characterCount": 3,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": "少し先で、ひとりで次の手紙を開いた。"
  },
  {
    "id": "reading-g4-05",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "雨の日の祭り",
    "npc": "村の長",
    "passage": "祭りは広場で行う予定だった。ところが、朝から大雨になった。広場の地面には水がたまっている。だから、今日は屋根のある集会所で開く。",
    "question": "結局、今日の祭りはどこで開く？",
    "answer": "集会所",
    "acceptedAnswers": [
      "集会所",
      "しゅうかいじょ"
    ],
    "evidence": "集会所で開く",
    "explanation": "「予定」と、変更後の決定を区別します。"
  },
  {
    "id": "reading-g4-06",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "勇者の失敗",
    "npc": "師匠",
    "passage": "ユウは、練習で何度も失敗し、自信をなくしていた。しかし、師匠が前より進歩した所を教えてくれた。ユウは、自分にもできることが増えたと気づいた。今は、もう一度挑戦したいと思っている。",
    "question": "今のユウは、もう一度どうしたい？",
    "answer": "挑戦したい",
    "acceptedAnswers": [
      "挑戦したい",
      "ちょうせんしたい"
    ],
    "evidence": "もう一度挑戦したい",
    "explanation": "師匠の言葉で、気持ちが前向きに変わりました。"
  },
  {
    "id": "reading-g4-07",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "宝箱の警告",
    "npc": "探検家",
    "passage": "宝箱の赤い石は、さわると光るだけだ。しかし、青い石にさわると、床のわなが動く。前に来た人は、赤い石をこわがっていた。実際に気をつけるべきなのは青い石だ。",
    "question": "わなが動かないよう、何色の石にさわらないようにする？",
    "answer": "青",
    "acceptedAnswers": [
      "青",
      "あお"
    ],
    "evidence": "青い石にさわると、床のわなが動く",
    "explanation": "人の印象ではなく、わなが動く条件を読み取ります。"
  },
  {
    "id": "reading-g4-08",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "仲直りの手紙",
    "npc": "村の子",
    "passage": "ミオは、友達が約束の時間に来なかったので怒っていた。ところが、友達から手紙が届いた。道でけがをした子を助けていたという。ミオは理由を知り、怒りが消えて、友達をほこらしく思った。",
    "question": "最後に、ミオは友達をどう思った？",
    "answer": "ほこらしく",
    "acceptedAnswers": [
      "ほこらしく",
      "ほこらしい",
      "ほこらしく思った",
      "ほこらしくおもった"
    ],
    "evidence": "友達をほこらしく思った",
    "explanation": "理由を知る前の怒りと、知った後の気持ちを区別します。"
  },
  {
    "id": "reading-g4-09",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "湖の明かり",
    "npc": "船頭",
    "passage": "湖の明かりは、船を正しい岸へ導くと言われていた。しかし、今夜の明かりは魔物が出している。近づくと、浅い所に乗り上げる。今夜は明かりではなく、岸の白い旗を目印に進もう。",
    "question": "今夜、何を目印に進めばよい？",
    "answer": "白い旗",
    "acceptedAnswers": [
      "白い旗",
      "しろいはた"
    ],
    "evidence": "岸の白い旗を目印に進もう",
    "explanation": "伝えられてきた説明が、今夜にも当てはまるとは限りません。"
  },
  {
    "id": "reading-g4-10",
    "grade": 4,
    "skill": "接続詞と心情",
    "title": "帰ってきた仲間",
    "npc": "門番",
    "passage": "門番は、帰らない仲間を心配していた。暗くなっても、門の外を見つめていた。ところが、遠くから聞きなれた歌声がした。仲間の姿が見え、門番は安心して笑顔になった。",
    "question": "仲間の姿を見て、門番はどんな気持ちになった？",
    "answer": "安心",
    "acceptedAnswers": [
      "安心",
      "あんしん"
    ],
    "evidence": "安心して笑顔になった",
    "explanation": "最後の文に、心配から変わった気持ちが書かれています。"
  },
  {
    "id": "reading-g5-01",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "光る薬の材料",
    "npc": "錬金術師",
    "passage": "薬には、青い花だけを使う。さらに、香りがあり、夜に光ることも必要だ。青い星花は、香りがあり夜に光る。青い水花は香りがあるが、夜には光らない。白い月花は香りがあり夜に光るが、青くはない。",
    "question": "条件に合う花の名前、4文字だったと思うんだけどなぁ。手紙の中にある？",
    "answer": "青い星花",
    "acceptedAnswers": [
      "青い星花",
      "あおいほしばな"
    ],
    "evidence": "青い星花は、香りがあり夜に光る",
    "explanation": "青色・香り・夜に光る、の三つを同時に満たすのは星花です。",
    "dialogueSpeaker": "npc",
    "extraction": {
      "sourceText": "青い星花",
      "characterCount": 4,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": ""
  },
  {
    "id": "reading-g5-02",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "氷の魔物の弱点",
    "npc": "魔物学者",
    "passage": "この魔物には、火・風・雷の魔法を試せる。強い魔法でも、大きな音が出ると仲間の魔物が集まる。さらに、火を当てると体がかたくなる。風は音を立てず、体をかたくしない。雷は体をかたくしないが、大きな音が出る。",
    "question": "仲間を呼ばず、体もかたくしない魔法は何？",
    "answer": "風",
    "acceptedAnswers": [
      "風",
      "かぜ"
    ],
    "evidence": "風は音を立てず、体をかたくしない",
    "explanation": "大きな音と火を除外すると、二つの条件に合う風が残ります。"
  },
  {
    "id": "reading-g5-03",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "橋の修理に使う板",
    "npc": "大工",
    "passage": "橋には、長さ二メートル以上の板が必要だ。さらに、ぬれておらず、ひびがないものを使う。松の板は三メートルで、乾いていてひびもない。杉の板は三メートルだが、ぬれている。ひのきの板は乾いているが、一メートルしかない。",
    "question": "修理に使える板は、何の板？",
    "answer": "松",
    "acceptedAnswers": [
      "松",
      "まつ"
    ],
    "evidence": "松の板は三メートルで、乾いていてひびもない",
    "explanation": "長さだけで決めず、乾いていることと、ひびがないことも確かめます。"
  },
  {
    "id": "reading-g5-04",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "見張り台への届け物",
    "npc": "運び屋",
    "passage": "荷物は、昼までに届けなければならない。こわれやすいので、ゆれの少ない道を選ぶ。東の道なら朝に着くが、石が多く大きくゆれる。西の道は平らだが、着くのは夕方だ。南の道は平らで、昼前に着く。",
    "question": "昼までに着いて、ゆれも少ない道……3文字のあの道かな？",
    "answer": "南の道",
    "acceptedAnswers": [
      "南の道",
      "みなみのみち"
    ],
    "evidence": "南の道は平らで、昼前に着く",
    "explanation": "速さだけなら東ですが、ゆれも少ない南の道が条件に合います。",
    "dialogueSpeaker": "self",
    "extraction": {
      "sourceText": "南の道",
      "characterCount": 3,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": "少し先で、ひとりで次の手紙を開いた。"
  },
  {
    "id": "reading-g5-05",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "封印の宝石",
    "npc": "古文書係",
    "passage": "封印には、丸い宝石が必要だ。ただし、赤い宝石は使えない。さらに、光を通すことが条件である。青玉は丸く、光を通す。白玉も丸いが光を通さず、赤玉は丸くて光を通すが赤色だ。",
    "question": "封印に使える宝石の名前は？",
    "answer": "青玉",
    "acceptedAnswers": [
      "青玉",
      "あおだま"
    ],
    "evidence": "青玉は丸く、光を通す",
    "explanation": "丸い・赤くない・光を通す、の三条件で調べます。"
  },
  {
    "id": "reading-g5-06",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "迷子の鳥の手がかり",
    "npc": "鳥の世話係",
    "passage": "さがしている鳥は、小さく、黄色い羽をしている。さらに、足に青い輪をつけている。広場の鳥は小さく黄色いが、輪がない。門の鳥は大きく黄色く、青い輪がある。井戸の鳥は小さく黄色く、青い輪もついている。",
    "question": "迷子の鳥がいる場所を、二文字で抜き出してね。",
    "answer": "井戸",
    "acceptedAnswers": [
      "井戸",
      "いど"
    ],
    "evidence": "井戸の鳥は小さく黄色く、青い輪もついている",
    "explanation": "羽の色だけでなく、体の大きさと青い輪も確かめます。"
  },
  {
    "id": "reading-g5-07",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "夜の探検に使う明かり",
    "npc": "探検家",
    "passage": "ほらあなでは、火を使ってはいけない。片手を空ける必要があり、二時間以上明るさが続く物を選ぶ。たいまつは三時間もつが、火を使う。光る石は片手で持てるが、一時間で消える。光る首かざりは手を使わず、三時間光る。",
    "question": "すべての条件を満たす道具は何？",
    "answer": "光る首かざり",
    "acceptedAnswers": [
      "光る首かざり",
      "ひかるくびかざり"
    ],
    "evidence": "光る首かざりは手を使わず、三時間光る",
    "explanation": "火を使わず、手を空けられ、二時間以上光る物を選びます。"
  },
  {
    "id": "reading-g5-08",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "冷たい薬の容器",
    "npc": "薬屋",
    "passage": "この薬は、光と熱に弱い。運ぶ間は、中に光が入らず、冷たさを保てる容器が必要だ。木の箱は光をさえぎるが、冷たさを保てない。透明なびんは冷たさを保つが、光が入る。銀のつぼは光をさえぎり、冷たさも保つ。",
    "question": "薬を運ぶのに合う容器は何？",
    "answer": "銀のつぼ",
    "acceptedAnswers": [
      "銀のつぼ",
      "ぎんのつぼ"
    ],
    "evidence": "銀のつぼは光をさえぎり、冷たさも保つ",
    "explanation": "一つの長所だけでは足りません。光と熱の両方への対策が必要です。"
  },
  {
    "id": "reading-g5-09",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "番人へのおみやげ",
    "npc": "村の長",
    "passage": "番人は、甘い食べ物が好きだ。ただし、木の実が入った物は食べられない。さらに、長く運ぶので、溶けない物にする。はちみつパンは甘く、木の実が入っておらず、溶けない。木の実クッキーは甘く溶けないが木の実入りで、氷菓子は木の実がないが溶けてしまう。",
    "question": "番人に持っていける食べ物は何？",
    "answer": "はちみつパン",
    "acceptedAnswers": [
      "はちみつパン"
    ],
    "evidence": "はちみつパンは甘く、木の実が入っておらず、溶けない",
    "explanation": "好きな味、食べられない材料、運びやすさを整理します。"
  },
  {
    "id": "reading-g5-10",
    "grade": 5,
    "skill": "条件整理と要約",
    "title": "調査隊の目的",
    "npc": "調査隊長",
    "passage": "調査隊は森の水がにごった原因を調べる。川の上流では土がくずれており、下流では魚が少なくなった。隊は上流の土と水を集め、村の水と比べる予定だ。魚を売る計画はなく、新しい道も作らない。これらはすべて、水のにごりがどこから来たのかを確かめるための活動だ。",
    "question": "調査隊の目的は何？「調べる」を除き、最初の文から抜き出してね。",
    "answer": "森の水がにごった原因",
    "acceptedAnswers": [
      "森の水がにごった原因",
      "もりのみずがにごったげんいん"
    ],
    "evidence": "森の水がにごった原因を調べる",
    "explanation": "土や水を集めることは手段です。文章全体に共通する目的をまとめます。"
  },
  {
    "id": "reading-g6-01",
    "grade": 6,
    "skill": "意図と論理",
    "title": "消えた足あと",
    "npc": "調査官",
    "passage": "倉庫の入口には砂が広がっている。人が通れば必ず足あとがつき、朝の点検まで消えない。昨夜、入口を閉めた後の砂には足あとが一つもなかった。宝箱は窓からでも運べる大きさで、窓は開いていた。見張りは「犯人は必ず入口を歩いて出た」と言う。砂はだれにもならされていないことが確認された。",
    "question": "入口を歩いたなら残るはずのものが、なかったんだよね。3文字だったと思うんだけどなぁ。",
    "answer": "足あと",
    "acceptedAnswers": [
      "足あと",
      "あしあと"
    ],
    "evidence": "足あとが一つもなかった",
    "explanation": "入口を歩いたなら必ず残るはずの足あとがありません。窓を使ったと断定するのでなく、証言の矛盾を答えます。",
    "dialogueSpeaker": "npc",
    "extraction": {
      "sourceText": "足あと",
      "characterCount": 3,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": ""
  },
  {
    "id": "reading-g6-02",
    "grade": 6,
    "skill": "意図と論理",
    "title": "空っぽの宝箱",
    "npc": "作戦係",
    "passage": "敵は、金貨をねらうと書いた手紙を落としていった。村人は金庫の前に集まって守った。その間に、だれもいなくなった塔から、門のかぎだけが消えた。金庫の封は破られず、金貨もすべて残っていた。敵の帰り道には、金貨ではなく門のかぎを包んでいた布が落ちていた。手紙は人々を金庫へ集めるためのものだったと分かった。",
    "question": "敵が本当に手に入れたかった物は何？",
    "answer": "門のかぎ",
    "acceptedAnswers": [
      "門のかぎ",
      "もんのかぎ"
    ],
    "evidence": "門のかぎだけが消えた",
    "explanation": "敵の手紙の表面上の目的と、実際になくなった物を比べます。"
  },
  {
    "id": "reading-g6-03",
    "grade": 6,
    "skill": "意図と論理",
    "title": "声の届かない塔",
    "npc": "探偵",
    "passage": "東の塔から広場までは、叫んでも声が届かない。これは昨日も今日も、実験で確かめられている。兵士は「昨日の昼、東の塔に一人でいて、広場の小声の会話を直接聞いた」と話した。伝声管や魔法は使われず、聞いた内容を伝えた人もいない。兵士が広場へ来たという記録もない。話の内容が正しいかどうかとは別に、聞いた方法には矛盾がある。",
    "question": "声が届かないのに、どう聞いたんだろう。矛盾しているのは「直接」から始まる5文字の部分かな？",
    "answer": "直接聞いた",
    "acceptedAnswers": [
      "直接聞いた",
      "ちょくせつきいた"
    ],
    "evidence": "広場の小声の会話を直接聞いた",
    "explanation": "声が届かない場所にいたのに、小声を直接聞いたという点が矛盾します。",
    "dialogueSpeaker": "self",
    "extraction": {
      "sourceText": "直接聞いた",
      "characterCount": 5,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": "少し先で、ひとりで次の手紙を開いた。"
  },
  {
    "id": "reading-g6-04",
    "grade": 6,
    "skill": "意図と論理",
    "title": "足止めの招待状",
    "npc": "村の長",
    "passage": "全員に「正午に広場で宝を配る」という招待状が届いた。しかし、宝は用意されていなかった。招待状の印も、村の印とは違っていた。ちょうど正午、広場へ向かった門番が留守の間に、敵が門を通った。後で敵の指示書に「正午、門番を広場に集め、門を空けよ」と書かれているのが見つかった。招待状はその指示のために送られたものだった。",
    "question": "招待状を送った本当の目的は、何を空けること？",
    "answer": "門",
    "acceptedAnswers": [
      "門",
      "もん"
    ],
    "evidence": "門番を広場に集め、門を空けよ",
    "explanation": "宝を配るという話は人を動かす手段で、ねらいは門の見張りをいなくすることです。"
  },
  {
    "id": "reading-g6-05",
    "grade": 6,
    "skill": "意図と論理",
    "title": "雨とぬれたマント",
    "npc": "調査官",
    "passage": "事件は、雨がやんだ後の昼に起きた。その町では、雨は夜明け前にやんでいた。容疑者のマントがぬれていたので、兵士は「事件のとき、雨の中で外にいた証拠だ」と言った。しかし、容疑者は昼に川へ落ちたと話し、川岸の店主もその場面を見ていた。マントがぬれる原因は、雨だけとは限らない。事件の時間に雨は降っていなかった。",
    "question": "マントがぬれた原因は、雨とは別だったんだね。店主が見た出来事は5文字だったと思うんだけどなぁ。",
    "answer": "川へ落ちた",
    "acceptedAnswers": [
      "川へ落ちた",
      "かわへおちた"
    ],
    "evidence": "昼に川へ落ちた",
    "explanation": "ぬれているという結果だけから、雨が原因とは決められません。時刻と店主の証言を合わせます。",
    "dialogueSpeaker": "npc",
    "extraction": {
      "sourceText": "川へ落ちた",
      "characterCount": 5,
      "countBasis": "printed-text",
      "inputLengthEnforced": false
    },
    "scene": ""
  },
  {
    "id": "reading-g6-06",
    "grade": 6,
    "skill": "意図と論理",
    "title": "開かない箱の証言",
    "npc": "かぎ職人",
    "passage": "箱を開けるには、赤と青の二本のかぎを同時に使う必要がある。この箱はこわされず、別の開け方もない。赤いかぎは夜の間ずっと、見張りの前で透明なびんに封印されていた。朝まで封は切られず、中身も確かめられた。旅人は「夜中に青いかぎ一本だけで箱を開けた」と話す。箱が開いたという別の証拠はない。",
    "question": "旅人の話が成り立たないのは、同時に必要な何色のかぎを使えなかったから？",
    "answer": "赤",
    "acceptedAnswers": [
      "赤",
      "あか"
    ],
    "evidence": "赤と青の二本のかぎを同時に使う必要",
    "explanation": "青だけでは条件を満たせません。赤いかぎが使えない状態だったことが確認されています。"
  },
  {
    "id": "reading-g6-07",
    "grade": 6,
    "skill": "意図と論理",
    "title": "にせの道案内",
    "npc": "案内人",
    "passage": "立て札には「安全な出口は北」と書いてあった。しかし、その札は今朝、敵が運びこんだ物だと見張りが確認した。北へ行くと行き止まりの囲いに入る。敵の地図には、北の囲いに旅人を集めて閉じこめる計画が記されていた。南の道は、村人が出口まで歩いて確かめている。札の言葉だけを信じると、敵の計画どおりになる。",
    "question": "敵は旅人を、北のどこに集めるつもりだった？",
    "answer": "囲い",
    "acceptedAnswers": [
      "囲い",
      "かこい"
    ],
    "evidence": "北の囲いに旅人を集めて閉じこめる",
    "explanation": "札の目的は安全な案内ではなく、閉じこめる場所へ誘導することです。"
  },
  {
    "id": "reading-g6-08",
    "grade": 6,
    "skill": "意図と論理",
    "title": "先に届いた手紙",
    "npc": "郵便屋",
    "passage": "この村から城へ手紙を運ぶ方法は、徒歩の使者だけで、最短でも二日かかる。魔法や鳥の便は使えない。昨日の朝に村を出た使者が、昨日の夕方に「同じ手紙を城へ届けた」と言った。道が短くなったり、別の人に渡したりした事実はない。出発の日は記録でも確認されている。したがって、届けたという時刻は条件と両立しない。",
    "question": "最短の日数と比べて、使者の証言でおかしいのは、いつ届けたという部分？本文から抜き出してね。",
    "answer": "昨日の夕方",
    "acceptedAnswers": [
      "昨日の夕方",
      "きのうのゆうがた"
    ],
    "evidence": "昨日の夕方に「同じ手紙を城へ届けた」",
    "explanation": "昨日の朝から夕方までは一日未満です。最短二日という条件と比べると矛盾が分かります。"
  },
  {
    "id": "reading-g6-09",
    "grade": 6,
    "skill": "意図と論理",
    "title": "敵が消した文字",
    "npc": "古文書係",
    "passage": "石碑には、もともと「西の橋はこわれている。東の橋を使え」とあった。敵はその二文を消して、「西の橋を使え」と書きかえた。元の文は、石碑の裏に残された写しで確かめられた。敵のメモには「西へ進ませ、こわれた橋で足止めする」と書かれていた。村人が確かめると、東の橋は今も使えた。書きかえられた文だけを読むと、敵のねらいどおりになる。",
    "question": "元の石碑が使うよう勧めていたのは、どちらの橋？",
    "answer": "東の橋",
    "acceptedAnswers": [
      "東の橋",
      "ひがしのはし"
    ],
    "evidence": "東の橋を使え",
    "explanation": "敵が残した「西」だけを見ず、元の文と書きかえの目的を合わせて判断します。"
  },
  {
    "id": "reading-g6-10",
    "grade": 6,
    "skill": "意図と論理",
    "title": "見せるための地図",
    "npc": "探偵",
    "passage": "敵の使者は「この地図は絶対に読むな」と言って、机の上に広げたまま立ち去った。地図には、無人の小屋が「本部」と大きく記されていた。別に見つかった敵の命令書には「偽の地図を目立つ所に置き、勇者を小屋へ向かわせろ」とあった。本当の本部は山の向こうにあり、見張りが確認している。小屋へ行けば、本部を探す時間を失う。読むなという言葉と、目立つ置き方には別のねらいがあった。",
    "question": "敵は勇者をどこへ向かわせたかった？「無人の」を除いて抜き出してね。",
    "answer": "小屋",
    "acceptedAnswers": [
      "小屋",
      "こや"
    ],
    "evidence": "勇者を小屋へ向かわせろ",
    "explanation": "読むなという言葉だけではなく、命令書と地図の表示から、誘導先を読み取ります。"
  }
];
export function readingAnswerMatches(quest, input) {
 const normalize=value=>String(value??'').normalize('NFKC').replace(/[\s　。、.!！?？]/gu,'');
 const actual=normalize(input);
 return !!actual && quest.acceptedAnswers.some(answer=>normalize(answer)===actual);
}
