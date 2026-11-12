import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sources=[],gains=[];
const param=()=>({value:0,setValueAtTime(v,t){this.value=v;},exponentialRampToValueAtTime(v,t){assert.ok(v>0);}});
const node=()=>({connect(target){this.target=target;},disconnect(){this.disconnected=true;}});
class Context{
 currentTime=10;sampleRate=44100;state='running';destination={};
 createBuffer(_channels,n){assert.ok([13230,1235].includes(n));return {getChannelData:()=>new Float32Array(n)};}
 createGain(){const n={...node(),gain:param()};gains.push(n);return n;}
 createBiquadFilter(){return {...node(),frequency:param(),Q:{value:0}};}
 createBufferSource(){const n={...node(),start(t){this.startAt=t;},stop(t){this.stops=(this.stops||0)+1;this.stopAt=t;}};sources.push(n);return n;}
 createOscillator(){const n={...node(),frequency:param(),start(t){this.startAt=t;},stop(t){this.stops=(this.stops||0)+1;this.stopAt=t;}};sources.push(n);return n;}
}
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const c=vm.createContext({window:{AudioContext:Context},console,av:v=>v});
vm.runInContext(source.slice(source.indexOf('class SoundManager {'),source.indexOf('const SM = new SoundManager();'))+'\nthis.sm=new SoundManager();',c);
const sm=c.sm,stop=sm.playIceFreeze();assert.equal(sources.length,6);
assert.equal(sources[0].startAt,10);assert.equal(sources[1].startAt,10.17);assert.equal(sources[2].stopAt,10.3);
assert.ok(gains.filter(n=>n.target===sm.effectGain).length===6);
assert.equal(sources[3].startAt,10.17);assert.equal(sources[4].startAt,10.193);assert.ok(Math.abs(sources[5].stopAt-10.245)<1e-8);
stop();assert.ok(sources.every(n=>n.disconnected));const counts=sources.map(n=>n.stops);stop();assert.deepEqual(sources.map(n=>n.stops),counts);
sm.setMuted(true);sm.playIceFreeze();assert.equal(sources.length,6);sm.setMuted(false);sm.setGlobalVolume(0);sm.playIceFreeze();assert.equal(sources.length,6);
console.log('PASS: 300ms whoosh, collision taps at170ms, shared volume, mute/zero silence and idempotent cancellation');
