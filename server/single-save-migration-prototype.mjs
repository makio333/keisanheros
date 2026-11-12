import {createHash} from 'node:crypto';
import {createAccountSaveService} from './account-saves.mjs';
import {legacySnapshot,issueLegacyTransfer,createLegacyClaimVerifier} from './legacy-migration.mjs';
import {parseLegacySaveFile} from '../legacy_save_file.js';
import {parseLegacyTransferFile} from '../legacy_transfer_file.js';

const fail=code=>{throw Error(code);};
const hash=value=>createHash('sha256').update(value).digest('hex');
const excludedStateKeys=new Set([
  'account','accountid','owneraccountid','uid','userid','auth','authtoken','accesstoken','refreshtoken',
  'owneruid','accountuid','firebaseuid','authuid','authid','idtoken','credential','credentials','password','secret','privatekey',
  'purchase','purchases','purchaseid','purchaseinfo','contract','contracts','contractinfo','subscription','subscriptions','entitlement','entitlements','paid','facilityaccess','savelimit','billing','billingid','stripe','stripeid','email','phone','contact',
  'ranking','rankings','raid','raiddata','raidhistory','raidrecord','raidrecords','bossrankings','eventrankings','raidclaims','raidcoinrankclaims',
  'eventclaims','eventfinalclaims','eventfinalresults','admingifts','globalraid','globalraiddata','othersaves','children',
]);
const protectedStateKeyPatterns=[/(?:auth|authentication|credential|password|secret|token|session|apikey|privatekey)/i,/^(?:firebase|owner|account|user).*(?:uid|id|key)$/,/purchase|contract|subscription|entitlement|billing|stripe|ranking|rankings|raiddata|raidhistory|raidrecord|bossrankings|eventrankings|raidclaims|raidcoinrankclaims|eventclaims|eventfinalclaims|eventfinalresults|admingifts/i];

/** Parse a local export, then construct a payload containing only the chosen save row. */
export function selectSingleLegacySave(file,documentId){
  const parsed=file?.format==='legend-heroes-full-transfer'?parseLegacyTransferFile(file):parseLegacySaveFile(file);
  if(typeof documentId!=='string'||!documentId)fail('legacy_save_not_selected');
  const row=parsed.saves.find(candidate=>candidate.documentId===documentId);
  if(!row)fail('legacy_save_not_found');
  return {sourceProject:parsed.sourceProject,documentId:row.documentId,gameState:structuredClone(row.gameState)};
}

function cleanProtectedFields(value){
  if(Array.isArray(value))return value.map(cleanProtectedFields);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value)
    .filter(([key])=>!excludedStateKeys.has(key.toLowerCase())&&!protectedStateKeyPatterns.some(pattern=>pattern.test(key)))
    .map(([key,child])=>[key,cleanProtectedFields(child)]));
  return value;
}

function cleanGameState(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||!value.player||typeof value.player!=='object'||Array.isArray(value.player))fail('invalid_legacy_save');
  return cleanProtectedFields(value);
}

function assertSinglePayload(payload,sourceProject,{allowAnyValidSource=false}={}){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))fail('invalid_single_save_payload');
  const keys=Object.keys(payload).sort();
  if(keys.join(',')!=='documentId,gameState,sourceProject')fail('invalid_single_save_payload');
  if(allowAnyValidSource?!/^[a-z][a-z0-9-]{4,62}$/.test(payload.sourceProject):payload.sourceProject!==sourceProject)fail('migration_source_mismatch');
  if(typeof payload.documentId!=='string'||!payload.documentId||payload.documentId.length>1000||payload.documentId.includes('/'))fail('invalid_legacy_source');
}

function safePreview(gameState){
  const countStages=value=>{
    if(!value||typeof value!=='object')return 0;
    return Object.values(value).reduce((sum,child)=>sum+(Array.isArray(child)?child.filter(Boolean).length:child&&typeof child==='object'?countStages(child):0),0);
  };
  return {
    playerName:String(gameState.playerName||gameState.player.name||'プレイヤー').slice(0,40),
    level:gameState.player.lvl??gameState.player.level??null,
    gold:gameState.player.gold??null,
    equipmentCount:Array.isArray(gameState.ownedEquips)?gameState.ownedEquips.length:0,
    clearedStages:countStages(gameState.stageClearCounts),
  };
}

/**
 * Synthetic isolated adapter for exercising the one-save flow against the existing claim path.
 * It is deliberately not mounted as an HTTP route. Production callers must supply real server-side
 * authorization and source-proof verifiers; tests use fixtures only.
 */
