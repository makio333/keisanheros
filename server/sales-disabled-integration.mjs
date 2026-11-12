import {createAccountSaveService} from './account-saves.mjs';

export function createSalesDisabledIntegration({store,sessions,origin,complimentarySaveLimit=0,complimentaryAccountCutoff=null,now=Date.now}){
  const site=new URL(origin);
  if(site.origin!==origin||site.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(site.hostname))throw Error('unsafe_sales_disabled_origin');
  const accounts=createAccountSaveService({store,sessions,trialsEnabled:false,complimentarySaveLimit,complimentaryAccountCutoff,now});
  return Object.freeze({accounts,async handler(req,res){
    const route=new URL(req.url,origin).pathname;
    if(!route.startsWith('/api/payments/'))return false;
    res.writeHead(403,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end('{"error":"sales_disabled"}');
    return true;
  }});
}
