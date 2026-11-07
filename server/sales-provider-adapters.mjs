import {createHash} from 'node:crypto';

const hash=value=>createHash('sha256').update(value).digest('hex');
const validKey=value=>typeof value==='string'&&value.length>0&&value.length<=2000&&!/[\u0000-\u001f]/.test(value);
const canonical=value=>{
  if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  throw Error('sales_document_json_required');
};
const copy=value=>JSON.parse(canonical(value));
const limitFor=value=>{if(!Number.isInteger(value)||value<1||value>100)throw Error('sales_provider_limit_invalid');return value;};
const timestamp=value=>{if(!Number.isSafeInteger(value)||value<0)throw Error('sales_provider_time_invalid');return value;};
const revision=record=>hash(canonical(record));
const kinds={ledger:'salesDeletionLedger',outbox:'salesDeletionOutbox',lifecycle:'salesDeletionLifecycle',archive:'salesFinancialArchive',mail:'salesMailState'};

// Already-created Firestore objects only. This module never initializes an SDK,
// reads credentials/env or creates a database. Every logical key is hashed into
// one fixed collection, so caller-provided keys can never select another path.
export function createSalesDocumentStore({db,kind,expectedProject='ailandgames',expectedDatabaseId,maxWrites=100}={}){
  if(expectedProject!=='ailandgames'||typeof expectedDatabaseId!=='string'||!expectedDatabaseId||db?.projectId!==expectedProject||db?.databaseId!==expectedDatabaseId||typeof db?.runTransaction!=='function'||typeof db?.collection!=='function'||!Object.hasOwn(kinds,kind)||!Number.isInteger(maxWrites)||maxWrites<1||maxWrites>400)throw Error('sales_document_scope_required');
  const collection=db.collection(kinds[kind]);
  const refFor=key=>{if(!validKey(key))throw Error('sales_document_key_invalid');return collection.doc(hash(key));};
  function unpack(snapshot,key){
    if(!snapshot?.exists)return null;
    const data=snapshot.data();
    if(data?.schemaVersion!==1||!validKey(data.key)||key!==undefined&&data.key!==key||snapshot.id!==hash(data.key)||!data.record||typeof data.record!=='object')throw Error('sales_document_corrupt');
    return {key:data.key,record:copy(data.record)};
  }
  async function queryRows(query,limit){
    const result=await query.limit(limit).get();
    if(!Array.isArray(result?.docs)||result.docs.length>limit)throw Error('sales_provider_query_invalid');
    const keys=new Set();return result.docs.map(snapshot=>{const row=unpack(snapshot);if(!row||keys.has(row.key))throw Error('sales_provider_query_invalid');keys.add(row.key);return row;});
  }
  return Object.freeze({kind,collection:kinds[kind],authorityId:expectedProject+'/'+expectedDatabaseId,
    async transaction(callback){
      if(typeof callback!=='function')throw Error('sales_document_callback_required');
      return db.runTransaction(async native=>{
        const pending=new Map();
        const get=async key=>{if(pending.has(key))return pending.get(key)===null?null:copy(pending.get(key));return unpack(await native.get(refFor(key)),key)?.record??null;};
        const put=(key,record)=>{refFor(key);if(!record||typeof record!=='object'||Array.isArray(record))throw Error('sales_document_record_invalid');const cloned=copy(record);if(Buffer.byteLength(canonical(cloned))>500000)throw Error('sales_document_too_large');pending.set(key,cloned);if(pending.size>maxWrites)throw Error('sales_document_write_limit');};
        const remove=key=>{refFor(key);pending.set(key,null);if(pending.size>maxWrites)throw Error('sales_document_write_limit');};
        const result=await callback(Object.freeze({get,put,delete:remove,getGameDocument:get,putGameDocument:put}));
        // Buffer mutations so Firestore receives every read before any write.
        for(const [key,record] of pending){const ref=refFor(key);if(record===null)native.delete(ref);else native.set(ref,{schemaVersion:1,key,record});}
        return result;
      });
    },
    async listOpen({limit=100,afterKey=null}={}){
      if(kind!=='lifecycle')throw Error('sales_provider_query_scope_invalid');limitFor(limit);
      if(afterKey!==null&&!validKey(afterKey))throw Error('sales_provider_cursor_invalid');
      let query=collection.where('record.state','in',['prepared','accepting','pending']).orderBy('__name__');
      // Firestore orders the hashed document IDs, not the human-readable keys.
      // A DocumentReference cursor remains valid if that row later closes.
      if(afterKey!==null)query=query.startAfter(refFor(afterKey));
      const rows=await queryRows(query,limit);
      if(rows.some(row=>!['prepared','accepting','pending'].includes(row.record.state)))throw Error('sales_provider_query_invalid');
      return rows.map(row=>({...row.record,storageKey:row.key}));
    },
    async listDue({now,limit=25,policyId}={}){
      timestamp(now);limitFor(limit);
      if(kind==='outbox'){
        const rows=await queryRows(collection.where('record.state','in',['pending','sending']).where('record.nextAttemptAt','<=',now).orderBy('record.nextAttemptAt').orderBy('__name__'),limit);
        if(rows.some(row=>row.record.id!==row.key||!['pending','sending'].includes(row.record.state)||!Number.isSafeInteger(row.record.nextAttemptAt)||row.record.nextAttemptAt>now))throw Error('sales_provider_query_invalid');
        return rows.map(row=>row.record);
      }
      if(kind==='archive'){
        if(!validKey(policyId))throw Error('sales_archive_policy_required');
        const rows=await queryRows(collection.where('record.policyId','==',policyId).where('record.retainUntil','<=',now).orderBy('record.retainUntil').orderBy('__name__'),limit);
        if(rows.some(row=>row.record.policyId!==policyId||!Number.isSafeInteger(row.record.retainUntil)||row.record.retainUntil>now))throw Error('sales_provider_query_invalid');
        return {complete:true,records:rows.map(row=>({id:row.key,record:row.record,revision:revision(row.record)}))};
      }
      throw Error('sales_provider_query_scope_invalid');
    },
  });
}

