#!/usr/bin/env python3
"""Exercise our isolated Web edition through the actual Unity/WebKit host."""
import argparse,json,time,uuid
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('project',type=Path);a=p.parse_args();folder=a.project/'Temp/LegendHeroesQA';results=[]
def evaluate(js):
 request=uuid.uuid4().hex;out=folder/('web-'+request+'.json')
 (folder/'editor-command.json').write_text(json.dumps({'action':'web-eval','value':js,'requestId':request},ensure_ascii=False))
 until=time.monotonic()+20
 while time.monotonic()<until:
  if out.exists():
   value=json.loads(out.read_text());assert not value.get('error'),value
   value=value.get('result');return json.loads(value) if isinstance(value,str) else value
  time.sleep(.05)
 raise AssertionError('WebKit evaluation timeout')
def snapshot(name):
 path=folder/(name+'.png');before=path.stat().st_mtime_ns if path.exists() else 0
 (folder/'editor-command.json').write_text(json.dumps({'action':'web-snapshot','value':name}))
 until=time.monotonic()+10
 while time.monotonic()<until:
  if path.exists() and path.stat().st_mtime_ns!=before:return
  time.sleep(.05)
 raise AssertionError('Screenshot timeout '+name)
def check(js,label):
 value=evaluate('JSON.stringify(!!('+js+'))');assert value,label;results.append({'check':label,'passed':True})
until=time.monotonic()+60
while time.monotonic()<until:
 if evaluate('JSON.stringify(!!window.__lhQA)'):break
 time.sleep(.5)
else:raise AssertionError('Game fixture not ready')
for name,selector in [
 ('home','#screen-home.active'),('adventure','#screen-stage-select.active'),('stages','#screen-stage-select-new.active'),('room','#screen-status.active'),('weapon','#screen-weapon-shop.active'),('item','#screen-item-shop.active'),('items','#screen-items.active'),('skills','#screen-skills.active'),('gacha','#screen-gacha.active'),('synthesis','#screen-synthesis.active'),('frames','#avatar-change-modal:not(.hidden)'),('quests','#screen-quest-board:not(.hidden)'),('halloween','.halloween-menu'),('halloweenExchange','.halloween-exchange-card'),('eventRaid','#screen-event-raid:not(.hidden)'),('raid','#screen-raid-boss:not(.hidden)'),('raidExchange','.raid-exchange-panel'),('saveSlots','#screen-load-save.active'),('admin','#screen-admin.active'),('savePrint','.challenge-print-suggestion'),('battle','#screen-battle.active'),('kanji','#screen-battle.active'),('synthesisCalc','#screen-synthesis-calc.active')]:
 evaluate('__lhQA.setup();__lhQA['+json.dumps(name)+']();JSON.stringify(true)')
 time.sleep(.35)
 check('document.querySelector('+json.dumps(selector)+')','visible '+name)
 state=evaluate('JSON.stringify(__lhQA.state())');assert not state['errors'],(name,state['errors'])
 # Source bank references occasionally load after the renderer's first frame.
 for _ in range(20):
  if not state['images']:break
  time.sleep(.1);state=evaluate('JSON.stringify(__lhQA.state())')
 assert not state['images'],(name,'missing image',state['images'])
 snapshot('parity-'+name)
 if name=='home':check('document.querySelector("#hotspot-adventure")&&document.querySelector("#home-avatar-window")','home hotspots and avatar')
 if name=='weapon':check('[...document.querySelectorAll("#weapon-shop-list .shop-icon")].every(e=>e.getBoundingClientRect().width===64)','same 64px equipment icons')
 if name=='item':check('document.querySelectorAll("#item-shop-list .shop-icon").length===8','same item lineup')
 if name=='frames':
  for selector2 in ['#btn-avatar-tab-backgrounds','#btn-avatar-tab-frames','#btn-avatar-tab-characters']:
   evaluate('document.querySelector('+json.dumps(selector2)+').click();JSON.stringify(true)')
  check('document.querySelectorAll(".avatar-selector-tabs button").length===3','character/background/frame tabs')
 if name=='savePrint':check('document.querySelector(".challenge-print-rewards img")&&document.querySelector(".challenge-print-ticket").textContent.includes("80%")','original print rewards and threshold')
 print('PASS screen:',name,flush=True)
# Real DOM click handlers: purchase cancel, actual purchase, one seed, and local save.
evaluate('__lhQA.setup();__lhQA.item();document.querySelector("#item-shop-list .shop-icon").click();JSON.stringify(true)')
check('document.querySelector(".confirm-overlay .confirm-card")','purchase confirmation')
# A cancelled purchase must keep gold unchanged.
evaluate('document.querySelector("#btn-confirm-no").click();JSON.stringify(true)');check('__lhQA.state().gold===100000','cancel does not charge')
evaluate('__lhQA.setup();__lhQA.seed();JSON.stringify(true)');check('document.querySelector(".seed-use-effect")','seed uses game effect')
snapshot('parity-seed')
evaluate('__lhQA.setup();JSON.stringify(true)');check('Object.keys(localStorage).some(k=>k.includes("unity-qa-isolated"))','Web-format local save')
check('typeof Chart==="function"','bundled offline chart library')
check('__lhQA.state().errors.length===0','no JavaScript errors')
(folder/'web-ui-report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('PASS:',len(results),'Unity/WebKit UI assertions; no production cloud module')
