
function skillPower(s){
  if (s.dmgMult) return s.dmgMult;
  if (s.healPct) return 1 + s.healPct * 4;
  return 1;
}
function skillTimeMult(s){ return 1.0; }
function skillTimePenaltyLabel(s){ return ''; }
'use strict';

/* ==========================================================
   安全なローカルストレージラッパー (iPad file:// 環境対応)
   ========================================================== */
const _fallbackMemStore = new Map();
function storageGet(k) {
  try { if (typeof localStorage !== 'undefined') return localStorage.getItem(k); } catch (e) {}
  return _fallbackMemStore.get(k) || null;
}
function storageSet(k, v) {
  try { if (typeof localStorage !== 'undefined') { localStorage.setItem(k, v); return; } } catch (e) {}
  _fallbackMemStore.set(k, String(v));
}
function storageRemove(k) {
  try { if (typeof localStorage !== 'undefined') { localStorage.removeItem(k); return; } } catch (e) {}
  _fallbackMemStore.delete(k);
}
function storageLen() {
  try { if (typeof localStorage !== 'undefined') return localStorage.length; } catch (e) {}
  return _fallbackMemStore.size;
}
function storageK(i) {
  try { if (typeof localStorage !== 'undefined') return localStorage.key(i); } catch (e) {}
  return Array.from(_fallbackMemStore.keys())[i] || null;
}

/* ==========================================================
   ユーティリティ
   ========================================================== */
function rnd(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function $(id){ return document.getElementById(id); }

/* 画像アセットの キャッシュたいさく。ブラウザが 古い画像を キャッシュしつづけて
   さしかえた あとの絵に ならない もんだいを ふせぐため、パスの うしろに ?v= を つける。
   画像を さしかえた ときは この番号を あげる（game.js/style.css の ?v= と おなじ考えかた） */
const ASSET_V = 1;
function av(path){
  if (!path) return path;
  if (path.startsWith('http') || path.startsWith('data:')) return path; // 外部URL・data URIは そのまま
  if (typeof window !== 'undefined' && window.__ASSET_MAP__) {
    const pure = path.split('?')[0];
    const resolved = window.__ASSET_MAP__[pure] ||
                     window.__ASSET_MAP__[decodeURI(pure)] ||
                     window.__ASSET_MAP__[encodeURI(pure)] ||
                     window.__ASSET_MAP__['./' + pure] ||
                     window.__ASSET_MAP__['./' + decodeURI(pure)] ||
                     window.__ASSET_MAP__['./' + encodeURI(pure)];
    if (resolved) return resolved;
  }
  return path + (path.includes('?') ? '&' : '?') + 'v=' + ASSET_V;
}

/* ==========================================================
   サウンド管理 (Web Audio API)
   ========================================================== */
class SoundManager {
  constructor() {
    this.beepCtx = null;
    this.initialized = false;
    this.audios = {}; 
    this.bgmKey = null;
    this.muted = false;
    this.globalVolume = 0.7; // マスター音量 (0.0〜1.0)
    
    this.audioFiles = {
      bgm_title: 'assets_audio/bgm_title.m4a',
      bgm_home: 'assets_audio/bgm_home.m4a',
      bgm_room: 'assets_audio/bgm_room.m4a',
      bgm_stage1: 'assets_audio/bgm_stage1.m4a',
      bgm_training: 'assets_audio/bgm_training.m4a',
      se_crit: 'assets_audio/se_crit.mp3',
      se_clear: 'assets_audio/se_clear.mp3',
      se_type: 'assets_audio/se_type.mp3',
      se_slash: 'assets_audio/se_slash.mp3',
      se_decide: 'assets_audio/se_decide.mp3',
      se_gameover: 'assets_audio/se_gameover.m4a',
      se_gacha_result: 'assets_audio/se_gacha_result.mp3',
      se_gacha_result2: 'assets_audio/se_gacha_result2.mp3',
    };
  }
  
  setGlobalVolume(vol) {
    this.globalVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmKey && this.audios[this.bgmKey]) {
      const a = this.audios[this.bgmKey];
      if (this.bgmKey === 'bgm_home') {
        a.volume = 0.15 * this.globalVolume;
      } else {
        a.volume = 0.4 * this.globalVolume;
      }
    }
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    for (const [key, path] of Object.entries(this.audioFiles)) {
      const src = av(path);
      const audio = new Audio(src.startsWith('data:') ? src : encodeURI(src));
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        console.warn('Failed to load audio:', path);
      });
      this.audios[key] = audio;
    }

    if ($('screen-home').classList.contains('active') || $('screen-title').classList.contains('active')) {
      this.playBGM('bgm_home');
    }
  }

  resumeContext() {
    if (this.beepCtx && this.beepCtx.state === 'suspended') {
      this.beepCtx.resume();
    }
  }
  
  play(key) {
    if (this.muted) return;
    const base = this.audios[key];
    if (!base) {
      if (key === 'se_type' || key === 'se_decide') this.playBeep('type');
      if (key === 'se_slash') this.playBeep('hit');
      if (key === 'se_crit') this.playBeep('hit');
      return;
    }
    const node = base.cloneNode(true);
    node.volume = this.globalVolume;
    node.play().catch(() => {
      if (key === 'se_type' || key === 'se_decide') this.playBeep('type');
      if (key === 'se_slash') this.playBeep('hit');
      if (key === 'se_crit') this.playBeep('hit');
    });
  }

  playBGM(key) {
    if (this.muted) {
      this.bgmKey = key;
      return;
    }
    if (this.bgmKey === key) return;
    this.stopBGM();
    const audio = this.audios[key];
    if (!audio) return;
    audio.loop = true;
    
    if (key === 'bgm_home') {
      audio.volume = 0.15 * this.globalVolume;
    } else {
      audio.volume = 0.4 * this.globalVolume;
    }
    
    audio.currentTime = 0;
    audio.play().catch(e => console.warn('BGM playback blocked:', e));
    this.bgmKey = key;
  }

  stopBGM() {
    if (this.bgmKey && this.audios[this.bgmKey]) {
      const a = this.audios[this.bgmKey];
      a.pause();
      a.currentTime = 0;
    }
    this.bgmKey = null;
  }
  
  playBeep(type = 'type') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!this.beepCtx && AudioContext) this.beepCtx = new AudioContext();
    if (!this.beepCtx) return;
    this.resumeContext();

    const osc = this.beepCtx.createOscillator();
    const gain = this.beepCtx.createGain();

    osc.connect(gain);
    gain.connect(this.beepCtx.destination);

    const now = this.beepCtx.currentTime;
    const volBase = this.globalVolume * 0.5; // ビープ音はうるさいのでベースを下げる
    
    if (type === 'type') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.3 * volBase, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * volBase, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'hit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.5 * volBase, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * volBase, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'damage') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0.6 * volBase, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * volBase, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'error') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.4 * volBase, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * volBase, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }
}
const SM = new SoundManager();
if (typeof window !== 'undefined') window.SM = SM;

// 最初のクリック等でAudioContextを初期化
document.addEventListener('click', (e) => {
  if (!SM.initialized) {
    SM.init();
  } else {
    SM.resumeContext();
  }
  
  // 汎用的な決定音 (非同期で初期化中でもとりあえず呼び出す。ロードされていれば鳴る)
  if (e.target.tagName === 'BUTTON' || e.target.closest('.btn')) {
    SM.play('se_decide');
  }
});
document.addEventListener('keydown', () => {
  if (!SM.initialized) SM.init();
  else SM.resumeContext();
}, { once: true });

/* ==========================================================
   描画管理 (Canvas API)
   ========================================================== */
class CanvasManager {
  constructor(canvasId = 'game-canvas') {
    this.canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.effects = [];
    this.running = false;
    this.lastTime = 0;
    this.imageLoader = new Map(); // src -> Image
  }
  
  loadImage(src) {
    if (this.imageLoader.has(src)) return this.imageLoader.get(src);
    const img = new Image();
    img.src = src;
    this.imageLoader.set(src, img);
    return img;
  }
  
  init() {
    if (this.ctx) return; // 既に初期化済み
    if (this.ctx && this.canvas && this.canvas.isConnected) return;
    this.canvas = $(this.canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    const resize = () => {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : this.canvas.getBoundingClientRect();
      const w = this.canvas.clientWidth || rect.width || 300;
      const h = this.canvas.clientHeight || rect.height || 200;
      this.canvas.width = w;
      this.canvas.height = h;
      this.width = w;
      this.height = h;
    };
    window.addEventListener('resize', resize);
    resize();
  }
  
  start() {
    this.init();
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }
  
  stop() {
    this.running = false;
  }
  
  loop(time) {
    if (!this.running) return;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    this.update(dt);
    this.draw();
    
    requestAnimationFrame((t) => this.loop(t));
  }
  
  update(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.update) e.update(dt);
      if (e.life <= 0) {
        this.effects.splice(i, 1);
      }
    }
  }
  
  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const e of this.effects) {
      if (e.draw) e.draw(this.ctx);
    }
  }
  
  addEffect(effect) {
    this.effects.push(effect);
  }
}
class SlashEffect {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.life = 0.25;
    this.maxLife = 0.25;
  }
  update(dt) {}
  draw(ctx) {
    const progress = 1 - (this.life / this.maxLife);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(200, 200, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(this.x - 60 + progress*30, this.y - 60 + progress*30);
    ctx.lineTo(this.x + 60 - progress*30, this.y + 60 - progress*30);
    ctx.stroke();
    ctx.restore();
  }
}


/* 連続斬り（れんぞくぎり / れんぞくぎりⅡ）の超美麗スプライトスラッシュエフェクト */
class RenzokuSlashEffect {
  constructor(x, y, isLevel2 = false) {
    this.x = x;
    this.y = y;
    this.isLevel2 = isLevel2;
    this.life = isLevel2 ? 0.75 : 0.55;
    this.maxLife = this.life;
    this.particles = [];
    
    // スプライト画像のロード
    this.imgArc = CM.loadImage('画像/エフェクト/slash_blue_arc.png');
    this.imgCross = CM.loadImage('画像/エフェクト/slash_cross_gold.png');

    // 多段スラッシュ定義（角度、反転、ディレイ、スケール、タイプ、パーティクル色）
    this.slashes = isLevel2 ? [
      { angle: -0.4, flipX: false, flipY: false, delay: 0.0,  scale: 1.0,  type: 'arc',   color: '#00d2d3' },
      { angle: 0.4,  flipX: true,  flipY: false, delay: 0.12, scale: 1.08, type: 'arc',   color: '#ff9f43' },
      { angle: -0.8, flipX: false, flipY: true,  delay: 0.24, scale: 1.15, type: 'arc',   color: '#1dd1a1' },
      { angle: 0.8,  flipX: true,  flipY: true,  delay: 0.36, scale: 1.22, type: 'arc',   color: '#feca57' },
      { angle: 0.0,  flipX: false, flipY: false, delay: 0.48, scale: 1.5,  type: 'cross', color: '#ff4757' }
    ] : [
      { angle: -0.4, flipX: false, flipY: false, delay: 0.0,  scale: 1.05, type: 'arc',   color: '#54a0ff' },
      { angle: 0.4,  flipX: true,  flipY: false, delay: 0.14, scale: 1.12, type: 'arc',   color: '#ff9f43' },
      { angle: 0.0,  flipX: false, flipY: false, delay: 0.28, scale: 1.35, type: 'cross', color: '#ffd32a' }
    ];

    this.playedHits = new Set();
  }

