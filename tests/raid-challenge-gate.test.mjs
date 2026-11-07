import assert from 'node:assert/strict';
import {canReuseRaidChallengeSnapshot,createRaidChallengeStartGate,raidChallengeAvailability} from '../raid_challenge_gate.js';

assert.deepEqual(raidChallengeAvailability({syncStatus:'ready',hasTicket:true}),{enabled:true,reason:null});
assert.equal(raidChallengeAvailability({syncStatus:'idle',hasTicket:true}).reason,'sync-unavailable');
assert.equal(raidChallengeAvailability({syncStatus:'offline',hasTicket:true}).enabled,false,'offline shared state cannot be bypassed');
assert.equal(raidChallengeAvailability({syncStatus:'ready',hasTicket:false}).enabled,true);
assert.equal(raidChallengeAvailability({syncStatus:'ready',hasTicket:true,bossActive:false}).reason,'boss-defeated');
assert.equal(raidChallengeAvailability({isTestMode:true,syncStatus:'offline',hasTicket:false}).enabled,true,'test mode keeps its existing sync/ticket exemptions');
assert.equal(raidChallengeAvailability({isTestMode:true,bossActive:false}).enabled,false,'test mode cannot challenge a defeated boss');
assert.equal(raidChallengeAvailability({isTestMode:true,busy:true}).reason,'busy');
assert.equal(canReuseRaidChallengeSnapshot({syncStatus:'ready',lastSyncedAt:1000,now:2000}),true,'recent successful sync avoids a second slow round trip');
assert.equal(canReuseRaidChallengeSnapshot({syncStatus:'ready',lastSyncedAt:1000,now:32001}),false,'stale shared state must be refreshed');
assert.equal(canReuseRaidChallengeSnapshot({syncStatus:'offline',lastSyncedAt:1000,now:2000}),false,'offline shared state is never reused');
assert.equal(canReuseRaidChallengeSnapshot({syncStatus:'ready',lastSyncedAt:1000,now:2000,pendingEvents:1}),false,'pending damage must sync before another challenge');

const gate=createRaidChallengeStartGate();
let status='ready',syncs=0,starts=0,releaseSync;
const pendingSync=new Promise(resolve=>{releaseSync=resolve;});
const canStart=()=>raidChallengeAvailability({syncStatus:status,hasTicket:true}).enabled;
const first=gate.begin({canStart,syncState:async()=>{syncs++;await pendingSync;},start:async()=>{starts++;}});
assert.equal(gate.busy,true);
assert.equal(await gate.begin({canStart,syncState:async()=>{syncs++;},start:async()=>{starts++;}}),false,'repeat starts are ignored while syncing');
assert.equal(syncs,1);releaseSync();assert.equal(await first,true);assert.equal(starts,1);assert.equal(gate.busy,false);

status='ready';
assert.equal(await gate.begin({canStart,syncState:async()=>{status='offline';},start:async()=>{starts++;}}),false,'revalidates shared eligibility after communication failure');
assert.equal(starts,1,'failed resync never consumes a ticket or starts combat');
status='ready';
assert.equal(await gate.begin({canStart,syncState:async()=>{},start:async()=>false}),false,'a cancelled/stale start callback reports no start');
assert.equal(starts,1);
assert.equal(await gate.begin({canStart:()=>false,syncState:async()=>{throw Error('must not sync')},start:async()=>{starts++;}}),false,'ineligible start does not sync or start');
console.log('PASS: raid eligibility, ticket/defeat rules, test-mode exemptions, post-sync recheck, cancelled start, repeat suppression and failure lock recovery');
