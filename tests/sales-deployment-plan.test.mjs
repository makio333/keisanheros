import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createSalesDeploymentPlan,hashSalesDeploymentSnapshot,SALES_DEPLOYMENT_TARGET,SALES_DEPLOYMENT_LIMITS} from '../scripts/lib/sales-deployment-plan.mjs';

function fixture({exists=false,mode='sales-disabled'}={}){
  const settings={GCLOUD_PROJECT:'ailandgames',PRODUCT_PUBLIC_ORIGIN:'https://legend-heroes2.web.app',PRODUCT_SALES_ENABLED:mode==='live'?'1':'0',EMAIL_VERIFICATION_ONLY:'0',FIREBASE_ACCOUNT_LOGIN_ENABLED:'1',FIREBASE_SAVE_MIGRATION_READY:'1',EMAIL_VERIFICATION_POLICY_START_AT:'2026-11-09T00:00:00.000Z',PRODUCT_COMPLIMENTARY_SAVE_LIMIT:'3',PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF:'2026-10-28T05:37:12.494Z',PRODUCT_LEGACY_LINE_LOGIN_ENABLED:'0'};
  if(mode==='live')Object.assign(settings,{STRIPE_MODE:'live',PRODUCT_SELLER_INFO_COMPLETE:'1',STRIPE_PERSONAL_PRICE_ID:'price_fixturePersonal',STRIPE_ORGANIZATION10_PRICE_ID:'price_fixture10',STRIPE_ORGANIZATION20_PRICE_ID:'price_fixture20',STRIPE_ORGANIZATION30_PRICE_ID:'price_fixture30',PRODUCT_TERMS_URL:'https://legend-heroes2.web.app/terms.html',PRODUCT_PRIVACY_URL:'https://legend-heroes2.web.app/privacy.html',PRODUCT_COMMERCE_URL:'https://legend-heroes2.web.app/commerce.html'});
  const snapshot={exists,target:{...SALES_DEPLOYMENT_TARGET},revision:exists?'legend-heroes-api-fixture001':null,capturedAt:'2026-11-02T00:00:00.000Z',settings:exists?{...settings,PRODUCT_SALES_ENABLED:'0'}:{},secretRefs:{},limits:exists?{...SALES_DEPLOYMENT_LIMITS,cpu:2}:null};
  return {schemaVersion:1,operation:exists?'update':'create',mode,target:{...SALES_DEPLOYMENT_TARGET},snapshot,expectedBaselineHash:hashSalesDeploymentSnapshot(snapshot),desired:{settings,secretRefs:mode==='live'?{STRIPE_SECRET_KEY:{secret:'projects/ailandgames/secrets/STRIPE_SECRET_KEY',version:3},STRIPE_WEBHOOK_SECRET:{secret:'projects/ailandgames/secrets/STRIPE_WEBHOOK_SECRET',version:4}}:{},limits:{...SALES_DEPLOYMENT_LIMITS}},approvals:{budgetApproved:true,iamApproved:true,publicAccessApproved:true,exactTargetApproved:true,backupPolicyApproved:true},email:{from:'fixture@example.invalid',senderVerified:true},backup:{policyId:'fixture-approved-backup-policy',retentionDays:19},budget:{currency:'JPY',monthlyPlanningTarget:3000,scope:'proposed-cloud-and-mail-excludes-stripe',scopeConfirmed:true},worker:{enabled:false,mode:'dry-run',limit:100},scheduler:{enabled:false,schedule:'0 3 * * *',timeZone:'Asia/Tokyo'}};
}

test('new sales-disabled service can be planned without an existing API or Stripe secret and never executes',()=>{
  const plan=createSalesDeploymentPlan(fixture());
  assert.equal(plan.ready,true);assert.equal(plan.operation,'create');assert.equal(plan.executable,false);assert.equal(plan.executed,false);assert.equal(plan.productionVerified,false);assert.deepEqual(plan.changes.secretRefs.set,[]);assert.deepEqual(plan.changes.limits.after,SALES_DEPLOYMENT_LIMITS);assert.equal(plan.worker.purgeEnabled,false);assert.equal(plan.budget.hardCap,false);
});

test('existing service changes are patch-only, retain unspecified settings and show current-to-proposed limits',()=>{
  const input=fixture({exists:true});input.snapshot.settings.STRIPE_MODE='test';input.expectedBaselineHash=hashSalesDeploymentSnapshot(input.snapshot);
  const plan=createSalesDeploymentPlan(input);
  assert.equal(plan.ready,true);assert.equal(plan.changes.limits.before.cpu,2);assert.equal(plan.changes.limits.after.cpu,1);assert.deepEqual(plan.changes.settings.remove,[]);assert.deepEqual(plan.changes.secretRefs.remove,[]);assert.equal(plan.changes.settings.strategy,'patch-only-preserve-unspecified');assert.equal(plan.changes.settings.set.some(row=>row.name==='STRIPE_MODE'),false);
});

test('hash detects revision/settings/secret metadata drift, but a fresh timestamp alone is not drift',()=>{
  const input=fixture({exists:true}),same=structuredClone(input.snapshot);same.capturedAt='2026-11-03T00:00:00.000Z';assert.equal(hashSalesDeploymentSnapshot(same),input.expectedBaselineHash);
  input.snapshot.revision='legend-heroes-api-fixture002';const drift=createSalesDeploymentPlan(input);assert.equal(drift.ready,false);assert.ok(drift.unresolved.includes('baseline_drift_detected'));
  const missing=fixture();delete missing.expectedBaselineHash;assert.ok(createSalesDeploymentPlan(missing).unresolved.includes('reviewed_baseline_hash_required'));
});

