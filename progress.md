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
- Added `public/assets_audio/bgm_raid_boss.mp3` from `BGM SE/BGM/大魔王.mp3` and wired raid battles to play it via `bgm_raid_boss`.
- Fixed raid reward claiming by using the existing `expNext()` level-up function and marking rewards claimed only after applying gold/EXP.
- Added raid boss defeat presentation: low rumble sound, "ゴゴゴゴゴゴ…" text, and a slow sinking animation for the dragon. Enlarged the raid enemy sprite and positioned it lower in the battle window.
- Added hover reading hints for visible kanji in challenge text. Word-problem and kanji challenge displays wrap known kanji words in small tooltip spans so players can actively hover/focus to check readings.
- Added admin save archive management: archived saves are omitted from the continue list, remain visible in admin management with their archive time, and can be restored or permanently deleted. Archiving the active save returns to the title screen. `npm run build` passes.
- Added save-name search and name/recently-played sorting to the admin save manager. Continue-loads now record `lastPlayedAt`; older saves use their last update time as the fallback.
- Added the same save-name search and name/recently-played sort controls directly to the 「つづきから」 save selection screen.
- Changed player HP bars in the home and battle HUDs to stack one segment per 100 HP: red, yellow, green, blue, then purple for further segments. Existing HP numbers and delayed damage ghost bars remain in sync.
- Added a child-friendly raid guide explaining how to attack, what happens when HP runs out, shared boss HP, rankings, and participation rewards.
- Added eight new transparent 1024x1024 skin illustrations across four themes, each with male and female variants and distinct action poses. Female variants use fully covering child-friendly adventurer outfits.
- Added stage reward tracking and display: first clear gives scaled gold/EXP, normal-stage 3-star gives gold and a potion, and area-boss first clear/3-star gives skin gacha tickets. Each milestone is claimed once and marked 「獲得済み」.
- Added a skin gacha with a male/female choice, no duplicate skin unlocks, and gacha-only avatars becoming selectable after they are unlocked.
- Refined the skin gacha pool to the requested fire, water, and forest themes only (three themes x two genders). The selected gender now previews each theme and its owned/locked state before drawing; astral art is kept out of this gacha pool.
- Added two selectable player avatar background skins, 「星明かり」 and 「新緑の木もれ日」, alongside the original background. The selected background is saved with each player and rendered behind avatars at the base, in save-slot cards, and in raid rankings; legacy saves and ranking entries fall back to the original background.
- Reworked the save search/sort controls and avatar background selector styling; added a large composite preview of the equipped character and background. Save-slot background layers are now applied after card creation using the same asset resolver as the base view.
- Added skin inventory migration: each save retains its equipped starting character and equipped background, while other previously selectable characters/backgrounds become unowned. Skin gacha now offers the full gendered character collection and a separate background category, with duplicate-free draws and equip actions.
- Added click-to-enlarge previews to character and background entries in the skin gacha. Character previews are composited over the equipped background; background previews show the equipped character against the selected background.
- Reworked player customization into character/background groups beside a large live composite preview. Selection stays pending until the user opens the bottom-right confirmation panel and confirms the combination.
- Fixed avatar selector layout regressions caused by later generic modal and navigation-button CSS: scoped modal sizing, bounded header/body/footer grid, scrollable sidebar, full-width composite preview, and auto-width footer buttons. Hide floating clock/menu/audio controls during customization so they cannot cover actions on small landscape screens. Verified screenshots at 1366x768, 820x620, 844x390 and 640x420; checked unobstructed close/apply buttons and selection, confirmation, cancel, apply and reopen with no page errors. Local verification server is on port 5175 because 5174 was occupied.
- Confirmed kanji reading hints currently appear in supported challenge/problem text when hovering or keyboard-focusing a marked word/character; the feature is not applied app-wide, and words without dictionary/pool readings are not annotated.
- Added `assets/characters/CHARACTER_ART_RULES.md` as the standard for future character generation: centered transparent 1024-square canvas, matching high-resolution chibi style, varied poses, gender-paired themes, and modest child-friendly clothing.
- Unified all character/background prizes in one duplicate-free 「背景スキンガチャ」. Separate payment actions draw once for 500G or one existing shared ticket; insufficient balances and completed collections never consume currency. Old equipped skins and ticket counts remain usable.
- Added random adventure ticket drops on enemy victory: 10% for normal enemies, 25% for adventure bosses, excluded from raids. Tickets are saved immediately with victory rewards and appear in the item reveal and session/stage drop summaries. Existing milestone tickets remain available.
- Generated the transparent gold-and-emerald title logo with the built-in image generation tool, saved to `assets/ui/background_skin_gacha_logo.png` and its public copy. The prompt is recorded in `assets/ui/BACKGROUND_SKIN_GACHA_ART.md`.
- Redesigned the gacha screen with a full-width starry showcase, the logo above four existing unchanged transparent character images, prominent gold/ticket actions, an expandable prize collection, and a separate equipment/item view. Featured characters support click-to-enlarge too. Verified desktop/compact screenshots, both prize types and payments, reload persistence, all-owned guards, adventure drop thresholds and victory reward integration; no page errors.
- Added a 2.9-second background/skin summon sequence: rotating canvas magic rings, converging gold/emerald streaks, a growing light cross, then animated large composite artwork and a NEW result with existing sound effects. Includes skip, Escape, focus trapping/restoration, immediate prize persistence and duplicate-click protection. Reduced-motion preferences use a short static transition. Verified moving/nonblank canvas pixels, auto reveal, both currencies, skip, equip, reload during summoning, all-owned/insufficient guards and desktop/844x390 screenshots; no page errors. Game-client smoke, production build and diff checks passed.
- Renamed equipment/item gacha to equipment gacha and made every draw equipment-only. Added a generated transparent logo and three gacha-exclusive equipment assets/templates (star sword, phoenix armor, moon charm), featured alongside the standard equipment collection with enlarged previews. Limited equipment is kept out of shops/adventure drops; eligible limited items have a 15% pool chance subject to the existing equipment cost cap. Prices now match UI: 150/750/1400G for 1/6/13 draws. Results save before animations, and guards cover duplicate/cross-gacha draws until summary dismissal.
- Generated four avatar backgrounds (sakura, ocean, sky castle, crystal sanctuary), added to the unowned shared background/skin prize pool, with public copies and existing customization/save/ranking support. Character summon results now omit their opaque background plate; background prizes still show the awarded background. Built-in generation prompts and asset paths recorded in `assets/ui/GACHA_ADDITIONS_ART.md`.
- Verified desktop and compact equipment screenshots, all six image background previews, 1/6/13 equipment-only draws, displayed prices, limited acquisition/template resolution, cost-cap fallback, duplicate guards, character transparency, background equip and reload persistence. No browser page errors; standard game-client smoke, build and diff checks passed. Local server remains at http://127.0.0.1:5175/.
- Redrew the three limited equipment assets as transparent pixel-art sprites using existing `w7.png`, `a7.png`, and `c2.png` style references in the built-in image-generation editor. Preserved equipment IDs, designs, stats and saves; replaced both project/public PNGs and enabled pixelated image rendering for their previews and inventory images. Recorded prompts and the equipment pixel-art rule in `assets/ui/GACHA_ADDITIONS_ART.md`. Inspected desktop/compact screenshots beside standard equipment, reran equipment/background gacha integration checks with no page errors, and passed game-client smoke, build and diff checks.
- Committed the accumulated game updates as `d88bf80`. Push to `https://github.com/makio333/keisanheros.git` (`main`) was rejected by automatic safety review pending explicit destination/payload approval. Asked the user to authorize sending game code, generated art and BGM; no approval received yet. Do not claim it was pushed or retry without approval.
- Removed the landscape-only orientation guard and added orientation-scoped portrait layouts: scrollable save/stage screens, two-column town destinations, stacked battle HUD/problem/keypad, responsive gacha collections/results, stacked customization with a large composite preview, full-width scrollable modals/raid content and readable room/training stat cards. Floating controls move to the top and avoid modal content. Landscape layouts remain intact.
- Added a portrait math tap keypad with digits, delete, clear and answer-specific decimal/fraction/sign symbols. It edits the existing challenge input through its normal input events, suppresses the native phone keyboard, and is created/removed automatically when rotating. Kanji keyboard now stays in document flow; skill/item buttons no longer overlap the problem. Room help tooltips are bounded within the viewport.
- Verified isolated Playwright fixtures at 390x844, 320x568, 768x1024 and landscape 844x390: title, save load, town, customization and confirmation, both gachas, room, raid overview, stage selection, math/kana battles, shops and training. Checked tap input/delete/clear, read-only changes and one keypad across rotations, kana input, reachable submit buttons, no command/input overlap, no horizontal overflow or page errors. Inspected screenshots including battle/customization/small training. Existing equipment/background gacha integration tests, standard game-client smoke, production build and diff checks passed. Local preview remains http://127.0.0.1:5175/. Portrait changes are local and not pushed.
- Added the existing magma battlefield as the participation-only `raid_magma` avatar background (no new art or copied files). Starting an undefeated raid grants it once and immediately saves without changing the equipped background; opening the raid menu backfills saves with existing local participation rankings. The raid menu shows a thumbnail and earned/unearned status; customization lists it separately under raid participation rewards. Excluded it from the gacha prize pool and corrected the locked-background acquisition note. Guarded new raid entry after defeat and replaced the undefined `saveGame()` call in the raid reward confirmation with `save(true)`.
- Verified isolated portrait browser scenarios for entry-only award, persistence before battle completion, duplicate-free repeat participation, manual equip, home/save previews, prior-participant backfill after defeat, no reward for defeated non-participants, unchanged six-background gacha pool and reward-confirmation saving. Inspected reward/customization screenshots; page errors absent. Existing equipment/background gacha tests, standard game-client smoke, production build and diff checks passed.
- Raid concurrency audit: the active game uses only `raid_boss_v1_boss1` localStorage for boss damage/rankings/claims. `window.RaidBossAPI` exists in `firebase_init.js` but is not called by the game. Damage is accumulated locally at battle win/loss, remaining HP is snapshotted at entry, and no last-hit/killer identity or atomic defeat transition is stored. Separate devices have independent raid progress; simultaneous same-origin tabs can show duplicate defeats and lose read-modify-write updates. A shared/server-authoritative raid with atomic/idempotent submissions and one-time defeat/reward settlement remains future work, not implemented in this change.
- Replaced raid win/loss confirmation prompts with a centered, single-action result dialog. The first completed raid displays the existing magma artwork prominently, an acquisition heading and background name; entry still grants/saves the prize but no longer announces it in the start alert. `raidMagmaNoticeSeen` is saved on acknowledgment, so later results show only battle results; existing owners without this flag see the notice at their next completed raid. Both defeat and victory routes persist restored HP and ranking results, support Escape/keyboard focus, reduced motion, and small-screen scrolling. Reset old battle challenge UI before repeat raid entry.
- Verified actual browser battles for low-HP defeat and high-ATK victory, first-result image, no entry popup, one-time acknowledgment, repeat result without artwork, raid navigation and Escape; inspected 390x844, 320x568 and 1366x900 screenshots. Existing participation/inventory tests, game-client smoke, production build and diff check passed. Test-only constant random initially trapped the problem generator in a rejection-sampling loop; limited random control to combat only. Difficulty was discussed, not changed: enemies counterattack on wrong answers; raid ATK 100 produces approximately 150 minus defense damage, so a low-level player can be downed by one mistake. Proposed child-friendly per-attempt success goals and an introductory beatable boss remain design options.
- Moved stage reward badges outside the stage action buttons into sibling rows, with independent accessible print buttons. Desktop/tablet puts first-clear and third-clear rewards to the right; narrow phones place both beneath the stage button. Widened the list and protected stage-name width so rewards cannot compress names into vertical text. Reward badges retain art/name/stats after claiming and add the earned marker. Renamed the ambiguous star-three reward label to `3回クリア`.
- Replaced normal-stage first-clear milestone gold/EXP with a deterministic standard weapon, using existing pixel-art assets. Selection chooses the strongest eligible weapon/rarity (1-3) under `recLv + stageIndex` equipment cost and `2 + recLv + 2 * stageIndex` ATK targets, favoring lower rarity on tied ATK. Area1 examples: wood sword +2, copper sword +4, steel sword +7, fire axe +9, rare steel sword +10, lightning blade +13, Gram +15. Grants inventory only, no forced equipment replacement. New `claims.firstWeapon` stores the granted UID/ID/rarity, allowing legacy first-clear gold claims to receive the replacement weapon once on replay without reclaiming old gold or third-clear rewards. Third-clear gold/hipotion and boss skin-ticket milestones remain unchanged.
- Verified extracted reward logic for every area's nondecreasing weapon strength and cost limits, first-clear/third-clear single awards, unchanged equipped slot, and old-claim catch-up. Browser checks cover external reward DOM, earned markers, legacy pending weapon reward, independent print buttons, loaded assets, stage entry and no horizontal overflow at 1366x900, 844x390, 768x1024, 390x844 and 320x568. Inspected desktop/tablet/phone screenshots; no page errors. Game-client smoke, build and diff checks passed. Local preview remains http://127.0.0.1:5175/.
- Revised normal-stage milestones to first-clear hipotion plus gold and third-clear weapon. Large icon-only rewards now reuse the shared equipment rarity frames and shared item/equipment detail tooltips, with focus and touch support; only gold carries an inline number. Kept milestone headings and earned markers, and retained boss ticket rewards. Separate claim flags prevent duplicate supplies/weapons, preserve previously granted weapons, and migrate legacy firstWeapon claims to the third-weapon claim without taking anything away.
- Verified reward progression/cost limits, single awards and legacy migration in isolated logic tests; browser checks confirmed shared rarity border colors, common hover details, loaded images, independent stage/print actions and no overflow across desktop, landscape, tablet and 390/320px phones. Inspected responsive screenshots. Production build, game-client smoke and diff checks passed. Preview remains http://127.0.0.1:5175/.
- Registered the existing purple astral-dancer male/female artwork as gacha-only skins; both were previously asset-only. Added shared equipment detail binding for gacha lineup, home equipped icons, room equipment and reveal/summary cards. Restored actual solid borders on shared equip-icon elements so rarity colors appear in the room and other contexts. Raised hipotion rewards to at least three for stage first-clear, enemy drops, old zone first-clear and print rewards without changing shop purchases or previously claimed rewards.
- Generated a transparent pixel-art background-skin ticket icon at assets/items/background_skin_ticket.png and copied it to public/assets/items. Used it in gacha balance, stage boss milestones and adventure ticket reveals. Restructured raid overview into a fixed-height wide cropped dragon-face window followed by large ranking rows (100px avatars, larger names/damage and shared rarity/detail equipment icons). Rules now toggle from an accessible button; documented actual cumulative damage, escalating questions, defeat/reward/participation conditions and current browser-local sharing rather than claiming cross-device synchronization. Battle and ranking mechanics remain unchanged.
- Isolated Playwright checks passed for both new skin previews and actual gacha acquisition, three-item milestone award with repeat protection, room rarity borders, equipment hover/focus/Escape and click enlargement. Raid/ticket checks passed at 1366x1000, 390x844, 320x568 and 844x390, including rules toggle, ranking order/detail, loaded new images and no overflow/page errors. Inspected room, gacha tooltip, desktop raid, small-phone ranking and standard smoke screenshots. Production build and diff checks passed. Test fixtures never changed real user storage; test-only module hook stayed outside the repository.
- Equipment detail markup now declares its rarity; the shared tooltip reads it and uses the existing rarity palette for its outer frame and glow across all equipment detail callers. Non-equipment tooltips explicitly clear the rarity attribute so item/skill windows do not inherit the previous weapon color. Verified all five computed border colors, glow presence, reset on item detail, existing equipment hover/focus/Escape/enlargement tests and production build; inspected the red ultra-rare detail screenshot.
- Compacted raid overview to prioritize visible ranking positions: rules is a small header button, dragon close-up keeps a fixed 120px desktop/90px phone banner, name/HP and challenge share a desktop row, participation reward is a 28px icon with short label/status, and ranking avatars/row spacing/actions are reduced while retaining readable damage and shared equipment details. No reward or ranking logic changes. Isolated 8-player fixture shows six complete rows at 1366x1000 and five at 390x844. Verified rules toggle, ordering, equipment hover, loaded ticket art, long names and no overflow at desktop, phone, 320px phone and short landscape; inspected desktop/phone screenshots. Build and diff check passed.
- 2026-10-04 raid persistence follow-up: connected in-game raid flow to the existing RaidBossAPI transactions, adding idempotent per-battle damage events, cross-device HP/ranking reads, old local ranking migration, zero-damage participation rows, atomic one-time reward claim/save, and queued offline damage. Permission failures now say records are stored locally and shared rankings are unavailable; they are no longer presented as “nobody participated.” Firebase rules were not changed at the user's instruction. Live Firestore read returned PERMISSION_DENIED, so cross-device persistence in production remains blocked by the current deployed rules; offline/local behavior and pending retry are implemented. Verified with in-memory transaction tests and a two-browser shared-state simulation (migration twice, concurrent damage, event replay, claim-once, cheer-once, permission denial/queued damage/recovery, zero-damage participation), production build, standard game-browser smoke, and git diff --check. Local preview: http://127.0.0.1:5175/.
- Stage rewards revised: first clears now grant 100G plus 50G per stage in progression order (the three hipotions stay), and 3-clear milestone weapons are at least rarity 2 (レア). Registered weapon inventory is 12 definitions: eight standard weapons, one counting aid, two ancient/boss weapons and one limited gacha weapon. Production build and diff check passed.

