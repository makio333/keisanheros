import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFile}from'node:fs/promises';
import{patchAuthBundle,patchAuthWorker,sha256,hostingHash}from'../scripts/lib/auth-only-artifact.mjs';import{publishAuthOnly,verifyLiveBaseline}from'../scripts/lib/publish-auth-only.mjs';
const work=process.env.AUTH_ONLY_WORK_DIR||'/tmp/legend-auth-only-release';
let plan,originalAuth;
try{plan=JSON.parse(await readFile(work+'/auth-only-plan.json'));originalAuth=await readFile(work+'/baseline/assets/save_migration_client-CsuqEdQA.js','utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
const artifactTest=(name,callback)=>test(name,{skip:plan?false:'Pinned public artifact is not present; prepare it before release validation.'},callback);
artifactTest('candidate alters only explicit auth code, importing references and auth-helper worker handling',async()=>{
 assert.equal(plan.changes.length,6);assert.equal(Object.keys(plan.files).length,443);assert.deepEqual(plan.removedFiles,[]);
 for(const change of plan.changes){const before=await readFile(work+'/baseline'+change.from),after=await readFile(work+'/candidate'+change.to);assert.equal(sha256(after),change.afterSha256);assert.equal(hostingHash(after),plan.files[change.to]);
 if(change.kind==='auth-domain-and-mobile-line')assert.equal(after.toString(),patchAuthBundle(before.toString()));
 else if(change.kind==='auth-helper-worker-bypass')assert.equal(after.toString(),patchAuthWorker(before.toString()));
 else{let restored=after.toString();for(const rename of plan.changes.filter(c=>c.from!==c.to))restored=restored.split(rename.to.split('/').at(-1)).join(rename.from.split('/').at(-1));assert.equal(restored,before.toString());}}
 for(const file of ['/assets/game-BxaoFrtb.js','/assets/index-CaV9XcBY.css'])assert.deepEqual(await readFile(work+'/candidate'+file),await readFile(work+'/baseline'+file));
});
artifactTest('mobile LINE provider keeps oidc identity/profile and adds browser-only setting; desktop unchanged',()=>{
 const patched=patchAuthBundle(originalAuth),start=patched.indexOf('function th(){'),end=patched.indexOf('const Xy=',start),fn=patched.slice(start,end);
 class Provider{constructor(id){this.id=id;}addScope(scope){this.scope=scope;}setCustomParameters(params){this.params=params;}}
 for(const [nav,mobile]of [[{userAgent:'iPhone'},true],[{userAgent:'Android'},true],[{userAgent:'Macintosh',maxTouchPoints:5},true],[{userAgent:'Windows NT'},false]]){const context={Es:Provider,navigator:nav};vm.runInNewContext(fn+';result=th();',context);assert.equal(context.result.id,'oidc.line');assert.equal(context.result.scope,'profile');assert.equal(context.result.params?.disable_auto_login,mobile?'true':undefined);}
 assert.throws(()=>patchAuthBundle(patched),/unexpected_baseline_patch/);
});
artifactTest('worker leaves auth/iframe/callback/init requests to browser, including offline, without touching saves',async()=>{
 const events={},context={self:{addEventListener:(name,handler)=>events[name]=handler},URL};
 vm.runInNewContext(await readFile(work+'/candidate/sw.js','utf8'),context);
 context.self.location={origin:'https://legend-heroes2.web.app'};
 for(const pathname of ['/__/auth/handler?state=fixture','/__/auth/iframe','/__/firebase/init.json','/api/auth/line/callback']){let intercepted=false;events.fetch({request:{method:'GET',url:context.self.location.origin+pathname,mode:'navigate'},respondWith(){intercepted=true;}});assert.equal(intercepted,false,pathname);}
});
artifactTest('publisher addresses only exact Hosting site and stops if baseline drifted or upload URL is foreign',async()=>{
 const calls=[],base={releases:[{name:plan.baselineRelease,version:{name:plan.baselineVersion}}]},version='sites/legend-heroes2/versions/fixture123';
 const request=async(method,url,body)=>{calls.push({method,url,body});if(url.endsWith('/releases?pageSize=1'))return calls.some(c=>c.method==='POST'&&c.url.includes('/releases?'))?{releases:[{version:{name:version}}]}:base;if(url.endsWith('projects/ailandgames/sites/legend-heroes2'))return{name:'projects/ailandgames/sites/legend-heroes2'};if(url.endsWith('/versions'))return{name:version};if(url.includes(':populateFiles'))return{uploadUrl:'https://upload-firebasehosting.googleapis.com/upload/'+version+'/files',uploadRequiredHashes:[]};if(method==='PATCH')return{status:'FINALIZED'};if(url.includes('/releases?versionName='))return{name:'fixture-release',version:{name:version}};throw Error('unexpected_endpoint');};
 await publishAuthOnly({plan,request,bodies:new Map()});assert.ok(calls.every(c=>c.url.startsWith('https://firebasehosting.googleapis.com/')));assert.ok(!calls.some(c=>/firestore|stripe|cloudrun|identitytoolkit/.test(c.url)));assert.deepEqual(calls.find(c=>c.url.includes(':populateFiles')).body.files,plan.files);
 await assert.rejects(verifyLiveBaseline(async()=>({releases:[]}),plan),/live_release_changed/);
 const foreign=async(...args)=>{if(args[1].includes(':populateFiles'))return{uploadUrl:'https://attacker.example/upload'};return request(...args);};calls.length=0;await assert.rejects(publishAuthOnly({plan,request:foreign,bodies:new Map()}),/unsafe_upload_url/);assert.ok(!calls.some(c=>c.url.includes('/releases?versionName=')));
 calls.length=0;const missing=async(...args)=>args[1].includes(':populateFiles')?{uploadUrl:'https://upload-firebasehosting.googleapis.com/upload/'+version+'/files',uploadRequiredHashes:['0'.repeat(64)]}:request(...args);
 await assert.rejects(publishAuthOnly({plan,request:missing,bodies:new Map()}),/required_file_body_unavailable/);assert.ok(!calls.some(c=>c.method==='PATCH'||c.url.includes('/releases?versionName=')));
 calls.length=0;const drift=async(...args)=>args[1].endsWith('/releases?pageSize=1')&&calls.some(c=>c.method==='PATCH')?{releases:[{name:'another',version:{name:'another'}}]}:request(...args);
 await assert.rejects(publishAuthOnly({plan,request:drift,bodies:new Map()}),/live_release_changed/);assert.ok(!calls.some(c=>c.url.includes('/releases?versionName=')));
 await assert.rejects(publishAuthOnly({plan:{...plan,project:'other'},request,bodies:new Map()}),/wrong_target/);
});
