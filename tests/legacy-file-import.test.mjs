import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildLegacySaveFile,parseLegacySaveFile} from '../legacy_save_file.js';
import {createLegacyFileImporter} from '../server/legacy-file-import.mjs';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
const directory=await mkdtemp(path.join(tmpdir(),'legacy-file-import-'));
let store=await openLocalAccountStore(directory);
const rows=Array.from({length:35},(_,i)=>({documentId:'child-'+i,gameState:{playerName:'勇者'+i,player:{lvl:10+i,gold:1234+i},ownedEquips:[{uid:i,id:'ancient_ring'}],activePrints:{1234:{code:'123'}},stageClearCounts:{area5:[3]},raidTickets:12}}));
const file=buildLegacySaveFile('old-facility',rows);
const importer=()=>createLegacyFileImporter({store,sessions:store.sessions,accountId:'facility',sourceProject:'old-facility'});
const accounts=()=>createAccountSaveService({store,sessions:store.sessions});
try{
 await store.transaction(tx=>{for(const id of ['facility','other']){tx.putAccount({id});tx.putSession(id,{accountId:id,expiresAt:Date.now()+600000});}});
 assert.throws(()=>parseLegacySaveFile({...file,version:99}),/invalid_migration_file/);
 assert.throws(()=>parseLegacySaveFile({...file,saves:[rows[0],rows[0]]}),/invalid_migration_file/);
 await assert.rejects(importer().process('',{file}),/authentication_required/);
 await assert.rejects(importer().process('other',{file,apply:true}),/migration_not_authorized/);
 await assert.rejects(createLegacyFileImporter({store,sessions:store.sessions,sourceProject:'old-facility'}).process('facility',{file,apply:true}),/migration_not_authorized/);
 await assert.rejects(importer().process('facility',{file:{...file,sourceProject:'wrong-project'},apply:true}),/migration_source_mismatch/);
 const preview=await importer().process('facility',{file});assert.equal(preview.imported,35);
 assert.equal((await accounts().summary('facility')).saveLimit,0,'preview never grants access');
 assert.equal((await accounts().listSaves('facility')).length,0);
 const result=await importer().process('facility',{file,apply:true});assert.equal(result.imported,35);
 const list=await accounts().listSaves('facility');assert.equal(list.length,35);
 for(const row of list){const save=await accounts().readSave('facility',row.key);assert.deepEqual(save.gameState,rows.find(source=>source.gameState.playerName===row.name).gameState);}
 await accounts().updateSave('facility',{key:list[0].key,revision:1,gameState:{playerName:'進んだ勇者',player:{lvl:99}}});
 const repeated=await Promise.all([importer().process('facility',{file,apply:true}),importer().process('facility',{file,apply:true})]);
 assert.ok(repeated.every(row=>row.imported===0&&row.skipped===35));
 assert.equal((await accounts().readSave('facility',list[0].key)).gameState.player.lvl,99);
 assert.equal((await accounts().summary('facility')).saveLimit,35);
 assert.deepEqual(await store.transaction(tx=>tx.listPurchases('facility')),[]);
 assert.equal(rows[0].gameState.player.lvl,10,'original file unchanged');
 await store.close();store=await openLocalAccountStore(directory);
 assert.equal((await importer().process('facility',{file})).skipped,35);
 console.log('PASS: JSON format, authorization, source binding, preview without writes, free35-person atomic import, concurrency, no overwrite, full state and restart.');
}finally{await store.close();await rm(directory,{recursive:true,force:true});}
