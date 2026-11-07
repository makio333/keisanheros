import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {homedir,tmpdir} from 'node:os';
import path from 'node:path';
import {startOfflineEmailVerificationPreview} from './helpers/email-verification-offline-preview.mjs';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const directory=await mkdtemp(path.join(tmpdir(),'legend-email-verification-'));
const preview=await startOfflineEmailVerificationPreview({directory,emailState:'pending'});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===preview.url?route.continue():route.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(preview.url);await page.locator('#migration-line').click();
 await page.locator('#migration-email-registration').waitFor({state:'visible'});
 assert.match(await page.locator('#migration-email-registration-copy').textContent(),/メール確認後に登録完了/);
 assert.equal(await page.locator('#firebase-enter-game').isVisible().catch(()=>false),false);
 await page.locator('#migration-resend-email').click();
 await preview.verifyEmail();await page.evaluate(()=>window.__fixtureConfirmEmail());
 const sessionCreated=page.waitForResponse(response=>response.url().includes('/api/auth/firebase/session')&&response.status()===200,{timeout:30000});
 await page.locator('#migration-refresh').click();await sessionCreated;
 await page.locator('#migration-email-registration').waitFor({state:'hidden'});
 const accountResponse=await page.evaluate(async()=>{const response=await fetch('/api/account',{credentials:'same-origin'});return {status:response.status,account:await response.json()};});
 assert.equal(accountResponse.status,200,'confirmed registration creates the server session on the same Firebase UID');
 assert.equal(accountResponse.account.saveLimit,0,'offline profile grants no free trial or paid capacity');
 const identity=await preview.store.transaction(tx=>tx.getIdentity(JSON.stringify(['firebase','ailandgames','fixture-sales-user'])));
 assert.equal(identity,accountResponse.account.accountId,'verification never creates a replacement UID or account');
 assert.equal(preview.checkouts.size,0,'verification must not start a purchase');
 assert.equal(preview.checkoutCreateCalls,0,'offline candidate never invokes a Stripe/Checkout create method');
 assert.equal(await page.locator('#btn-account-purchase').count(),0,'purchase UI stays disabled in offline candidate');
 for(const route of ['/api/payments/checkout','/api/payments/checkout/cancel','/api/payments/stripe/webhook']){
  const blocked=await page.evaluate(async path=>{const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:'personal'})});return {status:response.status,body:await response.json()};},route);
  assert.deepEqual(blocked,{status:403,body:{error:'sales_disabled'}},`${route} is rejected server-side`);
 }
 assert.equal(preview.checkoutCreateCalls,0);
 await page.screenshot({path:path.join(tmpdir(),'legend-email-verification.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: pending registration cannot create the product session; confirmation creates the same-UID local session, grants no trial/capacity, UI purchase is absent, forced checkout is rejected. No Stripe Checkout was created. Screenshot: '+path.join(tmpdir(),'legend-email-verification.png'));
}finally{await browser.close();await preview.close();await rm(directory,{recursive:true,force:true});}
