import './media_store.js';
// A stable media cache survives code and Service Worker releases.
export const BOOT_MEDIA_CACHE='legend-heroes-media-v1';
const INITIAL_ART=['画像/title_sky_v2.png','画像/title_foreground_v2.png','画像/title_logo_transparent.png','画像/home_town_v2.png','assets/ui/town-navigation-v1.png','assets/characters/hero_female_1_hd.png','assets/items/w1.png','assets/items/a1.png'];
export function startupAssetMap(assetMap){return assetMap;}
export function bootAudioUrl(path){
 const name=path.split('/').pop().split('?')[0];
 return path.split('?')[0]+'?v='+(import.meta.env?.VITE_BOOT_AUDIO_VERSIONS?.[name] || 'dev');
}
export function bootAssetUrls(assetMap,base=document.baseURI){
 const audio=Object.keys(import.meta.env?.VITE_BOOT_AUDIO_VERSIONS || {}).map(name=>bootAudioUrl('assets_audio/'+name));
 return [...new Set([...Object.values(assetMap),...audio].filter(url=>typeof url==='string' && !url.startsWith('data:') && /\.(png|jpe?g|webp|gif|svg|avif|m4a|mp3|ogg|wav)(\?|$)/i.test(url)).map(url=>new URL(url,base)).filter(url=>url.origin===new URL(base).origin).map(url=>url.href))];
}
export async function ensureMediaWorker(urls=[]){
 if(!('serviceWorker' in navigator))throw Error('WORKER_UNAVAILABLE');
 const registration=await (window.gameWorkerRegistration || navigator.serviceWorker.register('./sw.js'));
 await navigator.serviceWorker.ready;
 if(!navigator.serviceWorker.controller){
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',changed);reject(Error('WORKER_UNAVAILABLE'));},15000);
   function changed(){if(navigator.serviceWorker.controller){clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',changed);resolve();}}
   navigator.serviceWorker.addEventListener('controllerchange',changed);changed();
  });
 }
 if(urls.length)await new Promise((resolve,reject)=>{
  const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(Error('WORKER_UNAVAILABLE'));},15000);
  channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();e.data.ready?resolve():reject(Error('WORKER_MEDIA_MISSING'));};
  navigator.serviceWorker.controller.postMessage({type:'GAME_MEDIA_CHECK',urls},[channel.port2]);
 });
 return registration;
}
export async function verifyImageBlob(blob){
 const url=URL.createObjectURL(blob),image=new Image();image.src=url;
 try{await image.decode();if(!image.naturalWidth)throw Error('Invalid image');}
 finally{image.removeAttribute('src');URL.revokeObjectURL(url);}
}
export async function startAssetBoot({screen,resolve,assetMap,criticalPaths=[],onReady}){
 const el=id=>document.getElementById(id),text=(id,value)=>{if(el(id))el(id).textContent=value;};
 const state={phase:'checking',done:0,total:0,downloadedBytes:0,failed:0,persistent:true,checked:0,assetCount:0,failedUrls:[]};window.assetBootState=state;
 function progress(n){const v=Math.max(0,Math.min(100,Math.round(n)));text('boot-load-percent',v+'%');el('boot-progress-fill').style.width=v+'%';el('boot-progress-track').setAttribute('aria-valuenow',v);}
 function phase(name,title,description){state.phase=name;screen.dataset.phase=name;text('boot-phase-label',name==='updating'?'DATA UPDATE':'NOW LOADING');text('boot-phase-title',title);text('boot-phase-description',description);}
 const urls=bootAssetUrls(assetMap);state.assetCount=urls.length;
 const hero=assetMap['assets/characters/hero_female_1_hd.png'];if(hero && el('boot-character'))el('boot-character').src=resolve('assets/characters/hero_female_1_hd.png');
 const completed=new Set();let cache,running=false;
 const knownBytes=url=>window.GameMedia?.bytesForUrl?.(url) || 0;
 let pendingBytes=0;
 function report(){
  const percentage=pendingBytes?state.downloadedBytes/pendingBytes*100:state.done/Math.max(1,state.total)*100;
  // Keep the bar below 100 until validation and saving have both succeeded.
  progress(state.done===state.total?100:Math.min(99,percentage));
  text('boot-status-text',`${state.done} / ${state.total} ファイル`);
  text('boot-download-detail',`${(state.downloadedBytes/1048576).toFixed(1)} MB ダウンロード済み ・ 保存済みの素材は再ダウンロードしません`);
 }
 async function checkCache(){
  completed.clear();const candidates=new Map();
  for(const url of await GameMediaStore.keys())if(urls.includes(url))completed.add(url);
  for(const name of await caches.keys()){
   if(!name.startsWith('legend-heroes-'))continue;
   const store=await caches.open(name);for(const request of await store.keys())if(urls.includes(request.url))candidates.set(request.url,{store,name});
  }
  state.cacheCandidates=candidates.size;state.cachedBeforeUpdate=0;state.checked=0;
  for(const url of urls){
   if(completed.has(url)){state.checked++;state.cachedBeforeUpdate=completed.size;continue;}
   const candidate=candidates.get(url);if(candidate){const {store,name}=candidate;const hit=await store.match(url);if(hit?.ok && /^(image|audio|video)\/|^application\/octet-stream/i.test(hit.headers.get('content-type') || '')){const blob=await hit.blob();if(blob.type.startsWith('image/'))await verifyImageBlob(blob);await GameMediaStore.put(url,blob,hit.headers);completed.add(url);}}
   state.checked++;state.cachedBeforeUpdate=completed.size;
  }
 }
 async function download(url){
  const controller=new AbortController();let timer;const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(),45000);};reset();
  try{
   const response=await fetch(url,{signal:controller.signal,priority:'high'});if(!response.ok)throw Error('HTTP '+response.status);
   const type=response.headers.get('content-type') || '';if(!/^(image|audio|video)\/|^application\/octet-stream/i.test(type))throw Error('Unexpected media type');
   const chunks=[];let received=0;
   if(response.body){const reader=response.body.getReader();while(true){const chunk=await reader.read();if(chunk.done)break;reset();chunks.push(chunk.value);received+=chunk.value.byteLength;state.downloadedBytes+=chunk.value.byteLength;report();}}
   else{const bytes=await response.arrayBuffer();chunks.push(bytes);received=bytes.byteLength;state.downloadedBytes+=received;}
   const expected=Number(response.headers.get('content-length'));if(expected && !response.headers.has('content-encoding') && received!==expected)throw Error('Incomplete media');
   const blob=new Blob(chunks,{type});if(type.startsWith('image/'))await verifyImageBlob(blob);
   // Consume/validate once, then save a new Response. Never block on an unread clone.
   await GameMediaStore.put(url,blob,response.headers);completed.add(url);
  }finally{clearTimeout(timer);}
 }
 async function normalLoad(){
  phase('loading','冒険を準備中','画像を表示できることを確認しています。');text('boot-status-text','画像の準備');progress(0);
  if(window.GameMedia){await window.GameMedia.init();const paths=[...new Set([...INITIAL_ART,...criticalPaths])];const result=await window.GameMedia.warmPaths(paths,100);
   const failed=paths.filter((_,i)=>!result[i]);if(failed.length){for(const path of failed){const url=assetMap[path] || assetMap['./'+path];if(url){const absolute=new URL(url,document.baseURI).href;await GameMediaStore.delete(absolute);await cache.delete(absolute);completed.delete(absolute);state.failedUrls.push(absolute);}}throw Error('DECODE_FAILED');}
  }
  // Native CSS images and later scenes must be able to read the stored files on this first visit.
  if(window.GameMedia)await ensureMediaWorker(urls);
  if(el('boot-scenery') && assetMap['画像/home_town_v2.png'])el('boot-scenery').src=resolve('画像/home_town_v2.png');
  progress(100);text('boot-status-text','準備完了');state.phase='ready';screen.dataset.phase='ready';onReady();window.dispatchEvent(new Event('legend-heroes-ready'));
 }
 function showError(error){
  state.failed=Math.max(1,state.failed);const storage=error?.name==='QuotaExceededError';
  phase('error',storage?'素材を保存できませんでした':'素材の準備が完了していません',storage?'端末の空き容量を確認して、もう一度お試しください。':'通信状況を確認して再試行してください。取得済みの素材から再開します。');
  text('boot-status-text',`残り ${urls.length-completed.size} ファイル`);el('boot-download-retry').classList.remove('hidden');
 }
 async function update(){
  if(running)return;running=true;el('boot-download-retry').classList.add('hidden');state.failed=0;state.failedUrls=[];state.downloadedBytes=0;state.done=0;
  try{
   phase('checking','アップデートを確認中','保存した素材と今回必要な素材を照合しています。');
   cache=await caches.open(BOOT_MEDIA_CACHE);await checkCache();
   const important=new Set(INITIAL_ART.map(path=>assetMap[path]).filter(Boolean).map(url=>new URL(url,document.baseURI).href));
   const pending=urls.filter(url=>!completed.has(url)).sort((a,b)=>Number(important.has(b))-Number(important.has(a)));state.total=pending.length;pendingBytes=pending.reduce((n,url)=>n+knownBytes(url),0);
   if(pending.length){phase('updating','冒険のデータをダウンロード中','初回は必要な素材を準備します。更新時は新しい素材と変更された素材だけを取得します。');report();let cursor=0,interrupted=false,transferError;
    await Promise.all(Array.from({length:Math.min(3,pending.length)},async()=>{while(!interrupted && cursor<pending.length){const url=pending[cursor++];try{await download(url);state.done++;}catch(error){state.failed++;state.lastError=(error?.name || 'Error')+': '+(error?.message || String(error));state.failedUrls.push(url);interrupted=true;transferError=error;}report();}}));
    if(state.failed)throw transferError || Error('DOWNLOAD_FAILED');
   }
   await normalLoad();
  }catch(error){showError(error);}finally{running=false;}
 }
 el('boot-download-retry').onclick=e=>{e.stopPropagation();void update();};
 await update();
}
