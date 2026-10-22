import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir,homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {createAccountSaveHandler} from '../server/account-saves-http.mjs';
import {legacySnapshot,issueLegacyTransfer,createLegacyClaimVerifier,grantLegacyFacilityAccess} from '../server/legacy-migration.mjs';
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const directory=await mkdtemp(path.join(tmpdir(),'migration-browser-data-')),store=await openLocalAccountStore(directory);
const out=path.join(tmpdir(),'legend-migration-browser');await mkdir(out,{recursive:true});
const snapshot=legacySnapshot('old-game','old-hero',{gameData:JSON.stringify({playerName:'以前の勇者',player:{lvl:23,gold:4567},raidTickets:12})});
let handler;
const vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),server:{host:'127.0.0.1',port:0},plugins:[{
 name:'migration-test-fixture',configureServer(server){server.middlewares.use(async(req,res,next)=>{
   if(req.url==='/__migration_fixture'){
     res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><main style="max-width:520px;padding:16px;margin:auto"><div id="fixture"></div></main><script type="module">import "/style.css";import {createAccountTransport,appendLegacyMigrationControls} from "/account_client.js";const t=await createAccountTransport();appendLegacyMigrationControls(document.getElementById("fixture"),t);</script>');return;
   }
   if(req.url.startsWith('/api/')){req.headers.cookie||='legend-local-session=alice';if(await handler(req,res))return;}
   next();
 });}
}]});
let browser;
try{
 await store.transaction(tx=>{tx.putAccount({id:'alice'});tx.putSession('alice',{accountId:'alice',expiresAt:Date.now()+600000});});
 await grantLegacyFacilityAccess({store,accountId:'alice',sourceProject:'old-game',snapshots:[snapshot]});
 const transfer=await issueLegacyTransfer({store,accountId:'alice',snapshot});
 const service=createAccountSaveService({store,sessions:store.sessions,verifyLegacyClaim:createLegacyClaimVerifier()});
 assert.equal((await service.summary('alice')).facilityAccess,true);
 assert.equal((await service.summary('alice')).saveLimit,1);
 await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
 handler=createAccountSaveHandler({service,origin});
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
   const page=await browser.newPage({viewport,serviceWorkers:'block'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('https://**',route=>route.fulfill({body:''}));
   await page.goto(origin+'/__migration_fixture');await page.locator('#legacy-transfer-code').waitFor();
   assert.ok((await page.locator('.account-migration').textContent()).includes('alice'));
   await page.locator('#legacy-transfer-code').fill('bad');await page.locator('#btn-legacy-transfer').click();
   assert.ok((await page.locator('[role=status]').textContent()).includes('確認'));
   await page.locator('#legacy-transfer-code').fill(transfer.code);await page.locator('#btn-legacy-transfer').click();
   await page.getByRole('button',{name:'ゲームに戻る'}).waitFor();
   assert.ok((await page.locator('[role=status]').textContent()).includes('以前の勇者'));
   assert.equal(await page.locator('#legacy-transfer-code').inputValue(),'');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(out,viewport.width+'.png')});assert.deepEqual(errors,[]);await page.close();
 }
 assert.equal((await service.listSaves('alice')).length,1);
 assert.equal((await service.readSave('alice',snapshot.legacyKey)).gameState.player.gold,4567);
 await new Promise((resolve,reject)=>{const child=spawn('node',['scripts/run-web-skill-client.mjs','--url',origin+'/__migration_fixture','--actions-json','{"steps":[{"buttons":[],"frames":1}]}','--iterations','1','--pause-ms','100','--screenshot-dir',path.join(out,'skill')],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Skill failed')));});
 console.log('PASS: real local HTTP import, desktop/mobile UI, validation, full state, repeat import, no overflow/errors. '+out);
}finally{await browser?.close();await vite.close();await store.close();await rm(directory,{recursive:true,force:true});}
