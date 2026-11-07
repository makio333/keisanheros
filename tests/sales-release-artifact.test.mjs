import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {SALES_RELEASE_PAGES,assertSalesReleaseOutput,salesReleasePageAdmission,createSalesReleaseBootstrap,prepareSalesReleaseHtml,inspectSalesGameSources,validateSalesReleaseDependencies,createSalesReleaseManifest} from '../scripts/lib/sales-release-artifact.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const digest=value=>createHash('sha256').update(value).digest('hex');
const sample='<html><head><meta name="robots" content="index"></head><body><form><input><button onclick="erase()">送信</button></form><p id="status"></p><script type="module" src="/unsafe.js"></script></body></html>';
function fixtureFiles(){return Object.fromEntries(SALES_RELEASE_PAGES.map(name=>[name,prepareSalesReleaseHtml('<html><head></head><body><h1>fixture</h1><a href="/">一覧</a></body></html>')]));}

test('serving output, traversal, hidden and unrelated output paths cannot be selected',()=>{
  for(const directory of ['/workspace/game','/workspace/game/dist-product','/workspace/game/dist-internal','/tmp/unrelated','/workspace/game/docs/sales-preparation-20261102/../../dist-product','/tmp/legend-sales-release-fixture/.hidden'])assert.throws(()=>assertSalesReleaseOutput(directory,'/workspace/game'));
  assert.equal(assertSalesReleaseOutput('/tmp/legend-sales-release-fixture','/workspace/game'),'/tmp/legend-sales-release-fixture');
  assert.equal(assertSalesReleaseOutput('/workspace/game/docs/sales-preparation-20261102/release-candidate','/workspace/game'),'/workspace/game/docs/sales-preparation-20261102/release-candidate');
});

test('runtime admission demands exact target and per-operation proof; review cannot enable anything',()=>{
  const runtime={kind:'sales-release-runtime',mode:'approved-runtime',ready:true,origin:'https://legend-heroes2.web.app',projectId:'ailandgames',pages:{email:true,deletion:true,cleanup:true},productionAdmissionVerified:true,policyReviewVerified:true,authEnabled:true,emailDeliveryVerified:true,deletionReadinessVerified:true};
  for(const page of ['email','deletion','cleanup'])assert.equal(salesReleasePageAdmission(runtime,runtime.origin,page).enabled,true);
  for(const field of ['ready','productionAdmissionVerified','policyReviewVerified','authEnabled','emailDeliveryVerified'])assert.equal(salesReleasePageAdmission({...runtime,[field]:false},runtime.origin,'email').enabled,false,field);
  assert.equal(salesReleasePageAdmission({...runtime,deletionReadinessVerified:false},runtime.origin,'deletion').enabled,false);
  assert.equal(salesReleasePageAdmission({...runtime,mode:'review'},runtime.origin,'email').enabled,false);
  assert.equal(salesReleasePageAdmission(runtime,'https://other.invalid','email').enabled,false);
  assert.equal(salesReleasePageAdmission({...runtime,projectId:'other'},runtime.origin,'email').enabled,false);
});

test('locked bootstraps never import Firebase, call fetch or read local storage even if globals claim approval',async()=>{
  for(const page of ['email','deletion','cleanup']){
    const field={disabled:false},form={inert:false},status={textContent:''},identity={textContent:''};
    let imports=0;
    const context={location:{origin:'https://legend-heroes2.web.app'},__SALES_RELEASE_PREPARATION_ONLY__:false,
      SALES_RELEASE_RUNTIME:{ready:true},fetch(){throw Error('unexpected_network');},
      get localStorage(){throw Error('unexpected_storage');},
      document:{querySelectorAll(selector){return selector==='form'?[form]:[field];},getElementById(id){return id==='deletion-identity'?identity:status;}}};
    const source=createSalesReleaseBootstrap({page,modulePath:'/fixture/'+page+'.mjs'});
    await vm.runInNewContext('(async()=>{'+source+'})()',context,{importModuleDynamically:()=>{imports++;throw Error('unexpected_import');}});
    assert.equal(imports,0);assert.equal(field.disabled,true);assert.equal(form.inert,true);
    assert.match(status.textContent,/実行しません/);
    assert.match(identity.textContent,/接続していません/);
  }
});

test('page preparation replaces active scripts and applies independent network and form guards',()=>{
  const html=prepareSalesReleaseHtml(sample,{entryName:'entry-deletion.mjs',cssName:'account-deletion-page.css'});
  assert.ok(!html.includes('/unsafe.js'));assert.ok(!html.includes('onclick='));
  assert.match(html,/script type="module" src="\/entry-deletion.mjs"/);
  assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);assert.match(html,/worker-src 'none'/);
  assert.match(html,/<form inert/);assert.match(html,/<input disabled/);assert.match(html,/<button disabled/);
  assert.equal([...html.matchAll(/name="robots"/g)].length,1);
  assert.throws(()=>prepareSalesReleaseHtml(sample,{entryName:'../unsafe.mjs'}));
});

