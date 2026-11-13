import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const listeners={};const deleted=[];
const context={caches:{async keys(){return ['legend-heroes-cache-v24','legend-heroes-cache-v25','legend-heroes-media-v1','another-app'];},async delete(k){deleted.push(k);}},self:{clients:{async claim(){}},addEventListener(name,handler){listeners[name]=handler;},location:{origin:'https://fixture.test'}},Response,Headers,Blob};vm.createContext(context);vm.runInContext(source,context);
const response=()=>new Response('0123456789',{headers:{'Content-Type':'audio/mp4'}});
const request=range=>new Request('https://fixture.test/audio.m4a',{headers:range?{Range:range}:{}});
test('cached audio supports the byte ranges requested by Safari',async()=>{
 for(const [range,expected,header] of [['bytes=2-5','2345','bytes 2-5/10'],['bytes=6-','6789','bytes 6-9/10'],['bytes=-3','789','bytes 7-9/10']]){
  const result=await context.mediaRangeResponse(request(range),response());assert.equal(result.status,206);assert.equal(result.headers.get('content-range'),header);assert.equal(await result.text(),expected);
 }
 assert.equal((await context.mediaRangeResponse(request('bytes=99-'),response())).status,416);
 assert.equal((await context.mediaRangeResponse(request(),response())).status,200);
});
test('SW activation preserves downloaded media and other apps',async()=>{
 let finished;listeners.activate({waitUntil(promise){finished=promise;}});await finished;assert.deepEqual(deleted,['legend-heroes-cache-v24']);
});