## 2026-10-05
- Fixed the avatar-background holo layer so its foil/glint stays isolated beneath the character instead of obscuring the backdrop; gave holographic backgrounds a softer, distinct finish from the character foil.
- Added duplicate-aware skin gacha odds: standard skins are 97%, holographic variants 3% while both groups remain available, with the remaining group displayed as 100% after the other group is exhausted. Shows a completed-collection message when nothing remains.
- Unified raid settlement at ten minutes and changed the finalized raid's next-level start time to the current time. The level rollover now archives the previous boss before writing the next boss in the same transaction, and reward settlement can read archived results so the next level can open immediately without losing the previous payout.
- Aligned raid client state with dynamic boss IDs, HP caps, rankings, local claim keys and level labels so old-boss damage/claims do not leak into the next level. Firebase security rules were not edited.
- `node --check` for game.js/firebase_init.js/test, `tests/raid-cloud.test.mjs`, `git diff --check`, and `npm run build` passed. The cloud API fixture verified claim-once, ten-minute finalization, archived payout, and a clean next-boss reset. Playwright visual checks could not run because Chromium is not installed and the Mac was locked; the dev server is now responding at http://127.0.0.1:5173/. Re-run visual verification after the user unlocks the Mac.
- Updated background skin gacha cost to 1000G and holographic prize chance from 3% to 1%, with the displayed odds derived from the same constant. Added a claimable 10-pull ticket and animated result grid; draws are unique and capped by remaining unowned prizes. Raid challenge attempts now pay gold equal to damage. Lifetime challenge milestones are transactionally deduplicated per save slot: first participation keeps the existing magma background, challenge 2 grants three cost-plus seeds, and challenge 3 grants one 10-pull ticket. Added in-memory transaction coverage for milestone rewards and duplicate event replay. Firebase rules were not modified.
- `node --check` for game.js/firebase_init.js/tests, `tests/raid-cloud.test.mjs`, `git diff --check`, and production build passed. Visual browser checks were not run because Chromium is unavailable in this environment.
- Fixed a stale raid challenge button race: the menu now starts synchronization before rendering, disables challenge while shared HP/finalization is unknown, and prevents direct start unless shared state is ready (test mode remains usable). This prevents a click from appearing to cause a defeat that was already recorded in shared raid state. `node --check game.js`, raid cloud test, diff check and production build passed; Firebase rules remain unchanged.
- Reworked character hologram rendering to match the supplied collectible-card reference: prismatic facets and a sharp reflective sweep are alpha-masked to the transparent character silhouette, separately from the broad background foil. Applied to the home portrait, skin gacha collection, previews, and result views. Build and raid regression checks passed; browser visual verification remains outstanding.
- Fixed save-data cards that had omitted hologram flags: each slot now carries its own character/background holo state into the preview, applies the background holo surface from that slot's saved value, and masks character foil to the slot avatar silhouette. Syntax, raid test, diff check, and production build pass.
- Corrected the save-card portrait sizing to preserve transparent avatar aspect ratio and fit the full figure in its wide preview frame. Reduced home/save hologram motion and background foil intensity while retaining the prism overlay and a slower highlight sweep. Build and raid checks pass; live browser rendering remains unverified.
- Added a separate animated flame aura for the fire-lancer character, independent of hologram treatment. It appears on the home portrait, save cards, skin selection, gacha preview, collection, and summon reveal; reduced-motion preferences disable its animation. Firebase rules untouched.

## 2026-10-07
- Expanded Ancient equipment to five designs: greatsword, armor, ring, spear and shield. Added six transparent 256x256 pixel-art PNG icons (five gear and shared blueprint).
- Unified legacy Ancient blueprint items into `bp_ancient` on load, preserving inventory counts and remapping any active blueprint print's item UID. Existing blueprint print metadata can still resolve its original equipment ID.
- The shared blueprint now opens a five-item choice before printing; the selected equipment ID is stored with the print. Correctly solving at 80% grants that Ancient item at rarity 6 with a dedicated black-and-yellow frame and the item-reveal headline `古代の〇〇を手に入れた！`.
- Kept the ordinary equipment rarity/merge ceiling at 5. Only Ancient IDs load at rarity 6. Updated `GAME_DETAILS.md`; Firebase security rules untouched.
- Verification: `node --check game.js`, `npm run build`, and `git diff --check` passed. All six item PNGs are 256x256 with alpha. The existing `tests/raid-cloud.test.mjs` fails at an unrelated assertion for the challenge-2 cost-seed reward (`undefined !== 3`); that raid reward logic was not changed here. Automated visual Playwright run is blocked because the installed Playwright browser binary is absent; opened the dev build in the Codex browser and confirmed its title/start page renders. Local preview: http://127.0.0.1:5178/.
- Raised the stage-boss per-level HP/ATK/DEF growth from 8% to 12%. Existing saved default 8% migrates to 12%, while custom administrator values are preserved. The admin setting label now explicitly names stage bosses; raid scaling is unaffected.
- Updated Ancient blueprint flow per design: no equipment choice during printing; solving the shared cipher at 80%+ randomly grants one of five Ancient ★6 items, prioritizing unowned types so there are no duplicates until all five are collected. Afterward, any of the five can repeat.
- Ancient equipment costs are now fixed at 5-8 regardless of ★6 rarity. Added greatsword basic attacks as two separate 0.8x-ATK hits, spear +50 percentage points of critical chance, shield 30% incoming-damage reduction, ring +100 max MP, and armor's high DEF/HP profile. Tooltips show each Ancient passive. Firebase rules untouched.
- Renamed the Ancient greatsword to 古代の双剣 and replaced its icon with a transparent 256x256 pixel-art pair of crossed swords. Its existing two 0.8x-ATK basic strikes remain unchanged.
- Kept 古代の双剣 and restored 古代の大剣 as separate Ancient weapons, bringing the set to six. The greatsword has a separate +30 percentage-point critical bonus; the spear grants a flat +30 SPD. Unowned-first duplicate prevention now naturally covers all six IDs.
- Enhanced the Ancient ★6 presentation with a stronger layered black-and-gold frame, metallic dark-gold card surface, sharper gold glow and a slow, narrow gold reflection sweep. Kept Legend ★5 rainbow hologram distinct; reduced-motion mode disables the Ancient sweep.

