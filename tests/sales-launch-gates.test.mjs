import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStripePaymentIntegration} from '../server/stripe-payment-integration.mjs';
test('live sales require operator launch flag, complete seller information and three HTTPS policy URLs',()=>{
 const base={STRIPE_MODE:'live',STRIPE_SECRET_KEY:'sk_live_fixture_only'};
 for(const extra of [{},{PRODUCT_SALES_ENABLED:'1'},{PRODUCT_SALES_ENABLED:'1',PRODUCT_SELLER_INFO_COMPLETE:'1'},{PRODUCT_SALES_ENABLED:'1',PRODUCT_SELLER_INFO_COMPLETE:'1',PRODUCT_TERMS_URL:'https://example.com/terms',PRODUCT_PRIVACY_URL:'https://example.com/privacy'}]){
  assert.throws(()=>createStripePaymentIntegration({origin:'https://example.com',env:{...base,...extra}}),/sales_launch_not_approved/);
 }
 assert.throws(()=>createStripePaymentIntegration({origin:'https://example.com',env:{...base,PRODUCT_TERMS_URL:'http://example.com/terms'}}),/sales_policy_not_configured/);
});
