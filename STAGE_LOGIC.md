# ステージ出題ロジック仕様書

このドキュメントは、各ステージの計算問題を生成するための具体的な「ランダム値生成範囲」と「条件」を定義します。  
コード実装時のベースとしてご活用ください。

---

## JSON データ構造イメージ

```javascript
const STAGES = {
  area1: {
    name: "始まりの平原",
    color: "#FFD700",        // 背景色（オプション）
    stages: [
      {
        id: "area1_stage1",
        name: "1桁 + 1桁（繰り上がりなし）",
        operation: "add",
        generateProblem: () => {
          // a + b の形式。a+b <= 9
          const a = rnd(1, 9);
          const b = rnd(1, 9);
          if (a + b > 9) return generateProblem(); // 繰り上がりなしを満たさない場合は再生成
          return { a, b, op: '+', answer: a + b };
        }
      },
      // ... 他のステージ
    ],
    boss: {
      name: "エリアボス",
      phases: {
        phase1: {
          hpThreshold: 0.5,  // 50%以下でフェーズ2へ
          name: "総復習",
          generateProblem: () => {
            // area1_stage1 ～ area1_stage7 から**ランダムに1つ選んで**出題
          }
        },
        phase2: {
          name: "限界突破",
          generateProblem: () => {
            // 3桁 + 2桁 or 繰り上がり連続の2桁+2桁のみ
          }
        }
      }
    }
  },
  area2: { /* ... */ },
  area3: { /* ... */ },
  area4: { /* ... */ }
};
```

---

## 【エリア1】始まりの平原（足し算）

### ステージ1：1桁 ＋ 1桁（繰り上がりなし）

```javascript
{
  id: "area1_stage1",
  name: "1桁 + 1桁（繰り上がりなし）",
  generateProblem: () => {
    let a, b;
    do {
      a = rnd(1, 9);
      b = rnd(1, 9);
    } while (a + b > 9);  // 繰り上がり=10以上の場合は再生成
    return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
  }
}
```

### ステージ2：10 ＋ 〇（10のまとまり）

```javascript
{
  id: "area1_stage2",
  name: "10 + 〇",
  generateProblem: () => {
    const a = 10;  // 固定
    const b = rnd(1, 9);
    return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
  }
}
```

### ステージ3：1桁 ＋ 1桁（繰り上がりあり）

```javascript
{
  id: "area1_stage3",
  name: "1桁 + 1桁（繰り上がりあり）",
  generateProblem: () => {
    let a, b;
    do {
      a = rnd(1, 9);
      b = rnd(1, 9);
    } while (a + b < 10);  // 繰り上がり必須（10以上）
    return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
  }
}
```

### ステージ4：3つの数の足し算（1桁）

```javascript
{
  id: "area1_stage4",
  name: "3つの数の足し算",
  generateProblem: () => {
    const a = rnd(1, 5);
    const b = rnd(1, 5);
    const c = rnd(1, 5);
    const answer = a + b + c;
    return { 
      numbers: [a, b, c], 
      op: '+', 
      answer, 
      text: `${a} + ${b} + ${c}` 
    };
  }
}
```

### ステージ5：2桁 ＋ 1桁（繰り上がり混合）

```javascript
{
  id: "area1_stage5",
  name: "2桁 + 1桁（繰り上がり混合）",
  generateProblem: () => {
    const a = rnd(10, 49);
    const b = rnd(1, 9);
    // 繰り上がりの有無はランダム
    return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
  }
}
```

### ステージ6：2桁 ＋ 2桁（繰り上がりなし）

```javascript
{
  id: "area1_stage6",
  name: "2桁 + 2桁（繰り上がりなし）",
  generateProblem: () => {
    let a, b;
    do {
      a = rnd(10, 49);
      b = rnd(10, 49);
    } while (a + b > 99);  // 繰り上がりなし
    return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
  }
}
```

### ステージ7：2桁 ＋ 2桁（繰り上がりあり）

```javascript
{
  id: "area1_stage7",
  name: "2桁 + 2桁（繰り上がりあり）",
  generateProblem: () => {
    let a, b;
    do {
      a = rnd(10, 89);
      b = rnd(10, 89);
    } while (a + b < 10);  // 繰り上がり必須
    return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
  }
}
```

### エリア1 ボス

#### フェーズ1（HP 100%～50%）：総復習

```javascript
{
  id: "area1_boss_phase1",
  name: "総復習",
  generateProblem: () => {
    // area1_stage1 ～ area1_stage7 から1つランダムに選ぶ
    const stageFunctions = [
      generateStage1Problem,
      generateStage2Problem,
      // ... 
      generateStage7Problem
    ];
    const randomFunc = pick(stageFunctions);
    return randomFunc();
  }
}
```

#### フェーズ2（HP 50%～0%）：限界突破

