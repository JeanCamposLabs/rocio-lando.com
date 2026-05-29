/* =========================================================================
   Ink Catch — a small canvas arcade game.
   Catch Rocío's falling sketches in the sketchbook; dodge the ink blots.
   Theme-aware, responsive, keyboard + pointer + touch.
   ========================================================================= */

type Phase = 'idle' | 'running' | 'paused' | 'over';
type Kind = 'house' | 'dome' | 'bird' | 'flower' | 'sun' | 'star' | 'blot';

interface Item {
  x: number;
  y: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  kind: Kind;
  good: boolean;
  dead?: boolean;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

const GOODS: Kind[] = ['house', 'dome', 'bird', 'flower', 'sun', 'star'];
const BEST_KEY = 'rl-inkcatch-best';

class InkCatch {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  frame: HTMLElement;

  W = 0;
  H = 0;
  dpr = 1;

  phase: Phase = 'idle';
  score = 0;
  best = 0;
  lives = 3;

  items: Item[] = [];
  particles: Particle[] = [];
  catcherX = 0;
  catcherTargetX = 0;
  catcherVX = 0;
  keyDir = 0;

  spawnTimer = 0;
  spawnEvery = 1.05;
  elapsed = 0;
  shake = 0;
  last = 0;
  rafId = 0;
  visible = true;

  ink = '#16120b';
  accent = '#b6552f';
  teal = '#2c6f6a';
  blotColor = '#9c3b2a';

  // DOM refs
  el: Record<string, HTMLElement> = {};

  constructor(root: HTMLElement) {
    this.root = root;
    this.frame = root.querySelector('[data-game-frame]') as HTMLElement;
    this.canvas = root.querySelector('[data-game-canvas]') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.el = {
      score: root.querySelector('[data-game-score]')!,
      best: root.querySelector('[data-game-best]')!,
      lives: root.querySelector('[data-game-lives]')!,
      start: root.querySelector('[data-game-start]')!,
      pause: root.querySelector('[data-game-pause]')!,
      over: root.querySelector('[data-game-over]')!,
      final: root.querySelector('[data-game-final]')!,
      newbest: root.querySelector('[data-game-newbest]')!,
      pausebtn: root.querySelector('[data-game-pausebtn]')!,
    };

    try {
      this.best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
    } catch {}
    this.el.best.textContent = String(this.best);

    this.readColors();
    this.resize();
    this.bind();

    // Idle ambient render so the frame isn't empty before play
    this.renderIdle();
  }

  readColors() {
    const cs = getComputedStyle(document.documentElement);
    const get = (v: string, f: string) => cs.getPropertyValue(v).trim() || f;
    this.ink = get('--ink', '#16120b');
    this.accent = get('--accent', '#b6552f');
    this.teal = get('--accent-2', '#2c6f6a');
    this.blotColor = get('--accent', '#9c3b2a');
  }

  resize() {
    const r = this.frame.getBoundingClientRect();
    this.W = r.width;
    this.H = r.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.phase === 'idle') this.catcherX = this.W / 2;
    this.catcherTargetX = this.catcherX;
  }

  get catcherW() {
    return Math.max(70, Math.min(160, this.W * 0.16));
  }
  get catcherY() {
    return this.H - Math.max(46, this.H * 0.1);
  }
  get itemBase() {
    return Math.max(26, Math.min(54, this.W * 0.05));
  }

  bind() {
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.frame);

