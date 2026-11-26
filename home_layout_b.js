import './home_layout_b.css';
function initializeHomeLayout(){
 const home=document.getElementById('screen-home'),map=document.getElementById('town-map');if(!home||!map)return;
 home.classList.add('home-layout-b');
 const nav=document.createElement('nav');nav.className='home-main-nav';nav.setAttribute('aria-label','拠点の施設');
 const shortcuts=document.createElement('nav');shortcuts.className='home-shortcuts';shortcuts.setAttribute('aria-label','イベントとレイド');
 const resources=document.createElement('div');resources.className='home-resource-row';
 for(const id of ['home-equip-icons','home-tickets'])resources.append(document.getElementById(id));
 const more=document.createElement('button');more.type='button';more.className='home-more-button';more.id='btn-home-more';more.setAttribute('aria-haspopup','dialog');more.setAttribute('aria-expanded','false');more.innerHTML='<span aria-hidden="true">•••</span><span>その他</span>';
 const overlay=document.createElement('div');overlay.className='home-more-overlay';overlay.hidden=true;
 overlay.innerHTML='<section class="home-more-panel" role="dialog" aria-modal="true" aria-labelledby="home-more-title"><header><h2 id="home-more-title">その他の施設</h2><button type="button" data-close aria-label="その他を閉じる">×</button></header><div class="home-more-grid"></div></section>';
 const grid=overlay.querySelector('.home-more-grid'),close=overlay.querySelector('[data-close]');
 function dismiss(){overlay.hidden=true;more.setAttribute('aria-expanded','false');if(home.classList.contains('active'))more.focus({preventScroll:true});}
 more.onclick=()=>{overlay.hidden=false;more.setAttribute('aria-expanded','true');close.focus({preventScroll:true});};close.onclick=dismiss;
 overlay.onclick=event=>{if(event.target===overlay)dismiss();};grid.onclick=event=>{if(event.target.closest('button'))dismiss();};
 overlay.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();dismiss();}if(event.key==='Tab'){const buttons=[...overlay.querySelectorAll('button')];const i=buttons.indexOf(document.activeElement);event.preventDefault();buttons[(i+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}};
 const mobile=matchMedia('(max-width: 699px) and (orientation: portrait)');
 function arrange(){
  if(!overlay.hidden)dismiss();
  home.classList.add('home-layout-b');
  nav.hidden=!mobile.matches;shortcuts.hidden=!mobile.matches;resources.hidden=false;
  for(const id of ['home-equip-icons','home-tickets'])resources.append(document.getElementById(id));
  if(!mobile.matches){
   for(const id of ['hotspot-status','hotspot-item-shop','hotspot-weapon-shop','hotspot-gacha','hotspot-synthesis','hotspot-quest-board','hotspot-training','hotspot-christmas','hotspot-halloween','hotspot-raid-boss'])map.append(document.getElementById(id));
   return;
  }
  for(const id of ['home-equip-icons','home-tickets'])resources.append(document.getElementById(id));
  for(const id of ['hotspot-status','hotspot-item-shop','hotspot-weapon-shop','hotspot-gacha','hotspot-synthesis','hotspot-quest-board'])nav.append(document.getElementById(id));
  nav.append(more);
  for(const id of ['hotspot-training','hotspot-christmas','hotspot-halloween','hotspot-raid-boss'])shortcuts.append(document.getElementById(id));
  if(mobile.matches)for(const id of ['hotspot-item-shop','hotspot-weapon-shop','hotspot-synthesis','hotspot-training'])grid.append(document.getElementById(id));
 }
 map.append(nav,shortcuts,resources);document.body.append(overlay);mobile.addEventListener('change',arrange);arrange();const santa=document.querySelector('#hotspot-christmas .hotspot-tag>span');if(santa)santa.textContent='サンタの村';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeHomeLayout,{once:true});else initializeHomeLayout();
