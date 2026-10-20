import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {startLocalAccountDemo} from '../server/local-account-demo.mjs';
if(!process.argv.includes('--mock-line'))throw Error('Only --mock-line local fixture mode is supported here.');
const index=process.argv.indexOf('--data-dir');
const directory=index>=0?process.argv[index+1]:await mkdtemp(path.join(tmpdir(),'legend-local-accounts-'));
const signals=['SIGINT','SIGTERM'];
const previousListeners=new Map(signals.map(signal=>[signal,new Set(process.listeners(signal))]));
const demo=await startLocalAccountDemo({directory,mockLine:true,port:Number(process.env.PORT||5181)});
console.log(`Local fixture game: ${demo.url}\nMock LINE and purchase only. No production Firebase.\nFixture storage: ${directory}`);
let stopping=false;
// Own teardown: Vite's exit listener can otherwise terminate before the account lock is released.
for(const signal of signals){
  for(const listener of process.listeners(signal))if(!previousListeners.get(signal).has(listener))process.removeListener(signal,listener);
  process.on(signal,async()=>{if(stopping)return;stopping=true;await demo.close();process.exit(0);});
}
