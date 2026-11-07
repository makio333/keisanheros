import {createStripePaymentIntegration} from './stripe-payment-integration.mjs';
import {createSalesDisabledIntegration} from './sales-disabled-integration.mjs';

export function createProductPaymentMode({store,sessions,origin,env=process.env,rateLimiter,emailVerification,
  stripeIntegration=createStripePaymentIntegration,salesDisabledIntegration=createSalesDisabledIntegration}){
  const mode=env.EMAIL_VERIFICATION_ONLY;
  if(mode==='1'){
    if(env.PRODUCT_SALES_ENABLED==='1'||Object.keys(env).some(key=>key.startsWith('STRIPE_')))
      throw Error('email_verification_only_rejects_sales_configuration');
    return salesDisabledIntegration({store,sessions,origin});
  }
  if(mode!==undefined&&mode!=='0')throw Error('invalid_email_verification_only_mode');
  if(env.PRODUCT_SALES_ENABLED==='0'){
    const cutoff=env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF;
    if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(cutoff||'')||!Number.isFinite(Date.parse(cutoff)))throw Error('invalid_complimentary_account_cutoff');
    return salesDisabledIntegration({store,sessions,origin,complimentarySaveLimit:3,complimentaryAccountCutoff:Date.parse(cutoff)});
  }
  return stripeIntegration({store,sessions,origin,env,rateLimiter,emailVerification});
}
