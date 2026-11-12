// Fit the active Christmas adventure into the visible viewport, including browser side panels.
let pendingFrame=0;
let preferredBoardScale=null;
let preferredBoardPosition=null;
function fitAdventure(){
  pendingFrame=0;
  const screen=document.querySelector('#screen-battle.active.christmas-battle-screen');
  if(!screen)return;
  const stack=screen.querySelector('#christmas-answer-stack'),board=screen.querySelector('#kanji-challenge');
  if(!stack || !board)return;
  const viewport=window.visualViewport;
  const width=Math.floor(viewport?.width || innerWidth),height=Math.floor(viewport?.height || innerHeight);
  const wide=width>=700 && width>height*1.12;
  screen.dataset.adventureFit=wide?'wide':'stacked';
  const set=(name,value)=>screen.style.setProperty(name,String(value));
  set('--fit-width',width+'px');set('--fit-height',height+'px');
  // Reserve the fixed controls and one line of battle feedback.
  const top=wide?78:88,bottom=22,gap=6,available=Math.max(100,height-top-bottom-gap*2);
  const hasBoard=!board.classList.contains('hidden')&&!board.querySelector('#software-keyboard')?.classList.contains('hidden');
  const minimized=!!board.querySelector('.is-minimized');
  const boardWidth=minimized?168:264;set('--fit-board-width',boardWidth+'px');
  const boardHeight=Math.max(1,board.offsetHeight);
  const boardBudget=wide?available:available*.40;
  const maxBoardScale=Math.min(1.6,(width-24)/boardWidth,(wide?available:available*.52)/boardHeight);
  const boardScale=minimized?Math.min(1,(width-16)/boardWidth):Math.min(maxBoardScale,preferredBoardScale??Math.min(1,boardBudget/boardHeight));
  const visibleBoardWidth=hasBoard?boardWidth*boardScale:0;
  const visibleBoardHeight=hasBoard?boardHeight*boardScale:0;
  const answerBudget=wide?available*.51:available*(hasBoard && !minimized ? .35 : .66);
  let answerScale=1,answerWidth=560,answerHeight=1;
  const physicalWidth=wide?Math.min(560,Math.max(160,width-2*(visibleBoardWidth+26))):Math.min(560,width-16);
  // Wrapping may change the panel height; converge using the actual rendered content.
  for(let pass=0;pass<3;pass++){
    answerWidth=Math.min(560,physicalWidth/Math.max(.1,answerScale));
    set('--fit-answer-width',answerWidth+'px');
    answerHeight=Math.max(1,stack.offsetHeight);
    answerScale=Math.min(1,answerBudget/answerHeight,physicalWidth/answerWidth);
  }
  const visibleAnswerHeight=answerHeight*answerScale;
  const boardTop=wide?Math.max(top,(height-visibleBoardHeight)/2):height-bottom-visibleBoardHeight;
  const answerTop=wide?height-bottom-visibleAnswerHeight:height-bottom-visibleBoardHeight-(hasBoard?gap:0)-visibleAnswerHeight;
  const fieldHeight=Math.max(12,answerTop-top-gap);
  set('--fit-answer-scale',answerScale.toFixed(5));set('--fit-answer-top',answerTop+'px');
  const boardLeft=wide?width-12-visibleBoardWidth:(width-visibleBoardWidth)/2;
  const clamp=(value,max,min=6)=>Math.max(min,Math.min(Math.max(min,max),value));
  set('--fit-board-scale',boardScale.toFixed(5));
  set('--fit-board-top',clamp(preferredBoardPosition?.y??boardTop,height-visibleBoardHeight-6,top)+'px');
  set('--fit-board-left',clamp(preferredBoardPosition?.x??boardLeft,width-visibleBoardWidth-6)+'px');
  set('--fit-field-top',top+'px');set('--fit-field-height',fieldHeight+'px');
  set('--fit-enemy-image',Math.max(20,Math.min(220,fieldHeight-60))+'px');
  set('--fit-enemy-font',Math.max(9,Math.min(16,fieldHeight/10))+'px');
}
function scheduleFit(){if(!pendingFrame)pendingFrame=requestAnimationFrame(fitAdventure);}
function observeAdventure(){
 const screen=document.getElementById('screen-battle');if(!screen)return;
 let drag=null;
 screen.addEventListener('pointerdown',event=>{
   const resize=event.target.closest('.kana-resize-handle');
   const header=event.target.closest('.kana-board-header');
   const handle=resize || (header && !event.target.closest('button')?header:null);
   if(!handle || event.button!==0)return;
   const board=screen.querySelector('#kanji-challenge'),rect=board.getBoundingClientRect();
   drag={id:event.pointerId,handle,mode:resize?'resize':'move',left:rect.left,top:rect.top,x:event.clientX,y:event.clientY,w:rect.width,h:rect.height,scale:rect.width/board.offsetWidth,sx:handle.dataset.corner?.endsWith('e')?1:-1,sy:handle.dataset.corner?.startsWith('s')?1:-1};
   handle.setPointerCapture(event.pointerId);screen.classList.add('kana-resizing');event.preventDefault();
 });
 screen.addEventListener('pointermove',event=>{
   if(!drag || drag.id!==event.pointerId)return;
   if(drag.mode==='move'){preferredBoardPosition={x:drag.left+event.clientX-drag.x,y:drag.top+event.clientY-drag.y};scheduleFit();event.preventDefault();return;}
   const delta=((event.clientX-drag.x)*drag.sx*drag.w+(event.clientY-drag.y)*drag.sy*drag.h)/(drag.w**2+drag.h**2);
   preferredBoardScale=Math.max(.2,drag.scale*(1+delta));scheduleFit();event.preventDefault();
 });
 const endDrag=event=>{if(drag?.id!==event.pointerId)return;if(drag.mode==='resize')preferredBoardScale=parseFloat(screen.style.getPropertyValue('--fit-board-scale'));else preferredBoardPosition={x:parseFloat(screen.style.getPropertyValue('--fit-board-left')),y:parseFloat(screen.style.getPropertyValue('--fit-board-top'))};drag=null;screen.classList.remove('kana-resizing');};
 screen.addEventListener('pointerup',endDrag);screen.addEventListener('pointercancel',endDrag);screen.addEventListener('lostpointercapture',endDrag);
 screen.addEventListener('dblclick',event=>{if(event.target.closest('.kana-board-header')&&!event.target.closest('button')){preferredBoardPosition=null;scheduleFit();}if(event.target.closest('.kana-resize-handle')){preferredBoardScale=null;scheduleFit();}});
 screen.addEventListener('keydown',event=>{
   if(!event.target.closest('.kana-resize-handle') || !['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home'].includes(event.key))return;
   preferredBoardScale=event.key==='Home'?null:Math.max(.2,parseFloat(screen.style.getPropertyValue('--fit-board-scale'))+(['ArrowUp','ArrowRight'].includes(event.key)?.05:-.05));event.preventDefault();scheduleFit();
 });
 new MutationObserver(scheduleFit).observe(screen,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-kana-page']});
 new ResizeObserver(scheduleFit).observe(document.documentElement);
 window.addEventListener('resize',scheduleFit);
 window.visualViewport?.addEventListener('resize',scheduleFit);
 document.fonts?.ready.then(scheduleFit);
 scheduleFit();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeAdventure,{once:true});else observeAdventure();
