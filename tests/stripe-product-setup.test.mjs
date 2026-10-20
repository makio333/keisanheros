import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {registerTestStripeProducts} from '../server/stripe-product-setup.mjs';
import {PURCHASE_PRICES,purchaseQuote} from '../server/purchase-pricing.mjs';

const rows=[],calls=[];
const stripe={prices:{
  async list({lookup_keys}){return {data:rows.filter(row=>lookup_keys.includes(row.lookup_key))};},
  async create(params,options){
    calls.push({params,options});const row={...params,id:'price_fixture_'+rows.length,livemode:false,active:true,type:'one_time'};rows.push(row);return row;
  },
}};
const first=await registerTestStripeProducts(stripe),again=await registerTestStripeProducts(stripe);
assert.deepEqual(first,again);assert.equal(calls.length,4);
assert.deepEqual(rows.map(row=>row.unit_amount),[4980,19800,34800,49800]);
assert.ok(rows.every(row=>row.currency==='jpy' && row.tax_behavior==='inclusive' && !row.recurring));
assert.ok(calls.every(call=>call.options.idempotencyKey));
rows[0].unit_amount=1;await assert.rejects(registerTestStripeProducts(stripe),/stripe_catalog_mismatch/);rows[0].unit_amount=4980;
rows[0].livemode=true;await assert.rejects(registerTestStripeProducts(stripe),/stripe_catalog_mismatch/);rows[0].livemode=false;
assert.equal(purchaseQuote(0,'personal').amount,4980);
assert.equal(purchaseQuote(3,'organization10').amount,14820);
assert.equal(purchaseQuote(10,'organization30').amount,30000);
assert.equal(purchaseQuote(20,'organization30').amount,15000);
assert.throws(()=>purchaseQuote(5,'organization10'),/unsupported_upgrade/);
assert.throws(()=>purchaseQuote(0,'__proto__'),/invalid_product/);
assert.equal(Object.keys(PURCHASE_PRICES).length,4);
const preview=execFileSync(process.execPath,['scripts/setup-stripe-products.mjs'],{encoding:'utf8'});
assert.ok(preview.includes('Preview only'));assert.ok(preview.includes('49800'));
assert.throws(()=>execFileSync(process.execPath,['scripts/setup-stripe-products.mjs','--apply-test'],{env:{...process.env,STRIPE_MODE:'live',STRIPE_SECRET_KEY:'sk_live_FIXTURE_ONLY'},stdio:'pipe'}));
console.log('PASS: approved tax-inclusive one-time price catalog, exact upgrade differences, repeat-safe offline registration fixtures, mismatch/live refusal and no-network CLI preview.');
