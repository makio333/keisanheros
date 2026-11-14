import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import {createMediaTestServer} from './runtime-media-server.mjs';
const root=process.cwd();const server=await createMediaTestServer({root});const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const html=await readFile('index.html','utf8');const loader=html.slice(html.indexOf('<div id="boot-loader-screen"'),html.indexOf('<!-- タイトル起動時'));
 await mkdir('/private/tmp/loading-party',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.goto(server.url+'print_review_20261106.html');
  await page.setContent(`<base href="${server.url}"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="asset_boot.css">${loader}`);
  await page.locator('#boot-scenery').evaluate(img=>{img.src='assets/ui/loading-skin-party.png';return img.decode();});
  await page.locator('#boot-phase-title').evaluate(el=>el.textContent='アップデート中');
  await page.screenshot({path:`/private/tmp/loading-party/${name}.png`});
  const box=await page.locator('#boot-loading-bar-area').boundingBox();if(box.y<0||box.y+box.height>height+1)throw Error(`${name}: progress panel clipped`);
  await page.close();
 }
 console.log('PASS: full-resolution party background decoded; progress panel fits desktop, portrait, landscape');
}finally{await browser.close();await server.stop();}
