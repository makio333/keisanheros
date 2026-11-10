import { getMathWordQuestsV2, scoreMathWordAnswerV2 } from './math_word_quests_v2.js';
import './reading_quest_letter.css';
import './math_word_subquests.css';
import { assignQuestNotice } from './quest_notice_variants.js';

const FIRST_CLEAR_REWARD = Object.freeze({ gold: 300, exp: 20, medal: 1 });
const QUESTIONS_PER_SET = 5;
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
};

function stateFor(game) {
  const state = game.mathWordQuestsV2 ||= {};
  state.completed ||= {};
  state.sessions ||= {};
  state.rewardLedger ||= {};
  // The earlier candidate paid this exact reward when completed[id] was set.
  // Carry those claims forward as paid so connecting this UI cannot pay twice.
  for (const [id, completed] of Object.entries(state.completed)) {
    if (completed && !state.rewardLedger[id]) state.rewardLedger[id] = { ...FIRST_CLEAR_REWARD, migrated: true };
  }
  return state;
}

export function mathWordQuestProgress(game, grade = null) {
  const state = stateFor(game);
  const problems = grade == null
    ? Array.from({ length: 6 }, (_, i) => getMathWordQuestsV2(i + 1)).flat()
    : getMathWordQuestsV2(grade);
  return { completed: problems.filter(problem => state.completed[problem.id]).length, total: problems.length };
}

function groupsForGrade(grade) {
  const problems = getMathWordQuestsV2(grade);
  const groups = [];
  for (let index = 0; index < problems.length; index += QUESTIONS_PER_SET) {
    const questions = problems.slice(index, index + QUESTIONS_PER_SET);
    if (!questions.length) continue;
    groups.push({
      id: `mwq-v2-g${grade}-${questions[0].id}`,
      grade,
      index: groups.length,
      questions,
      title: questions[0].topic,
    });
  }
  return groups;
}

function blankSession(group) {
  return {
    questionIds: group.questions.map(problem => problem.id),
    answers: Array(QUESTIONS_PER_SET).fill(null),
    phase: 'answering',
    currentIndex: 0,
    results: null,
    retryAnswers: {},
    retryAttempts: {},
    reward: { gold: 0, exp: 0, medal: 0 },
  };
}

function matchingSession(state, group) {
  const current = state.sessions[group.id];
  if (!current || current.questionIds?.join('|') !== group.questions.map(problem => problem.id).join('|')) {
    state.sessions[group.id] = blankSession(group);
  }
  const session = state.sessions[group.id];
  session.answers ||= Array(QUESTIONS_PER_SET).fill(null);
  session.retryAnswers ||= {};
  session.retryAttempts ||= {};
  session.reward ||= { gold: 0, exp: 0, medal: 0 };
  return session;
}

function isGroupComplete(state, group) {
  return group.questions.every(problem => state.completed[problem.id]);
}

function rewardForCorrect(api, state, session, problem) {
  if (state.completed[problem.id]) return null;
  state.completed[problem.id] = true;
  state.rewardLedger[problem.id] = { ...FIRST_CLEAR_REWARD, paidAt: Date.now() };
  const game = api.game();
  game.player.gold = (Number(game.player.gold) || 0) + FIRST_CLEAR_REWARD.gold;
  game.questMedals = (Number(game.questMedals) || 0) + FIRST_CLEAR_REWARD.medal;
  const level = api.grantExp(FIRST_CLEAR_REWARD.exp);
  for (const key of Object.keys(FIRST_CLEAR_REWARD)) session.reward[key] = (Number(session.reward[key]) || 0) + FIRST_CLEAR_REWARD[key];
  api.noteLevel?.(level);
  return FIRST_CLEAR_REWARD;
}

function grantLevelSummary(api, summary) {
  if (!summary || summary.toLvl <= summary.fromLvl) return;
  api.showLevelUp?.(summary);
}

