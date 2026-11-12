import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';

const fixture=pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)),'internal-raid-firebase-stubs.mjs')).href;
const firebaseModules=new Set(['firebase-admin/app','firebase-admin/firestore','firebase-admin/auth']);

export async function resolve(specifier,context,nextResolve){
  if(firebaseModules.has(specifier))return {url:fixture,shortCircuit:true};
  return nextResolve(specifier,context);
}
