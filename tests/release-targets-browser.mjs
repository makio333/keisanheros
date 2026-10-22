import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {tmpdir,homedir} from 'node:os';
import {spawn} from 'node:child_process';
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(tmpdir(),'legend-release-targets');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
try{
 for(const target of ['legacy','product']){
  const base=path.join(root,'dist-'+target);
  const server=createServer(async(req,res)=>{
   try{
    if(req.url.startsWith('/api/')){res.writeHead(401,{'Content-Type':'application/json'});res.end('{"error":"authentication_required"}');return;}
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(base,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(base+path.sep))throw Error('invalid_path');
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);
   }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  try{
   for(const width of [390,1280]){
    const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];
    await context.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(url.origin!==origin)return route.fulfill({status:403,body:''});
     if(url.pathname.startsWith('/api/'))return route.fulfill({status:401,contentType:'application/json',body:'{"error":"authentication_required"}'});
     return route.continue();
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    if(target==='legacy'){
     await page.waitForFunction(()=>!!window.CloudSave&&document.querySelector('#admin-tab-pane-tools .account-migration'));
     assert.equal(await page.locator('.account-login-gate').count(),0);
     assert.equal(await page.getByRole('button',{name:'全員分の引っ越しファイルを作る',exact:true,includeHidden:true}).count(),1);
     await page.evaluate(()=>{document.getElementById('boot-loader-screen')?.remove();document.getElementById('title-white-fade')?.remove();document.getElementById('screen-title').classList.add('active');});
    }else{
     await page.locator('.account-login-gate').waitFor();
     assert.equal(await page.evaluate(()=>!!window.CloudSave),false);
     assert.equal(await page.getByRole('button',{name:'全員分の引っ越しファイルを作る',includeHidden:true}).count(),0);
    }
    await page.screenshot({path:path.join(out,target+'-'+width+'.png')});assert.deepEqual(errors,[]);await context.close();
   }
   if(target==='product')await new Promise((resolve,reject)=>{
    // The unauthenticated gate makes no real account/payment requests; the static fixture returns404 for API calls.
    const child=spawn('node',['scripts/run-web-skill-client.mjs','--url',origin,'--actions-json','{"steps":[{"buttons":[],"frames":1}]}','--iterations','1','--pause-ms','100','--screenshot-dir',path.join(out,'skill')],{stdio:'inherit'});
    child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Skill failed')));
   });
  }finally{await new Promise(resolve=>server.close(resolve));}
 }
 console.log('PASS: compiled legacy starts without LINE and has exporter; compiled product requires LINE and never installs direct CloudSave. Desktop/mobile; all external requests blocked. '+out);
}finally{await browser.close();}
