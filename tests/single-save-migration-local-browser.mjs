import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {homedir} from 'node:os';
import {createSingleSaveMigrationLocalApi} from '../server/single-save-migration-local-api.mjs';
import {createSingleSaveMigrationLocalStore} from '../server/single-save-migration-local-store.mjs';
import {createSingleSaveMigrationPrototype} from '../server/single-save-migration-prototype.mjs';

const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const root=process.cwd(),sourceProject='old-game',accountId='browser-fixture-account',sessionId='browser-fixture-session';
const fixturePath=path.join(root,'tests/fixtures/single-save-migration-three-children.json');
const file=JSON.parse(await readFile(fixturePath,'utf8'));
const registry=new Map(file.saves.map(row=>[row.documentId,JSON.stringify(row.gameState)]));
const store=createSingleSaveMigrationLocalStore();
await store.transaction(tx=>{
  tx.putAccount({id:accountId,createdAt:1,facilityAccess:{kind:'legacy-migration',active:true,sourceProject,legacyKeys:[],saveLimit:3}});
  tx.putSession(sessionId,{accountId,expiresAt:Date.now()+60*60*1000});
});
const migration=createSingleSaveMigrationPrototype({store,sessions:store.sessions,sourceProject,
  authorizeMigration:async({accountId:id,sourceProject:project,documentId})=>id===accountId&&project===sourceProject&&registry.has(documentId),
  verifySelectedSource:async({sourceProject:project,payload})=>project===sourceProject&&registry.get(payload.documentId)===JSON.stringify(payload.gameState),
});
const origin='http://127.0.0.1:5187';
const api=createSingleSaveMigrationLocalApi({migration,sessionId,origin,destinationLabel:'合成QA移行先（3枠）',sourceProofConfigured:true,authorizationConfigured:true});
const publicPage=(await readFile(path.join(root,'single-save-migration-local.html'),'utf8'))
  .replace(/\s*<link rel="stylesheet"[^>]*>/,'')
  .replace(/\s*<script type="module"[^>]*><\/script>/,'');
const style=await readFile(path.join(root,'single-save-migration-local.css'),'utf8');
const parsers=[await readFile(path.join(root,'legacy_save_file.js'),'utf8'),await readFile(path.join(root,'legacy_transfer_file.js'),'utf8')]
  .map(source=>source.replace(/\bexport\s+(?=(?:const|function)\b)/g,''));
