import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSingleSaveMigrationLocalStore} from '../server/single-save-migration-local-store.mjs';
import {createSingleSaveMigrationPrototype} from '../server/single-save-migration-prototype.mjs';
import {createSingleSaveMigrationLocalApi} from '../server/single-save-migration-local-api.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='http://127.0.0.1:5187',sessionId='synthetic-local-session',accountId='synthetic-local-destination';
const store=createSingleSaveMigrationLocalStore();
await store.transaction(tx=>{
  tx.putAccount({id:accountId,createdAt:Date.now(),facilityAccess:{kind:'legacy-migration',active:true,sourceProject:'synthetic-only',legacyKeys:[],saveLimit:3}});
  tx.putSession(sessionId,{accountId,expiresAt:Date.now()+60*60*1000});
});
const migration=createSingleSaveMigrationPrototype({store,sessions:store.sessions,sourceProject:'synthetic-only',allowAnySourcePreview:true,
  authorizeMigration:async()=>false,verifySelectedSource:async()=>false});
const api=createSingleSaveMigrationLocalApi({migration,sessionId,destinationLabel:'合成テスト移行先（3枠）',origin,sourceProofConfigured:false,authorizationConfigured:false});
const publicFiles=new Map([
  ['/','single-save-migration-local.html'],
  ['/single-save-migration-local.css','single-save-migration-local.css'],
  ['/single-save-migration-local.js','single-save-migration-local.js'],
  ['/legacy_save_file.js','legacy_save_file.js'],
  ['/legacy_transfer_file.js','legacy_transfer_file.js'],
]);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=createServer(async(req,res)=>{
  if(await api(req,res))return;
  const filename=publicFiles.get(new URL(req.url,origin).pathname);
  if(req.method!=='GET'||!filename){res.writeHead(404);res.end();return;}
  try{
    const contents=await readFile(path.join(root,filename));
    res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(contents);
  }catch{res.writeHead(404);res.end();}
});
server.on('error',async error=>{console.error(`Local preview server failed: ${error.code||'error'}`);await store.close();process.exitCode=1;});
server.listen(5187,'127.0.0.1',()=>console.log('Local one-child migration preview: http://127.0.0.1:5187/ (synthetic destination; confirmation disabled)'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await store.close();process.exit(0);}));
