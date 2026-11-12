import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const out='/private/tmp/gacha-alignment-check';await mkdir(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({status:200,body:''}));
 await page.goto('http://127.0.0.1:5195/?v=gacha-align1');
 await page.waitForFunction(()=>window.latestQA&&window.christmasStageLocalPreview?.state().game);
 await page.locator('.christmas-hub').waitFor();
 await page.evaluate(()=>latestQA.gacha('christmas-items'));
 for(const [tab,section] of [['christmas-items','christmas-equip-gacha-section'],['items','gacha-item-section'],['christmas-items','christmas-equip-gacha-section']]){
  await page.locator('#btn-gacha-tab-'+tab).click();
  await page.waitForFunction(id=>[...document.querySelectorAll(`#${id} .equipment-card-art img`)].every(i=>i.complete&&i.naturalWidth&&i.style.getPropertyValue('--visual-x')),section);
  const rows=await page.locator(`#${section} .equipment-card-icon`).evaluateAll(cards=>cards.map(card=>{
   const img=card.querySelector('.equipment-card-art img'),art=card.querySelector('.equipment-card-art'),stars=card.querySelector('.equipment-card-stars');
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const p=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let l=canvas.width,t=canvas.height,r=-1,b=-1;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(p[(y*canvas.width+x)*4+3]>8){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
   const a=art.getBoundingClientRect(),i=img.getBoundingClientRect(),scale=Math.min(i.width/canvas.width,i.height/canvas.height);
   return {id:card.parentElement.dataset.equipId,display:getComputedStyle(art).display,stars:getComputedStyle(stars).fontSize,dx:i.x+i.width/2+((l+r)/2-canvas.width/2)*scale-(a.x+a.width/2),dy:i.y+i.height/2+((t+b)/2-canvas.height/2)*scale-(a.y+a.height/2)};
  }));
  for(const row of rows){assert.equal(row.display,'grid',JSON.stringify(row));assert.equal(row.stars,'9px',JSON.stringify(row));assert.ok(Math.abs(row.dx)<.6&&Math.abs(row.dy)<.6,JSON.stringify(row));}
  console.log(tab,rows.length,'artworks centered within 0.6px');
 }
 await page.locator('#christmas-equipment-gacha-collection').scrollIntoViewIfNeeded();
 await page.locator('#christmas-equipment-gacha-collection .equipment-gacha-preview').first().screenshot({path:out+'/star-sword.png'});
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
