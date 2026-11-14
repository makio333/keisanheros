// Christmas's only event currency. This module has no browser or storage side effects.
export const CHRISTMAS_EVENT_ID='christmas_2026';
export const CHRISTMAS_PRESENT_ICON='assets/christmas/present_box_token_v1.png';
export const CHRISTMAS_STORY_BANNER='assets/christmas/present_rescue_banner_v2.png';
const CHRISTMAS_EXCHANGE_EQUIPMENT=[
 {id:'christmas_exchange_candy_sword',name:'サンタのキャンディソード',costs:[10,20,30],ability:'crit_up'},
 {id:'christmas_exchange_aurora_mantle',name:'聖夜のオーロラマント',costs:[15,25,40],ability:'guard'},
 {id:'christmas_exchange_winter_charm',name:'工房の冬星チャーム',costs:[15,25,40],ability:'mp_save'},
];
export const CHRISTMAS_EXCHANGE_PRIZES=Object.freeze([
 ...[2,3,4].flatMap(rarity=>CHRISTMAS_EXCHANGE_EQUIPMENT.map(e=>({id:rarity===4?e.id:`${e.id}_r${rarity}`,equipId:e.id,kind:'equip',name:e.name,cost:e.costs[rarity-2],rarity,ability:e.ability}))),
 {id:'christmas_santa_helper',kind:'skin',name:'サンタの護衛',cost:80},
 {id:'christmas_star_cartographer',kind:'skin',name:'星読みの地図師',cost:100},
 {id:'christmas_santa_workshop',kind:'background',name:'サンタの工房',cost:60},
 {id:'christmas_frozen_lake',kind:'background',name:'月明かりの凍った湖',cost:60},
 {id:'christmas_holly_star',kind:'decoration',name:'聖夜のヒイラギ飾り',cost:50},
]);
const integer=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
export const christmasPresentBalance=game=>integer(game?.christmasPresents);
export const christmasExchangeOnly=id=>CHRISTMAS_EXCHANGE_PRIZES.some(p=>p.id===id||p.equipId===id);
export function christmasEventState(game){
 game.christmasEvent ||= {};
 return game.christmasEvent[CHRISTMAS_EVENT_ID] ||= {recoveredTotal:0,clears:0,collectedPrizes:[]};
}
export function recoverChristmasPresents(game,run,enemy,encounter,random=Math.random){
 if(!game || !run?.isChristmas || !encounter || encounter.christmasPresentsGranted)return null;
 encounter.christmasPresentsGranted=true;
 const randomValue=Number(random());
 const roll=Number.isFinite(randomValue)?Math.max(0,Math.min(.999999,randomValue)):0;
 const normalCount=enemy?.isBoss?10+Math.floor(roll*6):2+Math.floor(roll*3);
 const count=run.christmasReplay?Math.max(1,Math.floor(normalCount/3)):normalCount;
 game.christmasPresents=christmasPresentBalance(game)+count;
 const state=christmasEventState(game);
 state.recoveredTotal=integer(state.recoveredTotal)+count;
 run.christmasRecovered=integer(run.christmasRecovered)+count;
 return {kind:'christmas-present',id:'christmas-present',name:'取り返したプレゼントボックス',icon:CHRISTMAS_PRESENT_ICON,count};
}
export function christmasPrizeOwned(game,prize){
 if(!game || !prize)return false;
 if(prize.kind==='equip')return (game.ownedEquips || []).some(e=>e.id===(prize.equipId||prize.id)&&e.rarity===prize.rarity);
 const field={skin:'unlockedSkins',background:'unlockedAvatarBackgrounds',decoration:'unlockedDecorations'}[prize.kind];
 return (game[field] || []).includes(prize.id) || (prize.kind==='skin'&&game.avatar===prize.id) || (prize.kind==='background'&&game.avatarBackground===prize.id) || (game.christmasEvent?.[CHRISTMAS_EVENT_ID]?.collectedPrizes || []).includes(prize.id);
}
export function exchangeChristmasPrize(game,id){
 const prize=CHRISTMAS_EXCHANGE_PRIZES.find(p=>p.id===id);
 if(!game || !prize)return {ok:false,message:'この景品は交換できません。'};
 if(prize.kind!=='equip'&&christmasPrizeOwned(game,prize))return {ok:false,message:'この限定品は獲得済みです。'};
 if(christmasPresentBalance(game)<prize.cost)return {ok:false,message:'プレゼントボックスが足りません。'};
 if(prize.kind==='equip'){
  game.ownedEquips ||= [];
  game.nextUid=Math.max(integer(game.nextUid),...game.ownedEquips.map(e=>integer(e.uid)+1),1);
  game.ownedEquips.push({uid:game.nextUid++,id:prize.equipId||prize.id,rarity:prize.rarity,ability:prize.ability});
 }else{
  const field={skin:'unlockedSkins',background:'unlockedAvatarBackgrounds',decoration:'unlockedDecorations'}[prize.kind];
  game[field]=[...new Set([...(game[field] || []),prize.id])];
 }
 game.christmasPresents=christmasPresentBalance(game)-prize.cost;
 const state=christmasEventState(game);
 state.collectedPrizes=[...new Set([...(state.collectedPrizes || []),prize.id])];
 return {ok:true,prize,message:`${prize.name}を受け取った！ プレゼントボックス${prize.cost}個を届けました。`};
}

export const CHRISTMAS_ENCOUNTERS_PER_RUN=5;
export const CHRISTMAS_BLACK_SANTA_CHANCE=.2;
export function createChristmasEncounters(monsters,random=Math.random){
 const next=()=>{const value=Number(random());return Number.isFinite(value)?Math.max(0,Math.min(.999999,value)):0;};
 const pool=monsters.filter(m=>!m.isBoss).map(m=>({...m}));
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const result=pool.slice(0,CHRISTMAS_ENCOUNTERS_PER_RUN);
 const santa=monsters.find(m=>m.isBoss);
 if(santa&&result.length&&next()<CHRISTMAS_BLACK_SANTA_CHANCE)result[Math.floor(next()*result.length)]={...santa};
 return result;
}
export function christmasStageAt(stages,base,clears=0,extra=0){
 if(!stages.length)return null;
 const found=stages.findIndex(s=>s.areaId===base?.areaId&&s.stageIndex===base?.stageIndex);
 return stages[Math.min(stages.length-1,Math.max(0,found)+integer(clears)+integer(extra))];
}
