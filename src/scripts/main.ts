/* =========================================================================
   main.ts — front-end orchestration for the Rocío Landó portfolio.
   Smooth scroll · scroll animations · cursor · menu · lightbox · easter eggs
   ========================================================================= */
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { withBase } from '../lib/path';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) =>
  c.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) =>
  Array.from(c.querySelectorAll<T>(s));

let lenis: Lenis | null = null;

/* ---------------------------------------------------------------- Smooth scroll */
function initScroll() {
  if (!reduceMotion) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis!.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Smooth in-page anchor navigation
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToEl(target as HTMLElement);
    });
  });
}

function scrollToEl(el: HTMLElement) {
  const offset = -70;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.3 });
  else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

/* ---------------------------------------------------------------- Theme toggle */
function initTheme() {
  const apply = (theme: string) => {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('rl-theme', theme);
    } catch {}
  };
  $$('[data-theme-toggle]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      // brief flourish
      gsap.fromTo(
        btn,
        { rotate: 0 },
        { rotate: 360, duration: 0.7, ease: 'back.out(1.7)' }
      );
      apply(next);
    })
  );
}

/* ---------------------------------------------------------------- Preloader */
function initLoader(onDone: () => void) {
  const loader = $('[data-loader]');
  if (!loader || reduceMotion || getComputedStyle(loader).display === 'none') {
    loader?.remove();
    onDone();
    return;
  }
  const countEl = $('[data-loader-count]');
  let n = 0;
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / 1200);
    n = Math.floor(p * 100);
    if (countEl) countEl.textContent = String(n);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
  };
  loader.addEventListener('animationend', (e) => {
    if ((e as AnimationEvent).animationName.includes('loaderLift')) {
      loader.remove();
      finish();
    }
  });
  // Safety net
  window.setTimeout(finish, 3400);
}

/* ---------------------------------------------------------------- Scroll reveals */
function initReveals() {
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  $$('[data-reveal]').forEach((el) => io.observe(el));

  // Gallery tiles stagger within their column position
  const gio = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const i = Number(el.dataset.index ?? 0) % 6;
        el.style.transitionDelay = `${i * 0.06}s`;
        el.classList.add('is-revealed');
        obs.unobserve(el);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
  );
  $$('[data-work]').forEach((el) => gio.observe(el));
}

/* ---------------------------------------------------------------- Blur-up images */
function initBlurUp() {
  const mark = (img: HTMLImageElement) => img.classList.add('is-loaded');
  $$<HTMLImageElement>('img[data-blurup]').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) mark(img);
    else img.addEventListener('load', () => mark(img), { once: true });
  });
}

/* ---------------------------------------------------------------- Nav + menu */
let menuOpen = false;
function closeMenu() {
  if (!menuOpen) return;
  setMenu(false);
}
function setMenu(open: boolean) {
  const nav = $('[data-nav]');
  const btn = $('[data-menu-toggle]');
  const label = $('[data-menu-label]');
  if (!nav) return;
  menuOpen = open;
  nav.classList.toggle('is-open', open);
  btn?.setAttribute('aria-expanded', String(open));
  if (label) label.textContent = open ? 'Close' : 'Menu';
  if (open) lenis?.stop();
  else lenis?.start();
  document.body.classList.toggle('no-scroll', open);
}
function initNav() {
  const nav = $('[data-nav]');
  const btn = $('[data-menu-toggle]');
  btn?.addEventListener('click', () => setMenu(!menuOpen));
  $$('[data-overlay-link]').forEach((a) =>
    a.addEventListener('click', () => closeMenu())
  );
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // hide on scroll down / show on scroll up + scrolled state
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      if (!menuOpen) {
        if (y > last && y > 240) nav.classList.add('is-hidden');
        else nav.classList.remove('is-hidden');
      }
    }
    // scroll progress
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? y / max : 0;
    const bar = $('.scroll-progress') as HTMLElement | null;
    if (bar) bar.style.transform = `scaleX(${p})`;
    last = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $$('[data-scroll-top]').forEach((b) =>
    b.addEventListener('click', () => {
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  );
}

/* ---------------------------------------------------------------- Custom cursor */
function initCursor() {
  if (!finePointer) return;
  root.classList.add('has-cursor');
  const dot = $('[data-cursor-dot]') as HTMLElement;
  const ring = $('[data-cursor-ring]') as HTMLElement;
  const label = $('[data-cursor-label]') as HTMLElement;
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2,
    my = window.innerHeight / 2;
  let rx = mx,
    ry = my;
  window.addEventListener(
    'pointermove',
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    },
    { passive: true }
  );
  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  document.addEventListener('pointerdown', () => root.classList.add('cursor-down'));
  document.addEventListener('pointerup', () => root.classList.remove('cursor-down'));

  const bind = (sel: string, cls: string, labelFrom?: boolean) => {
    document.addEventListener('pointerover', (e) => {
      const t = (e.target as HTMLElement)?.closest(sel);
      if (t) {
        root.classList.add(cls);
        if (labelFrom && label)
          label.textContent = (t as HTMLElement).dataset.cursorView || 'view';
      }
    });
    document.addEventListener('pointerout', (e) => {
      const t = (e.target as HTMLElement)?.closest(sel);
      if (t) root.classList.remove(cls);
    });
  };
  bind('[data-cursor-hover]', 'cursor-hover');
  bind('[data-cursor-view]', 'cursor-view', true);
}

