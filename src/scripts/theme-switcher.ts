// =========================================
// Fight-1 Theme Switcher Engine
// Tri-State Self: Mirror → Version → Loop
// =========================================

export const THEMES = ['mirror', 'version', 'loop'];
export const AUTO_SWITCH_INTERVAL = 15000; // 15 seconds
const MANUAL_PAUSE_DURATION = 30000; // Pause 30s after manual switch

let currentIndex = 0;
let autoTimer: ReturnType<typeof setInterval> | null = null;
let mouseTimer: ReturnType<typeof setTimeout> | null = null;
let isIdle = true;

// ---------- Initialization ----------
export function initThemeSwitcher() {
  setInitialState();
  applyTheme(THEMES[currentIndex], false);
  startAutoSwitch();
  setupIdleDetection();
  setupManualControls();
  setupScrollLock();
}

// ---------- Initial State Logic ----------
function setInitialState() {
  const stored = localStorage.getItem('fight1-theme');
  if (stored && THEMES.includes(stored)) {
    currentIndex = THEMES.indexOf(stored);
    return;
  }

  // Auto-select based on time + day
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun, 6=Sat

  if (day === 0 || day === 6) {
    currentIndex = 2; // Loop on weekends
  } else if (hour >= 20 || hour < 6) {
    currentIndex = 0; // Mirror at night
  } else {
    currentIndex = 1; // Version during day
  }
}

// ---------- Apply Theme ----------
export function applyTheme(theme: string, animate = true) {
  if (!THEMES.includes(theme)) return;

  if (animate) {
    document.documentElement.classList.add('theme-transitioning');
  }

  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('fight1-theme', theme);
  currentIndex = THEMES.indexOf(theme);

  // Update indicator
  document.querySelectorAll<HTMLElement>('.theme-dot').forEach((dot) => {
    dot.classList.toggle('active', dot.dataset.theme === theme);
  });

  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));

  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 700);

  // Update cursor glow color
  updateCursorGlow();
}

function updateCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow) return;
  const style = getComputedStyle(document.documentElement);
  const accent1 = style.getPropertyValue('--accent-1').trim();
  glow.style.background = `radial-gradient(circle, ${hexToRgba(accent1, 0.08)} 0%, transparent 70%)`;
}

function hexToRgba(hex: string, alpha: number): string {
  // Handle hsl() values
  if (hex.includes('hsl')) {
    return hex.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------- Auto Switch ----------
function startAutoSwitch() {
  stopAutoSwitch();
  autoTimer = setInterval(() => {
    if (isIdle) {
      currentIndex = (currentIndex + 1) % THEMES.length;
      applyTheme(THEMES[currentIndex], true);
    }
  }, AUTO_SWITCH_INTERVAL);
}

function stopAutoSwitch() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

// ---------- Manual Controls ----------
function setupManualControls() {
  document.querySelectorAll<HTMLElement>('.theme-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const theme = dot.dataset.theme;
      if (!theme) return;

      applyTheme(theme, true);
      pauseAutoSwitch();

      // Play subtle click feedback
      dot.style.transform = 'scale(0.8)';
      setTimeout(() => { dot.style.transform = ''; }, 150);
    });
  });

  // Keyboard shortcut: T to cycle
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      currentIndex = (currentIndex + 1) % THEMES.length;
      applyTheme(THEMES[currentIndex], true);
      pauseAutoSwitch();
    }
  });
}

function pauseAutoSwitch() {
  stopAutoSwitch();
  setTimeout(startAutoSwitch, MANUAL_PAUSE_DURATION);
}

// ---------- Idle Detection ----------
function setupIdleDetection() {
  const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

  events.forEach((event) => {
    document.addEventListener(event, () => {
      isIdle = false;
      if (mouseTimer) clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        isIdle = true;
      }, 8000);
    }, { passive: true });
  });
}

// ---------- Scroll Lock ----------
function setupScrollLock() {
  // Lock theme when user scrolls into certain sections
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const section = entry.target as HTMLElement;
        const lock = section.getAttribute('data-lock-theme');
        if (lock && THEMES.includes(lock)) {
          // Briefly lock - user scroll implies intentional viewing
          stopAutoSwitch();
          setTimeout(startAutoSwitch, 20000);
        }
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-lock-theme]').forEach((el) => {
    observer.observe(el);
  });
}

// ---------- Easter Egg: Celebration (fireworks + hearts) ----------
let celebrateClickCount = 0;
let celebrateTimer: ReturnType<typeof setTimeout> | null = null;

export function initCelebrationEasterEgg() {
  const canvas = document.createElement('canvas');
  canvas.id = 'celebrateCanvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const particles: any[] = [];
  const hearts: any[] = [];
  const heartColors = ['#ff5d8f', '#ff8fab', '#ff2d6f', '#ff9ec4', '#ff476f'];
  let raf: number | null = null;

  const spawnFirework = (x: number, y: number) => {
    const hue = Math.floor(Math.random() * 360);
    const count = 42 + Math.floor(Math.random() * 28);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2) * (i / count) + Math.random() * 0.2;
      const speed = 2 + Math.random() * 4.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, decay: 0.012 + Math.random() * 0.01,
        color: `hsl(${hue},90%,${55 + Math.random() * 15}%)`,
        size: 2 + Math.random() * 2,
      });
    }
  };

  const spawnHeart = (x: number, y: number) => {
    hearts.push({
      x, y,
      vy: -(1 + Math.random() * 1.5),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
      life: 1, decay: 0.006 + Math.random() * 0.004,
      size: 16 + Math.random() * 18,
      color: heartColors[Math.floor(Math.random() * heartColors.length)],
    });
  };

  const drawHeart = (x: number, y: number, size: number, color: string, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.beginPath();
    const s = size / 16;
    ctx.moveTo(0, 4 * s);
    ctx.bezierCurveTo(-8 * s, -4 * s, -8 * s, -10 * s, 0, -4 * s);
    ctx.bezierCurveTo(8 * s, -10 * s, 8 * s, -4 * s, 0, 4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const loop = () => {
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.vx *= 0.99; p.vy *= 0.99;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let j = hearts.length - 1; j >= 0; j--) {
      const h = hearts[j];
      h.sway += h.swaySpeed;
      h.x += Math.sin(h.sway) * 0.8;
      h.y += h.vy;
      h.life -= h.decay;
      if (h.life <= 0) { hearts.splice(j, 1); continue; }
      drawHeart(h.x, h.y, h.size, h.color, Math.max(h.life, 0));
    }
    if (particles.length > 0 || hearts.length > 0) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
      ctx.clearRect(0, 0, W, H);
    }
  };

  const launch = () => {
    const W = window.innerWidth, H = window.innerHeight;
    for (let k = 0; k < 6; k++) {
      setTimeout(() => spawnFirework(W * (0.15 + Math.random() * 0.7), H * (0.25 + Math.random() * 0.4)), k * 260);
    }
    for (let m = 0; m < 16; m++) {
      spawnHeart(W * Math.random(), H * (0.55 + Math.random() * 0.45));
    }
    if (raf === null) loop();
  };

  document.addEventListener('click', () => {
    celebrateClickCount++;
    if (celebrateTimer) clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(() => { celebrateClickCount = 0; }, 2000);
    if (celebrateClickCount >= 8) {
      celebrateClickCount = 0;
      launch();
    }
  });
}