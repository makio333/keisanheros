import Stripe from 'stripe';
import {PURCHASE_PRICES} from '../server/purchase-pricing.mjs';
import {registerTestStripeProducts} from '../server/stripe-product-setup.mjs';

if(process.argv.slice(2).some(arg=>arg!=='--apply-test'))throw Error('Only --apply-test is supported. No live registration from this script.');
if(!process.argv.includes('--apply-test')){
  console.log('Preview only. No Stripe connection or changes. All amounts are one-time JPY totals including tax.');
  console.table(Object.entries(PURCHASE_PRICES).map(([id,plan])=>({id,...plan})));
}else{
  if(process.env.STRIPE_MODE!=='test' || !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'))throw Error('Test-mode server credentials are required. Do not paste secrets into chat or Git.');
  try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY,{maxNetworkRetries:2,timeout:20000});
    const ids=await registerTestStripeProducts(stripe);
    for(const [id,value] of Object.entries(ids))console.log(`STRIPE_${id==='personal'?'PERSONAL':id.toUpperCase()}_PRICE_ID=${value}`);
  }catch{console.error('Stripe test catalog setup failed. Check the account, permissions and existing catalog in Stripe.');process.exitCode=1;}
}
