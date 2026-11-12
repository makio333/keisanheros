import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import path from 'node:path';
import {existsSync} from 'node:fs';

const root=process.cwd();
const javaHome=process.env.JAVA_HOME||path.join(homedir(),'Library','Caches','keisanheros-tools','temurin21','jdk-21.0.13+9','Contents','Home');
const emulatorCache=process.env.FIREBASE_EMULATORS_PATH||path.join(homedir(),'.cache','firebase','emulators');
if(!existsSync(path.join(javaHome,'bin','java'))){console.error('firestore_rules_test_requires_user_scoped_java_21');process.exit(2);}
const env={...process.env,JAVA_HOME:javaHome,FIREBASE_EMULATORS_PATH:emulatorCache,PATH:`${path.join(javaHome,'bin')}${path.delimiter}${process.env.PATH||''}`};
const result=spawnSync('firebase',[
  'emulators:exec',
  '--config',path.join(root,'firebase.account-deletion-emulator.json'),
  '--project','demo-account-deletion',
  '--only','firestore',
  'node --test tests/firestore-account-deletion-rules-emulator.test.mjs',
],{cwd:root,env,stdio:'inherit'});
if(result.error){console.error('firestore_rules_emulator_start_failed');process.exit(2);}
process.exit(result.status??2);
