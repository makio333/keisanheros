// Downloaded artwork is keyed by its build-hashed URL. Only missing files are fetched.
export const BOOT_MEDIA_CACHE = 'legend-heroes-media-v1';
const AUDIO = ['bgm_title.m4a','bgm_home_kaisei.mp3','bgm_room.m4a','bgm_stage1.m4a','bgm_area_boss.mp3','bgm_raid_boss.mp3','bgm_training.m4a','se_crit.mp3','se_clear.mp3','se_type.mp3','se_slash.mp3','se_decide.mp3','se_gameover.m4a','se_gacha_result.mp3','se_gacha_result2.mp3','bgm_halloween_normal.mp3','bgm_halloween_boss.mp3'];
const PORTRAITS = [
  ['assets/characters/hero_female_1_hd.png','少女の冒険者','一歩ずつ進めば、きっと強くなれる。'],
  ['assets/characters/hero_male_2_hd.png','青年の騎士','装備を整えて、まだ見ぬ世界へ。'],
  ['assets/characters/skin_forest_scout_f.png','森の斥候','困っている村人の依頼にも耳を傾けよう。'],
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
  const scenery=el('boot-scenery');scenery.src=resolve('assets/characters/bg_skin_forest.png');
  let slide=0;
  const showPortrait=()=>{const [src,name,tip]=PORTRAITS[slide++%PORTRAITS.length];el('boot-character').src=resolve(src);text('boot-character-name',name);text('boot-tip',tip);};
  showPortrait();
  const rotate=setInterval(()=>{if(!screen.isConnected || state.phase==='ready'){clearInterval(rotate);return;}showPortrait();},9000);
  const urls=bootAssetUrls(assetMap);
  let cache;try {cache=await caches.open(BOOT_MEDIA_CACHE);} catch {state.persistent=false;}
  const completed=new Set();
  // Reuse both the new media cache and the existing Service Worker cache.
  for(const url of urls){try {const hit=await caches.match(url);if(hit?.ok && /^(image|audio|video)\/|^application\/octet-stream/i.test(hit.headers.get('content-type') || ''))completed.add(url);}catch {}}
  const missing=()=>urls.filter(url=>!completed.has(url));
  const report=()=>{progress(state.done/Math.max(1,state.total)*100);text('boot-status-text',`${state.done} / ${state.total} ファイル`);text('boot-download-detail',`${(state.downloadedBytes/1048576).toFixed(1)} MB ダウンロード済み${state.persistent?' ・ ダウンロードした素材は端末に保存されます':' ・ この端末では一時的に読み込みます'}`);};
  async function download(url){
    const controller=new AbortController();let timer;
    const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(),45000);};reset();
    try {
      // A fresh response is cached only after the whole transfer succeeds.
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      const type=response.headers.get('content-type') || '';
      if(!/^(?:image\/|audio\/|video\/|application\/octet-stream)/i.test(type))throw Error('Unexpected media type');
      const stored=response.clone();
      if(response.body){const reader=response.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;reset();state.downloadedBytes+=value.byteLength;report();}}
      else {state.downloadedBytes+=(await response.arrayBuffer()).byteLength;}
      if(cache){try {await cache.put(url,stored);}catch {state.persistent=false;}}
      completed.add(url);
    } finally {clearTimeout(timer);}
  }
  async function normalLoad(){
    phase('loading','冒険を準備中','もうすぐ、あなたの冒険がはじまります。');progress(0);text('boot-status-text','NOW LOADING');text('boot-download-detail','保存済みの素材を読み込んでいます。');
    // Decode only the visible art here. Game artwork is loaded on demand from cache.
    await Promise.all([el('boot-character'),scenery].map(img=>img.decode().catch(()=>{})));
    progress(100);text('boot-status-text','準備完了');
    await new Promise(r=>setTimeout(r,450));state.phase='ready';clearInterval(rotate);onReady();
  }
  async function update(){
    const pending=missing();state.done=0;state.total=pending.length;state.failed=0;state.downloadedBytes=0;
    el('boot-download-retry').classList.add('hidden');
    if(!pending.length){await normalLoad();return;}
    phase('updating','アップデート中','新しい冒険のデータをダウンロードしています。初回や更新後は少し時間がかかります。');report();
    let cursor=0,interrupted=false;
    await Promise.all(Array.from({length:Math.min(6,pending.length)},async()=>{
      while(!interrupted && cursor<pending.length){const url=pending[cursor++];try {await download(url);state.done++;}catch(error) {state.failed++;interrupted=true;console.warn('Asset update interrupted:',url,error.message);}report();}
    }));
    if(state.failed){phase('error','ダウンロードが中断しました','通信状況を確認して、もう一度お試しください。受信済みのデータから再開できます。');text('boot-status-text',`残り ${missing().length} ファイル`);el('boot-download-retry').classList.remove('hidden');return;}
    await normalLoad();
  }
  el('boot-download-retry').onclick=e=>{e.stopPropagation();void update();};
  await update();
}
