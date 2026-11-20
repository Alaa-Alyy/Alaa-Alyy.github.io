// ╔══════════════════════════════════════════════════════╗
// ║           INTRO CINEMATIC SEQUENCE                   ║
// ╚══════════════════════════════════════════════════════╝
(function initIntro() {
  const overlay    = document.getElementById('intro-overlay');
  const astroWrap  = document.getElementById('astro-wrap');
  const bubble     = document.getElementById('speech-bubble');
  const siteWrap   = document.getElementById('site-wrapper');
  const iCanvas    = document.getElementById('introCanvas');

  if (!overlay) return;

  // Lock scroll while intro plays
  document.body.classList.add('intro-active');

  // ── Intro star canvas ────────────────────────────────
  const ictx = iCanvas.getContext('2d');
  let iW, iH;
  const iStars = [];

  function resizeIntro() {
    iW = iCanvas.width  = window.innerWidth;
    iH = iCanvas.height = window.innerHeight;
  }
  resizeIntro();
  window.addEventListener('resize', resizeIntro);

  for (let i = 0; i < 280; i++) {
    iStars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.3,
      tw: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.007 + 0.003,
      col: Math.random() > 0.85 ? '#5fae7e'
         : Math.random() > 0.7  ? '#c9ced1' : '#ffffff',
    });
  }

  let iRaf;
  function drawIntro() {
    ictx.clearRect(0, 0, iW, iH);
    // subtle nebula glow
    const g1 = ictx.createRadialGradient(iW*.75, iH*.25, 0, iW*.75, iH*.25, iW*.45);
    g1.addColorStop(0, 'rgba(46,139,87,.07)');
    g1.addColorStop(1, 'transparent');
    ictx.fillStyle = g1; ictx.fillRect(0, 0, iW, iH);

    const g2 = ictx.createRadialGradient(iW*.2, iH*.7, 0, iW*.2, iH*.7, iW*.35);
    g2.addColorStop(0, 'rgba(143,156,149,.07)');
    g2.addColorStop(1, 'transparent');
    ictx.fillStyle = g2; ictx.fillRect(0, 0, iW, iH);

    iStars.forEach(s => {
      s.tw += s.sp;
      const a = 0.25 + Math.abs(Math.sin(s.tw)) * 0.75;
      ictx.globalAlpha = a;
      ictx.fillStyle = s.col;
      ictx.beginPath();
      ictx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ictx.fill();
    });
    ictx.globalAlpha = 1;
    iRaf = requestAnimationFrame(drawIntro);
  }
  drawIntro();

  // ── Sequence ─────────────────────────────────────────
  let done = false;

  function exitIntro() {
    if (done) return;
    done = true;

    // 0. Snap back to top so Hero is always the first thing visible
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 1. Trigger star-rush zoom on overlay
    overlay.classList.add('exit');

    // 2. Zoom-in the site and reveal nav
    siteWrap.classList.add('revealed');
    const nav = document.getElementById('navbar');
    if (nav) {
      // slight delay so nav fades in as the zoom completes
      setTimeout(() => nav.classList.add('nav-visible'), 800);
    }

    // 3. After animation, clean up
    setTimeout(() => {
      cancelAnimationFrame(iRaf);
      overlay.remove();
      document.body.classList.remove('intro-active');
    }, 1600);
  }

  // Astronaut lands after 400ms
  setTimeout(() => astroWrap.classList.add('landed'), 400);

  // Speech bubble pops in after astronaut lands
  setTimeout(() => bubble.classList.add('show'), 2300);

  // Auto-exit after the full scene (waits while Zumo is talking)
  let speaking = false;
  setTimeout(() => {
    if (speaking) return;                                   // the click path exits when Zumo finishes
    if (window.zumoIntroBusy) window.zumoIntroEnded = () => setTimeout(exitIntro, 350);
    else exitIntro();
  }, 7500);

  // First click: Zumo says the bubble's line (browsers need a click before any sound).
  // Click again (or no Zumo / muted): skip straight to the site.
  overlay.addEventListener('click', () => {
    if (speaking || done || window.zumoIntroBusy) { exitIntro(); return; }
    if (window.zumoIntroSpeak) {
      astroWrap.classList.add('landed');
      bubble.classList.add('show');
      speaking = window.zumoIntroSpeak(() => setTimeout(exitIntro, 350));
      if (speaking) return;
    }
    exitIntro();
  });
})();

// ── end intro ─────────────────────────────────────────

// ===== CUSTOM CURSOR =====

const cursorDot = document.createElement('div');
cursorDot.className = 'cursor';
const cursorRing = document.createElement('div');
cursorRing.className = 'cursor-ring';
document.body.appendChild(cursorDot);
document.body.appendChild(cursorRing);

