import {readFileSync,writeFileSync} from 'node:fs';import vm from 'node:vm';
import {equipmentCatalog} from './lib/equipment-mana-catalog.mjs';
import {manaEquipmentStats,manaEquipmentAbility,manaEquipmentCost,equipmentManaBudget,equipmentResources,ENCHANT_RESOURCE_COST} from '../equipment_mana_ratio.js';
import {awakeningScale,equippedAncients} from '../ancient_awakening.js';
import {eventEquipmentAbility} from '../event_equipment.js';
const weapons=equipmentCatalog().filter(d=>d.slot==='weapon'&&!d.id.startsWith('anc_')),byId=new Map(weapons.map(d=>[d.id,d]));
const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const context={manaEquipmentStats,manaEquipmentAbility,manaEquipmentCost,equipmentManaBudget,ENCHANT_RESOURCE_COST,awakeningScale,equippedAncients,eventEquipmentAbility,getEquipTemplate:id=>byId.get(id),MISS_DAMAGE_RATIO:.5,EQUIP_SLOTS:['weapon','armor','accessory']};vm.createContext(context);
for(const [start,end] of [['const RARITY_MULTI =','function rarityLabelHtml('],['function equippedAbilities(){','const SKILL_DB = ['],['function equipBonus(){','function rollAncientBlueprintReward('],['function effectiveAtk(){','function skillMpCost('],['const BALANCE = {','function applyMissPenalty(']])vm.runInContext(source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))),context);
context.totalStat=key=>(context.G.player[key]||0)+(context.equipBonus()[key]||0);
const abilityNames={crit_up:'会心率+10%',guard:'被ダメージ−5%',mp_save:'消費MP−1',power:'攻撃力+15%',lifesteal:'HP吸収15%'};
const rows=[];
function evaluate(db,rarity,ability,level=1){
 context.G={player:{atk:50,spd:10},ownedEquips:[{uid:1,id:db.id,rarity,ability,awakeningLevel:level}],equipment:{weapon:{uid:1}}};
 const stats=JSON.parse(JSON.stringify(context.equipBonus()));const effects=[...context.equippedAbilities()];const cost=context.equipCost(db,rarity);const ordinary=rarity!==6;
 const activeAbility=effects[0]||null;const enchantSP=ENCHANT_RESOURCE_COST[activeAbility]||0;
 const budget=ordinary?equipmentManaBudget(db,rarity):null;
 const row={id:db.id,name:db.name,icon:db.emoji,rarity,awakeningLevel:rarity===6?level:null,cost,stats,ability:activeAbility,abilityLabel:abilityNames[activeAbility]||'なし',budget,statSP:equipmentResources(stats),enchantSP,overspend:ordinary&&!db.assist?equipmentResources(stats)+enchantSP-budget:null,helper:!!db.assist,legacyOnly:!db.ability&&rarity>=3&&rarity<5&&!!activeAbility,scenarios:[]};
 for(const atk of [20,50,100,200])for(const def of [0,20,60]){
  context.G.player.atk=atk;
  const effective=context.effectiveAtk(),chance=Math.min(.95,context.calcSpdRate(context.totalStat('spd'))+(effects.includes('crit_up')?.10:0)+context.ancientCritBonus());
  const hit=context.basicAttackDamage(effective*(db.id==='anc_w1'?.8:1),def),hits=db.id==='anc_w1'?2:1;
  const damage=hit*hits*(1+chance); // critMult is 2, actual implementation verified below.
  row.scenarios.push({baseAtk:atk,baseSpd:10,enemyDef:def,effectiveAtk:effective,critChance:chance,expectedDamage:+damage.toFixed(3),hitCount:hits});
 }
 return row;
}
assertEqual(vm.runInContext('BALANCE.critMult',context),2);
function assertEqual(a,b){if(a!==b)throw new Error('Combat formula changed; refresh audit model');}
for(const db of weapons){
 for(let rarity=1;rarity<=5;rarity++){
  const candidates=db.assist?[null]:db.ability?[db.ability]:rarity<3?[null]:[null,...Object.keys(abilityNames)];
  const seen=new Set();for(const requested of candidates){const effective=manaEquipmentAbility(db,rarity,requested);if(seen.has(effective))continue;seen.add(effective);rows.push(evaluate(db,rarity,requested));}
 }
}
const violations=rows.filter(r=>r.overspend>1e-9);
if(violations.length)throw new Error('Unexpected budget violations: '+JSON.stringify(violations));
const baseScenario=r=>r.scenarios.find(s=>s.baseAtk===50&&s.enemyDef===20);
const efficiencyRanking=rows.filter(r=>!r.helper).map(r=>{const scenario=r.scenarios.find(s=>s.baseAtk===100&&s.enemyDef===0);return {name:r.name,rarity:r.rarity,cost:r.cost,ability:r.abilityLabel,legacyOnly:r.legacyOnly,expectedDamage:scenario.expectedDamage,gainPerCost:+((scenario.expectedDamage-105)/r.cost).toFixed(3)};}).sort((a,b)=>b.gainPerCost-a.gainPerCost);
// Confirm overkill absorption by running the actual damage and healing functions
// against a disposable 1-HP enemy. No real save or browser state is involved.
const overkill={G:{player:{hp:10}},battle:{enemy:{hp:1,name:'検証用',isRaid:false}},explore:{},equippedAbilities:()=>new Set(['lifesteal']),totalMaxHp:()=>100,blog(){},updateBattleBars(){},setTimeout:fn=>fn(),getEnemyCanvasCoords:()=>({frame:null}),activeEnemySprite:()=>null,playPlayerAttackAnim(){},SM:{play(){}},CM:{running:false}};
vm.createContext(overkill);
vm.runInContext(source.slice(source.indexOf('function handlePostDamageEffects('),source.indexOf('function dealAncientDoubleStrike(')),overkill);
vm.runInContext(source.slice(source.indexOf('function dealToEnemy('),source.indexOf('function triggerBossPhase2(')),overkill);
overkill.dealToEnemy(100,'検証',false,()=>{});
const overkillAbsorption={enemyHpBefore:1,nominalDamage:100,actualHpLost:1,playerHpBefore:10,playerHpAfter:overkill.G.player.hp,healed:overkill.G.player.hp-10};
assertEqual(overkillAbsorption.healed,15);
const result={scope:{weaponTemplates:weapons.length,ordinaryTemplates:weapons.filter(d=>!d.id.startsWith('anc_')).length,ancientTemplates:weapons.filter(d=>d.id.startsWith('anc_')).length,variants:rows.length,excludes:'★6の古代武器は全て除外。個別の管理者カスタム装備・個人セーブは参照しない。未排出レア度と旧保存品の効果も含めた定義上の比較。'},method:{source:'実際のcalcEquipStat/equipBonus/equipCost/effectiveAtk/calcSpdRate/ancientCritBonus/basicAttackDamageをVMで実行',scenarios:'基礎ATK20/50/100/200、SPD10、敵DEF0/20/60。正解した通常攻撃1回の期待値。同一効果は重複せず、他スロットの効果なし。敵HP十分、HP吸収/回避/MP節約/スキル/レイド倍率はこのダメージ値に含めない。',critMult:2,rankings:'実戦OPの断定ではなく、同コスト比較と効果実装からの要注意候補。'},formalBudgetViolations:violations.length,overkillAbsorption,efficiencyRanking,rows};
writeFileSync('equipment_weapon_audit.json',JSON.stringify(result,null,2));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const notes=[
 ['マナレシオの数式超過は0件','通常・限定・イベント武器のみで調査。数値と効果SPは規定予算内だった。ただし、割合効果の価格が実際の強さを十分に表しているかは別問題。★6の古代武器は調査対象に含めない。'],
 ['マナレシオ要注意：木の剣★3〜4のちからのかご（旧保存品）','★3はcost2・攻撃+0でも合計攻撃+15%が有効。★4はcost3・攻撃+3。6SPで基礎攻撃や他装備分にも効くため、高攻撃のキャラほど割安。現行の通常ガチャでは★3〜4に新規付与しないが、旧保存品では起こり得る。'],
 ['マナレシオ要注意：木の剣★5の会心・ちからのかご','会心ならcost5・攻撃+11、ちからのかごならcost5・攻撃+7。会心は2SPで通常攻撃+10ポイント、スキル+8ポイント。合計攻撃100・敵DEF0なら通常会心分だけで期待値約+10/回。ちからのかごは6SPで合計攻撃+15%。どちらも武器の加算攻撃だけに作用する効果ではない。'],
 ['マナレシオ要注意：マグマの剣','★4はcost15・攻撃+23・素早さ+4、ちからのかご固定。6SPの固定価格で合計攻撃+15%なので、キャラが育つほど割安。ただし武器単体の数値だけで明確な過剰とは断定しない。'],
 ['マナレシオ要注意：月灯りのランタン杖','せつやくの心得は2SPだが、スキルを繰り返すたびにMPを1節約する。消費MP3のスキルならMP30で10回→15回。長期戦で固定のMP+2より価値が大きくなる。ただし消費MP1のスキルには効果がない。'],
 ['実戦で最優先：HP吸収付き木の剣★5・月影の短剣','木の剣★5はcost5・攻撃+1でも、武器分以外を含む与ダメージからHPを吸収する。月影の短剣★5はcost21・攻撃+26・素早さ+7で吸収固定。通常の単発攻撃と多段スキルでは、敵残HPを超えた名目ダメージまで回復計算に入ることを実処理で確認。敵残HP1・名目ダメージ100でHP15回復した。イベントレイドは実際に削ったHP基準で処理が不統一。数値調整より先に確認するべき点。'],
 ['実戦で要注意：高基礎攻撃キャラ＋低コスト割合効果武器','基礎ATK100・SPD10・敵DEF0の例では、武器なしの通常攻撃期待値105に対し、旧保存の木の剣★3ちからのかごは120.75（cost2）、現行で入手可能な木の剣★5同効果は129.15（cost5）。強い武器だからではなく、低costで全体を強化する効果の組み合わせが突出する。'],
 ['生の攻撃値が最大でも過剰とは限らない：魔王の覇剣','★5会心付きは攻撃+169・cost84。単発火力は高いが要求コストも高いので、数値の大きさだけで強すぎるとは判定しない。通常・限定武器のエンチャントなし基礎数値だけに、予算を超える突出は見つからなかった。']
];
writeFileSync('equipment_weapon_audit.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>全武器の強さ監査</title><style>body{background:#111827;color:#e5e7eb;font:15px/1.7 system-ui;margin:24px}h1,h2{color:#fcd34d}h1{font-size:24px}h2{font-size:18px}a{color:#93c5fd}.note{color:#cbd5e1}.wrap{overflow:auto;max-height:70dvh}table{border-collapse:separate;border-spacing:0;width:100%;font-size:13px}th,td{border:1px solid #374151;padding:9px;text-align:left;vertical-align:top}th{position:sticky;top:0;background:#1f2937}img{width:48px;height:48px;object-fit:contain;image-rendering:pixelated}.name{display:flex;align-items:center;gap:8px;min-width:210px}small{color:#9ca3af;display:block}</style><h1>通常・限定・イベント武器の強さ監査（★6除外）</h1><p>${weapons.length}種類・${rows.length}パターンを調査。通常武器の計算上の予算超過は<b>0件</b>。数値変更はしていません。</p><p class="note">${esc(result.scope.excludes)} ${esc(result.method.scenarios)}</p><p><a href="equipment_mana_ratio_report.html">旧・最新ステータス比較へ</a> ／ <a href="equipment_weapon_audit.json" download>全計算データJSON</a></p>${notes.map(([title,body])=>'<h2>'+esc(title)+'</h2><p>'+esc(body)+'</p>').join('')}<h2>低コストで全体を強化する組み合わせの比較例</h2><p>基礎ATK100・SPD10・敵DEF0、他スロット効果なし、正解した通常攻撃。武器なし期待値105からの増加量をcostで割った値。旧保存品と未排出レア度も含むので、新規排出の強さランキングとは区別してください。</p><div class="wrap"><table><thead><tr><th>武器</th><th>★</th><th>cost</th><th>効果</th><th>期待ダメージ</th><th>増加/cost</th><th>旧保存品のみ</th></tr></thead><tbody>${efficiencyRanking.slice(0,15).map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+r.rarity+'</td><td>'+r.cost+'</td><td>'+esc(r.ability)+'</td><td>'+r.expectedDamage+'</td><td>'+r.gainPerCost+'</td><td>'+(r.legacyOnly?'旧効果付きのみ':'')+'</td></tr>').join('')}</tbody></table></div><h2>全武器・全評価パターン</h2><div class="wrap"><table><thead><tr><th>武器</th><th>★ / 覚醒</th><th>cost</th><th>加算能力</th><th>効果</th><th>能力SP＋効果SP / 予算</th><th>期待ダメージ（同条件）</th></tr></thead><tbody>${rows.map(r=>'<tr><td><div class="name">'+(r.icon.startsWith('assets/')?'<img src="'+esc(r.icon)+'" alt="">':esc(r.icon))+esc(r.name)+'</div></td><td>'+r.rarity+(r.awakeningLevel?' / Lv'+r.awakeningLevel:'')+'</td><td>'+r.cost+'</td><td>'+esc(Object.entries(r.stats).filter(([,v])=>v).map(([k,v])=>k+'+'+v).join(' / ')||'補助専用')+'</td><td>'+esc(r.abilityLabel)+(r.legacyOnly?'<small>旧保存品の効果</small>':'')+'</td><td>'+(r.rarity===6?'★6例外':r.helper?'補助専用':r.statSP+' + '+r.enchantSP+' / '+r.budget)+'</td><td>'+baseScenario(r).expectedDamage+'</td></tr>').join('')}</tbody></table></div></html>`);
console.log(JSON.stringify({scope:result.scope,formalBudgetViolations:0,overkillAbsorption,efficiencyRanking:efficiencyRanking.slice(0,5)},null,2));
