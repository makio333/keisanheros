import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
import {buildLegacySaveFile} from '../legacy_save_file.js';
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const out=path.join(tmpdir(),'legend-firebase-game');await mkdir(out,{recursive:true});
const rows=new Map();
const modules={
 'firebase/app':'export const initializeApp=()=>({});',
 'firebase/auth':`const auth={currentUser:null},listeners=[];const user=()=>({uid:window.fixtureUid||'fixture-a',email:null,emailVerified:false,getIdTokenResult:async()=>({claims:{firebase:{sign_in_provider:'oidc.line'}}})});const update=value=>{auth.currentUser=value;listeners.forEach(cb=>cb(value));};export const getAuth=()=>auth;export class GoogleAuthProvider{};export class OAuthProvider{};export class EmailAuthProvider{static credential(){return {};}};export const linkWithCredential=async()=>({user:auth.currentUser});export const linkWithPopup=async()=>{};export const onAuthStateChanged=(_a,cb)=>{listeners.push(cb);queueMicrotask(()=>cb(null));return ()=>{};};export const signInWithPopup=async()=>update(user());export const signInWithEmailAndPassword=signInWithPopup;export const createUserWithEmailAndPassword=signInWithPopup;export const sendEmailVerification=async()=>{};export const sendPasswordResetEmail=async()=>{};export const signOut=async()=>update(null);export const reload=async()=>{};`,
 'firebase/firestore':`export const getFirestore=()=>({});export const collection=(_db,...parts)=>parts.join('/');export const doc=collection;const read=async()=>new Map(await(await fetch('/fixture-db')).json());export const getDocsFromServer=async path=>{const rows=await read();const docs=[...rows].filter(([key])=>key.startsWith(path+'/')).map(([key,value])=>({id:key.split('/').at(-1),data:()=>value}));return {docs,size:docs.length};};export const runTransaction=async(_db,cb)=>{const rows=await read(),pending=[];const result=await cb({get:async key=>({exists:()=>rows.has(key),data:()=>rows.get(key)}),set:(key,value)=>pending.push([key,value])});await fetch('/fixture-db',{method:'POST',body:JSON.stringify(pending)});return result;};`,
};
const vite=await createServer({define:{'import.meta.env.VITE_FIREBASE_GAME':'"1"','import.meta.env.VITE_ACCOUNT_BACKEND':'"0"','import.meta.env.VITE_STRIPE_CHECKOUT':'"0"','import.meta.env.VITE_LINE_OIDC_ENABLED':'"1"'},server:{host:'127.0.0.1',port:0},plugins:[{name:'firebase-game-fixture',enforce:'pre',resolveId(id){if(modules[id])return '\0fixture:'+id;},load(id){if(id.startsWith('\0fixture:'))return modules[id.slice(9)];},configureServer(server){server.middlewares.use('/fixture-db',async(req,res)=>{if(req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;for(const [key,value] of JSON.parse(body))rows.set(key,value);}res.setHeader('Content-Type','application/json');res.end(JSON.stringify([...rows]));});}}]});
modules['firebase/auth']+=`OAuthProvider.prototype.addScope=function(scope){if(scope!=='profile')throw Error('Unexpected scope');};`;
await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];let activePage;
async function open(uid='fixture-a',width=1280){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});await context.addInitScript(uid=>window.fixtureUid=uid,uid);
 await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==origin)return route.fulfill({status:200,body:''});if(url.pathname==='/game.js'){const response=await route.fetch();return route.fulfill({response,body:await response.text()+`\nwindow.firebaseGameQA={slots:()=>listSaveSlots(),load:key=>loadSlot(key),save:()=>save(true),state:()=>G,newState:()=>newGameState('fixture'),home:()=>showHome()};`});}return route.continue();});
 const page=await context.newPage();activePage=page;page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());await page.goto(origin);await page.locator('#migration-line').waitFor();return {context,page};
}
async function enter(page){await page.locator('#firebase-enter-game').click();await page.waitForFunction(()=>!!window.firebaseGameQA);await page.locator('#btn-boot-start').waitFor({timeout:30000});const rect=await page.locator('#btn-boot-start').boundingBox();await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);await page.locator('#boot-loader-screen').waitFor({state:'hidden'});}
try{
 const {context,page}=await open();await page.screenshot({path:path.join(out,'login-desktop.png')});await page.locator('#migration-line').click();await page.locator('#firebase-enter-game').waitFor();await enter(page);
 const state=await page.evaluate(()=>window.firebaseGameQA.newState());
 await page.locator('#btn-firebase-account').click();await page.locator('#migration-upload').waitFor();
 const file=buildLegacySaveFile('fixture-old',Array.from({length:40},(_,i)=>({documentId:'child-'+i,gameState:{...structuredClone(state),playerName:'模擬勇者'+i,player:{...state.player,lvl:i+1,gold:123}}})));
 await page.locator('#migration-json').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file))});await page.locator('#migration-apply').waitFor();assert.equal(rows.size,0);await page.locator('#migration-apply').click();await page.getByText('40人を取り込みました。',{exact:false}).waitFor();assert.equal(rows.size,80);
 await page.locator('#firebase-enter-game').click();await page.locator('#migration-line').waitFor();await page.locator('#migration-line').click();await page.locator('#firebase-enter-game').waitFor();await enter(page);
 await page.waitForFunction(()=>window.firebaseGameQA.slots().length===40);await page.locator('#btn-continue').click();assert.equal(await page.locator('#save-slot-list .save-slot-card').count(),40);
 const keys=await page.evaluate(()=>window.firebaseGameQA.slots().map(s=>s.key));
 await page.evaluate(async key=>{window.firebaseGameQA.load(key);window.firebaseGameQA.home();window.firebaseGameQA.state().player.gold=456;window.firebaseGameQA.save();await window.AccountSession.flush();},keys[0]);await page.locator('#screen-home.active').waitFor();
 await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
 assert.match(await page.locator('#town-map > .town-map-img').evaluate(el=>getComputedStyle(el).filter),/saturate\(0\.72\)/);
 assert.equal(await page.locator('#town-map .town-hotspot').first().evaluate(el=>getComputedStyle(el).filter),'none');
 await page.screenshot({path:path.join(out,'game-loaded.png')});
 const training=await page.locator('#hotspot-training').boundingBox();await page.mouse.click(training.x+training.width/2,training.y+8);await page.locator('#screen-skills.active').waitFor();await page.evaluate(()=>window.firebaseGameQA.home());
 await page.locator('#hotspot-weapon-shop .hotspot-tag').click();await page.locator('#screen-weapon-shop.active').waitFor();
 const beforeOwned=await page.evaluate(()=>({gold:window.firebaseGameQA.state().player.gold,equips:window.firebaseGameQA.state().ownedEquips.length}));
 await page.locator('#weapon-shop-list button[aria-label*="所持済み"]').first().click();await page.locator('.confirm-message').filter({hasText:'すでに もっているよ'}).waitFor();
 assert.deepEqual(await page.evaluate(()=>({gold:window.firebaseGameQA.state().player.gold,equips:window.firebaseGameQA.state().ownedEquips.length})),beforeOwned);await page.locator('#btn-confirm-no').click();await page.evaluate(()=>window.firebaseGameQA.home());
 for(const viewport of [{width:1280,height:900},{width:900,height:600},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
  const adventure=await page.locator('#hotspot-adventure').boundingBox();assert.ok(adventure.width>=260&&adventure.height>=64);assert.ok(adventure.y+adventure.height<=viewport.height);
  const tags=await page.locator('#town-map > .town-hotspot:not(#hotspot-halloween) > .hotspot-tag').evaluateAll(elements=>elements.map(el=>({height:el.getBoundingClientRect().height,width:el.clientWidth,scroll:el.scrollWidth,animation:getComputedStyle(el).animationName})));assert.ok(tags.every(tag=>tag.height>=56&&tag.scroll<=tag.width+2&&tag.animation==='none'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(viewport.width===390){const map=await page.locator('#town-map').boundingBox();assert.ok(map.y+map.height<adventure.y);await page.screenshot({path:path.join(out,'game-home-mobile.png')});}
 }
 await page.setViewportSize({width:1280,height:900});
 assert.equal(JSON.parse(rows.get('privateGame/fixture-a/saves/'+keys[0].split('::').at(-1)).gameData).player.gold,456);
 assert.equal(JSON.parse(rows.get('privateMigration/fixture-a/saves/'+keys[0].split('::').at(-1)).gameData).player.gold,123);
 const second=await open();await second.page.locator('#migration-line').click();await second.page.locator('#firebase-enter-game').waitFor();await enter(second.page);await second.page.waitForFunction(()=>window.firebaseGameQA.slots().length===40);assert.equal(await second.page.evaluate(key=>window.AccountSession.initialSlots.find(s=>s.slotKey===key).gameState.player.gold,keys[0]),456);
 const other=await open('fixture-b',390);await other.page.screenshot({path:path.join(out,'login-mobile.png')});assert.equal(await other.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await other.page.locator('#migration-line').click();await other.page.locator('#firebase-enter-game').waitFor();await enter(other.page);assert.equal(await other.page.evaluate(()=>window.firebaseGameQA.slots().length),0);assert.equal(await other.page.evaluate(()=>window.AccountSession.summary.saveLimit),3);
 await other.page.locator('#btn-goto-admin').click();const password=await other.page.evaluate(()=>{const d=new Date();return String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');});await other.page.locator('#admin-password-input').fill(password);await other.page.locator('#btn-admin-password-submit').click();await other.page.locator('#admin-tab-btn-firebase-account').click();await other.page.locator('#migration-json').waitFor();await other.page.locator('#btn-firebase-account-close').click();assert.equal(await other.page.locator('.firebase-game-gate').isVisible(),false);
 assert.deepEqual(errors,[]);await context.close();await second.context.close();await other.context.close();
 await new Promise((resolve,reject)=>{const child=spawn('node',['scripts/run-web-skill-client.mjs','--url',origin,'--actions-json','{"steps":[{"buttons":[],"frames":1}]}','--iterations','1','--pause-ms','100','--screenshot-dir',path.join(out,'skill')],{stdio:'inherit'});child.on('exit',code=>code===0?resolve():reject(Error('skill failed')));});
 console.log('PASS: actual game, 40 imports, playable save, persistent progress on another device, immutable originals, owner isolation and admin account navigation. '+out);
}catch(error){if(activePage){await activePage.screenshot({path:path.join(out,'failure.png')});console.log(await activePage.evaluate(()=>({status:document.getElementById('migration-status')?.textContent,elements:['migration-upload','migration-apply'].map(id=>{let el=document.getElementById(id),parents=[];while(el){parents.push({id:el.id,cls:el.className,hidden:el.hidden,display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility});el=el.parentElement;}return parents;})})));}console.log(errors);throw error;}finally{await browser.close();await vite.close();}
