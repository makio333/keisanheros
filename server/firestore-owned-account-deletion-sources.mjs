const validId=value=>typeof value==='string'&&value.length>0&&value.length<=128;

async function scanPages(baseQuery,pageSize,visit,maxDocuments=Number.MAX_SAFE_INTEGER){
  let cursor=null,total=0;
  for(;;){
    const remaining=maxDocuments-total;
    let query=baseQuery.limit(Math.min(pageSize,remaining+1));
    if(cursor)query=query.startAfter(cursor);
    const snapshot=await query.get(),docs=Array.isArray(snapshot.docs)?snapshot.docs:[];
    if(!docs.length)break;
    if(docs.length>remaining)throw Error('account_deletion_inventory_cap_exceeded');
    await visit(docs);
    total+=docs.length;
    if(docs.length<pageSize)break;
    cursor=docs.at(-1);
  }
  return total;
}

function snapshotValue(snapshot){return typeof snapshot?.data==='function'?snapshot.data():undefined;}
function epochMillis(value){
  if(Number.isSafeInteger(value)&&value>=0)return value;
  if(value instanceof Date&&Number.isFinite(value.getTime()))return value.getTime();
  if(typeof value?.toMillis==='function'){const time=value.toMillis();if(Number.isSafeInteger(time)&&time>=0)return time;}
  return null;
}
function recognizedTtlAttempt(data){
  const expiresAt=epochMillis(data?.expiresAt),ttlAt=epochMillis(data?.ttlAt);
  if(expiresAt===null||ttlAt===null||Math.abs(expiresAt-ttlAt)>1000)return false;
  if(data.kind==='rate-limit')return typeof data.scope==='string'&&/^[a-z][a-z0-9._-]{1,79}$/.test(data.scope)&&Array.isArray(data.timestamps)&&data.timestamps.length<=100&&data.timestamps.every(value=>Number.isSafeInteger(value)&&value>=0);
  return data.kind===undefined&&['login','link'].includes(data.intent)&&/^[a-f0-9]{64}$/.test(data.browserHash||'')&&/^[a-f0-9]{64}$/.test(data.nonce||'')&&typeof data.verifier==='string'&&/^[A-Za-z0-9_-]{40,100}$/.test(data.verifier)&&(data.accountId===null||validId(data.accountId));
}
function attemptOwnerState(data,{uid,accountId}){
  const accountValues=[data.accountId,data.ownerAccountId].filter(value=>value!==undefined&&value!==null);
  const uidValues=[data.uid,data.ownerUid].filter(value=>value!==undefined&&value!==null);
  if(accountValues.some(value=>!validId(value))||uidValues.some(value=>!validId(value))||new Set(accountValues).size>1||new Set(uidValues).size>1)return {valid:false,target:false};
  if(accountValues.length&&uidValues.length)return {valid:false,target:false};
  if(accountValues.length)return {valid:true,target:accountValues[0]===accountId};
  if(uidValues.length)return {valid:true,target:uidValues[0]===uid};
  return {valid:true,target:false};
}

