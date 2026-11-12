import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createEmailVerificationService} from '../server/email-verification.mjs';
import {createFirebaseAccountLogin} from '../server/firebase-account-login.mjs';
import {createSalesEmailFlow} from '../sales-pages/sales-email-flow.mjs';
import {createSalesEmailDelivery} from '../server/sales-email-delivery.mjs';
import {validateSalesEmailCutover} from '../server/sales-email-cutover.mjs';
import {createStripePayments} from '../server/stripe-payments.mjs';

test('all Firebase entries keep the same UID through confirmation and only an explicit fresh verified Checkout can proceed',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'legend-sales-email-integration-'));
  const store=await openLocalAccountStore(dir);
  try{
    const now=()=>Date.parse('2026-11-02T00:00:00.000Z'),users=new Map(),tokens=new Map(),mailed=[],reservations=new Map();
    const config=validateSalesEmailCutover({enabled:true,policyStartAt:'2026-11-01T00:00:00.000Z'});
    const issue=(uid,provider)=>{
      const u=users.get(uid),token='synthetic-token-'+tokens.size;
      tokens.set(token,{uid,aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:now()/1000+300,email:u.email,email_verified:u.emailVerified,firebase:{sign_in_provider:provider}});return token;
    };
    const verifyIdToken=async(token,checkRevoked)=>{assert.equal(checkRevoked,true);if(!tokens.has(token))throw Error('revoked');return structuredClone(tokens.get(token));};
    const service=createEmailVerificationService({store,verifyIdToken,getUser:async uid=>structuredClone(users.get(uid)),policyStartAt:config.policyStartAt,now});
    const login=createFirebaseAccountLogin({store,sessions:store.sessions,verifyIdToken,getUser:async uid=>structuredClone(users.get(uid)),emailVerification:service,now});
    const delivery=createSalesEmailDelivery({enabled:true,config,emailVerification:service,now,
      generateVerificationLink:async()=> 'https://ailandgames.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=synthetic',
      sendMessage:async value=>{mailed.push(value);return {accepted:true};},
      ledger:{reserve:async({key})=>{if(reservations.has(key))return {status:'cooldown'};reservations.set(key,true);return {status:'reserved',deliveryId:'synthetic-delivery-'+reservations.size};},complete:async()=>{}},
    });
    let checkouts=0;
    const price={id:'price_fixture',active:true,type:'one_time',currency:'jpy',unit_amount:4980,tax_behavior:'inclusive',livemode:false};
    const payments=createStripePayments({store,sessions:store.sessions,origin:config.origin,webhookSecret:'whsec_synthetic_only',personalPriceId:price.id,now,
      verifyCheckoutEligibility:service.assertCheckoutEligible,
      stripe:{prices:{retrieve:async()=>price},checkout:{sessions:{create:async params=>{
        checkouts++;return {id:'cs_synthetic_'+checkouts,...params,status:'open',payment_status:'unpaid',livemode:false,currency:'jpy',amount_total:4980,url:'https://checkout.stripe.com/c/pay/synthetic',expires_at:now()/1000+3600};
      }}}},
    });
    for(const provider of ['google.com','oidc.line','password']){
      const uid='synthetic-'+provider.replace(/\W/g,'-');
      users.set(uid,{uid,email:provider==='oidc.line'?null:uid+'@example.test',emailVerified:false,disabled:false,metadata:{creationTime:'2026-11-01T00:00:00.001Z'}});
      const user={uid,...structuredClone(users.get(uid)),getIdToken:async()=>issue(uid,provider)},auth={currentUser:user};
      let returned=null;
      const flow=createSalesEmailFlow({auth,enabled:true,origin:config.origin,returnTo:'/?purchase=resume',onComplete:value=>returned=value,
        inspect:async token=>{const state=await service.status(token);return {...state,registrationState:state.state};},deliver:delivery.send,
        sdk:{reload:async target=>Object.assign(target,structuredClone(users.get(target.uid))),emailCredential:(email,password)=>({email,password}),
          linkWithCredential:async(target,credential)=>{users.get(target.uid).email=credential.email;target.email=credential.email;return {user:target};}},
      });
      assert.equal((await flow.refresh()).complete,false);
      assert.throws(()=>flow.continue(),/email_verification_required/);
      await assert.rejects(login(issue(uid,provider)),/email_verification_required/);
      const sent=provider==='oidc.line'?await flow.addEmail({email:uid+'@example.test',password:'synthetic-only-password'}):await flow.send();
      assert.equal(sent.sent,true);assert.equal(auth.currentUser.uid,uid);assert.equal(checkouts,provider==='google.com'?0:provider==='oidc.line'?1:2);
      users.get(uid).emailVerified=true;
      assert.equal((await flow.refresh()).complete,true);flow.continue();
      assert.equal(returned.returnPath,'/?purchase=resume');
      const before=checkouts;
      const session=await login(issue(uid,provider));
      assert.equal(checkouts,before,'confirmation, return and game login do not automatically create a charge');
      await assert.rejects(payments.checkout(session.sessionId,'personal','revoked-token'),/authentication_required/);
      assert.equal(checkouts,before);
      const token=issue(uid,provider);await payments.checkout(session.sessionId,'personal',token);
      assert.equal(checkouts,before+1);
      users.get(uid).emailVerified=false;
      await assert.rejects(payments.checkout(session.sessionId,'personal',token),/email_verification_required/);
      users.get(uid).emailVerified=true;users.get(uid).email='changed-'+uid+'@example.test';
      await assert.rejects(payments.checkout(session.sessionId,'personal',token),/email_verification_refresh_required/);
      assert.equal((await payments.accounts.summary(session.sessionId)).saveLimit,0,'Checkout start grants no paid rights');
    }
    assert.equal(mailed.length,3);assert.equal(checkouts,3);
  }finally{await store.close();await rm(dir,{recursive:true,force:true});}
});
