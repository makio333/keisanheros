import {chromium,webkit} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QUALITY_OUT || '/private/tmp/runtime-media-original-quality';await mkdir(out,{recursive:true});const browser=await (process.env.ENGINE==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'chrome',headless:true}));
try{
 const c=await browser.newContext({viewport:{width:1366,height:900}});const p=await c.newPage();const errors=[],http=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)http.push({status:r.status(),url:r.url()});});p.on('dialog',d=>d.accept());
 const start=Date.now();await p.goto(process.env.QUALITY_URL || 'http://127.0.0.1:5196/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready',null,{timeout:180000});const coldMs=Date.now()-start,cold=await p.evaluate(()=>assetBootState);
 console.log(JSON.stringify({coldMs,cold}));await p.locator('#btn-boot-start').click();await p.locator('#btn-newgame').click();await p.waitForFunction(()=>document.getElementById('title-white-fade').classList.contains('hidden'));await p.waitForTimeout(100);
 const missing=async sel=>p.locator(sel+' img').evaluateAll(imgs=>imgs.filter(i=>i.getBoundingClientRect().width>0&&i.getAttribute('src')&&(!i.complete||!i.naturalWidth)).map(i=>i.getAttribute('src')));
 const registrationMissing=await missing('#screen-new-save');await p.screenshot({path:out+'/registration.png',timeout:10000});
 await p.locator('.hero-thumb-btn').last().click();await p.locator('#new-save-name').fill('表示確認');await p.locator('#btn-new-save-start').click();await p.locator('#btn-intro-sword').click();await p.locator('#screen-home').waitFor({state:'visible'});await p.waitForTimeout(1500);const homeMissing=await missing('#screen-home');await p.screenshot({path:out+'/home-immediate.png',timeout:10000});
 const checks=[];for(const [button,screen] of [['hotspot-item-shop','screen-item-shop'],['hotspot-status','screen-status'],['hotspot-gacha','screen-gacha']]){
  await p.locator('#'+button).click();await p.locator('#'+screen).waitFor({state:'visible'});await p.waitForTimeout(1500);checks.push({screen,missing:await missing('#'+screen)});await p.screenshot({path:out+'/'+screen+'.png',timeout:10000});
  if(screen==='screen-gacha'){
   await p.locator('#btn-gacha-tab-christmas-skins').click();
   await p.locator('#christmas-skin-gacha-section img').evaluateAll(imgs=>Promise.all(imgs.filter(i=>{const r=i.getBoundingClientRect();return r.top<innerHeight && r.bottom>0;}).map(i=>i.decode().catch(()=>{}))));
   const banner=await p.locator('#christmas-skin-gacha-section img').evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute('src'),width:i.naturalWidth,height:i.naturalHeight})));
   console.log('Original Christmas banner: 2116 x 743');
   if(!banner.some(i=>i.width===2116 && i.height===743))throw Error('Original Christmas banner resolution missing');
   if(banner.some(i=>i.src.startsWith('data:')))throw Error('Low resolution substituted image');
   await p.screenshot({path:out+'/christmas-skins.png',timeout:10000});
   await p.locator('#btn-gacha-tab-christmas-items').click();await p.waitForTimeout(1500);await p.screenshot({path:out+'/christmas-equipment.png',timeout:10000});
   for(const [tab,section] of [['skins','skin-gacha-section'],['items','gacha-item-section']]){
    await p.locator('#btn-gacha-tab-'+tab).click();await p.waitForTimeout(1500);
    if(await p.locator('#'+section+' .skin-gacha-theme').count()===0)throw Error('Selected gacha tab did not render: '+tab);
    await p.screenshot({path:out+'/gacha-'+tab+'.png',timeout:10000});
   }
   await p.locator('#btn-gacha-back').click();
  }else{await p.locator('#menu-container > button').click();await p.locator('#btn-menu-home').click();}await p.locator('#screen-home').waitFor({state:'visible'});
 }
 await p.locator('#hotspot-adventure').click();await p.locator('#area-card-tower').click();await p.locator('.stage-select-row').first().click();await p.locator('#screen-battle').waitFor({state:'visible'});await p.waitForTimeout(1500);checks.push({screen:'screen-battle',missing:await missing('#screen-battle')});await p.screenshot({path:out+'/battle.png',timeout:10000});
 const warmStart=Date.now();await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.assetBootState?.phase==='ready');const warmMs=Date.now()-warmStart,warm=await p.evaluate(()=>assetBootState);
 const result={coldMs,warmMs,cold,warm,registrationMissing,homeMissing,checks,errors,http};await writeFile(out+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(registrationMissing.length||homeMissing.length||checks.some(c=>c.missing.length)||errors.length||http.length)process.exitCode=1;await c.close();
}finally{await browser.close();}
