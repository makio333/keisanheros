import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRaidIntroBgmTransition } from '../raid_intro_bgm.js';
import { createRaidChallengeStartGate } from '../raid_challenge_gate.js';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const audioSource = source.slice(source.indexOf('class SoundManager {'), source.indexOf('const SM = new SoundManager();'));
assert.ok(audioSource.includes('this.bgmKey === key && audio && !audio.paused'), 'same-key BGM remains idempotent while playing and retries a paused track after unmute');

class FakeAudio {
  src = '';
  volume = 1;
  currentTime = 0;
  paused = true;
  plays = 0;
  pauses = 0;
  addEventListener() {}
  play() { this.plays++; this.paused = false; return Promise.resolve(); }
  pause() { this.pauses++; this.paused = true; }
}

const context = vm.createContext({ window: {}, console, av: value => value });
vm.runInContext(`${audioSource}\nthis.manager = new SoundManager();`, context);
const sm = context.manager;
const tracks = Object.fromEntries(['bgm_home', 'bgm_room', 'bgm_raid_boss'].map(key => [key, new FakeAudio()]));
sm.audios = tracks;
sm.setGlobalVolume(0.35);
sm.playBGM('bgm_home');
tracks.bgm_home.currentTime = 12;

let restoreKey = 'bgm_home';
const events = [];
const transitions = createRaidIntroBgmTransition({
  playBGM(key) { events.push(`bgm:${key}`); sm.playBGM(key); },
  getRestoreBGM() { return restoreKey; },
});

// The raid track begins before the intro, and the repeated battle-screen request does not restart it.
const skippedIntro = transitions.begin();
assert.equal(events.at(-1), 'bgm:bgm_raid_boss');
assert.equal(tracks.bgm_raid_boss.plays, 1);
assert.equal(tracks.bgm_home.paused, true);
assert.equal(tracks.bgm_raid_boss.volume, 0.4 * 0.35);
tracks.bgm_raid_boss.currentTime = 2.4;
assert.equal(transitions.begin(), skippedIntro, 'repeated begins join the active transition');
assert.equal(tracks.bgm_raid_boss.plays, 1, 'joining does not start a second audio stream');
assert.equal(skippedIntro.retainForBattle(), true, 'skipping into battle retains the same raid track');
sm.playBGM('bgm_raid_boss'); // showScreen(screen-battle) and the explicit battle call use the same key.
assert.equal(tracks.bgm_raid_boss.plays, 1, 'screen transition does not replay the same BGM');
assert.equal(tracks.bgm_raid_boss.currentTime, 2.4, 'screen transition does not seek back to the start');
assert.equal(transitions.active, false);
assert.equal(skippedIntro.restore(), false, 'a completed transition cannot restore twice');

// Back/navigation during the intro changes the screen track first; restore then leaves it uninterrupted.
sm.playBGM('bgm_home');
const cancelledIntro = transitions.begin();
restoreKey = 'bgm_room';
sm.playBGM('bgm_room'); // showScreen(destination) runs after it cancels the intro.
const roomPlayCount = tracks.bgm_room.plays;
assert.equal(cancelledIntro.restore(), true);
assert.equal(tracks.bgm_room.plays, roomPlayCount, 'cancel restoration does not restart the destination BGM');
assert.equal(tracks.bgm_raid_boss.paused, true);
assert.equal(transitions.active, false, 'cancel cleanup releases the active transition');
assert.equal(cancelledIntro.restore(), false, 'repeated cleanup is harmless');

// A completed visual whose start condition becomes invalid restores the current screen music.
sm.playBGM('bgm_home');
restoreKey = 'bgm_home';
const failedRecheckIntro = transitions.begin();
assert.equal(failedRecheckIntro.restore(), true);
assert.equal(sm.bgmKey, 'bgm_home');
assert.equal(tracks.bgm_home.paused, false);

// Pre-sync and post-sync gate failures never start the intro track.
const gate = createRaidChallengeStartGate();
let starts = 0;
const beforeFailedStartCount = tracks.bgm_raid_boss.plays;
assert.equal(await gate.begin({ canStart: () => false, syncState: async () => { throw Error('must not sync'); }, start: async () => { starts++; transitions.begin(); } }), false);
let eligibilityChecks = 0;
assert.equal(await gate.begin({ canStart: () => ++eligibilityChecks === 1, syncState: async () => {}, start: async () => { starts++; transitions.begin(); } }), false);
assert.equal(starts, 0);
assert.equal(tracks.bgm_raid_boss.plays, beforeFailedStartCount, 'failed start gates do not switch music');

// A skipped visual is accepted by the start gate and orders BGM before the visual event.
const startEvents = [];
let eligible = true;
const started = await gate.begin({
  canStart: () => eligible,
  syncState: async () => { startEvents.push('sync'); },
  start: async () => {
    const transition = transitions.begin();
    startEvents.push('intro-start');
    const status = 'skipped';
    if (['completed', 'skipped'].includes(status) && eligible) {
      transition.retainForBattle();
      startEvents.push('battle');
      return true;
    }
    transition.restore();
    return false;
  },
});
assert.equal(started, true);
assert.deepEqual(startEvents, ['sync', 'intro-start', 'battle']);
assert.equal(tracks.bgm_raid_boss.plays, beforeFailedStartCount + 1);

// Muting at intro start remains silent; unmuting during the intro restarts the paused same-key track once.
sm.setMuted(true);
sm.stopBGM();
const playsBeforeMutedIntro = tracks.bgm_raid_boss.plays;
const mutedIntro = transitions.begin();
assert.equal(sm.bgmKey, 'bgm_raid_boss', 'muted transition remembers the intended BGM');
assert.equal(tracks.bgm_raid_boss.plays, playsBeforeMutedIntro, 'muted intro remains silent');
sm.setMuted(false);
sm.playBGM('bgm_raid_boss'); // unmute action selects the intro/battle track.
assert.equal(tracks.bgm_raid_boss.plays, playsBeforeMutedIntro + 1, 'unmute resumes the intended track even when its logical key already matches');
const resumedTime = tracks.bgm_raid_boss.currentTime;
sm.playBGM('bgm_raid_boss');
assert.equal(tracks.bgm_raid_boss.plays, playsBeforeMutedIntro + 1, 'unmute plus battle transition still uses one stream');
assert.equal(tracks.bgm_raid_boss.currentTime, resumedTime);
mutedIntro.retainForBattle();
assert.equal(sm.muted, false, 'intro transition never changes the mute preference');
assert.equal(tracks.bgm_raid_boss.volume, 0.4 * 0.35);

// Keep the production wiring ordered around intro, recheck, battle switch, and mute-screen selection.
const raidStart = source.slice(source.indexOf('async function startRaidBattle()'), source.indexOf('\n\nlet adminGiftCheckSlotKey'));
assert.ok(raidStart.indexOf('raidIntroBgm.begin()') < raidStart.indexOf('raidBossIntro.play('), 'raid BGM starts before boss presentation');
assert.ok(raidStart.includes('introBgmTransition?.restore()'), 'cancel and failed recheck restore the screen BGM');
assert.ok(raidStart.indexOf("SM.playBGM('bgm_raid_boss')") < raidStart.indexOf('introBgmTransition?.retainForBattle()'), 'transition is committed only after battle selects its track');
assert.ok(source.includes("id === 'screen-raid-boss' && raidIntroBgm.active) return 'bgm_raid_boss'"), 'unmute during the intro selects raid music');

console.log('PASS: raid BGM starts before intro, continues through skip/combat without replay, restores on cancel/recheck failure, ignores gated/repeated starts, and respects mute/volume.');