  update(dt) {
    const elapsed = this.maxLife - this.life;

    this.slashes.forEach((s, idx) => {
      if (elapsed >= s.delay && !this.playedHits.has(idx)) {
        this.playedHits.add(idx);
        if (typeof SM !== 'undefined' && SM.play) {
          if (s.type === 'cross') {
            SM.play('se_crit');
          } else {
            SM.play('se_slash');
          }
        }
        
        // 敵またはカカシのヒット振動
        const targets = document.querySelectorAll('.enemy-sprite, .training-dummy-wrap');
        targets.forEach(frame => {
          frame.classList.remove('enemy-damage-hit', 'hit');
          void frame.offsetWidth;
          frame.classList.add('enemy-damage-hit', 'hit');
        });

        // 飛び散る光粒子パーティクル
        const pCount = s.type === 'cross' ? 24 : 12;
        for (let i = 0; i < pCount; i++) {
          const spd = (Math.random() * 180 + 80);
          const pAngle = Math.random() * Math.PI * 2;
          this.particles.push({
            x: this.x + (Math.random() * 40 - 20),
            y: this.y + (Math.random() * 40 - 20),
            vx: Math.cos(pAngle) * spd,
            vy: Math.sin(pAngle) * spd,
            color: s.color,
            size: Math.random() * 5 + 2,
            life: 0.3,
            maxLife: 0.3
          });
        }
      }
    });

    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(ctx) {
    const elapsed = this.maxLife - this.life;
    ctx.save();

    // 加算合成で光り輝かせる
    ctx.globalCompositeOperation = 'lighter';

    // スラッシュスプライト描画
    this.slashes.forEach(s => {
      if (elapsed < s.delay) return;
      const slashTime = elapsed - s.delay;
      const slashDuration = 0.22;
      if (slashTime > slashDuration) return;

      const progress = slashTime / slashDuration;
      const scaleEase = 0.7 + Math.sin(progress * Math.PI * 0.5) * 0.45;
      const alpha = Math.sin(progress * Math.PI);

      const img = s.type === 'cross' ? this.imgCross : this.imgArc;
      if (!img || !img.complete || img.naturalWidth === 0) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(s.angle);
      ctx.scale(
        (s.flipX ? -1 : 1) * s.scale * scaleEase,
        (s.flipY ? -1 : 1) * s.scale * scaleEase
      );
      ctx.globalAlpha = alpha;

      const baseSize = s.type === 'cross' ? 240 : 200;
      ctx.drawImage(img, -baseSize / 2, -baseSize / 2, baseSize, baseSize);

      ctx.restore();
    });

    // 光粒子パーティクル描画
    this.particles.forEach(p => {
      const pAlpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = pAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }
}

class DamageEffect {
  constructor(x, y, text, typeClass = 'enemy-dmg') {
    this.x = x + (Math.random() * 24 - 12);
    this.y = y;
    this.text = String(text);
    this.typeClass = typeClass;
    this.life = 1.1;
    this.maxLife = 1.1;
    this.vy = -55;
    this.isSkill = typeClass.includes('skill');
    this.isCrit = typeClass.includes('crit');
  }
  update(dt) {
    this.y += this.vy * dt;
    this.vy *= 0.96;
  }
  draw(ctx) {
    const elapsed = this.maxLife - this.life;
    const alpha = Math.max(0, Math.min(1, this.life / (this.maxLife * 0.75)));
    
    ctx.save();
    
    // スキルダメージ・クリティカル時は出現時にポップアップ拡大
    let scale = 1.0;
    if (this.isSkill || this.isCrit) {
      if (elapsed < 0.15) {
        scale = 1.0 + (elapsed / 0.15) * 0.45;
      } else if (elapsed < 0.3) {
        scale = 1.45 - ((elapsed - 0.15) / 0.15) * 0.45;
      }
    }

    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.isSkill) {
      // 🌟 超ド派手なスキル専用ダメージ
      ctx.font = this.isCrit ? "900 48px 'DotGothic16', sans-serif" : "900 42px 'DotGothic16', sans-serif";
      
      // 黒/濃い色の極太アウトライン
      ctx.strokeStyle = 'rgba(15, 10, 30, ' + alpha + ')';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.strokeText(this.text, 0, 0);

      // ネオン発光と鮮烈なカラー
      if (this.isCrit) {
        ctx.fillStyle = `rgba(255, 235, 59, ${alpha})`;
        ctx.shadowColor = `rgba(255, 100, 0, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(84, 240, 255, ${alpha})`;
        ctx.shadowColor = `rgba(0, 180, 255, ${alpha})`;
      }
      ctx.shadowBlur = 20;
      ctx.fillText(this.text, 0, 0);

    } else if (this.typeClass.includes('enemy-dmg')) {
      ctx.font = this.isCrit ? "900 40px 'DotGothic16', sans-serif" : "900 30px 'DotGothic16', sans-serif";
      ctx.strokeStyle = 'rgba(0, 0, 0, ' + alpha + ')';
      ctx.lineWidth = 4;
      ctx.strokeText(this.text, 0, 0);

      if (this.isCrit) {
        ctx.fillStyle = `rgba(255, 235, 59, ${alpha})`;
        ctx.shadowColor = `rgba(255, 152, 0, ${alpha})`;
        ctx.shadowBlur = 14;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = `rgba(255, 50, 50, ${alpha})`;
        ctx.shadowBlur = 8;
      }
      ctx.fillText(this.text, 0, 0);

    } else { // player-dmg
      ctx.font = "900 30px 'DotGothic16', sans-serif";
      ctx.fillStyle = `rgba(255, 75, 75, ${alpha})`;
      ctx.shadowColor = `rgba(0, 0, 0, ${alpha})`;
      ctx.shadowBlur = 6;
      ctx.fillText(this.text, 0, 0);
    }
    
    ctx.restore();
  }
}

const CM = new CanvasManager('game-canvas');
const TCM = new CanvasManager('training-canvas');

/* 全角→半角変換（半角強制入力の要） */
function toHalfWidth(s){
  return s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[ー－―‐]/g, '-')
    .replace(/　/g, ' ');
}

/* ==========================================================
   けいさん問題
   エリアごとに演算が1つに決まっていて（草原=たしざん／沼地=ひきざん／
   地下ダンジョン=かけざん／盗賊のアジト=わりざん）、そのエリアの中で
   1〜5だんかいの ちいさな カリキュラムじゅんに むずかしくなる
   ========================================================== */
/* 草原エリア（tower→crypt→bandit の3ステージ）は ぜんぶ たしざん。
   ステージが すすむほど（草原→地下ダンジョン→盗賊のアジト）たしざんの だんかいが あがっていく。
   沼地（dungeon）は べつエリアで、ひきざん専用 */
const ZONE_TIERS = {
  tower:   ['add1', 'add1', 'add2', 'add2', 'add3'],
  crypt:   ['add2', 'add3', 'add3', 'add4', 'add4'],
  bandit:  ['add3', 'add4', 'add4', 'add5', 'add5'],
  dungeon: ['sub1', 'sub2', 'sub3', 'sub4', 'sub5'],
};
/* えんざんの おおまかな 呼びかた（ぶんしょうだいの かいほう判定など、だんかいを 気にしない場面用） */
const ZONE_OP_LABELS = { tower:'たしざん', crypt:'たしざん', bandit:'たしざん', dungeon:'ひきざん' };

const OP_LABELS = {
  add1: '1桁+1桁（くり上がりなし）',
  add2: '1桁+1桁（くり上がりあり）',
  add3: '2桁+1桁（くり上がりなし）',
  add4: '2桁+1桁（くり上がりあり）',
  add5: '2桁+2桁（たしざん そうしあげ）',
  sub1: '1桁-1桁',
  sub2: '2桁-1桁（くり下がりなし）',
  sub3: '2桁-1桁（くり下がりあり）',
  sub4: '2桁-2桁（くり下がりなし）',
  sub5: '2桁-2桁（くり下がりあり）',
  mul1: '2〜3の段',
  mul2: '4〜6の段',
  mul3: '7〜9の段',
  mul4: '2桁×1桁（かけざん・小）',
  mul5: '2桁×1桁（かけざん・大）',
  div1: 'わり算（こたえ1〜5）',
  div2: 'わり算（こたえ6〜9）',
  div3: 'わり算（こたえ10〜12）',
  div4: 'わり算（こたえ13〜15）',
  div5: 'わり算（こたえ16〜19）',
};

/* 1〜10階を「1-2F/3-4F/5F(ボス)/6-7F/8-9F/10F(ボス)」の5だんかいに ふりわける */
function stageIndexForFloor(floor){
  if (floor <= 2) return 0;
  if (floor <= 4) return 1;
  if (floor <= 6) return 2;
  if (floor <= 8) return 3;
  return 4;
}
function opTierForZoneFloor(zone, floor){
  const stages = ZONE_TIERS[zone] || ZONE_TIERS.tower;
  return stages[stageIndexForFloor(floor)];
}
/* tier文字列の さいごの すうじ（1〜5）から、0〜4の だんかいindexを とりだす */
function tierStageIndex(tier){
  const n = parseInt(String(tier).slice(-1), 10);
  return isNaN(n) ? 0 : n - 1;
}

function generateProblem(tier){
  let a, b, op, answer;
  if (tier === 'add1') {
    do { a = rnd(1, 9); b = rnd(1, 9); } while (a + b > 9);
    op = '+'; answer = a + b;
  } else if (tier === 'add2') {
    do { a = rnd(1, 9); b = rnd(1, 9); } while (a + b < 10);
    op = '+'; answer = a + b;
  } else if (tier === 'add3') {
    do { a = rnd(10, 89); b = rnd(1, 9); } while ((a % 10) + b > 9);
    op = '+'; answer = a + b;
  } else if (tier === 'add4') {
    do { a = rnd(10, 89); b = rnd(1, 9); } while ((a % 10) + b <= 9);
    op = '+'; answer = a + b;
  } else if (tier === 'add5') {
    do { a = rnd(11, 88); b = rnd(11, 88); } while (a + b > 99);
    op = '+'; answer = a + b;
  } else if (tier === 'sub1') {
    a = rnd(3, 9); b = rnd(1, a - 1);
    op = '-'; answer = a - b;
  } else if (tier === 'sub2') {
    do { a = rnd(11, 98); b = rnd(1, 9); } while ((a % 10) < b);
    op = '-'; answer = a - b;
  } else if (tier === 'sub3') {
    do { a = rnd(11, 98); b = rnd(1, 9); } while ((a % 10) >= b);
    op = '-'; answer = a - b;
  } else if (tier === 'sub4') {
    do { a = rnd(21, 98); b = rnd(10, a - 1); } while ((a % 10) < (b % 10));
    op = '-'; answer = a - b;
  } else if (tier === 'sub5') {
    do { a = rnd(21, 98); b = rnd(10, a - 1); } while ((a % 10) >= (b % 10));
    op = '-'; answer = a - b;
  } else if (tier === 'mul1') {
    a = rnd(2, 3); b = rnd(1, 9);
    op = '×'; answer = a * b;
  } else if (tier === 'mul2') {
    a = rnd(4, 6); b = rnd(1, 9);
    op = '×'; answer = a * b;
  } else if (tier === 'mul3') {
    a = rnd(7, 9); b = rnd(1, 9);
    op = '×'; answer = a * b;
  } else if (tier === 'mul4') {
    a = rnd(10, 19); b = rnd(2, 9);
    op = '×'; answer = a * b;
  } else if (tier === 'mul5') {
    a = rnd(20, 49); b = rnd(2, 9);
    op = '×'; answer = a * b;
  } else if (tier === 'div1') {
    b = rnd(2, 9); const c1 = rnd(1, 5); a = b * c1;
    op = '÷'; answer = c1;
  } else if (tier === 'div2') {
    b = rnd(2, 9); const c2 = rnd(6, 9); a = b * c2;
    op = '÷'; answer = c2;
  } else if (tier === 'div3') {
    b = rnd(2, 9); const c3 = rnd(10, 12); a = b * c3;
    op = '÷'; answer = c3;
  } else if (tier === 'div4') {
    b = rnd(2, 9); const c4 = rnd(13, 15); a = b * c4;
    op = '÷'; answer = c4;
  } else { // div5
    b = rnd(2, 9); const c5 = rnd(16, 19); a = b * c5;
    op = '÷'; answer = c5;
  }
  return { a, b, op, answer, text: `${a} ${op} ${b}`, tier };
}

const TIER_TIME_LIMITS = {
  add1:5000, add2:6000, add3:6500, add4:7000, add5:8000,
  sub1:5500, sub2:6500, sub3:7000, sub4:7500, sub5:8500,
  mul1:6000, mul2:6500, mul3:7000, mul4:7500, mul5:8500,
  div1:6500, div2:7000, div3:7500, div4:8000, div5:9000,
};
function problemTimeLimit(tier){
  return TIER_TIME_LIMITS[tier] || 8000;
}

/* ==========================================================
   新ステージシステム（エリア1：足し算／エリア2：引き算）
   ゾーン・フロアの かわりに、エリアごとに ステージ1〜7＋ボスの
   こていリストを もつ。ボスは HP50%で フェーズ2（限界突破）へ
   ステートいこうする
   ========================================================== */
function stageProblem(a, b, op, answer){
  return { a, b, op, answer, text: `${a} ${op} ${b}` };
}

const AREA_STAGES = {
  area1: {
    name: '始まりの平原',
    recLv: 1,
    opLabel: 'たしざん',
    enemyZone: 'tower',   // 敵の見た目は 既存の草原プールを流用
    bossKey: 'tower5',    // ボスの見た目・ステータスは 既存の草原ボスを流用（7ステージ構成なので tower10ではなく 5階相当の強さに）
    rewardZone: 'tower',  // クリア報酬・救助イベントは 既存の草原クリア処理を流用
    bgImage: '画像/ステージ/草原.jpg',
    bossName: 'エリアボス',
    stages: [
      { name:'1桁＋1桁（くり上がりなし）', timeLimit:5000, generateProblem:() => {
        let a, b;
        do { a = rnd(1,9); b = rnd(1,9); } while (a + b > 9);
        return stageProblem(a, b, '+', a + b);
      }},
      { name:'10＋〇', timeLimit:5000, generateProblem:() => {
        const a = 10, b = rnd(1,9);
        return stageProblem(a, b, '+', a + b);
      }},
      { name:'1桁＋1桁（くり上がりあり）', timeLimit:6000, generateProblem:() => {
        let a, b;
        do { a = rnd(1,9); b = rnd(1,9); } while (a + b < 10);
        return stageProblem(a, b, '+', a + b);
      }},
      { name:'3つの数の足し算', timeLimit:7000, generateProblem:() => {
        const a = rnd(1,5), b = rnd(1,5), c = rnd(1,5);
        const answer = a + b + c;
        return { a, b, c, op:'+', answer, text:`${a} + ${b} + ${c}` };
      }},
      { name:'2桁＋1桁', timeLimit:6500, generateProblem:() => {
        const a = rnd(10,49), b = rnd(1,9);
        return stageProblem(a, b, '+', a + b);
      }},
      { name:'2桁＋2桁（くり上がりなし）', timeLimit:7000, generateProblem:() => {
        let a, b;
        do { a = rnd(10,49); b = rnd(10,49); } while (a + b > 99);
        return stageProblem(a, b, '+', a + b);
      }},
      { name:'2桁＋2桁（くり上がりあり）', timeLimit:7500, generateProblem:() => {
        let a, b;
        do { a = rnd(15,89); b = rnd(15,89); } while ((a % 10) + (b % 10) < 10);
        return stageProblem(a, b, '+', a + b);
      }},
    ],
    bossTimeLimit1: 7000,
    bossTimeLimit2: 9000,
    bossPhase1Problem(){ return pick(this.stages).generateProblem(); },
    bossPhase2Problem(){
      if (Math.random() < 0.5){
        const a = rnd(100,199), b = rnd(10,99);
        return stageProblem(a, b, '+', a + b);
      }
      let a, b;
      do { a = rnd(40,89); b = rnd(40,89); } while (a + b < 100);
      return stageProblem(a, b, '+', a + b);
    },
  },
  area2: {
    name: '沼',
    recLv: 5,
    opLabel: 'ひきざん',
    enemyZone: 'dungeon',
    bossKey: 'dungeon5', // 7ステージ構成なので dungeon10ではなく 5階相当の強さに
    rewardZone: 'dungeon',
    bgImage: '画像/ステージ/沼地.jpg',
    bossName: 'エリアボス',
    stages: [
      { name:'1桁－1桁', timeLimit:5000, generateProblem:() => {
        const a = rnd(3,9), b = rnd(1,a-1);
        return stageProblem(a, b, '-', a - b);
      }},
      { name:'10－〇', timeLimit:5000, generateProblem:() => {
        const a = 10, b = rnd(1,9);
        return stageProblem(a, b, '-', a - b);
      }},
      { name:'2桁－1桁（くり下がりなし）', timeLimit:6000, generateProblem:() => {
        let a, b;
        do { a = rnd(11,98); b = rnd(1,9); } while ((a % 10) < b);
        return stageProblem(a, b, '-', a - b);
      }},
      { name:'3つの数の引き算', timeLimit:7000, generateProblem:() => {
        let a, b, c;
        do { a = rnd(10,20); b = rnd(1,5); c = rnd(1,5); } while (a - b - c < 0);
        return { a, b, c, op:'-', answer:a - b - c, text:`${a} - ${b} - ${c}` };
      }},
      { name:'2桁－1桁（くり下がりあり）', timeLimit:6500, generateProblem:() => {
        let a, b;
        do { a = rnd(11,98); b = rnd(1,9); } while ((a % 10) >= b);
        return stageProblem(a, b, '-', a - b);
      }},
      { name:'2桁－2桁（くり下がりなし）', timeLimit:7000, generateProblem:() => {
        let a, b;
        do { a = rnd(20,98); b = rnd(10,a-1); } while ((a % 10) < (b % 10));
        return stageProblem(a, b, '-', a - b);
      }},
      { name:'2桁－2桁（くり下がりあり）', timeLimit:7500, generateProblem:() => {
        let a, b;
        do { a = rnd(20,98); b = rnd(10,a-1); } while ((a % 10) >= (b % 10));
        return stageProblem(a, b, '-', a - b);
      }},
    ],
    bossTimeLimit1: 7500,
    bossTimeLimit2: 9500,
    bossPhase1Problem(){ return pick(this.stages).generateProblem(); },
    bossPhase2Problem(){
      if (Math.random() < 0.5){
        const a = rnd(100,109), b = rnd(10, Math.min(a-1,99));
        return stageProblem(a, b, '-', a - b);
      }
      const a = rnd(101,199), b = rnd(10, Math.min(a-1,99));
      return stageProblem(a, b, '-', a - b);
    },
  },
  area3: {
    name: '第3エリア：かけ算の森',
    recLv: 10,
    opLabel: 'かけざん',
    enemyZone: 'crypt',
    bgImage: '画像/ステージ/かけ算の森.jpg',
    bossName: 'かけ算のヌシ',
    bossKey: 'crypt5',
    rewardZone: 'forest',
    stages: [
      { name:'1の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(1, b, '×', 1 * b); } },
      { name:'2の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(2, b, '×', 2 * b); } },
      { name:'3の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(3, b, '×', 3 * b); } },
      { name:'4の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(4, b, '×', 4 * b); } },
      { name:'5の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(5, b, '×', 5 * b); } },
      { name:'6の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(6, b, '×', 6 * b); } },
      { name:'7の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(7, b, '×', 7 * b); } },
      { name:'8の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(8, b, '×', 8 * b); } },
      { name:'9の段', timeLimit:4000, generateProblem:() => { const b = rnd(1,9); return stageProblem(9, b, '×', 9 * b); } },
    ],
    bossTimeLimit1: 4000,
    bossTimeLimit2: 5000,
    bossPhase1Problem(){ const a = rnd(1,9), b = rnd(1,9); return stageProblem(a, b, '×', a * b); },
    bossPhase2Problem(){ const a = rnd(1,9), b = rnd(1,9); return stageProblem(a, b, '×', a * b); },
  },
  area4: {
    name: '第4エリア：試練の塔',
    recLv: 15,
    opLabel: '計算ミックス',
    enemyZone: 'bandit',
    bgImage: '画像/ステージ/試練の塔.jpg',
    bossName: '試練のガーディアン',
    bossKey: 'bandit5',
    rewardZone: 'cave',
    stages: [
      { name:'ミックス 1', timeLimit:7500, generateProblem: generateArea4MixedProblem },
      { name:'ミックス 2', timeLimit:7200, generateProblem: generateArea4MixedProblem },
      { name:'ミックス 3', timeLimit:6900, generateProblem: generateArea4MixedProblem },
      { name:'ミックス 4', timeLimit:6600, generateProblem: generateArea4MixedProblem },
      { name:'ミックス 5', timeLimit:6300, generateProblem: generateArea4MixedProblem },
      { name:'ミックス 6', timeLimit:6000, generateProblem: generateArea4MixedProblem },
      { name:'ミックス 7', timeLimit:5700, generateProblem: generateArea4MixedProblem },
    ],
    bossTimeLimit1: 5700,
    bossTimeLimit2: 6000,
    bossPhase1Problem: generateArea4MixedProblem,
    bossPhase2Problem: generateArea4MixedProblem,
  },
  // --- 漢字エリア（小1〜小6） ---
  area5: {
    name: '漢字の森',
    recLv: 1,
    displayNum: '1年',
    opLabel: '1年生の漢字',
    enemyZone: 'tower',
    bossKey: 'tower5',
    rewardZone: 'kanji1',
    bgImage: '画像/ステージ/かけ算の森.jpg',
    bossName: 'もりの まじん',
    stages: [
      { name: 'かず・大きさ', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g1_1') },
      { name: 'からだ・ひと', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g1_2') },
      { name: 'しぜん', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g1_3') },
      { name: 'がっこう・まち', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g1_4') },
      { name: 'いろ・いきもの', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g1_5') },
    ],
    bossTimeLimit1: 15000, bossTimeLimit2: 15000,
    bossPhase1Problem: () => generateKanjiProblem('kanji_g1'),
    bossPhase2Problem: () => generateKanjiProblem('kanji_g1'),
  },
  area6: {
    name: '漢字の洞窟',
    recLv: 5,
    displayNum: '2年',
    opLabel: '2年生の漢字',
    enemyZone: 'dungeon',
    bossKey: 'dungeon5',
    rewardZone: 'kanji2',
    bgImage: '画像/ステージ/沼地.jpg',
    bossName: 'ほらあなの まじん',
    stages: [
      { name: 'とき・こよみ', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g2_1') },
      { name: 'ひと・いえ・まち', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g2_2') },
      { name: 'しぜん・いきもの', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g2_3') },
      { name: 'がっこう・べんきょう', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g2_4') },
      { name: 'せいかつ・ことば', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g2_5') },
    ],
    bossTimeLimit1: 15000, bossTimeLimit2: 15000,
    bossPhase1Problem: () => generateKanjiProblem('kanji_g2'),
    bossPhase2Problem: () => generateKanjiProblem('kanji_g2'),
  },
  area7: {
    name: '漢字の砂漠',
    recLv: 10,
    displayNum: '3年',
    opLabel: '3年生の漢字',
    enemyZone: 'crypt',
    bossKey: 'crypt5',
    rewardZone: 'kanji3',
    bgImage: '画像/ステージ/幻影の砂漠.jpg',
    bossName: 'すなの まじん',
    stages: [
      { name: 'その1', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g3_1') },
      { name: 'その2', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g3_2') },
      { name: 'その3', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g3_3') },
      { name: 'その4', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g3_4') },
      { name: 'その5', timeLimit: 15000, generateProblem: () => generateKanjiProblem('kanji_g3_5') },
    ],
    bossTimeLimit1: 15000, bossTimeLimit2: 15000,
    bossPhase1Problem: () => generateKanjiProblem('kanji_g3'),
    bossPhase2Problem: () => generateKanjiProblem('kanji_g3'),
  },
  area8: {
    name: '漢字の海',
    recLv: 15,
    displayNum: '4年',
    opLabel: '4年生の漢字',
    enemyZone: 'bandit',
    bossKey: 'bandit5',
    rewardZone: 'kanji4',
    bgImage: '画像/ステージ/わり算の海.jpg',
    bossName: 'うみの まじん',
    stages: [
      { name: 'その1', timeLimit: 16000, generateProblem: () => generateKanjiProblem('kanji_g4_1') },
      { name: 'その2', timeLimit: 16000, generateProblem: () => generateKanjiProblem('kanji_g4_2') },
      { name: 'その3', timeLimit: 16000, generateProblem: () => generateKanjiProblem('kanji_g4_3') },
      { name: 'その4', timeLimit: 16000, generateProblem: () => generateKanjiProblem('kanji_g4_4') },
      { name: 'その5', timeLimit: 16000, generateProblem: () => generateKanjiProblem('kanji_g4_5') },
    ],
    bossTimeLimit1: 16000, bossTimeLimit2: 16000,
    bossPhase1Problem: () => generateKanjiProblem('kanji_g4'),
    bossPhase2Problem: () => generateKanjiProblem('kanji_g4'),
  },
  area9: {
    name: '漢字の火山',
    recLv: 20,
    displayNum: '5年',
    opLabel: '5年生の漢字',
    enemyZone: 'crypt',
    bossKey: 'crypt5',
    rewardZone: 'kanji5',
    bgImage: '画像/ステージ/灼熱の火山.jpg',
    bossName: 'えんじょうの まじん',
    stages: [
      { name: 'その1', timeLimit: 17000, generateProblem: () => generateKanjiProblem('kanji_g5_1') },
      { name: 'その2', timeLimit: 17000, generateProblem: () => generateKanjiProblem('kanji_g5_2') },
      { name: 'その3', timeLimit: 17000, generateProblem: () => generateKanjiProblem('kanji_g5_3') },
      { name: 'その4', timeLimit: 17000, generateProblem: () => generateKanjiProblem('kanji_g5_4') },
      { name: 'その5', timeLimit: 17000, generateProblem: () => generateKanjiProblem('kanji_g5_5') },
    ],
    bossTimeLimit1: 17000, bossTimeLimit2: 17000,
    bossPhase1Problem: () => generateKanjiProblem('kanji_g5'),
    bossPhase2Problem: () => generateKanjiProblem('kanji_g5'),
  },
  area10: {
    name: '漢字の魔王城',
    recLv: 25,
    displayNum: '6年',
    opLabel: '6年生の漢字',
    enemyZone: 'bandit',
    bossKey: 'bandit5',
    rewardZone: 'kanji6',
    bgImage: '画像/ステージ/魔王城.jpg',
    bossName: 'かんじの まおう',
    stages: [
      { name: 'その1', timeLimit: 18000, generateProblem: () => generateKanjiProblem('kanji_g6_1') },
      { name: 'その2', timeLimit: 18000, generateProblem: () => generateKanjiProblem('kanji_g6_2') },
      { name: 'その3', timeLimit: 18000, generateProblem: () => generateKanjiProblem('kanji_g6_3') },
      { name: 'その4', timeLimit: 18000, generateProblem: () => generateKanjiProblem('kanji_g6_4') },
      { name: 'その5', timeLimit: 18000, generateProblem: () => generateKanjiProblem('kanji_g6_5') },
    ],
    bossTimeLimit1: 18000, bossTimeLimit2: 18000,
    bossPhase1Problem: () => generateKanjiProblem('kanji_g6'),
    bossPhase2Problem: () => generateKanjiProblem('kanji_g6'),
  },
  // --- 算数エリア（小5・小6） ---
  area11: {
    name: '天空の階段',
    recLv: 20,
    displayNum: '5年',
    opLabel: '小5 算数',
    enemyZone: 'crypt',
    bossKey: 'crypt5',
    rewardZone: 'sky',
    bgImage: '画像/ステージ/天空.jpg',
    bossName: '天空のぬし',
    stages: [
      { name: '小数の掛け算', timeLimit: 7500, generateProblem: () => { const a = (rnd(11,49)/10).toFixed(1), b = rnd(2,9); return stageProblem(a, b, '×', Math.round(parseFloat(a)*b*10)/10); } },
      { name: '小数の割り算', timeLimit: 7500, generateProblem: () => { const b = rnd(2,6), ans = (rnd(11,39)/10).toFixed(1), a = (Math.round(ans*b*10)/10).toFixed(1); return stageProblem(a, b, '÷', parseFloat(ans)); } },
      { name: '分数＋分数（同分母）', timeLimit: 7000, generateProblem: () => { const d = rnd(3,9), a = rnd(1,d-2), b = rnd(1,d-1-a); return { a:`${a}/${d}`, b:`${b}/${d}`, op:'+', answer:`${a+b}/${d}`, text:`${a}/${d} + ${b}/${d}` }; } },
      { name: '分数－分数（同分母）', timeLimit: 7000, generateProblem: () => { const d = rnd(3,9), b = rnd(1,d-2), a = rnd(b+1,d-1); return { a:`${a}/${d}`, b:`${b}/${d}`, op:'-', answer:`${a-b}/${d}`, text:`${a}/${d} - ${b}/${d}` }; } },
      { name: '平均の計算', timeLimit: 8000, generateProblem: () => { const ans = rnd(5,15), a = ans - rnd(1,3), b = ans + rnd(1,3); return { a, b, op:'平均', answer:ans, text:`${a} と ${b} の平均` }; } },
      { name: '割合（%）', timeLimit: 8000, generateProblem: () => { const base = rnd(1,9)*100, pct = pick([10,20,30,50]); return { a:base, b:`${pct}%`, op:'の', answer:base*(pct/100), text:`${base} の ${pct}%` }; } },
      { name: '5年まとめ', timeLimit: 8000, generateProblem: generateArea4MixedProblem },
    ],
    bossTimeLimit1: 7500, bossTimeLimit2: 8000,
    bossPhase1Problem: generateArea4MixedProblem,
    bossPhase2Problem: generateArea4MixedProblem,
  },
  area12: {
    name: '算数の魔王城',
    recLv: 25,
    displayNum: '6年',
    opLabel: '小6 算数',
    enemyZone: 'bandit',
    bossKey: 'bandit5',
    rewardZone: 'castle',
    bgImage: '画像/ステージ/魔王城.jpg',
    bossName: 'さんすうの まおう',
    stages: [
      { name: '分数の掛け算', timeLimit: 8000, generateProblem: () => { const a = rnd(1,3), b = rnd(4,5), c = rnd(1,2), d = rnd(3,5); return { a:`${a}/${b}`, b:`${c}/${d}`, op:'×', answer:`${a*c}/${b*d}`, text:`${a}/${b} × ${c}/${d}` }; } },
      { name: '比の値', timeLimit: 7500, generateProblem: () => { const m = rnd(2,5), a = rnd(1,4)*m, b = rnd(1,4)*m; return { a:`${a}:${b}`, op:'かんたん', answer:`${a/m}:${b/m}`, text:`${a} : ${b} をかんたんに` }; } },
      { name: '速さ・道のり', timeLimit: 8500, generateProblem: () => { const spd = rnd(3,8)*10, t = rnd(2,4); return { a:`時速${spd}km`, b:`${t}時間`, op:'道のり', answer:spd*t, text:`時速${spd}km で ${t}時間` }; } },
      { name: '円の面積（π=3.14）', timeLimit: 9000, generateProblem: () => { const r = pick([1,2,10]); return { a:`半径${r}cm`, op:'面積', answer:Math.round(r*r*3.14*100)/100, text:`半径${r}cmの円の面積` }; } },
      { name: '比例と反比例', timeLimit: 8000, generateProblem: () => { const k = rnd(2,5), x = rnd(2,6); return { a:`y=${k}x`, b:`x=${x}`, op:'yの値', answer:k*x, text:`y=${k}x で x=${x} のとき y` }; } },
      { name: '場合の数', timeLimit: 8000, generateProblem: () => { const n = rnd(3,4); return { a:`${n}人`, op:'並び方', answer: n===3?6:24, text:`${n}人が1列に並ぶ並び方` }; } },
      { name: '6年総まとめ', timeLimit: 8500, generateProblem: generateArea4MixedProblem },
    ],
    bossTimeLimit1: 8000, bossTimeLimit2: 8500,
    bossPhase1Problem: generateArea4MixedProblem,
    bossPhase2Problem: generateArea4MixedProblem,
  }
};

function generateArea4MixedProblem() {
  const type = rnd(1, 5);
  if (type === 1) {
    const a = rnd(10, 99), b = rnd(1, 99);
    return stageProblem(a, b, '+', a + b);
  } else if (type === 2) {
    let a = rnd(10, 99), b = rnd(1, 99);
    if (a < b) [a, b] = [b, a];
    return stageProblem(a, b, '-', a - b);
  } else if (type === 3) {
    const a = rnd(1, 9), b = rnd(1, 9);
    return stageProblem(a, b, '×', a * b);
  } else if (type === 4) {
    const op = Math.random() < 0.5 ? '+' : '-';
    let a = rnd(1, 9) * 100, b = rnd(1, 9) * 100;
    if (op === '-') {
      if (a < b) [a, b] = [b, a];
      return stageProblem(a, b, '-', a - b);
    }
    return stageProblem(a, b, '+', a + b);
  } else {
    const ops = [ ['+','+'], ['+','-'], ['-','-'] ];
    const opPair = pick(ops);
    let a = rnd(10, 50), b = rnd(1, 20), c = rnd(1, 20);
    if (opPair[0] === '+' && opPair[1] === '+') {
      return { a, b, c, op: '+', answer: a + b + c, text: `${a} + ${b} + ${c}` };
    } else if (opPair[0] === '+' && opPair[1] === '-') {
      return { a, b, c, op: '+-', answer: a + b - c, text: `${a} + ${b} - ${c}` };
    } else {
      do { a = rnd(20, 50); b = rnd(1, 20); c = rnd(1, 20); } while (a - b - c < 0);
      return { a, b, c, op: '-', answer: a - b - c, text: `${a} - ${b} - ${c}` };
    }
  }
}

/* 1つの ステージ（例：1-1）で、おなじ もんだいタイプの 敵を なんたい たおすと
   つぎの ステージへ すすむか（＝おなじ けいさんに くりかえし ふれて なれる ための かいすう） */
const ENEMIES_PER_STAGE = 10;

/* いま えらんでいる エリア／ステージの じょうたい。
   { stageMode:true, areaId, stageIndex(0〜6・ボスはnull), isBoss, bossPhase(ボスのみ),
     stageKillCount(いまの ステージで たおした 数、0〜ENEMIES_PER_STAGE-1) } */
function enterAreaStage(areaId, stageIndex){
  explore = { stageMode:true, areaId, stageIndex, isBoss:false, stageKillCount:0, sessionDrops: [], sessionGold: 0, stageDrops: [], stageGold: 0, stageExp: 0 };
  startBattle(false);
}
function enterAreaBoss(areaId){
  explore = { stageMode:true, areaId, stageIndex:null, isBoss:true, bossPhase:1, sessionDrops: [], sessionGold: 0, stageDrops: [], stageGold: 0, stageExp: 0 };
  startBattle(false);
}

function generateStageEnemy(areaId, stageIndex, isBoss){
  const area = AREA_STAGES[areaId];
  if (isBoss){
    const tmpl = getEnemyTemplate('boss', area.bossKey);
    /* このボスは 素で 装備なしの プレイヤーが たおす もの。
       ながびく せりあいに ならないよう、HPを へらして 決着を はやめ、
       こうげき力も おさえて よゆうを もたせる */
    const e = {
      name: `【ボス】${tmpl.name}`, emoji: tmpl.emoji,
      maxHp: Math.round(tmpl.hp * 0.8), atk: Math.round(tmpl.atk * 0.55), def: tmpl.def, spd: tmpl.spd,
      goldMin: tmpl.gold[0], goldMax: tmpl.gold[1], exp: tmpl.exp,
      isBoss: true,
    };
    e.hp = e.maxHp;
    return e;
  }
  const pool = ENEMY_POOLS[area.enemyZone];
  /* ぼうぎょ力の たかい 敵（ゴブリン・スケルトンなど）は そうびなしの プレイヤーの
     こうげきを ほぼ むこうかしてしまう ため、エリア1・2の 7ステージちゅうは
     プールの さいしょの 4体（ぼうぎょ力の ひくい 敵）だけに こていする */
  const poolSize = Math.min(pool.length, 4);
  const idx = Math.floor(Math.random() * poolSize);
  const tmpl = getEnemyTemplate(area.enemyZone, idx);
  /* エリア1・2は しょきゅうしゃ向け。そうびなしでも かならず 2〜3げきで たおせる くらい、
     敵のHPと こうげき力の のびを ひかえめに おさえる */
  let mult = 1 + stageIndex * 0.05;
  let hpMult = mult;

  if (areaId === 'area1') {
    // 最初のステージ(0)はHPを極端に低く(約0.2倍 => hp3程度)し、徐々に上げる
    hpMult = 0.2 + stageIndex * 0.15;
  } else if (areaId === 'area2' || areaId === 'area5') {
    // 沼や小1漢字も序盤なので少し低めからスタート
    hpMult = 0.5 + stageIndex * 0.1;
  }

  let atk = Math.round(tmpl.atk * mult);
  /* たしざんの草原エリア（area1）の 1〜3ステージめは、はじめての けいさんに
     しゅうちゅうできるよう、敵の こうげき力を 1〜2に とくべつ おさえる */
  if (areaId === 'area1' && stageIndex < 3) atk = rnd(1, 2);

  // HPが低くなりすぎないように最低値は 2 を保証
  const calculatedHp = Math.max(2, Math.round(tmpl.hp * hpMult));

  const e = {
    name: tmpl.name, emoji: tmpl.emoji,
    maxHp: calculatedHp, atk, def: Math.round(tmpl.def * mult),
    spd: tmpl.spd + Math.floor(stageIndex / 2),
    goldMin: Math.round(tmpl.gold[0] * mult), goldMax: Math.round(tmpl.gold[1] * mult),
    exp: Math.round(tmpl.exp * mult),
    isBoss: false,
  };
  e.hp = e.maxHp;
  return e;
}

function stageBattleBg(areaId, stageIndex, isBoss){
  const area = AREA_STAGES[areaId];
  if (isBoss) return battleBgFor(area.enemyZone, 10);
  return battleBgFor(area.enemyZone, Math.min((stageIndex || 0) + 1, 9));
}

function stageBattleTitleHtml(areaId, stageIndex, isBoss, bossPhase, killCount){
  const area = AREA_STAGES[areaId];
  if (isBoss){
    const phaseLabel = bossPhase === 2 ? 'フェーズ2：限界突破' : 'フェーズ1：総復習';
    return `${area.name} ${area.bossName}（${phaseLabel}）`;
  }
  const stage = area.stages[stageIndex];
  const enemyNo = Math.min(ENEMIES_PER_STAGE, (killCount || 0) + 1);
  return `${area.name} ステージ${stageIndex + 1}／${area.stages.length}（${stage.name}）${enemyNo}／${ENEMIES_PER_STAGE}たいめ`;
}

/* エリア2は エリア1をクリアしないと ちょうせんできない */
function isAreaUnlocked(areaId){
  // テストプレイ用に全エリアを一時的に解放
  return true;
}

/* ==========================================================
   RPGふうの ぶんしょうだい（サブクエストボードで 出題）
   けいさんじたいは generateProblem() と おなじ数字づくりを つかい、
   ものがたりの文章で つつむだけ
   ========================================================== */
/* サブクエストを たのんでくる むらびとたち（1クエスト＝おなじ人物から 3問） */
const QUEST_NPCS = [
  { name:'むらびとトム', emoji:'👨‍🌾', image:'./画像/NPC/npc_farmer_tom.png' },
  { name:'しょうにんリナ', emoji:'👩‍💼', image:'./画像/NPC/npc_merchant_lina.png' },
  { name:'ろうけんじゃ ゴンド', emoji:'🧙', image:'./画像/NPC/npc_wiseman_gondo.png' },
  { name:'パンやのサラ', emoji:'👩‍🍳', image:'./画像/NPC/npc_baker_sara.png' },
  { name:'かじやのケン', emoji:'🧑‍🔧', image:'./画像/NPC/npc_blacksmith_ken.png' },
  { name:'つりびとダン', emoji:'🎣', image:'./画像/NPC/npc_fisherman_dan.png' },
];

/* 1クエスト＝1えんざんファミリー（add/sub/mul/div）につき、
   「はじめに→つぎに→さいごに」と ものがたりが つづく 3問セット。
   おなじ場面・おなじ人物からの たのみごとが すすんでいく ようす を えがく */
const STORY_ARCS = {
  add: [
    { title:'おまつりの じゅんび', parts: [
      (a, b) => `「おまつりの やたいを てつだってほしいんだ。はじめに りんごを ${a}こ ならべたよ。あとから ${b}こ ついかしたんだ。りんごは ぜんぶで なんこに なる？」`,
      (a, b) => `「つぎは おだんごだよ。${a}こ よういしたら、とんやから さらに ${b}こ とどいたんだ。だんごは ぜんぶで なんこに なる？」`,
      (a, b) => `「さいごに ちょうちんを ${a}こ かざったよ。となりの むらからも ${b}こ とどいたんだ。ちょうちんは ぜんぶで なんこに なる？」`,
    ]},
    { title:'ひっこしの てつだい', parts: [
      (a, b) => `「ひっこしを てつだって！ はじめに 本を ${a}さつ はこにつめたら、たなおくから まだ ${b}さつ 見つかったんだ。本は ぜんぶで なんさつ ある？」`,
      (a, b) => `「つぎは しょっきだよ。${a}こ つつんだあと、おくの たなから ${b}こ 見つかったんだ。しょっきは ぜんぶで なんこに なる？」`,
      (a, b) => `「さいごに ふくを ${a}まい たたんだら、せんたくから ${b}まい もどってきたんだ。ふくは ぜんぶで なんまいに なる？」`,
    ]},
  ],
  sub: [
    { title:'ぼうけんの じゅんびひん', parts: [
      (a, b) => `「たびの じゅんびを てつだって。かごに りんごが ${a}こ あったけど、あさごはんで ${b}こ たべたんだ。のこりは なんこに なる？」`,
      (a, b) => `「つぎは ポーションだよ。${a}こ あったけど、テストで ${b}こ つかったんだ。のこりは なんこに なる？」`,
      (a, b) => `「さいごに たいまつだよ。${a}ぽん あったけど、どうくつの れんしゅうで ${b}ぽん つかいきったんだ。のこりは なんぽんに なる？」`,
    ]},
    { title:'とうぞくが でた さわぎ', parts: [
      (a, b) => `「たいへんだ、とうぞくが でたんだ！ たからばこに きんかが ${a}まい あったのに、${b}まい ぬすまれてしまった。のこりは なんまいに なる？」`,
      (a, b) => `「つぎは そうこだよ。パンが ${a}こ あったのに、${b}こ もっていかれたんだ。のこりは なんこに なる？」`,
      (a, b) => `「さいごに ぶきだよ。やが ${a}ぽん あったのに、${b}ぽん もちさられたんだ。のこりは なんぽんに なる？」`,
    ]},
  ],
  mul: [
    { title:'いちばの しこみ', parts: [
      (a, b) => `「いちばの しこみを てつだって。はこが ${b}はこ あって、どの はこにも りんごが ${a}こずつ はいっているよ。りんごは ぜんぶで なんこに なる？」`,
      (a, b) => `「つぎは パンだよ。かごが ${b}こ あって、どの かごにも パンが ${a}こずつ はいっているよ。パンは ぜんぶで なんこに なる？」`,
      (a, b) => `「さいごに たるだよ。にだいしゃが ${b}だい あって、どの にだいしゃにも たるが ${a}こずつ のっているよ。たるは ぜんぶで なんこに なる？」`,
    ]},
    { title:'へいしの しゅつどう', parts: [
      (a, b) => `「とりでの しらせを つたえたい。ぶたいが ${b}たい あって、どの ぶたいにも へいしが ${a}にんずつ いるよ。へいしは ぜんいんで なんにんに なる？」`,
      (a, b) => `「つぎは うまだよ。うまやが ${b}とう あって、どの うまやにも うまが ${a}とうずつ いるよ。うまは ぜんぶで なんとうに なる？」`,
      (a, b) => `「さいごに たてだよ。たなが ${b}だん あって、どの だんにも たてが ${a}まいずつ たてかけてあるよ。たては ぜんぶで なんまいに なる？」`,
    ]},
  ],
  div: [
    { title:'たからの わけまえ', parts: [
      (a, b) => `「たからを みんなで わけたいんだ。ほうせきが ${a}こ あって、${b}にんの なかまで きっちり わけると、ひとり なんこ もらえる？」`,
      (a, b) => `「つぎは きんかだよ。ぜんぶで ${a}まい あって、${b}この チームに おなじ かずずつ わけると、1チームは なんまいに なる？」`,
      (a, b) => `「さいごに ほうせきばこだよ。ちゅうみが ${a}こ あって、${b}この はこに おなじ かずずつ いれると、1つの はこに なんこ はいる？」`,
    ]},
    { title:'えんかいの じゅんび', parts: [
      (a, b) => `「むらの えんかいを てつだって。たまごが ${a}こ あって、${b}この かごに おなじ かずずつ いれると、1かごに なんこ はいる？」`,
      (a, b) => `「つぎは おさらだよ。おさらが ${a}まい あって、${b}この テーブルに おなじ かずずつ くばると、1テーブルに なんまい おける？」`,
      (a, b) => `「さいごに いすだよ。いすが ${a}きゃく あって、${b}この へやに おなじ かずずつ わけると、1つの へやに なんきゃく はいる？」`,
    ]},
  ],
};

/* レベルに おうじて、出題できる えんざん「ファミリー」を ひろげる
   （ファミリーが かいほうされたら、その5だんかいは ランダムに 出る） */
function unlockedWordFamilies(){
  const lvl = G.player.lvl;
  const families = ['add'];
  if (lvl >= 5) families.push('sub');
  if (lvl >= 8) families.push('mul');
  if (lvl >= 10) families.push('div');
  return families;
}

/* 1クエスト＝おなじ人物から、おなじ ものがたりの ながれで 3問。
   3問とも おなじ えんざんファミリー・おなじ なんいどで そろえる */
function generateStoryQuest(){
  const family = pick(unlockedWordFamilies());
  const arc = pick(STORY_ARCS[family]);
  const npc = pick(QUEST_NPCS);
  const tier = `${family}${rnd(1, 5)}`;
  const parts = arc.parts.map(tpl => {
    const p = generateProblem(tier);
    return { ...p, text: tpl(p.a, p.b), isWordProblem: true };
  });
  return { uid: G.nextUid++, npc, title: arc.title, tier, parts, partIndex: 0 };
}

function questRewardFor(tier){
  const idx = tierStageIndex(tier);
  return { gold: 15 + idx * 10, exp: 6 + idx * 5 };
}

/* ==========================================================
   敵データ
   ========================================================== */
const ENEMIES_TOWER = [
  { name:'そらとぶスライム', emoji:'assets/monsters_new/monster_1.png', hp:16, atk:3, def:1, spd:4, gold:[4,9], exp:6 },
  { name:'コウモリ', emoji:'assets/monsters_new/monster_5.png', hp:14, atk:4, def:1, spd:7, gold:[5,10], exp:7 },
  { name:'おばけ', emoji:'assets/monsters_new/monster_7.png', hp:18, atk:4, def:2, spd:5, gold:[6,12], exp:8 },
  { name:'キノコ', emoji:'assets/monsters_new/monster_4.png', hp:22, atk:5, def:2, spd:8, gold:[7,13], exp:10 },
  { name:'ゴブリン', emoji:'assets/monsters_new/monster_3.png', hp:30, atk:6, def:5, spd:3, gold:[9,16], exp:13 },
  { name:'ミミック', emoji:'assets/monsters_new/monster_6.png', hp:24, atk:7, def:2, spd:9, gold:[10,17], exp:14 },
  { name:'スケルトン', emoji:'assets/monsters_new/monster_8.png', hp:34, atk:8, def:5, spd:6, gold:[12,20], exp:17 },
  { name:'しろいウサギ', emoji:'assets/monsters_new/m3_1.png', hp:15, atk:3, def:1, spd:9, gold:[4,8], exp:6 },
  { name:'キノコやまあらし', emoji:'assets/monsters_new/m3_2.png', hp:20, atk:4, def:2, spd:4, gold:[5,10], exp:8 },
  { name:'わたぐも', emoji:'assets/monsters_new/m3_3.png', hp:17, atk:4, def:1, spd:6, gold:[5,9], exp:7 },
  { name:'じょうろのせいれい', emoji:'assets/monsters_new/m3_4.png', hp:19, atk:3, def:2, spd:5, gold:[5,10], exp:8 },
  { name:'よつばのてんとうむし', emoji:'assets/monsters_new/m3_5.png', hp:16, atk:5, def:1, spd:7, gold:[5,9], exp:8 },
  { name:'くさむらいわ', emoji:'assets/monsters_new/m3_6.png', hp:26, atk:4, def:6, spd:2, gold:[7,12], exp:10 },
  { name:'はたけのすずめ', emoji:'assets/monsters_new/m3_7.png', hp:18, atk:5, def:1, spd:8, gold:[6,10], exp:9 },
  { name:'どろんこモグラ', emoji:'assets/monsters_new/m3_8.png', hp:24, atk:5, def:3, spd:4, gold:[7,13], exp:11 },
  { name:'たいようのてんし', emoji:'assets/monsters_new/m1_1.png', hp:17, atk:5, def:2, spd:6, gold:[6,10], exp:9 },
  { name:'みずばのかえる', emoji:'assets/monsters_new/m1_2.png', hp:19, atk:4, def:2, spd:5, gold:[6,10], exp:9 },
  { name:'きかいのつかいま', emoji:'assets/monsters_new/m1_3.png', hp:20, atk:6, def:2, spd:5, gold:[7,11], exp:10 },
  { name:'マカロンモンスター', emoji:'assets/monsters_new/m1_4.png', hp:18, atk:5, def:2, spd:5, gold:[6,10], exp:9 },
];
const ENEMIES_DUNGEON = [
  { name:'どくスライム', emoji:'assets/monsters_new/monster_1.png', hp:16, atk:3, def:1, spd:4, gold:[4,9], exp:6 },
  { name:'コウモリ', emoji:'assets/monsters_new/monster_5.png', hp:13, atk:4, def:0, spd:8, gold:[3,8], exp:7 },
  { name:'ゴブリン', emoji:'assets/monsters_new/monster_3.png', hp:19, atk:4, def:2, spd:5, gold:[6,12], exp:8 },
  { name:'キノコおばけ', emoji:'assets/monsters_new/monster_4.png', hp:24, atk:6, def:3, spd:5, gold:[8,15], exp:11 },
  { name:'あくりょう', emoji:'assets/monsters_new/monster_7.png', hp:20, atk:7, def:1, spd:9, gold:[9,16], exp:13 },
  { name:'ミミック', emoji:'assets/monsters_new/monster_6.png', hp:32, atk:7, def:4, spd:4, gold:[10,18], exp:14 },
  { name:'スケルトンナイト', emoji:'assets/monsters_new/monster_8.png', hp:36, atk:9, def:6, spd:6, gold:[14,22], exp:18 },
  { name:'きりかぶモンスター', emoji:'assets/monsters_new/m2_1.png', hp:26, atk:5, def:4, spd:3, gold:[7,13], exp:11 },
  { name:'すいしょうのようせい', emoji:'assets/monsters_new/m2_2.png', hp:18, atk:6, def:1, spd:8, gold:[7,12], exp:11 },
  { name:'つるのばけもの', emoji:'assets/monsters_new/m2_3.png', hp:28, atk:6, def:4, spd:4, gold:[8,14], exp:12 },
  { name:'どくとかげ', emoji:'assets/monsters_new/m2_4.png', hp:20, atk:6, def:2, spd:7, gold:[7,12], exp:10 },
  { name:'こけのせいれい', emoji:'assets/monsters_new/m2_5.png', hp:30, atk:7, def:5, spd:3, gold:[9,15], exp:13 },
  { name:'ぬまのハチドリ', emoji:'assets/monsters_new/m2_6.png', hp:16, atk:6, def:1, spd:9, gold:[7,11], exp:10 },
  { name:'こけいわゴーレム', emoji:'assets/monsters_new/m2_7.png', hp:36, atk:8, def:7, spd:2, gold:[11,18], exp:15 },
  { name:'まじゅうのバラ', emoji:'assets/monsters_new/m2_8.png', hp:22, atk:8, def:2, spd:6, gold:[9,15], exp:13 },
  { name:'どせいのようせい', emoji:'assets/monsters_new/m1_5.png', hp:19, atk:5, def:2, spd:6, gold:[6,11], exp:9 },
  { name:'まほうのつぼ', emoji:'assets/monsters_new/m1_6.png', hp:23, atk:6, def:4, spd:3, gold:[8,13], exp:11 },
  { name:'おとのてんし', emoji:'assets/monsters_new/m1_7.png', hp:17, atk:5, def:1, spd:8, gold:[6,10], exp:9 },
  { name:'ひかるさかな', emoji:'assets/monsters_new/m1_8.png', hp:20, atk:5, def:2, spd:6, gold:[7,11], exp:10 },
];
const ENEMIES_CRYPT = [
  { name:'どろぬまスライム', emoji:'assets/monsters_new/monster_1.png', hp:18, atk:3, def:2, spd:4, gold:[4,9], exp:6 },
  { name:'やみコウモリ', emoji:'assets/monsters_new/monster_5.png', hp:15, atk:5, def:1, spd:8, gold:[5,10], exp:7 },
  { name:'どくキノコ', emoji:'assets/monsters_new/monster_4.png', hp:24, atk:5, def:3, spd:6, gold:[7,13], exp:10 },
  { name:'ほらあなゴブリン', emoji:'assets/monsters_new/monster_3.png', hp:28, atk:6, def:4, spd:5, gold:[8,14], exp:12 },
  { name:'のろいのミミック', emoji:'assets/monsters_new/monster_6.png', hp:26, atk:8, def:3, spd:7, gold:[10,17], exp:14 },
  { name:'さまよえるたましい', emoji:'assets/monsters_new/monster_7.png', hp:22, atk:7, def:2, spd:9, gold:[10,18], exp:15 },
  { name:'がいこつせんし', emoji:'assets/monsters_new/monster_8.png', hp:38, atk:9, def:6, spd:6, gold:[14,22], exp:19 },
  { name:'はちうえのぬし', emoji:'assets/monsters_new/m4_1.png', hp:20, atk:5, def:3, spd:4, gold:[7,12], exp:10 },
  { name:'ほのおのねこ', emoji:'assets/monsters_new/m4_2.png', hp:22, atk:8, def:2, spd:7, gold:[8,14], exp:12 },
  { name:'あわだこ', emoji:'assets/monsters_new/m4_3.png', hp:19, atk:6, def:2, spd:6, gold:[7,12], exp:10 },
  { name:'でんきのたま', emoji:'assets/monsters_new/m4_4.png', hp:24, atk:7, def:3, spd:6, gold:[9,14], exp:12 },
  { name:'すいしょうくらげ', emoji:'assets/monsters_new/m4_5.png', hp:21, atk:6, def:3, spd:5, gold:[8,13], exp:11 },
  { name:'かぜのわたぼこり', emoji:'assets/monsters_new/m4_6.png', hp:18, atk:5, def:1, spd:9, gold:[7,11], exp:10 },
  { name:'まがんのひとみ', emoji:'assets/monsters_new/m4_7.png', hp:26, atk:9, def:3, spd:5, gold:[10,16], exp:14 },
  { name:'ゆきだるまのれいこん', emoji:'assets/monsters_new/m4_8.png', hp:23, atk:6, def:4, spd:4, gold:[8,13], exp:11 },
  { name:'まもりのてんし', emoji:'assets/monsters_new/m5_1.png', hp:28, atk:7, def:4, spd:5, gold:[9,15], exp:13 },
  { name:'ほのおのふしちょう', emoji:'assets/monsters_new/m5_2.png', hp:26, atk:9, def:3, spd:7, gold:[10,16], exp:14 },
  { name:'くものかいじゅう', emoji:'assets/monsters_new/m5_3.png', hp:32, atk:6, def:6, spd:3, gold:[10,16], exp:13 },
  { name:'たいようのせいれい', emoji:'assets/monsters_new/m5_4.png', hp:24, atk:8, def:3, spd:6, gold:[9,15], exp:13 },
];
const ENEMIES_BANDIT = [
  { name:'みはりの盗賊', emoji:'assets/monsters_new/monster_3.png', hp:15, atk:4, def:1, spd:6, gold:[5,10], exp:7 },
  { name:'ナイフの盗賊', emoji:'assets/monsters_new/monster_3.png', hp:17, atk:6, def:1, spd:7, gold:[6,11], exp:8 },
  { name:'ゆみの盗賊', emoji:'assets/monsters_new/monster_3.png', hp:16, atk:5, def:1, spd:9, gold:[6,12], exp:9 },
  { name:'ばんけんコウモリ', emoji:'assets/monsters_new/monster_5.png', hp:16, atk:5, def:1, spd:8, gold:[6,11], exp:8 },
  { name:'わなのミミック', emoji:'assets/monsters_new/monster_6.png', hp:27, atk:7, def:3, spd:5, gold:[10,17], exp:13 },
  { name:'どくつぼスライム', emoji:'assets/monsters_new/monster_1.png', hp:20, atk:5, def:2, spd:4, gold:[7,13], exp:10 },
  { name:'たいちょうこうほの盗賊', emoji:'assets/monsters_new/monster_3.png', hp:32, atk:9, def:4, spd:8, gold:[13,20], exp:17 },
  { name:'ほのおのサラマンダー', emoji:'assets/monsters_new/m6_1.png', hp:22, atk:8, def:2, spd:6, gold:[8,14], exp:12 },
  { name:'こおりのこぎつね', emoji:'assets/monsters_new/m6_2.png', hp:19, atk:6, def:2, spd:8, gold:[7,12], exp:10 },
  { name:'つばめもどき', emoji:'assets/monsters_new/m6_3.png', hp:16, atk:6, def:1, spd:9, gold:[6,11], exp:9 },
  { name:'おけがえる', emoji:'assets/monsters_new/m6_4.png', hp:21, atk:5, def:3, spd:5, gold:[7,12], exp:10 },
  { name:'きのこがえる', emoji:'assets/monsters_new/m6_5.png', hp:23, atk:6, def:3, spd:4, gold:[8,13], exp:11 },
  { name:'ひまわりのようせい', emoji:'assets/monsters_new/m6_6.png', hp:18, atk:5, def:2, spd:6, gold:[7,11], exp:9 },
  { name:'まだらのちょう', emoji:'assets/monsters_new/m6_7.png', hp:17, atk:7, def:1, spd:9, gold:[7,12], exp:10 },
  { name:'きりかぶのぬし', emoji:'assets/monsters_new/m6_8.png', hp:27, atk:6, def:5, spd:3, gold:[9,15], exp:12 },
  { name:'さまよえるゆうれい', emoji:'assets/monsters_new/m5_5.png', hp:22, atk:7, def:2, spd:7, gold:[8,14], exp:12 },
  { name:'たからのハチドリ', emoji:'assets/monsters_new/m5_6.png', hp:17, atk:6, def:1, spd:9, gold:[8,13], exp:11 },
  { name:'にじのはと', emoji:'assets/monsters_new/m5_7.png', hp:19, atk:6, def:2, spd:8, gold:[8,13], exp:11 },
  { name:'たいようのわ', emoji:'assets/monsters_new/m5_8.png', hp:25, atk:8, def:4, spd:5, gold:[9,15], exp:13 },
];
const BOSSES = {
  tower5:    { name:'くさはらのぬし', emoji:'assets/monsters_new/boss1_1.png', hp:70, atk:9, def:5, spd:7, gold:[40,60], exp:45 },
  tower10:   { name:'くさはらの大しゅちょう', emoji:'assets/monsters_new/boss1_1.png', hp:120, atk:13, def:8, spd:9, gold:[90,130], exp:90 },
  dungeon5:  { name:'ぬまのしはいしゃ', emoji:'assets/monsters_new/boss1_5.png', hp:75, atk:10, def:6, spd:5, gold:[40,60], exp:45 },
  dungeon10: { name:'しっこくのぬまおう', emoji:'assets/monsters_new/boss1_5.png', hp:130, atk:14, def:9, spd:8, gold:[90,130], exp:95 },
  crypt5:    { name:'めいきゅうのぬし', emoji:'assets/monsters_new/boss1_2.png', hp:80, atk:11, def:7, spd:6, gold:[42,62], exp:48 },
  crypt10:   { name:'くらやみのめいきゅう王', emoji:'assets/monsters_new/boss1_2.png', hp:135, atk:15, def:9, spd:9, gold:[95,135], exp:98 },
  bandit5:   { name:'とうぞくだんちょう', emoji:'assets/monsters_new/boss1_3.png', hp:78, atk:12, def:5, spd:8, gold:[42,62], exp:47 },
  bandit10:  { name:'とうぞくの王', emoji:'assets/monsters_new/boss1_3.png', hp:140, atk:16, def:8, spd:8, gold:[95,135], exp:100 },
};

let customEnemies = { tower: {}, dungeon: {}, crypt: {}, bandit: {}, boss: {} };
let customEquips = {};
let customItems = {};

function loadCustomData() {
  const savedE = storageGet('typing_rpg_custom_enemies');
  if (savedE) { try { customEnemies = JSON.parse(savedE); } catch(e) {} }
  const savedEq = storageGet('typing_rpg_custom_equips');
  if (savedEq) { try { customEquips = JSON.parse(savedEq); } catch(e) {} }
  const savedI = storageGet('typing_rpg_custom_items');
  if (savedI) { try { customItems = JSON.parse(savedI); } catch(e) {} }
}
loadCustomData();

function saveCustomData() {
  storageSet('typing_rpg_custom_enemies', JSON.stringify(customEnemies));
  storageSet('typing_rpg_custom_equips', JSON.stringify(customEquips));
  storageSet('typing_rpg_custom_items', JSON.stringify(customItems));
}

const ENEMY_POOLS = { tower: ENEMIES_TOWER, dungeon: ENEMIES_DUNGEON, crypt: ENEMIES_CRYPT, bandit: ENEMIES_BANDIT };

function getBaseEnemy(zone, key) {
  if (zone === 'boss') return BOSSES[key];
  return ENEMY_POOLS[zone][key];
}

function getEnemyTemplate(zone, key) {
  const base = getBaseEnemy(zone, key);
  const custom = customEnemies[zone] && customEnemies[zone][key];
  return custom ? { ...base, ...custom } : base;
}

function generateEnemy(zone, floor){
  const isBoss = (floor === 5 || floor === 10);
  let tmpl;
  if (isBoss) {
    tmpl = getEnemyTemplate('boss', `${zone}${floor}`);
  } else {
    const listLen = ENEMY_POOLS[zone].length;
    const poolSize = Math.min(listLen, 2 + floor);
    const idx = Math.floor(Math.random() * poolSize);
    tmpl = getEnemyTemplate(zone, idx);
  }
  const mult = isBoss ? 1 : 1 + (floor-1) * 0.18;
  const e = {
    name: isBoss ? `【ボス】${tmpl.name}` : tmpl.name,
    emoji: tmpl.emoji,
    maxHp: Math.round(tmpl.hp * mult),
    atk: Math.round(tmpl.atk * mult),
    def: Math.round(tmpl.def * mult),
    spd: tmpl.spd + Math.floor(floor/3),
    goldMin: Math.round(tmpl.gold[0] * mult),
    goldMax: Math.round(tmpl.gold[1] * mult),
    exp: Math.round(tmpl.exp * mult),
    isBoss,
  };
  e.hp = e.maxHp;
  return e;
}

/* ==========================================================
   装備データ（ベース）
   ========================================================== */
const EQUIP_DB = [
  // 武器
  { id:'w1', name:'木の剣', slot:'weapon', opTier:'add1', stat:{atk:2}, price:20, cost:1, emoji:'assets/items/w1.png' },
  { id:'w2', name:'どうの剣', slot:'weapon', opTier:'add2', stat:{atk:4}, price:35, cost:2, emoji:'assets/items/w2.png' },
  { id:'w3', name:'はがねの剣', slot:'weapon', opTier:'add3', stat:{atk:7}, price:60, cost:3, emoji:'assets/items/w3.png' },
  { id:'w4', name:'ほのおの斧', slot:'weapon', opTier:'add4', stat:{atk:9}, price:80, cost:4, emoji:'assets/items/w4.png' },
  { id:'w5', name:'いなずまの太刀', slot:'weapon', opTier:'sub3', stat:{atk:13}, price:120, cost:6, emoji:'assets/items/w5.png' },
  { id:'w6', name:'まけんグラム', slot:'weapon', opTier:'sub4', stat:{atk:15}, price:140, cost:7, emoji:'assets/items/w6.png' },
  { id:'w7', name:'せいけんエクスカリバー', slot:'weapon', opTier:'mul3', stat:{atk:22}, price:200, cost:10, emoji:'assets/items/w7.png' },
  { id:'w8', name:'りゅうごろしの槍', slot:'weapon', opTier:'div3', stat:{atk:25}, price:230, cost:12, emoji:'assets/items/w8.png' },
  // 防具
  { id:'a1', name:'布の服', slot:'armor', opTier:'add1', stat:{def:2}, price:20, cost:1, emoji:'assets/items/a1.png' },
  { id:'a2', name:'かわの鎧', slot:'armor', opTier:'add2', stat:{def:4}, price:35, cost:2, emoji:'assets/items/a2.png' },
  { id:'a3', name:'くさりかたびら', slot:'armor', opTier:'add3', stat:{def:7}, price:60, cost:3, emoji:'assets/items/a3.png' },
  { id:'a4', name:'てつの鎧', slot:'armor', opTier:'sub3', stat:{def:9}, price:80, cost:4, emoji:'assets/items/a4.png' },
  { id:'a5', name:'ミスリルの鎧', slot:'armor', opTier:'sub4', stat:{def:13}, price:120, cost:6, emoji:'assets/items/a5.png' },
  { id:'a6', name:'せいきしの鎧', slot:'armor', opTier:'mul3', stat:{def:15}, price:140, cost:7, emoji:'assets/items/a6.png' },
  { id:'a7', name:'りゅうりんの鎧', slot:'armor', opTier:'div3', stat:{def:22}, price:200, cost:10, emoji:'assets/items/a7.png' },
  // アクセサリー
  { id:'c1', name:'はやての靴', slot:'accessory', opTier:'add1', stat:{spd:2}, price:20, cost:1, emoji:'assets/items/c1.png' },
  { id:'c2', name:'ぎんの指輪', slot:'accessory', opTier:'add3', stat:{spd:4}, price:35, cost:2, emoji:'assets/items/c2.png' },
  { id:'c3', name:'けんじゃのお守り', slot:'accessory', opTier:'sub3', stat:{mp:8}, price:45, cost:3, emoji:'assets/items/c3.png' },
  { id:'c4', name:'しんそくの首かざり', slot:'accessory', opTier:'mul3', stat:{spd:6, mp:5}, price:90, cost:5, emoji:'assets/items/c4.png' },
  /* おたすけ（ステータスは無いが、けいさん中に まるの絵で もんだいを かしかできる）。
     ぶきスロットに おく ことで、そうびすると こうげき力ボーナスを あきらめる トレードオフに なる */
  { id:'ast1', name:'かぞえだま', slot:'weapon', opTier:'add1', stat:{}, price:30, cost:1, assist:true, emoji:'🧮' },
];

/* 古代装備：しゅぎょうでは てにはいらず、ダンジョンの ドロップや ガチャで
   手に入る「せっけいず」を プリント＆あんごうで かいどくして てにいれる（常に★5でかいどく） */
const ANCIENT_EQUIP_DB = [
  { id:'anc_w1', name:'古代の大剣', slot:'weapon', opTier:'div5', stat:{atk:40}, cost:15, emoji:'assets/items/w7.png' },
  { id:'anc_a1', name:'古代の鎧', slot:'armor', opTier:'div5', stat:{def:35}, cost:13, emoji:'assets/items/a7.png' },
  { id:'anc_c1', name:'古代の指輪', slot:'accessory', opTier:'div5', stat:{spd:12, mp:15}, cost:9, emoji:'assets/items/c2.png' },
  { id:'demon_sword', name:'魔王の覇剣', slot:'weapon', opTier:'elem6', stat:{atk:50}, cost:20, emoji:'assets/items/w6.png' },
];

/* そうびスロットは この3つだけ（ぶき・よろい・アクセサリー） */
const EQUIP_SLOTS = ['weapon', 'armor', 'accessory'];

function getEquipTemplate(id) {
  const base = EQUIP_DB.find(d => d.id === id) || ANCIENT_EQUIP_DB.find(d => d.id === id);
  const custom = customEquips[id];
  return custom ? { ...base, ...custom, stat: { ...base.stat, ...(custom.stat||{}) } } : base;
}

const ITEM_DB = [
  { id:'potion', name:'傷薬', opTier:'add', effect:'heal', value:20, price:15, desc:'HPを回復', emoji:'assets/items/potion.png' },
  { id:'hipotion', name:'秘薬', opTier:'sub', effect:'heal', value:60, price:50, desc:'HPを大きく回復', emoji:'assets/items/hipotion.png' },
  { id:'herb', name:'魔力の草', opTier:'add', effect:'mana', value:10, price:12, desc:'MPを回復', emoji:'assets/items/herb.png' },
  { id:'ether', name:'エーテル', opTier:'addCarry', effect:'mana', value:30, price:40, desc:'MPを大きく回復', emoji:'assets/items/ether.png' },
  { id:'cost_seed', name:'コストプラスのたね', opTier:'mul1', effect:'cost', value:1, price:1000, desc:'使うとそうびコストの上限が 1 あがる 不思議なたね。', emoji:'🌱' }
];

/* 古代装備の せっけいず（プリント専用アイテム。少し難易度高め＝わりざん） */
const BLUEPRINT_DB = [
  { id:'bp_anc_w1', name:'古代の大剣の せっけいず', equipId:'anc_w1', tier:'div5', emoji:'assets/items/blueprint.png' },
  { id:'bp_anc_a1', name:'古代の鎧の せっけいず', equipId:'anc_a1', tier:'div5', emoji:'assets/items/blueprint.png' },
  { id:'bp_anc_c1', name:'古代の指輪の せっけいず', equipId:'anc_c1', tier:'div5', emoji:'assets/items/blueprint.png' },
];

function getItemTemplate(id) {
  const base = ITEM_DB.find(d => d.id === id) || BLUEPRINT_DB.find(d => d.id === id);
  const custom = customItems[id];
  return custom ? { ...base, ...custom } : base;
}

/* レアリティは1〜5（数値）。5が最強。表記は ★の数ではなく 名前で表示する */
const RARITY_MULTI = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 4.2 };
const RARITY_NAME = { 1: 'ノーマル', 2: 'レア', 3: '激レア', 4: '超激レア', 5: 'レジェンド' };
const RARITY_MAX = 5;

function calcEquipStat(baseStat, rarity) {
  const r = RARITY_MULTI[rarity] || 1.0;
  const res = {};
  for(let k in baseStat) res[k] = Math.max(1, Math.floor(baseStat[k] * r));
  return res;
}
function rarityLabelHtml(rarity){
  return `<span class="rarity-label">${RARITY_NAME[rarity] || rarity}</span>`;
}

/* ==========================================================
   そうびの 特殊能力（★3以上で 確率／確定で 付与）
   ========================================================== */
const SPECIAL_ABILITIES = [
  { id:'crit_up', name:'会心のちから', desc:'会心率+10%' },
  { id:'lifesteal', name:'きゅうけつ', desc:'あたえたダメージの15%をHP吸収' },
  { id:'guard', name:'てっぺき', desc:'うけるダメージ-15%' },
  { id:'power', name:'ちからのかご', desc:'こうげき力+15%' },
  { id:'mp_save', name:'せつやくの心得', desc:'とくぎのMPしょうひ-1' },
];
function getAbility(id){ return SPECIAL_ABILITIES.find(a => a.id === id); }
function rollAbility(rarity){
  if (rarity < 3) return null;
  if (rarity === 3 && Math.random() >= 0.5) return null;
  return pick(SPECIAL_ABILITIES).id;
}
/* 現在そうび中の 特殊能力ID の集合 */
function equippedAbilities(){
  const set = new Set();
  for (const slot of EQUIP_SLOTS){
    const eq = G.equipment[slot];
    if (!eq) continue;
    const owned = G.ownedEquips.find(o => o.uid === eq.uid);
    if (owned && owned.ability) set.add(owned.ability);
  }
  return set;
}

/* ==========================================================
   スキルデータ
   ・しゅぎょう ＝ スキルごとの えんざん（skillTier）を trainReq回 せいかいで しゅうとく
   ・せんとう   ＝ その ステージの もんだいが でる（ステージの むずかしさは よけられない）
   ・スキルは MPを つかうので、ダメージは かならず ふつうの こうげきを うわまわる
     （useSkill の「さいていほしょう」を みること）
   ========================================================== */
const SKILL_DB = [
  { id:'renzoku', name:'れんぞく斬り', emoji:'画像/スキル/skill_renzoku.jpg', zone:'tower', mp:3, trainReq:10, reqLvl:1, dmgMult:2.0,
    desc:'すばやく きりつける。こうげき力×2.0' },
  { id:'heal_song', name:'いやしのうた', emoji:'画像/スキル/skill_heal.jpg', zone:'tower', mp:5, trainReq:10, reqLvl:3, healPct:0.35,
    desc:'HPを さいだいHPの35% かいふくする' },
  { id:'honoo', name:'ほのおの剣', emoji:'画像/スキル/skill_honoo.jpg', zone:'dungeon', mp:5, trainReq:10, reqLvl:5, dmgMult:2.6,
    desc:'ほのおを まとった 一げき。こうげき力×2.6' },
  { id:'inazuma', name:'いなずま斬り', emoji:'画像/スキル/skill_inazuma.jpg', zone:'crypt', mp:7, trainReq:10, reqLvl:8, dmgMult:3.2,
    desc:'かみなりの ざんげき。こうげき力×3.2' },
  { id:'gale', name:'しっぷう斬り', emoji:'画像/スキル/skill_gale.jpg', zone:'bandit', mp:4, trainReq:10, reqLvl:10, dmgMult:2.4, ignoreDef:true,
    desc:'かぜの 一げき。こうげき力×2.4＋ぼうぎょむし' },

  /* --- 上位互換スキル（Ⅱ）。おなじジャンルの けいさんだが、
     さいしょから いちばん むずかしい tier（fixedTier）で しゅぎょうする。
     とくてい キャラレベルに 到達すると かいほうされる */
  { id:'renzoku2', name:'れんぞく斬りⅡ', emoji:'画像/スキル/skill_renzoku.jpg', zone:'tower', mp:6, trainReq:10, reqLvl:15, dmgMult:4.0, fixedTier:'add5',
    desc:'れんぞく斬りの じょうい。こうげき力×4.0' },
  { id:'heal_song2', name:'いやしのうたⅡ', emoji:'画像/スキル/skill_heal.jpg', zone:'tower', mp:9, trainReq:10, reqLvl:18, healPct:0.70, fixedTier:'add5',
    desc:'HPを さいだいHPの70% かいふくする' },
  { id:'honoo2', name:'ほのおの剣Ⅱ', emoji:'画像/スキル/skill_honoo.jpg', zone:'dungeon', mp:9, trainReq:10, reqLvl:20, dmgMult:5.0, fixedTier:'sub5',
    desc:'ほのおの剣の じょうい。こうげき力×5.0' },
  { id:'inazuma2', name:'いなずま斬りⅡ', emoji:'画像/スキル/skill_inazuma.jpg', zone:'crypt', mp:11, trainReq:10, reqLvl:23, dmgMult:6.4, fixedTier:'add4',
    desc:'いなずま斬りの じょうい。こうげき力×6.4' },
  { id:'gale2', name:'しっぷう斬りⅡ', emoji:'画像/スキル/skill_gale.jpg', zone:'bandit', mp:8, trainReq:10, reqLvl:25, dmgMult:5.0, ignoreDef:true, fixedTier:'add5',
    desc:'しっぷう斬りの じょうい。こうげき力×5.0＋ぼうぎょむし' },
];
/* スキルに「練度」は ない：しゅぎょうで trainReq回 せいかいすれば そのまま しゅうとく（つかえる状態）に なる。
   G.skills[id].level は 0（未習得）／1（習得ずみ）の 2値だけを つかう（セーブ形式は そのまま流用） */

/* スキルはっどう／しゅぎょうで つかう tier をかえす。
   s.fixedTier が あれば それ（上位互換スキルは そのゾーンで いちばん むずかしい tier）、
   なければ そのゾーンの いちばん やさしい tier（きほんスキル） */
function skillTier(s){
  if (s.fixedTier) return s.fixedTier;
  return ZONE_TIERS[s.zone][0];
}
/* しゅぎょう／プリント／あんごう で つかう tier。
   ふつうのスキル（zoneあり）は skillTier()、
   LEVEL_UP_TRAINING の ような とくべつあつかいは 固定の s.tier を そのまま つかう */
function resolveTrainingTier(s){
  return s.zone ? skillTier(s) : s.tier;
}
function skillIsLearned(s){
  const st = G.skills[s.id];
  return !!(st && st.level >= 1);
}

/* プリントのみの とくべつな しゅぎょう（あんごうが せいかいすると レベルが 5 あがる） */

/* ==========================================================
   ゲーム状態
   ========================================================== */
/* ==========================================================
   セーブデータ（なまえつき・ふくすう枠）
   いまは localStorage に保存しているが、save()/loadSlot()/
   listSaveSlots() の中身だけ差し替えれば、将来 Firestore など
   クラウドの保存先に移行できるように まどぐち関数を分けてある。
   ========================================================== */
const SAVE_PREFIX = 'typing_rpg_save_v3::';
const LEGACY_SAVE_KEY = 'typing_rpg_save_v3';
const LEGACY_OLD_SAVE_KEY = 'typing_rpg_save_v2';

let G = null;
let currentSlotKey = null; // いま えらんでいる セーブ枠の localStorage キー

function newGameState(name){
  return {
    playerName: (name && name.trim()) || 'ぼうけんしゃ',
    updatedAt: Date.now(),
    player: {
      lvl:1, exp:0, points:0,
      maxHp:30, hp:30, maxMp:10, mp:10,
      atk:5, def:3, spd:6, gold:0,
    },
    equipment: { weapon:null, armor:{ uid:1 }, accessory:null },
    ownedEquips: [ { uid:1, id:'a1', rarity:1, ability:null } ],
    nextUid: 2,
    items: [], // [{uid, id, rarity, count}] に変更
    skills: {}, // id → {progress, mastered}
    clears: { tower:false, dungeon:false, crypt:false, bandit:false },
    clearCounts: { tower:0, dungeon:0, crypt:0, bandit:0 }, // ステージの クリアかいすう（0〜3、★の数）
    stageClearCounts: {}, // 新ステージ制（1-1など個別ステージ）ごとの クリアかいすう（areaId → [0〜3, ...]）
    rescued: [],
    printSheetCodes: {}, // skillId → プリントした もんだいの こたえから つくった あんごう
    questBoard: [], // サブクエストボードに ならんでいる ぶんしょうだい
    failTracking: { gameOvers: {}, mistakes: {} }, // 失敗の記録
  };
}

function addItem(id, count = 1) {
  let it = G.items.find(i => i.id === id);
  if (it) {
    it.count += count;
  } else {
    G.items.push({ uid: G.nextUid++, id, count });
  }
}
function removeItem(uid, count = 1) {
  let idx = G.items.findIndex(i => i.uid === uid);
  if (idx >= 0) {
    G.items[idx].count -= count;
    if (G.items[idx].count <= 0) G.items.splice(idx, 1);
  }
}

/* ---- 保存まわりの まどぐち関数 ---- */
function save(){
  if (!currentSlotKey) return;
  G.updatedAt = Date.now();
  storageSet(currentSlotKey, JSON.stringify(G));

  // Firestoreにもバックアップを保存
  if (window._firestoreDb && window._firebaseUid) {
    import("firebase/firestore").then(({ doc, setDoc }) => {
      const docRef = doc(window._firestoreDb, "saves", window._firebaseUid + "_" + currentSlotKey);
      setDoc(docRef, G, { merge: true }).catch(err => {
        console.error("Firestore save failed:", err);
      });
    }).catch(err => console.error("Failed to load firestore:", err));
  }
}

function newSlotId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function createSaveSlot(name){
  currentSlotKey = SAVE_PREFIX + newSlotId();
  G = newGameState(name);
  save();
  return currentSlotKey;
}

/* 旧バージョンの N/R/SR/SSR（文字列）レアリティを ★1〜4（数値）に へんかんする */
const RARITY_LETTER_MAP = { N:1, R:2, SR:3, SSR:4 };
function normalizeRarityData(data){
  if (data.items){
    // アイテム（どうぐ）は レアリティ廃止。ふるいセーブに のこっていたら 消す
    for (const it of data.items){
      delete it.rarity;
    }
  }
  if (data.ownedEquips){
    for (const eq of data.ownedEquips){
      if (typeof eq.rarity === 'string') eq.rarity = RARITY_LETTER_MAP[eq.rarity] || 1;
      if (eq.ability === undefined) eq.ability = null;
    }
  }
  // そうびスロットを ぶき・よろい・アクセサリーの3つに統一。
  // ふるいセーブの head/leg は accessory に ひっこす（両方ついていたら headを優先）
  if (data.equipment){
    if (data.equipment.head !== undefined || data.equipment.leg !== undefined){
      if (data.equipment.accessory === undefined || data.equipment.accessory === null){
        data.equipment.accessory = data.equipment.head || data.equipment.leg || null;
      }
      delete data.equipment.head;
      delete data.equipment.leg;
    }
    if (data.equipment.accessory === undefined) data.equipment.accessory = null;
  }
  // スキルの状態を {progress, mastered} から {level, progress} に統一。
  // マスター済みだった スキルは Lv1（せんとうで つかえる状態）として ひきつぐ
  if (data.skills){
    for (const id in data.skills){
      const st = data.skills[id];
      if (st && typeof st.level !== 'number'){
        st.level = st.mastered ? 1 : 0;
        st.progress = 0;
        delete st.mastered;
      }
    }
  }
  return data;
}

function loadSlot(key){
  const raw = storageGet(key);
  if (!raw) return false;
  try {
    G = normalizeRarityData(JSON.parse(raw));
    if (!G.printSheetCodes) G.printSheetCodes = {};
    if (!G.playerName) G.playerName = 'ぼうけんしゃ';
    if (!G.clears) G.clears = { tower:false, dungeon:false, crypt:false, bandit:false };
    if (!G.clearCounts) {
      // ふるいセーブは クリアずみの ゾーンを ★3（かいほうずみ）として ひきつぐ
      G.clearCounts = {};
      for (const z of ['tower', 'dungeon', 'crypt', 'bandit']) G.clearCounts[z] = G.clears[z] ? 3 : 0;
    }
    if (!G.stageClearCounts) G.stageClearCounts = {};
    if (!G.questBoard) G.questBoard = [];
    currentSlotKey = key;
    return true;
  } catch(e){ return false; }
}

function resolveSaveSlotEquip(data, ref){
  if (!ref || !ref.uid || !data.ownedEquips) return null;
  const owned = data.ownedEquips.find(o => o.uid === ref.uid);
  if (!owned) return null;
  const template = getEquipTemplate(owned.id);
  if (!template) return null;
  return { name: template.name, emoji: template.emoji, rarity: owned.rarity || 1 };
}

function listSaveSlots(){
  const slots = [];
  for (let i = 0; i < storageLen(); i++){
    const key = storageK(i);
    if (!key || !key.startsWith(SAVE_PREFIX)) continue;
    try {
      const data = JSON.parse(storageGet(key));
      slots.push({
        key,
        name: data.playerName || 'ぼうけんしゃ',
        lvl: data.player ? data.player.lvl : 1,
        gold: data.player ? data.player.gold : 0,
        equippedWeapon: data.equipment ? resolveSaveSlotEquip(data, data.equipment.weapon) : null,
        equippedArmor: data.equipment ? resolveSaveSlotEquip(data, data.equipment.armor) : null,
        equippedAccessory: data.equipment ? resolveSaveSlotEquip(data, data.equipment.accessory) : null,
        updatedAt: data.updatedAt || 0,
      });
    } catch(e){}
  }
  slots.sort((a, b) => b.updatedAt - a.updatedAt);
  return slots;
}

/* 旧バージョン（単一セーブ枠）からの ひっこし。あたらしい形式の
   セーブ枠が ひとつも なければ 一度だけ じっこうする。 */
function migrateLegacySaveIfNeeded(){
  if (listSaveSlots().length > 0) return;

  let legacyRaw = storageGet(LEGACY_SAVE_KEY);
  let migratingFromV2 = false;
  if (!legacyRaw) {
    legacyRaw = storageGet(LEGACY_OLD_SAVE_KEY);
    migratingFromV2 = true;
  }
  if (!legacyRaw) return;

  try {
    const data = JSON.parse(legacyRaw);
    if (migratingFromV2) {
      let newItems = [];
      for (let k in data.items) {
        if (data.items[k] > 0) {
          newItems.push({ uid: data.nextUid++, id: k, count: data.items[k] });
        }
      }
      data.items = newItems;
      for (let eq of data.ownedEquips) {
        let base = EQUIP_DB.find(d => d.id === eq.id);
        eq.rarity = eq.rarity || (base ? base.rarity : 'N') || 'N';
      }
    }
    if (!data.printSheetCodes) data.printSheetCodes = {};
    if (!data.playerName) data.playerName = 'ぼうけんしゃ';
    if (!data.updatedAt) data.updatedAt = Date.now();
    normalizeRarityData(data);
    storageSet(SAVE_PREFIX + newSlotId(), JSON.stringify(data));
    storageRemove(LEGACY_SAVE_KEY);
    storageRemove(LEGACY_OLD_SAVE_KEY);
  } catch(e){}
}

/* 装備込みの実効ステータス */
function equipBonus(){
  const b = { atk:0, def:0, spd:0, mp:0, hp:0 };
  for (const slot of EQUIP_SLOTS){
    const eq = G.equipment[slot];
    if (!eq) continue;
    const owned = G.ownedEquips.find(o => o.uid === eq.uid);
    if (!owned) continue;
    const db = getEquipTemplate(owned.id);
    if (!db) continue;
    const stat = calcEquipStat(db.stat, owned.rarity);
    for (const k in stat) b[k] += stat[k];
  }
  return b;
}

/* ==========================================================
   そうびコスト（レベル＝そうびできる合計コスト上限）
   ========================================================== */
function equipCost(db, rarity){
  return Math.max(1, Math.ceil((db.cost || 1) * (RARITY_MULTI[rarity] || 1)));
}
function costCap(){
  return Math.max(1, G.player.lvl) + (G.player.costPlus || 0);
}
/* 現在そうび中の合計コスト。excludeSlot を指定すると そのスロットぶんを除いて計算する
   （＝そのスロットに 別のそうびへ 付け替える時の判定に使う） */
function usedCost(excludeSlot){
  let total = 0;
  for (const slot of EQUIP_SLOTS){
    if (slot === excludeSlot) continue;
    const eq = G.equipment[slot];
    if (!eq) continue;
    const owned = G.ownedEquips.find(o => o.uid === eq.uid);
    if (!owned) continue;
    const db = getEquipTemplate(owned.id);
    if (!db) continue;
    total += equipCost(db, owned.rarity);
  }
  return total;
}
function totalStat(key){ return (G.player[key] || 0) + (equipBonus()[key] || 0); }
function totalMaxHp(){ return G.player.maxHp + equipBonus().hp; }
function totalMaxMp(){ return G.player.maxMp + equipBonus().mp; }

/* ==========================================================
   画面管理
   ========================================================== */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  updateHud();

  // セーブデータを読み込んでいない間はメニューを隠す（「きょてんに もどる」がGを前提とするため）
  const menuContainer = $('menu-container');
  if (menuContainer) {
    menuContainer.classList.toggle('hidden', id === 'screen-title' || !G);
    $('menu-dropdown').classList.add('hidden');
  }

  // 背景は常に単色（画像なし）
  document.body.style.backgroundImage = 'none';
  document.body.style.background = 'linear-gradient(135deg, #1a1626 0%, #2b2140 100%)';
  document.body.style.backgroundAttachment = 'fixed';

  // 画面ごとのBGM。バトルはステージBGM、自分の部屋は専用BGM、
  // それいがいは（個別に BGM 設定していない画面もふくめ）ぜんぶ 拠点BGMを流す
  if (SM.initialized) SM.playBGM(bgmKeyForScreen(id));

  if (typeof checkTimeLimit === 'function') checkTimeLimit();
}

function bgmKeyForScreen(id){
  /* タイトルと、そこから ひらく「あたらしく はじめる」「セーブデータ せんたく」は タイトル専用BGM
     （セーブえらびや 名前入力の とちゅうで きょくが きりかわらないように、タイトルのBGMを流しっぱなしにする） */
  if (id === 'screen-title' || id === 'screen-new-save' || id === 'screen-load-save') return 'bgm_title';
  if (id === 'screen-admin' && (!currentSlotKey || !G)) return 'bgm_title';
  if (id === 'screen-status' || id === 'screen-equipment') return 'bgm_room';
  if (id === 'screen-battle') return 'bgm_stage1';
  if (id === 'screen-training') return 'bgm_training';
  return 'bgm_home';
}

function updateHud(){
  if (!G) return;
  const p = G.player;

  // バトル画面と拠点のステータスウィンドウ更新
  ['battle', 'home'].forEach(prefix => {
    const nameEl = $(`${prefix}-player-name`);
    const lvEl = $(`${prefix}-player-lv`);
    const goldEl = $(`${prefix}-player-gold`);
    const hpEl = $(`${prefix}-player-hp`);
    const hpGhostEl = $(`${prefix}-player-hp-ghost`);
    const mpEl = $(`${prefix}-player-mp`);
    const mpGhostEl = $(`${prefix}-player-mp-ghost`);
    const expEl = $(`${prefix}-player-exp`);
    const atbEl = $(`${prefix}-player-atb`);
    const hpContainer = $(`${prefix}-player-window`) ? $(`${prefix}-player-window`).querySelector('.hp-bar-container') : null;
    const mpContainer = $(`${prefix}-player-window`) ? $(`${prefix}-player-window`).querySelector('.mp-bar-container') : null;
    const hpNumEl = $(`${prefix}-player-hp-num`);
    const hpMaxEl = $(`${prefix}-player-hp-max`);
    const mpNumEl = $(`${prefix}-player-mp-num`);
    const mpMaxEl = $(`${prefix}-player-mp-max`);
    const expNumEl = $(`${prefix}-player-exp-num`);
    const expMaxEl = $(`${prefix}-player-exp-max`);

    if (nameEl) nameEl.textContent = G.playerName || 'ゆうしゃ';
    if (lvEl) lvEl.textContent = 'Lv' + p.lvl;
    if (goldEl) goldEl.textContent = p.gold;

    // HP: バーの長さを数値に比例させる（スケール係数: 2px per 1 HP）
    const hpScale = 2;
    if (hpNumEl) hpNumEl.textContent = p.hp;
    if (hpMaxEl) hpMaxEl.textContent = p.maxHp;
    if (hpContainer) hpContainer.style.width = (p.maxHp * hpScale) + 'px';
    if (hpEl) hpEl.style.width = (p.hp * hpScale) + 'px';
    if (hpGhostEl) hpGhostEl.style.width = (p.hp * hpScale) + 'px';

    // MP: バーの長さを数値に比例させる（スケール係数: 2px per 1 MP）
    const mpScale = 2;
    if (mpNumEl) mpNumEl.textContent = p.mp;
    if (mpMaxEl) mpMaxEl.textContent = p.maxMp;
    if (mpContainer) mpContainer.style.width = (p.maxMp * mpScale) + 'px';
    if (mpEl) mpEl.style.width = (p.mp * mpScale) + 'px';
    if (mpGhostEl) mpGhostEl.style.width = (p.mp * mpScale) + 'px';

    // けいけんち: 次のレベルまでに必要な量に対する割合（%）で表示
    const expNeed = expNext(p.lvl);
    if (expNumEl) expNumEl.textContent = p.exp;
    if (expMaxEl) expMaxEl.textContent = expNeed;
    if (expEl) expEl.style.width = `${Math.min(100, p.exp / expNeed * 100)}%`;

    // ATB: パーセンテージで表示（0-100）
    if (atbEl) atbEl.style.width = (p.atb / 100 * 100) + '%';
  });

  renderHomeEquipIcons();
}

/* 拠点ステータスウィンドウの よこに そうび中アイテムを アイコン表示 */
const HOME_EQUIP_SLOT_ORDER = EQUIP_SLOTS;
const HOME_EQUIP_SLOT_EMPTY_ICON = { weapon:'⚔️', armor:'🛡️', accessory:'💍' };
function renderHomeEquipIcons(){
  const box = $('home-equip-icons');
  if (!box) return;
  box.innerHTML = '';
  for (const slot of HOME_EQUIP_SLOT_ORDER){
    const el = document.createElement('div');
    el.className = 'town-equip-icon-slot';
    const eq = G.equipment[slot];
    const owned = eq ? G.ownedEquips.find(o => o.uid === eq.uid) : null;
    const db = owned ? getEquipTemplate(owned.id) : null;
    if (db){
      el.classList.add(`rarity-${owned.rarity}`);
      el.innerHTML = db.emoji && db.emoji.indexOf('/') >= 0
        ? `<img src="${av(db.emoji)}" alt="">`
        : `<span class="town-equip-icon-emoji">${db.emoji || '🎁'}</span>`;
      el.title = `${SLOT_LABELS[slot] || slot}: ${db.name}`;
    } else {
      el.innerHTML = `<span class="town-equip-icon-empty">${HOME_EQUIP_SLOT_EMPTY_ICON[slot] || '？'}</span>`;
      el.title = `${SLOT_LABELS[slot] || slot}: 未装備`;
    }
    box.appendChild(el);
  }
}

function logTo(id, html){
  const box = $(id);
  const div = document.createElement('div');
  div.innerHTML = html;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ==========================================================
   おたすけ（アシスト）：どれかの そうびスロットに assist:true の そうびを
   つけていると、けいさんの もんだいを まるの絵で かしかする
   ========================================================== */
function hasAssist(){
  for (const slot of EQUIP_SLOTS){
    const eq = G.equipment[slot];
    if (!eq) continue;
    const owned = G.ownedEquips.find(o => o.uid === eq.uid);
    if (!owned) continue;
    const db = getEquipTemplate(owned.id);
    if (db && db.assist) return true;
  }
  return false;
}

function assistVisualHtml(problem){
  const { a, b, op } = problem;
  const dots = (n) => '<span class="assist-dot"></span>'.repeat(n);
  if (op === '+') {
    return `<div class="assist-visual">
      <span class="assist-group">${dots(a)}</span>
      <span class="assist-op">+</span>
      <span class="assist-group">${dots(b)}</span>
    </div>`;
  }
  if (op === '-') {
    // a個のまるの うち、うしろのb個を うすくして「ひく」イメージにする
    let d = '';
    for (let i = 0; i < a; i++){
      d += `<span class="assist-dot${i >= a - b ? ' assist-dot-remove' : ''}"></span>`;
    }
    return `<div class="assist-visual"><span class="assist-group">${d}</span></div>`;
  }
  if (op === '×') {
    // a行 × b列の まる
    let rows = '';
    for (let i = 0; i < a; i++) rows += `<div class="assist-row">${dots(b)}</div>`;
    return `<div class="assist-visual assist-grid">${p1}${p2}</div>`;
  }
  if (op === '÷') {
    // a個のまるを bこずつの グループに わける
    let groups = '';
    for (let i = 0; i < a; i += b) groups += `<span class="assist-group">${dots(Math.min(b, a - i))}</span>`;
    return `<div class="assist-visual">${groups}</div>`;
  }
  return '';
}

/* ==========================================================
   けいさんチャレンジエンジン
   opts: { problem:{a,b,op,answer,text,tier}, timeLimit(ms), prompt }
   cb(result): { success, timeFrac }
   ========================================================== */
let currentChallenge = null;

function isKanjiProblem(problem) {
  if (!problem) return false;
  if (problem.tier && String(problem.tier).startsWith('kanji')) return true;
  if (explore && explore.areaId && ['area5','area6','area7','area8','area9','area10'].includes(explore.areaId)) return true;
  return false;
}

function startChallenge(container, opts, cb){
  destroyChallenge();
  const timeLimit = opts.timeLimit || 8000;
  const problem = opts.problem;

  // --- 漢字問題の場合 ---
  if (isKanjiProblem(problem)) {
    if (container) container.classList.add('hidden');
    const calcCenter = $('calc-problem-center');
    if (calcCenter) calcCenter.classList.add('hidden');

    const kanjiCenter = $('kanji-problem-center');
    const kanjiChallenge = $('kanji-challenge');
    if (kanjiCenter) kanjiCenter.classList.remove('hidden');
    if (kanjiChallenge) kanjiChallenge.classList.remove('hidden');

    const promptEl = $('kanji-prompt');
    if (promptEl) {
      if (opts.prompt) {
        promptEl.textContent = opts.prompt;
        promptEl.classList.remove('hidden');
      } else {
        promptEl.classList.add('hidden');
      }
    }

    const start = Date.now();
    let done = false;

    // 漢字入力UIを初期化＆問題セット
    if (typeof initKanjiInputUI === 'function') {
      initKanjiInputUI((isCorrect) => {
        if (done) return;
        done = true;
        recordStudyAnswer(problem, isCorrect);
        const elapsed = Date.now() - start;
        const timeFrac = Math.max(0, 1 - elapsed / timeLimit);
        if (isCorrect) {
          SM.play('se_type');
        } else {
          SM.playBeep('error');
        }
        currentChallenge = null;
        setTimeout(() => {
          if (kanjiCenter) kanjiCenter.classList.add('hidden');
          if (kanjiChallenge) kanjiChallenge.classList.add('hidden');
          cb({ success: isCorrect, timeFrac });
        }, 450);
      });
    }

    if (typeof setupKanjiChallenge === 'function') {
      setupKanjiChallenge(problem);
    }

    currentChallenge = {
      destroy() {
        done = true;
        if (kanjiCenter) kanjiCenter.classList.add('hidden');
        if (kanjiChallenge) kanjiChallenge.classList.add('hidden');
      }
    };
    return;
  }

  // --- 算数問題の場合 ---
  const kanjiCenter = $('kanji-problem-center');
  const kanjiChallenge = $('kanji-challenge');
  if (kanjiCenter) kanjiCenter.classList.add('hidden');
  if (kanjiChallenge) kanjiChallenge.classList.add('hidden');
  const calcCenter = $('calc-problem-center');
  if (calcCenter) calcCenter.classList.add('hidden');

  const answerStr = String(problem.answer);
  const assistHtml = hasAssist() ? assistVisualHtml(problem) : '';
  const equationJoin = problem.isWordProblem ? '<br><span class="challenge-answer-arrow">こたえ→</span> ' : ' = ';

  const challengeMainHTML = `
    <div class="challenge-main">
      <div class="challenge-prompt">${opts.prompt || 'けいさんの こたえを にゅうりょく！'}</div>
      <div class="challenge-problem${problem.isWordProblem ? ' challenge-problem-word' : ''}">${problem.text}${equationJoin}<span class="challenge-word" id="ch-word">？</span></div>
      ${assistHtml}
      <form id="ch-form" autocomplete="off">
        <input type="text" inputmode="numeric" id="ch-input" class="challenge-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" autofocus>
        <button type="submit" id="ch-submit" class="btn btn-primary challenge-submit-btn">けってい</button>
      </form>
      <p class="result-text"></p>
    </div>
  `;

  if (opts.showBattleCommands) {
    container.innerHTML = `
      <div class="challenge-body">
        ${challengeMainHTML}
        <div class="battle-inline-commands">
          <button id="btn-inline-skill" class="btn">とくぎ</button>
          <button id="btn-inline-item" class="btn">どうぐ</button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = challengeMainHTML;
  }
  container.classList.remove('hidden');

  if (opts.showBattleCommands) {
    $('btn-inline-skill').onclick = openSkillMenu;
    $('btn-inline-item').onclick = openItemMenu;
  }

  const input = $('ch-input');
  const wordEl = $('ch-word');
  const resultEl = container.querySelector('.result-text');
  const submitBtn = $('ch-submit');

  function renderTyped(){
    if (wordEl) {
      wordEl.textContent = input && input.value.length ? input.value : '？';
      wordEl.className = 'challenge-word';
    }
  }
  renderTyped();
  if (input) setTimeout(() => input.focus(), 50);

  const start = Date.now();
  let done = false;
  let lastLen = 0;

  function finish(success){
    if (done) return;
    done = true;
    recordStudyAnswer(problem, success);
    if (input) input.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
    const elapsed = Date.now() - start;
    const timeFrac = Math.max(0, 1 - elapsed / timeLimit);
    if (success) {
      if (wordEl) {
        wordEl.textContent = answerStr;
        wordEl.className = 'challenge-word done';
      }
      if (resultEl) {
        // Leave the inner result empty so the window doesn't resize.
        // We rely on the floating showResultOverlay for "正解！！"
        resultEl.textContent = '';
        resultEl.className = 'result-text';
      }
      SM.play('se_type');
    } else {
      if (wordEl) wordEl.className = 'challenge-word wrong';
      if (resultEl) {
        resultEl.textContent = `ちがう…（こたえは ${answerStr}）`;
        resultEl.className = 'result-text bad';
      }
      SM.playBeep('error');
    }
    if (typeof window.showResultOverlay === 'function') window.showResultOverlay(success);
    currentChallenge = null;
    setTimeout(() => {
      if (calcCenter) calcCenter.classList.add('hidden');
      cb({ success, timeFrac });
    }, 450);
  }

  function trySubmit(){
    if (done) return;
    if (input.value.length === 0){
      input.classList.remove('flash-ng'); void input.offsetWidth;
      input.classList.add('flash-ng');
      return;
    }
    finish(input.value.trim() === answerStr.trim());
  }

  if (input) {
    input.addEventListener('input', () => {
      if (done) return;
      const before = input.value;
      let v = toHalfWidth(before).replace(/[^0-9./:%-]/g, '');
      if (v !== before){
        input.value = v;
      }
      if (v.length > lastLen) SM.playBeep('type');
      lastLen = v.length;
      renderTyped();
    });

    input.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter' || e.keyCode === 13 || e.which === 13){
        e.preventDefault();
        trySubmit();
      }
    });
  }

  const form = $('ch-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      trySubmit();
    });
  }

  currentChallenge = {
    destroy(){
      done = true;
      if (calcCenter) calcCenter.classList.add('hidden');
      container.innerHTML = '';
      container.classList.add('hidden');
    }
  };
}

function destroyChallenge(){
  if (currentChallenge){ currentChallenge.destroy(); currentChallenge = null; }
}

/* ==========================================================
   探索（草原・沼地）：入ったら即バトル、倒したら次の階へ
   ========================================================== */
let explore = null; // {zone, floor}

const ZONE_NAMES = { tower:'草原', dungeon:'沼地', crypt:'地下ダンジョン', bandit:'盗賊のアジト' };
function zoneName(zone){ return ZONE_NAMES[zone] || zone; }
function floorLabel(zone, floor){ return `${floor}かい`; }
function floorLabelHTML(zone, floor){ return `<span id="floor-num">${floor}</span>かい`; }

/* 戦闘背景（画像/ステージ/戦闘背景）。ゾーンとフロアに応じて切り替える */
const BATTLE_BG_DIR = '画像/ステージ/戦闘背景/';
const DUNGEON_BG_BY_FLOOR = { 1:'沼地１', 2:'沼地１', 3:'沼地２', 4:'沼地２', 6:'沼地４', 7:'沼地４', 8:'沼地５', 9:'沼地５' };
function battleBgFor(zone, floor){
  if (zone === 'tower') return `${BATTLE_BG_DIR}草原.png`;
  if (zone === 'crypt') return `${BATTLE_BG_DIR}洞窟.png`;
  if (zone === 'bandit') return `${BATTLE_BG_DIR}盗賊のアジト.png`;
  if (zone === 'dungeon') {
    if (floor === 5) return `${BATTLE_BG_DIR}沼地ボス.png`;
    if (floor === 10) return `${BATTLE_BG_DIR}沼地裏.png`;
    return `${BATTLE_BG_DIR}${DUNGEON_BG_BY_FLOOR[floor] || '沼地１'}.png`;
  }
  return null;
}

/* 草原エリア内の じゅんばん：草原 → 地下ダンジョン → 盗賊のアジト。
   まえの ステージを クリアしないと つぎには すすめない */
const GRASS_AREA_ORDER = ['tower', 'crypt', 'bandit'];
const STAGE_STARS_TO_UNLOCK_NEXT = 3;
function isGrassStageUnlocked(zone){
  const idx = GRASS_AREA_ORDER.indexOf(zone);
  if (idx <= 0) return true;
  return (G.clearCounts[GRASS_AREA_ORDER[idx - 1]] || 0) >= STAGE_STARS_TO_UNLOCK_NEXT;
}
function zoneStarsHtml(zone){
  const count = Math.min(STAGE_STARS_TO_UNLOCK_NEXT, G.clearCounts[zone] || 0);
  return '★'.repeat(count) + '☆'.repeat(STAGE_STARS_TO_UNLOCK_NEXT - count);
}

function enterZone(zone){
  if (!isGrassStageUnlocked(zone)) return;
  explore = { zone, floor:1, sessionDrops: [], sessionGold: 0 };
  startBattle(false);
}

/* ==========================================================
   バトル（素早さバー / ATB）
   ========================================================== */
let battle = null;

function startBattle(animateFloor){
  const isStageMode = !!explore.stageMode;
  const enemy = isStageMode
    ? generateStageEnemy(explore.areaId, explore.stageIndex, explore.isBoss)
    : generateEnemy(explore.zone, explore.floor);
  battle = {
    enemy,
    pGauge: rnd(0, 30), eGauge: rnd(0, 30),
    running: false,
    tickId: null,
    over: false,
  };
  showScreen('screen-battle');
  const bg = isStageMode
    ? stageBattleBg(explore.areaId, explore.stageIndex, explore.isBoss)
    : battleBgFor(explore.zone, explore.floor);
  $('screen-battle').style.backgroundImage = bg ? `url("${av(bg)}")` : 'none';
  $('battle-floor-title').innerHTML = isStageMode
    ? stageBattleTitleHtml(explore.areaId, explore.stageIndex, explore.isBoss, explore.bossPhase, explore.stageKillCount)
    : `${zoneName(explore.zone)} ${floorLabelHTML(explore.zone, explore.floor)}／10（${OP_LABELS[opTierForZoneFloor(explore.zone, explore.floor)]}）`;
  if (animateFloor){
    const numEl = $('floor-num');
    if (numEl){ numEl.classList.remove('floor-num-pop'); void numEl.offsetWidth; numEl.classList.add('floor-num-pop'); }
  }
  $('battle-log').innerHTML = '';
  $('battle-enemy-name').textContent = enemy.name;
  $('atb-compare-player-name').textContent = G.playerName || 'ゆうしゃ';
  $('atb-compare-enemy-name').textContent = enemy.name;
  const sprite = $('battle-enemy-emoji');
  sprite.className = 'enemy-sprite'; // 初期化
  if (enemy.emoji.startsWith('http') || enemy.emoji.startsWith('data:') || enemy.emoji.includes('.png')) {
    sprite.innerHTML = `<img src="${av(enemy.emoji)}" alt="enemy">`;
  } else {
    sprite.textContent = enemy.emoji;
  }
  $('battle-player-lv').textContent = `Lv${G.player.lvl}`;
  hideBattleMenus();
  blog(`<span class="bad">${enemy.name}</span>が あらわれた！`);
  updateBattleBars();
  battle.running = true;
  battle.tickId = setInterval(battleTick, 80);
  CM.start();
  if (explore && explore.stageMode && !explore.isBoss && explore.stageKillCount === 0) {
    // ステージ突入時に「1 / 10」を表示
    showKillProgressPopup(1, 1, ENEMIES_PER_STAGE);
  }
}

function blog(html){ logTo('battle-log', html); }

function updateBattleBars(){
  const p = G.player, e = battle.enemy;
  $('battle-player-hp').style.width = `${Math.max(0, p.hp / totalMaxHp() * 100)}%`;
  $('battle-player-mp').style.width = `${Math.max(0, p.mp / totalMaxMp() * 100)}%`;
  $('battle-player-atb').style.width = `${battle.pGauge}%`;
  const enemyHpPct = `${Math.max(0, e.hp / e.maxHp * 100)}%`;
  $('battle-enemy-hp').style.width = enemyHpPct;
  $('battle-enemy-hp-ghost').style.width = enemyHpPct;
  $('battle-enemy-atb').style.width = `${battle.eGauge}%`;
  updateHud();
}

function battleTick(){
  if (!battle || !battle.running || battle.over) return;
  battle.pGauge += (2 + totalStat('spd') * 0.55);
  battle.eGauge += (2 + battle.enemy.spd * 0.55);
  if (battle.pGauge >= 100){
    battle.pGauge = 100;
    battle.running = false;
    updateBattleBars();
    openActionMenu();
    return;
  }
  if (battle.eGauge >= 100){
    battle.eGauge = 100;
    battle.running = false;
    updateBattleBars();
    setTimeout(enemyAct, 400);
    return;
  }
  updateBattleBars();
}

function hideBattleMenus(){
  const am = $('battle-action-menu');
  if (am) am.classList.add('hidden');
  $('battle-sub-menu').classList.add('hidden');
  $('battle-sub-menu').innerHTML = '';
  destroyChallenge();
  $('battle-challenge').classList.add('hidden');
  if ($('calc-problem-center')) $('calc-problem-center').classList.add('hidden');
  if ($('kanji-problem-center')) $('kanji-problem-center').classList.add('hidden');
  if ($('kanji-challenge')) $('kanji-challenge').classList.add('hidden');
}

function openActionMenu(){
  hideBattleMenus();
  doAttack();
}

function resumeBattle(actor){
  if (battle.over) return;
  // 行動した側だけゲージをリセット。もう片方のゲージは溜まり具合を
  // 持ち越す（すばやさが高いほど連続で行動できる、本来のATB挙動）
  if (actor === 'player') battle.pGauge = 0;
  else battle.eGauge = 0;
  hideBattleMenus();
  updateBattleBars();
  battle.running = true;
}

/* --- 戦う：即けいさん --- */
/* そうびの特殊能力「ちからのかご」ぶんの こうげき力ブースト込みATK */
function effectiveAtk(){
  const mult = equippedAbilities().has('power') ? 1.15 : 1;
  return Math.round(totalStat('atk') * mult);
}
/* そうびの特殊能力「せつやくの心得」ぶん MPしょうひを1へらす（最低1） */
function skillMpCost(s){
  return Math.max(1, s.mp - (equippedAbilities().has('mp_save') ? 1 : 0));
}

/* こたえを まちがえた時の「ちょっとのダメージ」の わりあい（通常ダメージの20%・さいてい1） */
const MISS_DAMAGE_RATIO = 0.2;

/* ==========================================================
   せんとうバランスの すうち（ここだけ さわれば つよさを ちょうせいできる）
   ※ スキルは「MPを つかう」ぶん、かならず ふつうの こうげきより つよく なるように している
   ========================================================== */
const BALANCE = {
  atkMinRatio:     0.3,   // ぼうぎょが かたい あいてでも これだけは とおる（こうげき力に たいする わりあい）
  timeBonus:       0.2,   // はやく こたえたときの ダメージボーナス（さいだい +20%）
  missDamageRatio: MISS_DAMAGE_RATIO,
  critRate:        0.15,  // ふつうの こうげきの かいしんりつ
  skillCritRate:   0.18,  // スキルの かいしんりつ（ふつうより ちょっと たかい）
  critMult:        2.0,
  missGaugePenalty: 15,   // しっぱいすると てきの すばやさバーが すこし すすむ
};

/* ふつうの こうげきの きほんダメージ。スキルの「さいていほしょう」にも つかう */
function basicAttackDamage(atk, eDef){
  return Math.max(1, Math.round(Math.max(atk * BALANCE.atkMinRatio, atk - eDef)));
}

/* こたえを まちがえた ときの ペナルティ：てきの すばやさバーが すこし すすむ */
function applyMissPenalty(){
  if (!battle || battle.over) return;
  battle.eGauge = Math.min(100, battle.eGauge + BALANCE.missGaugePenalty);
  updateBattleBars();
}

/* 新ステージモードなら エリア／ステージ（またはボスのフェーズ）に ひもづく もんだいを、
   きゅうシステム（ゾーン／フロア）なら これまでどおり opTierForZoneFloor から もんだいを つくる */
function currentAttackProblem(){
  if (explore.stageMode){
    const area = AREA_STAGES[explore.areaId];
    if (explore.isBoss){
      const problem = explore.bossPhase === 2 ? area.bossPhase2Problem() : area.bossPhase1Problem();
      const timeLimit = explore.bossPhase === 2 ? area.bossTimeLimit2 : area.bossTimeLimit1;
      return { problem, timeLimit };
    }
    const stage = area.stages[explore.stageIndex];
    return { problem: stage.generateProblem(), timeLimit: stage.timeLimit };
  }
  const tier = opTierForZoneFloor(explore.zone, explore.floor);
  return { problem: generateProblem(tier), timeLimit: problemTimeLimit(tier) };
}

function doAttack(){
  const { problem, timeLimit } = currentAttackProblem();
  startChallenge($('battle-challenge'),
    { problem, timeLimit, prompt: 'こうげき！ けいさんの こたえを にゅうりょく！', showBattleCommands: true },
    (res) => {
      destroyChallenge();
      const atk = effectiveAtk();
      const eDef = battle.enemy.def || 0;
      const base = basicAttackDamage(atk, eDef);
      if (res.success){
        let dmg = Math.round(base * (1 + res.timeFrac * BALANCE.timeBonus));
        // クリティカル判定（「会心のちから」で +10%）
        const critChance = BALANCE.critRate + (equippedAbilities().has('crit_up') ? 0.10 : 0);
        const isCrit = Math.random() < critChance;
        if (isCrit) dmg = Math.floor(dmg * BALANCE.critMult);
        dealToEnemy(dmg, 'こうげき', isCrit, () => afterPlayerAction());
      } else {
        const chip = Math.max(1, Math.round(base * 0.3));
        dealToEnemy(chip, 'あわてた こうげき', false, () => afterPlayerAction());
      }
    });
}

/* --- スキル --- */
function openSkillMenu(){
  destroyChallenge();
  const sub = $('battle-sub-menu');
  sub.innerHTML = '';
  const title = document.createElement('h3');
  title.style.margin = '0 0 10px';
  title.style.color = 'var(--accent)';
  title.style.fontSize = '17px';
  title.textContent = '✨ つかう とくぎを えらぼう';
  sub.appendChild(title);

  const usable = SKILL_DB.filter(s => G.skills[s.id] && G.skills[s.id].level >= 1);
  if (usable.length === 0){
    const d = document.createElement('div');
    d.className = 'flavor';
    d.style.margin = '10px 0';
    d.textContent = 'つかえる とくぎが ない。きょてんの「修練場」で しゅぎょうしよう！';
    sub.appendChild(d);
  } else {
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';
    for (const s of usable){
      const cost = skillMpCost(s);
      const b = document.createElement('button');
      b.className = 'btn';
      b.style.display = 'flex';
      b.style.justifyContent = 'space-between';
      b.style.alignItems = 'center';
      b.style.padding = '10px 16px';
      b.innerHTML = `<strong>${s.name}</strong> <span style="font-size:13px; color:#f1c40f;">MP ${cost}</span> <small style="color:var(--text-light);">${s.desc}</small>`;
      b.disabled = G.player.mp < cost;
      b.onclick = () => useSkill(s);
      list.appendChild(b);
    }
    sub.appendChild(list);
  }
  const bBack = document.createElement('button');
  bBack.className = 'btn';
  bBack.style.marginTop = '12px';
  bBack.textContent = 'もどる';
  bBack.onclick = openActionMenu;
  sub.appendChild(bBack);
  sub.classList.remove('hidden');
}

function useSkill(s){
  $('battle-sub-menu').classList.add('hidden');
  const cost = skillMpCost(s);
  G.player.mp -= cost;
  updateBattleBars();
  
  const { problem, timeLimit } = currentAttackProblem();
  startChallenge($('battle-challenge'),
    { problem, timeLimit,
      showBattleCommands: true,
      promptInKanji: true,
      prompt:`✨ ${s.name}！ こたえて はつどう！` },
    (res) => {
      destroyChallenge();
      if (s.healPct){
        if (!res.success){
          blog(`<span class="bad">しかし ${s.name}は はつどうしなかった！（MP${cost}）</span>`);
          applyMissPenalty();
          afterPlayerAction();
          return;
        }
        const heal = Math.round(totalMaxHp() * s.healPct);
        G.player.hp = Math.min(totalMaxHp(), G.player.hp + heal);
        blog(`<span class="good">${s.name}！ HPが ${heal} かいふくした！</span>`);
        afterPlayerAction();
        return;
      }
      const atk = effectiveAtk();
      const eDef = s.ignoreDef ? 0 : (battle.enemy.def || 0);
      const raw = atk * (s.dmgMult || 1);
      let dmg = Math.max(1, Math.round(Math.max(raw * BALANCE.atkMinRatio, raw - eDef)));
      /* スキルも「はやく こたえた」ボーナスを うける（ふつうの こうげきと おなじ +さいだい20%） */
      dmg = Math.round(dmg * (1 + res.timeFrac * BALANCE.timeBonus));
      /* ★MPを つかう スキルが ふつうの こうげきより よわく なる ことは ぜったいに ない ようにする
         （ぼうぎょの たかい てきに あたっても スキルの ほうが かならず うわまわる） */
      dmg = Math.max(dmg, basicAttackDamage(atk, battle.enemy.def || 0) + 1);
      if (!res.success){
        const chip = Math.max(1, Math.round(dmg * BALANCE.missDamageRatio));
        blog(`<span class="bad">${s.name}は ふかんぜんに はつどうした…（MP${cost}）</span>`);
        applyMissPenalty();
        dealToEnemy(chip, s.name, false, () => afterPlayerAction(), s.id);
        return;
      }
      // スキルでもクリティカル
      const critChance = BALANCE.skillCritRate + (equippedAbilities().has('crit_up') ? 0.08 : 0);
      const isCrit = Math.random() < critChance;
      if (isCrit) dmg = Math.floor(dmg * BALANCE.critMult);
      dealToEnemy(dmg, s.name, isCrit, () => afterPlayerAction(), s.id);
    });
}

/* --- アイテム --- */
function openItemMenu(){
  destroyChallenge();
  const sub = $('battle-sub-menu');
  sub.innerHTML = '';
  const title = document.createElement('h3');
  title.style.margin = '0 0 10px';
  title.style.color = 'var(--accent)';
  title.style.fontSize = '17px';
  title.textContent = '🧪 つかう どうぐを えらぼう';
  sub.appendChild(title);

  let any = false;
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '8px';

  for (const it of G.items){
    const db = getItemTemplate(it.id);
    if (!db) continue;
    any = true;
    const b = document.createElement('button');
    b.className = 'btn';
    b.style.display = 'flex';
    b.style.justifyContent = 'space-between';
    b.style.alignItems = 'center';
    b.style.padding = '10px 16px';
    b.innerHTML = `<strong>${db.name} ×${it.count}</strong> <small style="color:var(--text-light);">${db.desc} (効果:${db.value})</small>`;
    b.onclick = () => {
      useItem(it.uid, db);
      blog(`<span class="good">ゆうしゃは ${db.name}を つかった！</span>`);
      updateBattleBars();
      afterPlayerAction();
    };
    list.appendChild(b);
  }
  if (!any){
    const d = document.createElement('div');
    d.className = 'flavor';
    d.style.margin = '10px 0';
    d.textContent = 'どうぐを もっていない…';
    sub.appendChild(d);
  } else {
    sub.appendChild(list);
  }
  const bBack = document.createElement('button');
  bBack.className = 'btn';
  bBack.style.marginTop = '12px';
  bBack.textContent = 'もどる';
  bBack.onclick = openActionMenu;
  sub.appendChild(bBack);
  sub.classList.remove('hidden');
}

function useItem(uid, db){
  removeItem(uid, 1);
  if (db.effect === 'heal') G.player.hp = Math.min(totalMaxHp(), G.player.hp + db.value);
  if (db.effect === 'mana') G.player.mp = Math.min(totalMaxMp(), G.player.mp + db.value);
}

/* --- ダメージ処理 --- */
function spawnFloatingDamage(targetEl, text, typeClass) {
  if (!targetEl || !CM.running) return;
  const rect = targetEl.getBoundingClientRect();
  const canvasRect = CM.canvas.getBoundingClientRect();
  const x = (rect.left - canvasRect.left) + rect.width / 2;
  const y = (rect.top - canvasRect.top) + rect.height / 2;
  CM.addEffect(new DamageEffect(x, y, text, typeClass));
}

function flashScreenRed() {
  const el = document.createElement('div');
  el.className = 'damage-flash-overlay';
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 400);
}

/* HP0で ゆうしゃが たおれた しゅんかん：画面を はんとうめいの グレーに して
   なにが おきたか わかるように いちどまを つくってから ゲームオーバー画面へ */
function showPlayerDownOverlay() {
  const el = document.createElement('div');
  el.className = 'player-down-overlay';
  document.body.appendChild(el);
  return el;
}

function playPlayerAttackAnim() {
  if (!CM.running) return;
  const canvasRect = CM.canvas.getBoundingClientRect();
  const x = canvasRect.width / 2;
  const y = canvasRect.height / 2;
  CM.addEffect(new SlashEffect(x, y));
}

function playEnemyAttackAnim() {
  const frame = document.querySelector('.enemy-sprite');
  frame.classList.remove('enemy-attack-lean');
  void frame.offsetWidth;
  frame.classList.add('enemy-attack-lean');
}

function dealToEnemy(dmg, label, isCrit, cb){
  playPlayerAttackAnim();
  
  setTimeout(() => {
    battle.enemy.hp -= dmg;
    
    if (isCrit) {
      SM.play('se_crit');
      blog(`<span class="good" style="color:#ffcc00; font-size:1.1em;">かいしんのいちげき！！ ゆうしゃの ${label}！ ${battle.enemy.name}に <b>${dmg}</b>の ダメージ！</span>`);
    } else {
      SM.play('se_slash');
      blog(`<span class="good">ゆうしゃの ${label}！ ${battle.enemy.name}に <b>${dmg}</b>の ダメージ！</span>`);
    }
    
    const frame = document.querySelector('.enemy-sprite');
    frame.classList.remove('enemy-damage-hit'); 
    void frame.offsetWidth; 
    frame.classList.add('enemy-damage-hit');
    
    updateBattleBars();
    spawnFloatingDamage(frame, dmg, isCrit ? 'enemy-dmg crit' : 'enemy-dmg');

    // そうびの特殊能力「きゅうけつ」：あたえたダメージの15%をHP吸収
    if (equippedAbilities().has('lifesteal')){
      const heal = Math.max(1, Math.round(dmg * 0.15));
      G.player.hp = Math.min(totalMaxHp(), G.player.hp + heal);
      blog(`<span class="good">きゅうけつ！ HPを ${heal} きゅうしゅうした！</span>`);
      updateBattleBars();
    }

    // 新ステージのボス戦：HP50%を きったら フェーズ2（限界突破）へ ステートいこう
    if (explore && explore.stageMode && explore.isBoss && explore.bossPhase === 1 &&
        battle.enemy.hp > 0 && battle.enemy.hp <= battle.enemy.maxHp * 0.5){
      triggerBossPhase2();
    }

    setTimeout(() => {
      if (cb) cb();
    }, 400);
  }, 250);
}

/* ボスが フェーズ2（限界突破）へ いこうする演出：オーラを つけて もんだいの なんいどを あげる */
function triggerBossPhase2(){
  explore.bossPhase = 2;
  const frame = document.querySelector('.enemy-sprite');
  if (frame) frame.classList.add('boss-phase2-aura');
  blog(`<span class="accent">${battle.enemy.name}が ちからを かいほうした…！【フェーズ2：限界突破】</span>`);
  $('battle-floor-title').innerHTML = stageBattleTitleHtml(explore.areaId, explore.stageIndex, true, 2);
}

function afterPlayerAction(){
  if (battle.enemy.hp <= 0){
    const frame = document.querySelector('.enemy-sprite');
    frame.classList.remove('enemy-damage-hit');
    void frame.offsetWidth;
    frame.classList.add('enemy-blow-away');
    
    setTimeout(() => {
      winBattle();
    }, 800);
    return;
  }
  resumeBattle('player');
}

function enemyAct(){
  if (!battle || battle.over) return;
  playEnemyAttackAnim();
  const e = battle.enemy;
  let dmg = Math.max(1, Math.round(e.atk * 1.5) - totalStat('def'));
  // そうびの特殊能力「てっぺき」：うけるダメージ-15%
  if (equippedAbilities().has('guard')) dmg = Math.max(1, Math.round(dmg * 0.85));
  G.player.hp -= dmg;
  SM.playBeep('damage');
  flashScreenRed();
  spawnFloatingDamage($('battle-player-hp'), dmg, 'player-dmg');
  blog(`<span class="bad">${e.name}の こうげき！ ゆうしゃは <b>${dmg}</b>の ダメージを うけた！</span>`);
  const frame = $('battle-player-window');
  frame.classList.remove('shake'); void frame.offsetWidth; frame.classList.add('shake');
  updateBattleBars();
  spawnFloatingDamage(frame, dmg, 'player-dmg');
  flashScreenRed();
  if (G.player.hp <= 0){
    endBattleLoop();
    showPlayerDownOverlay();
    setTimeout(loseBattle, 1400);
    return;
  }
  resumeBattle('enemy');
}

function endBattleLoop(){
  battle.over = true;
  battle.running = false;
  clearInterval(battle.tickId);
  destroyChallenge();
}

function expNext(lvl){ return Math.round(18 * Math.pow(lvl, 1.4)); }
const LEVEL_UP_HP_GAIN = 4; // レベルアップ1回ごとの さいだいHP 増加量
const LEVEL_UP_MP_GAIN = 2; // レベルアップ1回ごとの さいだいMP 増加量

/* けいけんちを あたえて、必要ならレベルアップさせる（バトル勝利／サブクエストなど 共通） */
function grantExp(amount){
  G.player.exp += amount;
  const lvlBefore = G.player.lvl;
  const maxHpBefore = totalMaxHp();
  const maxMpBefore = totalMaxMp();
  let pointsGained = 0;
  while (G.player.exp >= expNext(G.player.lvl)){
    G.player.exp -= expNext(G.player.lvl);
    G.player.lvl++;
    G.player.points += 3;
    pointsGained += 3;
    G.player.maxHp += LEVEL_UP_HP_GAIN;
    G.player.maxMp += LEVEL_UP_MP_GAIN;
    G.player.hp = totalMaxHp();
    G.player.mp = totalMaxMp();
  }
  return { leveledUp: G.player.lvl > lvlBefore, lvlBefore, pointsGained, maxHpBefore, maxMpBefore };
}

function winBattle(){
  endBattleLoop();
  const e = battle.enemy;
  const gold = rnd(e.goldMin, e.goldMax);
  G.player.gold += gold;
  const rewards = [
    `${e.name}を たおした！`,
    `けいけんち ${e.exp}ポイントを かくとく！`,
    `${gold}ゴールドを てにいれた！`,
  ];

  // ドロップ
  const drops = [];
  if (Math.random() < 0.35){
    const it = pick(ITEM_DB);
    addItem(it.id, 1);
    drops.push({ kind:'item', name:it.name, icon:it.emoji });
    rewards.push(`${it.name}を ひろった！`);
  }
  if (e.isBoss || Math.random() < 0.12){
    const db = pick(EQUIP_DB);
    const rarities = e.isBoss ? [3, 3, 4, 4, 4, 5] : [1, 2, 2];
    const rarity = pick(rarities);
    const ability = rollAbility(rarity);
    G.ownedEquips.push({ uid: G.nextUid++, id: db.id, rarity, ability });
    drops.push({ kind:'equip', name:db.name, rarity, icon:db.emoji, ability });
    rewards.push(`そうび「<span class="rarity-${rarity}">${db.name}</span>」を てにいれた！`);
  }
  // 古代装備の せっけいず（レア・ドロップ）
  if (Math.random() < (e.isBoss ? 0.15 : 0.04)){
    const bp = pick(BLUEPRINT_DB);
    addItem(bp.id, 1);
    drops.push({ kind:'blueprint', name:bp.name, icon:bp.emoji });
    rewards.push(`めずらしい「📜 ${bp.name}」を ひろった！`);
  }
  
  if (explore) {
    if (!explore.sessionDrops) explore.sessionDrops = [];
    if (!explore.sessionGold) explore.sessionGold = 0;
    explore.sessionDrops.push(...drops);
    explore.sessionGold += gold;
    if (explore.stageMode){
      if (!explore.stageDrops) explore.stageDrops = [];
      if (!explore.stageGold) explore.stageGold = 0;
      if (!explore.stageExp) explore.stageExp = 0;
      explore.stageDrops.push(...drops);
      explore.stageGold += gold;
      explore.stageExp += e.exp;
    }
  }

  // レベルアップ
  const { leveledUp, lvlBefore, pointsGained, maxHpBefore, maxMpBefore } = grantExp(e.exp);
  if (leveledUp){
    rewards.push(`<span class="accent">ゆうしゃは レベル${G.player.lvl}に あがった！ さいだいHP+${totalMaxHp() - maxHpBefore}／さいだいMP+${totalMaxMp() - maxMpBefore}／スキルポイント+${pointsGained}</span>`);
  }

  save();

  const proceed = () => {
    if (explore.stageMode){
      // 新ステージ：ボスを たおしたら エリア制覇（救助イベント）へ
      if (explore.isBoss){
        stageAreaCleared(explore.areaId, rewards);
        return;
      }
      for (const r of rewards) blog(r);
      // いまの ステージで なんたい たおしたかを 画面いっぱいに 1回 表示してから すすむ。
      // ちょうど ENEMIES_PER_STAGE たいめなら、そのまま つぎの ステージへは いかず
      // 「ステージクリア」がめんで えらばせる
      const fromCount = (explore.stageKillCount || 0) + 1;
      const toCount = fromCount + 1;
      const stageCleared = fromCount >= ENEMIES_PER_STAGE;
      const areaId = explore.areaId;
      const stageIndex = explore.stageIndex;
      showKillProgressPopup(fromCount, toCount, ENEMIES_PER_STAGE, () => {
        if (stageCleared){
          const counts = getStageClearCounts(areaId);
          counts[stageIndex] = Math.min(STAGE_STARS_TO_UNLOCK_NEXT, (counts[stageIndex] || 0) + 1);
          const stageRewards = { drops: explore.stageDrops || [], gold: explore.stageGold || 0, exp: explore.stageExp || 0 };
          save();
          showStageClearOverlay(AREA_STAGES[areaId], stageIndex, stageRewards,
            () => nextStage(),
            () => { explore = null; showStageSelectNew(areaId); });
        } else {
          nextStage();
        }
      });
      return;
    }
    // 10階制覇なら救助イベントへ
    if (explore.floor >= 10){
      zoneCleared(explore.zone, rewards);
      return;
    }
    for (const r of rewards) blog(r);
    setTimeout(nextFloor, 1200);
  };

  const afterDrops = () => {
    if (leveledUp){
      const unlockedSkills = SKILL_DB.filter(s => (s.reqLvl || 1) > lvlBefore && (s.reqLvl || 1) <= G.player.lvl);
      showLevelUpModal({
        fromLvl: lvlBefore, toLvl: G.player.lvl,
        hpBefore: maxHpBefore, hpAfter: totalMaxHp(),
        mpBefore: maxMpBefore, mpAfter: totalMaxMp(),
        pointsGained, unlockedSkills,
      }, proceed);
    } else {
      proceed();
    }
  };

  playItemRevealSequence(drops, { badge:'🎁 アイテム ゲット！', onDone: afterDrops });
}

/* db.emoji は そうび/アイテムの がぞうパス。画像パスなら<img>、
   ただの絵文字文字なら そのまま表示する */
function iconHtml(icon, sizePx){
  const size = sizePx || 48;
  if (!icon) return `<span style="font-size:${size}px;line-height:1;">🎁</span>`;
  if (icon.indexOf('/') >= 0) return `<img src="${av(icon)}" style="width:${size}px;height:${size}px;object-fit:contain;" alt="">`;
  return `<span style="font-size:${size}px;line-height:1;">${icon}</span>`;
}

/* item-card: そうび/アイテム 1個ぶんの表示（アイコン＋名前＋レアリティ＋能力）。
   1個演出のカードと、けっか一覧のミニカードで きょうつうして つかう */
function itemCardBodyHtml(res, iconSize){
  const ability = res.ability ? getAbility(res.ability) : null;
  const rarityClass = res.rarity ? ` rarity-${res.rarity}` : '';
  return `
    <div class="item-card-icon${rarityClass}">${iconHtml(res.icon, iconSize)}</div>
    <div class="item-card-name${rarityClass}">${res.name}</div>
    ${res.rarity ? `<div class="item-card-stars${rarityClass}">${RARITY_NAME[res.rarity] || res.rarity}</div>` : ''}
    ${ability ? `<div class="item-card-ability">✨ ${ability.name}</div>` : ''}
  `;
}

/* ==========================================================
   アイテム/そうび の 入手演出（ガチャ・ドロップ 共通）
   items: [{ kind, name, rarity(そうびのみ), icon, ability }]
   opts: { badge, title, showSummary, onDone }
   ========================================================== */
function playItemRevealSequence(items, opts){
  opts = opts || {};
  if (!items || items.length === 0){ if (opts.onDone) opts.onDone(); return; }

  document.querySelector('.gacha-reveal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'gacha-reveal-overlay';
  const card = document.createElement('div');
  card.className = 'gacha-reveal-card';
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  let idx = 0;
  let timer = null;

  function renderCard(res){
    card.className = `gacha-reveal-card${res.rarity ? ' rarity-' + res.rarity : ''}`;
    card.innerHTML = `
      <div class="gacha-reveal-badge">${opts.badge || 'GET!'}</div>
      ${itemCardBodyHtml(res, 72)}
      <div class="gacha-reveal-tap">タップで つぎへ</div>
    `;
    void card.offsetWidth;
    card.classList.add('gacha-reveal-flip');
    SM.play((res.rarity || 0) >= 4 ? 'se_gacha_result2' : 'se_gacha_result');
  }

  function showNext(){
    if (idx >= items.length){ finish(); return; }
    renderCard(items[idx]);
    idx++;
    clearTimeout(timer);
    timer = setTimeout(showNext, 1300);
  }
  card.onclick = () => { clearTimeout(timer); showNext(); };

  function finish(){
    clearTimeout(timer);
    if (opts.showSummary){
      const cardsHtml = items.map(r => `<div class="item-card${r.rarity ? ' rarity-' + r.rarity : ''}">${itemCardBodyHtml(r, 40)}</div>`).join('');
      overlay.innerHTML = `<div class="panel gacha-reveal-summary">
        <h2>${opts.title || 'けっか'}</h2>
        <div class="item-card-grid">${cardsHtml}</div>
        <button class="btn btn-primary" id="btn-gacha-reveal-close">とじる</button>
      </div>`;
      $('btn-gacha-reveal-close').onclick = () => { overlay.remove(); if (opts.onDone) opts.onDone(); };
    } else {
      overlay.remove();
      if (opts.onDone) opts.onDone();
    }
  }

  showNext();
}

/* ぶきや で こうにゅうした ときの えんしゅつ。探索の アイテム獲得と おなじ カード表示だが、
   1個だけ・自動では すすまず、そのまま そうび画面へ とべる ボタンを つける */
function showEquipPurchaseReveal(res){
  document.querySelector('.gacha-reveal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'gacha-reveal-overlay';
  const card = document.createElement('div');
  card.className = `gacha-reveal-card${res.rarity ? ' rarity-' + res.rarity : ''}`;
  card.innerHTML = `
    <div class="gacha-reveal-badge">🎁 てにいれました！</div>
    ${itemCardBodyHtml(res, 72)}
    <div class="gacha-reveal-actions">
      <button class="btn" id="btn-purchase-reveal-close">とじる</button>
      <button class="btn btn-primary" id="btn-purchase-reveal-equip">そうび画面へ</button>
    </div>
  `;
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  void card.offsetWidth;
  card.classList.add('gacha-reveal-flip');
  SM.play((res.rarity || 0) >= 4 ? 'se_gacha_result2' : 'se_gacha_result');

  $('btn-purchase-reveal-close').onclick = () => { overlay.remove(); showWeaponShop(); };
  $('btn-purchase-reveal-equip').onclick = () => { overlay.remove(); showStatus(); };
}

function showLevelUpModal(data, onClose){
  document.querySelector('.levelup-overlay')?.remove();
  SM.play('se_clear');

  const overlay = document.createElement('div');
  overlay.className = 'levelup-overlay';

  const flow = document.createElement('div');
  flow.className = 'levelup-flow-overlay';
  flow.textContent = 'LEVEL UP!';
  overlay.appendChild(flow);

  const skillsHtml = data.unlockedSkills.length
    ? `<div class="levelup-section levelup-skills">
        <h3>✨ あたらしい しゅぎょうが かいほう！</h3>
        ${data.unlockedSkills.map(s => `<div class="levelup-skill-row"><span class="mastered">★</span>${s.name}<span class="tag">🧮${ZONE_OP_LABELS[s.zone]}</span></div>`).join('')}
      </div>`
    : '';

  const panel = document.createElement('div');
  panel.className = 'panel levelup-panel';
  panel.innerHTML = `
    <h2>Lv.${data.fromLvl} → Lv.${data.toLvl} に あがった！</h2>
    <div class="levelup-section">
      <div class="levelup-stat-row">${statName('hp')}さいだいHP <span>${data.hpBefore} → <b>${data.hpAfter}</b></span><span class="tag mastered">+${data.hpAfter - data.hpBefore}</span></div>
      <div class="hp-bar-container"><div class="stat-bar-fill hp levelup-fill" style="width:0%"></div></div>
      <div class="levelup-stat-row">${statName('mp')}さいだいMP <span>${data.mpBefore} → <b>${data.mpAfter}</b></span><span class="tag mastered">+${data.mpAfter - data.mpBefore}</span></div>
      <div class="mp-bar-container"><div class="stat-bar-fill mp levelup-fill" style="width:0%"></div></div>
    </div>
    <div class="levelup-section levelup-points">⭐ スキルポイント <b>+${data.pointsGained}</b> かくとく！</div>
    ${skillsHtml}
    <button class="btn btn-primary" id="btn-levelup-close">とじる</button>
  `;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.querySelectorAll('.levelup-fill').forEach(el => { el.style.width = '100%'; });
  });

  $('btn-levelup-close').onclick = () => {
    overlay.remove();
    if (onClose) onClose();
  };
}

function loseBattle(){
  endBattleLoop();
  document.querySelector('.player-down-overlay')?.remove();
  G.player.hp = 1;
  const zone = explore ? explore.zone : null;
  if (zone && G.failTracking) {
    G.failTracking.gameOvers[zone] = (G.failTracking.gameOvers[zone] || 0) + 1;
  }
  
  let adviceMode = null;
  let adviceText = '';
  if (zone && G.failTracking) {
    const hasAssistEq = Object.values(G.equipment).some(eq => {
      if (!eq) return false;
      const owned = G.ownedEquips.find(o => o.uid === eq.uid);
      if (!owned) return false;
      const db = getEquipTemplate(owned.id);
      return db && db.assist;
    });
    
    let struggledOp = null;
    const ops = ['add', 'sub', 'mul', 'div'];
    for (const op of ops) {
      if ((G.failTracking.mistakes[zone + '_' + op] || 0) >= 5) {
        struggledOp = op;
        break;
      }
    }
    
    if (struggledOp && !hasAssistEq) {
      adviceMode = 'assist';
      adviceText = 'けいさんが むずかしければ、「かぞえだま」などの アシストアイテムを そうびしてみよう！';
    } else if (G.failTracking.gameOvers[zone] >= 3 && G.failTracking.gameOvers[zone] % 3 === 0) {
      adviceMode = 'equip';
      adviceText = 'てきが つよいときは、ステータスを あげたり そうびを みなおしてみよう！';
    }
  }

  let dropsHtml = '';
  if (explore) {
    dropsHtml = generateDropsSummaryHtml(explore.sessionDrops, explore.sessionGold);
  }

  explore = null;
  save();
  $('gameover-text').innerHTML = 'めのまえが まっくらに なった…。きがつくと きょてんに もどっていた。（たんさくは やりなおし）' + (dropsHtml ? '<br>' + dropsHtml : '');
  
  if (adviceMode) {
    setTimeout(() => showGameoverAdvice(adviceText), 2000);
  }
  document.body.style.background = 'rgba(80, 80, 100, 0.5)';
  document.body.style.backgroundImage = 'none';
  // ゲームオーバーフローテキストを表示
  const existingFlow = document.querySelector('.gameover-flow-overlay');
  if (existingFlow) existingFlow.remove();
  const gameoverFlow = document.createElement('div');
  gameoverFlow.className = 'gameover-flow-overlay';
  gameoverFlow.textContent = 'GAMEOVER';
  document.body.appendChild(gameoverFlow);
  showScreen('screen-gameover');
  SM.stopBGM();
  if (SM.initialized) SM.play('se_gameover');
}

function showGameoverAdvice(adviceText) {
  const overlay = document.createElement('div');
  overlay.className = 'gameover-advice-overlay modal-overlay';
  overlay.style.zIndex = '1000'; // gameover-flowより上に表示するため
  overlay.innerHTML = `
    <div class="modal-panel" style="text-align:center;">
      <h3 style="color:var(--accent);">★ アドバイス ★</h3>
      <p style="margin:20px 0; font-size:1.1em; line-height:1.5;">${adviceText}</p>
      <button class="btn btn-primary" id="btn-advice-goto-room">自分の部屋へ行く</button>
      <button class="btn" id="btn-advice-close" style="margin-top:10px; display:block; width:100%;">とじる</button>
    </div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById('btn-advice-goto-room').onclick = () => {
    overlay.remove();
    document.querySelector('.gameover-flow-overlay')?.remove();
    showStatus();
  };
  
  document.getElementById('btn-advice-close').onclick = () => {
    overlay.remove();
  };
}

const ZONE_CLEAR_REWARDS = {
  tower:   { rescueId:'fairy', rescueText:'草原の おくふかくに とらわれていた <span class="accent">ようせいリーン</span>を きゅうじょした！', equipId:'c4' },
  dungeon: { rescueId:'sage', rescueText:'沼地の おくに とじこめられていた <span class="accent">ろうけんじゃモルド</span>を きゅうじょした！', equipId:'w7' },
  crypt:   { rescueId:'alchemist', rescueText:'地下ダンジョンの おくに とじこめられていた <span class="accent">れんきんじゅつしファナ</span>を きゅうじょした！', equipId:'a7' },
  bandit:  { rescueId:'merchant', rescueText:'盗賊のアジトに とらわれていた <span class="accent">しょうにんダロン</span>を きゅうじょした！', equipId:'w8' },
};

function generateDropsSummaryHtml(drops, gold) {
  if (!drops || drops.length === 0 && (!gold || gold === 0)) return '';
  let html = '<div class="run-drops-summary" style="margin-top:15px; border-top:1px solid rgba(255,255,255,0.2); padding-top:10px;">';
  html += '<h4 style="margin-bottom:10px; color:var(--accent);">【今回のたんさくで てにいれたもの】</h4>';
  if (gold > 0) html += `<div class="drop-reward-row">🪙 ${gold} ゴールド</div>`;
  drops.forEach(d => {
    if (d.kind === 'equip') {
      html += `<div class="drop-reward-row">${iconHtml(d.icon, 24)} <span class="rarity-${d.rarity}">${rarityLabelHtml(d.rarity)} ${d.name}</span></div>`;
    } else if (d.kind === 'blueprint') {
      html += `<div class="drop-reward-row">${iconHtml(d.icon, 24)} ${d.name}</div>`;
    } else {
      html += `<div class="drop-reward-row">${iconHtml(d.icon, 24)} ${d.name}</div>`;
    }
  });
  html += '</div>';
  return html;
}

function zoneCleared(zone, extraRewards, opts){
  opts = opts || {};
  const dispName = opts.displayName || zoneName(zone);
  const first = !G.clears[zone];
  G.clears[zone] = true;

  const prevStars = G.clearCounts[zone] || 0;
  const newStars = Math.min(STAGE_STARS_TO_UNLOCK_NEXT, prevStars + 1);
  G.clearCounts[zone] = newStars;

  const logs = [...(extraRewards || []), `<span class="accent">＊${dispName}を せいはした！＊</span>`];
  logs.push(`<span class="accent">${zoneStarsHtml(zone)}（${newStars}かいめの クリア）</span>`);

  if (!opts.suppressNextUnlock && newStars >= STAGE_STARS_TO_UNLOCK_NEXT && prevStars < STAGE_STARS_TO_UNLOCK_NEXT){
    const nextZone = GRASS_AREA_ORDER[GRASS_AREA_ORDER.indexOf(zone) + 1];
    if (nextZone){
      logs.push(`<span class="good">⭐⭐⭐ ★3つ たっせい！ つぎのステージ「${zoneName(nextZone)}」が かいほうされた！</span>`);
    }
  }

  const reward = ZONE_CLEAR_REWARDS[zone];
  if (reward){
    if (!G.rescued.includes(reward.rescueId)){
      G.rescued.push(reward.rescueId);
      logs.push(reward.rescueText);
    }
    const db = EQUIP_DB.find(d => d.id === reward.equipId);
    const ability = rollAbility(5);
    G.ownedEquips.push({ uid: G.nextUid++, id: db.id, rarity: 5, ability });
    const abilityInfo = ability ? getAbility(ability) : null;
    logs.push(`おれいに「<span class="rarity-5">${rarityLabelHtml(5)} ${db.name}</span>」を もらった！${abilityInfo ? `<br><span class="tag ability">✨ ${abilityInfo.name}（${abilityInfo.desc}）</span>` : ''}`);
  }
  if (first){
    addItem('hipotion', 2);
    addItem('ether', 2);
    logs.push('<span class="good">はつせいは ボーナス！ 秘薬×2 と エーテル×2 を てにいれた！</span>');
  }
  
  if (explore) {
    const dropsHtml = generateDropsSummaryHtml(explore.sessionDrops, explore.sessionGold);
    if (dropsHtml) {
      logs.push(dropsHtml);
    }
  }

  explore = null;
  save();
  $('clear-title').textContent = `＊${dispName} せいは＊`;
  // generateDropsSummaryHtmlはそのままHTMLとして結合するため、一部エスケープ処理を調整
  $('clear-log').innerHTML = logs.map(l => l.startsWith('<div class="run-drops-summary"') ? l : `<div>${l}</div>`).join('');
  showScreen('screen-clear');
}

/* 1たい たおすたびに、いまの ステージの とうばつ数を 画面いっぱいに 1回 表示する。
   まえの 数字（fromCount）を いちど 見せてから、あたらしい 数字（toCount）に
   かわる えんしゅつで、すすんでいることが わかるようにする */
function showKillProgressPopup(fromCount, toCount, total, onDone){
  document.querySelector('.kill-progress-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'kill-progress-overlay';
  const num = document.createElement('div');
  num.className = 'kill-progress-num';
  num.textContent = `${fromCount} ／ ${total}`;
  overlay.appendChild(num);
  document.body.appendChild(overlay);

  setTimeout(() => {
    num.textContent = toCount > total ? 'CLEAR!' : `${toCount} ／ ${total}`;
    if (fromCount !== toCount) {
      num.classList.remove('kill-progress-tick');
      void num.offsetWidth;
      num.classList.add('kill-progress-tick');
    }
  }, 500);

  setTimeout(() => {
    overlay.remove();
    if (onDone) onDone();
  }, 1300);
}

/* 1ステージぶん（ENEMIES_PER_STAGE たい）を たおしたら、そのまま つぎの ステージへ
   すすまず、ここで いったん 止めて えらばせる：ステージせんたくに もどるか、
   すぐ つぎの ステージへ すすむか */
function showStageClearOverlay(area, stageIndex, stageRewards, onNext, onBackToSelect){
  document.querySelector('.stage-clear-overlay')?.remove();
  if (SM.initialized) SM.play('se_clear');

  const overlay = document.createElement('div');
  overlay.className = 'stage-clear-overlay';

  const flow = document.createElement('div');
  flow.className = 'stage-clear-flow-overlay';
  flow.textContent = 'ステージクリア';
  overlay.appendChild(flow);

  const panel = document.createElement('div');
  panel.className = 'panel stage-clear-panel';
  panel.innerHTML = `
    <h2>${area.name} ステージ${stageIndex + 1}／${area.stages.length} クリア！</h2>
    ${stageClearRewardsHtml(stageRewards)}
    <p class="flavor">つぎの ステージへ すすみますか？　それとも ステージせんたくに もどりますか？</p>
    <div class="stage-clear-actions">
      <button class="btn" id="btn-stage-clear-back">ステージせんたくへ もどる</button>
      <button class="btn btn-primary" id="btn-stage-clear-next">➡ つぎの ステージへ</button>
    </div>
  `;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  $('btn-stage-clear-back').onclick = () => { overlay.remove(); onBackToSelect(); };
  $('btn-stage-clear-next').onclick = () => { overlay.remove(); onNext(); };
}

/* ステージクリア画面で見せる、そのステージで てにいれた けいけんち／ゴールド／アイテムの一覧 */
function stageClearRewardsHtml(rewards){
  if (!rewards) return '';
  const { drops, gold, exp } = rewards;
  let html = '<div class="stage-clear-rewards">';
  html += '<h4>【このステージで てにいれたもの】</h4>';
  html += '<div class="stage-clear-rewards-summary">';
  html += `<span>✨ けいけんち ${exp || 0}</span>`;
  html += `<span>🪙 ${gold || 0} ゴールド</span>`;
  html += '</div>';
  if (drops && drops.length){
    html += '<div class="stage-clear-rewards-items">';
    drops.forEach(d => {
      if (d.kind === 'equip'){
        html += `<div class="stage-clear-reward-row drop-reward-row">${iconHtml(d.icon, 22)} <span class="rarity-${d.rarity}">${rarityLabelHtml(d.rarity)} ${d.name}</span></div>`;
      } else if (d.kind === 'blueprint'){
        html += `<div class="stage-clear-reward-row drop-reward-row">${iconHtml(d.icon, 22)} ${d.name}</div>`;
      } else {
        html += `<div class="stage-clear-reward-row drop-reward-row">${iconHtml(d.icon, 22)} ${d.name}</div>`;
      }
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

/* 新ステージシステムの エリア制覇。報酬・救助イベントは 既存の zoneCleared() を
   そのまま流用する（rewardZone＝tower/dungeon の クリア処理に のる） */
function stageAreaCleared(areaId, extraRewards){
  const area = AREA_STAGES[areaId];
  zoneCleared(area.rewardZone, extraRewards, { suppressNextUnlock:true, displayName:area.name });
}

/* 勝利後：おなじ ステージの もんだいタイプで つぎの 敵へ（テンポ重視で即戦闘）。
   ENEMIES_PER_STAGE たい たおしたら つぎの ステージへ すすみ、7ステージを こえたら ボスへ。
   せいかいしつづけても 前のたたかいで うけた ダメージが つみかさなって
   しなないよう、つぎの 敵に すすむ たびに HP／MPを ぜんかいふくする */
function nextStage(){
  const area = AREA_STAGES[explore.areaId];
  explore.stageKillCount = (explore.stageKillCount || 0) + 1;
  if (explore.stageKillCount >= ENEMIES_PER_STAGE){
    explore.stageIndex++;
    explore.stageKillCount = 0;
    explore.stageDrops = [];
    explore.stageGold = 0;
    explore.stageExp = 0;
    if (explore.stageIndex >= area.stages.length){
      explore.isBoss = true;
      explore.stageIndex = null;
      explore.bossPhase = 1;
    }
  }
  G.player.hp = totalMaxHp();
  G.player.mp = totalMaxMp();
  startBattle(true);
}

/* 勝利後：次の階のバトルへ（テンポ重視で即戦闘） */
function nextFloor(){
  explore.floor++;
  startBattle(true);
}

/* ==========================================================
   セーブデータ せんたく画面
   ========================================================== */
function showLoadSaveScreen(){
  showScreen('screen-load-save');
  const list = $('save-slot-list');
  list.innerHTML = '';
  const slots = listSaveSlots();
  if (slots.length === 0){
    list.innerHTML = '<div class="flavor">セーブデータが ありません。「あたらしく はじめる」から ぼうけんを はじめよう！</div>';
    return;
  }
  for (const slot of slots){
    const row = document.createElement('div');
    row.className = 'inv-row';
    const equips = [slot.equippedWeapon, slot.equippedArmor, slot.equippedAccessory].filter(Boolean);
    const equipHtml = equips.length ? `<div style="display:flex; gap:8px; margin-top:6px;">${
      equips.map(eq => `<div class="equip-icon rarity-${eq.rarity || 1}" style="width:40px; height:40px;" title="${eq.name}">${iconHtml(eq.emoji, 26)}</div>`).join('')
    }</div>` : '';
    row.innerHTML = `<div class="info">
      <span class="rarity-4">${slot.name}</span> <span class="tag" style="margin-left:8px;">Lv${slot.lvl}</span>
      <div class="desc" style="margin-top:4px;">所持金：${slot.gold} G</div>
      ${equipHtml}
      </div>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'つづける';
    btn.onclick = () => { if (loadSlot(slot.key)) { startTimeLimitSession(slot.key); showHome(); } };
    row.appendChild(btn);
    list.appendChild(row);
  }
}

/* ==========================================================
   拠点・ステータス
   ========================================================== */
function showHome(){
  showScreen('screen-home');
  const hr = $('home-rescued');
  if (hr) hr.classList.add('hidden'); // クリア後の上部表示を常に消す
  // 拠点では全回復
  G.player.hp = totalMaxHp();
  G.player.mp = totalMaxMp();
  updateHud();
  save();
  checkDemonCastleReward();
}

function checkDemonCastleReward() {
  if (storageGet('guest_demon_castle_cleared') === '1' && G) {
    storageSet('guest_demon_castle_cleared', null);
    G.player.exp += 1000;
    G.player.gold += 10000;
    const ability = rollAbility(5);
    const equip = {
      uid: G.nextUid++,
      id: 'demon_sword',
      rarity: 5,
      ability
    };
    G.ownedEquips.push(equip);
    save();

    playItemRevealSequence([
      { kind:'item', name:'ゴールド 10,000 G', icon:'💰' },
      { kind:'item', name:'経験値 1,000 EXP', icon:'✨' },
      { kind:'equip', name:'魔王の覇剣 (★5 レジェンド)', icon:'⚔️', rarity:5, ability }
    ], {
      badge: '👑 試練突破ボーナス！',
      title: '魔王の秘宝 解放！！',
      showSummary: true
    });
  }
}

function stageStatusText(zone){
  return `10かい／${ZONE_OP_LABELS[zone]}／${zoneStarsHtml(zone)}`;
}
function stageStatusShort(zone){
  return `${ZONE_OP_LABELS[zone]}・${zoneStarsHtml(zone)}`;
}

let currentSubject = 'math';
function setSubjectTab(subject){
  currentSubject = subject;
  storageSet('stage_select_subject', subject);
  const mathTab = $('subject-tab-math');
  const kanjiTab = $('subject-tab-kanji');
  const mathGroup = $('stage-group-math');
  const kanjiGroup = $('stage-group-kanji');
  if (mathTab) mathTab.classList.toggle('is-active', subject === 'math');
  if (kanjiTab) kanjiTab.classList.toggle('is-active', subject === 'kanji');
  if (mathGroup) mathGroup.classList.toggle('is-active', subject === 'math');
  if (kanjiGroup) kanjiGroup.classList.toggle('is-active', subject === 'kanji');
}

function showStageSelect(){
  showScreen('screen-stage-select');
  const savedSubject = storageGet('stage_select_subject') || 'math';
  setSubjectTab(savedSubject);

  // さんすうエリア
  if ($('stage-status-area1')) $('stage-status-area1').innerHTML = `推奨Lv:1 / たしざん　${zoneStarsHtml('tower')}`;
  if ($('stage-status-area2')) $('stage-status-area2').innerHTML = `推奨Lv:5 / ひきざん　${zoneStarsHtml('dungeon')}`;
  if ($('stage-status-area3')) $('stage-status-area3').innerHTML = `推奨Lv:10 / かけざん　${zoneStarsHtml('forest')}`;
  if ($('stage-status-area4')) $('stage-status-area4').innerHTML = `推奨Lv:15 / 計算ミックス　${zoneStarsHtml('cave')}`;
  if ($('stage-status-area11')) $('stage-status-area11').innerHTML = `推奨Lv:20 / 小5算数　${zoneStarsHtml('sky')}`;
  if ($('stage-status-area12')) $('stage-status-area12').innerHTML = `推奨Lv:25 / 小6算数　${zoneStarsHtml('castle')}`;

  // こくご（漢字）エリア
  for (let i = 5; i <= 10; i++) {
    const el = $(`stage-status-area${i}`);
    if (el) {
      const area = AREA_STAGES[`area${i}`];
      el.innerHTML = `推奨Lv:${area ? area.recLv : 1} / 漢字　${zoneStarsHtml('kanji' + (i - 4))}`;
    }
  }
}

/* エリアIDから、そのエリアの 各ステージ（1-1など）の クリアかいすう配列（0〜3、★の数）を とりだす。
   まだ 記録が なければ、ステージ数ぶんの 0で うめて つくる */
function getStageClearCounts(areaId){
  if (!G) return (AREA_STAGES[areaId]?.stages || []).map(() => 0);
  if (!G.stageClearCounts) G.stageClearCounts = {};
  if (!G.stageClearCounts[areaId]){
    const area = AREA_STAGES[areaId];
    G.stageClearCounts[areaId] = (area && area.stages ? area.stages.map(() => 0) : []);
  }
  return G.stageClearCounts[areaId];
}

/* 新ステージ選択（エリアの背景に よこならびで ステージボタンを ひょうじ） */
function showStageSelectNew(areaId){
  try {
    if (!isAreaUnlocked(areaId)){
      alert('まえの エリアを クリアすると ちょうせんできるよ！');
      return;
    }
    const area = AREA_STAGES[areaId];
    if (!area) {
      console.error('AREA_STAGES not found for:', areaId);
      return;
    }
    const numPrefix = area.displayNum || areaId.replace('area', '');
    showScreen('screen-stage-select-new');
    const bgImg = $('stage-select-area-bg');
    if (bgImg && area.bgImage) {
      bgImg.src = av(area.bgImage);
    }
    const container = $('stage-button-container');
    if (!container) return;
    container.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'hotspot-tag stage-vertical-title';
    title.style.lineHeight = '1.4';
    
    const playerLv = (G && G.player) ? G.player.lvl : 1;
    const recLv = area.recLv || 1;
    let lvColor = '#ffffff';
    if (playerLv < recLv) {
      lvColor = '#ff6b6b';
    } else if (playerLv >= recLv + 5) {
      lvColor = '#4cd137';
    }
    
    title.innerHTML = `＊${area.name}（${area.opLabel}）＊<br><span style="font-size: 13px; color: ${lvColor};">推奨Lv: ${recLv}（現在Lv: ${playerLv}）</span>`;
    container.appendChild(title);
    
    const stageCounts = getStageClearCounts(areaId);
    (area.stages || []).forEach((stage, idx) => {
      const row = document.createElement('button');
      row.className = 'stage-select-row';
      row.innerHTML = `<span class="stage-select-num">${numPrefix}-${idx + 1}</span><span class="stage-select-name">${stage.name}</span>${stageClearStatusHtml(stageCounts[idx] || 0)}<span class="stage-print-btn" title="プリントして遊ぶ（大量報酬！）">🖨️</span>`;
      row.onclick = (e) => {
        if (e.target.classList.contains('stage-print-btn')) {
          e.stopPropagation();
          printAreaStage(areaId, idx);
          return;
        }
        enterAreaStage(areaId, idx);
      };
      container.appendChild(row);
    });
    
    const bossStars = Math.min(STAGE_STARS_TO_UNLOCK_NEXT, (G && G.clearCounts && G.clearCounts[area.rewardZone]) || 0);
    const bossRow = document.createElement('button');
    bossRow.className = 'stage-select-row stage-select-boss-row';
    bossRow.innerHTML = `<span class="stage-select-num">${numPrefix}-B</span><span class="stage-select-name">👹 ${area.bossName}</span>${stageClearStatusHtml(bossStars)}<span class="stage-print-btn" style="color:#ff6b6b;" title="ボス戦プリント">🖨️</span>`;
    bossRow.onclick = (e) => {
      if (e.target.classList.contains('stage-print-btn')) {
        e.stopPropagation();
        printAreaBoss(areaId);
        return;
      }
      enterAreaBoss(areaId);
    };
    container.appendChild(bossRow);

  } catch (err) {
    console.error('showStageSelectNew error:', err);
  }
}

/* ステージ一覧の1行ぶんに つける、クリア状況の表示。
   1回でも クリアしていれば「CLEAR!」（きいろ）を、くりかえしクリアで ★が たまり、
   ★★★（さいだい）に なったら「CLEAR!」が にじ色に かがやく */
function stageClearStatusHtml(stars){
  const cleared = stars > 0;
  const maxed = stars >= STAGE_STARS_TO_UNLOCK_NEXT;
  const starsHtml = '★'.repeat(stars) + '☆'.repeat(STAGE_STARS_TO_UNLOCK_NEXT - stars);
  return `
    <span class="stage-select-status">
      ${cleared ? `<span class="stage-clear-tag${maxed ? ' stage-clear-tag-rainbow' : ''}">CLEAR!</span>` : ''}
      <span class="stage-select-stars">${starsHtml}</span>
    </span>
  `;
}

function showGrassSubstage(){
  showScreen('screen-grass-substage');
  const cryptUnlocked = isGrassStageUnlocked('crypt');
  const banditUnlocked = isGrassStageUnlocked('bandit');
  $('substage-status-tower-tag').innerHTML = `🌿 草原<br><small>${stageStatusShort('tower')}</small>`;
  $('substage-status-crypt-tag').innerHTML = cryptUnlocked
    ? `🏚️ 地下ダンジョン<br><small>${stageStatusShort('crypt')}</small>`
    : `🔒 地下ダンジョン<br><small>草原をクリアしてね</small>`;
  $('substage-status-bandit-tag').innerHTML = banditUnlocked
    ? `🏕️ 盗賊のアジト<br><small>${stageStatusShort('bandit')}</small>`
    : `🔒 盗賊のアジト<br><small>地下ダンジョンをクリアしてね</small>`;
  $('substage-card-crypt').disabled = !cryptUnlocked;
  $('substage-card-bandit').disabled = !banditUnlocked;
  $('substage-card-crypt').classList.toggle('town-hotspot-locked', !cryptUnlocked);
  $('substage-card-bandit').classList.toggle('town-hotspot-locked', !banditUnlocked);
}

/* ==========================================================
   サブクエストボード（拠点で NPCの ぶんしょうだいに こたえる）
   ========================================================== */
const QUEST_BOARD_SIZE = 3;

function ensureQuestBoard(){
  if (!G.questBoard) G.questBoard = [];
  // ふるいセーブに のこった 1問だけの クエスト（parts が ない）は はきかえる
  G.questBoard = G.questBoard.filter(q => q && Array.isArray(q.parts));
  while (G.questBoard.length < QUEST_BOARD_SIZE) G.questBoard.push(generateStoryQuest());
}

function showQuestBoard(){
  showHome();
  $('screen-quest-board').classList.remove('hidden');
  ensureQuestBoard();
  const list = $('quest-board-list');
  list.innerHTML = '';
  for (const q of G.questBoard){
    const part = q.parts[q.partIndex];
    const row = document.createElement('div');
    row.className = 'inv-row quest-board-row';
    row.innerHTML = `<div class="info">
      <div class="quest-npc-line">
        <span class="quest-npc-emoji">${q.npc.emoji}</span>
        <span class="quest-npc-name">${q.npc.name}</span>
        <span class="tag">🧮${OP_LABELS[q.tier]}</span>
        <span class="tag quest-progress-tag">${q.partIndex + 1}／${q.parts.length}問め</span>
      </div>
      <div class="quest-title">＊${q.title}＊</div>
      <div class="desc quest-text">${part.text}</div>
    </div>`;
    const btnGroup = document.createElement('div');
    btnGroup.className = 'skill-row-btns';
    const answerBtn = document.createElement('button');
    answerBtn.className = 'btn btn-primary';
    answerBtn.textContent = 'こたえる';
    answerBtn.onclick = () => startQuestChallenge(q);
    const printBtn = document.createElement('button');
    printBtn.className = 'btn';
    printBtn.textContent = '🖨️ プリント';
    printBtn.onclick = () => printQuestSheet(q);
    btnGroup.appendChild(answerBtn);
    btnGroup.appendChild(printBtn);
    row.appendChild(btnGroup);
    list.appendChild(row);
  }
}

/* クエスト依頼者からの お礼のセリフ（3問すべて こたえおわった とき） */
const QUEST_THANKS_LINES = [
  'たすかったよ、ほんとうに ありがとう！',
  'さすが ぼうけんしゃだ！ たすかった！',
  'きみの けいさんの ちからに かんしゃするよ！',
  'これで あんしんして くらせるよ。ありがとう！',
  'おかげで たすかった！ おれい するね！',
];
/* まだ とちゅうの ときの セリフ（1〜2問め こたえた とき） */
const QUEST_CONTINUE_LINES = [
  'ありがとう！ でも まだ たのみたいことが あるんだ…',
  'たすかったよ。じつは もうひとつ おねがいが あって…',
  'いいちょうしだね！ つぎも たのめるかな？',
  'その ちょうしで、もうすこし てつだってほしいんだ。',
];

/* サブクエストの クリア演出：NPCの おれいセリフ＋ごほうび
   （ゴールド・けいけんちが じっさいの HUDの ばしょへ とんでいく） */
function showQuestRewardToast(gold, exp, npc, completed, onDone){
  showHome();
  document.querySelector('.quest-reward-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'quest-reward-overlay';
  overlay.innerHTML = `
    <div class="quest-reward-card">
      <div class="quest-reward-badge">${completed ? '✅ クエストクリア！' : '📖 つづく…'}</div>
      <div class="quest-reward-npc">${npc.emoji}</div>
      <div class="quest-reward-line">${completed ? pick(QUEST_THANKS_LINES) : pick(QUEST_CONTINUE_LINES)}</div>
      <div class="quest-reward-chips">
        <div class="quest-reward-chip gold" id="quest-reward-chip-gold">💰 +${gold}</div>
        <div class="quest-reward-chip exp" id="quest-reward-chip-exp">✨ +${exp}</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  SM.play('se_gacha_result');

  setTimeout(() => {
    flyRewardChip($('quest-reward-chip-gold'), $('home-player-gold'));
    flyRewardChip($('quest-reward-chip-exp'), $('home-player-exp-num'));
  }, 900);

  setTimeout(() => {
    overlay.remove();
    if (onDone) onDone();
  }, 1900);
}

/* fromEl の見た目のコピーを、toEl の位置まで とばして きえさせる。
   とうちゃくした toEl は ひかって パルスする */
function flyRewardChip(fromEl, toEl){
  if (!fromEl || !toEl) return;
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();
  const clone = fromEl.cloneNode(true);
  clone.removeAttribute('id');
  clone.className = 'quest-reward-flying';
  clone.style.left = fromRect.left + 'px';
  clone.style.top = fromRect.top + 'px';
  clone.style.width = fromRect.width + 'px';
  document.body.appendChild(clone);
  fromEl.style.visibility = 'hidden';

  const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
  const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.3)`;
    clone.style.opacity = '0';
  });
  setTimeout(() => {
    clone.remove();
    toEl.classList.remove('reward-pulse'); void toEl.offsetWidth; toEl.classList.add('reward-pulse');
  }, 650);
}

function getNPCImage(npc) {
  const definedNpc = QUEST_NPCS.find(n => n.name === npc.name);
  if (definedNpc && definedNpc.image) return av(definedNpc.image);
  if (npc.image) return av(npc.image);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${npc.emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let isTrainingSubquest = false;
function startQuestChallenge(q) {
  $('screen-quest-board').classList.add('hidden');
  const part = q.parts[q.partIndex];
  
  const events = [];
  if (q.partIndex === 0) {
    events.push({
      id: Math.random().toString(),
      name: q.npc.name,
      text: `おや、ぼうけんしゃさん！\nちょっと おねがい しても いいかな？`,
      image: getNPCImage(q.npc),
      position: 'right',
      animation: 'fade',
      emotion: 'jump'
    });
  }
  
  events.push({
    id: Math.random().toString(),
    name: q.npc.name,
    text: part.text, 
    image: getNPCImage(q.npc),
    position: 'right',
    animation: q.partIndex === 0 ? 'none' : 'pop',
    emotion: q.partIndex === 0 ? 'nod' : 'bounce'
  });

  const eventData = {
    title: `サブクエスト：${q.title}（${q.partIndex + 1}／${q.parts.length}問め）`,
    events: events,
    preventClose: true,
    onLastEvent: (overlay) => {
      const dialogBox = overlay.querySelector('.event-player-dialog');
      
      const challengeContainer = document.createElement('div');
      challengeContainer.style.position = 'absolute';
      challengeContainer.style.top = '45%';
      // Left side, center vertically
      challengeContainer.style.left = '35%';
      challengeContainer.style.transform = 'translate(-50%, -50%)';
      challengeContainer.style.width = '90%';
      challengeContainer.style.maxWidth = '400px';
      challengeContainer.style.background = 'rgba(0,0,0,0.85)';
      challengeContainer.style.backdropFilter = 'blur(12px)';
      challengeContainer.style.padding = '24px';
      challengeContainer.style.borderRadius = '16px';
      challengeContainer.style.border = '1px solid rgba(255,255,255,0.2)';
      challengeContainer.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.5)';
      challengeContainer.style.zIndex = '10005';
      
      overlay.appendChild(challengeContainer);
      
      startChallenge(challengeContainer, {
        problem: part,
        timeLimit: problemTimeLimit(q.tier) + 6000,
        prompt: 'ぶんしょうを よんで こたえよう！'
      }, (res) => {
        destroyChallenge();
        if (res.success) {
          hitTrainingDummy();
          const reward = questRewardFor(q.tier);
          q.partIndex++;
          const completed = q.partIndex >= q.parts.length;
          const totalGold = reward.gold + (completed ? Math.round(reward.gold * 0.5) : 0);
          const totalExp = reward.exp + (completed ? Math.round(reward.exp * 0.5) : 0);
          G.player.gold += totalGold;
          const { leveledUp, lvlBefore, pointsGained, maxHpBefore, maxMpBefore } = grantExp(totalExp);
          if (completed){
            const idx = G.questBoard.findIndex(x => x.uid === q.uid);
            if (idx >= 0) G.questBoard[idx] = generateStoryQuest();
          }
          save();
          
          overlay.remove();
          
          const afterEventData = {
            title: `サブクエスト：${q.title}`,
            events: [
              {
                id: Math.random().toString(),
                name: q.npc.name,
                text: completed ? pick(QUEST_THANKS_LINES) : pick(QUEST_CONTINUE_LINES),
                image: getNPCImage(q.npc),
                position: 'right',
                animation: 'pop',
                emotion: 'bounce'
              }
            ]
          };
          
          const playReward = () => {
            showQuestRewardToast(totalGold, totalExp, q.npc, completed, () => {
              if (leveledUp){
                const unlockedSkills = SKILL_DB.filter(s => (s.reqLvl || 1) > lvlBefore && (s.reqLvl || 1) <= G.player.lvl);
                showLevelUpModal({
                  fromLvl: lvlBefore, toLvl: G.player.lvl,
                  hpBefore: maxHpBefore, hpAfter: totalMaxHp(),
                  mpBefore: maxMpBefore, mpAfter: totalMaxMp(),
                  pointsGained, unlockedSkills,
                }, showHome);
              }
            });
          };

          if (window.playEventScene) {
            window.playEventScene(afterEventData, playReward);
          } else {
            playReward();
          }
          
        } else {
          challengeContainer.innerHTML = '';
          challengeContainer.style.display = 'none';
          if (dialogBox) {
            dialogBox.style.display = 'block';
            const tEl = dialogBox.querySelector('.event-player-text');
            if (tEl) {
              tEl.style.display = 'block';
              tEl.innerHTML = `ざんねん…こたえが ちがったみたい（せいかいは ${part.answer}）。<br>もういちど ちょうせんしてね。`;
            }
          }
          const skipBtn = overlay.querySelector('#event-skip-btn');
          if (skipBtn) skipBtn.style.display = 'block';
          
          overlay.querySelector('#event-screen').addEventListener('click', () => {
             overlay.remove();
             showQuestBoard();
          }, { once: true });
        }
      });
      
      const p1 = challengeContainer.querySelector('.challenge-prompt');
      const p2 = challengeContainer.querySelector('.challenge-problem');
      if (p1) p1.style.display = 'none';
      if (p2) p2.style.display = 'none';
      
    }
  };
  
  if (window.playEventScene) {
    window.playEventScene(eventData, showQuestBoard);
  }
}

/* プリントの上部にいれる「なまえ／にちづけ」らん。
   なまえの空らんは 長めにして 書きやすく、にちづけは「＿＿月＿＿日（＿＿ようび）」の
   べつべつの空らんにし、幼い子でも読めるよう 月・日・曜日に ルビをふる */
function printMetaHtml(){
  return `
    <div class="p-meta">
      <span class="p-meta-name">なまえ：</span>
      <span class="p-meta-date">
        <span class="p-meta-blank-sm"></span><ruby>月<rt>がつ</rt></ruby>
        <span class="p-meta-blank-sm"></span><ruby>日<rt>にち</rt></ruby>
        （<span class="p-meta-blank-sm"></span><ruby>曜日<rt>ようび</rt></ruby>）
      </span>
    </div>
  `;
}

/* サブクエストは 3問セットぶん まとめて 1まいの A4に おさまるよう、
   1問ずつを コンパクトな もんだい行＋こたえ欄で ならべる */
function printQuestSheet(q){
  const rows = q.parts.map((part, i) => `
    <div class="quest-print-block">
      <div class="p-row quest-print-question">
        <span class="p-num quest-print-num">${i + 1}</span>
        <span class="p-expr" style="white-space:normal;">${part.text}</span>
      </div>
      <div class="p-row quest-print-answer"><span class="p-num">こたえ</span><span class="p-blank"></span></div>
    </div>
  `).join('');
  openPrintWindow(`
    <h1 style="font-size:34px;">サブクエスト：${q.npc.name}の たのみごと</h1>
    <div class="p-sub" style="font-size:19px; margin-bottom:26px;">＊${q.title}＊／えんざん：${OP_LABELS[q.tier]}</div>
    <div class="p-sub" style="margin-top: 10px; font-size:24px; font-weight:bold;">【プリント番号: ${printId}】</div>
    <div class="p-sheet" style="grid-template-columns:1fr; margin-top:12px;">
      ${p1}${p2}
    </div>
  `);
}

const STAT_DEFS = [
  { key:'maxHp', name:'<img src="assets/ui_icons/ui_icon_4.png" class="stat-inline-icon"> HP', per:6, desc:'1スキルポイントで さいだいHP+6' },
  { key:'maxMp', name:'<img src="assets/ui_icons/ui_icon_6.png" class="stat-inline-icon"> MP', per:4, desc:'1スキルポイントで さいだいMP+4' },
  { key:'atk', name:'<img src="assets/ui_icons/ui_icon_2.png" class="stat-inline-icon"> こうげき力', per:1, desc:'1スキルポイントで こうげき力+1' },
  { key:'def', name:'<img src="assets/ui_icons/ui_icon_3.png" class="stat-inline-icon"> しゅび力', per:1, desc:'1スキルポイントで しゅび力+1' },
  { key:'spd', name:'<img src="assets/ui_icons/ui_icon_1.png" class="stat-inline-icon"> すばやさ', per:1, desc:'1スキルポイントで すばやさ+1（バーの たまるはやさ）' },
];

/* わりふりちゅうの スキルポイント（まだ G.player に はんえいしていない かりの わりあて）。
   「けってい」ボタンを おして はじめて G.player に てきようされる（おしまちがい ぼうし） */
let statusPending = {};

function showStatus(){
  statusPending = {};
  renderStatus();
}

function statusPendingTotal(){
  return Object.values(statusPending).reduce((a, b) => a + b, 0);
}

function renderStatus(){
  showScreen('screen-status');
  const remaining = G.player.points - statusPendingTotal();
  $('status-points').textContent = `のこりスキルポイント：${remaining}`;
  const list = $('status-list');
  list.innerHTML = '';
  const bonus = equipBonus();
  const bonusMap = { maxHp:bonus.hp, maxMp:bonus.mp, atk:bonus.atk, def:bonus.def, spd:bonus.spd };
  for (const s of STAT_DEFS){
    const row = document.createElement('div');
    row.className = 'status-row';
    const bn = bonusMap[s.key] || 0;
    const pend = statusPending[s.key] || 0;
    const pendingGain = pend * s.per;
    row.innerHTML = `
      <span class="name">${s.name}</span>
      <span class="val">${G.player[s.key]}${pendingGain ? ` <span class="pending-gain">→ ${G.player[s.key] + pendingGain}</span>` : ''}${bn ? ` <small>(+${bn})</small>` : ''}</span>
      <span class="desc">${s.desc}</span>`;
    const btns = document.createElement('div');
    btns.className = 'status-btns';
    const minusBtn = document.createElement('button');
    minusBtn.className = 'btn';
    minusBtn.textContent = '−';
    minusBtn.disabled = pend <= 0;
    minusBtn.onclick = () => {
      if ((statusPending[s.key] || 0) <= 0) return;
      statusPending[s.key]--;
      renderStatus();
    };
    const plusBtn = document.createElement('button');
    plusBtn.className = 'btn btn-primary';
    plusBtn.textContent = '＋';
    plusBtn.disabled = remaining <= 0;
    plusBtn.onclick = () => {
      if (G.player.points - statusPendingTotal() <= 0) return;
      statusPending[s.key] = (statusPending[s.key] || 0) + 1;
      renderStatus();
    };
    btns.appendChild(minusBtn);
    btns.appendChild(plusBtn);
    row.appendChild(btns);
    list.appendChild(row);
  }
  const confirmBtn = $('btn-status-confirm');
  const total = statusPendingTotal();
  confirmBtn.disabled = total <= 0;
  confirmBtn.textContent = total > 0 ? `けってい（スキルポイント${total}を つかう）` : 'けってい';
  updateHud();
  renderEquipmentSlots();
}

function confirmStatusAllocation(){
  const total = statusPendingTotal();
  if (total <= 0) return;
  const summary = STAT_DEFS.filter(s => (statusPending[s.key] || 0) > 0)
    .map(s => `${s.name.replace(/<[^>]+>/g, '')} +${statusPending[s.key] * s.per}`)
    .join('<br>');
  showConfirmModal('スキルポイントの わりふり',
    `つぎの ないようで けっていします。<br>${summary}<br>よろしいですか？`,
    () => {
      for (const s of STAT_DEFS){
        const pend = statusPending[s.key] || 0;
        if (pend <= 0) continue;
        const gain = pend * s.per;
        G.player[s.key] += gain;
        if (s.key === 'maxHp') G.player.hp += gain;
        if (s.key === 'maxMp') G.player.mp += gain;
        G.player.points -= pend;
      }
      save();
      statusPending = {};
      renderStatus();
    });
}

/* はい／いいえの かくにんダイアログ（きょうつう部品）。とりけしできない
   そうさの まえに つかう（例：スキルポイントの わりふり かくてい） */
function showConfirmModal(title, message, onYes){
  document.querySelector('.confirm-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="panel confirm-card">
      <h3>${title}</h3>
      <div class="confirm-message">${message}</div>
      <div class="confirm-actions">
        <button class="btn" id="btn-confirm-no">いいえ</button>
        <button class="btn btn-primary" id="btn-confirm-yes">はい</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  $('btn-confirm-no').onclick = () => overlay.remove();
  $('btn-confirm-yes').onclick = () => { overlay.remove(); onYes(); };
}

/* ==========================================================
   装備画面（けいさんに正解して装備）
   ========================================================== */
const SLOT_LABELS = { weapon:'ぶき', armor:'よろい', accessory:'アクセサリ' };

function statName(k) {
  const icons = { hp:'ui_icon_4.png', mp:'ui_icon_6.png', atk:'ui_icon_2.png', def:'ui_icon_3.png', spd:'ui_icon_1.png' };
  if (icons[k]) return `<img src="${av('assets/ui_icons/' + icons[k])}" class="stat-inline-icon">`;
  return {hp:'HP', mp:'MP', atk:'ATK', def:'DEF', spd:'SPD'}[k] || k;
}

/* そうびの各ステータスの理論上の最大値（★5の最強装備基準）。
   バー表示のパーセント計算に使う */
function equipStatCap(key){
  let maxBase = 0;
  for (const db of [EQUIP_DB, ANCIENT_EQUIP_DB]){
    for (const item of db){
      if (item.stat[key] && item.stat[key] > maxBase) maxBase = item.stat[key];
    }
  }
  return Math.max(1, Math.floor(maxBase * RARITY_MULTI[RARITY_MAX]));
}
const EQUIP_STAT_CAP = { atk:equipStatCap('atk'), def:equipStatCap('def'), spd:equipStatCap('spd'), mp:equipStatCap('mp'), hp:equipStatCap('hp') };

function equipStatBarsHtml(stat){
  return Object.entries(stat).map(([k, v]) => {
    const pct = Math.min(100, Math.round(v / (EQUIP_STAT_CAP[k] || v) * 100));
    return `<div class="equip-stat-row">
      <span class="equip-stat-label">${statName(k)}</span>
      <div class="stat-bar equip-stat-bar"><div class="stat-bar-fill ${k}" style="width:${pct}%"></div></div>
      <span class="equip-stat-val">+${v}</span>
    </div>`;
  }).join('');
}

/* そうびコストの視覚化：四角いブロック1個＝コスト1。上限ぶんのマスの うち
   つかっている分だけ 色がつく */
function costBarHtml(used, cap){
  let blocks = '';
  for (let i = 1; i <= cap; i++){
    blocks += `<span class="cost-block${i <= used ? ' filled' : ''}"></span>`;
  }
  return `<div class="cost-bar-label">そうびコスト：<b class="${used > cap ? 'bad' : ''}">${used}</b> / ${cap}</div>
    <div class="cost-bar">${blocks}</div>`;
}

/* ==========================================================
   武器屋（ゴールドで そうびを こうにゅう）
   タブ（全て／武器／防具／アクセサリー）で 一覧を きりかえられる
   ========================================================== */
const WEAPON_SHOP_TABS = [
  { key:'all', label:'全て' },
  { key:'weapon', label:'武器' },
  { key:'armor', label:'防具' },
  { key:'accessory', label:'アクセサリー' },
];
let weaponShopFilter = 'all';

function showWeaponShop(){
  showScreen('screen-weapon-shop');
  renderWeaponShopTabs();
  renderWeaponShopList();
}

function renderWeaponShopTabs(){
  const tabs = $('weapon-shop-tabs');
  tabs.innerHTML = WEAPON_SHOP_TABS.map(t =>
    `<button class="shop-tab-btn${t.key === weaponShopFilter ? ' active' : ''}" data-slot="${t.key}">${t.label}</button>`
  ).join('');
  tabs.querySelectorAll('.shop-tab-btn').forEach(btn => {
    btn.onclick = () => {
      weaponShopFilter = btn.dataset.slot;
      renderWeaponShopTabs();
      renderWeaponShopList();
    };
  });
}

function renderWeaponShopList(){
  $('weapon-shop-gold').textContent = G.player.gold;
  const list = $('weapon-shop-list');
  list.innerHTML = '';
  const items = weaponShopFilter === 'all' ? EQUIP_DB : EQUIP_DB.filter(db => db.slot === weaponShopFilter);
  for (const db of items){
    const stat = calcEquipStat(db.stat, 1);
    const statText = Object.entries(stat).map(([k, v]) => `${statName(k)}+${v}`).join(' ');
    const owned = G.ownedEquips.some(o => o.id === db.id);
    const isOverCost = db.cost > costCap();
    
    let btnText = 'かう';
    if (owned) btnText = 'こうにゅうずみ';
    else if (isOverCost) btnText = 'コスト不足（装備できません）';
    else if (G.player.gold < db.price) btnText = 'おかねがたりない';
    
    const card = document.createElement('div');
    card.className = 'item-card shop-card';
    card.innerHTML = `
      <div class="item-card-icon rarity-1">${iconHtml(db.emoji, 48)}</div>
      <div class="item-card-name">${db.name}</div>
      <div class="item-card-stars rarity-1">${rarityLabelHtml(1)}</div>
      <span class="tag">${SLOT_LABELS[db.slot]}</span><span class="tag cost-tag" style="${isOverCost ? 'color:#ff6b6b;' : ''}">コスト${db.cost}</span>
      <div class="shop-card-stat">${statText}</div>
      <div class="shop-card-price">${owned ? '' : db.price + 'G'}</div>
      <button class="btn shop-card-buy" ${owned || G.player.gold < db.price || isOverCost ? 'disabled' : ''}>${btnText}</button>
    `;
    if (!owned && !isOverCost) card.querySelector('.shop-card-buy').onclick = () => buyEquip(db);
    list.appendChild(card);
  }
}

function buyEquip(db){
  if (G.player.gold < db.price) return;
  if (G.ownedEquips.some(o => o.id === db.id)) return;
  G.player.gold -= db.price;
  G.ownedEquips.push({ uid: G.nextUid++, id: db.id, rarity: 1, ability: null });
  save();
  showEquipPurchaseReveal({ kind:'equip', name: db.name, rarity: 1, icon: db.emoji, ability: null });
}

function renderEquipmentSlots(){
  for (const slot of EQUIP_SLOTS){
    const el = $(`slot-${slot}`);
    const eq = G.equipment[slot];
    let owned = null;
    let db = null;
    if (eq) {
      owned = G.ownedEquips.find(o => o.uid === eq.uid);
      if (owned) {
        db = getEquipTemplate(owned.id);
      }
    }
    
    if (!db){
      el.innerHTML = `<span class="slot-label">${SLOT_LABELS[slot]}</span>
        <div class="equip-icon equip-icon-empty">${HOME_EQUIP_SLOT_EMPTY_ICON[slot] || '？'}</div>
        <button class="btn btn-equip-change" data-slot="${slot}" style="margin-top:5px;">そうびする</button>`;
    } else {
      const stat = calcEquipStat(db.stat, owned.rarity);
      const abilityInfo = owned.ability ? getAbility(owned.ability) : null;
      el.innerHTML = `<span class="slot-label">${SLOT_LABELS[slot]}</span>
        <div class="equip-icon rarity-${owned.rarity}">${iconHtml(db.emoji, 56)}</div>
        <span class="rarity-${owned.rarity}">${rarityLabelHtml(owned.rarity)} ${db.name}</span>
        <span class="tag cost-tag">コスト${equipCost(db, owned.rarity)}</span>
        <div class="equip-stat-bars">${equipStatBarsHtml(stat)}</div>
        ${abilityInfo ? `<div class="desc ability-desc">✨ ${abilityInfo.name}（${abilityInfo.desc}）</div>` : ''}
        <button class="btn btn-equip-change" data-slot="${slot}" style="margin-top:5px;">かえる</button>
        <button class="btn btn-unequip" style="margin-top:5px;">外す</button>`;
      el.querySelector('.btn-unequip').onclick = () => {
        G.equipment[slot] = null;
        save();
        renderEquipmentSlots();
        renderStatus();
      };
    }
    
    el.querySelector('.btn-equip-change').onclick = () => {
      openEquipSelectModal(slot);
    };
  }

  $('equip-cost-bar').innerHTML = costBarHtml(usedCost(), costCap());
}

function openEquipSelectModal(targetSlot) {
  const modal = $('equip-select-modal');
  const list = $('equip-select-list');
  $('equip-select-title').textContent = `${SLOT_LABELS[targetSlot]} をえらぶ`;
  
  list.innerHTML = '';
  const equipsForSlot = G.ownedEquips.filter(o => {
    const db = getEquipTemplate(o.id);
    return db && db.slot === targetSlot;
  });
  
  for (const owned of equipsForSlot){
    const db = getEquipTemplate(owned.id);
    const equipped = G.equipment[db.slot] && G.equipment[db.slot].uid === owned.uid;
    const cost = equipCost(db, owned.rarity);
    const wouldExceed = !equipped && (usedCost(db.slot) + cost > costCap());
    const row = document.createElement('div');
    row.className = 'inv-row';
    const stat = calcEquipStat(db.stat, owned.rarity);
    const abilityInfo = owned.ability ? getAbility(owned.ability) : null;
    row.innerHTML = `<div class="equip-icon rarity-${owned.rarity}">${iconHtml(db.emoji, 56)}</div>
    <div class="info">
      <span class="rarity-${owned.rarity}">${rarityLabelHtml(owned.rarity)} ${db.name}</span>
      <span class="tag cost-tag${wouldExceed ? ' cost-tag-over' : ''}">コスト${cost}</span>
      ${equipped ? '<span class="tag mastered">装備中</span>' : ''}
      <div class="equip-stat-bars">${equipStatBarsHtml(stat)}</div>
      ${abilityInfo ? `<div class="desc ability-desc">✨ ${abilityInfo.name}（${abilityInfo.desc}）</div>` : ''}
      <div class="desc">そうび計算: ${OP_LABELS[db.opTier]}</div>
      ${wouldExceed ? '<div class="desc bad">コストが たりない</div>' : ''}</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = equipped ? 'はずす' : 'そうび';
    btn.disabled = wouldExceed;
    btn.onclick = () => {
      if (equipped){
        G.equipment[db.slot] = null;
        save();
        renderEquipmentSlots();
        renderStatus();
        openEquipSelectModal(targetSlot);
      } else {
        closeEquipSelectModal();
        startEquipFlow(owned, db);
      }
    };
    row.appendChild(btn);
    list.appendChild(row);
  }
  if (equipsForSlot.length === 0) list.innerHTML = '<div class="flavor">このしゅるいの そうびを もっていない。</div>';
  modal.style.display = 'flex';
}

function closeEquipSelectModal() {
  $('equip-select-modal').style.display = 'none';
}

function startEquipFlow(owned, db){
  if (usedCost(db.slot) + equipCost(db, owned.rarity) > costCap()){
    showStatus();
    return;
  }
  showScreen('screen-training');
  $('btn-training-quit').textContent = 'やめる';
  $('training-title').textContent = `「${db.name}」を そうびする`;
  $('training-progress').textContent = `けいさん（${OP_LABELS[db.opTier]}）に せいかいして そうびしよう！`;
  const tier = db.opTier || 'add1';
  startChallenge($('training-challenge'),
    { problem:generateProblem(tier), timeLimit:problemTimeLimit(tier) + 4000, prompt:'けいさんの こたえを にゅうりょく！' },
    (res) => {
      destroyChallenge();
      if (res.success){
        hitTrainingDummy();
        G.equipment[db.slot] = { uid: owned.uid };
        save();
        trainingDone(`ゆうしゃは 「${db.name}」を そうびした！`);
      } else {
        trainingDone('けいさんに しっぱいした…。もういちど ちょうせんしよう。');
      }
    });
}

function trainingDone(msg){
  $('training-progress').innerHTML = `<span class="mastered">${msg}</span>`;
  $('training-challenge').innerHTML = '';
  $('btn-training-quit').textContent = '戻る';
}

/* ==========================================================
   スキル修行
   ========================================================== */
let trainingSkill = null;

function showSkills(){
  showScreen('screen-skills');
  const list = $('skill-list');
  list.innerHTML = '';
  for (const s of SKILL_DB){
    const st = G.skills[s.id] || { level:0, progress:0 };
    const locked = G.player.lvl < (s.reqLvl || 1);
    const learned = st.level >= 1;
    const tier = skillTier(s);
    const row = document.createElement('div');
    row.className = 'skill-row' + (locked ? ' skill-row-locked' : '');
    row.innerHTML = `
      ${iconHtml(s.emoji, 48)}
      <div class="info">
      ${learned ? `<span class="mastered">✓</span> ` : ''}${s.name}
      <span class="tag">🧮${OP_LABELS[tier]}</span><span class="tag">MP${s.mp}</span>
      ${locked ? `<span class="tag locked">🔒Lv.${s.reqLvl}で解放</span>` : ''}
      <div class="desc">${s.desc}</div>
      ${locked
        ? '<div class="desc locked">まだ しゅぎょうできない</div>'
        : learned
          ? '<div class="desc mastered">しゅうとく ずみ！ せんとうで つかえる</div>'
          : `<div class="skill-progress"><div class="skill-progress-fill" style="width:${st.progress / s.trainReq * 100}%"></div></div>
             <div class="desc">しゅうとくまで ${st.progress}/${s.trainReq}</div>`}
      </div>`;
    const btnGroup = document.createElement('div');
    btnGroup.className = 'skill-row-btns';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = learned ? 'しゅうとくずみ' : 'しゅぎょう';
    btn.disabled = learned || locked;
    btn.onclick = () => startTraining(s);
    const printBtn = document.createElement('button');
    printBtn.className = 'btn';
    printBtn.textContent = '🖨️ プリント';
    printBtn.disabled = locked || learned;
    printBtn.onclick = () => printTrainingSheet(s);
    btnGroup.appendChild(btn);
    btnGroup.appendChild(printBtn);
    row.appendChild(btnGroup);
    list.appendChild(row);
  }

  
}

/* ==========================================================
   しゅぎょうプリント（紙で れんしゅうできる もんだいシート）
   ========================================================== */

/* 別ウィンドウを開いてプリント内容だけを印刷する（超高速）*/
function openPrintWindow(htmlContent) {
  const printCSS = `
    @page { size: A4; margin: 8mm; }
    body { font-family: sans-serif; background: #fff; color: #222; padding: 6mm; }
    h1 { font-size: 26px; margin-bottom: 6px; }
    .p-sub { font-size: 15px; color: #555; margin-bottom: 16px; }
    .p-sheet { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 60px; }
    .p-row { font-size: 24px; display: flex; align-items: baseline; gap: 12px; padding: 6px 0; border-bottom: 1px dotted #aaa; }
    .p-num { width: auto; min-width: 34px; color: #888; font-size: 16px; white-space: nowrap; }
    .p-expr { white-space: nowrap; }
    .p-blank { flex: 1; border-bottom: 1px solid #222; min-width: 70px; height: 1.1em; }
    .p-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 60px; }
    .p-meta { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 40px; font-size: 16px; margin-bottom: 18px; }
    .p-meta-name { border-bottom: 1px solid #222; padding: 0 160px 4px 4px; }
    .p-title { font-size: 22px; font-weight: bold; margin-bottom: 8px; }
    .p-name-box { font-size: 16px; margin-bottom: 12px; }
    .p-name-line { display: inline-block; width: 200px; border-bottom: 1px solid #222; }
    .p-desc { font-size: 14px; color: #555; margin-bottom: 16px; }
    .p-bonus-banner { background: #fffde7; border: 2px solid #f9a825; border-radius: 8px; padding: 8px 12px; margin-bottom: 16px; font-size: 15px; }
  `;
  const pw = window.open('', '_blank', 'width=800,height=900');
  if (!pw) { alert('ポップアップがブロックされました。許可してください。'); return; }
  pw.document.open();
  pw.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>プリント</title><style>${printCSS}</style></head><body>${htmlContent}</body></html>`);
  pw.document.close();
  pw.focus();
  pw.onload = () => pw.print();
  setTimeout(() => pw.print(), 500);
}
/* プリント選択モーダルを表示する（3バリアント選択→印刷・保存） 
   variants: [{ title, problems, buildHtml, onSelect }] */
function showPrintChoiceModal(variants) {
  const modal = document.getElementById('modal-print-choice');
  const cardsEl = document.getElementById('print-choice-cards');
  cardsEl.innerHTML = '';

  const labels = ['🅰 Aセット', '🅱 Bセット', '🅲 Cセット'];

  variants.forEach((v, i) => {
    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(255,255,255,0.08); border:2px solid #4b6584; border-radius:12px; padding:16px; width:230px; cursor:pointer; transition: border-color 0.2s; max-height:70vh; overflow-y:auto;';
    card.onmouseover = () => card.style.borderColor = '#f9ca24';
    card.onmouseout = () => card.style.borderColor = '#4b6584';

    // プレビュー（全問表示）
    const previewHtml = v.problems.map((p, pi) =>
      `<div style="font-size:14px; padding:4px 0; border-bottom:1px dotted rgba(255,255,255,0.2);">${pi+1}. ${p.text} = ？</div>`
    ).join('');

    card.innerHTML = `
      <div style="font-size:18px; font-weight:bold; margin-bottom:10px; color:#f9ca24;">${labels[i]}</div>
      <div style="font-size:13px; color:#aaa; margin-bottom:10px;">${v.problems.length}問 (${v.opLabel || ''})</div>
      <div style="margin-bottom:12px;">${previewHtml}</div>
      <button class="btn btn-primary" style="width:100%; font-size:16px;">🖨️ これを印刷する</button>
    `;

    card.querySelector('button').onclick = () => {
      modal.classList.add('hidden');
      v.onSelect();
    };

    cardsEl.appendChild(card);
  });

  modal.classList.remove('hidden');
}
window.showPrintChoiceModal = showPrintChoiceModal;


function printTrainingSheet(s){
  const count = 10;
  const tier = resolveTrainingTier(s);

  // 3種類のセットを生成
  const variants = ['🅰 Aセット', '🅱 Bセット', '🅲 Cセット'].map((label, vi) => {
    const problems = [];
    for (let i = 0; i < count; i++) problems.push(generateProblem(tier));
    return {
      problems,
      opLabel: OP_LABELS[tier],
      onSelect: () => {
        const p1 = problems.slice(0, 5).map((p, i) =>
          `<div class="p-row"><span class="p-num">${i + 1}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
        ).join('');
        const p2 = problems.slice(5, 10).map((p, i) =>
          `<div class="p-row"><span class="p-num">${i + 6}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
        ).join('');
        const code = problems.map(p => String(p.answer).slice(-1)).join('');
        const printId = addPrintCode(s.id, code, { type: 'skill', problems, name: s.name });
        save();
        openPrintWindow(`
          <div style="display:flex; align-items:center; gap:12px;"><h1>${s.name}の修行プリント</h1></div>
          <div class="p-sub">えんざん：${OP_LABELS[tier]}／${label}／ぜんぶで ${count}もん</div>
          <div class="p-sub" style="font-size:20px; font-weight:bold;">【プリント番号: ${printId}】</div>
          <div class="p-sheet">${p1}${p2}</div>
        `);
      }
    };
  });

  showPrintChoiceModal(variants);
}

/* ==========================================================
   あんごう にゅうりょく（プリントの こたえから とくぎを かくとく）
   ========================================================== */
function startCodeEntry(s){
  showScreen('screen-training');
  $('btn-training-quit').textContent = 'やめる';
  $('training-title').textContent = `＊${s.name}の あんごう＊`;

  const hasCode = hasPrintCode(s.id);
  if (!hasCode) {
    $('training-progress').innerHTML = 'まだ プリントした もんだいシートが ないみたい。さきに 🖨️プリントで もんだいを といてみよう！';
    $('training-challenge').innerHTML = '';
    return;
  }

  $('training-progress').innerHTML = `プリントした 10もんの こたえから つくった あんごう（すうじ10けた）を にゅうりょくしよう！`;
  $('training-challenge').innerHTML = `
    <input type="text" inputmode="numeric" id="code-input" class="challenge-input" maxlength="20" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
    <button id="code-submit" class="btn btn-primary" style="margin-top:12px;">けってい</button>
    <p class="result-text" id="code-result"></p>
  `;

  const input = $('code-input');
  input.addEventListener('input', () => {
    input.value = toHalfWidth(input.value).replace(/[^0-9]/g, '');
  });
  input.focus();

  $('code-submit').onclick = () => {
    const val = input.value;
    if (checkPrintCode(s.id, val)) {
      removePrintCode(s.id, val);
      if (s.id === 'levelup') {
        const lvlBefore = G.player.lvl;
        const maxHpBefore = totalMaxHp();
        const maxMpBefore = totalMaxMp();
        G.player.lvl += 5;
        G.player.points += 15;
        G.player.maxHp += LEVEL_UP_HP_GAIN * 5;
        G.player.maxMp += LEVEL_UP_MP_GAIN * 5;
        G.player.hp = totalMaxHp();
        G.player.mp = totalMaxMp();
        save();
        trainingDone(`あんごう せいかい！ ゆうしゃは レベルが 5 あがって Lv${G.player.lvl}に なった！`);
        const unlockedSkills = SKILL_DB.filter(s2 => (s2.reqLvl || 1) > lvlBefore && (s2.reqLvl || 1) <= G.player.lvl);
        showLevelUpModal({
          fromLvl: lvlBefore, toLvl: G.player.lvl,
          hpBefore: maxHpBefore, hpAfter: totalMaxHp(),
          mpBefore: maxMpBefore, mpAfter: totalMaxMp(),
          pointsGained: 15, unlockedSkills,
        });
      } else {
        const st = G.skills[s.id] || (G.skills[s.id] = { level:0, progress:0 });
        st.level = 1;
        st.progress = 0;
        save();
        trainingDone(`あんごう せいかい！ ゆうしゃは 「${s.name}」を しゅうとくした！`);
      }
    } else {
      const resultEl = $('code-result');
      resultEl.textContent = 'ちがう あんごうだよ…。もういちど プリントを みなおしてみよう。';
      resultEl.className = 'result-text bad';
      input.classList.remove('flash-ng'); void input.offsetWidth; input.classList.add('flash-ng');
      SM.playBeep('error');
    }
  };
}

/* ==========================================================
   古代装備の せっけいず プリント＆あんごう
   ========================================================== */
function printBlueprintSheet(bp, uid){
  const count = 20;
  const equipDb = getEquipTemplate(bp.equipId);

  const variants = ['🅰 Aセット', '🅱 Bセット', '🅲 Cセット'].map((label, vi) => {
    const problems = [];
    for (let i = 0; i < count; i++) problems.push(generateProblem(bp.tier));
    return {
      problems,
      opLabel: OP_LABELS[bp.tier],
      onSelect: () => {
        const p1 = problems.slice(0, 10).map((p, i) =>
          `<div class="p-row"><span class="p-num">${i + 1}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
        ).join('');
        const p2 = problems.slice(10, 20).map((p, i) =>
          `<div class="p-row"><span class="p-num">${i + 11}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
        ).join('');
        const code = problems.map(p => String(p.answer).slice(-1)).join('');
        const printId = addPrintCode(bp.id, code, { type: 'blueprint', uid, problems, name: bp.name });
        save();
        openPrintWindow(`
          <h1>古代装備の せっけいず：${bp.name}</h1>
          <div class="p-sub">えんざん：${OP_LABELS[bp.tier]}／${label}／${count}もん／「${equipDb.name}」を かいどく！</div>
          <div class="p-sub" style="font-size:20px; font-weight:bold;">【プリント番号: ${printId}】</div>
          <div class="p-sheet">${p1}${p2}</div>
        `);
      }
    };
  });

  showPrintChoiceModal(variants);
}

function startBlueprintCodeEntry(uid, bp){
  showScreen('screen-training');
  $('btn-training-quit').textContent = 'やめる';
  $('training-title').textContent = `＊${bp.name}の あんごう＊`;

  const hasCode = hasPrintCode(bp.id);
  if (!hasCode) {
    $('training-progress').innerHTML = 'まだ プリントした せっけいずが ないみたい。さきに 🖨️プリントで もんだいを といてみよう！';
    $('training-challenge').innerHTML = '';
    return;
  }

  const equipDb = getEquipTemplate(bp.equipId);
  $('training-progress').innerHTML = `プリントした 10もんの こたえから つくった あんごう（すうじ10けた）を にゅうりょくしよう！`;
  $('training-challenge').innerHTML = `
    <input type="text" inputmode="numeric" id="code-input" class="challenge-input" maxlength="20" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
    <button id="code-submit" class="btn btn-primary" style="margin-top:12px;">けってい</button>
    <p class="result-text" id="code-result"></p>
  `;

  const input = $('code-input');
  input.addEventListener('input', () => {
    input.value = toHalfWidth(input.value).replace(/[^0-9]/g, '');
  });
  input.focus();

  $('code-submit').onclick = () => {
    const val = input.value;
    if (checkPrintCode(bp.id, val)) {
      removePrintCode(bp.id, val);
      removeItem(uid, 1);
      const ability = rollAbility(5);
      G.ownedEquips.push({ uid: G.nextUid++, id: bp.equipId, rarity: 5, ability });
      save();
      const abilityInfo = ability ? getAbility(ability) : null;
      trainingDone(`あんごう せいかい！ でんせつの そうび「<span class="rarity-5">${rarityLabelHtml(5)} ${equipDb.name}</span>」を てにいれた！${abilityInfo ? `<br><span class="tag ability">✨ ${abilityInfo.name}（${abilityInfo.desc}）</span>` : ''}`);
    } else {
      const resultEl = $('code-result');
      resultEl.textContent = 'ちがう あんごうだよ…。もういちど プリントを みなおしてみよう。';
      resultEl.className = 'result-text bad';
      input.classList.remove('flash-ng'); void input.offsetWidth; input.classList.add('flash-ng');
      SM.playBeep('error');
    }
  };
}

/* ==========================================================
   魔王城の秘密プリント（タイトル画面の魔王城から開く）
   ========================================================== */
function openDemonCastleModal(){
  const modal = $('modal-demon-castle-secret');
  if (modal) {
    modal.classList.remove('hidden');
    SM.playBeep('type');
    const hint = $('demon-sheet-status-hint');
    const code = hasPrintCode('demon_castle');
    if (hint) {
      if (code) {
        hint.innerHTML = '<span style="color:#2ecc71;">✅ プリントが発行されています！「🔑 魔王のあんごうをいれる」を押して入力しよう！</span>';
      } else {
        hint.innerHTML = 'まずは 🖨️プリントを印刷して解いてみよう！';
      }
    }
  }
}

function printDemonCastleSheet(){
  // 算数と漢字の混合20問
  const count = 20;
  const problems = [];
  for (let i = 0; i < 15; i++) {
    const tier = pick(['add5', 'sub5', 'mul4', 'div3', 'div4']);
    problems.push(generateProblem(tier));
  }
  for (let i = 0; i < 5; i++) {
    const g = pick(['kanji_g1', 'kanji_g2', 'kanji_g3', 'kanji_g4', 'kanji_g5', 'kanji_g6']);
    const kp = generateKanjiProblem(g);
    problems.push({ text: `【漢字】${kp.text}`, answer: kp.answer.length });
  }
  
  const code = problems.map(p => String(Math.abs(parseInt(p.answer, 10) || 1)).slice(-1)).join('');
  const printId = addPrintCode('demon_castle', code, { type: 'demon_castle', problems, name: '禁断の魔王城' });
  if (G) save();

  
  const p1 = problems.slice(0, 5).map((p, i) =>
    `<div class="p-row"><span class="p-num">${i + 1}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
  ).join('');
  const p2 = problems.slice(5, 10).map((p, i) =>
    `<div class="p-row"><span class="p-num">${i + 6}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
  ).join('');
  

  const codeBoxes = problems.map((p, i) =>
    `<div class="p-code-box"><span class="p-code-num">${i + 1}</span><span class="p-code-cell"></span></div>`
  ).join('');

  const titleHtml = `<div style="display:flex; align-items:center; gap:12px;"><span style="font-size:42px;">👑</span> <h1>禁断の魔王城 秘密の試練プリント</h1></div>`;

  openPrintWindow(`
    ${titleHtml}
    <div class="p-sub" style="margin-top: 10px;">魔王の秘宝を手に入れるための特別問題／ぜんぶで ${count}もん</div>
    <div class="p-sub" style="margin-top: 10px; font-size:24px; font-weight:bold;">【プリント番号: ${printId}】</div>\n    ${printMetaHtml()}
    <div class="p-sheet">${p1}${p2}</div>
    
  `);
  const hint = $('demon-sheet-status-hint');
  if (hint) {
    hint.innerHTML = '<span style="color:#2ecc71;">✅ プリントを印刷しました！解き終わったら「🔑 魔王のあんごうをいれる」を押してね！</span>';
  }
}

function openDemonCastleCodeInput(){
  const modal = $('modal-demon-castle-secret');
  if (modal) modal.classList.add('hidden');

  showScreen('screen-training');
  
  // 「やめる」ボタンの処理を上書きして、Gがない場合はタイトルに戻れるようにする
  const quitBtn = $('btn-training-quit');
  const originalQuit = quitBtn.onclick;
  quitBtn.textContent = 'やめる';
  quitBtn.onclick = () => {
    stopChallenge();
    quitBtn.onclick = originalQuit; // 元に戻す
    if (!G) {
      showScreen('screen-title');
    } else {
      showHome();
    }
  };

  $('training-title').textContent = '＊禁断の魔王城 あんごう入力＊';

  const hasCode = hasPrintCode('demon_castle');
  if (!hasCode) {
    $('training-progress').innerHTML = 'まだ プリントした 魔王城シートが ないみたい。さきに 🖨️プリントで もんだいを といてみよう！';
    $('training-challenge').innerHTML = '';
    return;
  }

  $('training-progress').innerHTML = `プリントした 20もんの こたえから つくった あんごう（すうじ20けた）を にゅうりょくしよう！`;
  $('training-challenge').innerHTML = `
    <input type="text" inputmode="numeric" id="code-input" class="challenge-input" maxlength="20" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
    <button id="code-submit" class="btn btn-primary" style="margin-top:12px;">けってい</button>
    <p class="result-text" id="code-result"></p>
  `;

  const input = $('code-input');
  input.addEventListener('input', () => {
    input.value = toHalfWidth(input.value).replace(/[^0-9]/g, '');
  });
  input.focus();

  $('code-submit').onclick = () => {
    const val = input.value;
    if (checkPrintCode('demon_castle', val)) {
      removePrintCode('demon_castle', val);

      if (G) {
        G.player.exp += 1000;
        G.player.gold += 10000;
        const ability = rollAbility(5);
        const equip = {
          uid: G.nextUid++,
          id: 'demon_sword',
          rarity: 5,
          ability
        };
        G.ownedEquips.push(equip);
        save();

        quitBtn.onclick = originalQuit; // 戻す
        playItemRevealSequence([
          { kind:'item', name:'ゴールド 10,000 G', icon:'💰' },
          { kind:'item', name:'経験値 1,000 EXP', icon:'✨' },
          { kind:'equip', name:'魔王の覇剣 (★5 レジェンド)', icon:'⚔️', rarity:5, ability }
        ], {
          badge: '👑 試練突破！',
          title: '魔王の秘宝 解放！！',
          showSummary: true,
          onDone: showHome
        });
      } else {
        // Gがない（タイトル画面）場合はフラグを立てておく
        storageSet('guest_demon_castle_cleared', '1');
        quitBtn.onclick = originalQuit; // 戻す
        const msg = 'あんごう せいかい！！\n「あたらしく はじめる」か「ぼうけんを つづける」で セーブデータを えらぶと、魔王の秘宝が てにはいるぞ！';
        alert(msg);
        showScreen('screen-title');
      }
    } else {
      const resultEl = $('code-result');
      resultEl.textContent = 'ちがう あんごうだよ…。もういちど プリントを みなおしてみよう。';
      resultEl.className = 'result-text bad';
      input.classList.remove('flash-ng'); void input.offsetWidth; input.classList.add('flash-ng');
      SM.playBeep('error');
    }
  };
}

/* しゅぎょう画面の カカシに「あたった」えんしゅつを 1回 さいせいする */
function hitTrainingDummy(skillId){
  const wrap = $('training-dummy-wrap');
  if (!wrap) return;
  wrap.classList.remove('hit');
  void wrap.offsetWidth;
  wrap.classList.add('hit');

  const sId = skillId || (trainingSkill ? trainingSkill.id : null);
  const s = sId ? SKILL_DB.find(item => item.id === sId) : null;

  // プレイヤーの攻撃力から基本ダメージを算出
  const atk = (typeof effectiveAtk === 'function') ? effectiveAtk() : (G && G.player ? G.player.atk : 20);
  const mult = s ? (s.dmgMult || 1.6) : 1.0;
  const totalDmg = Math.max(1, Math.round(atk * mult));

  TCM.start();
  const canvas = $('training-canvas');
  if (canvas) {
    const w = canvas.width || 240;
    const h = canvas.height || 280;
    const x = w / 2;
    const y = h * 0.45; // カカシの中心部

    if (sId === 'renzoku' || sId === 'renzoku2') {
      // ⚔️ れんぞく斬り：こうげき力×0.8 を 2回攻撃（多段）ダメージ演出
      const singleHitDmg = Math.max(1, Math.round(atk * (s.hitMult || 0.8)));

      TCM.addEffect(new RenzokuSlashEffect(x, y, sId === 'renzoku2'));

      // 1撃目ダメージ（0.12秒後：攻撃力×0.8）
      setTimeout(() => {
        spawnFloatingDamage(wrap, singleHitDmg, 'skill-dmg', TCM);
      }, 120);

      // 2撃目・フィニッシュダメージ（0.38秒後：攻撃力×0.8）
      setTimeout(() => {
        spawnFloatingDamage(wrap, singleHitDmg, 'skill-dmg crit', TCM);
      }, 380);

    } else {
      TCM.addEffect(new SlashEffect(x, y));
      spawnFloatingDamage(wrap, totalDmg, s ? 'skill-dmg' : 'enemy-dmg', TCM);
      if (SM.initialized) SM.playBeep('hit');
    }
  } else if (SM.initialized) {
    SM.playBeep('hit');
  }
}

function startTraining(s){
  showScreen('screen-training');
  $('training-title').textContent = `＊${s.name}の しゅぎょう＊`;
  $('btn-training-quit').textContent = 'やめる';
  trainingSkill = s;
  trainingNext();
}

function trainingNext(){
  const s = trainingSkill;
  const st = G.skills[s.id] || (G.skills[s.id] = { level:0, progress:0 });
  const tier = skillTier(s);
  $('training-progress').innerHTML =
    `しゅぎょうの すすみ（${OP_LABELS[tier]}）：<span class="mastered">${st.progress} / ${s.trainReq}</span>（うちきると すすむ）`;
  startChallenge($('training-challenge'),
    { problem:generateProblem(tier), timeLimit:problemTimeLimit(tier) + 2000 },
    (res) => {
      destroyChallenge();
      if (res.success) {
        st.progress++;
        hitTrainingDummy(s ? s.id : null);
      }
      if (st.progress >= s.trainReq){
        st.level = 1;
        st.progress = 0;
        save();
        trainingDone(`ゆうしゃは 「${s.name}」を しゅうとくした！ せんとうで つかえる！`);
        return;
      }
      save();
      trainingNext();
    });
}

/* ==========================================================
   アイテム画面（拠点）
   ========================================================== */
/* ==========================================================
   道具屋（ゴールドで どうぐを こうにゅう）
   ========================================================== */
function showItemShop(){
  showScreen('screen-item-shop');
  $('item-shop-gold').textContent = G.player.gold;
  const list = $('item-shop-list');
  list.innerHTML = '';
  for (const db of ITEM_DB){
    const card = document.createElement('div');
    card.className = 'item-card shop-card';
    card.innerHTML = `
      <div class="item-card-icon">${iconHtml(db.emoji, 48)}</div>
      <div class="item-card-name">${db.name}</div>
      <div class="shop-card-desc">${db.desc}(効果:${db.value})</div>
      <div class="shop-card-price">${db.price}G</div>
      <button class="btn shop-card-buy" ${G.player.gold < db.price ? 'disabled' : ''}>かう</button>
    `;
    card.querySelector('.shop-card-buy').onclick = () => buyItem(db);
    list.appendChild(card);
  }
}

function buyItem(db){
  if (G.player.gold < db.price) return;
  G.player.gold -= db.price;
  addItem(db.id, 1);
  save();
  showItemShop();
}

function showItems(){
  showScreen('screen-items');
  const list = $('item-list');
  list.innerHTML = '';
  let any = false;
  for (const it of G.items){
    const db = getItemTemplate(it.id);
    if (!db) continue;
    any = true;
    const row = document.createElement('div');
    row.className = 'inv-row';

    if (db.equipId) {
      // 設計図（古代装備の あんごうプリント用アイテム）
      const equipDb = getEquipTemplate(db.equipId);
      row.innerHTML = `<div class="info">📜 ${db.name} ×${it.count} <div class="desc">プリントして あんごうに せいかいすると「${equipDb.name}」が てにはいる</div></div>`;
      const btnGroup = document.createElement('div');
      btnGroup.className = 'skill-row-btns';
      const printBtn = document.createElement('button');
      printBtn.className = 'btn';
      printBtn.textContent = '🖨️ プリント';
      printBtn.onclick = () => printBlueprintSheet(db);
      btnGroup.appendChild(printBtn);
      row.appendChild(btnGroup);
    } else {
      row.innerHTML = `<div class="info">${db.name} ×${it.count} <div class="desc">${db.desc} (効果:${db.value})</div></div>`;
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'つかう';
      btn.onclick = () => { useItem(it.uid, db); updateHud(); save(); showItems(); };
      row.appendChild(btn);
    }
    list.appendChild(row);
  }
  if (!any) list.innerHTML = '<div class="flavor">アイテムを持っていない。</div>';
}

/* ==========================================================
   イベント登録・起動
   ========================================================== */
/* ==========================================================
   ガチャ・合成
   ========================================================== */
function showGacha(){
  showScreen('screen-gacha');
  $('gacha-current-gold').textContent = G.player.gold;
  $('gacha-results').innerHTML = '';
}

/* ガチャの そうび抽選：レアリティは 運まかせのままだが、
   えらばれる きほんアイテムは「そのレアリティで そうびした時のコストが
   いまのコスト上限におさまるもの」から えらぶ。
   レベルが ひくすぎて どれも おさまらない時だけ、いちばん コストの ひくいものを わたす */
function gachaEquipPick(rarity){
  const cap = costCap();
  const eligible = EQUIP_DB.filter(db => equipCost(db, rarity) <= cap);
  if (eligible.length > 0) return pick(eligible);
  const minCost = Math.min(...EQUIP_DB.map(db => equipCost(db, rarity)));
  return pick(EQUIP_DB.filter(db => equipCost(db, rarity) === minCost));
}

function doGacha(times, cost) {
  if (G.player.gold < cost) {
    $('gacha-results').innerHTML = '<span class="bad">ゴールドがたりない！</span>';
    return;
  }
  G.player.gold -= cost;
  $('gacha-current-gold').textContent = G.player.gold;

  let results = [];
  for (let i = 0; i < times; i++) {
    // 2%の かくりつで めずらしい 古代装備の せっけいずが でる
    if (Math.random() < 0.02) {
      const bp = pick(BLUEPRINT_DB);
      addItem(bp.id, 1);
      results.push({ kind:'blueprint', name:bp.name, icon:bp.emoji });
      continue;
    }

    const isEquip = Math.random() < 0.3; // 30% equip, 70% item

    if (isEquip) {
      // レアリティ: ★1 60% / ★2 30% / ★3 9% / ★4 0.7% / ★5 0.3%
      const r = Math.random();
      let rarity;
      if (r < 0.003) rarity = 5;
      else if (r < 0.01) rarity = 4;
      else if (r < 0.10) rarity = 3;
      else if (r < 0.40) rarity = 2;
      else rarity = 1;

      const db = gachaEquipPick(rarity);
      const ability = rollAbility(rarity);
      G.ownedEquips.push({ uid: G.nextUid++, id: db.id, rarity, ability });
      results.push({ kind:'equip', name:db.name, rarity, icon:db.emoji, ability });
    } else {
      const db = pick(ITEM_DB);
      addItem(db.id, 1);
      results.push({ kind:'item', name:db.name, icon:db.emoji });
    }
  }

  $('gacha-results').innerHTML = '<div class="gacha-animation"></div><div class="flavor" style="margin-top:10px;">ガチャを回しています…</div>';

  // Disable buttons while rolling
  const buttons = document.querySelectorAll('#screen-gacha button');
  buttons.forEach(b => b.disabled = true);

  setTimeout(() => {
    save();
    buttons.forEach(b => b.disabled = false);
    playItemRevealSequence(results, { badge:'🎰 ガチャ！', title:'ガチャ けっか', showSummary:true, onDone: showGacha });
  }, 1000);
}

function showSynthesis(){
  showScreen('screen-synthesis');
  const list = $('synthesis-list');
  list.innerHTML = '';
  
  let candidates = [];

  // Find duplicate equips（そうびは★5が上限。アイテムはレアリティがないので合成対象外）
  let eqCount = {};
  for (const eq of G.ownedEquips) {
    if (eq.rarity >= RARITY_MAX) continue;
    let key = `${eq.id}_${eq.rarity}`;
    if(!eqCount[key]) eqCount[key] = { uids:[], id:eq.id, rarity:eq.rarity };
    eqCount[key].uids.push(eq.uid);
  }
  for (const key in eqCount) {
    if (eqCount[key].uids.length >= 2) {
      const c = eqCount[key];
      const db = getEquipTemplate(c.id);
      if(db) {
        candidates.push({ uids: c.uids, id: c.id, rarity: c.rarity, name: db.name, opTier: db.opTier, count: c.uids.length });
      }
    }
  }

  if (candidates.length === 0) {
    list.innerHTML = '<div class="flavor">合成できる そうびがない。（同じレアリティの そうびが2つ必要。レジェンドは合成不可）</div>';
    return;
  }

  for (const c of candidates) {
    const row = document.createElement('div');
    row.className = 'inv-row';
    row.innerHTML = `<div class="info"><span class="rarity-${c.rarity}">${rarityLabelHtml(c.rarity)} ${c.name}</span> (所持:${c.count}) <br><small>2つ消費して1つ上のレアリティにする</small></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = '合成する';
    btn.onclick = () => startSynthesisFlow(c);
    row.appendChild(btn);
    list.appendChild(row);
  }
}

function startSynthesisFlow(c) {
  showScreen('screen-training');
  $('btn-training-quit').textContent = 'やめる';
  $('training-title').textContent = `「${c.name}」の 合成`;

  const tier = c.opTier || 'add1';
  let stage = 0;

  function nextProblem(){
    stage++;
    $('training-progress').innerHTML = `けいさん ${stage}/2 もんめ。りょうほう せいかいで ごうせい せいこう！`;
    startChallenge($('training-challenge'),
      { problem:generateProblem(tier), timeLimit:problemTimeLimit(tier) + 3000, prompt:`${stage}もんめ！ けいさんに こたえよう！` },
      (res) => {
        destroyChallenge();
        if (!res.success){
          trainingDone('しっぱいした…。アイテムは なくなっていない。もういちど ちょうせんしよう。');
          return;
        }
        hitTrainingDummy();
        if (stage < 2){ nextProblem(); return; }
        const nextRarity = Math.min(RARITY_MAX, c.rarity + 1);
        // そうび: 2つの うでを けす
        const uidsToRemove = c.uids.slice(0, 2);
        G.ownedEquips = G.ownedEquips.filter(eq => !uidsToRemove.includes(eq.uid));
        // 装備中なら はずす
        for(const slot of EQUIP_SLOTS) {
          if(G.equipment[slot] && uidsToRemove.includes(G.equipment[slot].uid)) {
            G.equipment[slot] = null;
          }
        }
        const ability = rollAbility(nextRarity);
        const abilityInfo = ability ? getAbility(ability) : null;
        G.ownedEquips.push({ uid: G.nextUid++, id: c.id, rarity: nextRarity, ability });
        save();
        trainingDone(`ごうせい せいこう！ 「<span class="rarity-${nextRarity}">${rarityLabelHtml(nextRarity)} ${c.name}</span>」になった！${abilityInfo ? `<br><span class="tag ability">✨ ${abilityInfo.name}（${abilityInfo.desc}）</span>` : ''}`);
      });
  }
  nextProblem();
}

function bindEvents(){
  const on = (id, fn) => {
    const el = $(id);
    if (el) el.onclick = fn;
  };

  on('btn-newgame', () => {
    showScreen('screen-new-save');
    const nameInput = $('new-save-name');
    if (nameInput) {
      nameInput.value = '';
      setTimeout(() => nameInput.focus(), 50);
    }
  });
  on('btn-new-save-back', () => showScreen('screen-title'));
  on('btn-new-save-start', () => {
    const nameInput = $('new-save-name');
    const key = createSaveSlot(nameInput ? nameInput.value : '');
    startTimeLimitSession(key);
    showScreen('screen-intro'); // チュートリアル画面へ
  });
  
  on('btn-intro-assist', () => {
    G.ownedEquips.push({ uid: G.nextUid, id: 'ast1', rarity: 1, ability: null });
    G.equipment.weapon = { uid: G.nextUid };
    G.nextUid++;
    alert('「かぞえだま」を手に入れた！');
    showHome();
  });
  
  on('btn-intro-sword', () => {
    G.ownedEquips.push({ uid: G.nextUid, id: 'w1', rarity: 1, ability: null });
    G.equipment.weapon = { uid: G.nextUid };
    G.nextUid++;
    alert('「木の剣」を手に入れた！');
    showHome();
  });

  const nameInput = $('new-save-name');
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const startBtn = $('btn-new-save-start');
        if (startBtn) startBtn.click();
      }
    });
  }

  on('btn-continue', showLoadSaveScreen);
  on('btn-load-save-back', () => showScreen('screen-title'));

  on('hotspot-training', showSkills);
  on('hotspot-item-shop', showItemShop);
  on('hotspot-weapon-shop', showWeaponShop);
  on('hotspot-status', showStatus);
  on('hotspot-gacha', showGacha);
  on('hotspot-synthesis', showSynthesis);
  on('hotspot-quest-board', showQuestBoard);
  on('hotspot-adventure', showStageSelect);

  // 教科タブ切り替え
  on('subject-tab-math', () => setSubjectTab('math'));
  on('subject-tab-kanji', () => setSubjectTab('kanji'));

  // さんすうエリア
  on('area-card-tower', () => showStageSelectNew('area1'));
  on('stage-card-dungeon', () => showStageSelectNew('area2'));
  on('stage-card-area3', () => showStageSelectNew('area3'));
  on('stage-card-area4', () => showStageSelectNew('area4'));
  on('stage-card-area11', () => showStageSelectNew('area11'));
  on('stage-card-area12', () => showStageSelectNew('area12'));

  // こくご（漢字）エリア
  on('stage-card-area5', () => showStageSelectNew('area5'));
  on('stage-card-area6', () => showStageSelectNew('area6'));
  on('stage-card-area7', () => showStageSelectNew('area7'));
  on('stage-card-area8', () => showStageSelectNew('area8'));
  on('stage-card-area9', () => showStageSelectNew('area9'));
  on('stage-card-area10', () => showStageSelectNew('area10'));

  on('btn-stage-select-back', showHome);
  on('btn-stage-select-new-back', showStageSelect);

  on('substage-card-tower', () => enterZone('tower'));
  on('substage-card-crypt', () => enterZone('crypt'));
  on('substage-card-bandit', () => enterZone('bandit'));
  on('btn-grass-substage-back', showStageSelect);

  on('btn-goto-admin', () => requestAdminAccess(showAdmin));

  // タイトル画面 魔王城の秘密プリント
  on('title-demon-castle-hotspot', openDemonCastleModal);
  on('btn-demon-secret-close', () => {
    const m = $('modal-demon-castle-secret');
    if (m) m.classList.add('hidden');
  });
  on('btn-print-demon-sheet', printDemonCastleSheet);
  on('btn-code-demon-sheet', openUnifiedCodeEntry);

  on('btn-status-back', showHome);
  on('btn-status-confirm', confirmStatusAllocation);
  on('btn-skills-back', showHome);
  on('btn-items-back', showHome);
  on('btn-equip-select-close', closeEquipSelectModal);
  on('btn-gacha-back', showHome);
  on('btn-item-shop-back', showHome);
  on('btn-item-shop-goto-use', showItems);
  on('btn-weapon-shop-back', showHome);
  on('btn-synthesis-back', showHome);
  on('btn-quest-board-back', () => {
    $('screen-quest-board').classList.add('hidden');
  });

  on('btn-gacha-1', () => doGacha(1, 100));
  on('btn-gacha-6', () => doGacha(6, 500));
  on('btn-gacha-13', () => doGacha(13, 1000));

  on('btn-clear-continue', showHome);
  on('btn-gameover-continue', () => {
    document.querySelector('.gameover-flow-overlay')?.remove();
    showHome();
  });

  on('btn-training-quit', () => {
    destroyChallenge();
    if (trainingSkill) {
      trainingSkill = null;
      showSkills();
    } else if (isTrainingSubquest) {
      isTrainingSubquest = false;
      showHome();
    } else {
      showStatus();
    }
  });
  
  on('btn-show-player-stats', openPlayerStatsModal);
  on('btn-player-stats-close', () => $('player-stats-modal').classList.add('hidden'));
  on('btn-show-kanji-stats', () => {
    $('player-stats-modal').classList.add('hidden');
    $('kanji-stats-modal').classList.remove('hidden');
  });
  on('btn-kanji-stats-close', () => {
    $('kanji-stats-modal').classList.add('hidden');
    $('player-stats-modal').classList.remove('hidden');
  });

  on('btn-admin-filter-all', () => { adminSelectedFilter = 'all'; updateAdminFilterUI('btn-admin-filter-all'); updateAdminStudyDisplay($('admin-stats-slot-select').value); });
  on('btn-admin-filter-math', () => { adminSelectedFilter = 'math'; updateAdminFilterUI('btn-admin-filter-math'); updateAdminStudyDisplay($('admin-stats-slot-select').value); });
  on('btn-admin-filter-kanji', () => { adminSelectedFilter = 'kanji'; updateAdminFilterUI('btn-admin-filter-kanji'); updateAdminStudyDisplay($('admin-stats-slot-select').value); });

  on('btn-admin-get-gold', () => {
    if (G && G.player) {
      G.player.gold += 10000;
      save();
      alert('10,000ゴールドを獲得しました！');
    }
  });

  on('btn-admin-delete-save', () => {
    $('admin-save-manage-modal').classList.remove('hidden');
    renderAdminSaveManageList();
  });
  
  on('btn-admin-cancel-delete-save', () => {
    $('admin-save-manage-modal').classList.add('hidden');
  });

  on('btn-admin-exec-delete-save', () => {
    const checkboxes = document.querySelectorAll('.admin-save-checkbox:checked');
    if (checkboxes.length === 0) {
      alert('さくじょする セーブデータが えらばれていません。');
      return;
    }
    if (confirm(`えらんだ ${checkboxes.length}こ の セーブデータを さくじょ しますか？\n（このそうさは とりけせません！）`)) {
      let currentDeleted = false;
      
      const doDelete = async () => {
        let firestoreDoc = null, firestoreDeleteDoc = null;
        if (window._firestoreDb && window._firebaseUid) {
          try {
            const fs = await import("firebase/firestore");
            firestoreDoc = fs.doc;
            firestoreDeleteDoc = fs.deleteDoc;
          } catch(e) {}
        }
        
        for (const cb of checkboxes) {
          const key = cb.value;
          storageRemove(key);
          if (firestoreDoc && firestoreDeleteDoc) {
            try {
              const docRef = firestoreDoc(window._firestoreDb, "saves", window._firebaseUid + "_" + key);
              await firestoreDeleteDoc(docRef);
            } catch(e) {}
          }
          if (key === currentSlotKey) {
            currentDeleted = true;
            G = null;
            currentSlotKey = null;
          }
        }
        
        alert('さくじょしました。');
        $('admin-save-manage-modal').classList.add('hidden');
        if (currentDeleted) {
          showScreen('screen-title');
        } else {
          renderAdminSaveManageList();
        }
      };
      
      doDelete();
    }
  });

  on('btn-admin-back', () => {
    if (currentSlotKey && G) showHome();
    else showScreen('screen-title');
  });

  const adminCat = $('admin-category-select');
  if (adminCat) {
    adminCat.onchange = renderAdminList;
  }
}

function renderAdminSaveManageList() {
  const listEl = $('admin-save-list');
  if (!listEl) return;
  const slots = listSaveSlots();
  if (slots.length === 0) {
    listEl.innerHTML = '<div style="padding:10px;">セーブデータが ありません。</div>';
    return;
  }
  
  let html = '';
  slots.forEach((s, idx) => {
    const name = s.name || `セーブ ${idx + 1}`;
    const lv = s.lvl || '?';
    const currentMark = (s.key === currentSlotKey) ? '<span style="color:var(--good); font-weight:bold; margin-left:8px;">[いまあそんでいるデータ]</span>' : '';
    html += `
      <label style="display:flex; align-items:center; background:rgba(0,0,0,0.2); padding:8px; border-radius:4px; margin-bottom:6px; cursor:pointer;">
        <input type="checkbox" class="admin-save-checkbox" value="${s.key}" style="margin-right:12px; transform:scale(1.3);">
        <div>
          <strong style="color:var(--accent); font-size:16px;">${name}</strong> (Lv ${lv}) ${currentMark}<br>
          <span style="font-size:12px; color:#aaa;">${new Date(s.updatedAt || 0).toLocaleString()}</span>
        </div>
      </label>
    `;
  });
  listEl.innerHTML = html;
}

/* ==========================================================
   学習成績 ＆ 成長グラフ システム (Pure Canvas 2D)
   ========================================================== */

function getProblemUnitInfo(problem) {
  if (!problem) return { key: 'other', label: 'その他' };
  if (problem.tier && String(problem.tier).startsWith('kanji')) {
    const tierStr = String(problem.tier);
    const match = tierStr.match(/kanji_g(\d)/);
    if (match) {
      return { key: `kanji_${match[1]}`, label: `漢字 小${match[1]}年` };
    }
    const fallback = tierStr.replace('kanji', '').replace(/[^0-9]/g, '');
    return { key: `kanji_${fallback}`, label: `漢字 小${fallback}年` };
  }
  if (explore && explore.areaId && explore.areaId.startsWith('area')) {
    const areaNum = parseInt(explore.areaId.replace('area', ''), 10);
    if (areaNum >= 5 && areaNum <= 10) {
      return { key: `kanji_${areaNum - 4}`, label: `漢字 小${areaNum - 4}年` };
    }
  }
  if (problem.tier) {
    const t = String(problem.tier);
    if (t.startsWith('add')) return { key: 'math_add', label: 'たし算' };
    if (t.startsWith('sub')) return { key: 'math_sub', label: 'ひき算' };
    if (t.startsWith('mul')) return { key: 'math_mul', label: '九九・かけ算' };
    if (t.startsWith('div')) return { key: 'math_div', label: 'わり算' };
    if (t.startsWith('dec')) return { key: 'math_dec', label: '小数' };
    if (t.startsWith('frac')) return { key: 'math_frac', label: '分数' };
    if (t.startsWith('elem5')) return { key: 'math_elem5', label: '小5算数' };
    if (t.startsWith('elem6')) return { key: 'math_elem6', label: '小6算数' };
  }
  if (problem.text) {
    if (problem.text.includes('+')) return { key: 'math_add', label: 'たし算' };
    if (problem.text.includes('-') || problem.text.includes('－')) return { key: 'math_sub', label: 'ひき算' };
    if (problem.text.includes('×')) return { key: 'math_mul', label: 'かけ算' };
    if (problem.text.includes('÷')) return { key: 'math_div', label: 'わり算' };
  }
  return { key: 'math_calc', label: '計算' };
}

function recordStudyAnswer(problem, isCorrect) {
  if (!G) return;
  if (!G.studyStats) {
    G.studyStats = { totalAnswers: 0, totalCorrect: 0, units: {}, stageHistory: {} };
  }
  const stats = G.studyStats;
  stats.totalAnswers = (stats.totalAnswers || 0) + 1;
  if (isCorrect) stats.totalCorrect = (stats.totalCorrect || 0) + 1;

  const { key, label } = getProblemUnitInfo(problem);
  if (!stats.units) stats.units = {};
  if (!stats.units[key]) {
    stats.units[key] = { label, total: 0, correct: 0, initialTotal: 0, initialCorrect: 0, history: [] };
  }
  const u = stats.units[key];
  u.total++;
  if (isCorrect) u.correct++;
  if (u.total <= 8) {
    u.initialTotal = u.total;
    u.initialCorrect = u.correct;
  }
  
  if (key.startsWith('kanji_')) {
    if (!stats.kanjiWords) stats.kanjiWords = {};
    const word = problem.text;
    if (!stats.kanjiWords[word]) {
      stats.kanjiWords[word] = { total: 0, correct: 0 };
    }
    stats.kanjiWords[word].total++;
    if (isCorrect) stats.kanjiWords[word].correct++;
  }
  u.history.push({ t: Date.now(), ok: isCorrect ? 1 : 0 });
  if (u.history.length > 50) u.history.shift();

  // ステージ別履歴
  if (explore && explore.areaId) {
    if (!stats.stageHistory) stats.stageHistory = {};
    const stageKey = `${explore.areaId}_${explore.stageIndex !== undefined ? explore.stageIndex : 'boss'}`;
    if (!stats.stageHistory[stageKey]) {
      const area = AREA_STAGES[explore.areaId];
      const sName = explore.stageIndex !== undefined && area && area.stages[explore.stageIndex] ? area.stages[explore.stageIndex].name : (area ? area.name : explore.areaId);
      stats.stageHistory[stageKey] = { label: `${area ? area.name : explore.areaId} (${sName})`, total: 0, correct: 0, history: [] };
    }
    const sHist = stats.stageHistory[stageKey];
    sHist.total++;
    if (isCorrect) sHist.correct++;
    sHist.history.push({ t: Date.now(), ok: isCorrect ? 1 : 0 });
    if (sHist.history.length > 30) sHist.history.shift();
  }
  save();
}

function renderStudySummary(prefix, stats) {
  const totalEl = $(`${prefix}-stat-total-answers`);
  const overallEl = $(`${prefix}-stat-overall-rate`);
  const growthEl = $(`${prefix}-stat-growth-rate`);
  const unitCountEl = $(`${prefix}-stat-unit-count`);

  const total = stats.totalAnswers || 0;
  const correct = stats.totalCorrect || 0;
  const overallRate = total > 0 ? Math.round((correct / total) * 100) : 0;

  if (totalEl) totalEl.textContent = total;
  if (overallEl) overallEl.textContent = overallRate;

  // 平均成長率の算出
  const units = Object.values(stats.units || {});
  let totalGrowth = 0;
  let growthCount = 0;
  units.forEach(u => {
    if (u.total >= 2) {
      const initRate = u.initialTotal > 0 ? (u.initialCorrect / u.initialTotal) * 100 : 0;
      const curRate = (u.correct / u.total) * 100;
      totalGrowth += (curRate - initRate);
      growthCount++;
    }
  });
  const avgGrowth = growthCount > 0 ? Math.max(0, Math.round(totalGrowth / growthCount)) : Math.min(25, Math.round(overallRate * 0.25));
  if (growthEl) {
    growthEl.textContent = `+${avgGrowth}`;
  }
  if (unitCountEl) {
    unitCountEl.textContent = units.length;
  }
}

function drawStudyBarChart(canvasId, unitsList) {
  const canvas = $(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 600;
  const height = Math.max(220, Math.min(360, (unitsList.length || 1) * 44 + 40));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!unitsList || unitsList.length === 0) {
    ctx.fillStyle = '#a0a0c0';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('まだ学習データがありません。バトルで問題を解くとグラフが表示されます！', width / 2, height / 2);
    return;
  }

  const labelW = 120;
  const rightW = 80;
  const barMaxW = width - labelW - rightW - 20;
  const rowH = 40;
  const startY = 20;

  unitsList.forEach((u, idx) => {
    const y = startY + idx * rowH;
    const initRate = u.initialTotal > 0 ? Math.round((u.initialCorrect / u.initialTotal) * 100) : Math.round((u.correct / Math.max(1, u.total)) * 80);
    const latestRate = u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0;
    const growth = latestRate - initRate;

    // 単元ラベル
    ctx.fillStyle = '#efdfc0';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(u.label || '単元', labelW - 10, y + 18);

    // バー背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(labelW, y + 4, barMaxW, 20);

    // 初回バー（青）
    const initW = Math.max(2, (initRate / 100) * barMaxW);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(labelW, y + 4, initW, 8);

    // 最新バー（金）
    const latestW = Math.max(2, (latestRate / 100) * barMaxW);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(labelW, y + 14, latestW, 10);

    // 数値ラベル
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${latestRate}%`, labelW + latestW + 6, y + 22);

    // 成長率 (UP!)
    ctx.fillStyle = growth >= 0 ? '#2ecc71' : '#e74c3c';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(growth >= 0 ? `+${growth}% ⬆` : `${growth}%`, width - 10, y + 18);
  });
}

function drawStageLineChart(canvasId, stageLogs) {
  const canvas = $(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 600;
  const height = 180;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!stageLogs || !stageLogs.history || stageLogs.history.length === 0) {
    ctx.fillStyle = '#a0a0c0';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('このステージの履歴データがありません', width / 2, height / 2);
    return;
  }

  const logs = stageLogs.history;
  const padL = 40, padR = 20, padT = 20, padB = 30;
  const graphW = width - padL - padR;
  const graphH = height - padT - padB;

  // グリッド線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const gy = padT + (graphH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(width - padR, gy);
    ctx.stroke();
    ctx.fillStyle = '#8888aa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${100 - i * 25}%`, padL - 6, gy + 3);
  }

  // 折れ線描画
  let runningCorrect = 0;
  const points = logs.map((log, idx) => {
    runningCorrect += log.ok;
    const rate = Math.round((runningCorrect / (idx + 1)) * 100);
    const x = padL + (graphW / Math.max(1, logs.length - 1)) * idx;
    const y = padT + graphH - (rate / 100) * graphH;
    return { x, y, rate };
  });

  if (points.length > 0) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, padT + graphH);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, padT + graphH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3;
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    points.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9f43';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }
}

function openPlayerStatsModal() {
  const modal = $('player-stats-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  if (!G.studyStats) {
    G.studyStats = { totalAnswers: 0, totalCorrect: 0, units: {}, stageHistory: {} };
  }
  
  // 古い漢字キー（kanji_g1_1 等）を新しいキー（kanji_1 等）にマージするクリーンアップ
  if (G.studyStats.units) {
    Object.keys(G.studyStats.units).forEach(k => {
      if (k.startsWith('kanji_') && !['kanji_1','kanji_2','kanji_3','kanji_4','kanji_5','kanji_6'].includes(k)) {
        const match = k.match(/g?(\d)/); // kanji_g1_1 -> 1
        if (match) {
          const targetKey = `kanji_${match[1]}`;
          if (k !== targetKey) {
            const oldU = G.studyStats.units[k];
            if (!G.studyStats.units[targetKey]) {
              G.studyStats.units[targetKey] = { label: `漢字 小${match[1]}年`, total: 0, correct: 0, initialTotal: 0, initialCorrect: 0, history: [] };
            }
            const tgt = G.studyStats.units[targetKey];
            tgt.total += oldU.total || 0;
            tgt.correct += oldU.correct || 0;
            tgt.initialTotal += oldU.initialTotal || 0;
            tgt.initialCorrect += oldU.initialCorrect || 0;
            tgt.history = tgt.history.concat(oldU.history || []).sort((a,b)=>a.t-b.t).slice(-50);
            delete G.studyStats.units[k];
          }
        }
      }
    });
  }

  renderStudySummary('player', G.studyStats);

  const unitsList = Object.values(G.studyStats.units || {});
  drawStudyBarChart('player-study-chart', unitsList);

  const select = $('player-stats-stage-select');
  if (select) {
    select.innerHTML = '';
    const stages = Object.entries(G.studyStats.stageHistory || {});
    if (stages.length === 0) {
      select.innerHTML = '<option value="">履歴なし</option>';
      drawStageLineChart('player-stage-chart', null);
    } else {
      stages.forEach(([k, s]) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = s.label || k;
        select.appendChild(opt);
      });
      select.onchange = () => {
        drawStageLineChart('player-stage-chart', G.studyStats.stageHistory[select.value]);
      };
      drawStageLineChart('player-stage-chart', stages[0][1]);
    }
  }

  const kanjiList = $('player-kanji-stats-list');
  if (kanjiList) {
    const kw = G.studyStats.kanjiWords || {};
    let html = '';
    
    for (let g = 1; g <= 6; g++) {
      const poolKey = `kanji_g${g}`;
      const pool = window.KANJI_POOLS && window.KANJI_POOLS[poolKey] ? window.KANJI_POOLS[poolKey] : [];
      if (pool.length === 0) continue;
      
      let solvedCount = 0;
      let gradeHtml = '<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">';
      
      pool.forEach(item => {
        const word = item.text;
        const st = kw[word];
        let color = '#555';
        let bg = 'rgba(255,255,255,0.05)';
        let rateText = '未挑戦';
        
        if (st && st.total > 0) {
          solvedCount++;
          const rate = Math.round((st.correct / st.total) * 100);
          if (rate <= 50) color = '#ff6b6b';
          else if (rate === 100) color = '#feca57';
          else if (rate >= 80) color = '#1dd1a1';
          else color = '#3498db';
          rateText = `${rate}% (${st.correct}/${st.total}回)`;
          bg = 'rgba(255,255,255,0.1)';
        }
        
        gradeHtml += `<div style="background:${bg}; border-left:3px solid ${color}; padding:4px 8px; border-radius:3px; min-width:80px;">
          <strong style="font-size:15px; color:${st ? '#fff' : '#888'};">${word}</strong><br>
          <span style="font-size:11px; color:${color};">${rateText}</span>
        </div>`;
      });
      gradeHtml += '</div>';
      
      const isOpen = solvedCount > 0 ? 'open' : '';
      html += `<details ${isOpen} style="margin-bottom:10px; background:rgba(0,0,0,0.2); padding:8px; border-radius:6px;">
        <summary style="cursor:pointer; font-weight:bold; font-size:16px; color:var(--accent); user-select:none; outline:none;">
          小学${g}年の漢字 <span style="font-size:12px; font-weight:normal; color:#ccc;">(挑戦: ${solvedCount}/${pool.length})</span>
        </summary>
        ${gradeHtml}
      </details>`;
    }
    
    if (!html) html = '（漢字データが見つかりません）';
    kanjiList.innerHTML = html;
  }
}

let adminSelectedFilter = 'all';

function renderAdminStudyStats() {
  const slotSelect = $('admin-stats-slot-select');
  const slots = listSaveSlots();
  if (slotSelect) {
    slotSelect.innerHTML = '';
    slots.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.key;
      opt.textContent = `${s.name} (Lv${s.lvl || 1})`;
      if (s.key === currentSlotKey) opt.selected = true;
      slotSelect.appendChild(opt);
    });
    slotSelect.onchange = () => updateAdminStudyDisplay(slotSelect.value);
  }
  updateAdminStudyDisplay(currentSlotKey || (slots[0] && slots[0].key));
}

function updateAdminStudyDisplay(slotKey) {
  if (!slotKey) return;
  const raw = storageGet(slotKey);
  const data = raw ? JSON.parse(raw) : null;
  const stats = (data && data.studyStats) ? data.studyStats : { totalAnswers: 0, totalCorrect: 0, units: {}, stageHistory: {} };

  renderStudySummary('admin', stats);

  let units = Object.entries(stats.units || {}).map(([k, v]) => ({ key: k, ...v }));
  if (adminSelectedFilter === 'math') units = units.filter(u => u.key.startsWith('math'));
  if (adminSelectedFilter === 'kanji') units = units.filter(u => u.key.startsWith('kanji'));

  drawStudyBarChart('admin-study-chart', units);

  // テーブル更新
  const table = $('admin-study-table');
  if (table) {
    let html = `
      <thead>
        <tr>
          <th>単元名</th>
          <th>解答数</th>
          <th>初期正答率</th>
          <th>最新正答率</th>
          <th>成長度</th>
          <th>評価</th>
        </tr>
      </thead>
      <tbody>
    `;
    if (units.length === 0) {
      html += `<tr><td colspan="6" style="text-align:center; color:#888; padding:12px;">学習履歴がまだありません</td></tr>`;
    } else {
      units.forEach(u => {
        const initRate = u.initialTotal > 0 ? Math.round((u.initialCorrect / u.initialTotal) * 100) : 0;
        const curRate = u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0;
        const growth = curRate - initRate;
        const badge = curRate >= 80 ? '🌟 とくい！' : (growth >= 15 ? '🔥 せいちょう中！' : '📖 れんしゅう中');
        html += `
          <tr>
            <td><strong>${u.label}</strong></td>
            <td>${u.total}問</td>
            <td>${initRate}%</td>
            <td><strong style="color:#f1c40f;">${curRate}%</strong></td>
            <td><span style="color:${growth >= 0 ? '#2ecc71' : '#e74c3c'}; font-weight:bold;">${growth >= 0 ? '+' : ''}${growth}%</span></td>
            <td>${badge}</td>
          </tr>
        `;
      });
    }
    html += `</tbody>`;
    table.innerHTML = html;
  }

  // ステージセレクト
  const stageSelect = $('admin-stats-stage-select');
  if (stageSelect) {
    stageSelect.innerHTML = '';
    const stages = Object.entries(stats.stageHistory || {});
    if (stages.length === 0) {
      stageSelect.innerHTML = '<option value="">履歴なし</option>';
      drawStageLineChart('admin-stage-chart', null);
    } else {
      stages.forEach(([k, s]) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = s.label || k;
        stageSelect.appendChild(opt);
      });
      stageSelect.onchange = () => {
        drawStageLineChart('admin-stage-chart', stats.stageHistory[stageSelect.value]);
      };
      drawStageLineChart('admin-stage-chart', stages[0][1]);
    }
  }
}

function updateAdminFilterUI(activeId) {
  ['btn-admin-filter-all', 'btn-admin-filter-math', 'btn-admin-filter-kanji'].forEach(id => {
    const btn = $(id);
    if (btn) btn.classList.toggle('is-active', id === activeId);
  });
}

/* ==========================================================
   管理者設定（敵カスタマイズ ＆ 保護者向けレポート）
   ========================================================== */
let editingEnemyKey = null;
let editingEnemyZone = null;

function showAdmin() {
  showScreen('screen-admin');
  $('admin-list-view').classList.remove('hidden');
  $('admin-edit-view').classList.add('hidden');
  renderAdminList();
  renderAdminTimeLimitList();
  renderAdminStudyStats();
  checkTimeLimit();
  const goldBtn = $('btn-admin-get-gold');
  if (goldBtn) goldBtn.classList.toggle('hidden', !(currentSlotKey && G));
  const delBtn = $('btn-admin-delete-save');
  if (delBtn) delBtn.classList.remove('hidden'); // 常に表示
}

function renderAdminList() {
  const zone = $('admin-category-select').value;
  const listEl = $('admin-enemy-list');
  listEl.innerHTML = '';
  
  let source, keys;
  if (zone === 'boss') {
    source = BOSSES;
    keys = Object.keys(source);
  } else if (zone === 'equipment') {
    source = EQUIP_DB;
    keys = source.map(d => d.id);
  } else if (zone === 'item') {
    source = ITEM_DB;
    keys = source.map(d => d.id);
  } else {
    source = ENEMY_POOLS[zone];
    keys = source.map((_, i) => i);
  }

  for (const k of keys) {
    let tmpl, iconHTML, statsText;
    if (zone === 'equipment' || zone === 'item') {
      tmpl = zone === 'equipment' ? getEquipTemplate(k) : getItemTemplate(k);
      iconHTML = `<span style="font-size:32px;">${tmpl.emoji || '📦'}</span>`;
      if (tmpl.emoji && (tmpl.emoji.startsWith('http') || tmpl.emoji.startsWith('data:') || tmpl.emoji.includes('.png'))) {
        iconHTML = `<img src="${av(tmpl.emoji)}" class="admin-enemy-img">`;
      }
      statsText = zone === 'equipment' 
        ? Object.entries(tmpl.stat).map(([sk,sv])=>`${sk}:${sv}`).join(' ')
        : `効果量:${tmpl.value}`;
    } else {
      tmpl = getEnemyTemplate(zone, k);
      iconHTML = `<span style="font-size:32px;">${tmpl.emoji}</span>`;
      if (tmpl.emoji.startsWith('http') || tmpl.emoji.startsWith('data:') || tmpl.emoji.includes('.png')) {
        iconHTML = `<img src="${av(tmpl.emoji)}" class="admin-enemy-img">`;
      }
      statsText = `HP:${tmpl.hp} ATK:${tmpl.atk} DEF:${tmpl.def} SPD:${tmpl.spd}`;
    }

    const item = document.createElement('div');
    item.className = 'inventory-item';
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        ${iconHTML}
        <div>
          <strong>${tmpl.name}</strong><br>
          <small>${statsText}</small>
        </div>
      </div>
      <button class="btn">へんしゅう</button>
    `;
    item.querySelector('button').onclick = () => openAdminEdit(zone, k, tmpl);
    listEl.appendChild(item);
  }
}

function openAdminEdit(zone, key, tmpl) {
  editingEnemyZone = zone;
  editingEnemyKey = key;
  $('admin-list-view').classList.add('hidden');
  $('admin-edit-view').classList.remove('hidden');
  
  $('admin-edit-name').value = tmpl.name;
  $('admin-edit-emoji').value = tmpl.emoji || '';
  
  $('admin-edit-hp').value = tmpl.hp || (tmpl.stat && tmpl.stat.hp) || 0;
  $('admin-edit-atk').value = tmpl.atk || (tmpl.stat && tmpl.stat.atk) || 0;
  $('admin-edit-def').value = tmpl.def || (tmpl.stat && tmpl.stat.def) || 0;
  $('admin-edit-spd').value = tmpl.spd || (tmpl.stat && tmpl.stat.spd) || 0;
  $('admin-edit-exp').value = tmpl.exp || 0;
  $('admin-edit-value').value = tmpl.value || (tmpl.stat && tmpl.stat.mp) || 0;

  const gold = tmpl.gold || [0,0];
  $('admin-edit-gmin').value = gold[0] !== undefined ? gold[0] : tmpl.goldMin || 0;
  $('admin-edit-gmax').value = gold[1] !== undefined ? gold[1] : tmpl.goldMax || 0;
}

$('btn-admin-cancel').onclick = () => {
  $('admin-list-view').classList.remove('hidden');
  $('admin-edit-view').classList.add('hidden');
};

$('btn-admin-save').onclick = () => {
  const z = editingEnemyZone;
  const k = editingEnemyKey;
  
  if (z === 'equipment') {
    if (!customEquips[k]) customEquips[k] = {};
    customEquips[k].name = $('admin-edit-name').value;
    customEquips[k].emoji = $('admin-edit-emoji').value;
    customEquips[k].stat = {};
    if (parseInt($('admin-edit-atk').value)) customEquips[k].stat.atk = parseInt($('admin-edit-atk').value);
    if (parseInt($('admin-edit-def').value)) customEquips[k].stat.def = parseInt($('admin-edit-def').value);
    if (parseInt($('admin-edit-spd').value)) customEquips[k].stat.spd = parseInt($('admin-edit-spd').value);
    if (parseInt($('admin-edit-value').value)) customEquips[k].stat.mp = parseInt($('admin-edit-value').value);
  } else if (z === 'item') {
    if (!customItems[k]) customItems[k] = {};
    customItems[k].name = $('admin-edit-name').value;
    customItems[k].emoji = $('admin-edit-emoji').value;
    customItems[k].value = parseInt($('admin-edit-value').value)||0;
  } else {
    if (!customEnemies[z]) customEnemies[z] = {};
    customEnemies[z][k] = {
      name: $('admin-edit-name').value,
      emoji: $('admin-edit-emoji').value,
      hp: parseInt($('admin-edit-hp').value)||1,
      atk: parseInt($('admin-edit-atk').value)||0,
      def: parseInt($('admin-edit-def').value)||0,
      spd: parseInt($('admin-edit-spd').value)||0,
      exp: parseInt($('admin-edit-exp').value)||0,
      gold: [parseInt($('admin-edit-gmin').value)||0, parseInt($('admin-edit-gmax').value)||0]
    };
  }
  
  saveCustomData();
  $('admin-list-view').classList.remove('hidden');
  $('admin-edit-view').classList.add('hidden');
  renderAdminList();
};

$('btn-admin-reset').onclick = () => {
  const z = editingEnemyZone;
  const k = editingEnemyKey;
  if (z === 'equipment') {
    delete customEquips[k];
  } else if (z === 'item') {
    delete customItems[k];
  } else if (customEnemies[z] && customEnemies[z][k]) {
    delete customEnemies[z][k];
  }
  saveCustomData();
  $('admin-list-view').classList.remove('hidden');
  $('admin-edit-view').classList.add('hidden');
  renderAdminList();
};

/* ==========================================================
   じかんせいげん（セーブデータごとの プレイ時間の管理）＋ アナログ時計
   ========================================================== */
const TIME_LIMIT_KEY = 'typing_rpg_timelimit_v2'; // { [slotKey]: {enabled, minutes} }
const TIME_LIMIT_SESSION_KEY = 'typing_rpg_timelimit_session_v1'; // { [slotKey]: セッションしゅうりょうtimestamp }

function getAllTimeLimitSettings(){
  try {
    const raw = storageGet(TIME_LIMIT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}
function saveAllTimeLimitSettings(map){
  storageSet(TIME_LIMIT_KEY, JSON.stringify(map));
}
function getTimeLimitForSlot(slotKey){
  const all = getAllTimeLimitSettings();
  return all[slotKey] || { enabled: false, minutes: 30 };
}
function setTimeLimitForSlot(slotKey, settings){
  const all = getAllTimeLimitSettings();
  all[slotKey] = settings;
  saveAllTimeLimitSettings(all);
}

function getAllTimeLimitSessions(){
  try {
    const raw = storageGet(TIME_LIMIT_SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}
function saveAllTimeLimitSessions(map){
  storageSet(TIME_LIMIT_SESSION_KEY, JSON.stringify(map));
}
/* セーブデータを 読み込んだ（あそびはじめた）タイミングで呼ぶ。じかんせいげんが
   ゆうこうなら、その時点から せっていぶんの 分数だけ カウントダウンする
   セッションしゅうりょう時刻を あたらしく セットする */
function startTimeLimitSession(slotKey){
  if (!slotKey) return;
  const settings = getTimeLimitForSlot(slotKey);
  const sessions = getAllTimeLimitSessions();
  if (settings.enabled && settings.minutes > 0) {
    sessions[slotKey] = Date.now() + settings.minutes * 60000;
  } else {
    delete sessions[slotKey];
  }
  saveAllTimeLimitSessions(sessions);
}
function getSessionEndForSlot(slotKey){
  if (!slotKey) return null;
  return getAllTimeLimitSessions()[slotKey] || null;
}
function isSlotPastTimeLimit(slotKey){
  if (!slotKey) return false;
  const settings = getTimeLimitForSlot(slotKey);
  if (!settings.enabled) return false;
  const endAt = getSessionEndForSlot(slotKey);
  if (!endAt) return false;
  return Date.now() >= endAt;
}

function buildClockTicks(){
  const g = $('clock-ticks');
  if (!g || g.childElementCount > 0) return;
  for (let i = 0; i < 12; i++){
    const deg = i * 30;
    const major = i % 3 === 0;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '50');
    line.setAttribute('y1', major ? '6' : '9');
    line.setAttribute('x2', '50');
    line.setAttribute('y2', '14');
    line.setAttribute('class', 'clock-tick');
    line.setAttribute('transform', `rotate(${deg} 50 50)`);
    if (major) line.style.strokeWidth = '2.6';
    g.appendChild(line);
  }
}

function updateAnalogClock(){
  const now = new Date();
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();

  const hourDeg = h * 30 + m * 0.5;
  const minuteDeg = m * 6 + s * 0.1;
  const secondDeg = s * 6;

  const hourHand = $('clock-hand-hour');
  const minuteHand = $('clock-hand-minute');
  const secondHand = $('clock-hand-second');
  if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
  if (minuteHand) minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
  if (secondHand) secondHand.style.transform = `rotate(${secondDeg}deg)`;

  const digital = $('clock-digital-time');
  if (digital) digital.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

  const endMarker = $('clock-end-marker');
  const endLabel = $('clock-end-label');
  const settings = currentSlotKey ? getTimeLimitForSlot(currentSlotKey) : null;
  const endAt = currentSlotKey ? getSessionEndForSlot(currentSlotKey) : null;
  if (settings && settings.enabled && endAt) {
    const endDate = new Date(endAt);
    const eh = endDate.getHours();
    const em = endDate.getMinutes();
    const endDeg = (eh % 12) * 30 + em * 0.5;
    if (endMarker) {
      endMarker.style.transform = `rotate(${endDeg}deg)`;
      endMarker.classList.remove('hidden');
    }
    if (endLabel) {
      endLabel.textContent = `🔚 ${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')} まで`;
      endLabel.classList.remove('hidden');
    }
  } else {
    if (endMarker) endMarker.classList.add('hidden');
    if (endLabel) endLabel.classList.add('hidden');
  }
}

function checkTimeLimit(){
  const overlay = $('time-limit-overlay');
  if (!overlay) return;
  const adminScreenActive = $('screen-admin') && $('screen-admin').classList.contains('active');
  if (currentSlotKey && isSlotPastTimeLimit(currentSlotKey) && !adminScreenActive) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

function updateAdminTimeLimitBulkCount(){
  const count = document.querySelectorAll('.admin-timelimit-select:checked').length;
  const countEl = $('admin-timelimit-bulk-count');
  if (countEl) countEl.textContent = count;
}

function renderAdminTimeLimitList(){
  const listEl = $('admin-timelimit-slot-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  const slots = listSaveSlots();
  if (slots.length === 0) {
    listEl.innerHTML = '<div class="flavor">セーブデータが ありません。</div>';
    updateAdminTimeLimitBulkCount();
    return;
  }
  for (const slot of slots) {
    const settings = getTimeLimitForSlot(slot.key);
    const row = document.createElement('div');
    row.className = 'inventory-item admin-timelimit-row';
    row.dataset.slotKey = slot.key;
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; flex:1;">
        <input type="checkbox" class="admin-timelimit-select" title="せんたく">
        <div style="flex:1;">
          <strong>${slot.name}</strong> <span class="tag" style="margin-left:6px;">Lv${slot.lvl}</span>
          <div class="admin-timelimit-row-controls" style="display:flex; align-items:center; gap:8px; margin-top:6px; flex-wrap:wrap;">
            <label style="display:flex; align-items:center; gap:4px; font-size:12px;">
              <input type="checkbox" class="admin-timelimit-row-enabled" ${settings.enabled ? 'checked' : ''}>ゆうこう
            </label>
            <input type="number" class="admin-time-input admin-timelimit-row-minutes" min="1" value="${settings.minutes || 30}">分
            <button class="btn good admin-timelimit-row-save" style="padding:6px 10px; font-size:12px; width:auto;">ほぞん</button>
            <small class="admin-timelimit-row-status">${settings.enabled ? settings.minutes + '分に せっていちゅう' : 'オフ'}</small>
          </div>
        </div>
      </div>
    `;
    row.querySelector('.admin-timelimit-select').onchange = updateAdminTimeLimitBulkCount;
    row.querySelector('.admin-timelimit-row-save').onclick = () => {
      const enabled = row.querySelector('.admin-timelimit-row-enabled').checked;
      const minutes = Math.max(1, parseInt(row.querySelector('.admin-timelimit-row-minutes').value) || 30);
      setTimeLimitForSlot(slot.key, { enabled, minutes });
      row.querySelector('.admin-timelimit-row-status').textContent = enabled ? `${minutes}分に せっていちゅう` : 'オフ';
      updateAnalogClock();
      checkTimeLimit();
    };
    listEl.appendChild(row);
  }
  updateAdminTimeLimitBulkCount();
}

/* ==========================================================
   かんりしゃせってい パスワードゲート（きょうの日づけ4けた：MMDD）
   ========================================================== */
function computeTodayPasscode(){
  const now = new Date();
  return String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
}

let adminAccessGrantedCallback = null;

/* パスワードにゅうりょくモーダルを表示し、せいかいしたら onSuccess を呼ぶ */
function requestAdminAccess(onSuccess){
  const overlay = $('admin-password-overlay');
  const input = $('admin-password-input');
  const errorEl = $('admin-password-error');
  if (!overlay || !input) { onSuccess(); return; }
  adminAccessGrantedCallback = onSuccess;
  input.value = '';
  if (errorEl) errorEl.textContent = '';
  overlay.classList.remove('hidden');
  setTimeout(() => input.focus(), 50);
}

function closeAdminPasswordModal(){
  const overlay = $('admin-password-overlay');
  if (overlay) overlay.classList.add('hidden');
  adminAccessGrantedCallback = null;
}

function submitAdminPassword(){
  const input = $('admin-password-input');
  const errorEl = $('admin-password-error');
  if (!input) return;
  if (input.value === computeTodayPasscode()) {
    const cb = adminAccessGrantedCallback;
    closeAdminPasswordModal();
    if (cb) cb();
  } else {
    if (errorEl) errorEl.textContent = 'パスワードが ちがいます。';
    input.value = '';
    input.focus();
  }
}

function initAdminPasswordGate(){
  const submitBtn = $('btn-admin-password-submit');
  const cancelBtn = $('btn-admin-password-cancel');
  const input = $('admin-password-input');
  if (submitBtn) submitBtn.onclick = submitAdminPassword;
  if (cancelBtn) cancelBtn.onclick = closeAdminPasswordModal;
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAdminPassword();
    });
  }
}

function initTimeLimitFeature(){
  buildClockTicks();
  updateAnalogClock();
  checkTimeLimit();
  setInterval(() => { updateAnalogClock(); checkTimeLimit(); }, 1000);

  const bulkApplyBtn = $('btn-admin-timelimit-bulk-apply');
  if (bulkApplyBtn) {
    bulkApplyBtn.onclick = () => {
      const selectedKeys = Array.from(document.querySelectorAll('.admin-timelimit-select:checked'))
        .map(cb => cb.closest('.admin-timelimit-row').dataset.slotKey);
      if (selectedKeys.length === 0) {
        alert('セーブデータを 1つ以上 えらんでください。');
        return;
      }
      const enabled = $('admin-timelimit-bulk-enabled').checked;
      const minutes = Math.max(1, parseInt($('admin-timelimit-bulk-minutes').value) || 30);
      for (const key of selectedKeys) {
        setTimeLimitForSlot(key, { enabled, minutes });
      }
      renderAdminTimeLimitList();
      updateAnalogClock();
      checkTimeLimit();
    };
  }

  const overlayAdminBtn = $('btn-time-limit-admin');
  if (overlayAdminBtn) {
    overlayAdminBtn.onclick = () => {
      requestAdminAccess(() => {
        $('time-limit-overlay').classList.add('hidden');
        showAdmin();
      });
    };
  }
}

let initDone = false;
function init(){
  if (initDone) return; // init()が二重に呼ばれてもミュートボタンの二重登録を防ぐ
  initDone = true;

  try {
    startBootLoader();   // タイトルの うえに かぶさっている ロード画面を うごかす
  } catch (e) {
    console.warn('startBootLoader error:', e);
  }

  try {
    bindEvents();
    migrateLegacySaveIfNeeded();
    if (listSaveSlots().length > 0) {
      const continueBtn = $('btn-continue');
      if (continueBtn) continueBtn.classList.remove('hidden');
    }
    showScreen('screen-title');
    initTimeLimitFeature();
    initAdminPasswordGate();
  } catch (err) {
    console.error('Init error:', err);
  }

  // ミュートボタンのセットアップ
  let muteBtn = $('btn-mute');
  if (!muteBtn) {
    muteBtn = document.createElement('button');
    muteBtn.id = 'btn-mute';
    muteBtn.className = 'mute-button';
    muteBtn.title = 'BGM/SE をミュート';
    muteBtn.textContent = '🔊';
    // スタイルを個別に設定
    muteBtn.style.position = 'fixed';
    muteBtn.style.top = '20px';
    muteBtn.style.right = '20px';
    muteBtn.style.width = '80px';
    muteBtn.style.height = '80px';
    muteBtn.style.borderRadius = '50%';
    muteBtn.style.background = 'linear-gradient(135deg, #FF6B35 0%, #FF9F1C 100%)';
    muteBtn.style.border = '4px solid #FFF';
    muteBtn.style.fontSize = '45px';
    muteBtn.style.cursor = 'pointer';
    muteBtn.style.zIndex = '99999';
    muteBtn.style.display = 'flex';
    muteBtn.style.alignItems = 'center';
    muteBtn.style.justifyContent = 'center';
    muteBtn.style.boxShadow = '0 6px 20px rgba(255, 159, 28, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    muteBtn.style.padding = '0';
    muteBtn.style.fontWeight = 'bold';
    muteBtn.style.transition = 'all 0.2s ease';
    document.body.appendChild(muteBtn);
  }

  if (muteBtn) {
    muteBtn.onclick = (e) => {
      e.stopPropagation();
      if (!SM.initialized) SM.init();

      SM.muted = !SM.muted;

      if (SM.muted) {
        muteBtn.textContent = '🔇';
        muteBtn.classList.add('muted');
        SM.stopBGM();
      } else {
        muteBtn.textContent = '🔊';
        muteBtn.classList.remove('muted');
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) SM.playBGM(bgmKeyForScreen(activeScreen.id));
      }
    };
  }

  // 音量スライダーのセットアップ
  const volSlider = $('volume-slider');
  const volText = $('volume-text');
  if (volSlider && volText) {
    // 起動時に初期値を反映
    SM.setGlobalVolume(parseInt(volSlider.value, 10) / 100);
    
    volSlider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      volText.textContent = v + '%';
      SM.setGlobalVolume(v / 100);
      
      // ミュート解除連動
      if (v > 0 && SM.muted) {
        SM.muted = false;
        if (muteBtn) {
          muteBtn.textContent = '🔊';
          muteBtn.classList.remove('muted');
        }
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) SM.playBGM(bgmKeyForScreen(activeScreen.id));
      } else if (v === 0 && !SM.muted) {
        SM.muted = true;
        if (muteBtn) {
          muteBtn.textContent = '🔇';
          muteBtn.classList.add('muted');
        }
        SM.stopBGM();
      }
    });
  }

  // メニューボタンのセットアップ
  const menuBtn = $('btn-menu');
  const menuDropdown = $('menu-dropdown');
  if (menuBtn && menuDropdown) {
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('hidden');
    };
    document.addEventListener('click', (e) => {
      if (!menuDropdown.classList.contains('hidden') && !$('menu-container').contains(e.target)) {
        menuDropdown.classList.add('hidden');
      }
    });
  }
  $('btn-menu-home').onclick = () => {
    menuDropdown.classList.add('hidden');
    if (explore) {
      // 探索中の場合は確認ダイアログを出す
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '2000';
      overlay.innerHTML = `
        <div class="modal-panel" style="text-align:center;">
          <h3 style="color:var(--accent); margin-bottom:15px;">きょてんに もどりますか？</h3>
          <p style="margin-bottom:20px;">※今回のたんさくで てにいれたアイテムは もちかえれます</p>
          <div style="display:flex; gap:10px; justify-content:center;">
            <button class="btn btn-primary" id="btn-return-yes">はい</button>
            <button class="btn" id="btn-return-no">いいえ</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('btn-return-no').onclick = () => {
        overlay.remove();
      };

      document.getElementById('btn-return-yes').onclick = () => {
        overlay.remove();
        
        let dropsHtml = '';
        if (explore) {
          dropsHtml = generateDropsSummaryHtml(explore.sessionDrops, explore.sessionGold);
        }

        const proceedReturn = () => {
          if (battle && !battle.over) endBattleLoop();
          if (trainingSkill) { destroyChallenge(); trainingSkill = null; }
          explore = null;
          showHome();
        };

        if (dropsHtml) {
          const resOverlay = document.createElement('div');
          resOverlay.className = 'modal-overlay';
          resOverlay.style.zIndex = '2000';
          resOverlay.innerHTML = `
            <div class="modal-panel" style="text-align:center;">
              ${dropsHtml}
              <button class="btn btn-primary" id="btn-return-ok" style="margin-top:20px; width:100%;">もどる</button>
            </div>
          `;
          document.body.appendChild(resOverlay);
          document.getElementById('btn-return-ok').onclick = () => {
            resOverlay.remove();
            proceedReturn();
          };
        } else {
          proceedReturn();
        }
      };
    } else {
      // 探索中以外なら即座に戻る
      if (battle && !battle.over) endBattleLoop();
      if (trainingSkill) { destroyChallenge(); trainingSkill = null; }
      explore = null;
      showHome();
    }
  };

  $('btn-menu-save-title').onclick = () => {
    menuDropdown.classList.add('hidden');
    if (battle && !battle.over) endBattleLoop();
    if (trainingSkill) { destroyChallenge(); trainingSkill = null; }
    explore = null;
    save();
    if (listSaveSlots().length > 0) $('btn-continue').classList.remove('hidden');
    showScreen('screen-title');
  };
}

/* ==========================================================
   きどう時の ロード画面（NOW LOADING → スタートボタン）
   ・タイトルで つかう おおきい がぞうだけを さきに よみこむ
     （画像フォルダ ぜんぶは 200MB いじょう あるので、ぜんぶ よみこんでは いけない。
       ステージや てきの がぞうは これまでどおり ひつような ときに よみこむ）
   ・スタートボタンは「おとを ならす ための ユーザー操作」も かねている
     （ブラウザは クリックが ないと おとを ならせない ルールに なっている）
   ========================================================== */
const BOOT_ASSETS = [
  '画像/title_sky.jpg',
  '画像/title_foreground.png',
  '画像/title_logo_transparent.png',
];
/* がぞうが 1まいも よみこめない ときでも、ぜったいに ロード画面で とまらない ための ほけん（ミリびょう） */
const BOOT_TIMEOUT_MS = 12000;

function startBootLoader(){
  const screen = $('boot-loader-screen');
  if (!screen) return;
  const pctEl   = $('boot-load-percent');
  const fillEl  = $('boot-progress-fill');
  const barArea = $('boot-loading-bar-area');
  const startArea = $('boot-start-area');
  const startBtn  = $('btn-boot-start');

  const total = BOOT_ASSETS.length;
  let done = 0;
  let ready = false;

  const setPct = (p) => {
    const v = Math.max(0, Math.min(100, Math.round(p)));
    if (pctEl)  pctEl.textContent = v + '%';
    if (fillEl) fillEl.style.width = v + '%';
  };
  setPct(0);

  /* よみこみ かんりょう → スタートボタンを だす */
  const showStart = () => {
    if (ready) return;
    ready = true;
    setPct(100);
    if (barArea)   barArea.classList.add('hidden');
    if (startArea) startArea.classList.remove('hidden');
  };

  // プログレスバーのスムーズな進行アニメーション
  let progress = 0;
  const pInterval = setInterval(() => {
    progress += 25;
    setPct(progress);
    if (progress >= 100) {
      clearInterval(pInterval);
      showStart();
    }
  }, 50);

  // タイムアウト保険（300ms）
  setTimeout(() => {
    clearInterval(pInterval);
    showStart();
  }, 350);

  /* スタート：ここが「はじめての クリック」なので、ここで おとを しょきかする */
  const begin = (e) => {
    if (e) e.stopPropagation();
    if (screen.classList.contains('fade-out')) return; // 二重クリック よけ
    try {
      if (!SM.initialized) SM.init();
    } catch (err) {
      console.warn('SM.init error:', err);
    }
    screen.classList.add('fade-out');
    const fade = $('title-white-fade');
    if (fade){
      fade.classList.remove('hidden');
      setTimeout(() => fade.classList.add('hidden'), 2200); // アニメーションと おなじ ながさ
    }
    showScreen('screen-title');
    setTimeout(() => { if (screen.parentNode) screen.parentNode.removeChild(screen); }, 600);
  };
  if (startBtn) {
    startBtn.onclick = begin;
    startBtn.ontouchend = begin;
  }
  /* ボタン いがいの ばしょを タップしても はじまる（「※画面をタッチ／クリックしてスタート」） */
  screen.addEventListener('click', begin);
  screen.addEventListener('touchend', begin);
}

// DOMがロードされたら実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}



function openUnifiedCodeEntry() {
  const modal = $('modal-unified-code');
  if (modal) {
    modal.classList.remove('hidden');
    $('unified-print-id').value = '';
    $('unified-code-section').style.display = 'block';
    $('unified-problems-section').style.display = 'none';
    $('unified-result').innerHTML = '';
    
    const listEl = $('unified-prints-list');
    listEl.innerHTML = '';
    
    let prints = (G && G.activePrints) ? G.activePrints : {};
    if (!G) {
      try {
        prints = JSON.parse(storageGet('guest_active_prints') || '{}');
      } catch(e){}
    }
    
    const pIds = Object.keys(prints);
    if (pIds.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; padding:12px; color:#aaa;">まだ 発行されたプリントが ありません。</div>';
    } else {
      pIds.forEach(pId => {
        const meta = prints[pId];
  window.currentUnifiedMeta = meta;
  window.currentUnifiedPrintId = pId;
        listEl.innerHTML += `<button class="btn" style="width:100%; text-align:left; margin-bottom:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; background:#2c3e50; border-color:#34495e;" onclick="selectUnifiedPrint('${pId}')">
            <span style="font-size:18px;">🖨️ <b>番号: ${pId}</b> （${meta.name}）</span>
            <span class="tag">全${meta.problems ? meta.problems.length : '?'}問</span>
          </button>`;
      });
    }
  }
}

function selectUnifiedPrint(pId) {
  $('unified-print-id').value = pId;
  fetchUnifiedPrint();
}

// We change the unified flow: they enter Print ID -> click "問題を表示" -> shows the inputs -> they grade.
window.unifiedCurrentPrint = null;

function fetchUnifiedPrint() {
  const pId = $('unified-print-id').value.trim();
  const resEl = $('unified-result');
  if (!pId) {
    resEl.innerHTML = '<span style="color:#ff5c5c;">プリント番号を入力してね！</span>';
    return;
  }
  
  let prints = (G && G.activePrints) ? G.activePrints : {};
  if (!G) {
    try {
      prints = JSON.parse(storageGet('guest_active_prints') || '{}');
    } catch(e){}
  }
  
  const meta = prints[pId];
  window.currentUnifiedMeta = meta;
  window.currentUnifiedPrintId = pId;
  if (!meta || !meta.problems) {
    resEl.innerHTML = '<span style="color:#ff5c5c;">プリントが見つかりません。古いプリントの場合は諦めるか、もう一度プリントを発行してね。</span>';
    return;
  }
  
  window.unifiedCurrentPrint = { printId: pId, meta };
  
  $('unified-code-section').style.display = 'none';
  const probSec = $('unified-problems-section');
  probSec.style.display = 'block';
  
  $('unified-problems-title').textContent = meta.name + ' の 答えあわせ';
  
  const listEl = $('unified-problems-list');
  listEl.innerHTML = '';
  meta.problems.forEach((p, i) => {
    const isKanji = typeof p.answer === 'string' && isNaN(parseInt(p.answer, 10)); // crude check for kanji string vs number
    listEl.innerHTML += `<div class="unified-prob-row" style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:32px;">
      <span style="width:40px; text-align:right;">${i+1}.</span>
      <span style="flex:1; text-align:right;">${p.text} = </span>
      <input type="text" id="unified-ans-${i}" class="challenge-input" style="width:160px; font-size:36px; height: 50px; padding:4px;" ${!isKanji ? 'inputmode="numeric"' : ''}>
      <span id="unified-mark-${i}" style="width:30px; font-weight:bold;"></span>
    </div>`;
  });
  
  if ($('unified-grade-btn-area')) $('unified-grade-btn-area').style.display = 'block';
  if ($('admin-grade-btn-area')) $('admin-grade-btn-area').style.display = 'none';

  resEl.innerHTML = '';
}

function gradeUnifiedPrint() {
  const cur = window.unifiedCurrentPrint;
  if (!cur) return;
  const meta = cur.meta;
  const probs = meta.problems;
  let correct = 0;
  
  probs.forEach((p, i) => {
    const inp = $(`unified-ans-${i}`).value.trim();
    const expected = String(p.answer);
    
    // allow half-width conversion for math, exact for kanji
    const isKanji = typeof p.answer === 'string' && isNaN(parseInt(p.answer, 10));
    const processedInp = isKanji ? inp : toHalfWidth(inp).replace(/[^0-9\-]/g, '');
    
    if (processedInp === expected) {
      correct++;
      $(`unified-mark-${i}`).innerHTML = '<span style="color:#2ecc71;">〇</span>';
    } else {
      $(`unified-mark-${i}`).innerHTML = '<span style="color:#e74c3c;">❌</span>';
    }
  });
  
  const rate = correct / probs.length;
  
  const resEl = $('unified-result');
  resEl.innerHTML = `${probs.length}問中 <b>${correct}問</b> 正解！（正答率: ${Math.floor(rate*100)}％）`;
  
  // Reward logic
  setTimeout(() => {
    grantPrintRewards(cur, correct, probs.length, rate);
  }, 1000);
}

function grantPrintRewards(cur, correct, total, rate) {
  const meta = cur.meta;
  removeResolvedPrint({ printId: cur.printId });
  $('modal-unified-code').classList.add('hidden');
  
  if (!G && meta.targetId === 'demon_castle') {
    if (rate >= 0.5) {
      showConfirmModal('👑 試練突破！', '魔王の試練 を クリアした！\nセーブデータをつくって ログインすれば、\nでんせつの けんが てにはいるぞ！', null);
    } else {
      showConfirmModal('💀 しっぱい…', '正解数が 足りなかったみたいだ。\nもういちど プリントを出して チャレンジしよう！', null);
    }
    return;
  }
  
  let rewards = [];
  
  // Base rewards
  const baseExp = correct * 20;
  const baseGold = correct * 10;
  G.player.exp += baseExp;
  G.player.gold += baseGold;
  if (baseExp > 0) rewards.push({ kind:'item', name:`経験値 ${baseExp} EXP`, icon:'✨' });
  if (baseGold > 0) rewards.push({ kind:'item', name:`ゴールド ${baseGold} G`, icon:'💰' });
  
  // Rate bonuses
  if (rate >= 0.5) {
    // 50%+: random basic item
    const pot = ITEM_DB.find(x => x.id === 'potion');
    addItem('potion', 1);
    rewards.push({ kind:'item', name:`${pot.name} x1`, icon:pot.emoji });
  }
  if (rate >= 0.8) {
    // 80%+: hipotion or ether
    const pool = ['hipotion', 'ether'];
    const itId = pick(pool);
    const db = ITEM_DB.find(x => x.id === itId);
    addItem(itId, 1);
    rewards.push({ kind:'item', name:`${db.name} x1`, icon:db.emoji });
  }
  if (rate >= 1.0) {
    // 100%: Cost Seed!
    const seed = ITEM_DB.find(x => x.id === 'cost_seed');
    addItem('cost_seed', 1);
    rewards.push({ kind:'item', name:`${seed.name} x1`, icon:seed.emoji });
    
    G.player.gold += 500;
    rewards.push({ kind:'item', name:`全問正解ボーナス 500 G`, icon:'💰' });
  }
  
  // Target rewards
  let title = '修行の成果！';
  if (meta.targetId === 'demon_castle' && rate >= 0.5) {
      G.player.exp += 1000;
      G.player.gold += 10000;
      const ability = rollAbility(5);
      const equip = { uid: G.nextUid++, id: 'demon_sword', rarity: 5, ability };
      G.ownedEquips.push(equip);
      rewards.push({ kind:'item', name:'魔王の特別報酬 10,000 G', icon:'💰' });
      rewards.push({ kind:'item', name:'魔王の特別報酬 1,000 EXP', icon:'✨' });
      rewards.push({ kind:'equip', name:'魔王の覇剣 (★5 レジェンド)', icon:'⚔️', rarity:5, ability });
      title = '魔王の秘宝 解放！！';
  } else if (meta.targetId === 'levelup' && rate >= 0.8) {
      G.player.lvl += 5;
      G.player.points += 15;
      G.player.maxHp += LEVEL_UP_HP_GAIN * 5;
      G.player.maxMp += LEVEL_UP_MP_GAIN * 5;
      G.player.hp = totalMaxHp();
      G.player.mp = totalMaxMp();
      title = 'レベルアップ修行 達成！';
  } else if (meta.type === 'skill' && rate >= 0.8) {
      if (!G.skills[meta.targetId]) G.skills[meta.targetId] = { progress:0, level:0 };
      G.skills[meta.targetId].level = 1;
      G.skills[meta.targetId].progress = 10;
      const s = SKILL_DB.find(x => x.id === meta.targetId);
      rewards.push({ kind:'item', name:`とくぎ「${s.name}」を習得！`, icon:'📖' });
  } else if (meta.type === 'blueprint' && rate >= 0.8) {
      removeItem(meta.uid, 1);
      const bp = BLUEPRINTS.find(x => x.id === meta.targetId);
      const equipDb = getEquipTemplate(bp.equipId);
      const ability = rollAbility(5);
      G.ownedEquips.push({ uid: G.nextUid++, id: bp.equipId, rarity: 5, ability });
      rewards.push({ kind:'equip', name:`${equipDb.name} を完成させた！`, icon:'⚔️', rarity:5, ability });
  }
  
  save();
  playItemRevealSequence(rewards, {
    badge: '💮 採点完了',
    title: title,
    showSummary: true,
    onDone: showHome
  });
}

// Make print functions available to HTML onclick attributes
window.openUnifiedCodeEntry = openUnifiedCodeEntry;
window.fetchUnifiedPrint = fetchUnifiedPrint;
window.gradeUnifiedPrint = gradeUnifiedPrint;
window.selectUnifiedPrint = selectUnifiedPrint;


function generatePrintId() {
  let id;
  do { id = String(rnd(1000, 9999)); } while (G && G.activePrints && G.activePrints[id]);
  return id;
}

function addPrintCode(id, newCode, meta = {}) {
  const printId = generatePrintId();
  meta.targetId = id;
  meta.code = newCode;
  
  if (!G) {
    if (id === 'demon_castle') {
      try {
        let prints = JSON.parse(storageGet('guest_active_prints') || '{}');
        prints[printId] = meta;
        storageSet('guest_active_prints', JSON.stringify(prints));
      } catch(e){}
    }
    return printId;
  }
  
  if (!G.activePrints) G.activePrints = {};
  G.activePrints[printId] = meta;
  return printId;
}

function checkUnifiedCode(printId, codeVal) {
  // 1. 新システム (プリント番号指定)
  if (printId) {
    if (!G) {
      try {
        const prints = JSON.parse(storageGet('guest_active_prints') || '{}');
        if (prints[printId] && prints[printId].code === codeVal) {
          return { match: true, meta: prints[printId], printId: printId };
        }
      } catch(e){}
      return { match: false, diff: generateDiff(codeVal, null) }; 
    }
    if (G.activePrints && G.activePrints[printId]) {
      const meta = G.activePrints[printId];
      if (meta.code === codeVal) {
        return { match: true, meta: meta, printId: printId };
      } else {
        return { match: false, diff: generateDiff(codeVal, meta.code) };
      }
    }
    return { match: false, diff: 'プリント番号が見つかりません。' };
  }

  // 2. 旧システム ＆ 番号なし検索 (暗号だけで検索)
  if (!G) {
    let guestOld = storageGet('guest_demon_castle_codes');
    if (guestOld) {
      try {
        let codes = JSON.parse(guestOld);
        if (codes.includes(codeVal)) return { match: true, meta: { targetId: 'demon_castle', code: codeVal }, oldCode: codeVal, oldType: 'guest_demon_castle' };
      } catch(e){}
    }
    return { match: false, diff: '暗号が一致するプリントが見つかりません。' };
  }
  
  if (G.activePrints) {
    for (const [pId, meta] of Object.entries(G.activePrints)) {
      if (meta.code === codeVal) return { match: true, meta: meta, printId: pId };
    }
  }
  
  if (G.printSheetCodes) {
    for (const [targetId, codes] of Object.entries(G.printSheetCodes)) {
      if (Array.isArray(codes) && codes.includes(codeVal)) {
        return { match: true, meta: { targetId: targetId, code: codeVal }, oldCode: codeVal, oldType: 'skill_or_bp' };
      }
      if (typeof codes === 'string' && codes === codeVal) {
        return { match: true, meta: { targetId: targetId, code: codeVal }, oldCode: codeVal, oldType: 'skill_or_bp' };
      }
    }
  }

  return { match: false, diff: '番号なしで検索しましたが、一致する暗号がありませんでした。' };
}

function generateDiff(input, expected) {
  if (!expected) return '';
  let res = [];
  for (let i = 0; i < expected.length; i++) {
    if (i >= input.length) {
      res.push('❌');
    } else {
      res.push(input[i] === expected[i] ? '〇' : '❌');
    }
  }
  return res.join('');
}

function removeResolvedPrint(result) {
  if (result.printId) {
    if (!G) {
      try {
        const prints = JSON.parse(storageGet('guest_active_prints') || '{}');
        delete prints[result.printId];
        storageSet('guest_active_prints', JSON.stringify(prints));
      } catch(e){}
    } else {
      delete G.activePrints[result.printId];
      save();
    }
  } else if (result.oldCode) {
    if (!G && result.oldType === 'guest_demon_castle') {
      try {
        let codes = JSON.parse(storageGet('guest_demon_castle_codes') || '[]');
        codes = codes.filter(c => c !== result.oldCode);
        storageSet('guest_demon_castle_codes', JSON.stringify(codes));
      } catch(e){}
    } else if (G && G.printSheetCodes && result.meta.targetId) {
      let current = G.printSheetCodes[result.meta.targetId];
      if (Array.isArray(current)) {
        G.printSheetCodes[result.meta.targetId] = current.filter(c => c !== result.oldCode);
        if (G.printSheetCodes[result.meta.targetId].length === 0) delete G.printSheetCodes[result.meta.targetId];
      } else {
        delete G.printSheetCodes[result.meta.targetId];
      }
      save();
    }
  }
}



function openAdminGrade() {
  requestAdminAccess(() => {
    const listEl = $('unified-problems-list');
    const cur = window.unifiedCurrentPrint;
    if (!cur || !cur.meta || !cur.meta.problems) return;
    const problems = cur.meta.problems;
    
    // Change inputs to checkboxes for admin and show the answer
    const inputs = listEl.querySelectorAll('input.challenge-input');
    inputs.forEach((input, i) => {
      const ans = problems[i].answer;
      input.outerHTML = `<span style="font-size:32px; color:#e74c3c; font-weight:bold; min-width: 60px;">${ans}</span> <label style="display:flex; align-items:center; gap:8px; margin-left: auto;"><input type="checkbox" class="admin-grade-chk" data-idx="${i}" style="width:36px; height:36px;"> <span style="font-size:24px;">正解</span></label>`;
    });

    const markSpans = listEl.querySelectorAll('span[id^="unified-mark-"]');
    markSpans.forEach(span => span.style.display = 'none');

    $('unified-grade-btn-area').style.display = 'none';
    $('admin-grade-btn-area').style.display = 'flex';
    $('admin-grade-btn-area').style.flexDirection = 'column';
    $('admin-grade-btn-area').style.gap = '12px';
  });
}

function adminGradeAllCorrect() {
  const chks = document.querySelectorAll('.admin-grade-chk');
  chks.forEach(c => c.checked = true);
}

function submitAdminGrade() {
  const cur = window.unifiedCurrentPrint;
  if (!cur || !cur.meta || !cur.meta.problems) return;
  const meta = cur.meta;
  const chks = document.querySelectorAll('.admin-grade-chk');
  let correctCount = 0;
  const count = meta.problems.length;
  
  chks.forEach(chk => {
    if (chk.checked) correctCount++;
  });
  
  const rate = correctCount / count;
  $('unified-result').innerHTML = `<span style="color:#2ecc71;">採点を完了しました！ (正答率: ${Math.floor(rate*100)}%)</span>`;
  
  grantPrintRewards(cur, correctCount, count, rate);
}

window.openAdminGrade = openAdminGrade;
window.adminGradeAllCorrect = adminGradeAllCorrect;
window.submitAdminGrade = submitAdminGrade;



function printAreaStage(areaId, idx) {
  const area = AREA_STAGES[areaId];
  const stage = area.stages[idx];
  const count = 10;
  const numPrefix = area.displayNum || areaId.replace('area', '');
  const printName = `${area.name} ${stage.name}`;

  const variants = ['🅰 Aセット', '🅱 Bセット', '🅲 Cセット'].map((label, vi) => {
    const problems = [];
    for (let i = 0; i < count; i++) problems.push(stage.generateProblem());
    return {
      problems,
      opLabel: stage.name,
      onSelect: () => {
        const p1 = problems.slice(0, 5).map((p, i) =>
          `<div class="p-row"><span class="p-num">${i + 1}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
        ).join('');
        const p2 = problems.slice(5, 10).map((p, i) =>
          `<div class="p-row"><span class="p-num">${i + 6}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
        ).join('');
        const pCode = Array.from({length:6}, () => Math.floor(Math.random()*10)).join('');
        const printId = addPrintCode(areaId + '_' + idx, pCode, { type: 'stage', problems, name: printName, areaId, stageIndex: idx });
        save();
        openPrintWindow(`
          <div class="p-title">【エリア${numPrefix}-${idx+1}】 ${printName} ${label}</div>
          <div class="p-name-box">なまえ：<span class="p-name-line"></span></div>
          <div class="p-bonus-banner">🎉 プリントでクリアすると 通常の<b>3倍以上</b>の報酬が もらえるぞ！</div>
          <div class="p-desc">プリント番号: ${printId}</div>
          <div class="p-cols">
            <div class="p-col">${p1}</div>
            <div class="p-col">${p2}</div>
          </div>
        `);
      }
    };
  });

  showPrintChoiceModal(variants);
}

function printAreaBoss(areaId) {
  const area = AREA_STAGES[areaId];
  const count = 10;
  const problems = [];
  for (let i = 0; i < count; i++) {
    // Boss problem mixing phase 1 & 2
    if (Math.random() < 0.5) problems.push(area.bossPhase1Problem());
    else problems.push(area.bossPhase2Problem());
  }
  
  const p1 = problems.slice(0, 5).map((p, i) =>
    `<div class="p-row"><span class="p-num">${i + 1}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
  ).join('');
  const p2 = problems.slice(5, 10).map((p, i) =>
    `<div class="p-row"><span class="p-num">${i + 6}.</span><span class="p-expr">${p.text} = </span><span class="p-blank"></span></div>`
  ).join('');
  

  const pCode = Array.from({length:6}, () => Math.floor(Math.random()*10)).join('');
  const printName = `${area.name} 👹${area.bossName}`;
  
  const printId = addPrintCode(areaId + '_boss', pCode, { type: 'stage_boss', problems, name: printName, areaId, isBoss: true });

  const numPrefix = area.displayNum || areaId.replace('area', '');
  openPrintWindow(`
    <div class="print-header">
      <div class="p-title" style="color:#c0392b;">【ボス戦 ${numPrefix}-B】 ${printName}</div>
      <div class="p-name-box">なまえ：<span class="p-name-line"></span></div>
    </div>
    <div class="p-desc">すべてのけいさんに こたえて、ボスをとうばつしよう！（プリント番号: ${printId}）</div>
    <div class="p-cols">
      <div class="p-col">${p1}</div>
      <div class="p-col">${p2}</div>
    </div>
  `);
}

