import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {resolveEmailVerificationOnlyConfig} from '../server/email-verification-only-config.mjs';
import {createProductPaymentMode} from '../server/product-payment-mode.mjs';

const valid={EMAIL_VERIFICATION_ONLY:'1',GCLOUD_PROJECT:'demo-email-verification',PRODUCT_PUBLIC_ORIGIN:'http://127.0.0.1:5174',
  FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080',PORT:'8081',
  FIREBASE_ACCOUNT_LOGIN_ENABLED:'1',FIREBASE_SAVE_MIGRATION_READY:'0',EMAIL_VERIFICATION_POLICY_START_AT:'2026-10-25T00:00:00.000Z'};

test('email-only startup config cannot point at product Firebase/remote hosts or carry cloud/payment credentials',()=>{
  assert.deepEqual(resolveEmailVerificationOnlyConfig(valid),{
    enabled:true,projectId:'demo-email-verification',origin:'http://127.0.0.1:5174',host:'127.0.0.1',port:8081,
    firebaseAuthEmulator:'127.0.0.1:9099',firestoreEmulator:'127.0.0.1:8080',
  });
  for(const [key,value] of Object.entries({GCLOUD_PROJECT:'ailandgames',GOOGLE_CLOUD_PROJECT:'ailandgames',
    PRODUCT_PUBLIC_ORIGIN:'https://legend-heroes2.web.app',FIREBASE_AUTH_EMULATOR_HOST:'auth.example.test:9099',
    FIRESTORE_EMULATOR_HOST:'firestore.example.test:8080',PORT:'8080',STRIPE_SECRET_KEY:'fixture-value',
    STRIPE_MODE:'live',GOOGLE_APPLICATION_CREDENTIALS:'/tmp/credentials.json',PRODUCT_SALES_ENABLED:'0'})){
    assert.throws(()=>resolveEmailVerificationOnlyConfig({...valid,[key]:value}),undefined,key);
  }
  assert.equal(resolveEmailVerificationOnlyConfig({}),null,'normal mode selection stays unchanged');
  assert.throws(()=>resolveEmailVerificationOnlyConfig({...valid,EMAIL_VERIFICATION_ONLY:'yes'}),/invalid_email_verification_only_mode/);
});

test('email-only payment selector never calls Stripe and preserves existing capacity while blocking every payment route',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'email-only-store-')),store=await openLocalAccountStore(directory);
  try{
    const now=Date.now(),sessionId='fixture-session';
    await store.transaction(tx=>{
      tx.putAccount({id:'account-existing',createdAt:now-1000});
      tx.putPurchase({purchaseId:'purchase-existing',accountId:'account-existing',productId:'organization10',active:true});
    });
    await store.sessions.create(sessionId,{accountId:'account-existing',expiresAt:now+60000});
    const mode=createProductPaymentMode({store,sessions:store.sessions,origin:valid.PRODUCT_PUBLIC_ORIGIN,env:valid,
      stripeIntegration:()=>{throw Error('Stripe integration must not be constructed');}});
    const summary=await mode.accounts.summary(sessionId);
    assert.equal(summary.saveLimit,10);assert.equal(summary.paidSaveLimit,10);assert.equal(summary.trial.available,false);
    const before=await store.transaction(tx=>tx.listPurchases('account-existing'));
    for(const url of ['/api/payments/checkout','/api/payments/checkout/cancel','/api/payments/stripe/webhook','/api/payments/products','/api/payments/status','/api/payments/legal']){
      const req={url,method:'POST'},res={writeHead(status){this.status=status;},end(body){this.body=body;}};
      assert.equal(await mode.handler(req,res),true);assert.equal(res.status,403);assert.deepEqual(JSON.parse(res.body),{error:'sales_disabled'});
    }
    const after=await store.transaction(tx=>tx.listPurchases('account-existing'));
    assert.deepEqual(after,before,'existing purchase rights remain unchanged');
    await assert.rejects(mode.accounts.startTrial(sessionId),/trial_unavailable/);
  }finally{await store.close();await rm(directory,{recursive:true,force:true});}
});