export function openMathWordSubquests(api) {
  const game = api.game();
  if (!game?.player) return;
  const state = stateFor(game);
  let selectedGrade = 1;

  const overlay = el('div', null, 'math-word-subquest-overlay');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '算数の文章問題');
  const panel = el('section', null, 'math-word-subquest-panel');
  const header = el('header', null, 'math-word-subquest-header');
  const close = el('button', '← 掲示板へ', 'btn math-word-subquest-back');
  close.type = 'button';
  close.onclick = () => { overlay.remove(); api.refresh(); };
  const heading = el('h2', '算数の文章問題', 'math-word-subquest-title');
  const description = el('p', '5問に答えてから、まとめて答え合わせ。まちがえた問題はヒントを見てやり直せます。', 'math-word-subquest-description');
  header.append(close, heading);
  const content = el('div', null, 'math-word-subquest-content');
  panel.append(header, description, content);
  overlay.append(panel);
  document.body.append(overlay);

  function renderMenu() {
    const total = mathWordQuestProgress(game);
    content.replaceChildren();
    const progress = el('div', `★ クリア ${total.completed} / ${total.total} 問`, 'math-word-subquest-progress');
    progress.setAttribute('role', 'status');
    const gradeTabs = el('div', null, 'math-word-grade-tabs');
    const grid = el('div', null, 'math-word-set-grid');
    content.append(progress, gradeTabs, grid);
    for (let grade = 1; grade <= 6; grade++) {
      const tab = el('button', `${grade}年`, 'btn math-word-grade-tab');
      tab.type = 'button';
      tab.setAttribute('aria-pressed', String(grade === selectedGrade));
      tab.onclick = () => { selectedGrade = grade; renderMenu(); };
      gradeTabs.append(tab);
    }
    const gradeProgress = mathWordQuestProgress(game, selectedGrade);
    const progressNote = el('p', `${selectedGrade}年：${gradeProgress.completed} / ${gradeProgress.total} 問クリア`, 'math-word-grade-progress');
    grid.before(progressNote);
    for (const group of groupsForGrade(selectedGrade)) {
      const villager = api.npcAt?.(group.index) || { name: '村人', emoji: '🧑' };
      const session = state.sessions[group.id];
      const solved = group.questions.filter(problem => state.completed[problem.id]).length;
      const card = el('article', null, 'math-word-set-card quest-card reading-quest-card math-word-notice-card');
      card.dataset.questNoticeKey = group.id;
      assignQuestNotice(card);
      const ribbon = el('div', null, 'quest-card-ribbon');
      const stars = el('span', null, `quest-card-stars${solved === group.questions.length ? ' is-complete' : ''}`);
      stars.setAttribute('aria-label', `${solved}問 / ${group.questions.length}問クリア`);
      for (let index = 0; index < group.questions.length; index++) stars.append(el('span', '★', index < solved ? 'on' : ''));
      ribbon.append(stars);
      const art = el('div', null, 'quest-card-art');
      const portrait = el('img');
      portrait.src = api.npcImage?.(villager) || '';
      portrait.alt = '';
      portrait.draggable = false;
      art.append(portrait);
      const title = el('h3', group.questions[0].title || group.title, 'quest-card-title math-word-set-title');
      const count = el('p', `${group.title}・${solved} / ${group.questions.length} 問クリア`, 'quest-card-tag math-word-set-progress');
      const actionText = session && ['answering', 'results', 'review'].includes(session.phase)
        ? 'つづきから'
        : isGroupComplete(state, group) ? 'もう一度' : '依頼を受ける';
      const rewards = el('div', null, 'quest-card-rewards reading-card-rewards math-word-notice-rewards');
      rewards.append(el('span', `💰 最大 ${FIRST_CLEAR_REWARD.gold * group.questions.length}G`), el('span', `✨ ${FIRST_CLEAR_REWARD.exp * group.questions.length}EXP`), el('span', `🏅 ${FIRST_CLEAR_REWARD.medal * group.questions.length}枚`));
      const actions = el('div', null, 'reading-quest-card-actions');
      const start = el('button', actionText, 'btn btn-primary math-word-set-start');
      start.type = 'button';
      start.onclick = () => openSession(group);
      actions.append(start);
      card.append(ribbon, art, el('div', villager.name, 'quest-card-name'), title, count, rewards, actions);
      card.onclick = event => { if (!event.target.closest('button')) start.click(); };
      grid.append(card);
    }
  }

  function saveAndRefresh() {
    api.save();
    api.refresh();
  }

  function openSession(group) {
    let session = matchingSession(state, group);
    if (session.phase === 'done') {
      session = state.sessions[group.id] = blankSession(group);
      api.save();
    }
    if (session.phase === 'answering') {
      const firstMissing = session.answers.findIndex(answer => !answer || Object.values(answer).some(value => !String(value ?? '').trim()));
      session.currentIndex = firstMissing < 0 ? QUESTIONS_PER_SET - 1 : firstMissing;
      api.save();
      renderQuestion(group, session);
    } else {
      renderResults(group, session);
    }
  }

  function answerValues(problem, answer) {
    const form = el('form', null, 'math-word-answer-form');
    form.autocomplete = 'off';
    if (problem.input.fields.length === 1) form.classList.add('math-word-single-field');
    const inputs = {};
    for (const field of problem.input.fields) {
      const label = el('label', null, 'math-word-field');
      label.append(el('span', field.label, 'math-word-field-label'));
      const input = el('input');
      input.type = 'text';
      input.name = field.name;
      input.inputMode = field.keyboard === 'decimal' ? 'decimal' : 'numeric';
      input.autocomplete = 'off';
      input.autocapitalize = 'off';
      input.spellcheck = false;
      input.required = true;
      input.setAttribute('aria-label', field.label);
      input.value = answer?.[field.name] ?? '';
      inputs[field.name] = input;
      label.append(input);
      if (field.unit) label.append(el('span', field.unit, 'math-word-field-unit'));
      form.append(label);
    }
    return { form, inputs };
  }

  function createScene(group, problem, problemIndex, sceneTitle, backOptions = {}) {
    overlay.remove();
    document.querySelector('.math-word-reading-overlay')?.remove();
    const villager = api.npcAt?.(group.index) || { name: '村人', emoji: '🧑' };
    const sceneOverlay = el('div', null, 'reading-subquest-overlay math-word-reading-overlay');
    const scenePanel = el('section', null, 'reading-subquest-panel quest-answer-panel reading-v2-answer-panel math-word-reading-answer-panel');
    scenePanel.dataset.grade = String(group.grade);
    scenePanel.setAttribute('role', 'dialog');
    scenePanel.setAttribute('aria-modal', 'true');
    scenePanel.setAttribute('aria-label', `${group.title}：${sceneTitle}`);

    const header = el('header', null, 'reading-v2-scene-header');
    const back = el('button', backOptions.label || '← 依頼一覧へ', 'btn math-word-scene-back');
    back.type = 'button';
    back.onclick = () => {
      sceneOverlay.remove();
      if (backOptions.onClick) {
        backOptions.onClick();
        return;
      }
      document.body.append(overlay);
      saveAndRefresh();
      renderMenu();
    };
    const stepText = sceneTitle === '5問の答え合わせ'
      ? '5問の答え合わせ'
      : `${sceneTitle}　${problemIndex + 1} / ${QUESTIONS_PER_SET}問`;
    const step = el('div', stepText, 'math-word-scene-step');
    header.append(back, step);

    const answerContent = el('div', null, 'quest-answer-content reading-v2-answer-content');
    const questionContext = el('div', null, 'quest-question-context reading-v2-question-context');
    const letter = el('article', null, 'reading-v2-letter math-word-letter');
    letter.setAttribute('aria-label', '村人から届いた算数の依頼');
    const letterHeader = el('header', null, 'reading-v2-letter-header');
    letterHeader.append(el('span', '村人からの算数の依頼', 'reading-v2-letter-eyebrow'), el('h2', problem.title || group.title));
    const story = el('div', problem.story, 'reading-v2-passage math-word-letter-story');
    story.lang = 'ja';
    story.tabIndex = 0;
    const signature = el('footer', null, 'reading-v2-letter-signature');
    signature.append(el('span', '勇者へ'), el('b', `${villager.name} より`));
    letter.append(letterHeader, story, signature);
    questionContext.append(letter);

    const answerStage = el('div', null, 'quest-answer-center reading-v2-answer-center');
    const villagerImage = el('img');
    villagerImage.src = api.npcImage?.(villager) || '';
    villagerImage.alt = '';
    villagerImage.className = 'reading-v2-scene-villager';
    villagerImage.draggable = false;
    const answerForeground = el('div', null, 'reading-v2-answer-foreground math-word-answer-foreground');
    answerStage.append(villagerImage, answerForeground);
    answerContent.append(questionContext, answerStage);

    scenePanel.append(header, answerContent);
    sceneOverlay.append(scenePanel);
    document.body.append(sceneOverlay);
    return { sceneOverlay, scenePanel, answerForeground, villager };
  }

  function renderQuestion(group, session) {
    const index = Math.max(0, Math.min(QUESTIONS_PER_SET - 1, Number(session.currentIndex) || 0));
    const problem = group.questions[index];
    const scene = createScene(group, problem, index, '算数の依頼');
    const { answerForeground: body } = scene;
    const progress = el('p', `${index + 1}／${QUESTIONS_PER_SET}問め　${group.title}`, 'reading-story-progress math-word-story-progress');
    const helper = el('p', '答え合わせは、5問ぜんぶに答えたあとに出ます。', 'reading-v2-batch-note');
    const question = el('h3', problem.question, 'challenge-problem challenge-problem-word quest-reading-question reading-v2-prompt math-word-question-text');
    const { form, inputs } = answerValues(problem, session.answers[index]);
    const status = el('p', '', 'math-word-form-status');
    status.setAttribute('role', 'status');
    const submit = el('button', index === QUESTIONS_PER_SET - 1 ? '5問まとめて答え合わせ' : '回答を保存して次へ', 'btn btn-primary quest-answer-next');
    submit.type = 'submit';
    form.append(submit);
    form.onsubmit = event => {
      event.preventDefault();
      const values = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value.trim()]));
      if (Object.values(values).some(value => !value)) {
        status.textContent = '答えを入れてから進もう。';
        return;
      }
      session.answers[index] = values;
      if (index < QUESTIONS_PER_SET - 1) {
        session.currentIndex = index + 1;
        api.save();
        renderQuestion(group, session);
        return;
      }
      session.phase = 'results';
      session.results = group.questions.map((questionProblem, questionIndex) => ({
        correct: scoreMathWordAnswerV2(questionProblem, session.answers[questionIndex]).correct,
        reviewed: false,
      }));
      session.currentIndex = 0;
      const level = api.levelStart();
      for (let questionIndex = 0; questionIndex < group.questions.length; questionIndex++) {
        if (session.results[questionIndex].correct) rewardForCorrect(api, state, session, group.questions[questionIndex]);
      }
      const levelSummary = api.levelFinish(level);
      saveAndRefresh();
      renderResults(group, session);
      grantLevelSummary(api, levelSummary);
    };
    body.append(progress, helper, question, form, status);
    inputs[problem.input.fields[0].name]?.focus({ preventScroll: true });
  }

  function renderResults(group, session) {
    const wrongIndexes = (session.results || []).flatMap((result, index) => result && !result.correct && !result.reviewed ? [index] : []);
    const allMastered = wrongIndexes.length === 0 && (session.results || []).length === QUESTIONS_PER_SET;
    session.phase = allMastered ? 'done' : 'results';
    api.save();
    const scene = createScene(group, group.questions[wrongIndexes[0] ?? 0], wrongIndexes[0] ?? 0, '5問の答え合わせ');
    const { answerForeground: body } = scene;
    const title = el('h3', allMastered ? 'ぜんぶクリア！' : `正解 ${session.results.filter(result => result.correct || result.reviewed).length} / ${QUESTIONS_PER_SET} 問`, 'math-word-results-title');
    const summary = el('p', allMastered
      ? '5問ぜんぶ正解！村人の依頼をやりとげたよ。'
      : 'まちがえた問題は、ヒントを見ながらもう一度考えてみよう。', 'reading-v2-batch-note');
    const list = el('div', null, 'math-word-results-list');
    group.questions.forEach((problem, index) => {
      const result = session.results[index];
      const row = el('article', null, `math-word-result-row ${result.correct || result.reviewed ? 'is-correct' : 'is-wrong'}`);
      row.append(el('b', `${index + 1}. ${result.correct || result.reviewed ? '○' : 'もう一度'}`, 'math-word-result-mark'));
      row.append(el('p', problem.question, 'math-word-result-question'));
      const original = session.answers[index] ? Object.values(session.answers[index]).join(' / ') : '未回答';
      row.append(el('p', `あなたの答え：${original}`, 'math-word-result-answer'));
      if (result.correct || result.reviewed) {
        row.append(el('p', `答え：${problem.answerDisplay}`, 'math-word-result-answer'));
        if (result.retryAnswer) row.append(el('p', `やり直しの答え：${Object.values(result.retryAnswer).join(' / ')}`, 'math-word-result-answer'));
        row.append(el('p', `考え方：${problem.equation}。${problem.explanation}`, 'math-word-result-explanation'));
      } else {
        row.append(el('p', 'ヒントを見て、もう一度考えてみよう。', 'math-word-result-explanation'));
      }
      list.append(row);
    });
    const reward = el('p', `今回の初回報酬：💰 ${session.reward.gold}G　✨ ${session.reward.exp}EXP　🏅 ${session.reward.medal}枚`, 'math-word-run-reward');
    body.append(el('p', `5／${QUESTIONS_PER_SET}問　${group.title}`, 'reading-story-progress math-word-story-progress'), title, summary, list, reward);
    if (wrongIndexes.length) {
      const retry = el('button', `まちがえた ${wrongIndexes.length} 問をヒント付きでやり直す`, 'btn btn-primary math-word-retry-start');
      retry.type = 'button';
      retry.onclick = () => renderRetry(group, session, wrongIndexes[0]);
      body.append(retry);
    } else {
      const done = el('p', '今回の5問はすべて正解です。報酬は初回クリア時に受け取れます。', 'math-word-run-complete');
      const again = el('button', 'もう一度挑戦', 'btn math-word-retry-start');
      again.type = 'button';
      again.onclick = () => { state.sessions[group.id] = blankSession(group); api.save(); renderQuestion(group, state.sessions[group.id]); };
      body.append(done, again);
    }
  }

  function renderRetry(group, session, index) {
    const problem = group.questions[index];
    const scene = createScene(group, problem, index, 'ヒント付き再挑戦', {
      label: '← 答え合わせへ',
      onClick: () => renderResults(group, session),
    });
    const { answerForeground: body } = scene;
    const progress = el('p', `${index + 1}／${QUESTIONS_PER_SET}問め　やり直し`, 'reading-story-progress math-word-story-progress');
    const question = el('h3', problem.question, 'challenge-problem challenge-problem-word quest-reading-question reading-v2-prompt math-word-question-text');
    const hint = el('div', null, 'math-word-hint');
    const hintButton = el('button', 'ヒントを見る', 'btn math-word-hint-button');
    hintButton.type = 'button';
    hintButton.onclick = () => {
      const depth = Number(session.retryAttempts[index]) || 0;
      hint.replaceChildren(el('b', depth ? '式のヒント' : '読み方のヒント'));
      hint.append(el('p', depth ? `この問題は「${problem.equation}」で考えられます。本文の数字と問いを対応させてみよう。` : '何を聞かれているかを先に確かめ、本文にある数を探してみよう。'));
      session.retryAttempts[index] = depth + 1;
      api.save();
      hintButton.textContent = 'ヒントをもう一度見る';
    };
    const { form, inputs } = answerValues(problem, session.retryAnswers[index]);
    const status = el('p', '', 'math-word-form-status');
    status.setAttribute('role', 'status');
    form.append(hintButton);
    const submit = el('button', '答えをたしかめる', 'btn btn-primary');
    submit.type = 'submit';
    form.append(submit);
    form.onsubmit = event => {
      event.preventDefault();
      const values = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value.trim()]));
      if (Object.values(values).some(value => !value)) { status.textContent = '答えを入れてみよう。'; return; }
      session.retryAnswers[index] = values;
      const result = scoreMathWordAnswerV2(problem, values);
      if (!result.correct) {
        session.retryAttempts[index] = (Number(session.retryAttempts[index]) || 0) + 1;
        api.save();
        status.textContent = 'まだちがうみたい。ヒントを見ながら、もう一度考えてみよう。';
        hint.replaceChildren(el('b', 'ヒント'), el('p', `式は「${problem.equation}」。本文の数字と、何を聞かれているかを確かめよう。`));
        return;
      }
      const level = api.levelStart();
      rewardForCorrect(api, state, session, problem);
      session.results[index].reviewed = true;
      session.results[index].retryAnswer = values;
      const nextWrong = group.questions.findIndex((_, candidate) => candidate > index && !session.results[candidate].correct && !session.results[candidate].reviewed);
      const firstRemaining = nextWrong >= 0 ? nextWrong : group.questions.findIndex((_, candidate) => !session.results[candidate].correct && !session.results[candidate].reviewed);
      const levelSummary = api.levelFinish(level);
      saveAndRefresh();
      if (firstRemaining >= 0) renderRetry(group, session, firstRemaining);
      else renderResults(group, session);
      grantLevelSummary(api, levelSummary);
    };
    hint.classList.add('reading-v2-retry-hint');
    hint.append(el('p', '本文の数字と、何を聞かれているかを順番に確かめよう。'));
    body.append(progress, el('h3', `問題 ${index + 1} をやり直そう`, 'math-word-results-title'), hint, question, form, status);
    inputs[problem.input.fields[0].name]?.focus({ preventScroll: true });
  }

  renderMenu();
  close.focus({ preventScroll: true });
}
