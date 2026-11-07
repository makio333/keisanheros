import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createStripePayments} from '../server/stripe-payments.mjs';
import {PURCHASE_PRICES} from '../server/purchase-pricing.mjs';

test('checkout rejects a direct server call until the account manager declaration is saved',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'legend-adult-checkout-'));
  let store;
  try{
    store=await openLocalAccountStore(directory);
    const {accountId}=await store.auth.resolveIdentity({provider:'fixture',providerId:'adult',subject:'synthetic-parent'});
    const session='fixture-session-adult-manager';await store.sessions.create(session,{accountId,expiresAt:Date.now()+3600000});
    let creates=0;
    const priceId='price_adult_fixture';
    const stripe={
      prices:{retrieve:async id=>({id,active:true,type:'one_time',currency:'jpy',livemode:false,unit_amount:PURCHASE_PRICES.personal.amount,tax_behavior:'inclusive'})},
      checkout:{sessions:{create:async(params)=>{
        creates++;return {id:'cs_fixture_adult',status:'open',payment_status:'unpaid',livemode:false,mode:'payment',metadata:params.metadata,client_reference_id:params.client_reference_id,expires_at:Math.floor(Date.now()/1000)+3600,url:'https://checkout.stripe.com/c/pay/cs_fixture_adult'};
      },retrieve:async()=>{throw Error('unexpected_retrieve');}}},
    };
    const payments=createStripePayments({stripe,store,sessions:store.sessions,origin:'https://fixture.invalid',webhookSecret:'whsec_fixture_only',personalPriceId:priceId,requireAdultManagerAcknowledgement:true});
    await assert.rejects(payments.checkout(session,'personal'),/adult_manager_acknowledgement_required/);
    assert.equal(creates,0,'the server must reject before creating a Stripe Checkout session');
    await payments.accounts.acknowledgeAdultManager(session,{acknowledged:true});
    assert.match((await payments.checkout(session,'personal')).url,/^https:\/\/checkout\.stripe\.com\//);
    assert.equal(creates,1);
  }finally{await store?.close();await rm(directory,{recursive:true,force:true});}
});
