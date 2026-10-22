import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,readFile} from 'node:fs/promises';
import {tmpdir,homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {createAccountSaveHandler} from '../server/account-saves-http.mjs';
import {createLegacyFileImporter} from '../server/legacy-file-import.mjs';
import {createLegacyFileHandler} from '../server/legacy-file-http.mjs';
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const directory=await mkdtemp(path.join(tmpdir(),'migration-file-browser-')),store=await openLocalAccountStore(directory);
const out=path.join(tmpdir(),'legend-migration-file-browser');await mkdir(out,{recursive:true});
const rows=Array.from({length:3},(_,i)=>({documentId:'child-'+i,gameState:{playerName:'勇者'+i,player:{lvl:i+5,gold:1234}}}));
let handler;
const vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),server:{host:'127.0.0.1',port:0},plugins:[{name:'file-test',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 if(req.url==='/__file_fixture'){
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><main style="max-width:600px;padding:16px;margin:auto"><div id="export"></div><div id="import"></div></main><script type="module">import "/style.css";import {mountLegacyExport,mountLegacyFileImport} from "/legacy_file_ui.js";import {createAccountTransport} from "/account_client.js";mountLegacyExport(document.getElementById("export"),{sourceProject:"old-facility",readSaves:async()=>'+JSON.stringify(rows)+'});mountLegacyFileImport(document.getElementById("import"),await createAccountTransport());</script>');return;
 }
 if(req.url.startsWith('/api/')){req.headers.cookie||='legend-local-session=facility';if(await handler(req,res))return;}
 next();
});}}]});
let browser;
try{
 await store.transaction(tx=>{tx.putAccount({id:'facility'});tx.putSession('facility',{accountId:'facility',expiresAt:Date.now()+600000});});
 const service=createAccountSaveService({store,sessions:store.sessions,fileMigrationAccountId:'facility'});
 await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
 const saves=createAccountSaveHandler({service,origin}),files=createLegacyFileHandler({origin,importer:createLegacyFileImporter({store,sessions:store.sessions,accountId:'facility',sourceProject:'old-facility'})});
 handler=async(req,res)=>await files(req,res)||await saves(req,res);
 browser=await chromium.launch({channel:'chrome',headless:true});
 let payload;
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block',acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',route=>route.fulfill({body:''}));await page.goto(origin+'/__file_fixture');
  await page.locator('#legacy-import-file').waitFor();
  assert.equal(await page.getByRole('button',{name:'JSONファイルを保存する'}).count(),0);
  assert.equal(await page.getByRole('button',{name:'この施設のアカウントへ取り込む'}).count(),0);
  await page.getByRole('button',{name:'全員分の引っ越しファイルを作る'}).click();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'JSONファイルを保存する'}).click();
  const download=await downloadPromise;payload=await readFile(await download.path());assert.equal(JSON.parse(payload).saves.length,3);
  await page.locator('#legacy-import-file').setInputFiles({name:'move.json',mimeType:'application/json',buffer:payload});
  await page.getByRole('button',{name:'この施設のアカウントへ取り込む'}).waitFor();
  if(width===390)assert.equal((await service.listSaves('facility')).length,0,'preview must not write');
  await page.getByRole('button',{name:'この施設のアカウントへ取り込む'}).click();await page.getByRole('button',{name:'セーブ一覧へ進む'}).waitFor();
  assert.equal((await service.listSaves('facility')).length,3);assert.equal((await service.summary('facility')).facilityAccess,true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(out,width+'.png'),fullPage:true});assert.deepEqual(errors,[]);await page.close();
 }
 const denied=await fetch(origin+'/api/legacy/import-file',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:JSON.stringify({file:JSON.parse(payload),apply:true})});assert.equal(denied.status,403);
 await new Promise((resolve,reject)=>{const child=spawn('node',['scripts/run-web-skill-client.mjs','--url',origin+'/__file_fixture','--actions-json','{"steps":[{"buttons":[],"frames":1}]}','--iterations','1','--pause-ms','100','--screenshot-dir',path.join(out,'skill')],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Skill failed')));});
 console.log('PASS: export download -> file upload -> preview -> free facility import on desktop/mobile; duplicate prevention, CSRF, no overflow/errors. '+out);
}finally{await browser?.close();await vite.close();await store.close();await rm(directory,{recursive:true,force:true});}
