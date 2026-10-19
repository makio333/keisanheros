#!/usr/bin/env python3
"""Copy the isolated native port into the user's existing Unity project. Never deletes files."""
import argparse, hashlib, json, shutil
from pathlib import Path
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('project',type=Path);args=parser.parse_args()
project=args.project.resolve()
if not (project/'ProjectSettings/ProjectVersion.txt').is_file():raise SystemExit('Not a Unity project: '+str(project))
source=root/'unity-port/Assets/LegendHeroes';target=project/'Assets/LegendHeroes'
changed=0
for p in source.rglob('*'):
    if not p.is_file() or p.name=='.DS_Store':continue
    dest=target/p.relative_to(source)
    if dest.is_file() and hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256(dest.read_bytes()).digest():continue
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(p,dest);changed+=1
for p in (root/'unity-port/Docs').glob('*.md'):
    dest=project/'Documentation/LegendHeroes'/p.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
shutil.copy2(root/'unity-port/README.md',project/'Documentation/LegendHeroes/README.md')
for source,destination in [(root/'unity-port/Assets/StreamingAssets/LegendHeroesWeb',project/'Assets/StreamingAssets/LegendHeroesWeb'),(root/'output/unity-web-qa',project/'Temp/LegendHeroesQA/Web')]:
    if source.is_dir():
        for p in source.rglob('*'):
            if not p.is_file():continue
            dest=destination/p.relative_to(source)
            if dest.is_file() and p.stat().st_size==dest.stat().st_size and hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256(dest.read_bytes()).digest():continue
            dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest);changed+=1
print(json.dumps({'project':str(project),'changedFiles':changed,'webModified':False,'deletedFiles':0},ensure_ascii=False))
