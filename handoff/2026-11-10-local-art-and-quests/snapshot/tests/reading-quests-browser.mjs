import assert from 'node:assert/strict';import {homedir} from 'node:os';import {READING_QUESTS} from '../reading_quests.js';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);const b=await chromium.launch({channel:'chrome',headless:true});
try{const p=await b.newPage({viewport:{width:1366,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5186/output/reading-quests-preview.html');await p.locator('.quest').first().waitFor();
for(let grade=1;grade<=6;grade++){
 await p.locator(`[data-grade="${grade}"]`).click();assert.equal(await p.locator('.quest').count(),10);
 for(const q of READING_QUESTS.filter(q=>q.grade===grade)){
  const card=p.locator(`[data-quest-id="${q.id}"]`);assert.equal(await card.locator('.passage').innerText(),q.passage);await card.locator('input').fill('でたらめ');await card.locator('form button').click();assert.ok(await card.locator('.feedback').evaluate(el=>el.classList.contains('wrong')));await card.locator('input').fill(q.answer);await card.locator('input').press('Enter');assert.ok(!await card.locator('.feedback').evaluate(el=>el.classList.contains('wrong')));await card.locator('summary').click();assert.ok((await card.locator('.answer').innerText()).includes(q.answer));
 }
 if(grade===1||grade===6){await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:`/tmp/reading-quests-grade${grade}.png`});}
}
await p.setViewportSize({width:390,height:844});for(const grade of [1,6]){await p.locator(`[data-grade="${grade}"]`).click();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`/tmp/reading-quests-mobile-grade${grade}.png`});}
await p.reload();assert.equal(await p.locator('[aria-pressed=true]').innerText(),'6年生');assert.deepEqual(errors,[]);console.log('PASS: 60 questions displayed; wrong/correct typing, Enter submit, answer/evidence disclosure, six grades, hash reload and mobile without horizontal overflow; no exceptions');}finally{await b.close();}
