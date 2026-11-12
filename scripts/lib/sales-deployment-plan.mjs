import {createHash} from 'node:crypto';

export const SALES_DEPLOYMENT_TARGET=Object.freeze({project:'ailandgames',region:'asia-northeast1',service:'legend-heroes-api',serviceAccount:'legend-heroes-api@ailandgames.iam.gserviceaccount.com'});
export const SALES_DEPLOYMENT_LIMITS=Object.freeze({cpu:1,memoryMiB:512,minInstances:0,maxInstances:1,concurrency:20,timeoutSeconds:60,billing:'request',cpuThrottling:true,startupCpuBoost:false});
const ORIGIN='https://legend-heroes2.web.app';
const SETTINGS=new Set(['GCLOUD_PROJECT','GOOGLE_CLOUD_PROJECT','PRODUCT_PUBLIC_ORIGIN','PRODUCT_SALES_ENABLED','EMAIL_VERIFICATION_ONLY','FIREBASE_ACCOUNT_LOGIN_ENABLED','FIREBASE_SAVE_MIGRATION_READY','EMAIL_VERIFICATION_POLICY_START_AT','PRODUCT_COMPLIMENTARY_SAVE_LIMIT','PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF','PRODUCT_LEGACY_LINE_LOGIN_ENABLED','STRIPE_MODE','STRIPE_PERSONAL_PRICE_ID','STRIPE_ORGANIZATION10_PRICE_ID','STRIPE_ORGANIZATION20_PRICE_ID','STRIPE_ORGANIZATION30_PRICE_ID','PRODUCT_SELLER_INFO_COMPLETE','PRODUCT_TERMS_URL','PRODUCT_PRIVACY_URL','PRODUCT_COMMERCE_URL']);
const STRIPE_PRICES=['STRIPE_PERSONAL_PRICE_ID','STRIPE_ORGANIZATION10_PRICE_ID','STRIPE_ORGANIZATION20_PRICE_ID','STRIPE_ORGANIZATION30_PRICE_ID'];
const SECRETS=new Set(['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET']);
const record=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const stable=value=>Array.isArray(value)?'['+value.map(stable).join(',')+']':record(value)?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stable(value[key])).join(',')+'}':JSON.stringify(value);
const fingerprint=value=>createHash('sha256').update(stable(value)).digest('hex');
const time=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;

