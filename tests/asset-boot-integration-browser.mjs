import assert from 'node:assert/strict';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const b=await chromium.launch({channel:'chrome',headless:true});try {
const c=await b.newContext({serviceWorkers:'block',viewport:{width:1366,height:768}});const p=await c.newPage();let downloads=0;const errors=[];p.on('pageerror',e=>errors.push(e.message));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNwsAAAAASUVORK5CYII=','base64');
await p.route('**/*',r=>{
const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.fulfill({status:200,body:''});
if(r.request().resourceType()==='fetch'&& /\.(png|jpg|jpeg|webp|svg|mp3|m4a)(\?|$)/.test(u.pathname+u.search)){downloads++;return r.fulfill({contentType:u.pathname.includes('assets_audio/')?'audio/mp4':'image/png',body:png});}
return r.continue();});
await p.goto('http://127.0.0.1:5196/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready',{timeout:30000});
assert.equal(await p.evaluate(()=>!!window.latestQA),false);await p.screenshot({path:'/private/tmp/asset-boot-check/game-ready.png'});
const first=downloads;assert(first>0 && first<=12,'only startup assets preload');
await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready');assert.equal(downloads,first);
await p.locator('#btn-boot-start').click();await p.waitForFunction(()=>!document.getElementById('boot-loader-screen'));assert.equal(await p.locator('#screen-title').isVisible(),true);assert.deepEqual(errors,[]);
console.log(JSON.stringify({passed:true,initialDownloads:first,warmDownloads:downloads-first,titleVisible:true,errors}));
await c.close();}finally{await b.close();}
