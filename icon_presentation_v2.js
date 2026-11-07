// Pure presentation only: no game globals, storage, event handlers or state writes.
export const SKILL_ICON_PATHS_V2 = Object.freeze(Object.fromEntries(
  [['renzoku','renzoku'],['heal_song','heal'],['honoo','honoo'],['inazuma','inazuma'],['gale','gale']]
    .flatMap(([id,file])=>[id,`${id}2`].map(key=>[key,`assets/skills/skill_${file}.png`]))
));
export const ICON_RARITIES_V2 = Object.freeze([
  ['ノーマル','#4da6ff','#182636'],['レア','#4ddd7a','#173327'],
  ['激レア','#ffe066','#39321a'],['超激レア','#ff5c5c','#3b2024'],
  ['レジェンド','#b26bff','#2d2140'],['エンシェントレア','#ff9f43','#39271d']
].map(([name,tone,dark],i)=>Object.freeze({rarity:i+1,name,tone,dark})));
const escape = value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryNames={weapon:'ぶき',armor:'よろい',accessory:'アクセサリ',equip:'そうび',item:'どうぐ',blueprint:'挑戦状',skill:'特技',skin:'キャラ',background:'背景',decoration:'フレーム',ticket:'チケット','equip-ticket':'装備ガチャ10連チケット','skin-ticket':'背景スキンガチャチケット','raid-ticket':'レイドチケット','halloween-ticket':'ハロウィンチケット','halloween-candy':'ハロウィンのお菓子',material:'素材',currency:'通貨'};
function imagePath(value){return typeof value==='string' && !/[\u0000-\u001f]/.test(value) && !/^(?:[a-z]+:|\/\/)/i.test(value) && /\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(value);}
export function iconPresentationV2(db={},options={}){
  const kind=options.kind||((db.blueprint||db.equipId)?'blueprint':db.slot?'equip':'item');
  const rarity=kind==='equip'?Math.max(1,Math.min(6,Math.round(Number(options.rarity??db.rarity)||1))):null;
  const id=String(db.id??'');
  const image=kind==='skill'?(SKILL_ICON_PATHS_V2[id]||db.emoji):(db.emoji||db.image||'🎁');
  const tier=kind==='skill' && /2$/.test(id)?'Ⅱ':'';
  const count=options.count==null?null:Math.max(0,Math.trunc(Number(options.count)||0));
  const category=categoryNames[kind==='equip'?db.slot:kind]||categoryNames[kind]||'アイテム';
  const size=[48,64,88].includes(options.size)?options.size:48;
  return Object.freeze({id,kind,rarity,image,isImage:imagePath(image),tier,count,category,size,name:String(db.name||id||category),equipped:!!options.equipped,selected:!!options.selected,owned:!!options.owned,disabled:!!options.disabled});
}
// assetUrl may be the game's existing av function. Callers retain their own click/tooltip handling.
export function renderIconCellV2(db,options={}){
  const p=iconPresentationV2(db,options),assetUrl=options.assetUrl||((path)=>path);
  const label=[p.name,p.category,p.rarity?`★${p.rarity} ${ICON_RARITIES_V2[p.rarity-1].name}`:'',p.tier,p.count!==null?`所持数${p.count}`:'',p.equipped?'装備中':'',p.selected?'選択中':'',p.owned?'獲得済み':''].filter(Boolean).join('・');
  const art=p.isImage?`<img src="${escape(assetUrl(p.image))}" alt="" decoding="async">`:`<span class="ipv2-emoji">${escape(p.image)}</span>`;
  const slot= p.kind==='equip' && ['weapon','armor','accessory'].includes(db.slot)?`<img class="ipv2-category" src="${escape(assetUrl(`assets/equipment-category-icons/${db.slot}.png`))}" alt="">`:'';
  const tag=options.interactive?'button':'span';
  return `<${tag} class="ipv2-cell${p.selected?' ipv2-selected':''}" data-icon-id="${escape(p.id)}" data-icon-kind="${escape(p.kind)}" data-icon-rarity="${p.rarity||0}" data-icon-size="${p.size}" aria-label="${escape(label)}"${options.interactive?` type="button" aria-pressed="${p.selected}"${p.disabled?' disabled':''}`:' role="img"'}>
    <span class="ipv2-frame"><span class="ipv2-art">${art}</span>${slot}${p.tier?'<span class="ipv2-tier">Ⅱ</span>':''}${p.rarity?`<span class="ipv2-stars">${'★'.repeat(p.rarity)}</span>`:''}</span>
    <span class="ipv2-meta">${p.count!==null?`<span>×${p.count}</span>`:''}${p.equipped?'<span>装備中</span>':''}${p.selected?'<span>選択中</span>':''}${p.owned?'<span>獲得済み</span>':''}</span>
  </${tag}>`;
}
