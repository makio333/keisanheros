import { getAcceptedKanjiReadings, normalizeReading } from './kanji_readings.js';
// ==========================================
// 漢字入力・判定UI & エフェクト (kanji_input_ui.js)
// ==========================================
// ※ このスクリプトを利用するには、HTML側に特定のIDを持つ要素が存在している必要があります。
// 詳しくは README.md を参照してください。

/* あ行・か行ごとに「あ→お」を横に並べる。'' は入力できない空きマス。 */
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
  ['わ', 'を', 'ん', 'ー', ''],
];

let isKanaBoardMinimized = false;
let currentChallengeAnswer = null;
let currentAcceptedAnswers = null;   // おくりがな ありでも なしでも せいかいに する
let onAnswerCallback = null;
let resultOverlayHideTimer = 0;

/* ひらがな・カタカナ（おくりがな）かどうか */
function isKanaChar(ch){ return /[\u3041-\u309F\u30A0-\u30FF\u30FCー]/.test(ch); }

/* 文脈のない単漢字は辞書の音訓・名乗り、熟語はその語の読みを受け付ける。 */
function kanjiAcceptedAnswers(text, answer, alternatives = []) {
  return getAcceptedKanjiReadings(text, answer, alternatives);
}
let currentKanjiAnswerMode = false;

function usesNativeMobileKeyboard() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(pointer: coarse)').matches === true ||
    /Android|iPhone|iPad|iPod/i.test(window.navigator?.userAgent || '');
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
    container.dataset.kanaPage='0';
    container.classList.remove('hidden');
    container.classList.toggle('is-minimized',isKanaBoardMinimized);
    const header=document.createElement('div');header.className='kana-board-header';header.title='ドラッグで移動・ダブルクリックで自動配置';
    const title=document.createElement('span');title.textContent='⠿ 五十音ボード';
    const minimize=document.createElement('button');minimize.id='btn-toggle-kana-board';minimize.type='button';minimize.setAttribute('aria-controls','kana-board-content');minimize.onclick=toggleKanaBoard;
    header.append(title,minimize);container.append(header);
    const content=document.createElement('div');content.id='kana-board-content';content.className='kana-board-content';container.append(content);
    const section=document.createElement('div'); section.className='kana-board-section';
    section.appendChild(buildKanaGrid(KANA_COLUMNS_MAIN,['あ行','か行','さ行','た行','な行','は行','ま行','や行','ら行','わ行']));
    content.appendChild(section);
    const modifiers=document.createElement('div'); modifiers.className='kana-board-modifiers';
    for(const [key,label,accessibleLabel] of [['DAKUTEN','゛','濁点'],['HANDAKUTEN','゜','半濁点'],['SMALL','小さく','小さく'],['BS','⌫ けす','けす']]) {
      const button=document.createElement('button'); button.type='button'; button.className='key-btn key-fn';
      button.textContent=label; button.setAttribute('aria-label',accessibleLabel);
      button.onclick=()=>handleKeyClick(key); modifiers.appendChild(button);
    }
    content.appendChild(modifiers);
    for(const corner of ['nw','ne','sw','se']){
      const handle=document.createElement('button');handle.type='button';handle.className='kana-resize-handle';handle.dataset.corner=corner;
      handle.setAttribute('aria-label','五十音ボードのサイズ変更');handle.title='ドラッグでサイズ変更・ダブルクリックで自動サイズ';
      container.append(handle);
    }
    updateKanaBoardVisibility();
  }

  const toggleBtn = document.getElementById('btn-toggle-input');
  if (toggleBtn) {
    toggleBtn.onclick = toggleInputMode;
  }
  
  const inputEl = document.getElementById('challenge-input');
  if (inputEl) {
    inputEl.readOnly=false;
    inputEl.oninput = () => {
      spawnInputEffect();
    };
    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.isComposing && e.keyCode!==229) {e.preventDefault();submitKanjiAnswer();}
    };
  }
  
  const submitBtn = document.getElementById('btn-submit-answer');
  if (submitBtn) {
    submitBtn.onclick = submitKanjiAnswer;
  }
}

