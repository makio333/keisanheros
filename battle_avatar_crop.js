import manifest from './battle_avatar_crops.json' with { type: 'json' };

export const BATTLE_AVATAR_CROP_FALLBACK_ID = manifest.fallbackId;
export const BATTLE_AVATAR_CROPS = manifest.skins;

export function getBattleAvatarCrop(skinId) {
  const id = Object.hasOwn(BATTLE_AVATAR_CROPS, skinId)
    ? skinId
    : BATTLE_AVATAR_CROP_FALLBACK_ID;
  return { id, ...BATTLE_AVATAR_CROPS[id], isFallback: id !== skinId };
}

export function calculateBattleAvatarCrop(skinId) {
  const crop = getBattleAvatarCrop(skinId);
  const [width, height] = crop.sourceSize;
  const maxDimension = Math.max(width, height);
  const widthRatio = width / maxDimension;
  // object-position:center top centers a portrait's horizontal content while
  // keeping its top edge flush with the square image box.
  const left = 50 - crop.zoom * (crop.focusX * widthRatio + (1 - widthRatio) / 2);
  const top = 50 - crop.zoom * crop.focusY * (height / maxDimension);
  return {
    ...crop,
    size: `${crop.zoom}%`,
    left: `${Number(left.toFixed(4))}%`,
    top: `${Number(top.toFixed(4))}%`,
  };
}

export function applyBattleAvatarCrop(frame, image, skinId) {
  if (!frame || !image) return null;
  const crop = calculateBattleAvatarCrop(skinId);
  image.style.setProperty('--battle-avatar-size', crop.size);
  image.style.setProperty('--battle-avatar-left', crop.left);
  image.style.setProperty('--battle-avatar-top', crop.top);
  frame.dataset.battleSkin = crop.id;
  return crop;
}