## 2026-10-09
- Fixed master-volume scaling across BGM and sound effects. Slider changes update all loaded BGM tracks (preserving the quieter home-music baseline) and currently playing audio-file sound effects; generated beep/rumble effects continue to use the same master-volume value for new playback.
- Removed furigana from challenge question text and removed question-bank-derived readings so answer data cannot leak into hover hints. Furigana now applies only to safe quest names/titles and item names, descriptions, and usage guidance, including inventory and battle item lists.
- Verification: `npm run build` and `git diff --check` passed. The game browser showed the volume slider changing from 70% to 35% and back. The required Playwright client could not launch because Chromium is not installed in this environment.

## 2026-10-13 — ハロウィン演出・報酬表示
- Request: ハロウィンガチャの演出改善、リザルトをアイコン＋同じアイテムの合計に変更、お菓子の「×4 ×4」を修正。
- Added Halloween summon overlay: pumpkin charge, magic ring, sparks, light burst, large prize reveal; skip/Escape, focus handling, reduced motion.
- Reward summary groups identical drops; equipment with different rarity/ability remains separate. Cards show icons + totals and support tooltip keyboard focus.
- Removed embedded quantity from candy drop name and normalized legacy names in the shared acquisition card renderer.
- Validation: build, halloween-shop test, reward-summary regression test passed. Skill Playwright client used installed Chrome via temporary adapter because bundled Chromium was missing. Desktop browser checks passed (summon, skip, auto reveal, ticket/gold deduction, reduced motion, no page errors); mobile QA also passed. Final light-burst adjustment built successfully and desktop recheck passed.
- No unrelated gameplay state or reward probabilities changed. Test hooks were injected in the test browser only, with save stubbed.

## 2026-10-13 — クリックで景品を拡大
- Added full-size artwork/detail modal for shared reward icons: Halloween gacha catalog, exchange catalog, summon results and earned reward summary. Close button/backdrop/Escape and keyboard focus restore supported.
- Existing normal skin/background/equipment previews now support Escape/focus handling; equipment images reset hidden/holographic state inherited from prior previews.
- Desktop/mobile Playwright checks passed for all 9 Halloween prizes, all 4 exchanges, normal gacha categories, result icons, nested summon preview and unchanged currency/ownership. No page errors.
- Adjusted enlarged images to stay within their artwork container. Build and syntax checks passed; screenshots saved under output/artwork-preview-qa. No production deployment or Git push.

## 2026-10-14 — 合成工房とランタン
- Exchange lantern rarity changed from ★5 to ★4 (超激レア); previously acquired inventory is preserved.
- Replaced automatic pair selection with inventory cards, explicit base UID and matching material UID, recipe/result preview and a dedicated synthesis calculation screen.
- Two correct problems consume only the selected copies and create the next rarity. Fail/cancel consumes nothing; stale callbacks and invalidated pairs are guarded. Equipped consumed copies are unequipped; extra copies remain. Abilities reroll as before.
- Validation: synthesis regression tests, Halloween shop test, build and diff checks passed. Desktop/mobile browser checks covered actual selection, calculation, success/failure/cancel and found no page errors. Screenshots reviewed under output/synthesis-qa.

## 2026-10-14 — ハロウィン シーズン2
- Release gate: 2026-10-21 00:00 JST, active until existing October event closes. Release occurs in game code; no deployment performed.
- User requested up to approximately five simultaneous monsters: three groups of 2, 3 and 5 (10 total). Run snapshots its season at entry. Season1 stays one monster per battle and eight encounters.
- Tappable targets with separate HP; target switches are locked while damage and counterattacks resolve. Surviving enemies counterattack on a wrong answer. Clearing a group requires defeating every member.
- Group gold/experience and individual monster drop rolls award once, guarded against repeated victory callbacks. Existing event inventory and once-per-event first-clear claims carry over.
- Tested JST boundary, in-progress run snapshot, party composition/progression, target locks, survivor transition and once-only group rewards; original event/shop and battle presentation tests passed. Build passed. Desktop/mobile Chrome checks covered five visible enemies, target damage and counterattacks and 2→3→5 progression without page errors. Mobile sizing refined to preserve HP visibility.

## 2026-10-14 — シーズン2の別ステージ・先行テスト・四則問題
- Classic event entry always remains season1, even after October 21. Separate S2 entry opens three dedicated stages; before release it explicitly says 先行テスト and can launch now.
- S2 stages have their own cleared counts; they do not advance classic challenge progression or consume its first-clear claim. Normal earned battle items/currency remain shared.
- Added four-operation selector and enemy-number math: small stage chooses the enemy carrying the answer; plaza combines two enemy numbers in selection order; boss course mixes both modes. Correct combinations damage both selected targets. One remaining monster falls back to answer selection.
- Guaranteed solvable questions for addition/subtraction/multiplication/division; division answers are integral. Questions persist across skill/item menu detours; countdown expires into surviving-enemy retaliation.
- Property/regression tests cover all four operations, 1/2/3/5 enemies, unique answers, ordered pair validity, release/preview gating, separate progression and prior battle presentation. Build passed. Desktop/mobile browser validation passed for preview entry, four operations in both modes, exact one/two-target damage, wrong-answer retaliation and classic entry. Reviewed stage chooser and division screenshots.

## 2026-10-14 — シーズン2の回答進行・10体補充・反撃ゲージ
- 全S2ステージを10体同時出現に変更。回答後に倒した敵を補充し、次の問題では常に10択・組み合わせを維持。
- 星は撃破数ではなく回答で1つ進む。小道19問・広場29問・夜会39問の回答後、最後の星でボス1体を出現。ボスを倒すまでステージは終了しない。時間切れは回答数に含めない。
- 複数対象や補充による報酬の増殖を防止。進行に応じた正解で通常報酬を最大7回、最後のボスから1回だけ抽選。金・経験値も同じ単位で支給。
- 15秒の反撃待ち時間を残量ゲージで表示。残り5秒は暖色で強調し、特技・道具から戻っても既存の締切を維持。
- 敵を5列×2段で中央へ配置し、星の列と問題ウィンドウが重ならないようレイアウトを調整。
- テスト：10体全滅でも即クリアしない、補充・回答数・最終ボス・抽選上限・二重報酬・季節境界・四則と10択。既存15系統の回帰確認。
- ブラウザー確認：デスクトップで10体と時間ゲージ、390px幅で正解→星1つ進行→10体補充を確認。横幅375pxに対してscrollWidthも375pxで、横にはみ出さない。確認後は戦闘を終了して通常の表示幅へ戻した。

## 2026-10-14 — シーズン2を5問に短縮
- 全ステージを星5個に統一。4問回答後にボス出現、5問目の計算に正解するとボスへのとどめでクリア。通常抽選も最大4回＋ボス1回に縮小。
- 10体の補充と反撃ゲージは継続。5問目の正しい数字がボス以外の敵にある場合も、正解後の攻撃はボスへ向かう。

## 2026-10-14 — かなの問題拡充とイベントの30秒・専用特技
- ひらがな・カタカナの長音・促音を短い言葉の2択と応用4択に分割。促音応用44／43語・長音応用42／38語を用意し、各30語以上・5文字以上20語以上を検証。
- 各エリアを7ステージに拡張。旧5ステージのクリア数・報酬受取・ドロップ抽選回数・学習記録・レイド復習元を一度だけ対応位置へ移行。
- 問題の意味を手がかりに選べるようにし、4択は重複なし・正解1つ。UIはA〜Dを2列で表示し、二重送信と正誤フィードバックを維持。
- ハロウィンの制限時間を30秒に変更。S2では既存特技を禁止し、専用の全体攻撃「かぼちゃの波」（MP5）を追加。選択時は予約のみ、回答時に一度だけMPを消費。正解で生存敵全員へ攻撃し、回答・報酬は1回分。
- S2のモンスターを透明な選択領域へ変更し、カードの枠・背景を除去。選択時の光、数字、HPで視認性を維持。
- 検証：526パターンのかな選択、長文数・文字種・重複・保存移行、30秒のゲージ、既存特技の禁止、全体攻撃とMP消費。全16系統の回帰テストとビルド。
- ブラウザーでひらがな・カタカナの4択を確認（390px幅、横はみ出しなし）。S2の特技一覧は専用特技のみ、実行後の全10体がHP12→7、MP10→5、回答1回分に進むことを確認。敵の背景色は透明、外枠0px、時間ゲージ上限30秒。長い選択肢は画面幅と字数に合わせて文字サイズを調整。

## 2026-10-14 — かなのボス第2形態を4択に変更
- ひらがな・カタカナのボス第2形態で、長音・促音の応用プールから4択を出題。
- 両エリアの実際のボス出題関数を検証し、長音・促音のどちらでも選択肢4つ・正解1つになることを確認。

## 2026-10-14 — 討伐数を競うイベント専用レイド
- S2の入口を専用レイドの詳細・ランキングへ変更。既存のレイド画面構成とプロフィールカード、敵10体の表示を流用し、通常レイドのダメージ集計から分離。
- ユーザーの回答を反映：2分かHP0で終了、敵種類はランダム・ボスなし。回答10秒以内4体・20秒以内3体・それ以降2体。5正解の次の正解で7体の自動特技、誤答でチャージ保持。専用エフェクトと表示ゲージを連動。
- 攻撃命中ではなく死亡を1回だけ集計。最高討伐数・同順位、日次参加のお菓子2個、10/25/50体の達成で3/5/10個を各1回。敵ごとのドロップ・金・経験値抽選は除外。
- 記録と報酬台帳を専用Firestoreコレクションへ保存。最大値のトランザクション更新、参加日の再送、受取IDで重複加算を防止。通信待ちでも記録をローカル保存。
- 検証：対象数の時間境界、7体攻撃、5正解・誤答保持・自動発動・リセット、死亡と補充、HP終了・時間切れ、同順位、報酬の重複防止、クラウドの並列・再送。ブラウザーでは詳細画面から参加し、5正解で7体のゲージ、次の正解で7体分のHP変化・チャージ0を確認。

## 2026-10-14 — 専用レイドを通常のチャレンジ出題・7体横並びへ変更
- 従来のチャレンジステージと同じ復習元・進行段階の問題を共通UIで出題。算数入力、かな選択、漢字入力に対応し、敵の数字と敵タップによる回答を除去。
- 敵を7体・横一列に変更し、デスクトップのスプライトを拡大。画面幅に合わせて縮小しても横一列を維持。
- 通常・専用特技とも120ms間隔で1体ずつ攻撃。時間切れや終了後は残りの攻撃を止める。正誤演出の待ち時間は攻撃対象数の回答時間に含めない。
- 検証：既存問題への接続、最初の1体のみ即着弾・残り120ms間隔、7体の特技、時間切れで連撃中断、国語のゲージをソフトキーボードではなく問題パネルに表示。ブラウザーで7体すべて同じ高さ・数字非表示・スプライト高さ170px、国語正解→4体のHP10→5・チャージ1・次問へ移行を確認。18系統の回帰テストとビルド。

