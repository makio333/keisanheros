import {createHash} from 'node:crypto';
import {planSharedRankingAnonymization} from './shared-ranking-anonymization.mjs';

const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Explicit project/complete-reader/owner mapping/CAS writer only. This source
// deliberately calls its result display redaction, never irreversible anonymity.
export function createExplicitSharedRankingDeletionSource({sourceProject,listRecords,resolveOwner,applyOperation}={}){
  if(typeof sourceProject!=='string'||!/^[a-z][a-z0-9-]{4,62}$/.test(sourceProject)||typeof listRecords!=='function'||typeof resolveOwner!=='function'||typeof applyOperation!=='function')throw Error('shared_deletion_source_not_configured');
  async function plan({accountId,policy}={}){
    if(policy?.sharedRecordDisposition!=='anonymize'||policy.sharedDisplayRedactionAccepted!==true)throw Error('shared_display_redaction_policy_required');
    const inventory=await listRecords({sourceProject});
    if(inventory?.complete!==true||inventory.sourceProject!==sourceProject||!Array.isArray(inventory.records)||inventory.records.length>10000)throw Error('shared_deletion_inventory_incomplete');
    const keys=new Set();
    for(const row of inventory.records){const key=JSON.stringify([row.collection,row.documentId]);if(keys.has(key)||typeof row.revision!=='string'||!row.revision)throw Error('shared_deletion_revision_required');keys.add(key);}
    const result=await planSharedRankingAnonymization({accountId,records:inventory.records,resolveOwner});
    if(!result.ready)throw Error('shared_deletion_ownership_or_shape_unverified');
    const before=new Map(inventory.records.map(row=>[JSON.stringify([row.collection,row.documentId]),fingerprint(row.data)]));
    return {...result,operations:result.operations.map(row=>({...row,expectedSha256:before.get(JSON.stringify([row.collection,row.documentId]))}))};
  }
  return Object.freeze({idempotent:true,
    async inspect(input){try{const result=await plan(input);return {complete:true,ownershipVerified:true,count:result.operations.length,unattributedCount:0,dispositionSupported:true,scope:'shared-ranking-display-redaction'};}catch{return {complete:false,ownershipVerified:false,count:0,dispositionSupported:false};}},
    async apply({accountId,policy,disposition}={}){
      if(disposition!=='anonymize')throw Error('shared_display_redaction_policy_required');
      const result=await plan({accountId,policy});
      for(const operation of result.operations)await applyOperation({sourceProject,...operation});
      return {redacted:result.operations.length,irreversiblyAnonymized:false};
    },
  });
}