/* 行名と5文字をひとまとまりにして、探しやすい五十音表を作る。 */
function buildKanaGrid(columns, labels = []) {
  const grid = document.createElement('div');
  grid.className = 'kana-grid kana-board-grid';
  // ボードの余った高さでキーが縦に伸びないよう、行はキーの正方形サイズに合わせる。
  grid.style.gridTemplateRows='repeat(5,auto)';
  columns.forEach((col,index) => {
    const label=document.createElement('span'); label.className='kana-row-label';
    const gridRow=index%5+1, firstColumn=index<5?1:7;
    label.style.gridRow=String(gridRow); label.style.gridColumn=String(firstColumn);
    label.style.setProperty('--kana-full-row',String(index+1));label.dataset.kanaHalf=String(index<5?0:1);label.style.setProperty('--kana-compact-column','1');
    label.textContent=labels[index] || ''; grid.appendChild(label);
    col.forEach((char,charIndex) => {
      const btn = document.createElement('button');
      btn.type='button';
      btn.style.setProperty('--kana-full-row',String(index+1));btn.dataset.kanaHalf=String(index<5?0:1);btn.style.setProperty('--kana-compact-column',String(charIndex+2));
      btn.style.gridRow=String(gridRow); btn.style.gridColumn=String(firstColumn+charIndex+1);
      if (!char) {
        btn.className = 'key-btn key-blank';
        btn.disabled=true; btn.setAttribute('aria-hidden','true');
        btn.tabIndex = -1;
        grid.appendChild(btn);
        return;
      }
      btn.className = char === 'BS' ? 'key-btn key-fn' : 'key-btn';
      btn.textContent = char === 'BS' ? 'けす' : char;
      btn.setAttribute('aria-label',char==='ー'?'のばす':char);
      btn.onclick = () => handleKeyClick(char);
      grid.appendChild(btn);
    });
  });
  return grid;
}

function handleKeyClick(char) {
  const input=document.getElementById('challenge-input');if(!input)return;
  const start=input.selectionStart ?? input.value.length,end=input.selectionEnd ?? start;
  if(char==='BS'){
    input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');
  }else if(['DAKUTEN','HANDAKUTEN','SMALL'].includes(char)){
    const position=end || start;if(!position)return;
    const last=input.value[position-1];let replacement=last;
    if(char==='SMALL'){
      const large='あいうえおやゆよつわアイウエオヤユヨツワ',small='ぁぃぅぇぉゃゅょっゎァィゥェォャュョッヮ';
      const a=large.indexOf(last),b=small.indexOf(last);replacement=a>=0?small[a]:b>=0?large[b]:last;
    }else{
      const plain=last.normalize('NFD')[0],supported=char==='DAKUTEN'?'かきくけこさしすせそたちつてとはひふへほうカキクケコサシスセソタチツテトハヒフヘホウ':'はひふへほハヒフヘホ';
      if(supported.includes(plain)){const converted=(plain+(char==='DAKUTEN'?'\u3099':'\u309a')).normalize('NFC');replacement=last===converted?plain:converted;}
    }
    input.setRangeText(replacement,position-1,position,'end');
  }else input.setRangeText(char,start,end,'end');
  input.dispatchEvent(new Event('input',{bubbles:true}));
}
function updateKanaBoardVisibility(){
  const board=document.getElementById('software-keyboard'),button=document.getElementById('btn-toggle-kana-board');
  board?.classList.toggle('is-minimized',isKanaBoardMinimized);
  if(button){button.textContent=isKanaBoardMinimized?'＋ 展開':'− 最小化';button.setAttribute('aria-expanded',String(!isKanaBoardMinimized));button.setAttribute('aria-label',isKanaBoardMinimized?'五十音ボードを展開':'五十音ボードを最小化');}
}
function toggleKanaBoard(){isKanaBoardMinimized=!isKanaBoardMinimized;updateKanaBoardVisibility();}
// Retain the old function entry point for external callers; input is always editable.
function toggleInputMode(){toggleKanaBoard();}

/**
 * 新しい問題を画面にセットして入力を待機する
 * @param {Object} problemData - generateKanjiProblem() の戻り値
 */
