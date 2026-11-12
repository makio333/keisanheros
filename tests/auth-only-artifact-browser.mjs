import assert from 'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import{homedir}from'node:os';import path from'node:path';
const{chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const work=process.env.AUTH_ONLY_WORK_DIR||'/tmp/legend-auth-only-release',plan=JSON.parse(await readFile(work+'/auth-only-plan.json'));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const[provider,mobile]of [['google',false],['line',true]]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block',...(mobile?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})}),page=await context.newPage(),errors=[],authRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 context.on('request',req=>{const u=new URL(req.url());if(u.pathname.startsWith('/__/auth/'))authRequests.push({origin:u.origin,path:u.pathname});});
 await context.route('https://legend-heroes2.web.app/**',async route=>{
  const url=new URL(route.request().url()),p=url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname);
  if(p.startsWith('/__/')||!Object.hasOwn(plan.files,p)){await route.continue();return;}
  const body=await readFile(path.join(work,'candidate',p.slice(1))),type=p.endsWith('.html')?'text/html':p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':undefined;
  await route.fulfill({status:200,body,...(type?{contentType:type}:{})});
 });
 await page.goto('https://legend-heroes2.web.app/',{waitUntil:'domcontentloaded'});await page.locator('#migration-'+provider).waitFor({timeout:30000});
 await page.screenshot({path:work+'/candidate-login-'+provider+'.png'});
 const popupPromise=page.waitForEvent('popup');await page.locator('#migration-'+provider).click();const popup=await popupPromise;
 const host=provider==='google'?'https://accounts.google.com':'https://access.line.me';await popup.waitForURL(url=>url.origin===host,{timeout:30000});await popup.waitForTimeout(2000);
 const body=await popup.locator('body').innerText();assert.ok(!/redirect_uri_mismatch|Invalid redirect_uri|missing initial state/.test(body),provider+' auth entry failed');
 assert.ok(provider==='google'?body.includes('legend-heroes2.web.app'):body.includes('ログイン'));
 assert.ok(authRequests.some(r=>r.path==='/__/auth/handler'));assert.ok(authRequests.every(r=>r.origin==='https://legend-heroes2.web.app'),JSON.stringify(authRequests));assert.deepEqual(errors,[]);
 await writeFile(work+'/candidate-auth-entry-'+provider+'.json',JSON.stringify({provider,mobile,authRequests,providerOrigin:new URL(popup.url()).origin,providerPath:new URL(popup.url()).pathname,completedSignIn:false,errors},null,2));
 console.log('PASS: isolated published artifact candidate -> same-origin auth helper -> official '+provider+' login; no credentials or live deployment.');await context.close();
}}finally{await browser.close();}
