const ORIGIN='https://legend-heroes2.web.app';
export function validateSalesEmailCutover({enabled=false,projectId='ailandgames',origin=ORIGIN,policyStartAt,previousPolicyStartAt}={}){
  if(enabled!==true)return Object.freeze({enabled:false,ready:false,reason:'sales_email_disabled'});
  if(projectId!=='ailandgames'||origin!==ORIGIN)throw Error('sales_email_target_mismatch');
  if(typeof policyStartAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(policyStartAt)||!Number.isFinite(Date.parse(policyStartAt))||new Date(policyStartAt).toISOString()!==policyStartAt)throw Error('sales_email_cutover_required');
  if(previousPolicyStartAt&&previousPolicyStartAt!==policyStartAt)throw Error('sales_email_cutover_changed');
  return Object.freeze({enabled:true,ready:true,projectId,origin,policyStartAt});
}
