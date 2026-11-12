import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSalesCandidateOutput,createSalesCandidateManifest,createReadOnlySalesPage,SALES_CANDIDATE_PAGES} from '../scripts/lib/sales-candidate-package.mjs';

test('sales review package cannot target serving outputs, an arbitrary path, or an existing release contract',()=>{
  const root='/workspace/game';
  for(const output of [root,root+'/dist-product',root+'/dist-internal',root+'/docs/other','/tmp/other','/private/tmp/other'])assert.throws(()=>assertSalesCandidateOutput(output,root),/not_isolated/);
  assert.equal(assertSalesCandidateOutput('/tmp/legend-sales-candidate-fixture',root),'/tmp/legend-sales-candidate-fixture');
  assert.throws(()=>assertSalesCandidateOutput(root+'/docs/sales-preparation-20261102/../../dist-product',root),/not_isolated/);
  const files=Object.fromEntries(SALES_CANDIDATE_PAGES.map(name=>[name,'<html>fixture only</html>']));
  const manifest=createSalesCandidateManifest({files});
  assert.equal(manifest.salesEnabled,false);assert.equal(manifest.realAuthEnabled,false);assert.equal(manifest.deployable,false);
  assert.equal(manifest.productionReadinessVerified,false);assert.equal(manifest.published,false);
  for(const name of ['.env','nested/.env.local','release-target.json','firebase.product-hosting.json','credentials.pem','../outside'])assert.throws(()=>createSalesCandidateManifest({files:{...files,[name]:'fixture'}}));
  assert.throws(()=>createSalesCandidateManifest({files:{...files,'bad.js':'sk_live_'+'x'.repeat(20)}}),/credential_rejected/);
  delete files['privacy.html'];assert.throws(()=>createSalesCandidateManifest({files}),/page_missing/);
});

test('deletion and device-copy previews cannot initialize Auth, submit data or execute cleanup',()=>{
  const html='<!doctype html><html><head></head><body><form action="/api/account/deletion/confirm"><input><button onclick="erase()">削除</button></form><script type="module" src="/active.js"></script></body></html>';
  const candidate=createReadOnlySalesPage(html);
  assert.ok(!/<script\b|onclick\s*=/i.test(candidate));
  assert.match(candidate,/<form inert/);assert.match(candidate,/<button disabled/);assert.match(candidate,/<input disabled/);
  assert.match(candidate,/data-sales-candidate="read-only"/);
  assert.ok(SALES_CANDIDATE_PAGES.includes('account-deletion.html'));
  assert.ok(SALES_CANDIDATE_PAGES.includes('account-device-cleanup.html'));
});
