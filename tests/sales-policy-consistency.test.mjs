import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {test} from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PRICING_VERSION,PURCHASE_PRICES,purchaseQuote} from '../server/purchase-pricing.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const directory=path.join(root,'sales-pages');
const names=['commerce.html','terms.html','privacy.html','account-device-cleanup.html'];
const pages=Object.fromEntries(await Promise.all(names.map(async name=>[name,await readFile(path.join(directory,name),'utf8')])));
const review=JSON.parse(await readFile(path.join(directory,'review-status.json'),'utf8'));

test('review candidates agree with the actual price catalog and upgrade totals',()=>{
  assert.equal(review.approvedPolicy.pricingVersion,PRICING_VERSION);
  assert.equal(review.approvedPolicy.billing,'one-time');
  assert.equal(review.approvedPolicy.currency,'jpy');
  for(const [product,plan] of Object.entries(PURCHASE_PRICES)){
    assert.deepEqual(review.approvedPolicy[product],{saveLimit:plan.saveLimit,amount:plan.amount});
    const amount=plan.amount.toLocaleString('en-US');
    for(const name of ['commerce.html','terms.html'])assert.ok(pages[name].includes(amount+'円'),name+': missing price '+amount);
  }
  for(const [from,target] of [[3,'organization10'],[10,'organization20']]){
    const amount=purchaseQuote(from,target).amount.toLocaleString('en-US')+'円';
    for(const name of ['commerce.html','terms.html'])assert.ok(pages[name].includes(amount),name+': incorrect upgrade quote');
  }
  assert.equal(review.approvedPolicy.upgrade,'total-capacity-difference');
});

test('the deletion policy distinguishes calendar-month retention, shared scope, completion and device copies',()=>{
  for(const name of ['terms.html','privacy.html']){
    assert.match(pages[name],/東京時間の暦月1か月/);
    assert.match(pages[name],/受付直後/);
    assert.match(pages[name],/翌月の末日/);
    assert.match(pages[name],/アカウント全体|アカウント内の全員分/);
    assert.match(pages[name],/返金.*別/);
  }
  assert.match(pages['privacy.html'],/受付、保持期限後の処理、削除完了は区別/);
  assert.match(pages['privacy.html'],/復元するときは削除申請・削除済みの記録と照合/);
  assert.match(pages['account-device-cleanup.html'],/サーバーデータの削除、購入の取消・返金とは別/);
  assert.equal(review.approvedPolicy.backupRetentionDays,null,'unapproved backup proposal must remain unset');
  assert.match(pages['privacy.html'],/バックアップ7日保持は提案段階/);
});

test('purchase verification is separate from payment and never promises stronger identity checks',()=>{
  for(const name of ['commerce.html','terms.html','privacy.html']){
    assert.match(pages[name],/Google・LINE・メール/);
    assert.match(pages[name],/確認だけで(?:購入|決済)は行/);
    assert.match(pages[name],/別.*アカウント.*自動/);
  }
  assert.match(pages['privacy.html'],/年齢、親族関係、施設での役割の技術的な本人確認ではありません/);
  assert.match(pages['privacy.html'],/子どもや保護者の同意を自動で取得したことを意味しません/);
  assert.match(pages['privacy.html'],/IP遮断、多要素認証.*本番で実施済みとは案内していません/);
});

test('all local policy, deletion and cleanup links have real targets and valid fragments',async()=>{
  for(const [name,html] of Object.entries(pages)){
    for(const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)){
      const reference=match[1];
      if(/^(https:|mailto:)/.test(reference))continue;
      assert.ok(!/^(?:javascript:|data:|file:|http:)/i.test(reference),name+': unsafe reference');
      const url=new URL(reference,'https://fixture.invalid/'+name);
      const absolute=reference.startsWith('/')?path.join(root,url.pathname):path.join(directory,url.pathname);
      await access(absolute);
      if(url.hash){
        const target=await readFile(absolute,'utf8');
        const fragment=decodeURIComponent(url.hash.slice(1));
        assert.ok(target.includes('id="'+fragment+'"'),name+': broken fragment '+reference);
      }
    }
  }
});

test('review files stay blocked from sale and do not contain executable checkout or credentials',()=>{
  assert.equal(review.published,false);assert.equal(review.readyForProduction,false);
  assert.equal(review.status,'review-candidate');
  assert.ok(review.remainingChecks.some(row=>row.id==='live-checkout-methods-and-fulfillment'));
  assert.ok(review.remainingChecks.some(row=>row.id==='deletion-backup-delivery'));
  for(const [name,html] of Object.entries(pages)){
    assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
    assert.equal([...html.matchAll(/<h1[ >]/g)].length,1,name+': one primary heading');
    assert.ok(!/\b(?:sk_live_|sk_test_|whsec_)[A-Za-z0-9]{12,}/.test(html),name+': no private credentials');
    assert.ok(!/<form\b|checkout\.stripe\.com|\/api\/payments\/checkout/i.test(html),name+': no payment submission');
  }
  for(const name of ['commerce.html','terms.html','privacy.html']){
    assert.match(pages[name],/class="draft"/);
    assert.match(pages[name],/公開・Stripe登録には使用しないでください/);
  }
});
