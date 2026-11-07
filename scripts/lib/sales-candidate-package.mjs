import path from 'node:path';
import {createHash} from 'node:crypto';

export const SALES_CANDIDATE_PAGES=Object.freeze([
  'index.html','commerce.html','terms.html','privacy.html','purchase-email-verification.html',
  'account-deletion.html','account-device-cleanup.html',
]);

export function createReadOnlySalesPage(html){
  if(typeof html!=='string'||!/<body\b/i.test(html)||!/<\/head>/i.test(html))throw Error('sales_candidate_html_required');
  const body=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'')
    .replace(/<(button|input|select|textarea)\b/gi,'<$1 disabled')
    .replace(/<form\b/gi,'<form inert');
  return body.replace(/<\/head>/i,'<style>body{font:16px/1.75 system-ui,sans-serif;color:#202438;margin:0 auto;max-width:920px;padding:24px}button,input{font:inherit}.sales-review-notice{padding:16px;background:#fff5e9;border:1px solid #d87d32;margin-bottom:24px}a{color:#315ec7}</style></head>')
    .replace(/<body\b[^>]*>/i,match=>match+'<aside class="sales-review-notice" data-sales-candidate="read-only"><strong>未公開の表示確認用です。</strong> 認証、退会申請、端末データ削除は実行できません。<br><a href="/">確認ページ一覧へ戻る</a></aside>');
}

export function assertSalesCandidateOutput(output,root){
  if(typeof output!=='string'||!path.isAbsolute(output)||typeof root!=='string'||!path.isAbsolute(root))throw Error('sales_candidate_absolute_output_required');
  const normalized=path.resolve(output),relative=path.relative(root,normalized);
  const insideDedicated=relative.startsWith('docs'+path.sep+'sales-preparation-20261102'+path.sep);
  const temporary=normalized.startsWith('/tmp/legend-sales-candidate-')||normalized.startsWith('/private/tmp/legend-sales-candidate-');
  if(!insideDedicated&&!temporary)throw Error('sales_candidate_output_not_isolated');
  if(path.basename(normalized).startsWith('.'))throw Error('sales_candidate_hidden_output_rejected');
  return normalized;
}

export function createSalesCandidateManifest({files,builtAt=new Date().toISOString()}={}){
  if(!files||typeof files!=='object'||Array.isArray(files))throw Error('sales_candidate_files_required');
  const hashes={};
  for(const [name,bytes] of Object.entries(files)){
    if(!name||path.posix.normalize(name)!==name||name.startsWith('/')||/[\\\x00-\x1f]/.test(name)||name.split('/').includes('..'))throw Error('sales_candidate_unsafe_path');
    if(/(?:^|\/)(?:\.env[^/]*|release-target\.json|firebase[^/]*\.json|service-account[^/]*|.*\.(?:pem|key))$/i.test(name))throw Error('sales_candidate_forbidden_file');
    if(!Buffer.isBuffer(bytes)&&typeof bytes!=='string')throw Error('sales_candidate_bytes_required');
    if(/(?:sk_live_|sk_test_|whsec_)[A-Za-z0-9]{12,}/.test(bytes.toString()))throw Error('sales_candidate_credential_rejected');
    hashes[name]=createHash('sha256').update(bytes).digest('hex');
  }
  if(SALES_CANDIDATE_PAGES.some(name=>!Object.hasOwn(hashes,name)))throw Error('sales_candidate_page_missing');
  return Object.freeze({schemaVersion:1,kind:'sales-preparation-review-only',builtAt,
    published:false,deployable:false,salesEnabled:false,realAuthEnabled:false,emailSending:false,
    livePayments:false,realDataProcessing:false,productionReadinessVerified:false,
    files:Object.fromEntries(Object.entries(hashes).sort(([a],[b])=>a.localeCompare(b)))});
}
