import path from 'node:path';
import {createHash} from 'node:crypto';

export const SALES_RELEASE_PAGES=Object.freeze(['index.html','commerce.html','terms.html','privacy.html','purchase-email-verification.html','account-deletion.html','account-device-cleanup.html']);
const sha256=value=>createHash('sha256').update(value).digest('hex');
const safeName=name=>typeof name==='string'&&name.length>0&&!name.startsWith('/')&&!/[\\\x00-\x1f]/.test(name)&&path.posix.normalize(name)===name&&!name.split('/').includes('..');

export function assertSalesReleaseOutput(output,root){
  if(typeof output!=='string'||!path.isAbsolute(output)||typeof root!=='string'||!path.isAbsolute(root))throw Error('sales_release_absolute_output_required');
  const value=path.resolve(output),relative=path.relative(root,value);
  if(!relative.startsWith('docs'+path.sep+'sales-preparation-20261102'+path.sep)&&!/^\/(?:private\/)?tmp\/legend-sales-release-[^/]+(?:\/[^/]+)*$/.test(value))throw Error('sales_release_output_not_isolated');
  if(value.split(path.sep).some(part=>part.startsWith('.')))throw Error('sales_release_hidden_output_rejected');
  return value;
}

// This check only gates loading the browser modules. Server admission, ownership,
// token verification and operation permissions remain necessary even when true.
// Kept self-contained so the build can place it before any dynamic Firebase import.
export function salesReleasePageAdmission(runtime,origin,page){
  if(!runtime||runtime.kind!=='sales-release-runtime'||runtime.mode!=='approved-runtime'||runtime.ready!==true)return {enabled:false,error:'sales_release_runtime_disabled'};
  if(origin!=='https://legend-heroes2.web.app'||runtime.origin!==origin||runtime.projectId!=='ailandgames')return {enabled:false,error:'sales_release_runtime_target_mismatch'};
  if(!['email','deletion','cleanup'].includes(page)||runtime.pages?.[page]!==true)return {enabled:false,error:'sales_release_page_disabled'};
  if(runtime.productionAdmissionVerified!==true||runtime.policyReviewVerified!==true)return {enabled:false,error:'sales_release_admission_unverified'};
  if(page!=='cleanup'&&runtime.authEnabled!==true)return {enabled:false,error:'sales_release_auth_disabled'};
  if(page==='email'&&runtime.emailDeliveryVerified!==true)return {enabled:false,error:'sales_release_email_unverified'};
  if(page==='deletion'&&runtime.deletionReadinessVerified!==true)return {enabled:false,error:'sales_release_deletion_unverified'};
  return {enabled:true};
}

export function createSalesReleaseBootstrap({page,modulePath}={}){
  if(!['email','deletion','cleanup'].includes(page)||typeof modulePath!=='string'||!path.isAbsolute(modulePath)||/[\x00-\x1f]/.test(modulePath))throw Error('sales_release_bootstrap_invalid');
  // Review mode is a build-time literal. No query, storage, global variable or env
  // flag can turn this package into a live client. The complete modules are bundled
  // as dynamic dependencies, ready for a separate reviewed release integration.
  return `const runtime=Object.freeze({kind:'sales-release-runtime',mode:'review',ready:false,origin:'https://legend-heroes2.web.app',projectId:'ailandgames',authEnabled:false,pages:{email:false,deletion:false,cleanup:false},productionAdmissionVerified:false,policyReviewVerified:false,emailDeliveryVerified:false,deletionReadinessVerified:false});\nconst admission=(${salesReleasePageAdmission.toString()})(runtime,location.origin,${JSON.stringify(page)});\nif(!admission.enabled){for(const field of document.querySelectorAll('button,input,select,textarea'))field.disabled=true;for(const form of document.querySelectorAll('form'))form.inert=true;const status=document.getElementById(${JSON.stringify(page==='deletion'?'deletion-status':'status')});if(status)status.textContent='販売準備のレビュー用です。認証・メール送信・申請・端末内削除は実行しません。';const identity=document.getElementById('deletion-identity');if(identity)identity.textContent='本番アカウントには接続していません';}else{await import(${JSON.stringify(modulePath)});}\n`;
}

