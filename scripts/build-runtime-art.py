"""Delivery copies and a shared preview sheet. Originals and artwork layout stay intact."""
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,math,io
root=Path(__file__).resolve().parents[1];out=root/'assets/runtime';out.mkdir(parents=True,exist_ok=True)
patterns=['assets/**/*','画像/ステージ/*.jpg','画像/ステージ/戦闘背景/*.png','画像/スキル/**/*','画像/エフェクト/**/*','画像/キャラクター/**/*','画像/title_*.png','画像/title_*.jpg','画像/home_town_v2.png','画像/bg_*.jpg','画像/training_dummy*.png','画像/training_dummy*.jpg','画像/NPC/**/*']
files=sorted({p for pat in patterns for p in root.glob(pat) if p.is_file() and p.suffix.lower() in ['.png','.jpg','.jpeg','.webp'] and 'assets/runtime/' not in p.as_posix() and 'assets/monsters/' not in p.as_posix()})
old={}
try:old={x['source']:x for x in json.loads((out/'manifest.json').read_text())['images']}
except (FileNotFoundError,KeyError):pass
version='delivery-v2'
import re
game=(root/'game.js').read_text();avatars=game.split('const HERO_AVATARS = [',1)[1].split('];',1)[0]
core={m.group(1) for line in avatars.splitlines() if 'gachaOnly' not in line for m in re.finditer(r"image:\s*['\"]([^'\"]+)",line)}
core.update(['assets/boot/home.webp','assets/boot/title-sky.webp','assets/boot/title-foreground.webp','assets/boot/title-logo.webp','assets/ui/town-navigation-v1.png','assets/characters/hero_female_1.png','assets/boot/adventurer.webp','assets/boot/knight.webp','assets/boot/scout.webp','assets/boot/forest.webp'])
def convert(p):
 source=p.relative_to(root).as_posix();raw=p.read_bytes();signature=hashlib.sha256(raw+version.encode()).hexdigest()[:16]
 im=Image.open(p).convert('RGBA');original=im.size
 name=hashlib.sha1(source.encode()).hexdigest()[:12]+'-'+signature+'.webp';target=out/name
 if not target.exists():
  if any(word in source.lower() for word in ['atlas','sheet','navigation','スキル','エフェクト','effects']):limit=max(im.size)
  elif '/items/' in source or '/ui_icons/' in source:limit=384
  elif any(word in source.lower() for word in ['background','bg_','/bg/','ステージ','home_town','/boot/home','/boot/forest','town.png']):limit=1440
  else:limit=768
  delivery=im.copy();delivery.thumbnail((limit,limit),Image.Resampling.LANCZOS)
  delivery.save(target,'WEBP',quality=86,method=4)
 thumb=im.copy();thumb.thumbnail((384,216) if source in ['assets/boot/home.webp','assets/boot/forest.webp'] else ((160,160) if source in core else (24,24)),Image.Resampling.LANCZOS)
 return {'source':source,'file':'assets/runtime/'+name,'bytes':target.stat().st_size,'originalBytes':len(raw),'size':original},thumb
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(convert,files))
cols=64;cell=24;base_height=math.ceil(len(results)/cols)*cell
wide=[item for item in results if item[1].width>192]
large=[item for item in results if item[0]['source'] in core and item[1].width<=192]
sheet=Image.new('RGBA',(cols*cell,base_height+math.ceil(len(large)/8)*192+len(wide)*216))
entries=[];large_index=0;wide_index=0
for i,(entry,thumb) in enumerate(results):
 if thumb.width>192:
  x=0;y=base_height+math.ceil(len(large)/8)*192+wide_index*216;wide_index+=1
 elif entry['source'] in core:
  x=(large_index%8)*192+(192-thumb.width)//2;y=base_height+(large_index//8)*192+(192-thumb.height)//2;large_index+=1
 else:
  x=(i%cols)*cell+(cell-thumb.width)//2;y=(i//cols)*cell+(cell-thumb.height)//2
 sheet.paste(thumb,(x,y));entry['preview']=[x,y,thumb.width,thumb.height];entries.append(entry)
sheet.save(out/'preview-atlas.webp','WEBP',quality=55,method=5)
css_sources=[]
known={e['source'] for e in entries}
for css in root.glob('*.css'):
 for match in re.finditer(r'url\([\"\']?([^\"\')]+)',css.read_text()):
  try:source=(css.parent/match.group(1).split('?')[0]).resolve().relative_to(root).as_posix()
  except ValueError:continue
  if source in known and not any(e['source']==source for e in css_sources):css_sources.append({'source':source,'variable':'--game-art-'+hashlib.sha1(source.encode()).hexdigest()[:12]})
manifest={'cssSources':css_sources,'version':version,'atlas':'assets/runtime/preview-atlas.webp','images':entries}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'images':len(entries),'originalMB':round(sum(e['originalBytes'] for e in entries)/1048576,2),'deliveryMB':round(sum(e['bytes'] for e in entries)/1048576,2),'previewKB':round((out/'preview-atlas.webp').stat().st_size/1024,1)}))