## 2026-10-14 — 専用レイドの算数限定・通常レイドと共通のレイアウト
- 専用レイドは算数のみ。現在の出題元が国語なら算数の復習候補・履歴・初歩のたし算へ切り替え、参加時も算数に限定。ダメージ5・敵HP10の固定は継続。
- 通常レイド用のID限定CSSを両画面の共通指定へ変更。詳細とランキングの左右構成、ウィンドウ幅、参加ボタン、狭い画面での縦配置を共通化。長い出題説明は全幅の別行に出し、ステータスとボタンが縦に潰れないよう修正。
- ブラウザーで幅1100px・詳細とランキングの左右配置・参加ボタン幅494pxを確認。国語の出題元だったデータでも算数の入力問題へ切り替わり、正解で4体のHP10→5・チャージ1・次問へ進むことを確認。18系統の回帰テストとビルド。

## 2026-10-14 — 討伐カウンター・デジタル時計・ゲージ・通常ダメージ
- 戦闘上部に「○体討伐！」と02:00の時計。着弾時に撃破数を更新し、時計は残り15秒で赤く表示。
- 青いゲージは10秒・20秒の境目だけでなく、待ち時間中も連続で減少。4/3/2体の表示と最低2体を維持し、回答確定後は所要時間を固定して判定待ち450msを除外。
- ダメージ5固定を除去。通常の攻撃力・防御・速度ボーナス・会心・古代双剣・吸血を反映し、1体ずつの連撃と死亡の一度だけの集計を維持。
- レイド詳細の画像を、たくさんのおばけが町に押し寄せるイベントバナーへ変更。画像全体が見えるよう拡大クロップを解除。
- 検証：時計02:00→01:55と境界、5秒でゲージ87.5%、通常攻撃力20の即撃破、古代双剣の2回攻撃、連撃中のカウンター更新。ブラウザーでゲージ99.7%→60.0%・時計02:00→01:44、3問正解後5体討伐・敵HP4/10（6ダメージ）を確認。18系統の回帰テストとビルド。

## 2026-10-14 — 討伐数に応じた敵の強化
- 補充される敵は、討伐数1体につきHP＋2・攻撃力＋1・守備力＋1。初期10/2/0から、10体討伐後は30/12/10。生存中の敵は回復・能力変更せず、補充時点の強さを固定。
- 画像と名前を付ける処理で攻撃力・守備力を0へ戻さないよう修正。敵の守備力は通常攻撃・双剣へ、攻撃力は反撃へ反映。反撃にはプレイヤーの守備力・防御能力・古代装備の軽減も適用。
- 検証：1/5/10/25/50体時点の能力、補充・生存敵のHP保持、画像設定後の能力保持、守備力で実ダメージ減少、攻撃力で反撃増加、プレイヤー守備力で軽減。

## 2026-10-14 — 敵HPの上昇幅5とレベル表示
- 補充時のHP上昇を討伐1体につき＋5へ変更。敵の頭上にLv.1から討伐数＋1のレベルを表示し、補充による強化が分かるようにした。生存敵のレベルは維持。
- 出題は参加回数では進行しない。既存のハロウィン進行・算数復習元から選んだステージをその挑戦中に使用し、記録がなければ初歩の足し算。
- テストで討伐数とHP・レベルの対応を検証。ブラウザーで4体討伐後、初期Lv.1・HP10、補充Lv.3・HP20、補充Lv.5・HP30の表示を確認。ビルドも成功。

## 2026-10-14 — 漢字版のハロウィンレイド
- 詳細画面に算数／漢字の切り替え。漢字は毎回1年の最初から、正誤を問わず5問回答で次の通常漢字ステージへ進行。全6学年を順に出題し、最終ステージでは継続。
- 出題中の学年・ステージ・回答位置を表示。問題履歴はステージ遷移時にリセットし、ソフトキーボード・入力と既存のゲージ・チャージ・7体攻撃を組み合わせる。
- 各版の最高討伐数・共有ランキング・通信待ち記録を分離。旧算数記録を維持。お菓子の参加・達成受取IDは両版で共有し、切り替えて二重取得しない。
- 検証：回答4/5/24/25/125/145問の境界、学年進行、最終ステージ、誤答でも進行、再挑戦のリセット、出題履歴の消去、ランキング分離、保存再読込後の報酬共有。
- ブラウザーで漢字版の参加・入力、5問回答して「かず・大きさ」から「からだ・ひと」へ進むことを確認。決定ボタンと五十音キーボードの重なりを解消し、問題・進行表示・ゲージと別位置に配置。18系統の回帰テストとビルドが成功。

## 2026-10-14 — 五十音ボードを見やすく整理
- あ行・か行などの行名と1行5文字の配列へ変更。文字を拡大し、行ごとに色を交互に変えて探しやすくした。
- 「あ〜ん」「が・ぱ」「ゃ・っ」の3種類に分け、濁音・半濁音と小さい文字を切り替え。小さい母音も追加。「ん」「ー」「1文字けす」を共通下段に固定し、切り替え時の入力を維持。
- 検証：行の並び、空きマスの無効化、種類の選択、ぎ＋ゃ＋ん＋ーの入力保持、1文字削除、既存526パターンの選択問題。

## 2026-10-14 — ハロウィン専用スキルの全体演出と交換確認
- かぼちゃの波に、画面全体の渦・光・おばけ/かぼちゃの突撃・全体攻撃タイトルを追加。240msの演出開始後、全7体へ順番に着弾。通常ダメージ計算を維持し、演出自身による追加ダメージは発生しない。1.5秒・終了時・再発動時の片付けと古い戦闘の保護。
- お菓子交換は品名・必要個数・交換後残数を確認し、確定時だけ消費。キャンセル・二重クリック・セーブ切り替えの保護。実交換時は既存の残高/所持確認を再実行。
- ブラウザーで新しい五十音表、濁音→小文字の切り替えで「ぎゃ」を入力し、削除後「ぎ」を保持することを確認。専用スキルは全7体のHPが変化し、チャージをリセット。スキル演出中は通常の「正解！！」を隠してタイトルの重なりを防止。交換確認のキャンセル・消費・二重押しをテストし、全19系統の回帰テストとビルド。
### 2026-10-14 ハロウィンレイドの音・配置と五十音入力
- 正解時のチャイムを追加し、共通スライダーとミュートに対応。
- 敵列の幅制限を外してイラストを拡大。問題・回答・決定・学習ステージを中央に残し、対象数ゲージ・特技チャージ・終了・入力切替を側面へ移動。狭い画面では縦に並べる。
- 全ステージの戦闘ログを最新1件・1行表示へ変更。補充の敵に奥から小走りで接近する演出を追加。
- 五十音の切替タブをなくし、濁点・半濁点・小さい文字の末尾変換と、わ・を・ん・ーを常設。長音キーの表示はユーザーの追記に合わせて「ー」。
- 全19テスト・構文確認・ビルド成功。ブラウザで「じゅう」の変換入力と正解、拡大した敵・短い問題パネル・1行ログ・小画面の収まりを確認。ローカル反映のみ。


## 2026-10-14 — イベントレイドの中央入力配置を修正
- 問題・回答欄・決定を画面中央へ戻し、その下に入力切替と五十音ボードを配置。ゲージ・特技チャージ・終了ボタンは中央パネルの右隣へ移動。
- 高さ1000px以下では五十音の行を2列に並べ、入力ボードに必要な高さを確保。通常の縦長画面は行ごとの五十音表を維持。
- 入力切替が問題欄に残ることをイベントレイドのテストで確認。かな入力テストとビルド成功。ローカル反映。

## 2026-10-14 — 五十音表の行順と記号表示を調整
- 左は上からあ・か・さ・た・な、右はは・ま・や・ら・わの固定配置へ変更。わ・を・ん・ーを右下のわ行へ移動し、独立した下段を削除。
- 濁点・半濁点のボタンは゛・゜だけ表示し、読み上げ用名称は保持。
- 配置座標と文字変換のテスト、漢字の読みのテスト、ビルド成功。実画面でも左右の行順と右下のわ行を確認。ローカル反映。

## 2026-10-14 — イベントレイドの左右配置
- 問題・回答・決定・入力切替を中央下、イベントのゲージと終了ボタンを左下、五十音を右下へ配置。
- 敵列の左右余白を同じにして画面中央へ揃えた。五十音はボード幅に応じて文字サイズを調整。スマートフォンの縦配置は維持。
- 実画面で各パネルの重なりがないことと敵列の中央揃えを確認。

## 2026-10-14 — 漢字専用レイドにして公開
- ハロウィンイベント専用レイドの算数選択を削除。参加処理も漢字に固定し、旧算数指定でも1年生最初の漢字から開始。通常の算数ステージと従来のレイドは維持。
- ゲージ用ウィンドウを問題欄の左隣16pxの間隔へ移動。
- 全19テストとビルド成功。実画面で漢字のみの参加・出題と16pxの間隔を確認。
- Firebase Hosting（treegames-ac5db / keisan-heros）へデプロイ完了。https://keisan-heros.web.app のHTML参照とJavaScript内容が今回のdistビルドに一致することを確認。

## 2026-10-14 — 討伐数突破ボーナス
- 5・10・20・30・50体でお菓子5・10・20・30・50個を各1回。毎日の参加は2個を継続。
- ハロウィンチケットは10・30・50体で各1枚、計3枚。20体で背景スキンガチャ1枚、50体で装備ガチャ10連1枚。コストプラスのたねは10・30・50体で1・2・3個。
- 旧受取分のお菓子は差額のみ加算。チケットと種は専用の受取IDで二重配布を防ぎ、クラウド台帳・再同期にも対応。
- 詳細画面に突破ボーナス一覧と達成状況を表示。全19テスト・構文確認・ビルド成功。

## 2026-10-16 — レイドコイン・装飾・イベント報酬・プリント
- 通常レイド：各挑戦でceil(damage/4)コイン、討伐順位50/30/15/5コイン。順位コインはFirestore取引と専用台帳で1ボス1回、既存の受取済み順位にもコインのみ追加可能。
- コイン交換所に能力付き低コスト装備3種・星界の守護者・新背景「星界の天空神殿」・前景装飾を追加。交換は各景品1回。新チケットSVG。新PNGは内蔵画像生成、プロンプトはassets/raid/artwork-prompts.json。
- 背景とキャラに独立した前景装飾の選択・保存・HUD/ランキング反映。ハロウィン累計討伐数11/1確定、上位3位の専用装飾と全参加者武器。ガチャに小さな装飾2種と低コスト装備3種。
- ハロウィンレイド撃破ごとお菓子2、前回2ステージ前から漢字再開、終了合図と討伐数表示。通常敵5%/ボス25%チケット。敵攻撃1.5倍。
- 管理者プレゼントは受取確認をホーム/送信後/定期で起動し、正しいスロットのクラウド保存と受取印を原子的に更新。
- セーブ前チャレンジプリント提案：経験値/G/消耗品3倍、80%合格で装備10連券。古代の設計図はクリア済みの最高難易度、漢字も共通印刷に対応。
- 武器/道具店の品揃えと装飾を追加。計算での支払いはユーザーが保留を指定したため実装しない。
- 全22テスト成功、Viteビルド成功。Firestoreインメモリ取引で重複/同時受取/正しい宛先/最新進行保持を確認。実ブラウザでコイン・取消/全景品交換・前景装飾・終了表示・印刷提案・PC/390px表示確認。標準スキルクライアントも実行。
- 公開・Git pushは今回まだ実行していない。

