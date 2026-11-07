import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createExplicitLegacySaveDeletionSource} from '../server/legacy-account-deletion-source.mjs';

const project='facility-legacy-demo';
function pages(rows,pageSize=1){
  return async({sourceProject,cursor,limit})=>{
    assert.equal(sourceProject,project);assert.equal(limit,pageSize);
    const index=cursor===null?0:Number(cursor),slice=rows.slice(index,index+limit);
    return {rows:slice,nextCursor:index+slice.length<rows.length?String(index+slice.length):null};
  };
}

test('legacy save adapter requires pinned external reader and verified explicit owner mapping',async()=>{
  assert.throws(()=>createExplicitLegacySaveDeletionSource({sourceProject:'ailandgames',listPage:async()=>({rows:[],nextCursor:null}),resolveOwner:async()=>null,deleteRecord:async()=>{}}),/legacy_deletion_source_not_configured/);
  const rows=[{documentId:'old-a',legacyKey:'legacy-a',data:{legacyKey:'legacy-a',playerName:'fixture-a'}},{documentId:'old-b',legacyKey:'legacy-b',data:{legacyKey:'legacy-b',playerName:'fixture-b'}}],deleted=[];
  const source=createExplicitLegacySaveDeletionSource({sourceProject:project,pageSize:1,listPage:pages(rows),resolveOwner:async({legacyKey})=>({sourceProject:project,accountId:legacyKey==='legacy-a'?'account-a':'account-b',mappingId:`mapping-${legacyKey}`,verified:true}),deleteRecord:async input=>deleted.push(input)});
  assert.deepEqual(await source.inspect({accountId:'account-a'}),{complete:true,ownershipVerified:true,count:1,unattributedCount:0,scanned:2});
  await source.apply({accountId:'account-a',disposition:'delete'});
  assert.equal(deleted.length,1);assert.equal(deleted[0].sourceProject,project);assert.equal(deleted[0].documentId,'old-a');assert.equal(deleted[0].mappingId,'mapping-legacy-a');assert.match(deleted[0].expectedSha256,/^[a-f0-9]{64}$/);
});

test('unmapped or unverified legacy records block before any delete callback',async()=>{
  const rows=[{documentId:'old-a',data:{legacyKey:'legacy-a'}},{documentId:'old-unknown',data:{legacyKey:'unknown'}}],deleted=[];
  const source=createExplicitLegacySaveDeletionSource({sourceProject:project,pageSize:1,listPage:pages(rows),resolveOwner:async({legacyKey})=>legacyKey==='legacy-a'?{sourceProject:project,accountId:'account-a',mappingId:'verified-fixture',verified:true}:{sourceProject:project,accountId:'account-a',mappingId:'not-verified',verified:false},deleteRecord:async input=>deleted.push(input)});
  const report=await source.inspect({accountId:'account-a'});assert.equal(report.complete,false);assert.equal(report.ownershipVerified,false);assert.equal(report.unattributedCount,1);
  await assert.rejects(source.apply({accountId:'account-a'}),/legacy_save_owner_mapping_incomplete/);assert.equal(deleted.length,0);
});

test('legacy adapter refuses stalled cursors and does not expose row payloads',async()=>{
  const source=createExplicitLegacySaveDeletionSource({sourceProject:project,listPage:async()=>({rows:[{documentId:'same',data:{name:'fixture'}}],nextCursor:'same'}),resolveOwner:async()=>({sourceProject:project,accountId:'account-a',mappingId:'fixture',verified:true}),deleteRecord:async()=>{}});
  const report=await source.inspect({accountId:'account-a'});assert.equal(report.complete,false);assert.equal(report.reason,'legacy_inventory_read_failed');assert.equal('rows' in report,false);assert.equal('name' in report,false);
});
