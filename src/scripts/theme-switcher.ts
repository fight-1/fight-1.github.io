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

// ---------- Easter Egg: Chaos Mode ----------
let chaosClickCount = 0;
let chaosTimer: ReturnType<typeof setTimeout> | null = null;

export function initChaosEasterEgg() {
  document.addEventListener('click', () => {
    chaosClickCount++;
    if (chaosTimer) clearTimeout(chaosTimer);
    chaosTimer = setTimeout(() => { chaosClickCount = 0; }, 2000);

    if (chaosClickCount >= 8) {
      chaosClickCount = 0;
      triggerChaos();
    }
  });
}

function triggerChaos() {
  const original = document.documentElement.getAttribute('data-theme') || 'mirror';

  // Rapid theme cycling
  let flashCount = 0;
  const interval = setInterval(() => {
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    document.documentElement.setAttribute('data-theme', randomTheme);
    flashCount++;
    if (flashCount >= 10) {
      clearInterval(interval);
      applyTheme(original, true);
      showChaosMessage();
    }
  }, 80);
}

function showChaosMessage() {
  const msg = document.createElement('div');
  msg.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 10000; font-family: var(--font-mono); font-size: 1.5rem;
    color: var(--accent-1); text-align: center; pointer-events: none;
    animation: fadeInUp 0.3s ease both;
  `;
  msg.textContent = '⚠ CHAOS MODE — All systems nominal';
  document.body.appendChild(msg);
  setTimeout(() => {
    msg.style.opacity = '0';
    msg.style.transition = 'opacity 0.5s';
    setTimeout(() => msg.remove(), 500);
  }, 2000);
}