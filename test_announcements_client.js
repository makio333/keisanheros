// Test Hosting only: announcements stay in this browser and never reach production.
import {sanitizeAnnouncement} from './server/game-announcements.mjs';
export function installTestAnnouncements(target=window){
 const key='legend-test-announcements-v1';
 const read=()=>{try{return JSON.parse(target.localStorage.getItem(key))||[];}catch{return [];}};
 const write=rows=>target.localStorage.setItem(key,JSON.stringify(rows));
 target.AnnouncementAPI={
  loginDay:async()=>{const now=Date.now();return {now,day:new Date(now+9*3600000).toISOString().slice(0,10)};},
  permissions:async()=>({admin:true}),
  list:async(admin=false)=>read().filter(n=>admin||n.active),
  publish:async value=>{const id=crypto.randomUUID();write([{id,...sanitizeAnnouncement(value),active:true,createdAt:Date.now()},...read()]);return {id};},
  archive:async id=>write(read().map(n=>n.id===id?{...n,active:false}:n)),
 };
}
