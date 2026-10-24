// Medico homepage: interactions + GSAP motion.
const root = document.documentElement;
const WHATSAPP = '919419008453';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Header ---------- */
const header = document.getElementById('site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Mobile menu ---------- */
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('main-nav');
const setMenu = (open) => {
  root.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuToggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
nav.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

/* ---------- Active nav link ---------- */
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
}

/* ---------- Hero video ----------
   Ambient, muted and silent, so it plays regardless of the reduced-motion
   setting. Some browsers still refuse autoplay (iOS Low Power Mode, data
   saver); the poster frame stays in place in that case. */
const heroVideo = document.getElementById('hero-video');
if (heroVideo) {
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
}

/* ---------- Reviews carousel ---------- */
const track = document.getElementById('reviews-track');
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

/* ---------- Live Google reviews (falls back to the static ones) ---------- */
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const starSvg = '<svg class="icon"><use href="#i-star"/></svg>';

async function loadGoogleReviews() {
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
        <div class="review-top"><span class="stars-inline" role="img" aria-label="${r.rating} out of 5 stars">${starSvg.repeat(r.rating)}</span><svg class="g-logo" aria-label="Google review"><use href="#i-google"/></svg></div>
        <blockquote>&ldquo;${escapeHtml(r.text)}&rdquo;</blockquote>
        <figcaption>${avatar}<span class="reviewer-meta"><span class="reviewer-name-row"><strong>${escapeHtml(r.author)}</strong><svg class="icon-verified" aria-label="Verified Customer"><use href="#i-verified"/></svg></span><small>${escapeHtml(r.time || 'Google review')}</small></span></figcaption>
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
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  } catch {
    // Keep the static reviews
  }
}
loadGoogleReviews();

/* ---------- Enquiry dialog ---------- */
const dialog = document.getElementById('enquiry-dialog');
const form = document.getElementById('enquiry-form');
const title = document.getElementById('enquiry-title');
const sub = document.getElementById('enquiry-sub');
let isCallback = false;

document.querySelectorAll('[data-open-enquiry]').forEach((btn) => {
  btn.addEventListener('click', () => {
    isCallback = btn.hasAttribute('data-callback');
    title.textContent = isCallback ? 'Request a callback' : 'Request a quote';
    sub.textContent = isCallback
      ? 'Leave your details and we’ll call you back.'
      : 'Takes 30 seconds. We’ll reply on WhatsApp.';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.open(`https://wa.me/${WHATSAPP}`, '_blank');
  });
});
dialog.querySelector('[data-close-enquiry]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.elements.name;
  const field = name.closest('.field');
  const error = document.getElementById('f-name-error');

  if (!name.value.trim()) {
    field.classList.add('has-error');
    error.textContent = 'Please enter your name so we know who to reply to.';
    name.focus();
    return;
  }
  field.classList.remove('has-error');
  error.textContent = '';

  const lines = [
    isCallback ? 'Hello Medico, please call me back.' : 'Hello Medico, I would like a quote.',
    `Name: ${name.value.trim()}`,
    `Enquiring for: ${form.elements.type.value}`,
    `Equipment: ${form.elements.equipment.value}`,
  ];
  const details = form.elements.message.value.trim();
  if (details) lines.push(`Details: ${details}`);

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
  const win = window.open(url, '_blank');
  if (win) win.opener = null;
  else window.location.href = url; // popup blocked (some in-app browsers)
  dialog.close();
});
form.elements.name.addEventListener('input', (e) => {
  if (!e.target.value.trim()) return;
  e.target.closest('.field').classList.remove('has-error');
  document.getElementById('f-name-error').textContent = '';
});

/* ---------- Footer year ---------- */
document.querySelectorAll('.current-year').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* =====================================================
   Motion (GSAP + ScrollTrigger + SplitText)
   Full motion by default. With reduced motion requested, everything
   still arrives, but as a plain fade: no travel, no parallax.
   ===================================================== */
