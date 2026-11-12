#!/usr/bin/env python3
"""Static Pillow render of every real combat portrait crop; no browser involved."""
from __future__ import annotations

from PIL import Image, ImageDraw, ImageFont, ImageOps
from pathlib import Path
import json
import math
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/private/tmp')
MANIFEST = json.loads((ROOT / 'battle_avatar_crops.json').read_text())
GAME = (ROOT / 'game.js').read_text()
BLOCK = GAME[GAME.index('const HERO_AVATARS = ['):GAME.index('const INITIAL_AVATAR_IDS')]
avatars: dict[str, str] = {}
for line in BLOCK.splitlines():
    skin_id = re.search(r"\bid\s*:\s*'([^']+)'", line)
    image_path = re.search(r"\bimage\s*:\s*'([^']+)'", line)
    if skin_id and image_path:
        avatars[skin_id.group(1)] = image_path.group(1)
    if 'GHOST_RAID_SKIN' in line:
        ghost_source = (ROOT / 'ghost_raid_content.js').read_text()
        ghost = re.search(r"GHOST_RAID_SKIN=\{id:'([^']+)'.*?image:'([^']+)'", ghost_source)
        assert ghost, 'raid skin definition exists'
        avatars[ghost.group(1)] = ghost.group(2)

skins: dict[str, dict] = MANIFEST['skins']
assert len(avatars) == 26, len(avatars)
assert set(avatars) == set(skins), f"skin coverage differs: {set(avatars) ^ set(skins)}"
assert MANIFEST['fallbackId'] in skins
font = ImageFont.load_default()
frame_sizes = (38, 52, 64)
columns = 3
group_size = 9
cell_width, cell_height = 500, 255


def render_crop(source: Image.Image, cfg: dict, size: int) -> Image.Image:
    """Match the battle img's square box, contain fit, center/top object-position and clip."""
    supersample = 4
    frame = size * supersample
    zoom = cfg['zoom']
    box = round(frame * zoom / 100)
    width, height = source.size
    max_dimension = max(width, height)
    scale = box / max_dimension
    content_size = (max(1, round(width * scale)), max(1, round(height * scale)))
    content = source.resize(content_size, Image.Resampling.LANCZOS)
    layer = Image.new('RGBA', (box, box), (0, 0, 0, 0))
    content_x = (box - content.width) // 2
    # CSS object-position is center top: portrait content is top-aligned.
    layer.alpha_composite(content, (content_x, 0))

    width_ratio = width / max_dimension
    left_percent = 50 - zoom * (cfg['focusX'] * width_ratio + (1 - width_ratio) / 2)
    top_percent = 50 - zoom * cfg['focusY'] * height / max_dimension
    left, top = round(frame * left_percent / 100), round(frame * top_percent / 100)

    stage = Image.new('RGBA', (frame, frame), (76, 79, 91, 255))
    stage.alpha_composite(layer, (left, top))
    stage = stage.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=max(2, round(size * 4 / 52)), fill=255)
    stage.putalpha(mask)
    ImageDraw.Draw(stage).rounded_rectangle((0, 0, size - 1, size - 1), radius=max(2, round(size * 4 / 52)), outline=(255, 225, 153, 255), width=max(1, round(size / 38)))
    return stage


for start in range(0, len(avatars), group_size):
    group = list(avatars.items())[start:start + group_size]
    rows = math.ceil(len(group) / columns)
    sheet = Image.new('RGB', (columns * cell_width, rows * cell_height), (30, 32, 40))
    draw = ImageDraw.Draw(sheet)
    for offset, (skin_id, image_path) in enumerate(group):
        cfg = skins[skin_id]
        assert cfg['image'] == image_path, f'{skin_id}: configured file differs from HERO_AVATARS'
        path = ROOT / image_path
        assert path.is_file(), f'{skin_id}: missing {path}'
        source = Image.open(path).convert('RGBA')
        assert list(source.size) == cfg['sourceSize'], f'{skin_id}: source dimensions changed: {source.size}'
        fx = min(source.width - 1, max(0, round(cfg['focusX'] * source.width)))
        fy = min(source.height - 1, max(0, round(cfg['focusY'] * source.height)))
        assert source.getchannel('A').getpixel((fx, fy)) > 0, f'{skin_id}: focus falls outside visible art'

        row, col = divmod(offset, columns)
        x, y = col * cell_width, row * cell_height
        draw.text((x + 8, y + 6), f"{skin_id}  zoom={cfg['zoom']}% focus=({cfg['focusX']:.2f},{cfg['focusY']:.2f})", fill='white', font=font)
        preview = ImageOps.contain(source, (126, 126))
        thumb = Image.new('RGBA', (132, 132), (75, 78, 88, 255))
        thumb.alpha_composite(preview, ((132 - preview.width) // 2, (132 - preview.height) // 2))
        point_x = (132 - preview.width) // 2 + round(cfg['focusX'] * preview.width)
        point_y = (132 - preview.height) // 2 + round(cfg['focusY'] * preview.height)
        ImageDraw.Draw(thumb).ellipse((point_x - 3, point_y - 3, point_x + 3, point_y + 3), fill=(255, 70, 70, 255))
        sheet.paste(thumb.convert('RGB'), (x + 8, y + 34))
        sizes = [render_crop(source, cfg, size) for size in frame_sizes]
        offsets = (x + 154, x + 250, x + 363)
        for size, crop, at in zip(frame_sizes, sizes, offsets):
            sheet.paste(crop.resize((size * 2, size * 2), Image.Resampling.NEAREST).convert('RGB'), (at, y + 34))
            draw.text((at, y + 164), f'{size}px', fill='#d7d7df', font=font)
        # Confirm each simulated frame exposes the manually selected face center.
        for size, crop in zip(frame_sizes, sizes):
            assert crop.size == (size, size)
            assert crop.getpixel((size // 2, size // 2)) != (76, 79, 91), f'{skin_id}: blank center at {size}px'
    path = OUT / f"avatar-face-review-{start // group_size + 1}.png"
    sheet.save(path)
    print(path)

print(f'PASS: statically composited {len(avatars)} skins at {frame_sizes}px; source dimensions, focus pixels, fallback, and all crop records verified.')
