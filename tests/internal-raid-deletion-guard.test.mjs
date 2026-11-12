import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createInternalRaidAccountGuard,createInternalRaidDeletionGuard,createInternalRaidTokenAuthenticator,mapInternalRaidError,resolveOwnedSaveIdentity} from '../server/internal-raid-deletion-guard.mjs';

const uid='fixture-uid';
const claims={uid,aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',firebase:{sign_in_provider:'google.com'}};
const markerDb=(markers={},failure=null)=>({collection(name){return {doc(id){return {async get(){if(failure)throw failure;const marker=markers[`${name}/${id}`];return {exists:marker!==undefined,data:()=>marker};}};}};}});
const markerPath=(collection,id)=>`${collection}/${id}`;

test('valid unblocked users pass revoked-token verification and keep normal raid access',async()=>{
  let checkRevoked;
  const authenticate=createInternalRaidTokenAuthenticator({auth:{async verifyIdToken(_token,revoked){checkRevoked=revoked;return claims;}}});
  const assertAllowed=createInternalRaidAccountGuard({isUidBlocked:async()=>false});
  assert.deepEqual(await authenticate('fixture-token'),claims);
  await assertAllowed(claims.uid);
  assert.equal(checkRevoked,true);
});

test('pending and completed tombstones block the account even if Auth still accepts its token',async()=>{
  const hashedUid=createHash('sha256').update(uid).digest('hex');
  for(const state of ['retention_pending','purging','complete']){
    const isUidBlocked=createInternalRaidDeletionGuard({db:markerDb({[markerPath('accountDeletionTombstones',hashedUid)]:{state}})});
    const assertAllowed=createInternalRaidAccountGuard({isUidBlocked});
    await assert.rejects(assertAllowed(uid),{message:'account_deletion_in_progress'},state);
  }
});

test('visibility marker blocks access before retention purge',async()=>{
  const isUidBlocked=createInternalRaidDeletionGuard({db:markerDb({[markerPath('accountDeletionVisibility',uid)]:true})});
  const assertAllowed=createInternalRaidAccountGuard({isUidBlocked});
  await assert.rejects(assertAllowed(uid),{message:'account_deletion_in_progress'});
});

test('revoked or disabled Auth tokens are rejected with checkRevoked enabled',async()=>{
  let checkRevoked;
  const authenticate=createInternalRaidTokenAuthenticator({auth:{async verifyIdToken(_token,revoked){checkRevoked=revoked;throw Object.assign(Error('revoked'),{code:'auth/id-token-revoked'});}}});
  await assert.rejects(authenticate('revoked-fixture-token'),{message:'authentication_required'});
  assert.equal(checkRevoked,true);
});

test('Auth verification outages fail closed as a retryable service error',async()=>{
  const authenticate=createInternalRaidTokenAuthenticator({auth:{async verifyIdToken(){throw Object.assign(Error('fixture network outage'),{code:'auth/network-request-failed'});}}});
  await assert.rejects(authenticate('fixture-token'),{message:'token_verification_unavailable'});
  assert.deepEqual(mapInternalRaidError(Error('token_verification_unavailable')),{code:'token_verification_unavailable',status:503});
});

test('deletion marker read failures fail closed and map to service unavailable',async()=>{
  const isUidBlocked=createInternalRaidDeletionGuard({db:markerDb({},Error('fixture firestore unavailable'))});
  const assertAllowed=createInternalRaidAccountGuard({isUidBlocked});
  await assert.rejects(assertAllowed(uid),{message:'deletion_status_unavailable'});
  assert.deepEqual(mapInternalRaidError(Error('deletion_status_unavailable')),{code:'deletion_status_unavailable',status:503});
});

test('owner-specific save references stay private across UIDs',()=>{
  const id='a'.repeat(64),ownerKey=`typing_rpg_save_v3::firebase::${encodeURIComponent(uid)}::${id}`;
  const resolved=resolveOwnedSaveIdentity(uid,ownerKey);
  assert.equal(resolved.id,id);
  assert.match(resolved.publicKey,/^r_[a-f0-9]{64}$/);
  assert.notEqual(resolveOwnedSaveIdentity('another-fixture-uid',`typing_rpg_save_v3::firebase::another-fixture-uid::${id}`).publicKey,resolved.publicKey);
  assert.throws(()=>resolveOwnedSaveIdentity('another-fixture-uid',ownerKey),{message:'save_not_found'});
  assert.deepEqual(mapInternalRaidError(Error('account_deletion_in_progress')),{code:'account_deletion_in_progress',status:403});
});
