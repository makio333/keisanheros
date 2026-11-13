"""Build strictly lossless delivery copies. Never resize or create preview imagery."""
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, io, re
root=Path(__file__).resolve().parents[1];out=root/'assets/runtime';out.mkdir(parents=True,exist_ok=True)
patterns=['assets/**/*','画像/ステージ/*.jpg','画像/ステージ/戦闘背景/*.png','画像/スキル/**/*','画像/エフェクト/**/*','画像/キャラクター/**/*','画像/title_*.png','画像/title_*.jpg','画像/home_town_v2.png','画像/bg_*.jpg','画像/training_dummy*.png','画像/training_dummy*.jpg','画像/NPC/**/*']
files=sorted({p for pat in patterns for p in root.glob(pat) if p.is_file() and p.suffix.lower() in ['.png','.jpg','.jpeg','.webp'] and not any(x in p.as_posix() for x in ['assets/runtime/','assets/boot/','assets/monsters/'])})
version='original-quality-v3'
def convert(p):
 source=p.relative_to(root).as_posix();raw=p.read_bytes();im=Image.open(p);size=im.size
 signature=hashlib.sha256(raw+version.encode()).hexdigest()[:16];stem=hashlib.sha1(source.encode()).hexdigest()[:12]+'-'+signature
 target=out/(stem+'.webp');verified=False
 # Preserve animated/high-depth/metadata-bearing files and already-compressed formats verbatim.
 eligible=p.suffix.lower()=='.png' and im.mode in ['RGB','RGBA','P','L','LA'] and not im.info.get('icc_profile') and not im.getexif() and not getattr(im,'is_animated',False)
 if eligible:
  if not target.exists():
   buffer=io.BytesIO();im.save(buffer,'WEBP',lossless=True,quality=100,method=1,exact=True);data=buffer.getvalue()
   if len(data)<len(raw):
    decoded=Image.open(io.BytesIO(data)).convert('RGBA')
    if decoded.size==size and decoded.tobytes()==im.convert('RGBA').tobytes():target.write_bytes(data)
  if target.exists():
   decoded=Image.open(target).convert('RGBA');verified=decoded.size==size and decoded.tobytes()==im.convert('RGBA').tobytes()
 if not verified:target=p
 return {'source':source,'file':target.relative_to(root).as_posix(),'bytes':target.stat().st_size,'originalBytes':len(raw),'size':size,'lossless':True,'pixelVerified':verified or target==p}
with ThreadPoolExecutor(max_workers=4) as pool:entries=list(pool.map(convert,files))
css_sources=[];known={e['source'] for e in entries}
for css in root.glob('*.css'):
 for match in re.finditer(r'url\([\"\']?([^\"\')]+)',css.read_text()):
  try:source=(css.parent/match.group(1).split('?')[0]).resolve().relative_to(root).as_posix()
  except ValueError:continue
  if source in known and not any(e['source']==source for e in css_sources):css_sources.append({'source':source,'variable':'--game-art-'+hashlib.sha1(source.encode()).hexdigest()[:12]})
manifest={'cssSources':css_sources,'version':version,'images':entries}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'images':len(entries),'originalMB':round(sum(e['originalBytes'] for e in entries)/1048576,2),'deliveryMB':round(sum(e['bytes'] for e in entries)/1048576,2),'allPixelsVerified':all(e['pixelVerified'] for e in entries)}))
