import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const b=await chromium.launch({channel:'chrome',headless:true});const out='/private/tmp/equipment-chest-check';await mkdir(out,{recursive:true});
try{
 const p=await b.newPage({viewport:{width:1000,height:800}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({status:200,body:''}));
 await p.goto('http://127.0.0.1:5195/?v=chest-intro1',{waitUntil:'domcontentloaded'});await p.locator('.christmas-hub').waitFor();
 async function finish(count){
  await p.locator('.gacha-reveal-overlay').waitFor();
  for(let i=0;i<count;i++)await p.locator('.gacha-reveal-card').click();
  await p.locator('.gacha-reveal-summary').waitFor();
  await p.waitForFunction(()=>[...document.querySelectorAll('.gacha-reveal-summary .equipment-card-art img')].every(i=>i.complete&&i.naturalWidth>0&&i.getBoundingClientRect().width>=50&&i.getBoundingClientRect().height>=50));
  await p.waitForFunction(()=>[...document.querySelectorAll('.gacha-reveal-summary .equipment-card-icon')].every(n=>n.getBoundingClientRect().width>=79.9&&n.getBoundingClientRect().height>=79.9));
  const frames=await p.locator('.gacha-reveal-summary .equipment-card-icon').evaluateAll(ns=>ns.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
  for(const frame of frames)assert.ok(frame.w>=79.9&&frame.h>=79.9,JSON.stringify(frame));
  await p.screenshot({path:out+`/summary-${count}.png`});
  assert.equal(await p.locator('.gacha-reveal-summary .item-card').count(),count);
  await p.locator('#btn-gacha-reveal-close').click();await p.locator('.gacha-reveal-overlay').waitFor({state:'detached'});
 }
 await p.evaluate(()=>latestQA.gacha('items'));const before=await p.evaluate(()=>({n:latestQA.state().ownedEquips.length,g:latestQA.state().player.gold}));
 await p.locator('#btn-gacha-1').click();
 const chest=p.locator('.equipment-gacha-summon');
 await chest.waitFor();
 // Observe real phase mutations, rather than accepting any final timer outcome.
 await p.evaluate(()=>{window.chestPhases=['falling'];new MutationObserver(()=>{const n=document.querySelector('.equipment-gacha-summon');if(n)window.chestPhases.push(n.dataset.phase);}).observe(document.querySelector('.equipment-gacha-summon'),{attributes:true,attributeFilter:['data-phase']});});
 await p.locator('.equipment-gacha-summon[data-phase="landed"]').waitFor();await p.screenshot({path:out+'/landed.png'});
 await p.locator('.equipment-gacha-summon[data-phase="opening"]').waitFor();await p.waitForTimeout(280);await p.screenshot({path:out+'/opening.png'});
 await p.locator('.equipment-gacha-summon[data-phase="flash"]').waitFor();await p.waitForTimeout(140);await p.screenshot({path:out+'/flash.png'});
 await chest.waitFor({state:'detached'});assert.deepEqual(await p.evaluate(()=>window.chestPhases),['falling','landed','opening','flash']);
 await finish(1);assert.equal(await p.evaluate(()=>latestQA.state().ownedEquips.length),before.n+1);
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>latestQA.gacha('christmas-items'));const owned=await p.evaluate(()=>latestQA.state().ownedEquips.length);
 await p.locator('#btn-christmas-gacha-13').click();await chest.waitFor();await p.locator('.skin-gacha-skip').click();await finish(13);await p.waitForTimeout(2400);assert.equal(await p.locator('.gacha-reveal-overlay').count(),0);assert.equal(await p.evaluate(()=>latestQA.state().ownedEquips.length),owned+13);
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>latestQA.gacha('items'));await p.locator('#btn-gacha-1').click();await p.locator('.gacha-reveal-overlay').waitFor();assert.equal(await chest.count(),0);await finish(1);
 assert.deepEqual(errors,[]);console.log('PASS: drop -> land -> open -> flash -> existing cards/summary; Christmas thirteen-pull skip once; reduced motion; no duplicate rewards');
}finally{await b.close();}
