import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  children = [];
  style = {};
  dataset = {};
  classes = new Set();
  classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name) };
  name = {};
  set innerHTML(value) { this.html = value; this.children = []; }
  get innerHTML() { return this.html; }
  appendChild(row) { this.children.push(row); }
  setAttribute(key, value) { this[key] = value; }
  querySelector() { return this.name; }
  querySelectorAll() { return []; }
}
const elements = new Map();
const el = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
const oldProfile = { slotKey: 'me', playerName: '昔の勇者', avatar: 'old', level: 7, equipment: { weaponId: 'old-sword' }, totalDamage: 800 };
let resolveOld;
let calls = 0;
const context = vm.createContext({
  window: { RaidBossAPI: {
    getHistory: async () => [
      { bossId: 'boss_52', bossLevel: 52, finalRankings: [{ ...oldProfile, totalDamage: 1000 }] },
      { bossId: 'boss_51', bossLevel: 51, finalRankings: [{ slotKey: 'me', totalDamage: 800 }] },
    ],
    getRankings: () => { calls++; return new Promise(resolve => { resolveOld = resolve; }); },
  } },
  $: el, document: { createElement: () => new Element() }, console,
  G: { playerName: '今の勇者', avatar: 'new', player: { lvl: 99 } }, currentSlotKey: 'me',
  getHeroAvatar: id => ({ image: `${id}.png` }), HERO_AVATARS: [{ image: 'default.png' }],
  getAvatarBackground: () => ({ color: '#000' }), getEquipTemplate: id => ({ name: id, emoji: '⚔' }),
  av: path => path,
});
const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
vm.runInContext(source.slice(source.indexOf('let raidHistoryEntries ='), source.indexOf('function renderRaidBossMenu()')), context);
await context.showRaidHistory();
assert.equal(el('raid-history-position').textContent, '1 / 2');
assert.equal(el('btn-raid-history-newer').disabled, true);
assert.equal(el('btn-raid-history-older').disabled, false);
let row = el('raid-history-list').children[0];
assert.ok(row.name.textContent.includes('昔の勇者'));
assert.match(row.innerHTML, /old\.png/);
assert.match(row.innerHTML, /Lv\.7/);
assert.match(row.innerHTML, /old-sword/);
assert.doesNotMatch(row.innerHTML, /btn-cheer-action/, 'archived rankings cannot send cheers');
const loadingOld = context.changeRaidHistory(1);
assert.equal(el('raid-history-position').textContent, '2 / 2');
assert.equal(el('btn-raid-history-older').disabled, true);
await context.changeRaidHistory(-1);
resolveOld([oldProfile]);
await loadingOld;
assert.equal(el('raid-history-position').textContent, '1 / 2');
assert.match(el('raid-history-list').children[0].innerHTML, /1,000/, 'late older response cannot overwrite newer selection');
await context.changeRaidHistory(1);
assert.equal(calls, 1, 'old profiles are loaded once and cached');
assert.match(el('raid-history-list').children[0].innerHTML, /800/);
const merged = context.mergeRaidHistoryRankings({ finalRankings: [{ slotKey: 'me', totalDamage: 123 }] }, [oldProfile]);
assert.equal(merged[0].totalDamage, 123, 'final damage wins over old collection data');
assert.equal(merged[0].playerName, '昔の勇者');
assert.equal(context.changeRaidHistory(1), undefined, 'navigation stops at oldest entry');
context.renderRaidRankingList(el('event-ranking'),[{...oldProfile,bestKills:25,totalDamage:999999,rank:1},{...oldProfile,slotKey:'other',bestKills:25,rank:1},{...oldProfile,slotKey:'third',bestKills:10,rank:3}],true,'kills');
const eventRows=el('event-ranking').children;
assert.match(eventRows[0].innerHTML,/25<span class="raid-ranking-damage-unit">体討伐<\/span>/);
assert.doesNotMatch(eventRows[0].innerHTML,/999,999|>ダメージ<\/span>|btn-cheer-action/,'event rankings never display or submit world-raid damage');
assert.match(eventRows[0].name.textContent,/1位/);assert.match(eventRows[1].name.textContent,/1位/);assert.match(eventRows[2].name.textContent,/3位/);
console.log('PASS: history cards, archive profiles, navigation boundaries, caching and asynchronous race protection');
