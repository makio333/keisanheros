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
