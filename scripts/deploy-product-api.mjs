import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const targetOrigin='https://legend-heroes2.web.app';
const deploy=process.argv.includes('--deploy');
const salesDisabled=process.argv.includes('--sales-disabled');
const emailPolicyStartAt=process.env.EMAIL_VERIFICATION_POLICY_START_AT;
let releaseManifest=null;
try{releaseManifest=JSON.parse(await readFile(new URL(salesDisabled?'../dist-product-free/release-target.json':'../dist-product/release-target.json',import.meta.url),'utf8'));}catch{}
const cutoff=process.env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF||releaseManifest?.complimentaryAccountsCreatedBefore;
const complimentarySaveLimit=releaseManifest?.complimentarySaveLimit;
const publicKeys=['STRIPE_PERSONAL_PRICE_ID','STRIPE_ORGANIZATION10_PRICE_ID','STRIPE_ORGANIZATION20_PRICE_ID','STRIPE_ORGANIZATION30_PRICE_ID'];
const legalKeys=['PRODUCT_TERMS_URL','PRODUCT_PRIVACY_URL','PRODUCT_COMMERCE_URL'];
const legal={};
const allowed=new Set(['--deploy','--sales-disabled']);
if(process.argv.slice(2).some(arg=>!allowed.has(arg))||new Set(process.argv.slice(2)).size!==process.argv.length-2)throw Error('Use --sales-disabled for the no-sales mode; pass --deploy only after the exact target is approved.');

const problems=[];
if(process.env.PRODUCT_PUBLIC_ORIGIN!==targetOrigin)problems.push('PRODUCT_PUBLIC_ORIGIN must be '+targetOrigin);
if(salesDisabled){
  if(releaseManifest?.target!=='product-free'||releaseManifest?.project!=='ailandgames'||releaseManifest?.site!=='legend-heroes2')problems.push('Build the product-free Hosting artifact for ailandgames / legend-heroes2 first');
  if(process.env.PRODUCT_SALES_ENABLED!=='0')problems.push('PRODUCT_SALES_ENABLED=0 is required');
  if(process.env.FIREBASE_ACCOUNT_LOGIN_ENABLED!=='1')problems.push('FIREBASE_ACCOUNT_LOGIN_ENABLED=1 is required');
  if(process.env.FIREBASE_SAVE_MIGRATION_READY!=='1')problems.push('FIREBASE_SAVE_MIGRATION_READY=1 is required to retain existing game saves');
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(cutoff||'')||!Number.isFinite(Date.parse(cutoff)))problems.push('PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF must be the fixed UTC account cutoff used by the Hosting artifact');
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(emailPolicyStartAt||'')||!Number.isFinite(Date.parse(emailPolicyStartAt)))problems.push('EMAIL_VERIFICATION_POLICY_START_AT must be the approved UTC rollout timestamp');
  if(process.env.PRODUCT_NO_SALES_API_RELEASE_APPROVED!=='1')problems.push('PRODUCT_NO_SALES_API_RELEASE_APPROVED=1 is required for ailandgames / legend-heroes-api / asia-northeast1');
  if(process.env.PRODUCT_NO_SALES_COSTS_APPROVED!=='1')problems.push('PRODUCT_NO_SALES_COSTS_APPROVED=1 is required for Cloud Run usage costs');
}else{
if(releaseManifest?.target!=='product'||releaseManifest?.project!=='ailandgames'||releaseManifest?.site!=='legend-heroes2'||releaseManifest?.salesEnabled!==true)problems.push('Build the sales-enabled product Hosting artifact for ailandgames / legend-heroes2 first');
if(releaseManifest?.salesPagesIncluded!==true)problems.push('Build the product artifact with finalized sales disclosure pages before API deployment');
if(process.env.STRIPE_MODE!=='live')problems.push('STRIPE_MODE must be live; test mode is not a public store');
if(process.env.PRODUCT_SALES_ENABLED!=='1')problems.push('PRODUCT_SALES_ENABLED=1 is required');
if(process.env.PRODUCT_SELLER_INFO_COMPLETE!=='1')problems.push('PRODUCT_SELLER_INFO_COMPLETE=1 is required after seller details are published');
if(process.env.PRODUCT_COSTS_APPROVED!=='1')problems.push('PRODUCT_COSTS_APPROVED=1 is required after the operator accepts payment and cloud costs');
if(process.env.FIREBASE_ACCOUNT_LOGIN_ENABLED!=='1')problems.push('FIREBASE_ACCOUNT_LOGIN_ENABLED=1 is required');
if(process.env.FIREBASE_SAVE_MIGRATION_READY!=='1')problems.push('FIREBASE_SAVE_MIGRATION_READY=1 is required to retain existing game saves');
if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(emailPolicyStartAt||'')||!Number.isFinite(Date.parse(emailPolicyStartAt)))problems.push('EMAIL_VERIFICATION_POLICY_START_AT must be the operator-approved UTC rollout timestamp');

