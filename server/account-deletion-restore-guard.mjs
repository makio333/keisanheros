const recordLike=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const validKey=value=>typeof value==='string'&&value.length>0&&value.length<=1500;
const blockedStates=new Set(['retention_pending','purging','complete']);

function ownerReferences(record){
  const owners=[];
  const accountIds=[record.ownerAccountId,record.accountId,...(record.collection==='accounts'?[record.id]:[])].filter(value=>value!==undefined&&value!==null);
  if(accountIds.some(value=>!validKey(value))||new Set(accountIds).size>1)throw Error('restore_owner_scope_conflict');
  for(const [kind,value] of [['uid',record.ownerUid],['accountId',record.ownerAccountId],['accountId',record.accountId]]){
    if(value===undefined||value===null)continue;
    if(!validKey(value))throw Error('restore_owner_scope_invalid');
    owners.push({[kind]:value});
  }
  if(record.collection==='accounts'&&validKey(record.id))owners.push({accountId:record.id});
  const unique=new Map(owners.map(owner=>[JSON.stringify(owner),owner]));
  const result=[...unique.values()];
  if(!result.length)throw Error('restore_owner_scope_unknown');
  return result;
}

async function deletionState(authority,owner){
  let marker;
  try{marker=await authority.lookup(owner);}catch{throw Error('restore_visibility_status_unavailable');}
  if(marker===null)return 'clear';
  if(!recordLike(marker)||!blockedStates.has(marker.state))throw Error('restore_visibility_status_unavailable');
  return marker.state;
}

// This guard runs before a restore is promoted from isolated staging. Its marker
// authority must be independent of the backup being restored (for example, a
// separately protected deletion ledger). It deliberately knows no provider backup
// format and performs no Firebase initialization or live writes.
export async function createAccountDeletionRestorePlan({records,visibilityAuthority}={}){
  if(!Array.isArray(records)||!recordLike(visibilityAuthority)||typeof visibilityAuthority.lookup!=='function')throw Error('restore_guard_not_configured');
  const usable=[],quarantined=[];
  for(const record of records){
    if(!recordLike(record)||typeof record.collection!=='string'||!validKey(record.collection)||!validKey(record.id))throw Error('restore_record_invalid');
    const owners=ownerReferences(record);
    if(record.ownerUid&&owners.some(owner=>owner.accountId)){
      let verified=false;
      try{verified=await visibilityAuthority.verifyOwnerPair?.({uid:record.ownerUid,accountId:owners.find(owner=>owner.accountId)?.accountId})===true;}catch{verified=false;}
      if(!verified)throw Error('restore_owner_pair_unverified');
    }
    const states=await Promise.all(owners.map(owner=>deletionState(visibilityAuthority,owner)));
    const isBlocked=states.some(state=>blockedStates.has(state));
    (isBlocked?quarantined:usable).push(record);
  }
  return Object.freeze({
    usableRecords:Object.freeze(usable),
    quarantinedRecords:Object.freeze(quarantined),
    counts:Object.freeze({scanned:records.length,usable:usable.length,quarantined:quarantined.length}),
  });
}

// All ownership and marker reads complete before the first writer call. Writers must
// target isolated staging and a restricted quarantine area; promotion is intentionally
// outside this module and outside the scope of the local synthetic tests.
export async function stageAccountDeletionGuardedRestore({records,visibilityAuthority,writeToIsolatedStaging,writeToRestrictedQuarantine}={}){
  if(typeof writeToIsolatedStaging!=='function'||typeof writeToRestrictedQuarantine!=='function')throw Error('restore_stage_writers_not_configured');
  const plan=await createAccountDeletionRestorePlan({records,visibilityAuthority});
  try{
    for(const record of plan.quarantinedRecords)await writeToRestrictedQuarantine(record);
    for(const record of plan.usableRecords)await writeToIsolatedStaging(record);
  }catch{throw Error('restore_stage_write_failed');}
  return plan.counts;
}
