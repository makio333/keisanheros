import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';

test('candidate Firestore rules deny direct owner reads and writes after a visibility marker exists',async()=>{
  const [active,candidate]=await Promise.all([
    readFile(new URL('../firestore.private-migration.active.rules',import.meta.url),'utf8'),
    readFile(new URL('../firestore.account-deletion-retention-candidate.rules',import.meta.url),'utf8'),
  ]);
  assert.doesNotMatch(active,/accountDeletionVisibility/,'the currently observed rules do not check the deletion lock');
  assert.match(candidate,/function notDeleting\(uid\)[\s\S]*?exists\(\/databases\/\$\(database\)\/documents\/accountDeletionVisibility\/\$\(uid\)\)/);
  assert.match(candidate,/function owner\(uid\)[\s\S]*?&& notDeleting\(uid\);/);
  assert.match(candidate,/allow read: if owner\(uid\);/);
  assert.match(candidate,/allow create: if owner\(uid\)/);
  assert.match(candidate,/allow update: if owner\(uid\)/);
  assert.match(candidate,/match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
  assert.match(active,/allow read: if owner\(uid\);/,'the active rules retain owner-only direct reads, so server session gating alone is insufficient');
  // Static source check only. Emulator evaluation is a release prerequisite.
});
