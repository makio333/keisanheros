const forbiddenEnvironmentNames=new Set([
  'STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_MODE','PRODUCT_SALES_ENABLED',
  'GOOGLE_APPLICATION_CREDENTIALS','CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE','FIREBASE_CONFIG',
  'FIREBASE_SERVICE_ACCOUNT','FIREBASE_SERVICE_ACCOUNT_JSON','FIREBASE_ADMIN_KEY',
]);

export function resolveEmailVerificationOnlyConfig(env=process.env){
  const mode=env.EMAIL_VERIFICATION_ONLY;
  if(mode===undefined||mode==='0')return null;
  if(mode!=='1')throw Error('invalid_email_verification_only_mode');
  const projectId=env.GCLOUD_PROJECT||env.GOOGLE_CLOUD_PROJECT;
  if(projectId!=='demo-email-verification'||
     env.GCLOUD_PROJECT&&env.GCLOUD_PROJECT!==projectId||env.GOOGLE_CLOUD_PROJECT&&env.GOOGLE_CLOUD_PROJECT!==projectId)
    throw Error('email_verification_only_requires_demo_project');
  let origin;try{origin=new URL(env.PRODUCT_PUBLIC_ORIGIN);}catch{throw Error('email_verification_only_requires_loopback_origin');}
  if(origin.origin!==env.PRODUCT_PUBLIC_ORIGIN||origin.protocol!=='http:'||origin.hostname!=='127.0.0.1')
    throw Error('email_verification_only_requires_loopback_origin');
  if(env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099'||env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080')
    throw Error('email_verification_only_requires_local_emulators');
  const port=Number(env.PORT||8081);
  if(!Number.isInteger(port)||port<1||port>65535||port===8080||port===9099)
    throw Error('email_verification_only_requires_local_api_port');
  const forbidden=Object.keys(env).filter(key=>forbiddenEnvironmentNames.has(key)||/^STRIPE_/.test(key)||/^FIREBASE_SERVICE_ACCOUNT/.test(key));
  if(forbidden.length)throw Error('email_verification_only_rejects_cloud_or_sales_environment');
  return Object.freeze({enabled:true,projectId,origin:origin.origin,host:'127.0.0.1',port,
    firebaseAuthEmulator:'127.0.0.1:9099',firestoreEmulator:'127.0.0.1:8080'});
}
