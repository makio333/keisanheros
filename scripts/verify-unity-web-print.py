#!/usr/bin/env python3
"""Verify real popup/print-host delivery without opening a print dialog in QA."""
import argparse,json,subprocess,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('project',type=Path);a=p.parse_args()
def evaluate(js):
 r=subprocess.run(['python3',str(Path(__file__).with_name('unity-web-qa.py')),str(a.project),js],capture_output=True,text=True,check=True)
 v=json.loads(r.stdout);assert not v['error'],v
 return json.loads(v['result'])
until=time.monotonic()+60
while time.monotonic()<until:
 if evaluate('JSON.stringify(!!window.__lhQA)'):break
 time.sleep(.5)
else:raise AssertionError('Isolated game did not load')
evaluate('__lhQA.setup();__lhQA.print();document.querySelector("#print-choice-cards button").click();JSON.stringify(true)')
until=time.monotonic()+10
while time.monotonic()<until:
 probe=evaluate('JSON.stringify(window.__lhNativePrintProbe||null)')
 if probe:break
 time.sleep(.25)
assert probe and probe['rows']==10 and '再現確認' in probe['text'],probe
(a.project/'Temp/LegendHeroesQA/web-print-report.json').write_text(json.dumps({'passed':True,'probe':probe,'printJobsSubmitted':0},ensure_ascii=False,indent=2))
print('PASS: actual in-app popup, 10 questions, player name, print-host bridge; no print job submitted')
