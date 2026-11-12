import {assignQuestNotice} from './quest_notice_variants.js';
export function questBoardPageSize(cardGrid){
 const rect=cardGrid?.getBoundingClientRect();
 const style=cardGrid?getComputedStyle(cardGrid):null;
 const columns=style?.gridTemplateColumns?.split(' ').length||
  (window.matchMedia('(max-width: 640px)').matches?2:3);
 if(cardGrid&&rect?.height>0&&cardGrid.children.length){
  const paddingBottom=parseFloat(style.paddingBottom)||0;
  const usableBottom=rect.bottom-paddingBottom;
  const rows=[];
  for(const card of cardGrid.children){
   const box=card.getBoundingClientRect();
   let row=rows.find(candidate=>Math.abs(candidate.top-box.top)<8);
   if(!row){row={top:box.top,bottom:box.bottom};rows.push(row);}
   else row.bottom=Math.max(row.bottom,box.bottom);
  }
  let visibleRows=0;
  for(const row of rows.sort((a,b)=>a.top-b.top)){
   if(row.bottom<=usableBottom+1)visibleRows++;
   else break;
  }
  return columns*Math.max(1,visibleRows);
 }
 const height=rect?.height||window.visualViewport?.height||window.innerHeight||900;
 const styles=style||getComputedStyle(document.body);
 const minRowHeight=320;
 const padding=(parseFloat(styles.paddingTop)||0)+(parseFloat(styles.paddingBottom)||0);
 const rows=Math.max(1,Math.floor(Math.max(0,height-padding)/minRowHeight));
 return columns*rows;
}

export function renderQuestPageControls(nav,{page,total,pageSize,onChange}){
 const pageCount=Math.max(1,Math.ceil(total/pageSize));
 const current=Math.max(0,Math.min(page,pageCount-1));
 nav.className='quest-board-pager';
 nav.setAttribute('aria-label','クエストページ移動');
 nav.replaceChildren();
 const previous=document.createElement('button');
 previous.type='button';previous.className='btn quest-page-btn';previous.textContent='← 前へ';
 previous.setAttribute('aria-label','前のクエストページ');previous.disabled=current===0;
 previous.onclick=()=>onChange(current-1);
 const status=document.createElement('span');
 status.className='quest-page-status';status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 status.textContent=`${current+1} / ${pageCount} ページ`;
 const next=document.createElement('button');
 next.type='button';next.className='btn quest-page-btn';next.textContent='次へ →';
 next.setAttribute('aria-label','次のクエストページ');next.disabled=current>=pageCount-1;
 next.onclick=()=>onChange(current+1);
 nav.append(previous,status,next);
 return current;
}

// The fixed viewport gives this grid its real remaining space after headings and pager.
const fittedGrids=new WeakMap();
export function mountFittedQuestPages(grid,nav,cards,{page=0,onPage=()=>{},bind=()=>{}}={}){
 fittedGrids.get(grid)?.();cards.forEach((card,index)=>{card.dataset.questPageIndex=String(index);assignQuestNotice(card);});
 let current=page,size=0,frame=0,lastLayout='';
 const board=grid.closest('#screen-quest-board');
 function draw(){
  const currentPage=renderQuestPageControls(nav,{page:current,total:cards.length,pageSize:size||6,onChange:next=>{current=next;onPage(current);draw();}});
  current=currentPage;onPage(current);grid.replaceChildren(...cards.slice(current*(size||6),(current+1)*(size||6)));bind(grid);
 }
 function fit(){
  frame=0;if(!grid.isConnected)return cleanup();
  if(!board){size=6;draw();return;}
  const rect=grid.getBoundingClientRect(),style=getComputedStyle(grid);const width=rect.width-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0),height=rect.height-(parseFloat(style.paddingTop)||0)-(parseFloat(style.paddingBottom)||0);if(width<1||height<1)return;
  const gap=10,minWidth=width<320?126:width<600?142:172;
  const columns=Math.max(1,Math.min(8,Math.floor((width+gap)/(minWidth+gap))));
  const rows=Math.max(1,Math.floor((height+gap)/190));
  const cardHeight=Math.floor((height-(rows-1)*gap)/rows);
  const layout=`${columns}/${rows}/${cardHeight}/${Math.floor(width)}`;
  if(layout===lastLayout)return;lastLayout=layout;
  const first=current*(size||columns*rows);size=columns*rows;current=Math.floor(first/size);
  grid.style.setProperty('--quest-columns',columns);grid.style.setProperty('--quest-rows',rows);
  grid.classList.toggle('is-compact',cardHeight<220);grid.classList.toggle('is-short',cardHeight<230);grid.classList.toggle('has-fold-room',cardHeight>=174);
  grid.dataset.pageCapacity=String(size);draw();
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);}
 const observer=new ResizeObserver(schedule);
 function cleanup(){cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);}
 fittedGrids.set(grid,cleanup);grid.classList.add('quest-fitted-grid');nav.classList.add('quest-fitted-pager');
 // Reserve pager height before measuring so adding it cannot push cards off-screen.
 renderQuestPageControls(nav,{page:0,total:cards.length,pageSize:1,onChange:()=>{}});
 observer.observe(grid);window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);fit();schedule();
 return cleanup;
}