function initMotion() {
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.add('no-anim');
    return;
  }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  const move = reducedMotion ? 0 : 1; // multiplies every distance
  const ease = 'power3.out';
  gsap.defaults({ ease, duration: 0.9 });

  // Masked lines slide up; with reduced motion they only fade
  const lineFrom = reducedMotion ? { autoAlpha: 0 } : { yPercent: 110 };
  // Returns the line elements plus a revert() that restores the original
  // markup once the reveal is done, so resizes re-flow headings naturally.
  const splitLines = (el) => {
    if (!window.SplitText || reducedMotion) return { lines: [el], revert: () => {} };
    const split = new window.SplitText(el, { type: 'lines', linesClass: 'split-line-inner', mask: 'lines' });
    return { lines: split.lines, revert: () => split.revert() };
  };

  /* Hero entrance */
  const heroTitle = document.querySelector('[data-hero-title]');
  gsap.set('[data-hero], [data-hero-title], [data-tagline], [data-hero-badge]', { autoAlpha: 1, animation: 'none' });
  const heroSplit = splitLines(heroTitle);
  const tl = gsap.timeline({ delay: 0.1 });
  tl.from('.site-header', { y: -24 * move, autoAlpha: 0, duration: 0.8 })
    .from('.hero-media', { scale: 1 + 0.08 * move, autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, 0)
    .from('.hero-eyebrow', { y: 16 * move, autoAlpha: 0, duration: 0.7 }, 0.2)
    .from(heroSplit.lines, { ...lineFrom, duration: 1.1, stagger: 0.09, ease: 'power4.out', onComplete: heroSplit.revert }, 0.3)
    .from('.hero-copy .lead', { y: 20 * move, autoAlpha: 0 }, 0.65)
    .from('.hero-copy .cta-row > *', { y: 20 * move, autoAlpha: 0, stagger: 0.08 }, 0.8)
    .from('.hero-proof', { y: 16 * move, autoAlpha: 0 }, 0.95)
    .from('.tagline-bar', { scaleX: 0, transformOrigin: 'right center', duration: 0.8 }, 0.9)
    .from('[data-tagline]', { x: 30 * move, autoAlpha: 0, stagger: 0.12 }, 1)
    .from('[data-hero-badge]', { y: 24 * move, scale: 1 - 0.06 * move, autoAlpha: 0, ease: 'back.out(1.6)' }, 1.1);

  /* Stats: card rises, numbers count up */
  gsap.from('[data-stats]', {
    y: 50 * move, autoAlpha: 0, duration: 1.1, delay: reducedMotion ? 0 : 0.9,
    scrollTrigger: { trigger: '[data-stats]', start: 'top 95%' },
  });
  gsap.from('.stat', {
    y: 20 * move, autoAlpha: 0, stagger: 0.1, delay: reducedMotion ? 0 : 1.1,
    scrollTrigger: { trigger: '[data-stats]', start: 'top 95%' },
  });
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const counter = { v: 0 };
    gsap.to(counter, {
      v: target, duration: 1.8, ease: 'power2.out', delay: 1.1,
      scrollTrigger: { trigger: el, start: 'top 95%' },
      onUpdate: () => { el.textContent = Math.round(counter.v); },
    });
  });

  /* Section headings: masked line reveal */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const split = splitLines(el);
    gsap.from(split.lines, {
      ...lineFrom, duration: 1.1, stagger: 0.1, ease: 'power4.out', onComplete: split.revert,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* Single elements: fade up */
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 28 * move, autoAlpha: 0,
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  /* Groups: children cascade in */
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    gsap.from(group.children, {
      y: 48 * move, autoAlpha: 0, duration: 1, stagger: 0.09,
      scrollTrigger: { trigger: group, start: 'top 85%' },
    });
  });

  /* Image frames: clip-path reveal */
  document.querySelectorAll('[data-clip]').forEach((el) => {
    gsap.from(el, {
      clipPath: reducedMotion ? 'inset(0% 0% 0% 0% round 28px)' : 'inset(12% 12% 12% 12% round 28px)',
      autoAlpha: 0, duration: 1.4, ease: 'power3.inOut',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  /* Big dark cards: scale in */
  ['[data-services]', '[data-cta]'].forEach((sel) => {
    gsap.from(sel, {
      y: 60 * move, scale: 1 - 0.04 * move, autoAlpha: 0, duration: 1.2,
      scrollTrigger: { trigger: sel, start: 'top 88%' },
    });
  });

  if (!reducedMotion) {
    /* Parallax on background imagery */
    document.querySelectorAll('[data-parallax]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    document.querySelectorAll('[data-parallax-img]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    /* Hero video drifts slower than the page */
    gsap.to('.hero-video', {
      yPercent: 8, scale: 1.04, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    /* Magnetic primary buttons (pointer devices only) */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.btn-dark, .btn-accent, .wa-fab').forEach((btn) => {
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.18);
          yTo((e.clientY - r.top - r.height / 2) * 0.25);
        });
        btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }
  }

  /* WhatsApp button pops in after the hero settles */
  gsap.from('.wa-fab', { scale: 0, autoAlpha: 0, delay: 1.6, duration: 0.7, ease: 'back.out(2)' });

  // Images loading late can shift trigger positions
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

// Split headings only after Inter has loaded, so line breaks are final.
// Cap the wait so a slow font never holds the hero back.
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(initMotion);
