import {initializeApp,applicationDefault,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createFirestoreAccountStore} from '../server/firestore-account-store.mjs';
import {legacySnapshot,issueLegacyTransfer,grantLegacyFacilityAccess} from '../server/legacy-migration.mjs';

const args=process.argv.slice(2),values=new Map(),slots=[];
for(let i=0;i<args.length;i++){
  const key=args[i];
  if(['--apply','--all','--facility-free'].includes(key)){values.set(key,true);continue;}
  if(!['--source-project','--account','--slot','--output'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid arguments. Use --source-project, --account, --slot (document ID; repeatable), --output; --all selects all saves explicitly; --apply issues codes.');
  const value=args[++i];if(key==='--slot')slots.push(value);else values.set(key,value);
}
const source=values.get('--source-project'),accountId=values.get('--account'),apply=values.has('--apply');
if(!source||source==='ailandgames')throw Error('Specify the OLD Firebase project using --source-project. Target is ailandgames.');
if(!slots.length&&!values.has('--all'))throw Error('Specify --slot DOCUMENT_ID or --all. No records read or changed.');
if(slots.some(id=>id.includes('/')))throw Error('Slot must be a Firestore saves document ID.');
let directory;
if(apply){
  if(!accountId||!values.get('--output'))throw Error('--apply requires --account and --output for private backups and codes.');
  directory=path.resolve(values.get('--output'));
  const root=fileURLToPath(new URL('../',import.meta.url)),relative=path.relative(root,directory);
  if(!relative||!relative.startsWith('..'+path.sep)&&relative!=='..')throw Error('Keep private migration files outside the repository.');
}
const oldApp=initializeApp({credential:applicationDefault(),projectId:source},'migration-source');
const newApp=initializeApp({credential:applicationDefault(),projectId:'ailandgames'},'migration-target');
try{
  const oldDb=getFirestore(oldApp),newDb=getFirestore(newApp);
  const store=createFirestoreAccountStore(newDb);
  if(apply&&!await store.transaction(tx=>tx.getAccount(accountId)))throw Error('Recipient must log in to the NEW game first.');
  const docs=slots.length?await Promise.all([...new Set(slots)].map(id=>oldDb.collection('saves').doc(id).get())):(await oldDb.collection('saves').get()).docs;
  const selected=[];
  for(const doc of docs){
    if(!doc.exists)throw Error('Selected save does not exist: '+doc.id);
    const data=doc.data();
    if(data.deleted){if(slots.length)throw Error('Selected save was deleted: '+doc.id);continue;}
    const snapshot=legacySnapshot(source,doc.id,data);
    selected.push({snapshot,data,documentId:doc.id,sourceUpdateTime:doc.updateTime?.toDate().toISOString()||null});
  }
  console.log(JSON.stringify({mode:apply?'issue-codes':'preview-only',source,target:'ailandgames',count:selected.length,facilityFree:values.has('--facility-free'),
    saves:selected.map(row=>({documentId:row.documentId,name:row.snapshot.name,sourceUpdateTime:row.sourceUpdateTime}))},null,2));
  if(!apply){console.log('Preview only. No files or database records changed.');}
  else{
    // Reserve a fresh private directory and back up every snapshot before issuing any code.
    await mkdir(directory,{mode:0o700});
    await writeFile(path.join(directory,'backup.json'),JSON.stringify({version:1,source,target:'ailandgames',accountId,exportedAt:new Date().toISOString(),saves:selected}),{flag:'wx',mode:0o600});
    if(values.has('--facility-free')){
      const grant=await grantLegacyFacilityAccess({store,accountId,sourceProject:source,snapshots:selected.map(row=>row.snapshot)});
      console.log('Facility access: '+grant.saveLimit+' slots, no payment. No Stripe purchase or paid credit created.');
    }
    let issued=0;
    for(let i=0;i<selected.length;i++){
      const row=selected[i];
      const transfer=await issueLegacyTransfer({store,accountId,snapshot:row.snapshot});
      await writeFile(path.join(directory,`transfer-${i+1}.json`),JSON.stringify({...transfer,accountId,sourceDocumentId:row.documentId}),{flag:'wx',mode:0o600});
      issued++;
    }
    console.log('Issued '+issued+' codes. Private backup/code files: '+directory);
    console.log('The OLD database was read only. Never commit these files or send them to unrelated people.');
  }
}finally{await Promise.all([deleteApp(oldApp),deleteApp(newApp)]);}
