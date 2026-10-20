import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {homedir,tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {PURCHASE_PRICES,purchaseQuote} from '../server/purchase-pricing.mjs';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out=path.join(tmpdir(),'legend-stripe-browser');await mkdir(out,{recursive:true});
const vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),define:{'import.meta.env.VITE_ACCOUNT_BACKEND':'"1"','import.meta.env.VITE_STRIPE_CHECKOUT':'"1"'},server:{host:'127.0.0.1',port:0}});
await vite.listen();const origin=`http://127.0.0.1:${vite.httpServer.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),errors=[];
  let purchased=false,failCheckout=true,pendingCheckout=false,cancellations=0,requests=0,selectedProduct;
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    const json=value=>route.fulfill({contentType:'application/json',body:JSON.stringify(value)});
    if(url.origin==='https://checkout.stripe.com')return route.fulfill({contentType:'text/html',body:'<h1>Offline Stripe fixture</h1>'});
    if(url.origin!==origin)return route.fulfill({body:''});
    if(url.pathname==='/api/account')return json({accountId:'fixture-purchaser',saveLimit:purchased?3:0,used:0,canCreate:purchased});
    if(url.pathname==='/api/saves')return json([]);
    if(url.pathname==='/api/payments/products')return json(Object.entries(PURCHASE_PRICES).filter(([,plan])=>plan.saveLimit>(purchased?3:0)).map(([id,plan])=>({id,saveLimit:plan.saveLimit,kind:id==='personal'?'personal':'organization',...purchaseQuote(purchased?3:0,id),currency:'jpy'})));
    if(url.pathname==='/api/payments/checkout/cancel'){cancellations++;pendingCheckout=false;return json({cancelled:true});}
    if(url.pathname==='/api/payments/checkout'){
      requests++;assert.equal(route.request().method(),'POST');selectedProduct=route.request().postDataJSON().productId;
      if(pendingCheckout)return route.fulfill({status:409,contentType:'application/json',body:'{"error":"checkout_in_progress"}'});
      return failCheckout?route.fulfill({status:503,contentType:'application/json',body:'{"error":"payment_service_unavailable"}'}):json({url:'https://checkout.stripe.com/c/pay/fixture'});
    }
    return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin);await page.locator('#btn-account-purchase').waitFor();
  assert.equal(await page.locator('#account-purchase-plan option').count(),4);
  assert.ok((await page.locator('#account-purchase-plan option[value="personal"]').textContent()).includes('4,980'));
  assert.equal(await page.getByRole('button',{name:'先の購入手続きを取り消す'}).isVisible(),false);
  await page.locator('#account-purchase-plan').selectOption('organization20');
  await page.screenshot({path:path.join(out,'purchase-mobile.png')});
  const rect=await page.locator('.account-login-panel').boundingBox();assert.ok(rect.x>=0 && rect.x+rect.width<=390 && rect.y>=0 && rect.y+rect.height<=844);
  await page.locator('#btn-account-purchase').click();await page.locator('#btn-account-purchase:not([disabled])').waitFor();
  assert.ok((await page.locator('.account-login-panel').textContent()).includes('接続できません'));assert.equal(selectedProduct,'organization20');
  failCheckout=false;pendingCheckout=true;await page.locator('#btn-account-purchase').click();
  await page.getByRole('button',{name:'先の購入手続きを取り消す'}).click();assert.equal(cancellations,1);
  await page.locator('#account-purchase-plan').selectOption('organization30');
  failCheckout=false;await page.locator('#btn-account-purchase').click();await page.waitForURL('https://checkout.stripe.com/**');
  assert.equal(requests,3);assert.equal(selectedProduct,'organization30');
  await page.goto(origin+'/?purchase=processing');await page.locator('#btn-account-refresh').waitFor();
  assert.ok((await page.locator('[data-status]').textContent()).includes('お支払いを確認'));
  assert.equal(await page.locator('#btn-account-purchase').count(),0,'do not prompt another purchase while confirmation is pending');
  assert.equal(await page.evaluate(()=>!!window.AccountSession),false,'success URL cannot unlock game');
  await page.screenshot({path:path.join(out,'processing-mobile.png')});
  await page.goto(origin+'/?purchase=cancelled');await page.locator('#btn-account-purchase').waitFor();
  assert.ok((await page.locator('[data-status]').textContent()).includes('キャンセル'));
  purchased=true;await page.locator('#btn-account-refresh').click();await page.locator('.account-login-gate').waitFor({state:'detached'});
  assert.equal(await page.locator('#account-save-count').textContent(),'プレイヤー 0 / 3');assert.deepEqual(errors,[]);
  assert.equal(await page.locator('#account-purchase-plan option').count(),3);
  assert.equal(await page.locator('#account-purchase-plan option[value="personal"]').count(),0);
  assert.ok((await page.locator('#account-purchase-plan option[value="organization10"]').textContent()).includes('差額 ￥14,820'));
  // Isolate the account controls from the unrelated asset-loading splash.
  await page.evaluate(()=>{document.getElementById('boot-loader-screen')?.remove();document.getElementById('title-white-fade')?.remove();document.getElementById('screen-title').classList.add('active');});
  await page.locator('.account-title-controls .account-purchase-controls').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,'upgrade-mobile.png')});
  const upgrade=await page.locator('.account-title-controls .account-purchase-controls').boundingBox();
  assert.ok(upgrade.width>0 && upgrade.x>=0 && upgrade.x+upgrade.width<=390);
  console.log('PASS: mobile one-time purchase gate, recoverable error, hosted Checkout redirect, pending/cancel states, server-confirmed unlock; offline fixtures only. '+out);
}finally{await browser.close();await vite.close();}
