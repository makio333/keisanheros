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
