import {readFile} from 'node:fs/promises';
import {initializeApp,applicationDefault,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {createFirestoreAccountStore} from '../server/firestore-account-store.mjs';
import {revokeLegacyTransfer} from '../server/legacy-migration.mjs';
const [file,apply]=process.argv.slice(2);
if(!file||apply&&apply!=='--apply')throw Error('Use: node scripts/revoke-legacy-migration.mjs /private/path/transfer-1.json [--apply]');
const transfer=JSON.parse(await readFile(file,'utf8'));
if(!/^[A-Za-z0-9_-]{43}$/.test(transfer.code||''))throw Error('Invalid transfer file.');
if(apply!=='--apply')console.log('Preview: revoke this transfer in ailandgames. No changes made.');
else{
 const app=initializeApp({credential:applicationDefault(),projectId:'ailandgames'},'migration-revoke');
 try{await revokeLegacyTransfer({store:createFirestoreAccountStore(getFirestore(app)),code:transfer.code});console.log('Transfer revoked. Imported save data was not deleted or changed.');}
 finally{await deleteApp(app);}
}
