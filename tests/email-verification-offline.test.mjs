import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {assertEmailVerificationOfflineProfile} from '../scripts/lib/email-verification-offline.mjs';

const profile=JSON.parse(await readFile(fileURLToPath(new URL('../config/email-verification-offline.json',import.meta.url)),'utf8'));

test('offline candidate keeps auth/email fixture-only and all purchase surfaces disabled',()=>{
  assert.deepEqual(assertEmailVerificationOfflineProfile(profile,{environmentKeys:[]}),{
    salesEnabled:false,checkoutEnabled:false,webhooksEnabled:false,realFirebase:false,emailSending:false,
  });
});

test('offline candidate rejects sales, live credentials, production Firebase and persistent storage',()=>{
  for(const mutate of [
    candidate=>{candidate.sales.enabled=true;},
    candidate=>{candidate.sales.checkout=true;},
    candidate=>{candidate.sales.webhooks=true;},
    candidate=>{candidate.sales.externalStripe=true;},
    candidate=>{candidate.auth.realFirebase=true;},
    candidate=>{candidate.email.send=true;},
    candidate=>{candidate.persistence.mode='production-firestore';},
    candidate=>{candidate.stripe={secretKey:'fixture-live-key-sentinel'};},
    candidate=>{candidate.network='public';},
  ]){
    const candidate=structuredClone(profile);mutate(candidate);
    assert.throws(()=>assertEmailVerificationOfflineProfile(candidate,{environmentKeys:[]}),/offline_email_verification_profile_rejected/);
  }
  for(const key of ['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_MODE','GOOGLE_APPLICATION_CREDENTIALS','GCLOUD_PROJECT','GOOGLE_CLOUD_PROJECT','FIREBASE_CONFIG'])
    assert.throws(()=>assertEmailVerificationOfflineProfile(profile,{environmentKeys:[key]}),new RegExp(key));
});
