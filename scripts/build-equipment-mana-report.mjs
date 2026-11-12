import {writeFileSync} from 'node:fs';
import {equipmentCatalog} from './lib/equipment-mana-catalog.mjs';
import {manaEquipmentStats,manaEquipmentAbility,equipmentManaBudget,equipmentResources,ENCHANT_RESOURCE_COST} from '../equipment_mana_ratio.js';
const all=equipmentCatalog(),multipliers={1:1,2:1.5,3:2,4:3,5:4.2,6:5.5};
const names={atk:'攻撃',def:'守備',spd:'素早さ',mp:'MP',hp:'HP'},abilityNames={crit_up:'会心率+10%',guard:'被ダメージ-5%',mp_save:'消費MP-1',power:'攻撃力+15%',lifesteal:'HP吸収15%'};
const statText=s=>Object.entries(s).map(([k,v])=>`${names[k]||k}+${v}`).join(' / ')||'能力値なし';
const oldCost=(d,r)=>d.fixedCost||d.id.startsWith('anc_')?Math.max(1,d.cost||1):Math.max(1,Math.ceil((d.cost||1)*multipliers[r]));
const oldStat=(d,r,scale=1)=>Object.fromEntries(Object.entries(d.stat).map(([k,v])=>[k,Math.max(1,Math.floor(v*multipliers[r]*scale))]));
const rows=[];const variants=[];
for(const d of all){
 if(d.id.startsWith('anc_')){
  for(const [level,scale] of [[1,.2],[50,1]]){
   const stat=oldStat(d,6,scale);rows.push({id:d.id,name:d.name,icon:d.emoji,slot:d.slot,rarity:6,level,oldCost:oldCost(d,6),newCost:oldCost(d,6),oldStats:stat,newStats:stat,ability:'固有効果・覚醒とも変更なし',budget:null,statResources:null,enchantResources:null,note:'★6保護対象：マナレシオ適用外'});
  }continue;
 }
 for(let r=1;r<=5;r++){
  const requested=d.ability || null,ability=manaEquipmentAbility(d,r,requested),stats=manaEquipmentStats(d,r,requested);
  rows.push({id:d.id,name:d.name,icon:d.emoji,slot:d.slot,rarity:r,oldCost:oldCost(d,r),newCost:Math.max(1,Math.ceil(d.cost||1)),oldStats:oldStat(d,r),newStats:stats,ability:abilityNames[ability]||'なし',budget:equipmentManaBudget(d,r),statResources:equipmentResources(stats),enchantResources:ENCHANT_RESOURCE_COST[ability]||0,note:d.assist?'計算補助機能の装備：能力値なしを維持':requested?'イベント固定効果込み':r===5?'★5効果未指定時の表示例（枠に合うTier1効果）':'特殊効果なし'});
  if(!d.assist)for(const requested of [null,...Object.keys(ENCHANT_RESOURCE_COST)]){
   const applied=manaEquipmentAbility(d,r,requested),stat=manaEquipmentStats(d,r,requested);
   variants.push({id:d.id,name:d.name,rarity:r,cost:d.cost,requested:requested||'none',applied:applied||'none',budget:equipmentManaBudget(d,r),enchantResources:ENCHANT_RESOURCE_COST[applied]||0,statResources:equipmentResources(stat),statValues:stat,stats:statText(stat)});
  }
 }
}
const statDelta=(oldStats,newStats)=>Object.fromEntries([...new Set([...Object.keys(oldStats),...Object.keys(newStats)])].map(key=>[key,(newStats[key]||0)-(oldStats[key]||0)]));
const signed=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'±0';
const deltaText=delta=>Object.entries(delta).map(([key,value])=>`${names[key]||key} ${signed(value)}`).join(' / ')||'変化なし';
function effectChange(oldId,newId,known=true){
 if(!known)return '旧ランダム効果：未指定';
 if(oldId===newId)return oldId?'維持：'+abilityNames[oldId]:'変更なし（なし）';
 if(oldId&&!newId)return '削除：'+abilityNames[oldId];
 if(!oldId&&newId)return '追加：'+abilityNames[newId];
 return '変更：'+abilityNames[oldId]+' → '+abilityNames[newId];
}
for(const row of rows){
 const db=all.find(d=>d.id===row.id);
 row.statDelta=statDelta(row.oldStats,row.newStats);row.costDelta=row.newCost-row.oldCost;
 row.fixedAbility=db.ability||null;row.oldAbilityId=db.ability||null;
 row.oldAbilityKnown=row.rarity===6||!!db.ability||row.rarity<3||!!db.assist;
 row.newAbilityId=row.rarity===6?row.oldAbilityId:manaEquipmentAbility(db,row.rarity,db.ability);
 row.enchantChange=row.rarity===6?'変更なし（★6保護）':effectChange(row.oldAbilityId,row.newAbilityId,row.oldAbilityKnown);
}
for(const variant of variants){
 const db=all.find(d=>d.id===variant.id),requested=variant.requested==='none'?null:variant.requested;
 variant.statDelta=statDelta(oldStat(db,variant.rarity),variant.statValues);
 variant.enchantChange=effectChange(requested||db.ability,variant.applied==='none'?null:variant.applied);
}
const q=x=>'"'+String(typeof x==='object'&&x!==null?JSON.stringify(x):x??'').replaceAll('"','""')+'"';
const csv=(headers,data)=>'\ufeff'+headers.map(q).join(',')+'\r\n'+data.map(r=>r.map(q).join(',')).join('\r\n');
writeFileSync('equipment_mana_ratio_changes.csv',csv(['ID','装備名','種類','レア度','覚醒Lv','旧コスト','新コスト','旧能力値','新能力値','新効果','総リソース','能力値SP','効果SP','備考','能力変化量','コスト差','エンチャント変化'],rows.map(r=>[r.id,r.name,r.slot,r.rarity,r.level,r.oldCost,r.newCost,statText(r.oldStats),statText(r.newStats),r.ability,r.budget,r.statResources,r.enchantResources,r.note,deltaText(r.statDelta),r.costDelta,r.enchantChange])));
writeFileSync('equipment_mana_ratio_enchant_variants.csv',csv(Object.keys(variants[0]),variants.map(r=>Object.values(r))));
writeFileSync('equipment_mana_ratio_changes.json',JSON.stringify({rules:{resourcePerCost:2,hpPerResource:4,rarityBonus:[0,1,2,3,3],enchantCost:ENCHANT_RESOURCE_COST,ancientProtected:true},rows},null,2));
const payload=JSON.stringify(rows).replaceAll('<','\\u003c');
const variantPayload=JSON.stringify(variants).replaceAll('<','\\u003c');
writeFileSync('equipment_mana_ratio_report.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>装備マナレシオ 変更前後一覧</title><style>body{font:15px/1.65 system-ui;background:#111827;color:#e5e7eb;margin:24px}h1{font-size:24px;color:#fcd34d}a{color:#93c5fd}header,nav{max-width:1200px}nav{position:sticky;top:0;background:#111827;padding:10px 0;display:flex;gap:10px;flex-wrap:wrap}select,input{padding:8px;border-radius:6px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:10px;border:1px solid #374151;vertical-align:top}th{background:#1f2937}.increase{color:#60a5fa}.decrease{color:#f87171}.unchanged{color:#9ca3af}.changes{min-width:115px}.change-line{white-space:nowrap}.wrap{overflow:auto}small{display:block;color:#9ca3af}p{margin:8px 0}.old{color:#9ca3af}.equipment-label{display:flex;align-items:center;gap:12px;min-width:220px}.report-equipment-icon{width:64px;height:64px;flex:0 0 64px;box-sizing:border-box;display:grid;place-items:center;border:2px solid var(--tone);border-radius:8px;background:#20283a}.report-equipment-icon img{width:52px;height:52px;object-fit:contain;image-rendering:pixelated}.report-equipment-icon span{font-size:32px}</style><header><h1>装備マナレシオ：変更前 → 変更後</h1><p>コスト×2＋レア度ボーナスを、能力値と特殊効果で分け合います。HP4＝SP1。他能力1＝SP1。★6の数値・コスト・固有効果・覚醒は変更しません。</p><p>★1〜4の通常品は特殊効果なし、★5はTier1効果の表示例。イベント固定効果は低レアでも予算から差し引きます。既存の特殊効果と抽選される効果によって能力値は変わります。Tier1＝2、Tier2＝6、Tier3＝12SP。予算超過の特殊効果は外し、その分をすべて能力値に配分（既存装備も対象）。HP/攻撃などの配分は旧ベースのSP比率、端数は最大剰余法で配分します。</p><p><a href="equipment_mana_ratio_changes.csv" download>変更前後一覧CSV</a> ／ <a href="equipment_mana_ratio_enchant_variants.csv" download>特殊効果の全組合せCSV</a></p><p>旧能力値欄は従来のレア倍率による装備加算値です。効果による最終攻撃倍率等は含みません。「かぞえだま」は数値なしの計算補助装備として維持します。データは標準装備定義を使用し、個人セーブ・管理者の個別カスタム値は含みません。</p><p>変化量は <strong class="increase">増加＝青</strong> ／ <strong class="decrease">減少＝赤</strong> ／ <strong class="unchanged">変化なし＝灰色</strong>。旧ランダム効果は保存データを参照せず、下の選択欄で指定して比較できます（イベント固定効果・★6は指定の対象外）。</p></header><nav><select id="slot"><option value="">全装備</option><option value="weapon">武器</option><option value="armor">防具</option><option value="accessory">アクセサリー</option></select><select id="rarity"><option value="">全レア度</option>${[1,2,3,4,5,6].map(r=>'<option value="'+r+'">★'+r+'</option>').join('')}</select><select id="enchant" aria-label="比較する旧ランダム効果"><option value="auto">旧ランダム効果：未指定</option><option value="none">旧効果：なし</option>${Object.entries(abilityNames).map(([id,label])=>'<option value="'+id+'">旧効果：'+label+'</option>').join('')}</select><input id="search" placeholder="装備名・IDで検索"><span id="count"></span></nav><div class="wrap"><table><thead><tr><th>装備名</th><th>レア度</th><th>コスト 旧→新</th><th>旧能力値</th><th>新能力値</th><th>能力変化量</th><th>エンチャント変化</th><th>新効果・SP内訳</th></tr></thead><tbody id="rows"></tbody></table></div><script>const data=${payload};const labels=${JSON.stringify(names)};const text=s=>Object.entries(s).map(([k,v])=>(labels[k]||k)+'+'+v).join(' / ')||'能力値なし';const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');const tones={1:'#4da6ff',2:'#4ddd7a',3:'#ffe066',4:'#ff5c5c',5:'#b26bff',6:'#ff9f43'};function icon(r){const art=r.icon?.startsWith('assets/')?'<img src="'+escape(r.icon)+'" alt="" width="52" height="52">':'<span>'+escape(r.icon||'')+'</span>';return '<span class="report-equipment-icon" style="--tone:'+tones[r.rarity]+'" aria-hidden="true">'+art+'</span>';}const variantsData=${variantPayload};const variantsByKey=new Map(variantsData.map(v=>[v.id+'|'+v.rarity+'|'+v.requested,v]));const abilityLabels=${JSON.stringify(abilityNames)};
const signed=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'±0';
const deltaClass=n=>n>0?'increase':n<0?'decrease':'unchanged';
const delta=(a,b)=>Object.fromEntries([...new Set([...Object.keys(a),...Object.keys(b)])].map(k=>[k,(b[k]||0)-(a[k]||0)]));
function comparison(row){
 const selected=document.getElementById('enchant').value;
 if(selected==='auto'||row.rarity===6||row.fixedAbility||row.note.includes('補助'))return row;
 const v=variantsByKey.get(row.id+'|'+row.rarity+'|'+selected);if(!v)return row;
 return {...row,newStats:v.statValues,statDelta:v.statDelta,oldAbilityKnown:true,oldAbilityId:selected==='none'?null:selected,newAbilityId:v.applied==='none'?null:v.applied,enchantChange:v.enchantChange,ability:abilityLabels[v.applied]||'なし',enchantResources:v.enchantResources,statResources:v.statResources};
}
function statsHtml(r){return Object.entries(r.newStats).map(([k,v])=>escape(labels[k]||k)+'<strong class="'+deltaClass(r.statDelta[k]||0)+'">+'+v+'</strong>').join(' / ')||'能力値なし';}
function deltaHtml(r){return Object.entries(r.statDelta).map(([k,v])=>'<div class="change-line">'+escape(labels[k]||k)+' <strong class="'+deltaClass(v)+'">'+signed(v)+'</strong></div>').join('')||'<span class="unchanged">変化なし</span>';}
function enchantHtml(r){let type='unchanged';if(r.oldAbilityKnown&&r.rarity!==6){if(r.oldAbilityId&&!r.newAbilityId)type='decrease';else if(!r.oldAbilityId&&r.newAbilityId)type='increase';}return '<span class="'+type+'">'+escape(r.enchantChange)+'</span>';}
function render(){const list=data.filter(r=>(!slot.value||r.slot===slot.value)&&(!rarity.value||r.rarity==rarity.value)&&(!search.value||(r.name+' '+r.id).includes(search.value))).map(comparison);document.getElementById('count').textContent=list.length+'件 / 全'+data.length+'件';document.getElementById('rows').innerHTML=list.map(r=>'<tr><td><div class="equipment-label">'+icon(r)+'<div>'+escape(r.name)+'<small>'+escape(r.id)+'</small></div></div></td><td>★'+r.rarity+(r.level?' / 覚醒Lv'+r.level:'')+'</td><td>'+r.oldCost+' → <strong class="'+deltaClass(r.costDelta)+'">'+r.newCost+'</strong><small>差 '+signed(r.costDelta)+'</small></td><td class="old">'+escape(text(r.oldStats))+'</td><td>'+statsHtml(r)+'</td><td class="changes">'+deltaHtml(r)+'</td><td>'+enchantHtml(r)+'</td><td>'+escape(r.ability)+'<small>'+(r.budget==null?'★6保護：変更なし':r.note.includes('補助')?escape(r.note):r.budget+'SP ＝ 能力値'+r.statResources+' ＋ 効果'+r.enchantResources)+'</small></td></tr>').join('')}for(const id of ['slot','rarity','enchant','search'])document.getElementById(id).oninput=render;render();</script></html>`);
console.log(JSON.stringify({templates:all.length,rows:rows.length,weapons:rows.filter(r=>r.slot==='weapon').length,protected:rows.filter(r=>r.rarity===6).length,examples:rows.filter(r=>r.id==='w3'||r.id==='w7').map(r=>({name:r.name,rarity:r.rarity,cost:[r.oldCost,r.newCost],stats:[r.oldStats,r.newStats],ability:r.ability}))},null,2));
