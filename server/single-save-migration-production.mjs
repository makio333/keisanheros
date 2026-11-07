import {createHash} from 'node:crypto';
import {legacySnapshot,issueLegacyTransfer} from './legacy-migration.mjs';

const fail=code=>{throw Error(code);};
const hash=value=>createHash('sha256').update(value).digest('hex');
const validProject=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{4,62}$/.test(value);
const validDocumentId=value=>typeof value==='string'&&value.length>0&&value.length<=1500&&!value.includes('/');
const protectedKeys=new Set([
  'account','accountid','owneraccountid','uid','userid','owneruid','accountuid','firebaseuid','authuid','authid',
  'auth','authtoken','accesstoken','refreshtoken','idtoken','credential','credentials','password','secret','privatekey',
  'purchase','purchases','purchaseid','purchaseinfo','contract','contracts','contractinfo','subscription','subscriptions','entitlement','entitlements','paid','facilityaccess','savelimit','billing','billingid','stripe','stripeid','email','phone','contact',
  'ranking','rankings','raid','raiddata','raidhistory','raidrecord','raidrecords','bossrankings','eventrankings','raidclaims','raidcoinrankclaims',
  'eventclaims','eventfinalclaims','eventfinalresults','admingifts','globalraid','globalraiddata','othersaves','children',
]);
const protectedPatterns=[/(?:auth|authentication|credential|password|secret|token|session|apikey|privatekey)/i,/^(?:firebase|owner|account|user).*(?:uid|id|key)$/,/purchase|contract|subscription|entitlement|billing|stripe|ranking|rankings|raiddata|raidhistory|raidrecord|bossrankings|eventrankings|raidclaims|raidcoinrankclaims|eventclaims|eventfinalclaims|eventfinalresults|admingifts/i];

function canonical(value){
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function sourceStateFromDocument(data){
  if(!data||typeof data!=='object'||Array.isArray(data))fail('invalid_legacy_save');
  if(data.deleted===true)fail('legacy_save_deleted');
  let gameState;
  try{gameState=typeof data.gameData==='string'?JSON.parse(data.gameData):data.gameData??data;}catch{fail('invalid_legacy_save');}
  if(!gameState||typeof gameState!=='object'||Array.isArray(gameState)||!gameState.player||typeof gameState.player!=='object'||Array.isArray(gameState.player))fail('invalid_legacy_save');
  return gameState;
}
function cleanProtectedFields(value){
  if(Array.isArray(value))return value.map(cleanProtectedFields);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value)
    .filter(([key])=>!protectedKeys.has(key.toLowerCase())&&!protectedPatterns.some(pattern=>pattern.test(key)))
    .map(([key,child])=>[key,cleanProtectedFields(child)]));
  return value;
}
function selectedPayload(value,sourceProject){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='documentId,gameState,sourceProject')fail('invalid_single_save_payload');
  if(value.sourceProject!==sourceProject)fail('migration_source_mismatch');
  if(!validDocumentId(value.documentId))fail('invalid_legacy_source');
  if(!value.gameState||typeof value.gameState!=='object'||Array.isArray(value.gameState)||!value.gameState.player||typeof value.gameState.player!=='object'||Array.isArray(value.gameState.player))fail('invalid_legacy_save');
  let encoded;try{encoded=canonical(value.gameState);}catch{fail('invalid_legacy_save');}
  if(Buffer.byteLength(encoded)>2*1024*1024)fail('save_too_large');
  return {sourceProject:value.sourceProject,documentId:value.documentId,gameState:structuredClone(value.gameState),sourceDigest:hash(encoded)};
}
function previewSummary(gameState){
  const countStages=value=>!value||typeof value!=='object'?0:Object.values(value).reduce((count,item)=>count+(Array.isArray(item)?item.filter(Boolean).length:item&&typeof item==='object'?countStages(item):0),0);
  return {playerName:String(gameState.playerName||gameState.player.name||'プレイヤー').slice(0,40),level:gameState.player.lvl??gameState.player.level??null,
    gold:gameState.player.gold??null,equipmentCount:Array.isArray(gameState.ownedEquips)?gameState.ownedEquips.length:0,clearedStages:countStages(gameState.stageClearCounts)};
}

