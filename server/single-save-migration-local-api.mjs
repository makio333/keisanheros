import {randomBytes} from 'node:crypto';

const routeRoot='/__single-save-local/api';
const MAX_BODY_BYTES=2*1024*1024+32*1024;
const statusByError={
  authentication_required:401,migration_not_authorized:403,legacy_ownership_unverified:403,source_proof_not_configured:503,
  migration_source_mismatch:400,invalid_single_save_payload:400,invalid_legacy_source:400,invalid_legacy_save:400,
  save_too_large:413,purchase_required:403,save_limit_reached:409,legacy_already_claimed:409,
  legacy_save_id_collision:409,legacy_source_conflict:409,legacy_transfer_pending_for_other_account:409,
  preview_not_found:404,preview_expired:409,preview_not_committable:409,invalid_confirmation:400,
};

function reply(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'});res.end(body===null?'':JSON.stringify(body));}
async function readBody(req){
  if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')throw Error('invalid_single_save_payload');
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY_BYTES)throw Error('save_too_large');chunks.push(chunk);}
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_single_save_payload');}
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid_single_save_payload');
  return value;
}
function loopback(req){return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress||'');}

/** API for the separate localhost-only preview page. Never mount this handler in the product API. */
export function createSingleSaveMigrationLocalApi({migration,sessionId,destinationLabel='合成ローカル宛先',origin='http://127.0.0.1:5187',sourceProofConfigured=false,authorizationConfigured=false,now=Date.now}){
  if(!migration||typeof migration.preview!=='function'||typeof migration.commit!=='function'||typeof sessionId!=='string'||!sessionId)throw Error('single_save_migration_not_configured');
  const parsedOrigin=new URL(origin);
  if(parsedOrigin.origin!==origin||parsedOrigin.protocol!=='http:'||parsedOrigin.hostname!=='127.0.0.1')throw Error('unsafe_single_save_local_origin');
  const plans=new Map(),commitAvailable=sourceProofConfigured&&authorizationConfigured;
  const sweep=()=>{for(const [id,plan] of plans)if(plan.expiresAt<=now())plans.delete(id);};
  return async(req,res)=>{
    const url=new URL(req.url,origin);
    if(!url.pathname.startsWith(routeRoot+'/'))return false;
    if(!loopback(req)||req.headers.host!==parsedOrigin.host){reply(res,403,{error:'local_only'});return true;}
    if(req.headers.origin&&req.headers.origin!==origin){reply(res,403,{error:'invalid_origin'});return true;}
    sweep();
    try{
      if(url.pathname===routeRoot+'/status'&&req.method==='GET'){
        const target=await migration.destinationStatus({sessionId});
        reply(res,200,{environment:'synthetic-local-only',destination:{label:destinationLabel,used:target.used,limit:target.limit,free:target.free},
          canCommit:commitAvailable,blockedReason:!commitAvailable?'source_proof_and_operator_authorization_not_configured':null});
        return true;
      }
      if(url.pathname===routeRoot+'/preview'&&req.method==='POST'){
        const payload=await readBody(req),preview=await migration.preview({sessionId,payload});
        const id=randomBytes(24).toString('base64url');
        plans.set(id,{payload:structuredClone(payload),preview,expiresAt:now()+10*60*1000,busy:false,completed:null});
        const reason=preview.reason||(!commitAvailable?'source_proof_and_operator_authorization_not_configured':null);
        reply(res,200,{previewId:id,environment:'synthetic-local-only',sourceProject:preview.sourceProject,child:preview.preview,destination:{label:destinationLabel,...preview.destination},
          state:preview.state,canCommit:commitAvailable&&preview.canCommit,reason});
        return true;
      }
      if(url.pathname===routeRoot+'/commit'&&req.method==='POST'){
        const body=await readBody(req);
        if(Object.keys(body).sort().join(',')!=='confirm,previewId'||typeof body.previewId!=='string'||body.confirm!==true)throw Error('invalid_confirmation');
        const plan=plans.get(body.previewId);if(!plan)throw Error('preview_not_found');
        if(plan.expiresAt<=now())throw Error('preview_expired');
        if(plan.completed){reply(res,200,plan.completed);return true;}
        if(!commitAvailable)throw Error('source_proof_not_configured');
        if(!plan.preview.canCommit)throw Error('preview_not_committable');
        if(plan.busy){reply(res,409,{error:'commit_in_progress'});return true;}
        plan.busy=true;
        try{
          const result=await migration.commit({sessionId,payload:plan.payload});
          plan.completed={completed:true,environment:'synthetic-local-only',alreadyImported:result.alreadyImported===true,
            childName:result.preview.playerName,level:result.preview.level,saveName:result.name,revision:result.revision};
          reply(res,200,plan.completed);
        }finally{plan.busy=false;}
        return true;
      }
      if(url.pathname===routeRoot+'/cancel'&&req.method==='POST'){
        const body=await readBody(req);
        if(Object.keys(body).sort().join(',')!=='previewId'||typeof body.previewId!=='string')throw Error('invalid_single_save_payload');
        const plan=plans.get(body.previewId);if(plan?.busy)throw Error('commit_in_progress');
        plans.delete(body.previewId);reply(res,200,{cancelled:true});return true;
      }
      reply(res,405,{error:'method_not_allowed'});return true;
    }catch(error){
      const code=Object.hasOwn(statusByError,error?.message)?error.message:'single_save_migration_unavailable';
      reply(res,statusByError[code]||503,{error:code});return true;
    }
  };
}