const productionUi=(await readFile(path.join(root,'single-save-migration-local.js'),'utf8')).replace(/^import .*;\s*$/gm,'');
const requests=[];
async function localApiCall(url,method,bodyText){
  const pathname=new URL(url,origin).pathname,body=bodyText?JSON.parse(bodyText):undefined;
  const request={method,url:pathname,headers:{host:'127.0.0.1:5187',origin,...(body?{'content-type':'application/json'}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(bodyText)yield Buffer.from(bodyText);}};
  const response={status:0,body:'',writeHead(status){this.status=status;},end(value=''){this.body=value;}};
  requests.push({url:pathname,method,body});
  await api(request,response);
  return {status:response.status,body:response.body?JSON.parse(response.body):null};
}

let browser;
try{browser=await chromium.launch({channel:'chrome',headless:true});}
catch(error){
  await store.close();
  if(/EPERM|SIGABRT|Target page, context or browser has been closed/.test(String(error?.message))){
    console.log('SKIP: native Chrome cannot start in this sandbox; API safeguards remain covered by the synthetic API test, but browser UI was not exercised.');
    process.exit(0);
  }
  throw error;
}
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.exposeFunction('__singleSaveApiCall',localApiCall);
  await page.setContent(publicPage,{waitUntil:'domcontentloaded'});
  await page.addStyleTag({content:style});
  await page.addScriptTag({content:`
    window.fetch=async(url,options={})=>{
      const result=await window.__singleSaveApiCall(String(url),options.method||'GET',options.body||null);
      return {ok:result.status>=200&&result.status<300,status:result.status,json:async()=>result.body};
    };
    ${parsers.join('\n')}
    ${productionUi}
  `});
  await page.locator('#save-file').setInputFiles(fixturePath);
  assert.equal(await page.locator('.child-choice').count(),3,'all children are listed locally');
  await page.locator('.child-choice').filter({hasText:'fixture-one'}).click();
  await page.locator('#preview-section').waitFor({state:'visible'});
  const firstPreview=requests.find(request=>request.url.endsWith('/preview'));
  assert.deepEqual(Object.keys(firstPreview.body).sort(),['documentId','gameState','sourceProject']);
  assert.equal(firstPreview.body.documentId,'child-one');
  assert.equal(JSON.stringify(firstPreview.body).includes('child-two'),false,'unselected children never reach the API');
  assert.equal(JSON.stringify(firstPreview.body).includes('raidData'),false,'rankings and global raid data stay local');
  const writesBeforeCancel=store.writeCount;
  await page.locator('#cancel-selection').click();
  await page.waitForFunction(()=>document.getElementById('preview-section').hidden);
  assert.equal(store.writeCount,writesBeforeCancel,'cancel only clears the in-memory preview token');
  assert.ok(requests.some(request=>request.url.endsWith('/cancel')));

  await page.locator('.child-choice').filter({hasText:'fixture-two'}).click();
  await page.locator('#continue-confirm').click();
  assert.equal(await page.locator('#confirm-dialog').evaluate(dialog=>dialog.open),true);
  assert.equal(await page.locator('#confirm-import').isDisabled(),true,'explicit one-child confirmation is required');
  await page.screenshot({path:'/private/tmp/single-save-migration-desktop.png',fullPage:true});
  await page.locator('#confirm-single').check();
  assert.equal(await page.locator('#confirm-import').isDisabled(),false);
  const previewCount=requests.filter(request=>request.url.endsWith('/preview')).length;
  await page.locator('#confirm-import').click();
  await page.getByText('合成ローカルAPIで1人分の移行を完了しました。',{exact:true}).waitFor();
  const commit=requests.filter(request=>request.url.endsWith('/commit')).at(-1);
  assert.deepEqual(Object.keys(commit.body).sort(),['confirm','previewId'],'confirmation sends only server preview ID');
  assert.equal(commit.body.confirm,true);
  assert.equal(requests.filter(request=>request.url.endsWith('/preview')).length,previewCount);
  const saves=await store.inspect(tx=>tx.listSaves(accountId));
  assert.equal(saves.length,1);assert.equal(saves[0].gameState.playerName,'fixture-two');
  assert.equal(saves[0].gameState.accountId,undefined);assert.equal(saves[0].gameState.ranking,undefined);assert.equal(saves[0].gameState.player.uid,undefined);
  assert.deepEqual(errors,[]);

  const mobile=await browser.newPage({viewport:{width:390,height:844}}),mobileErrors=[];
  mobile.on('pageerror',error=>mobileErrors.push(error.message));await mobile.exposeFunction('__singleSaveApiCall',localApiCall);
  await mobile.setContent(publicPage,{waitUntil:'domcontentloaded'});await mobile.addStyleTag({content:style});
  await mobile.addScriptTag({content:`window.fetch=async(url,options={})=>{const result=await window.__singleSaveApiCall(String(url),options.method||'GET',options.body||null);return {ok:result.status>=200&&result.status<300,status:result.status,json:async()=>result.body};};${parsers.join('\n')}\n${productionUi}`});
  await mobile.locator('#save-file').setInputFiles(fixturePath);await mobile.locator('.child-choice').filter({hasText:'fixture-three'}).click();
  await mobile.locator('#preview-section').waitFor({state:'visible'});
  const mobileLayout=await mobile.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].map(element=>({element,rect:element.getBoundingClientRect()})).filter(({element,rect})=>rect.width>innerWidth||rect.left<0||rect.right>innerWidth+1).slice(0,12).map(({element,rect})=>({tag:element.tagName,id:element.id,className:String(element.className),left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),scrollWidth:element.scrollWidth,overflow:getComputedStyle(element).overflow} ))}));
  assert.ok(mobileLayout.scrollWidth<=mobileLayout.innerWidth,`mobile layout stays within viewport: ${JSON.stringify(mobileLayout)}`);
  await mobile.screenshot({path:'/private/tmp/single-save-migration-mobile.png',fullPage:true});
  await mobile.locator('#cancel-selection').click();assert.deepEqual(mobileErrors,[]);await mobile.close();
  console.log('PASS: production local UI with in-process synthetic API, full-transfer fixture parsed locally, one-row preview, no-write cancel, confirm gate, token-only commit, protected fields excluded, desktop/mobile layout, no browser errors.');
}finally{await browser.close();await store.close();}
