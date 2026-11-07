import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createFinancialRetentionSource} from '../server/account-deletion-financial-retention.mjs';
import {createExplicitSharedRankingDeletionSource} from '../server/account-deletion-shared-source.mjs';

function financial({badOwner=false,badField=false,failDeleteOnce=false}={}){
  const sourceRows=new Map([['fixture-receipt',{id:'fixture-receipt',revision:'rev1',data:{accountId:badOwner?'other':'fixture-account',amount:4980,currency:'jpy',createdAt:1000,...(badField?{amount:{private:'not-allowed'}}:{}),email:'never@copy.invalid',checkoutParams:{not:'retained'}}}]]),archives=new Map();let clock=2000,fail=failDeleteOnce;
  const reader={async listOwned(){return {complete:true,ownershipVerified:true,unattributedCount:0,records:[...sourceRows.values()]};},async deleteOwnedIfUnchanged({id,accountId,expectedRevision}){const row=sourceRows.get(id);assert.equal(row.data.accountId,accountId);assert.equal(row.revision,expectedRevision);if(fail){fail=false;throw Error('fixture source delete interruption');}sourceRows.delete(id);}};
  const archive={async putIfAbsent({id,record}){if(!archives.has(id))archives.set(id,{...record});return {durable:true,...archives.get(id)};},async listDue({now}){return {complete:true,records:[...archives].filter(([,r])=>r.retainUntil<=now).map(([id,record])=>({id,record,revision:'archive-rev1'}))};},async deleteIfUnchanged({id,expectedRevision}){assert.equal(expectedRevision,'archive-rev1');archives.delete(id);}};
  const config={collections:['purchases'],policyId:'fixture-approved-policy',purpose:'fixture purpose only',retentionMs:3000,fieldsByCollection:{purchases:['amount','currency','createdAt']},reader,archive,now:()=>clock};
  return {source:createFinancialRetentionSource(config),config,sourceRows,archives,setNow:value=>{clock=value;}};
}
const policy={transactionDisposition:'retain_minimized',financialPolicyId:'fixture-approved-policy'};

test('financial minimization requires explicit purpose, period, field allowlist and matching policy',async()=>{
  const h=financial();
  for(const patch of [{retentionMs:undefined},{purpose:''},{fieldsByCollection:{purchases:['email']}},{fieldsByCollection:{purchases:[]}}])assert.throws(()=>createFinancialRetentionSource({...h.config,...patch}),/policy_required|allowlist_required/);
  assert.equal((await h.source.inspect({accountId:'fixture-account',policy:{...policy,financialPolicyId:'unknown'}})).dispositionSupported,false);
  assert.equal((await h.source.inspect({accountId:'fixture-account',policy})).complete,true);
});

test('copy-before-delete survives interruption, retains only allowed fields and expires by supplied policy',async()=>{
  const h=financial({failDeleteOnce:true}),input={accountId:'fixture-account',requestId:'fixture-request',disposition:'retain_minimized',policy};
  await assert.rejects(h.source.apply(input),/interruption/);assert.equal(h.sourceRows.size,1);assert.equal(h.archives.size,1);
  await h.source.apply(input);assert.equal(h.sourceRows.size,0);assert.equal(h.archives.size,1);
  const row=[...h.archives.values()][0];assert.deepEqual(row.fields,{amount:4980,currency:'jpy',createdAt:1000});assert.equal(row.retainUntil,4000);
  assert.doesNotMatch(JSON.stringify(row),/never@copy|checkoutParams|fixture-account/);
  assert.deepEqual(await h.source.purgeExpired(),{removed:0});h.setNow(4000);assert.deepEqual(await h.source.purgeExpired(),{removed:1});
});

test('unverified owner or nested value aborts financial minimization before archive writes',async()=>{
  for(const options of [{badOwner:true},{badField:true}]){const h=financial(options);assert.equal((await h.source.inspect({accountId:'fixture-account',policy})).complete,false);await assert.rejects(h.source.apply({accountId:'fixture-account',requestId:'fixture',disposition:'retain_minimized',policy}),/owner_or_revision|field_invalid/);assert.equal(h.archives.size,0);assert.equal(h.sourceRows.size,1);}
});

test('a mismatched archive fingerprint prevents the original financial record from being deleted',async()=>{
  const h=financial(),source=createFinancialRetentionSource({...h.config,archive:{...h.config.archive,async putIfAbsent({record}){return {...record,durable:true,recordFingerprint:'corrupt'};}}});
  await assert.rejects(source.apply({accountId:'fixture-account',requestId:'fixture',disposition:'retain_minimized',policy}),/financial_archive_scope_conflict/);assert.equal(h.sourceRows.size,1);
});

test('shared updates require explicit display-redaction policy, exact ownership and CAS evidence',async()=>{
  const records=[{collection:'raidRankings_fixture',documentId:'fixture-slot',revision:'rev1',data:{slotKey:'fixture-slot',playerName:'fixture-name',score:99}},{collection:'raidRankings_fixture',documentId:'other-slot',revision:'rev2',data:{slotKey:'other-slot',playerName:'other-name',score:88}}],written=[];
  const base={sourceProject:'fixture-raid-project',async listRecords(){return {sourceProject:'fixture-raid-project',complete:true,records};},async resolveOwner({slotKey}){return {verified:true,accountId:slotKey==='fixture-slot'?'fixture-account':'other-account'};},async applyOperation(operation){written.push(operation);}};
  const source=createExplicitSharedRankingDeletionSource(base),input={accountId:'fixture-account',policy:{sharedRecordDisposition:'anonymize',sharedDisplayRedactionAccepted:true}};
  assert.equal((await source.inspect({...input,policy:{sharedRecordDisposition:'anonymize'}})).complete,false);
  assert.equal((await source.inspect(input)).count,1);
  assert.deepEqual(await source.apply({...input,disposition:'anonymize'}),{redacted:1,irreversiblyAnonymized:false});assert.equal(written.length,1);assert.equal(written[0].expectedRevision,'rev1');assert.equal(written[0].expectedSha256.length,64);assert.equal(written[0].after.playerName,'勇者');assert.equal(written[0].after.score,99);
  const unverified=createExplicitSharedRankingDeletionSource({...base,async resolveOwner(){return null;}});assert.equal((await unverified.inspect(input)).complete,false);await assert.rejects(unverified.apply({...input,disposition:'anonymize'}),/ownership_or_shape/);assert.equal(written.length,1);
});