## 2026-10-16 — 交換所ボタン・ランキング訂正・プレゼント受取・店のアイコン一覧
- コイン交換所ボタンのイベント接続漏れを修正。実際のボタンをクリックする回帰ブラウザテストをtests/shop-gift-browser.mjsに追加（全クラウド通信はfixtureに差し替え）。
- ユーザー依頼でboss_80のブラック1023点だけを除外。実戦イベントのないlegacyDamage=1023だった。共有ダメージ1302→279。他4人のドキュメントに変更がないことを確認。raidModerationBackupsへ原本を保存。スコアは0・除外フラグ・旧基準1023を保持し、古い端末からの再送で復活させず、新しい実戦イベントから再参加可能。
- 旧集計の移行にボスIDを必須とし、ボス指定のない旧記録はLv50だけ対象。テストモードの戦闘は共有用ローカルキャッシュも変更しない。
- 管理者プレゼントは拠点で内容/アイコン/個数を表示し、受取ボタンを押して初めて原子的に保存・受取印を更新。拠点へ戻るたび確認。受取失敗時はボタンで再試行可能。
- 明示指定の3件（ブラック100万G、himariとまなみ各3000G+装備10連3+背景券1+種5）を20261016_owner_requestとして原配布回収/同内容再配布。未受取だった2件は差替えのみ。受取済み100万Gは回収台帳と使用済み分の精算を用い、再受取しても二重加算しない。adminGiftRecallBackupsに原本保存。
- レイド券をハロウィン券の絵柄を参照した金枠・青地・銀竜のPNGへ描き直し。assets/raid/raid_ticket_pixel.png、内蔵画像生成、プロンプトはartwork-prompts.json。
- 武器屋・道具屋を64pxアイコン一覧に変更。選択時に詳細/価格と購入確認。背景はユーザー指示どおり元のassets/bg/weapon_shop.jpgとitem_shop.jpgに復元。ハロウィン背景への上書きを削除。
- 全22テスト成功。ブラウザで交換所ボタン/アイコン寸法/購入取消/受取前ゼロ加算/受取後1回加算/新券表示を確認。公開・pushは未実施。

## 2026-10-16 — ピクセル制作基準・今回20点の再生成・装飾表示の統一
- ユーザー指定の元ハロウィン装備3点（かぼちゃ剣/魔女マント/月のお守り）を参照画像として内蔵画像生成で今回の20点を全て再生成。細かすぎた最初の生成案はランタイム参照から削除。
- assets/AGENTS.mdへ制作ルール：装備128x128相当・前景96x128相当の粗いピクセル、24〜32色目安、暗い輪郭と少ない陰影、48/88pxで比較確認、透明余白・右上向き武器。新PNGはassets/event-pixel/、各実プロンプト/参照はassets/equipment-art-prompts.json。
- 6種の前景装飾、ハロウィンの低コスト装備と報酬剣、マグマ装備3種、木/銅/旅人剣、稲妻の太刀/エクスカリバーを固有絵へ。コウモリの小盾・かぼちゃの小鈴をガチャへ追加。向きが逆だった既存2剣は認可済みの反転で合わせた。
- event_equipment.jsでイベント装備13種に固有能力を保証。所有済み/ギフト/合成にも適用し、既存能力・基礎ステータス・コストは保持。
- 共通3:4の背景→キャラ→前景装飾レイアウトを拠点/部屋/ランキング/セーブ枠/スキン選択/ガチャ結果/景品プレビューへ適用。背景と装飾のプレビューにも現在のキャラを合わせて表示。他プレイヤーには自分の装飾を流用しない。
- 全23単体テストとViteビルド成功。tests/avatar-equipment-browser.mjsで全20画像のdecode、拠点/部屋/選択/ランキング/背景と装飾プレビューの3:4寸法、剣拡大とマグマ交換所を確認。クラウド通信をfixtureに差し替えた検証で本番のセーブ/ランキングは変更していない。
- 生成20点の透過を確認し48/88px比較画像と実画面スクリーンショットを目視確認。標準develop-web-gameクライアントも起動/スクリーンショット/状態出力を確認。ローカル5174へ反映、公開とpushは未実施。

## 2026-10-17 — 交換商品の単体表示
- ユーザーの指摘に合わせ、商品/報酬のアイコンとクリック拡大から現在装備中の背景・キャラ・装飾の合成を削除。交換対象のキャラスキン/背景/装飾そのものだけを表示。プレイヤーの拠点/部屋/ランキング等の装着表示は維持。
- assets/AGENTS.mdにも商品表示と装着プレビューの区別を追記。
- Halloween交換4品とレイド交換所で各商品が単体画像になるブラウザ回帰を追加し成功。クリック拡大も単一画像を確認。関連2単体テスト成功、実画面を目視確認。

## 2026-10-17 — フレーム名称と3タブのカスタマイズ
- 前景の装飾をユーザー表示で「フレーム」に統一。独立した即時変更ダイアログを廃止し、キャラ/背景/フレームの3タブへ統合。所持フレームと「フレームなし」を選び、組み合わせをプレビューしてまとめて決定。閉じると保留中の変更は破棄。
- フレームに対するキャラと背景の共通3:4配置を拠点/部屋/セーブ一覧/ランキング/組み合わせプレビューで使用。旧セーブのavatarDecoration等は維持して互換性を保持。ランキングのプロフィール不足時にも保存済みのフレームを補完。商品一覧と拡大は前回指示の単体表示を維持。
- 全23単体テスト・ビルド成功。隔離ブラウザで3タブ、フレーム変更の取消/決定、なしのプレビュー、拠点と実際に保存したセーブカードへの反映、390px幅の操作と画像を確認。本番のセーブやランキングには書き込まずに実施。

## 2026-10-17 — フレームを正方形へ
- ユーザーの「四角で」の指定を優先し、共通のキャラ/背景/フレーム表示を1:1の正方形へ変更。縦長のフレームに合わせて表示枠を作らず、フレームを表示枠の外周へ合わせる。キャラは縦横比を保ったcontain・4%余白で表示。
- 拠点130px/小画面104px、部屋96px、ランキング112px/小画面80pxへサイズ感を戻し、セーブカードはカード幅に合わせた正方形。選択プレビューも正方形へ。商品単体表示は維持。
- 隔離ブラウザで拠点/部屋/ランキング/セーブカード/プレビューの1:1寸法、フレーム保存と取消を確認。PCと390px画面を目視確認。制作ルールも今後のフレームを正方形とするよう更新。

## 2026-10-17 — 正方形フレーム再生成・プレビュー拡大・道具屋のクリック修正
- 既存6フレームを編集参照として内蔵画像生成で正方形用に再描画。assets/frames-square/へ全6PNGと実プロンプトのartwork-prompts.jsonを保存し、カタログ参照を切替。全6点1254x1254・RGBA・中央透明を確認。旧画像は参照原本として維持。
- プレビュー幅を固定値からコンテナの幅/高さと3行のキャプションの余白で算出する形へ変更。PC・390px画面とも余白を使い、収まる最大の正方形で表示。
- 道具屋の不具合は1024x768/1280x720/900x600でステータス欄の透明な余白がクリックを遮っていた。外側コンテナのpointer-eventsをnoneにし、アバター/ステータス/装備/券だけautoへ。実ボタンで道具屋へ出入りする回帰を追加し4サイズ成功。購入取消・プレゼント受取・交換所も既存回帰成功。
- 全23単体テスト・Viteビルド・diffチェック成功。新6フレームの正方形寸法とdecode、保存/取消、拠点/部屋/ランキング/セーブ一覧、PC/スマートフォンの拡大プレビューを隔離ブラウザで確認・目視確認。本番データへの書込みなし。

## 2026-10-17 — プリント報酬アイコン・たねの画像と使用演出・追加装備コスト
- セーブ前チャレンジプリントの提案に、経験値/ゴールド/消耗品の3倍アイコンと、80%以上で確定の装備10連券×1を表示。券はクリック拡大可能。正答率条件と正解数による報酬であることを明示。印刷/そのまま保存/取消の流れは維持。
- cost_seedとrespec_seedを元ハロウィン装備3点参照・128px相当のピクセルルールで内蔵画像生成。assets/items/cost_seed_pixel.png、respec_seed_pixel.pngへ保存。全プロンプトと参照はseed-artwork-prompts.json。透過と正方形を確認し、道具屋/所持品/報酬のアイコンを差替え。
- たね使用時のブラウザalertをゲーム内の金色/青色の発光・粒子・数値カウントアップへ置換。スキル振り直しは各ステータスのポイントが戻る演出。増加前後と回収量を表示し、閉じたあとコスト欄/ポイント欄を強調。戻すポイントなしはゲーム内確認にして消費なし。使用中の連打と使用済みUIDによる再加算を防止。
- 今回の追加装備12点を基本コスト3〜5へ調整。店：旅人の軽い剣3/ベスト3/魔力のお守り4。イベント：小盾3/小鈴3/サーベル3/月のピン3/ケープ4/月影の短剣5/マグマ剣5/鎧5/護符4。イベント固定コストの仕組みは維持。旅人の剣は同コストの鋼の剣より弱いため55→45Gへ。攻撃力等の既存数値・固有能力・初期装備のコストは維持。
- 全24単体テスト成功、Viteビルド成功、diffチェック成功。実ブラウザで所持品からの両たね使用、数値/消費1個/取消/ポイント未配分時の非消費/ブラウザ通知ゼロ、プリント報酬と拡大・保存・取消を検証。PCと390pxスクリーンショットを目視確認。標準ゲームクライアントの起動/状態出力も確認。クラウド通信はfixtureに置換して本番セーブは変更していない。

## 2026-10-17 — イベント報酬を左下へ・共通正解音・漢字の複数読み
- 討伐突破ボーナスをランキング列から左側の参加ボタンの下へ移動。5段階を小さい行へまとめ、バナー/概要を詰めて全段階が見えるように調整。右ランキングのスクロール領域はPCで約681pxへ。報酬はstageRewardIconで実際のお菓子/イベント券/背景券/10連券/コストのたねPNG＋×個数を表示し、クリック拡大も維持。取得済み/あと何体も継続。
- 漢字・計算の正解音をSoundManager.playCorrectAnswer（通常のse_type素材・専用0.24音量）へ統一。イベントだけ追加されていた別の合成correct音を削除し二重鳴りを解消。イベントの攻撃SEは1.8倍（基本0.36）。全体音量/ミュートと再生中SEの音量追従は維持。
- EDRDGのKANJIDIC2とJMdictを公式配布元から取得し、出題データに含まれる漢字1022字/表記1012語の読みをローカルへ抽出。単漢字には音訓/名乗り、熟語にはその表記に対応する読みのみを追加（漢字読みの総当たり拼接はしない）。日=ひ/にち/じつ/か、文=ぶん/もん/ふみ/あや等を受け付ける。送りがな省略は維持、漢字回答のみNFKC・カタカナ→ひらがな正規化。かな表記問題は小文字/長音/ひらカタの区別を維持。
- 新規kanji_readings.js/kanji_readings_data.js、取得記録data/kanji-readings-source.json、更新スクリプトscripts/update_kanji_readings.py。読みデータはCC BY-SA 4.0、出典/ライセンスをpublic/kanji-reading-sources.htmlとedrdg-licence.txtへ同梱しメニューから参照可能。辞書更新・出題語追加時の再生成手順を記載。
- 全25単体テスト、ビルド、diffチェック成功。隔離ブラウザで日/文/入るの別読みとカタカナ入力、誤読拒否、通常とイベントの同一正解音1回/攻撃倍率を確認。報酬配置/本物のアイコン/取得状態/拡大、PCと390px画面を確認。標準スキルクライアントのスクリーンショット/状態出力も確認。本番ランキング・セーブへの書込みなし。

