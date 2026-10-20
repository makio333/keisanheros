import assert from 'node:assert/strict';
import {homedir, tmpdir} from 'node:os';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out=path.join(tmpdir(),'keisanheros-halloween-exchange');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  await context.route('**/firebase_init.js*',route=>route.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'}));
  await context.route('**/game.js*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+`
      window.exchangeQA={setup(){G=newGameState('交換の確認用','ai_hero_spellblade');currentSlotKey='qa-halloween-exchange';G.halloweenCandy=260;document.getElementById('boot-loader-screen')?.remove();showScreen('screen-home');showHalloweenMenu('exchange');},state:()=>G};`});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5178/');
  await page.waitForFunction(()=>!!window.exchangeQA);await page.evaluate(()=>window.exchangeQA.setup());
  const staff=()=>page.locator('[data-exchange="halloween_lantern_staff"]');
  const confirm=()=>page.locator('.halloween-exchange-confirm [data-confirm]');
  const cancel=()=>page.locator('.halloween-exchange-confirm [data-cancel]');
  await staff().click();await page.waitForTimeout(350);
  const topmost=await confirm().evaluate(button=>{
    const rect=button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2));
  });
  assert.ok(topmost,'confirm button receives pointer input above the exchange menu');
  await page.screenshot({path:path.join(out,'desktop-confirm.png')});
  await cancel().click();assert.equal((await page.evaluate(()=>window.exchangeQA.state())).halloweenCandy,260);
  for(let i=1;i<=2;i++){
    await staff().click();await confirm().click();
    const state=await page.evaluate(()=>window.exchangeQA.state());
    assert.equal(state.halloweenCandy,260-80*i);
    const copies=state.ownedEquips.filter(e=>e.id==='halloween_lantern_staff');
    assert.equal(copies.length,i);assert.equal(new Set(copies.map(e=>e.uid)).size,i);
    assert.ok(await staff().isEnabled(),'equipment remains exchangeable after acquisition');
  }
  await page.setViewportSize({width:390,height:844});
  await staff().click();await page.waitForTimeout(350);
  await page.screenshot({path:path.join(out,'mobile-confirm.png')});
  await cancel().click();
  await page.locator('[data-exchange="halloween_festival_king"]').click();await confirm().click();
  assert.equal((await page.evaluate(()=>window.exchangeQA.state())).halloweenCandy,0);
  assert.ok(await page.locator('[data-exchange="halloween_festival_king"]').isDisabled(),'cosmetics remain one-time exchanges');
  assert.ok(await staff().isDisabled(),'insufficient candy disables equipment exchange');
  assert.deepEqual(errors,[]);
  console.log('PASS: clickable foreground confirmation, cancel, repeated charged equipment copies, cosmetics/insufficient funds, desktop/mobile. '+out);
} finally {await browser.close();}