/** Reads exactly one fixed-project legacy save document with an injected Admin Firestore client. */
export function createFirestoreLegacySourceReader({db,sourceProject}){
  if(!validProject(sourceProject)||typeof db?.collection!=='function')fail('legacy_source_reader_not_configured');
  return async({sourceProject:requested,documentId})=>{
    if(requested!==sourceProject)fail('migration_source_mismatch');
    if(!validDocumentId(documentId))fail('invalid_legacy_source');
    let snapshot;
    try{snapshot=await db.collection('saves').doc(documentId).get();}catch{fail('legacy_source_unavailable');}
    if(!snapshot?.exists)fail('legacy_save_not_found');
    return {documentId:snapshot.id,data:snapshot.data(),sourceUpdateTime:snapshot.updateTime?.toMillis?.()??null};
  };
}

/** Server-private allowlist for explicit operator-approved (recipient, source row, snapshot) tuples. */
export function createPinnedSingleSaveMigrationAuthorization({sourceProject,approvedSelections,now=Date.now}){
  if(!validProject(sourceProject)||!Array.isArray(approvedSelections)||typeof now!=='function')fail('migration_authorization_not_configured');
  const approvals=new Map();
  for(const item of approvedSelections){
    if(!item||typeof item!=='object'||typeof item.accountId!=='string'||!item.accountId||!validDocumentId(item.documentId)||! /^[a-f0-9]{64}$/.test(item.sourceDigest)||!Number.isFinite(item.expiresAt)||item.expiresAt<=0)fail('invalid_migration_approval');
    const key=JSON.stringify([item.accountId,item.documentId,item.sourceDigest]);
    if(approvals.has(key))fail('duplicate_migration_approval');
    approvals.set(key,item.expiresAt);
  }
  return async({accountId,sourceProject:requested,documentId,sourceDigest})=>{
    if(requested!==sourceProject||typeof accountId!=='string')return false;
    const expiresAt=approvals.get(JSON.stringify([accountId,documentId,sourceDigest]));
    return Number.isFinite(expiresAt)&&expiresAt>now();
  };
}

/**
 * Production-oriented one-save adapter. It uses the existing authenticated account-save service,
 * target-store transactions and one-use legacy claim. Both source ownership proof and an operator
 * authorization policy are mandatory; direct source reads/checksums do not replace either one.
 * This module is deliberately not mounted by product-api.mjs.
 */
