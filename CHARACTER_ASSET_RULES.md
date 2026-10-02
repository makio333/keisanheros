# Character Asset Rules

Use these rules when adding new high-resolution player avatar images.

- Output format: PNG with a real transparent background.
- Canvas size: 1024 x 1024 px.
- Placement: center the full visible character and effects in the square canvas. Keep a small, even margin; do not anchor the character to the bottom.
- Style: match the existing high-resolution `ai_hero_*` look: polished chibi anime fantasy RPG, clean thick outline, soft cel shading, bright readable colors, cute heroic proportions, detailed equipment, and subtle magic/effect accents.
- Do not use pixel art for these high-resolution avatars.
- Do not include text, logos, watermarks, or a painted square/gradient background.
- Preserve UI readability at small sizes: silhouette, face, weapon, and main color identity should remain clear in a 52 px thumbnail.
- After generation, verify the asset in the new-game selector and home avatar frame. If it appears too high/low, fix the PNG canvas placement before shipping.
- When replacing an already-used generated avatar, prefer a new versioned filename instead of overwriting the same path, so browser/PWA caches cannot keep showing the old background.

## Raid Boss And Background Rules

- Raid boss sprites should use transparent PNGs with no painted background, text, logo, or watermark.
- Raid boss sprite canvas size should be 1024 x 1024 px, with the full visible boss and effects centered in the square canvas.
- When the user asks for a pixel-art raid enemy, keep the whole asset in pixel-art style, including effects such as flames, glow, claws, and outlines.
- Current raid boss direction: black and red dragon facing forward, claws raised toward the viewer, wrapped in blue flame. Keep it in crisp retro fantasy RPG pixel-art style, not painterly high-resolution illustration.
- Raid battle backgrounds should match the enemy style. Current raid background direction: pixel-art volcanic arena, lava and magma across the scene.
- Prefer new versioned filenames when changing raid assets, so browser/PWA caches do not keep showing older images.
