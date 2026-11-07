import assert from 'node:assert/strict';
import {buildLegacyTransferFile,parseLegacyTransferFile,legacyTransferRecordCount} from '../legacy_transfer_file.js';
import {buildLegacyRaidImportPlan} from '../legacy_raid_transfer.js';
import {createLegacyFileImporter} from '../server/legacy-file-import.mjs';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const oldKey='typing_rpg_save_v3::facility-child-1',newKey='typing_rpg_save_v3::migrated-child-1';
const raidData={global:null,history:[{id:'boss_50',data:{bossId:'boss_50',finalizedAt:10,finalRankings:[[oldKey,120]],finisherSlotKeys:[oldKey]}}],bossRankings:[{bossId:'boss_50',rows:[{id:encodeURIComponent(oldKey),data:{slotKey:oldKey,playerName:'勇者',totalDamage:120,bestKills:2}}]}],raidClaims:[],raidCoinRankClaims:[],eventRankings:[{eventId:'halloween_2026_raid_v1',rows:[{id:encodeURIComponent(oldKey),data:{slotKey:oldKey,playerName:'勇者',bestKills:4,totalKills:12}}]}],eventClaims:[],eventFinalResults:[{id:'halloween_2026_raid_v1',data:{rows:[{slotKey:oldKey,bestKills:4,totalKills:12}]}}],eventFinalClaims:[],adminGifts:[]};
const saves=[{documentId:'save-doc-1',sourceSlotKey:oldKey,gameState:{playerName:'勇者',player:{lvl:22,gold:91},items:[{id:'ancient_blueprint',count:3}],skins:{owned:['forest']},progress:{legacyDamage:120}}}];
const file=buildLegacyTransferFile('old-facility',saves,raidData);
assert.equal(parseLegacyTransferFile(JSON.stringify(file)).format,'legend-heroes-full-transfer');
assert.equal(legacyTransferRecordCount(raidData),4);
const plan=buildLegacyRaidImportPlan(raidData,new Map([[oldKey,newKey]]));
assert.deepEqual(plan.find(row=>row.collection==='raidRankings_boss_50').data,{slotKey:newKey,playerName:'勇者',totalDamage:120,bestKills:2});
assert.deepEqual(plan.find(row=>row.collection==='raidHistory').data.finalRankings,[[newKey,120]]);
assert.equal(plan.find(row=>row.collection==='eventRaidRankings_halloween_2026_raid_v1').data.totalKills,12);
assert.equal(plan.find(row=>row.collection==='eventRaidFinalResults').data.rows[0].slotKey,newKey);
assert.throws(()=>parseLegacyTransferFile({...file,version:2}),/invalid_migration_file/);

const directory=await mkdtemp(path.join(tmpdir(),'legacy-full-transfer-'));
const store=await openLocalAccountStore(directory);
try{
 await store.transaction(tx=>{tx.putAccount({id:'facility'});tx.putSession('session',{accountId:'facility',expiresAt:Date.now()+60000});});
 const importer=createLegacyFileImporter({store,sessions:store.sessions,accountId:'facility',sourceProject:'old-facility'});
 const preview=await importer.process('session',{file,apply:false});assert.equal(preview.total,1);assert.equal(preview.raidRecords,4);
 assert.equal((await store.transaction(tx=>tx.listGameDocuments('raidRankings_boss_50'))).length,0,'preview writes nothing');
 const result=await importer.process('session',{file,apply:true});assert.equal(result.imported,1);assert.equal(result.raid.imported,4);
 const actualKey=(await store.transaction(tx=>tx.listSaves('facility')))[0].key;
 const migratedRank=await store.transaction(tx=>tx.getGameDocument(`raidRankings_boss_50/${encodeURIComponent(actualKey)}`));assert.equal(migratedRank.totalDamage,120);
 const migratedSave=await store.transaction(tx=>tx.getSave(actualKey));assert.equal(migratedSave.gameState.items[0].id,'ancient_blueprint');assert.deepEqual(migratedSave.gameState.skins.owned,['forest']);
 await store.transaction(tx=>tx.putGameDocument(`raidRankings_boss_50/${encodeURIComponent(actualKey)}`,{...migratedRank,totalDamage:150}));
 const repeated=await importer.process('session',{file,apply:true});assert.equal(repeated.imported,0);assert.equal(repeated.raid.skipped,4);
 assert.equal((await store.transaction(tx=>tx.getGameDocument(`raidRankings_boss_50/${encodeURIComponent(actualKey)}`))).totalDamage,150,'newer target achievement remains');
 assert.deepEqual(await store.transaction(tx=>tx.listGameDocuments('raidClaims')),[],'non-ranking reward claims are not migrated');
 console.log('PASS: full saves and ranked achievements migrate, slot IDs reconnect, preview is read-only, existing higher scores survive repeat imports.');
}finally{await store.close();await rm(directory,{recursive:true,force:true});}