function object(value,allowed,error){
  if(!record(value)||Object.keys(value).some(key=>!allowed.includes(key)))throw Error(error);
  return value;
}
function noPayload(value,depth=0){
  if(depth>12)throw Error('deployment_plan_input_too_deep');
  if(typeof value==='string'&&(/(?:sk_live_|sk_test_|rk_live_|rk_test_|whsec_)/.test(value)||/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(value)||value.length>2000))throw Error('deployment_plan_secret_payload_rejected');
  if(record(value))for(const [key,item] of Object.entries(value)){
    if(/^(?:value|payload|private_key|privateKey|client_secret|clientSecret|access_token|refresh_token|credentials|password)$/i.test(key))throw Error('deployment_plan_secret_payload_rejected');
    noPayload(item,depth+1);
  }
  else if(Array.isArray(value))for(const item of value)noPayload(item,depth+1);
  else if(value!==null&&!['string','boolean','number'].includes(typeof value))throw Error('deployment_plan_input_invalid');
}
function target(value){
  object(value,Object.keys(SALES_DEPLOYMENT_TARGET),'deployment_plan_target_invalid');
  if(stable(value)!==stable(SALES_DEPLOYMENT_TARGET))throw Error('deployment_plan_target_mismatch');
  return structuredClone(value);
}
function settings(value){
  if(!record(value)||Object.keys(value).some(key=>!SETTINGS.has(key)))throw Error('deployment_plan_unknown_setting');
  for(const [key,item] of Object.entries(value)){
    if(typeof item!=='string'||item.length>500||/[\r\n\x00]/.test(item))throw Error('deployment_plan_setting_invalid');
    if(['GCLOUD_PROJECT','GOOGLE_CLOUD_PROJECT'].includes(key)&&item!=='ailandgames')throw Error('deployment_plan_setting_target_mismatch');
    if(key==='PRODUCT_PUBLIC_ORIGIN'&&item!==ORIGIN)throw Error('deployment_plan_setting_target_mismatch');
    if(key==='PRODUCT_LEGACY_LINE_LOGIN_ENABLED'&&item!=='0')throw Error('deployment_plan_legacy_identity_change_rejected');
    if(key.endsWith('_PRICE_ID')&&!/^price_[A-Za-z0-9]+$/.test(item))throw Error('deployment_plan_price_metadata_invalid');
    if(['EMAIL_VERIFICATION_POLICY_START_AT','PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF'].includes(key)&&!time(item))throw Error('deployment_plan_timestamp_invalid');
    if(['PRODUCT_SALES_ENABLED','EMAIL_VERIFICATION_ONLY','FIREBASE_ACCOUNT_LOGIN_ENABLED','FIREBASE_SAVE_MIGRATION_READY','PRODUCT_SELLER_INFO_COMPLETE'].includes(key)&&!['0','1'].includes(item))throw Error('deployment_plan_flag_invalid');
    if(key==='STRIPE_MODE'&&!['test','live'].includes(item))throw Error('deployment_plan_stripe_mode_invalid');
    if(key==='PRODUCT_COMPLIMENTARY_SAVE_LIMIT'&&item!=='3')throw Error('deployment_plan_entitlement_change_rejected');
    const legal={PRODUCT_TERMS_URL:'/terms.html',PRODUCT_PRIVACY_URL:'/privacy.html',PRODUCT_COMMERCE_URL:'/commerce.html'};
    if(legal[key]&&item!==ORIGIN+legal[key])throw Error('deployment_plan_legal_url_invalid');
  }
  return structuredClone(value);
}
function secretRefs(value){
  if(!record(value)||Object.keys(value).some(key=>!SECRETS.has(key)))throw Error('deployment_plan_unknown_secret_reference');
  const result={};
  for(const [name,ref] of Object.entries(value)){
    object(ref,['secret','version'],'deployment_plan_secret_metadata_only');
    if(ref.secret!==`projects/ailandgames/secrets/${name}`||!Number.isSafeInteger(ref.version)||ref.version<1)throw Error('deployment_plan_integer_secret_version_required');
    result[name]={secret:ref.secret,version:ref.version};
  }
  return result;
}
function limits(value){
  object(value,Object.keys(SALES_DEPLOYMENT_LIMITS),'deployment_plan_limits_invalid');
  if(stable(value)!==stable(SALES_DEPLOYMENT_LIMITS))throw Error('deployment_plan_limits_mismatch');
  return structuredClone(value);
}
function observedLimits(value){
  object(value,Object.keys(SALES_DEPLOYMENT_LIMITS),'deployment_snapshot_limits_invalid');
  for(const key of ['cpu','memoryMiB','minInstances','maxInstances','concurrency','timeoutSeconds'])if(!Number.isSafeInteger(value[key])||value[key]<0||value[key]>1000000)throw Error('deployment_snapshot_limits_invalid');
  if(value.cpu<1||value.memoryMiB<128||value.maxInstances<1||value.minInstances>value.maxInstances||value.concurrency<1||value.timeoutSeconds<1||!['request','instance'].includes(value.billing)||typeof value.cpuThrottling!=='boolean'||typeof value.startupCpuBoost!=='boolean')throw Error('deployment_snapshot_limits_invalid');
  return structuredClone(value);
}
function snapshot(value){
  object(value,['exists','target','revision','capturedAt','settings','secretRefs','limits'],'deployment_snapshot_invalid');
  if(typeof value.exists!=='boolean'||!time(value.capturedAt)||value.exists&&(typeof value.revision!=='string'||!/^[a-zA-Z0-9-]{1,120}$/.test(value.revision))||!value.exists&&value.revision!==null)throw Error('deployment_snapshot_invalid');
  const parsed={exists:value.exists,target:target(value.target),revision:value.revision,capturedAt:value.capturedAt,settings:settings(value.settings),secretRefs:secretRefs(value.secretRefs),limits:value.exists?observedLimits(value.limits):null};
  if(!parsed.exists&&(Object.keys(parsed.settings).length||Object.keys(parsed.secretRefs).length||value.limits!==null))throw Error('deployment_absent_snapshot_has_configuration');
  return parsed;
}

