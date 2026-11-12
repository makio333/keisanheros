import Stripe from 'stripe';
import {createStripePayments} from './stripe-payments.mjs';
import {createStripePaymentHandler} from './stripe-payments-http.mjs';
import {createLegacyClaimVerifier} from './legacy-migration.mjs';
import {createLegacyFileImporter} from './legacy-file-import.mjs';
import {createLegacyFileHandler} from './legacy-file-http.mjs';

// Call from the hosted API server, not Vite or the local mock launcher.
export function createStripePaymentIntegration({store,sessions,origin,env=process.env,rateLimiter,emailVerification}){
  const mode=env.STRIPE_MODE;
  const stripeKey=env.STRIPE_SECRET_KEY;
  const validKey=mode==='live'
    ? stripeKey?.startsWith('rk_live_')||stripeKey?.startsWith('sk_live_')
    : stripeKey?.startsWith('sk_test_')||stripeKey?.startsWith('rk_test_');
  if(!['test','live'].includes(mode) || !validKey)throw Error('stripe_not_configured');
  const legalLinks={terms:env.PRODUCT_TERMS_URL,privacy:env.PRODUCT_PRIVACY_URL,commerce:env.PRODUCT_COMMERCE_URL};
  for(const [key,value] of Object.entries(legalLinks)){
    if(!value){delete legalLinks[key];continue;}
    const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw Error('sales_policy_not_configured');
  }
  if(mode==='live'&&(env.PRODUCT_SALES_ENABLED!=='1'||env.PRODUCT_SELLER_INFO_COMPLETE!=='1'||Object.keys(legalLinks).length!==3))throw Error('sales_launch_not_approved');
  if(mode==='live'&&typeof emailVerification?.assertCheckoutEligible!=='function')throw Error('email_verification_not_configured');
  const complimentarySaveLimit=Number(env.PRODUCT_COMPLIMENTARY_SAVE_LIMIT||0);
  const complimentaryAccountCutoff=env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF?Date.parse(env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF):null;
  if(mode==='live'&&(!Number.isSafeInteger(complimentarySaveLimit)||complimentarySaveLimit!==3||!Number.isSafeInteger(complimentaryAccountCutoff)||complimentaryAccountCutoff<0))throw Error('complimentary_access_not_configured');
  const stripe=new Stripe(env.STRIPE_SECRET_KEY,{maxNetworkRetries:2,timeout:20000});
  const priceIds={personal:env.STRIPE_PERSONAL_PRICE_ID,organization10:env.STRIPE_ORGANIZATION10_PRICE_ID,organization20:env.STRIPE_ORGANIZATION20_PRICE_ID,organization30:env.STRIPE_ORGANIZATION30_PRICE_ID};
  const fileMigrationAccountId=env.LEGACY_MIGRATION_ENABLED==='1'&&env.LEGACY_MIGRATION_SOURCE_PROJECT?env.LEGACY_MIGRATION_ACCOUNT_ID:undefined;
  const payments=createStripePayments({stripe,store,sessions,origin,webhookSecret:env.STRIPE_WEBHOOK_SECRET,priceIds,liveMode:mode==='live',legalLinks,verifyLegacyClaim:env.LEGACY_MIGRATION_ENABLED==='1'?createLegacyClaimVerifier():undefined,fileMigrationAccountId,trialsEnabled:true,complimentarySaveLimit,complimentaryAccountCutoff,verifyCheckoutEligibility:emailVerification?.assertCheckoutEligible});
  const fileHandler=createLegacyFileHandler({origin,importer:createLegacyFileImporter({store,sessions,accountId:fileMigrationAccountId,sourceProject:env.LEGACY_MIGRATION_SOURCE_PROJECT})});
  const paymentHandler=createStripePaymentHandler({payments,origin,rateLimiter});
  return {accounts:payments.accounts,handler:async(req,res)=>await fileHandler(req,res)||await paymentHandler(req,res)};
}