export function createSingleSaveMigrationProductionService({store,accountSaves,sourceProject,readSourceSave,verifySourceOwnership,authorizeMigration,now=Date.now}){
  if(typeof store?.transaction!=='function'||typeof accountSaves?.summary!=='function'||typeof accountSaves?.claimLegacySave!=='function'||typeof accountSaves?.readSave!=='function')fail('single_save_migration_not_configured');
  if(!validProject(sourceProject)||typeof readSourceSave!=='function')fail('legacy_source_reader_not_configured');
  if(typeof verifySourceOwnership!=='function')fail('source_proof_not_configured');
  if(typeof authorizeMigration!=='function')fail('migration_authorization_not_configured');

  async function sourceFor(sessionId,input){
    const payload=selectedPayload(input,sourceProject);
    const summary=await accountSaves.summary(sessionId);
    if(summary.legacyMigrationEnabled!==true)fail('legacy_claim_not_available');
    if(await authorizeMigration({accountId:summary.accountId,sourceProject,documentId:payload.documentId,sourceDigest:payload.sourceDigest})!==true)fail('migration_not_authorized');
    const source=await readSourceSave({sourceProject,documentId:payload.documentId});
    if(!source||source.documentId!==payload.documentId)fail('legacy_save_not_found');
    const original=sourceStateFromDocument(source.data);
    const originalCanonical=canonical(original);
    if(hash(originalCanonical)!==payload.sourceDigest)fail('legacy_source_payload_mismatch');
    if(await verifySourceOwnership({accountId:summary.accountId,sourceProject,documentId:payload.documentId,sourceData:structuredClone(source.data),sourceUpdateTime:source.sourceUpdateTime,sourceDigest:payload.sourceDigest})!==true)fail('legacy_ownership_unverified');
    const safeState=cleanProtectedFields(original);
    if(!safeState||typeof safeState!=='object'||Array.isArray(safeState)||!safeState.player||typeof safeState.player!=='object'||Array.isArray(safeState.player))fail('invalid_legacy_save');
    const snapshot=legacySnapshot(sourceProject,payload.documentId,{gameData:JSON.stringify(safeState)});
    return {summary,source,payload,safeState,snapshot};
  }

  async function migrationState(accountId,snapshot){
    const assignmentKey=`legacyAssignments/${hash(snapshot.legacyKey)}`;
    return store.transaction(async tx=>{
      const [claim,save,assignment]=await Promise.all([tx.getLegacyClaim(snapshot.legacyKey),tx.getSave(snapshot.legacyKey),tx.getGameDocument(assignmentKey)]);
      const transfer=assignment?.transferId?await tx.getGameDocument(`legacyTransfers/${assignment.transferId}`):null;
      if(claim){
        if(claim.accountId!==accountId||save?.ownerAccountId!==accountId)return {state:'conflict',reason:'legacy_already_claimed'};
        if(!transfer||transfer.accountId!==accountId||transfer.snapshotHash!==snapshot.snapshotHash)return {state:'conflict',reason:'legacy_source_conflict'};
        return {state:'imported',save};
      }
      if(save)return {state:'conflict',reason:'legacy_save_id_collision'};
      if(assignment&&transfer){
        if(assignment.accountId!==accountId||transfer.accountId!==accountId)return {state:'conflict',reason:'legacy_transfer_pending_for_other_account'};
        if(transfer.snapshotHash!==snapshot.snapshotHash)return {state:'conflict',reason:'legacy_source_conflict'};
        if(transfer.status==='active')return {state:'pending'};
      }
      return {state:'new'};
    });
  }

  async function inspect({sessionId,payload}){
    const prepared=await sourceFor(sessionId,payload),state=await migrationState(prepared.summary.accountId,prepared.snapshot);
    const reason=state.state==='conflict'?state.reason:state.state==='imported'?'already_imported':state.state==='pending'?'transfer_pending':!prepared.summary.saveLimit?'purchase_required':!prepared.summary.canCreate?'save_limit_reached':null;
    return {prepared,state,reason,preview:previewSummary(prepared.safeState),destination:{used:prepared.summary.used,limit:prepared.summary.saveLimit,free:Math.max(0,prepared.summary.saveLimit-prepared.summary.used)}};
  }

  return Object.freeze({
    async preview({sessionId,payload}){
      const result=await inspect({sessionId,payload});
      return {sourceProject,child:result.preview,destination:result.destination,state:result.state.state,canCommit:result.state.state==='new'&&result.prepared.summary.canCreate===true,reason:result.reason};
    },
    async commit({sessionId,payload}){
      const result=await inspect({sessionId,payload}),{prepared,state}=result;
      if(state.state==='conflict')fail(state.reason);
      if(state.state==='imported'){
        const save=await accountSaves.readSave(sessionId,prepared.snapshot.legacyKey);
        return {alreadyImported:true,preview:result.preview,name:save.name,revision:save.revision};
      }
      if(!prepared.summary.saveLimit)fail('purchase_required');
      if(!prepared.summary.canCreate)fail('save_limit_reached');
      // The transfer code is created and consumed only on the server. The browser never receives it.
      const transfer=await issueLegacyTransfer({store,accountId:prepared.summary.accountId,snapshot:prepared.snapshot,now:now()});
      const save=await accountSaves.claimLegacySave(sessionId,{legacyKey:transfer.legacyKey,proof:transfer.code});
      return {alreadyImported:false,preview:result.preview,name:save.name,revision:save.revision};
    },
  });
}

