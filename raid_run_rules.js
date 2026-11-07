// Per-save raid records. Result rendering and cloud retries never grant rewards.
export function validRaidDamage(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER
    ? Math.floor(value) : null;
}
export function raidDamageCoins(value) {
  const damage=validRaidDamage(value);
  return damage === null ? 0 : Math.floor(damage/10);
}
export function raidInitialHp(monsterId) { return monsterId === 'moonWraith' ? 50000 : 1000; }
export function raidConfiguredHp(data={},monsterId) {
  if(monsterId==='moonWraith' && data.monsterId!=='moonWraith')return raidInitialHp(monsterId);
  return Number.isSafeInteger(data.maxHp) && data.maxHp>0 ? data.maxHp : raidInitialHp(monsterId);
}
export function grantRaidRun(game,{id,damage,bossId}={}) {
  const amount=validRaidDamage(damage);
  if(!game || typeof id!=='string' || !id || id.length>160 || amount===null)return null;
  game.raidRunRewards ||= {};
  if(Object.hasOwn(game.raidRunRewards,id))return {...game.raidRunRewards[id],applied:false};
  const coins=raidDamageCoins(amount);
  const receipt={damage:amount,coins,bossId:bossId || '',applied:true};
  game.raidCoins=(validRaidDamage(game.raidCoins) ?? 0)+coins;
  game.raidBestSingleDamage=Math.max(validRaidDamage(game.raidBestSingleDamage) ?? 0,amount);
  game.raidRunRewards[id]=receipt;
  return receipt;
}