export function createSalesFinancialArchive({store,now=Date.now}={}){
  if(store?.kind!=='archive'||typeof store.transaction!=='function'||typeof store.listDue!=='function')throw Error('sales_archive_store_required');
  return Object.freeze({
    async putIfAbsent({id,record}){
      if(!/^[a-f0-9]{64}$/.test(id||'')||!record||typeof record!=='object')throw Error('sales_archive_record_invalid');
      if(!/^[a-f0-9]{64}$/.test(record.recordFingerprint||''))throw Error('sales_archive_fingerprint_required');
      return store.transaction(async tx=>{const existing=await tx.get(id);if(existing&&(existing.recordFingerprint!==record.recordFingerprint||['policyId','sourceRevision','accountIdHash','requestId'].some(key=>existing[key]!==record[key])))throw Error('financial_archive_scope_conflict');if(!existing)tx.put(id,record);return {...copy(existing||record),durable:true};});
    },
    listDue:options=>store.listDue(options),
    async deleteIfUnchanged({id,expectedRevision,retainUntil}){
      if(!/^[a-f0-9]{64}$/.test(id||'')||!Number.isSafeInteger(retainUntil)||retainUntil>timestamp(now()))throw Error('sales_archive_record_invalid');
      return store.transaction(async tx=>{const row=await tx.get(id);if(!row)return {removed:false,alreadyMissing:true};if(revision(row)!==expectedRevision||row.retainUntil!==retainUntil)throw Error('sales_archive_revision_conflict');tx.delete(id);return {removed:true};});
    },
  });
}