    // Pointer / touch movement
    const move = (clientX: number) => {
      const r = this.frame.getBoundingClientRect();
      this.catcherTargetX = Math.max(0, Math.min(this.W, clientX - r.left));
    };
    this.frame.addEventListener('pointermove', (e) => move(e.clientX), { passive: true });
    this.frame.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches[0]) move(e.touches[0].clientX);
      },
      { passive: true }
    );

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (this.phase === 'idle' || this.phase === 'over') return;
      if (e.key === 'ArrowLeft') this.keyDir = -1;
      else if (e.key === 'ArrowRight') this.keyDir = 1;
      else if (e.key.toLowerCase() === 'p') this.togglePause();
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' && this.keyDir === -1) this.keyDir = 0;
      if (e.key === 'ArrowRight' && this.keyDir === 1) this.keyDir = 0;
    });

    // Buttons
    this.root.querySelector('[data-game-play]')?.addEventListener('click', () => this.start());
    this.root.querySelector('[data-game-replay]')?.addEventListener('click', () => this.start());
    this.root.querySelector('[data-game-resume]')?.addEventListener('click', () => this.togglePause());
    this.el.pausebtn.addEventListener('click', () => this.togglePause());

    // Auto-pause when off-screen or tab hidden
    const io = new IntersectionObserver(
      (entries) => {
        this.visible = entries[0]?.isIntersecting ?? true;
        if (!this.visible && this.phase === 'running') this.togglePause(true);
      },
      { threshold: 0.25 }
    );
    io.observe(this.root);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.phase === 'running') this.togglePause(true);
    });

    // Refresh colours on theme change
    new MutationObserver(() => this.readColors()).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.items = [];
    this.particles = [];
    this.elapsed = 0;
    this.spawnEvery = 1.05;
    this.spawnTimer = 0.4;
    this.catcherX = this.W / 2;
    this.catcherTargetX = this.W / 2;
    this.phase = 'running';
    this.updateHud();
    (this.el.start as HTMLElement).hidden = true;
    (this.el.over as HTMLElement).hidden = true;
    (this.el.pause as HTMLElement).hidden = true;
    (this.el.pausebtn as HTMLElement).hidden = false;
    this.last = performance.now();
    cancelAnimationFrame(this.rafId);
    this.loop(this.last);
  }

  togglePause(force?: boolean) {
    if (this.phase === 'running' || force) {
      this.phase = 'paused';
      (this.el.pause as HTMLElement).hidden = false;
    } else if (this.phase === 'paused') {
      this.phase = 'running';
      (this.el.pause as HTMLElement).hidden = true;
      this.last = performance.now();
      this.loop(this.last);
    }
  }

  gameOver() {
    this.phase = 'over';
    (this.el.pausebtn as HTMLElement).hidden = true;
    this.el.final.textContent = String(this.score);
    let isBest = false;
    if (this.score > this.best) {
      this.best = this.score;
      isBest = true;
      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch {}
      this.el.best.textContent = String(this.best);
    }
    (this.el.newbest as HTMLElement).hidden = !isBest;
    (this.el.over as HTMLElement).hidden = false;
  }

  updateHud() {
    this.el.score.textContent = String(this.score);
    this.el.lives.textContent = '✦'.repeat(Math.max(0, this.lives));
  }

  spawn() {
    const blotChance = Math.min(0.32, 0.12 + this.elapsed / 220);
    const good = Math.random() > blotChance;
    const kind: Kind = good ? GOODS[(Math.random() * GOODS.length) | 0] : 'blot';
    const size = this.itemBase * (0.8 + Math.random() * 0.6);
    const speedScale = 1 + Math.min(1.4, this.elapsed / 60);
    this.items.push({
      x: size + Math.random() * (this.W - size * 2),
      y: -size,
      vy: (70 + Math.random() * 50) * speedScale,
      size,
      rot: (Math.random() - 0.5) * 0.5,
      vr: (Math.random() - 0.5) * 1.5,
      kind,
      good,
    });
  }

  burst(x: number, y: number, color: string, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 160;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0,
        max: 0.5 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  loop = (now: number) => {
    if (this.phase !== 'running') return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.05) dt = 0.05; // clamp after tab switches
    this.elapsed += dt;

    // catcher movement (pointer + keys)
    if (this.keyDir !== 0) this.catcherTargetX += this.keyDir * 620 * dt;
    this.catcherTargetX = Math.max(0, Math.min(this.W, this.catcherTargetX));
    this.catcherX += (this.catcherTargetX - this.catcherX) * Math.min(1, dt * 14);

    // spawn
    this.spawnTimer -= dt;
    this.spawnEvery = Math.max(0.42, 1.05 - this.elapsed / 90);
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = this.spawnEvery * (0.7 + Math.random() * 0.6);
    }

    const catchTop = this.catcherY - 8;
    const halfW = this.catcherW / 2;

    for (const it of this.items) {
      it.y += it.vy * dt;
      it.rot += it.vr * dt;
      const within =
        it.x > this.catcherX - halfW - it.size * 0.3 &&
        it.x < this.catcherX + halfW + it.size * 0.3;
      // caught
      if (!it.dead && it.y + it.size * 0.4 >= catchTop && it.y < catchTop + 40 && within) {
        it.dead = true;
        if (it.good) {
          this.score++;
          this.updateHud();
          this.burst(it.x, catchTop, Math.random() > 0.5 ? this.accent : this.teal);
        } else {
          this.lives--;
          this.shake = 12;
          this.burst(it.x, catchTop, this.blotColor, 22);
          this.updateHud();
          if (this.lives <= 0) {
            this.gameOver();
          }
        }
      }
      // missed a good one
      if (!it.dead && it.y - it.size > this.H) {
        it.dead = true;
        if (it.good) {
          this.lives--;
          this.shake = 8;
          this.updateHud();
          if (this.lives <= 0) this.gameOver();
        }
      }
    }
    this.items = this.items.filter((i) => !i.dead && i.y - i.size <= this.H + 4);

    // particles
    for (const p of this.particles) {
      p.life += dt;
      p.vy += 320 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.max);

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);

    this.render();
    if (this.phase === 'running') this.rafId = requestAnimationFrame(this.loop);
  };

  /* ----------------------------- rendering ----------------------------- */
  render() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    // items
    for (const it of this.items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.lineWidth = Math.max(2.4, it.size * 0.085);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = it.good ? this.ink : this.blotColor;
      ctx.fillStyle = it.good ? 'transparent' : this.blotColor;
      this.drawMotif(it.kind, it.size);
      ctx.restore();
    }

    // catcher (open sketchbook)
    this.drawCatcher();

    // particles
    for (const p of this.particles) {
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderIdle() {
    // gentle, non-interactive preview behind the start screen
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.catcherX = this.W / 2;
    this.drawCatcher();
  }

  drawCatcher() {
    const ctx = this.ctx;
    const w = this.catcherW;
    const x = this.catcherX;
    const y = this.catcherY;
    const h = w * 0.34;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = this.ink;
    ctx.fillStyle = this.ink;
    // two pages
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(-w / 2, h, 0, h * 0.7);
    ctx.quadraticCurveTo(w / 2, h, w / 2, 0);
    ctx.lineTo(w / 2 - 4, -2);
    ctx.quadraticCurveTo(0, h * 0.4, -w / 2 + 4, -2);
    ctx.closePath();
    ctx.globalAlpha = 0.08;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    // spine
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, h * 0.66);
    ctx.stroke();
    // page lines
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.2;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 10 + i * 4, -2 + i * 4);
      ctx.quadraticCurveTo(-w / 4, h * 0.3, -6, -2 + i * 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, -2 + i * 5);
      ctx.quadraticCurveTo(w / 4, h * 0.3, w / 2 - 10 - i * 4, -2 + i * 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMotif(kind: Kind, s: number) {
    const ctx = this.ctx;
    const r = s / 2;
    switch (kind) {
      case 'house': {
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, -r * 0.1);
        ctx.lineTo(0, -r * 0.8);
        ctx.lineTo(r * 0.8, -r * 0.1);
        ctx.lineTo(r * 0.6, -r * 0.1);
        ctx.lineTo(r * 0.6, r * 0.7);
        ctx.lineTo(-r * 0.6, r * 0.7);
        ctx.lineTo(-r * 0.6, -r * 0.1);
        ctx.closePath();
        ctx.stroke();
        ctx.strokeRect(-r * 0.18, r * 0.18, r * 0.36, r * 0.52);
        break;
      }
      case 'dome': {
        ctx.beginPath();
        ctx.arc(0, r * 0.1, r * 0.6, Math.PI, 0);
        ctx.lineTo(r * 0.6, r * 0.7);
        ctx.lineTo(-r * 0.6, r * 0.7);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(0, -r * 0.85);
        ctx.stroke();
        break;
      }
      case 'bird': {
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, 0);
        ctx.quadraticCurveTo(-r * 0.2, -r * 0.7, 0, 0);
        ctx.quadraticCurveTo(r * 0.2, -r * 0.7, r * 0.85, 0);
        ctx.stroke();
        break;
      }
      case 'flower': {
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.rotate((i / 6) * Math.PI * 2);
          ctx.beginPath();
          ctx.ellipse(0, -r * 0.5, r * 0.22, r * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'sun': {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
          ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
          ctx.stroke();
        }
        break;
      }
      case 'star': {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const a2 = a + Math.PI / 5;
          ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
          ctx.lineTo(Math.cos(a2) * r * 0.35, Math.sin(a2) * r * 0.35);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'blot': {
        ctx.beginPath();
        const pts = 9;
        for (let i = 0; i <= pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          const rad = r * (0.55 + Math.sin(i * 2.3) * 0.18 + Math.cos(i * 1.7) * 0.1);
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        // drip
        ctx.beginPath();
        ctx.arc(r * 0.1, r * 0.7, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }
}

function initGame() {
  const root = document.querySelector('[data-game]') as HTMLElement | null;
  if (!root || (root as any)._inkInit) return;
  (root as any)._inkInit = true;
  // Defer heavy setup until the frame is in (or near) the viewport
  const make = () => new InkCatch(root);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0]?.isIntersecting) {
          make();
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(root);
  } else {
    make();
  }
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', initGame);
else initGame();
