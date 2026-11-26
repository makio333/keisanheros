const isMonthKey = value => {
  const match = /^(\d{4})(\d{2})$/.exec(String(value || ''));
  return !!match && Number(match[2]) >= 1 && Number(match[2]) <= 12;
};

const JST_MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit'
});

export function raidJstMonthKey(timestamp = Date.now()) {
  const date = new Date(Number(timestamp));
  if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid raid timestamp');
  const parts = Object.fromEntries(JST_MONTH_FORMATTER.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}${parts.month}`;
}

export function raidMonthlyBossId(periodKey, bossLevel) {
  if (!isMonthKey(periodKey) || !Number.isSafeInteger(bossLevel) || bossLevel < 1 || bossLevel > 9999) {
    throw new TypeError('Invalid monthly raid identity');
  }
  return `boss_m${periodKey}_${bossLevel}`;
}

export function raidMonthlyGlobalDocId(periodKey) {
  if (!isMonthKey(periodKey)) throw new TypeError('Invalid monthly raid period');
  return `month_${periodKey}`;
}

export function parseRaidMonthlyBossId(bossId) {
  const match = /^boss_m(\d{6})_(\d{1,4})$/.exec(String(bossId || ''));
  if (!match || !isMonthKey(match[1])) return null;
  return { periodKey: match[1], bossLevel: Number(match[2]) };
}

export function raidGlobalDocIdForBossId(bossId) {
  const monthly = parseRaidMonthlyBossId(bossId);
  return monthly ? raidMonthlyGlobalDocId(monthly.periodKey) : 'currentBoss';
}

export function isValidRaidBossId(bossId) {
  return bossId === 'boss1' || /^boss_\d{1,8}(?:_final_\d{10,16})?$/.test(String(bossId || '')) || !!parseRaidMonthlyBossId(bossId);
}

// Ranking seasons change independently of the continuing November boss campaign.
export const RAID_SEASONS_START_AT=Date.parse('2026-12-01T00:00:00+09:00');
export const RAID_FOUNDER_PERIOD='202611';
export function raidActiveGlobalDocId(timestamp=Date.now()){
 return timestamp>=Date.parse('2026-11-01T00:00:00+09:00')?raidMonthlyGlobalDocId(timestamp>=RAID_SEASONS_START_AT?RAID_FOUNDER_PERIOD:raidJstMonthKey(timestamp)):'currentBoss';
}
export function raidRankingPeriodAllowed(period,timestamp=Date.now()){
 return isMonthKey(period)&&period>=RAID_FOUNDER_PERIOD&&period<=raidJstMonthKey(timestamp);
}
export function raidRankingSeason(period=raidJstMonthKey(Date.now())){
 if(!isMonthKey(period))throw new TypeError('Invalid ranking season');
 const year=Number(period.slice(0,4)),month=Number(period.slice(4));
 const startsAt=Date.UTC(year,month-1,1)-9*3600000,endsAt=Date.UTC(year,month,1)-9*3600000;
 return {periodKey:period,label:period===RAID_FOUNDER_PERIOD?'初代ランキング':`${year}年${month}月ランキング`,startsAt,endsAt,boostStartsAt:endsAt-7*86400000};
}

export const RAID_MONTH_END_ATTACK_MULTIPLIER=2;
export function raidMonthEndBoost(timestamp=Date.now()){
 const season=raidRankingSeason(raidJstMonthKey(timestamp));
 const active=timestamp>=Date.parse('2026-11-24T00:00:00+09:00')&&timestamp>=season.boostStartsAt&&timestamp<season.endsAt;
 return {...season,active,multiplier:active?RAID_MONTH_END_ATTACK_MULTIPLIER:1};
}
