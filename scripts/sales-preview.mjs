import {mkdtemp} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {startSalesPreview} from '../tests/helpers/sales-preview.mjs';
if(!process.argv.includes('--mock'))throw Error('Only explicit --mock preview is supported.');
const directory=await mkdtemp(path.join(tmpdir(),'legend-sales-preview-'));
const previous=new Map(['SIGINT','SIGTERM'].map(signal=>[signal,new Set(process.listeners(signal))]));
const preview=await startSalesPreview({directory,mock:true,port:Number(process.env.SALES_PREVIEW_PORT||5185)});
console.log('Local sales preview: '+preview.url+'\nMOCK identity/payment only. No charges or production data.');
for(const signal of ['SIGINT','SIGTERM']){for(const listener of process.listeners(signal))if(!previous.get(signal).has(listener))process.removeListener(signal,listener);process.on(signal,()=>preview.close().then(()=>process.exit(0)));}
