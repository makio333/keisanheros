import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { MATH_WORD_QUESTS_V2 } from '../math_word_quests_v2.js';
import { JAPANESE_READING_QUESTS_V2 } from '../japanese_reading_quests_v2.js';

const { chromium } = await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const output = process.env.QUEST_ANSWER_OUTPUT || '/private/tmp/quest-answer-visibility';
await mkdir(output, { recursive: true });

const allViewports = [
  { name: 'phone-short', width: 320, height: 568, touch: true },
  { name: 'phone-portrait', width: 390, height: 844, touch: true },
  { name: 'phone-landscape', width: 844, height: 390, touch: true },
  { name: 'tablet-portrait', width: 768, height: 1024, touch: true },
  { name: 'tablet-landscape', width: 1024, height: 768, touch: true },
  { name: 'small-window', width: 800, height: 600, touch: false },
  { name: 'desktop-short', width: 1280, height: 720, touch: false },
];
const viewports = process.env.QUEST_VIEWPORT
  ? allViewports.filter(viewport => viewport.name === process.env.QUEST_VIEWPORT)
  : allViewports;
assert.ok(viewports.length, `Unknown QUEST_VIEWPORT=${process.env.QUEST_VIEWPORT}`);
const grades = process.env.QUEST_GRADE ? [Number(process.env.QUEST_GRADE)] : [1, 2, 3, 4, 5, 6];
assert.ok(grades.length && grades.every(grade => Number.isInteger(grade) && grade >= 1 && grade <= 6), `Unknown QUEST_GRADE=${process.env.QUEST_GRADE}`);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const external = [];

