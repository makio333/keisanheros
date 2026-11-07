import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createFirebaseAccountLogin} from '../server/firebase-account-login.mjs';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {Readable} from 'node:stream';
import {createFirebaseAccountLoginHandler} from '../server/firebase-account-login.mjs';
const now=()=>1800000000000;
const claims=uid=>({uid,aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:now()/1000+3600,firebase:{sign_in_provider:'oidc.line'}});
async function fixture(fn){const directory=await mkdtemp(path.join(tmpdir(),'legend-firebase-sales-test-')),store=await openLocalAccountStore(directory);try{await fn(store);}finally{await store.close();await rm(directory,{recursive:true,force:true});}}
test('verified Firebase UID retains account and copied saves across devices; progressed copies are never overwritten',()=>fixture(async store=>{
 const rows=[{id:'one',ownerUid:'uid-a',revision:4,gameData:JSON.stringify({playerName:'fixture',player:{gold:123},ownedEquips:[{uid:1,rarity:6,awakeningLevel:25}]})}];
 let verified=false;const login=createFirebaseAccountLogin({store,sessions:store.sessions,now,migrationEnabled:true,readPrivateSaves:async uid=>uid==='uid-a'?rows:[],verifyIdToken:async(token,revoked)=>{verified=revoked;return claims(token);}});
 const first=await login('uid-a');assert.equal(first.imported,1);assert.equal(verified,true);
 let saves=await store.transaction(tx=>tx.listSaves(first.accountId));assert.equal(saves[0].gameState.player.gold,123);assert.equal(saves[0].gameState.ownedEquips[0].awakeningLevel,25);
 await store.transaction(async tx=>{const save=await tx.getSave(saves[0].key);tx.putSave({...save,gameState:{...save.gameState,player:{gold:456}},revision:2});});
 const second=await login('uid-a',first.sessionId);assert.equal(second.accountId,first.accountId);assert.equal(second.imported,0);assert.equal(await store.sessions.get(first.sessionId,now()),null);
 saves=await store.transaction(tx=>tx.listSaves(first.accountId));assert.equal(saves.length,1);assert.equal(saves[0].gameState.player.gold,456);
 const other=await login('uid-b');assert.notEqual(other.accountId,first.accountId);assert.equal((await store.transaction(tx=>tx.listSaves(other.accountId))).length,0);
 await assert.rejects(login('uid-b',second.sessionId),/account_switch_requires_logout/);
 rows[0].revision++;await assert.rejects(login('uid-a'),/firebase_source_changed/);assert.equal((await store.transaction(tx=>tx.listSaves(first.accountId)))[0].gameState.player.gold,456);
}));
test('wrong project, expired/revoked tokens and unverified email cannot create sessions',()=>fixture(async store=>{
 for(const token of [{...claims('a'),aud:'other'},{...claims('a'),exp:0},{...claims('a'),firebase:{sign_in_provider:'anonymous'}},{...claims('a'),firebase:{sign_in_provider:'password'},email_verified:false}]){
  const login=createFirebaseAccountLogin({store,sessions:store.sessions,now,verifyIdToken:async()=>token});await assert.rejects(login('fixture'),/authentication_required/);
 }
 const login=createFirebaseAccountLogin({store,sessions:store.sessions,now,verifyIdToken:async()=>{throw Error('revoked');}});await assert.rejects(login('fixture'),/authentication_required/);
}));
test('demo Firebase project is accepted only when the caller explicitly selects emulator-only mode',()=>fixture(async store=>{
 const demoClaims={uid:'fixture-demo-user',aud:'demo-email-verification',iss:'https://securetoken.google.com/demo-email-verification',
  exp:now()/1000+3600,email_verified:true,firebase:{sign_in_provider:'password'}};
 const args={store,sessions:store.sessions,now,projectId:'demo-email-verification',verifyIdToken:async()=>demoClaims};
 assert.throws(()=>createFirebaseAccountLogin(args),/firebase_login_not_configured/);
 const login=createFirebaseAccountLogin({...args,emulatorOnly:true});
 const result=await login('fixture-token');
 assert.equal(result.imported,0);assert.equal(result.registrationState,null);assert.ok(result.accountId);
}));
test('old source ownership is enforced and existing users cannot enter before migration is ready',()=>fixture(async store=>{
 const row={id:'one',ownerUid:'other',revision:1,gameData:'{"player":{}}'};
 const args={store,sessions:store.sessions,now,verifyIdToken:async()=>claims('a'),readPrivateSaves:async()=>[row]};
 await assert.rejects(createFirebaseAccountLogin(args)('fixture'),/migration_not_ready/);
 await assert.rejects(createFirebaseAccountLogin({...args,migrationEnabled:true})('fixture'),/invalid_save/);
}));
test('facility exemption is explicit; copying saves never fabricates paid ownership',()=>fixture(async store=>{
 const login=createFirebaseAccountLogin({store,sessions:store.sessions,now,migrationEnabled:true,facilityUids:['facility'],verifyIdToken:async token=>claims(token),readPrivateSaves:async uid=>Array.from({length:4},(_,i)=>({id:String(i),ownerUid:uid,revision:1,gameData:'{"player":{}}'}))});
 const accounts=createAccountSaveService({store,sessions:store.sessions,now,trialsEnabled:true});
 const ordinary=await login('ordinary');const summary=await accounts.summary(ordinary.sessionId);assert.equal(summary.saveLimit,0);assert.equal(summary.paidSaveLimit,0);assert.equal(summary.used,4);
 const facility=await login('facility');const free=await accounts.summary(facility.sessionId);assert.equal(free.saveLimit,4);assert.equal(free.paidSaveLimit,0);assert.equal(free.facilityAccess,true);
}));
test('Firebase HTTP login enforces origin and secure cookies without exposing the token',async()=>{
 const token='fixture-private-token';let calls=0;
 const handler=createFirebaseAccountLoginHandler({origin:'https://example.com',login:async value=>{calls++;assert.equal(value,token);return {sessionId:'a'.repeat(64),imported:1};}});
 async function request(origin,body){const req=Readable.from([Buffer.from(body)]);Object.assign(req,{url:'/api/auth/firebase/session',method:'POST',headers:{origin,'content-type':'application/json'}});const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(body){this.body=body;}};await handler(req,res);return res;}
 assert.equal((await request('https://other.example',JSON.stringify({idToken:token}))).status,403);assert.equal(calls,0);
 assert.equal((await request('https://example.com','{')).status,400);
 const result=await request('https://example.com',JSON.stringify({idToken:token}));assert.equal(result.status,200);assert.match(result.headers['Set-Cookie'],/__Host-legend-session=.*; Path=\/; HttpOnly; SameSite=Lax; Max-Age=28800; Secure/);assert.ok(!result.body.includes(token));assert.ok(!result.body.includes('a'.repeat(64)));
});
