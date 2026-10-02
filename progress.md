Original prompt: 新しいプレイヤーの画像を２枚類追加して。キャラクターのイメージはすでにある８種のうち、ピクセルじゃない解像度の高い方のデザインイメージをそのままに新たに２ち男女一人ずつ生成して、これを初期でも選べるように

## 2026-10-02
- Generated two new high-resolution, non-pixel player character portraits matching the existing `ai_hero_*` style:
  - `assets/characters/ai_hero_spellblade.png`
  - `assets/characters/ai_hero_alchemist.png`
- Copied the same files to `public/assets/characters/` for static asset access.
- Added both new avatars to `HERO_AVATARS` so they appear in the new-game selector and avatar-change modal.
- Changed the new-game selector preview and thumbnails from pixelated rendering to normal image rendering so high-resolution avatars stay smooth.

TODO:
- Done: `npm run build` passed.
- Done: launched the local Vite app and captured selector screenshots:
  - `output/avatar-selector-spellblade-panel.png`
  - `output/avatar-selector-alchemist-panel.png`
  - `output/avatar-selector-spellblade-full.png`
  - `output/avatar-selector-alchemist-full.png`
- Follow-up: removed the generated square backgrounds from the two new avatars, normalized them to centered 1024x1024 transparent PNGs, and changed avatar display CSS from bottom/pixelated rendering to centered high-resolution rendering.
- Verified the transparent spellblade avatar in the selector and home frame:
  - `output/avatar-selector-spellblade-transparent-panel.png`
  - `output/home-avatar-spellblade-transparent-frame.png`
  - `output/home-avatar-spellblade-transparent-full.png`
- Cache fix: added versioned transparent asset filenames and updated `HERO_AVATARS` so existing browsers stop reusing the old same-name background images:
  - `assets/characters/ai_hero_spellblade_transparent.png`
  - `assets/characters/ai_hero_alchemist_transparent.png`
- Verified on the user's open dev server (`http://127.0.0.1:5174/`) that:
  - `/assets/characters/ai_hero_spellblade_transparent.png` is served as a 1024x1024 transparent PNG.
  - `/game.js` contains `assets/characters/ai_hero_spellblade_transparent.png` and no longer points the spellblade avatar at the old same-name background image.
- Upgraded the original four low-resolution avatar PNGs into 1024x1024 transparent high-resolution anime RPG versions while preserving character identity:
  - `assets/characters/hero_female_1_hd.png`
  - `assets/characters/hero_male_1_hd.png`
  - `assets/characters/hero_male_2_hd.png`
  - `assets/characters/hero_female_2_hd.png`
- Re-extracted the four existing AI avatars into cleaner 1024x1024 transparent PNGs:
  - `assets/characters/ai_hero_boy_clean.png`
  - `assets/characters/ai_hero_youngman_clean.png`
  - `assets/characters/ai_hero_girl_clean.png`
  - `assets/characters/ai_hero_woman_clean.png`
- Updated `HERO_AVATARS` to use the HD/clean filenames. Verified all ten active avatar images are 1024x1024 with transparent corners, `npm run build` passes, and `http://127.0.0.1:5174/game.js` contains the new HD/clean references.
- Captured selector verification screenshot: `output/avatars-hd-selector-5174.png`.
- Added raid art assets in pixel-art style:
  - `assets/raid/raid_bg_magma_pixel.jpg`
  - `assets/raid/raid_boss_dark_bahamut_blueflame_pixel_v2.png`
- The raid boss is a black/red front-facing pixel-art dragon with claws raised and blue flames, saved as a centered 1024x1024 transparent PNG and copied to `public/assets/raid/`.
- Updated the raid battle to use the magma background and blue-flame dragon sprite instead of the emoji display.
