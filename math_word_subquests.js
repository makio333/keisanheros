import { getMathWordQuestsV2, scoreMathWordAnswerV2 } from './math_word_quests_v2.js';

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
      const session = state.sessions[group.id];
      const solved = group.questions.filter(problem => state.completed[problem.id]).length;
      const card = el('article', null, 'math-word-set-card');
      const title = el('h3', `${group.index + 1}. ${group.title}`, 'math-word-set-title');
      const count = el('p', `${solved} / ${group.questions.length} 問クリア`, 'math-word-set-progress');
      const actionText = session && ['answering', 'results', 'review'].includes(session.phase)
        ? 'つづきから'
        : isGroupComplete(state, group) ? 'もう一度' : '依頼を受ける';
      const start = el('button', actionText, 'btn btn-primary math-word-set-start');
      start.type = 'button';
      start.onclick = () => openSession(group);
      card.append(title, count, start);
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

  function renderQuestion(group, session) {
    const index = Math.max(0, Math.min(QUESTIONS_PER_SET - 1, Number(session.currentIndex) || 0));
    const problem = group.questions[index];
    content.replaceChildren();
    const nav = el('div', null, 'math-word-run-nav');
    const back = el('button', '← 問題一覧へ', 'btn math-word-subquest-back');
    back.type = 'button';
    back.onclick = () => { saveAndRefresh(); renderMenu(); };
    nav.append(back, el('span', `${index + 1} / ${QUESTIONS_PER_SET} 問`, 'math-word-run-count'));
    const card = el('section', null, 'math-word-question-card');
    const story = el('p', problem.story, 'math-word-question-story');
    const question = el('h3', problem.question, 'math-word-question-text');
    const helper = el('p', '答え合わせは、5問ぜんぶに答えたあとに出ます。', 'math-word-question-helper');
    const { form, inputs } = answerValues(problem, session.answers[index]);
    const status = el('p', '', 'math-word-form-status');
    status.setAttribute('role', 'status');
    const submit = el('button', index === QUESTIONS_PER_SET - 1 ? '5問の答え合わせへ' : 'つぎの問題へ', 'btn btn-primary');
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
    card.append(story, question, helper, form, status);
    content.append(nav, el('p', `${selectedGrade}年・${group.title}`, 'math-word-current-topic'), card);
    inputs[problem.input.fields[0].name]?.focus({ preventScroll: true });
  }

  function renderResults(group, session) {
    const wrongIndexes = (session.results || []).flatMap((result, index) => result && !result.correct && !result.reviewed ? [index] : []);
    const allMastered = wrongIndexes.length === 0 && (session.results || []).length === QUESTIONS_PER_SET;
    session.phase = allMastered ? 'done' : 'results';
    api.save();
    content.replaceChildren();
    const nav = el('div', null, 'math-word-run-nav');
    const back = el('button', '← 問題一覧へ', 'btn math-word-subquest-back');
    back.type = 'button';
    back.onclick = () => { saveAndRefresh(); renderMenu(); };
    nav.append(back, el('span', '5問の答え合わせ', 'math-word-run-count'));
    const title = el('h3', allMastered ? 'ぜんぶクリア！' : `正解 ${session.results.filter(result => result.correct || result.reviewed).length} / ${QUESTIONS_PER_SET} 問`, 'math-word-results-title');
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
    content.append(nav, title, list, reward);
    if (wrongIndexes.length) {
      const retry = el('button', `まちがえた ${wrongIndexes.length} 問をヒント付きでやり直す`, 'btn btn-primary math-word-retry-start');
      retry.type = 'button';
      retry.onclick = () => renderRetry(group, session, wrongIndexes[0]);
      content.append(retry);
    } else {
      const done = el('p', '今回の5問はすべて正解です。報酬は初回クリア時に受け取れます。', 'math-word-run-complete');
      const again = el('button', 'もう一度挑戦', 'btn math-word-retry-start');
      again.type = 'button';
      again.onclick = () => { state.sessions[group.id] = blankSession(group); api.save(); renderQuestion(group, state.sessions[group.id]); };
      content.append(done, again);
    }
  }

  function renderRetry(group, session, index) {
    const problem = group.questions[index];
    content.replaceChildren();
    const nav = el('div', null, 'math-word-run-nav');
    const back = el('button', '← 答え合わせへ', 'btn math-word-subquest-back');
    back.type = 'button';
    back.onclick = () => renderResults(group, session);
    nav.append(back, el('span', `やり直し ${index + 1} / ${QUESTIONS_PER_SET}`, 'math-word-run-count'));
    const card = el('section', null, 'math-word-question-card math-word-retry-card');
    const story = el('p', problem.story, 'math-word-question-story');
    const question = el('h3', problem.question, 'math-word-question-text');
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
    card.append(story, question, hint, form, status);
    content.append(nav, el('h3', `問題 ${index + 1} をやり直そう`, 'math-word-results-title'), card);
    inputs[problem.input.fields[0].name]?.focus({ preventScroll: true });
  }

  renderMenu();
  close.focus({ preventScroll: true });
}
