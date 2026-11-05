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
  // One file per device (<source media> is ignored by Chrome, which fetched both).
  // Data-saver users keep the poster frame instead.
  if (navigator.connection && navigator.connection.saveData) return;
  heroVideo.src = window.matchMedia('(min-width: 901px)').matches ? heroVideo.dataset.srcLg : heroVideo.dataset.srcSm;
  heroVideo.preload = 'auto';
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

/* ---------- Reviews: endless strip + live Google reviews ----------
   The cards are cloned once (clones hidden from screen readers) and the pair
   slides by exactly one set width, so the loop never jumps. It pauses while a
   card is hovered, focused or touched. Reduced motion keeps a plain swipe row. */
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (id, cls = 'icon') => `<svg class="${cls}"><use href="/assets/icons.svg#${id}"/></svg>`;

(() => {
  const marquee = document.getElementById('reviews-marquee');
  const track = document.getElementById('reviews-track');
  if (!marquee || !track) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const build = () => {
    track.querySelectorAll('[data-clone]').forEach((el) => el.remove());
    if (still) return;
    const originals = [...track.children];
    originals.forEach((el) => {
      const c = el.cloneNode(true);
      c.setAttribute('data-clone', '');
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('role');
      track.appendChild(c);
    });
    // ~45px per second whatever the card count or screen width
    const setWidth = track.scrollWidth / 2;
    track.style.setProperty('--loop', `${setWidth}px`);
    track.style.setProperty('--duration', `${Math.max(30, setWidth / 45)}s`);
    marquee.classList.add('is-running');
  };

  // Touch: pause on press, resume a moment after the finger lifts
  let resume;
  marquee.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(resume);
    marquee.classList.add('is-held');
  });
  ['pointerup', 'pointercancel'].forEach((evt) => marquee.addEventListener(evt, () => {
    clearTimeout(resume);
    resume = setTimeout(() => marquee.classList.remove('is-held'), 2500);
  }));
  // Off-screen: stop painting it
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => marquee.classList.toggle('is-offscreen', !en.isIntersecting)).observe(marquee);
  }
  let rw;
  window.addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(build, 250); });
  build();
  window.medicoReviews = { rebuild: build };
})();

(() => {
  const track = document.getElementById('reviews-track');
  if (!track) return;

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
        const text = r.text.length > 260 ? `${r.text.slice(0, 250).replace(/\s+\S*$/, '')}…` : r.text;
        return `<figure class="review" role="listitem">
          <blockquote>&ldquo;${escapeHtml(text)}&rdquo;</blockquote>
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
      window.medicoReviews?.rebuild();
    } catch {
      // Keep the static reviews
    }
  })();
})();

/* ---------- Latest articles from the blog API (static cards stay as fallback) ---------- */
(async () => {
  const grid = document.querySelector('.insight-grid');
  if (!grid) return;
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) return;
    const { success, posts } = await res.json();
    if (!success || !Array.isArray(posts) || posts.length < 2) return;
    const latest = posts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 2);
    const cards = grid.querySelectorAll('.insight:not(.insight-more)');
    latest.forEach((p, i) => {
      const card = cards[i];
      if (!card) return;
      const url = p.slug ? `/blog/${encodeURIComponent(p.slug)}` : `/blog-post.html?id=${encodeURIComponent(p.id)}`;
      const img = p.image ? (/^(https?:)?\//.test(p.image) ? p.image : `/${p.image}`) : '';
      const d = new Date(`${p.date}T00:00:00`);
      const when = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      card.href = url;
      card.innerHTML = `<div class="insight-media" data-media>${img ? `<img src="${escapeHtml(img)}" alt="" width="900" height="676" loading="lazy">` : ''}${when ? `<time datetime="${escapeHtml(p.date)}">${when}</time>` : ''}</div>
        <div class="insight-body"><span class="insight-tag">${escapeHtml(p.category || 'Article')}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.subheading || '')}</p><span class="read-link">Read article${icon('i-arrow')}</span></div>`;
    });
  } catch {
    // Static cards stay
  }
})();

/* ---------- Home-only motion ---------- */
const homeMotion = () => {
  const { gsap } = window;
  const move = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;

  // Stats card rises out of the hero, then its cells follow
  gsap.fromTo('[data-stats]', { y: 50 * move, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, delay: 0.9 * move });
  gsap.fromTo('.stat', { y: 20 * move, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, delay: 1.1 * move });

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
