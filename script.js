// ===== Theme =====
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('buffett-theme', t);
}

const stored = localStorage.getItem('buffett-theme');
if (stored) setTheme(stored);
else if (prefersDark.matches) setTheme('dark');

themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
});

prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('buffett-theme')) setTheme(e.matches ? 'dark' : 'light');
});

// ===== Elements =====
const progressBar = document.getElementById('progressBar');
const header = document.getElementById('siteHeader');
const navLinks = document.querySelectorAll('.nav-link');
const tocLinks = document.querySelectorAll('.toc-link');
const sections = document.querySelectorAll('.year-section, .final-lessons');

// ===== Scroll handlers =====
function updateProgress() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${h > 0 ? Math.min((window.scrollY / h) * 100, 100) : 0}%`;
}

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 8);
}

function updateActiveNav() {
  const pos = window.scrollY + 110;
  let id = '';
  sections.forEach((s) => {
    if (pos >= s.offsetTop && pos < s.offsetTop + s.offsetHeight) id = s.id;
  });
  navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
  tocLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    updateProgress();
    updateHeader();
    updateActiveNav();
    ticking = false;
  });
}, { passive: true });

// ===== Smooth scroll =====
document.querySelectorAll('.nav-link, .toc-link, .site-title').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    const target = document.getElementById(href.slice(1));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ===== Reveal animation =====
const revealSelectors = [
  '.summary-box', '.explain-box', '.tip-box', '.why-box', '.warning-box',
  '.insight-box', '.setup-box', '.quote-box', '.term', '.def-card',
  '.key-concept', '.calc-box', '.data-table-wrapper', '.fact', '.ts-item',
  '.story-step', '.coin-card', '.compare-col', '.mirror-card', '.person-card',
  '.person-mini', '.req-card', '.analogy-item', '.myth', '.qa',
  '.lesson-item', '.checklist-box', '.final-card', '.connect', '.check-card',
  '.ready-box', '.hero-guide'
].join(', ');

const revealEls = document.querySelectorAll(revealSelectors);

if ('IntersectionObserver' in window) {
  revealEls.forEach((el) => el.classList.add('anim'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -30px 0px', threshold: 0.05 });

  revealEls.forEach((el) => io.observe(el));
}

// ===== Keyboard: press D to toggle theme =====
document.addEventListener('keydown', (e) => {
  if (e.key !== 'd' && e.key !== 'D') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
});

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  updateHeader();
  updateActiveNav();
});