// driverRegistry is supplied by the operator's reviewed integration. No vendor
// is selected here. request is a test-injectable function, never global fetch.
export function createSalesMailTransport({enabled=false,driverId,approvedDriverIds=[],from,driverRegistry={},request,store,now=Date.now,maxMessageBytes=100000,maxAttempts=8}={}){
  if(enabled!==true)return Object.freeze({ready:false,idempotent:false,async send(){throw Error('sales_mail_transport_disabled');},async sendMessage(){throw Error('sales_mail_transport_disabled');}});
  const driver=driverRegistry&&typeof driverRegistry==='object'&&Object.hasOwn(driverRegistry,driverId)?driverRegistry[driverId]:null;
  if(!Array.isArray(approvedDriverIds)||!approvedDriverIds.includes(driverId)||!driver||driver.idempotent!==true||!(driver.durableIdempotency===true||Number.isSafeInteger(driver.idempotenceBoundMs)&&driver.idempotenceBoundMs>=60000)||typeof driver.send!=='function'||typeof request!=='function'||typeof store?.transaction!=='function'||typeof from!=='string'||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from)||from.length>254||!Number.isInteger(maxMessageBytes)||maxMessageBytes<1000||maxMessageBytes>500000||!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>20)throw Error('sales_mail_transport_configuration_required');
  async function send({idempotencyKey,to,subject,text}={}){
    if(typeof idempotencyKey!=='string'||!/^[A-Za-z0-9._:-]{1,200}$/.test(idempotencyKey)||typeof to!=='string'||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to)||to.length>254||typeof subject!=='string'||!subject||subject.length>200||/[\r\n]/.test(subject)||typeof text!=='string'||Buffer.byteLength(text)>maxMessageBytes)throw Error('sales_mail_message_invalid');
    const clock=timestamp(now()),key='mail-transport:'+hash(idempotencyKey),fingerprint=hash(canonical({driverId,from,to,subject,text}));
    const state=await store.transaction(async tx=>{
      const old=await tx.get(key);
      if(old&&old.fingerprint!==fingerprint)throw Error('sales_mail_idempotency_conflict');
      if(old?.state==='sent')return old;
      if(old&&(!Number.isSafeInteger(old.firstAttemptAt)||old.firstAttemptAt>clock||old.state!=='pending'||!Number.isInteger(old.attempts)||old.attempts<1))throw Error('sales_mail_state_invalid');
      if(old&&driver.durableIdempotency!==true&&clock-old.firstAttemptAt>=driver.idempotenceBoundMs)throw Error('sales_mail_idempotency_window_elapsed');
      if(old?.attempts>=maxAttempts)throw Error('sales_mail_attempts_exhausted');
      const next={...(old||{state:'pending',fingerprint,firstAttemptAt:clock}),attempts:(old?.attempts||0)+1};tx.put(key,next);return next;
    });
    if(state.state==='sent')return {accepted:true};
    let receipt;try{receipt=await driver.send({request,idempotencyKey,from,to,subject,text});}catch{throw Error('sales_mail_delivery_uncertain');}
    if(receipt?.accepted!==true)throw Error('sales_mail_delivery_uncertain');
    await store.transaction(async tx=>{const current=await tx.get(key);if(current?.fingerprint!==fingerprint)throw Error('sales_mail_idempotency_conflict');tx.put(key,{...current,state:'sent',sentAt:timestamp(now())});});
    return {accepted:true};
  }
  return Object.freeze({ready:true,idempotent:true,driverId,from,maxAttempts,idempotenceBoundMs:driver.durableIdempotency===true?null:driver.idempotenceBoundMs,send,sendMessage:({deliveryId,...message})=>send({...message,idempotencyKey:deliveryId})});
}

export function salesSnapshotRevision(snapshot){
  const stamp=snapshot?.updateTime;
  if(!Number.isSafeInteger(stamp?.seconds)||!Number.isInteger(stamp?.nanoseconds)||stamp.nanoseconds<0||stamp.nanoseconds>=1000000000)throw Error('sales_source_revision_required');
  return stamp.seconds+':'+stamp.nanoseconds;
}

