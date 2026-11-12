import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {MATH_WORD_QUESTS_V2} from '../math_word_quests_v2.js';
import {JAPANESE_READING_QUESTS_V2} from '../japanese_reading_quests_v2.js';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
const allViewports=[
 {name:'phone-short',width:320,height:568},
 {name:'phone-tall',width:390,height:844},
 {name:'phone-landscape',width:844,height:390},
 {name:'tablet-portrait',width:768,height:1024},
 {name:'tablet-landscape',width:1024,height:768},
 {name:'desktop-short',width:1280,height:720},
 {name:'desktop',width:1440,height:900},
];
const viewports=process.env.QUEST_VIEWPORT?allViewports.filter(v=>v.name===process.env.QUEST_VIEWPORT):allViewports;
try{
 const page=await browser.newPage({viewport:{width:320,height:568}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/game.js*',async route=>{
  const response=await route.fetch();
  const code=await response.text()+`\nconst qaOpenPrint=openPrintWindow;let qaBlockPrint=true;openPrintWindow=(...args)=>qaBlockPrint?false:qaOpenPrint(...args);let qaBlockWindow=true;const qaNativeWindowOpen=window.open.bind(window);window.open=(...args)=>qaBlockWindow?null:qaNativeWindowOpen(...args);window.questLayoutQA={
   prepare(){
    window.raidLocalPreview.open();
    questSubject='math';
    document.getElementById('screen-raid-boss')?.classList.add('hidden');
    currentSlotKey=SAVE_PREFIX+'quest_layout_matrix_fixture';G.isTestMode=false;
    G.player.lvl=45;G.player.hp=G.player.maxHp;G.player.mp=G.player.maxMp;G.player.gold=99999;
    G.questMedals=1400;G.questMedalExchanged={};
    const itemIds=['potion','hipotion','herb','ether','cost_seed','respec_seed'];
    G.items=Array.from({length:59},(_,i)=>({uid:2000+i,id:itemIds[i%itemIds.length],count:1}));
    G.items.push({uid:2059,id:'bp_ancient',count:2});
    const equipIds=['w1','a1','c1','w2','a2','c2','w3','a3','c3','w4','a4','c4'];
    G.ownedEquips=Array.from({length:60},(_,i)=>({uid:1000+i,id:equipIds[i%equipIds.length],rarity:i%5+1,ability:null}));
    G.nextUid=3000;G.equipment={weapon:{uid:1000},armor:{uid:1001},accessory:{uid:1002}};
    G.unlockedAvatarBackgrounds=['default'];G.equipGachaTenPullTickets=0;G.skinGachaTickets=0;
    G.stageClearCounts={area1:[1,1,1,1,1,1,1],area5:[1,1,1,1,1]};
    G.stageTotalClears={area1:[3,3,3,3,3,3,3],area5:[3,3,3,3,3]};
    G.pickup=null;G.activePrints={};showHome();updateHud();save(true);renderQuestMedalCount();
   },
   home(){G.pickup=null;document.getElementById('screen-quest-board')?.classList.add('hidden');document.querySelectorAll('.reading-subquest-overlay,.quest-detail-overlay,.event-player-overlay,.quest-reward-overlay').forEach(el=>el.remove());showHome();},board(){showQuestBoard();},room(){showStatus();},items(){showItems();},
   restore(){document.querySelectorAll('.reading-subquest-overlay,.quest-detail-overlay,.event-player-overlay,.quest-reward-overlay').forEach(el=>el.remove());document.getElementById('screen-raid-boss')?.classList.add('hidden');loadSlot(SAVE_PREFIX+'quest_layout_matrix_fixture');questSubject='reading';showQuestBoard();updateHud();renderQuestMedalCount();},
   closeRaid(){document.getElementById('screen-raid-boss')?.classList.add('hidden');showHome();},
   blocked(){qaBlockPrint=true;qaBlockWindow=true;},
   multiItemReward(n){const list=Array.from({length:n},(_,i)=>({kind:'item',name:'ながい なまえの報酬アイテム '+(i+1),icon:'🎁'}));playItemRevealSequence(list,{title:'報酬を確認',showSummary:true});},
   manyQuestExtras(n){showQuestRewardToast(12345,678,{emoji:'🧑‍🌾'},true,Array.from({length:n},(_,i)=>({icon:'🎁',text:'たくさんの報酬 '+(i+1)+'・追加アイテムの説明'})),()=>{});},
    state:()=>({medals:G.questMedals,gold:G.player.gold,exp:G.player.exp,math:JSON.parse(JSON.stringify(G.mathWordQuestsV2||{})),reading:JSON.parse(JSON.stringify(G.japaneseReadingV2||{})),activePrints:JSON.parse(JSON.stringify(G.activePrints||{})),items:G.items.map(i=>({...i})),claims:{...G.questMedalExchanged}})
  };`;
  await route.fulfill({response,body:code});
 });
 await page.goto('http://127.0.0.1:5186/');
 await page.waitForFunction(()=>window.questLayoutQA&&window.raidLocalPreview);
 await page.evaluate(()=>window.questLayoutQA.prepare());

 async function noHorizontalOverflow(label){
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth,offenders:[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,id:el.id,cls:typeof el.className==='string'?el.className:'',right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)})).filter(el=>el.right>innerWidth+1&&el.width>0).slice(0,10)}));
  assert.ok(width.scroll<=width.inner+1,`${label}: horizontal overflow ${JSON.stringify(width)}`);
 }
 async function buttonInViewport(locator,label){
  await locator.scrollIntoViewIfNeeded();
  const b=await locator.boundingBox();
  const center=b&&{x:b.x+b.width/2,y:b.y+b.height/2};
  assert.ok(center&&center.x>=0&&center.x<=page.viewportSize().width&&center.y>=0&&center.y<=page.viewportSize().height,`${label}: action center outside viewport ${JSON.stringify(b)}`);
 }
 async function clickCloseConfirm(){
  const cancel=page.locator('#btn-confirm-no');
  if(await cancel.count()){await buttonInViewport(cancel,'cancel confirmation');await cancel.click();}
 }

 const rewardStressSizes=new Set(['phone-short','tablet-landscape','desktop']);
 for(const vp of viewports){
  await page.setViewportSize({width:vp.width,height:vp.height});
  await page.evaluate(()=>window.questLayoutQA.prepare());
  await noHorizontalOverflow(`${vp.name}/home`);

  // Adventure: navigate from the town hotspot through the area list into the stage list.
  await page.locator('#hotspot-adventure').click();
  await page.locator('#screen-stage-select.active').waitFor();
  await noHorizontalOverflow(`${vp.name}/area-select`);
  const lastArea=page.locator('#stage-group-math .stage-card').last();
  await buttonInViewport(lastArea,`${vp.name}/last-area`);
  await lastArea.click();
  await page.locator('#screen-stage-select-new.active').waitFor();
  const lastStage=page.locator('#stage-button-container .stage-select-row').last();
  await buttonInViewport(lastStage,`${vp.name}/last-stage`);
  await page.locator('#btn-stage-select-new-back').click();
  await page.locator('#btn-stage-select-back').click();
  await page.locator('#screen-home.active').waitFor();

  // Quest board: both subjects, bottom page control, every exchange reward in the long list.
  await page.locator('#hotspot-quest-board').click();
  await page.locator('#screen-quest-board:not(.hidden)').waitFor();
  await noHorizontalOverflow(`${vp.name}/math-quests`);
  const mathNext=page.locator('.quest-page-btn[aria-label="次のクエストページ"]:not(:disabled)').first();
  if(await mathNext.count()){await buttonInViewport(mathNext,`${vp.name}/math-next-page`);await mathNext.click();}
  await page.getByRole('tab',{name:'国語'}).click();
  await page.locator('#screen-quest-board .reading-subquests > .reading-grade-tabs button').nth(5).click();
  await noHorizontalOverflow(`${vp.name}/reading-quests`);
  const v2Cards=page.locator('.reading-v2-quest-card');
  assert.ok(await v2Cards.count()>0,`${vp.name}: Japanese V2 villager cards render`);
  assert.match(await v2Cards.first().locator('.quest-card-stars').getAttribute('aria-label'),/0問 \/ 5問/);
  const exchangeIcon=page.locator('#quest-medal-count img.quest-medal-exchange-icon');
  assert.ok(await exchangeIcon.isVisible(),`${vp.name}: independent exchange shop icon is visible`);
  assert.ok((await exchangeIcon.getAttribute('src')).includes('quest-medal-exchange-shop.png'));
  assert.equal(await page.locator('#screen-quest-board .quest-medal-shop-dialog').count(),0,`${vp.name}: exchange items do not consume board space`);
  const readingLast=page.locator('.reading-v2-quest-card button.btn').last();
  await buttonInViewport(readingLast,`${vp.name}/last-reading-card`);
  await page.locator('#quest-medal-count').click();
  const shop=page.locator('.quest-medal-shop-dialog');await shop.waitFor();
  assert.equal(await shop.locator('.quest-medal-reward').count(),20,`${vp.name}: all milestone cards render`);
  const lastReward=shop.locator('.quest-medal-reward').last();
  await lastReward.evaluate(el=>el.scrollIntoView({block:'end'}));
  const lastClaim=lastReward.locator('[data-exchange="quest_skin_ticket_4"]');
  await buttonInViewport(lastClaim,`${vp.name}/last-medal-claim`);
  assert.ok(!(await lastClaim.isDisabled()),`${vp.name}: highest reward is reachable`);
  const header=shop.locator('.quest-medal-shop-dialog-head');
  const headerBox=await header.boundingBox();
  assert.ok(headerBox&&headerBox.y>=-1&&headerBox.y<=vp.height,'exchange close header remains visible after scrolling');
  if(vp.name==='phone-short')await page.screenshot({path:'/tmp/quest-exchange-phone-short.png'});
  await lastClaim.click();
  const confirm=page.locator('.quest-exchange-confirm');await confirm.waitFor();
  await buttonInViewport(page.locator('#btn-exchange-cancel'),`${vp.name}/claim-cancel`);
  await page.locator('#btn-exchange-cancel').click();
  await page.locator('.quest-medal-shop-close').click();
  await page.getByRole('tab',{name:'算数'}).click();
  await noHorizontalOverflow(`${vp.name}/math-board-restored`);

  // Open a real math V2 story problem, verify wrong-answer retry and first-clear rewards.
  await page.locator('.math-word-subquests .reading-grade-tabs button').first().click();
  const mathProblem=MATH_WORD_QUESTS_V2.find(q=>q.grade===1);
  const mathCard=page.locator('.math-word-quest-grid .quest-card').first();
  assert.equal(await mathCard.locator('.quest-card-title').innerText(),mathProblem.title,`${vp.name}: grade-one math page resets`);
  await mathCard.locator('.reading-quest-card-actions button').first().click();
  const mathInput=page.locator('.math-word-answer-fields input').first();await mathInput.waitFor();
  await buttonInViewport(mathInput,`${vp.name}/math-answer-input`);
  await noHorizontalOverflow(`${vp.name}/math-answer`);
  await mathInput.fill('0');await page.locator('.math-word-answer-fields button[type="submit"]').click();
  assert.match(await page.locator('.math-word-feedback').innerText(),/もう一度/);
  await mathInput.fill(mathProblem.answer);await page.locator('.math-word-answer-fields button[type="submit"]').click();
  assert.equal((await page.evaluate(()=>window.questLayoutQA.state())).math.completed[mathProblem.id],true);
  await page.getByRole('button',{name:'一覧へもどる'}).click();
  await page.locator('#screen-quest-board:not(.hidden)').waitFor();

  // Japanese V2: verify one villager starts a five-question set. Complete and reload one
  // passage on the short-phone viewport to prove persistence and first-clear reward idempotency.
  await page.getByRole('tab',{name:'国語'}).click();
  await page.locator('#screen-quest-board .reading-subquests > .reading-grade-tabs button').first().click();
  const readingQuest=JAPANESE_READING_QUESTS_V2.find(q=>q.grade===1);
  const firstV2=page.locator('.reading-v2-quest-card').filter({has:page.getByRole('heading',{name:readingQuest.title,exact:true})}).first();
  const openV2=firstV2.locator('.reading-quest-card-actions button').first();
  const openCount=await openV2.count();
  assert.equal(openCount,1,`${vp.name}: first grade-one passage is on the selected page; ${JSON.stringify(await page.evaluate(()=>({viewport:[innerWidth,innerHeight],subject:[...document.querySelectorAll('#quest-subject-tabs [role=tab]')].map(tab=>[tab.textContent,tab.getAttribute('aria-selected')]),grades:[...document.querySelectorAll('#screen-quest-board .reading-subquests > .reading-grade-tabs button')].map(button=>[button.textContent,button.getAttribute('aria-pressed')]),titles:[...document.querySelectorAll('.reading-v2-quest-card .quest-card-title')].map(el=>el.textContent),pagination:document.querySelector('.reading-v2-subquests .quest-page-status')?.textContent})) )}`);
  assert.equal(await openV2.innerText(),'依頼を受ける');
  await openV2.click();
  assert.match(await page.locator('.reading-story-progress').innerText(),/1／5問め/);
  assert.equal(await page.locator('.reading-v2-prompt').count(),1);
  const baseline=await page.evaluate(()=>window.questLayoutQA.state());
  for(let questionIndex=0;questionIndex<readingQuest.questions.length;questionIndex++){
   const question=readingQuest.questions[questionIndex];
   if(question.input.type==='single-choice'){
    const answerIndex=question.input.options.findIndex(option=>option.id===question.correct);
    await buttonInViewport(page.locator('.reading-v2-choice').nth(answerIndex),`${vp.name}/reading-choice-${questionIndex+1}`);
    await page.locator('.reading-v2-choice').nth(answerIndex).click();
   }else if(question.input.type==='extraction'){
    const readingInput=page.locator('.reading-v2-extraction-form input');await buttonInViewport(readingInput,`${vp.name}/reading-extraction-${questionIndex+1}`);await readingInput.fill(question.correct);
    await page.locator('.reading-v2-extraction-form button[type="submit"]').click();
   }else{
    await page.locator('.reading-v2-response-label textarea').fill('本文の手がかりからそう考えました。');
    await page.locator('.reading-v2-review-criteria input').evaluateAll(els=>{els.forEach(el=>el.checked=true);els[0]?.dispatchEvent(new Event('change',{bubbles:true}));});
    const review=page.getByRole('button',{name:'人に確認してもらって次へ'});await buttonInViewport(review,`${vp.name}/reading-review-${questionIndex+1}`);await review.click();
   }
   const next=page.locator('.quest-answer-next');await next.waitFor();
   await buttonInViewport(next,`${vp.name}/reading-next-${questionIndex+1}`);
   if(questionIndex<4){
    const interim=await page.evaluate(()=>window.questLayoutQA.state());
    assert.equal(interim.reading.progress?.[readingQuest.id],questionIndex+1,`${vp.name}: saved progress after question ${questionIndex+1}`);
    assert.notEqual(interim.reading.claimed?.[readingQuest.id],true,`${vp.name}: no reward before all five questions`);
   }
   await next.click();
   if(questionIndex<4)await page.waitForFunction(i=>document.querySelector('.reading-story-progress')?.textContent.includes(`${i+2}／5問め`),questionIndex);
  }
  const afterFirstClear=await page.evaluate(()=>window.questLayoutQA.state());
  assert.equal(afterFirstClear.reading.progress[readingQuest.id],5);
  assert.equal(afterFirstClear.reading.claimed[readingQuest.id],true);
  assert.equal(afterFirstClear.gold,baseline.gold+900);
  assert.equal(afterFirstClear.medals,baseline.medals+6);
  assert.equal(await page.locator('.reading-subquest-overlay').count(),0);
  if(vp.name==='phone-short'){
   await page.reload();await page.waitForFunction(()=>!!window.questLayoutQA&&!!window.raidLocalPreview);
   await page.evaluate(()=>window.questLayoutQA.restore());
   let reloaded=await page.evaluate(()=>window.questLayoutQA.state());
   assert.equal(reloaded.reading.progress[readingQuest.id],5,'save reload keeps all five answers');
   assert.equal(reloaded.reading.claimed[readingQuest.id],true,'save reload keeps claimed reward');
   const replayCard=page.locator('.reading-v2-quest-card').filter({has:page.getByRole('heading',{name:readingQuest.title,exact:true})}).first();
   await replayCard.locator('.reading-quest-card-actions button').first().click();
   assert.equal(await page.locator('.reading-story-progress').innerText(),'1／5問め　'+readingQuest.questions[0].skill);
   const replayQuestion=readingQuest.questions[0];await page.locator('.reading-v2-choice').nth(replayQuestion.input.options.findIndex(option=>option.id===replayQuestion.correct)).click();
   await page.locator('.quest-answer-next').click();await page.getByRole('button',{name:'← 依頼一覧へ'}).click();
   reloaded=await page.evaluate(()=>window.questLayoutQA.state());
   assert.equal(reloaded.gold,afterFirstClear.gold,'re-reading cannot grant gold twice');
   assert.equal(reloaded.medals,afterFirstClear.medals,'re-reading cannot grant medals twice');
  }

  // Legacy challenge letters remain separate from the five-question villager quests.
  await page.getByRole('tab',{name:'国語'}).click();
  await page.locator('#screen-quest-board .reading-subquests > .reading-grade-tabs button').first().click();
  await page.locator('.reading-duel-card button.btn').click();
  await page.locator('.letter-open').click();
  const letterInput=page.getByRole('textbox',{name:'答え',exact:true});await letterInput.waitFor();
  await buttonInViewport(page.getByRole('button',{name:'← 依頼一覧へ'}),`${vp.name}/letter-back`);
  await buttonInViewport(letterInput,`${vp.name}/letter-input`);
  await buttonInViewport(page.getByRole('button',{name:'けってい',exact:true}),`${vp.name}/letter-submit`);
  if(vp.name==='phone-short'){
   await letterInput.fill('ちがうこたえ');await page.getByRole('button',{name:'けってい',exact:true}).click();
   assert.match(await page.locator('.quest-reading-answer-feedback').innerText(),/もう一度/);
  }
  await page.getByRole('button',{name:'← 依頼一覧へ'}).click();

  // Inventory: scroll through a crowded gear/item grid and open/cancel its action affordance.
  await page.evaluate(()=>window.questLayoutQA.home());
  await page.locator('#hotspot-status').click();
  await page.locator('#screen-status.active').waitFor();
  await noHorizontalOverflow(`${vp.name}/room`);
  await page.locator('#equip-tab-equips').click();
  const equipGrid=page.locator('#equip-list-grid');
  assert.equal(await equipGrid.locator('.equip-grid-cell').count(),60);
  const lastEquip=equipGrid.locator('.equip-grid-cell').last();
  await lastEquip.scrollIntoViewIfNeeded();
  assert.ok(await lastEquip.isVisible(),`${vp.name}: last equipment card is visible after scrolling`);
  const candidate=equipGrid.locator('.equip-grid-cell:not(.is-equipped):not(.is-costly)').first();
  assert.ok(await candidate.count(),`${vp.name}: an equipment action is available`);
  await buttonInViewport(candidate,`${vp.name}/equip-action`);await candidate.click();
  if(await page.locator('#btn-confirm-no').count()){await clickCloseConfirm();}
  await page.locator('#equip-tab-items').click();
  const itemGrid=page.locator('#equip-list-grid');
  assert.equal(await itemGrid.locator('.inv-grid-cell').count(),64);
  const lastCell=itemGrid.locator('.inv-grid-cell').nth(59);await lastCell.scrollIntoViewIfNeeded();
  assert.ok(await lastCell.isVisible(),`${vp.name}: last item cell is visible after scrolling`);
  await buttonInViewport(lastCell,`${vp.name}/last-item`);
  await noHorizontalOverflow(`${vp.name}/room-items`);

  // The item-shop route reaches the long list; the last ancient-print button stays reachable.
  await page.evaluate(()=>window.questLayoutQA.home());
  await page.locator('#hotspot-item-shop').click();
  await page.locator('#screen-item-shop.active').waitFor();
  await page.locator('#btn-item-shop-goto-use').click();
  await page.locator('#screen-items.active').waitFor();
  const itemList=page.locator('#item-list');
  assert.equal(await itemList.locator('.inv-row').count(),60);
  await itemList.evaluate(el=>el.scrollTop=el.scrollHeight);
  const printButton=itemList.locator('button').last();
  await buttonInViewport(printButton,`${vp.name}/ancient-print-button`);
  if(vp.name==='phone-short'){
   await printButton.click();const ancientReview=page.locator('.ancient-print-review');await ancientReview.waitFor();
   await ancientReview.locator('[data-review-print]').click();await page.waitForFunction(()=>document.querySelector('.ancient-print-review-status')?.textContent.includes('開けません'));
   assert.equal((await page.evaluate(()=>window.questLayoutQA.state())).items.find(i=>i.id==='bp_ancient').count,2,'blocked print does not consume the fixture item');
   assert.equal(Object.keys((await page.evaluate(()=>window.questLayoutQA.state())).activePrints).length,0,'blocked popup registers no print ID');
   await ancientReview.locator('[data-review-close]').first().click();
  }
  await noHorizontalOverflow(`${vp.name}/items`);
  await page.locator('#btn-items-back').click();

  if(rewardStressSizes.has(vp.name)){
   // Stress a reward toast with 24 lines: the card must scroll within the viewport.
   await page.evaluate(()=>window.questLayoutQA.manyQuestExtras(24));
   const rewardCard=page.locator('.quest-reward-card');await rewardCard.waitFor();
   await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.quest-reward-card')).opacity)>=.99);
   const rewardCardBox=await rewardCard.boundingBox();
   assert.ok(rewardCardBox&&rewardCardBox.y>=-1&&rewardCardBox.y+rewardCardBox.height<=vp.height+1,`${vp.name}: expanded reward card remains inside viewport`);
   await rewardCard.evaluate(el=>el.scrollTop=el.scrollHeight);
   assert.ok(await rewardCard.locator('.quest-reward-extra').last().isVisible(),`${vp.name}: last reward line can be reached`);
   if(vp.name==='phone-short')await page.screenshot({path:'/tmp/quest-reward-phone-short.png'});
   await rewardCard.waitFor({state:'detached',timeout:12000});
   // Stress a multi-item reveal summary; the close button remains reachable after its list.
   await page.evaluate(()=>window.questLayoutQA.multiItemReward(24));
   const reveal=page.locator('.gacha-reveal-card');await reveal.waitFor();
   for(let i=0;i<24;i++)await page.locator('.gacha-reveal-card').click();
   const summary=page.locator('.gacha-reveal-summary');await summary.waitFor();
   await summary.evaluate(el=>el.scrollTop=el.scrollHeight);
   await buttonInViewport(summary.locator('#btn-gacha-reveal-close'),`${vp.name}/reveal-close`);
   if(vp.name==='phone-short')await page.screenshot({path:'/tmp/quest-reveal-phone-short.png'});
   await summary.locator('#btn-gacha-reveal-close').click();
  }
  if(vp.name==='phone-short')await page.screenshot({path:'/tmp/quest-progression-320x568.png'});
  if(vp.name==='tablet-landscape')await page.screenshot({path:'/tmp/quest-progression-1024x768.png'});
  if(vp.name==='desktop')await page.screenshot({path:'/tmp/quest-progression-1440x900.png'});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: seven simulated viewports; adventure area and stage bottoms, math/reading quest controls, 20 reward rows and final claim, readable answer panels, 60-piece equipment/item inventories, 60-row ancient-print list, expanded reward toast and 24-item reveal summary. Fixture popups blocked; no item consumed.');
}finally{await browser.close();}