test('dependency validation catches a missing script, invalid fragment, missing dynamic chunk and unsafe URL',()=>{
  const files=fixtureFiles();
  assert.equal(validateSalesReleaseDependencies(files).ok,true);
  for(const link of ['/missing.js','privacy.html#absent','javascript:erase()']){
    const broken={...files,'index.html':files['index.html'].replace('</body>',`<a href="${link}">broken</a></body>`)};
    assert.equal(validateSalesReleaseDependencies(broken).ok,false,link);
  }
  assert.equal(validateSalesReleaseDependencies(files,{bundle:{main:{file:'assets/missing.js',dynamicImports:['missing-chunk']}}}).ok,false);
});

test('candidate remains nondeployable despite fabricated ready flags and rejects credential/config payloads',()=>{
  const files=fixtureFiles(),reviewStatus={published:false,readyForProduction:true,remainingChecks:[],approvedPolicy:{backupRetentionDays:null}};
  const manifest=createSalesReleaseManifest({files,reviewStatus,gameInspection:{serverAdmissionVerified:true}});
  assert.equal(manifest.deployable,false);assert.equal(manifest.published,false);assert.equal(manifest.realAuthEnabled,false);
  assert.ok(manifest.blockers.includes('backup-retention-unapproved'));
  assert.ok(manifest.blockers.includes('game-sales-entry-excluded'));
  for(const name of ['release-target.json','firebase.product-hosting.json','.env','secrets.key'])assert.throws(()=>createSalesReleaseManifest({files:{...files,[name]:'fixture'},reviewStatus}));
  assert.throws(()=>createSalesReleaseManifest({files:{...files,'bad.js':'sk_live_'+'x'.repeat(20)},reviewStatus}),/credential_rejected/);
});

test('administrative source inventory distinguishes excluded source findings from proven route protection',()=>{
  const inspection=inspectSalesGameSources({'firebase_init.js':'const rows = getDocs(collection(db, "saves"));','game_cloud_apis.js':'const AdminGiftAPI={}; const collectionName="admin_gifts";'});
  assert.equal(inspection.gameIncluded,false);assert.equal(inspection.serverAdmissionVerified,false);
  assert.equal(inspection.requiresReview,true);assert.equal(inspection.findings.length,3);
  assert.ok(inspection.findings.every(row=>row.line===1));
  assert.ok(inspection.files.every(row=>/^[0-9a-f]{64}$/.test(row.sha256)));
  assert.throws(()=>inspectSalesGameSources({'../outside':'fixture'}));
});

test('complete offline build packages functional modules behind locked entries without changing serving artifacts',async()=>{
  const serving=['dist-internal/release-target.json','dist-product/release-target.json','dist-product-free/release-target.json'];
  const before=await Promise.all(serving.map(async name=>{try{return digest(await readFile(path.join(root,name)));}catch{return null;}}));
  const child=spawnSync(process.execPath,['scripts/build-sales-release-candidate.mjs'],{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH,TMPDIR:process.env.TMPDIR||'/tmp'},timeout:30000,maxBuffer:1024*1024});
  assert.equal(child.status,0,child.stdout+'\n'+child.stderr);
  const result=JSON.parse(child.stdout.trim().split('\n').at(-1));
  assert.equal(result.deployable,false);assert.equal(result.dependenciesVerified,true);
  const manifest=JSON.parse(await readFile(path.join(result.output,'sales-release-candidate.json'),'utf8'));
  assert.equal(manifest.gameIncluded,false);assert.equal(manifest.runtimeMode,'review-locked');
  const assetNames=(await readdir(path.join(result.output,'assets'))).filter(name=>name.endsWith('.js'));
  const assetText=await Promise.all(assetNames.map(name=>readFile(path.join(result.output,'assets',name),'utf8')));
  const all=assetText.join('\n');
  assert.match(all,/削除予定日/,'actual deletion UI is retained');
  assert.match(all,/新しいメールへ確認/,'complete email UI is retained');
  assert.match(all,/元に戻せません/,'actual local-cleanup confirmation is retained');
  assert.ok(!/\bAdminGiftAPI\b|admin_gifts/.test(all),'shared admin modules are excluded');
  for(const name of ['purchase-email-verification.html','account-deletion.html','account-device-cleanup.html']){
    const html=await readFile(path.join(result.output,name),'utf8');
    assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);
    assert.ok(!html.includes('/sales-pages/account-deletion-page.js'));
  }
  for(const [name,hash] of Object.entries(manifest.files))assert.equal(digest(await readFile(path.join(result.output,name))),hash,name);
  const after=await Promise.all(serving.map(async name=>{try{return digest(await readFile(path.join(root,name)));}catch{return null;}}));
  assert.deepEqual(after,before,'serving builds were not changed');
});
