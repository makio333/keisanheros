import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const gains = [];
const oscillators = [];
const param = () => ({
  value: 0,
  setValueAtTime(value) { this.value = value; },
  exponentialRampToValueAtTime(value) { assert.ok(value > 0, 'exponential ramps require a positive target'); },
});
class FakeContext {
  currentTime = 0;
  state = 'running';
  destination = {};
  createGain() {
    const gain = { gain: param(), connect(target) { this.target = target; }, disconnect() {} };
    gains.push(gain);
    return gain;
  }
  createOscillator() {
    const oscillator = { frequency: param(), connect(target) { this.target = target; }, start() {}, stop() {} };
    oscillators.push(oscillator);
    return oscillator;
  }
}
class FakeAudio {
  volume = 1;
  play() { return Promise.resolve(); }
  pause() {}
  cloneNode() { return new FakeAudio(); }
  addEventListener() {}
}
const context = vm.createContext({ window: { AudioContext: FakeContext }, av: path => path, setTimeout() {}, console });
vm.runInContext(source.slice(source.indexOf('class SoundManager {'), source.indexOf('const SM = new SoundManager();')) + '\nthis.manager = new SoundManager();', context);
const sm = context.manager;
sm.audios = { bgm_home: new FakeAudio(), bgm_stage1: new FakeAudio(), se_decide: new FakeAudio(), se_clear: new FakeAudio() };
sm.setGlobalVolume(1);
sm.playBGM('bgm_home');
sm.play('se_decide');
sm.play('se_clear');
const [decision, clear] = sm.activeSE;
assert.equal(decision.volume, 0.06, 'decision sound is attenuated');
assert.equal(clear.volume, 0.2);
sm.playBeep('type');
assert.equal(sm.effectGain.gain.value, 1);
assert.equal(gains[0].target, sm.effectGain, 'beeps use the shared volume bus');
sm.setGlobalVolume(0.25);
assert.equal(sm.audios.bgm_home.volume, 0.075 * 0.25);
assert.equal(sm.audios.bgm_stage1.volume, 0.4 * 0.25);
assert.equal(decision.volume, 0.06 * 0.25, 'slider updates sounds already playing without losing balance');
assert.equal(clear.volume, 0.2 * 0.25);
assert.equal(sm.effectGain.gain.value, 0.25, 'slider updates synthesized effects already playing');
sm.playRumble();
assert.equal(gains[2].target, sm.effectGain, 'rumble uses the shared volume bus');
sm.playBeep('correct');
assert.equal(oscillators.at(-1).type, 'sine', 'correct answer plays a chime');
assert.equal(gains.at(-1).target, sm.effectGain, 'correct chime shares slider volume');
sm.setMuted(true);
assert.equal(decision.volume, 0);
assert.equal(sm.audios.bgm_home.volume, 0);
assert.equal(sm.effectGain.gain.value, 0);
const previousCount = oscillators.length;
sm.playBeep('hit');
sm.playBeep('correct');
sm.playRumble();
assert.equal(oscillators.length, previousCount, 'muted effects do not start');
sm.setMuted(false);
assert.equal(decision.volume, 0.06 * 0.25);
sm.setGlobalVolume(0);
sm.playBeep('type');
sm.playRumble();
assert.equal(oscillators.length, previousCount, 'zero volume is silent and avoids zero exponential ramps');
console.log('PASS: shared BGM/SE volume, decision balance, live updates, mute and zero-volume synthesis');
sm.audios.se_type=new FakeAudio();sm.audios.se_slash=new FakeAudio();sm.setGlobalVolume(1);
sm.playCorrectAnswer();const success=[...sm.activeSE].at(-1);assert.equal(success.effectBaseVolume,.24,'shared correct answer uses the normal sample audibly');
sm.play('se_slash',1.8);const attack=[...sm.activeSE].at(-1);assert.ok(Math.abs(attack.effectBaseVolume-.36)<1e-9,'raid attack is louder');
sm.setGlobalVolume(.5);assert.equal(success.volume,.12);assert.ok(Math.abs(attack.volume-.18)<1e-9);sm.setMuted(true);assert.equal(success.volume,0);assert.equal(attack.volume,0);
