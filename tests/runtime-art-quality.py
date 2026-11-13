"""Verify shipped media against original artwork, including transparent pixel RGB."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'assets/runtime/manifest.json').read_text())
assert manifest['version']=='original-quality-v3'
assert 'atlas' not in manifest
for entry in manifest['images']:
 source=root/entry['source'];target=root/entry['file']
 assert 'preview' not in entry and entry['lossless'] and entry['pixelVerified'], entry['source']
 assert 'assets/boot/' not in entry['file'], entry['source']
 a=Image.open(source);b=Image.open(target)
 assert list(a.size)==entry['size'] and b.size==a.size, entry['source']
 if source==target:continue
 assert b.convert('RGBA').tobytes()==a.convert('RGBA').tobytes(), entry['source']
 assert target.stat().st_size<source.stat().st_size, entry['source']
print(f"Verified original dimensions and exact RGBA pixels for {len(manifest['images'])} delivery images")
