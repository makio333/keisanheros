import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {homedir,tmpdir} from 'node:os';
import path from 'node:path';
import {startLocalAccountDemo} from '../server/local-account-demo.mjs';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const directory=await mkdtemp(path.join(tmpdir(),'legend-game-account-fixture-')),out=path.join(tmpdir(),'legend-account-browser');await mkdir(out,{recursive:true});
const demo=await startLocalAccountDemo({directory,port:0,mockLine:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],external=[],firebase=[];
try{
  async function capture(page,name){
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    assert.equal(await page.locator('.account-mock-notice').count(),1);
    await page.screenshot({path:path.join(out,name)});
  }
  async function newContext(){
    const context=await browser.newContext({serviceWorkers:'block'});
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(!['127.0.0.1','localhost'].includes(url.hostname)){external.push(url.href);return route.fulfill({status:200,body:''});}
      if(url.pathname.includes('firebase_init'))firebase.push(url.href);
      if(url.pathname==='/game.js'){
        const response=await route.fetch();return route.fulfill({response,body:await response.text()+`
          window.accountGameQA={slots:()=>listSaveSlots().map(s=>s.key),load:key=>loadSlot(key),save:()=>save(true),title:()=>showScreen('screen-title'),ticketChecking:()=>raidTicketChecking};`});
      }
      return route.continue();
    });
    return context;
  }
  async function open(context){
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
    await page.goto(demo.url);await page.locator('#btn-account-login').waitFor();return page;
  }
  async function signIn(page){
    await page.locator('#btn-account-login').click();await page.waitForFunction(()=>!!window.accountGameQA || !!window.__dbg);
    assert.equal(await page.evaluate(()=>!!window.accountGameQA),true,JSON.stringify(await page.evaluate(()=>({url:location.href,gameReady:!!window.__dbg,accountReady:!!window.AccountSession,serviceWorker:!!navigator.serviceWorker?.controller,gate:!!document.querySelector('.account-login-gate')}))));
    await page.locator('#btn-boot-start').waitFor({state:'visible',timeout:25000});
    const rect=await page.locator('#btn-boot-start').boundingBox();await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
    await page.locator('#boot-loader-screen').waitFor({state:'hidden'});
  }
  const context=await newContext();
  await context.addInitScript(()=>{if(!localStorage.getItem('typing_rpg_save_v3::unclaimed-fixture'))localStorage.setItem('typing_rpg_save_v3::unclaimed-fixture',JSON.stringify({playerName:'unclaimed-fixture',player:{gold:987}}));});
  const page=await open(context);
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);await capture(page,`login-${viewport.width}.png`);
    const rect=await page.locator('.account-login-panel').boundingBox();assert.ok(rect.x>=0 && rect.x+rect.width<=viewport.width && rect.y>=0 && rect.y+rect.height<=viewport.height);
  }
  await page.setViewportSize({width:1280,height:900});await signIn(page);
  assert.deepEqual(await page.evaluate(()=>window.accountGameQA.slots()),[],'unclaimed local data is not auto-linked');
  for(let i=1;i<=3;i++){
    await page.locator('#btn-newgame').click();await page.locator('#new-save-name').fill(`fixture-${i}`);await page.locator('#btn-new-save-start').click();
    await page.locator('#screen-intro.active').waitFor();await page.locator('#btn-intro-assist').click();
    await page.locator('#screen-home.active').waitFor();await page.waitForFunction(()=>!window.accountGameQA.ticketChecking());
    if(await page.locator('#btn-raid-ticket-ok').count())await page.locator('#btn-raid-ticket-ok').click();
    await page.locator('#btn-menu').click();await page.locator('#btn-menu-save-title').click();
    await page.locator('.challenge-print-suggestion [data-save]').click();
    await page.locator('#screen-title.active').waitFor();await page.evaluate(()=>window.AccountSession.flush());
    const diagnostics=await page.evaluate(async()=>({summary:window.AccountSession.summary,slots:window.accountGameQA.slots(),server:await(await fetch('/api/account')).json(),text:document.getElementById('account-save-count').outerHTML}));
    diagnostics.rows=await demo.db.transaction(tx=>diagnostics.slots.map(key=>tx.getSave(key)));
    assert.equal(await page.locator('#account-save-count').textContent(),`プレイヤー ${i} / 3`,JSON.stringify(diagnostics));
  }
  const aKeys=await page.evaluate(()=>window.accountGameQA.slots());assert.equal(aKeys.length,3);assert.equal(aKeys.includes('typing_rpg_save_v3::unclaimed-fixture'),false);
  await page.locator('#btn-newgame').click();await page.locator('#new-save-name').fill('fixture-child-4');await page.locator('#btn-new-save-start').click();
  await page.locator('.confirm-overlay').waitFor();assert.ok((await page.locator('.confirm-message').textContent()).includes('いっぱい'));
  assert.equal(await page.locator('.confirm-actions button').count(),1);
  await capture(page,'limit-three.png');await page.locator('#btn-confirm-no').click();await page.locator('#btn-new-save-back').click();
  await page.setViewportSize({width:390,height:844});await capture(page,'title-three-mobile.png');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  await page.locator('#btn-goto-admin').click();
  const parentPasscode=await page.evaluate(()=>{const date=new Date();return String(date.getMonth()+1).padStart(2,'0')+String(date.getDate()).padStart(2,'0');});
  await page.locator('#admin-password-input').fill(parentPasscode);await page.locator('#btn-admin-password-submit').click();
  await page.locator('#admin-tab-btn-account').click();
  await page.locator('#btn-account-logout').click();await page.locator('#btn-account-login').waitFor();
  await demo.fixtureSubject('local-fixture-purchaser-2');await signIn(page);
  assert.deepEqual(await page.evaluate(()=>window.accountGameQA.slots()),[],'another LINE account cannot see first account saves');
  assert.equal(await page.evaluate(keys=>keys.every(key=>localStorage.getItem(key)!==null),aKeys),true,'logout/switch retains old local snapshots');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('typing_rpg_save_v3::unclaimed-fixture')).player.gold),987);
  await demo.fixtureSubject('local-fixture-purchaser-1');
  const device2=await newContext(),p2=await open(device2);await signIn(p2);
  await p2.waitForFunction(()=>window.accountGameQA.slots().length===3);
  assert.deepEqual((await p2.evaluate(()=>window.accountGameQA.slots())).sort(),aKeys.sort(),'new device restores all three profiles');
  const device3=await newContext(),p3=await open(device3);await signIn(p3);await p3.waitForFunction(()=>window.accountGameQA.slots().length===3);
  const key=aKeys[0];
  await p2.evaluate(async key=>{const current=window.AccountSession.initialSlots.find(s=>s.slotKey===key).gameState;await window.AccountSession.saveSlot(key,{...current,player:{...current.player,gold:456}});},key);
  const conflict=await p3.evaluate(async key=>{const current=window.AccountSession.initialSlots.find(s=>s.slotKey===key).gameState;try{await window.AccountSession.saveSlot(key,{...current,player:{...current.player,gold:999}});return null;}catch(error){return error.message;}},key);
  assert.equal(conflict,'save_revision_conflict');
  assert.equal(await p3.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('legend-account-conflict::'))),true,'conflicting unsent snapshot is retained');
  const session=(await device2.cookies()).find(cookie=>cookie.name==='legend-local-session').value;
  assert.equal((await demo.service.readSave(session,key)).gameState.player.gold,456,'conflict does not overwrite the newer server version');
  await capture(p3,'revision-conflict.png');
  assert.deepEqual(firebase,[],'account mode never imports the globally shared Firebase save adapter');
  assert.deepEqual(errors,[]);
  await writeFile(path.join(out,'report.json'),JSON.stringify({checks:['mock LINE login','3 real player creation flows','fourth denied','unclaimed local data preserved','account isolation','new-device restore','revision conflict backup'],errors,firebase,externalRequests:external,limits:['LINE/payment are local fixtures.','Real legacy ownership proof is deliberately unavailable.','Account mode does not yet provide shared raid/admin cloud APIs.']},null,2));
  console.log(`PASS: actual game login -> three children -> cap -> account switch -> new-device restore -> revision conflict. Local fixtures only. Screenshots: ${out}`);
}finally{await browser.close();await demo.close();await rm(directory,{recursive:true,force:true});}
