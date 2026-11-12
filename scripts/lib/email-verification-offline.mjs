const forbiddenEnvironmentKeys=new Set([
  'STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_MODE','STRIPE_PERSONAL_PRICE_ID',
  'STRIPE_ORGANIZATION10_PRICE_ID','STRIPE_ORGANIZATION20_PRICE_ID','STRIPE_ORGANIZATION30_PRICE_ID',
  'GCLOUD_PROJECT','GOOGLE_CLOUD_PROJECT','GOOGLE_APPLICATION_CREDENTIALS','FIREBASE_CONFIG',
  'FIREBASE_SERVICE_ACCOUNT','FIREBASE_SERVICE_ACCOUNT_JSON','FIREBASE_ADMIN_KEY',
]);
const hasExactKeys=(value,expected)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===expected.length&&expected.every(key=>Object.hasOwn(value,key));

export function assertEmailVerificationOfflineProfile(profile,{environmentKeys=[]}={}){
  if(!hasExactKeys(profile,['profile','network','auth','email','persistence','sales'])||
     !hasExactKeys(profile.auth,['mode','realFirebase'])||!hasExactKeys(profile.email,['send'])||
     !hasExactKeys(profile.persistence,['mode'])||!hasExactKeys(profile.sales,['enabled','checkout','webhooks','externalStripe'])||
     profile.profile!=='email-verification-offline-fixture'||profile.network!=='loopback-only'||
     profile.auth?.mode!=='fixture'||profile.auth?.realFirebase!==false||profile.email?.send!==false||
     profile.persistence?.mode!=='temporary-directory'||profile.sales?.enabled!==false||
     profile.sales?.checkout!==false||profile.sales?.webhooks!==false||profile.sales?.externalStripe!==false)
    throw Error('offline_email_verification_profile_rejected');
  const contaminated=environmentKeys.filter(key=>forbiddenEnvironmentKeys.has(key)||/^(?:STRIPE|FIREBASE|GOOGLE|GCLOUD)_/.test(key));
  if(contaminated.length)throw Error('offline_email_verification_forbidden_environment:'+contaminated.sort().join(','));
  return Object.freeze({salesEnabled:false,checkoutEnabled:false,webhooksEnabled:false,realFirebase:false,emailSending:false});
}
