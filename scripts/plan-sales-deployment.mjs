import {readFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import {createSalesDeploymentPlan} from './lib/sales-deployment-plan.mjs';

// Read one explicitly supplied, non-secret JSON document; print a plan only.
// There is no execute option and no environment/SDK/process-launch integration.
async function main(args){
  let inputPath=null,stdin=false,hashOnly=false;
  for(let i=0;i<args.length;i++){
    if(args[i]==='--input'&&!inputPath&&!stdin&&typeof args[i+1]==='string'&&!args[i+1].startsWith('--'))inputPath=args[++i];
    else if(args[i]==='--stdin'&&!stdin&&!inputPath)stdin=true;
    else if(args[i]==='--baseline-hash-only'&&!hashOnly)hashOnly=true;
    else throw Error('deployment_plan_arguments_invalid');
  }
  if(!inputPath&&!stdin)throw Error('deployment_plan_input_required');
  let bytes;
  if(inputPath){
    if(path.extname(inputPath)!=='.json'||/(?:^|[._-])(?:secret|credential|service-account|private-key|env)(?:[._-]|$)/i.test(path.basename(inputPath)))throw Error('deployment_plan_metadata_file_required');
    const stat=await lstat(inputPath);if(!stat.isFile()||stat.size>1024*1024)throw Error('deployment_plan_metadata_file_invalid');
    bytes=await readFile(inputPath,'utf8');
  }else{
    const chunks=[];let size=0;
    for await(const chunk of process.stdin){size+=Buffer.byteLength(chunk);if(size>1024*1024)throw Error('deployment_plan_input_too_large');chunks.push(chunk);}
    bytes=Buffer.concat(chunks).toString('utf8');
  }
  let input;try{input=JSON.parse(bytes);}catch{throw Error('deployment_plan_json_invalid');}
  const plan=createSalesDeploymentPlan(input);
  console.log(JSON.stringify(hashOnly?{baselineHash:plan.baselineHash,executed:false}:plan,null,2));
  if(!hashOnly&&!plan.ready)process.exitCode=2;
}
main(process.argv.slice(2)).catch(error=>{
  // Filesystem/JSON errors may contain paths or input fragments. Emit only our
  // fixed error code, never the raw exception or supplied content.
  const code=/^deployment_[a-z_]+$/.test(error?.message||'')?error.message:'deployment_plan_input_unavailable';
  console.error(JSON.stringify({ready:false,executed:false,error:code}));process.exitCode=1;
});
