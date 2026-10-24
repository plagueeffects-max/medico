// Medico homepage: hero video, reviews carousel, nav scrollspy, stats motion.
// Loads after site.js, which owns the header, dialog and shared motion.

/* ---------- Active nav link while scrolling the homepage ---------- */
(() => {
  const links = [...document.querySelectorAll('#main-nav a[data-spy]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.dataset.spy === entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = document.getElementById(a.dataset.spy); if (s) spy.observe(s); });
})();

/* ---------- Hero video ----------
   Ambient, muted and silent, so it plays regardless of the reduced-motion
   setting. Some browsers still refuse autoplay (iOS Low Power Mode, data
   saver); the poster frame stays in place in that case. */
(() => {
  const heroVideo = document.getElementById('hero-video');
  if (!heroVideo) return;
  heroVideo.muted = true;
  const play = () => { const p = heroVideo.play(); if (p) p.catch(() => {}); };
  if (heroVideo.readyState >= 2) play();
  else heroVideo.addEventListener('canplay', play, { once: true });
  // Pause while off-screen or in a background tab, resume on return
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : heroVideo.pause())).observe(heroVideo);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
  // First touch anywhere unlocks playback on browsers that blocked autoplay
  ['touchstart', 'pointerdown'].forEach((evt) => window.addEventListener(evt, play, { once: true, passive: true }));
})();

/* ---------- Reviews carousel + live Google reviews ---------- */
(() => {
  const track = document.getElementById('reviews-track');
  if (!track) return;
  const scrollButtons = document.querySelectorAll('[data-scroll]');
  const updateArrows = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    scrollButtons[0].disabled = track.scrollLeft <= 2;
    scrollButtons[1].disabled = track.scrollLeft >= max;
  };
  scrollButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = track.querySelector('.review');
      const step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth;
      track.scrollBy({ left: step * Number(btn.dataset.scroll), behavior: 'smooth' });
    });
  });
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls = 'icon') => `<svg class="${cls}"><use href="assets/icons.svg#${id}"/></svg>`;

  // Falls back to the static reviews on any failure
  (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('/api/google-reviews', { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.reviews || !data.reviews.length) return;

      track.innerHTML = data.reviews.map((r, i) => {
        const initials = r.author.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
        const avatar = r.photo
          ? `<span class="avatar"><img src="${escapeHtml(r.photo)}" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer"></span>`
          : `<span class="avatar avatar-${(i % 5) + 1}" aria-hidden="true">${escapeHtml(initials)}</span>`;
        return `<figure class="review">
          <div class="review-top"><span class="stars-inline" role="img" aria-label="${r.rating} out of 5 stars">${icon('i-star').repeat(r.rating)}</span><svg class="g-logo" aria-label="Google review"><use href="assets/icons.svg#i-google"/></svg></div>
          <blockquote>&ldquo;${escapeHtml(r.text)}&rdquo;</blockquote>
          <figcaption>${avatar}<span class="reviewer-meta"><span class="reviewer-name-row"><strong>${escapeHtml(r.author)}</strong>${icon('i-verified', 'icon-verified')}</span><small>${escapeHtml(r.time || 'Google review')}</small></span></figcaption>
        </figure>`;
      }).join('');

      document.getElementById('rating-value').textContent = Number(data.rating).toFixed(1);
      document.getElementById('rating-label').textContent = `on Google · ${data.count} reviews`;
      document.getElementById('rating-google').hidden = false;
      if (data.url) {
        document.getElementById('reviews-source-link').href = data.url;
        document.getElementById('reviews-source').hidden = false;
      }
      updateArrows();
      window.siteMotion.reveal(track);
    } catch {
      // Keep the static reviews
    }
  })();
})();

/* ---------- Home-only motion ---------- */
const homeMotion = () => {
  const { gsap } = window;
  const move = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;

  // Stats card rises out of the hero, then its cells follow
  gsap.from('[data-stats]', { y: 50 * move, autoAlpha: 0, duration: 1.1, delay: 0.9 * move });
  gsap.from('.stat', { y: 20 * move, autoAlpha: 0, stagger: 0.1, delay: 1.1 * move });

  if (move) {
    // Hero video drifts slower than the page
    gsap.to('.hero-video', {
      yPercent: 8, scale: 1.04, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
};
if (window.siteMotion.ready) homeMotion();
else document.addEventListener('motion:ready', homeMotion, { once: true });