/* ---------------------------------------------------------------- Magnetic buttons */
function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  $$('.btn, [data-magnetic]').forEach((el) => {
    const strength = 0.4;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e as PointerEvent).clientX - r.left - r.width / 2;
      const y = (e as PointerEvent).clientY - r.top - r.height / 2;
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ---------------------------------------------------------------- Stat count-up */
function initCounters() {
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const raw = el.dataset.count || el.textContent || '';
        const num = parseInt(raw.replace(/\D/g, ''), 10);
        const suffix = raw.replace(/[0-9]/g, '');
        if (!isNaN(num) && num > 0 && !reduceMotion) {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: num,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = Math.floor(obj.v) + suffix;
            },
          });
        }
        obs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  $$('[data-count]').forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------- GSAP scroll FX */
function initScrollFX() {
  if (reduceMotion) return;

  // Hero art parallax
  $$('[data-hero-col]').forEach((col) => {
    const speed = parseFloat((col as HTMLElement).dataset.heroCol || '0.05');
    gsap.to(col, {
      yPercent: speed * 140,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  });

  // Process line fill
  if ($('[data-process-line]')) {
    gsap.to('[data-process-line]', {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '[data-process]',
        start: 'top 65%',
        end: 'bottom 75%',
        scrub: true,
      },
    });
  }

  // Footer wordmark drift
  if ($('[data-footer-name]')) {
    gsap.fromTo(
      '[data-footer-name]',
      { xPercent: 6 },
      {
        xPercent: -10,
        ease: 'none',
        scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
      }
    );
  }
}

/* ---------------------------------------------------------------- Projects pin */
function initProjects() {
  const section = $('[data-projects]');
  const track = $('[data-projects-track]');
  const pin = $('[data-projects-pin]');
  if (!section || !track || !pin) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    root.classList.add('projects-pinned');
    const distance = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        scrub: 1,
        pin: pin,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => {
      root.classList.remove('projects-pinned');
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { x: 0 });
    };
  });
}

/* ---------------------------------------------------------------- Lightbox */
function initLightbox() {
  const lb = $('[data-lightbox]');
  if (!lb) return;
  const imgEl = $('[data-lb-img]') as HTMLImageElement;
  const titleEl = $('[data-lb-title]')!;
  const metaEl = $('[data-lb-meta]')!;
  const descEl = $('[data-lb-desc]')!;
  const counterEl = $('[data-lb-counter]')!;

  type Item = { full: string; title: string; meta: string; alt: string; caption: string };
  let group: HTMLElement[] = [];
  let index = 0;

  const items = $$('[data-full]').filter(
    (el) => (el as HTMLElement).dataset.full
  ) as HTMLElement[];

  const groupOf = (el: HTMLElement) =>
    (el.closest('[data-lb-group]') as HTMLElement | null)?.dataset.lbGroup || 'default';

  const read = (el: HTMLElement): Item => ({
    full: el.dataset.full || '',
    title: el.dataset.title || '',
    meta: el.dataset.meta || '',
    alt: el.dataset.alt || '',
    caption: el.dataset.caption || '',
  });

  const show = (i: number) => {
    const el = group[(i + group.length) % group.length];
    index = (i + group.length) % group.length;
    const d = read(el);
    imgEl.src = d.full;
    imgEl.alt = d.alt;
    titleEl.textContent = d.title;
    metaEl.textContent = d.meta;
    descEl.textContent = d.caption;
    (descEl as HTMLElement).style.display = d.caption ? '' : 'none';
    counterEl.textContent = `${index + 1} / ${group.length}`;
    if (!reduceMotion) {
      gsap.fromTo(imgEl, { opacity: 0.3, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
    }
  };

  const open = (el: HTMLElement) => {
    const g = groupOf(el);
    group = items.filter((it) => groupOf(it) === g);
    const i = group.indexOf(el);
    show(i < 0 ? 0 : i);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    lenis?.stop();
    document.body.classList.add('no-scroll');
  };
  const close = () => {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    lenis?.start();
    document.body.classList.remove('no-scroll');
  };

  items.forEach((el) => {
    el.addEventListener('click', () => open(el));
    el.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        open(el);
      }
    });
  });

  $('[data-lb-close]')?.addEventListener('click', close);
  $('[data-lb-next]')?.addEventListener('click', () => show(index + 1));
  $('[data-lb-prev]')?.addEventListener('click', () => show(index - 1));
  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });
  window.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });
}

