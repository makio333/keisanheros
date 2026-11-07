import {createHash} from 'node:crypto';

const hash=value=>createHash('sha256').update(value).digest('hex');
const allowedFields=new Set(['id','purchaseId','eventId','productId','verifiedAt','createdAt','amount','currency','priceId','stripeSessionId','fromLimit','toLimit','fulfilled']);
const safeValue=value=>typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&value.length<=256&&!/[\r\n]/.test(value);
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9._:-]{1,200}$/.test(value);

// No statutory period is chosen here. Both the purpose and exact period must
// come from an approved policy; the archive writer must be durable/idempotent.
export function createFinancialRetentionSource({collections,policyId,purpose,retentionMs,fieldsByCollection,reader,archive,now=Date.now}={}){
  if(!Array.isArray(collections)||!collections.length||new Set(collections).size!==collections.length||collections.some(name=>!['purchases','events','stripeOrders','stripeCheckout'].includes(name))||!validId(policyId)||typeof purpose!=='string'||!purpose.trim()||purpose.length>500||!Number.isSafeInteger(retentionMs)||retentionMs<1||typeof reader?.listOwned!=='function'||typeof reader?.deleteOwnedIfUnchanged!=='function'||typeof archive?.putIfAbsent!=='function'||typeof archive?.listDue!=='function'||typeof archive?.deleteIfUnchanged!=='function'||typeof now!=='function')throw Error('financial_retention_policy_required');
  for(const collection of collections){const fields=fieldsByCollection?.[collection];if(!Array.isArray(fields)||!fields.length||new Set(fields).size!==fields.length||fields.some(field=>!allowedFields.has(field)))throw Error('financial_retention_allowlist_required');}
  async function read(accountId){
    if(typeof accountId!=='string'||!accountId||accountId.length>128)throw Error('financial_owner_required');
    const rows=[];
    for(const collection of collections){
      const page=await reader.listOwned({collection,accountId});
      if(page?.complete!==true||page.ownershipVerified!==true||page.unattributedCount!==0||!Array.isArray(page.records)||page.records.length>10000)throw Error('financial_inventory_incomplete');
      const seen=new Set();
      for(const record of page.records){
        if(typeof record?.id!=='string'||!record.id||record.id.length>1500||seen.has(record.id)||record.data?.accountId!==accountId||typeof record.revision!=='string'||!record.revision)throw Error('financial_owner_or_revision_invalid');seen.add(record.id);
        const minimal={};
        for(const field of fieldsByCollection[collection])if(record.data[field]!==undefined){if(!safeValue(record.data[field]))throw Error('financial_retention_field_invalid');minimal[field]=record.data[field];}
        const timestamp=record.data.verifiedAt??record.data.createdAt;
        if(!Number.isSafeInteger(timestamp)||timestamp<0||timestamp>now()||!Number.isSafeInteger(timestamp+retentionMs))throw Error('financial_retention_timestamp_invalid');
        rows.push({collection,id:record.id,revision:record.revision,minimal,retainUntil:timestamp+retentionMs});
      }
    }
    return rows;
  }
  return Object.freeze({idempotent:true,
    async inspect({accountId,policy}={}){
      if(policy?.transactionDisposition!=='retain_minimized'||policy.financialPolicyId!==policyId)return {complete:false,ownershipVerified:false,count:0,dispositionSupported:false};
      try{const rows=await read(accountId);return {complete:true,ownershipVerified:true,count:rows.length,unattributedCount:0,dispositionSupported:true};}
      catch{return {complete:false,ownershipVerified:false,count:0,dispositionSupported:false};}
    },
    async apply({accountId,requestId,disposition,policy}={}){
      if(disposition!=='retain_minimized'||policy?.financialPolicyId!==policyId||!validId(requestId))throw Error('financial_retention_policy_mismatch');
      const rows=await read(accountId);
      // Audit/shape checks complete for every record before the first write.
      for(const row of rows){
        const archiveId=hash(JSON.stringify([policyId,row.collection,row.id]));
        const record={policyId,purpose,accountIdHash:hash(accountId),requestId,sourceCollection:row.collection,sourceIdHash:hash(row.id),sourceRevision:row.revision,retainedAt:now(),retainUntil:row.retainUntil,fields:row.minimal};
        record.recordFingerprint=hash(JSON.stringify([record.policyId,record.purpose,record.accountIdHash,record.requestId,record.sourceCollection,record.sourceIdHash,record.sourceRevision,record.retainUntil,record.fields]));
        const persisted=await archive.putIfAbsent({id:archiveId,record});
        // A retry may encounter the archive after an uncertain source delete.
        if(persisted?.durable!==true||persisted.policyId!==policyId||persisted.sourceRevision!==row.revision||persisted.accountIdHash!==record.accountIdHash||persisted.requestId!==requestId||persisted.recordFingerprint!==record.recordFingerprint)throw Error('financial_archive_scope_conflict');
        await reader.deleteOwnedIfUnchanged({collection:row.collection,id:row.id,accountId,expectedRevision:row.revision});
      }
      return {retainedMinimized:rows.length};
    },
    async purgeExpired({limit=100}={}){
      if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('financial_retention_limit_invalid');
      const due=await archive.listDue({policyId,now:now(),limit});
      if(due?.complete!==true||!Array.isArray(due.records)||due.records.length>limit)throw Error('financial_retention_expiry_inventory_invalid');
      for(const row of due.records)if(!/^[a-f0-9]{64}$/.test(row?.id||'')||row.record?.policyId!==policyId||!Number.isSafeInteger(row.record.retainUntil)||row.record.retainUntil>now()||typeof row.revision!=='string')throw Error('financial_retention_not_due');
      for(const row of due.records)await archive.deleteIfUnchanged({id:row.id,expectedRevision:row.revision,retainUntil:row.record.retainUntil});
      return {removed:due.records.length};
    },
  });
}
