// Do not rewrite an IME's provisional value or submit on its commit Enter.
const bindings=new WeakMap();
export function bindInputComposition(input,onCommit=()=>{}){
 bindings.get(input)?.();
 let composing=false,pending=false,timer=0,committedAt=-Infinity;
 const start=()=>{clearTimeout(timer);composing=true;pending=false;};
 const end=()=>{composing=false;pending=true;committedAt=Date.now();clearTimeout(timer);timer=setTimeout(()=>{pending=false;onCommit();},0);};
 input.addEventListener('compositionstart',start);input.addEventListener('compositionend',end);
 const cleanup=()=>{clearTimeout(timer);input.removeEventListener('compositionstart',start);input.removeEventListener('compositionend',end);bindings.delete(input);};
 bindings.set(input,cleanup);
 const blocked=event=>composing||pending||!!event?.isComposing||event?.keyCode===229;
 return {blocked,submissionBlocked:event=>blocked(event)||Date.now()-committedAt<80,cleanup};
}
