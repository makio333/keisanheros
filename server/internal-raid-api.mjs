import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {applicationDefault,initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {createGameCloudAPIs} from '../game_cloud_apis.js';
import {isValidRaidBossId,raidJstMonthKey} from '../raid_monthly_rules.js';
import {createInternalRaidAccountGuard,createInternalRaidDeletionGuard,createInternalRaidTokenAuthenticator,mapInternalRaidError,resolveOwnedSaveIdentity} from './internal-raid-deletion-guard.mjs';

const authProjectId=process.env.AUTH_FIREBASE_PROJECT_ID||'ailandgames';
const raidProjectId=process.env.RAID_FIRESTORE_PROJECT_ID;
if(authProjectId!=='ailandgames'||!/^[-a-z0-9]{6,30}$/.test(raidProjectId||'')||raidProjectId==='ailandgames')throw Error('Internal raid API project target is not allowed.');
const allowedOrigins=new Set((process.env.INTERNAL_RAID_ALLOWED_ORIGINS||'https://legend-heroes2.web.app').split(',').map(value=>value.trim()).filter(Boolean));
for(const origin of allowedOrigins)if(new URL(origin).origin!==origin||!origin.startsWith('https://'))throw Error('Unsafe internal raid origin.');
const authApp=initializeApp({credential:applicationDefault(),projectId:authProjectId},'internal-raid-auth');
const raidApp=initializeApp({credential:applicationDefault(),projectId:raidProjectId},'internal-raid-data');
const db=getFirestore(raidApp),auth=getAuth(authApp);
const isUidBlocked=createInternalRaidDeletionGuard({db:getFirestore(authApp),projectId:authProjectId});
const authenticateRaidToken=createInternalRaidTokenAuthenticator({auth,projectId:authProjectId});
const assertRaidAccountAllowed=createInternalRaidAccountGuard({isUidBlocked});
const methods=new Set(['syncPlayer','settleReward','getRankings','getMonthlyRankings','getHistory','getGlobalBoss','receiveCheers','sendCheer']);
const fail=code=>{throw Error(code);};
const hash=value=>'r_'+createHash('sha256').update(value).digest('hex');
const safeState=value=>{
  if(!value||typeof value!=='object'||!value.player)return {player:{lvl:1,gold:0},updatedAt:0,items:[]};
  const seed=value.items?.find(item=>item?.id==='cost_seed');
  return {player:{lvl:Math.min(999,Math.max(1,Math.floor(Number(value.player.lvl)||1))),gold:Math.max(0,Math.floor(Number(value.player.gold)||0))},updatedAt:Date.now(),
    raidCoins:Number(value.raidCoins)||0,equipGachaTenPullTickets:Number(value.equipGachaTenPullTickets)||0,
    skinGachaTickets:Number(value.skinGachaTickets)||0,items:seed?[{uid:Number(seed.uid)||1,id:'cost_seed',count:Number(seed.count)||0}]:[]};
};
const cleanProfile=value=>{
  const source=value&&typeof value==='object'?value:{},equipment=source.equipment&&typeof source.equipment==='object'?source.equipment:{};
  const short=(input,max,fallback='')=>typeof input==='string'?input.slice(0,max):fallback;
  const safeId=(input,max)=>{const id=short(input,max);return /^[A-Za-z0-9_.-]{1,100}$/.test(id)?id:'';};
  const safeEquipment={};
  for(const slot of ['weapon','armor','accessory']){
    safeEquipment[slot+'Id']=safeId(equipment[slot+'Id'],100)||null;
    safeEquipment[slot+'Rarity']=Math.min(6,Math.max(1,Math.floor(Number(equipment[slot+'Rarity'])||1)));
  }
  return {playerName:short(source.playerName,40,'勇者')||'勇者',avatar:safeId(source.avatar,100),avatarBackground:safeId(source.avatarBackground,100)||'default',
    avatarHolographic:source.avatarHolographic===true,avatarBackgroundHolographic:source.avatarBackgroundHolographic===true,
    avatarDecoration:safeId(source.avatarDecoration,100),level:Math.min(999,Math.max(1,Math.floor(Number(source.level)||1))),equipment:safeEquipment};
};
function createRaidAdapter(uid,saveMap){
  const wrapRef=(native,save=null)=>({native,path:native.path,id:native.id,save});
  const adapt=snap=>({id:snap.id,exists:()=>snap.exists,data:()=>snap.data(),metadata:{fromCache:false}});
  const adapter={
    db,
    doc:(_db,name,id)=>{
      if(name==='saves'){
        let decoded;try{decoded=decodeURIComponent(id);}catch{fail('invalid_game_request');}
        const mapping=saveMap.get(decoded);if(!mapping||mapping.uid!==uid)fail('save_not_found');
        return wrapRef(db.collection('raidPlayerState').doc(mapping.publicKey),mapping);
      }
      return wrapRef(db.collection(name).doc(id));
    },
    collection:(_db,name)=>({native:db.collection(name),name}),
    where:(field,op,value)=>({kind:'where',field,op,value}),
    orderBy:(field,direction='asc')=>({kind:'orderBy',field,direction}),
    limit:count=>({kind:'limit',count}),
    query:(ref,...constraints)=>constraints.reduce((query,c)=>c.kind==='where'?query.where(c.field,c.op,c.value):c.kind==='orderBy'?query.orderBy(c.field,c.direction):query.limit(c.count),ref.native),
    getDoc:async ref=>adapt(await ref.native.get()),
    getDocs:async ref=>{
      const snap=await (ref.native||ref).get(),docs=snap.docs.map(adapt);
      return {docs,forEach:callback=>docs.forEach(callback)};
    },
    setDoc:async(ref,value,options)=>ref.save?fail('invalid_game_request'):ref.native.set(value,options),
    onSnapshot:()=>()=>{},
    runTransaction:(_db,callback)=>db.runTransaction(async native=>{
      const tx={
        get:async ref=>{
          const snap=await native.get(ref.native);
          if(ref.save&&snap.exists)ref.save.revision=Number(snap.data()?.revision)||0;
          return adapt(snap);
        },
        set:(ref,value,options)=>{
          if(ref.save){
            const {uid:owner,id}=ref.save;
            if(owner!==uid)fail('save_not_found');
            let state;try{state=safeState(JSON.parse(value.gameData));}catch{fail('invalid_game_request');}
            const data={gameData:JSON.stringify(state),updatedAt:Date.now()};
            native.set(ref.native,data,{merge:true});
          }else native.set(ref.native,value,options);
        },
        update:(ref,value)=>native.update(ref.native,value),
      };
      return callback(tx);
    }),
  };
  return adapter;
}

function publicize(value,ownKey,ownPublicKey){
  if(Array.isArray(value))return value.map(row=>publicize(row,ownKey,ownPublicKey));
  if(!value||typeof value!=='object')return value;
  const output={};
  for(const [key,item] of Object.entries(value))output[key]=key==='slotKey'&&item===ownPublicKey?ownKey:publicize(item,ownKey,ownPublicKey);
  return output;
}

const rate=new Map();
function allowRequest(uid,ip){
  const now=Date.now(),key=uid+':'+ip,previous=rate.get(key);
  if(rate.size>5000)for(const [entry,value] of rate)if(now-value.start>300000)rate.delete(entry);
  if(!previous||now-previous.start>=60000){rate.set(key,{start:now,count:1});return true;}
  previous.count++;return previous.count<=120;
}
function reply(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(body));}