// An exact allowlist and transaction revision/hash checks guard every mutation.
// No collection, project or database is inferred from caller-controlled paths.
export function createSalesCasWriter({db,expectedProject,expectedDatabaseId,allowedCollections,fingerprintMode='canonical'}={}){
  if(typeof expectedProject!=='string'||db?.projectId!==expectedProject||typeof expectedDatabaseId!=='string'||db?.databaseId!==expectedDatabaseId||typeof db?.runTransaction!=='function'||typeof db?.collection!=='function'||!Array.isArray(allowedCollections)||!allowedCollections.length||allowedCollections.length>100||new Set(allowedCollections).size!==allowedCollections.length||allowedCollections.some(name=>typeof name!=='string'||!/^[-A-Za-z0-9_]{1,150}$/.test(name))||!['canonical','json'].includes(fingerprintMode))throw Error('sales_cas_scope_required');
  const allowed=new Set(allowedCollections),digest=value=>hash(fingerprintMode==='canonical'?canonical(value):JSON.stringify(value));
  function reference(collection,id){if(!allowed.has(collection)||typeof id!=='string'||!id||id.length>1500||id.includes('/')||/[\u0000-\u001f]/.test(id))throw Error('sales_cas_scope_invalid');return db.collection(collection).doc(id);}
  async function mutate({sourceProject=expectedProject,collection,documentId,id=documentId,expectedRevision,expectedSha256,after,accountId,ownerField='accountId',remove=false}={}){
    if(sourceProject!==expectedProject)throw Error('sales_cas_scope_invalid');
    const ref=reference(collection,id);
    if(typeof expectedRevision!=='string'||!expectedRevision||expectedSha256!==undefined&&!/^[a-f0-9]{64}$/.test(expectedSha256))throw Error('sales_source_revision_required');
    if(!remove&&(!after||typeof after!=='object'||Array.isArray(after)))throw Error('sales_cas_record_invalid');
    const next=remove?null:copy(after);
    if(next&&Buffer.byteLength(canonical(next))>850000)throw Error('sales_cas_record_too_large');
    return db.runTransaction(async tx=>{
      const snapshot=await tx.get(ref);
      if(!snapshot?.exists){if(remove)return {removed:false,alreadyMissing:true};throw Error('sales_source_missing');}
      const before=snapshot.data();
      if(salesSnapshotRevision(snapshot)!==expectedRevision||expectedSha256!==undefined&&digest(before)!==expectedSha256)throw Error('sales_source_revision_conflict');
      if(accountId!==undefined&&(!['accountId','ownerAccountId','ownerUid'].includes(ownerField)||typeof accountId!=='string'||!accountId||before[ownerField]!==accountId))throw Error('sales_source_owner_conflict');
      if(remove)tx.delete(ref);else tx.set(ref,next);
      return remove?{removed:true}:{updated:true};
    });
  }
  return Object.freeze({applyOperation:input=>mutate(input),deleteOwnedIfUnchanged:input=>{if(typeof input?.accountId!=='string')throw Error('sales_source_owner_required');return mutate({...input,remove:true});}});
}

export function createSalesOwnedFinancialReader({db,expectedProject='ailandgames',expectedDatabaseId,allowedCollections=['purchases','events','stripeOrders','stripeCheckout'],maxRecords=10000,pageSize=100}={}){
  if(expectedProject!=='ailandgames'||typeof expectedDatabaseId!=='string'||db?.projectId!==expectedProject||db?.databaseId!==expectedDatabaseId||typeof db?.collection!=='function'||!Array.isArray(allowedCollections)||!allowedCollections.length||new Set(allowedCollections).size!==allowedCollections.length||allowedCollections.some(name=>!['purchases','events','stripeOrders','stripeCheckout'].includes(name))||!Number.isInteger(maxRecords)||maxRecords<1||maxRecords>10000||!Number.isInteger(pageSize)||pageSize<1||pageSize>100)throw Error('sales_financial_reader_scope_required');
  const writer=createSalesCasWriter({db,expectedProject,expectedDatabaseId,allowedCollections});
  return Object.freeze({deleteOwnedIfUnchanged:writer.deleteOwnedIfUnchanged,
    async listOwned({collection,accountId}){
      if(!allowedCollections.includes(collection)||typeof accountId!=='string'||!accountId||accountId.length>128)throw Error('sales_financial_reader_scope_required');
      const records=[],ids=new Set();let cursor=null,scanned=0;
      try{
        for(;;){
          const remaining=maxRecords-scanned;
          let query=db.collection(collection).orderBy('__name__').limit(Math.min(pageSize,remaining+1));if(cursor)query=query.startAfter(cursor);
          const snapshot=await query.get();
          if(!Array.isArray(snapshot?.docs)||snapshot.docs.length>Math.min(pageSize,remaining+1)||snapshot.docs.length>remaining)throw Error('sales_financial_inventory_incomplete');
          for(const doc of snapshot.docs){
            if(typeof doc.id!=='string'||ids.has(doc.id))throw Error('sales_financial_inventory_incomplete');ids.add(doc.id);
            const data=doc.data();
            if(!data||typeof data.accountId!=='string'||!data.accountId||data.accountId.length>128)throw Error('sales_financial_owner_unknown');
            if(data.accountId===accountId)records.push({id:doc.id,data:copy(data),revision:salesSnapshotRevision(doc)});
          }
          scanned+=snapshot.docs.length;
          if(snapshot.docs.length<pageSize)break;
          cursor=snapshot.docs.at(-1);
        }
        return {complete:true,ownershipVerified:true,unattributedCount:0,records};
      }catch{return {complete:false,ownershipVerified:false,unattributedCount:1,records:[]};}
    },
  });
}