function setupKanjiChallenge(problemData) {
  currentChallengeAnswer = problemData.answer;
  currentAcceptedAnswers = kanjiAcceptedAnswers(problemData.text, problemData.answer, problemData.acceptedAnswers || []);
  currentKanjiAnswerMode=/[\p{Script=Han}]/u.test(problemData.text || '');
  
  const tierStr = String(problemData.tier || '');
  
  const choiceProb = tierStr.startsWith('kana') ? window.createKanaChoiceProblem?.(problemData) : null;

  const normalDisplay = document.getElementById('kanji-normal-display');
  const locDisplay = document.getElementById('kana-location-display');
  const choiceDisplay = document.getElementById('kana-choice-display');
  const inputDisplay = document.getElementById('kanji-input-display');
  const inputToggle = document.getElementById('kanji-input-toggle');
  const keyboard = document.getElementById('kanji-challenge'); // ソフトウェアキーボードのコンテナ
  
  // 全モード非表示にリセット
  const hideAll = () => {
    if (normalDisplay) normalDisplay.classList.add('hidden');
    if (locDisplay) { locDisplay.classList.add('hidden'); locDisplay.style.display = ''; }
    if (choiceDisplay) { choiceDisplay.classList.add('hidden'); choiceDisplay.style.display = ''; }
    if (inputDisplay) inputDisplay.classList.add('hidden');
    if (inputToggle) inputToggle.classList.add('hidden');
    if (keyboard) keyboard.classList.add('hidden');
  };
  
  if (choiceProb) {
    hideAll();
    if (choiceDisplay) { choiceDisplay.classList.remove('hidden'); choiceDisplay.style.display = 'flex'; }
    document.getElementById('kana-choice-question').textContent = choiceProb.prompt || 'どっちが ただしい？';
    const feedback = document.getElementById('kana-choice-feedback');
    if (feedback) { feedback.textContent = ''; feedback.className = 'kana-choice-feedback'; }
    const btnContainer = document.getElementById('kana-choice-buttons');
    btnContainer.innerHTML = '';
    btnContainer.style.display = 'grid';
    btnContainer.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))';
    const buttons = [];
    for (let index=0;index<choiceProb.options.length;index++) {
      const option = 'ABCD'[index];
      const btn = document.createElement('button');
      btn.className = 'btn kana-choice-button';
      const label = document.createElement('span');
      label.className = 'kana-choice-label';
      label.textContent = option;
      const word = document.createElement('span');
      word.textContent = choiceProb.options[index];
      word.style.fontSize = `clamp(12px,${(29 / choiceProb.options[index].length).toFixed(2)}vw,28px)`;
      btn.appendChild(label);
      btn.appendChild(word);
      btn.onclick = () => {
        if (!currentChallengeAnswer) return;
        const correct = index === choiceProb.correctIndex;
        for (const item of buttons) item.disabled = true;
        buttons[choiceProb.correctIndex].classList.add('is-correct');
        if (!correct) btn.classList.add('is-incorrect');
        if (feedback) {
          feedback.className = 'kana-choice-feedback ' + (correct ? 'is-correct' : 'is-incorrect');
          feedback.textContent = (correct ? 'せいかい！' : 'せいかいは「' + choiceProb.correctWord + '」だよ。') +
            (choiceProb.explanation ? '\n' + choiceProb.explanation : '');
        }
        submitKanjiAnswer(correct);
      };
      buttons.push(btn);
      btnContainer.appendChild(btn);
    }
  } else {
    // ===== 通常入力モード =====
    const nativeMobileKeyboard = usesNativeMobileKeyboard();

    if (normalDisplay) normalDisplay.classList.remove('hidden');
    if (locDisplay) { locDisplay.classList.add('hidden'); locDisplay.style.display = ''; }
    if (choiceDisplay) { choiceDisplay.classList.add('hidden'); choiceDisplay.style.display = ''; }
    if (inputDisplay) inputDisplay.classList.remove('hidden');
    if (inputToggle) inputToggle.classList.add('hidden');
    if (keyboard) keyboard.classList.remove('hidden');
    
    const textEl = document.getElementById('challenge-problem-text');
    if(textEl) {
      // 読みを答える出題にはヒントを付けない。textContentで前問のヒントも除去する。
      textEl.textContent = problemData.text;
    }
    
    const inputEl = document.getElementById('challenge-input');
    if(inputEl) {
      inputEl.value = '';
      inputEl.readOnly=false;
      if (tierStr.startsWith('kana_kata')) {
        inputEl.placeholder = 'カタカナで入力';
      } else if (tierStr.startsWith('kana_hira')) {
        inputEl.placeholder = 'そのまま入力';
      } else {
        inputEl.placeholder = 'ひらがなで入力';
      }
      if(window.matchMedia('(pointer:fine)').matches) inputEl.focus({preventScroll:true});
    }
  }
}



function submitKanjiAnswer(forceResult) {

  if (!currentChallengeAnswer) return;
  
  if (typeof forceResult === 'boolean') {
    currentChallengeAnswer = null;
    showResultOverlay(forceResult);
    if (onAnswerCallback) onAnswerCallback(forceResult);
    return;
  }
  
  const inputEl = document.getElementById('challenge-input');
  if (!inputEl) return;
  
  const userAnswer = currentKanjiAnswerMode ? normalizeReading(inputEl.value) : inputEl.value.trim();
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

  if (resultOverlayHideTimer) clearTimeout(resultOverlayHideTimer);
  
  overlay.classList.remove('hidden');
  
  if (isCorrect) {
    text.textContent = '正解！！';
    text.className = 'result-correct';
  } else {
    text.textContent = '不正解...';
    text.className = 'result-incorrect';
  }
  
  resultOverlayHideTimer = setTimeout(() => {
    overlay.classList.add('hidden');
    resultOverlayHideTimer = 0;
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
