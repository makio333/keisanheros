const validOwner=value=>typeof value==='string'&&value.length>0&&value.length<=128;
const recordLike=value=>!!value&&typeof value==='object'&&!Array.isArray(value);

// Root collections used by this product's code and its deletion adapters. New
// top-level collections must be classified before production deletion is ready.
const CLASSIFIED_ROOT_COLLECTIONS=new Set([
  'accounts','identities','sessions','attempts','saves','purchases','events',
  'stripeOrders','stripeCheckout','privateGame','privateMigration',
  'legacyAssignments','legacyTransfers','firebaseTransfers','legacyFacilityBindings',
  'emailRegistrations','emailDeliveries',
  'accountDeletionTombstones','accountDeletionAccountLocks','accountDeletionVisibility',
]);

async function auditCollection({db,name,pageSize,maxDocuments,ownerOf,matchesTarget}){
  let cursor=null,scanned=0,ownedCount=0,unattributedCount=0;
  try{
    for(;;){
      const remaining=maxDocuments-scanned;
      let query=db.collection(name).limit(Math.min(pageSize,remaining+1));
      if(cursor)query=query.startAfter(cursor);
      const snapshot=await query.get(),docs=Array.isArray(snapshot.docs)?snapshot.docs:[];
      if(!docs.length)break;
      if(docs.length>remaining)return {complete:false,ownershipVerified:false,count:ownedCount,unattributedCount,reason:'audit_document_cap_exceeded',scanned};
      for(const doc of docs){
        scanned++;
        const data=typeof doc?.data==='function'?doc.data():null;
        const owner=recordLike(data)?ownerOf(data,doc):null;
        if(!validOwner(owner)){unattributedCount++;continue;}
        if(matchesTarget(owner,data,doc))ownedCount++;
      }
      if(docs.length<pageSize)break;
      cursor=docs.at(-1);
    }
    return {complete:unattributedCount===0,ownershipVerified:unattributedCount===0,count:ownedCount,unattributedCount,scanned};
  }catch{
    return {complete:false,ownershipVerified:false,count:ownedCount,unattributedCount:Math.max(1,unattributedCount),reason:'audit_read_failed',scanned};
  }
}

// Read-only, bounded, whole-collection checks. They prove only that the scanned
// Firestore collections have explicit owners; they do not validate external systems.
export function createFirestoreAccountDeletionAudits({db,pageSize=200,maxDocuments=10000}={}){
  if(typeof db?.collection!=='function'||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>400||!Number.isSafeInteger(maxDocuments)||maxDocuments<1)throw Error('firestore_deletion_audits_not_configured');
  async function inspectRootCollectionInventory(){
    if(typeof db.listCollections!=='function')return {complete:false,scopeClassified:false,unclassifiedCount:1,reason:'root_collection_listing_unavailable'};
    try{
      const collections=await db.listCollections();
      if(!Array.isArray(collections)||collections.some(row=>typeof row?.id!=='string'||!row.id)||new Set(collections.map(row=>row.id)).size!==collections.length)
        return {complete:false,scopeClassified:false,unclassifiedCount:1,reason:'root_collection_listing_invalid'};
      const unclassifiedCount=collections.filter(row=>!CLASSIFIED_ROOT_COLLECTIONS.has(row.id)).length;
      return {complete:unclassifiedCount===0,scopeClassified:unclassifiedCount===0,unclassifiedCount,...(unclassifiedCount?{reason:'unclassified_root_collections'}:{})};
    }catch{return {complete:false,scopeClassified:false,unclassifiedCount:1,reason:'root_collection_listing_failed'};}
  }
  const oneAccount=(name,field)=>async({accountId}={})=>{
    if(!validOwner(accountId))return {complete:false,ownershipVerified:false,count:0,unattributedCount:1,reason:'invalid_scope'};
    return auditCollection({db,name,pageSize,maxDocuments,ownerOf:data=>data[field],matchesTarget:owner=>owner===accountId});
  };
  const multipleAccounts=(names)=>async({accountId}={})=>{
    if(!validOwner(accountId))return {complete:false,ownershipVerified:false,count:0,unattributedCount:1,reason:'invalid_scope'};
    const reports=[];
    for(const name of names)reports.push(await auditCollection({db,name,pageSize,maxDocuments,ownerOf:data=>data.accountId,matchesTarget:owner=>owner===accountId}));
    return {complete:reports.every(row=>row.complete),ownershipVerified:reports.every(row=>row.ownershipVerified),count:reports.reduce((sum,row)=>sum+row.count,0),unattributedCount:reports.reduce((sum,row)=>sum+row.unattributedCount,0),scanned:reports.reduce((sum,row)=>sum+(row.scanned||0),0),...(reports.some(row=>row.reason)?{reason:reports.find(row=>row.reason).reason}:{})};
  };
  return Object.freeze({
    inspectRootCollectionInventory,
    productSaves:oneAccount('saves','ownerAccountId'),
    purchaseRecords:multipleAccounts(['purchases','events']),
    stripeOrders:multipleAccounts(['stripeOrders','stripeCheckout']),
    async productGameDocuments({uid,accountId,uidHash}={}){
      if(!validOwner(uid)||!validOwner(accountId)||! /^[a-f0-9]{64}$/.test(uidHash||''))return {complete:false,ownershipVerified:false,count:0,unattributedCount:1,reason:'invalid_scope'};
      const accountCollections=['legacyAssignments','legacyTransfers','firebaseTransfers','legacyFacilityBindings'];
      const reports=[];
      for(const name of accountCollections)reports.push(await auditCollection({db,name,pageSize,maxDocuments,ownerOf:data=>data.accountId,matchesTarget:owner=>owner===accountId}));
      reports.push(await auditCollection({db,name:'emailRegistrations',pageSize,maxDocuments,ownerOf:(data,doc)=>data.kind==='email-registration'&&data.uidHash===doc.id?data.uidHash:null,matchesTarget:owner=>owner===uidHash}));
      reports.push(await auditCollection({db,name:'emailDeliveries',pageSize,maxDocuments,ownerOf:data=>data.kind==='email-delivery'&&/^[a-f0-9]{64}$/.test(data.ownerUidHash||'')?data.ownerUidHash:null,matchesTarget:owner=>owner===uidHash}));
      return {complete:reports.every(row=>row.complete),ownershipVerified:reports.every(row=>row.ownershipVerified),count:reports.reduce((sum,row)=>sum+row.count,0),unattributedCount:reports.reduce((sum,row)=>sum+row.unattributedCount,0),scanned:reports.reduce((sum,row)=>sum+(row.scanned||0),0),...(reports.some(row=>row.reason)?{reason:reports.find(row=>row.reason).reason}:{})};
    },
  });
}