let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
function animateCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top = my + 'px';
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top = ry + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a,button,.chip,.cert-row,.contact-card,.project-card').forEach(el => {
  el.addEventListener('mouseenter', () => { cursorDot.style.transform = 'translate(-50%,-50%) scale(2)'; cursorRing.style.transform = 'translate(-50%,-50%) scale(1.5)'; cursorRing.style.borderColor = 'var(--pink)'; });
  el.addEventListener('mouseleave', () => { cursorDot.style.transform = 'translate(-50%,-50%) scale(1)'; cursorRing.style.transform = 'translate(-50%,-50%) scale(1)'; cursorRing.style.borderColor = 'var(--violet2)'; });
});

// ═══════════════════════════════════════
// GAME VIBES JS
// ═══════════════════════════════════════

// --- Achievement toast ---
(function initAchievement() {
  const toast = document.getElementById('achievement-toast');
  const fill  = document.getElementById('achBarFill');
  if (!toast) return;
  // Fire 3.5s after page load (after intro settles)
  setTimeout(() => {
    toast.classList.add('show');
    if (fill) setTimeout(() => fill.style.width = '100%', 100);
    // auto-hide
    setTimeout(() => {
      toast.style.transition = 'transform .5s ease, opacity .5s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(120px)';
      setTimeout(() => toast.remove(), 600);
    }, 4500);
  }, 3500);
})();

// --- Player HUD (shows on scroll) ---
(function initHUD() {
  const hud = document.getElementById('player-hud');
  if (!hud) return;
  let shown = false;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60 && !shown) { shown = true; hud.classList.add('show'); }
    if (window.scrollY <= 60 && shown)  { shown = false; hud.classList.remove('show'); }
  }, { passive: true });
})();

// --- Character sprite (appears after scrolling, hides near bottom) ---
(function initCharacter() {
  const char = document.getElementById('game-character');
  if (!char) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const max = document.body.scrollHeight - window.innerHeight;
    if (scrolled > 200 && scrolled < max - 200) {
      char.classList.add('visible');
    } else {
      char.classList.remove('visible');
    }
  }, { passive: true });
})();

