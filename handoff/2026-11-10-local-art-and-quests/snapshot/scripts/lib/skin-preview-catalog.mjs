// Use the live roster without starting the game or loading player saves.
export function skinPreviewCatalogSource(source) {
  const start = source.indexOf('const HERO_AVATARS = [');
  const end = source.indexOf('\n];', start);
  if (start < 0 || end < start) throw Error('Skin roster boundaries missing');
  return `import {GHOST_RAID_SKIN} from '/ghost_raid_content.js';
import {QUEST_MEDAL_SKIN} from '/quest_medal_exclusives.js';
${source.slice(start, end + 3)}
export {HERO_AVATARS};`;
}
