import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),directory=await mkdtemp(path.join(tmpdir(),'legend-runner-fixture-'));
let child;
try{
  let first;
  for(let run=0;run<2;run++){
    child=spawn(process.execPath,['scripts/run-local-account-demo.mjs','--mock-line','--data-dir',directory],{cwd:root,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
    let output='';const exited=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
    await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('local runner startup timed out: '+output)),15000);
      child.on('error',error=>{clearTimeout(timeout);reject(error);});
      child.once('exit',()=>{clearTimeout(timeout);reject(Error('local runner exited early: '+output));});
      child.stdout.on('data',chunk=>{output+=chunk;if(output.includes('Fixture storage:')){clearTimeout(timeout);resolve();}});child.stderr.on('data',chunk=>output+=chunk);
    });
    const data=JSON.parse(await readFile(path.join(directory,'accounts.json'),'utf8'));
    if(!first)first=data.accounts[0][0];else assert.equal(data.accounts[0][0],first,'restart retains the same fixture purchaser');
    child.kill('SIGTERM');
    let timer;const result=await Promise.race([exited,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('local runner shutdown timed out')),10000))]).finally(()=>clearTimeout(timer));
    assert.deepEqual(result,{code:0,signal:null});await assert.rejects(stat(path.join(directory,'account-store.lock')),{code:'ENOENT'});
    child=null;
  }
  console.log('PASS: local mock runner releases its account lock on SIGTERM and restarts without resetting fixture accounts.');
}finally{if(child && child.exitCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGKILL');await exited;}await rm(directory,{recursive:true,force:true});}
