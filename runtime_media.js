import './media_store.js';
import manifest from './assets/runtime/manifest.json';
const CACHE='legend-heroes-media-v1';
// Full-resolution media only. No preview atlas, resizing, or quality substitution.
export function installRuntimeMedia(assetMap){
 const byUrl=new Map(),bySource=new Map(),queue=[],jobs=new Map(),ready=new Map();
 const absolute=url=>new URL(url,document.baseURI).href;
 for(const entry of manifest.images){
  const path=assetMap[entry.source] || assetMap['./'+entry.source];if(!path)continue;
  const url=absolute(path);const record=byUrl.get(url) || {...entry,url};byUrl.set(url,record);bySource.set(entry.source,record);
 }
 let initialized=false,active=0,serial=0;
 const stats={quality:'original',queued:0,active:0,completed:0,failed:0};
 function findRecord(src){
  if(!src || /^(data|blob):/.test(src))return;
  const url=new URL(src,document.baseURI);if(url.origin!==location.origin)return;
  return byUrl.get(url.href) || byUrl.get(url.origin+url.pathname) || bySource.get(decodeURI(url.pathname).replace(/^\//,''));
 }
 async function transfer(record,job){
  let response=GameMediaStore.response(await GameMediaStore.get(record.url));try{response ||= await caches.match(record.url);}catch{}
  const hit=response?.ok && /^image\//.test(response.headers.get('content-type') || '');
  if(!hit){response=await fetch(record.url,{priority:job.priority>=50?'high':'low'});if(!response.ok || !/^image\//.test(response.headers.get('content-type') || ''))throw Error('Image unavailable');}
  // Consume the body before Cache.put; do not leave an unread tee branch in Safari.
  const blob=await response.blob();
  if(!hit){try{await GameMediaStore.put(record.url,blob,response.headers);}catch{}}
  const url=URL.createObjectURL(blob),image=new Image();image.src=url;
  try{await image.decode();}catch(error){URL.revokeObjectURL(url);throw error;}
  // Keep the decoded image alive so subsequent scene changes can reuse it.
  ready.set(record.url,{url,image});
  window.dispatchEvent(new CustomEvent('game-media-ready',{detail:{source:record.source}}));
 }
 function pump(){
  if(!initialized)return;queue.sort((a,b)=>b.priority-a.priority || a.order-b.order);
  while(active<3 && queue.length){const job=queue.shift();active++;stats.active=active;stats.queued=queue.length;
   transfer(job.record,job).then(()=>{stats.completed++;job.resolve(true);},()=>{stats.failed++;job.resolve(false);}).finally(()=>{active--;stats.active=active;jobs.delete(job.record.url);pump();});
  }
 }
 function warm(record,priority=10){
  if(!record || ready.has(record.url))return Promise.resolve(true);
  if(record.retryAfter>Date.now())return Promise.resolve(false);
  const existing=jobs.get(record.url);if(existing){existing.priority=Math.max(existing.priority,priority);return existing.promise;}
  let resolve;const promise=new Promise(r=>{resolve=r;});jobs.set(record.url,{record,priority,promise,resolve,order:serial++});queue.push(jobs.get(record.url));stats.queued=queue.length;queueMicrotask(pump);return promise;
 }
 function resolve(source,fallback){
  const record=bySource.get(source) || findRecord(fallback);if(!record)return fallback;
  // Until a decoded original is ready, the browser fetches the same original URL.
  // Never replace it with a small stretched bitmap.
  return ready.get(record.url)?.url || record.url;
 }
 function warmPaths(paths,priority=50){return Promise.all(paths.map(source=>warm(bySource.get(source),priority)));}
 function onScreen(id){const screen=document.getElementById(id);if(!initialized || !screen)return;
  screen.querySelectorAll('img').forEach(img=>{if(img.getBoundingClientRect().width>0){img.dataset.mediaQuality='original';void img.decode().catch(()=>{});}});
 }
 function enhance(img){const record=findRecord(img.getAttribute('src'));if(!record)return;const url=ready.get(record.url)?.url || record.url;if(img.src!==url)img.src=url;}
 async function init(){if(initialized)return;initialized=true;
  document.querySelectorAll('img').forEach(enhance);
  new MutationObserver(records=>{for(const r of records){if(r.type==='attributes')enhance(r.target);else for(const node of r.addedNodes){if(node instanceof HTMLImageElement)enhance(node);node.querySelectorAll?.('img').forEach(enhance);}}}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
  pump();}

 const api={init,resolve,warmPaths,onScreen,stats,bytesForUrl:url=>findRecord(url)?.bytes || 0};window.GameMedia=api;window.__resolveRuntimeAsset=resolve;
 if(!window.render_game_to_text)window.render_game_to_text=()=>JSON.stringify({screen:document.querySelector('.screen.active')?.id,boot:window.assetBootState?.phase,media:stats});
 return api;
}
