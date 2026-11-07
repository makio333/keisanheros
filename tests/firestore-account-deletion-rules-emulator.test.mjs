import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {after, before, test} from 'node:test';
import {assertFails, assertSucceeds, initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {deleteDoc, doc, getDoc, setDoc, updateDoc} from 'firebase/firestore';

const rules=await readFile(new URL('../firestore.account-deletion-retention-candidate.rules',import.meta.url),'utf8');
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-account-deletion',firestore:{rules}});});
after(async()=>{await env?.cleanup();});

function savePath(uid,id='slot-1'){return `privateGame/${uid}/saves/${id}`;}
function migrationPath(uid,id='import-1'){return `privateMigration/${uid}/saves/${id}`;}
function gameData(uid){return {ownerUid:uid,gameData:'{}',revision:1,createdAt:100,updatedAt:100,sourceMigrationId:null};}
function emailUser(uid){return env.authenticatedContext(uid,{email_verified:true,firebase:{sign_in_provider:'password'}}).firestore();}
function marker(uid,state){return env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),`accountDeletionVisibility/${uid}`),{state}));}
function seedSave(uid,id='slot-1'){return env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),savePath(uid,id)),gameData(uid)));}

test('verified email users can read and update their existing game save',async()=>{
  const uid='email-normal';await seedSave(uid);
  const db=emailUser(uid),ref=doc(db,savePath(uid));
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(updateDoc(ref,{gameData:'{"level":2}',revision:2,updatedAt:200}));
});

test('normal users retain existing permission to delete only their own game save',async()=>{
  const uid='email-save-delete';await seedSave(uid);
  await assertSucceeds(deleteDoc(doc(emailUser(uid),savePath(uid))));
});

test('retention-pending and completed deletion markers block direct reads and existing-save updates',async()=>{
  for(const [uid,state] of [['email-pending','retention_pending'],['email-deleted','complete']]){
    await seedSave(uid);await marker(uid,state);
    const db=emailUser(uid),ref=doc(db,savePath(uid));
    await assertFails(getDoc(ref));
    await assertFails(updateDoc(ref,{gameData:'{"level":2}',revision:2,updatedAt:200}));
    await assertFails(deleteDoc(ref));
  }
});

test('another authenticated UID cannot read or update a player save',async()=>{
  await seedSave('email-owner');
  const db=emailUser('email-other'),ref=doc(db,savePath('email-owner'));
  await assertFails(getDoc(ref));
  await assertFails(updateDoc(ref,{gameData:'{"level":2}',revision:2,updatedAt:200}));
});

test('unauthenticated and not-yet-email-verified users are denied',async()=>{
  await seedSave('email-unverified');
  const ref=doc(env.unauthenticatedContext().firestore(),savePath('email-unverified'));
  await assertFails(getDoc(ref));
  const unverified=env.authenticatedContext('email-unverified',{email_verified:false,firebase:{sign_in_provider:'password'}}).firestore();
  await assertFails(getDoc(doc(unverified,savePath('email-unverified'))));
});

test('LINE provider claim is accepted without an email-verified claim',async()=>{
  const uid='line-owner';await seedSave(uid);
  const db=env.authenticatedContext(uid,{email_verified:false,firebase:{sign_in_provider:'oidc.line'}}).firestore();
  await assertSucceeds(getDoc(doc(db,savePath(uid))));
  await assertSucceeds(updateDoc(doc(db,savePath(uid)),{gameData:'{"level":2}',revision:2,updatedAt:200}));
});

test('verified user can create a migration save before deletion and cannot create one after the marker',async()=>{
  const allowed='migration-normal';
  const normalDb=emailUser(allowed);
  await assertSucceeds(setDoc(doc(normalDb,migrationPath(allowed)),{ownerUid:allowed,sourceProject:'source-demo',sourceDocumentId:'save-1',gameData:'{}',importedAt:100}));

  const blocked='migration-pending';await marker(blocked,'retention_pending');
  const blockedDb=emailUser(blocked);
  await assertFails(setDoc(doc(blockedDb,migrationPath(blocked)),{ownerUid:blocked,sourceProject:'source-demo',sourceDocumentId:'save-1',gameData:'{}',importedAt:100}));
});

test('clients cannot create, read, or remove their deletion visibility marker',async()=>{
  const uid='marker-client';const db=emailUser(uid),ref=doc(db,`accountDeletionVisibility/${uid}`);
  await assertFails(getDoc(ref));
  await assertFails(setDoc(ref,{state:'complete'}));
  await marker(uid,'retention_pending');
  await assertFails(setDoc(ref,{state:'clear'}));
  await assertFails(deleteDoc(ref));
});