/* ---------------------------------------------------------------- Easter eggs */
function initEasterEggs() {
  // Konami → ink rain
  const seq = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
  ];
  let pos = 0;
  window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === seq[pos] ? pos + 1 : key === seq[0] ? 1 : 0;
    if (pos === seq.length) {
      pos = 0;
      inkRain();
      toast('✦ secret unlocked — it’s raining sketches');
    }
  });

  // Doodle mode (press D)
  let doodle: DoodleMode | null = null;
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
      if (doodle) {
        doodle.destroy();
        doodle = null;
      } else {
        doodle = new DoodleMode(() => {
          doodle = null;
        });
        toast('✎ doodle mode — draw anywhere · C clears · Esc exits');
      }
    }
  });
}

function inkRain() {
  const art = [
    '/works/lion.jpg', '/works/danki-dushi-curacao.png', '/works/sunflower.jpg',
    '/works/hornero-bird.jpg', '/works/notre-dame-cathedral.jpg', '/works/pongo-and-patch.jpg',
    '/works/the-dome.jpg', '/works/patio-garden.jpg',
  ];
  const layer = document.createElement('div');
  Object.assign(layer.style, {
    position: 'fixed', inset: '0', zIndex: '9990', pointerEvents: 'none', overflow: 'hidden',
  });
  document.body.appendChild(layer);
  const N = 26;
  for (let i = 0; i < N; i++) {
    const img = document.createElement('img');
    img.src = withBase(art[i % art.length]);
    img.loading = 'eager';
    const size = 50 + Math.random() * 90;
    Object.assign(img.style, {
      position: 'absolute',
      width: `${size}px`,
      left: `${Math.random() * 100}%`,
      top: `-160px`,
      borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0,0,0,.18)',
      background: '#fff',
    });
    layer.appendChild(img);
    gsap.to(img, {
      y: window.innerHeight + 320,
      rotation: (Math.random() - 0.5) * 220,
      duration: 2.6 + Math.random() * 2.4,
      delay: Math.random() * 1.2,
      ease: 'power1.in',
    });
    gsap.to(img, { opacity: 0, duration: 0.8, delay: 3 + Math.random() * 1.6 });
  }
  setTimeout(() => layer.remove(), 6500);
}

class DoodleMode {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  drawing = false;
  onExit: () => void;
  keyHandler: (e: KeyboardEvent) => void;
  constructor(onExit: () => void) {
    this.onExit = onExit;
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      position: 'fixed', inset: '0', zIndex: '9991', cursor: 'crosshair',
      width: '100%', height: '100%',
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);
    const ink = getComputedStyle(root).getPropertyValue('--accent').trim() || '#b6552f';
    this.ctx.strokeStyle = ink;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const pos = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY });
    this.canvas.addEventListener('pointerdown', (e) => {
      this.drawing = true;
      const p = pos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.drawing) return;
      const p = pos(e);
      this.ctx.lineWidth = 2 + Math.random() * 2.5;
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
    });
    window.addEventListener('pointerup', () => (this.drawing = false));
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.destroy();
      if (e.key.toLowerCase() === 'c')
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    window.addEventListener('keydown', this.keyHandler);
  }
  destroy() {
    window.removeEventListener('keydown', this.keyHandler);
    this.canvas.remove();
    this.onExit();
  }
}

let toastTimer: number | undefined;
function toast(msg: string) {
  let el = $('#rl-toast') as HTMLElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = 'rl-toast';
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      zIndex: '9995',
      padding: '0.7em 1.2em',
      background: 'var(--ink)',
      color: 'var(--paper)',
      borderRadius: '100px',
      fontSize: '0.9rem',
      fontWeight: '600',
      boxShadow: '0 12px 30px rgba(0,0,0,.25)',
      opacity: '0',
      transition: 'opacity .4s, transform .4s cubic-bezier(.16,1,.3,1)',
      pointerEvents: 'none',
      maxWidth: '90vw',
      textAlign: 'center',
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => {
    el!.style.opacity = '1';
    el!.style.transform = 'translateX(-50%) translateY(0)';
  });
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el!.style.opacity = '0';
    el!.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3600);
}

/* ---------------------------------------------------------------- Refresh */
function refreshTriggers() {
  ScrollTrigger.refresh();
}

/* ---------------------------------------------------------------- Boot */
function boot() {
  initScroll();
  initTheme();
  initNav();
  initCursor();
  initBlurUp();
  initLightbox();

  initLoader(() => {
    root.classList.add('is-loaded');
    $('.hero')?.classList.add('is-revealed');
    initReveals();
    initCounters();
    initScrollFX();
    initProjects();
    initMagnetic();
    initEasterEggs();
    requestAnimationFrame(refreshTriggers);
  });

  // Recalculate triggers once everything (fonts, images) settles
  window.addEventListener('load', () => setTimeout(refreshTriggers, 200));
  if ('fonts' in document) {
    (document as any).fonts.ready.then(() => setTimeout(refreshTriggers, 100));
  }
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', boot);
else boot();
