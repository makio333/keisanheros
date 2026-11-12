import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
import {buildLegacySaveFile} from '../legacy_save_file.js';
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const out=path.join(tmpdir(),'legend-private-migration-browser');await mkdir(out,{recursive:true});
const modules={
 'firebase/app':'export const initializeApp=()=>({});',
 'firebase/auth':`const auth={currentUser:null},listeners=[];const update=user=>{auth.currentUser=user;for(const cb of listeners)cb(user);};export const getAuth=()=>auth;export class GoogleAuthProvider{providerId='google.com'};export class OAuthProvider{constructor(id){this.providerId=id;}setCustomParameters(params){this.customParameters=params;window.fixtureLineParams=params;}};export const linkWithPopup=async()=>{};export const onAuthStateChanged=(_a,cb)=>{listeners.push(cb);queueMicrotask(()=>cb(null));};export const signInWithPopup=async(_a,p)=>{update({uid:window.fixtureUid||'fixture-a',email:p.providerId==='oidc.line'?null:'fixture@example.test',emailVerified:p.providerId!=='oidc.line',getIdTokenResult:async()=>({claims:{firebase:{sign_in_provider:p.providerId}}})});};export const signInWithEmailAndPassword=async()=>{update({uid:'fixture-email',email:'email@example.test',emailVerified:false,getIdTokenResult:async()=>({claims:{firebase:{sign_in_provider:'password'}}})});};export const createUserWithEmailAndPassword=signInWithEmailAndPassword;export const sendEmailVerification=async()=>{};export const sendPasswordResetEmail=async()=>{};export const signOut=async()=>update(null);export const reload=async()=>{};`,
 'firebase/firestore':`const rows=new Map();export const getFirestore=()=>({});export const collection=(_db,...parts)=>parts.join('/');export const doc=collection;export const getDocsFromServer=async path=>{const docs=[...rows].filter(([key])=>key.startsWith(path+'/')).map(([key,value])=>({id:key.split('/').at(-1),data:()=>structuredClone(value)}));return {docs,size:docs.length};};export const runTransaction=async(_db,cb)=>{const pending=new Map();const result=await cb({get:async key=>({exists:()=>rows.has(key)}),set:(key,value)=>pending.set(key,structuredClone(value))});for(const [key,value] of pending)rows.set(key,value);return result;};window.fixtureRowCount=()=>rows.size;`,
};
modules['firebase/auth']+=`OAuthProvider.prototype.addScope=function(scope){if(scope!=='profile')throw Error('Unexpected scope');};export class EmailAuthProvider{static credential(email,password){return {email,password};}};export const linkWithCredential=async(user)=>({user});`;
const vite=await createServer({configFile:false,publicDir:false,define:{'import.meta.env.VITE_LINE_OIDC_ENABLED':'"1"'},server:{host:'127.0.0.1',port:0},plugins:[{name:'offline-firebase-fixture',enforce:'pre',resolveId(id){if(modules[id])return '\0fixture:'+id;},load(id){if(id.startsWith('\0fixture:'))return modules[id.slice(9)];}}]});
await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
const browser=await chromium.launch({channel:'chrome',headless:true});
const file=buildLegacySaveFile('fixture-old',Array.from({length:40},(_,i)=>({documentId:'child-'+i,gameState:{playerName:'模擬勇者'+i,player:{lvl:i+1,gold:123},ownedEquips:[{id:'w1',uid:1}]}})));
try{
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:900},...(width===390?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{}),serviceWorkers:'block',acceptDownloads:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.route('https://**',route=>route.abort());
  await page.goto(origin+'/save-migration.html');await page.locator('#migration-google').waitFor();
  await page.screenshot({path:path.join(out,'login-'+width+'.png'),fullPage:true});
  await page.locator('#migration-google').click();await page.locator('#migration-json').waitFor();
  assert.equal(await page.locator('#migration-user').textContent(),'Googleでログイン中：fixture@example.test');
  await page.locator('#migration-link-email').fill('linked@example.test');await page.locator('#migration-link-password').fill('fixture-password');await page.getByRole('button',{name:'メールログインを追加',exact:true}).click();await page.getByText('同じ保存先にメールログインを追加しました。',{exact:true}).waitFor();
  await page.locator('#migration-json').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from('\uFEFF'+JSON.stringify(file))});
  await page.locator('#migration-apply').waitFor();assert.match(await page.locator('#migration-preview').textContent(),/新規40人/);assert.equal(await page.evaluate(()=>window.fixtureRowCount()),0);
  assert.equal(await page.locator('#migration-progress').getAttribute('value'),'100');assert.match(await page.locator('#migration-loading-label').textContent(),/100%/);
  assert.equal(await page.locator('#migration-json').evaluate(input=>input.files[0]?.name),'fixture.json');
  await page.screenshot({path:path.join(out,'preview-'+width+'.png'),fullPage:true});
  await page.locator('#migration-apply').click();await page.getByText('40人を取り込みました。',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>window.fixtureRowCount()),40);assert.equal(await page.locator('#migration-saved li').count(),40);
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'バックアップJSONを保存（40人分）'}).click();
  const backup=JSON.parse(await readFile(await (await downloadPromise).path(),'utf8'));assert.deepEqual(backup.saves,file.saves);
  await page.locator('#migration-json').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file))});await page.locator('#migration-apply').waitFor();assert.match(await page.locator('#migration-preview').textContent(),/新規0人、取り込み済み40人/);
  await page.locator('#migration-logout').click();await page.locator('#migration-google').waitFor();assert.equal(await page.locator('#migration-saved li').count(),0);
  await page.locator('.line-login-help summary').click();await page.locator('#migration-line-browser').click();assert.equal(await page.evaluate(()=>window.fixtureLineParams.disable_auto_login),'true');await page.locator('#migration-logout').click();
  await page.evaluate(()=>window.fixtureLineParams=null);await page.locator('#migration-line').click();assert.equal(await page.evaluate(()=>window.fixtureLineParams?.disable_auto_login),width===390?'true':undefined);await page.getByText('40人分をこのアカウントに保管しています。',{exact:true}).waitFor();await page.locator('#migration-link-google').click();await page.getByText('同じ保存先にログイン方法を追加しました。',{exact:true}).waitFor();await page.locator('#migration-logout').click();
  await page.evaluate(()=>window.fixtureUid='fixture-b');await page.locator('#migration-google').click();await page.getByText('0人分をこのアカウントに保管しています。',{exact:true}).waitFor();
  await page.locator('#migration-logout').click();await page.locator('#migration-email').fill('fixture@example.test');await page.locator('#migration-password').fill('fixture-password');await page.getByRole('button',{name:'メールでログイン',exact:true}).click();await page.getByText('確認メールのリンクを開いてから',{exact:false}).waitFor();assert.equal(await page.locator('#migration-upload').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await context.close();
 }
 await new Promise((resolve,reject)=>{const child=spawn('node',['scripts/run-web-skill-client.mjs','--url',origin+'/save-migration.html','--actions-json','{"steps":[{"buttons":[],"frames":1}]}','--iterations','1','--pause-ms','100','--screenshot-dir',path.join(out,'skill')],{stdio:'inherit'});child.on('exit',code=>code===0?resolve():reject(Error('skill failed')));});
 console.log('PASS: desktop/mobile private migration, 40-save preview/import/export, duplicate skip, logout privacy, owner switch and email verification. Offline Firebase fixtures only. '+out);
}finally{await browser.close();await vite.close();}
