#!/usr/bin/env python3
"""Exercise the actual Unity scene with an isolated QA save and no cloud writes."""
import argparse
import json
import time
import uuid
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('project', type=Path)
a = p.parse_args()
folder = a.project / 'Temp/LegendHeroesQA'
folder.mkdir(parents=True, exist_ok=True)
states = []

def command(action, value='', index=0):
    path = folder / 'command.json'
    request=uuid.uuid4().hex
    path.write_text(json.dumps(dict(action=action, value=value, index=index,requestId=request), ensure_ascii=False))
    until = time.monotonic() + 10
    while path.exists() and time.monotonic() < until:
        time.sleep(.1)
    if path.exists():
        raise RuntimeError('Unity must be in Play mode, with the updated preview API.')
    state={}
    while time.monotonic()<until:
        try:
            state=json.loads((folder/'state.json').read_text())
            if state.get('requestId')==request:
                break
        except (FileNotFoundError,json.JSONDecodeError):
            pass
        time.sleep(.1)
    assert state.get('requestId')==request, 'command result correlation'
    if state.get('error'):
        raise RuntimeError(state['error'])
    assert 'LegendHeroesQA' in state['savePath'], 'QA save isolation'
    states.append(dict(action=action, screen=state['screen'], buttons=len(state.get('buttons', []))))
    return state

command('fixture')
for action, screen in [('menu','menu'),('quests','quests'),('study','study'),('admin','admin-options'),('items','items'),('training','training'),('synthesis','synthesis'),('gacha','gacha'),('exchange','exchange'),('prints','prints'),('halloween','halloween'),('raids','raids'),('shop','shop'),('equipment','equipment'),('appearance','appearance')]:
    state=command(action)
    assert state['screen']==screen, action
state=command('shop')
assert 'item-w1' in state['buttons']
state=command('click','item-w1')
assert any('で買う' in b for b in state['buttons']), 'shop product modal'
gold=state['gold']
state=command('click',next(b for b in state['buttons'] if 'で買う' in b))
assert state['gold']<gold, 'shop purchase'
state=command('items',index=1)
assert state['screen']=='items' and state['buttons'], 'item shop'
for mode in ['ハロウィン','背景・キャラ']:
    assert command('gacha',mode)['screen']=='gacha'
for raid in [0,1]:
    assert command('exchange',index=raid)['screen']=='exchange'
assert command('event',index=2)['screen']=='event-combat'
command('home')
state=command('battle','area1')
assert state['screen']=='battle'
state=command('answer',state['answer'])
time.sleep(.8)
state=command('home')
assert state['screen']=='home'
command('save')
command('prepare')
state=command('gacha')
before=state['gold']
state=command('click','1回引く')
assert state['gold']==before-150
command('click','受け取った！')
command('items')
command('click','item-cost_seed')
state=command('click','使う')
assert any('装備コスト上限' in label for label in state['labels']), 'seed in-game effect'
command('home')
state=command('gift')
before=state['gold']
state=command('click','受け取る')
assert state['gold']==before+50, 'gift receipt'
state=command('battle','area1')
state=command('click',next(b for b in state['buttons'] if b.startswith('特技 / MP')))
state=command('click',next(b for b in state['buttons'] if b.startswith('れんぞく斬り / MP')))
state=command('answer',state['answer'])
time.sleep(.8)
command('home')
command('event',index=1)
state=command('event-finish')
assert state['screen']=='event-result' and 'TIME UP！' in state['labels'], 'raid end announcement'
command('home')
command('save')
command('battle','area5')
state=command('click','かな入力')
assert '゛ 濁点' in state['buttons'] and '⌫ けす' in state['buttons'], 'native kana board'
command('click','か')
state=command('click','゛ 濁点')
assert 'が' in state['labels'], 'native voiced kana input'
state=command('click','⌫ けす')
assert 'が' not in state['labels'], 'native kana delete'
command('click','もどる')
command('home')
(folder / 'ui-report.json').write_text(json.dumps(states,ensure_ascii=False,indent=2))
print('PASS: '+str(len(states))+' actual Unity scene actions; isolated save, no cloud writes')