const routePreview='/api/legacy/single-save/preview';
const routeCommit='/api/legacy/single-save/commit';
const BODY_LIMIT=2_200_000;
const errorStatus={authentication_required:401,account_not_found:401,legacy_claim_not_available:503,source_proof_not_configured:503,
  migration_authorization_not_configured:503,migration_not_authorized:403,legacy_ownership_unverified:403,migration_source_mismatch:400,
  invalid_single_save_payload:400,invalid_legacy_source:400,invalid_legacy_save:400,legacy_save_deleted:409,legacy_save_not_found:404,
  legacy_source_payload_mismatch:409,legacy_source_unavailable:503,source_reader_not_configured:503,save_too_large:413,
  purchase_required:403,save_limit_reached:409,legacy_already_claimed:409,legacy_save_id_collision:409,legacy_source_conflict:409,
  legacy_transfer_pending_for_other_account:409,transfer_pending:409,already_imported:409,invalid_confirmation:400};

/** HTTP adapter for an eventual explicit API mount. It trusts the existing HttpOnly account cookie, never client IDs/proofs. */
export function createSingleSaveMigrationProductionHandler({service,origin}){
  if(typeof service?.preview!=='function'||typeof service?.commit!=='function')fail('single_save_migration_not_configured');
  const site=new URL(origin);
  if(site.origin!==origin||(site.protocol!=='https:'&&!(site.protocol==='http:'&&['localhost','127.0.0.1'].includes(site.hostname))))fail('unsafe_single_save_origin');
  const cookieName=site.protocol==='https:'?'__Host-legend-session':'legend-local-session';
  const reply=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(value));};
  async function body(req){
    if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')fail('invalid_single_save_payload');
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>BODY_LIMIT)fail('save_too_large');chunks.push(chunk);}
    let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('invalid_single_save_payload');}
    if(!value||typeof value!=='object'||Array.isArray(value))fail('invalid_single_save_payload');
    return value;
  }
  return async(req,res)=>{
    const pathname=new URL(req.url,origin).pathname;
    if(pathname!==routePreview&&pathname!==routeCommit)return false;
    if(req.method!=='POST'){reply(res,405,{error:'method_not_allowed'});return true;}
    if(req.headers.origin!==origin){reply(res,403,{error:'invalid_origin'});return true;}
    const cookies=String(req.headers.cookie||'').split(';').map(value=>value.trim()).filter(value=>value.startsWith(cookieName+'='));
    const sessionId=cookies.length===1?cookies[0].slice(cookieName.length+1):'';
    try{
      const input=await body(req),isPreview=pathname===routePreview;
      let payload;
      if(isPreview){if(Object.keys(input).sort().join(',')!=='documentId,gameState,sourceProject')fail('invalid_single_save_payload');payload=input;}
      else{
        if(Object.keys(input).sort().join(',')!=='confirm,documentId,gameState,sourceProject'||input.confirm!==true)fail('invalid_confirmation');
        const {confirm,...selected}=input;payload=selected;
      }
      const result=isPreview?await service.preview({sessionId,payload}):await service.commit({sessionId,payload});
      reply(res,200,result);
    }catch(error){const code=Object.hasOwn(errorStatus,error?.message)?error.message:'single_save_migration_unavailable';reply(res,errorStatus[code]||503,{error:code});}
    return true;
  };
}

export const singleSaveMigrationProductionRoutes=Object.freeze({preview:routePreview,commit:routeCommit});
