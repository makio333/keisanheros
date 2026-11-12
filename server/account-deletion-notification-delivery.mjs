import {createHash,randomUUID} from 'node:crypto';
import {createAccountDeletionNotice} from './account-deletion-notifications.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const validKey=value=>typeof value==='string'&&/^[A-Za-z0-9._:-]{1,200}$/.test(value);
const allowedStages=new Set(['received','retention-ended','completed']);

// A durable outbox and idempotent provider transport are injected. Imports and
// enqueue do not send email. Production delivery remains explicitly disabled.
export function createAccountDeletionNotificationDelivery({store,transport,deliveryEnabled=false,now=Date.now,makeLeaseId=randomUUID,retryDelayMs=60000,leaseMs=120000,maxAttempts=8}={}){
  if(typeof store?.transaction!=='function'||typeof store?.listDue!=='function'||typeof now!=='function'||typeof makeLeaseId!=='function'||!Number.isSafeInteger(retryDelayMs)||retryDelayMs<1000||!Number.isSafeInteger(leaseMs)||leaseMs<1000)throw Error('deletion_notification_outbox_required');
  if(deliveryEnabled&&(transport?.idempotent!==true||typeof transport.send!=='function'))throw Error('idempotent_notification_transport_required');
  if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>8)throw Error('notification_attempt_limit_invalid');
  function identity({requestId,stage}){
    if(!validKey(requestId)||!allowedStages.has(stage))throw Error('deletion_notification_scope_invalid');
    return 'deletion-notice:'+digest(JSON.stringify([requestId,stage]));
  }
  return Object.freeze({deliveryEnabled,
    async enqueue({requestId,uidHash,accountIdHash,verifiedContact,notice}={}){
      if(!/^[a-f0-9]{64}$/.test(uidHash||'')||!/^[a-f0-9]{64}$/.test(accountIdHash||'')||verifiedContact?.verified!==true||verifiedContact.uidHash!==uidHash||verifiedContact.accountIdHash!==accountIdHash||typeof verifiedContact.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifiedContact.email)||verifiedContact.email.length>254)throw Error('verified_deletion_contact_required');
      const rendered=createAccountDeletionNotice({...notice,now:now()}),id=identity({requestId,stage:rendered.stage});
      const fingerprint=digest(JSON.stringify([uidHash,accountIdHash,verifiedContact.email.toLowerCase(),rendered.subject,rendered.text]));
      await store.transaction(async tx=>{
        const previous=await tx.get(id);
        if(previous){if(previous.fingerprint!==fingerprint)throw Error('deletion_notice_identity_conflict');return;}
        tx.put(id,{id,requestId,stage:rendered.stage,fingerprint,to:verifiedContact.email,subject:rendered.subject,text:rendered.text.replace(/\nこの文面は下書きです。メールは送信されていません。$/u,''),state:'pending',attempts:0,nextAttemptAt:now(),createdAt:now()});
      });
      return {queued:true,id};
    },
    async drain({limit=25}={}){
      if(!deliveryEnabled)return {ok:false,error:'notification_delivery_disabled',sent:0,retryRequired:0};
      if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('notification_limit_invalid');
      const candidates=await store.listDue({now:now(),limit});
      if(!Array.isArray(candidates)||candidates.length>limit)throw Error('notification_outbox_query_invalid');
      let sent=0,retryRequired=0;
      for(const candidate of candidates){
        if(typeof candidate?.id!=='string'||!/^deletion-notice:[a-f0-9]{64}$/.test(candidate.id))throw Error('notification_outbox_record_invalid');
        const leaseId=makeLeaseId();
        const claimed=await store.transaction(async tx=>{
          const row=await tx.get(candidate.id);
          if(!row||['sent','held'].includes(row.state)||row.nextAttemptAt>now()||row.state==='sending'&&row.leaseUntil>now())return null;
          if(!['pending','sending'].includes(row.state)||!Number.isSafeInteger(row.attempts)||typeof row.to!=='string'||typeof row.subject!=='string'||typeof row.text!=='string')throw Error('notification_outbox_record_invalid');
          if(row.attempts>=maxAttempts){const {leaseId:_lease,leaseUntil,...rest}=row;tx.put(row.id,{...rest,state:'held',holdReason:'attempt_limit',heldAt:now()});return null;}
          const next={...row,state:'sending',attempts:row.attempts+1,leaseId,leaseUntil:now()+leaseMs};tx.put(row.id,next);return next;
        });
        if(!claimed)continue;
        try{
          const receipt=await transport.send({idempotencyKey:claimed.id,to:claimed.to,subject:claimed.subject,text:claimed.text});
          if(receipt?.accepted!==true)throw Error('notification_provider_not_accepted');
          await store.transaction(async tx=>{const current=await tx.get(claimed.id);if(current?.leaseId!==leaseId)throw Error('notification_lease_lost');const {to,subject,text,leaseId:_lease,leaseUntil,...minimal}=current;tx.put(claimed.id,{...minimal,state:'sent',sentAt:now()});});sent++;
        }catch{
          retryRequired++;
          await store.transaction(async tx=>{const row=await tx.get(claimed.id);if(row?.leaseId!==leaseId)return;const {leaseId:_lease,leaseUntil,...rest}=row;tx.put(row.id,row.attempts>=maxAttempts?{...rest,state:'held',holdReason:'attempt_limit',heldAt:now()}:{...rest,state:'pending',nextAttemptAt:now()+Math.min(retryDelayMs*2**Math.min(row.attempts-1,10),86400000)});});
        }
      }
      return {ok:true,sent,retryRequired};
    },
  });
}
