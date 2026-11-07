import {randomUUID} from 'node:crypto';
export function createSalesEmailLedger({store}={}){
  if(typeof store?.transaction!=='function')throw Error('email_ledger_not_configured');
  const keyFor=key=>{if(!/^[a-f0-9]{64}$/.test(key||''))throw Error('email_ledger_key_invalid');return 'emailDeliveries/'+key;};
  return Object.freeze({
    async reserve({key,ownerUidHash,now,cooldownMs}){
      if(!/^[a-f0-9]{64}$/.test(ownerUidHash||''))throw Error('email_ledger_owner_invalid');
      if(!Number.isSafeInteger(now)||!Number.isSafeInteger(cooldownMs)||now<0||cooldownMs<60000)throw Error('email_ledger_time_invalid');
      const id=keyFor(key),deliveryId=randomUUID();
      return store.transaction(async tx=>{
        const old=await tx.getGameDocument(id);
        if(old&&(old.ownerUidHash!==ownerUidHash||old.status!=='sent'))return {status:'uncertain'};
        if(old&&(!Number.isSafeInteger(old.sentAt)||old.sentAt>now||now-old.sentAt<cooldownMs))return {status:'cooldown'};
        tx.putGameDocument(id,{kind:'email-delivery',ownerUidHash,status:'reserved',deliveryId,reservedAt:now});
        return {status:'reserved',deliveryId};
      });
    },
    async complete({key,deliveryId,now,status}){
      if(status!=='sent'||typeof deliveryId!=='string'||!Number.isSafeInteger(now))throw Error('email_ledger_completion_invalid');
      const id=keyFor(key);
      return store.transaction(async tx=>{
        const old=await tx.getGameDocument(id);
        if(!old||old.deliveryId!==deliveryId||old.status!=='reserved'||now<old.reservedAt)throw Error('email_ledger_conflict');
        tx.putGameDocument(id,{...old,status:'sent',sentAt:now});
      });
    },
  });
}
