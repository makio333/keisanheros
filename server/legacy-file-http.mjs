import {LEGACY_FILE_MAX_BYTES} from '../legacy_save_file.js';
export function createLegacyFileHandler({importer,origin}){
  const cookieName=new URL(origin).protocol==='https:'?'__Host-legend-session':'legend-local-session';
  return async(req,res)=>{
    if(new URL(req.url,origin).pathname!=='/api/legacy/import-file')return false;
    const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
    if(req.method!=='POST'){reply(405,{error:'method_not_allowed'});return true;}
    if(req.headers.origin!==origin){reply(403,{error:'invalid_origin'});return true;}
    try{
      if(req.headers['content-type']?.split(';')[0]!=='application/json')throw Error('invalid_migration_file');
      const cookies=String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(cookieName+'='));
      const sessionId=cookies.length===1?cookies[0].slice(cookieName.length+1):'';
      const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>LEGACY_FILE_MAX_BYTES)throw Error('migration_file_too_large');chunks.push(chunk);}
      const body=JSON.parse(Buffer.concat(chunks).toString());
      if(!body||typeof body!=='object'||typeof body.apply!=='boolean')throw Error('invalid_migration_file');
      reply(200,await importer.process(sessionId,body));
    }catch(error){
      const codes={authentication_required:401,migration_not_authorized:403,migration_source_mismatch:400,invalid_migration_file:400,migration_file_too_large:413,save_too_large:413,invalid_legacy_save:400,legacy_already_claimed:409,facility_already_assigned:409,facility_source_conflict:409,migration_inconsistent:409,save_limit_reached:409};
      const code=error instanceof SyntaxError?'invalid_migration_file':error.message;
      reply(codes[code]||503,{error:codes[code]?code:'migration_unavailable'});
    }
    return true;
  };
}
