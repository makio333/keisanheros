#!/usr/bin/env python3
"""Bounded, Editor-only JS checks against our isolated packaged Web fixture."""
import argparse,json,time,uuid
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('project',type=Path);p.add_argument('script');a=p.parse_args()
folder=a.project/'Temp/LegendHeroesQA';request=uuid.uuid4().hex;output=folder/('web-'+request+'.json')
(folder/'editor-command.json').write_text(json.dumps({'action':'web-eval','value':a.script,'requestId':request},ensure_ascii=False))
until=time.monotonic()+20
while time.monotonic()<until:
 if output.exists():
  result=json.loads(output.read_text());print(json.dumps(result,ensure_ascii=False));raise SystemExit(1 if result.get('error') else 0)
 time.sleep(.1)
raise SystemExit('No WebKit result. Check Unity Editor Play mode and editor-error.txt.')
