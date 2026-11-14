// Shared by the page and classic Service Worker. Only public game artwork/audio is stored here.
// IndexedDB is the durable source; Cache Storage from earlier releases can be adopted without downloading.
(function(root){
 let opened;
 function open(){if(!opened)opened=new Promise((resolve,reject)=>{const req=indexedDB.open('legend-heroes-media',1);req.onupgradeneeded=()=>req.result.createObjectStore('files',{keyPath:'url'});req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();opened=undefined;};resolve(req.result);};req.onerror=()=>{opened=undefined;reject(req.error);};});return opened;}
 async function run(mode,operation){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('files',mode);let result;const req=operation(tx.objectStore('files'));req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error || req.error || Error('Media storage aborted'));});}
 root.GameMediaStore={
  keys:()=>run('readonly',store=>store.getAllKeys()),
  get:url=>run('readonly',store=>store.get(url)),
  put:async(url,blob,headers)=>{const bytes=await blob.arrayBuffer();return run('readwrite',store=>store.put({url,bytes,headers:[...new Headers(headers)],verified:true}));},
  delete:url=>run('readwrite',store=>store.delete(url)),
  response:entry=>entry?.verified?new Response(entry.bytes,{status:200,headers:entry.headers}):undefined,
 };
})(globalThis);
