import assert from 'node:assert/strict';
import { homedir } from 'node:os';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || `${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);

const ranks = new Map();
let total = 0;
const browser = await chromium.launch({ headless: true });
const pages = [];
try {
  for (let index = 0; index < 2; index++) {
    const context = await browser.newContext({ viewport: { width: index ? 390 : 1366, height: index ? 844 : 1000 } });
    const page = await context.newPage();
    pages.push(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.exposeFunction('raidRequest', async (method, args) => {
      if (method === 'syncPlayer') {
        const [key, profile, progress] = args;
        const rank = ranks.get(key) || { totalDamage: 0, legacyDamage: 0, appliedEvents: {} };
        const baseline = Math.max(rank.legacyDamage, progress.legacyDamage || 0);
        let delta = baseline - rank.legacyDamage;
        rank.legacyDamage = baseline;
        for (const event of progress.events || []) {
          if (!rank.appliedEvents[event.id]) { delta += event.damage; rank.appliedEvents[event.id] = true; }
        }
        total += delta;
        rank.totalDamage += delta;
        if (progress.participated || rank.totalDamage) ranks.set(key, { ...rank, ...profile, slotKey: key });
        return { acknowledged: (progress.events || []).map(event => event.id), claimed: false };
      }
      if (method === 'getRankings') return [...ranks.values()];
      if (method === 'getGlobalBoss') return { totalDamageDealt: total };
      if (method === 'receiveCheers') return 0;
      throw new Error(`Unexpected method ${method}`);
    });
    await context.route('**/firebase_init.js*', route => route.fulfill({ contentType: 'text/javascript', body: `
      window.CloudSave = { saveSlot: async () => {}, listSlots: async () => [], flush: () => {} };
      window.RaidBossAPI = Object.fromEntries(['syncPlayer','getRankings','getGlobalBoss','receiveCheers'].map(method => [method, (...args) => window.raidRequest(method, args)]));
      window.RaidBossAPI.watchBoss = () => () => {};
    ` }));
    await context.route('**/game.js*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + `
        window.raidTest = {
          setup(key, damage = null) {
            G = newGameState('Test Hero', 'ai_hero_spellblade'); currentSlotKey = key;
            G.unlockedAvatarBackgrounds.push('raid_magma');
            if (damage !== null) saveRaidData({ rankings: { [key]: { ...raidPlayerProfile(), slotKey: key, totalDamage: damage } }, totalDamage: damage });
            showScreen('screen-home');
          },
          open: showRaidBossMenu, sync: syncRaidState,
          damage(value) { recordRaidDamage(currentSlotKey, G.playerName, value, G.avatar, 1, {}, G.avatarBackground); },
          state: () => ({ progress: G.raidProgress, status: raidSyncStatus, total: getRaidTotalDamage(), rows: getRaidRankings() })
        };
      ` });
    });
    await page.goto('http://127.0.0.1:5175/');
    await page.waitForFunction(() => !!window.raidTest);
    await page.locator('#btn-boot-start').waitFor({ state: 'visible', timeout: 60000 });
    await page.locator('#btn-boot-start').click({ force: true });
    await page.locator('#boot-loader-screen').waitFor({ state: 'hidden', timeout: 10000 });
    await page.evaluate(() => window.raidTest.setup('typing_rpg_save_v3::test_shared', 77));
    await page.evaluate(() => window.raidTest.open());
    await page.waitForFunction(() => window.raidTest.state().status === 'ready');
    assert.equal(errors.length, 0, errors.join('\n'));
  }
  assert.equal(total, 77, 'Two browsers must not import the same score twice');
  await pages[0].evaluate(() => window.raidTest.damage(23));
  await pages[0].waitForFunction(() => window.raidTest.state().status === 'ready');
  await pages[1].evaluate(() => window.raidTest.sync());
  assert.equal((await pages[1].evaluate(() => window.raidTest.state())).total, 100);
  await pages[1].evaluate(() => {
    window.originalRaidSync = window.RaidBossAPI.syncPlayer;
    window.RaidBossAPI.syncPlayer = async () => { throw Object.assign(new Error('denied'), { code: 'permission-denied' }); };
    window.raidTest.damage(19);
  });
  await pages[1].waitForFunction(() => window.raidTest.state().status === 'denied');
  let state = await pages[1].evaluate(() => window.raidTest.state());
  assert.equal(state.progress.pendingEvents.length, 1);
  assert.equal(state.rows[0].totalDamage, 119);
  assert.ok((await pages[1].locator('#raid-sync-status').innerText()).includes('許可'));
  await pages[1].screenshot({ path: '/private/tmp/raid-offline-mobile.png' });
  await pages[1].evaluate(() => { window.RaidBossAPI.syncPlayer = window.originalRaidSync; return window.raidTest.sync(); });
  await pages[1].evaluate(() => window.raidTest.sync());
  assert.equal(total, 119, 'Offline damage is replayed once');
  await pages[0].evaluate(() => window.raidTest.sync());
  assert.equal((await pages[0].evaluate(() => window.raidTest.state())).total, 119);
  await pages[0].screenshot({ path: '/private/tmp/raid-shared-desktop.png' });
  await pages[1].evaluate(() => { localStorage.removeItem('raid_boss_v1_boss1'); window.raidTest.setup('typing_rpg_save_v3::test_zero'); return window.raidTest.sync(); });
  state = await pages[1].evaluate(() => window.raidTest.state());
  assert.ok(state.rows.some(row => row.slotKey.endsWith('test_zero') && row.totalDamage === 0));
  assert.equal(await pages[1].locator('#raid-ranking-list').innerText().then(text => text.includes('誰も挑戦')), false);
  console.log('PASS: two browsers, migration, shared HP, permission display, offline queue, recovery, zero-damage participation');
} finally {
  await browser.close();
}
