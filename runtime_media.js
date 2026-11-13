import manifest from './assets/runtime/manifest.json';
import atlasUrl from './assets/runtime/preview-atlas.webp?url';
const CACHE='legend-heroes-media-v1';
export function installRuntimeMedia(assetMap){
 const absolute=url=>new URL(url,document.baseURI).href;
 const byUrl=new Map(),bySource=new Map(),byPreview=new Map();
 for(const entry of manifest.images){
  const path=assetMap[entry.source] || assetMap['./'+entry.source];if(!path)continue;
  const url=absolute(path);let record=byUrl.get(url);if(!record){record={...entry,url,images:new Set()};byUrl.set(url,record);}else if(entry.preview[2]*entry.preview[3]>record.preview[2]*record.preview[3])record.preview=entry.preview;bySource.set(entry.source,record);
 }
 let atlas,canvas,ctx,initialized=false,active=0,serial=0;
 const queue=[],jobs=new Map(),full=new Map(),byFullUrl=new Map();
 const stats={atlasReady:false,queued:0,active:0,completed:0,failed:0,previewImages:0};
 const cssSeeds=[...(manifest.cssSources || []).map(e=>[e.variable,e.source]),['--media-town-icons','assets/ui/town-navigation-v1.png'],['--media-title-sky','画像/title_sky_v2.png'],['--media-title-land','画像/title_foreground_v2.png']];
 function preview(record){
  if(!atlas)return record.url;
  if(!record.previewUrl){const [x,y,w,h]=record.preview;canvas.width=w;canvas.height=h;ctx.clearRect(0,0,w,h);ctx.drawImage(atlas,x,y,w,h,0,0,w,h);record.previewUrl=canvas.toDataURL('image/png');byPreview.set(record.previewUrl,record);}
  return record.previewUrl;
 }
 function applyFull(record,url){
  full.set(record.url,url);byFullUrl.set(url,record);
  for(const img of record.images){if(!img.isConnected){record.images.delete(img);continue;}if(img.getAttribute('src')===record.previewUrl || img.getAttribute('src')===record.url){img.src=url;img.dataset.mediaQuality='full';}}
  for(const [name,source] of cssSeeds){if(bySource.get(source)===record)document.documentElement.style.setProperty(name,`url("${url}")`);}
  for(const item of record.styles || []){if(item.element.isConnected){const value=item.element.style.getPropertyValue(item.property);if(value.includes(record.previewUrl))item.element.style.setProperty(item.property,value.replaceAll(record.previewUrl,url));}}
  record.images.clear();record.styles?.clear();
  window.dispatchEvent(new CustomEvent('game-media-ready',{detail:{source:record.source}}));
 }
 async function transfer(record,job){
  let response;
  try{response=await caches.match(record.url);}catch{}
  if(!response?.ok || !/^image\//.test(response.headers.get('content-type') || '')){
   response=await fetch(record.url,{priority:job.priority>=50?'high':'low'});
   if(!response.ok || !/^image\//.test(response.headers.get('content-type') || ''))throw Error('Image unavailable');
   try{const cache=await caches.open(CACHE);await cache.put(record.url,response.clone());}catch{}
  }
  const blob=await response.blob(),url=URL.createObjectURL(blob),image=new Image();image.src=url;
  try{await image.decode();}catch(error){URL.revokeObjectURL(url);throw error;}
  applyFull(record,url);
 }
 function pump(){
  if(!initialized)return;
  queue.sort((a,b)=>b.priority-a.priority || a.order-b.order);
  while(active<2 && queue.length){const job=queue.shift();active++;stats.active=active;stats.queued=queue.length;
   transfer(job.record,job).then(()=>{stats.completed++;job.resolve(true);},()=>{stats.failed++;job.record.retryAfter=Date.now()+5000;job.resolve(false);}).finally(()=>{active--;stats.active=active;jobs.delete(job.record.url);pump();});
  }
 }
 function warm(record,priority=10){
  if(!record || full.has(record.url))return Promise.resolve(true);
  if(record.retryAfter>Date.now())return Promise.resolve(false);
  const existing=jobs.get(record.url);if(existing){existing.priority=Math.max(existing.priority,priority);return existing.promise;}
  let resolve;const promise=new Promise(r=>{resolve=r;});const job={record,priority,promise,resolve,order:serial++};jobs.set(record.url,job);queue.push(job);stats.queued=queue.length;queueMicrotask(pump);return promise;
 }
 function resolve(source,fallback){
  const record=bySource.get(source) || findRecord(fallback);if(!record || !initialized)return fallback;
  void warm(record,20);return full.get(record.url) || preview(record);
 }
 function findRecord(src){
  if(byFullUrl.has(src))return byFullUrl.get(src);
  if(byPreview.has(src))return byPreview.get(src);
  if(!src || src.startsWith('data:') || src.startsWith('blob:'))return;
  const url=new URL(src,document.baseURI);if(url.origin!==location.origin)return;
  return byUrl.get(url.href) || byUrl.get(url.origin+url.pathname) || bySource.get(decodeURI(url.pathname).replace(/^\//,''));
 }
 function enhance(img){
  const src=img.getAttribute('src');if(!src)return;if(src.startsWith('blob:')){if(byFullUrl.has(src))img.dataset.mediaQuality='full';return;}
  const record=findRecord(src);if(!record)return;
  const ready=full.get(record.url);
  if(ready){if(src!==ready)img.src=ready;img.dataset.mediaQuality='full';return;}
  record.images.add(img);
  const small=preview(record);if(src!==small)img.src=small;img.dataset.mediaQuality='preview';stats.previewImages++;
  void warm(record,img.closest('.screen.active')?100:5);
 }
 function enhanceStyle(element){
  if(!element.style || !element.style.cssText.includes('url('))return;
  for(const property of element.style){
   const value=element.style.getPropertyValue(property);if(!value.includes('url('))continue;let next=value;
   for(const part of value.split('url(').slice(1)){
    let uri=part.slice(0,part.indexOf(')')).trim();if((uri[0]==='"'&&uri.at(-1)==='"')||(uri[0]==="'"&&uri.at(-1)==="'"))uri=uri.slice(1,-1);
    const record=findRecord(uri);if(!record)continue;const ready=full.get(record.url),replacement=ready || preview(record);next=next.replaceAll(uri,replacement);
    if(!ready){if(!record.styles)record.styles=new Set();record.styles.add({element,property});void warm(record,50);}
   }
   if(next!==value)element.style.setProperty(property,next);
  }
 }
 function enhanceTree(root){if(root instanceof HTMLImageElement)enhance(root);if(root.nodeType===1)enhanceStyle(root);root.querySelectorAll?.('img').forEach(enhance);root.querySelectorAll?.('[style]').forEach(enhanceStyle);}

 async function init(){
  if(initialized)return;
  let response;try{response=await caches.match(absolute(atlasUrl));}catch{}
  if(!response?.ok)response=await fetch(atlasUrl);
  if(!response.ok)throw Error('Preview atlas unavailable');
  const blob=await response.blob(),url=URL.createObjectURL(blob);atlas=new Image();atlas.src=url;await atlas.decode();URL.revokeObjectURL(url);
  canvas=document.createElement('canvas');ctx=canvas.getContext('2d');initialized=true;stats.atlasReady=true;
  for(const [name,source] of cssSeeds){const record=bySource.get(source);if(record)document.documentElement.style.setProperty(name,`url("${preview(record)}")`);}
  enhanceTree(document);
  new MutationObserver(records=>{for(const mutation of records){if(mutation.type==='attributes'){if(mutation.attributeName==='src')enhance(mutation.target);else enhanceStyle(mutation.target);}else mutation.addedNodes.forEach(node=>{if(node.nodeType===1)enhanceTree(node);});}}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','style']});
  pump();
 }
 function warmPaths(paths,priority=50){return Promise.all(paths.map(source=>warm(bySource.get(source),priority)));}
 function onScreen(id){const screen=document.getElementById(id);if(!initialized || !screen)return;enhanceTree(screen);screen.querySelectorAll('img').forEach(img=>{const record=byPreview.get(img.getAttribute('src')) || byUrl.get(img.src);if(record)void warm(record,100);});}
 const api={atlasUrl,init,resolve,warmPaths,onScreen,stats};
 window.GameMedia=api;window.__resolveRuntimeAsset=resolve;
 if(!window.render_game_to_text)window.render_game_to_text=()=>JSON.stringify({screen:document.querySelector('.screen.active')?.id,boot:window.assetBootState?.phase,media:stats});
 return api;
}
