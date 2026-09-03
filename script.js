/* ============================================================
   Knowledge House — 자기 대화의 힘
   Scroll animations, progress bar, particles
   ============================================================ */

(function () {
  'use strict';

  /* ---------- SCROLL REVEAL (Intersection Observer) ---------- */
  const revealElements = document.querySelectorAll('.fade-up');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  /* ---------- READING PROGRESS BAR ---------- */
  const progressBar = document.querySelector('.progress-bar');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- HERO PARTICLES ---------- */
  const particleContainer = document.querySelector('.hero__particles');

  function createParticles() {
    if (!particleContainer) return;
    const count = Math.min(50, Math.floor(window.innerWidth / 25));

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      const size = Math.random() * 3 + 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * -20;
      const opacity = Math.random() * 0.3 + 0.05;

      Object.assign(dot.style, {
        position: 'absolute',
        width: size + 'px',
        height: size + 'px',
        left: x + '%',
        top: y + '%',
        borderRadius: '50%',
        background: Math.random() > 0.5
          ? 'rgba(124, 106, 239, ' + opacity + ')'
          : 'rgba(52, 211, 153, ' + opacity + ')',
        animation: 'particleFloat ' + duration + 's ease-in-out ' + delay + 's infinite',
        pointerEvents: 'none',
      });

      particleContainer.appendChild(dot);
    }
  }

  // Inject particle keyframes
  const particleStyle = document.createElement('style');
  particleStyle.textContent = `
    @keyframes particleFloat {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
      25%      { transform: translate(12px, -18px) scale(1.2); opacity: 0.6; }
      50%      { transform: translate(-8px, -30px) scale(0.8); opacity: 0.2; }
      75%      { transform: translate(15px, -12px) scale(1.1); opacity: 0.5; }
    }
  `;
  document.head.appendChild(particleStyle);
  createParticles();

  /* ---------- SMOOTH SCROLL for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- PARALLAX on hero (subtle) ---------- */
  const hero = document.querySelector('.hero__content');

  function parallax() {
    if (!hero) return;
    const scrollY = window.scrollY;
    const limit = window.innerHeight;
    if (scrollY < limit) {
      const offset = scrollY * 0.3;
      const opacity = 1 - scrollY / limit;
      hero.style.transform = 'translateY(' + offset + 'px)';
      hero.style.opacity = Math.max(opacity, 0);
    }
  }

  window.addEventListener('scroll', parallax, { passive: true });

  /* ---------- CARD TILT (mouse hover) ---------- */
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mousemove', function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      card.style.transform =
        'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });

  /* ---------- TYPING EFFECT on final quote ---------- */
  const quoteSection = document.querySelector('.final-quote');

  if (quoteSection) {
    const quoteObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            quoteSection.classList.add('visible');
            const lines = quoteSection.querySelectorAll('p');
            lines.forEach((line, i) => {
              line.style.opacity = '0';
              line.style.transform = 'translateY(16px)';
              line.style.transition =
                'opacity 0.6s cubic-bezier(.16,1,.3,1) ' + (i * 0.3) + 's, ' +
                'transform 0.6s cubic-bezier(.16,1,.3,1) ' + (i * 0.3) + 's';
              // Trigger reflow then animate
              requestAnimationFrame(() => {
                line.style.opacity = '1';
                line.style.transform = 'translateY(0)';
              });
            });
            quoteObserver.unobserve(quoteSection);
          }
        });
      },
      { threshold: 0.3 }
    );
    quoteObserver.observe(quoteSection);
  }
})();
