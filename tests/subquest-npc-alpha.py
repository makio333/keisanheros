from PIL import Image
from pathlib import Path
files=list(Path('画像/NPC').glob('npc_*_transparent_v2.png'))
assert len(files)==6,len(files)
for p in files:
 im=Image.open(p);assert im.mode=='RGBA',p
 alpha=im.getchannel('A');assert alpha.getextrema()==(0,255),p
 w,h=im.size;pad=1
 for box in [(0,0,pad,h),(w-pad,0,w,h),(0,0,w,pad),(0,h-pad,w,h)]:assert alpha.crop(box).getextrema()[1]<=7,(p,'visible opaque border')
 print('PASS:',p.name,'RGBA, outer border opacity below 3%, alpha interior retained',im.size)