## 2026-10-17 — Thin corner frame rule and guard balance
- Established a general frame rule in assets/AGENTS.md: square coarse pixel art, thin outer connectors, corner-hugging motifs, empty face area, no top-center hanging ornaments, unchanged character scale.
- Redrew all six frames with built-in image_gen edits, preserving their themes. Runtime now uses assets/frames-thin; prompts and original references are recorded in artwork-prompts.json. Old IDs/save fields remain compatible.
- Checked both Halloween ranger and witch compositions at 48px, 88px and larger preview sizes; verified home, room, selector, save cards, ranking, standalone products and mobile behavior in isolated browser fixtures.
- Reduced guard damage reduction from 15% to 5% in normal, turn-based and Halloween raid counterattacks; duplicate guard abilities still do not stack. New guard balance tests exercise all three paths, minimum damage and ancient shield combination.
- Validation: all 26 unit test files passed; Vite build passed; browser fixture passed without page errors; game skill client screenshot/state inspected; git diff --check clean. No shared ranking/save writes, deployment or push.

## 2026-10-18 — Native Unity migration started
- User requested a native Unity port into their new レジェンドヒーローズUnity project while retaining the Web game, and asked to reorganize accumulated code during migration.
- Added a separate unity-port package: Content / Domain / Persistence / Presentation / Editor, with per-screen UI files and explicit migration status documentation.
- Added read-only Web export and non-deleting Unity sync scripts. Export: 15 areas, 95 stages, 46 equipment, 25 avatars, 6 frames, 52 kana/kanji pools, 162 images. No Firebase or browser saves used.
- Native C# implementation begins with create player, home, stage selection, question combat, equipment/shop, appearance, local saves and backup recovery. Remaining parity gaps are documented in unity-port/Docs/MIGRATION.md.
- Detected pre-existing invalid Web enemy references bandit_19 in area7 and area11; exporter reports and excludes them, leaving Web unchanged.
- Unity 6000.6.3f1 compiled the native port successfully. Native C# validation passed: 8,153 exported stage questions accept their canonical answers and reject unrelated input; kanji alternate readings and strict kana; owned/cost-limited equipment; purchase/no duplicate charge/insufficient funds; wrong-answer damage; five-kill rewards exactly once; defeat; local save roundtrip and corrupt-save recovery.
- Fixed fraction answers and textual ratio answers, and normalized Japanese resource paths (macOS decomposed filenames). Checked native title, create-character, home and shop rendering. Pointer raycast diagnostics correctly resolve shop item buttons. Native GUI automation became unreliable with multiple Unity windows; no claim that every mouse/IME interaction or mobile device has been verified.
- Native scene: Assets/LegendHeroes/Scenes/LegendHeroes.unity. Tools > Legend Heroes > Open Game / Validate Migration. Web runtime files were not changed by the migration.

## 2026-10-19 — Unity移植の継続（容量不足から復帰）
- 一時ファイル書込みが容量不足で中断。再開時8.8GiBの空きを確認、ユーザーファイルの削除なしで継続。
- 独立したDomainへ無限問題生成、装備個体UID/レアリティ/合成、特技・MP、道具と種、ガチャ/交換、通常・シーズン2・2分イベント・世界レイド、プリントの採点/報酬を追加。画面ごとのPresentationへ接続中。
- Persistenceへ複数ローカルスロット、Web JSON変換、独自JSON/Firestore値変換を追加。ServicesへFirestore REST、競合検知、プレゼント受領、レイド同期・順位報酬・プリントHTML印刷を分離。クラウド機能は本番を書き換えず、隔離試験で検証する方針。
- レイドFinishの二重コイン防止、原子的なファイル置換とバックアップ、装備の小数能力値保持、ポイント配分HP+6/MP+4とWeb読込時の二重加算防止、未知装備IDを捨てない変換、アイテムUID衝突防止、イベント日次/突破報酬の算数・漢字共有と受領履歴のWeb互換、プレゼント回収再配布の債務処理を修正。
- 算数の平均生成を正しい対称な数へ修正（Web由来の平均問題関数には元から誤答生成がある。Webソースは本移植で変更していない）。合成・修行のmul1..5/div1..5難易度を元仕様へ。かなの2択/4択と解説を出力しネイティブ戦闘へ接続。
- 装備ガチャはWeb同様1回150G/6回750G/13回1400G、10連券は10回、限定15%とコスト制限。BGM・音量保存、特技/回復の戦闘メニュー、同名装備の各UIDを選ぶ画面を追加。
- エクスポーターの問題抽出を固定乱数で再現可能にした。現時点15エリア/95ステージ/46装備/25キャラ/6フレーム/182画像。bandit_19の元データ不整合は警告として保持。
- scripts/test-unity-rules.pyはネットワーク禁止の独立C#試験。最新30,732件成功。実Unity参照のRuntime/Editor/Playerコンパイル3種成功。Unity内検証も8165問・戦闘・保存等成功（固定乱数再出力前の件数）。実Unity拠点の画像を目視確認。
- 開発用Editor APIでrefresh/validate/play/stopを操作可能。実シーンUI試験をscripts/test-unity-ui.pyへ追加。背面でゲーム更新が止まったためApplication.runInBackgroundとQA時QueuePlayerLoopUpdateで切り分け中。現行UI試験の結果は未確定。
- まだ全機能移植完了ではない。残件はDocs/MIGRATION.mdとunity-port/Docs/WORKLOG.mdで更新する。Webの継続、本番セーブ/ランキングへの非書込みは維持。

## 2026-10-19 — Unity版の主要機能移植とMacビルド
- Content / Domain / Persistence / Services / Presentation / Editorへ整理してネイティブC#・uGUIへ実装。15エリア95ステージ、46装備、25キャラ、6フレーム、193画像。Webのゲーム本体は変更せず保持。
- かな・漢字の複数読み/選択/五十音入力、戦闘/特技/能力/MP、個体UID装備・合成、種、両店舗・ガチャ・交換、共通正方形のキャラ/背景/フレーム・ホログラムを接続。
- 通常/シーズン2/2分のイベント、世界レイド、参加/順位コイン、クエスト・メダル・復習・学習記録、プリント/採点/チャレンジ・古代の設計図、保存前提案、管理設定を実装。
- Web JSON互換で未知フィールド・UID・未採点プリントを保持。Webで採点済みのプリントを再度有効にしない。バックアップ、クラウド競合防止、プレゼントと順位報酬の原子的受領、レイド再送の二重付与防止を確認。本番への書込み試験なし。
- 検証：独立C#32,221項目・クラウド代替試験成功。Runtime/Editor/Playerコンパイル成功。Unity内8,224問等成功。実シーン56操作成功。拠点・店・クエスト・かな入力の描画確認。Web26テスト・Viteビルドは成功済みで、game.jsの元ハッシュを維持。git diff --check成功。
- 最新Mac開発ビルド成功（607,923,955 bytes、エラー0）・単独タイトル表示確認。出力：移植先Temp/LegendHeroesQA/Build/LegendHeroes.app。CUAのクリックがnoWindowsAvailableとなるため単独アプリの開始後操作は未確認（実シーン操作試験とは別）。未使用URPポストエフェクトのシェーダー除外警告あり、ゲームUIの描画確認済み。
- 移植先Docs/MIGRATION.mdに機能対応と残る検証範囲を記載。スマホ実機/OS印刷/署名/ストア購入・月額課金は未対応または未検証で、販売可能な状態とは扱わない。

## 2026-10-19 — Web版とのUI・ルール一致を優先する標準版
- ユーザーからC#版のルール・拠点・冒険等の差を指摘され、「UIも全て同じに」と追加指示。標準をWeb共通コードのUnity/WebKitホストへ変更した。C#へ全部書換えたという説明はしない。先行C#版は比較用として保持。
- 現行HTML/CSS/JS・画像・音声をそのままアプリへ同梱。16個の元ソースのハッシュ一致を検証。Web本体・ブラウザ保存は変更しない。
- ネイティブホストはmacOS WebKit、読取専用localhost配信（Host/パス制限、音声Range）、印刷/ファイル/ダウンロード。PWAキャッシュ登録を外し、Chart.jsとライセンスを同梱、旧部屋URLのalias、Chrome/WebKitの文字組み補正、空の印刷ポップアップURL正規化を追加。
- QAはFirebaseを除いた別ビルド、非永続ストア、別ポート。製品への検証フック混入を検査。終了時の保存flushとバックグラウンド起動を設定。
- 確認：元Web26ルールテスト、16ソースハッシュ、Runtime/Editor/Playerの3コンパイル、配信27項目、実Unity/WebKit23画面34項目、Webとの10画面72コントロール配置比較（2CSSpx以内）、素材404なし、実印刷ホストへ10問と名前の伝達、既存Webゲームクライアントのスクリーンショット。
- Macアプリ最終ビルド成功857,931,835bytes、エラー0。保存先は移植先Builds/macOS/LegendHeroes.app。Tempへ置くとUnity再起動で消えるため、恒久の保存先へ変更。
- 単独アプリも実行し、HTTP200、素材100%、screen-title、JavaScriptエラーなしを今回固有の起動IDで確認。起動画像をアプリ自身のWebKitから取得。
- Macの画面ロックによりCUAの起動確認が長時間戻らず、単独アプリの物理クリックは未確認。解除を非同期で依頼。認証を回避しない。GUI操作以外の検証と保管を完了する。
- 全ての結果・代表画面は移植先Documentation/LegendHeroes/Verificationへ保管。標準シーンはLegendHeroesIdentical.unity。旧C#版の記録をNATIVE_COMPARISON.mdへ分離。
- 本番ランキング/共有セーブへの試験書込み、git push、公開なし。他のUnityゲームへの変更なし。

## 2026-10-19 — ロック解除後のMac版操作確認
- ユーザーの解除連絡後、確認用の二重起動を解消し単独Mac版を再起動。キーボードでSTART、新規登録フォームへの移動、日本語の入力値表示、消去、タイトル復帰を確認。新規セーブ確定や本番ランキング書込は実施していない。
- 座標クリックはCUAのnoWindowsAvailableが残るため、ボタンはアクセシビリティ操作で確認。日本語IME入力・音の聴感は検証範囲外。標準版は引き続きWebコード共通利用のUnity＋WebKit方式。

## 2026-10-19 — Save print suggestions and average answers
- Save-time challenge prints now prefer the raid-derived review stage, then the hardest cleared stage using the same progression lookup as Ancient blueprint prints. New saves without either retain the first-stage fallback.
- Fixed average generation: both operands use the same offset from the chosen integer mean, and the answer is calculated from the actual operands. Previously independent offsets could produce an incorrect answer (6 and 10 must average to 8).
- Verified all 33 mean/offset combinations, progression/legacy clear records and raid recommendation priority. All 27 Node tests and Vite build passed. Isolated Chrome checked both suggestion screens, 100 generated averages and no page errors; screenshots inspected. Standard skill-client smoke also passed. Local server: http://127.0.0.1:5178/. No production cloud writes or push.

