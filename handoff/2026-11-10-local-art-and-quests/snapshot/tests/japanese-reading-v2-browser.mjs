import assert from 'node:assert/strict';import {homedir} from 'node:os';import {mkdir} from 'node:fs/promises';
import {JAPANESE_READING_QUESTS_V2 as bank} from '../japanese_reading_quests_v2.js';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const url=process.env.JR_V2_URL||'http://127.0.0.1:5207/japanese-reading-v2.html';
const out=process.env.JR_V2_OUTPUT||'/tmp/japanese-reading-v2-browser';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1366,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('.question').first().waitFor();
 for(let grade=1;grade<=6;grade++){
  await page.selectOption('#grade',String(grade));assert.equal(await page.locator('#quest option').count(),10);
  for(const quest of bank.filter(q=>q.grade===grade)){
   await page.selectOption('#quest',quest.id);assert.equal(await page.locator('#title').innerText(),quest.title);
   assert.equal(await page.locator('.question').count(),5);
   // Remove presentation-only labels/ruby readings before comparing the entire passage.
   const text=await page.locator('#passage').evaluate(el=>{const clone=el.cloneNode(true);clone.querySelectorAll('rt,.paragraph-label,.reference-label').forEach(n=>n.remove());return [...clone.querySelectorAll('p')].map(p=>p.textContent).join('\n');});
   assert.equal(text,quest.passage,quest.id);
   for(const q of quest.questions){const form=page.locator(`[data-question-id="${q.id}"]`);
    if(q.input.type==='single-choice'){
     await form.locator(`input[value="${q.input.options.find(o=>o.id!==q.correct).id}"]`).check();await form.locator('button[type=submit]').click();assert.ok((await form.locator('.feedback').innerText()).includes('もう一度'));
     await form.locator(`input[value="${q.correct}"]`).check();await form.locator('button[type=submit]').click();assert.ok((await form.locator('.feedback').innerText()).startsWith('合っています'));
    }else if(q.input.type==='extraction'){
     await form.locator('input[type=text]').fill('ちがうこたえ');await form.locator('button[type=submit]').click();assert.ok((await form.locator('.feedback').innerText()).includes('もう一度'));
     await form.locator('input[type=text]').fill(q.accepted.at(-1));await form.locator('input[type=text]').press('Enter');assert.ok((await form.locator('.feedback').innerText()).startsWith('合っています'));
    }else{await form.locator('textarea').fill('本文の言葉と自分の経験を比べて考えました。');await form.locator('button[type=submit]').click();assert.ok((await form.locator('.feedback').innerText()).includes('自動で正誤を決めません'));}
   }
   const state=JSON.parse(await page.evaluate(()=>window.render_game_to_text()));assert.equal(state.correct,4);assert.equal(state.total,4);
  }
 }
 // Use the actual shared kana board, including the voiced-key transformation.
 await page.selectOption('#grade','1');const extraction=page.locator('[data-question-id="jr-v2-g1-01-q5"]');
 await extraction.locator('summary').click();await extraction.locator('input').focus();await extraction.getByRole('button',{name:'す',exact:true}).click();await extraction.getByRole('button',{name:'す',exact:true}).click();await extraction.getByRole('button',{name:'゛',exact:true}).click();assert.equal(await extraction.locator('input').inputValue(),'すず');
 await extraction.locator('button[type=submit]').click();assert.ok((await extraction.locator('.feedback').innerText()).startsWith('合っています'));
 await page.locator('#ruby').uncheck();assert.equal(await page.locator('#passage ruby').count(),0);await page.locator('#ruby').check();
 for(const grade of [1,6]){await page.selectOption('#grade',String(grade));await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/grade${grade}-desktop.png`});}
 await page.setViewportSize({width:390,height:844});for(const grade of [1,6]){await page.selectOption('#grade',String(grade));await page.evaluate(()=>scrollTo(0,0));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/grade${grade}-mobile.png`});}
 await page.evaluate(()=>window.print=()=>{});await page.locator('#printGrade').click();assert.equal(await page.locator('#printArea .print-quest').count(),10);assert.equal(await page.locator('#printArea .print-question').count(),50);
 assert.equal(await page.locator('#printArea .print-cells').count(),20);assert.equal(await page.locator('#printArea .feedback').count(),0);
 await page.locator('#print').click();assert.equal(await page.locator('#printArea .print-quest').count(),1);
 await page.emulateMedia({media:'print'});await page.setViewportSize({width:794,height:1123});await page.screenshot({path:`${out}/grade6-print.png`,fullPage:true});await page.pdf({path:`${out}/grade6-print.pdf`,format:'A4',printBackground:true});
 assert.deepEqual(errors,[]);console.log('PASS: all 60 passages / 300 questions; wrong and correct choice/extraction; human-review disclosure; actual kana board; ruby toggle; six grade selection; mobile overflow; 10-passage print; PDF; no page errors.');
}finally{await browser.close();}
