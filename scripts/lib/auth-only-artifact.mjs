import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
export const BASELINE_MANIFEST_SHA256='a6279ae73fe367bf4bd3c7e90e4ed4ae4a3427eab9689bf4f07548366a8a5782';
export const BASELINE_VERSION='sites/legend-heroes2/versions/5f16202adce24340';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const hostingHash=bytes=>sha256(gzipSync(bytes,{level:9}));
const OLD_PROVIDER='function th(){const r=new Es("oidc.line");return r.addScope("profile"),r}';
const NEW_PROVIDER='function th(){const r=new Es("oidc.line");r.addScope("profile");const n=globalThis.navigator,u=n?.userAgent||"";if(/Android|iPhone|iPad|iPod/i.test(u)||/Macintosh/i.test(u)&&n?.maxTouchPoints>1)r.setCustomParameters({disable_auto_login:"true"});return r}';
function once(text,before,after){if(text.split(before).length!==2)throw Error('unexpected_baseline_patch');return text.replace(before,after);}
export function patchAuthBundle(text){return once(once(text,'authDomain:"ailandgames.firebaseapp.com"','authDomain:"legend-heroes2.web.app"'),OLD_PROVIDER,NEW_PROVIDER);}
export function patchAuthWorker(text){return once(text,"if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {","if (url.pathname === '/api' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/auth/') || url.pathname.startsWith('/__/firebase/')) {");}
export function createAuthOnlyArtifact({metadata,files,bodies}){
 if(metadata.version!==BASELINE_VERSION)throw Error('unexpected_baseline_version');
 if(sha256(JSON.stringify(files.map(f=>[f.path,f.hash]).sort(([a],[b])=>a.localeCompare(b))))!==BASELINE_MANIFEST_SHA256)throw Error('unexpected_baseline_manifest_hash');
 if(files.length!==440||new Set(files.map(f=>f.path)).size!==440)throw Error('unexpected_baseline_manifest');
 const expected=new Map(files.map(f=>[f.path,f.hash]));
 for(const file of files){if(!file.path.startsWith('/')||path.posix.normalize(file.path)!==file.path||/[\\\x00-\x1f]/.test(file.path)||file.path.split('/').includes('..'))throw Error('unsafe_path');const b=bodies.get(file.path);if(!b){if(!['/__/firebase/init.js','/__/firebase/init.json'].includes(file.path))throw Error('baseline_body_missing');continue;}if(hostingHash(b)!==file.hash)throw Error('baseline_hash_mismatch_'+file.path);}
 const authPath='/assets/save_migration_client-CsuqEdQA.js';
 const originals=new Map([...bodies].filter(([p])=>/\.(js|html)$/.test(p)).map(([p,b])=>[p,b.toString('utf8')]));
 const seed=new Map([[authPath,patchAuthBundle(originals.get(authPath))],['/sw.js',patchAuthWorker(originals.get('/sw.js'))]]);
 // Re-name changed JS and every importing JS ancestor so old HTTP caches cannot hide the fix.
 const affected=new Set(seed.keys());let changed=true;
 while(changed){changed=false;for(const [p,text]of originals){if(affected.has(p))continue;if([...affected].some(child=>child.endsWith('.js')&&text.includes(path.posix.basename(child)))){affected.add(p);changed=true;}}}
 if(affected.size!==6)throw Error('unexpected_auth_dependency_graph');
 const output=new Map(bodies),renames=new Map(),visited=new Set(),active=new Set(),changes=[];
 function transform(p){if(visited.has(p))return;if(active.has(p))throw Error('cyclic_auth_dependency');active.add(p);let text=seed.get(p)||originals.get(p);
 for(const child of affected){if(child===p||!child.endsWith('.js')||!text.includes(path.posix.basename(child)))continue;transform(child);const replacement=renames.get(child);if(replacement)text=text.split(path.posix.basename(child)).join(path.posix.basename(replacement));}
 const bytes=Buffer.from(text);let target=p;if(p.endsWith('.js')&&p!=='/sw.js')target=p.replace(/\.js$/,'.auth-'+sha256(bytes).slice(0,12)+'.js');
 if(target!==p)renames.set(p,target);output.set(target,bytes);expected.set(target,hostingHash(bytes));changes.push({from:p,to:target,beforeSha256:sha256(bodies.get(p)),afterSha256:sha256(bytes),hostingHash:hostingHash(bytes),kind:seed.has(p)?p==='/sw.js'?'auth-helper-worker-bypass':'auth-domain-and-mobile-line':'auth-import-reference'});active.delete(p);visited.add(p);}
 for(const p of affected)transform(p);
 const manifest=Object.fromEntries([...expected].sort(([a],[b])=>a.localeCompare(b)));
 return {output,plan:{schemaVersion:1,project:'ailandgames',site:'legend-heroes2',baselineVersion:BASELINE_VERSION,baselineRelease:metadata.name,baselineReleaseTime:metadata.releaseTime,config:metadata.config,files:manifest,changes:changes.sort((a,b)=>a.from.localeCompare(b.from)),retainedServerFiles:['/__/firebase/init.js','/__/firebase/init.json'],removedFiles:[]}};
}
