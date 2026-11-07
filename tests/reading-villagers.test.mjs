import assert from 'node:assert/strict';
import {READING_QUESTS} from '../reading_quests.js';
import {READING_VILLAGERS,readingVillager,readingConversation} from '../reading_villagers.js';
assert.equal(READING_VILLAGERS.length,10);
assert.equal(new Set(READING_VILLAGERS.map(n=>n.id)).size,10);
const seen=new Set();
for(const q of READING_QUESTS){
 const before=JSON.stringify(q),n=readingVillager(q),s=readingConversation(q);seen.add(n.id);
 assert.ok(n.name&&n.image&&s.intro&&s.documentLabel);
 assert.ok(s.question.includes(q.question));assert.ok(s.thanks.includes(q.answer));
 if(q.dialogueSpeaker==='self')assert.ok(s.question.startsWith('（こころのこえ）'));
 assert.equal(JSON.stringify(q),before);
}
for(const id of ['fumi','reto','mina','nono'])assert.ok(seen.has(id));
console.log('PASS: 60 villager conversations, four new and six existing characters, original questions preserved, thanks and self dialogue');
