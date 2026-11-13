import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function runtimeArtPlugin(root){
 let replacements;
 function setup(){if(!replacements){const m=JSON.parse(fs.readFileSync(path.join(root,'assets/runtime/manifest.json'),'utf8'));replacements=new Map(m.images.map(e=>[path.join(root,e.source),{target:path.join(root,e.file),source:e.source}]));}}
 function lookup(file,importer){setup();const candidates=[file.startsWith('/')?file:null,file.startsWith('/')?path.join(root,file):null,importer&&file.startsWith('.')?path.resolve(path.dirname(importer.split('?')[0]),file):path.join(root,file)];for(const candidate of candidates){const e=replacements.get(candidate);if(e)return e;}}
 return {name:'runtime-delivery-art',enforce:'pre',resolveId(source,importer){
  if(source.startsWith('\0') || !/\.(png|jpe?g|webp)(\?|$)/i.test(source))return;
  const split=source.indexOf('?'),file=split<0?source:source.slice(0,split),query=split<0?'':source.slice(split),entry=lookup(file,importer);
  if(entry)return entry.target+query;
 },transformIndexHtml:{order:'pre',handler(html){return html.replace(/\bsrc=(['"])([^'"]+)\1/g,(all,quote,file)=>{const entry=lookup(file,path.join(root,'index.html'));return entry?`src=${quote}./${path.relative(root,entry.target)}${quote}`:all;});}},
 transform(code,id){if(/\.(m?js)$/.test(id.split('?')[0]))return code.replace(/new URL\((['"])([^'"]+)\1,\s*import\.meta\.url\)/g,(all,quote,file)=>{const entry=lookup(file,id);return entry?`new URL(${JSON.stringify('./'+path.relative(path.dirname(id.split('?')[0]),entry.target))},import.meta.url)`:all;});if(!id.split('?')[0].endsWith('.css'))return;return code.replace(/url\((['"]?)([^'"\)]+)\1\)/g,(all,quote,file)=>{const entry=lookup(file,id);if(!entry)return all;const key=createHash('sha1').update(entry.source).digest('hex').slice(0,12);return `var(--game-art-${key},url('${path.relative(path.dirname(id.split('?')[0]),entry.target).replace(/^(?!\.)/,'./')}'))`;});}
 };
}
