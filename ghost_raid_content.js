// Local balance proposal. Prices and base stats for the Moon Wraith raid live here.
export const GHOST_RAID_BACKGROUND={id:'raid_moon_court',name:'月影の幽宮',image:'assets/raid/moon_court.png',color:'#1d2546',rewardSource:'raid'};
export const GHOST_RAID_SKIN={id:'raid_moon_exorcist',name:'月守りの祓魔師',gender:'male',job:'祓魔師',desc:'月の護符と霊灯を携え、悪霊に立ち向かう勇者',image:'assets/raid/spirit_guardian.png',gachaOnly:true,rewardSource:'raid'};
export const GHOST_RAID_FRAME={id:'raid_moon_frame',name:'月影と鬼火のフレーム',image:'assets/raid/moon_frame.png',source:'raid'};
// The coin-shop frame above remains available to existing and future buyers.
// Monthly participation earns a separate, visually distinct commemorative mark.
export const GHOST_RAID_DEFEAT_DECORATION={id:'raid_moon_defeat_mark',name:'幽霊王討伐の証',image:'assets/raid/moon_defeat_mark.svg',source:'raid'};
export const GHOST_RAID_EQUIPMENT=[
 {id:'raid_moon_blade',name:'月封じの剣',slot:'weapon',opTier:'add3',stat:{atk:6,spd:1},cost:5,fixedCost:true,emoji:'assets/raid/moon_blade.png',ability:'crit_up'},
 {id:'raid_moon_mantle',name:'霊護りの外套',slot:'armor',opTier:'add3',stat:{def:5,hp:10},cost:5,fixedCost:true,emoji:'assets/raid/moon_mantle.png',ability:'guard'},
 {id:'raid_moon_charm',name:'魂灯のお守り',slot:'accessory',opTier:'add2',stat:{mp:8,spd:2},cost:4,fixedCost:true,emoji:'assets/raid/moon_charm.png',ability:'mp_save'},
];
export const GHOST_RAID_EQUIPMENT_PRICES={2:[60,60,60],3:[100,100,100],4:[180,180,180]};
export const GHOST_RAID_PRIZES=[
 ...[4,2,3].flatMap(rarity=>GHOST_RAID_EQUIPMENT.map((item,i)=>({id:rarity===4?item.id:`${item.id}_r${rarity}`,equipId:item.id,name:item.name,kind:'equip',cost:GHOST_RAID_EQUIPMENT_PRICES[rarity][i],rarity,ability:item.ability}))),
 {id:GHOST_RAID_BACKGROUND.id,name:GHOST_RAID_BACKGROUND.name,kind:'background',cost:400},
 {id:GHOST_RAID_SKIN.id,name:GHOST_RAID_SKIN.name,kind:'skin',cost:600},
 {id:GHOST_RAID_FRAME.id,name:GHOST_RAID_FRAME.name,kind:'decoration',cost:240},
];
export function ownsRaidPrize(game,prize) {
 if(!game||!prize)return false;
 if((game.raidExchangeClaims||[]).includes(prize.id))return true;
 if(prize.kind==='equip')return (game.ownedEquips||[]).some(e=>e.id===(prize.equipId||prize.id)&&(e.rarity??4)===prize.rarity);
 const field={skin:'unlockedSkins',background:'unlockedAvatarBackgrounds',decoration:'unlockedDecorations'}[prize.kind];
 return !!field && ((game[field]||[]).includes(prize.id) || game[{skin:'avatar',background:'avatarBackground',decoration:'avatarDecoration'}[prize.kind]]===prize.id);
}
export function purchaseRaidPrize(game,prize) {
 if(!game||!prize||!Number.isSafeInteger(prize.cost)||prize.cost<=0||!Number.isSafeInteger(game.raidCoins)||game.raidCoins<prize.cost||ownsRaidPrize(game,prize))return false;
 if(!['equip','skin','background','decoration'].includes(prize.kind))return false;
 game.raidCoins-=prize.cost;
 if(prize.kind==='equip') {game.ownedEquips||=[];game.nextUid=Math.max(1,Number(game.nextUid)||1);game.ownedEquips.push({uid:game.nextUid++,id:prize.equipId||prize.id,rarity:prize.rarity,ability:prize.ability});}
 else {const field={skin:'unlockedSkins',background:'unlockedAvatarBackgrounds',decoration:'unlockedDecorations'}[prize.kind];game[field]=[...new Set([...(game[field]||[]),prize.id])];}
 game.raidExchangeClaims=[...(game.raidExchangeClaims||[]),prize.id];return true;
}
