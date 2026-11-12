import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createBackupInventoryManifest,planBackupManifestRestore,stageBackupManifestRestore,verifyBackupInventoryManifest} from '../server/account-deletion-backup-manifest.mjs';

const sourceProject='ailandgames';
const records=[
  {collection:'privateGameSaves',id:'save-target',data:{ownerUid:'fixture-uid-a',gameData:'synthetic-a'}},
  {collection:'privateGameSaves',id:'save-other',data:{ownerUid:'fixture-uid-b',gameData:'synthetic-b'}},
];
const manifest=()=>createBackupInventoryManifest({sourceProject,snapshotId:'synthetic-snapshot-1',capturedAt:1760000000000,records});
const authority={lookup:async owner=>owner.uid==='fixture-uid-a'?{state:'retention_pending'}:null};

test('backup inventory manifest is complete, project-pinned and integrity checked',()=>{
  const built=manifest(),verified=verifyBackupInventoryManifest(built,{expectedProject:sourceProject});
  assert.equal(verified.complete,true);assert.equal(verified.recordCount,2);
  assert.equal(verifyBackupInventoryManifest({...built,sourceProject:'another-project'},{expectedProject:sourceProject}).complete,false);
  assert.equal(verifyBackupInventoryManifest({...built,recordCount:3},{expectedProject:sourceProject}).complete,false);
  assert.throws(()=>createBackupInventoryManifest({sourceProject,snapshotId:'bad-fixture',capturedAt:1,records:[{collection:'saves',id:'unowned',data:{gameData:'no owner'}}]}),/backup_inventory_owner_or_shape_unknown/);
});

test('guarded manifest restore quarantines only the account with a deletion marker',async()=>{
  const planned=await planBackupManifestRestore({manifest:manifest(),expectedProject:sourceProject,records,visibilityAuthority:authority});
  assert.deepEqual(planned.counts,{scanned:2,usable:1,quarantined:1});
  assert.equal(planned.usableRecords[0].data.gameData,'synthetic-b');
  assert.equal(planned.quarantinedRecords[0].ownerUid,'fixture-uid-a');
});

test('manifest/snapshot mismatch fails before either restore writer runs',async()=>{
  const writes=[];
  await assert.rejects(stageBackupManifestRestore({manifest:manifest(),expectedProject:sourceProject,records:[records[0]],visibilityAuthority:authority,writeToIsolatedStaging:async row=>writes.push(['stage',row]),writeToRestrictedQuarantine:async row=>writes.push(['quarantine',row])}),/backup_snapshot_manifest_count_mismatch/);
  assert.deepEqual(writes,[]);
  const mismatched=[{...records[0],data:{...records[0].data,gameData:'changed'}},records[1]];
  await assert.rejects(planBackupManifestRestore({manifest:manifest(),expectedProject:sourceProject,records:mismatched,visibilityAuthority:authority}),/backup_snapshot_manifest_record_mismatch/);
});
