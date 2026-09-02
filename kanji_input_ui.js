// ==========================================
// 漢字入力・判定UI & エフェクト (kanji_input_ui.js)
// ==========================================
// ※ このスクリプトを利用するには、HTML側に特定のIDを持つ要素が存在している必要があります。
// 詳しくは README.md を参照してください。

/* 五十音表と おなじ ならびの キーボード。
   1つの配列＝表の「たて1れつ」（あ→お）。CSS側で grid-auto-flow:column に して
   がっこうで ならう 五十音表と おなじ みため に する。'' は あきマス。 */
const KANA_COLUMNS_MAIN = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '',   'ゆ', '',   'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', 'を', 'ん', 'ー', ''  ],
];

/* だくおん・はんだくおん・ちいさい字＋けすキー */
const KANA_COLUMNS_SUB = [
  ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  ['だ', 'ぢ', 'づ', 'で', 'ど'],
  ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
  ['ゃ', 'ゅ', 'ょ', 'っ', 'BS'],
];

let isFlickMode = false;
let currentChallengeAnswer = null;
let currentAcceptedAnswers = null;   // おくりがな ありでも なしでも せいかいに する
let onAnswerCallback = null;

/* ひらがな・カタカナ（おくりがな）かどうか */
function isKanaChar(ch){ return /[\u3041-\u309F\u30A0-\u30FF\u30FCー]/.test(ch); }

/* お題の 漢字に くっついている おくりがなを のぞいた 「漢字の ぶんの よみ」も せいかいに する。
   例）小さい → こたえ「ちいさい」／「ちい」 どちらでも OK
       お金   → こたえ「おかね」  ／「かね」 どちらでも OK
   ぜんぶ 漢字の ことば（会社など）は これまでどおり 1つだけ。 */
function kanjiAcceptedAnswers(text, answer){
  const set = new Set([answer]);
  if (!text || !answer) return set;
  let lead = 0;
  while (lead < text.length && isKanaChar(text[lead])) lead++;
  let tail = 0;
  while (tail < text.length - lead && isKanaChar(text[text.length - 1 - tail])) tail++;
  const leadKana = text.slice(0, lead);
  const tailKana = tail ? text.slice(text.length - tail) : '';
  let core = answer;
  if (leadKana && core.startsWith(leadKana)) core = core.slice(leadKana.length);
  if (tailKana && core.endsWith(tailKana)) core = core.slice(0, core.length - tailKana.length);
  if (core && core !== answer) set.add(core);
  return set;
}

/**
 * 入力UIの初期化
 * @param {Function} callback - 回答決定時に呼ばれるコールバック関数 `function(isCorrect){}`
 */
function initKanjiInputUI(callback) {
  onAnswerCallback = callback;
  
  const container = document.getElementById('software-keyboard');
  if (container) {
    container.innerHTML = '';
    container.appendChild(buildKanaGrid(KANA_COLUMNS_MAIN));
    container.appendChild(buildKanaGrid(KANA_COLUMNS_SUB));
  }

  const toggleBtn = document.getElementById('btn-toggle-input');
  if (toggleBtn) {
    toggleBtn.onclick = toggleInputMode;
  }
  
  const inputEl = document.getElementById('challenge-input');
  if (inputEl) {
    inputEl.oninput = () => {
      spawnInputEffect();
    };
    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter') submitKanjiAnswer();
    };
  }
  
  const submitBtn = document.getElementById('btn-submit-answer');
  if (submitBtn) {
    submitBtn.onclick = submitKanjiAnswer;
  }
}

/* たて1れつずつの配列から、五十音表のかたちの グリッドを つくる */
function buildKanaGrid(columns) {
  const grid = document.createElement('div');
  grid.className = 'kana-grid';
  columns.forEach(col => {
    col.forEach(char => {
      const btn = document.createElement('button');
      if (!char) {
        btn.className = 'key-btn key-blank';
        btn.tabIndex = -1;
        grid.appendChild(btn);
        return;
      }
      btn.className = char === 'BS' ? 'key-btn key-fn' : 'key-btn';
      btn.textContent = char === 'BS' ? 'けす' : char;
      btn.onclick = () => handleKeyClick(char);
      grid.appendChild(btn);
    });
  });
  return grid;
}

