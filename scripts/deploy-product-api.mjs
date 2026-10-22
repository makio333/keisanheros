import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Non-secret settings stay in the environment; only three credentials use Secret Manager.
const root=fileURLToPath(new URL('../',import.meta.url));
const publicKeys=['LINE_CHANNEL_ID','LINE_PROVIDER_ID','STRIPE_PERSONAL_PRICE_ID',
  'STRIPE_ORGANIZATION10_PRICE_ID','STRIPE_ORGANIZATION20_PRICE_ID','STRIPE_ORGANIZATION30_PRICE_ID'];
const missing=publicKeys.filter(key=>!process.env[key]||/replace_me/.test(process.env[key]));
if(missing.length){console.error('Missing settings: '+missing.join(', '));process.exit(1);}
const settings={GCLOUD_PROJECT:'ailandgames',PRODUCT_PUBLIC_ORIGIN:'https://ailandgames.web.app',
  LINE_REDIRECT_URI:'https://ailandgames.web.app/api/auth/line/callback',STRIPE_MODE:'test',
  ...Object.fromEntries(publicKeys.map(key=>[key,process.env[key]]))};
settings.LEGACY_MIGRATION_ENABLED=process.env.LEGACY_MIGRATION_ENABLED==='1'?'1':'0';
if(settings.LEGACY_MIGRATION_ENABLED==='1'){
  for(const key of ['LEGACY_MIGRATION_ACCOUNT_ID','LEGACY_MIGRATION_SOURCE_PROJECT']){
    if(!process.env[key])throw Error('Missing migration setting: '+key);
    settings[key]=process.env[key];
  }
}
for(const value of Object.values(settings)){
  if(/[\r\n,]/.test(value))throw Error('Invalid deployment setting.');
}
const args=['run','deploy','legend-heroes-api','--project=ailandgames','--region=asia-northeast1',
  '--source=.','--service-account=legend-heroes-api@ailandgames.iam.gserviceaccount.com',
  '--allow-unauthenticated','--min=0','--max=1','--max-instances=1','--cpu=1','--memory=512Mi',
  '--concurrency=20','--timeout=60s','--cpu-throttling','--no-cpu-boost',
  '--set-env-vars='+Object.entries(settings).map(([key,value])=>key+'='+value).join(','),
  '--set-secrets=LINE_CHANNEL_SECRET=LINE_CHANNEL_SECRET:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest'];
if(process.env.GOOGLE_CLIENT_ID){
  const id=process.env.GOOGLE_CLIENT_ID;
  if(!/^[A-Za-z0-9._-]+\.apps\.googleusercontent\.com$/.test(id))throw Error('Invalid GOOGLE_CLIENT_ID.');
  const envIndex=args.findIndex(value=>value.startsWith('--set-env-vars='));args[envIndex]+=',GOOGLE_CLIENT_ID='+id;
  const secretIndex=args.findIndex(value=>value.startsWith('--set-secrets='));args[secretIndex]+=',GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest';
}
if(!process.argv.includes('--deploy')){
  console.log('Check passed. No upload or deployment performed.');
  console.log('Target: ailandgames / legend-heroes-api / Tokyo');
  console.log('Stripe: TEST ONLY. Instances: idle 0, maximum 1; 1 CPU, 512 MiB.');
  console.log('Three credentials must already exist in Secret Manager; the dedicated service account needs access.');
  console.log('Billing alerts and a billing account must be configured separately. These limits are not a spending cap.');
  process.exit(0);
}
const result=spawnSync('gcloud',args,{cwd:root,stdio:'inherit'});
if(result.error){console.error('Google Cloud CLI is unavailable.');process.exit(1);}
process.exit(result.status??1);
