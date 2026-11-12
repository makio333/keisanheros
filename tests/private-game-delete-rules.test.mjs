import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';

test('candidate rules allow an owner to delete only their gameplay saves',async()=>{
  const source=await readFile(new URL('../firestore.private-migration.rules',import.meta.url),'utf8');
  const game=source.match(/match \/privateGame\/\{uid\}\/saves\/\{saveId\} \{([\s\S]*?)\n    \}/)?.[1];
  assert.ok(game,'private gameplay save rule exists');
  assert.match(game,/allow delete: if owner\(uid\) && resource\.data\.ownerUid == uid;/);
  const migration=source.match(/match \/privateMigration\/\{uid\}\/saves\/\{saveId\} \{([\s\S]*?)\n    \}/)?.[1];
  assert.ok(migration,'immutable migration snapshot rule exists');
  assert.match(migration,/allow update, delete: if false;/);
  assert.match(source,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});