// Only sources with a stable, code-verified ownership key are included. This module
// performs no SDK initialization or cloud calls until a returned adapter is invoked.
export function createFirestoreOwnedAccountDeletionSources({db,pageSize=200,maxAuditDocuments=10000,ownershipAudits={},legacySaveSource}={}){
  if(typeof db?.collection!=='function'||typeof db?.batch!=='function'||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>400||!Number.isSafeInteger(maxAuditDocuments)||maxAuditDocuments<1)throw Error('firestore_owned_deletion_not_configured');
  if(legacySaveSource&&(!legacySaveSource.idempotent||typeof legacySaveSource.inspect!=='function'||typeof legacySaveSource.apply!=='function'))throw Error('invalid_legacy_deletion_source');

  async function deleteMatching(baseQuery,{ownerField,ownerValue,validateDoc=()=>true}={}){
    if(!ownerField||!validId(ownerValue))throw Error('invalid_account_deletion_scope');
    let removed=0;
    await scanPages(baseQuery,pageSize,async docs=>{
      const batch=db.batch();
      for(const doc of docs){
        const data=snapshotValue(doc);
        if(!data||data[ownerField]!==ownerValue||!validateDoc(doc,data))throw Error('account_deletion_owner_mismatch');
        batch.delete(doc.ref);removed++;
      }
      if(docs.length)await batch.commit();
    });
    return removed;
  }
  function ownerCollection(name,field){
    return {
      idempotent:true,
      async inspect({accountId}){
        if(!validId(accountId))return {complete:false,ownershipVerified:false,count:0};
        let count=0;
        await scanPages(db.collection(name).where(field,'==',accountId),pageSize,docs=>{
          for(const doc of docs){if(snapshotValue(doc)?.[field]!==accountId)throw Error('account_deletion_owner_mismatch');count++;}
        });
        if(name!=='saves')return {complete:true,ownershipVerified:true,count,unattributedCount:0};
        const audit=ownershipAudits.productSaves;
        if(typeof audit!=='function')return {complete:false,ownershipVerified:false,count,unattributedCount:0};
        const result=await audit({db,accountId});
        return {complete:result?.complete===true,ownershipVerified:result?.complete===true&&result?.unattributedCount===0,count,unattributedCount:Number.isSafeInteger(result?.unattributedCount)&&result.unattributedCount>=0?result.unattributedCount:0};
      },
      async apply({accountId,disposition}){
        if(disposition&&disposition!=='delete')throw Error('account_deletion_policy_unresolved');
        if(name==='saves'){
          const audit=ownershipAudits.productSaves;
          if(typeof audit!=='function')throw Error('product_saves_ownership_audit_required');
          const result=await audit({db,accountId});
          if(result?.complete!==true||result?.unattributedCount!==0)throw Error('product_saves_ownership_unverified');
        }
        await deleteMatching(db.collection(name).where(field,'==',accountId),{ownerField:field,ownerValue:accountId});
      },
    };
  }
  async function nestedUidSaves({topLevel,uid}){
    if(!validId(uid))throw Error('invalid_account_deletion_scope');
    const ref=db.collection(topLevel).doc(uid).collection('saves');let count=0,unattributedCount=0;
    await scanPages(ref,pageSize,docs=>{
      for(const doc of docs){const owner=snapshotValue(doc)?.ownerUid;if(owner!==uid)unattributedCount++;else count++;}
    });
    return {complete:unattributedCount===0,ownershipVerified:unattributedCount===0,count,unattributedCount};
  }
  function uidSource(topLevel){
    return {
      idempotent:true,
      async inspect({uid}){return nestedUidSaves({topLevel,uid});},
      async apply({uid,disposition}){
        if(disposition&&disposition!=='delete')throw Error('account_deletion_policy_unresolved');
        if(!validId(uid))throw Error('invalid_account_deletion_scope');
        const ref=db.collection(topLevel).doc(uid).collection('saves');
        await scanPages(ref,pageSize,async docs=>{
          const batch=db.batch();
          for(const doc of docs){if(snapshotValue(doc)?.ownerUid!==uid)throw Error('account_deletion_owner_mismatch');batch.delete(doc.ref);}
          if(docs.length)await batch.commit();
        });
      },
    };
  }
  async function inspectLoginAttempts({uid,accountId}){
      if(!validId(uid)||!validId(accountId))return {complete:false,ownershipVerified:false,count:0,unattributedCount:1};
      let count=0,unattributedCount=0,ttlManagedCount=0;
      try{
        await scanPages(db.collection('attempts'),pageSize,docs=>{
          for(const doc of docs){
            const data=snapshotValue(doc),scope=data&&attemptOwnerState(data,{uid,accountId});
            if(!data||!scope?.valid||!recognizedTtlAttempt(data)){unattributedCount++;continue;}
            if(scope.target)count++;else ttlManagedCount++;
          }
        },maxAuditDocuments);
      }catch(error){return {complete:false,ownershipVerified:false,count,unattributedCount:Math.max(1,unattributedCount),reason:error?.message==='account_deletion_inventory_cap_exceeded'?'login_attempt_inventory_cap_exceeded':'login_attempt_inventory_read_failed'};}
      return {complete:unattributedCount===0,ownershipVerified:unattributedCount===0,count,unattributedCount,ttlManagedCount};
  }
  const loginAttempts={
    idempotent:true,
    inspect:inspectLoginAttempts,
    async apply({uid,accountId,disposition}){
      if(disposition&&disposition!=='delete')throw Error('account_deletion_policy_unresolved');
      if(!validId(uid)||!validId(accountId))throw Error('invalid_account_deletion_scope');
      const audit=await inspectLoginAttempts({uid,accountId});
      if(audit.complete!==true||audit.unattributedCount!==0)throw Error('login_attempt_inventory_incomplete');
      const targets=[];
      await scanPages(db.collection('attempts'),pageSize,docs=>{
        for(const doc of docs){
          const data=snapshotValue(doc),scope=data&&attemptOwnerState(data,{uid,accountId});
          if(!data||!scope?.valid||!recognizedTtlAttempt(data))throw Error('login_attempt_inventory_incomplete');
          if(scope.target)targets.push(doc.ref);
        }
      },maxAuditDocuments);
      for(let offset=0;offset<targets.length;offset+=pageSize){
        const batch=db.batch();
        for(const ref of targets.slice(offset,offset+pageSize))batch.delete(ref);
        await batch.commit();
      }
    },
  };
  function financialSource(collections,auditName){
    return {
      idempotent:true,
      async inspect({accountId,policy}){
        if(!validId(accountId))return {complete:false,ownershipVerified:false,count:0,dispositionSupported:false};
        const dispositionSupported=policy?.transactionDisposition==='delete';
        let count=0;
        for(const name of collections){
          await scanPages(db.collection(name).where('accountId','==',accountId),pageSize,docs=>{
            for(const doc of docs){if(snapshotValue(doc)?.accountId!==accountId)throw Error('account_deletion_owner_mismatch');count++;}
          });
        }
        const audit=ownershipAudits[auditName];
        let global={complete:false,unattributedCount:0};
        if(typeof audit==='function')global=await audit({db,accountId,collections});
        const unattributedCount=Number.isSafeInteger(global?.unattributedCount)&&global.unattributedCount>=0?global.unattributedCount:0;
        return {complete:dispositionSupported&&global?.complete===true&&unattributedCount===0,ownershipVerified:global?.complete===true&&unattributedCount===0,count,unattributedCount,dispositionSupported};
      },
      async apply({accountId,disposition}){
        if(disposition!=='delete')throw Error('transaction_retention_policy_unresolved');
        if(!validId(accountId))throw Error('invalid_account_deletion_scope');
        const audit=ownershipAudits[auditName];
        if(typeof audit!=='function')throw Error('financial_record_inventory_required');
        const global=await audit({db,accountId,collections});
        if(global?.complete!==true||global?.unattributedCount!==0)throw Error('financial_record_inventory_incomplete');
        for(const name of collections)await deleteMatching(db.collection(name).where('accountId','==',accountId),{ownerField:'accountId',ownerValue:accountId});
      },
    };
  }
  const productGameDocuments={
    idempotent:true,
    async inspect({uid,accountId,uidHash}){
      if(!validId(uid)||!validId(accountId)||!validId(uidHash))return {complete:false,ownershipVerified:false,count:0};
      const collections=['legacyAssignments','legacyTransfers','firebaseTransfers','legacyFacilityBindings'];let count=0;
      for(const name of collections)await scanPages(db.collection(name).where('accountId','==',accountId),pageSize,docs=>{
        for(const doc of docs){if(snapshotValue(doc)?.accountId!==accountId)throw Error('account_deletion_owner_mismatch');count++;}
      });
      const emailRef=db.collection('emailRegistrations').doc(uidHash),emailSnap=await emailRef.get(),emailData=snapshotValue(emailSnap);
      if(emailSnap.exists){if(emailData?.uidHash!==uidHash)throw Error('account_deletion_owner_mismatch');count++;}
      await scanPages(db.collection('emailDeliveries').where('ownerUidHash','==',uidHash),pageSize,docs=>{
        for(const doc of docs){const data=snapshotValue(doc);if(data?.kind!=='email-delivery'||data.ownerUidHash!==uidHash)throw Error('account_deletion_owner_mismatch');count++;}
      });
      const audit=ownershipAudits.productGameDocuments;
      let global={complete:false,unattributedCount:0};
      if(typeof audit==='function')global=await audit({db,uid,accountId,uidHash,collections:['legacyAssignments','legacyTransfers','firebaseTransfers','legacyFacilityBindings','emailRegistrations','emailDeliveries']});
      const unattributedCount=Number.isSafeInteger(global?.unattributedCount)&&global.unattributedCount>=0?global.unattributedCount:0;
      return {complete:global?.complete===true&&unattributedCount===0,ownershipVerified:global?.complete===true&&unattributedCount===0,count,unattributedCount};
    },
    async apply({uid,accountId,uidHash,disposition}){
      if(disposition&&disposition!=='delete')throw Error('account_deletion_policy_unresolved');
      if(!validId(uid)||!validId(accountId)||!validId(uidHash))throw Error('invalid_account_deletion_scope');
      const audit=ownershipAudits.productGameDocuments;
      if(typeof audit!=='function')throw Error('product_game_document_inventory_required');
      const global=await audit({db,uid,accountId,uidHash,collections:['legacyAssignments','legacyTransfers','firebaseTransfers','legacyFacilityBindings','emailRegistrations','emailDeliveries']});
      if(global?.complete!==true||global?.unattributedCount!==0)throw Error('product_game_document_inventory_incomplete');
      for(const name of ['legacyAssignments','legacyTransfers','firebaseTransfers','legacyFacilityBindings'])await deleteMatching(db.collection(name).where('accountId','==',accountId),{ownerField:'accountId',ownerValue:accountId});
      const emailRef=db.collection('emailRegistrations').doc(uidHash),emailSnap=await emailRef.get(),emailData=snapshotValue(emailSnap);
      if(emailSnap.exists){if(emailData?.uidHash!==uidHash)throw Error('account_deletion_owner_mismatch');await emailRef.delete();}
      await deleteMatching(db.collection('emailDeliveries').where('ownerUidHash','==',uidHash),{ownerField:'ownerUidHash',ownerValue:uidHash,validateDoc:(_doc,data)=>data.kind==='email-delivery'});
    },
  };
  const accounts={
    idempotent:true,
    async inspect({accountId}){
      if(!validId(accountId))return {complete:false,ownershipVerified:false,count:0};
      const snap=await db.collection('accounts').doc(accountId).get(),data=snapshotValue(snap);
      const verified=!snap.exists||!data?.id||data.id===accountId;
      return {complete:verified,ownershipVerified:verified,count:snap.exists?1:0,unattributedCount:verified?0:1};
    },
    async apply({accountId,disposition}){
      if(disposition&&disposition!=='delete')throw Error('account_deletion_policy_unresolved');
      if(!validId(accountId))throw Error('invalid_account_deletion_scope');
      const ref=db.collection('accounts').doc(accountId),snap=await ref.get(),data=snapshotValue(snap);
      if(snap.exists&&data?.id&&data.id!==accountId)throw Error('account_deletion_owner_mismatch');
      if(snap.exists)await ref.delete();
    },
  };
  const browserCopies={
    idempotent:true,
    async inspect({policy}={}){
      // Device storage is not remotely enumerable. The confirmed local cleanup
      // instructions make this source complete without claiming remote erasure.
      const noticeConfirmed=policy?.browserCopyNoticeConfirmed===true;
      return {complete:noticeConfirmed,ownershipVerified:noticeConfirmed,count:0,unattributedCount:0,deviceCleanupConfirmed:noticeConfirmed,remoteErasureAvailable:false};
    },
    async apply({policy}={}){
      if(policy?.browserCopyNoticeConfirmed!==true)throw Error('browser_copy_cleanup_notice_required');
      return {remoteErasureAvailable:false,localCleanupInstructionsRequired:true};
    },
  };
  return Object.freeze({
    accounts,
    identityMappings:ownerCollection('identities','accountId'),
    sessions:ownerCollection('sessions','accountId'),
    loginAttempts,
    productSaves:ownerCollection('saves','ownerAccountId'),
    privateGameSaves:uidSource('privateGame'),
    privateMigrationSaves:uidSource('privateMigration'),
    legacySaves:legacySaveSource,
    productGameDocuments,
    purchaseRecords:financialSource(['purchases','events'],'purchaseRecords'),
    stripeOrders:financialSource(['stripeOrders','stripeCheckout'],'stripeOrders'),
    browserCopies,
  });
}