export function prepareSalesReleaseHtml(html,{entryName,cssName}={}){
  if(typeof html!=='string'||!/<\/head>/i.test(html)||!/<body\b/i.test(html))throw Error('sales_release_html_required');
  if(entryName&&!/^[a-z-]+\.mjs$/.test(entryName)||cssName&&!/^[a-z-]+\.css$/.test(cssName))throw Error('sales_release_entry_invalid');
  let result=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'');
  result=result.replace(/<meta\s+name=["']robots["'][^>]*>/gi,'');
  const security=`<meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'">`;
  result=result.replace(/<\/head>/i,security+(cssName?`<link rel="stylesheet" href="/${cssName}">`:'')+'</head>');
  result=result.replace(/<body\b[^>]*>/i,match=>match+'<aside data-sales-release="review" style="padding:16px;background:#fff5e9;border:1px solid #d87d32;font:16px/1.7 system-ui,sans-serif"><strong>未公開の販売用レビュー候補です。</strong>実アカウント・メール・決済・削除には接続しません。 <a href="/">ページ一覧</a></aside>');
  if(entryName){
    result=result.replace(/<(button|input|select|textarea)\b/gi,'<$1 disabled').replace(/<form\b/gi,'<form inert');
    result=result.replace(/<\/body>/i,`<script type="module" src="/${entryName}"></script></body>`);
  }
  return result;
}

export function inspectSalesGameSources(sources={}){
  const patterns=[['all-saves-read',/collection\(\s*db\s*,\s*["']saves["']\s*\)/g],['admin-gift-store',/["']admin_gifts["']/g],['admin-gift-api',/\bAdminGiftAPI\b/g]];
  const files=[],findings=[];
  for(const [name,source] of Object.entries(sources)){
    if(!safeName(name)||typeof source!=='string')throw Error('sales_release_source_invalid');
    files.push({path:name,sha256:sha256(source)});
    for(const [kind,regex] of patterns){
      regex.lastIndex=0;
      for(const match of source.matchAll(regex))findings.push({path:name,line:source.slice(0,match.index).split('\n').length,kind});
    }
  }
  return {kind:'lexical-source-inventory',gameIncluded:false,frontendAdminPathsExcluded:true,serverAdmissionVerified:false,
    requiresReview:findings.length>0,files,findings,
    note:'The game and Firebase direct-access modules are excluded from this candidate. Findings locate source code, not runtime reachability; server route admission and the future game entry require separate verification.'};
}

export function validateSalesReleaseDependencies(files,{bundle={}}={}){
  if(!files||typeof files!=='object'||Array.isArray(files))throw Error('sales_release_files_required');
  const failures=[];
  const bytes=name=>Buffer.isBuffer(files[name])?files[name].toString():files[name];
  for(const name of Object.keys(files))if(!safeName(name))throw Error('sales_release_unsafe_path');
  for(const page of SALES_RELEASE_PAGES){
    if(typeof bytes(page)!=='string'){failures.push({page,error:'required_page_missing'});continue;}
    const html=bytes(page);
    if(!/name="robots" content="noindex,nofollow"/.test(html)||!html.includes("connect-src 'none'"))failures.push({page,error:'review_network_guard_missing'});
    for(const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)){
      const value=match[1];
      if(/^(?:https:|mailto:)/i.test(value)){if(match[0].startsWith('src='))failures.push({page,error:'external_dependency'});continue;}
      if(/^[a-z][a-z0-9+.-]*:/i.test(value)){failures.push({page,error:'unsafe_link'});continue;}
      const url=new URL(value,'https://candidate.invalid/'+page),target=decodeURIComponent(url.pathname.slice(1))||'index.html';
      if(!Object.hasOwn(files,target)){failures.push({page,error:'dependency_missing',target});continue;}
      if(url.hash&&!bytes(target).includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'))failures.push({page,error:'fragment_missing',target});
    }
  }
  for(const entry of Object.values(bundle)){
    for(const name of [entry.file,...(entry.css||[]),...(entry.assets||[])])if(!Object.hasOwn(files,name))failures.push({error:'bundle_dependency_missing',target:name});
    for(const key of [...(entry.imports||[]),...(entry.dynamicImports||[])])if(!Object.hasOwn(bundle,key))failures.push({error:'bundle_import_missing',target:key});
  }
  return {ok:failures.length===0,failures};
}

export function createSalesReleaseManifest({files,reviewStatus,gameInspection,bundle={},builtAt=new Date().toISOString()}={}){
  const dependencies=validateSalesReleaseDependencies(files,{bundle});
  if(!dependencies.ok)throw Error('sales_release_dependencies_invalid:'+JSON.stringify(dependencies.failures));
  const hashes={};
  for(const [name,value] of Object.entries(files)){
    if(/(?:^|\/)(?:\.env[^/]*|release-target\.json|firebase[^/]*\.json|service-account[^/]*|.*\.(?:pem|key))$/i.test(name))throw Error('sales_release_forbidden_file');
    if(!Buffer.isBuffer(value)&&typeof value!=='string')throw Error('sales_release_bytes_required');
    if(/(?:sk_live_|sk_test_|whsec_)[A-Za-z0-9]{12,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(value.toString()))throw Error('sales_release_credential_rejected');
    hashes[name]=sha256(value);
  }
  const remaining=Array.isArray(reviewStatus?.remainingChecks)?reviewStatus.remainingChecks.map(row=>row.id):['policy-status-unavailable'];
  const blockers=['review-runtime-disabled','production-admission-unverified','game-sales-entry-excluded',...remaining];
  if(reviewStatus?.readyForProduction!==true||reviewStatus?.published!==false)blockers.push('policy-review-not-approved');
  if(reviewStatus?.approvedPolicy?.backupRetentionDays==null)blockers.push('backup-retention-unapproved');
  if(gameInspection?.serverAdmissionVerified!==true)blockers.push('admin-server-admission-unverified');
  return {schemaVersion:1,kind:'sales-release-candidate',builtAt,published:false,deployable:false,
    salesEnabled:false,realAuthEnabled:false,emailSending:false,realDataProcessing:false,gameIncluded:false,
    modulesPackaged:['purchase-email-verification','account-deletion','account-device-cleanup'],
    runtimeMode:'review-locked',networkPolicy:'connect-src-none',dependenciesVerified:true,
    administrativeRoutes:{frontend:'excluded-with-game-entry',server:'required-separate-admission',verified:false},
    blockers:[...new Set(blockers)],files:Object.fromEntries(Object.entries(hashes).sort(([a],[b])=>a.localeCompare(b)))};
}