for(const key of publicKeys)if(!/^price_[A-Za-z0-9]+$/.test(process.env[key]||''))problems.push(key+' must be a verified live-mode one-time JPY Price ID');
for(const key of legalKeys){
  const value=process.env[key];
  const expected={PRODUCT_TERMS_URL:targetOrigin+'/terms.html',PRODUCT_PRIVACY_URL:targetOrigin+'/privacy.html',PRODUCT_COMMERCE_URL:targetOrigin+'/commerce.html'}[key];
  try{const url=new URL(value);if(url.href!==expected||url.username||url.password||url.search||url.hash)throw Error();legal[key]=url.href;}
  catch{problems.push(key+' must point to the reviewed public HTTPS page');}
}
}
if(complimentarySaveLimit!==3)problems.push('The Hosting artifact must grant existing accounts the 3-slot personal entitlement');
if(process.env.PRODUCT_COMPLIMENTARY_SAVE_LIMIT&&process.env.PRODUCT_COMPLIMENTARY_SAVE_LIMIT!=='3')problems.push('PRODUCT_COMPLIMENTARY_SAVE_LIMIT must be 3 to match the Hosting artifact');
if(process.env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF&&process.env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF!==cutoff)problems.push('PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF must match the Hosting artifact');
if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(cutoff||'')||!Number.isFinite(Date.parse(cutoff)))problems.push('Build artifact must contain a fixed UTC cutoff for existing-account entitlement grants');
const legacyLine=process.env.PRODUCT_LEGACY_LINE_LOGIN_ENABLED==='1';
const salesSettings={
  GCLOUD_PROJECT:'ailandgames',PRODUCT_PUBLIC_ORIGIN:targetOrigin,STRIPE_MODE:'live',
  PRODUCT_SALES_ENABLED:'1',PRODUCT_SELLER_INFO_COMPLETE:'1',
  FIREBASE_ACCOUNT_LOGIN_ENABLED:'1',FIREBASE_SAVE_MIGRATION_READY:'1',EMAIL_VERIFICATION_POLICY_START_AT:emailPolicyStartAt||'',
  PRODUCT_COMPLIMENTARY_SAVE_LIMIT:'3',PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF:cutoff||'',
  ...Object.fromEntries(publicKeys.map(key=>[key,process.env[key]||''])),
  ...Object.fromEntries(legalKeys.filter(key=>legal[key]).map(key=>[key,legal[key]])),
};
const settings=salesDisabled?{
  GCLOUD_PROJECT:'ailandgames',PRODUCT_PUBLIC_ORIGIN:targetOrigin,PRODUCT_SALES_ENABLED:'0',EMAIL_VERIFICATION_ONLY:'0',
  FIREBASE_ACCOUNT_LOGIN_ENABLED:'1',FIREBASE_SAVE_MIGRATION_READY:'1',
  EMAIL_VERIFICATION_POLICY_START_AT:process.env.EMAIL_VERIFICATION_POLICY_START_AT||'',
  PRODUCT_COMPLIMENTARY_SAVE_LIMIT:'3',PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF:cutoff||'',
}:salesSettings;
const secretRefs=['STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest','STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest'];
if(legacyLine){
  for(const key of ['LINE_CHANNEL_ID','LINE_PROVIDER_ID'])if(!process.env[key])problems.push(key+' is required when legacy LINE login is explicitly enabled');
  for(const key of ['LINE_CHANNEL_ID','LINE_PROVIDER_ID'])if(process.env[key])settings[key]=process.env[key];
  const redirect=targetOrigin+'/api/auth/line/callback';settings.LINE_REDIRECT_URI=redirect;settings.PRODUCT_LEGACY_LINE_LOGIN_ENABLED='1';
  secretRefs.push('LINE_CHANNEL_SECRET=LINE_CHANNEL_SECRET:latest');
}
for(const value of Object.values(settings))if(/[\r\n,]/.test(value))problems.push('A public setting contains an invalid separator');

if(problems.length){
  console.log(JSON.stringify({ready:false,target:salesDisabled?'ailandgames / legend-heroes-api / asia-northeast1':'ailandgames / legend-heroes2.web.app',mode:salesDisabled?'sales-disabled':process.env.STRIPE_MODE||'unset',blockingItems:[...new Set(problems)]},null,2));
  if(deploy)process.exit(1);
  process.exitCode=1;
}else if(!deploy){
  console.log(JSON.stringify({ready:true,published:false,target:salesDisabled?'ailandgames / legend-heroes-api / asia-northeast1':'ailandgames / legend-heroes2.web.app',mode:salesDisabled?'sales-disabled':'live',secretNames:salesDisabled?[]:['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET',...(legacyLine?['LINE_CHANNEL_SECRET']:[])],note:'Readiness variables pass. No service or secret values were read, created, or changed.'},null,2));
}else{
  if(salesDisabled){
    const probe=spawnSync('gcloud',['run','services','describe','legend-heroes-api','--project=ailandgames','--region=asia-northeast1','--format=value(metadata.name)'],{cwd:root,stdio:'ignore'});
    if(probe.error||probe.status!==0){console.error('The existing Cloud Run service was not confirmed; refusing to create or replace a service.');process.exit(1);}
  }
  const args=['run','deploy','legend-heroes-api','--project=ailandgames','--region=asia-northeast1',
    '--source=.','--service-account=legend-heroes-api@ailandgames.iam.gserviceaccount.com',
    '--allow-unauthenticated','--min=0','--max=1','--max-instances=1','--cpu=1','--memory=512Mi',
    '--concurrency=20','--timeout=60s','--cpu-throttling','--no-cpu-boost',
    (salesDisabled?'--update-env-vars=':'--set-env-vars=')+Object.entries(settings).map(([key,value])=>key+'='+value).join(','),
    ...(!salesDisabled?['--set-secrets='+secretRefs.join(',')]:[])];
  const result=spawnSync('gcloud',args,{cwd:root,stdio:'inherit'});
  if(result.error){console.error('Google Cloud CLI is unavailable.');process.exit(1);}
  process.exit(result.status??1);
}