// --- XP Bars animate on scroll into view ---
(function initXP() {
  const fills = document.querySelectorAll('.xp-fill[data-xp]');
  if (!fills.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pct = entry.target.dataset.xp;
        entry.target.style.width = pct + '%';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  fills.forEach(f => obs.observe(f));
})();


// ===== SPARKLE TRAIL =====
document.addEventListener('mousemove', e => {
  if (Math.random() > 0.7) {
    const sp = document.createElement('div');
    sp.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;pointer-events:none;z-index:9997;font-size:${8+Math.random()*8}px;animation:sparkleOut .6s ease forwards;transform:translate(-50%,-50%)`;
    sp.textContent = ['✦','✧','⋆','★','✸'][Math.floor(Math.random()*5)];
    sp.style.color = Math.random() > 0.5 ? '#2e8b57' : '#b04a6c';
    document.body.appendChild(sp);
    setTimeout(() => sp.remove(), 600);
  }
});

const sparkleStyle = document.createElement('style');
sparkleStyle.textContent = `@keyframes sparkleOut{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-60%) scale(0) translateY(-20px)}}`;
document.head.appendChild(sparkleStyle);

// ===== HERO CANVAS - SPACE + STARS =====
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let W, H, stars = [], shootingStars = [], sparkles = [];

function isLight() { return document.documentElement.getAttribute('data-theme') === 'light'; }
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

function makeStar() {
  return {
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.8 + 0.2,
    alpha: Math.random(),
    speed: Math.random() * 0.008 + 0.003,
    twinkle: Math.random() * Math.PI * 2,
    color: Math.random() > 0.85 ? '#5fae7e' : Math.random() > 0.7 ? '#c9ced1' : '#ffffff',
  };
}
function makeShootingStar() {
  return {
    x: Math.random() * W * 0.7, y: Math.random() * H * 0.4,
    len: 120 + Math.random() * 100,
    speed: 6 + Math.random() * 5,
    alpha: 1, active: true,
    angle: Math.PI / 5 + Math.random() * 0.3,
  };
}
function makeSparkle() {
  return {
    x: Math.random() * W, y: Math.random() * H,
    life: 1, decay: 0.008 + Math.random() * 0.012,
    size: 2 + Math.random() * 3,
    color: Math.random() > 0.5 ? '#2e8b57' : '#8f9c95',
  };
}

for (let i = 0; i < 200; i++) stars.push(makeStar());

let shootTimer = 0;
let sparkleTimer = 0;

function drawCanvas() {
  ctx.clearRect(0, 0, W, H);

  // Deep space gradient bg
  const bg = ctx.createRadialGradient(W*0.7, H*0.2, 0, W*0.7, H*0.2, W*0.6);
  bg.addColorStop(0, 'rgba(46,139,87,0.06)');
  bg.addColorStop(0.5, 'rgba(143,156,149,0.04)');
  bg.addColorStop(1, 'transparent');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const bg2 = ctx.createRadialGradient(W*0.15, H*0.8, 0, W*0.15, H*0.8, W*0.4);
  bg2.addColorStop(0, 'rgba(143,156,149,0.07)');
  bg2.addColorStop(1, 'transparent');
  ctx.fillStyle = bg2;
  ctx.fillRect(0, 0, W, H);

  // Stars
  stars.forEach(s => {
    s.twinkle += s.speed;
    const a = 0.3 + Math.abs(Math.sin(s.twinkle)) * 0.7;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.globalAlpha = a;
    ctx.fillStyle = isLight() ? (s.color === '#ffffff' ? '#3d5a4a' : s.color === '#c9ced1' ? '#8e2a4a' : '#2e8b57') : s.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Shooting stars
  shootTimer++;
  if (shootTimer > 180 + Math.random() * 120) { shootingStars.push(makeShootingStar()); shootTimer = 0; }
  shootingStars = shootingStars.filter(s => s.active);
  shootingStars.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.alpha;
    const grd = ctx.createLinearGradient(s.x, s.y, s.x - Math.cos(s.angle)*s.len, s.y - Math.sin(s.angle)*s.len);
    grd.addColorStop(0, '#2e8b57');
    grd.addColorStop(0.5, '#c9ced1');
    grd.addColorStop(1, 'transparent');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - Math.cos(s.angle)*s.len, s.y - Math.sin(s.angle)*s.len);
    ctx.stroke();
    ctx.restore();
    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.alpha -= 0.012;
    if (s.alpha <= 0 || s.x > W || s.y > H) s.active = false;
  });

  // Floating sparkles
  sparkleTimer++;
  if (sparkleTimer > 30) { sparkles.push(makeSparkle()); sparkleTimer = 0; }
  sparkles = sparkles.filter(s => s.life > 0);
  sparkles.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.life;
    ctx.fillStyle = s.color;
    ctx.font = `${s.size * 3}px serif`;
    ctx.fillText('✦', s.x, s.y);
    ctx.restore();
    s.life -= s.decay;
    s.y -= 0.3;
  });

  requestAnimationFrame(drawCanvas);
}
drawCanvas();

// ===== NAV + PHOTO SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
const heroPhotoWrap = document.getElementById('heroPhotoWrap');
const heroSection = document.getElementById('hero');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const heroH = heroSection ? heroSection.offsetHeight : window.innerHeight;

  // Nav background
  navbar.style.background = scrollY > 50 ? 'var(--nav-bg-solid)' : 'var(--nav-bg)';

  // Hero photo: shrink & fade as user scrolls
  if (heroPhotoWrap) {
    const progress = Math.min(scrollY / (heroH * 0.6), 1); // 0 → 1
    const scale = 1 - progress * 0.55;           // shrinks to ~45%
    const opacity = 1 - progress * 1.4;          // fades out before fully gone
    const moveUp = progress * -120;              // moves up
    heroPhotoWrap.style.transform = `scale(${scale}) translateY(${moveUp}px)`;
    heroPhotoWrap.style.opacity = Math.max(opacity, 0);
  }

  // Show mini nav photo once past hero
  if (scrollY > heroH * 0.5) {
    document.body.classList.add('scrolled-past-hero');
  } else {
    document.body.classList.remove('scrolled-past-hero');
  }
});

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

// ===== SCROLL REVEAL =====
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), 80); revealObs.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// Staggered groups
const groupObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.reveal').forEach((c, i) => setTimeout(() => c.classList.add('visible'), i * 110));
      groupObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.05 });
document.querySelectorAll('.stack-groups,.projects-grid,.cert-list,.contact-grid,.timeline').forEach(g => groupObs.observe(g));

// ===== ACTIVE NAV =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let cur = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) cur = s.id; });
  navLinks.forEach(a => { a.style.color = ''; if (a.getAttribute('href') === `#${cur}`) a.style.color = 'var(--pink2)'; });
});

// ===== COUNTER ANIMATION =====
function animCount(el, target, suffix) {
  let v = 0; const inc = target / 60;
  const t = setInterval(() => {
    v += inc; if (v >= target) { v = target; clearInterval(t); }
    el.textContent = (Number.isInteger(target) ? Math.floor(v) : v.toFixed(0)) + suffix;
  }, 25);
}
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.stat-num').forEach(el => {
        const t = el.textContent; const n = parseFloat(t.replace(/[^0-9.]/g,'')); const s = t.replace(/[0-9.]/g,'');
        animCount(el, n, s);
      });
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
const hs = document.querySelector('.hero-stats');
if (hs) counterObs.observe(hs);

// ===== TILT ON PROJECT CARDS =====
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});


// ===== THEME TOGGLE =====
(function () {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    navbar.style.background = window.scrollY > 50 ? 'var(--nav-bg-solid)' : 'var(--nav-bg)';
  });
})();
