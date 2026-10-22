import Stripe from 'stripe';
import {createStripePayments} from './stripe-payments.mjs';
import {createStripePaymentHandler} from './stripe-payments-http.mjs';
import {createLegacyClaimVerifier} from './legacy-migration.mjs';
import {createLegacyFileImporter} from './legacy-file-import.mjs';
import {createLegacyFileHandler} from './legacy-file-http.mjs';

// Call from the hosted API server, not Vite or the local mock launcher.
export function createStripePaymentIntegration({store,sessions,origin,env=process.env}){
  const mode=env.STRIPE_MODE;
  if(!['test','live'].includes(mode) || !env.STRIPE_SECRET_KEY?.startsWith(mode==='live'?'sk_live_':'sk_test_'))throw Error('stripe_not_configured');
  const stripe=new Stripe(env.STRIPE_SECRET_KEY,{maxNetworkRetries:2,timeout:20000});
  const priceIds={personal:env.STRIPE_PERSONAL_PRICE_ID,organization10:env.STRIPE_ORGANIZATION10_PRICE_ID,organization20:env.STRIPE_ORGANIZATION20_PRICE_ID,organization30:env.STRIPE_ORGANIZATION30_PRICE_ID};
  const fileMigrationAccountId=env.LEGACY_MIGRATION_ENABLED==='1'&&env.LEGACY_MIGRATION_SOURCE_PROJECT?env.LEGACY_MIGRATION_ACCOUNT_ID:undefined;
  const payments=createStripePayments({stripe,store,sessions,origin,webhookSecret:env.STRIPE_WEBHOOK_SECRET,priceIds,liveMode:mode==='live',verifyLegacyClaim:env.LEGACY_MIGRATION_ENABLED==='1'?createLegacyClaimVerifier():undefined,fileMigrationAccountId,trialsEnabled:true});
  const fileHandler=createLegacyFileHandler({origin,importer:createLegacyFileImporter({store,sessions,accountId:fileMigrationAccountId,sourceProject:env.LEGACY_MIGRATION_SOURCE_PROJECT})});
  const paymentHandler=createStripePaymentHandler({payments,origin});
  return {accounts:payments.accounts,handler:async(req,res)=>await fileHandler(req,res)||await paymentHandler(req,res)};
}
