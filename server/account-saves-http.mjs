const errors={authentication_required:401,account_not_found:401,purchase_required:403,save_not_found:404,
  save_limit_reached:409,save_revision_conflict:409,save_too_large:413,legacy_claim_not_available:503,legacy_ownership_unverified:403,
  legacy_already_claimed:409,trial_unavailable:403,invalid_save:400,invalid_save_name:400,invalid_json:400,body_too_large:413};

export function createAccountSaveHandler({service,origin}){
  const site=new URL(origin);
  if(site.origin!==origin || (site.protocol!=='https:' && !(site.protocol==='http:' && ['localhost','127.0.0.1'].includes(site.hostname))))throw Error('unsafe_account_origin');
  const cookieName=site.protocol==='https:'?'__Host-legend-session':'legend-local-session';
  const reply=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  async function body(req){
    if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')throw Error('invalid_json');
    if(Number(req.headers['content-length'])>2200000)throw Error('body_too_large');
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>2200000)throw Error('body_too_large');chunks.push(chunk);}
    let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_json');}
    if(!value || typeof value!=='object' || Array.isArray(value))throw Error('invalid_json');
    return value;
  }
  return async(req,res)=>{
    const url=new URL(req.url,origin),isSummary=url.pathname==='/api/account',isList=url.pathname==='/api/saves',isClaim=url.pathname==='/api/legacy/claim',isTrial=url.pathname==='/api/trial/start';
    const item=url.pathname.match(/^\/api\/saves\/([^/]+)$/);
    if(!isSummary && !isList && !isClaim && !isTrial && !item)return false;
    const allowed=isSummary?['GET']:isList?['GET','POST']:isClaim||isTrial?['POST']:['GET','PUT'];
    if(!allowed.includes(req.method)){reply(res,405,{error:'method_not_allowed'});return true;}
    if(req.method!=='GET' && req.headers.origin!==origin){reply(res,403,{error:'invalid_origin'});return true;}
    const cookies=String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(cookieName+'='));
    const id=cookies.length===1?cookies[0].slice(cookieName.length+1):'';
    try{
      let result;
      if(isSummary)result=await service.summary(id);
      else if(isTrial)result=await service.startTrial(id);
      else if(isList)result=req.method==='GET'?await service.listSaves(id):await service.createSave(id,await body(req));
      else if(isClaim)result=await service.claimLegacySave(id,await body(req));
      else{
        let key;try{key=decodeURIComponent(item[1]);}catch{reply(res,400,{error:'invalid_save_key'});return true;}
        result=req.method==='GET'?await service.readSave(id,key):await service.updateSave(id,{...await body(req),key});
      }
      reply(res,isList && req.method==='POST'?201:200,result);
    }catch(error){const code=errors[error.message]?error.message:'account_service_unavailable';reply(res,errors[code]||503,{error:code});}
    return true;
  };
}
