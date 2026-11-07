import {createHash} from 'node:crypto';

const validId=value=>typeof value==='string'&&value.length>0&&value.length<=128;
const validProject=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{4,62}$/.test(value)&&value!=='ailandgames';
const canonical=value=>{
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const fingerprint=row=>createHash('sha256').update(canonical(row)).digest('hex');

// A deliberately unconnected adapter for an operator-provided legacy reader.
// It never initializes Firebase or chooses a source project on its own.
export function createExplicitLegacySaveDeletionSource({sourceProject,listPage,resolveOwner,deleteRecord,pageSize=100,maxRecords=50000}={}){
  if(!validProject(sourceProject)||typeof listPage!=='function'||typeof resolveOwner!=='function'||typeof deleteRecord!=='function'||!Number.isInteger(pageSize)||pageSize<1||pageSize>400||!Number.isSafeInteger(maxRecords)||maxRecords<1)throw Error('legacy_deletion_source_not_configured');

  async function inventory({accountId}={}){
    if(!validId(accountId))return {complete:false,ownershipVerified:false,count:0,unattributedCount:1,rows:[]};
    const rows=[],cursors=new Set();let cursor=null,scanned=0,unattributedCount=0,count=0;
    try{
      for(;;){
        const page=await listPage({sourceProject,cursor,limit:pageSize});
        if(!page||!Array.isArray(page.rows)||page.rows.length>pageSize||page.nextCursor!==null&&typeof page.nextCursor!=='string')throw Error('legacy_inventory_page_invalid');
        if(page.rows.length===0&&page.nextCursor!==null)throw Error('legacy_inventory_cursor_stalled');
        for(const row of page.rows){
          scanned++;
          if(scanned>maxRecords)return {complete:false,ownershipVerified:false,count,unattributedCount:Math.max(1,unattributedCount),reason:'legacy_inventory_cap_exceeded',rows:[]};
          if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.documentId!=='string'||!row.documentId||row.documentId.length>1500||!row.data||typeof row.data!=='object'||Array.isArray(row.data)||row.sourceProject!==undefined&&row.sourceProject!==sourceProject){unattributedCount++;continue;}
          let mapping=null;
          try{mapping=await resolveOwner({sourceProject,documentId:row.documentId,legacyKey:row.legacyKey??row.data.legacyKey??null,record:row.data});}catch{}
          if(mapping?.verified!==true||mapping.sourceProject!==sourceProject||!validId(mapping.accountId)||typeof mapping.mappingId!=='string'||!mapping.mappingId||mapping.mappingId.length>256){unattributedCount++;continue;}
          const safeRow={documentId:row.documentId,mappingId:mapping.mappingId,accountId:mapping.accountId,expectedSha256:fingerprint(row.data)};
          if(mapping.accountId===accountId)count++;
          rows.push(safeRow);
        }
        if(page.nextCursor===null)break;
        if(cursors.has(page.nextCursor)||page.nextCursor===cursor)throw Error('legacy_inventory_cursor_stalled');
        cursors.add(page.nextCursor);cursor=page.nextCursor;
      }
      return {complete:unattributedCount===0,ownershipVerified:unattributedCount===0,count,unattributedCount,scanned,rows:unattributedCount===0?rows:[]};
    }catch{
      return {complete:false,ownershipVerified:false,count,unattributedCount:Math.max(1,unattributedCount),reason:'legacy_inventory_read_failed',rows:[]};
    }
  }

  return Object.freeze({
    idempotent:true,
    async inspect({accountId}={}){const result=await inventory({accountId});const {rows:_hidden,...publicResult}=result;return publicResult;},
    async apply({accountId,disposition}={}){
      if(disposition&&disposition!=='delete')throw Error('account_deletion_policy_unresolved');
      const result=await inventory({accountId});
      if(result.complete!==true||result.unattributedCount!==0)throw Error('legacy_save_owner_mapping_incomplete');
      for(const row of result.rows)if(row.accountId===accountId)await deleteRecord({sourceProject,documentId:row.documentId,mappingId:row.mappingId,expectedSha256:row.expectedSha256});
    },
  });
}