async function handle(req,res){
  if(new URL(req.url,'https://internal.invalid').pathname!=='/api/raid-game'){reply(res,404,{error:'not_found'});return;}
  if(req.method!=='POST'){reply(res,405,{error:'method_not_allowed'});return;}
  if(!allowedOrigins.has(req.headers.origin)){reply(res,403,{error:'invalid_origin'});return;}
  if(req.headers['content-type']?.split(';')[0].trim()!=='application/json'){reply(res,400,{error:'invalid_json'});return;}
  const match=/^Bearer\s+(.+)$/i.exec(req.headers.authorization||'');
  if(!match){reply(res,401,{error:'authentication_required'});return;}
  try{
    const claims=await authenticateRaidToken(match[1]);
    if(!allowRequest(claims.uid,req.socket.remoteAddress||'')){reply(res,429,{error:'rate_limited'});return;}
    await assertRaidAccountAllowed(claims.uid);
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>1_500_000)fail('body_too_large');}
    let body;try{body=JSON.parse(raw);}catch{fail('invalid_json');}
    if(!body||typeof body!=='object'||Array.isArray(body)||!methods.has(body.method)||!Array.isArray(body.args)||body.args.length>3)fail('invalid_game_request');
    const args=[...body.args],saveMap=new Map();let ownKey='',ownPublicKey='';
    if(['syncPlayer','settleReward','receiveCheers'].includes(body.method)){
      const owned=resolveOwnedSaveIdentity(claims.uid,args[0]);args[0]=owned.publicKey;saveMap.set(owned.publicKey,{...owned,uid:claims.uid,revision:0});ownKey=owned.key;ownPublicKey=owned.publicKey;
    }else if(body.method==='getRankings'||body.method==='getHistory'||body.method==='getGlobalBoss'){
      const key=args[1]||args[0];if(typeof key==='string'&&key){const owned=resolveOwnedSaveIdentity(claims.uid,key);ownKey=owned.key;ownPublicKey=owned.publicKey;}
      if(body.method==='getRankings')args.length=1;else args.length=0;
    }else if(body.method==='getMonthlyRankings'){
      if(args[0]!==raidJstMonthKey(Date.now()))fail('invalid_game_request');
      args.length=1;
    }else if(body.method==='sendCheer')return reply(res,200,{result:true});
    if(body.method==='receiveCheers')return reply(res,200,{result:0});
    if(body.method==='syncPlayer'){
      args[1]=cleanProfile(args[1]);
      const progress=args[2]&&typeof args[2]==='object'?args[2]:{};
      if(progress.bossId!=null&&!isValidRaidBossId(progress.bossId))fail('invalid_game_request');
      if(!Array.isArray(progress.events||[])||(progress.events||[]).length>100||(progress.events||[]).some(event=>!event||typeof event.id!=='string'||!event.id||event.id.length>128||!Number.isSafeInteger(event.damage)||event.damage<0))fail('invalid_game_request');
      args[2]={...progress,state:safeState(progress.state)};
    }
    if(body.method==='settleReward')args[2]=safeState(args[2]);
    if(['getRankings','settleReward'].includes(body.method)&&args[body.method==='getRankings'?0:1]!=null&&!isValidRaidBossId(args[body.method==='getRankings'?0:1]))fail('invalid_game_request');
    const apis=createGameCloudAPIs({...createRaidAdapter(claims.uid,saveMap),now:Date.now});
    const result=await apis.RaidBossAPI[body.method](...args);
    reply(res,200,{result:publicize(result,ownKey,ownPublicKey)});
  }catch(error){
    const {code,status}=mapInternalRaidError(error);
    reply(res,status,{error:code});
  }
}

const server=createServer((req,res)=>{handle(req,res).catch(()=>{if(!res.headersSent)reply(res,503,{error:'raid_service_unavailable'});});});
const port=Number(process.env.PORT||8080);if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port.');
server.listen(port,'0.0.0.0',()=>console.log('Internal raid API listening.'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
