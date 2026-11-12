import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';import {constants} from 'node:fs';import path from 'node:path';
import {createAuthOnlyArtifact,sha256} from './lib/auth-only-artifact.mjs';
const work=process.argv[2];if(!work||process.argv.length!==3)throw Error('Usage: node scripts/prepare-auth-only-artifact.mjs ABSOLUTE_WORK_DIR');
if(!path.isAbsolute(work))throw Error('absolute_path_required');
const metadata=JSON.parse(await readFile(path.join(work,'release-metadata.json'))),files=JSON.parse(await readFile(path.join(work,'published-files.json'))),bodies=new Map();
for(const file of files){try{bodies.set(file.path,await readFile(path.join(work,'baseline',file.path.slice(1))));}catch(error){if(error.code!=='ENOENT')throw error;}}
const {output,plan}=createAuthOnlyArtifact({metadata,files,bodies}),candidate=path.join(work,'candidate');await mkdir(candidate); // Never overwrite a previous review candidate.
for(const [p,bytes]of output){const destination=path.join(candidate,p.slice(1));await mkdir(path.dirname(destination),{recursive:true});const original=bodies.get(p);if(original&&original.equals(bytes))await copyFile(path.join(work,'baseline',p.slice(1)),destination,constants.COPYFILE_FICLONE);else await writeFile(destination,bytes);}
const planBytes=Buffer.from(JSON.stringify(plan,null,2)+'\n');await writeFile(path.join(work,'auth-only-plan.json'),planBytes);await writeFile(path.join(work,'auth-only-plan.sha256'),sha256(planBytes)+'\n');
console.log(JSON.stringify({candidate,plan:path.join(work,'auth-only-plan.json'),sha256:sha256(planBytes),baseline:plan.baselineVersion,files:Object.keys(plan.files).length,changes:plan.changes,retainedServerFiles:plan.retainedServerFiles},null,2));
