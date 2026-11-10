/** Visual-only intro. No game state, storage or network API access. */
export function createRaidBossIntro({ mount = document.body } = {}) {
  let active = null;
  return {
    play(snapshot, { signal, onComplete } = {}) {
      if (active) return active.promise; // Repeated start joins the same presentation.
      if (signal?.aborted) return Promise.resolve({ status: 'cancelled' });
      const data = { ...snapshot };
      const number = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.floor(Number(value)).toLocaleString('ja-JP') : '—';
      const host = document.createElement('div');
      host.dataset.raidBossIntro = '';
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>
:host{position:fixed;inset:0;z-index:2147483000;color:#fff;font-family:system-ui,sans-serif;isolation:isolate}
*{box-sizing:border-box} .stage{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 58% 32%,#26575e 0,#101c32 48%,#050911 100%)}
.stage:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(160deg,transparent 0 70px,#9bf5ee0b 71px 72px);pointer-events:none}
.art{position:absolute;height:110%;width:100%;object-fit:contain;object-position:50% 25%;top:0;transform-origin:50% 0%;filter:drop-shadow(0 0 35px #74e9dd66);animation:arrive 4.6s ease-out both}
.fallback{position:absolute;top:20%;width:100%;text-align:center;font-size:90px;color:#a1e9e0}.fallback[hidden]{display:none}
.wisps{position:absolute;inset:0;pointer-events:none}.wisp{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:calc(var(--s)*1.5);border-radius:75% 25% 65% 45%;background:radial-gradient(ellipse at 48% 68%,#eefff9 0 12%,#a5fff0 26%,#4bbfc9aa 55%,#346cb500 76%);filter:drop-shadow(0 0 12px #8afbe5aa);opacity:.8;animation:float-wisp var(--t) ease-in-out var(--d) infinite alternate}.wisp:after{content:'';position:absolute;left:32%;top:-29%;width:45%;height:70%;border-radius:90% 0 90% 10%;background:linear-gradient(0deg,#9effe8aa,transparent);transform:rotate(18deg)}@keyframes float-wisp{from{transform:translate(0,8px) rotate(-9deg)}to{transform:translate(9px,-14px) rotate(10deg)}}
.veil{position:absolute;inset:0;background:linear-gradient(0deg,#050a16 1%,transparent 85%)}
.top{position:absolute;top:max(24px,env(safe-area-inset-top));left:7%;font-size:14px;letter-spacing:.35em;color:#a9f2e8}
.band{position:absolute;left:-5%;bottom:13%;width:110%;padding:22px max(10%,30px);background:linear-gradient(100deg,#102c47f5,#123546ee 70%,#236672c9);border-top:2px solid #8be9dc;border-bottom:1px solid #679aa6;transform:rotate(-5deg);animation:cut .18s cubic-bezier(.16,1,.3,1) .55s both,band-settle .3s ease-out .73s both}
.copy{transform:rotate(5deg)}.subtitle{font-size:12px;letter-spacing:.24em;color:#b6e6e2}h1{font-size:clamp(28px,5.5vw,68px);margin:6px 0 16px;line-height:1.18;overflow-wrap:anywhere;text-shadow:0 3px 12px #000}
.stats{display:flex;gap:12px 28px;flex-wrap:wrap;font-weight:750;font-size:clamp(16px,2.4vw,24px)}.hp{font-variant-numeric:tabular-nums}.label{font-size:12px;color:#bfe5e7;margin-right:8px}.meter{height:5px;background:#06101c;margin-top:12px;max-width:600px}.fill{height:100%;background:linear-gradient(90deg,#73a7ee,#98f3d1)}
button{position:absolute;right:max(20px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));border:1px solid #a4c8d1;border-radius:30px;background:#102336;color:white;padding:12px 22px;font:inherit;cursor:pointer}button:focus-visible{outline:3px solid #fff;outline-offset:3px}
@keyframes arrive{from{transform:scale(1.5)}to{transform:scale(1.05)}}@keyframes cut{from{translate:-160vw 0}to{translate:0 0}}@keyframes band-settle{0%,100%{transform:rotate(-5deg)}20%{transform:translate(3px,-2px) rotate(-5.5deg)}45%{transform:translate(-2px,1px) rotate(-4.6deg)}70%{transform:translate(1px,-1px) rotate(-5.2deg)}}
@media(max-width:600px){.art{height:83%;top:0;width:145%;left:-22.5%}.band{bottom:17%;padding:20px 10%}h1{font-size:clamp(26px,8vw,44px)}.stats{gap:10px}.top{font-size:11px}.hp{width:100%}}
@media(max-height:450px){.band{bottom:16%;padding-top:10px;padding-bottom:10px;left:22%;width:83%}.art{width:65%;left:-13%;height:120%;top:0}h1{font-size:30px;margin:3px 0 8px}.stats{font-size:16px}.top{top:14px}.meter{margin-top:6px}button{padding:7px 18px;bottom:8px}}
@media(prefers-reduced-motion:reduce){.art,.band,.wisp{animation:none}.art{transform:scale(1.05)}}
</style><div class="stage" role="dialog" aria-modal="true" aria-label="レイドボス登場"><div class="fallback" hidden>♛</div><img class="art" alt=""><div class="wisps" aria-hidden="true"><i class="wisp" style="--x:9%;--y:23%;--s:24px;--t:3.8s;--d:-1s"></i><i class="wisp" style="--x:83%;--y:19%;--s:30px;--t:4.2s;--d:-2s"></i><i class="wisp" style="--x:17%;--y:45%;--s:18px;--t:3.5s;--d:-0.5s"></i><i class="wisp" style="--x:88%;--y:43%;--s:22px;--t:4.5s;--d:-3s"></i><i class="wisp" style="--x:5%;--y:55%;--s:14px;--t:4s;--d:-2.5s"></i><i class="wisp" style="--x:75%;--y:51%;--s:15px;--t:3.7s;--d:-1.7s"></i></div><div class="veil"></div><div class="top">RAID BOSS ENCOUNTER</div><div class="band"><div class="copy"><div class="subtitle">レイドボス</div><h1></h1><div class="stats"><span class="level"></span><span class="hp"></span></div><div class="meter" role="img"><div class="fill"></div></div></div></div><button type="button">戦闘へ進む ›</button></div>`;
      shadow.querySelector('h1').textContent = String(data.name || 'レイドボス');
      shadow.querySelector('.level').textContent = `Lv. ${number(data.level)}`;
      shadow.querySelector('.hp').textContent = `残りHP ${number(data.hp)}${data.maxHp == null ? '' : ` / ${number(data.maxHp)}`}`;
      const ratio = Number(data.maxHp) > 0 ? Math.max(0, Math.min(1, Number(data.hp) / Number(data.maxHp))) : 0;
      shadow.querySelector('.fill').style.width = `${ratio * 100}%`;
      shadow.querySelector('.meter').ariaLabel = `残りHP ${number(data.hp)}`;
      const image = shadow.querySelector('img');
      image.onerror = () => { image.hidden = true; shadow.querySelector('.fallback').hidden = false; };
      image.src = String(data.image || '');
      const previousFocus = document.activeElement;
      let resolve, timer, observer;
      const promise = new Promise(r => { resolve = r; });
      const finish = status => {
        if (active?.host !== host) return;
        clearTimeout(timer); observer?.disconnect();
        signal?.removeEventListener('abort', cancel);
        window.removeEventListener('pagehide', cancel);
        document.removeEventListener('visibilitychange', visibility);
        host.remove(); active = null;
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        resolve({ status });
        if (status === 'completed' || status === 'skipped') onComplete?.({ status });
      };
      const cancel = () => finish('cancelled');
      const visibility = () => { if (document.hidden) cancel(); };
      active = { host, promise, cancel };
      mount.append(host);
      observer = new MutationObserver(() => { if (!host.isConnected) cancel(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      signal?.addEventListener('abort', cancel, { once: true });
      window.addEventListener('pagehide', cancel, { once: true });
      document.addEventListener('visibilitychange', visibility);
      shadow.querySelector('button').onclick = () => finish('skipped');
      shadow.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); shadow.querySelector('button').focus(); } if(e.key === 'Escape') cancel(); });
      shadow.querySelector('button').focus({ preventScroll: true });
      timer = setTimeout(() => finish('completed'), 4600);
      return promise;
    },
    cancel() { active?.cancel(); },
    get playing() { return !!active; }
  };
}
