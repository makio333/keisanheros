const freezeRelease = (label, items) => Object.freeze({
  label,
  items: Object.freeze(items),
});

export const TITLE_RELEASE_INFO = Object.freeze({
  version: '26.11.02.3',
  releaseNumber: 3,
  buildId: 'lh-20261102-r3-e7dd34194215',
  publishedAtUtc: '2026-11-02T03:33:24Z',
  hostingReleaseId: '8daba0b3cfcb5299',
  history: Object.freeze([
    freezeRelease('r3', [
      '算数・国語の文章問題で、問題文や選択肢の色とスクロールを見直しました。',
      '幽霊王レイドのランキングを、ボスごとの累計ダメージ表示に変更しました。次のボスでは新しいランキングが始まり、前のボスの記録は残ります。',
    ]),
    freezeRelease('r2', [
      'プリントの答え合わせで、各問の入力・正解・正誤を見返せるようにしました。古代からの挑戦状も児童用・先生用に分けて印刷できます。',
      '幽霊王の攻撃に氷の演出と効果音を追加し、問題の凍結演出やボスの動きを調整しました。',
    ]),
  ]),
});

export function formatPublishedAtJst(publishedAtUtc = TITLE_RELEASE_INFO.publishedAtUtc) {
  const date = new Date(publishedAtUtc);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid release publication timestamp.');
  const formatted = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return `${formatted} JST`;
}

function jstDateParts(date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
}

export function validateTitleReleaseInfo(info = TITLE_RELEASE_INFO) {
  const version = /^(\d{2})\.(\d{2})\.(\d{2})\.(\d+)$/.exec(info.version || '');
  const build = /^lh-(\d{4})(\d{2})(\d{2})-r(\d+)-([a-f0-9]{12})$/.exec(info.buildId || '');
  const publishedAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(info.publishedAtUtc || '')
    ? new Date(info.publishedAtUtc)
    : null;

  if (!version || !build || !publishedAt || !Number.isFinite(publishedAt.getTime())) {
    throw new Error('Title release metadata must include a valid version, build ID, and UTC publication time.');
  }
  const [, year, month, day, releaseNumber] = build;
  const expectedVersion = `${year.slice(-2)}.${month}.${day}.${releaseNumber}`;
  const publishedJst = jstDateParts(publishedAt);
  const dateMatches = publishedJst.year === year && publishedJst.month === month && publishedJst.day === day;
  if (info.version !== expectedVersion || Number(info.releaseNumber) !== Number(releaseNumber) || !dateMatches) {
    throw new Error('Title version, build ID, release number, and JST publication date do not match.');
  }
  if (!/^[a-f0-9]{16}$/.test(info.hostingReleaseId || '')) {
    throw new Error('Title release metadata must include the matching Firebase Hosting release ID.');
  }
  if (!Array.isArray(info.history) || info.history.length === 0 || info.history[0].label !== `r${releaseNumber}`) {
    throw new Error('Patch notes must start with the current release.');
  }
  if (info.history.some(release => !/^r\d+$/.test(release.label || '') || !Array.isArray(release.items) || release.items.length === 0 || release.items.some(item => typeof item !== 'string' || !item.trim()))) {
    throw new Error('Every patch note release must have a label and at least one note.');
  }
  return true;
}

export function getTitleReleaseManifest(info = TITLE_RELEASE_INFO) {
  validateTitleReleaseInfo(info);
  return Object.freeze({
    version: info.version,
    releaseNumber: info.releaseNumber,
    buildId: info.buildId,
    publishedAtUtc: info.publishedAtUtc,
    publishedAtJst: formatPublishedAtJst(info.publishedAtUtc),
    hostingReleaseId: info.hostingReleaseId,
  });
}
