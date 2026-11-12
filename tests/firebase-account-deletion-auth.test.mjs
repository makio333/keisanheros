import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createFirebaseAccountDeletionAuthenticator} from '../server/firebase-account-deletion-auth.mjs';

const now=1_800_000_000_000;
const baseClaims={uid:'fixture-uid',aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:now/1000+3600,auth_time:now/1000-60,firebase:{sign_in_provider:'google.com'}};

test('deletion authentication verifies revocation, maps account server-side, and marks recent reauthentication',async()=>{
  let revokedCheck=false,mappedUid=null;
  const authenticate=createFirebaseAccountDeletionAuthenticator({now:()=>now,verifyIdToken:async(token,checkRevoked)=>{revokedCheck=checkRevoked;assert.equal(token,'fixture.id.token');return baseClaims;},resolveAccount:async uid=>{mappedUid=uid;return 'fixture-account';}});
  assert.deepEqual(await authenticate({headers:{authorization:'Bearer fixture.id.token'}}),{verified:true,uid:'fixture-uid',accountId:'fixture-account',reauthenticated:true});
  assert.equal(revokedCheck,true);assert.equal(mappedUid,'fixture-uid');
});

test('missing, malformed, stale, or future auth time cannot satisfy recent reauthentication',async()=>{
  const claims={...baseClaims,auth_time:now/1000-301};
  const authenticate=createFirebaseAccountDeletionAuthenticator({now:()=>now,verifyIdToken:async()=>claims,resolveAccount:async()=> 'fixture-account'});
  const stale=await authenticate({headers:{authorization:'Bearer fixture.id.token'}});
  assert.equal(stale.reauthenticated,false);
  for(const authorization of ['', 'Bearer ', 'Bearer a b', 'Basic fixture.id.token'])assert.equal(await authenticate({headers:{authorization}}),null);
  const future=createFirebaseAccountDeletionAuthenticator({now:()=>now,verifyIdToken:async()=>({...baseClaims,auth_time:now/1000+1}),resolveAccount:async()=> 'fixture-account'});
  assert.equal((await future({headers:{authorization:'Bearer fixture.id.token'}})).reauthenticated,false);
});

test('wrong project, expired tokens, unsupported providers, and unverified password accounts are rejected',async()=>{
  for(const claims of [
    {...baseClaims,aud:'wrong-project'},
    {...baseClaims,exp:now/1000-1},
    {...baseClaims,firebase:{sign_in_provider:'anonymous'}},
    {...baseClaims,email_verified:false,firebase:{sign_in_provider:'password'}},
  ]){
    const authenticate=createFirebaseAccountDeletionAuthenticator({now:()=>now,verifyIdToken:async(_token,revoked)=>{assert.equal(revoked,true);return claims;},resolveAccount:async()=> 'fixture-account'});
    assert.equal(await authenticate({headers:{authorization:'Bearer fixture.id.token'}}),null);
  }
});

test('unresolved ownership mapping and token verification failure deny authentication without exposing claims',async()=>{
  const noMapping=createFirebaseAccountDeletionAuthenticator({now:()=>now,verifyIdToken:async()=>baseClaims,resolveAccount:async()=>null});
  assert.equal(await noMapping({headers:{authorization:'Bearer fixture.id.token'}}),null);
  const unavailable=createFirebaseAccountDeletionAuthenticator({now:()=>now,verifyIdToken:async()=>{throw Error('secret provider detail');},resolveAccount:async()=> 'fixture-account'});
  assert.equal(await unavailable({headers:{authorization:'Bearer fixture.id.token'}}),null);
});
