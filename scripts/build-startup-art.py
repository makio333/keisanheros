"""Create lightweight startup-only copies; original game artwork is preserved."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
items=[
 ('画像/home_town_v2.png','home.webp',1600),
 ('画像/title_sky_v2.png','title-sky.webp',1600),
 ('画像/title_foreground_v2.png','title-foreground.webp',1600),
 ('画像/title_logo_transparent.png','title-logo.webp',1400),
 ('assets/characters/bg_skin_forest.png','forest.webp',1400),
 ('assets/characters/hero_female_1_hd.png','adventurer.webp',800),
 ('assets/characters/hero_male_2_hd.png','knight.webp',800),
 ('assets/characters/skin_forest_scout_f.png','scout.webp',800),
]
for source,target,size in items:
 image=Image.open(root/source).convert('RGBA');image.thumbnail((size,size),Image.Resampling.LANCZOS)
 image.save(root/'assets/boot'/target,'WEBP',quality=85,method=6)
print('Startup artwork bytes:',sum(p.stat().st_size for p in (root/'assets/boot').glob('*.webp')))