export function createSingleSaveMigrationPrototype({store,sessions,sourceProject,authorizeMigration,verifySelectedSource,now=Date.now,afterTransferIssued,afterClaim,allowAnySourcePreview=false}){
  if(!store||typeof store.transaction!=='function'||typeof sessions?.get!=='function')fail('single_save_migration_not_configured');
  if(typeof sourceProject!=='string'||!(/^[a-z][a-z0-9-]{4,62}$/).test(sourceProject))fail('invalid_legacy_source');
  if(typeof authorizeMigration!=='function'||typeof verifySelectedSource!=='function')fail('single_save_migration_not_configured');
  const saves=createAccountSaveService({store,sessions,verifyLegacyClaim:createLegacyClaimVerifier({now}),now});

  async function authenticatedSession(sessionId){
    const session=await sessions.get(sessionId,now());
    if(!session||!Number.isFinite(session.expiresAt)||session.expiresAt<=now()||typeof session.accountId!=='string'||!session.accountId)fail('authentication_required');
    return session;
  }

  async function readMigrationState(accountId,snapshot){
    const assignmentKey=`legacyAssignments/${hash(snapshot.legacyKey)}`;
    return store.transaction(async tx=>{
      const [claim,save,assignment]=await Promise.all([
        tx.getLegacyClaim(snapshot.legacyKey),tx.getSave(snapshot.legacyKey),tx.getGameDocument(assignmentKey),
      ]);
      const transfer=assignment?.transferId?await tx.getGameDocument(`legacyTransfers/${assignment.transferId}`):null;
      if(claim){
        if(claim.accountId!==accountId||save?.ownerAccountId!==accountId)return {state:'conflict',reason:'legacy_already_claimed'};
        if(!transfer||transfer.accountId!==accountId||transfer.snapshotHash!==snapshot.snapshotHash)return {state:'conflict',reason:'legacy_source_conflict'};
        return {state:'imported'};
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

  async function preparedInput({sessionId,payload}){
    const session=await authenticatedSession(sessionId);
    assertSinglePayload(payload,sourceProject);
    if(await authorizeMigration({accountId:session.accountId,sourceProject,documentId:payload.documentId})!==true)fail('migration_not_authorized');
    if(await verifySelectedSource({sourceProject,payload:{documentId:payload.documentId,gameState:structuredClone(payload.gameState)}})!==true)fail('legacy_ownership_unverified');
    const gameState=cleanGameState(payload.gameState);
    const snapshot=legacySnapshot(sourceProject,payload.documentId,{gameData:JSON.stringify(gameState)});
    return {session,gameState,snapshot};
  }

  return {
    async destinationStatus({sessionId}){
      const session=await authenticatedSession(sessionId),summary=await saves.summary(sessionId);
      return {accountId:session.accountId,used:summary.used,limit:summary.saveLimit,free:Math.max(0,summary.saveLimit-summary.used),canCreate:summary.canCreate};
    },
    /** Read-only preview; never creates a transfer, claim, or save. */
    async preview({sessionId,payload}){
      const session=await authenticatedSession(sessionId);
      assertSinglePayload(payload,sourceProject,{allowAnyValidSource:allowAnySourcePreview});
      const gameState=cleanGameState(payload.gameState),snapshot=legacySnapshot(payload.sourceProject,payload.documentId,{gameData:JSON.stringify(gameState)});
      const [summary,migration]=await Promise.all([saves.summary(sessionId),readMigrationState(session.accountId,snapshot)]);
      const reason=migration.state==='conflict'?migration.reason:migration.state==='imported'?'already_imported':migration.state==='pending'?'transfer_pending':!summary.saveLimit?'purchase_required':!summary.canCreate?'save_limit_reached':null;
      return {sourceProject:payload.sourceProject,preview:safePreview(gameState),destination:{used:summary.used,limit:summary.saveLimit,free:Math.max(0,summary.saveLimit-summary.used)},
        state:migration.state,canCommit:migration.state==='new'&&summary.canCreate,reason};
    },
    /** Validate the session, operator authorization, and source proof before issuing a one-use claim. */
    async prepare({sessionId,payload}){
      const {session,gameState,snapshot}=await preparedInput({sessionId,payload});
      const prior=await readMigrationState(session.accountId,snapshot);
      if(prior.state==='conflict')fail(prior.reason);
      if(prior.state==='imported')return {name:snapshot.name,legacyKey:snapshot.legacyKey,alreadyImported:true,preview:safePreview(gameState)};
      const summary=await saves.summary(sessionId);
      if(!summary.canCreate)fail(summary.saveLimit?'save_limit_reached':'purchase_required');
      const transfer=await issueLegacyTransfer({store,accountId:session.accountId,snapshot,now:now()});
      if(afterTransferIssued)await afterTransferIssued({accountId:session.accountId,legacyKey:transfer.legacyKey,proof:transfer.code});
      return {name:transfer.name,legacyKey:transfer.legacyKey,proof:transfer.code,expiresAt:transfer.expiresAt,preview:safePreview(gameState)};
    },
    /** Claim still goes through the ordinary session, ownership, capacity and transaction checks. */
    claim(sessionId,{legacyKey,proof}){return saves.claimLegacySave(sessionId,{legacyKey,proof});},
    /** One-click synthetic workflow; the proof stays server-side and only the selected row is claimed. */
    async commit({sessionId,payload}){
      const prepared=await this.prepare({sessionId,payload});
      if(prepared.alreadyImported){
        const save=await saves.readSave(sessionId,prepared.legacyKey);
        return {legacyKey:prepared.legacyKey,alreadyImported:true,preview:prepared.preview,name:save.name,revision:save.revision};
      }
      const save=await saves.claimLegacySave(sessionId,{legacyKey:prepared.legacyKey,proof:prepared.proof});
      if(afterClaim)await afterClaim({accountId:save.ownerAccountId,legacyKey:save.key});
      return {legacyKey:save.key,alreadyImported:false,preview:prepared.preview,name:save.name,revision:save.revision};
    },
  };
}
