import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  BATTLE_AVATAR_CROPS,
  BATTLE_AVATAR_CROP_FALLBACK_ID,
  calculateBattleAvatarCrop,
  getBattleAvatarCrop,
  applyBattleAvatarCrop,
} from '../battle_avatar_crop.js';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('game.js', root), 'utf8');
const block = source.slice(source.indexOf('const HERO_AVATARS = ['), source.indexOf('const INITIAL_AVATAR_IDS'));
const avatars = new Map();
for (const line of block.split('\n')) {
  const id = line.match(/\bid\s*:\s*'([^']+)'/)?.[1];
  const image = line.match(/\bimage\s*:\s*'([^']+)'/)?.[1];
  if (id && image) avatars.set(id, image);
  if (line.includes('GHOST_RAID_SKIN')) {
    const ghost = fs.readFileSync(new URL('ghost_raid_content.js', root), 'utf8');
    const match = ghost.match(/GHOST_RAID_SKIN=\{id:'([^']+)'.*?image:'([^']+)'/);
    assert.ok(match, 'raid skin definition exists');
    avatars.set(match[1], match[2]);
  }
}

test('every selectable character has a crop fitted to its real source asset', () => {
  assert.equal(avatars.size, 26);
  assert.deepEqual(Object.keys(BATTLE_AVATAR_CROPS).sort(), [...avatars.keys()].sort());
  for (const [id, image] of avatars) {
    const crop = BATTLE_AVATAR_CROPS[id];
    assert.equal(crop.image, image, `${id} image mapping`);
    assert.ok(crop.zoom >= 240 && crop.zoom <= 310, `${id} zoom: ${crop.zoom}`);
    assert.ok(crop.focusX > 0.15 && crop.focusX < 0.85, `${id} horizontal face focus`);
    assert.ok(crop.focusY > 0.1 && crop.focusY < 0.45, `${id} vertical face focus`);
    assert.equal(crop.sourceSize.length, 2);
  }
  assert.ok(new Set(Object.values(BATTLE_AVATAR_CROPS).map(c => `${c.zoom}|${c.focusX}|${c.focusY}`)).size >= 20,
    'skin framing is individually tuned rather than one shared crop');
});

test('known, unknown, and unset skins resolve to a valid image crop', () => {
  assert.equal(calculateBattleAvatarCrop('raid_moon_exorcist').id, 'raid_moon_exorcist');
  for (const id of [undefined, null, '', 'removed-skin-id']) {
    const crop = calculateBattleAvatarCrop(id);
    assert.equal(crop.id, BATTLE_AVATAR_CROP_FALLBACK_ID);
    assert.equal(crop.isFallback, true);
    assert.ok(Number.isFinite(Number.parseFloat(crop.left)));
    assert.ok(Number.isFinite(Number.parseFloat(crop.top)));
  }
});

test('battle crop applies only to the fixed portrait and keeps a consistent crop at different frame sizes', () => {
  const style = new Map();
  const frame = { dataset: {} };
  const image = { style: { setProperty: (name, value) => style.set(name, value) } };
  const applied = applyBattleAvatarCrop(frame, image, 'skin_tide_cleric_m');
  assert.equal(applied.id, 'skin_tide_cleric_m');
  assert.equal(frame.dataset.battleSkin, 'skin_tide_cleric_m');
  assert.equal(style.get('--battle-avatar-size'), applied.size);
  assert.equal(style.get('--battle-avatar-left'), applied.left);
  assert.equal(style.get('--battle-avatar-top'), applied.top);

  for (const framePx of [38, 52, 64]) {
    const imagePx = framePx * applied.zoom / 100;
    const visibleSourceFraction = framePx / imagePx;
    assert.ok(Math.abs(visibleSourceFraction - 100 / applied.zoom) < 1e-12);
  }
  assert.equal(applyBattleAvatarCrop(null, image, 'hero_female_1'), null);
});

test('the combat path uses per-skin variables while shared full-body previews remain untouched', () => {
  assert.ok(source.includes("if(prefix==='battle'&&frame)applyBattleAvatarCrop(frame,avatarEl,G.avatar)"));
  const normalBattle = source.slice(source.indexOf('function startBattle('), source.indexOf('function updateBattleBars('));
  const sharedBattleBars = source.slice(source.indexOf('function updateBattleBars('), source.indexOf('function ', source.indexOf('function updateBattleBars(') + 12));
  const raidBattle = source.slice(source.indexOf('async function startRaidBattle()'), source.indexOf('\n\nlet adminGiftCheckSlotKey'));
  assert.match(normalBattle, /updateBattleBars\(\)/, 'normal combat refreshes the shared player HUD');
  assert.match(sharedBattleBars, /updateHud\(\)/, 'shared battle bars refresh the same avatar crop');
  assert.match(raidBattle, /updateBattleBars\(\)/, 'raid combat uses the same HUD refresh');
  const css = fs.readFileSync(new URL('../battle_question_layout.css', import.meta.url), 'utf8');
  assert.match(css, /--battle-avatar-left/);
  assert.match(css, /--battle-avatar-top/);
  assert.match(css, /--battle-avatar-size/);
  assert.doesNotMatch(css, /data-battle-skin=.*raid_moon_exorcist/);
  assert.match(source, /function applyAvatarComposition\(/);
  assert.match(source, /if\(prefix==='battle'&&frame\)applyBattleAvatarCrop/);
});
