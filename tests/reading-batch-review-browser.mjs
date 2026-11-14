import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import {getJapaneseReadingQuestsV2} from '../japanese_reading_quests_v2.js';
const record=getJapaneseReadingQuestsV2(4)[0],b=await chromium.launch({channel:'chrome',headless:true}),dir='/private/tmp/reading-hint-retry';await mkdir(dir,{recursive:true});
try{
const p=await b.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:5174/print_review_20261106.html?kind=reading-board&grade=4');await p.waitForFunction(()=>window.reviewReady);
await p.evaluate(async()=>{const {renderJapaneseReadingV2Subquests:render}=await import('/japanese_reading_subquests_v2.js');window.testGame={player:{gold:0},questMedals:0};window.testExp=0;window.testRender=()=>render(document.querySelector('#board'),4,{game:()=>window.testGame,asset:s=>'/'+s,rewardIcon:()=>'<span>🏅</span>',bindRewards:()=>{},save:()=>{},exp:n=>window.testExp+=n});window.testRender();});
const balance=()=>p.evaluate(()=>({gold:window.testGame.player.gold,medals:window.testGame.questMedals,exp:window.testExp}));
await p.getByRole('button',{name:'依頼を受ける',exact:true}).first().click();await p.waitForTimeout(600);
for(let i=0;i<5;i++){
 const q=record.questions[i];
 if(q.input.type==='single-choice'){await p.locator('.reading-v2-choice').nth(q.input.options.findIndex(o=>!q.accepted.includes(o.id))).click();await p.waitForTimeout(600);assert.equal(await p.locator('.reading-v2-feedback').innerText(),'');}
 else if(q.input.type==='open-response'){assert.equal(await p.locator('.reading-v2-review-criteria').count(),0);await p.getByLabel('自分の考えと本文の手がかり',{exact:true}).fill('道具を使うとき、相手に合わせて説明したいと思いました。');}
 else await p.getByLabel('本文から抜き出す答え',{exact:true}).fill('まちがい');
 const submitted=i+(q.input.type==='single-choice'?1:0);assert.deepEqual(await balance(),{gold:submitted*240,medals:submitted,exp:submitted*180});
 if(i===0){
  await p.waitForFunction(()=>document.querySelector('[data-reward=gold] b').textContent==='240');
  assert.equal(await p.locator('.reading-v2-hud-meter .is-earned').count(),1);
  await p.screenshot({path:dir+'/selected-desktop.png'});
  await p.locator('.reading-v2-choice').nth(q.input.options.findIndex(o=>q.accepted.includes(o.id))).click();await p.waitForTimeout(600);assert.deepEqual(await balance(),{gold:240,medals:1,exp:180});
  await p.locator('.reading-v2-choice').nth(q.input.options.findIndex(o=>!q.accepted.includes(o.id))).click();await p.waitForTimeout(600);assert.deepEqual(await balance(),{gold:240,medals:1,exp:180});
 }

 await p.getByRole('button',{name:i===4?'5問まとめて答え合わせ':'回答を保存して次へ',exact:true}).click();await p.waitForTimeout(600);
 if(i===1){await p.getByRole('button',{name:'← 依頼一覧へ',exact:true}).click();await p.waitForTimeout(600);assert.deepEqual(await balance(),{gold:480,medals:2,exp:360});await p.evaluate(()=>{window.testGame=JSON.parse(JSON.stringify(window.testGame));window.testRender();});await p.getByRole('button',{name:'回答のつづき',exact:true}).click();await p.waitForTimeout(600);assert.ok((await p.locator('.reading-story-progress').innerText()).startsWith('3／5'));}
}
assert.equal(await p.locator('.reading-v2-result-row').count(),5);assert.equal(await p.locator('.reading-v2-result-row[data-status=incorrect]').count(),4);assert.equal(await p.locator('.reading-v2-result-row[data-status=needs-review]').count(),1);await p.locator('.reading-v2-result-row summary').first().click();await p.waitForTimeout(600);assert.ok(!(await p.locator('.reading-v2-results').innerText()).includes(record.questions[0].explanation));await p.locator('.reading-v2-result-row summary').first().click();await p.waitForTimeout(600);assert.deepEqual(await balance(),{gold:1200,medals:5,exp:900});
await p.locator('.reading-v2-results').evaluate(el=>{el.scrollTop=el.scrollHeight;});await p.screenshot({path:dir+'/remaining-desktop.png'});
await p.getByRole('button',{name:'ここで終わる（残りの報酬は未受取）',exact:true}).click();await p.waitForTimeout(600);assert.equal(await p.locator('.reading-v2-suggestion:not([hidden])').count(),1);await p.screenshot({path:dir+'/suggestion-desktop.png'});
await p.getByRole('button',{name:'✎ ヒント付き再挑戦を再開',exact:true}).click();await p.waitForTimeout(600);
// Hints do not disclose solutions or grant the remaining reward.
assert.deepEqual(await balance(),{gold:1200,medals:5,exp:900});
for(let i=0;i<5;i++){
 const q=record.questions[i];assert.equal(await p.locator('.reading-v2-correct-answer').count(),0);assert.equal(await p.locator('.reading-v2-retry-hint').count(),1);assert.ok(!(await p.locator('.reading-v2-answer-foreground').innerText()).includes(q.explanation));if(q.evidence.length)assert.ok(await p.locator('.reading-v2-pencil-hint').count()>0);if(i===0){const text=await p.locator('.reading-v2-passage').evaluate(el=>{const c=el.cloneNode(true);c.querySelectorAll('rt,.reading-v2-reference-label').forEach(x=>x.remove());return c.textContent;});assert.equal(text,record.passage);await p.screenshot({path:dir+'/hint-desktop.png'});}
 if(q.input.type==='single-choice'){
  if(i===0){await p.locator('.reading-v2-choice').nth(q.input.options.findIndex(o=>!q.accepted.includes(o.id))).click();await p.waitForTimeout(600);await p.getByRole('button',{name:'この答えを確認する',exact:true}).click();await p.waitForTimeout(600);assert.equal(await p.locator('.reading-v2-feedback').innerText(),'もう一度、本文の手がかりを確かめよう。');assert.deepEqual(await balance(),{gold:1200,medals:5,exp:900});}
  await p.locator('.reading-v2-choice').nth(q.input.options.findIndex(o=>q.accepted.includes(o.id))).click();await p.waitForTimeout(600);
 }else if(q.input.type==='open-response'){
  assert.equal(await p.getByLabel('口頭で答えました',{exact:true}).count(),0);await p.getByLabel('自分の考えと本文の手がかり',{exact:true}).fill('本文の道具の説明から、相手に伝わるように使い方を確かめたいと思いました。');assert.equal(await p.getByRole('button',{name:'この答えを確認する',exact:true}).isDisabled(),true);for(const c of await p.locator('.reading-v2-review-criteria input').all())await c.check();
 }else await p.getByLabel('本文から抜き出す答え',{exact:true}).fill(q.accepted[0]);
 await p.getByRole('button',{name:'この答えを確認する',exact:true}).click();await p.waitForTimeout(600);assert.deepEqual(await balance(),{gold:1200+(i+1)*240,medals:6+i,exp:900+(i+1)*180});
 if(i===0){await p.getByRole('button',{name:'答え合わせに戻る',exact:true}).click();await p.waitForTimeout(600);await p.getByRole('button',{name:'ここで終わる（残りの報酬は未受取）',exact:true}).click();await p.waitForTimeout(600);await p.evaluate(()=>{window.testGame=JSON.parse(JSON.stringify(window.testGame));window.testRender();});await p.getByRole('button',{name:'✎ ヒント付き再挑戦を再開',exact:true}).click();await p.waitForTimeout(600);assert.ok((await p.locator('.reading-story-progress').innerText()).startsWith('2／5'));await p.setViewportSize({width:390,height:844});await p.locator('.reading-v2-retry-hint').scrollIntoViewIfNeeded();await p.screenshot({path:dir+'/hint-mobile.png'});await p.setViewportSize({width:1366,height:900});}
}
assert.equal(await p.locator('.reading-v2-result-row[data-status=correct]').count(),5);assert.ok((await p.locator('.reading-v2-results').innerText()).includes('5問中 5問 正解'));
await p.locator('.reading-v2-results').evaluate(el=>{el.scrollTop=el.scrollHeight;});await p.screenshot({path:dir+'/complete-desktop.png'});
await p.waitForFunction(()=>document.querySelector('[data-reward=gold] b').textContent==='2,400');await p.setViewportSize({width:390,height:844});await p.locator('.reading-v2-results').scrollIntoViewIfNeeded();await p.screenshot({path:dir+'/complete-mobile.png'});
const hud=await p.locator('.reading-v2-reward-hud').boundingBox();assert.ok(hud.x>=0&&hud.y>=0&&hud.x+hud.width<=390&&hud.y+hud.height<=844,JSON.stringify(hud));
assert.equal(await p.locator('.reading-v2-hud-meter').getAttribute('aria-valuenow'),'100');
await p.waitForFunction(()=>document.querySelector('[data-reward=gold] b').textContent==='2,400');

await p.getByRole('button',{name:'もう一度5問に挑戦',exact:true}).click();await p.waitForTimeout(600);
for(let i=0;i<5;i++){const q=record.questions[i];if(q.input.type==='single-choice'){await p.locator('.reading-v2-choice').nth(q.input.options.findIndex(o=>q.accepted.includes(o.id))).click();await p.waitForTimeout(600);}else if(q.input.type==='open-response'){assert.equal(await p.getByLabel('口頭で答えました',{exact:true}).count(),0);await p.getByLabel('自分の考えと本文の手がかり',{exact:true}).fill('本文の道具の説明から、相手に伝わるように使い方を確かめたいと思いました。');}else await p.getByLabel('本文から抜き出す答え',{exact:true}).fill(q.accepted[0]);await p.getByRole('button',{name:i===4?'5問まとめて答え合わせ':'回答を保存して次へ',exact:true}).click();await p.waitForTimeout(600);}
assert.deepEqual(await balance(),{gold:2400,medals:10,exp:1800});assert.deepEqual(errors,[]);console.log('PASS: per-answer 10%, no early grading, quit keeps partial reward, saved resume, remaining-reward suggestion, wrong review pays nothing, human confirmation, 100% after all correct, replay cap, desktop/mobile');
}finally{await b.close();}