function handleKeyClick(char) {
  const input = document.getElementById('challenge-input');
  if (!input) return;
  
  if (char === 'BS') {
    input.value = input.value.slice(0, -1);
  } else {
    input.value += char;
    spawnInputEffect();
  }
}

function toggleInputMode() {
  isFlickMode = !isFlickMode;
  const btn = document.getElementById('btn-toggle-input');
  const input = document.getElementById('challenge-input');
  const softwareKbd = document.getElementById('software-keyboard');
  
  if (isFlickMode) {
    if(btn) btn.textContent = '入力切替：フリック/物理キーボード';
    if(input) {
      input.readOnly = false;
      input.focus();
    }
    if(softwareKbd) softwareKbd.classList.add('hidden');
  } else {
    if(btn) btn.textContent = '入力切替：五十音';
    if(input) input.readOnly = true;
    if(softwareKbd) softwareKbd.classList.remove('hidden');
  }
}

/**
 * 新しい問題を画面にセットして入力を待機する
 * @param {Object} problemData - generateKanjiProblem() の戻り値
 */
function setupKanjiChallenge(problemData) {
  currentChallengeAnswer = problemData.answer;
  currentAcceptedAnswers = kanjiAcceptedAnswers(problemData.text, problemData.answer);
  const textEl = document.getElementById('challenge-problem-text');
  if(textEl) textEl.textContent = problemData.text;
  
  const inputEl = document.getElementById('challenge-input');
  if(inputEl) {
    inputEl.value = '';
    if(isFlickMode) inputEl.focus();
  }
}

function submitKanjiAnswer() {
  if (!currentChallengeAnswer) return;
  
  const inputEl = document.getElementById('challenge-input');
  if (!inputEl) return;
  
  const userAnswer = inputEl.value.trim();
  const isCorrect = currentAcceptedAnswers
    ? currentAcceptedAnswers.has(userAnswer)
    : (userAnswer === currentChallengeAnswer);
  
  showResultOverlay(isCorrect);
  
  // 演出を見せるために少し待ってからコールバックを呼ぶ
  setTimeout(() => {
    if (onAnswerCallback) {
      onAnswerCallback(isCorrect);
    }
  }, 500);
}

// ==========================================
// エフェクト・演出関連
// ==========================================
function spawnInputEffect() {
  const container = document.getElementById('effect-container');
  if (!container) return;
  
  const particle = document.createElement('div');
  particle.className = 'particle';
  
  const inputEl = document.getElementById('challenge-input');
  if (!inputEl) return;
  
  // 入力欄の周囲にランダムに発生させる
  const inputRect = inputEl.getBoundingClientRect();
  const effectRect = container.getBoundingClientRect();
  
  const baseX = inputRect.left - effectRect.left + inputRect.width / 2;
  const baseY = inputRect.top - effectRect.top + inputRect.height / 2;
  
  const x = baseX + (Math.random() * 200 - 100);
  const y = baseY + (Math.random() * 80 - 40);
  
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  
  const colors = ['#ff9f43', '#feca57', '#ff6b6b', '#48dbfb', '#1dd1a1'];
  particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  
  const size = 10 + Math.random() * 20;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  
  container.appendChild(particle);
  
  setTimeout(() => {
    particle.remove();
  }, 400);
}

function showResultOverlay(isCorrect) {
  const overlay = document.getElementById('result-overlay');
  const text = document.getElementById('result-text');
  if (!overlay || !text) return;
  
  overlay.classList.remove('hidden');
  
  if (isCorrect) {
    text.textContent = '正解！！';
    text.className = 'result-correct';
  } else {
    text.textContent = '不正解...';
    text.className = 'result-incorrect';
  }
  
  setTimeout(() => {
    overlay.classList.add('hidden');
  }, 1000);
}

if (typeof window !== 'undefined') {
  window.initKanjiInputUI = initKanjiInputUI;
  window.setupKanjiChallenge = setupKanjiChallenge;
  window.submitKanjiAnswer = submitKanjiAnswer;
  window.kanjiAcceptedAnswers = kanjiAcceptedAnswers;
  window.toggleInputMode = toggleInputMode;
  window.showResultOverlay = showResultOverlay;
}
