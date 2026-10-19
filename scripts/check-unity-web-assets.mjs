import {homedir} from 'node:os';
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage();const failed=[];page.on('response',r=>{if(r.status()>=400)failed.push({status:r.status(),url:r.url()});});page.on('pageerror',e=>failed.push({error:e.message}));await page.goto('http://127.0.0.1:49318/');await page.waitForFunction(()=>document.getElementById('boot-load-percent')?.textContent==='100%',{timeout:60000});console.log(JSON.stringify(failed,null,2));}finally{await browser.close();}
