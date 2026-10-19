#!/usr/bin/env python3
"""Use the project's bounded Editor API instead of keyboard automation."""
import argparse
import json
import time
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('project',type=Path)
p.add_argument('action',choices=['refresh','validate','play','stop','build','web','web-snapshot','open-web'])
p.add_argument('--value',default='')
a=p.parse_args()
folder=a.project/'Temp/LegendHeroesQA'
folder.mkdir(parents=True,exist_ok=True)
command=folder/'editor-command.json'
started=time.time()
command.write_text(json.dumps({'action':a.action,'value':a.value}))
until=time.monotonic()+30
while command.exists() and time.monotonic()<until:
    time.sleep(.2)
if command.exists():
    raise SystemExit('Editor command not consumed; check that the target Unity Editor is open.')
state=folder/'editor-state.json'
while time.monotonic()<until:
    if state.exists() and state.stat().st_mtime>=started:
        try:
            payload=json.loads(state.read_text())
            if payload.get('action')==a.action:
                print(json.dumps(payload));break
        except json.JSONDecodeError:
            pass
    time.sleep(.2)
else:
    if a.action=='build':
        print('Build is running in Unity. Read Builds/macOS/build-report.json when complete.')
    else:
        raise SystemExit('Editor did not finish the command. Check editor-error.txt and Unity compilation.')