```javascript
{
  id: "area1_boss_phase2",
  name: "限界突破",
  generateProblem: () => {
    // ケース1：3桁 + 2桁
    // ケース2：繰り上がり連続の2桁 + 2桁（例: 68 + 75）
    const caseType = Math.random() < 0.5 ? 'case1' : 'case2';
    
    if (caseType === 'case1') {
      // 3桁 + 2桁
      const a = rnd(100, 199);
      const b = rnd(10, 99);
      return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
    } else {
      // 繰り上がり連続：各桁で繰り上がり発生
      let a, b;
      do {
        a = rnd(40, 89);
        b = rnd(40, 89);
      } while (a + b < 100);  // 繰り上がり必須
      return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
    }
  }
}
```

---

## 【エリア2】沼（引き算）

### ステージ1：1桁 － 1桁

```javascript
{
  id: "area2_stage1",
  name: "1桁 - 1桁",
  generateProblem: () => {
    const a = rnd(1, 9);
    const b = rnd(1, a);  // b <= a（負の数は避ける）
    return { a, b, op: '-', answer: a - b, text: `${a} - ${b}` };
  }
}
```

### ステージ2：10 － 〇

```javascript
{
  id: "area2_stage2",
  name: "10 - 〇",
  generateProblem: () => {
    const a = 10;
    const b = rnd(1, 9);
    return { a, b, op: '-', answer: a - b, text: `${a} - ${b}` };
  }
}
```

### ステージ3：2桁 － 1桁（繰り下がりなし）

```javascript
{
  id: "area2_stage3",
  name: "2桁 - 1桁（繰り下がりなし）",
  generateProblem: () => {
    let a, b;
    do {
      a = rnd(11, 99);
      b = rnd(1, 9);
    } while ((a % 10) < b);  // 繰り下がり不要：一の位 >= b
    return { a, b, op: '-', answer: a - b, text: `${a} - ${b}` };
  }
}
```

### ステージ4：3つの数の引き算

```javascript
{
  id: "area2_stage4",
  name: "3つの数の引き算",
  generateProblem: () => {
    const a = rnd(10, 20);
    const b = rnd(1, 5);
    const c = rnd(1, 5);
    if (a - b - c < 0) return generateProblem(); // 負数回避
    const answer = a - b - c;
    return { 
      numbers: [a, b, c], 
      op: '-', 
      answer, 
      text: `${a} - ${b} - ${c}` 
    };
  }
}
```

### ステージ5：2桁 － 1桁（繰り下がりあり）

```javascript
{
  id: "area2_stage5",
  name: "2桁 - 1桁（繰り下がりあり）",
  generateProblem: () => {
    let a, b;
    do {
      a = rnd(11, 99);
      b = rnd(1, 9);
    } while ((a % 10) >= b);  // 繰り下がり必須
    return { a, b, op: '-', answer: a - b, text: `${a} - ${b}` };
  }
}
```

### ステージ6：2桁 － 2桁（繰り下がりなし）

```javascript
{
  id: "area2_stage6",
  name: "2桁 - 2桁（繰り下がりなし）",
  generateProblem: () => {
    let a, b;
    do {
      a = rnd(20, 99);
      b = rnd(10, a);
    } while ((a % 10) < (b % 10));  // 繰り下がり不要
    return { a, b, op: '-', answer: a - b, text: `${a} - ${b}` };
  }
}
```

### ステージ7：2桁 － 2桁（繰り下がりあり）

```javascript
{
  id: "area2_stage7",
  name: "2桁 - 2桁（繰り下がりあり）",
  generateProblem: () => {
    let a, b;
    do {
      a = rnd(20, 99);
      b = rnd(10, a);
    } while ((a % 10) >= (b % 10));  // 繰り下がり必須
    return { a, b, op: '-', answer: a - b, text: `${a} - ${b}` };
  }
}
```

### エリア2 ボス

#### フェーズ2（限界突破）

```javascript
{
  id: "area2_boss_phase2",
  name: "限界突破",
  generateProblem: () => {
    // ケース1：0が含まれる3桁からの引き算 (例: 304 - 26)
    // ケース2：3桁からの一般的な引き算 (例: 105 - 18)
    const caseType = Math.random() < 0.5 ? 'case1' : 'case2';
    
    if (caseType === 'case1') {
      // 0が含まれる3桁：100の位が1, 10の位が0
      const a = rnd(100, 109);  // 100～109 (0含む)
      const b = rnd(10, Math.min(a - 1, 99));
      return { a, b, op: '-', answer: a - b, text: `${a} - ${b}` };
    } else {
      // 3桁からの引き算
      const a = rnd(100, 199);
      const b = rnd(10, Math.min(a - 1, 99));
      return { a, b, op: '-', answer: a - b, text: `${a} - ${b}` };
    }
  }
}
```

---

## 【エリア3】未定（掛け算）

### ステージ1～9：九九（1の段～9の段）

```javascript
// 例：ステージ2（2の段）
{
  id: "area3_stage2",
  name: "2の段",
  generateProblem: () => {
    const a = 2;  // 段数は固定
    const b = rnd(1, 9);
    return { a, b, op: '×', answer: a * b, text: `${a} × ${b}` };
  }
}
```

### ステージ10：0と10のかけ算

