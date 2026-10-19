#!/usr/bin/env python3
"""Keep this task's verification reports outside Unity's disposable Temp folder."""
import argparse,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('project',type=Path);a=p.parse_args()
source=a.project/'Temp/LegendHeroesQA';destination=a.project/'Documentation/LegendHeroes/Verification';destination.mkdir(parents=True,exist_ok=True)
files=['web-ui-report.json','web-layout-comparison.json','web-print-report.json','parity-home.png','parity-adventure.png','parity-room.png','parity-weapon.png','parity-battle.png','parity-frames.png','parity-halloween.png']
for name in files:
 if (source/name).is_file():shutil.copy2(source/name,destination/name)
report=a.project/'Builds/macOS/build-report.json'
if report.is_file():shutil.copy2(report,destination/'build-report.json')
runtime=Path.home()/'Library/Application Support/jp.treegames.legendheroes'
for name in ['legend-web-startup.json','legend-web-startup.png']:
 if (runtime/name).is_file():shutil.copy2(runtime/name,destination/name)
print(destination)
