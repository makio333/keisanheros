import assert from 'node:assert/strict';
import {chromium,webkit} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const browser=await (process.env.ENGINE==='webkit'?webkit.launch():chromium.launch({channel:'chrome'}));
try{
 const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage(),requests=[];
 // Generate valid original images in-browser, independently of the loader implementation.
 await p.goto('data:text/html,<html></html>');const png=await p.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,32,32);return canvas.toDataURL().split(',')[1];});
 let corrupt=true;
 await p.route('**/fixtures/*.png',async r=>{const name=new URL(r.request().url()).pathname;requests.push(name);await r.fulfill({contentType:'image/png',body:name.includes('bad')&&corrupt?Buffer.from('corrupted'):Buffer.from(png,'base64')});});
 await p.goto('http://127.0.0.1:5197/tests/fixtures/asset-boot.html');await p.waitForFunction(()=>assetBootState?.phase==='ready');assert.equal(requests.length,2);assert.equal(await p.evaluate(()=>assetBootState.done),2);
 await p.reload();await p.waitForFunction(()=>assetBootState?.phase==='ready');assert.equal(requests.length,2,'warm start must not download unchanged images');
 await p.evaluate(()=>fixtureStart(['fixtures/red.v2.png','fixtures/blue.v1.png']));assert.equal(requests.length,3);assert.equal(requests.at(-1),'/fixtures/red.v2.png');
 await p.evaluate(()=>fixtureStart(['fixtures/red.v2.png','fixtures/blue.v1.png','fixtures/bad.v1.png']));assert.equal(await p.evaluate(()=>assetBootState.phase),'error');assert.equal(await p.locator('#boot-start-area').isVisible(),false,'must not start with corrupt required image');
 corrupt=false;await p.locator('#boot-download-retry').click();await p.waitForFunction(()=>assetBootState.phase==='ready');assert.equal(requests.length,5,'retry must fetch only the failed image');
 assert.equal(await p.evaluate(async()=>Boolean(await GameMediaStore.get(location.origin+'/fixtures/red.v1.png'))),true,'updates preserve prior cached content');
 console.log(JSON.stringify({engine:process.env.ENGINE||'chrome',cold:2,warm:0,oneImageUpdate:1,corruptBlocksStart:true,retry:1,oldAssetsPreserved:true}));await c.close();
}finally{await browser.close();}
