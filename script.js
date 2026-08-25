// ===== Theme Toggle =====
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('buffett-theme', theme);
}

// Initialize theme
const storedTheme = localStorage.getItem('buffett-theme');
if (storedTheme) {
    setTheme(storedTheme);
} else if (prefersDark.matches) {
    setTheme('dark');
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('buffett-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// ===== Progress Bar =====
const progressBar = document.getElementById('progressBar');

function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

// ===== Header Shadow =====
const header = document.getElementById('siteHeader');

function updateHeader() {
    if (window.scrollY > 10) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// ===== Active Navigation =====
const navLinks = document.querySelectorAll('.nav-link');
const tocLinks = document.querySelectorAll('.toc-link');
const sections = document.querySelectorAll('.year-section, .final-lessons');

function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    let currentId = '';

    sections.forEach((section) => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
            currentId = section.getAttribute('id');
        }
    });

    navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });

    tocLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
}

// ===== Scroll Event (Throttled) =====
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateProgress();
            updateHeader();
            updateActiveNav();
            ticking = false;
        });
        ticking = true;
    }
});

// ===== Smooth Scroll for Nav & TOC links =====
document.querySelectorAll('.nav-link, .toc-link, .site-title').forEach((link) => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.getElementById(href.substring(1));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (href === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });
});

// ===== Scroll-triggered Animations (Intersection Observer) =====
const animatedSelectors = [
    '.summary-box', '.explain-box', '.tip-box', '.quote-box',
    '.content-block', '.analogy-item', '.lesson-item', '.story-step',
    '.key-concept', '.person-card', '.final-card', '.stat-card', '.req-card'
];

const animatedElements = document.querySelectorAll(animatedSelectors.join(', '));

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Add staggered delay
            const delay = Math.min(index * 50, 300);
            setTimeout(() => {
                entry.target.classList.add('animate-in');
            }, delay);
            observer.unobserve(entry.target);
        }
    });
}, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.1,
});

animatedElements.forEach((el) => observer.observe(el));

// ===== Keyboard Shortcut =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') return;
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    }
});

// ===== Initial State =====
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    updateHeader();
    updateActiveNav();
});
