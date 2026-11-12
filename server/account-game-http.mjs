const statuses={authentication_required:401,purchase_required:403,admin_required:403,save_not_found:404,save_revision_conflict:409,save_too_large:413,invalid_game_request:400,invalid_json:400,body_too_large:413};
export function createAccountGameHandler({service,origin}){
  const site=new URL(origin);
  if(site.origin!==origin || site.protocol!=='https:' && !(site.protocol==='http:' && ['127.0.0.1','localhost'].includes(site.hostname)))throw Error('unsafe_game_origin');
  const cookieName=site.protocol==='https:'?'__Host-legend-session':'legend-local-session';
  const reply=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  return async(req,res)=>{
    if(new URL(req.url,origin).pathname!=='/api/game')return false;
    if(req.method!=='POST'){reply(res,405,{error:'method_not_allowed'});return true;}
    if(req.headers.origin!==origin){reply(res,403,{error:'invalid_origin'});return true;}
    try{
      if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')throw Error('invalid_json');
      if(Number(req.headers['content-length'])>2200000)throw Error('body_too_large');
      const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>2200000)throw Error('body_too_large');chunks.push(chunk);}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_json');}
      if(!body || typeof body!=='object' || Array.isArray(body))throw Error('invalid_game_request');
      const matches=String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(cookieName+'='));
      const id=matches.length===1?matches[0].slice(cookieName.length+1):'';
      reply(res,200,await service.call(id,body));
    }catch(error){
      if(error.message?.includes('締め切りました'))reply(res,409,{error:'イベントランキングは締め切りました'});
      else{const code=statuses[error.message]?error.message:'game_service_unavailable';reply(res,statuses[code]||503,{error:code});}
    }
    return true;
  };
}
