export const AWAKENING_MAX_LEVEL = 50;
export function isAncientEquipment(equip) { return Number(equip?.rarity) === 6; }
export function awakeningExpNext(level) { return Math.round(30 * Math.pow(level, 1.35)); }
export function awakeningState(equip) {
  let level = Math.max(1, Math.min(50, Math.floor(Number(equip?.awakeningLevel) || 1)));
  let exp = Math.max(0, Math.floor(Number(equip?.awakeningExp) || 0));
  if (!Number.isFinite(exp)) exp = 0;
  while (level < 50 && exp >= awakeningExpNext(level)) { exp -= awakeningExpNext(level); level++; }
  return { level, exp:level === 50 ? 0 : exp, next:level === 50 ? 0 : awakeningExpNext(level), scale:0.2 + 0.8 * (level - 1) / 49 };
}
export function awakeningScale(equip) { return isAncientEquipment(equip) ? awakeningState(equip).scale : 1; }
export function equippedAncients(game) {
  const seen = new Set();
  return Object.values(game?.equipment || {}).flatMap(ref => {
    const equip = game?.ownedEquips?.find(item => item.uid === ref?.uid);
    if (!isAncientEquipment(equip) || seen.has(equip.uid)) return [];
    seen.add(equip.uid); return [equip];
  });
}
export function grantAwakeningExp(game, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return [];
  return equippedAncients(game).filter(equip => awakeningState(equip).level < 50).map(equip => {
    const before = awakeningState(equip);
    const after = awakeningState({ awakeningLevel:before.level, awakeningExp:before.exp + Math.floor(amount) });
    equip.awakeningLevel = after.level; equip.awakeningExp = after.exp;
    return { uid:equip.uid, id:equip.id, amount:Math.floor(amount), before, after };
  });
}
// Explicit operator action only: never infer eligibility from missing progression fields.
export function masterExistingAncients(game) {
  let count = 0;
  for (const equip of game?.ownedEquips || []) if (isAncientEquipment(equip)) {
    equip.awakeningLevel = 50; equip.awakeningExp = 0; count++;
  }
  return count;
}
