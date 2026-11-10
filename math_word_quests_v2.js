// LOCAL UNCONNECTED CANDIDATE. No imports, UI, save, network or release hooks.
const freezeMathV2=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freezeMathV2);Object.freeze(value);}return value;};
export const MATH_WORD_QUESTS_V2_META=freezeMathV2({
  "version": "2.0-draft",
  "status": "local_unconnected_candidate",
  "grades": [
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "targetPerGrade": 30,
  "copyright": "独自作成。外部教材本文の転載なし。",
  "scope": "固定180題と純粋選択/採点候補のみ。ゲーム・セーブ・公開設定へ接続しない。"
});
export const MATH_WORD_QUESTS_V2=freezeMathV2([
  {
    "id": "mwq-v2-g1-001",
    "grade": 1,
    "topic": "たし算",
    "questionType": "合併",
    "title": "ひかるはねのはこ",
    "story": "ようせいの リリが、ひかる はねを 7まい ひろいました。トトも 5まい ひろい、ふたりの はねを おなじ はこに いれました。",
    "question": "はこの はねは、あわせて なんまいですか。",
    "answer": "12",
    "unit": "まい",
    "equation": "7+5",
    "explanation": "ふたりが いれた はねを あわせるので、7たす5で 12まいです。",
    "prerequisites": [
      "10までの数",
      "合併のたし算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7+5"
    },
    "answerKind": "integer",
    "semanticPattern": "二者の持参物を一容器に合併",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "ようせいの リリが、ひかる はねを 7まい ひろいました。トトも 5まい ひろい、ふたりの はねを おなじ はこに いれました。\nはこの はねは、あわせて なんまいですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "まい",
          "required": true
        }
      ],
      "displayUnit": "まい",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "枚"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "12 まい"
  },
  {
    "id": "mwq-v2-g1-002",
    "grade": 1,
    "topic": "たし算",
    "questionType": "増加",
    "title": "もんのまえのなかま",
    "story": "しろの もんの まえで、6にんが たびの したくを していました。あとから 4にんが きました。だれも でかけて いません。",
    "question": "もんの まえには、いま なんにん いますか。",
    "answer": "10",
    "unit": "にん",
    "equation": "6+4",
    "explanation": "はじめの6にんに、きた4にんを たします。",
    "prerequisites": [
      "増加のたし算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "6+4"
    },
    "answerKind": "integer",
    "semanticPattern": "既存集団に新規参加者が加わる",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "しろの もんの まえで、6にんが たびの したくを していました。あとから 4にんが きました。だれも でかけて いません。\nもんの まえには、いま なんにん いますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "にん",
          "required": true
        }
      ],
      "displayUnit": "にん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "人"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "10 にん"
  },
  {
    "id": "mwq-v2-g1-003",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "残り",
    "title": "りゅうのくだもの",
    "story": "こりゅうの ごはんに、きのみを 14こ よういしました。こりゅうは 6こ たべました。",
    "question": "きのみは なんこ のこっていますか。",
    "answer": "8",
    "unit": "こ",
    "equation": "14-6",
    "explanation": "あった14こから、たべた6こを ひきます。",
    "prerequisites": [
      "20までの数",
      "残りのひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "14-6"
    },
    "answerKind": "integer",
    "semanticPattern": "全体から消費分を除く",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "こりゅうの ごはんに、きのみを 14こ よういしました。こりゅうは 6こ たべました。\nきのみは なんこ のこっていますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 こ"
  },
  {
    "id": "mwq-v2-g1-004",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "求差",
    "title": "ふたつのはた",
    "story": "みはりだいに、あかい はたが 13ほん、あおい はたが 9ほん あります。",
    "question": "あかい はたは、あおい はたより なんぼん おおいですか。",
    "answer": "4",
    "unit": "ほん",
    "equation": "13-9",
    "explanation": "おおい13ほんから、すくない9ほんを ひくと、ちがいの4ほんが わかります。",
    "prerequisites": [
      "数の大小",
      "求差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "13-9"
    },
    "answerKind": "integer",
    "semanticPattern": "二集合の多い分を求める",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "みはりだいに、あかい はたが 13ほん、あおい はたが 9ほん あります。\nあかい はたは、あおい はたより なんぼん おおいですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "ほん",
          "required": true
        }
      ],
      "displayUnit": "ほん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "本",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 ほん"
  },
  {
    "id": "mwq-v2-g1-005",
    "grade": 1,
    "topic": "たし算",
    "questionType": "比較量",
    "title": "たびのいし",
    "story": "ネネは、たびの いしを 8こ もっています。カイは、ネネより 3こ おおく もっています。",
    "question": "カイは なんこ もっていますか。",
    "answer": "11",
    "unit": "こ",
    "equation": "8+3",
    "explanation": "ネネの8こより3こ おおいので、8に3を たします。",
    "prerequisites": [
      "比較のことば"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "8+3"
    },
    "answerKind": "integer",
    "semanticPattern": "基準量と正の差から比較量",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "ネネは、たびの いしを 8こ もっています。カイは、ネネより 3こ おおく もっています。\nカイは なんこ もっていますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "11 こ"
  },
  {
    "id": "mwq-v2-g1-006",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "比較量",
    "title": "こびとのふえ",
    "story": "おおきな ふくろには、ふえが 12ほん はいっています。ちいさな ふくろの ふえは、それより 4ほん すくないそうです。",
    "question": "ちいさな ふくろの ふえは なんぼんですか。",
    "answer": "8",
    "unit": "ほん",
    "equation": "12-4",
    "explanation": "12ほんより4ほん すくないので、12から4を ひきます。",
    "prerequisites": [
      "比較のことば"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "12-4"
    },
    "answerKind": "integer",
    "semanticPattern": "基準量と負の差から比較量",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "おおきな ふくろには、ふえが 12ほん はいっています。ちいさな ふくろの ふえは、それより 4ほん すくないそうです。\nちいさな ふくろの ふえは なんぼんですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "ほん",
          "required": true
        }
      ],
      "displayUnit": "ほん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "本",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 ほん"
  },
  {
    "id": "mwq-v2-g1-007",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "不足",
    "title": "たきびのいす",
    "story": "キャンプに 15にんが きます。いすは 11こ あり、ひとりに 1こずつ つかいます。",
    "question": "あと いすが なんこ ひつようですか。",
    "answer": "4",
    "unit": "こ",
    "equation": "15-11",
    "explanation": "15にんぶんに するには、15から いまの11こを ひいた4こが ひつようです。",
    "prerequisites": [
      "一対一対応",
      "求差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "15-11"
    },
    "answerKind": "integer",
    "semanticPattern": "必要人数に対する用具の不足",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "キャンプに 15にんが きます。いすは 11こ あり、ひとりに 1こずつ つかいます。\nあと いすが なんこ ひつようですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 こ"
  },
  {
    "id": "mwq-v2-g1-008",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "部分量",
    "title": "にじのはこ",
    "story": "にじの はこに、たまが 16こ はいっています。7こが あかい たまで、のこりは ぜんぶ あおい たまです。",
    "question": "あおい たまは なんこですか。",
    "answer": "9",
    "unit": "こ",
    "equation": "16-7",
    "explanation": "ぜんぶの16こから、あかい7こを ひきます。",
    "prerequisites": [
      "全体と部分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "16-7"
    },
    "answerKind": "integer",
    "semanticPattern": "二分類の既知部分から未知部分",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "にじの はこに、たまが 16こ はいっています。7こが あかい たまで、のこりは ぜんぶ あおい たまです。\nあおい たまは なんこですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "9 こ"
  },
  {
    "id": "mwq-v2-g1-009",
    "grade": 1,
    "topic": "たし算",
    "questionType": "順序と人数",
    "title": "ほそいはしのれつ",
    "story": "なかまが 1れつに ならんで、はしを わたります。ミミの まえに 5にん、うしろに 4にん います。",
    "question": "ミミも いれると、ぜんぶで なんにんですか。",
    "answer": "10",
    "unit": "にん",
    "equation": "5+1+4",
    "explanation": "まえの5にん、ミミ1にん、うしろの4にんを あわせます。",
    "prerequisites": [
      "順序",
      "3数のたし算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "5+1+4"
    },
    "answerKind": "integer",
    "semanticPattern": "前後人数に本人一人を加える",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "なかまが 1れつに ならんで、はしを わたります。ミミの まえに 5にん、うしろに 4にん います。\nミミも いれると、ぜんぶで なんにんですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "にん",
          "required": true
        }
      ],
      "displayUnit": "にん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "人"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "10 にん"
  },
  {
    "id": "mwq-v2-g1-010",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "順序の間",
    "title": "ほしのかいだん",
    "story": "ほしの かいだんに、ひとりずつ 1れつで ならんでいます。ポポは まえから 3ばんめ、ルルは まえから 8ばんめです。",
    "question": "ポポと ルルの あいだには、なんにん いますか。",
    "answer": "4",
    "unit": "にん",
    "equation": "8-3-1",
    "explanation": "4ばんめから7ばんめまでが あいだの ひとです。ふたりを いれずに かぞえると4にんです。",
    "prerequisites": [
      "順序数",
      "20以内のひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "8-3-1"
    },
    "answerKind": "integer",
    "semanticPattern": "二順位の間にいる人数・両端除外",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "ほしの かいだんに、ひとりずつ 1れつで ならんでいます。ポポは まえから 3ばんめ、ルルは まえから 8ばんめです。\nポポと ルルの あいだには、なんにん いますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "にん",
          "required": true
        }
      ],
      "displayUnit": "にん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "人"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 にん"
  },
  {
    "id": "mwq-v2-g1-011",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "順位から前方人数",
    "title": "どうぐやのじゅんばん",
    "story": "どうぐやに ならんでいる ソラは、まえから 6ばんめです。",
    "question": "ソラの まえには、なんにん いますか。",
    "answer": "5",
    "unit": "にん",
    "equation": "6-1",
    "explanation": "6ばんめの ソラを のぞくと、そのまえは5にんです。",
    "prerequisites": [
      "順序数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "6-1"
    },
    "answerKind": "integer",
    "semanticPattern": "順位から本人を除いて前方人数",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "どうぐやに ならんでいる ソラは、まえから 6ばんめです。\nソラの まえには、なんにん いますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "にん",
          "required": true
        }
      ],
      "displayUnit": "にん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "人"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "5 にん"
  },
  {
    "id": "mwq-v2-g1-012",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "全体と順位",
    "title": "ふねをまつれつ",
    "story": "ふねを まつ なかまが、12にん ならんでいます。ククは まえから 8ばんめです。",
    "question": "ククの うしろには、なんにん いますか。",
    "answer": "4",
    "unit": "にん",
    "equation": "12-8",
    "explanation": "まえから8にんぶんに ククも はいっています。ぜんぶの12にんから8にんを ひきます。",
    "prerequisites": [
      "順序数",
      "全体と部分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "12-8"
    },
    "answerKind": "integer",
    "semanticPattern": "全人数から本人までの順位を除く",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "ふねを まつ なかまが、12にん ならんでいます。ククは まえから 8ばんめです。\nククの うしろには、なんにん いますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "にん",
          "required": true
        }
      ],
      "displayUnit": "にん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "人"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 にん"
  },
  {
    "id": "mwq-v2-g1-013",
    "grade": 1,
    "topic": "3つの数の計算",
    "questionType": "増加して減少",
    "title": "こやのあかり",
    "story": "こやで、あかりが 9こ ついていました。4こ つけたあと、5こ けしました。",
    "question": "いま、あかりは なんこ ついていますか。",
    "answer": "8",
    "unit": "こ",
    "equation": "9+4-5",
    "explanation": "9こに4こを たすと13こです。そこから5こを ひいて8こです。",
    "prerequisites": [
      "3数の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "9+4-5"
    },
    "answerKind": "integer",
    "semanticPattern": "追加後に一部を消す時間順の混合計算",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "こやで、あかりが 9こ ついていました。4こ つけたあと、5こ けしました。\nいま、あかりは なんこ ついていますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 こ"
  },
  {
    "id": "mwq-v2-g1-014",
    "grade": 1,
    "topic": "3つの数の計算",
    "questionType": "三者合併",
    "title": "やまのどんぐり",
    "story": "やまの こびとが、どんぐりを あつめました。あさに 4こ、ひるに 6こ、ゆうがたに 3こ あつめました。",
    "question": "どんぐりは、ぜんぶで なんこですか。",
    "answer": "13",
    "unit": "こ",
    "equation": "4+6+3",
    "explanation": "4こ、6こ、3こを じゅんに たします。",
    "prerequisites": [
      "3数のたし算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "4+6+3"
    },
    "answerKind": "integer",
    "semanticPattern": "時点別収集量の三項合併",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "やまの こびとが、どんぐりを あつめました。あさに 4こ、ひるに 6こ、ゆうがたに 3こ あつめました。\nどんぐりは、ぜんぶで なんこですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "13 こ"
  },
  {
    "id": "mwq-v2-g1-015",
    "grade": 1,
    "topic": "3つの数の計算",
    "questionType": "二度の減少",
    "title": "しゅっぱつのパン",
    "story": "たびの パンが 18こ ありました。あさに 7こ くばり、ひるに 4こ くばりました。",
    "question": "パンは なんこ のこっていますか。",
    "answer": "7",
    "unit": "こ",
    "equation": "18-7-4",
    "explanation": "はじめの18こから、7こと4こを じゅんに ひきます。",
    "prerequisites": [
      "3数のひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "18-7-4"
    },
    "answerKind": "integer",
    "semanticPattern": "同じ在庫から二時点で配布",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "たびの パンが 18こ ありました。あさに 7こ くばり、ひるに 4こ くばりました。\nパンは なんこ のこっていますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "7 こ"
  },
  {
    "id": "mwq-v2-g1-016",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "同数化",
    "title": "まほうのえだ",
    "story": "あかい えだが 12ほん、しろい えだが 8ほん あります。あかい えだだけを へらして、しろい えだと おなじ かずに します。",
    "question": "あかい えだを なんぼん とりのぞきますか。",
    "answer": "4",
    "unit": "ほん",
    "equation": "12-8",
    "explanation": "12ほんから8ほんに するには、ちがいの4ほんを とりのぞきます。",
    "prerequisites": [
      "求差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "12-8"
    },
    "answerKind": "integer",
    "semanticPattern": "多い側だけ減らして二集合を同数にする",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "あかい えだが 12ほん、しろい えだが 8ほん あります。あかい えだだけを へらして、しろい えだと おなじ かずに します。\nあかい えだを なんぼん とりのぞきますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "ほん",
          "required": true
        }
      ],
      "displayUnit": "ほん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "本",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 ほん"
  },
  {
    "id": "mwq-v2-g1-017",
    "grade": 1,
    "topic": "3つの数の計算",
    "questionType": "交換と保存",
    "title": "ようせいとのこうかん",
    "story": "レンは、まほうの はがきを 10まい もっています。3まいを ようせいに わたし、べつの はがきを 3まい もらいました。",
    "question": "レンの はがきは、いま なんまいですか。",
    "answer": "10",
    "unit": "まい",
    "equation": "10-3+3",
    "explanation": "3まい へってから、おなじ3まい ふえるので、10まいに もどります。",
    "prerequisites": [
      "3数の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "10-3+3"
    },
    "answerKind": "integer",
    "semanticPattern": "等数交換による個数の保存",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "レンは、まほうの はがきを 10まい もっています。3まいを ようせいに わたし、べつの はがきを 3まい もらいました。\nレンの はがきは、いま なんまいですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "まい",
          "required": true
        }
      ],
      "displayUnit": "まい",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "枚"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "10 まい"
  },
  {
    "id": "mwq-v2-g1-018",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "全部使う",
    "title": "ひとつものこらないほし",
    "story": "ランプに いれる ほしが 5こ あります。5こ ぜんぶを ランプに いれました。",
    "question": "まだ いれていない ほしは なんこですか。",
    "answer": "0",
    "unit": "こ",
    "equation": "5-5",
    "explanation": "5こから5こを ひくと0こです。",
    "prerequisites": [
      "0の意味",
      "ひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "5-5"
    },
    "answerKind": "integer",
    "semanticPattern": "全数移動後の空集合",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "ランプに いれる ほしが 5こ あります。5こ ぜんぶを ランプに いれました。\nまだ いれていない ほしは なんこですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "0 こ"
  },
  {
    "id": "mwq-v2-g1-019",
    "grade": 1,
    "topic": "たし算",
    "questionType": "0からの増加",
    "title": "からっぽのかご",
    "story": "まほうの かごは からっぽで、なにも はいっていません。そこへ きのこを 8こ いれました。",
    "question": "かごの きのこは なんこですか。",
    "answer": "8",
    "unit": "こ",
    "equation": "0+8",
    "explanation": "からっぽは0こです。0こに8こを たします。",
    "prerequisites": [
      "0の意味",
      "たし算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "0+8"
    },
    "answerKind": "integer",
    "semanticPattern": "空の容器へ初めて投入",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "まほうの かごは からっぽで、なにも はいっていません。そこへ きのこを 8こ いれました。\nかごの きのこは なんこですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 こ"
  },
  {
    "id": "mwq-v2-g1-020",
    "grade": 1,
    "topic": "長さくらべ",
    "questionType": "任意単位の求差",
    "title": "つみきではかったつるぎ",
    "story": "おなじ ながさの つみきを、すきまなく ならべて はかります。つるぎは つみき9こぶん、たては 6こぶんです。",
    "question": "つるぎは、たてより つみき なんこぶん ながいですか。",
    "answer": "3",
    "unit": "こぶん",
    "equation": "9-6",
    "explanation": "おなじ つみきで はかっているので、9こぶんと6こぶんの ちがいを もとめます。",
    "prerequisites": [
      "共通の任意単位",
      "求差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "9-6"
    },
    "answerKind": "integer",
    "semanticPattern": "共通単位で測った二長さの差",
    "curriculumNote": "1年の長さの比較。cmの換算や公式を要求しない。",
    "text": "おなじ ながさの つみきを、すきまなく ならべて はかります。つるぎは つみき9こぶん、たては 6こぶんです。\nつるぎは、たてより つみき なんこぶん ながいですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こぶん",
          "required": true
        }
      ],
      "displayUnit": "こぶん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "3 こぶん"
  },
  {
    "id": "mwq-v2-g1-021",
    "grade": 1,
    "topic": "かさくらべ",
    "questionType": "任意単位の求差",
    "title": "いずみのみずいれ",
    "story": "おなじ コップで、ふたつの みずいれを いっぱいに しました。あかい みずいれには7はい、しろい みずいれには4はい ひつようでした。",
    "question": "あかい みずいれは、コップ なんばいぶん おおく はいりますか。",
    "answer": "3",
    "unit": "はいぶん",
    "equation": "7-4",
    "explanation": "おなじ コップなので、7はいから4はいを ひいて くらべられます。",
    "prerequisites": [
      "共通の任意単位",
      "求差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7-4"
    },
    "answerKind": "integer",
    "semanticPattern": "容積を共通コップの充填回数で比較",
    "curriculumNote": "1年のかさの比較。LやmLは用いない。",
    "text": "おなじ コップで、ふたつの みずいれを いっぱいに しました。あかい みずいれには7はい、しろい みずいれには4はい ひつようでした。\nあかい みずいれは、コップ なんばいぶん おおく はいりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "はいぶん",
          "required": true
        }
      ],
      "displayUnit": "はいぶん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "3 はいぶん"
  },
  {
    "id": "mwq-v2-g1-022",
    "grade": 1,
    "topic": "ひろさくらべ",
    "questionType": "任意単位の求差",
    "title": "たからのしきもの",
    "story": "おなじ おおきさの しかくい ぬので、しきものを すきまも かさなりも なく おおいました。あかい しきものには12まい、あおい しきものには9まい つかいました。",
    "question": "あかい しきものは、ぬの なんまいぶん ひろいですか。",
    "answer": "3",
    "unit": "まいぶん",
    "equation": "12-9",
    "explanation": "おなじ ぬのを つかっているので、まいすうの ちがいが ひろさの ちがいです。",
    "prerequisites": [
      "共通の任意単位",
      "求差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "12-9"
    },
    "answerKind": "integer",
    "semanticPattern": "同形単位で覆う枚数による広さ比較",
    "curriculumNote": "1年の広さの比較。面積単位や縦×横は要求しない。",
    "text": "おなじ おおきさの しかくい ぬので、しきものを すきまも かさなりも なく おおいました。あかい しきものには12まい、あおい しきものには9まい つかいました。\nあかい しきものは、ぬの なんまいぶん ひろいですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "まいぶん",
          "required": true
        }
      ],
      "displayUnit": "まいぶん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "3 まいぶん"
  },
  {
    "id": "mwq-v2-g1-023",
    "grade": 1,
    "topic": "長さくらべ",
    "questionType": "長さの合成",
    "title": "ひもをつなぐようせい",
    "story": "ひもの ながさを、おなじ つみきで はかりました。あかい ひもは6こぶん、しろい ひもは5こぶんです。ふたつを かさねずに まっすぐ つなぎます。",
    "question": "つないだ ひもは、つみき なんこぶんですか。",
    "answer": "11",
    "unit": "こぶん",
    "equation": "6+5",
    "explanation": "かさなる ところが ないので、6こぶんと5こぶんを たします。",
    "prerequisites": [
      "長さの任意単位",
      "たし算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "6+5"
    },
    "answerKind": "integer",
    "semanticPattern": "重なりのない二長さの連結",
    "curriculumNote": "1年の共通単位による長さ比較・合成。",
    "text": "ひもの ながさを、おなじ つみきで はかりました。あかい ひもは6こぶん、しろい ひもは5こぶんです。ふたつを かさねずに まっすぐ つなぎます。\nつないだ ひもは、つみき なんこぶんですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こぶん",
          "required": true
        }
      ],
      "displayUnit": "こぶん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "11 こぶん"
  },
  {
    "id": "mwq-v2-g1-024",
    "grade": 1,
    "topic": "順序と人数",
    "questionType": "前後の順位変換",
    "title": "うしろからみるれつ",
    "story": "10にんが、1れつに ならんでいます。タタは まえから 3ばんめです。",
    "question": "タタは、うしろから なんばんめですか。",
    "answer": "8",
    "unit": "ばんめ",
    "equation": "10-3+1",
    "explanation": "まえの2にんを のぞいた8にんの なかで、タタは うしろから8ばんめです。",
    "prerequisites": [
      "順序数",
      "3数の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "10-3+1"
    },
    "answerKind": "integer",
    "semanticPattern": "全人数と前方順位から後方順位",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "10にんが、1れつに ならんでいます。タタは まえから 3ばんめです。\nタタは、うしろから なんばんめですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "ばんめ",
          "required": true
        }
      ],
      "displayUnit": "ばんめ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 ばんめ"
  },
  {
    "id": "mwq-v2-g1-025",
    "grade": 1,
    "topic": "順序と人数",
    "questionType": "両側の順位から全体",
    "title": "つえをうけとるれつ",
    "story": "つえを うけとる なかまが、1れつに ならんでいます。ルカは まえから7ばんめで、うしろから6ばんめです。",
    "question": "れつには、ぜんぶで なんにん いますか。",
    "answer": "12",
    "unit": "にん",
    "equation": "7+6-1",
    "explanation": "7にんと6にんを たすと、ルカを2かい かぞえます。1にんぶんを ひきます。",
    "prerequisites": [
      "順序数",
      "3数の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7+6-1"
    },
    "answerKind": "integer",
    "semanticPattern": "前後順位の重複する本人を一度差し引く",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "つえを うけとる なかまが、1れつに ならんでいます。ルカは まえから7ばんめで、うしろから6ばんめです。\nれつには、ぜんぶで なんにん いますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "にん",
          "required": true
        }
      ],
      "displayUnit": "にん",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "人"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "12 にん"
  },
  {
    "id": "mwq-v2-g1-026",
    "grade": 1,
    "topic": "時計",
    "questionType": "何時",
    "title": "あさのかね",
    "story": "とけいの ながい はりは12、みじかい はりは8を さしています。そろそろ、しろの あさの かねが なります。",
    "question": "とけいは なんじですか。こたえは「6:00」の ように かいてください。",
    "answer": "8:00",
    "unit": "",
    "equation": "8時",
    "explanation": "ながい はりが12を さすと ちょうどの じこくです。みじかい はりは8なので8じです。",
    "prerequisites": [
      "時計の長針と短針"
    ],
    "check": {
      "kind": "clock_add",
      "values": [
        8,
        0,
        0
      ]
    },
    "answerKind": "time",
    "semanticPattern": "長針12短針8の時計を読む",
    "curriculumNote": "1年の何時。経過時間の計算ではない。",
    "text": "とけいの ながい はりは12、みじかい はりは8を さしています。そろそろ、しろの あさの かねが なります。\nとけいは なんじですか。こたえは「6:00」の ように かいてください。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "time",
      "fields": [
        {
          "name": "hours",
          "label": "じ",
          "keyboard": "integer",
          "unit": "じ",
          "required": true
        },
        {
          "name": "minutes",
          "label": "ふん",
          "keyboard": "integer",
          "unit": "ふん",
          "required": true
        }
      ],
      "displayUnit": "",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "clock_fields",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "時/分の二欄",
        "H:MM",
        "H時M分",
        "全角数字"
      ]
    },
    "answerDisplay": "8:00"
  },
  {
    "id": "mwq-v2-g1-027",
    "grade": 1,
    "topic": "時計",
    "questionType": "何時半",
    "title": "おやつのじかん",
    "story": "りゅうの おやつの とけいです。ながい はりは6、みじかい はりは4と5の ちょうど あいだに あります。",
    "question": "とけいは なんじはんですか。こたえは「2:30」の ように かいてください。",
    "answer": "4:30",
    "unit": "",
    "equation": "4時半",
    "explanation": "ながい はりが6を さすと はんです。4じを すぎているので4じはんです。",
    "prerequisites": [
      "時計の長針と短針"
    ],
    "check": {
      "kind": "clock_add",
      "values": [
        4,
        30,
        0
      ]
    },
    "answerKind": "time",
    "semanticPattern": "長針6短針中間の時計を読む",
    "curriculumNote": "1年の何時半。分単位の経過時間は要求しない。",
    "text": "りゅうの おやつの とけいです。ながい はりは6、みじかい はりは4と5の ちょうど あいだに あります。\nとけいは なんじはんですか。こたえは「2:30」の ように かいてください。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "time",
      "fields": [
        {
          "name": "hours",
          "label": "じ",
          "keyboard": "integer",
          "unit": "じ",
          "required": true
        },
        {
          "name": "minutes",
          "label": "ふん",
          "keyboard": "integer",
          "unit": "ふん",
          "required": true
        }
      ],
      "displayUnit": "",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "clock_fields",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "時/分の二欄",
        "H:MM",
        "H時M分",
        "全角数字"
      ]
    },
    "answerDisplay": "4:30"
  },
  {
    "id": "mwq-v2-g1-028",
    "grade": 1,
    "topic": "3つの数の計算",
    "questionType": "減少して増加",
    "title": "もどってきたはと",
    "story": "こやに はとが 8わ いました。2わが とんでいったあと、7わが はいってきました。",
    "question": "こやには、いま なんわ いますか。",
    "answer": "13",
    "unit": "わ",
    "equation": "8-2+7",
    "explanation": "8わから2わを ひいて6わです。7わ ふえるので13わです。",
    "prerequisites": [
      "3数の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "8-2+7"
    },
    "answerKind": "integer",
    "semanticPattern": "退出の後に新規入室する生体数",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "こやに はとが 8わ いました。2わが とんでいったあと、7わが はいってきました。\nこやには、いま なんわ いますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "わ",
          "required": true
        }
      ],
      "displayUnit": "わ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "13 わ"
  },
  {
    "id": "mwq-v2-g1-029",
    "grade": 1,
    "topic": "たし算",
    "questionType": "同数の合併",
    "title": "ふたりのぼうけんしゃ",
    "story": "ふたりの ぼうけんしゃが、くすりを もちよります。ミナは6こ もっていて、ケンも ミナと おなじ かず もっています。",
    "question": "ふたりの くすりは、あわせて なんこですか。",
    "answer": "12",
    "unit": "こ",
    "equation": "6+6",
    "explanation": "おなじ かずなので、ケンも6こです。6こずつを あわせます。",
    "prerequisites": [
      "同じ数",
      "合併"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "6+6"
    },
    "answerKind": "integer",
    "semanticPattern": "同数条件を読み替えた二者合併",
    "curriculumNote": "1年のたし算として扱い、乗法記号は用いない。",
    "text": "ふたりの ぼうけんしゃが、くすりを もちよります。ミナは6こ もっていて、ケンも ミナと おなじ かず もっています。\nふたりの くすりは、あわせて なんこですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "12 こ"
  },
  {
    "id": "mwq-v2-g1-030",
    "grade": 1,
    "topic": "ひき算",
    "questionType": "一対一対応後の余り",
    "title": "りゅうとくつ",
    "story": "ちいさな りゅうが 9ひき、ほのおの くつが 13こ あります。この りゅうたちは、しっぽに くつを1こずつ つけます。",
    "question": "ぜんぶの りゅうに つけると、くつは なんこ のこりますか。",
    "answer": "4",
    "unit": "こ",
    "equation": "13-9",
    "explanation": "9ひきに1こずつで、9こ つかいます。13こから9こを ひきます。",
    "prerequisites": [
      "一対一対応",
      "ひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "13-9"
    },
    "answerKind": "integer",
    "semanticPattern": "一生体一用具の対応後の過剰分",
    "curriculumNote": "1年の20以内の加減と数量関係。",
    "text": "ちいさな りゅうが 9ひき、ほのおの くつが 13こ あります。この りゅうたちは、しっぽに くつを1こずつ つけます。\nぜんぶの りゅうに つけると、くつは なんこ のこりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        76,
        101
      ],
      "pdfPages": [
        82,
        107
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "こたえ",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 こ"
  },
  {
    "id": "mwq-v2-g2-001",
    "grade": 2,
    "topic": "かけ算",
    "questionType": "等しいまとまり",
    "title": "ランタンの回廊",
    "story": "城の回廊には、柱が6本あります。どの柱にも、ランタンを4こずつ取りつけました。",
    "question": "ランタンは、全部で何こありますか。",
    "answer": "24",
    "unit": "こ",
    "equation": "4×6",
    "explanation": "1本に4こずつで、柱は6本です。4×6で24こです。",
    "prerequisites": [
      "1つ分といくつ分",
      "4の段"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "4*6"
    },
    "answerKind": "integer",
    "semanticPattern": "支柱ごとの同数配置",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "城の回廊には、柱が6本あります。どの柱にも、ランタンを4こずつ取りつけました。\nランタンは、全部で何こありますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "24 こ"
  },
  {
    "id": "mwq-v2-g2-002",
    "grade": 2,
    "topic": "かけ算",
    "questionType": "反復作業",
    "title": "荷運びのこびと",
    "story": "こびとは、1回に石を7こ運びます。同じ数ずつ、3回運びました。",
    "question": "運んだ石は、全部で何こですか。",
    "answer": "21",
    "unit": "こ",
    "equation": "7×3",
    "explanation": "1回の7こが3回分なので、7×3です。",
    "prerequisites": [
      "7の段"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7*3"
    },
    "answerKind": "integer",
    "semanticPattern": "一定量を運ぶ作業の反復",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "こびとは、1回に石を7こ運びます。同じ数ずつ、3回運びました。\n運んだ石は、全部で何こですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "21 こ"
  },
  {
    "id": "mwq-v2-g2-003",
    "grade": 2,
    "topic": "かけ算",
    "questionType": "代金",
    "title": "薬屋の青い実",
    "story": "薬屋で青い実を買います。青い実は1こ8円で、5こ買いました。ほかの物は買っていません。",
    "question": "代金は何円ですか。",
    "answer": "40",
    "unit": "円",
    "equation": "8×5",
    "explanation": "1このねだん8円を、5こ分合わせます。",
    "prerequisites": [
      "8の段",
      "円"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "8*5"
    },
    "answerKind": "integer",
    "semanticPattern": "単価と購入個数から代金",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "薬屋で青い実を買います。青い実は1こ8円で、5こ買いました。ほかの物は買っていません。\n代金は何円ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "円",
          "required": true
        }
      ],
      "displayUnit": "円",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "えん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "40 円"
  },
  {
    "id": "mwq-v2-g2-004",
    "grade": 2,
    "topic": "かけ算",
    "questionType": "植える数",
    "title": "精霊の花だん",
    "story": "精霊の花だんが8つあります。どの花だんにも、種を7こずつまきます。",
    "question": "種は全部で何こいりますか。",
    "answer": "56",
    "unit": "こ",
    "equation": "7×8",
    "explanation": "1つの花だんに7こ、8つの花だんがあるので、7×8です。",
    "prerequisites": [
      "7の段"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7*8"
    },
    "answerKind": "integer",
    "semanticPattern": "複数栽培区画への等数配分を合計",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "精霊の花だんが8つあります。どの花だんにも、種を7こずつまきます。\n種は全部で何こいりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "56 こ"
  },
  {
    "id": "mwq-v2-g2-005",
    "grade": 2,
    "topic": "かけ算",
    "questionType": "部品数",
    "title": "三りんの荷車",
    "story": "工房で、車りんが3こずつついた荷車を4台作ります。どの荷車も同じ形です。",
    "question": "車りんは全部で何こいりますか。",
    "answer": "12",
    "unit": "こ",
    "equation": "3×4",
    "explanation": "1台に3こなので、4台では3×4です。",
    "prerequisites": [
      "3の段"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3*4"
    },
    "answerKind": "integer",
    "semanticPattern": "同型製品の構成部品総数",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "工房で、車りんが3こずつついた荷車を4台作ります。どの荷車も同じ形です。\n車りんは全部で何こいりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "12 こ"
  },
  {
    "id": "mwq-v2-g2-006",
    "grade": 2,
    "topic": "かけ算",
    "questionType": "入れ物の満量",
    "title": "ふくろいっぱいの星",
    "story": "星を入れるふくろが6つあります。どのふくろも、星を9こ入れるといっぱいになります。全部のふくろをいっぱいにします。",
    "question": "星は全部で何こいりますか。",
    "answer": "54",
    "unit": "こ",
    "equation": "9×6",
    "explanation": "1ふくろに9こずつを、6ふくろ分用意します。",
    "prerequisites": [
      "9の段"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "9*6"
    },
    "answerKind": "integer",
    "semanticPattern": "同容量容器を全て満たす",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "星を入れるふくろが6つあります。どのふくろも、星を9こ入れるといっぱいになります。全部のふくろをいっぱいにします。\n星は全部で何こいりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "54 こ"
  },
  {
    "id": "mwq-v2-g2-007",
    "grade": 2,
    "topic": "かけ算",
    "questionType": "配列",
    "title": "モザイクの門",
    "story": "門のかざりに、同じ大きさのタイルをならべます。横1れつに5まいずつ、同じれつを7れつ作りました。",
    "question": "タイルは全部で何まいですか。",
    "answer": "35",
    "unit": "まい",
    "equation": "5×7",
    "explanation": "1れつ5まいが7れつあるので、5×7です。",
    "prerequisites": [
      "5の段",
      "配列"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "5*7"
    },
    "answerKind": "integer",
    "semanticPattern": "矩形配列の個数を行単位で数える",
    "curriculumNote": "2年の乗法・配列の個数。面積公式や平方単位は要求しない。",
    "text": "門のかざりに、同じ大きさのタイルをならべます。横1れつに5まいずつ、同じれつを7れつ作りました。\nタイルは全部で何まいですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "まい",
          "required": true
        }
      ],
      "displayUnit": "まい",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "枚"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "35 まい"
  },
  {
    "id": "mwq-v2-g2-008",
    "grade": 2,
    "topic": "かけ算",
    "questionType": "周期の総数",
    "title": "合図のたいこ",
    "story": "見はりは、たいこを「ドン、ドン、ドン」と3回たたいてから休みます。この合図を8回くり返しました。",
    "question": "たいこをたたいた回数は、全部で何回ですか。",
    "answer": "24",
    "unit": "回",
    "equation": "3×8",
    "explanation": "1つの合図に3回たたき、その合図が8回あるので、3×8です。",
    "prerequisites": [
      "3の段"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3*8"
    },
    "answerKind": "integer",
    "semanticPattern": "一周期内回数と周期数の積",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "見はりは、たいこを「ドン、ドン、ドン」と3回たたいてから休みます。この合図を8回くり返しました。\nたいこをたたいた回数は、全部で何回ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "回",
          "required": true
        }
      ],
      "displayUnit": "回",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "24 回"
  },
  {
    "id": "mwq-v2-g2-009",
    "grade": 2,
    "topic": "たし算とひき算",
    "questionType": "初期量の逆思考",
    "title": "増えた銀の羽",
    "story": "銀の羽を入れた箱があります。あとから29まい入れると、全部で74まいになりました。とちゅうで取り出してはいません。",
    "question": "はじめに、銀の羽は何まい入っていましたか。",
    "answer": "45",
    "unit": "まい",
    "equation": "74-29",
    "explanation": "入れた29まいを、今の74まいから引くとはじめの数です。",
    "prerequisites": [
      "2位数のひき算",
      "増加の逆思考"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "74-29"
    },
    "answerKind": "integer",
    "semanticPattern": "増加後の全体と増加量から初期量",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "銀の羽を入れた箱があります。あとから29まい入れると、全部で74まいになりました。とちゅうで取り出してはいません。\nはじめに、銀の羽は何まい入っていましたか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "まい",
          "required": true
        }
      ],
      "displayUnit": "まい",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "枚"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "45 まい"
  },
  {
    "id": "mwq-v2-g2-010",
    "grade": 2,
    "topic": "たし算とひき算",
    "questionType": "変化量の逆思考",
    "title": "帰ってきた伝書鳥",
    "story": "鳥小屋に伝書鳥が38わいました。何わか帰ってきて、65わになりました。出ていった鳥はいません。",
    "question": "帰ってきた伝書鳥は何わですか。",
    "answer": "27",
    "unit": "わ",
    "equation": "65-38",
    "explanation": "帰ってきた数は、65わと38わのちがいです。",
    "prerequisites": [
      "2位数のひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "65-38"
    },
    "answerKind": "integer",
    "semanticPattern": "初期量と増加後から増加量",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "鳥小屋に伝書鳥が38わいました。何わか帰ってきて、65わになりました。出ていった鳥はいません。\n帰ってきた伝書鳥は何わですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "わ",
          "required": true
        }
      ],
      "displayUnit": "わ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "27 わ"
  },
  {
    "id": "mwq-v2-g2-011",
    "grade": 2,
    "topic": "たし算とひき算",
    "questionType": "減少量の逆思考",
    "title": "売れた薬びん",
    "story": "朝、薬屋には薬びんが82本ありました。いくつか売ったので、残りは46本です。新しく入れた薬びんはありません。",
    "question": "売れた薬びんは何本ですか。",
    "answer": "36",
    "unit": "本",
    "equation": "82-46",
    "explanation": "朝の82本から残り46本を引くと、売れた数が分かります。",
    "prerequisites": [
      "2位数のひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "82-46"
    },
    "answerKind": "integer",
    "semanticPattern": "初期量と残量から流出量",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "朝、薬屋には薬びんが82本ありました。いくつか売ったので、残りは46本です。新しく入れた薬びんはありません。\n売れた薬びんは何本ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "本",
          "required": true
        }
      ],
      "displayUnit": "本",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ほん",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "36 本"
  },
  {
    "id": "mwq-v2-g2-012",
    "grade": 2,
    "topic": "たし算とひき算",
    "questionType": "初期量の逆思考",
    "title": "パン屋の焼きだめ",
    "story": "パン屋は、旅人にパンを36こわたしました。そのあとに数えると、パンは28こ残っていました。この間に新しく焼いていません。",
    "question": "わたす前には、パンが何こありましたか。",
    "answer": "64",
    "unit": "こ",
    "equation": "36+28",
    "explanation": "わたした36こと残った28こを合わせると、はじめの数です。",
    "prerequisites": [
      "2位数のたし算",
      "減少の逆思考"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "36+28"
    },
    "answerKind": "integer",
    "semanticPattern": "流出量と残量から初期量",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "パン屋は、旅人にパンを36こわたしました。そのあとに数えると、パンは28こ残っていました。この間に新しく焼いていません。\nわたす前には、パンが何こありましたか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "64 こ"
  },
  {
    "id": "mwq-v2-g2-013",
    "grade": 2,
    "topic": "たし算とひき算",
    "questionType": "比較の逆思考",
    "title": "二つの水晶庫",
    "story": "北の水晶庫には水晶が84こあります。北は南より17こ多いそうです。",
    "question": "南の水晶庫には、水晶が何こありますか。",
    "answer": "67",
    "unit": "こ",
    "equation": "84-17",
    "explanation": "多いほうの北から、ちがいの17こを引くと南の数になります。",
    "prerequisites": [
      "比較の逆思考"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "84-17"
    },
    "answerKind": "integer",
    "semanticPattern": "比較量が多い表現から基準量を逆算",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "北の水晶庫には水晶が84こあります。北は南より17こ多いそうです。\n南の水晶庫には、水晶が何こありますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "67 こ"
  },
  {
    "id": "mwq-v2-g2-014",
    "grade": 2,
    "topic": "たし算とひき算",
    "questionType": "比較の逆思考",
    "title": "短いほうのリボン",
    "story": "妖精の赤いリボンは56cmです。赤いリボンは、青いリボンより19cm短いそうです。",
    "question": "青いリボンは何cmですか。",
    "answer": "75",
    "unit": "cm",
    "equation": "56+19",
    "explanation": "青いリボンは、赤い56cmより19cm長いので、56+19です。",
    "prerequisites": [
      "比較の逆思考",
      "cm"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "56+19"
    },
    "answerKind": "integer",
    "semanticPattern": "短い側の実量と差から長い側を求める",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "妖精の赤いリボンは56cmです。赤いリボンは、青いリボンより19cm短いそうです。\n青いリボンは何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "75 cm"
  },
  {
    "id": "mwq-v2-g2-015",
    "grade": 2,
    "topic": "3つの数の計算",
    "questionType": "二度の買物",
    "title": "村を出るしたく",
    "story": "勇者は500円持っていました。地図を180円で買い、水筒を230円で買いました。おつりのほかに、お金はもらっていません。",
    "question": "お金は何円残っていますか。",
    "answer": "90",
    "unit": "円",
    "equation": "500-180-230",
    "explanation": "500円から180円と230円を引きます。500-180は320、320-230は90です。",
    "prerequisites": [
      "3位数の加減",
      "円"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "500-180-230"
    },
    "answerKind": "integer",
    "semanticPattern": "手持ち金から異なる二支出を除く",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "勇者は500円持っていました。地図を180円で買い、水筒を230円で買いました。おつりのほかに、お金はもらっていません。\nお金は何円残っていますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "円",
          "required": true
        }
      ],
      "displayUnit": "円",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "えん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "90 円"
  },
  {
    "id": "mwq-v2-g2-016",
    "grade": 2,
    "topic": "数の表し方",
    "questionType": "空位の位取り",
    "title": "番号604の倉庫",
    "story": "倉庫の番号を読みます。百の位は6、十の位は0、一の位は4です。",
    "question": "倉庫の番号は何ですか。",
    "answer": "604",
    "unit": "",
    "equation": "600+4",
    "explanation": "6百と4で604です。十の位が0でも、その場所をなくしてはいけません。",
    "prerequisites": [
      "3位数の位取り",
      "空位の0"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "600+4"
    },
    "answerKind": "integer",
    "semanticPattern": "十の位が空位の三桁数を構成",
    "curriculumNote": "2年の1000までの数。計算は位取りの確認用。",
    "text": "倉庫の番号を読みます。百の位は6、十の位は0、一の位は4です。\n倉庫の番号は何ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "604"
  },
  {
    "id": "mwq-v2-g2-017",
    "grade": 2,
    "topic": "数の表し方",
    "questionType": "目標までの不足",
    "title": "千こ集める星の砂",
    "story": "星の砂を1000こ集めると、古い門を開けられます。今までに780こ集まりました。",
    "question": "あと何こ集めると1000こになりますか。",
    "answer": "220",
    "unit": "こ",
    "equation": "1000-780",
    "explanation": "目標の1000こから、集まった780こを引きます。",
    "prerequisites": [
      "1000までの数",
      "何十の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1000-780"
    },
    "answerKind": "integer",
    "semanticPattern": "千を目標とする補数",
    "curriculumNote": "2年の1000までの数。何十単位での補数。",
    "text": "星の砂を1000こ集めると、古い門を開けられます。今までに780こ集まりました。\nあと何こ集めると1000こになりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "220 こ"
  },
  {
    "id": "mwq-v2-g2-018",
    "grade": 2,
    "topic": "数の表し方",
    "questionType": "位の合成",
    "title": "水晶の数え札",
    "story": "工房では、水晶の数を札に書きます。100こを表す札が3まい、10こを表す札が4まい、1こを表す札が8まいあります。",
    "question": "札が表す水晶は、全部で何こですか。",
    "answer": "348",
    "unit": "こ",
    "equation": "300+40+8",
    "explanation": "100こが3つで300こ、10こが4つで40こです。8こも合わせて348こです。",
    "prerequisites": [
      "3位数の位取り"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "300+40+8"
    },
    "answerKind": "integer",
    "semanticPattern": "百十一本位の束を数に合成",
    "curriculumNote": "2年の3位数。100の段の九九は要求しない。",
    "text": "工房では、水晶の数を札に書きます。100こを表す札が3まい、10こを表す札が4まい、1こを表す札が8まいあります。\n札が表す水晶は、全部で何こですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "こ",
          "required": true
        }
      ],
      "displayUnit": "こ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "個"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "348 こ"
  },
  {
    "id": "mwq-v2-g2-019",
    "grade": 2,
    "topic": "数の表し方",
    "questionType": "十ずつの増加",
    "title": "足あとの道しるべ",
    "story": "道しるべの番号は470です。次の道しるべへ進むと番号が10増え、その次へ進むとまた10増えます。",
    "question": "二つ先の道しるべの番号は何ですか。",
    "answer": "490",
    "unit": "",
    "equation": "470+10+10",
    "explanation": "470から10を2回たすと、480、490になります。",
    "prerequisites": [
      "1000までの数",
      "十を単位にした数え方"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "470+10+10"
    },
    "answerKind": "integer",
    "semanticPattern": "数直線上の十刻み二段進行",
    "curriculumNote": "2年の整数の加減・乗法と測定の範囲。",
    "text": "道しるべの番号は470です。次の道しるべへ進むと番号が10増え、その次へ進むとまた10増えます。\n二つ先の道しるべの番号は何ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "490"
  },
  {
    "id": "mwq-v2-g2-020",
    "grade": 2,
    "topic": "長さ",
    "questionType": "mとcmの合成",
    "title": "橋の手すり",
    "story": "橋の手すりに使う板は、長さが1m35cmです。",
    "question": "この板の長さを、cmだけで表すと何cmですか。",
    "answer": "135",
    "unit": "cm",
    "equation": "100+35",
    "explanation": "1mは100cmです。100cmに35cmをたします。",
    "prerequisites": [
      "1m=100cm"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "100+35"
    },
    "answerKind": "integer",
    "semanticPattern": "複名数の長さを単名数に変換",
    "curriculumNote": "2年のm・cm。小数表記は要求しない。",
    "text": "橋の手すりに使う板は、長さが1m35cmです。\nこの板の長さを、cmだけで表すと何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "135 cm"
  },
  {
    "id": "mwq-v2-g2-021",
    "grade": 2,
    "topic": "長さ",
    "questionType": "cmとmmの合成",
    "title": "工房の小さなねじ",
    "story": "工房のねじの長さは8cm7mmです。",
    "question": "ねじの長さを、mmだけで表すと何mmですか。",
    "answer": "87",
    "unit": "mm",
    "equation": "80+7",
    "explanation": "1cmは10mmなので、8cmは80mmです。7mmをたすと87mmです。",
    "prerequisites": [
      "1cm=10mm"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "80+7"
    },
    "answerKind": "integer",
    "semanticPattern": "cmとmmの複名数変換",
    "curriculumNote": "2年のcm・mm。",
    "text": "工房のねじの長さは8cm7mmです。\nねじの長さを、mmだけで表すと何mmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "mm",
          "required": true
        }
      ],
      "displayUnit": "mm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ミリメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "87 mm"
  },
  {
    "id": "mwq-v2-g2-022",
    "grade": 2,
    "topic": "長さ",
    "questionType": "単位をそろえた残り",
    "title": "つえを作る木",
    "story": "長さ1m25cmの木から、78cmのつえを1本切り出します。切りくずによる長さの減りはないものとします。",
    "question": "残る木の長さは何cmですか。",
    "answer": "47",
    "unit": "cm",
    "equation": "125-78",
    "explanation": "1m25cmは125cmです。125cmから78cmを引きます。",
    "prerequisites": [
      "1m=100cm",
      "3位数のひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "125-78"
    },
    "answerKind": "integer",
    "semanticPattern": "複名数を単名数に直して部分長を除く",
    "curriculumNote": "2年のm・cmと加減。切りしろなしを明記。",
    "text": "長さ1m25cmの木から、78cmのつえを1本切り出します。切りくずによる長さの減りはないものとします。\n残る木の長さは何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "47 cm"
  },
  {
    "id": "mwq-v2-g2-023",
    "grade": 2,
    "topic": "かさ",
    "questionType": "LとdLの合成",
    "title": "青い泉のびん",
    "story": "青い泉からくんだ水は、2L6dLあります。",
    "question": "水のかさを、dLだけで表すと何dLですか。",
    "answer": "26",
    "unit": "dL",
    "equation": "20+6",
    "explanation": "1Lは10dLなので、2Lは20dLです。6dLをたします。",
    "prerequisites": [
      "1L=10dL"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "20+6"
    },
    "answerKind": "integer",
    "semanticPattern": "LとdLの複名数変換",
    "curriculumNote": "2年のL・dL。mLの複雑換算は要求しない。",
    "text": "青い泉からくんだ水は、2L6dLあります。\n水のかさを、dLだけで表すと何dLですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "dL",
          "required": true
        }
      ],
      "displayUnit": "dL",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "26 dL"
  },
  {
    "id": "mwq-v2-g2-024",
    "grade": 2,
    "topic": "かさ",
    "questionType": "単位をそろえた残り",
    "title": "ランプの油",
    "story": "ランプの油が1Lあります。そのうち7dLを使いました。",
    "question": "油は何dL残っていますか。",
    "answer": "3",
    "unit": "dL",
    "equation": "10-7",
    "explanation": "1Lを10dLに直して、7dLを引きます。",
    "prerequisites": [
      "1L=10dL",
      "ひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "10-7"
    },
    "answerKind": "integer",
    "semanticPattern": "単位変換を伴う消費後の残量",
    "curriculumNote": "2年のL・dL。",
    "text": "ランプの油が1Lあります。そのうち7dLを使いました。\n油は何dL残っていますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "dL",
          "required": true
        }
      ],
      "displayUnit": "dL",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "3 dL"
  },
  {
    "id": "mwq-v2-g2-025",
    "grade": 2,
    "topic": "かさ",
    "questionType": "三容器の合計",
    "title": "雨水を集めるこびと",
    "story": "こびとは、雨水を三つの入れ物に集めました。つぼに3L、かめに4L、たるに2L入っています。",
    "question": "雨水は、全部で何Lありますか。",
    "answer": "9",
    "unit": "L",
    "equation": "3+4+2",
    "explanation": "3Lと4Lと2Lを合わせます。",
    "prerequisites": [
      "L",
      "3数のたし算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3+4+2"
    },
    "answerKind": "integer",
    "semanticPattern": "異なる容器にある同単位の量の合計",
    "curriculumNote": "2年のL。容器の形から量を推測させない。",
    "text": "こびとは、雨水を三つの入れ物に集めました。つぼに3L、かめに4L、たるに2L入っています。\n雨水は、全部で何Lありますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "L",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "9 L"
  },
  {
    "id": "mwq-v2-g2-026",
    "grade": 2,
    "topic": "時刻と時間",
    "questionType": "時刻に時間を加える",
    "title": "門が開く時刻",
    "story": "城の門番は、午前7時40分から20分間、門の点けんをします。点けんが終わるとすぐ門を開けます。",
    "question": "門を開けるのは午前何時何分ですか。「6:15」の形で答えてください。",
    "answer": "8:00",
    "unit": "",
    "equation": "7時40分+20分",
    "explanation": "7時40分から20分進むと8時ちょうどです。",
    "prerequisites": [
      "時計の分",
      "1時間=60分"
    ],
    "check": {
      "kind": "clock_add",
      "values": [
        7,
        40,
        20
      ]
    },
    "answerKind": "time",
    "semanticPattern": "正時へ到達する時間加算",
    "curriculumNote": "2年の時刻と時間。午前内・日またぎなし。",
    "text": "城の門番は、午前7時40分から20分間、門の点けんをします。点けんが終わるとすぐ門を開けます。\n門を開けるのは午前何時何分ですか。「6:15」の形で答えてください。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "time",
      "fields": [
        {
          "name": "hours",
          "label": "時",
          "keyboard": "integer",
          "unit": "時",
          "required": true
        },
        {
          "name": "minutes",
          "label": "分",
          "keyboard": "integer",
          "unit": "分",
          "required": true
        }
      ],
      "displayUnit": "",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "clock_fields",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "時/分の二欄",
        "H:MM",
        "H時M分",
        "全角数字"
      ]
    },
    "answerDisplay": "8:00"
  },
  {
    "id": "mwq-v2-g2-027",
    "grade": 2,
    "topic": "時刻と時間",
    "questionType": "同じ時間内の経過",
    "title": "薬を冷ます時間",
    "story": "薬屋は、午前9時15分に薬を冷まし始め、午前9時50分にしまいました。",
    "question": "薬を冷ましていたのは何分間ですか。",
    "answer": "35",
    "unit": "分",
    "equation": "50-15",
    "explanation": "同じ9時台なので、50分から15分を引いて35分間です。",
    "prerequisites": [
      "時計の分",
      "時間の差"
    ],
    "check": {
      "kind": "elapsed_minutes",
      "values": [
        9,
        15,
        9,
        50
      ]
    },
    "answerKind": "integer",
    "semanticPattern": "同一時内の開始終了から経過",
    "curriculumNote": "2年の時刻と時間。日またぎなし。",
    "text": "薬屋は、午前9時15分に薬を冷まし始め、午前9時50分にしまいました。\n薬を冷ましていたのは何分間ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "分",
          "required": true
        }
      ],
      "displayUnit": "分",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ふん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "35 分"
  },
  {
    "id": "mwq-v2-g2-028",
    "grade": 2,
    "topic": "時刻と時間",
    "questionType": "時間単位の合成",
    "title": "妖精の旅じたく",
    "story": "妖精は、服のしたくに1時間、かばんのしたくに20分かかりました。休まず続けて行いました。",
    "question": "したくにかかった時間は、全部で何分間ですか。",
    "answer": "80",
    "unit": "分",
    "equation": "60+20",
    "explanation": "1時間は60分です。20分をたすと80分間です。",
    "prerequisites": [
      "1時間=60分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "60+20"
    },
    "answerKind": "integer",
    "semanticPattern": "二作業の時間を分へ統一して合算",
    "curriculumNote": "2年の時間単位。時刻との混同を避ける。",
    "text": "妖精は、服のしたくに1時間、かばんのしたくに20分かかりました。休まず続けて行いました。\nしたくにかかった時間は、全部で何分間ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "分",
          "required": true
        }
      ],
      "displayUnit": "分",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ふん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "80 分"
  },
  {
    "id": "mwq-v2-g2-029",
    "grade": 2,
    "topic": "表と計算",
    "questionType": "分類表の総数",
    "title": "森の鳥の調べ",
    "story": "森の見はりが、今日来た鳥を種類ごとに数えました。コマドリ14わ、フクロウ8わ、カラス11わです。同じ鳥を二度は数えていません。",
    "question": "調べた鳥は、全部で何わですか。",
    "answer": "33",
    "unit": "わ",
    "equation": "14+8+11",
    "explanation": "種類ごとの14わ、8わ、11わを合わせます。",
    "prerequisites": [
      "分類の意味",
      "2位数の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "14+8+11"
    },
    "answerKind": "integer",
    "semanticPattern": "互いに重ならない分類の総数",
    "curriculumNote": "2年の分類整理の読み取りと加法。表の代わりに文で値を示す。",
    "text": "森の見はりが、今日来た鳥を種類ごとに数えました。コマドリ14わ、フクロウ8わ、カラス11わです。同じ鳥を二度は数えていません。\n調べた鳥は、全部で何わですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "わ",
          "required": true
        }
      ],
      "displayUnit": "わ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "33 わ"
  },
  {
    "id": "mwq-v2-g2-030",
    "grade": 2,
    "topic": "かけ算とたし算",
    "questionType": "まとまりとばら",
    "title": "箱に入らない薬草",
    "story": "薬草の葉を、1箱に6まいずつ入れました。いっぱいの箱が4箱あり、箱に入れていない葉が5まいあります。",
    "question": "薬草の葉は、全部で何まいですか。",
    "answer": "29",
    "unit": "まい",
    "equation": "6×4+5",
    "explanation": "箱の中は6×4で24まいです。外の5まいを合わせて29まいです。",
    "prerequisites": [
      "6の段",
      "まとまりと端数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "6*4+5"
    },
    "answerKind": "integer",
    "semanticPattern": "等量容器内の総数と未収容分の合併",
    "curriculumNote": "2年の九九の活用と加法。除法で箱数は求めない。",
    "text": "薬草の葉を、1箱に6まいずつ入れました。いっぱいの箱が4箱あり、箱に入れていない葉が5まいあります。\n薬草の葉は、全部で何まいですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        102,
        133
      ],
      "pdfPages": [
        108,
        139
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "まい",
          "required": true
        }
      ],
      "displayUnit": "まい",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "枚"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "29 まい"
  },
  {
    "id": "mwq-v2-g3-001",
    "grade": 3,
    "topic": "わり算",
    "questionType": "等分除",
    "title": "六人の薬草師",
    "story": "薬草の葉が24枚あります。6人の薬草師に、同じ枚数ずつ、残らないように配ります。",
    "question": "1人分は何枚ですか。",
    "answer": "4",
    "unit": "枚",
    "equation": "24÷6",
    "explanation": "24枚を6人で同じ数ずつ分けるので、24÷6で4枚です。",
    "prerequisites": [
      "九九",
      "等分除"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "24/6"
    },
    "answerKind": "integer",
    "semanticPattern": "全体と人数から一人分を求める",
    "curriculumNote": "3年の四則・測定と数量関係の範囲。",
    "text": "薬草の葉が24枚あります。6人の薬草師に、同じ枚数ずつ、残らないように配ります。\n1人分は何枚ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "枚",
          "required": true
        }
      ],
      "displayUnit": "枚",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "まい"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 枚"
  },
  {
    "id": "mwq-v2-g3-002",
    "grade": 3,
    "topic": "わり算",
    "questionType": "包含除",
    "title": "回復の小びん",
    "story": "回復薬が35dLあります。1本に5dLずつ入る小びんに分けます。",
    "question": "いっぱいの小びんは何本できますか。",
    "answer": "7",
    "unit": "本",
    "equation": "35÷5",
    "explanation": "35dLの中に5dLがいくつあるかを求めます。35÷5は7です。",
    "prerequisites": [
      "九九",
      "包含除",
      "dL"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "35/5"
    },
    "answerKind": "integer",
    "semanticPattern": "全量と一容器量から満杯容器数",
    "curriculumNote": "3年の四則・測定と数量関係の範囲。",
    "text": "回復薬が35dLあります。1本に5dLずつ入る小びんに分けます。\nいっぱいの小びんは何本できますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "本",
          "required": true
        }
      ],
      "displayUnit": "本",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ほん",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "7 本"
  },
  {
    "id": "mwq-v2-g3-003",
    "grade": 3,
    "topic": "あまりのあるわり算",
    "questionType": "商と余り",
    "title": "四人の見習い",
    "story": "星の石が26個あります。4人の見習いに、同じ個数ずつ、できるだけ多く配ります。石を割ることはできません。",
    "question": "1人に何個ずつ配れ、何個余りますか。",
    "answer": "6",
    "unit": "個ずつ",
    "equation": "26÷4=6あまり2",
    "explanation": "4×6は24で、26-24は2です。1人6個ずつ配れて2個余ります。",
    "prerequisites": [
      "九九",
      "余りはわる数より小さい"
    ],
    "check": {
      "kind": "remainder",
      "values": [
        26,
        4
      ]
    },
    "answerKind": "remainder",
    "semanticPattern": "等分除の商と余りを併記",
    "curriculumNote": "3年のあまりのある除法。正準answerは商、remainderは余り。",
    "remainder": 2,
    "remainderUnit": "個",
    "text": "星の石が26個あります。4人の見習いに、同じ個数ずつ、できるだけ多く配ります。石を割ることはできません。\n1人に何個ずつ配れ、何個余りますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "remainder",
      "fields": [
        {
          "name": "quotient",
          "label": "商",
          "keyboard": "integer",
          "unit": "個ずつ",
          "required": true
        },
        {
          "name": "remainder",
          "label": "余り",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個ずつ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "quotient_and_remainder",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "商/余りの二欄",
        "qあまりr",
        "全角数字"
      ]
    },
    "answerDisplay": "6 個ずつ、余り2個"
  },
  {
    "id": "mwq-v2-g3-004",
    "grade": 3,
    "topic": "あまりのあるわり算",
    "questionType": "切り上げ",
    "title": "全員を乗せる馬車",
    "story": "城へ向かう旅人が29人います。馬車には、旅人を1台に4人まで乗せられます。運転手は別の席に座り、旅人の席を使いません。",
    "question": "29人全員が同時に乗るには、馬車は少なくとも何台必要ですか。",
    "answer": "8",
    "unit": "台",
    "equation": "29÷4=7あまり1、7+1=8",
    "explanation": "7台では28人までです。残る1人のためにもう1台必要なので、8台です。",
    "prerequisites": [
      "あまりのあるわり算",
      "必要数の解釈"
    ],
    "check": {
      "kind": "ceil_div",
      "values": [
        29,
        4
      ]
    },
    "answerKind": "integer",
    "semanticPattern": "定員で割った余りを追加一台へ切り上げ",
    "curriculumNote": "3年の余りの解釈。運転手席と同時輸送を明記。",
    "text": "城へ向かう旅人が29人います。馬車には、旅人を1台に4人まで乗せられます。運転手は別の席に座り、旅人の席を使いません。\n29人全員が同時に乗るには、馬車は少なくとも何台必要ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "台",
          "required": true
        }
      ],
      "displayUnit": "台",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "だい"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 台"
  },
  {
    "id": "mwq-v2-g3-005",
    "grade": 3,
    "topic": "あまりのあるわり算",
    "questionType": "切り捨て",
    "title": "完全な矢のセット",
    "story": "矢が33本あります。1セットを5本にして売ります。5本そろわないものは、セットとして売れません。",
    "question": "売れるセットは、いくつできますか。",
    "answer": "6",
    "unit": "セット",
    "equation": "33÷5=6あまり3",
    "explanation": "5本ずつなら6セットでき、3本余ります。余った3本はセットにできないので、答えは6セットです。",
    "prerequisites": [
      "あまりのあるわり算",
      "商の意味"
    ],
    "check": {
      "kind": "floor_div",
      "values": [
        33,
        5
      ]
    },
    "answerKind": "integer",
    "semanticPattern": "必要部品が揃う完全製品のみ数える",
    "curriculumNote": "3年の余りの解釈。端数を切り上げない。",
    "text": "矢が33本あります。1セットを5本にして売ります。5本そろわないものは、セットとして売れません。\n売れるセットは、いくつできますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "セット",
          "required": true
        }
      ],
      "displayUnit": "セット",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "6 セット"
  },
  {
    "id": "mwq-v2-g3-006",
    "grade": 3,
    "topic": "あまりのあるわり算",
    "questionType": "余った物の数",
    "title": "六つずつのたまご",
    "story": "竜のたまごが19個あります。1箱に6個ずつ入れ、いっぱいの箱を3箱作りました。",
    "question": "箱に入らなかったたまごは何個ですか。",
    "answer": "1",
    "unit": "個",
    "equation": "19-6×3",
    "explanation": "いっぱいの3箱には6×3で18個入ります。19個から18個を引くと1個です。",
    "prerequisites": [
      "九九",
      "余りの意味"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "19-(6*3)"
    },
    "answerKind": "integer",
    "semanticPattern": "満杯箱に収容した分を除いた残余",
    "curriculumNote": "3年の余り。ここでは求める量を余りだけに限定。",
    "text": "竜のたまごが19個あります。1箱に6個ずつ入れ、いっぱいの箱を3箱作りました。\n箱に入らなかったたまごは何個ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "こ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "1 個"
  },
  {
    "id": "mwq-v2-g3-007",
    "grade": 3,
    "topic": "かけ算とひき算",
    "questionType": "二段階",
    "title": "砦に残る薬",
    "story": "砦に、薬が24個入った箱を3箱届けました。そのうち28個を見張りに渡しました。ほかに薬はありません。",
    "question": "砦に残った薬は何個ですか。",
    "answer": "44",
    "unit": "個",
    "equation": "24×3-28",
    "explanation": "届けた薬は24×3で72個です。28個渡したので、72-28で44個残ります。",
    "prerequisites": [
      "2位数×1位数",
      "ひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "24*3-28"
    },
    "answerKind": "integer",
    "semanticPattern": "箱数から総量を求め配布量を控除",
    "curriculumNote": "3年の四則・測定と数量関係の範囲。",
    "text": "砦に、薬が24個入った箱を3箱届けました。そのうち28個を見張りに渡しました。ほかに薬はありません。\n砦に残った薬は何個ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "こ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "44 個"
  },
  {
    "id": "mwq-v2-g3-008",
    "grade": 3,
    "topic": "わり算とたし算",
    "questionType": "二段階",
    "title": "二つの倉庫の灯り",
    "story": "84個のランタンを、7つの倉庫に同じ数ずつ配ります。北の倉庫には、配られるランタンとは別に9個置いてあります。",
    "question": "配ったあと、北の倉庫にはランタンが何個ありますか。",
    "answer": "21",
    "unit": "個",
    "equation": "84÷7+9",
    "explanation": "配られるのは1倉庫に84÷7で12個です。北にあった9個を足して21個です。",
    "prerequisites": [
      "等分除",
      "たし算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "84/7+9"
    },
    "answerKind": "integer",
    "semanticPattern": "均等配布による受取量と既存在庫の合併",
    "curriculumNote": "3年の四則・測定と数量関係の範囲。",
    "text": "84個のランタンを、7つの倉庫に同じ数ずつ配ります。北の倉庫には、配られるランタンとは別に9個置いてあります。\n配ったあと、北の倉庫にはランタンが何個ありますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "こ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "21 個"
  },
  {
    "id": "mwq-v2-g3-009",
    "grade": 3,
    "topic": "たし算とわり算",
    "questionType": "二段階",
    "title": "二隊のきのみ",
    "story": "東の隊が木の実を18個、西の隊が30個集めました。合わせた木の実を6人で同じ個数ずつ分けます。",
    "question": "1人分は何個ですか。",
    "answer": "8",
    "unit": "個",
    "equation": "(18+30)÷6",
    "explanation": "木の実は全部で48個です。48個を6人で分けると、1人8個です。",
    "prerequisites": [
      "たし算",
      "等分除"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(18+30)/6"
    },
    "answerKind": "integer",
    "semanticPattern": "二者合併後の均等分割",
    "curriculumNote": "3年の四則・測定と数量関係の範囲。",
    "text": "東の隊が木の実を18個、西の隊が30個集めました。合わせた木の実を6人で同じ個数ずつ分けます。\n1人分は何個ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "こ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 個"
  },
  {
    "id": "mwq-v2-g3-010",
    "grade": 3,
    "topic": "ひき算とかけ算",
    "questionType": "二段階",
    "title": "使える板だけ運ぶ",
    "story": "橋の修理用の板が8枚あります。そのうち3枚にはひびがあるので使いません。使う板は、1枚の重さが3kgで、どれも同じです。",
    "question": "使う板全部の重さは何kgですか。",
    "answer": "15",
    "unit": "kg",
    "equation": "(8-3)×3",
    "explanation": "使う板は8-3で5枚です。1枚3kgなので、3×5で15kgです。",
    "prerequisites": [
      "ひき算",
      "かけ算",
      "kg"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(8-3)*3"
    },
    "answerKind": "integer",
    "semanticPattern": "不適格品を除いてから一個量を掛ける",
    "curriculumNote": "3年の四則・測定と数量関係の範囲。",
    "text": "橋の修理用の板が8枚あります。そのうち3枚にはひびがあるので使いません。使う板は、1枚の重さが3kgで、どれも同じです。\n使う板全部の重さは何kgですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "kg",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "15 kg"
  },
  {
    "id": "mwq-v2-g3-011",
    "grade": 3,
    "topic": "時刻と時間",
    "questionType": "時をまたぐ加算",
    "title": "薬を煮終える時刻",
    "story": "薬屋は、午前9時35分から45分間、薬を煮ます。火を止めるまで、休みません。",
    "question": "煮終えるのは午前何時何分ですか。「11:05」の形で答えてください。",
    "answer": "10:20",
    "unit": "",
    "equation": "9時35分+45分",
    "explanation": "10時まで25分です。残りの20分を進めるので10時20分です。",
    "prerequisites": [
      "1時間=60分",
      "時刻と時間"
    ],
    "check": {
      "kind": "clock_add",
      "values": [
        9,
        35,
        45
      ]
    },
    "answerKind": "time",
    "semanticPattern": "正時を越える分単位の終了時刻",
    "curriculumNote": "3年の時刻と時間。午前内・日またぎなし。",
    "text": "薬屋は、午前9時35分から45分間、薬を煮ます。火を止めるまで、休みません。\n煮終えるのは午前何時何分ですか。「11:05」の形で答えてください。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "time",
      "fields": [
        {
          "name": "hours",
          "label": "時",
          "keyboard": "integer",
          "unit": "時",
          "required": true
        },
        {
          "name": "minutes",
          "label": "分",
          "keyboard": "integer",
          "unit": "分",
          "required": true
        }
      ],
      "displayUnit": "",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "clock_fields",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "時/分の二欄",
        "H:MM",
        "H時M分",
        "全角数字"
      ]
    },
    "answerDisplay": "10:20"
  },
  {
    "id": "mwq-v2-g3-012",
    "grade": 3,
    "topic": "時刻と時間",
    "questionType": "分秒の単位変換",
    "title": "門の開く音楽",
    "story": "魔法の門では、2分15秒の音楽が終わると、かぎが開きます。",
    "question": "音楽の長さは、全部で何秒ですか。",
    "answer": "135",
    "unit": "秒",
    "equation": "2×60+15",
    "explanation": "1分は60秒なので、2分は120秒です。15秒を加えると135秒です。",
    "prerequisites": [
      "1分=60秒",
      "2位数×1位数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "2*60+15"
    },
    "answerKind": "integer",
    "semanticPattern": "分秒複名数を秒に変換",
    "curriculumNote": "3年で秒を扱う。",
    "text": "魔法の門では、2分15秒の音楽が終わると、かぎが開きます。\n音楽の長さは、全部で何秒ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "秒",
          "required": true
        }
      ],
      "displayUnit": "秒",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "びょう"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "135 秒"
  },
  {
    "id": "mwq-v2-g3-013",
    "grade": 3,
    "topic": "時刻と時間",
    "questionType": "分秒の差",
    "title": "二つの魔法の準備",
    "story": "光の魔法の準備には3分20秒、風の魔法の準備には2分45秒かかります。",
    "question": "光の魔法は、風の魔法より何秒長くかかりますか。",
    "answer": "35",
    "unit": "秒",
    "equation": "(3×60+20)-(2×60+45)",
    "explanation": "3分20秒は200秒、2分45秒は165秒です。200-165で35秒です。",
    "prerequisites": [
      "1分=60秒",
      "時間の差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(3*60+20)-(2*60+45)"
    },
    "answerKind": "integer",
    "semanticPattern": "異なる分秒表記を統一して経過量比較",
    "curriculumNote": "3年の時間の単位と差。",
    "text": "光の魔法の準備には3分20秒、風の魔法の準備には2分45秒かかります。\n光の魔法は、風の魔法より何秒長くかかりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "秒",
          "required": true
        }
      ],
      "displayUnit": "秒",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "びょう"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "35 秒"
  },
  {
    "id": "mwq-v2-g3-014",
    "grade": 3,
    "topic": "時刻と時間",
    "questionType": "時をまたぐ経過",
    "title": "空飛ぶ船のそうじ",
    "story": "空飛ぶ船のそうじを、午後2時20分に始め、同じ日の午後3時5分に終えました。",
    "question": "そうじにかかった時間は何分間ですか。",
    "answer": "45",
    "unit": "分",
    "equation": "(15×60+5)-(14×60+20)",
    "explanation": "午後2時20分から3時までは40分、そこから5分で、合わせて45分です。",
    "prerequisites": [
      "1時間=60分",
      "経過時間"
    ],
    "check": {
      "kind": "elapsed_minutes",
      "values": [
        14,
        20,
        15,
        5
      ]
    },
    "answerKind": "integer",
    "semanticPattern": "正時をまたぐ開始終了時刻の差",
    "curriculumNote": "3年の時間。同じ午後内で日またぎなし。",
    "text": "空飛ぶ船のそうじを、午後2時20分に始め、同じ日の午後3時5分に終えました。\nそうじにかかった時間は何分間ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "分",
          "required": true
        }
      ],
      "displayUnit": "分",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ふん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "45 分"
  },
  {
    "id": "mwq-v2-g3-015",
    "grade": 3,
    "topic": "長さ",
    "questionType": "kmとmの合成",
    "title": "二つの橋を通る道",
    "story": "森の入口から古い橋まで1km350m、古い橋から城の門まで850mです。この道を順に進み、道の重なる区間はありません。",
    "question": "森の入口から城の門までは、全部で何mですか。",
    "answer": "2200",
    "unit": "m",
    "equation": "1350+850",
    "explanation": "1km350mは1350mです。850mを加えると2200mです。",
    "prerequisites": [
      "1km=1000m",
      "4位数の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1350+850"
    },
    "answerKind": "integer",
    "semanticPattern": "連続する異単位区間の距離合計",
    "curriculumNote": "3年のkm。速さは求めない。",
    "text": "森の入口から古い橋まで1km350m、古い橋から城の門まで850mです。この道を順に進み、道の重なる区間はありません。\n森の入口から城の門までは、全部で何mですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "2200 m"
  },
  {
    "id": "mwq-v2-g3-016",
    "grade": 3,
    "topic": "重さ",
    "questionType": "kgとgをそろえた残り",
    "title": "鉱石を分ける職人",
    "story": "鉱石が2kg300gあります。その中から750gを、かざり作りに使います。加工で失われる重さはありません。",
    "question": "残る鉱石は何gですか。",
    "answer": "1550",
    "unit": "g",
    "equation": "2300-750",
    "explanation": "2kg300gは2300gです。750gを引くと1550gです。",
    "prerequisites": [
      "1kg=1000g",
      "4位数の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "2300-750"
    },
    "answerKind": "integer",
    "semanticPattern": "複名数の質量から使用量を除く",
    "curriculumNote": "3年のkg・g。歩留まりによる変化なし。",
    "text": "鉱石が2kg300gあります。その中から750gを、かざり作りに使います。加工で失われる重さはありません。\n残る鉱石は何gですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "g",
          "required": true
        }
      ],
      "displayUnit": "g",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "グラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "1550 g"
  },
  {
    "id": "mwq-v2-g3-017",
    "grade": 3,
    "topic": "重さとかけ算",
    "questionType": "包装を含む総重量",
    "title": "薬草袋の荷づくり",
    "story": "薬草が入った袋が3袋あり、どれも中身と袋を合わせて400gです。3袋を全部、重さ250gの箱に入れます。",
    "question": "荷物全体の重さは何gですか。",
    "answer": "1450",
    "unit": "g",
    "equation": "400×3+250",
    "explanation": "袋3つで1200gです。箱の250gを足すと1450gです。",
    "prerequisites": [
      "3位数×1位数",
      "重さの合成"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "400*3+250"
    },
    "answerKind": "integer",
    "semanticPattern": "各袋総重量に外装箱の重量を加える",
    "curriculumNote": "3年の重さ。袋の重さを二重計上させないよう条件を明記。",
    "text": "薬草が入った袋が3袋あり、どれも中身と袋を合わせて400gです。3袋を全部、重さ250gの箱に入れます。\n荷物全体の重さは何gですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "g",
          "required": true
        }
      ],
      "displayUnit": "g",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "グラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "1450 g"
  },
  {
    "id": "mwq-v2-g3-018",
    "grade": 3,
    "topic": "かけ算",
    "questionType": "3位数×1位数",
    "title": "工房の一日",
    "story": "工房では、同じ部品を1日に125個作ります。4日間、毎日同じ個数を作りました。",
    "question": "4日間で作った部品は何個ですか。",
    "answer": "500",
    "unit": "個",
    "equation": "125×4",
    "explanation": "125個を4日分合わせるので、125×4で500個です。",
    "prerequisites": [
      "3位数×1位数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "125*4"
    },
    "answerKind": "integer",
    "semanticPattern": "一定日産量の複数日合計",
    "curriculumNote": "3年の四則・測定と数量関係の範囲。",
    "text": "工房では、同じ部品を1日に125個作ります。4日間、毎日同じ個数を作りました。\n4日間で作った部品は何個ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "こ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "500 個"
  },
  {
    "id": "mwq-v2-g3-019",
    "grade": 3,
    "topic": "わり算",
    "questionType": "2位数÷1位数",
    "title": "三つの見はり小屋",
    "story": "96本の矢を、三つの見張り小屋に同じ本数ずつ分けます。すべての矢を分けます。",
    "question": "一つの小屋に何本ずつ配れますか。",
    "answer": "32",
    "unit": "本",
    "equation": "96÷3",
    "explanation": "90本を3つに分けると30本ずつ、6本を分けると2本ずつです。合わせて32本です。",
    "prerequisites": [
      "何十÷1位数",
      "簡単な2位数÷1位数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "96/3"
    },
    "answerKind": "integer",
    "semanticPattern": "十の束と端数に分解できる等分除",
    "curriculumNote": "3年の簡単な2位数÷1位数。正式な除法筆算の習熟は前提にしない。",
    "text": "96本の矢を、三つの見張り小屋に同じ本数ずつ分けます。すべての矢を分けます。\n一つの小屋に何本ずつ配れますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "本",
          "required": true
        }
      ],
      "displayUnit": "本",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ほん",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "32 本"
  },
  {
    "id": "mwq-v2-g3-020",
    "grade": 3,
    "topic": "小数",
    "questionType": "0.1単位の加法",
    "title": "二色の回復水",
    "story": "青い回復水1.4Lと、赤い回復水0.7Lを混ぜます。混ぜても、かさの合計は変わらないものとします。",
    "question": "混ぜた回復水は何Lですか。",
    "answer": "2.1",
    "unit": "L",
    "equation": "1.4+0.7",
    "explanation": "0.1Lをもとにすると14個分と7個分で21個分です。21個分は2.1Lです。",
    "prerequisites": [
      "小数第一位",
      "同単位の加法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1.4+0.7"
    },
    "answerKind": "decimal",
    "semanticPattern": "小数量二種の体積保存合併",
    "curriculumNote": "3年の0.1の位までの小数加法。",
    "text": "青い回復水1.4Lと、赤い回復水0.7Lを混ぜます。混ぜても、かさの合計は変わらないものとします。\n混ぜた回復水は何Lですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "L",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "2.1 L"
  },
  {
    "id": "mwq-v2-g3-021",
    "grade": 3,
    "topic": "小数",
    "questionType": "0.1単位の減法",
    "title": "飛行船のリボン",
    "story": "長さ3mのリボンから、飛行船の旗用に1.8m切り取ります。切ることで失われる長さはありません。",
    "question": "残るリボンは何mですか。",
    "answer": "1.2",
    "unit": "m",
    "equation": "3-1.8",
    "explanation": "3mは0.1mの30個分、1.8mは18個分です。残り12個分は1.2mです。",
    "prerequisites": [
      "小数第一位",
      "小数のひき算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3-1.8"
    },
    "answerKind": "decimal",
    "semanticPattern": "整数長から小数長を切り取る",
    "curriculumNote": "3年の小数第一位までの減法。",
    "text": "長さ3mのリボンから、飛行船の旗用に1.8m切り取ります。切ることで失われる長さはありません。\n残るリボンは何mですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "1.2 m"
  },
  {
    "id": "mwq-v2-g3-022",
    "grade": 3,
    "topic": "小数",
    "questionType": "合計と比較",
    "title": "足りる燃料",
    "story": "空飛ぶほうきの燃料が、小びんに0.9L、大びんに0.6L残っています。次の旅で使う燃料は1.2Lです。こぼさず全部使えます。",
    "question": "旅のあとに残る燃料は何Lですか。",
    "answer": "0.3",
    "unit": "L",
    "equation": "0.9+0.6-1.2",
    "explanation": "合わせると1.5Lです。旅で1.2L使うので、0.3L残ります。",
    "prerequisites": [
      "小数第一位の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "0.9+0.6-1.2"
    },
    "answerKind": "decimal",
    "semanticPattern": "二在庫を合併し予定消費量を控除",
    "curriculumNote": "3年の小数第一位の加減を順に活用。",
    "text": "空飛ぶほうきの燃料が、小びんに0.9L、大びんに0.6L残っています。次の旅で使う燃料は1.2Lです。こぼさず全部使えます。\n旅のあとに残る燃料は何Lですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "L",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "0.3 L"
  },
  {
    "id": "mwq-v2-g3-023",
    "grade": 3,
    "topic": "分数",
    "questionType": "同分母の加法",
    "title": "五つに分けた薬",
    "story": "同じ大きさのびんをもとにします。びんの5分の1の薬と、びんの5分の2の薬を、空のびんに入れました。混ぜてもかさは変わりません。",
    "question": "薬は、もとのびんの何分のいくつですか。「1/5」の形で答えてください。",
    "answer": "3/5",
    "unit": "びん分",
    "equation": "1/5+2/5",
    "explanation": "5分の1が1つ分と2つ分なので、合わせて3つ分、5分の3です。",
    "prerequisites": [
      "単位分数",
      "同分母の加法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(1/5)+(2/5)"
    },
    "answerKind": "fraction",
    "semanticPattern": "共通全体に対する同分母部分量の合併",
    "curriculumNote": "3年の簡単な同分母分数加法。1を超えない。",
    "text": "同じ大きさのびんをもとにします。びんの5分の1の薬と、びんの5分の2の薬を、空のびんに入れました。混ぜてもかさは変わりません。\n薬は、もとのびんの何分のいくつですか。「1/5」の形で答えてください。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "びん分",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "3/5 びん分"
  },
  {
    "id": "mwq-v2-g3-024",
    "grade": 3,
    "topic": "分数",
    "questionType": "同分母の減法",
    "title": "八つに分けた魔法糸",
    "story": "1mの糸を8等分した長さを、8分の1mと表します。長さが8分の7mの魔法糸から、8分の3mを切り取りました。切ることで失われる長さはありません。",
    "question": "糸は何m残りますか。「1/8」の形で答えてください。",
    "answer": "4/8",
    "unit": "m",
    "equation": "7/8-3/8",
    "explanation": "8分の1mが7つ分から3つ分へるので、4つ分、8分の4mが残ります。",
    "prerequisites": [
      "単位分数",
      "同分母の減法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(7/8)-(3/8)"
    },
    "answerKind": "fraction",
    "semanticPattern": "同分母で表した全長から部分長を除く",
    "curriculumNote": "3年の同分母分数減法。約分は要求しない。",
    "notes": "正準答えは4/8。同じ大きさを表す1/2などの同値分数も正答として扱う。約分の学習を必須にはしない。",
    "text": "1mの糸を8等分した長さを、8分の1mと表します。長さが8分の7mの魔法糸から、8分の3mを切り取りました。切ることで失われる長さはありません。\n糸は何m残りますか。「1/8」の形で答えてください。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "4/8 m"
  },
  {
    "id": "mwq-v2-g3-025",
    "grade": 3,
    "topic": "分数",
    "questionType": "単位分数の累加",
    "title": "六つに分けた水路",
    "story": "水路を6等分して考えます。朝に全体の6分の3、昼に全体の6分の2を、重ならないようにそうじしました。",
    "question": "そうじしたのは、水路全体の何分のいくつですか。「1/6」の形で答えてください。",
    "answer": "5/6",
    "unit": "全体分",
    "equation": "3/6+2/6",
    "explanation": "同じ全体の6分の1をもとにすると、3つ分と2つ分で5つ分です。",
    "prerequisites": [
      "単位分数",
      "同分母の加法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(3/6)+(2/6)"
    },
    "answerKind": "fraction",
    "semanticPattern": "共通全体の非重複作業区間の合算",
    "curriculumNote": "3年の同分母分数。1を超えず約分を要しない。",
    "text": "水路を6等分して考えます。朝に全体の6分の3、昼に全体の6分の2を、重ならないようにそうじしました。\nそうじしたのは、水路全体の何分のいくつですか。「1/6」の形で答えてください。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "全体分",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "5/6 全体分"
  },
  {
    "id": "mwq-v2-g3-026",
    "grade": 3,
    "topic": "わり算",
    "questionType": "0を分ける",
    "title": "空の郵便箱",
    "story": "7人の使者に手紙を同じ枚数ずつ配る予定です。ところが、配る手紙は1枚もなく、0枚でした。",
    "question": "1人が受け取る手紙は何枚ですか。",
    "answer": "0",
    "unit": "枚",
    "equation": "0÷7",
    "explanation": "分ける手紙が0枚なので、7人のだれも受け取りません。1人0枚です。",
    "prerequisites": [
      "0の除法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "0/7"
    },
    "answerKind": "integer",
    "semanticPattern": "非零人数へ空集合を等分する",
    "curriculumNote": "3年の0をわる計算。0でわる課題ではない。",
    "text": "7人の使者に手紙を同じ枚数ずつ配る予定です。ところが、配る手紙は1枚もなく、0枚でした。\n1人が受け取る手紙は何枚ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "枚",
          "required": true
        }
      ],
      "displayUnit": "枚",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "まい"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "0 枚"
  },
  {
    "id": "mwq-v2-g3-027",
    "grade": 3,
    "topic": "かけ算",
    "questionType": "二倍三倍の比較量",
    "title": "竜の歩いた道",
    "story": "小さな竜は、森の道を28m歩きました。大きな竜は、小さな竜が歩いた道のりの3倍を歩きました。",
    "question": "大きな竜が歩いた道のりは何mですか。",
    "answer": "84",
    "unit": "m",
    "equation": "28×3",
    "explanation": "28mを1つ分とした3つ分なので、28×3で84mです。",
    "prerequisites": [
      "2位数×1位数",
      "倍の意味"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "28*3"
    },
    "answerKind": "integer",
    "semanticPattern": "既知基準量と整数倍から比較量",
    "curriculumNote": "3年の四則・測定と数量関係の範囲。",
    "text": "小さな竜は、森の道を28m歩きました。大きな竜は、小さな竜が歩いた道のりの3倍を歩きました。\n大きな竜が歩いた道のりは何mですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "84 m"
  },
  {
    "id": "mwq-v2-g3-028",
    "grade": 3,
    "topic": "わり算",
    "questionType": "単価を求める",
    "title": "同じ地図のねだん",
    "story": "同じ地図を4枚買うと、代金は84円でした。地図以外の代金はふくまれていません。",
    "question": "地図1枚のねだんは何円ですか。",
    "answer": "21",
    "unit": "円",
    "equation": "84÷4",
    "explanation": "80円を4つに分けると20円ずつ、4円を4つに分けると1円ずつです。1枚21円です。",
    "prerequisites": [
      "等分除",
      "何十÷1位数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "84/4"
    },
    "answerKind": "integer",
    "semanticPattern": "総代金と同一商品の個数から単価",
    "curriculumNote": "3年の簡単な2位数÷1位数。除法筆算ではなく、何十と一の位に分けて考えられる数値。",
    "text": "同じ地図を4枚買うと、代金は84円でした。地図以外の代金はふくまれていません。\n地図1枚のねだんは何円ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "円",
          "required": true
        }
      ],
      "displayUnit": "円",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "えん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "21 円"
  },
  {
    "id": "mwq-v2-g3-029",
    "grade": 3,
    "topic": "数量関係",
    "questionType": "不要情報を除く",
    "title": "三色の旗と薬草箱",
    "story": "薬草の葉48枚を、6箱に同じ枚数ずつ入れます。箱を置く部屋には、赤・青・黄の3色の旗がかざってあります。旗の数は、葉の分け方には関係ありません。",
    "question": "1箱に入れる葉は何枚ですか。",
    "answer": "8",
    "unit": "枚",
    "equation": "48÷6",
    "explanation": "分ける葉は48枚、箱は6箱なので48÷6です。旗の3色は計算に使いません。",
    "prerequisites": [
      "等分除",
      "必要な数量の選択"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "48/6"
    },
    "answerKind": "integer",
    "semanticPattern": "除法に関係しない分類数を除外",
    "curriculumNote": "3年の除法。不要情報の除外を明示し、ひっかけを目的にしない。",
    "text": "薬草の葉48枚を、6箱に同じ枚数ずつ入れます。箱を置く部屋には、赤・青・黄の3色の旗がかざってあります。旗の数は、葉の分け方には関係ありません。\n1箱に入れる葉は何枚ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "枚",
          "required": true
        }
      ],
      "displayUnit": "枚",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "まい"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 枚"
  },
  {
    "id": "mwq-v2-g3-030",
    "grade": 3,
    "topic": "表とデータ",
    "questionType": "分類値の比較",
    "title": "森の門の通行調べ",
    "story": "門番が、今日午前中に通った人数を門ごとに調べました。東の門48人、西の門37人、南の門42人です。",
    "question": "いちばん多い門は、いちばん少ない門より何人多いですか。",
    "answer": "11",
    "unit": "人",
    "equation": "48-37",
    "explanation": "いちばん多いのは東の48人、いちばん少ないのは西の37人です。48-37で11人です。",
    "prerequisites": [
      "数の大小",
      "表の項目比較",
      "求差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "48-37"
    },
    "answerKind": "integer",
    "semanticPattern": "三分類の最大最小を選び差を求める",
    "curriculumNote": "3年のデータの比較。棒グラフの図なしでも項目を比較できる形。",
    "text": "門番が、今日午前中に通った人数を門ごとに調べました。東の門48人、西の門37人、南の門42人です。\nいちばん多い門は、いちばん少ない門より何人多いですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        134,
        178
      ],
      "pdfPages": [
        140,
        184
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "人",
          "required": true
        }
      ],
      "displayUnit": "人",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "にん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "11 人"
  },
  {
    "id": "mwq-v2-g4-001",
    "grade": 4,
    "topic": "整数の除法",
    "questionType": "等分除・商3桁",
    "title": "六つの見張り台",
    "story": "王都に届いた矢756本を、6か所の見張り台に同じ本数ずつ届けます。",
    "question": "1か所には何本届けますか。",
    "answer": "126",
    "unit": "本",
    "equation": "756÷6=126",
    "explanation": "全体の756本を6か所に等分するので、756÷6=126本です。",
    "prerequisites": [
      "九九",
      "整数の位取り",
      "等分除"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "756/6"
    },
    "answerKind": "integer",
    "semanticPattern": "全体を既知の拠点数で等分して一拠点量を求める",
    "curriculumNote": "小4A整数の除法。商が複数桁になる筆算の活用。",
    "text": "王都に届いた矢756本を、6か所の見張り台に同じ本数ずつ届けます。\n1か所には何本届けますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "本",
          "required": true
        }
      ],
      "displayUnit": "本",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ほん",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "126 本"
  },
  {
    "id": "mwq-v2-g4-002",
    "grade": 4,
    "topic": "整数の除法",
    "questionType": "包含除・2桁除数",
    "title": "薬びんの木箱",
    "story": "薬師組合は薬びん638本を発送します。木箱1箱には22本ずつ入れ、どの箱もいっぱいにします。",
    "question": "木箱は全部で何箱使いますか。",
    "answer": "29",
    "unit": "箱",
    "equation": "638÷22=29",
    "explanation": "22本を1まとまりとみると、638本には29まとまりあります。22×29=638で確かめられます。",
    "prerequisites": [
      "2桁の乗法",
      "包含除",
      "除法の筆算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "638/22"
    },
    "answerKind": "integer",
    "semanticPattern": "一定の一箱量で全体をまとめ箱数を求める",
    "curriculumNote": "小4A整数の除法。2桁の除数で割り切れる場合。",
    "text": "薬師組合は薬びん638本を発送します。木箱1箱には22本ずつ入れ、どの箱もいっぱいにします。\n木箱は全部で何箱使いますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "箱",
          "required": true
        }
      ],
      "displayUnit": "箱",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "はこ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "29 箱"
  },
  {
    "id": "mwq-v2-g4-003",
    "grade": 4,
    "topic": "整数の除法",
    "questionType": "余りの切り上げ",
    "title": "全員で渡る渡し船",
    "story": "287人の旅人が川を渡ります。船1そうには旅人が24人まで乗れます。船頭はこの24人にふくめません。全員が同じ時刻に渡るため、船を1回ずつ使います。",
    "question": "船は少なくとも何そう必要ですか。",
    "answer": "12",
    "unit": "そう",
    "equation": "287÷24=11あまり23、11+1=12",
    "explanation": "11そうでは264人までです。残る23人にも1そう必要なので、12そう用意します。",
    "prerequisites": [
      "余りのある除法",
      "定員",
      "切り上げる判断"
    ],
    "check": {
      "kind": "ceil_div",
      "values": [
        287,
        24
      ]
    },
    "answerKind": "integer",
    "semanticPattern": "定員を超えない輸送で余った人にも容器を一つ追加する",
    "curriculumNote": "小4の除法活用。余りの状況判断は小3からの復習を含む。",
    "text": "287人の旅人が川を渡ります。船1そうには旅人が24人まで乗れます。船頭はこの24人にふくめません。全員が同じ時刻に渡るため、船を1回ずつ使います。\n船は少なくとも何そう必要ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "そう",
          "required": true
        }
      ],
      "displayUnit": "そう",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "艘"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "12 そう"
  },
  {
    "id": "mwq-v2-g4-004",
    "grade": 4,
    "topic": "整数の除法",
    "questionType": "余りの切り捨て・不要情報",
    "title": "盾を並べる棚",
    "story": "武器庫の棚は横の長さが275cmです。盾を横に並べると、1まいにつき18cmの場所を使います。盾は重ねられません。棚の上には青い旗が3本ありますが、旗は盾を置く場所を使いません。",
    "question": "この棚に盾を横に最大何まい置けますか。",
    "answer": "15",
    "unit": "まい",
    "equation": "275÷18=15あまり5",
    "explanation": "15まいで270cmを使います。残り5cmには盾1まいを置けません。旗の本数は計算に使いません。",
    "prerequisites": [
      "余りのある除法",
      "長さcm",
      "最大個数"
    ],
    "check": {
      "kind": "floor_div",
      "values": [
        275,
        18
      ]
    },
    "answerKind": "integer",
    "semanticPattern": "余った長さでは追加できない収納の最大個数を求める",
    "curriculumNote": "小4の除法活用。不要情報を明示して情報選択を加えた応用。",
    "notes": "旗は占有長さ0という条件を明記。空間配置を推測させない。",
    "text": "武器庫の棚は横の長さが275cmです。盾を横に並べると、1まいにつき18cmの場所を使います。盾は重ねられません。棚の上には青い旗が3本ありますが、旗は盾を置く場所を使いません。\nこの棚に盾を横に最大何まい置けますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "まい",
          "required": true
        }
      ],
      "displayUnit": "まい",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "枚"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "15 まい"
  },
  {
    "id": "mwq-v2-g4-005",
    "grade": 4,
    "topic": "整数の除法",
    "questionType": "商と余りの両方",
    "title": "光る石の納品",
    "story": "工房は光る石482個を、1箱に35個ずつ入れます。いっぱいになった箱だけを城へ送り、箱に入らない石は工房に残します。",
    "question": "城へ送る箱は何箱できて、石は何個残りますか。",
    "answer": "13",
    "unit": "箱",
    "equation": "482÷35=13あまり27",
    "explanation": "35×13=455、482−455=27です。27は35より小さいので、13箱と余り27個で確かめられます。",
    "prerequisites": [
      "2桁除数の除法",
      "余りは除数未満"
    ],
    "check": {
      "kind": "remainder",
      "values": [
        482,
        35
      ]
    },
    "answerKind": "remainder",
    "semanticPattern": "商を納品単位とし余りを在庫として二量とも答える",
    "curriculumNote": "小4A整数の除法。被除数・除数・商・余りの関係。",
    "remainder": 27,
    "notes": "主答は箱数、remainderは残る石の個数。余り欄の単位は個。",
    "remainderUnit": "個",
    "text": "工房は光る石482個を、1箱に35個ずつ入れます。いっぱいになった箱だけを城へ送り、箱に入らない石は工房に残します。\n城へ送る箱は何箱できて、石は何個残りますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "remainder",
      "fields": [
        {
          "name": "quotient",
          "label": "商",
          "keyboard": "integer",
          "unit": "箱",
          "required": true
        },
        {
          "name": "remainder",
          "label": "余り",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "箱",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "quotient_and_remainder",
      "unitRequired": false,
      "unitAliases": [
        "はこ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "商/余りの二欄",
        "qあまりr",
        "全角数字"
      ]
    },
    "answerDisplay": "13 箱、余り27個"
  },
  {
    "id": "mwq-v2-g4-006",
    "grade": 4,
    "topic": "概数",
    "questionType": "四捨五入・百の位",
    "title": "竜の荷物の見積もり",
    "story": "運び竜に積む荷物の重さをはかると753kgでした。運送係は、百の位までの概数で重さを記録します。",
    "question": "753kgを百の位まで四捨五入すると、およそ何kgですか。",
    "answer": "800",
    "unit": "kg",
    "equation": "753→800（百の位まで四捨五入）",
    "explanation": "百の位まで残すので十の位の5を見ます。5以上なので百の位を1増やし、800kgとします。",
    "prerequisites": [
      "整数の位取り",
      "四捨五入"
    ],
    "check": {
      "kind": "round",
      "values": [
        753,
        -2
      ]
    },
    "answerKind": "integer",
    "semanticPattern": "実測値を指定した位へ丸めて記録する",
    "curriculumNote": "小4A概数と四捨五入。",
    "text": "運び竜に積む荷物の重さをはかると753kgでした。運送係は、百の位までの概数で重さを記録します。\n753kgを百の位まで四捨五入すると、およそ何kgですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "kg",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "800 kg"
  },
  {
    "id": "mwq-v2-g4-007",
    "grade": 4,
    "topic": "概算",
    "questionType": "指定の丸め方で積を見積もる",
    "title": "祭りのランタン代",
    "story": "夜祭りの係は、1個198円のランタンを39個買います。予算は10000円です。代金の概算では、個数を十の位まで、1個の値段を百の位まで、それぞれ四捨五入します。",
    "question": "指定された丸め方で計算すると、代金はおよそ何円ですか。",
    "answer": "8000",
    "unit": "円",
    "equation": "39→40、198→200、40×200=8000",
    "explanation": "39個を40個、198円を200円とみて、40×200=8000円です。予算との差を求める問題ではありません。",
    "prerequisites": [
      "四捨五入",
      "2桁の乗法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "40*200"
    },
    "answerKind": "integer",
    "semanticPattern": "個数と単価を別の位に丸めた積を概算する",
    "curriculumNote": "小4A概数・四則計算の結果の見積り。",
    "notes": "概算前の丸めは本文指定に従い手監査。検算式は丸め後の積。実代金7722円とは別。",
    "text": "夜祭りの係は、1個198円のランタンを39個買います。予算は10000円です。代金の概算では、個数を十の位まで、1個の値段を百の位まで、それぞれ四捨五入します。\n指定された丸め方で計算すると、代金はおよそ何円ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "円",
          "required": true
        }
      ],
      "displayUnit": "円",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "えん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8000 円"
  },
  {
    "id": "mwq-v2-g4-008",
    "grade": 4,
    "topic": "小数の加法",
    "questionType": "小数位をそろえる合併",
    "title": "二つの香油",
    "story": "調香師は月草の香油0.875Lと、星花の香油1.24Lを一つのびんに移します。こぼれたり、混ぜて体積が変わったりしないものとします。",
    "question": "香油は全部で何Lになりますか。",
    "answer": "2.115",
    "unit": "L",
    "equation": "0.875+1.240=2.115",
    "explanation": "小数点をそろえ、1.24を1.240とみて足すと2.115Lです。",
    "prerequisites": [
      "小数第3位までの位取り",
      "小数の加法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "0.875+1.24"
    },
    "answerKind": "decimal",
    "semanticPattern": "小数位数が異なる二つの量を合併する",
    "curriculumNote": "小4A小数の仕組みと加減。",
    "text": "調香師は月草の香油0.875Lと、星花の香油1.24Lを一つのびんに移します。こぼれたり、混ぜて体積が変わったりしないものとします。\n香油は全部で何Lになりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "L",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "2.115 L"
  },
  {
    "id": "mwq-v2-g4-009",
    "grade": 4,
    "topic": "小数×整数",
    "questionType": "一つ分から全体",
    "title": "六本の橋の綱",
    "story": "同じ橋を6本かけます。橋1本に使う綱は2.35mです。結び目などのために追加する分は、この2.35mにふくまれています。",
    "question": "6本の橋に使う綱は全部で何mですか。",
    "answer": "14.1",
    "unit": "m",
    "equation": "2.35×6=14.1",
    "explanation": "1本分の2.35mが6つあるので、2.35×6=14.1mです。",
    "prerequisites": [
      "整数の乗法",
      "小数の位取り"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "2.35*6"
    },
    "answerKind": "decimal",
    "semanticPattern": "小数で示された一構造物分の材料を整数個へ拡張する",
    "curriculumNote": "小4A小数×整数。小数同士の乗法にはしない。",
    "text": "同じ橋を6本かけます。橋1本に使う綱は2.35mです。結び目などのために追加する分は、この2.35mにふくまれています。\n6本の橋に使う綱は全部で何mですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "14.1 m"
  },
  {
    "id": "mwq-v2-g4-010",
    "grade": 4,
    "topic": "小数÷整数",
    "questionType": "等分して小数第2位へ",
    "title": "妖精の飲み物",
    "story": "妖精の集会で、ジュース3.6Lを8人に同じ量ずつ分けます。",
    "question": "1人分は何Lですか。",
    "answer": "0.45",
    "unit": "L",
    "equation": "3.6÷8=0.45",
    "explanation": "3.6Lを8等分します。3.6÷8=0.45Lで、0.45×8=3.6と確かめられます。",
    "prerequisites": [
      "等分除",
      "小数÷整数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3.6/8"
    },
    "answerKind": "decimal",
    "semanticPattern": "一人分が小数第2位になる等分を求める",
    "curriculumNote": "小4A小数÷整数。除数は整数。",
    "text": "妖精の集会で、ジュース3.6Lを8人に同じ量ずつ分けます。\n1人分は何Lですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "L",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "0.45 L"
  },
  {
    "id": "mwq-v2-g4-011",
    "grade": 4,
    "topic": "小数×整数",
    "questionType": "はじめの量への逆思考",
    "title": "使い切った魔法のひも",
    "story": "仕立て屋は1着につき1.7mの魔法のひもを使い、同じ服を5着作りました。用意したひもは、ちょうど使い切りました。",
    "question": "はじめに用意したひもは何mでしたか。",
    "answer": "8.5",
    "unit": "m",
    "equation": "1.7×5=8.5",
    "explanation": "残りが0mなので、はじめの長さは5着に使った長さの合計です。1.7×5=8.5mです。",
    "prerequisites": [
      "小数×整数",
      "全体と部分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1.7*5"
    },
    "answerKind": "decimal",
    "semanticPattern": "使い切りという結果から準備時の全体量を戻す",
    "curriculumNote": "小4A小数×整数。使ったという語だけで減法を選ばせない逆思考。",
    "text": "仕立て屋は1着につき1.7mの魔法のひもを使い、同じ服を5着作りました。用意したひもは、ちょうど使い切りました。\nはじめに用意したひもは何mでしたか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8.5 m"
  },
  {
    "id": "mwq-v2-g4-012",
    "grade": 4,
    "topic": "小数÷整数",
    "questionType": "単位量への逆算",
    "title": "七本の同じ棒",
    "story": "材質と太さが同じで、長さも等しい金属棒が7本あります。7本の重さの合計は16.8kgです。包みの重さはふくまれていません。",
    "question": "棒1本の重さは何kgですか。",
    "answer": "2.4",
    "unit": "kg",
    "equation": "16.8÷7=2.4",
    "explanation": "7本は同じ重さなので、合計16.8kgを7で割ると1本2.4kgです。",
    "prerequisites": [
      "小数÷整数",
      "等しいものの等分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "16.8/7"
    },
    "answerKind": "decimal",
    "semanticPattern": "同一物の合計重量から一個の重量を逆算する",
    "curriculumNote": "小4A小数÷整数。単位量の形式だが小5の異種量の比較は要求しない。",
    "text": "材質と太さが同じで、長さも等しい金属棒が7本あります。7本の重さの合計は16.8kgです。包みの重さはふくまれていません。\n棒1本の重さは何kgですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "kg",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "2.4 kg"
  },
  {
    "id": "mwq-v2-g4-013",
    "grade": 4,
    "topic": "同分母分数の加法",
    "questionType": "同じ全体に対する合併",
    "title": "二色の壁画",
    "story": "壁画の同じ一面について、午前に全体の5/8、午後に全体の1/8をぬりました。午前と午後にぬった部分は重なっていません。",
    "question": "ぬった部分は、壁全体のどれだけですか。分数で答えましょう。",
    "answer": "3/4",
    "unit": "（壁全体を1とした大きさ）",
    "equation": "5/8+1/8=6/8=3/4",
    "explanation": "1/8が5つ分と1つ分で6つ分です。6/8は3/4と同じ大きさです。",
    "prerequisites": [
      "単位分数",
      "同分母の加法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "5/8+1/8"
    },
    "answerKind": "fraction",
    "semanticPattern": "同一全体上の重ならない分数部分を合併する",
    "curriculumNote": "小4A同分母分数の加法。約分の形式指導を前提とせず6/8も同値正答。",
    "notes": "同値の6/8も正答。学年上、既約形だけを要求しない。",
    "text": "壁画の同じ一面について、午前に全体の5/8、午後に全体の1/8をぬりました。午前と午後にぬった部分は重なっていません。\nぬった部分は、壁全体のどれだけですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "（壁全体を1とした大きさ）",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "3/4 （壁全体を1とした大きさ）"
  },
  {
    "id": "mwq-v2-g4-014",
    "grade": 4,
    "topic": "同分母分数の減法",
    "questionType": "分数量の求残",
    "title": "袋に残る砂金",
    "story": "鉱夫は5/9kgの砂金を持っていました。鑑定のために2/9kgを取り分けました。",
    "question": "手元に残る砂金は何kgですか。分数で答えましょう。",
    "answer": "1/3",
    "unit": "kg",
    "equation": "5/9−2/9=3/9=1/3",
    "explanation": "1/9kgを単位にすると5つ分から2つ分を取り、3つ分残ります。3/9kgは1/3kgです。",
    "prerequisites": [
      "分数量",
      "同分母の減法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "5/9-2/9"
    },
    "answerKind": "fraction",
    "semanticPattern": "同一単位で測った分数量から一部分を取り去る",
    "curriculumNote": "小4A同分母分数の減法。3/9を同値正答として認める。",
    "notes": "約分の形式指導前でも3/9で正答。",
    "text": "鉱夫は5/9kgの砂金を持っていました。鑑定のために2/9kgを取り分けました。\n手元に残る砂金は何kgですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "1/3 kg"
  },
  {
    "id": "mwq-v2-g4-015",
    "grade": 4,
    "topic": "同分母分数の減法",
    "questionType": "1を分母に合わせた不足量",
    "title": "満たす水晶のつぼ",
    "story": "水晶のつぼは、いっぱいで水が1L入ります。今は5/6L入っています。",
    "question": "いっぱいにするには、あと何L入れますか。分数で答えましょう。",
    "answer": "1/6",
    "unit": "L",
    "equation": "1−5/6=6/6−5/6=1/6",
    "explanation": "1Lを6/6Lとみます。6/6−5/6=1/6Lが足りません。",
    "prerequisites": [
      "1と分数の関係",
      "同分母の減法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1-5/6"
    },
    "answerKind": "fraction",
    "semanticPattern": "満量1と現在量から不足する部分を求める",
    "curriculumNote": "小4A同分母分数の減法と1の分数表示。",
    "text": "水晶のつぼは、いっぱいで水が1L入ります。今は5/6L入っています。\nいっぱいにするには、あと何L入れますか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "1/6 L"
  },
  {
    "id": "mwq-v2-g4-016",
    "grade": 4,
    "topic": "同分母分数の加法",
    "questionType": "整数をこえる分数量",
    "title": "三本の光の道",
    "story": "光の道をまっすぐにつなぎます。道Aは1m、道Bは2/7m、道Cは3/7mです。つなぐときに重なる部分はありません。",
    "question": "つないだ道は何mですか。分数で答えましょう。",
    "answer": "12/7",
    "unit": "m",
    "equation": "1+2/7+3/7=1+5/7=12/7",
    "explanation": "7/7mに2/7mと3/7mを足し、12/7mです。1と5/7mと表しても同じです。",
    "prerequisites": [
      "仮分数と帯分数",
      "同分母の加法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1+2/7+3/7"
    },
    "answerKind": "fraction",
    "semanticPattern": "整数部分と複数の同分母分数量を合成する",
    "curriculumNote": "小4A同分母分数と仮分数・帯分数の関係。",
    "notes": "帯分数1と5/7も同値。数字のみ契約なら仮分数入力。",
    "text": "光の道をまっすぐにつなぎます。道Aは1m、道Bは2/7m、道Cは3/7mです。つなぐときに重なる部分はありません。\nつないだ道は何mですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "12/7 m"
  },
  {
    "id": "mwq-v2-g4-017",
    "grade": 4,
    "topic": "長方形の面積",
    "questionType": "周長と面積の識別",
    "title": "城門前のしき石",
    "story": "城門前の広場は、たて12m、横8mの長方形です。周りにさくを立て、内側全体にしき石をしきます。",
    "question": "しき石をしきつめる広さは何m²ですか。",
    "answer": "96",
    "unit": "m²",
    "equation": "12×8=96",
    "explanation": "求めるのは周りの長さではなく、内側の面積です。たて×横で12×8=96m²です。",
    "prerequisites": [
      "面積の意味",
      "長方形の面積"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "12*8"
    },
    "answerKind": "integer",
    "semanticPattern": "同じ図形の周長の文脈から求める量を面積と識別する",
    "curriculumNote": "小4B長方形の面積。",
    "text": "城門前の広場は、たて12m、横8mの長方形です。周りにさくを立て、内側全体にしき石をしきます。\nしき石をしきつめる広さは何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "96 m²"
  },
  {
    "id": "mwq-v2-g4-018",
    "grade": 4,
    "topic": "長方形の周長",
    "questionType": "辺の長さを戻す",
    "title": "薬草園の横幅",
    "story": "長方形の薬草園の周りの長さは54mです。たての長さは16mで、入口による切れ目はありません。",
    "question": "横の長さは何mですか。",
    "answer": "11",
    "unit": "m",
    "equation": "(54−16×2)÷2=11",
    "explanation": "周りにはたてが2本、横が2本あります。54−32=22mは横2本分なので、22÷2=11mです。",
    "prerequisites": [
      "長方形の向かい合う辺",
      "四則計算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(54-16*2)/2"
    },
    "answerKind": "integer",
    "semanticPattern": "周長から二本の既知辺を除き残る二辺を等分する",
    "curriculumNote": "小4B図形の性質と数量関係。面積と混同しない。",
    "text": "長方形の薬草園の周りの長さは54mです。たての長さは16mで、入口による切れ目はありません。\n横の長さは何mですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "11 m"
  },
  {
    "id": "mwq-v2-g4-019",
    "grade": 4,
    "topic": "複合図形の面積",
    "questionType": "大きな長方形から切り取る",
    "title": "欠けた城の中庭",
    "story": "中庭は、たて12m、横18mの長方形の右上の角から、たて4m、横7mの長方形を切り取った形です。二つの長方形の辺は、それぞれたて同士、横同士が平行です。",
    "question": "残った中庭の面積は何m²ですか。",
    "answer": "188",
    "unit": "m²",
    "equation": "18×12−7×4=188",
    "explanation": "大きな長方形216m²から、切り取った長方形28m²を引き、188m²です。",
    "prerequisites": [
      "長方形の面積",
      "面積の加法性"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "18*12-7*4"
    },
    "answerKind": "integer",
    "semanticPattern": "外接長方形から明示された角の欠損長方形を除く",
    "curriculumNote": "小4B長方形を組み合わせた図形の面積。図なしでも形が一意になる条件を記載。",
    "text": "中庭は、たて12m、横18mの長方形の右上の角から、たて4m、横7mの長方形を切り取った形です。二つの長方形の辺は、それぞれたて同士、横同士が平行です。\n残った中庭の面積は何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "188 m²"
  },
  {
    "id": "mwq-v2-g4-020",
    "grade": 4,
    "topic": "面積と単位",
    "questionType": "長さを同じ単位にそろえる",
    "title": "船に積む地図布",
    "story": "地図をかく長方形の布は、長さ2m30cm、幅80cmです。",
    "question": "布の面積は何cm²ですか。",
    "answer": "18400",
    "unit": "cm²",
    "equation": "230×80=18400",
    "explanation": "2m30cmを230cmに直してから、230×80を計算します。答えの単位はcm²です。",
    "prerequisites": [
      "mとcmの関係",
      "長方形の面積"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(2*100+30)*80"
    },
    "answerKind": "integer",
    "semanticPattern": "複名数の辺を単名数へ換算して面積を求める",
    "curriculumNote": "小4B面積と単位。長さ単位の換算は既習を活用。",
    "text": "地図をかく長方形の布は、長さ2m30cm、幅80cmです。\n布の面積は何cm²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm²",
          "required": true
        }
      ],
      "displayUnit": "cm²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "cm2",
        "平方センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "18400 cm²"
  },
  {
    "id": "mwq-v2-g4-021",
    "grade": 4,
    "topic": "伴って変わる二つの数量",
    "questionType": "一定和の関係",
    "title": "形を変える花壇",
    "story": "長方形の花壇を囲むひもは48mです。入口はなく、ひもを全部使います。横を6mにしたときたては18m、横を8mにしたときたては16mでした。",
    "question": "横を9mにすると、たては何mになりますか。",
    "answer": "15",
    "unit": "m",
    "equation": "48÷2−9=15",
    "explanation": "たてと横を合わせた長さは、いつも48÷2=24mです。24−9=15mになります。",
    "prerequisites": [
      "長方形の周長",
      "表で関係を調べる"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "48/2-9"
    },
    "answerKind": "integer",
    "semanticPattern": "一定周長のもとで二つの辺の和が一定になることを使う",
    "curriculumNote": "小4C伴って変わる二つの数量。比例という名称は要求しない。",
    "notes": "横6mとたて18m、横8mとたて16mはいずれも和24m。表の二組は一定和を確かめる情報。",
    "text": "長方形の花壇を囲むひもは48mです。入口はなく、ひもを全部使います。横を6mにしたときたては18m、横を8mにしたときたては16mでした。\n横を9mにすると、たては何mになりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "15 m"
  },
  {
    "id": "mwq-v2-g4-022",
    "grade": 4,
    "topic": "伴って変わる二つの数量",
    "questionType": "等しい減り方の予測",
    "title": "見張り塔の魔法灯",
    "story": "魔法灯の燃料を調べました。点灯したときは36目盛り、1時間後は32目盛り、2時間後は28目盛りでした。このあとも1時間に4目盛りずつ減ります。",
    "question": "点灯から5時間後には何目盛り残りますか。",
    "answer": "16",
    "unit": "目盛り",
    "equation": "36−4×5=16",
    "explanation": "5時間で4×5=20目盛り減るので、36−20=16目盛り残ります。",
    "prerequisites": [
      "変化を表に整理",
      "整数の乗減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "36-4*5"
    },
    "answerKind": "integer",
    "semanticPattern": "初期値と一定減少を表の観察と明示条件で結ぶ",
    "curriculumNote": "小4C変化の特徴と式。速さの学習を前提にしない。",
    "text": "魔法灯の燃料を調べました。点灯したときは36目盛り、1時間後は32目盛り、2時間後は28目盛りでした。このあとも1時間に4目盛りずつ減ります。\n点灯から5時間後には何目盛り残りますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "目盛り",
          "required": true
        }
      ],
      "displayUnit": "目盛り",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "16 目盛り"
  },
  {
    "id": "mwq-v2-g4-023",
    "grade": 4,
    "topic": "括弧を使う式",
    "questionType": "複数の代金をまとめて引く",
    "title": "冒険道具のおつり",
    "story": "旅立つ勇者は1000円を出して、1本135円のたいまつ4本と、180円の地図1まいを買いました。",
    "question": "おつりは何円ですか。",
    "answer": "280",
    "unit": "円",
    "equation": "1000−(135×4+180)=280",
    "explanation": "たいまつ代540円と地図代180円を合わせると720円です。1000−720=280円です。",
    "prerequisites": [
      "乗法",
      "括弧と計算順序"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1000-(135*4+180)"
    },
    "answerKind": "integer",
    "semanticPattern": "異なる種類の品の代金を合成して支払額から除く",
    "curriculumNote": "小4A四則混合と括弧を用いた式。",
    "text": "旅立つ勇者は1000円を出して、1本135円のたいまつ4本と、180円の地図1まいを買いました。\nおつりは何円ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "円",
          "required": true
        }
      ],
      "displayUnit": "円",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "えん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "280 円"
  },
  {
    "id": "mwq-v2-g4-024",
    "grade": 4,
    "topic": "数量の関係を表す式",
    "questionType": "一部の代金から個数を逆算",
    "title": "工房の残りの注文",
    "story": "工房は、1個180円の留め金と、1個240円の輪を買いました。代金は全部で1260円で、留め金は3個でした。",
    "question": "輪は何個買いましたか。",
    "answer": "3",
    "unit": "個",
    "equation": "(1260−180×3)÷240=3",
    "explanation": "留め金代は540円です。残る720円が輪の代金なので、720÷240=3個です。",
    "prerequisites": [
      "乗除の相互関係",
      "混合計算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(1260-180*3)/240"
    },
    "answerKind": "integer",
    "semanticPattern": "一方の既知個数の代金を取り除いて他方の個数を戻す",
    "curriculumNote": "小4A数量の関係を表す式。未知数は残る品の個数。",
    "text": "工房は、1個180円の留め金と、1個240円の輪を買いました。代金は全部で1260円で、留め金は3個でした。\n輪は何個買いましたか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "こ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "3 個"
  },
  {
    "id": "mwq-v2-g4-025",
    "grade": 4,
    "topic": "角の大きさ",
    "questionType": "一回転から二つの角を除く",
    "title": "三つの門の見張り",
    "story": "見張り台のまわりを、重なりもすき間もない三つの角に分けました。一つは90度、もう一つは120度です。三つの角を合わせると一回転になります。",
    "question": "残りの角は何度ですか。",
    "answer": "150",
    "unit": "度",
    "equation": "360−90−120=150",
    "explanation": "一回転は360度です。既知の二つを引き、360−90−120=150度です。",
    "prerequisites": [
      "一回転360度",
      "角の加減"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "360-90-120"
    },
    "answerKind": "integer",
    "semanticPattern": "一点の周りを分けた角の全体360から未知角を求める",
    "curriculumNote": "小4B角の大きさ。三角形の内角の和は使わない。",
    "text": "見張り台のまわりを、重なりもすき間もない三つの角に分けました。一つは90度、もう一つは120度です。三つの角を合わせると一回転になります。\n残りの角は何度ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "度",
          "required": true
        }
      ],
      "displayUnit": "度",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "150 度"
  },
  {
    "id": "mwq-v2-g4-026",
    "grade": 4,
    "topic": "ひし形の性質",
    "questionType": "等しい辺を使う周長",
    "title": "ひし形の旗飾り",
    "story": "騎士団の旗飾りはひし形です。1辺の長さは17cmです。旗飾りの四つの辺に、重なりなくふち飾りを付けます。",
    "question": "ふち飾りは全部で何cm必要ですか。",
    "answer": "68",
    "unit": "cm",
    "equation": "17×4=68",
    "explanation": "ひし形は四つの辺の長さが等しいので、17cmが4本分です。17×4=68cmになります。",
    "prerequisites": [
      "ひし形の辺の性質",
      "乗法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "17*4"
    },
    "answerKind": "integer",
    "semanticPattern": "ひし形の等辺性から全辺の長さを求める",
    "curriculumNote": "小4Bひし形と図形の性質。",
    "text": "騎士団の旗飾りはひし形です。1辺の長さは17cmです。旗飾りの四つの辺に、重なりなくふち飾りを付けます。\nふち飾りは全部で何cm必要ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "68 cm"
  },
  {
    "id": "mwq-v2-g4-027",
    "grade": 4,
    "topic": "二つの観点での分類",
    "questionType": "重なりを整理してどちらもない数",
    "title": "守備隊の道具調べ",
    "story": "守備隊40人を調べると、剣を持つ人は25人、盾を持つ人は18人でした。そのうち、剣も盾も持つ人は7人でした。全員を、剣だけ、盾だけ、両方、どちらもなし、の四つに分けます。",
    "question": "どちらも持っていない人は何人ですか。",
    "answer": "4",
    "unit": "人",
    "equation": "40−((25−7)+(18−7)+7)=4",
    "explanation": "剣だけは18人、盾だけは11人、両方は7人で、合わせて36人です。40−36=4人がどちらも持っていません。",
    "prerequisites": [
      "二次元の表",
      "全体と部分",
      "重なりの扱い"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "40-((25-7)+(18-7)+7)"
    },
    "answerKind": "integer",
    "semanticPattern": "二属性の四分類を作り重複を避けて残りを求める",
    "curriculumNote": "小4D二つの観点からの分類整理。集合の公式として暗記させない。",
    "text": "守備隊40人を調べると、剣を持つ人は25人、盾を持つ人は18人でした。そのうち、剣も盾も持つ人は7人でした。全員を、剣だけ、盾だけ、両方、どちらもなし、の四つに分けます。\nどちらも持っていない人は何人ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "人",
          "required": true
        }
      ],
      "displayUnit": "人",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "にん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 人"
  },
  {
    "id": "mwq-v2-g4-028",
    "grade": 4,
    "topic": "データの変化",
    "questionType": "値の最大と増加量の最大を区別",
    "title": "精霊の木の記録",
    "story": "同じ精霊の木の高さを毎朝記録しました。1日目は12cm、2日目は17cm、3日目は19cm、4日目は28cmです。",
    "question": "となり合う日の間で、最も大きくのびた長さは何cmですか。",
    "answer": "9",
    "unit": "cm",
    "equation": "17−12=5、19−17=2、28−19=9→最大9",
    "explanation": "のびた長さは順に5cm、2cm、9cmです。最大の高さ28cmではなく、3日目から4日目の増加量9cmを答えます。",
    "prerequisites": [
      "表から値を読む",
      "差で変化を見る"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "28-19"
    },
    "answerKind": "integer",
    "semanticPattern": "系列の値ではなく隣接区間差の最大を取り出す",
    "curriculumNote": "小4D変化の考察。これは表形式の読み取りで、折れ線グラフ描画そのものは問わない。",
    "notes": "最大選択は5・2・9を手監査。check式は選んだ区間の差。",
    "text": "同じ精霊の木の高さを毎朝記録しました。1日目は12cm、2日目は17cm、3日目は19cm、4日目は28cmです。\nとなり合う日の間で、最も大きくのびた長さは何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "9 cm"
  },
  {
    "id": "mwq-v2-g4-029",
    "grade": 4,
    "topic": "大きな数",
    "questionType": "億と万を含む数の減法",
    "title": "星の書庫の文字数",
    "story": "星の書庫には全部で3億7000万文字の記録があります。そのうち1億2000万文字は、写しの作成が終わりました。",
    "question": "まだ写しを作っていない記録は何文字ですか。数字だけで答えましょう。",
    "answer": "250000000",
    "unit": "文字",
    "equation": "370000000−120000000=250000000",
    "explanation": "億と万の位をそろえて引くと、2億5000万文字です。数字では250000000です。",
    "prerequisites": [
      "億と万の位取り",
      "整数の減法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "370000000-120000000"
    },
    "answerKind": "integer",
    "semanticPattern": "大きな記数単位を読み替えて未処理量を求める",
    "curriculumNote": "小4A億・兆の単位と数の相対的な大きさ。",
    "text": "星の書庫には全部で3億7000万文字の記録があります。そのうち1億2000万文字は、写しの作成が終わりました。\nまだ写しを作っていない記録は何文字ですか。数字だけで答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "文字",
          "required": true
        }
      ],
      "displayUnit": "文字",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "250000000 文字"
  },
  {
    "id": "mwq-v2-g4-030",
    "grade": 4,
    "topic": "簡単な割合",
    "questionType": "何倍かから基準量を戻す",
    "title": "二つの竜の模型",
    "story": "大きい竜の模型は長さ84cmです。これは、小さい竜の模型の長さの3倍です。",
    "question": "小さい模型の長さは何cmですか。",
    "answer": "28",
    "unit": "cm",
    "equation": "□×3=84、84÷3=28",
    "explanation": "小さい模型を1とみると、大きい模型はその3つ分です。84cmを3等分して28cmです。",
    "prerequisites": [
      "倍の意味",
      "乗除の相互関係"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "84/3"
    },
    "answerKind": "integer",
    "semanticPattern": "比較量と整数倍から基準量を戻す逆思考",
    "curriculumNote": "小4C簡単な場合の割合。百分率や小数倍を要求しない。",
    "text": "大きい竜の模型は長さ84cmです。これは、小さい竜の模型の長さの3倍です。\n小さい模型の長さは何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        179,
        231
      ],
      "pdfPages": [
        185,
        237
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "28 cm"
  },
  {
    "id": "mwq-v2-g5-001",
    "grade": 5,
    "topic": "小数の乗法",
    "questionType": "小数の単位量×小数の量",
    "title": "鍛冶場へ運ぶ鎖",
    "story": "材質と太さが一様な鎖は、1mの重さが2.4kgです。同じ鎖を3.5m運びます。",
    "question": "運ぶ鎖の重さは何kgですか。",
    "answer": "8.4",
    "unit": "kg",
    "equation": "2.4×3.5=8.4",
    "explanation": "1m分の重さを3.5倍します。24×35=840をもとに小数点の位置を考えると、8.4kgです。",
    "prerequisites": [
      "小数×整数",
      "小数倍",
      "単位量"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "2.4*3.5"
    },
    "answerKind": "decimal",
    "semanticPattern": "一単位の小数重量を小数長さへ比例拡張する",
    "curriculumNote": "小5A小数×小数。重さと長さの比例を一様性で保証。",
    "text": "材質と太さが一様な鎖は、1mの重さが2.4kgです。同じ鎖を3.5m運びます。\n運ぶ鎖の重さは何kgですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "kg",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8.4 kg"
  },
  {
    "id": "mwq-v2-g5-002",
    "grade": 5,
    "topic": "小数の除法",
    "questionType": "小数を単位とする包含除",
    "title": "舞台のリボン飾り",
    "story": "長さ7.2mのリボンから、1本1.2mの飾りを切り出します。切り口で失われる長さは考えません。つなぎ合わせません。",
    "question": "飾りは何本できますか。",
    "answer": "6",
    "unit": "本",
    "equation": "7.2÷1.2=6",
    "explanation": "1.2mが7.2mの中にいくつあるかを求めます。両方を10倍して72÷12と考えると6本です。",
    "prerequisites": [
      "小数÷整数",
      "包含除",
      "商が変わらない性質"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7.2/1.2"
    },
    "answerKind": "integer",
    "semanticPattern": "一まとまりが小数である長さの包含除を行う",
    "curriculumNote": "小5A小数÷小数。切りしろ0を明記。",
    "text": "長さ7.2mのリボンから、1本1.2mの飾りを切り出します。切り口で失われる長さは考えません。つなぎ合わせません。\n飾りは何本できますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "本",
          "required": true
        }
      ],
      "displayUnit": "本",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ほん",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "6 本"
  },
  {
    "id": "mwq-v2-g5-003",
    "grade": 5,
    "topic": "小数の除法",
    "questionType": "小数の量から単位量を戻す",
    "title": "銀糸の重さ調べ",
    "story": "太さと材質が一様な銀糸は、1.5mの重さが3.15kgです。",
    "question": "この銀糸1mの重さは何kgですか。",
    "answer": "2.1",
    "unit": "kg",
    "equation": "3.15÷1.5=2.1",
    "explanation": "3.15kgは1.5m分なので、1m分へ戻すには1.5で割ります。3.15÷1.5=2.1kgです。",
    "prerequisites": [
      "小数の除法",
      "量の比例関係"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3.15/1.5"
    },
    "answerKind": "decimal",
    "semanticPattern": "小数単位の既知量から一単位の量へ規格化する",
    "curriculumNote": "小5A小数除法とC単位量。",
    "text": "太さと材質が一様な銀糸は、1.5mの重さが3.15kgです。\nこの銀糸1mの重さは何kgですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "kg",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "2.1 kg"
  },
  {
    "id": "mwq-v2-g5-004",
    "grade": 5,
    "topic": "小数倍",
    "questionType": "基準量未知の逆思考",
    "title": "伸びた魔法の帯",
    "story": "魔法の帯を、もとの長さの1.5倍に伸ばしたところ、5.4mになりました。",
    "question": "もとの帯は何mでしたか。",
    "answer": "3.6",
    "unit": "m",
    "equation": "□×1.5=5.4、5.4÷1.5=3.6",
    "explanation": "5.4mは、もとの長さを1としたときの1.5倍です。もとの1倍分は5.4÷1.5=3.6mです。",
    "prerequisites": [
      "小数倍",
      "基準量と比較量",
      "小数除法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "5.4/1.5"
    },
    "answerKind": "decimal",
    "semanticPattern": "小数倍後の比較量から変化前の基準量を逆算する",
    "curriculumNote": "小5の小数倍・割合の見方。小4の整数倍の逆算から拡張。",
    "text": "魔法の帯を、もとの長さの1.5倍に伸ばしたところ、5.4mになりました。\nもとの帯は何mでしたか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "3.6 m"
  },
  {
    "id": "mwq-v2-g5-005",
    "grade": 5,
    "topic": "異分母分数の加法",
    "questionType": "異なる単位分数の合併",
    "title": "薬草茶の調合",
    "story": "薬師は草茶2/3Lと花茶3/4Lを混ぜます。混ぜても体積は変わらず、こぼれません。",
    "question": "できる茶は何Lですか。分数で答えましょう。",
    "answer": "17/12",
    "unit": "L",
    "equation": "2/3+3/4=8/12+9/12=17/12",
    "explanation": "分母を12にそろえると8/12Lと9/12Lです。合わせて17/12L、つまり1と5/12Lです。",
    "prerequisites": [
      "通分",
      "仮分数と帯分数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "2/3+3/4"
    },
    "answerKind": "fraction",
    "semanticPattern": "異なる単位分数で測った量を通分して合併する",
    "curriculumNote": "小5A異分母分数の加法。",
    "text": "薬師は草茶2/3Lと花茶3/4Lを混ぜます。混ぜても体積は変わらず、こぼれません。\nできる茶は何Lですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "17/12 L"
  },
  {
    "id": "mwq-v2-g5-006",
    "grade": 5,
    "topic": "異分母分数の減法",
    "questionType": "通分して取り分けた残り",
    "title": "灯台の油",
    "story": "灯台には油が7/8Lあります。そのうち1/3Lを手持ちのランプへ移しました。移すときにこぼれません。",
    "question": "灯台に残った油は何Lですか。分数で答えましょう。",
    "answer": "13/24",
    "unit": "L",
    "equation": "7/8−1/3=21/24−8/24=13/24",
    "explanation": "分母を24にそろえ、21/24Lから8/24Lを引くと13/24Lです。",
    "prerequisites": [
      "通分",
      "分数量の減法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7/8-1/3"
    },
    "answerKind": "fraction",
    "semanticPattern": "異なる分母の取り去り量を同じ単位へ直して残量を求める",
    "curriculumNote": "小5A異分母分数の減法。",
    "text": "灯台には油が7/8Lあります。そのうち1/3Lを手持ちのランプへ移しました。移すときにこぼれません。\n灯台に残った油は何Lですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "13/24 L"
  },
  {
    "id": "mwq-v2-g5-007",
    "grade": 5,
    "topic": "異分母分数の減法",
    "questionType": "帯分数からの減法",
    "title": "織り機に残る布",
    "story": "織り機には2と1/5mの布があります。旗を作るために3/4mを切り取りました。切り口で失われる長さは考えません。",
    "question": "残りの布は何mですか。分数で答えましょう。",
    "answer": "29/20",
    "unit": "m",
    "equation": "2と1/5−3/4=44/20−15/20=29/20",
    "explanation": "2と1/5mを11/5m、さらに44/20mと表します。3/4mは15/20mなので、残り29/20mです。",
    "prerequisites": [
      "帯分数を仮分数にする",
      "通分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(2+1/5)-3/4"
    },
    "answerKind": "fraction",
    "semanticPattern": "帯分数の全体から異分母の部分を除く",
    "curriculumNote": "小5A異分母分数の減法。",
    "text": "織り機には2と1/5mの布があります。旗を作るために3/4mを切り取りました。切り口で失われる長さは考えません。\n残りの布は何mですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "29/20 m"
  },
  {
    "id": "mwq-v2-g5-008",
    "grade": 5,
    "topic": "異分母分数の加減",
    "questionType": "全体1から複数用途を除く",
    "title": "開拓地の空き地",
    "story": "開拓地全体を1とします。畑に全体の1/6、果樹園に1/4、牧草地に1/3を使いました。三つの場所は重なりません。残りは空き地です。",
    "question": "空き地は開拓地全体のどれだけですか。分数で答えましょう。",
    "answer": "1/4",
    "unit": "（開拓地全体を1とした大きさ）",
    "equation": "1−(1/6+1/4+1/3)=1/4",
    "explanation": "使った部分は2/12+3/12+4/12=9/12です。全体12/12から引き、3/12=1/4が残ります。",
    "prerequisites": [
      "通分",
      "全体を1とみる",
      "括弧"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1-(1/6+1/4+1/3)"
    },
    "answerKind": "fraction",
    "semanticPattern": "同一全体に対する三用途の割合を合成して補集合量を求める",
    "curriculumNote": "小5A異分母分数の加減。",
    "text": "開拓地全体を1とします。畑に全体の1/6、果樹園に1/4、牧草地に1/3を使いました。三つの場所は重なりません。残りは空き地です。\n空き地は開拓地全体のどれだけですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "（開拓地全体を1とした大きさ）",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "1/4 （開拓地全体を1とした大きさ）"
  },
  {
    "id": "mwq-v2-g5-009",
    "grade": 5,
    "topic": "割合・百分率",
    "questionType": "割合未知",
    "title": "城門の修理の進み具合",
    "story": "修理する城門の部品は全部で48個あり、30個の修理が終わりました。",
    "question": "修理が終わった個数は、全体の何%ですか。",
    "answer": "62.5",
    "unit": "%",
    "equation": "30÷48×100=62.5",
    "explanation": "全体48個を基準にします。30÷48=0.625なので、百分率では62.5%です。",
    "prerequisites": [
      "基準量と比較量",
      "小数の除法",
      "百分率"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "30/48*100"
    },
    "answerKind": "decimal",
    "semanticPattern": "部分と全体から百分率を求める",
    "curriculumNote": "小5C割合・百分率。",
    "text": "修理する城門の部品は全部で48個あり、30個の修理が終わりました。\n修理が終わった個数は、全体の何%ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "%",
          "required": true
        }
      ],
      "displayUnit": "%",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "パーセント"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "62.5 %"
  },
  {
    "id": "mwq-v2-g5-010",
    "grade": 5,
    "topic": "割合・百分率",
    "questionType": "比較量未知",
    "title": "薬草園の青い花",
    "story": "薬草園には花が180株あります。その35%は青い花で、残りは他の色です。",
    "question": "青い花は何株ですか。",
    "answer": "63",
    "unit": "株",
    "equation": "180×0.35=63",
    "explanation": "35%は0.35です。全180株の0.35倍を求め、180×0.35=63株です。",
    "prerequisites": [
      "百分率と小数",
      "小数乗法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "180*35/100"
    },
    "answerKind": "integer",
    "semanticPattern": "全体と百分率から特定部分の個数を求める",
    "curriculumNote": "小5C割合。",
    "text": "薬草園には花が180株あります。その35%は青い花で、残りは他の色です。\n青い花は何株ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "株",
          "required": true
        }
      ],
      "displayUnit": "株",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "63 株"
  },
  {
    "id": "mwq-v2-g5-011",
    "grade": 5,
    "topic": "割合・百分率",
    "questionType": "基準量未知",
    "title": "倉庫の保存食",
    "story": "倉庫の保存食のうち30%にあたる36箱を、遠征隊へ渡しました。",
    "question": "渡す前の保存食は、全部で何箱ありましたか。",
    "answer": "120",
    "unit": "箱",
    "equation": "□×0.30=36、36÷0.30=120",
    "explanation": "36箱が全体の0.30倍です。全体は36÷0.30=120箱になります。",
    "prerequisites": [
      "百分率",
      "基準量未知の除法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "36/(30/100)"
    },
    "answerKind": "integer",
    "semanticPattern": "一部分と割合から元の全体を戻す",
    "curriculumNote": "小5C割合。",
    "text": "倉庫の保存食のうち30%にあたる36箱を、遠征隊へ渡しました。\n渡す前の保存食は、全部で何箱ありましたか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "箱",
          "required": true
        }
      ],
      "displayUnit": "箱",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "はこ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "120 箱"
  },
  {
    "id": "mwq-v2-g5-012",
    "grade": 5,
    "topic": "割合・値引き",
    "questionType": "値引き後の比較量",
    "title": "市の道具屋の特売",
    "story": "道具屋で、定価2400円の望遠鏡を定価の15%引きで売っています。税や追加料金はありません。",
    "question": "買う人が払う金額は何円ですか。",
    "answer": "2040",
    "unit": "円",
    "equation": "2400×(1−0.15)=2040",
    "explanation": "15%引きなので支払うのは定価の85%です。2400×0.85=2040円です。",
    "prerequisites": [
      "百分率",
      "全体1と残る割合"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "2400*(1-15/100)"
    },
    "answerKind": "integer",
    "semanticPattern": "値引き率から残る支払割合へ変換する",
    "curriculumNote": "小5C割合の活用。値引額360円と支払額を区別。",
    "text": "道具屋で、定価2400円の望遠鏡を定価の15%引きで売っています。税や追加料金はありません。\n買う人が払う金額は何円ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "円",
          "required": true
        }
      ],
      "displayUnit": "円",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "えん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "2040 円"
  },
  {
    "id": "mwq-v2-g5-013",
    "grade": 5,
    "topic": "割合・増加",
    "questionType": "増えたあとの全体",
    "title": "新しい図書の受け入れ",
    "story": "城の図書室には本が1200冊あります。春に、今ある冊数の8%にあたる本を新しく受け入れます。本を捨てたり貸し出したりはしません。",
    "question": "受け入れたあとは、全部で何冊になりますか。",
    "answer": "1296",
    "unit": "冊",
    "equation": "1200+1200×0.08=1296",
    "explanation": "新しい本は1200×0.08=96冊です。もとの1200冊に足して1296冊です。",
    "prerequisites": [
      "百分率",
      "基準量を固定する"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1200+1200*8/100"
    },
    "answerKind": "integer",
    "semanticPattern": "基準量に対する増加部分を元の全体へ加える",
    "curriculumNote": "小5C割合の活用。",
    "text": "城の図書室には本が1200冊あります。春に、今ある冊数の8%にあたる本を新しく受け入れます。本を捨てたり貸し出したりはしません。\n受け入れたあとは、全部で何冊になりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "冊",
          "required": true
        }
      ],
      "displayUnit": "冊",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "さつ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "1296 冊"
  },
  {
    "id": "mwq-v2-g5-014",
    "grade": 5,
    "topic": "割合・複数段階",
    "questionType": "二段階で基準量が変わる",
    "title": "市の焼き菓子",
    "story": "市場に焼き菓子240個を用意しました。午前に全体の20%を売りました。午後は、そのとき残っていた個数の25%を売りました。ほかに増減はありません。",
    "question": "午後に売り終えたあと、焼き菓子は何個残っていますか。",
    "answer": "144",
    "unit": "個",
    "equation": "240×0.80×0.75=144",
    "explanation": "午前の残りは192個です。午後はその25%の48個を売るので、192−48=144個です。二つの割合の基準は違います。",
    "prerequisites": [
      "百分率",
      "小数乗法",
      "段階ごとの基準量"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "240*(1-20/100)*(1-25/100)"
    },
    "answerKind": "integer",
    "semanticPattern": "残量を次段階の基準に更新して二度の取り去りを行う",
    "curriculumNote": "小5C割合の応用。基準量の切替を明示し、割増割引の特殊解法は要求しない。",
    "notes": "応用。20%と25%を単純に合計しないことを確認。",
    "text": "市場に焼き菓子240個を用意しました。午前に全体の20%を売りました。午後は、そのとき残っていた個数の25%を売りました。ほかに増減はありません。\n午後に売り終えたあと、焼き菓子は何個残っていますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "こ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "144 個"
  },
  {
    "id": "mwq-v2-g5-015",
    "grade": 5,
    "topic": "速さ",
    "questionType": "速さ未知",
    "title": "伝令の橋渡り",
    "story": "伝令が450mの橋を、6分間、一定の速さで歩いて渡りました。橋の途中では止まっていません。",
    "question": "この伝令の分速は何mですか。",
    "answer": "75",
    "unit": "m/分",
    "equation": "450÷6=75",
    "explanation": "1分あたりの道のりを求めます。450mを6分で割ると分速75mです。",
    "prerequisites": [
      "単位量あたりの大きさ",
      "道のりと時間"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "450/6"
    },
    "answerKind": "integer",
    "semanticPattern": "道のりと経過時間を一単位時間あたりへ規格化する",
    "curriculumNote": "小5C速さ。",
    "text": "伝令が450mの橋を、6分間、一定の速さで歩いて渡りました。橋の途中では止まっていません。\nこの伝令の分速は何mですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m/分",
          "required": true
        }
      ],
      "displayUnit": "m/分",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "75 m/分"
  },
  {
    "id": "mwq-v2-g5-016",
    "grade": 5,
    "topic": "速さ",
    "questionType": "道のり未知・複名時間",
    "title": "空の定期船",
    "story": "空の定期船は、時速64kmの一定の速さで2時間30分飛びました。風などによる速さの変化はありません。",
    "question": "飛んだ道のりは何kmですか。",
    "answer": "160",
    "unit": "km",
    "equation": "2時間30分=2.5時間、64×2.5=160",
    "explanation": "30分は0.5時間なので、全体で2.5時間です。64×2.5=160km飛びます。",
    "prerequisites": [
      "速さ×時間",
      "1時間60分",
      "小数乗法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "64*(2+30/60)"
    },
    "answerKind": "integer",
    "semanticPattern": "複名時間を時間単位の小数へ直して道のりを求める",
    "curriculumNote": "小5C速さ。",
    "text": "空の定期船は、時速64kmの一定の速さで2時間30分飛びました。風などによる速さの変化はありません。\n飛んだ道のりは何kmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "km",
          "required": true
        }
      ],
      "displayUnit": "km",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キロメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "160 km"
  },
  {
    "id": "mwq-v2-g5-017",
    "grade": 5,
    "topic": "速さ",
    "questionType": "時間未知",
    "title": "湖を進む小舟",
    "story": "流れのない湖で、小舟が時速4.5kmの一定の速さで18km進みます。途中で止まりません。",
    "question": "かかる時間は何時間ですか。",
    "answer": "4",
    "unit": "時間",
    "equation": "18÷4.5=4",
    "explanation": "道のりを速さで割ると時間です。18÷4.5=4なので4時間かかります。",
    "prerequisites": [
      "速さの三量関係",
      "小数除法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "18/4.5"
    },
    "answerKind": "integer",
    "semanticPattern": "道のりと単位時間の道のりから経過時間を戻す",
    "curriculumNote": "小5C速さ。流水算の条件は入れない。",
    "text": "流れのない湖で、小舟が時速4.5kmの一定の速さで18km進みます。途中で止まりません。\nかかる時間は何時間ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "時間",
          "required": true
        }
      ],
      "displayUnit": "時間",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 時間"
  },
  {
    "id": "mwq-v2-g5-018",
    "grade": 5,
    "topic": "速さの比較",
    "questionType": "単位をそろえた差",
    "title": "二人の伝令",
    "story": "伝令Aは分速80m、伝令Bは時速4.5kmで歩きます。二人ともそれぞれ一定の速さです。",
    "question": "AはBより、1分あたり何m多く進みますか。",
    "answer": "5",
    "unit": "m",
    "equation": "4.5×1000÷60=75、80−75=5",
    "explanation": "Bの時速4.5kmは分速75mです。Aの分速80mとの差は5mです。",
    "prerequisites": [
      "kmとm",
      "時速と分速",
      "速さの比較"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "80-4.5*1000/60"
    },
    "answerKind": "integer",
    "semanticPattern": "単位時間の異なる二つの速さを統一して差を求める",
    "curriculumNote": "小5C速さと単位量。追い付き時刻は問わない。",
    "text": "伝令Aは分速80m、伝令Bは時速4.5kmで歩きます。二人ともそれぞれ一定の速さです。\nAはBより、1分あたり何m多く進みますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "5 m"
  },
  {
    "id": "mwq-v2-g5-019",
    "grade": 5,
    "topic": "平均",
    "questionType": "0をふくむ測定値",
    "title": "結晶集めの五日間",
    "story": "探検隊が5日間に集めた結晶の重さは、順に8kg、0kg、12kg、16kg、9kgでした。結晶が取れなかった日も、調査した1日に数えます。",
    "question": "1日あたり平均何kg集めましたか。",
    "answer": "9",
    "unit": "kg",
    "equation": "(8+0+12+16+9)÷5=9",
    "explanation": "合計45kgを調査した5日で割ります。0kgの日も日数にふくめるので平均9kgです。",
    "prerequisites": [
      "平均の意味",
      "全体の個数",
      "0の扱い"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(8+0+12+16+9)/5"
    },
    "answerKind": "integer",
    "semanticPattern": "結果0の期間も母数に含めた平均を求める",
    "curriculumNote": "小5D測定値の平均。",
    "text": "探検隊が5日間に集めた結晶の重さは、順に8kg、0kg、12kg、16kg、9kgでした。結晶が取れなかった日も、調査した1日に数えます。\n1日あたり平均何kg集めましたか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "kg",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "9 kg"
  },
  {
    "id": "mwq-v2-g5-020",
    "grade": 5,
    "topic": "平均",
    "questionType": "平均と一部の値から欠測を戻す",
    "title": "書記の四日目",
    "story": "書記が写したページ数は、1日目10ページ、2日目14ページ、3日目12ページです。4日間の平均は13ページでした。",
    "question": "4日目には何ページ写しましたか。",
    "answer": "16",
    "unit": "ページ",
    "equation": "13×4−(10+14+12)=16",
    "explanation": "4日間の合計は13×4=52ページです。最初の3日の36ページを引くと、4日目は16ページです。",
    "prerequisites": [
      "平均×個数",
      "加減の逆思考"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "13*4-(10+14+12)"
    },
    "answerKind": "integer",
    "semanticPattern": "平均から全合計を復元して未知の一観測値を求める",
    "curriculumNote": "小5D平均の活用。",
    "text": "書記が写したページ数は、1日目10ページ、2日目14ページ、3日目12ページです。4日間の平均は13ページでした。\n4日目には何ページ写しましたか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "ページ",
          "required": true
        }
      ],
      "displayUnit": "ページ",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "16 ページ"
  },
  {
    "id": "mwq-v2-g5-021",
    "grade": 5,
    "topic": "平均",
    "questionType": "人数の違う二群の統合",
    "title": "二つの採集班",
    "story": "採集班Aは6人で、1人あたりの薬草の平均は8束でした。採集班Bは4人で、1人あたりの平均は13束でした。全員がどちらか一方の班だけに入っています。",
    "question": "二つの班を合わせた10人の平均は、1人あたり何束ですか。",
    "answer": "10",
    "unit": "束",
    "equation": "(8×6+13×4)÷10=10",
    "explanation": "Aは合計48束、Bは合計52束なので全体100束です。100束を10人で割り、平均10束です。",
    "prerequisites": [
      "平均と合計",
      "人数の集計"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(8*6+13*4)/(6+4)"
    },
    "answerKind": "integer",
    "semanticPattern": "個数の違う二群の平均から合計を復元して全体平均を作る",
    "curriculumNote": "小5D平均の応用。平均の平均ではなく合計に戻す。",
    "text": "採集班Aは6人で、1人あたりの薬草の平均は8束でした。採集班Bは4人で、1人あたりの平均は13束でした。全員がどちらか一方の班だけに入っています。\n二つの班を合わせた10人の平均は、1人あたり何束ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "束",
          "required": true
        }
      ],
      "displayUnit": "束",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "10 束"
  },
  {
    "id": "mwq-v2-g5-022",
    "grade": 5,
    "topic": "直方体の体積",
    "questionType": "小数の辺をふくむ体積",
    "title": "地下倉庫の広さ",
    "story": "地下倉庫の内側は、たて4m、横3m、高さ2.5mの直方体です。柱など、内側を占める物はありません。",
    "question": "倉庫の内側の体積は何m³ですか。",
    "answer": "30",
    "unit": "m³",
    "equation": "4×3×2.5=30",
    "explanation": "直方体の体積は、たて×横×高さです。4×3×2.5=30m³です。",
    "prerequisites": [
      "直方体の体積",
      "小数乗法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "4*3*2.5"
    },
    "answerKind": "integer",
    "semanticPattern": "小数を含む三辺から直方体内部の体積を求める",
    "curriculumNote": "小5B直方体・立方体の体積。",
    "text": "地下倉庫の内側は、たて4m、横3m、高さ2.5mの直方体です。柱など、内側を占める物はありません。\n倉庫の内側の体積は何m³ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m³",
          "required": true
        }
      ],
      "displayUnit": "m³",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m3",
        "立方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "30 m³"
  },
  {
    "id": "mwq-v2-g5-023",
    "grade": 5,
    "topic": "直方体の体積",
    "questionType": "満量と現在量の差",
    "title": "水を足す実験箱",
    "story": "直方体の水箱の内側は、たて7cm、横5cm、深さ4cmです。今は水が35cm³入っています。箱は水平で、水以外には何も入っていません。",
    "question": "箱のふちまで水を入れるには、あと何cm³必要ですか。",
    "answer": "105",
    "unit": "cm³",
    "equation": "7×5×4−35=105",
    "explanation": "箱の満量は140cm³です。すでに35cm³あるので、あと140−35=105cm³必要です。",
    "prerequisites": [
      "直方体の体積",
      "容量の差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7*5*4-35"
    },
    "answerKind": "integer",
    "semanticPattern": "容器の三辺から満容量を求め現在量を除く",
    "curriculumNote": "小5B体積の活用。水の高さや物体の浮沈は問わない。",
    "text": "直方体の水箱の内側は、たて7cm、横5cm、深さ4cmです。今は水が35cm³入っています。箱は水平で、水以外には何も入っていません。\n箱のふちまで水を入れるには、あと何cm³必要ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm³",
          "required": true
        }
      ],
      "displayUnit": "cm³",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "cm3",
        "立方センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "105 cm³"
  },
  {
    "id": "mwq-v2-g5-024",
    "grade": 5,
    "topic": "直方体の体積",
    "questionType": "体積から高さを戻す",
    "title": "宝石箱の高さ",
    "story": "直方体の宝石箱の内側は、底のたて6cm、横5cmです。内側の体積は180cm³です。",
    "question": "内側の高さは何cmですか。",
    "answer": "6",
    "unit": "cm",
    "equation": "180÷(6×5)=6",
    "explanation": "底面積は30cm²です。体積180cm³を30で割ると、高さ6cmです。",
    "prerequisites": [
      "直方体の体積",
      "乗除の相互関係"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "180/(6*5)"
    },
    "answerKind": "integer",
    "semanticPattern": "既知の体積と底の二辺から未知の高さを逆算する",
    "curriculumNote": "小5B直方体の体積。",
    "text": "直方体の宝石箱の内側は、底のたて6cm、横5cmです。内側の体積は180cm³です。\n内側の高さは何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "6 cm"
  },
  {
    "id": "mwq-v2-g5-025",
    "grade": 5,
    "topic": "三角形の面積",
    "questionType": "底辺と垂直な高さ",
    "title": "三角の帆",
    "story": "船の帆は三角形です。底辺は18mで、その底辺に垂直な高さは12mです。",
    "question": "帆の面積は何m²ですか。",
    "answer": "108",
    "unit": "m²",
    "equation": "18×12÷2=108",
    "explanation": "同じ底辺と高さの長方形の半分と考えます。18×12÷2=108m²です。",
    "prerequisites": [
      "底辺と高さ",
      "三角形の面積"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "18*12/2"
    },
    "answerKind": "integer",
    "semanticPattern": "垂直な高さと底辺から三角形の面積を求める",
    "curriculumNote": "小5B三角形の面積。",
    "text": "船の帆は三角形です。底辺は18mで、その底辺に垂直な高さは12mです。\n帆の面積は何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "108 m²"
  },
  {
    "id": "mwq-v2-g5-026",
    "grade": 5,
    "topic": "平行四辺形の面積",
    "questionType": "斜辺という不要情報",
    "title": "斜めの畑",
    "story": "平行四辺形の畑は、底辺14m、その底辺に垂直な高さ9mです。斜めの辺の長さは11mでした。",
    "question": "畑の面積は何m²ですか。",
    "answer": "126",
    "unit": "m²",
    "equation": "14×9=126",
    "explanation": "平行四辺形の面積には底辺と垂直な高さを使います。斜めの辺11mは使わず、14×9=126m²です。",
    "prerequisites": [
      "平行四辺形",
      "垂直な高さ",
      "面積公式"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "14*9"
    },
    "answerKind": "integer",
    "semanticPattern": "不要な斜辺を除外して底辺と高さを選ぶ",
    "curriculumNote": "小5B平行四辺形の面積。",
    "notes": "14×11と誤って計算するかの診断用。児童の誤答実測ではない。",
    "text": "平行四辺形の畑は、底辺14m、その底辺に垂直な高さ9mです。斜めの辺の長さは11mでした。\n畑の面積は何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "126 m²"
  },
  {
    "id": "mwq-v2-g5-027",
    "grade": 5,
    "topic": "台形の面積",
    "questionType": "二つの底辺を使う",
    "title": "水路沿いの広場",
    "story": "水路沿いの広場は台形です。平行な二辺は8mと14mで、その二辺の間の垂直な高さは6mです。",
    "question": "広場の面積は何m²ですか。",
    "answer": "66",
    "unit": "m²",
    "equation": "(8+14)×6÷2=66",
    "explanation": "平行な二辺の和22mに高さ6mをかけ、2で割ります。22×6÷2=66m²です。",
    "prerequisites": [
      "台形",
      "平行な辺と高さ",
      "台形の面積"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(8+14)*6/2"
    },
    "answerKind": "integer",
    "semanticPattern": "平行な二底辺と間の高さから台形面積を求める",
    "curriculumNote": "小5B台形の面積。",
    "text": "水路沿いの広場は台形です。平行な二辺は8mと14mで、その二辺の間の垂直な高さは6mです。\n広場の面積は何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "66 m²"
  },
  {
    "id": "mwq-v2-g5-028",
    "grade": 5,
    "topic": "単位量あたり",
    "questionType": "道のりを燃料量で規格化",
    "title": "魔導車の燃料記録",
    "story": "魔導車が180km走るのに、燃料を12L使いました。走った道のりを、使った燃料1Lあたりで表します。",
    "question": "燃料1Lあたりに走った道のりは何kmですか。",
    "answer": "15",
    "unit": "km/L",
    "equation": "180÷12=15",
    "explanation": "道のり180kmを燃料12Lで割ると、1Lあたり15kmです。",
    "prerequisites": [
      "単位量あたり",
      "異なる二量の割合"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "180/12"
    },
    "answerKind": "integer",
    "semanticPattern": "一単位燃料あたりの道のりへ効率を規格化する",
    "curriculumNote": "小5C単位量あたりの大きさ。将来も同じ効率になるとは仮定しない。",
    "text": "魔導車が180km走るのに、燃料を12L使いました。走った道のりを、使った燃料1Lあたりで表します。\n燃料1Lあたりに走った道のりは何kmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "km/L",
          "required": true
        }
      ],
      "displayUnit": "km/L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "15 km/L"
  },
  {
    "id": "mwq-v2-g5-029",
    "grade": 5,
    "topic": "倍数と時刻",
    "questionType": "最小公倍数を経過時間に使う",
    "title": "二つの鐘の合図",
    "story": "見張り台Aの鐘は12分おき、見張り台Bの鐘は18分おきに鳴ります。どちらも午前9時00分に鳴りました。このあとも決まった間隔で鳴ります。",
    "question": "次に二つが同時に鳴るのは、午前何時何分ですか。",
    "answer": "09:36",
    "unit": "時刻",
    "equation": "12と18の最小公倍数は36、9:00の36分後は9:36",
    "explanation": "12の倍数と18の倍数の最初の共通する数は36です。9時00分から36分後なので9時36分です。",
    "prerequisites": [
      "倍数と公倍数",
      "時刻に時間を足す"
    ],
    "check": {
      "kind": "clock_add",
      "values": [
        9,
        0,
        36
      ]
    },
    "answerKind": "time",
    "semanticPattern": "二つの周期の最初の共通時点を時刻へ変換する",
    "curriculumNote": "小5A倍数・公倍数の活用。時刻計算は既習の活用。",
    "notes": "独立手監査で12,24,36と18,36から最小公倍数36を確認。clock_addの検算はその後の時刻変換。",
    "text": "見張り台Aの鐘は12分おき、見張り台Bの鐘は18分おきに鳴ります。どちらも午前9時00分に鳴りました。このあとも決まった間隔で鳴ります。\n次に二つが同時に鳴るのは、午前何時何分ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "time",
      "fields": [
        {
          "name": "hours",
          "label": "時",
          "keyboard": "integer",
          "unit": "時",
          "required": true
        },
        {
          "name": "minutes",
          "label": "分",
          "keyboard": "integer",
          "unit": "分",
          "required": true
        }
      ],
      "displayUnit": "時刻",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "clock_fields",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "時/分の二欄",
        "H:MM",
        "H時M分",
        "全角数字"
      ]
    },
    "answerDisplay": "09:36 時刻"
  },
  {
    "id": "mwq-v2-g5-030",
    "grade": 5,
    "topic": "多角形の角",
    "questionType": "正多角形の等角性",
    "title": "八角形の魔法陣",
    "story": "魔法陣の外側は正八角形です。八つの内側の角は、どれも同じ大きさです。",
    "question": "一つの内角は何度ですか。",
    "answer": "135",
    "unit": "度",
    "equation": "(8−2)×180÷8=135",
    "explanation": "八角形は一つの頂点から6つの三角形に分けられるので、内角の和は1080度です。8等分して135度です。",
    "prerequisites": [
      "三角形の内角の和",
      "多角形",
      "正多角形"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(8-2)*180/8"
    },
    "answerKind": "integer",
    "semanticPattern": "多角形を三角形へ分けた内角総和を等角数で等分する",
    "curriculumNote": "小5B多角形の性質と正多角形。中学の外角公式や証明は要求しない。",
    "text": "魔法陣の外側は正八角形です。八つの内側の角は、どれも同じ大きさです。\n一つの内角は何度ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        232,
        283
      ],
      "pdfPages": [
        238,
        289
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "度",
          "required": true
        }
      ],
      "displayUnit": "度",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "135 度"
  },
  {
    "id": "mwq-v2-g6-001",
    "grade": 6,
    "topic": "分数の乗法",
    "questionType": "分数の単位量×分数量",
    "title": "月銀の棒を切る",
    "story": "材質と太さが一様な月銀の棒は、1mの重さが3/4kgです。この棒から2/3mを切り出します。切り口で失われる長さは考えません。",
    "question": "切り出した棒の重さは何kgですか。分数で答えましょう。",
    "answer": "1/2",
    "unit": "kg",
    "equation": "3/4×2/3=6/12=1/2",
    "explanation": "1m分の重さ3/4kgを2/3倍すると、1/2kgです。長さと重さは比例します。",
    "prerequisites": [
      "分数の乗法",
      "量の比例",
      "約分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3/4*2/3"
    },
    "answerKind": "fraction",
    "semanticPattern": "一単位の分数量を分数長さへ比例拡張する",
    "curriculumNote": "小6A分数×分数。",
    "text": "材質と太さが一様な月銀の棒は、1mの重さが3/4kgです。この棒から2/3mを切り出します。切り口で失われる長さは考えません。\n切り出した棒の重さは何kgですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "1/2 kg"
  },
  {
    "id": "mwq-v2-g6-002",
    "grade": 6,
    "topic": "分数の除法",
    "questionType": "分数量を別の分数量で測る",
    "title": "精霊の杯で量る水",
    "story": "泉の水が3/5Lあります。精霊の杯1杯分は2/15Lです。半分の杯なども使い、杯何杯分かという量で表します。",
    "question": "泉の水は何杯分ですか。分数で答えましょう。",
    "answer": "9/2",
    "unit": "杯分",
    "equation": "3/5÷2/15=3/5×15/2=9/2",
    "explanation": "2/15Lが3/5Lにいくつ分あるかを求めます。9/2杯分、つまり4杯と半分です。",
    "prerequisites": [
      "分数の除法",
      "包含除",
      "逆数"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(3/5)/(2/15)"
    },
    "answerKind": "fraction",
    "semanticPattern": "分数の基準容量で測った商を端数込みの杯数として答える",
    "curriculumNote": "小6A分数÷分数。整数の最大杯数や余りの問題とは区別。",
    "notes": "いっぱいにできる杯だけの個数ではない。半杯も含む杯分という量を明記。",
    "text": "泉の水が3/5Lあります。精霊の杯1杯分は2/15Lです。半分の杯なども使い、杯何杯分かという量で表します。\n泉の水は何杯分ですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "杯分",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "9/2 杯分"
  },
  {
    "id": "mwq-v2-g6-003",
    "grade": 6,
    "topic": "分数の除法",
    "questionType": "単位量を戻す",
    "title": "竜糸の検査",
    "story": "太さと材質が一様な竜糸は、3/4mの重さが9/10kgです。",
    "question": "同じ竜糸1mの重さは何kgですか。分数で答えましょう。",
    "answer": "6/5",
    "unit": "kg",
    "equation": "9/10÷3/4=9/10×4/3=6/5",
    "explanation": "9/10kgは3/4m分の重さです。長さ3/4で割ると1m分になり、6/5kgです。",
    "prerequisites": [
      "分数の除法",
      "単位量の意味"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(9/10)/(3/4)"
    },
    "answerKind": "fraction",
    "semanticPattern": "分数量に対応する分数量から一単位の量へ戻す",
    "curriculumNote": "小6A分数除法と既習の単位量の見方。",
    "text": "太さと材質が一様な竜糸は、3/4mの重さが9/10kgです。\n同じ竜糸1mの重さは何kgですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "kg",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "キログラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "6/5 kg"
  },
  {
    "id": "mwq-v2-g6-004",
    "grade": 6,
    "topic": "分数倍",
    "questionType": "基準量未知",
    "title": "二本の魔法のリボン",
    "story": "青いリボンの長さは4/5mです。これは、赤いリボンの長さの3/4にあたります。",
    "question": "赤いリボンの長さは何mですか。分数で答えましょう。",
    "answer": "16/15",
    "unit": "m",
    "equation": "□×3/4=4/5、4/5÷3/4=16/15",
    "explanation": "赤を1としたとき青は3/4です。1にあたる赤の長さは4/5÷3/4=16/15mです。",
    "prerequisites": [
      "分数倍",
      "基準量と比較量",
      "分数の除法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(4/5)/(3/4)"
    },
    "answerKind": "fraction",
    "semanticPattern": "分数倍後の比較量から基準量を逆算する",
    "curriculumNote": "小6A分数の乗除の意味。",
    "text": "青いリボンの長さは4/5mです。これは、赤いリボンの長さの3/4にあたります。\n赤いリボンの長さは何mですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "16/15 m"
  },
  {
    "id": "mwq-v2-g6-005",
    "grade": 6,
    "topic": "分数の乗法",
    "questionType": "帯分数の辺の面積",
    "title": "織り上げた敷物",
    "story": "長方形の敷物は、たて1と1/2m、横2と2/3mです。",
    "question": "敷物の面積は何m²ですか。",
    "answer": "4",
    "unit": "m²",
    "equation": "1と1/2×2と2/3=3/2×8/3=4",
    "explanation": "帯分数を仮分数に直し、3/2×8/3を計算します。約分すると4m²です。",
    "prerequisites": [
      "帯分数と仮分数",
      "分数乗法",
      "長方形の面積"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(1+1/2)*(2+2/3)"
    },
    "answerKind": "integer",
    "semanticPattern": "二つの帯分数を仮分数へ変換して面積を求める",
    "curriculumNote": "小6A分数の乗法を既習の面積へ適用。",
    "text": "長方形の敷物は、たて1と1/2m、横2と2/3mです。\n敷物の面積は何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 m²"
  },
  {
    "id": "mwq-v2-g6-006",
    "grade": 6,
    "topic": "分数÷整数",
    "questionType": "分数量の等分",
    "title": "七人分の薬草スープ",
    "story": "薬草スープ7/8Lを、7人に同じ量ずつ分けます。こぼれません。",
    "question": "1人分は何Lですか。分数で答えましょう。",
    "answer": "1/8",
    "unit": "L",
    "equation": "7/8÷7=1/8",
    "explanation": "7/8Lを7等分するので、7/8×1/7=1/8Lです。",
    "prerequisites": [
      "分数の除法",
      "等分除"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(7/8)/7"
    },
    "answerKind": "fraction",
    "semanticPattern": "分数量の全体を整数人数で等分する",
    "curriculumNote": "分数÷整数は現行配当では小6A。旧小5配置と混同しない。",
    "text": "薬草スープ7/8Lを、7人に同じ量ずつ分けます。こぼれません。\n1人分は何Lですか。分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "L",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "リットル",
        "l"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "1/8 L"
  },
  {
    "id": "mwq-v2-g6-007",
    "grade": 6,
    "topic": "整数÷分数",
    "questionType": "整数全体を分数容量で分ける",
    "title": "探検用の水筒",
    "story": "水6Lを、1本に3/4L入る水筒へ入れます。どの水筒もいっぱいにします。移すときに水はこぼれません。",
    "question": "水筒は何本いっぱいになりますか。",
    "answer": "8",
    "unit": "本",
    "equation": "6÷3/4=6×4/3=8",
    "explanation": "3/4Lが6Lにいくつ分あるかを求めます。6÷3/4=8本です。",
    "prerequisites": [
      "整数を分数とみる",
      "分数除法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "6/(3/4)"
    },
    "answerKind": "integer",
    "semanticPattern": "整数の全体容量を分数の一容器量でまとめる",
    "curriculumNote": "小6A整数÷分数。割り切れる個数。",
    "text": "水6Lを、1本に3/4L入る水筒へ入れます。どの水筒もいっぱいにします。移すときに水はこぼれません。\n水筒は何本いっぱいになりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "本",
          "required": true
        }
      ],
      "displayUnit": "本",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ほん",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "8 本"
  },
  {
    "id": "mwq-v2-g6-008",
    "grade": 6,
    "topic": "比",
    "questionType": "最も簡単な整数比",
    "title": "二色の祝祭の玉",
    "story": "祝祭の飾りに赤い玉18個と青い玉30個を使いました。",
    "question": "赤い玉と青い玉の個数の比を、この順に最も簡単な整数の比で答えましょう。",
    "answer": "3:5",
    "unit": "（赤:青）",
    "equation": "18:30=(18÷6):(30÷6)=3:5",
    "explanation": "18と30を両方とも最大公約数6で割り、3:5です。赤が左、青が右です。",
    "prerequisites": [
      "等しい比",
      "最大公約数"
    ],
    "check": {
      "kind": "ratio_reduce",
      "values": [
        18,
        30
      ]
    },
    "answerKind": "ratio",
    "semanticPattern": "二量の順序を固定して比を最簡整数比へ直す",
    "curriculumNote": "小6C比。比の値を求める問題とは別。",
    "text": "祝祭の飾りに赤い玉18個と青い玉30個を使いました。\n赤い玉と青い玉の個数の比を、この順に最も簡単な整数の比で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "ratio",
      "fields": [
        {
          "name": "left",
          "label": "左の比",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "right",
          "label": "右の比",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "（赤:青）",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "ratio_equivalence",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": true,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "左右の二欄",
        "a:b",
        "全角数字"
      ]
    },
    "answerDisplay": "3:5 （赤:青）"
  },
  {
    "id": "mwq-v2-g6-009",
    "grade": 6,
    "topic": "比の値",
    "questionType": "比を商として表す",
    "title": "石板の二つの長さ",
    "story": "石板の横は12cm、たては18cmです。横とたての長さの比は12:18です。",
    "question": "この比12:18の比の値を、分数で答えましょう。",
    "answer": "2/3",
    "unit": "（比の値）",
    "equation": "12÷18=12/18=2/3",
    "explanation": "比a:bの比の値はa÷bです。12÷18を分数で表すと2/3です。",
    "prerequisites": [
      "比の値",
      "分数と除法",
      "約分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "12/18"
    },
    "answerKind": "fraction",
    "semanticPattern": "整数比を同値比の組ではなく一つの商の値へ変換する",
    "curriculumNote": "小6C比と比の値。",
    "text": "石板の横は12cm、たては18cmです。横とたての長さの比は12:18です。\nこの比12:18の比の値を、分数で答えましょう。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "fraction",
      "fields": [
        {
          "name": "numerator",
          "label": "分子",
          "keyboard": "integer",
          "unit": "",
          "required": true
        },
        {
          "name": "denominator",
          "label": "分母",
          "keyboard": "integer",
          "unit": "",
          "required": true
        }
      ],
      "displayUnit": "（比の値）",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": true,
      "acceptedForms": [
        "分子/分母の二欄",
        "同値分数(最簡指定時を除く)",
        "指定がない場合の同値小数",
        "全角数字"
      ]
    },
    "answerDisplay": "2/3 （比の値）"
  },
  {
    "id": "mwq-v2-g6-010",
    "grade": 6,
    "topic": "比による配分",
    "questionType": "全体を二つに分ける",
    "title": "二つの砦への矢",
    "story": "矢96本を、東の砦と西の砦に5:3の本数比で分けます。矢はすべて分け、余りはありません。",
    "question": "東の砦には何本送りますか。",
    "answer": "60",
    "unit": "本",
    "equation": "96÷(5+3)×5=60",
    "explanation": "全体は比の8つ分です。1つ分は12本なので、東の5つ分は60本です。",
    "prerequisites": [
      "比の和",
      "一つ分といくつ分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "96/(5+3)*5"
    },
    "answerKind": "integer",
    "semanticPattern": "比の和を全体に対応させて一方の配分量を求める",
    "curriculumNote": "小6C比の活用。",
    "text": "矢96本を、東の砦と西の砦に5:3の本数比で分けます。矢はすべて分け、余りはありません。\n東の砦には何本送りますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "本",
          "required": true
        }
      ],
      "displayUnit": "本",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "ほん",
        "ぽん"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "60 本"
  },
  {
    "id": "mwq-v2-g6-011",
    "grade": 6,
    "topic": "等しい比",
    "questionType": "一方の量から他方へ",
    "title": "工房の二色のガラス",
    "story": "工房は、金色のガラスと青いガラスを4:3の重さの比で使います。青いガラスを27g使うことにしました。",
    "question": "金色のガラスは何g使いますか。",
    "answer": "36",
    "unit": "g",
    "equation": "27÷3×4=36",
    "explanation": "青の比3つ分が27gなので、1つ分は9gです。金色の4つ分は36gです。",
    "prerequisites": [
      "等しい比",
      "比例配分の一つ分"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "27/3*4"
    },
    "answerKind": "integer",
    "semanticPattern": "一方の量だけが既知の同値比から他方の量を求める",
    "curriculumNote": "小6C比の活用。",
    "text": "工房は、金色のガラスと青いガラスを4:3の重さの比で使います。青いガラスを27g使うことにしました。\n金色のガラスは何g使いますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "g",
          "required": true
        }
      ],
      "displayUnit": "g",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "グラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "36 g"
  },
  {
    "id": "mwq-v2-g6-012",
    "grade": 6,
    "topic": "比と不足量",
    "questionType": "必要量を比から求めて現在量を除く",
    "title": "顔料を仕上げる水",
    "story": "顔料は、粉と水を重さの比2:7で混ぜて作ります。粉を18g用意し、水はすでに56g入れました。粉は全部使い、ほかの材料は入れません。",
    "question": "正しい比にするには、水をあと何g入れますか。",
    "answer": "7",
    "unit": "g",
    "equation": "18÷2×7−56=7",
    "explanation": "粉18gは比の2つ分なので、水の必要量は63gです。すでに56gあるため、あと7gです。",
    "prerequisites": [
      "比から必要量を求める",
      "不足量"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "18/2*7-56"
    },
    "answerKind": "integer",
    "semanticPattern": "比から目標量を決め既に投入した量との差を求める",
    "curriculumNote": "小6C比の活用。全体を一括配分する型とは異なる。",
    "text": "顔料は、粉と水を重さの比2:7で混ぜて作ります。粉を18g用意し、水はすでに56g入れました。粉は全部使い、ほかの材料は入れません。\n正しい比にするには、水をあと何g入れますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "g",
          "required": true
        }
      ],
      "displayUnit": "g",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "グラム"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "7 g"
  },
  {
    "id": "mwq-v2-g6-013",
    "grade": 6,
    "topic": "拡大図",
    "questionType": "対応する辺の倍率",
    "title": "大きく写す紋章",
    "story": "長方形の紋章は、横6cm、たて4cmです。形を変えずに拡大し、横を15cmにします。",
    "question": "拡大した紋章のたては何cmですか。",
    "answer": "10",
    "unit": "cm",
    "equation": "15÷6=2.5、4×2.5=10",
    "explanation": "横は2.5倍になっています。形を変えない拡大ではたても同じ倍率なので、4×2.5=10cmです。",
    "prerequisites": [
      "対応する辺",
      "拡大図",
      "小数倍"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "4*(15/6)"
    },
    "answerKind": "integer",
    "semanticPattern": "一対応辺から倍率を求め別の対応辺へ同じ倍率を適用する",
    "curriculumNote": "小6B拡大図・縮図。",
    "text": "長方形の紋章は、横6cm、たて4cmです。形を変えずに拡大し、横を15cmにします。\n拡大した紋章のたては何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "10 cm"
  },
  {
    "id": "mwq-v2-g6-014",
    "grade": 6,
    "topic": "比例と文字式",
    "questionType": "式への代入",
    "title": "石運びの記録式",
    "story": "石を箱に詰めるとき、箱の数をx、石の総数をyとすると、y=12xという関係になります。どの箱も同じ数の石が入ります。",
    "question": "x=17のとき、yはいくつですか。",
    "answer": "204",
    "unit": "個",
    "equation": "y=12×17=204",
    "explanation": "式のxに17を入れます。12個ずつの箱が17箱なので、y=204個です。",
    "prerequisites": [
      "文字を用いた式",
      "比例の式"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "12*17"
    },
    "answerKind": "integer",
    "semanticPattern": "与えられた比例式へ対応する変数の値を代入する",
    "curriculumNote": "小6A文字式・C比例。",
    "text": "石を箱に詰めるとき、箱の数をx、石の総数をyとすると、y=12xという関係になります。どの箱も同じ数の石が入ります。\nx=17のとき、yはいくつですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "個",
          "required": true
        }
      ],
      "displayUnit": "個",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "こ"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "204 個"
  },
  {
    "id": "mwq-v2-g6-015",
    "grade": 6,
    "topic": "比例",
    "questionType": "対応表から比例定数を使う",
    "title": "魔力の充電表",
    "story": "同じ装置で充電すると、充電時間とたまる魔力は比例します。2分で18点、5分で45点たまりました。最初の魔力は0点です。",
    "question": "8分では魔力が何点たまりますか。",
    "answer": "72",
    "unit": "点",
    "equation": "18÷2=9、45÷5=9、9×8=72",
    "explanation": "1分あたり9点たまります。5分で45点という記録とも一致します。8分では9×8=72点です。",
    "prerequisites": [
      "比例",
      "表の対応",
      "単位量"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(18/2)*8"
    },
    "answerKind": "integer",
    "semanticPattern": "複数の対応値から一定の商を読み新しい対応値へ外挿する",
    "curriculumNote": "小6C比例。0からたまる条件を明記。",
    "notes": "45÷5も9になることを自己監査。二つ目の記録は比例関係の整合確認用。",
    "text": "同じ装置で充電すると、充電時間とたまる魔力は比例します。2分で18点、5分で45点たまりました。最初の魔力は0点です。\n8分では魔力が何点たまりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "点",
          "required": true
        }
      ],
      "displayUnit": "点",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "72 点"
  },
  {
    "id": "mwq-v2-g6-016",
    "grade": 6,
    "topic": "反比例",
    "questionType": "人数と所要時間",
    "title": "城壁のぬり直し",
    "story": "同じ広さの城壁を、6人なら8時間でぬれます。全員の1時間あたりの仕事量は等しく一定です。人数を増やしても互いの作業をじゃませず、休み時間もありません。12人で同じ城壁をぬります。",
    "question": "作業は何時間で終わりますか。",
    "answer": "4",
    "unit": "時間",
    "equation": "6×8÷12=4",
    "explanation": "同じ仕事なので人数×時間は一定です。6×8=48人分の1時間の仕事を12人で行い、4時間です。",
    "prerequisites": [
      "反比例",
      "積が一定",
      "単位仕事量"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "6*8/12"
    },
    "answerKind": "integer",
    "semanticPattern": "固定された仕事量のもとで人数を変えて所要時間を求める",
    "curriculumNote": "小6C反比例の活用。特殊な仕事算の公式は不要。",
    "text": "同じ広さの城壁を、6人なら8時間でぬれます。全員の1時間あたりの仕事量は等しく一定です。人数を増やしても互いの作業をじゃませず、休み時間もありません。12人で同じ城壁をぬります。\n作業は何時間で終わりますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "時間",
          "required": true
        }
      ],
      "displayUnit": "時間",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 時間"
  },
  {
    "id": "mwq-v2-g6-017",
    "grade": 6,
    "topic": "反比例",
    "questionType": "面積一定の長方形",
    "title": "形を変える訓練場",
    "story": "長方形の訓練場の面積を72m²に保ったまま形を変えます。はじめは横8m、たて9mでした。横を12mにしても面積は72m²のままです。",
    "question": "新しいたての長さは何mですか。",
    "answer": "6",
    "unit": "m",
    "equation": "72÷12=6",
    "explanation": "面積が一定なので、横×たては72です。横12mのとき、たては72÷12=6mです。",
    "prerequisites": [
      "長方形の面積",
      "反比例"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "72/12"
    },
    "answerKind": "integer",
    "semanticPattern": "一定積を保つ二量の一方から他方を決める",
    "curriculumNote": "小6C反比例を既習の面積に結びつける。",
    "text": "長方形の訓練場の面積を72m²に保ったまま形を変えます。はじめは横8m、たて9mでした。横を12mにしても面積は72m²のままです。\n新しいたての長さは何mですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "6 m"
  },
  {
    "id": "mwq-v2-g6-018",
    "grade": 6,
    "topic": "縮図と縮尺",
    "questionType": "地図から実際の道のり・情報選択",
    "title": "二本の山道の地図",
    "story": "縮尺1:25000の地図に、山小屋から峠へ行く道Aと道Bが描かれています。地図上で道Aは3.6cm、道Bは4.1cmです。道の長さは曲がり方に沿ってはかりました。",
    "question": "道Aの実際の道のりは何mですか。",
    "answer": "900",
    "unit": "m",
    "equation": "3.6×25000÷100=900",
    "explanation": "地図の1cmは実際の25000cmです。道Aは90000cmで、mに直すと900mです。道Bの長さは使いません。",
    "prerequisites": [
      "縮尺",
      "cmとm",
      "小数乗法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3.6*25000/100"
    },
    "answerKind": "integer",
    "semanticPattern": "複数経路から指定経路を選び縮尺と単位換算で実長へ戻す",
    "curriculumNote": "小6B縮図の活用。道のりと直線距離を混同しない。",
    "text": "縮尺1:25000の地図に、山小屋から峠へ行く道Aと道Bが描かれています。地図上で道Aは3.6cm、道Bは4.1cmです。道の長さは曲がり方に沿ってはかりました。\n道Aの実際の道のりは何mですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "m",
          "required": true
        }
      ],
      "displayUnit": "m",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "900 m"
  },
  {
    "id": "mwq-v2-g6-019",
    "grade": 6,
    "topic": "縮図と縮尺",
    "questionType": "実際の長さから地図の長さ",
    "title": "街道を地図にかく",
    "story": "実際に1.2kmある街道を、縮尺1:20000の地図にかきます。",
    "question": "地図上の街道の長さは何cmですか。",
    "answer": "6",
    "unit": "cm",
    "equation": "1.2km=120000cm、120000÷20000=6",
    "explanation": "実際の長さを先にcmへ直します。1.2kmは120000cmなので、地図では6cmです。",
    "prerequisites": [
      "縮尺",
      "kmとcm"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "1.2*1000*100/20000"
    },
    "answerKind": "integer",
    "semanticPattern": "実長を地図単位へそろえ縮尺で縮める",
    "curriculumNote": "小6B縮図。地図から実長へ戻す型の逆。",
    "text": "実際に1.2kmある街道を、縮尺1:20000の地図にかきます。\n地図上の街道の長さは何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "6 cm"
  },
  {
    "id": "mwq-v2-g6-020",
    "grade": 6,
    "topic": "円の面積",
    "questionType": "半径から面積",
    "title": "円い薬草園",
    "story": "薬草園は半径7mの円です。円周率は3.14とします。",
    "question": "薬草園の面積は何m²ですか。",
    "answer": "153.86",
    "unit": "m²",
    "equation": "7×7×3.14=153.86",
    "explanation": "円の面積は半径×半径×円周率です。49×3.14=153.86m²です。",
    "prerequisites": [
      "円の半径",
      "円の面積",
      "小数乗法"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "7*7*3.14"
    },
    "answerKind": "decimal",
    "semanticPattern": "半径を二乗して円全体の面積を求める",
    "curriculumNote": "小6B円の面積。",
    "text": "薬草園は半径7mの円です。円周率は3.14とします。\n薬草園の面積は何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "153.86 m²"
  },
  {
    "id": "mwq-v2-g6-021",
    "grade": 6,
    "topic": "円を組み合わせた面積",
    "questionType": "同心円の差",
    "title": "泉のまわりの石だたみ",
    "story": "円い泉の中心から水面のふちまでは3mです。同じ中心で半径5mの円まで、泉の外側に石だたみを作ります。水面には石をしきません。円周率は3.14とします。",
    "question": "石だたみの面積は何m²ですか。",
    "answer": "50.24",
    "unit": "m²",
    "equation": "5×5×3.14−3×3×3.14=50.24",
    "explanation": "大きい円の面積78.5m²から、水面の面積28.26m²を引き、50.24m²です。",
    "prerequisites": [
      "円の面積",
      "面積の差"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "5*5*3.14-3*3*3.14"
    },
    "answerKind": "decimal",
    "semanticPattern": "同じ中心の二円の差から環状部分の面積を求める",
    "curriculumNote": "小6B円の面積の活用。",
    "text": "円い泉の中心から水面のふちまでは3mです。同じ中心で半径5mの円まで、泉の外側に石だたみを作ります。水面には石をしきません。円周率は3.14とします。\n石だたみの面積は何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "50.24 m²"
  },
  {
    "id": "mwq-v2-g6-022",
    "grade": 6,
    "topic": "円の面積",
    "questionType": "円周から半径へ逆算",
    "title": "円形の舞台",
    "story": "円形の舞台の円周は31.4mです。円周率は3.14とします。",
    "question": "舞台の面積は何m²ですか。",
    "answer": "78.5",
    "unit": "m²",
    "equation": "31.4÷3.14÷2=5、5×5×3.14=78.5",
    "explanation": "円周から直径10m、半径5mを求めます。その半径で面積を計算すると78.5m²です。",
    "prerequisites": [
      "円周の公式",
      "半径と直径",
      "円の面積"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(31.4/3.14/2)*(31.4/3.14/2)*3.14"
    },
    "answerKind": "decimal",
    "semanticPattern": "円周を通して隠れた半径を復元し面積を求める",
    "curriculumNote": "円周は小5既習、円の面積は小6B。",
    "text": "円形の舞台の円周は31.4mです。円周率は3.14とします。\n舞台の面積は何m²ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "m²",
          "required": true
        }
      ],
      "displayUnit": "m²",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "m2",
        "平方メートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "78.5 m²"
  },
  {
    "id": "mwq-v2-g6-023",
    "grade": 6,
    "topic": "円柱の体積",
    "questionType": "底面の円から体積",
    "title": "円柱の水晶",
    "story": "水晶は、底面の半径3cm、高さ10cmの円柱です。円周率は3.14とします。",
    "question": "水晶の体積は何cm³ですか。",
    "answer": "282.6",
    "unit": "cm³",
    "equation": "3×3×3.14×10=282.6",
    "explanation": "底面積は28.26cm²です。これに高さ10cmをかけ、282.6cm³です。",
    "prerequisites": [
      "円の面積",
      "円柱の体積"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "3*3*3.14*10"
    },
    "answerKind": "decimal",
    "semanticPattern": "円の底面積を作り柱の高さへ積み重ねて体積にする",
    "curriculumNote": "小6B角柱・円柱の体積。",
    "text": "水晶は、底面の半径3cm、高さ10cmの円柱です。円周率は3.14とします。\n水晶の体積は何cm³ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "cm³",
          "required": true
        }
      ],
      "displayUnit": "cm³",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "cm3",
        "立方センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "282.6 cm³"
  },
  {
    "id": "mwq-v2-g6-024",
    "grade": 6,
    "topic": "角柱の体積",
    "questionType": "三角形の底面を使う",
    "title": "三角柱の標識",
    "story": "標識は三角柱です。底面は、直角をはさむ二辺が5cmと8cmの直角三角形です。二つの底面の間の距離、つまり柱の高さは12cmです。",
    "question": "標識の体積は何cm³ですか。",
    "answer": "240",
    "unit": "cm³",
    "equation": "(5×8÷2)×12=240",
    "explanation": "底面積は20cm²です。柱の高さ12cmをかけて、240cm³になります。",
    "prerequisites": [
      "三角形の面積",
      "底面と柱の高さ",
      "角柱の体積"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(5*8/2)*12"
    },
    "answerKind": "integer",
    "semanticPattern": "三角形内部の高さと柱の高さを区別して体積を求める",
    "curriculumNote": "小6B角柱の体積。",
    "text": "標識は三角柱です。底面は、直角をはさむ二辺が5cmと8cmの直角三角形です。二つの底面の間の距離、つまり柱の高さは12cmです。\n標識の体積は何cm³ですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm³",
          "required": true
        }
      ],
      "displayUnit": "cm³",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "cm3",
        "立方センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "240 cm³"
  },
  {
    "id": "mwq-v2-g6-025",
    "grade": 6,
    "topic": "円柱の体積",
    "questionType": "体積から高さを戻す",
    "title": "円柱の貯水容器",
    "story": "円柱の容器の内側の底面は半径4cmで、内側の体積は452.16cm³です。円周率は3.14とします。",
    "question": "容器の内側の高さは何cmですか。",
    "answer": "9",
    "unit": "cm",
    "equation": "452.16÷(4×4×3.14)=9",
    "explanation": "底面積は50.24cm²です。体積を底面積で割ると高さなので、452.16÷50.24=9cmです。",
    "prerequisites": [
      "円の面積",
      "円柱の体積",
      "逆算"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "452.16/(4*4*3.14)"
    },
    "answerKind": "integer",
    "semanticPattern": "柱の全体積を円の底面積で割り高さを復元する",
    "curriculumNote": "小6B円柱の体積の活用。",
    "text": "円柱の容器の内側の底面は半径4cmで、内側の体積は452.16cm³です。円周率は3.14とします。\n容器の内側の高さは何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "9 cm"
  },
  {
    "id": "mwq-v2-g6-026",
    "grade": 6,
    "topic": "データの代表値",
    "questionType": "偶数個の中央値",
    "title": "六本の苗の高さ",
    "story": "苗6本の高さは、2cm、8cm、4cm、9cm、5cm、6cmでした。",
    "question": "高さの中央値は何cmですか。",
    "answer": "5.5",
    "unit": "cm",
    "equation": "小さい順2,4,5,6,8,9、(5+6)÷2=5.5",
    "explanation": "小さい順に並べると中央の二つは5cmと6cmです。偶数個なので、その平均5.5cmが中央値です。",
    "prerequisites": [
      "データの並べ替え",
      "中央値",
      "平均"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "(5+6)/2"
    },
    "answerKind": "decimal",
    "semanticPattern": "偶数個データを順序化し中央二値を平均する",
    "curriculumNote": "小6D代表値としての中央値。",
    "notes": "並べ替えは本文6値を独立手監査。check式は中央二値の処理。",
    "text": "苗6本の高さは、2cm、8cm、4cm、9cm、5cm、6cmでした。\n高さの中央値は何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "decimal",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "decimal",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "厳密に同値な有限小数/分数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "5.5 cm"
  },
  {
    "id": "mwq-v2-g6-027",
    "grade": 6,
    "topic": "データの代表値",
    "questionType": "最頻値",
    "title": "七回の結晶の長さ",
    "story": "7回の観測で見つかった結晶の長さは、4cm、5cm、4cm、8cm、6cm、4cm、5cmでした。",
    "question": "結晶の長さの最頻値は何cmですか。",
    "answer": "4",
    "unit": "cm",
    "equation": "4,5,4,8,6,4,5を整理→4は3回、5は2回、6と8は各1回→最頻値4",
    "explanation": "最も多く現れる値を選びます。4cmが3回で最も多いので、最頻値は4cmです。回数3を答える問題ではありません。",
    "prerequisites": [
      "値と度数の区別",
      "最頻値"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "4"
    },
    "answerKind": "integer",
    "semanticPattern": "出現回数が最大の値を度数そのものと区別して取り出す",
    "curriculumNote": "小6D代表値としての最頻値。",
    "notes": "check式は選択後の値。度数4:3回/5:2回/6:1回/8:1回を独立手監査。",
    "text": "7回の観測で見つかった結晶の長さは、4cm、5cm、4cm、8cm、6cm、4cm、5cmでした。\n結晶の長さの最頻値は何cmですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "cm",
          "required": true
        }
      ],
      "displayUnit": "cm",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [
        "センチメートル"
      ],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "4 cm"
  },
  {
    "id": "mwq-v2-g6-028",
    "grade": 6,
    "topic": "場合の数",
    "questionType": "異なる種類の選択の組合せ",
    "title": "祭りの衣装選び",
    "story": "衣装係は、赤と青の2色のマントから1着、月・星・太陽の3種類の胸飾りから1個を選びます。どのマントにも、どの胸飾りでも付けられます。",
    "question": "マントと胸飾りの選び方は全部で何通りですか。",
    "answer": "6",
    "unit": "通り",
    "equation": "2×3=6",
    "explanation": "赤のマントに3通り、青のマントにも3通りあるので、合計6通りです。",
    "prerequisites": [
      "樹形図や表",
      "漏れなく数える"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "2*3"
    },
    "answerKind": "integer",
    "semanticPattern": "独立した二つの選択群の直積を数える",
    "curriculumNote": "小6D起こり得る場合。",
    "text": "衣装係は、赤と青の2色のマントから1着、月・星・太陽の3種類の胸飾りから1個を選びます。どのマントにも、どの胸飾りでも付けられます。\nマントと胸飾りの選び方は全部で何通りですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "通り",
          "required": true
        }
      ],
      "displayUnit": "通り",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "6 通り"
  },
  {
    "id": "mwq-v2-g6-029",
    "grade": 6,
    "topic": "場合の数",
    "questionType": "順序を区別しない二人組",
    "title": "見回りの二人組",
    "story": "見回り役の候補はアキ、イオ、ウタ、エマの4人です。この中から違う2人を選びます。リーダーなどの役はなく、選ぶ順序が違っても同じ二人組です。",
    "question": "二人組は全部で何通りできますか。",
    "answer": "6",
    "unit": "通り",
    "equation": "4×3÷2=6",
    "explanation": "二人を順に選ぶと12通りですが、アキとイオ、イオとアキは同じ組です。二重に数えた分を2で割り、6通りです。",
    "prerequisites": [
      "場合を整理する",
      "順序の有無"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "4*3/2"
    },
    "answerKind": "integer",
    "semanticPattern": "同じ組の順序による重複を除いて二者選択を数える",
    "curriculumNote": "小6D場合の数。組合せ記号や中学受験公式は要求しない。",
    "text": "見回り役の候補はアキ、イオ、ウタ、エマの4人です。この中から違う2人を選びます。リーダーなどの役はなく、選ぶ順序が違っても同じ二人組です。\n二人組は全部で何通りできますか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "通り",
          "required": true
        }
      ],
      "displayUnit": "通り",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "6 通り"
  },
  {
    "id": "mwq-v2-g6-030",
    "grade": 6,
    "topic": "場合の数",
    "questionType": "一部を選んで順に並べる",
    "title": "三つの旗ざお",
    "story": "赤・青・白・黒の異なる旗が1本ずつあります。そのうち3本を選び、左・中央・右の3本の旗ざおに1本ずつ付けます。同じ旗を2か所には使えません。",
    "question": "旗の並べ方は全部で何通りですか。",
    "answer": "24",
    "unit": "通り",
    "equation": "4×3×2=24",
    "explanation": "左は4通り、中央は残り3通り、右はさらに残り2通りです。4×3×2=24通りです。",
    "prerequisites": [
      "樹形図",
      "順序を区別する",
      "重複なし"
    ],
    "check": {
      "kind": "arithmetic",
      "expression": "4*3*2"
    },
    "answerKind": "integer",
    "semanticPattern": "全てを使わずに順序のある複数位置へ異なる物を配置する",
    "curriculumNote": "小6D場合の数。階乗記号や順列公式は不要。",
    "text": "赤・青・白・黒の異なる旗が1本ずつあります。そのうち3本を選び、左・中央・右の3本の旗ざおに1本ずつ付けます。同じ旗を2か所には使えません。\n旗の並べ方は全部で何通りですか。",
    "isWordProblem": true,
    "original": true,
    "curriculumReference": {
      "source": "文部科学省 小学校学習指導要領(平成29年告示)解説 算数編",
      "url": "https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf",
      "printedPages": [
        284,
        321
      ],
      "pdfPages": [
        290,
        327
      ],
      "scope": "学年範囲の参照。具体的な既習条件とcurriculumNoteを併用"
    },
    "input": {
      "kind": "integer",
      "fields": [
        {
          "name": "value",
          "label": "答え",
          "keyboard": "integer",
          "unit": "通り",
          "required": true
        }
      ],
      "displayUnit": "通り",
      "specialSymbolTypingRequired": false,
      "integrationStatus": "未接続。正式UI担当がfieldsを描画する"
    },
    "scoring": {
      "policy": "exact_rational",
      "unitRequired": false,
      "unitAliases": [],
      "acceptFullwidthDigits": true,
      "requireSimplest": false,
      "requireSimplestFraction": false,
      "requireFractionNotation": false,
      "acceptedForms": [
        "整数",
        "小数末尾の0",
        "定義した単位のみ付記",
        "全角数字"
      ]
    },
    "answerDisplay": "24 通り"
  }
]);
function gcdV2(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;}
function rationalV2(raw){
 const s=String(raw??'').normalize('NFKC').trim().replace(/−/g,'-');
 const m=s.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
 if(m){const d=10n**BigInt((m[3]||'').length),n=BigInt(m[2]+(m[3]||''))*(m[1]==='-'?-1n:1n);return[n,d];}
 const f=s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
 if(f&&BigInt(f[2])!==0n){let n=BigInt(f[1]),d=BigInt(f[2]);if(d<0n){n=-n;d=-d;}return[n,d];}
 return null;
}
const equalRationalV2=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
function scalarInputV2(problem,input){
 if(input&&typeof input==='object'){
  if(problem.answerKind==='fraction'&&input.numerator!=null&&input.denominator!=null)return `${input.numerator}/${input.denominator}`;
  if(input.value!=null)return String(input.value);
  return null;
 }
 let s=String(input??'').normalize('NFKC').trim();
 const units=[problem.unit,...(problem.scoring?.unitAliases||[])].filter(Boolean).map(v=>String(v).normalize('NFKC')).sort((a,b)=>b.length-a.length);
 const unit=units.find(v=>s.endsWith(v));
 if(unit)s=s.slice(0,-unit.length).trim();
 return s;
}
function clockV2(value){
 let h,m;
 if(value&&typeof value==='object'){h=String(value.hours??'').normalize('NFKC');m=String(value.minutes??'').normalize('NFKC');}
 else{const match=String(value??'').normalize('NFKC').trim().match(/^(\d{1,2})\s*(?::|時|じ)\s*(\d{1,2})\s*(?:分|ふん)?$/);if(!match)return null;[,h,m]=match;}
 if(!/^\d{1,2}$/.test(h)||!/^\d{1,2}$/.test(m))return null;
 h=Number(h);m=Number(m);return h>=0&&h<24&&m>=0&&m<60?h*60+m:null;
}
function integerPairV2(input,kind){
 if(input&&typeof input==='object'){
  const fields=kind==='ratio'?['left','right']:['quotient','remainder'];
  const a=String(input[fields[0]]??'').normalize('NFKC').trim(),b=String(input[fields[1]]??'').normalize('NFKC').trim();
  return /^\d+$/.test(a)&&/^\d+$/.test(b)?[BigInt(a),BigInt(b)]:null;
 }
 const s=String(input??'').normalize('NFKC').trim();
 const match=s.match(kind==='ratio'?/^(\d+)\s*:\s*(\d+)$/:/^(\d+)\s*(?:あまり|余り|余|r)\s*(\d+)$/i);
 return match?[BigInt(match[1]),BigInt(match[2])]:null;
}
/** Pure candidate scorer. No game/save/UI/network side effects. */
export function scoreMathWordAnswerV2(problemOrId,input){
 const problem=typeof problemOrId==='string'?getMathWordQuestV2(problemOrId):problemOrId;
 if(!problem)return{correct:false,reason:'unknown_problem'};
 if(problem.answerKind==='time'){
  const actual=clockV2(input),expected=clockV2(problem.answer);
  return{correct:actual!==null&&actual===expected,reason:actual===null?'invalid_clock':'clock_comparison'};
 }
 if(problem.answerKind==='remainder'){
  const actual=integerPairV2(input,'remainder');
  return{correct:!!actual&&actual[0]===BigInt(problem.answer)&&actual[1]===BigInt(problem.remainder),reason:actual?'quotient_and_remainder':'both_fields_required'};
 }
 if(problem.answerKind==='ratio'){
  const actual=integerPairV2(input,'ratio'),expected=integerPairV2(problem.answer,'ratio');
  if(!actual||!expected||actual[1]===0n)return{correct:false,reason:'invalid_ratio'};
  const equal=actual[0]*expected[1]===expected[0]*actual[1],simple=!problem.scoring.requireSimplest||gcdV2(...actual)===1n;
  return{correct:equal&&simple,reason:!simple?'simplest_ratio_required':'ratio_comparison'};
 }
 const raw=scalarInputV2(problem,input),actual=raw===null?null:rationalV2(raw),expected=rationalV2(problem.answer);
 if(problem.answerKind==='fraction'&&raw!==null&&String(raw).includes('/')&&!/^\d+\s*\/\s*\d+$/.test(String(raw).normalize('NFKC').trim()))return{correct:false,reason:'nonnegative_fraction_fields_required'};
 if(problem.answerKind==='integer'&&raw!==null&&!/^[+-]?\d+(?:\.0+)?$/.test(raw))return{correct:false,reason:'integer_format_required'};
 if(problem.answerKind==='fraction'&&actual){
  if(problem.scoring.requireFractionNotation&&!String(raw).includes('/'))return{correct:false,reason:'fraction_format_required'};
  if(problem.scoring.requireSimplestFraction&&gcdV2(...actual)!==1n)return{correct:false,reason:'simplest_fraction_required'};
 }
 return{correct:equalRationalV2(actual,expected),reason:actual?'exact_rational_comparison':'invalid_number'};
}
export function getMathWordQuestV2(id){return MATH_WORD_QUESTS_V2.find(problem=>problem.id===id)||null;}
export function getMathWordQuestsV2(grade,{topic}={}){return MATH_WORD_QUESTS_V2.filter(problem=>problem.grade===Number(grade)&&(!topic||problem.topic===topic));}
