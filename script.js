// ===== Theme Toggle =====
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('buffett-theme', theme);
}

function getStoredTheme() {
    return localStorage.getItem('buffett-theme');
}

// Initialize theme
const storedTheme = getStoredTheme();
if (storedTheme) {
    setTheme(storedTheme);
} else if (prefersDark.matches) {
    setTheme('dark');
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// Listen for system theme changes
prefersDark.addEventListener('change', (e) => {
    if (!getStoredTheme()) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// ===== Active Navigation on Scroll =====
const navLinks = document.querySelectorAll('.nav-link');
const yearSections = document.querySelectorAll('.year-section');

function updateActiveNav() {
    const scrollPos = window.scrollY + 160;

    let currentSection = null;

    yearSections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Throttle scroll handler for performance
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        window.requestAnimationFrame(() => {
            updateActiveNav();
            scrollTicking = false;
        });
        scrollTicking = true;
    }
});

// ===== Smooth Scroll for Nav Links =====
navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetEl = document.getElementById(targetId);

        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Update active state immediately
            navLinks.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
});

// ===== Scroll-triggered Animations (Intersection Observer) =====
const animatedElements = document.querySelectorAll('.card, .lesson-card, .timeline-item');

// Reset initial animation state — let IntersectionObserver handle it
animatedElements.forEach((el) => {
    el.style.opacity = '0';
    el.style.animation = 'none';
});

const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1,
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.animation = '';
            entry.target.style.opacity = '';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

animatedElements.forEach((el) => observer.observe(el));

// ===== Header Shadow on Scroll =====
const header = document.querySelector('.site-header');

function updateHeaderShadow() {
    if (window.scrollY > 10) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
    } else {
        header.style.boxShadow = 'none';
    }
}

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        window.requestAnimationFrame(() => {
            updateHeaderShadow();
        });
    }
});

// Initial call
updateHeaderShadow();

// ===== Keyboard Navigation =====
document.addEventListener('keydown', (e) => {
    // Press 'D' to toggle dark mode
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeEl = document.activeElement;
        if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') return;

        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    }
});

// ===== Back to Top (via header click) =====
document.querySelector('.site-title').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Progress Indicator (reading progress bar) =====
const progressBar = document.createElement('div');
progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: var(--color-accent);
    z-index: 9999;
    transition: width 0.1s linear;
    width: 0%;
`;
document.body.prepend(progressBar);

function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

window.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateProgress);
});

// ===== Initial setup on page load =====
document.addEventListener('DOMContentLoaded', () => {
    updateActiveNav();
    updateProgress();
});