function luminance(color) {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  assert.ok(channels?.length === 3, `Expected rgb color, got ${color}`);
  const linear = channels.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.width <= 640,
    hasTouch: viewport.touch,
  });
  const page = await context.newPage();
  const touch = viewport.touch ? await context.newCDPSession(page) : null;
  let touchGestureMouseFallbacks = 0;
  page.on('pageerror', error => errors.push(`${viewport.name}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${viewport.name}: ${message.text()}`); });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  await page.route('**/game.js*', async route => {
    const response = await route.fetch();
    const hook = `
      window.questAnswerScrollQA={prepare(){
        window.raidLocalPreview.open();
        document.querySelector('.raid-local-preview-toolbar')?.remove();
        document.documentElement.style.removeProperty('--raid-preview-toolbar-height');
        document.querySelectorAll('.reading-subquest-overlay,.quest-detail-overlay,.quest-reward-overlay').forEach(el=>el.remove());
        document.getElementById('screen-raid-boss')?.classList.add('hidden');
        currentSlotKey='TEST_MODE_TEMP';G.isTestMode=true;questSubject='math';showHome();
      }};
    `;
    await route.fulfill({ response, body: `${await response.text()}\n${hook}` });
  });

  await page.goto('http://127.0.0.1:5186/');
  await page.waitForFunction(() => window.raidLocalPreview && window.questAnswerScrollQA);

  async function visibleHitPoint(locator) {
    const box = await locator.boundingBox();
    if (!box) return null;
    if (box.x < 0 || box.y < 0 || box.x + box.width > viewport.width || box.y + box.height > viewport.height) return null;
    const left = box.x, right = box.x + box.width;
    const top = box.y, bottom = box.y + box.height;
    const points = [];
    for (const yf of [0.5, 0.3, 0.7, 0.15, 0.85]) {
      for (const xf of [0.5, 0.3, 0.7, 0.15, 0.85]) {
        points.push({ x: left + (right - left) * xf, y: top + (bottom - top) * yf });
      }
    }
    return locator.evaluate((element, candidates) => candidates.find(point => {
      const hit = document.elementFromPoint(point.x, point.y);
      return !!hit && (hit === element || element.contains(hit));
    }) ?? null, points);
  }

  async function scrollSurface(surface, direction) {
    const box = await surface.boundingBox();
    assert.ok(box, `${viewport.name}: scroll surface is not rendered`);
    const bounds = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    const requestedX = touch ? box.x + box.width * 0.5 : box.x + box.width - 6;
    const x = Math.min(bounds.width - 4, Math.max(4, requestedX));
    const distance = Math.min(Math.max(70, Math.min(210, box.height * 0.48)), bounds.height - 12);
    const rawY = box.y + box.height * 0.82;
    const y = direction === 'up'
      ? Math.min(bounds.height - distance - 4, Math.max(4, rawY))
      : Math.max(distance + 4, Math.min(bounds.height - 4, rawY));
    const beforeScroll = await surface.evaluate(el => el.scrollTop);
    if (touch) {
      let source = 'touch';
      const mouseGesture = async () => {
        source = 'mouse';
        touchGestureMouseFallbacks++;
        const mouseX = Math.min(bounds.width - 4, Math.max(4, box.x + box.width * 0.5));
        const mouseY = Math.min(bounds.height - distance - 4, Math.max(distance + 4, box.y + box.height * 0.5));
        await touch.send('Input.synthesizeScrollGesture', {
          x: mouseX, y: mouseY, yDistance: direction === 'down' ? -distance : distance,
          speed: 800, gestureSourceType: 'mouse', preventFling: true,
        });
      };
      try {
        await touch.send('Input.synthesizeScrollGesture', {
          x, y, yDistance: direction === 'down' ? -distance : distance,
          speed: 800, gestureSourceType: source, preventFling: true,
        });
      } catch (error) {
        if (!error.message.includes('Position out of bounds')) throw error;
        await mouseGesture();
      }
      await page.waitForTimeout(180);
      if (await surface.evaluate(el => el.scrollTop) === beforeScroll && viewport.name === 'phone-landscape' && source === 'touch') {
        await mouseGesture();
      }
    } else {
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, direction === 'down' ? 340 : -340);
    }
    await page.waitForTimeout(180);
  }

  async function showOnScreen(locator, surface, label, preferredDirection = 'down') {
    await locator.waitFor({ state: 'visible' });
    for (let attempt = 0; attempt < 12; attempt++) {
      const point = await visibleHitPoint(locator);
      if (point) return point;
      const box = await locator.boundingBox();
      const direction = box && box.y + box.height / 2 < 0 ? 'up' : preferredDirection;
      await scrollSurface(surface, direction);
    }
    await page.waitForTimeout(350);
    const settledPoint = await visibleHitPoint(locator);
    if (settledPoint) return settledPoint;
    const box = await locator.boundingBox();
    const panel = await surface.evaluate(el => {
      const style = getComputedStyle(el);
      return { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, overflowX: style.overflowX, overflowY: style.overflowY, height: style.height, minHeight: style.minHeight, touchAction: style.touchAction, overscroll: style.overscrollBehaviorY, children: [...el.children].map(child => ({ tag: child.tagName, className: String(child.className), top: child.getBoundingClientRect().top, bottom: child.getBoundingClientRect().bottom, overflowY: getComputedStyle(child).overflowY, flex: getComputedStyle(child).flex })) };
    });
    const top = box && await page.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y); return el && { tag: el.tagName, id: el.id, className: String(el.className), text: el.textContent?.trim().slice(0, 100) }; }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await page.screenshot({ path: `${output}/failure-${viewport.name}-${label}.png` });
    assert.fail(`${viewport.name}/${label}: normal ${viewport.touch ? 'touch swipe' : 'wheel'} could not expose the target; target=${JSON.stringify(box)} surface=${JSON.stringify(panel)} hit=${JSON.stringify(top)}`);
  }

  async function tapVisible(locator, surface, label, preferredDirection = 'down') {
    let point = await showOnScreen(locator, surface, label, preferredDirection);
    for (let attempt = 0; !point && attempt < 4; attempt++) {
      await page.waitForTimeout(100);
      point = await visibleHitPoint(locator);
    }
    assert.ok(point, `${viewport.name}/${label}: target needs a real visible hit point`);
    const { x, y } = point;
    if (viewport.touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await page.waitForTimeout(35);
  }

  async function checkPrompt(prompt, panel, label) {
    const text = (await prompt.innerText()).trim();
    assert.ok(text.length > 0, `${viewport.name}/${label}: problem text is empty`);
    await showOnScreen(prompt, panel, `${label}-prompt`);
    await verifyScrollableText(prompt, `${label}-prompt`);
    const colors = await prompt.evaluate(element => ({
      foreground: getComputedStyle(element).color,
      background: getComputedStyle(element.parentElement).backgroundColor,
    }));
    const ratio = contrastRatio(colors.foreground, colors.background);
    assert.ok(ratio >= 4.5, `${viewport.name}/${label}: prompt contrast ${ratio.toFixed(2)} (${JSON.stringify(colors)})`);
    return text;
  }

  async function verifyScrollableText(locator, label) {
    const initial = await locator.evaluate(element => ({ scrollTop: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
    if (initial.scrollHeight <= initial.clientHeight + 1) return;
    for (let attempt = 0; attempt < 20; attempt++) {
      const current = await locator.evaluate(element => ({ scrollTop: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
      if (current.scrollTop + current.clientHeight >= current.scrollHeight - 1) break;
      await scrollSurface(locator, 'down');
    }
    const atEnd = await locator.evaluate(element => ({ scrollTop: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
    assert.ok(atEnd.scrollTop + atEnd.clientHeight >= atEnd.scrollHeight - 1, `${viewport.name}/${label}: a normal wheel/touch scroll must expose the end of overflowing text; ${JSON.stringify(atEnd)}`);
    for (let attempt = 0; attempt < 20; attempt++) {
      if (await locator.evaluate(element => element.scrollTop <= 1)) break;
      await scrollSurface(locator, 'up');
    }
    const atStart = await locator.evaluate(element => element.scrollTop);
    assert.ok(atStart <= 1, `${viewport.name}/${label}: the same scroll input must return to the start of overflowing text; scrollTop=${atStart}`);
  }

  async function scrollDirectionAt(point, panel) {
    return panel.evaluate((element, { x, y }) => {
      const target = document.elementFromPoint(x, y);
      if (!target || !element.contains(target)) return 0;
      const chain = [];
      for (let current = target; current instanceof HTMLElement; current = current.parentElement) {
        chain.push(current);
        if (current === element) break;
      }
      const canMove = (current, direction) => {
        const overflow = getComputedStyle(current).overflowY;
        if (!['auto', 'scroll', 'overlay'].includes(overflow) || current.scrollHeight <= current.clientHeight + 1) return false;
        return direction > 0
          ? current.scrollTop + current.clientHeight < current.scrollHeight - 1
          : current.scrollTop > 1;
      };
      return chain.some(current => canMove(current, 1)) ? 1 : chain.some(current => canMove(current, -1)) ? -1 : 0;
    }, point);
  }

  async function scrollValues(panel) {
    return panel.evaluate(element => ({
      outer: element.scrollTop,
      inner: [...element.querySelectorAll('.math-word-story,.reading-v2-passage,.reading-v2-prompt,textarea')].map(child => child.scrollTop),
    }));
  }

  async function wheelAtPoint(point, panel, label) {
    const target = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return element && { tag: element.tagName, className: String(element.className || ''), text: element.textContent?.trim().slice(0, 60) };
    }, point);
    assert.ok(target, `${viewport.name}/${label}: a visible wheel target exists at ${JSON.stringify(point)}`);
    const direction = await scrollDirectionAt(point, panel);
    if (!direction) return false;
    const before = await scrollValues(panel);
    await page.mouse.move(point.x, point.y);
    await page.mouse.wheel(0, direction * 32);
    await page.waitForTimeout(100);
    const after = await scrollValues(panel);
    assert.ok(after.outer !== before.outer || after.inner.some((top, index) => top !== before.inner[index]), `${viewport.name}/${label}: a natural wheel input over ${JSON.stringify(target)} should scroll its panel or a reachable text area; before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    return { target, before, after, direction };
  }

  async function wheelAtTarget(locator, panel, label) {
    let point = await visibleHitPoint(locator);
    if (!point) point = await showOnScreen(locator, panel, label);
    assert.ok(point, `${viewport.name}/${label}: natural wheel target is visible`);
    return wheelAtPoint(point, panel, label);
  }

  async function findAnswerFormWhitespace(form, panel) {
    return form.evaluate((element, viewport) => {
      const panel = element.closest('.quest-answer-panel');
      const formRect = element.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const children = [...element.children].map(child => child.getBoundingClientRect()).sort((a, b) => a.top - b.top || a.left - b.left);
      const rows = [];
      for (const rect of children) {
        const row = rows.find(item => rect.top < item.bottom - 2 && rect.bottom > item.top + 2);
        if (row) {
          row.top = Math.min(row.top, rect.top);
          row.bottom = Math.max(row.bottom, rect.bottom);
          row.children.push(rect);
        } else rows.push({ top: rect.top, bottom: rect.bottom, children: [rect] });
      }
      const candidates = [];
      for (const row of rows) {
        const y = (row.top + row.bottom) / 2;
        let occupiedRight = formRect.left;
        for (const child of row.children.sort((a, b) => a.left - b.left)) {
          const gap = child.left - occupiedRight;
          if (gap >= 80) candidates.push({ x: occupiedRight + gap / 2, y, width: gap, height: row.bottom - row.top });
          occupiedRight = Math.max(occupiedRight, child.right);
        }
        const gap = formRect.right - occupiedRight;
        if (gap >= 80) candidates.push({ x: occupiedRight + gap / 2, y, width: gap, height: row.bottom - row.top });
      }
      for (let index = 0; index < rows.length - 1; index++) {
        const gap = rows[index + 1].top - rows[index].bottom;
        if (gap >= 6) candidates.push({ x: formRect.left + formRect.width / 2, y: (rows[index].bottom + rows[index + 1].top) / 2, width: formRect.width, height: gap });
      }
      candidates.sort((a, b) => b.width * b.height - a.width * a.height);
      for (const point of candidates) {
        const visible = point.x >= Math.max(0, panelRect.left) && point.x < Math.min(viewport.width, panelRect.right)
          && point.y >= Math.max(0, panelRect.top) && point.y < Math.min(viewport.height, panelRect.bottom);
        if (visible && document.elementFromPoint(point.x, point.y) === element) return point;
      }
      return null;
    }, { width: viewport.width, height: viewport.height });
  }

  async function formWhitespacePoint(form, panel, prompt, label) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const point = await findAnswerFormWhitespace(form, panel);
      if (point) {
        assert.ok(point.width >= 80 && point.height >= 6, `${viewport.name}/${label}: use a broad answer-form blank area, found ${JSON.stringify(point)}`);
        return point;
      }
      const promptPoint = await visibleHitPoint(prompt);
      assert.ok(promptPoint, `${viewport.name}/${label}: can scroll from the visible question to reveal the answer form`);
      await page.mouse.move(promptPoint.x, promptPoint.y);
      await page.mouse.wheel(0, 48);
      await page.waitForTimeout(100);
    }
    assert.fail(`${viewport.name}/${label}: no normal visible whitespace between answer-form rows`);
  }

  async function touchFormWhitespacePoint(form, panel, prompt, label) {
    const safeY = Math.min(280, viewport.height - 120);
    for (let attempt = 0; attempt < 8; attempt++) {
      const point = await formWhitespacePoint(form, panel, prompt, label);
      if (point.y <= safeY + 4) return point;
      const metrics = await panel.evaluate(element => ({ top: element.scrollTop, max: element.scrollHeight - element.clientHeight }));
      if (metrics.max - metrics.top <= 1) return point;
      const promptPoint = await visibleHitPoint(prompt) || await showOnScreen(prompt, panel, `${label}-touch-question`);
      const distance = Math.min(40, point.y - safeY);
      await page.mouse.move(promptPoint.x, promptPoint.y);
      await page.mouse.wheel(0, distance);
      await page.waitForTimeout(100);
    }
    return formWhitespacePoint(form, panel, prompt, label);
  }

  async function touchSwipeAtPoint(point, panel, label) {
    assert.ok(touch, `${viewport.name}/${label}: touch input is enabled`);
    const before = await scrollValues(panel);
    const direction = await scrollDirectionAt(point, panel);
    assert.notEqual(direction, 0, `${viewport.name}/${label}: panel can scroll from the touch start point`);
    await touch.send('Input.synthesizeScrollGesture', {
      x: point.x, y: point.y, yDistance: direction > 0 ? -30 : 30,
      speed: 500, gestureSourceType: 'touch', preventFling: true,
    });
    await page.waitForTimeout(160);
    const after = await scrollValues(panel);
    assert.notEqual(after.outer, before.outer, `${viewport.name}/${label}: a touch swipe over the natural control region scrolls the outer panel; before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    return after;
  }

  async function scrollToNaturalTouchTarget(locator, panel, label, preferredY) {
    let point = await visibleHitPoint(locator);
    if (!point) point = await showOnScreen(locator, panel, label);
    assert.ok(point, `${viewport.name}/${label}: touch target is visible`);
    let direction = await scrollDirectionAt(point, panel);
    for (let attempt = 0; attempt < 6 && direction > 0; attempt++) {
      const bounds = await locator.boundingBox();
      if (bounds && bounds.y + bounds.height / 2 <= preferredY) break;
      await page.mouse.move(point.x, point.y);
      await page.mouse.wheel(0, 48);
      await page.waitForTimeout(100);
      point = await visibleHitPoint(locator) || await showOnScreen(locator, panel, `${label}-touch-position`);
      direction = await scrollDirectionAt(point, panel);
    }
    const bounds = await locator.boundingBox();
    const x = Math.min(bounds.x + bounds.width - 6, Math.max(bounds.x + 6, bounds.x + bounds.width / 2));
    const y = Math.min(bounds.y + bounds.height - 6, Math.max(bounds.y + 6, preferredY));
    const hit = await locator.evaluate((element, { x, y }) => {
      const node = document.elementFromPoint(x, y);
      return !!node && (element === node || element.contains(node));
    }, { x, y });
    assert.ok(hit, `${viewport.name}/${label}: the touch start is on the answer control`);
    return { x, y };
  }

  async function openBoard(subject, grade) {
    await page.evaluate(() => window.questAnswerScrollQA.prepare());
    await page.locator('#result-overlay').waitFor({ state: 'hidden' });
    await tapVisible(page.locator('#hotspot-quest-board'), page.locator('body'), `${subject}-open-board`);
    await page.locator('#screen-quest-board:not(.hidden)').waitFor();
    if (subject === 'reading') await tapVisible(page.getByRole('tab', { name: '国語' }), page.locator('#screen-quest-board .quest-board-wood'), `${subject}-tab`);
    const grades = subject === 'math'
      ? page.locator('.math-word-subquests .reading-grade-tabs button')
      : page.locator('#screen-quest-board .reading-subquests > .reading-grade-tabs button');
    await tapVisible(grades.nth(grade - 1), page.locator('#screen-quest-board .quest-board-wood'), `${subject}-grade-${grade}`);
  }

  async function openQuestionCard(subject, grade) {
    const selector = subject === 'math'
      ? '.math-word-quest-grid .reading-quest-card .reading-quest-card-actions button'
      : '.reading-v2-quest-grid .reading-quest-card .reading-quest-card-actions button';
    const button = page.locator(selector).first();
    await tapVisible(button, page.locator('#screen-quest-board .quest-board-wood'), `${subject}-grade-${grade}-open-card`);
  }

  async function returnToList(panel, scrollSurface) {
    const back = panel.getByRole('button', { name: '← 依頼一覧へ' });
    await tapVisible(back, scrollSurface, 'back-to-quest-list', 'up');
    await panel.waitFor({ state: 'detached' });
    await page.locator('#screen-quest-board:not(.hidden)').waitFor();
  }

  for (const grade of grades) {
    const mathProblem = MATH_WORD_QUESTS_V2.find(problem => problem.grade === grade);
    assert.ok(mathProblem, `math grade ${grade} fixture exists`);
    await openBoard('math', grade);
    await openQuestionCard('math', grade);
    const mathPanel = page.locator('.math-word-answer-panel');
    const mathScroll = mathPanel;
    const story = page.locator('.math-word-story');
    assert.ok((await story.innerText()).trim().length > 0, `${viewport.name}/math-${grade}: passage is present`);
    await showOnScreen(story, mathScroll, `math-${grade}-passage`);
    await verifyScrollableText(story, `math-${grade}-passage`);
    const mathPrompt = page.locator('.math-word-question');
    await checkPrompt(mathPrompt, mathScroll, `math-${grade}`);
    if (viewport.name === 'small-window') {
      await page.locator('#result-overlay').waitFor({ state: 'hidden' });
      await page.screenshot({ path: `${output}/math-800x600.png` });
    }

    const mathPanelMetrics = await mathPanel.evaluate(element => ({ top: element.scrollTop, max: element.scrollHeight - element.clientHeight }));
    const mathForm = page.locator('.math-word-answer-fields');
    if (mathPanelMetrics.max > 1) {
      await wheelAtTarget(mathPrompt, mathPanel, `math-${grade}-question-natural-wheel`);
      const mathFormWhitespace = await formWhitespacePoint(mathForm, mathPanel, mathPrompt, `math-${grade}-form-whitespace`);
      const firstInput = mathForm.locator('input').first();
      const activeInputBeforeWheel = await firstInput.evaluate(element => document.activeElement === element);
      const inputValueBeforeWheel = await firstInput.inputValue();
      await wheelAtPoint(mathFormWhitespace, mathPanel, `math-${grade}-form-whitespace-natural-wheel`);
      assert.equal(await firstInput.evaluate(element => document.activeElement === element), activeInputBeforeWheel, `${viewport.name}/math-${grade}: scrolling over form whitespace preserves input focus`);
      assert.equal(await firstInput.inputValue(), inputValueBeforeWheel, `${viewport.name}/math-${grade}: scrolling over form whitespace preserves the input value`);
      if (touch && grade === 1 && ['phone-short', 'phone-landscape'].includes(viewport.name)) {
        const touchPoint = await touchFormWhitespacePoint(mathForm, mathPanel, mathPrompt, `math-${grade}-form-whitespace-touch`);
        await touchSwipeAtPoint(touchPoint, mathPanel, `math-${grade}-form-whitespace-touch`);
        assert.equal(await firstInput.evaluate(element => document.activeElement === element), activeInputBeforeWheel, `${viewport.name}/math-${grade}: touch scrolling over form whitespace preserves input focus`);
      }
    }

    const inputs = mathForm.locator('input');
    assert.equal(await inputs.count(), mathProblem.input.fields.length, `${viewport.name}/math-${grade}: all answer fields rendered`);
    for (let fieldIndex = 0; fieldIndex < mathProblem.input.fields.length; fieldIndex++) {
      const input = inputs.nth(fieldIndex);
      await tapVisible(input, mathScroll, `math-${grade}-input-${fieldIndex + 1}`);
      await page.keyboard.insertText('wrong');
      assert.equal(await input.inputValue(), 'wrong', `${viewport.name}/math-${grade}: answer field accepts keyboard input`);
    }
    const mathSubmit = page.locator('.math-word-answer-fields button[type="submit"]');
    await tapVisible(mathSubmit, mathScroll, `math-${grade}-submit`);
    assert.ok((await page.locator('.math-word-feedback').innerText()).length > 0, `${viewport.name}/math-${grade}: visible submit produces feedback`);
    if (viewport.name === 'small-window') {
      await page.locator('#result-overlay').waitFor({ state: 'hidden' });
      await page.screenshot({ path: `${output}/math-submit-800x600.png` });
    }
    await returnToList(mathPanel, mathScroll);

    const readingQuest = JAPANESE_READING_QUESTS_V2.find(quest => quest.grade === grade);
    assert.ok(readingQuest, `Japanese grade ${grade} fixture exists`);
    await tapVisible(page.getByRole('tab', { name: '国語' }), page.locator('#screen-quest-board .quest-board-wood'), `reading-tab-${grade}`);
    const readingGrades = page.locator('#screen-quest-board .reading-subquests > .reading-grade-tabs button');
    await tapVisible(readingGrades.nth(grade - 1), page.locator('#screen-quest-board .quest-board-wood'), `reading-grade-${grade}`);
    await openQuestionCard('reading', grade);
    const firstReadingPanel = page.locator('.reading-v2-answer-panel');
    let readingScroll = firstReadingPanel;
    const firstPassage = page.locator('.reading-v2-passage');
    const firstPrompt = page.locator('.reading-v2-prompt');
    await verifyScrollableText(firstPassage, `reading-${grade}-passage`);
    await checkPrompt(firstPrompt, readingScroll, `reading-${grade}-question-1`);
    await wheelAtTarget(firstPassage, readingScroll, `reading-${grade}-passage-natural-wheel`);
    await wheelAtTarget(firstPrompt, readingScroll, `reading-${grade}-prompt-natural-wheel`);
    const firstChoice = page.locator('.reading-v2-choice').first();
    await showOnScreen(firstChoice, readingScroll, `reading-${grade}-choice-natural-wheel`);
    const progressBeforeWheel = await page.locator('.reading-story-progress').innerText();
    await wheelAtTarget(firstChoice, readingScroll, `reading-${grade}-choice-natural-wheel`);
    assert.equal(await firstChoice.isDisabled(), false, `${viewport.name}/reading-${grade}: wheel over a choice does not select it`);
    assert.equal(await page.locator('.reading-story-progress').innerText(), progressBeforeWheel, `${viewport.name}/reading-${grade}: wheel over choices preserves question progress`);
    if (touch && grade === 1 && ['phone-short', 'phone-landscape'].includes(viewport.name)) {
      const touchPoint = await scrollToNaturalTouchTarget(firstChoice, readingScroll, `reading-${grade}-choice-touch`, Math.min(295, viewport.height - 100));
      const progressBeforeTouch = await page.locator('.reading-story-progress').innerText();
      await touchSwipeAtPoint(touchPoint, readingScroll, `reading-${grade}-choice-touch`);
      assert.equal(await firstChoice.isDisabled(), false, `${viewport.name}/reading-${grade}: touch swipe over a choice does not select it`);
      assert.equal(await page.locator('.reading-story-progress').innerText(), progressBeforeTouch, `${viewport.name}/reading-${grade}: touch swipe preserves question progress`);
    }
    const back = firstReadingPanel.getByRole('button', { name: '← 依頼一覧へ' });
    await tapVisible(back, readingScroll, `reading-${grade}-back-to-list`, 'up');
    await firstReadingPanel.waitFor({ state: 'detached' });
    await openQuestionCard('reading', grade);

    const panel = page.locator('.reading-v2-answer-panel');
    readingScroll = panel;
    for (let questionIndex = 0; questionIndex < 3; questionIndex++) {
      const question = readingQuest.questions[questionIndex];
      const prompt = page.locator('.reading-v2-prompt');
      await checkPrompt(prompt, readingScroll, `reading-${grade}-question-${questionIndex + 1}`);
      const correctIndex = question.input.options.findIndex(option => option.id === question.correct);
      assert.ok(correctIndex >= 0, `${viewport.name}/reading-${grade}: correct choice exists`);
      await tapVisible(page.locator('.reading-v2-choice').nth(correctIndex), readingScroll, `reading-${grade}-choice-${questionIndex + 1}`);
      const next = panel.locator('.quest-answer-next');
      await tapVisible(next, readingScroll, `reading-${grade}-next-${questionIndex + 1}`);
      try {
        await page.waitForFunction(index => document.querySelector('.reading-story-progress')?.textContent.includes(`${index + 2}／5問め`), questionIndex, { timeout: 4000 });
      } catch (error) {
        await page.screenshot({ path: `${output}/failure-${viewport.name}-reading-${grade}-next-${questionIndex + 1}.png` });
        throw new Error(`${viewport.name}/reading-${grade}/q${questionIndex + 1}: next tap did not advance; progress=${await panel.locator('.reading-story-progress').innerText().catch(() => 'missing')} feedback=${await panel.locator('.reading-v2-feedback').innerText().catch(() => 'missing')} nextButtons=${await panel.locator('.quest-answer-next').count()}`, { cause: error });
      }
    }

    const openResponseQuestion = readingQuest.questions[3];
    assert.equal(openResponseQuestion.input.type, 'open-response');
    const reviewPrompt = page.locator('.reading-v2-prompt');
    await checkPrompt(reviewPrompt, readingScroll, `reading-${grade}-human-review`);
    const response = page.locator('.reading-v2-response-label textarea');
    await tapVisible(response, readingScroll, `reading-${grade}-response-input`);
    await page.keyboard.insertText('本文の手がかりからそう考えました。');
    assert.ok((await response.inputValue()).length > 0, `${viewport.name}/reading-${grade}: response accepts keyboard input`);
    if (grade === 1 && viewport.name === 'phone-short') {
      const shortResponse = await response.inputValue();
      const maxLength = await response.evaluate(element => element.maxLength);
      await page.keyboard.insertText('あ'.repeat(Math.max(0, maxLength - shortResponse.length)));
      assert.equal((await response.inputValue()).length, maxLength, `${viewport.name}/reading-${grade}: long response remains editable up to its authored limit`);
      const beforeTextScroll = await response.evaluate(element => ({ top: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
      assert.ok(beforeTextScroll.scrollHeight > beforeTextScroll.clientHeight, `${viewport.name}/reading-${grade}: long response has its own native scroll area`);
      const textareaPoint = await visibleHitPoint(response);
      assert.ok(textareaPoint, `${viewport.name}/reading-${grade}: textarea stays fully visible while editing`);
      const panelBeforeTextareaWheel = await panel.evaluate(element => element.scrollTop);
      await page.mouse.move(textareaPoint.x, textareaPoint.y);
      await page.mouse.wheel(0, 24);
      await page.waitForTimeout(100);
      const afterTextScroll = await response.evaluate(element => ({ top: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
      assert.ok(afterTextScroll.top > beforeTextScroll.top, `${viewport.name}/reading-${grade}: native wheel scrolls long textarea text`);
      assert.equal(await panel.evaluate(element => element.scrollTop), panelBeforeTextareaWheel, `${viewport.name}/reading-${grade}: wheel over a scrollable textarea does not steal its inner scroll`);
      assert.equal(await response.evaluate(element => document.activeElement === element), true, `${viewport.name}/reading-${grade}: textarea remains focused after inner scrolling`);
      for (let attempt = 0; attempt < 12; attempt++) {
        const metrics = await response.evaluate(element => ({ top: element.scrollTop, max: element.scrollHeight - element.clientHeight }));
        if (metrics.top >= metrics.max - 1) break;
        const point = await visibleHitPoint(response);
        assert.ok(point, `${viewport.name}/reading-${grade}: textarea remains visible while scrolling its text`);
        await page.mouse.move(point.x, point.y);
        await page.mouse.wheel(0, 80);
        await page.waitForTimeout(70);
      }
      assert.ok(await response.evaluate(element => element.scrollTop + element.clientHeight >= element.scrollHeight - 1), `${viewport.name}/reading-${grade}: normal wheel reaches the end of long textarea text`);
      for (let attempt = 0; attempt < 12; attempt++) {
        if (await response.evaluate(element => element.scrollTop <= 1)) break;
        const point = await visibleHitPoint(response);
        assert.ok(point, `${viewport.name}/reading-${grade}: textarea stays visible while returning to its text start`);
        await page.mouse.move(point.x, point.y);
        await page.mouse.wheel(0, -80);
        await page.waitForTimeout(70);
      }
      assert.ok(await response.evaluate(element => element.scrollTop <= 1), `${viewport.name}/reading-${grade}: normal wheel returns long textarea text to its start`);
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
      await page.keyboard.insertText(shortResponse);
      assert.equal(await response.inputValue(), shortResponse, `${viewport.name}/reading-${grade}: textarea content remains editable after its inner scroll`);
    }
    const criteria = page.locator('.reading-v2-review-criteria input');
    assert.ok(await criteria.count() > 0, `${viewport.name}/reading-${grade}: human-review criteria exist`);
    for (let index = 0; index < await criteria.count(); index++) {
      await tapVisible(criteria.nth(index), readingScroll, `reading-${grade}-review-check-${index + 1}`);
    }
    const reviewSubmit = panel.getByRole('button', { name: '人に確認してもらって次へ' });
    assert.equal(await reviewSubmit.isDisabled(), false, `${viewport.name}/reading-${grade}: complete criteria enables review submit`);
    await tapVisible(reviewSubmit, readingScroll, `reading-${grade}-human-review-submit`);
    assert.match(await page.locator('.reading-v2-feedback').innerText(), /大人に答え/);
    if (viewport.name === 'small-window' || viewport.name === 'desktop-short') {
      await page.locator('#result-overlay').waitFor({ state: 'hidden' });
      const screenshot = viewport.name === 'small-window' ? `${output}/reading-review-800x600.png` : `${output}/reading-review-1280x720.png`;
      await page.screenshot({ path: screenshot });
    }

    const reviewNext = panel.locator('.quest-answer-next');
    await tapVisible(reviewNext, readingScroll, `reading-${grade}-review-next`);
    try {
      await page.waitForFunction(() => document.querySelector('.reading-story-progress')?.textContent.includes('5／5問め'), null, { timeout: 4000 });
    } catch (error) {
      await page.screenshot({ path: `${output}/failure-${viewport.name}-reading-${grade}-review-next.png` });
      throw new Error(`${viewport.name}/reading-${grade}: review next tap did not advance; progress=${await panel.locator('.reading-story-progress').innerText().catch(() => 'missing')} buttons=${JSON.stringify(await panel.locator('button').evaluateAll(elements => elements.map(el => ({ text: el.innerText, disabled: el.disabled, rect: el.getBoundingClientRect().toJSON() }))))}`, { cause: error });
    }
    const extractionQuestion = readingQuest.questions[4];
    assert.equal(extractionQuestion.input.type, 'extraction');
    await checkPrompt(page.locator('.reading-v2-prompt'), readingScroll, `reading-${grade}-extraction`);
    if (viewport.name === 'phone-short') {
      await page.screenshot({ path: `${output}/reading-extraction-${grade}-phone-short.png` });
    }
    const extraction = page.getByRole('textbox', { name: '本文から抜き出す答え', exact: true });
    await tapVisible(extraction, readingScroll, `reading-${grade}-extraction-input`);
    await page.keyboard.insertText(extractionQuestion.correct);
    assert.equal(await extraction.inputValue(), extractionQuestion.correct, `${viewport.name}/reading-${grade}: extraction accepts keyboard input`);
    const extractionSubmit = page.locator('.reading-v2-extraction-form button[type="submit"]');
    await tapVisible(extractionSubmit, readingScroll, `reading-${grade}-extraction-submit`);
    assert.match(await page.locator('.reading-v2-feedback').innerText(), /正解！/);
    const finish = panel.locator('.quest-answer-next');
    await tapVisible(finish, readingScroll, `reading-${grade}-finish`);
    await panel.waitFor({ state: 'detached' });
    await page.locator('#screen-quest-board:not(.hidden)').waitFor();
    await tapVisible(page.locator('#btn-quest-board-back'), page.locator('#screen-quest-board .quest-board-wood'), `grade-${grade}-close-board`, 'up');
    await page.locator('#screen-quest-board').waitFor({ state: 'hidden' });

    console.log(`PASS ${viewport.name}: math and Japanese grade ${grade}, including passage/prompt contrast, input, choices, submit, human review, next and back using visible hit targets.`);
  }
  await context.close();
  if (touchGestureMouseFallbacks) console.log(`INFO ${viewport.name}: ${touchGestureMouseFallbacks} scroll gestures used the CDP mouse source after touch synthesis could not scroll at its first point.`);
}

assert.deepEqual(errors, [], 'no console or page errors');
assert.deepEqual(external, [], 'all browser requests stayed on the local preview');
await browser.close();
console.log(`PASS: ${viewports.length} screen sizes × grades ${grades.join(',')} × both subjects. Wheel/touch scroll inputs exposed every control before activation; phone-landscape used the CDP mouse-source fallback where touch synthesis did not move the panel.`);
