/** Display only: never changes combat state. Explicitly destroy on battle/screen exit. */
export function createDamageFloatQueueV2({ mount = document.body, signal, manual = false } = {}) {
  const doc = mount.ownerDocument, win = doc.defaultView;
  const root = doc.createElement('div'); root.className = 'dfq-v2'; root.setAttribute('aria-hidden', 'true'); mount.append(root);
  const lanes = new Map(); let time = 0, last = performance.now(), frame, dead = false, sequence = 0;
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const INTERVAL = 120, LIFE = 1450, MAX_LANES = 8, MAX_PENDING = 64, MAX_VISIBLE = 5;
  function removeLane(target, lane) { lane.visible.forEach(v => v.el.remove()); lanes.delete(target); }
  function layout() {
    const occupied = [], width = win.innerWidth, height = win.innerHeight;
    for (const [target, lane] of lanes) {
      const r = target.getBoundingClientRect();
      const x = Math.max(8, Math.min(width - lane.width - 8, r.left + r.width / 2 - lane.width / 2));
      let bottom = Math.max(52, Math.min(height - 8, r.top + r.height / 2));
      for (const item of [...lane.visible].reverse()) {
        let y = bottom - item.height;
        for (let tries = 0; tries < 40; tries++) {
          const collision = occupied.find(o => x < o.x + o.w + 6 && x + lane.width + 6 > o.x && y < o.y + o.h + 6 && y + item.height + 6 > o.y);
          if (!collision) break;
          y = collision.y - item.height - 8;
        }
        if (y < 8) { y = 8; while (y + item.height <= height - 8 && occupied.some(o => x < o.x + o.w + 6 && x + lane.width + 6 > o.x && y < o.y + o.h + 6 && y + item.height + 6 > o.y)) y++; }
        if (y + item.height > height - 8) { item.el.remove(); lane.visible = lane.visible.filter(v => v !== item); continue; }
        item.el.style.left = `${x}px`; item.el.style.top = `${y}px`;
        item.el.style.opacity = time - item.at > LIFE - 180 && !reduced.matches ? '.55' : '1';
        occupied.push({x,y,w:lane.width,h:item.height}); bottom = y - 8;
      }
    }
  }
  function show(lane, item) {
    const el = doc.createElement('div'); el.className = 'dfq-v2-number';
    const classes = item.type.split(/\s+/); el.dataset.kind = classes.includes('heal') || classes.includes('mana') || /^\+/.test(item.text) ? 'heal' : classes.includes('player-dmg') ? 'player' : 'enemy';
    el.classList.toggle('dfq-v2-critical', classes.includes('crit')); el.dataset.sequence = String(item.id); el.textContent = item.text;
    el.style.width = `${lane.width}px`; root.append(el);
    // Fit the full value without abbreviation, including very large fixture values.
    let size = classes.includes('crit') ? 32 : 28; el.style.fontSize = `${size}px`;
    while (el.scrollWidth > lane.width && size > 8) el.style.fontSize = `${--size}px`;
    if (el.scrollWidth > lane.width) { el.style.whiteSpace = 'normal'; el.style.overflowWrap = 'anywhere'; }
    lane.visible.push({...item, el, at:time, height:Math.ceil(el.getBoundingClientRect().height)});
    while (lane.visible.length > MAX_VISIBLE) lane.visible.shift().el.remove();
    lane.last = time;
  }
  function tick(ms) {
    if (dead) return; time += Math.max(0, Math.min(Number(ms) || 0, 60000));
    for (const [target, lane] of lanes) {
      if (!target.isConnected) { removeLane(target,lane); continue; }
      lane.visible = lane.visible.filter(v => { if (time-v.at >= LIFE) {v.el.remove(); return false;} return true; });
      if (lane.pending.length && time-lane.last >= INTERVAL) show(lane,lane.pending.shift());
      if (!lane.visible.length && !lane.pending.length) lanes.delete(target);
    }
    layout();
  }
  function enqueue(target, value, type = 'enemy-dmg') {
    if (dead || !target?.isConnected || doc.hidden || value == null) return false;
    type = String(type);
    let text = String(value).slice(0,256); if (type.includes('player-dmg') && !/^[−\-+]/.test(text)) text = `−${text}`;
    let lane = lanes.get(target);
    if (!lane) { if (lanes.size >= MAX_LANES) return false; lane = {pending:[],visible:[],last:-Infinity,width:Math.min(220,win.innerWidth-16)}; lanes.set(target,lane); }
    if (lane.pending.length >= MAX_PENDING) return false;
    const item = {text,type:String(type),id:++sequence};
    if (!lane.pending.length && time-lane.last >= INTERVAL) show(lane,item); else lane.pending.push(item);
    layout(); return true;
  }
  function clear() { for (const [target,lane] of lanes) removeLane(target,lane); }
  function hidden() { if (doc.hidden) clear(); }
  function destroy() { if (dead) return; dead = true; clear(); win.cancelAnimationFrame(frame); root.remove(); doc.removeEventListener('visibilitychange',hidden); win.removeEventListener('pagehide',destroy); signal?.removeEventListener('abort',destroy); }
  function loop(now) { tick(now-last); last=now; if(!dead) frame=win.requestAnimationFrame(loop); }
  doc.addEventListener('visibilitychange',hidden); win.addEventListener('pagehide',destroy); signal?.addEventListener('abort',destroy,{once:true});
  if (signal?.aborted) destroy(); else if (!manual) frame=win.requestAnimationFrame(loop);
  return {enqueue,clear,destroy,advance:tick,snapshot:()=>({destroyed:dead,lanes:lanes.size,pending:[...lanes.values()].reduce((n,l)=>n+l.pending.length,0),visible:[...lanes.values()].flatMap(l=>l.visible.map(v=>({id:v.id,text:v.text,y:parseFloat(v.el.style.top)})))})};
}