test('live references require integer versions and correct project/secret names; payloads/latest never enter output',()=>{
  const input=fixture({mode:'live'}),plan=createSalesDeploymentPlan(input);assert.equal(plan.ready,true);assert.equal(plan.changes.secretRefs.set[0].after.version,3);
  for(const patch of [{version:'latest'},{version:'3'},{version:0},{version:1.1},{secret:'projects/other/secrets/STRIPE_SECRET_KEY'}]){const bad=structuredClone(input);Object.assign(bad.desired.secretRefs.STRIPE_SECRET_KEY,patch);assert.throws(()=>createSalesDeploymentPlan(bad),/integer_secret_version_required/);}
  const bad=structuredClone(input);bad.desired.secretRefs.STRIPE_SECRET_KEY.payload='never-allowed';assert.throws(()=>createSalesDeploymentPlan(bad),/secret_payload_rejected/);
  const key=structuredClone(input);key.desired.settings.PRODUCT_PUBLIC_ORIGIN='sk_live_fixture_payload';assert.throws(()=>createSalesDeploymentPlan(key),/secret_payload_rejected/);
});

test('unknown environment names, secret-shaped settings, fields, targets and execution flags are rejected',()=>{
  const input=fixture();
  for(const mutate of [x=>{x.desired.settings.UNKNOWN_ENV='anything';},x=>{x.desired.settings.STRIPE_SECRET_KEY='not-even-a-real-secret';},x=>{x.execute=true;},x=>{x.target.project='other-project';},x=>{x.desired.settings.PRODUCT_LEGACY_LINE_LOGIN_ENABLED='1';}]){const bad=structuredClone(input);mutate(bad);assert.throws(()=>createSalesDeploymentPlan(bad),/deployment_plan_/);}
  const absent=fixture();absent.snapshot.exists=true;assert.throws(()=>createSalesDeploymentPlan(absent),/snapshot_invalid|operation_baseline_mismatch/);
});

test('missing costs approval, mail sender or backup retention remains unresolved and values are not invented',()=>{
  const input=fixture();input.approvals.budgetApproved=false;input.email={};input.backup={};input.budget.scopeConfirmed=false;
  const plan=createSalesDeploymentPlan(input);assert.equal(plan.ready,false);for(const key of ['usage_costs_not_approved','mail_from_not_configured','mail_sender_not_verified','backup_retention_not_configured','budget_scope_not_confirmed'])assert.ok(plan.unresolved.includes(key));
  assert.equal(plan.mail.from,null);assert.equal(plan.backup.retentionDays,null);assert.equal(plan.budget.monthlyPlanningTarget,3000);assert.equal(plan.budget.approved,false);
});

test('cutover and complimentary cutoff changes are explicit blockers even if caller says approved',()=>{
  const input=fixture({exists:true});input.desired.settings.EMAIL_VERIFICATION_POLICY_START_AT='2026-11-10T00:00:00.000Z';input.desired.settings.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF='2026-11-01T00:00:00.000Z';
  const plan=createSalesDeploymentPlan(input);assert.equal(plan.ready,false);assert.ok(plan.unresolved.includes('immutable_cutover_changed:EMAIL_VERIFICATION_POLICY_START_AT'));assert.ok(plan.unresolved.includes('immutable_cutover_changed:PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF'));
});

test('worker/scheduler proposals are limited to dry-run with bounded batch size and exact cadence',()=>{
  const input=fixture();input.worker.enabled=true;input.scheduler.enabled=true;const plan=createSalesDeploymentPlan(input);assert.equal(plan.ready,true);assert.equal(plan.worker.job,'legend-heroes-deletion-worker');assert.equal(plan.scheduler.callerServiceAccount,'legend-heroes-deletion-scheduler@ailandgames.iam.gserviceaccount.com');
  for(const mutate of [x=>{x.worker.mode='execute';},x=>{x.worker.limit=101;},x=>{x.worker.limit=0;},x=>{x.scheduler.timeZone='UTC';},x=>{x.scheduler.schedule='* * * * *';},x=>{x.worker.enabled=false;}]){const bad=structuredClone(input);mutate(bad);assert.throws(()=>createSalesDeploymentPlan(bad),/worker_dry_run_required|scheduler_invalid/);}
});

test('IAM is a description only, secret scope is individual and sales/worker Auth privileges differ',()=>{
  const plan=createSalesDeploymentPlan(fixture({mode:'live'}));
  const api=plan.iamRequirements.find(row=>row.principal===SALES_DEPLOYMENT_TARGET.serviceAccount&&row.customRolePermissions);assert.deepEqual(api.customRolePermissions,['firebaseauth.users.get','firebaseauth.users.update']);
  const worker=plan.iamRequirements.find(row=>row.principal.startsWith('legend-heroes-deletion-worker')&&row.customRolePermissions);assert.ok(worker.customRolePermissions.includes('firebaseauth.users.delete'));
  assert.equal(plan.iamRequirements.filter(row=>row.role==='roles/secretmanager.secretAccessor').every(row=>row.scope.startsWith('projects/ailandgames/secrets/')),true);assert.doesNotMatch(JSON.stringify(plan.iamRequirements),/roles\/(?:owner|editor|firebaseauth.admin)/);
});

test('planner and CLI contain no launch, network, SDK or environment-read capability',async()=>{
  for(const file of ['../scripts/lib/sales-deployment-plan.mjs','../scripts/plan-sales-deployment.mjs']){
    const source=await readFile(new URL(file,import.meta.url),'utf8');
    assert.doesNotMatch(source,/node:child_process|\bfetch\s*\(|\bspawn(?:Sync)?\s*\(|\bexec(?:File|Sync)?\s*\(|process\.env|from ['"](?:firebase|google-auth|stripe)/);
  }
});
