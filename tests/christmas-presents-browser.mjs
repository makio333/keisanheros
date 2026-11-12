import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {CHRISTMAS_EXCHANGE_PRIZES} from '../christmas_presents.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output=process.env.ARTIFACT_DIR || '/private/tmp/christmas-presents-browser';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}}), page=await context.newPage();
const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:5195/'))external.push(r.url())});
const state=()=>page.evaluate(()=>window.christmasStageLocalPreview.state());
await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.fulfill({status:200,body:''}));
try{
 await page.goto('http://127.0.0.1:5195/',{waitUntil:'domcontentloaded'});
 await page.locator('.christmas-hub').waitFor({timeout:30000});
 assert.equal(await page.locator('.christmas-monster-card').count(),9);
 await page.waitForTimeout(350);await page.screenshot({path:output+'/hub-desktop.png'});
 await page.getByRole('tab',{name:'🎁 お礼の交換所'}).click();
 assert.equal(await page.locator('.christmas-exchange-card').count(),14);
 assert.equal(await page.locator('[data-christmas-exchange]:enabled').count(),0);
 await page.waitForTimeout(350);await page.screenshot({path:output+'/exchange-empty.png'});
 await page.evaluate(()=>window.christmasStageLocalPreview.fund(200));
 const skin='christmas_santa_helper',button=page.locator(`[data-christmas-exchange="${skin}"]`);
 await button.click();await page.locator('.christmas-exchange-confirm [data-cancel]').click();assert.equal((await state()).balance,200);
 await button.click();await page.locator('.christmas-exchange-confirm [data-confirm]').click();
 assert.equal((await state()).balance,120);assert.ok((await state()).game.unlockedSkins.includes(skin));assert.equal(await button.isEnabled(),false);
 await page.locator('[data-christmas-exchange="christmas_exchange_candy_sword"]').click();await page.locator('.christmas-exchange-confirm [data-confirm]').click();
 assert.equal((await state()).balance,90);assert.ok((await state()).game.ownedEquips.some(e=>e.id==='christmas_exchange_candy_sword'&&e.ability==='crit_up'));
 assert.equal(await page.locator('[data-christmas-exchange="christmas_exchange_candy_sword"]').isEnabled(),true);
 await page.waitForTimeout(350);await page.screenshot({path:output+'/exchange-owned.png'});
 const gacha=await page.evaluate(()=>window.christmasStageLocalPreview.gachaPrizes());
 assert.ok(!gacha.some(p=>CHRISTMAS_EXCHANGE_PRIZES.some(e=>e.id===p.id))); // checked again in Node below
 await page.evaluate(()=>{window.christmasStageLocalPreview.fund(0);window.christmasStageLocalPreview.start(true);});
 await page.locator('#software-keyboard .key-btn').first().waitFor({timeout:15000});
 const layout=[];
 for(const [width,height] of [[1440,900],[1440,1200],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const result=await page.evaluate(()=>{
   const status=document.querySelector('#battle-player-window').getBoundingClientRect(),problem=document.querySelector('#kanji-problem-center').getBoundingClientRect(),keyboard=document.querySelector('#kanji-challenge').getBoundingClientRect();
   const keys=[...document.querySelectorAll('#software-keyboard .kana-board-grid .key-btn')].filter(e=>e.getClientRects().length).map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}));
   return {width:innerWidth,centerError:Math.abs(problem.left+problem.width/2-innerWidth/2),boardPortrait:keyboard.height>keyboard.width,overflow:document.documentElement.scrollWidth>innerWidth+1,gap:problem.top-status.bottom,keys,overlap:!(keyboard.left>=problem.right-1||keyboard.right<=problem.left+1||keyboard.top>=problem.bottom-1||keyboard.bottom<=status.top+1)};
  });
  assert.equal(result.overflow,false,JSON.stringify(result));assert.equal(result.overlap,false);assert.ok(result.centerError<1);if(width>=900&&width>height)assert.ok(result.boardPortrait);assert.ok(result.gap>0&&result.gap<=6.2);
  for(const key of result.keys){assert.ok(Math.abs(key.w-key.h)<.1);assert.ok(key.w<=64.1)}layout.push({width,height,visibleKeys:result.keys.length,gap:result.gap});
  await page.waitForTimeout(350);await page.screenshot({path:`${output}/battle-${width}x${height}.png`,fullPage:width<1100});
 }
 // The compact keyboard page can enter characters from both halves.
 await page.getByRole('button',{name:'あ',exact:true}).click();
 await page.getByRole('button',{name:'は',exact:true}).click();
 assert.equal(await page.locator('#challenge-input').inputValue(),'あは');
 await page.getByRole('button',{name:'けす',exact:true}).click();await page.getByRole('button',{name:'けす',exact:true}).click();
 await page.setViewportSize({width:1440,height:900});
 const problem=(await state()).problem?.problem;assert.ok(problem?.answer,JSON.stringify(problem));
 await page.locator('#challenge-input').fill(String(problem.answer));await page.locator('#btn-submit-answer').click();
 await page.waitForFunction(()=>window.christmasStageLocalPreview.state().balance>=2,{timeout:15000});
 assert.ok((await state()).balance<=4);
 await page.waitForTimeout(350);await page.screenshot({path:output+'/first-recovery.png'});
 async function advance(expected){
  const until=Date.now()+18000;
  while(Date.now()<until){
   const s=await state();if(expected===5?!s.run:s.run?.christmasIndex===expected)return;
   if(await page.locator('.gacha-reveal-overlay').count())await page.locator('.gacha-reveal-overlay').click({force:true});
   if(await page.locator('#btn-levelup-close').count())await page.locator('#btn-levelup-close').click();
   await page.waitForTimeout(150);
  }
  throw Error('Battle did not advance to '+expected);
 }
 const baseSource=await page.evaluate(()=>window.christmasStageLocalPreview.source());
 await advance(1);
 const recovered=[(await state()).balance];
 for(let index=1;index<5;index++){
  const beforeState=await state(),before=beforeState.balance;
  if(index===2){assert.ok(beforeState.enemy.isBoss);const harder=await page.evaluate(()=>window.christmasStageLocalPreview.questionSource(true));assert.notEqual(`${harder.areaId}/${harder.stageIndex}`,`${beforeState.run.areaId}/${beforeState.run.stageIndex}`);}
  await page.evaluate(()=>{window.christmasStageLocalPreview.defeat();window.christmasStageLocalPreview.defeat();});
  const after=(await state()).balance;assert.ok(after-before>=(index===2?10:2)&&after-before<=(index===2?15:4));
  recovered.push(after-before);await advance(index+1);
 }
 const completed=await state();assert.ok(completed.balance>=18&&completed.balance<=31);assert.equal(completed.game.christmasEvent.christmas_2026.clears,1);const nextSource=await page.evaluate(()=>window.christmasStageLocalPreview.source());assert.equal(nextSource.level,baseSource.level+1);assert.notEqual(`${nextSource.areaId}/${nextSource.stageIndex}`,`${baseSource.areaId}/${baseSource.stageIndex}`);
 await page.waitForTimeout(350);await page.screenshot({path:output+'/clear.png'});
 await page.locator('.christmas-clear-card [data-action="exchange"]').click();
 assert.match(await page.locator('.christmas-hub-balance').innerText(),new RegExp(String(completed.balance)));
 assert.deepEqual(errors,[]);assert.ok(external.every(url=>url.startsWith('https://cdn.jsdelivr.net/npm/chart.js')),JSON.stringify(external));
 await writeFile(output+'/report.json',JSON.stringify({layout,recovered,total:completed.balance,errors,external},null,2));
 console.log('PASS: 5 battles with rare Santa + stage progression, guaranteed presents, no duplicate victory reward, exchange/cancel/owned/gear, fixed-square keys and portrait board at 4 sizes, centered problem, no overlap or Firebase/account calls');
}finally{await browser.close();}
