import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output='/private/tmp/adventure-viewport-check';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.fulfill({status:200,body:''}));
try{
 await page.goto('http://127.0.0.1:5195/?v=fit1',{waitUntil:'domcontentloaded'});await page.locator('.christmas-hub').waitFor({timeout:30000});await page.locator('.christmas-hub [data-action=start]').click();await page.locator('#btn-toggle-kana-board').waitFor({timeout:15000});
 console.log('battle ready');const results=[];
 for(const [w,h] of [[1440,900],[1280,720],[1024,768],[844,390],[665,706],[600,520],[390,844],[375,667],[320,568]]){
  console.log('viewport',w,h);await page.setViewportSize({width:w,height:h});await page.waitForTimeout(180);
  const result=await page.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
   const selectors=['#christmas-answer-stack','#kanji-challenge','#battle-field','#challenge-input','#btn-submit-answer','#btn-toggle-kana-board','#battle-enemy-name','#battle-enemy-progress','#battle-enemy-emoji img','.enemy-bars'];
   const panels=Object.fromEntries(selectors.map(s=>[s,rect(s)]));
   const keys=[...document.querySelectorAll('#software-keyboard .key-btn')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,right:r.right,bottom:r.bottom}});
   return {w:innerWidth,h:innerHeight,mode:document.querySelector('#screen-battle').dataset.adventureFit,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,panels,keys};
  });
  await page.screenshot({path:`${output}/battle-${w}x${h}.png`});results.push(result);
 }
 await writeFile(output+'/geometry.json',JSON.stringify(results,null,2));
 for(const r of results){
  assert.ok(r.scrollW<=r.w+1&&r.scrollH<=r.h+1,JSON.stringify(r));
  for(const [name,p] of Object.entries(r.panels))assert.ok(p.x>=-1&&p.y>=-1&&p.right<=r.w+1&&p.bottom<=r.h+1,`${r.w}x${r.h} ${name}: ${JSON.stringify(p)}`);
  for(const k of r.keys)assert.ok(Math.abs(k.w-k.h)<.1&&k.right<=r.w+1&&k.bottom<=r.h+1,JSON.stringify(k));
  const a=r.panels['#christmas-answer-stack'],b=r.panels['#kanji-challenge'];assert.ok(Math.abs(a.x+a.w/2-r.w/2)<1);
  assert.ok(a.right<=b.x+1 || b.right<=a.x+1 || a.bottom<=b.y+1 || b.bottom<=a.y+1,`overlap: ${r.w}x${r.h}`);
 }
 // Mixing direct typing and kana clicks never requires an input-mode switch.
 assert.equal(await page.locator('#btn-toggle-input').count(),0);await page.locator('#challenge-input').fill('ひ');await page.getByRole('button',{name:'あ',exact:true}).click();assert.equal(await page.locator('#challenge-input').inputValue(),'ひあ');
 await page.getByRole('button',{name:'五十音ボードを最小化',exact:true}).click();await page.waitForTimeout(180);assert.equal(await page.locator('#btn-toggle-kana-board').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('#challenge-input').inputValue(),'ひあ');assert.equal(await page.locator('#challenge-input').getAttribute('readonly'),null);
 await page.locator('#challenge-input').fill('ひと');await page.screenshot({path:output+'/minimized-320x568.png'});
 await page.getByRole('button',{name:'五十音ボードを展開',exact:true}).click();await page.waitForTimeout(180);await page.getByRole('button',{name:'つ',exact:true}).click();assert.equal(await page.locator('#challenge-input').inputValue(),'ひとつ');
 // The kana page and modifier controls remain usable after scaling.
 await page.getByRole('button',{name:'は',exact:true}).click();await page.getByRole('button',{name:'半濁点',exact:true}).click();assert.equal(await page.locator('#challenge-input').inputValue(),'ひとつぱ');
 await page.getByRole('button',{name:'けす',exact:true}).click();assert.equal(await page.locator('#challenge-input').inputValue(),'ひとつ');
 const answer=await page.evaluate(()=>window.christmasStageLocalPreview.state().problem.problem.answer);
 await page.locator('#challenge-input').fill(String(answer));
 await page.locator('#challenge-input').dispatchEvent('keydown',{key:'Enter',keyCode:229,isComposing:true});
 await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.christmasStageLocalPreview.state().balance),0);
 await page.locator('#challenge-input').press('Enter');await page.waitForFunction(()=>window.christmasStageLocalPreview.state().balance>0);
 assert.deepEqual(errors,[]);console.log('PASS: 9 viewport sizes without scrolling, visible square keys, centered problem, mixed input and minimize/expand');
}finally{await browser.close();}
