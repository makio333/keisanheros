// Downloaded artwork is keyed by its build-hashed URL. Only missing files are fetched.
export const BOOT_MEDIA_CACHE = 'legend-heroes-media-v1';
// Music and artwork for other screens are fetched on demand by the Service Worker.
const AUDIO = [];
const STARTUP_ART = [];
export function startupAssetMap(assetMap){
 const selected={};
 for(const key of STARTUP_ART){const url=assetMap[key] || assetMap['./'+key];if(url)selected[key]=url;}
 if(window.GameMedia)selected.previewAtlas=window.GameMedia.atlasUrl;
 return selected;
}

const PORTRAITS = [
  ['assets/boot/adventurer.webp','少女の冒険者','一歩ずつ進めば、きっと強くなれる。'],
  ['assets/boot/knight.webp','青年の騎士','装備を整えて、まだ見ぬ世界へ。'],
  ['assets/boot/scout.webp','森の斥候','困っている村人の依頼にも耳を傾けよう。'],
];
export function bootAudioUrl(path) {
  const name=path.split('/').pop().split('?')[0];
  const revision=import.meta.env?.VITE_BOOT_AUDIO_VERSIONS?.[name] || 'dev';
  return path.split('?')[0]+'?v='+revision;
}
export function bootAssetUrls(assetMap, base=document.baseURI) {
  return [...new Set([...Object.values(assetMap),...AUDIO.map(name=>bootAudioUrl(`assets_audio/${name}`))]
    .filter(url=>typeof url==='string' && /\.(?:png|jpe?g|webp|gif|svg|avif|m4a|mp3|ogg|wav)(?:\?|$)/i.test(url))
    .map(url=>new URL(url,base)).filter(url=>url.origin===new URL(base).origin).map(url=>url.href))];
}
export async function startAssetBoot({screen,resolve,assetMap,onReady}) {
  const el=id=>document.getElementById(id);
  const text=(id,value)=>{if(el(id))el(id).textContent=value;};
  const state={phase:'checking',done:0,total:0,downloadedBytes:0,failed:0,persistent:true};
  // Read-only status for QA/accessibility; contains no player or save information.
  window.assetBootState=state;
  function progress(n){const value=Math.min(100,Math.max(0,Math.round(n)));text('boot-load-percent',value+'%');el('boot-progress-fill').style.width=value+'%';el('boot-progress-track').setAttribute('aria-valuenow',value);}
  function phase(name,title,description){state.phase=name;screen.dataset.phase=name;text('boot-phase-label',name==='updating'?'DATA UPDATE':'NOW LOADING');text('boot-phase-title',title);text('boot-phase-description',description);}
  const scenery=el('boot-scenery');scenery.fetchPriority='low';
  const character=el('boot-character');character.fetchPriority='high';
  // A small existing sprite appears first, while the large skin illustration loads.
  character.src=resolve('assets/characters/hero_female_1.png');
  let slide=0,changing=false;
  const showPortrait=async()=>{
    if(changing)return;
    changing=true;
    const [src,name,tip]=PORTRAITS[slide%PORTRAITS.length];
    const next=new Image();next.fetchPriority='low';next.src=resolve(src);
    try {await next.decode();if(screen.isConnected){character.src=next.src;text('boot-character-name',name);text('boot-tip',tip);slide++;}}catch {}finally{changing=false;}
  };
  // Decoration starts after critical data is ready and never blocks the start button.
  const rotate=setInterval(()=>{if(!screen.isConnected || state.phase==='ready'){clearInterval(rotate);return;}void showPortrait();},9000);
  const urls=bootAssetUrls(assetMap);
  let cache;try {cache=await caches.open(BOOT_MEDIA_CACHE);} catch {state.persistent=false;}
  const completed=new Set();
  // Reuse both the new media cache and the existing Service Worker cache.
  for(const url of urls){try {const hit=await caches.match(url);if(hit?.ok && /^(image|audio|video)\/|^application\/octet-stream/i.test(hit.headers.get('content-type') || ''))completed.add(url);}catch {}}
  const missing=()=>urls.filter(url=>!completed.has(url));
  const report=()=>{progress(state.done/Math.max(1,state.total)*100);text('boot-status-text',`${state.done} / ${state.total} ファイル`);text('boot-download-detail',`${(state.downloadedBytes/1048576).toFixed(1)} MB ダウンロード済み${state.persistent?' ・ ダウンロードした素材は端末に保存されます':' ・ この端末では一時的に読み込みます'}`);};
  let lastTransferActivity=Date.now();
  async function download(url){
    const controller=new AbortController();let timer;
    const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(Date.now()-lastTransferActivity>=45000)controller.abort();else reset();},45000);};reset();
    try {
      // A fresh response is cached only after the whole transfer succeeds.
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      const type=response.headers.get('content-type') || '';
      if(!/^(?:image\/|audio\/|video\/|application\/octet-stream)/i.test(type))throw Error('Unexpected media type');
      const stored=response.clone();
      if(response.body){const reader=response.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;lastTransferActivity=Date.now();reset();state.downloadedBytes+=value.byteLength;report();}}
      else {state.downloadedBytes+=(await response.arrayBuffer()).byteLength;}
      if(cache){try {await cache.put(url,stored);}catch {state.persistent=false;}}
      completed.add(url);
    } finally {clearTimeout(timer);}
  }
  async function normalLoad(){
    phase('loading','冒険を準備中','もうすぐ、あなたの冒険がはじまります。');progress(0);text('boot-status-text','NOW LOADING');text('boot-download-detail','保存済みの素材を読み込んでいます。');
    progress(100);text('boot-status-text','準備完了');
    if(window.GameMedia)await window.GameMedia.init();
    state.phase='ready';clearInterval(rotate);onReady();window.dispatchEvent(new Event('legend-heroes-ready'));
    setTimeout(()=>{if(screen.isConnected && !screen.classList.contains('fade-out')){scenery.src=resolve('assets/boot/forest.webp');void showPortrait();}},100);
  }
  async function update(){
    const pending=missing();state.done=0;state.total=pending.length;state.failed=0;state.downloadedBytes=0;
    el('boot-download-retry').classList.add('hidden');
    if(!pending.length){await normalLoad();return;}
    phase('updating','アップデート中','新しい冒険のデータをダウンロードしています。初回や更新後は少し時間がかかります。');report();
    lastTransferActivity=Date.now();
    let cursor=0,interrupted=false;
    await Promise.all(Array.from({length:Math.min(6,pending.length)},async()=>{
      while(!interrupted && cursor<pending.length){const url=pending[cursor++];try {await download(url);state.done++;}catch(error) {state.failed++;interrupted=true;console.warn('Asset update interrupted:',url,error.message);}report();}
    }));
    if(state.failed){phase('error','ダウンロードが中断しました','通信状況を確認して、もう一度お試しください。受信済みのデータから再開できます。');text('boot-status-text',`残り ${missing().length} ファイル`);el('boot-download-retry').classList.remove('hidden');return;}
    try{await normalLoad();}catch(error){const atlas=window.GameMedia?.atlasUrl;if(atlas){const url=new URL(atlas,document.baseURI).href;completed.delete(url);try{const cache=await caches.open(BOOT_MEDIA_CACHE);await cache.delete(url);}catch{}}phase('error','画像データを確認できませんでした','通信状況を確認して、もう一度お試しください。');el('boot-download-retry').classList.remove('hidden');}
  }
  el('boot-download-retry').onclick=e=>{e.stopPropagation();void update();};
  await update();
}
