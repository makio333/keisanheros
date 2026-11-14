import './home_snow.css';
// A small fixed pool; only transform/opacity animate. No canvas or per-frame JavaScript.
const home=document.getElementById('screen-home');
if(home){
 const snow=document.createElement('div');snow.className='home-snow';snow.setAttribute('aria-hidden','true');
 for(let i=0;i<16;i++){const flake=document.createElement('i');flake.style.cssText=`--x:${(i*37)%100}%;--size:${i%3+2}px;--duration:${12+i%7}s;--delay:-${i*1.7}s;--drift:${i%2?24:-24}px`;snow.append(flake);}
 home.append(snow);
 const sync=()=>{snow.hidden=document.hidden||!home.classList.contains('active');};
 new MutationObserver(sync).observe(home,{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',sync);sync();
}
