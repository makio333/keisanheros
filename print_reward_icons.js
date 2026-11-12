const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const potion=new URL('./assets/items/potion.png',import.meta.url).href;
const hipotion=new URL('./assets/items/hipotion.png',import.meta.url).href;
const seed=new URL('./assets/items/cost_seed_pixel.png',import.meta.url).href;
const ancient=new URL('./assets/items/ancient_dual_swords_v1.png',import.meta.url).href;
export const questPrintRewards=({gold,exp,medals,medalPerQuestion=false})=>[{icon:'💰',label:`${gold}G`},{icon:'✨',label:`${exp}EXP`},{icon:'🏅',label:medalPerQuestion?`1問正解 メダル${medals}枚`:`メダル${medals}枚`}];
export function standardPrintRewards({count=20,ancientReward=false}={}){
 const entries=[{icon:'🏅',label:'1問正解 メダル1枚'},{icon:'✨',label:'1問20EXP'},{icon:'💰',label:'1問10G'},{image:potion,label:`傷薬×1（${Math.ceil(count*.5)}問以上）`},{image:hipotion,label:`秘薬×3 または エーテル×1（${Math.ceil(count*.8)}問以上）`},{image:seed,label:'たね×1（全問正解）'},{icon:'💰',label:'500G（全問正解）'}];
 if(ancientReward)entries.push({image:ancient,label:`古代装備×1（${Math.ceil(count*.8)}問以上）`});return entries;
}
export function renderPrintRewardIcons(entries=[]){
 return `<span class="print-reward-icons" style="display:inline-flex;flex-wrap:wrap;gap:1mm 3mm;vertical-align:middle;font:8pt/1.4 sans-serif">${entries.map(e=>`<span class="print-reward-icon-entry" style="display:inline-flex;align-items:center;gap:1mm;break-inside:avoid"><span aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:7mm;height:7mm;aspect-ratio:1;flex:0 0 7mm;padding:.6mm;border:1px solid #555;border-radius:0;overflow:hidden;font-size:13pt;line-height:1">${e.image?`<img src="${esc(e.image)}" alt="" style="width:100%;height:100%;object-fit:contain">`:esc(e.icon)}</span><span>${esc(e.label)}</span></span>`).join('')}</span>`;
}
