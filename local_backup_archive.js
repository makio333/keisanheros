// Move only redundant local history to IndexedDB; never remove active saves or conflict copies.
export async function archiveLocalSaveHistory(){
 const keys=Object.keys(localStorage).filter(k=>k.startsWith('legend-account-backup::'));
 if(!keys.length)return;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('legend-heroes-save-history',1);r.onupgradeneeded=()=>r.result.createObjectStore('backups');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 try{for(const key of keys){const value=localStorage.getItem(key);if(value===null)continue;await new Promise((resolve,reject)=>{const tx=db.transaction('backups','readwrite');tx.objectStore('backups').put(value,key);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});if(localStorage.getItem(key)===value)localStorage.removeItem(key);}}finally{db.close();}
}