```javascript
{
  id: "area3_stage10",
  name: "0と10のかけ算",
  generateProblem: () => {
    const isZero = Math.random() < 0.5;
    if (isZero) {
      const a = 0;
      const b = rnd(1, 9);
      return { a, b, op: '×', answer: 0, text: `${a} × ${b}` };
    } else {
      const a = 10;
      const b = rnd(1, 9);
      return { a, b, op: '×', answer: a * b, text: `${a} × ${b}` };
    }
  }
}
```

### ステージ11：2桁 × 1桁（繰り上がりなし）

```javascript
{
  id: "area3_stage11",
  name: "2桁 × 1桁（繰り上がりなし）",
  generateProblem: () => {
    const a = rnd(10, 19);  // 10～19
    const b = rnd(2, 9);
    // 繰り上がりなし条件：各桁の積が9以下
    if ((a % 10) * b > 9) return generateProblem();
    return { a, b, op: '×', answer: a * b, text: `${a} × ${b}` };
  }
}
```

### ステージ12：2桁 × 1桁（繰り上がりあり）

```javascript
{
  id: "area3_stage12",
  name: "2桁 × 1桁（繰り上がりあり）",
  generateProblem: () => {
    const a = rnd(10, 99);
    const b = rnd(2, 9);
    return { a, b, op: '×', answer: a * b, text: `${a} × ${b}` };
  }
}
```

### エリア3 ボス

#### フェーズ2（限界突破）

```javascript
{
  id: "area3_boss_phase2",
  name: "限界突破",
  generateProblem: () => {
    // 2桁 × 2桁（ひっ算必須レベル）
    const a = rnd(10, 99);
    const b = rnd(10, 99);
    return { a, b, op: '×', answer: a * b, text: `${a} × ${b}` };
  }
}
```

---

## 【エリア4】未定（割り算・ラスボス）

### ステージ1～5：基本的な割り算

```javascript
// 例：ステージ1（2・5の段の逆算）
{
  id: "area4_stage1",
  name: "2・5の段の逆算",
  generateProblem: () => {
    const divisor = Math.random() < 0.5 ? 2 : 5;
    const quotient = rnd(1, 9);
    const dividend = divisor * quotient;
    return { 
      a: dividend, 
      b: divisor, 
      op: '÷', 
      answer: quotient, 
      text: `${dividend} ÷ ${divisor}` 
    };
  }
}
```

### ステージ6：あまりあり（割る数2～5）

```javascript
{
  id: "area4_stage6",
  name: "あまりあり（割る数2～5）",
  generateProblem: () => {
    const divisor = rnd(2, 5);
    const quotient = rnd(2, 9);
    const remainder = rnd(1, divisor - 1);
    const dividend = divisor * quotient + remainder;
    return { 
      a: dividend, 
      b: divisor, 
      op: '÷', 
      answer: quotient, 
      remainder: remainder,
      text: `${dividend} ÷ ${divisor}` 
    };
  }
}
```

### ステージ9：2桁 ÷ 1桁（九九超過・あまりなし）

```javascript
{
  id: "area4_stage9",
  name: "2桁 ÷ 1桁（九九超過・あまりなし）",
  generateProblem: () => {
    const divisor = rnd(2, 9);
    const quotient = rnd(10, 19);  // 答えが10以上
    const dividend = divisor * quotient;
    return { 
      a: dividend, 
      b: divisor, 
      op: '÷', 
      answer: quotient, 
      text: `${dividend} ÷ ${divisor}` 
    };
  }
}
```

### ステージ11：3桁 ÷ 1桁

```javascript
{
  id: "area4_stage11",
  name: "3桁 ÷ 1桁",
  generateProblem: () => {
    const divisor = rnd(2, 9);
    const quotient = rnd(20, 99);
    const dividend = divisor * quotient;
    return { 
      a: dividend, 
      b: divisor, 
      op: '÷', 
      answer: quotient, 
      text: `${dividend} ÷ ${divisor}` 
    };
  }
}
```

### エリア4 ボス

#### フェーズ2（限界突破・ラスボス）

```javascript
{
  id: "area4_boss_phase2",
  name: "限界突破（最終決戦）",
  generateProblem: () => {
    // 2桁 ÷ 2桁（高度なひっ算）
    const divisor = rnd(10, 30);
    const quotient = rnd(2, 9);
    const dividend = divisor * quotient;
    return { 
      a: dividend, 
      b: divisor, 
      op: '÷', 
      answer: quotient, 
      text: `${dividend} ÷ ${divisor}` 
    };
  }
}
```

---

## 実装時の注意事項

1. **再生成ループ**：条件を満たさない場合は `return generateProblem()` で再帰的に再生成
2. **負数回避**：引き算で負の結果になる場合は必ずフィルタリング
3. **答えの型**：割り算であまりがある場合は `{ answer: 商, remainder: あまり }` 形式で返す
4. **ボスのフェーズ遷移**：HP が最大の50%以下になったら自動的にフェーズ2へ切り替え
5. **ランダム選択関数**：複数の出題ロジックから選ぶ場合は `pick()` ユーティリティを使用

---

## 将来の拡張ポイント

- 小数や分数の導入
- 複合演算（例：(5 + 3) × 2）
- 文章問題との統合
- 難易度の動的調整（プレイヤーの正解率に基づく）
