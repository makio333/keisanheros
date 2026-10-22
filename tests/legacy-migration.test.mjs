import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {legacySnapshot,issueLegacyTransfer,createLegacyClaimVerifier,revokeLegacyTransfer} from '../server/legacy-migration.mjs';

const directory=await mkdtemp(path.join(tmpdir(),'legacy-migration-test-'));
let store=await openLocalAccountStore(directory),time=1000;
const state={playerName:'引っ越し勇者',player:{lvl:18,gold:555,hp:35},ownedEquips:[{uid:3,id:'ancient_dual_blades'}],stageClearCounts:{area1:[3,2]},activePrints:{1234:{code:'123'}},raidTickets:8};
const source={slotKey:'typing_rpg_save_v3::old',gameData:JSON.stringify(state)};
const snapshot=legacySnapshot('old-game','old-slot',source);
const service=()=>createAccountSaveService({store,sessions:store.sessions,now:()=>time,verifyLegacyClaim:createLegacyClaimVerifier({now:()=>time})});
try{
 await store.transaction(tx=>{
   for(const id of ['alice','bob']){tx.putAccount({id});tx.putSession(id,{accountId:id,expiresAt:999999});tx.putPurchase({purchaseId:id,accountId:id,productId:'personal',active:true});}
 });
 const transfer=await issueLegacyTransfer({store,accountId:'alice',snapshot,now:time,expiresAt:5000});
 await assert.rejects(service().claimLegacySave('alice',{proof:'guessed'}),/legacy_ownership_unverified/);
 await assert.rejects(service().claimLegacySave('bob',{proof:transfer.code}),/legacy_ownership_unverified/);
 await assert.rejects(service().claimLegacySave('alice',{legacyKey:'forged',proof:transfer.code}),/legacy_ownership_unverified/);
 const imported=await service().claimLegacySave('alice',{proof:transfer.code,gameState:{player:{gold:999999}}});
 assert.deepEqual(imported.gameState,state);assert.equal(imported.ownerAccountId,'alice');
 assert.deepEqual(JSON.parse(source.gameData),state,'source untouched');
 const advanced=await service().updateSave('alice',{key:imported.key,revision:1,gameState:{...state,player:{...state.player,gold:777}}});
 assert.deepEqual(await service().claimLegacySave('alice',{proof:transfer.code}),advanced,'repeat does not reset progress');
 await assert.rejects(issueLegacyTransfer({store,accountId:'bob',snapshot,now:time}),/legacy_already_claimed/);
 const second=legacySnapshot('old-game','second',source);
 const old=await issueLegacyTransfer({store,accountId:'alice',snapshot:second,now:time});
 const next=await issueLegacyTransfer({store,accountId:'bob',snapshot:second,now:time});
 await assert.rejects(service().claimLegacySave('alice',{proof:old.code}),/legacy_ownership_unverified/);
 const simultaneous=await Promise.all([service().claimLegacySave('bob',{proof:next.code}),service().claimLegacySave('bob',{proof:next.code})]);
 assert.equal(simultaneous[0].key,simultaneous[1].key);assert.equal((await service().listSaves('bob')).length,1);
 await revokeLegacyTransfer({store,code:next.code,now:time});
 await assert.rejects(service().claimLegacySave('bob',{proof:next.code}),/legacy_ownership_unverified/);
 const third=await issueLegacyTransfer({store,accountId:'alice',snapshot:legacySnapshot('old-game','third',source),now:time,expiresAt:1100});
 time=1100;await assert.rejects(service().claimLegacySave('alice',{proof:third.code}),/legacy_ownership_unverified/);
 time=1000;
 for(let i=0;i<2;i++)await service().createSave('alice',{name:'new',gameState:state});
 const full=await issueLegacyTransfer({store,accountId:'alice',snapshot:legacySnapshot('old-game','fourth',source),now:time});
 await assert.rejects(service().claimLegacySave('alice',{proof:full.code}),/save_limit_reached/);
 assert.equal(await store.transaction(tx=>tx.getLegacyClaim(full.legacyKey)),undefined,'full account does not consume claim');
 await store.transaction(tx=>tx.putPurchase({purchaseId:'upgrade',accountId:'alice',productId:'organization10',active:true}));
 await store.close();store=await openLocalAccountStore(directory);
 assert.deepEqual((await service().claimLegacySave('alice',{proof:full.code})).gameState,state,'survives restart');
 assert.notEqual(snapshot.legacyKey,legacySnapshot('other-game','old-slot',source).legacyKey,'projects do not collide');
 assert.throws(()=>legacySnapshot('old-game','deleted',{...source,deleted:true}),/legacy_save_deleted/);
 assert.throws(()=>legacySnapshot('old-game','invalid',{gameData:'broken'}),/invalid_legacy_save/);
 console.log('PASS: recipient binding, expiry, revocation, atomic reissue, concurrency, capacity, full state, restart, source preservation.');
}finally{await store.close();await rm(directory,{recursive:true,force:true});}