## 2026-10-19 — Complete multiplication table print sets
- Each area2 table print now contains its fixed table multiplied by every number 1–10 exactly once, shuffled independently for sets A/B/C. This covers ordinary, challenge and blueprint stage prints, with the same order stored for grading. Other stage generators and combat questions are unchanged.
- Verified tables 1–9 across all sets and print modes, correct answers and metadata order; all 28 Node tests and Vite build passed. Isolated Chrome verified all three 7-table previews and no page errors; preview and skill-client smoke screenshots inspected. No push.

## 2026-10-19 — Restore decimal average questions
- Restored independent operand offsets so average problems include integer and half-integer answers as before. The answer remains calculated from the displayed operands, rather than the random center; 6 and 10 average to 8, and 6 and 9 average to 7.5. No rounding is needed.
- Exhaustively checked all 99 generation combinations and both regression examples. All 28 Node tests and Vite build passed; isolated Chrome checked 100 generated averages and print selection without page errors. No push.

## 2026-10-19 — Halloween candy exchange confirmation and repeat gear
- Raised the exchange confirmation above the Halloween menu (11000 vs 10900) so its buttons receive clicks. Equipment exchanges now remain available after acquisition and create a separate owned copy for each payment; cosmetics retain their one-time ownership checks.
- Extended rule tests for repeat purchases, distinct UIDs/ability/rarity and insufficient candy. Added isolated browser checks for hit-testing the foreground confirm button, cancel without spending, two paid staff exchanges, cosmetic ownership and insufficient funds, including desktop/mobile screenshots. All 28 rule tests and Vite build passed; screenshots inspected. No production cloud writes or push.

## 2026-10-19 — Portrait vertical kanji print layout
- Used the supplied k2-testa4.pdf as a visual reference: A4 portrait, vertical writing, right-to-left question order, two bands with a black divider, square black answer cells, right-side instructions/name and print ID. Preserved ten questions (five per band), existing word-based content and grading metadata; no copied reference sentences. Writing cells match the target word length; reading/mixed modes remain available. Kana retains its existing special-character sheet.
- Shared the new layout across kanji stage, challenge, Ancient blueprint and boss prints. Existing reward/name metadata and post-print callbacks are preserved. Added isolated browser checks for all three modes, stage/boss integration, cell counts, right-to-left order and page bounds; inspected all three print-media screenshots. All 28 Node tests and production build passed. No push.

## 2026-10-19 — Explicit kanji print choices and parenthesis answers
- Labeled kanji choices A 漢字の読み / B 書き取り / C ミックス. Previews now use the same prompt/mode and kanji/kana segmentation as printing, including hiragana writing prompts and per-question mixed-mode labels. Kept other print choice defaults intact.
- Reading sheets use an open parenthesis answer area to the right of each kanji, with no cells. Writing sheets use square cells only for kanji runs and parenthesis spaces for okurigana, including internal kana between kanji runs. Neither blank type exposes the answer.
- Isolated browser assertions verified preview/print prompt equality for stage and boss, zero reading cells, right-side reading fields, and 弱い as one kanji cell plus one suffix bracket. Inspected reading/writing/mixed and choice screenshots. All 28 Node tests and build passed. No push.

## 2026-10-19 — Three-column choices and kanji print metadata
- Replaced wrapping fixed-width choice cards with a three-column grid in a wider modal. Card previews scroll independently while print buttons remain visible. Narrow phone screens retain the three choices in a horizontally scrollable row.
- Removed repeated per-question instruction captions. Added a horizontal print header with area/stage, variant, save name, print number and a reward banner matching ordinary/challenge/blueprint mode. Retained portrait vertical questions and the parenthesis/cell answer formats.
- Browser tests verified three choices on one row, actual stage/boss metadata and rewards, absent per-question captions and A4 bounds. Inspected choice and printed-page screenshots; all 28 Node tests and Vite build passed. No push.

## 2026-10-19 — Larger handwriting spaces
- Enlarged kanji cells from 13mm to a basic 18mm square, parentheses from 22pt to 30pt and prompt type from 16pt to 18pt. Reading blanks now reserve at least 40mm and okurigana blanks at least 24mm before long-word scaling. Long compound/okurigana answers adapt to the available band height rather than spilling into the next band.
- Browser checks verified 18mm cells for short words, minimum reading space, no crossing band boundaries (including 取り出す), and existing metadata/three-column previews. All 28 Node tests and Vite build passed; enlarged writing/reading screenshots inspected. No push.

## 2026-10-19 — Context sentences for kanji worksheets
- Added original short context sentences in kanji_print_context.js, concentrating on existing lower-grade words and common ambiguous readings (橋 vs 箸). Words without a dedicated sentence use a grammatical quotation-based study sentence; this is not a claim that every word has a bespoke semantic clue.
- Kanji print variants persist before/after context with each generated problem, retain the original target text/answer for grading, and render the same sentence with an underlined target in preview and print. Writing targets display the reading, reading targets display the kanji. A4 portrait, large cells/parentheses and all metadata remain; answer placement aligns after the sentence prefix and adapts to available band height.
- All 29 Node tests passed, including context validity across the kanji bank, stable saved sentences and unchanged grading targets. Stage/boss browser tests verified actual preview prompts, sentences, all three modes, page/band bounds and no page errors. Inspected context sheet and preview screenshots; production build passed. No push.

## 2026-10-19 — Mixed kanji worksheet ordering and uniqueness
- Mixed sheets now use reading questions 1–5 in the upper band and writing questions 6–10 in the lower band; choice previews use the same ordering.
- All kanji variants reject repeated target words or readings across the entire sheet, including homophones and normalized kana variants. Sampling is bounded, with recovery from the same tier pools rather than introducing another stage's vocabulary.
- All 30 Node tests and production build passed. Browser tests verified stage/boss variants, unique words/readings, mixed upper/lower modes, page bounds and no page errors. Inspected the mixed worksheet screenshot. Firebase rules unchanged; no push.

## 2026-10-19 — Align kanji targets and answer fields
- Replaced estimated prefix padding with shared grid rows: sentence prefixes occupy their own row and the target word and answer begin together below it. Reading brackets are font-independent CSS curves so vertical glyph spacing cannot shift their start below the kanji. Writing remains on the left and reading answers on the right.
- Added browser assertions for target/answer top alignment across all three modes and actual stage/boss mixed sheets (upper five reading, lower five writing). Inspected fixture and actual mixed screenshots; all 30 Node tests, browser checks and production build passed.
- Restarted local Vite at http://127.0.0.1:5178/ with current workspace sources. Already-open print popups must be recreated; they are static documents. No Firebase rules or saved player data changed; no push.

## 2026-10-19 — RPG contexts and shared print reward strip
- Added adventure-specific contexts for common worksheet words: village/castle, allies, training, magic, weapons and treasure. Remaining ordinary vocabulary retains natural examples; unknown terms use a guild quotation-based study sentence. Preserved target words/readings and previously saved contexts. Corner (角／かど) remains a corner, not a horn.
- Math stage/boss and kanji stage/boss worksheets share an icon reward strip immediately below the title, before name/print ID. Displays per-correct-answer EXP/G, item thresholds, all-correct seed/G bonuses, challenge ticket and blueprint gear where applicable. This changes presentation, not payout logic; removed the misleading ordinary-print triple-reward banner.
- Retained portrait vertical kanji sheets, mixed upper-reading/lower-writing bands and large short-word cells; reserved more header room and bounded long answer fields. Browser checks cover icon image loading, title/reward/name order, normal/challenge/blueprint/boss math, kanji variants and page bounds. Screenshots inspected. No Firebase rules changed and no push.

## 2026-10-19 — Reward conditions and print reward audit
- Printed reward conditions now use required correct-answer counts (5/8/10 for ten questions; calculated from actual kanji sheet length), with icons contained inside bordered 7mm squares. Removed the kanji instruction sidebar entirely and reclaimed its width for questions. No change to the mixed upper-reading/lower-writing ordering.
- Audit requested by user: print payouts are NOT tied to current gameplay rewards. grantPrintRewards uses correct*20 EXP and correct*10 G, plus fixed threshold bonuses; only challengePrint multiplies this print-specific base/consumables by three. Ordinary prints use multiplier one. Stage/boss milestones use the same normal claim-once functions, without multiplying them. Gameplay uses defeated enemy EXP/random gold and drop profiles. Reported this mismatch; no economic rebalance was made without a separate request.
- All 31 Node tests and build passed; browser tests check count-based conditions, square clipped icons, absent sidebar and page bounds. Firebase rules unchanged; no push.

## 2026-10-19 — Print completion and compact answer-entry dialog
- Confirmed ordinary/challenge stage worksheets count as one stage clear at 8/10 correct, not three clears. Seven correct does not clear. Existing milestone functions are shared with gameplay. Added an in-memory per-sheet rewardsGranted guard to block duplicate pending grading callbacks for ordinary prints as well as challenge prints. Tests cover four different sheets, capped stars, cumulative clears and duplicate callbacks.
- Reworked unified answer entry into a bounded dialog with two five-row columns on desktop and one compact ten-row column on mobile, fixed grading actions and no nested problem scrollbar. Added associated labels and IME-safe Enter-to-next-field focus. Parent grading uses the same grid with compact answer/check controls. Hide floating clock/menu/audio widgets while this dialog is open.
- Browser tests exercise math and kanji, student and parent grading at 1280x900, 846x827, 390x844, 375x667 and 844x390, including actual grading and focus behavior. Also cover twenty-question sheets on desktop and portrait mobile. Screenshots inspected; existing 31 Node tests passed. No Firebase changes or push.

## 2026-10-19 — Animated worksheet score result
- Student answer grading and parent checkbox submission now show a shared score dialog: normalized 100-point score, exact correct/total count, animated count-up and marks, high-score confetti and a perfect-score stamp. Result remains until the user chooses to see rewards. Short-screen and reduced-motion variants supported.
- Stage/boss passing results explicitly show one clear, not three. The existing grantPrintRewards payout and claim protections are unchanged. A per-sheet scoreShowing guard, a one-shot continue callback and game/slot identity checks prevent duplicated results or stale reward delivery. Keyboard focus stays on the result action.
- Browser tests cover 100/80/0 points, ten/twenty questions, parent grading, delayed payout, duplicate grading guard, small/landscape result bounds and reduced motion. Screenshots of desktop, mobile and landscape results inspected; 31 Node tests and build passed. No Firebase rule changes or push.

