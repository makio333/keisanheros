#!/usr/bin/env python3
"""Development-only command channel compiled out of Unity player builds."""
import argparse,json,time,uuid
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('project',type=Path);p.add_argument('action',choices=['probe','fixture','home','battle','answer','shop','equipment','appearance','save','restore','state','screenshot','quests','click']);p.add_argument('--value',default='');p.add_argument('--index',type=int,default=0);a=p.parse_args()
d=a.project/'Temp/LegendHeroesQA';d.mkdir(parents=True,exist_ok=True)
if a.action!='state':
    request=uuid.uuid4().hex
    command=d/'command.json';command.write_text(json.dumps({'action':a.action,'value':a.value,'index':a.index,'requestId':request},ensure_ascii=False))
    until=time.monotonic()+8
    while command.exists() and time.monotonic()<until:time.sleep(.1)
    if command.exists():raise SystemExit('Unity Play mode must be running in the target project.')
    while time.monotonic()<until:
        try:
            if json.loads((d/'state.json').read_text()).get('requestId')==request:break
        except (FileNotFoundError,json.JSONDecodeError):pass
        time.sleep(.1)
    else:raise SystemExit('Unity did not acknowledge this command.')
print((d/'state.json').read_text())
