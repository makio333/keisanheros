const fail=code=>{throw Error(code);};
const kinds=new Set(['item','equip','ticket','medal','skin','background','decoration']);
export function sanitizeAnnouncement(input){
 if(!input||typeof input!=='object')fail('invalid_announcement');
 const title=String(input.title||'').trim(),body=String(input.body||'').trim(),image=String(input.image||'');
 if(!title||title.length>80||!body||body.length>4000||!/^((assets|画像)\/[\w\p{L} .()/-]+\.(png|webp|jpg))?$/u.test(image)||image.includes('..'))fail('invalid_announcement');
 const gold=Number(input.gold||0);if(!Number.isSafeInteger(gold)||gold<0||gold>1000000)fail('invalid_announcement');
 if(!Array.isArray(input.items)||input.items.length>20)fail('invalid_announcement');
 const items=input.items.map(item=>{
  if(!kinds.has(item?.kind)||typeof item.id!=='string'||!/^[-\w]{1,100}$/.test(item.id)||!Number.isSafeInteger(item.count)||item.count<1||item.count>99)fail('invalid_announcement');
  const result={kind:item.kind,id:item.id,count:item.count};
  if(item.kind==='equip'){if(!Number.isInteger(item.rarity)||item.rarity<1||item.rarity>5)fail('invalid_announcement');result.rarity=item.rarity;}
  if(item.kind==='ticket'&&!['skin-ticket','equip-ten-ticket','raid-ticket'].includes(item.id))fail('invalid_announcement');
  return result;
 });
 return {title,body,image,gold,items};
}
// Only an authenticated Google operator or a server-issued admin claim may publish.
export function announcementAdmin(claims){return claims?.admin===true || (claims?.firebase?.sign_in_provider==='google.com'&&claims.email_verified===true&&claims.email==='ailandgames.jp@gmail.com');}
export async function handleAnnouncements({db,claims,method,args,now=Date.now}){
 if(method==='noticeLoginDay')return {day:new Date(now()+9*60*60*1000).toISOString().slice(0,10)};
 const admin=announcementAdmin(claims);
 if(method==='noticePermissions')return {admin};
 const notices=db.collection('gameAnnouncements');
 if(method==='noticeList'){
  const snap=await notices.orderBy('createdAt','desc').limit(100).get();
  return snap.docs.map(doc=>({id:doc.id,...doc.data()})).filter(row=>row.active===true || (admin&&args[0]===true));
 }
 if(!admin)fail('admin_required');
 if(method==='noticePublish'){
  const value=sanitizeAnnouncement(args[0]);const ref=notices.doc();
  await ref.set({...value,active:true,createdAt:now()});return {id:ref.id};
 }
 if(method==='noticeArchive'){
  if(typeof args[0]!=='string'||!/^[-\w]{1,100}$/.test(args[0]))fail('invalid_announcement');
  await notices.doc(args[0]).update({active:false,archivedAt:now()});return {ok:true};
 }
 fail('invalid_game_request');
}