// Hash the reviewed non-secret baseline, not the observation time. Re-reading an
// unchanged configuration preserves its hash; changed revision/settings do not.
export function hashSalesDeploymentSnapshot(value){
  noPayload(value);const {capturedAt,...baseline}=snapshot(value);return fingerprint(baseline);
}

export function createSalesDeploymentPlan(input){
  noPayload(input);
  object(input,['schemaVersion','operation','mode','target','snapshot','expectedBaselineHash','desired','approvals','email','backup','budget','worker','scheduler'],'deployment_plan_schema_invalid');
  if(input.schemaVersion!==1||!['create','update'].includes(input.operation)||!['sales-disabled','live'].includes(input.mode))throw Error('deployment_plan_mode_invalid');
  const selectedTarget=target(input.target),baseline=snapshot(input.snapshot),baselineHash=hashSalesDeploymentSnapshot(input.snapshot);
  if((input.operation==='create')===baseline.exists)throw Error('deployment_plan_operation_baseline_mismatch');
  if(input.expectedBaselineHash!==null&&input.expectedBaselineHash!==undefined&&!/^[a-f0-9]{64}$/.test(input.expectedBaselineHash))throw Error('deployment_plan_baseline_hash_invalid');
  object(input.desired,['settings','secretRefs','limits'],'deployment_plan_desired_invalid');
  const desired={settings:settings(input.desired.settings),secretRefs:secretRefs(input.desired.secretRefs),limits:limits(input.desired.limits)};
  const approvals=object(input.approvals||{},['budgetApproved','iamApproved','publicAccessApproved','exactTargetApproved','backupPolicyApproved'],'deployment_plan_approval_invalid');
  if(Object.values(approvals).some(value=>typeof value!=='boolean'))throw Error('deployment_plan_approval_invalid');
  const email=object(input.email||{},['from','senderVerified'],'deployment_plan_email_invalid');
  if(email.from!==undefined&&email.from!==null&&(typeof email.from!=='string'||email.from.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.from)))throw Error('deployment_plan_mail_from_invalid');
  if(email.senderVerified!==undefined&&typeof email.senderVerified!=='boolean')throw Error('deployment_plan_email_invalid');
  const backup=object(input.backup||{},['policyId','retentionDays'],'deployment_plan_backup_invalid');
  if(backup.policyId!==undefined&&backup.policyId!==null&&(typeof backup.policyId!=='string'||!/^[A-Za-z0-9._:-]{1,120}$/.test(backup.policyId)))throw Error('deployment_plan_backup_invalid');
  if(backup.retentionDays!==undefined&&backup.retentionDays!==null&&(!Number.isSafeInteger(backup.retentionDays)||backup.retentionDays<1||backup.retentionDays>366))throw Error('deployment_plan_backup_invalid');
  const budget=object(input.budget||{},['currency','monthlyPlanningTarget','scope','scopeConfirmed'],'deployment_plan_budget_invalid');
  if(budget.currency!==undefined&&budget.currency!=='JPY'||budget.monthlyPlanningTarget!==undefined&&(!Number.isSafeInteger(budget.monthlyPlanningTarget)||budget.monthlyPlanningTarget<1)||budget.scope!==undefined&&budget.scope!=='proposed-cloud-and-mail-excludes-stripe'||budget.scopeConfirmed!==undefined&&typeof budget.scopeConfirmed!=='boolean')throw Error('deployment_plan_budget_invalid');
  const worker=object(input.worker||{},['enabled','mode','limit'],'deployment_plan_worker_invalid');
  if(typeof worker.enabled!=='boolean'||worker.mode!=='dry-run'||!Number.isInteger(worker.limit)||worker.limit<1||worker.limit>100)throw Error('deployment_plan_worker_dry_run_required');
  const scheduler=object(input.scheduler||{},['enabled','schedule','timeZone'],'deployment_plan_scheduler_invalid');
  if(typeof scheduler.enabled!=='boolean'||scheduler.schedule!=='0 3 * * *'||scheduler.timeZone!=='Asia/Tokyo'||scheduler.enabled&&!worker.enabled)throw Error('deployment_plan_scheduler_invalid');
  const unresolved=[];
  if(!input.expectedBaselineHash)unresolved.push('reviewed_baseline_hash_required');
  else if(input.expectedBaselineHash!==baselineHash)unresolved.push('baseline_drift_detected');
  for(const [key,label] of Object.entries({budgetApproved:'usage_costs_not_approved',iamApproved:'sales_iam_not_approved',publicAccessApproved:'public_api_access_not_approved',exactTargetApproved:'exact_target_not_approved',backupPolicyApproved:'backup_policy_not_approved'}))if(approvals[key]!==true)unresolved.push(label);
  if(!email.from)unresolved.push('mail_from_not_configured');
  if(email.senderVerified!==true)unresolved.push('mail_sender_not_verified');
  if(!backup.policyId||!backup.retentionDays)unresolved.push('backup_retention_not_configured');
  if(!budget.currency||!budget.monthlyPlanningTarget)unresolved.push('monthly_planning_target_not_configured');
  if(!budget.scope||budget.scopeConfirmed!==true)unresolved.push('budget_scope_not_confirmed');
  const merged={...baseline.settings,...desired.settings};
  const required={PRODUCT_PUBLIC_ORIGIN:ORIGIN,GCLOUD_PROJECT:'ailandgames',PRODUCT_SALES_ENABLED:input.mode==='live'?'1':'0',EMAIL_VERIFICATION_ONLY:'0',FIREBASE_ACCOUNT_LOGIN_ENABLED:'1',FIREBASE_SAVE_MIGRATION_READY:'1',PRODUCT_COMPLIMENTARY_SAVE_LIMIT:'3'};
  for(const [key,expected] of Object.entries(required))if(merged[key]!==expected)unresolved.push('required_setting_missing_or_mismatched:'+key);
  for(const key of ['EMAIL_VERIFICATION_POLICY_START_AT','PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF']){
    if(!merged[key])unresolved.push('required_setting_missing_or_mismatched:'+key);
    if(baseline.settings[key]&&desired.settings[key]&&baseline.settings[key]!==desired.settings[key])unresolved.push('immutable_cutover_changed:'+key);
  }
  if(input.mode==='live'){
    const liveRequired={STRIPE_MODE:'live',PRODUCT_SELLER_INFO_COMPLETE:'1',PRODUCT_TERMS_URL:ORIGIN+'/terms.html',PRODUCT_PRIVACY_URL:ORIGIN+'/privacy.html',PRODUCT_COMMERCE_URL:ORIGIN+'/commerce.html'};
    for(const [key,expected] of Object.entries(liveRequired))if(merged[key]!==expected)unresolved.push('required_setting_missing_or_mismatched:'+key);
    for(const key of STRIPE_PRICES)if(!merged[key])unresolved.push('verified_live_price_id_required:'+key);
    for(const name of SECRETS)if(!desired.secretRefs[name]&&!baseline.secretRefs[name])unresolved.push('pinned_secret_reference_required:'+name);
    if(new Set(STRIPE_PRICES.map(name=>merged[name]).filter(Boolean)).size!==STRIPE_PRICES.length)unresolved.push('four_distinct_live_price_ids_required');
  }
  const settingChanges=Object.entries(desired.settings).filter(([name,value])=>baseline.settings[name]!==value).map(([name,after])=>({name,before:baseline.settings[name]??null,after}));
  const secretChanges=Object.entries(desired.secretRefs).filter(([name,value])=>stable(baseline.secretRefs[name])!==stable(value)).map(([name,after])=>({name,before:baseline.secretRefs[name]??null,after}));
  return Object.freeze({schemaVersion:1,kind:'sales-deployment-plan-only',ready:unresolved.length===0,executable:false,executed:false,productionVerified:false,published:false,
    operation:input.operation,mode:input.mode,target:selectedTarget,baselineHash,baselineCapturedAt:baseline.capturedAt,expectedBaselineHash:input.expectedBaselineHash??null,unresolved,
    changes:{settings:{strategy:'patch-only-preserve-unspecified',set:settingChanges,remove:[]},secretRefs:{strategy:'pin-integer-versions-patch-only',set:secretChanges,remove:[]},limits:{before:baseline.limits,after:desired.limits},publicAccess:{ingress:'all',invokerMember:'allUsers',invokerRole:'roles/run.invoker',scope:'service:'+selectedTarget.service,approved:approvals.publicAccessApproved===true}},
    mail:{from:email.from??null,senderVerified:email.senderVerified===true},backup:{policyId:backup.policyId??null,retentionDays:backup.retentionDays??null,approved:approvals.backupPolicyApproved===true},
    budget:{currency:budget.currency??null,monthlyPlanningTarget:budget.monthlyPlanningTarget??null,scope:budget.scope??null,scopeConfirmed:budget.scopeConfirmed===true,approved:approvals.budgetApproved===true,hardCap:false},
    worker:{...worker,project:'ailandgames',region:'asia-northeast1',job:'legend-heroes-deletion-worker',serviceAccount:'legend-heroes-deletion-worker@ailandgames.iam.gserviceaccount.com',purgeEnabled:false},
    scheduler:{...scheduler,project:'ailandgames',region:'asia-northeast1',name:'legend-heroes-deletion-daily',callerServiceAccount:'legend-heroes-deletion-scheduler@ailandgames.iam.gserviceaccount.com'},
    iamRequirements:[
      {principal:selectedTarget.serviceAccount,scope:'project:ailandgames',customRolePermissions:['firebaseauth.users.get','firebaseauth.users.update'],purpose:'verify current Auth user/revocation; disable and revoke after verified deletion request'},
      {principal:'legend-heroes-deletion-worker@ailandgames.iam.gserviceaccount.com',scope:'project:ailandgames',customRolePermissions:['firebaseauth.users.get','firebaseauth.users.update','firebaseauth.users.delete'],purpose:'repair provider protection and purge only approved due requests'},
      {principal:selectedTarget.serviceAccount,scope:'database:(default) in ailandgames',role:'roles/datastore.user',restriction:'Verify database IAM condition; without it this role covers project data, never claim collection isolation'},
      ...Object.values({...baseline.secretRefs,...desired.secretRefs}).map(ref=>({principal:selectedTarget.serviceAccount,scope:ref.secret,role:'roles/secretmanager.secretAccessor',version:ref.version})),
      {principal:'legend-heroes-deletion-scheduler@ailandgames.iam.gserviceaccount.com',scope:'job:legend-heroes-deletion-worker in ailandgames/asia-northeast1',role:'roles/run.invoker',purpose:'invoke only the reviewed dry-run job'},
    ],
    safetyNotes:['No command, SDK, credential lookup, network call, resource creation or IAM mutation is implemented.','ready means supplied plan metadata is complete, not that permissions, sender, prices or production have been verified.','This plan replaces neither approval nor execution; keep the old deployment script unchanged. Its :latest and whole environment replacement must not be used as an execution shortcut.','Budget alerts and maxInstances=1 are not spending caps.','Do not copy raid service-account approvals to the sales API or worker.'],
  });
}
