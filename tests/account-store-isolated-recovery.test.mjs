import assert from 'node:assert/strict';
import {copyFile,mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';

const root=await mkdtemp(path.join(tmpdir(),'legend-isolated-recovery-'));
const source=path.join(root,'source'),backup=path.join(root,'offline-backup'),restore=path.join(root,'isolated-restore');
let sourceStore,restoredStore;
try{
  sourceStore=await openLocalAccountStore(source);
  await sourceStore.transaction(tx=>{
    tx.putAccount({id:'fixture-account-001',createdAt:1});
    tx.putSave({key:'fixture-save-001',ownerAccountId:'fixture-account-001',name:'架空テスト',gameState:{player:{level:7},items:['fixture-sword']},revision:3,createdAt:1,updatedAt:2});
    tx.putPurchase({purchaseId:'fixture-purchase-001',accountId:'fixture-account-001',status:'active',fixture:true});
  });
  await sourceStore.close();sourceStore=null;

  const sourcePath=path.join(source,'accounts.json'),backupPath=path.join(backup,'accounts.json');
  const sourceBefore=await readFile(sourcePath);
  await (await import('node:fs/promises')).mkdir(backup,{recursive:true});
  await copyFile(sourcePath,backupPath);
  await (await import('node:fs/promises')).mkdir(restore,{recursive:true});
  await copyFile(backupPath,path.join(restore,'accounts.json'));
  const backupBefore=await readFile(backupPath);
  restoredStore=await openLocalAccountStore(restore);
  const restored=await restoredStore.transaction(tx=>({
    account:tx.getAccount('fixture-account-001'),
    save:tx.getSave('fixture-save-001'),
    purchase:tx.getPurchase('fixture-purchase-001'),
  }));
  assert.equal(restored.account.id,'fixture-account-001');
  assert.equal(restored.save.ownerAccountId,'fixture-account-001');
  assert.equal(restored.save.gameState.player.level,7);
  assert.equal(restored.purchase.fixture,true);
  await restoredStore.transaction(tx=>tx.putSave({key:'restore-only',ownerAccountId:'fixture-account-001',name:'隔離先だけ',gameState:{player:{level:8}},revision:1}));
  await restoredStore.close();restoredStore=null;
  assert.deepEqual(await readFile(sourcePath),sourceBefore,'restore writes must not alter source');
  assert.deepEqual(await readFile(backupPath),backupBefore,'restore writes must not alter offline backup');
  sourceStore=await openLocalAccountStore(source);
  assert.equal(await sourceStore.transaction(tx=>tx.getSave('restore-only')),undefined,'restore data must remain isolated');
  console.log('PASS: invented account/save/purchase fixture copied to an offline backup and isolated restore; restored records verified and writes stayed isolated. No Firestore or production backup settings used.');
}finally{
  await sourceStore?.close();await restoredStore?.close();await rm(root,{recursive:true,force:true});
}
