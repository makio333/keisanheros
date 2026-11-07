import {randomUUID} from 'node:crypto';
import {DEFAULT_ACCOUNT_PRODUCTS,accountSaveLimit,facilitySaveLimit,paidSaveLimit} from './account-access.mjs';
export {DEFAULT_ACCOUNT_PRODUCTS} from './account-access.mjs';

const fail=code=>{throw Error(code);};
const copy=value=>structuredClone(value);
const validId=value=>typeof value==='string' && value.length>0 && value.length<=256;
const ADULT_MANAGER_ACKNOWLEDGEMENT_VERSION='adult-manager-v1';

// No grant endpoint: receipt verification and the product catalog belong to the server.
export function createAccountSaveService({store,sessions,verifyReceipt,verifyLegacyClaim,fileMigrationAccountId,trialsEnabled=false,complimentarySaveLimit=0,complimentaryAccountCutoff=null,products=DEFAULT_ACCOUNT_PRODUCTS,now=Date.now}) {
  if(typeof store?.transaction!=='function' || typeof sessions?.get!=='function')fail('account_store_not_configured');
  if(!Number.isSafeInteger(complimentarySaveLimit)||complimentarySaveLimit<0||complimentarySaveLimit>1000)fail('invalid_complimentary_save_limit');
  if(complimentarySaveLimit>0&&!Number.isSafeInteger(complimentaryAccountCutoff)||complimentaryAccountCutoff!==null&&(!Number.isSafeInteger(complimentaryAccountCutoff)||complimentaryAccountCutoff<0))fail('invalid_complimentary_account_cutoff');
  const catalog=new Map(Object.entries(products).map(([id,product])=>{
    if(!validId(id) || !['personal','organization'].includes(product.kind) || !Number.isSafeInteger(product.saveLimit) || product.saveLimit<1 || product.saveLimit>1000 || product.kind==='personal' && product.saveLimit!==3)fail('invalid_product_catalog');
    return [id,Object.freeze({...product})];
  }));
  async function accountIdFor(sessionId){
    if(!validId(sessionId))fail('authentication_required');
    const session=await sessions.get(sessionId,now());
    if(!validId(session?.accountId) || !Number.isFinite(session.expiresAt) || session.expiresAt<=now())fail('authentication_required');
    return session.accountId;
  }
  async function account(tx,id){const value=await tx.getAccount(id);if(!value)fail('account_not_found');return value;}
  function hasComplimentaryAccess(owner){return complimentarySaveLimit>0&&Number.isFinite(owner?.createdAt)&&owner.createdAt<=complimentaryAccountCutoff;}
  async function capacity(tx,id){
    const owner=await account(tx,id);
    return Math.max(await accountSaveLimit(tx,owner,catalog,now()),hasComplimentaryAccess(owner)?complimentarySaveLimit:0);
  }
  async function owned(tx,id,key){
    const save=await tx.getSave(key);
    if(!save || save.ownerAccountId!==id)fail('save_not_found');
    return save;
  }
  async function hasRoom(tx,id){
    const limit=await capacity(tx,id);
    if(!limit)fail('purchase_required');
    if((await tx.listSaves(id)).length>=limit)fail('save_limit_reached');
  }
  function state(value){
    if(!value || typeof value!=='object' || Array.isArray(value))fail('invalid_save');
    let encoded;try{encoded=JSON.stringify(value);}catch{fail('invalid_save');}
    if(!encoded || Buffer.byteLength(encoded)>2*1024*1024)fail('invalid_save');
    return JSON.parse(encoded);
  }
  return {
    async summary(sessionId){
      const id=await accountIdFor(sessionId);
      return store.transaction(async tx=>{
        const owner=await account(tx,id),used=(await tx.listSaves(id)).length,limit=await capacity(tx,id),paid=await paidSaveLimit(tx,owner,catalog),facility=facilitySaveLimit(owner)>0;
        const complimentary=hasComplimentaryAccess(owner);
        return {accountId:id,saveLimit:limit,paidSaveLimit:paid,complimentarySaveLimit:complimentary?complimentarySaveLimit:0,used,canCreate:used<limit,facilityAccess:facility,complimentaryAccess:complimentary,adultManagerAcknowledged:owner.adultManagerAcknowledgement?.version===ADULT_MANAGER_ACKNOWLEDGEMENT_VERSION,legacyMigrationEnabled:typeof verifyLegacyClaim==='function',legacyFileMigrationEnabled:id===fileMigrationAccountId,
          trial:{available:trialsEnabled&&!complimentary&&!owner.trial&&!paid&&!facility,active:!complimentary&&!paid&&!facility&&limit===3,expiresAt:owner.trial?.expiresAt??null,startedAt:owner.trial?.startedAt??null},serverNow:now()};
      });
    },
    async acknowledgeAdultManager(sessionId,{acknowledged}={}){
      const id=await accountIdFor(sessionId);
      if(acknowledged!==true)fail('adult_manager_acknowledgement_required');
      return store.transaction(async tx=>{
        const owner=await account(tx,id);
        if(owner.adultManagerAcknowledgement?.version!==ADULT_MANAGER_ACKNOWLEDGEMENT_VERSION){
          tx.putAccount({...owner,adultManagerAcknowledgement:{version:ADULT_MANAGER_ACKNOWLEDGEMENT_VERSION,acceptedAt:now()}});
        }
        return {acknowledged:true,version:ADULT_MANAGER_ACKNOWLEDGEMENT_VERSION};
      });
    },
    async startTrial(sessionId){
      const id=await accountIdFor(sessionId);
      if(!trialsEnabled)fail('trial_unavailable');
      await store.transaction(async tx=>{
        const owner=await account(tx,id);
        if(owner.trial||await paidSaveLimit(tx,owner,catalog)||facilitySaveLimit(owner))return;
        const startedAt=now();tx.putAccount({...owner,trial:{startedAt,expiresAt:startedAt+7*86400000}});
      });
      return this.summary(sessionId);
    },
    async listSaves(sessionId){
      const id=await accountIdFor(sessionId);
      return store.transaction(async tx=>{await account(tx,id);return (await tx.listSaves(id)).map(save=>({key:save.key,name:save.name,revision:save.revision,updatedAt:save.updatedAt}));});
    },
    async createSave(sessionId,{name,gameState}){
      const id=await accountIdFor(sessionId),snapshot=state(gameState);
      if(typeof name!=='string' || !name.trim() || name.trim().length>40)fail('invalid_save_name');
      return store.transaction(async tx=>{
        await account(tx,id);await hasRoom(tx,id);
        const save={key:`typing_rpg_save_v3::${randomUUID()}`,ownerAccountId:id,name:name.trim(),gameState:snapshot,revision:1,createdAt:now(),updatedAt:now()};
        tx.putSave(save);return copy(save);
      });
    },
    async readSave(sessionId,key){
      const id=await accountIdFor(sessionId);
      return store.transaction(async tx=>{await account(tx,id);return copy(await owned(tx,id,key));});
    },
    async updateSave(sessionId,{key,revision,gameState}){
      const id=await accountIdFor(sessionId),snapshot=state(gameState);
      return store.transaction(async tx=>{
        await account(tx,id);const previous=await owned(tx,id,key);
        if(!await capacity(tx,id))fail('purchase_required');
        if(!Number.isSafeInteger(revision) || revision!==previous.revision)fail('save_revision_conflict');
        const next={...previous,gameState:snapshot,revision:previous.revision+1,updatedAt:now()};
        tx.putSave(next);return copy(next);
      });
    },
    async deleteSave(sessionId,key){
      const id=await accountIdFor(sessionId);
      return store.transaction(async tx=>{
        await account(tx,id);
        await owned(tx,id,key);
        if(typeof tx.removeSave!=='function')fail('save_deletion_unavailable');
        tx.removeSave(key);
        const owner=await account(tx,id),used=(await tx.listSaves(id)).length;
        const complimentary=hasComplimentaryAccess(owner);
        return {deleted:true,used,saveLimit:await capacity(tx,id),paidSaveLimit:await paidSaveLimit(tx,owner,catalog),complimentarySaveLimit:complimentary?complimentarySaveLimit:0,facilityAccess:facilitySaveLimit(owner)>0,complimentaryAccess:complimentary};
      });
    },
    async applyPurchaseEvidence(evidence){
      if(typeof verifyReceipt!=='function')fail('purchase_verifier_not_configured');
      const receipt=await verifyReceipt(evidence);
      if(!receipt || !validId(receipt.eventId) || !validId(receipt.purchaseId) || !validId(receipt.accountId) || !catalog.has(receipt.productId))fail('unverified_purchase');
      return store.transaction(async tx=>{
        await account(tx,receipt.accountId);
        const event=await tx.getPurchaseEvent(receipt.eventId),existing=await tx.getPurchase(receipt.purchaseId);
        for(const previous of [event,existing])if(previous && (previous.accountId!==receipt.accountId || previous.productId!==receipt.productId || previous.purchaseId!==receipt.purchaseId))fail('purchase_identity_conflict');
        if(!existing)tx.putPurchase({purchaseId:receipt.purchaseId,accountId:receipt.accountId,productId:receipt.productId,active:true,verifiedAt:now()});
        if(!event)tx.putPurchaseEvent({...receipt,verifiedAt:now()});
        return {accountId:receipt.accountId,saveLimit:await capacity(tx,receipt.accountId),alreadyApplied:!!existing};
      });
    },
    async claimLegacySave(sessionId,{legacyKey,proof}){
      const id=await accountIdFor(sessionId);
      if(legacyKey!==undefined && !validId(legacyKey) || typeof verifyLegacyClaim!=='function')fail('legacy_claim_not_available');
      return store.transaction(async tx=>{
        // Resolve the server-owned snapshot and check revocation in the same transaction as the claim.
        const verified=await verifyLegacyClaim({accountId:id,legacyKey,proof,tx});
        if(!verified || verified.accountId!==id || !validId(verified.legacyKey) || legacyKey!==undefined && verified.legacyKey!==legacyKey)fail('legacy_ownership_unverified');
        const key=verified.legacyKey,snapshot=state(verified.gameState);
        await account(tx,id);
        const claim=await tx.getLegacyClaim(key);
        if(claim){if(claim.accountId!==id)fail('legacy_already_claimed');return copy(await owned(tx,id,claim.saveKey));}
        const prior=await tx.getSave(key);
        if(prior && prior.ownerAccountId!==id)fail('legacy_already_claimed');
        if(prior){tx.putLegacyClaim({legacyKey:key,saveKey:key,accountId:id,claimedAt:now()});return copy(prior);}
        await hasRoom(tx,id);
        const save={key,ownerAccountId:id,name:String(verified.name||snapshot.playerName||'プレイヤー').slice(0,40),gameState:snapshot,revision:1,createdAt:now(),updatedAt:now()};
        tx.putSave(save);tx.putLegacyClaim({legacyKey:key,saveKey:key,accountId:id,claimedAt:now()});
        return copy(save);
      });
    },
  };
}
