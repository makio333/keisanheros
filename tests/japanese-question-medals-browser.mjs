import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1280,height:900}});await page.goto('http://127.0.0.1:5181/print_review_20261106.html');await page.waitForFunction(()=>window.reviewReady);
await page.evaluate(async()=>{const {renderJapaneseReadingV2Subquests}=await import('/japanese_reading_subquests_v2.js');const {getJapaneseReadingQuestsV2}=await import('/japanese_reading_quests_v2.js');window.medalRecord=getJapaneseReadingQuestsV2(1)[0];window.medalGame={player:{gold:0},questMedals:7};document.body.innerHTML='<main id="quest-fixture"></main>';window.mountMedalFixture=()=>renderJapaneseReadingV2Subquests(document.querySelector('main'),1,{game:()=>window.medalGame,asset:p=>'/'+p,rewardIcon:()=>'<span>🏅</span>',bindRewards:()=>{},save:()=>{},exp:n=>window.medalExp=(window.medalExp||0)+n,refresh:()=>{},answerFeedback:()=>{}});window.mountMedalFixture();});
await page.locator('.quest-card').first().getByRole('button',{name:'依頼を受ける'}).click();
for(let i=0;i<5;i++){
 const q=await page.evaluate(i=>window.medalRecord.questions[i],i);
 if(q.input.type==='single-choice'){
  const index=q.input.options.findIndex(o=>o.id===q.correct);if(i===0){await page.locator('.reading-v2-choice').nth((index+1)%q.input.options.length).click();assert.equal(await page.evaluate(()=>window.medalGame.questMedals),7);}
  await page.locator('.reading-v2-choice').nth(index).click();
 }else if(q.input.type==='extraction'){await page.getByRole('textbox',{name:'本文から抜き出す答え'}).fill(q.answerText);await page.getByRole('button',{name:'けってい',exact:true}).click();}
 else{for(const checkbox of await page.locator('.reading-v2-review-criteria input').all())await checkbox.check();await page.getByRole('button',{name:'人に確認してもらって次へ'}).click();}
 assert.equal(await page.evaluate(()=>window.medalGame.questMedals),8+i,`question ${i+1}: exactly one medal`);
 if(i<4)await page.getByRole('button',{name:'次の問題',exact:true}).click();
}
assert.equal(await page.evaluate(()=>window.medalGame.player.gold),900);assert.equal(await page.evaluate(()=>window.medalExp),60);
await page.getByRole('button',{name:'依頼をおわる'}).click();await page.locator('.quest-card').first().getByRole('button',{name:'もう一度読む'}).click();const correct=await page.evaluate(()=>window.medalRecord.questions[0].input.options.findIndex(o=>o.id===window.medalRecord.questions[0].correct));await page.locator('.reading-v2-choice').nth(correct).click();assert.equal(await page.evaluate(()=>window.medalGame.questMedals),12,'replay cannot repay');
await page.evaluate(()=>{document.querySelector('.reading-subquest-overlay')?.remove();window.medalGame.japaneseReadingV2={progress:{[window.medalRecord.id]:2},claimed:{}};window.medalGame.questMedals=33;window.mountMedalFixture();});
await page.locator('.quest-card').first().getByRole('button',{name:/つづき/}).click();const third=await page.evaluate(()=>window.medalRecord.questions[2].input.options.findIndex(o=>o.id===window.medalRecord.questions[2].correct));await page.locator('.reading-v2-choice').nth(third).click();assert.equal(await page.evaluate(()=>window.medalGame.questMedals),34,'existing balance stays, resumed question pays once');console.log('PASS: Japanese wrong answer=0, five sequential answers=5, oral review, completion gold/exp unchanged, replay=0, save/resume retains prior medals');
}finally{await browser.close();}
