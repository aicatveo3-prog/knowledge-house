/* ============================================================
   Knowledge House — Blog Article
   Minimal: progress bar + fade-in
   ============================================================ */

(function () {
  'use strict';

  /* --- Reading progress bar --- */
  var bar = document.querySelector('.progress-bar');

  function updateProgress() {
    var scrollTop  = window.scrollY;
    var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* --- Fade-in on scroll --- */
  var targets = document.querySelectorAll(
    '.article__header, .article__body section, .callout, .article__closing'
  );

  targets.forEach(function (el) { el.classList.add('fade-in'); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(function (el) { observer.observe(el); });
})();
