import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {createAccountGameService} from '../server/account-game-service.mjs';
import {createStripePayments} from '../server/stripe-payments.mjs';
import {legacySnapshot,grantLegacyFacilityAccess,issueLegacyTransfer,createLegacyClaimVerifier} from '../server/legacy-migration.mjs';
const directory=await mkdtemp(path.join(tmpdir(),'facility-migration-'));
let store=await openLocalAccountStore(directory);
const snapshots=Array.from({length:35},(_,i)=>legacySnapshot('old-facility','child-'+i,{gameData:JSON.stringify({playerName:'勇者'+i,player:{lvl:i+1,gold:i},ownedEquips:[]})}));
const service=()=>createAccountSaveService({store,sessions:store.sessions,verifyLegacyClaim:createLegacyClaimVerifier()});
try{
 await store.transaction(tx=>{for(const id of ['facility','other']){tx.putAccount({id});tx.putSession(id,{accountId:id,expiresAt:Date.now()+86400000});}});
 assert.equal((await service().summary('facility')).saveLimit,0);
 await assert.rejects(service().createSave('facility',{name:'fake',gameState:{player:{},facilityAccess:{active:true,saveLimit:999}}}),/purchase_required/);
 await grantLegacyFacilityAccess({store,accountId:'facility',sourceProject:'old-facility',snapshots:snapshots.slice(0,10)});
 assert.equal((await service().summary('facility')).saveLimit,10);
 await grantLegacyFacilityAccess({store,accountId:'facility',sourceProject:'old-facility',snapshots:snapshots.slice(0,3)});
 assert.equal((await service().summary('facility')).saveLimit,10,'repeat neither inflates nor shrinks');
 await grantLegacyFacilityAccess({store,accountId:'facility',sourceProject:'old-facility',snapshots});
 assert.equal((await service().summary('facility')).saveLimit,35,'not restricted to paid 30-slot plan');
 await assert.rejects(grantLegacyFacilityAccess({store,accountId:'other',sourceProject:'old-facility',snapshots}),/facility_already_assigned/);
 await assert.rejects(issueLegacyTransfer({store,accountId:'other',snapshot:snapshots[0]}),/facility_already_assigned/);
 for(const snapshot of snapshots){
   const transfer=await issueLegacyTransfer({store,accountId:'facility',snapshot});
   assert.deepEqual((await service().claimLegacySave('facility',{proof:transfer.code})).gameState,JSON.parse(gunzipSync(Buffer.from(snapshot.gameStateGzip,'base64')).toString()));
 }
 const summary=await service().summary('facility');assert.equal(summary.used,35);assert.equal(summary.facilityAccess,true);
 await assert.rejects(service().createSave('facility',{name:'full',gameState:{player:{}}}),/save_limit_reached/);
 assert.deepEqual(await store.transaction(tx=>tx.listPurchases('facility')),[],'no Stripe purchase or payment credit fabricated');
 assert.equal((await service().summary('other')).saveLimit,0);
 const imported=(await service().listSaves('facility'))[0];
 await service().updateSave('facility',{key:imported.key,revision:1,gameState:{playerName:'continued',player:{lvl:99}}});
 const game=createAccountGameService({store});
 const response=await game.call('facility',{api:'RaidBossAPI',method:'getHistory',args:[]});assert.ok(response);
 await assert.rejects(game.call('other',{api:'RaidBossAPI',method:'getHistory',args:[]}),/purchase_required/);
 const payments=createStripePayments({stripe:{},store,sessions:store.sessions,origin:'https://fixture.example',webhookSecret:'whsec_fixture',personalPriceId:'price_fixture'});
 assert.deepEqual(await payments.listProducts('facility'),[]);
 await assert.rejects(payments.checkout('facility'),/facility_account_managed/);
 await store.close();store=await openLocalAccountStore(directory);
 assert.equal((await service().summary('facility')).saveLimit,35);
 assert.equal((await service().listSaves('facility')).length,35);
 console.log('PASS: one free facility account, 35 intact saves, idempotent grants, no fabricated payments/credits, no checkout, play/save access, ownership and restart.');
}finally{await store.close();await rm(directory,{recursive:true,force:true});}
