// Hand-drawn frame animation. Owned by the question, never stored in a save.
import iceSheetUrl from './assets/effects/ice-breath-v3.png';
const FRAME_COUNT = 32;
const COLUMNS = 8;
const FRAME_SECONDS = .04;
const sheet = new Image();
sheet.src = iceSheetUrl;
export function playIceBreath(source, target) {
  document.querySelectorAll('.ice-breath-canvas').forEach(el => el.remove());
  if (!source || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const canvas = document.createElement('canvas');
  canvas.className = 'ice-breath-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:10000';
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  let frame, start;
  const stop = () => { cancelAnimationFrame(frame); canvas.remove(); };
  function draw(now) {
    if (!target.isConnected || !source.isConnected || !canvas.isConnected || target.closest('.hidden') || target.closest('.screen')?.classList.contains('active') === false) { stop(); return; }
    if (!sheet.complete || !sheet.naturalWidth) {
      if (sheet.complete) { stop(); return; }
      frame = requestAnimationFrame(draw); return;
    }
    start ??= now;
    const time = (now - start) / 1000;
    if (time >= FRAME_COUNT * FRAME_SECONDS) { stop(); return; }
    const w = innerWidth, h = innerHeight, ratio = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
    const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
    const sx = a.left + a.width * .5, sy = a.top + a.height * .5;
    const tx = b.left + b.width * .5, ty = b.top + b.height * .5;
    const travel = Math.min(1, time / .5);
    const cx = sx + (tx - sx) * travel * .6;
    const cy = sy + (ty - sy) * travel * .6;
    const size = Math.min(w * .95, 680, h * .76);
    const index = Math.min(FRAME_COUNT - 1, Math.floor((time + 1e-7) / FRAME_SECONDS));
    const cw = sheet.naturalWidth / COLUMNS, ch = sheet.naturalHeight / (FRAME_COUNT / COLUMNS);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // Exclude the thin atlas gutters from the sampled frame.
    const inset = Math.max(2, Math.ceil(cw * .014));
    ctx.drawImage(sheet, index % COLUMNS * cw + inset, Math.floor(index / COLUMNS) * ch + inset, cw - inset * 2, ch - inset * 2,
      cx - size / 2, cy - size * .43, size, size * .86);
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return stop;
}
