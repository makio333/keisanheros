import {randomUUID} from 'node:crypto';

const fail=code=>{throw Error(code);};
const copy=value=>structuredClone(value);
const validId=value=>typeof value==='string' && value.length>0 && value.length<=256;
export const DEFAULT_ACCOUNT_PRODUCTS=Object.freeze({
  personal:Object.freeze({kind:'personal',saveLimit:3}),
  organization10:Object.freeze({kind:'organization',saveLimit:10}),
  organization20:Object.freeze({kind:'organization',saveLimit:20}),
  organization30:Object.freeze({kind:'organization',saveLimit:30}),
});

// No grant endpoint: receipt verification and the product catalog belong to the server.
export function createAccountSaveService({store,sessions,verifyReceipt,verifyLegacyClaim,products=DEFAULT_ACCOUNT_PRODUCTS,now=Date.now}) {
  if(typeof store?.transaction!=='function' || typeof sessions?.get!=='function')fail('account_store_not_configured');
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
  function account(tx,id){const value=tx.getAccount(id);if(!value)fail('account_not_found');return value;}
  function capacity(tx,id){
    return tx.listPurchases(id).reduce((limit,purchase)=>Math.max(limit,purchase.active===true?(catalog.get(purchase.productId)?.saveLimit||0):0),0);
  }
  function owned(tx,id,key){
    const save=tx.getSave(key);
    if(!save || save.ownerAccountId!==id)fail('save_not_found');
    return save;
  }
  function hasRoom(tx,id){
    const limit=capacity(tx,id);
    if(!limit)fail('purchase_required');
    if(tx.listSaves(id).length>=limit)fail('save_limit_reached');
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
      return store.transaction(tx=>{account(tx,id);const used=tx.listSaves(id).length,limit=capacity(tx,id);return {accountId:id,saveLimit:limit,used,canCreate:used<limit};});
    },
    async listSaves(sessionId){
      const id=await accountIdFor(sessionId);
      return store.transaction(tx=>{account(tx,id);return tx.listSaves(id).map(save=>({key:save.key,name:save.name,revision:save.revision,updatedAt:save.updatedAt}));});
    },
    async createSave(sessionId,{name,gameState}){
      const id=await accountIdFor(sessionId),snapshot=state(gameState);
      if(typeof name!=='string' || !name.trim() || name.trim().length>40)fail('invalid_save_name');
      return store.transaction(tx=>{
        account(tx,id);hasRoom(tx,id);
        const save={key:`typing_rpg_save_v3::${randomUUID()}`,ownerAccountId:id,name:name.trim(),gameState:snapshot,revision:1,createdAt:now(),updatedAt:now()};
        tx.putSave(save);return copy(save);
      });
    },
    async readSave(sessionId,key){
      const id=await accountIdFor(sessionId);
      return store.transaction(tx=>{account(tx,id);return copy(owned(tx,id,key));});
    },
    async updateSave(sessionId,{key,revision,gameState}){
      const id=await accountIdFor(sessionId),snapshot=state(gameState);
      return store.transaction(tx=>{
        account(tx,id);const previous=owned(tx,id,key);
        if(!capacity(tx,id))fail('purchase_required');
        if(!Number.isSafeInteger(revision) || revision!==previous.revision)fail('save_revision_conflict');
        const next={...previous,gameState:snapshot,revision:previous.revision+1,updatedAt:now()};
        tx.putSave(next);return copy(next);
      });
    },
    async applyPurchaseEvidence(evidence){
      if(typeof verifyReceipt!=='function')fail('purchase_verifier_not_configured');
      const receipt=await verifyReceipt(evidence);
      if(!receipt || !validId(receipt.eventId) || !validId(receipt.purchaseId) || !validId(receipt.accountId) || !catalog.has(receipt.productId))fail('unverified_purchase');
      return store.transaction(tx=>{
        account(tx,receipt.accountId);
        const event=tx.getPurchaseEvent(receipt.eventId),existing=tx.getPurchase(receipt.purchaseId);
        for(const previous of [event,existing])if(previous && (previous.accountId!==receipt.accountId || previous.productId!==receipt.productId || previous.purchaseId!==receipt.purchaseId))fail('purchase_identity_conflict');
        if(!existing)tx.putPurchase({purchaseId:receipt.purchaseId,accountId:receipt.accountId,productId:receipt.productId,active:true,verifiedAt:now()});
        if(!event)tx.putPurchaseEvent({...receipt,verifiedAt:now()});
        return {accountId:receipt.accountId,saveLimit:capacity(tx,receipt.accountId),alreadyApplied:!!existing};
      });
    },
    async claimLegacySave(sessionId,{legacyKey,proof}){
      const id=await accountIdFor(sessionId);
      if(!validId(legacyKey) || typeof verifyLegacyClaim!=='function')fail('legacy_claim_not_available');
      // The verifier must retrieve the existing snapshot itself, not trust client-supplied game data.
      const verified=await verifyLegacyClaim({accountId:id,legacyKey,proof});
      if(!verified || verified.accountId!==id || verified.legacyKey!==legacyKey)fail('legacy_ownership_unverified');
      const snapshot=state(verified.gameState);
      return store.transaction(tx=>{
        account(tx,id);
        const claim=tx.getLegacyClaim(legacyKey);
        if(claim){if(claim.accountId!==id)fail('legacy_already_claimed');return copy(owned(tx,id,claim.saveKey));}
        const prior=tx.getSave(legacyKey);
        if(prior && prior.ownerAccountId!==id)fail('legacy_already_claimed');
        if(prior){tx.putLegacyClaim({legacyKey,saveKey:legacyKey,accountId:id,claimedAt:now()});return copy(prior);}
        hasRoom(tx,id);
        const save={key:legacyKey,ownerAccountId:id,name:String(verified.name||snapshot.playerName||'プレイヤー').slice(0,40),gameState:snapshot,revision:1,createdAt:now(),updatedAt:now()};
        tx.putSave(save);tx.putLegacyClaim({legacyKey,saveKey:legacyKey,accountId:id,claimedAt:now()});
        return copy(save);
      });
    },
  };
}
