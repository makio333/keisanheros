import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir,homedir} from 'node:os';
import path from 'node:path';
import {startLocalAccountDemo} from '../server/local-account-demo.mjs';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const directory=await mkdtemp(path.join(tmpdir(),'legend-game-connection-')),out=path.join(tmpdir(),'legend-game-connection-browser');await mkdir(out,{recursive:true});
const demo=await startLocalAccountDemo({directory,port:0,mockLine:true}),browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],firebase=[],requests=[];
try{
  async function login(){
    const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(!['127.0.0.1','localhost'].includes(url.hostname))return route.fulfill({status:200,body:''});
      if(url.pathname.includes('firebase_init'))firebase.push(url.href);
      if(url.pathname==='/api/game')requests.push(route.request().postDataJSON());
      if(url.pathname==='/game.js'){
        const response=await route.fetch();return route.fulfill({response,body:await response.text()+`
          window.connectionQA={state:name=>newGameState(name,'ai_hero_spellblade'),
            async load(key){document.getElementById('boot-loader-screen')?.remove();document.getElementById('title-white-fade')?.remove();await new Promise(resolve=>syncCloudSaves(()=>resolve()));if(!loadSlot(key))throw Error('missing fixture');showHome();},
            admin(){showAdmin();},selection:showLoadSaveScreen,loadOnly:loadSlot,home:showHome,data:()=>({gold:G.player.gold,tickets:G.raidTickets,ticketChecking:raidTicketChecking,raid:getRaidData(),status:raidSyncStatus}),
            async damage(damage){const progress=raidPlayerProgress();progress.participated=true;progress.participationAt=Date.now();progress.pendingEvents.push({id:crypto.randomUUID(),bossId:progress.bossId,damage,createdAt:Date.now(),fightStartedAt:Date.now()});return syncRaidState();},
            async event(){const state=eventRaidState('kanji');state.pendingBest={...eventRaidProfile(7),bestKills:7,participationDay:new Date().toISOString().slice(0,10),runs:[{id:'fixture-event-run',kills:7,finishedAt:Date.now()}]};await syncEventRaidRecord('kanji');await showEventRaidMenu('','kanji');}
          };`});
      }
      return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(demo.url);await page.locator('#btn-account-login').click();await page.waitForFunction(()=>!!window.connectionQA);return {context,page};
  }
  async function shot(page,name){
    await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{}))));
    await page.screenshot({path:path.join(out,name)});
  }
  const idA=await demo.fixtureSubject('local-fixture-purchaser-1'),a=await login();
  const game=await a.page.evaluate(()=>window.connectionQA.state('fixture-a'));game.player.gold=100;
  const seedA='a'.repeat(64);await demo.db.sessions.create(seedA,{accountId:idA,expiresAt:Date.now()+86400000});
  const saveA=await demo.service.createSave(seedA,{name:'fixture-a',gameState:game});
  const idB=await demo.fixtureSubject('local-fixture-purchaser-2'),b=await login(),seedB='b'.repeat(64);
  await demo.db.sessions.create(seedB,{accountId:idB,expiresAt:Date.now()+86400000});
  const saveB=await demo.service.createSave(seedB,{name:'fixture-b',gameState:{...game,playerName:'fixture-b'}});
  await a.page.evaluate(key=>window.connectionQA.load(key),saveA.key);await b.page.evaluate(key=>window.connectionQA.load(key),saveB.key);
  for(const page of [a.page,b.page]){
    await page.waitForFunction(()=>!window.connectionQA.data().ticketChecking);await page.locator('#btn-raid-ticket-ok').click();
    assert.equal((await page.evaluate(()=>window.connectionQA.data())).tickets,1);
    await page.locator('#hotspot-raid-boss').click();await page.waitForFunction(()=>window.connectionQA.data().status==='ready');
    assert.equal(await page.locator('#btn-raid-challenge').isEnabled(),true);
  }
  assert.equal(await a.page.evaluate(()=>window.connectionQA.damage(120)),true);
  await b.page.waitForFunction(()=>window.connectionQA.data().raid.totalDamage===120);
  await b.page.waitForFunction(()=>document.getElementById('raid-boss-damage').textContent.includes('880'));
  await shot(b.page,'shared-hp.png');
  for(const page of [a.page,b.page])await page.locator('#screen-raid-boss .window-close-btn').click();
  await a.page.evaluate(()=>window.connectionQA.admin());await a.page.locator('#admin-tab-btn-tools').click();
  await a.page.waitForFunction(()=>document.getElementById('admin-gift-target-list').textContent.includes('管理者の権限'));
  assert.equal(await a.page.locator('#btn-admin-gift-send').isDisabled(),true);
  const denied=await a.page.evaluate(async key=>{const res=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api:'AdminGiftAPI',method:'send',args:[[{slotKey:key}],{gold:999}],roles:['admin']})});return res.status;},saveB.key);
  assert.equal(denied,403);await shot(a.page,'admin-denied.png');
  await demo.db.transaction(tx=>tx.putAccount({...tx.getAccount(idA),roles:['admin']}));
  await a.page.locator('#admin-tab-btn-tools').click();await a.page.locator('#admin-gift-target-list input[data-name="fixture-b"]').waitFor();
  await a.page.locator('#admin-gift-target-list input[data-name="fixture-b"]').check();await a.page.locator('#admin-gift-gold').fill('125');
  await a.page.locator('.admin-gift-item-select').first().selectOption('ticket:raid-ticket');await a.page.locator('.admin-gift-item-count').first().fill('2');
  await a.page.locator('#btn-admin-gift-send').click();await a.page.waitForFunction(()=>document.getElementById('admin-gift-status').dataset.kind==='success');
  await shot(a.page,'admin-gift-sent.png');
  const isolation=await a.page.evaluate(async ({foreign,owner})=>{
    const list=await (await fetch('/api/saves?ownerAccountId='+owner)).json();
    const direct=await fetch('/api/saves/'+encodeURIComponent(foreign));
    return {keys:list.map(row=>row.key),status:direct.status,owns:window.AccountSession.owns(foreign),loaded:window.connectionQA.loadOnly(foreign),cached:localStorage.getItem(foreign)};
  },{foreign:saveB.key,owner:idB});
  assert.deepEqual(isolation,{keys:[saveA.key],status:404,owns:false,loaded:false,cached:null});
  await a.page.evaluate(()=>window.connectionQA.selection());
  await a.page.locator('#screen-load-save .btn-save-select').waitFor();
  assert.equal(await a.page.locator('#screen-load-save .btn-save-select').count(),1);
  const selection=await a.page.locator('#screen-load-save').textContent();
  assert.ok(selection.includes('fixture-a'));assert.equal(selection.includes('fixture-b'),false);
  await shot(a.page,'admin-own-saves-only.png');
  const before=await b.page.evaluate(()=>window.connectionQA.data());
  await b.page.evaluate(()=>window.connectionQA.home());await b.page.locator('#btn-admin-gift-notice-ok').waitFor();
  assert.equal((await b.page.evaluate(()=>window.connectionQA.data())).gold,before.gold,'preview does not grant rewards');
  await shot(b.page,'pending-gift.png');await b.page.locator('#btn-admin-gift-notice-ok').click();
  await b.page.waitForFunction(()=>!document.querySelector('.admin-gift-notice-overlay'));await b.page.evaluate(()=>window.AccountSession.flush());
  const after=await b.page.evaluate(()=>window.connectionQA.data());assert.equal(after.gold,before.gold+125);assert.equal(after.tickets,before.tickets+2);
  assert.equal((await demo.service.readSave(seedB,saveB.key)).gameState.player.gold,after.gold);
  assert.equal((await b.page.evaluate(()=>window.AdminGiftAPI.fetchPending(window.AccountSession.initialSlots[0]?.slotKey||Object.keys(localStorage).find(k=>k.startsWith('typing_rpg_save_v3::'))))).length,0);
  await b.page.evaluate(()=>window.connectionQA.event());await b.page.waitForFunction(()=>document.getElementById('event-raid-sync-status').textContent.includes('同期しました'));
  assert.ok((await b.page.locator('#event-raid-ranking-list').textContent()).includes('fixture-b'));await shot(b.page,'event-ranking.png');
  assert.deepEqual(errors,[]);assert.deepEqual(firebase,[]);
  await writeFile(path.join(out,'report.json'),JSON.stringify({checks:['two purchaser sessions','shared raid HP refresh','non-admin denied in UI and HTTP','fixture-only server admin role','existing gift UI send/preview/claim/save','event ranking via actual game flow'],errors,firebase,methods:[...new Set(requests.map(r=>r.api+'.'+r.method))],limits:['No live LINE, payment, Firebase or real child/admin data.','Existing reward and settlement rules reused unchanged.']},null,2));
  console.log(`PASS: actual account-mode game raid HP sharing, admin denial, admin own-only save selection/list/direct access, existing gift send/receive UI and event rankings. ${out}`);
}finally{await browser.close();await demo.close();await rm(directory,{recursive:true,force:true});}
