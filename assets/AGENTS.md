# Game artwork rules

## Canonical pixel style
- Match the original Halloween equipment: `halloween/equip_pumpkin_blade.png`, `halloween/equip_witch_mantle.png`, and `halloween/equip_moon_charm.png`. Inspect and supply these as generation references.
- Equipment uses the visual density of a **128 × 128 logical pixel grid**. New frames use **128 × 128 logical pixels**, square **1:1**. Frames must be redrawn natively for the square canvas, keeping crowns, moons and jewels undistorted; do not stretch portrait assets to square. Larger source PNGs are acceptable only when visibly composed of those coarse square pixel clusters.
- Use roughly **24–32 colors**, a **1 logical pixel dark outline**, and **3–4 flat shades per material**. Keep highlights and small ornaments as big readable clusters. No smooth painted gradients, micro-texture, hairline filigree, blur or high-resolution painted illustration disguised as pixel art.
- Check every asset at the game's **48px and 88px** display sizes against the canonical sprites. If it looks finer than those references, regenerate it. Do not fix a stylistic mismatch by merely applying a CSS filter.
- New equipment and decorations must be individually generated bitmap art. Do not reuse unrelated existing equipment art or replace finished artwork with simple SVG shapes.

## Transparency and direction
- Request genuine alpha transparency. No baked card, frame rectangle, checkerboard, floor, ground line, backdrop, dirty matte or broad opaque glow.
- Single-bladed weapons point **upper right**, with grip **lower left**. Existing opposite-facing weapons may be flipped when authorized; keep dual blades intentionally symmetric.
- Equipment should fill about 84% of its square canvas with a transparent margin. Wooden, copper and steel starter weapons must differ in silhouette as well as color.

## Avatar cosmetics and frames
- User-facing name for foreground decorations is **フレーム** (frame). Character, background and frame are independent tabs in one selector and are saved together only after confirmation; closing cancels all pending changes. Keep existing decoration IDs and save fields compatible.
- Use one **1:1 square** character stage everywhere: background cover → whole character contained and bottom centered → decoration in front. Fit the frame to the square stage instead of changing the stage to match the source artwork. Keep characters undistorted with object-fit:contain and the same 4% inset across home, room, combat, ranking, save cards and outfit preview.
- Product/reward lists and their artwork enlargement show only the acquired asset: character alone, background alone, decoration alone. Never combine a product thumbnail with the currently equipped character, background or decoration. Outfit composition is reserved for player portraits and explicit outfit previews.
- Frames are **thin corner ornaments**, not wide decorative borders. Keep straight connectors thin (**3 logical pixels or less**) and inside the outer **10%** edge strip. Keep corner clusters within about **20–22%** of the canvas at the extreme corners; their mass must hug the corners, never extend toward the face.
- The central **56% square** (x/y 22–78%) and the **face rectangle x22–78%, y15–60%** must be entirely alpha-transparent. Keep the rest of the interior empty except the extreme corner clusters. No top-center crowns, dangling moons, hanging gems, bead swags across the forehead, or broad banners. Move distinctive motifs into the corners; keep the upper-center line no thicker than 3%.
- Preserve the character's existing size and placement; do not shrink the character to accommodate an oversized frame. Check every frame as a real composite with several character silhouettes at 48px, 88px and full preview size before accepting it.

## Integration
- Keep equipment IDs, base stats, costs and owned copies intact for artwork changes. Give event equipment its guaranteed ability through `event_equipment.js`, including legacy owned copies.
- Save generated assets in the workspace and record the actual prompts and reference files in the artwork manifest. Keep rejected iterations out of runtime references.