## 2026-10-19 — Web-first release blockers and scope freeze
- Web only for now. Old memo-derived feature/improvement backlog is on hold; none of the current release changes were started solely from those old notes. Preserve unrelated dirty changes. The earlier build-unity-web.mjs source-hash guard edit remains, but no Unity packaging/sync/compile was run; do no additional Unity work.
- Fixed fully simplified ratios (including saved legacy noncanonical answers), strict worksheet remainder grading, alternate single-kanji readings, and destructive math token stripping. Shared battle/print validation now accepts equivalent fractions, exact decimals/full-width digits and question-specific distance/area units; rejects wrong units, wrong remainders, zero denominators and malformed expressions. Circle questions explicitly state pi=3.14. Numeric decimals use exact rational comparison, not floating-point rounding equality.
- Independent oracle tests covered 28,120 generated questions across area4/area11/area12 stages and boss entries: 903 exhaustive, 217 boundaries, 27,000 seeded, zero answer mismatches. Mixed combinations remain sampled, and no absent curriculum types were added.
- Storage quota fallback now reads latest memory values before stale disk values, maintains deletion tombstones and shows a failure warning. This is session-only fallback, not durable storage. Replaced undefined owned-shop notification with the existing confirmation modal.
- Added server-only LINE Login protocol and HTTP adapters: PKCE/state/nonce, verified ID tokens, bound one-use callback, explicit account linking, HttpOnly/Lax cookie and rotation, same-origin start/logout. Mock-provider protocol and real local HTTP tests pass. No real channel/secret created, no persistent production store or game UI/Firebase authentication integration yet; do not represent live login as ready.
- 36 Node tests pass. Isolated browser checks cover desktop/mobile boot, 16 screen/back routes and 12 real battle-input acceptance/rejection cases; print answer/parent/score layouts also pass. Inspected screenshots after transition completion. Simplified boot button text to prevent a dangling decorative icon line. Standard development-client boot smoke inspected. Physical Safari, actual LINE, payment and production authorization are unverified.
- Web build succeeds locally. WEB_RELEASE_STATUS.md records scope, evidence, LINE store contracts and paid-publication blockers: globally readable/writable save architecture, open tracked Firestore rules, no verified entitlement/payment backend, unsafe legacy ownership assumptions. Do not deploy, push or change live rules/data.

## 2026-10-19 — Three-child purchaser accounts and integrated local auth path
- Confirmed latest user requirement: one LINE purchaser owns three child/player saves, not three LINE accounts. Organization capacity is server-configurable (10/20 examples; arbitrary 42 tested). No subscription model or prices inferred. Old memo backlog and Unity remain on hold.
- Added account-save service/HTTP adapter enforcing owner identity from a verified session, server catalog/verified receipt entitlements, transactional slot caps, idempotent purchase evidence, and optimistic save revisions. Twelve concurrent creations yield exactly three saves. Reduced capacity never deletes existing saves; all archived saves still count. Legacy import requires a server-side ownership verifier and retains original keys/state; no real legacy proof has been chosen or enabled.
- Added local durable account/session/identity/entitlement/save store using serialized transactions, atomic file replacement, private file modes and one-process ownership lock. Tested restart retention and same-LINE restoration from another browser. This is a local fixture adapter, not a production database.
- Added opt-in account client (`VITE_ACCOUNT_BACKEND=1`) and actual game integration: login gate, purchaser slot count/logout, server-created player keys, owner-filtered lists/load, no auto-upload of unknown local saves, serialized writes and conflict backups. Account mode never imports globally shared Firebase adapter. Default mode remains unchanged for existing users. Unknown local data is retained, not claimed/deleted.
- Added explicitly mock-only local game runner (scripts/run-local-account-demo.mjs --mock-line; default port5181). No real LINE/payment/Firebase or child data; visible mock banner. Real LINE protocol and HTTP modules remain separate from the mock provider. New account mode does not yet supply shared raid/admin cloud APIs; do not silently load legacy Firebase to bypass that gap.
- Actual browser login flow exposed service-worker caching of account/save API responses. Fixed /api/ to network-only with no stale/offline private response, exact-origin comparison, no-store handling and cache v22 rotation. Existing localStorage saves retained. Browser checks now pass real game creation of three children, fourth denied, logout/account isolation, new-device restore and conflict backup. Screenshots inspected after animation completion.
- 39 Node tests pass, including protocol/HTTP/store/restart/cap/cache/client tests. Both account-mode and default Web builds pass. Default player-view and print-entry checks remain verified. Production credentials, live provider verification, payment signatures/refunds, legacy ownership policy, durable hosted DB, shared raid/admin integration and physical Safari are not complete. No deploy, push, live data/rule changes or Unity work.

## 2026-10-20 — Dedicated math-input UI verification
- Preserved battle quotient/remainder, fraction numerator/denominator and ratio left/right slots, including switching back to edit a prior slot. Added separate quotient/remainder fields to print answer entry; Enter moves to the remainder and grading reads both. Blank remainder is not implicitly zero.
- Real math-input browser coverage spans all 51 math stages, 14 boss entry points, four boundaries and two unit-entry cases: 142 battle and 142 print inputs across desktop/mobile. Mobile battle answers use actual onscreen keypad clicks, not programmatic typing into read-only inputs. Training transitions also tested. Wrong/missing remainders, zero denominator, unsimplified ratios and wrong units are rejected; physical iOS keyboard remains unverified.
- Actual UI checks found mobile training input minimum width clipping its controls; fixed flex shrink with min-width:0. Finished math challenges now retain their cleanup handle until destruction so hidden old inputs do not survive battle/training transitions. Destruction cancels stale delayed callbacks. Existing dedicated answer layout was not replaced with a generic input.
- Print entry/parent grading/score regression checks pass with dedicated remainder fields. Node suite remains 39 passing tests. Informational confirmations with no action now have one Close button, not misleading Yes/No actions. WEB_RELEASE_STATUS.md contains the full current implementation and real-connection blockers. Old memo backlog, Unity, live credentials/data/rules, deploy and push remain untouched.

## 2026-10-20 — Finish existing raid/admin API account connection
- Moved the existing EventRaidAPI/RaidBossAPI/AdminGiftAPI rules into game_cloud_apis.js and reused them from both legacy Firebase and the account server. Reversing factory/clock substitutions matches the original HEAD API bodies exactly; gameplay rewards and settlement timing were not changed.
- Added account-game HTTP/service and a transactional document adapter over the local account store. Every request verifies session, active purchase where needed, save ownership and server-side admin roles. Gift send/target metadata/history require admin; claiming and raid/event mutations require the owning account. Client roles, public profile overrides and fallback save payloads are not trusted. Save revision conflicts fail rather than overwriting another device's progress.
- Added account_game_client.js preserving the existing API call shapes, serialized state preservation/RPC calls and authoritative save revision adoption. Boss HP watching uses a one-second poll with unsubscribe. Legacy raid imports for foreign saves are not sent under another account. Account-mode cloud refresh also reloads the current owned state so an old in-memory game cannot overwrite a newly fetched reward.
- Connected the existing Tools gift panel to server-authorized recipient metadata; no other purchaser save bodies are loaded. Non-admin users see a permission message and disabled send control; direct forged requests also fail. Parent-local settings/date gate are not treated as shared server administrator proof. No real admin identities/roles were read or changed.
- Initial local boss uses the existing initialization path, preserving first ticket delivery and an enabled challenge button. Shared raid/event documents persist additively without discarding old account/save data. Fixed mock CLI SIGTERM ordering so Vite does not exit before the account-store lock is released; same fixture directory survives restart.
- Focused real HTTP tests cover simultaneous damage, settlement/next boss/history, one-time rank/event payouts, gift ownership/claim-once, no client fallback overwrite, public rank projection, polling stop, role/session revocation, server save revisions, restart and old-format preservation. Actual account-mode browser test passed initial ticket, shared remaining HP 880/1000 after another player's 120 damage, non-admin denial, fixture-admin gift UI send/preview/receive/save, and event ranking. Screenshots inspected. Related 3-slot account/switch/restore/conflict browser regression passed; completed broad math/layout QA was not rerun.
- Local permitted scope is now complete. Remaining blockers are real LINE channel/secrets/callback, payment provider/pricing/cancellation policy, legacy ownership proof, hosted DB/server permissions and actual admin identities. Physical Safari/mobile keyboards remain unverified. No publish/deploy/push, real payment/child data/credential/production rule changes, Unity or old memo feature work.
- Final owner-isolation regression: gift administrators still cannot list, directly GET, cache, select or load another purchaser's saves. Actual selection UI shows only the administrator's own fixture profile; forged owner query is ignored and direct foreign read returns 404. Targeted API/browser tests and all 41 aggregate tests pass; both normal and account-mode builds passed. Web-first remains the release direction; no production release performed.

## 2026-10-20 Stripe buy-once preparation
- User chose Stripe, one-time purchase, deployment from workplace PC. Added official SDK server integration, authenticated server-price Checkout, raw-body signed webhook verification, persisted order/idempotency mapping and existing account purchase fulfillment. No subscriptions, prices chosen, live keys, network calls to Stripe, real charges or deploy/push.
- Client purchase gate is opt-in with VITE_STRIPE_CHECKOUT=1; cancel/pending states do not grant entitlement. Existing local mock runner stays mock-only. Added .env secret-file ignores and detailed workplace setup/release blockers to WEB_RELEASE_STATUS.md.
- Local npm tree has preexisting malformed version metadata; installing directly failed. Added SDK via isolated temporary install and preserved original lock entries, adding only Stripe metadata. No broad dependency upgrades. Isolated install reported dependency audit findings; no force-fix applied.
- Official SDK fixture signatures + local HTTP tests pass forged/stale/unpaid/wrong-owner/wrong-price rejection, simultaneous repeated completion, exact 3 slots and persistent re-login. All 42 aggregate tests and offline mobile Checkout UI test passed. Real Stripe sandbox checkout, deployed API/DB/LINE wiring, price, refund/dispute handling and production security remain workplace tasks.

## 2026-10-20 Organization buy-once plans
- Added organization30 to the server catalog and Stripe price mapping for personal3 / organization10 / organization20 / organization30. Authenticated product listing exposes configured one-time JPY prices and only plans above current capacity. Total capacity is max purchased, not additive; upgrades preserve original saves and deny same/smaller plan checkout. No administrator privileges are granted.
- Purchase gate has an actual plan select; paid title/account controls can select a larger plan. Configured Stripe price is the full amount, with an explicit upgrade notice; prorated/difference upgrade pricing is NOT implemented or approved. Recommendations only: personal4980, group10 19800, group20 34800, group30 49800 JPY including tax, not configured live.
- Fixture SDK/HTTP tests cover all capacities, direct organization purchase, upgrade data retention, duplicate and unauthorized input, concurrent 30-slot cap and persistence. Offline browser exercises group selection, purchase recovery and paid upgrade UI. No live prices/charges/deployment/push. Workplace setup variables and remaining commercial decisions recorded in WEB_RELEASE_STATUS.md.

## 2026-10-20 Approved prices and difference upgrades
- User approved setting the proposed tax-inclusive one-time prices: personal3 4980 / organization10 19800 / organization20 34800 / organization30 49800 JPY. Added server/purchase-pricing.mjs as the canonical catalog. This supersedes the earlier tentative prices and full-price-only upgrade notes.
- Stripe catalog entries must exactly match approved totals, JPY, one_time and tax_behavior=inclusive. Server-owned current capacity determines credit; all six upgrade combinations charge only the catalog difference via server price_data. Signed webhook checks Session ID, actual amount and line unit amount before granting capacity.
- One active checkout per account prevents simultaneous credit reuse. Explicit cancellation expires an unpaid Stripe session; paid sessions must finish fulfillment. UI shows tax-inclusive totals/differences and a cancellation recovery action.
- Added preview-only/test-only Stripe catalog setup script, repeat-safe lookup keys and offline fixtures. Checked configuration presence only: this PC has no STRIPE credentials/settings. No actual Stripe registration, network payment, deploy or push. Workplace must safely configure sandbox credentials and run --apply-test, then perform real sandbox checkout and later authorized live registration.
- All 43 aggregate tests passed, including all six actual fixture upgrade fulfillment paths, totals adding to 49,800 JPY, cross-owner cancellation denial, unpaid cancellation and paid cancellation refusal. Mobile purchase/difference/cancel UI passed and screenshots inspected. Both account/Stripe-enabled and normal builds passed. Registration script is included in the release fingerprint.
