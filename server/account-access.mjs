export const DEFAULT_ACCOUNT_PRODUCTS=Object.freeze({
  personal:Object.freeze({kind:'personal',saveLimit:3}),
  organization10:Object.freeze({kind:'organization',saveLimit:10}),
  organization20:Object.freeze({kind:'organization',saveLimit:20}),
  organization30:Object.freeze({kind:'organization',saveLimit:30}),
});
export function facilitySaveLimit(account){
  const grant=account?.facilityAccess;
  return grant?.kind==='legacy-migration'&&grant.active===true&&Number.isSafeInteger(grant.saveLimit)&&grant.saveLimit>0&&grant.saveLimit<=1000?grant.saveLimit:0;
}
export async function paidSaveLimit(tx,account,products=DEFAULT_ACCOUNT_PRODUCTS){
  const product=id=>products instanceof Map?products.get(id):products[id];
  return (await tx.listPurchases(account.id)).reduce((limit,row)=>Math.max(limit,row.active===true?(product(row.productId)?.saveLimit||0):0),0);
}
export function activeTrialLimit(account,now=Date.now()){
  const trial=account?.trial;
  return trial&&Number.isFinite(trial.startedAt)&&Number.isFinite(trial.expiresAt)&&trial.expiresAt===trial.startedAt+7*86400000&&trial.startedAt<=now&&trial.expiresAt>now?3:0;
}
export async function accountSaveLimit(tx,account,products=DEFAULT_ACCOUNT_PRODUCTS,now=Date.now()){
  return Math.max(await paidSaveLimit(tx,account,products),facilitySaveLimit(account),activeTrialLimit(account,now));
}
