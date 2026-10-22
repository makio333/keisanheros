import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const diff=execFileSync('git',['diff','872b051','--','firebase_init.js'],{cwd:root,encoding:'utf8'});
const parts=diff.split(/(?=^@@ )/m);
const hunks=parts.slice(1).filter(h=>h.includes('+import {mountLegacyExport}')||h.includes('+  getDocsFromServer,')||h.includes('+const migrationTools=')).map(h=>{
 const lines=h.split('\n').filter(line=>!line.startsWith('+import {LEGACY_FIREBASE_CONFIG}'));
 const count=lines.slice(1).filter(line=>line.startsWith(' ')||line.startsWith('+')).length;
 lines[0]=lines[0].replace(/(\+\d+)(?:,\d+)?( @@)/,`$1,${count}$2`);
 return lines.join('\n');
});
if(hunks.length!==3)throw Error('Export integration changed; review before making an old-version patch.');
let patch=parts[0]+hunks.join('');
if(patch.includes('apiKey:')||patch.includes('authDomain:')||patch.includes('projectId:'))throw Error('Do not include Firebase configuration changes.');
for(const name of ['legacy_save_file.js','legacy_file_ui.js']){
 const source=await readFile(root+name,'utf8'),lines=source.trimEnd().split('\n');
 patch+=`diff --git a/${name} b/${name}\nnew file mode 100644\n--- /dev/null\n+++ b/${name}\n@@ -0,0 +1,${lines.length} @@\n`+lines.map(line=>'+'+line+'\n').join('');
}
await mkdir(root+'output',{recursive:true});
await writeFile(root+'output/legacy-export-only.patch',patch,{mode:0o600});
console.log('Created output/legacy-export-only.patch: exporter only, no Firebase config, auth, payment or database-rule changes.');
