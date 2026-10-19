import { eventEquipmentAbility } from './event_equipment.js';
// Shared, deterministic economy rules for save delivery and raid rewards.
export function applyGiftPayload(game, gift) {
  game.claimedAdminGiftIds ||= [];
  if (game.claimedAdminGiftIds.includes(gift.id)) return false;
  recallGiftPayload(game,gift);
  const gold=Math.max(0,Math.floor(Number(gift.gold)||0));
  const debt=Math.min(gold,Number(game.giftRecallDebts?.[gift.replacesGiftId])||0);
  if(debt)game.giftRecallDebts[gift.replacesGiftId]-=debt;
  game.player.gold=Math.max(0,Number(game.player.gold)||0)+gold-debt;
  game.items ||= []; game.ownedEquips ||= []; game.nextUid ||= 1;
  const tickets={'equip-ten-ticket':'equipGachaTenPullTickets','skin-ticket':'skinGachaTickets','raid-ticket':'raidTickets','halloween-ticket':'halloweenTickets'};
  for(const item of gift.items || []) {
    const count=Math.min(999,Math.max(0,Math.floor(Number(item.count)||0)));
    if(!count || !item.id) continue;
    if(item.kind==='equip') for(let i=0;i<count;i++)game.ownedEquips.push({uid:game.nextUid++,id:item.id,rarity:Math.min(6,Math.max(1,Number(item.rarity)||1)),ability:item.ability || eventEquipmentAbility(item.id)});
    else if(item.kind==='ticket' && tickets[item.id])game[tickets[item.id]]=(Number(game[tickets[item.id]])||0)+count;
    else if(item.kind==='medal')game.questMedals=(Number(game.questMedals)||0)+count;
    else if(item.kind==='decoration')game.unlockedDecorations=[...new Set([...(game.unlockedDecorations||[]),item.id])];
    else {const existing=game.items.find(entry=>entry.id===item.id);if(existing)existing.count+=count;else game.items.push({uid:game.nextUid++,id:item.id,count});}
  }
  game.claimedAdminGiftIds.push(gift.id);
  return true;
}
export function raidResumeStage(lastStage=0) {return Math.max(0,Math.floor(Number(lastStage)||0)-2);}
export function raidRankCoins(rank) {return rank===1?50:rank===2?30:rank===3?15:rank>3?5:0;}
export function raidParticipationCoins(damage) {return Math.ceil(Math.max(0,Number(damage)||0)/4);}

// A replacement is reclaimed once, even when an older browser still has the original grant.
export function recallGiftPayload(game,gift) {
  const id=gift.replacesGiftId;
  if(!id || !gift.recallOriginal || game.recalledAdminGiftIds?.includes(id) || !game.claimedAdminGiftIds?.includes(id))return false;
  const gold=Math.max(0,Number(gift.gold)||0), available=Math.max(0,Number(game.player.gold)||0);
  game.player.gold=Math.max(0,available-gold);
  game.giftRecallDebts ||= {};game.giftRecallDebts[id]=Math.max(0,gold-available);
  game.recalledAdminGiftIds=[...(game.recalledAdminGiftIds || []),id];return true;
}
