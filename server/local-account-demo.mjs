import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createServer as createViteServer} from 'vite';
import {openLocalAccountStore} from './local-account-store.mjs';
import {createLineLogin} from './line-login.mjs';
import {createLineLoginHandler} from './line-login-http.mjs';
import {createAccountSaveService} from './account-saves.mjs';
import {createAccountSaveHandler} from './account-saves-http.mjs';
import {createAccountGameService} from './account-game-service.mjs';
import {createAccountGameHandler} from './account-game-http.mjs';

// Explicit local fixture mode only. No real LINE channel, payment, Firebase or child data.
export async function startLocalAccountDemo({directory,port=5181,mockLine=false}){
  if(mockLine!==true)throw Error('explicit_mock_line_required');
  const db=await openLocalAccountStore(directory),codes=new Map(),tokens=new Map();
  let vite,origin,authHandler,accountHandler,gameHandler,subject='local-fixture-purchaser-1';
  const backend=createServer(async(req,res)=>{
    try{
      if(req.url.startsWith('/api/local-line?')){
        const url=new URL(req.url,origin),code=url.searchParams.get('code'),record=codes.get(code);
        if(!record || url.searchParams.get('state')!==record.state){res.writeHead(400);res.end();return;}
        res.writeHead(303,{Location:`/api/auth/line/callback?code=${encodeURIComponent(code)}&state=${record.state}`,'Cache-Control':'no-store'});res.end();return;
      }
      if(authHandler && (await authHandler(req,res)||await accountHandler(req,res)||await gameHandler(req,res)))return;
      res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'not_found'}));
    }catch{if(!res.headersSent)res.writeHead(503);res.end();}
  });
  try{
    await new Promise((resolve,reject)=>{backend.once('error',reject);backend.listen(0,'127.0.0.1',resolve);});
    const target=`http://127.0.0.1:${backend.address().port}`;
    vite=await createViteServer({root:fileURLToPath(new URL('../',import.meta.url)),define:{'import.meta.env.VITE_ACCOUNT_BACKEND':'"1"','import.meta.env.VITE_ACCOUNT_MOCK':'"1"'},server:{host:'127.0.0.1',port,strictPort:true,proxy:{'/api':{target}}}});
    await vite.listen();origin=`http://127.0.0.1:${vite.httpServer.address().port}`;
    const receipts=new Map();
    const service=createAccountSaveService({store:db,sessions:db.sessions,verifyReceipt:async key=>receipts.get(key)});
    async function fixtureSubject(next){
      if(!/^local-fixture-purchaser-[12]$/.test(next))throw Error('unknown_fixture');
      subject=next;const identity=await db.auth.resolveIdentity({provider:'line',providerId:'local-fixture-provider',subject});
      const key=`local-fixture-purchase-${subject}`;
      receipts.set(key,{eventId:key,purchaseId:key,accountId:identity.accountId,productId:'personal'});await service.applyPurchaseEvidence(key);
      return identity.accountId;
    }
    await fixtureSubject(subject);
    const protocol=createLineLogin({channelId:'local-fixture-channel',channelSecret:'LOCAL_MOCK_ONLY',providerId:'local-fixture-provider',redirectUri:origin+'/api/auth/line/callback',store:db.auth,
      fetchImpl:async(url,options)=>{
        if(url.endsWith('/token')){
          const code=options.body.get('code'),record=codes.get(code);codes.delete(code);
          if(!record)return {ok:false};
          const token=randomUUID();tokens.set(token,record);return {ok:true,json:async()=>({id_token:token})};
        }
        const token=options.body.get('id_token'),record=tokens.get(token);tokens.delete(token);
        return record?{ok:true,json:async()=>({iss:'https://access.line.me',aud:'local-fixture-channel',sub:record.subject,nonce:record.nonce,exp:Date.now()/1000+60,iat:Date.now()/1000,auth_time:Date.now()/1000})}:{ok:false};
      }});
    const login={...protocol,async begin(options){
      const result=await protocol.begin(options),url=new URL(result.authorizationUrl),code=randomUUID();
      codes.set(code,{state:url.searchParams.get('state'),nonce:url.searchParams.get('nonce'),subject});
      return {authorizationUrl:`${origin}/api/local-line?state=${url.searchParams.get('state')}&code=${code}`};
    }};
    authHandler=createLineLoginHandler({login,sessions:db.sessions,origin});accountHandler=createAccountSaveHandler({service,origin});
    const gameService=createAccountGameService({store:db});gameHandler=createAccountGameHandler({service:gameService,origin});
    return {url:origin,db,service,gameService,fixtureSubject,async close(){await vite.close();await new Promise(resolve=>backend.close(resolve));await db.close();}};
  }catch(error){if(vite)await vite.close();await new Promise(resolve=>backend.close(resolve));await db.close();throw error;}
}
