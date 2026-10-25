// Medico shared layer: header, menu, search, enquiry dialog + GSAP motion engine.
// Every query is null-safe so any page can load this file.
const root = document.documentElement;
const WHATSAPP = '919419008453';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Header: soft shadow once scrolled (always visible) ---------- */
const header = document.getElementById('site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Mobile menu ---------- */
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('main-nav');
const setMenu = (open) => {
  if (!menuToggle) return;
  // The top strip may still be on screen, so the sheet starts at the header's real bottom edge
  if (open && header) root.style.setProperty('--menu-top', `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
  root.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => { setSearch(false); setMenu(!root.classList.contains('menu-open')); });
  nav.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
  window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
}

/* ---------- Header search (submits to the catalogue) ---------- */
const searchBtn = document.getElementById('search-toggle');
const searchInput = document.getElementById('header-search-input');
function setSearch(open) {
  if (!searchBtn) return;
  root.classList.toggle('search-open', open);
  searchBtn.setAttribute('aria-expanded', String(open));
  if (open && searchInput) setTimeout(() => searchInput.focus({ preventScroll: true }), 60);
}
if (searchBtn) {
  searchBtn.addEventListener('click', () => { setMenu(false); setSearch(!root.classList.contains('search-open')); });
  document.addEventListener('click', (e) => {
    if (root.classList.contains('search-open') && !e.target.closest('.site-header')) setSearch(false);
  });
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setMenu(false); setSearch(false); } });

/* ---------- Enquiry dialog (falls back to WhatsApp) ---------- */
const dialog = document.getElementById('enquiry-dialog');
const form = document.getElementById('enquiry-form');
let isCallback = false;

document.querySelectorAll('[data-open-enquiry]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    isCallback = btn.hasAttribute('data-callback');
    if (dialog && typeof dialog.showModal === 'function') {
      document.getElementById('enquiry-title').textContent = isCallback ? 'Request a callback' : 'Request a quote';
      document.getElementById('enquiry-sub').textContent = isCallback
        ? 'Leave your details and we’ll call you back.'
        : 'Takes 30 seconds. We’ll reply on WhatsApp.';
      const product = btn.dataset.product;
      if (product && form) form.elements.message.value = `Interested in: ${product}`;
      dialog.showModal();
    } else {
      window.open(`https://wa.me/${WHATSAPP}`, '_blank');
    }
  });
});

if (dialog && form) {
  dialog.querySelector('[data-close-enquiry]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  const name = form.elements.name;
  const nameError = document.getElementById('f-name-error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const field = name.closest('.field');
    if (!name.value.trim()) {
      field.classList.add('has-error');
      nameError.textContent = 'Please enter your name so we know who to reply to.';
      name.focus();
      return;
    }
    field.classList.remove('has-error');
    nameError.textContent = '';

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
  name.addEventListener('input', () => {
    if (!name.value.trim()) return;
    name.closest('.field').classList.remove('has-error');
    nameError.textContent = '';
  });
}

/* ---------- Footer year ---------- */
document.querySelectorAll('.current-year').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* =====================================================
   Motion engine (GSAP + ScrollTrigger + SplitText)
   Markup hooks:
     data-hero / data-hero-title / data-hero-media  page-load timeline
     data-split        heading lines rise out of a mask
     data-reveal       fade up (value: left | right | scale)
     data-stagger      children cascade in
     data-clip         image frame opens from the centre
     data-parallax     background drifts slower than the page
     data-scrub-scale  big card grows into place as it scrolls in (desktop)
     data-scrub-words  statement text lights up word by word
     data-draw         line draws itself while scrolling (="x" for horizontal)
     data-count        number counts up
   window.siteMotion.reveal(el) animates children rendered later by JS.
   With reduced motion everything still arrives, as a plain fade.
   ===================================================== */
const pending = [];
window.siteMotion = { reveal: (el) => { if (el) pending.push(el); }, refresh: () => {} };

function initMotion() {
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.add('no-anim');
    return;
  }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  const move = reducedMotion ? 0 : 1; // multiplies every distance
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });

  const lineFrom = reducedMotion ? { autoAlpha: 0 } : { yPercent: 110 };
  // Returns the line elements plus a revert() that restores the original
  // markup once the reveal is done, so resizes re-flow headings naturally.
  const splitLines = (el) => {
    if (!window.SplitText || reducedMotion) return { lines: [el], revert: () => {} };
    const split = new window.SplitText(el, { type: 'lines', linesClass: 'split-line-inner', mask: 'lines' });
    return { lines: split.lines, revert: () => split.revert() };
  };
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  /* ---------- Page-load timeline ---------- */
  const heroBits = $$('[data-hero], [data-hero-title]');
  gsap.set('[data-hero], [data-hero-title], [data-hero-media], [data-tagline], [data-hero-badge]', { autoAlpha: 1, animation: 'none' });
  const tl = gsap.timeline({ delay: 0.05 });
  // Fade only: an inline transform on the sticky header would break the menu sheet's positioning
  if (header) tl.from(['.topbar', header], { autoAlpha: 0, duration: 0.7, clearProps: 'opacity,visibility' }, 0);
  $$('[data-hero-media]').forEach((el) => {
    tl.fromTo(el, { scale: 1 + 0.06 * move, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 0.1);
  });
  heroBits.forEach((el, i) => {
    const at = 0.2 + i * 0.12;
    if (el.hasAttribute('data-hero-title')) {
      const split = splitLines(el);
      tl.from(split.lines, { ...lineFrom, duration: 1.1, stagger: 0.09, ease: 'power4.out', onComplete: split.revert }, at);
    } else {
      tl.fromTo(el, { y: 22 * move, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, at);
    }
  });
  const heroEnd = 0.3 + heroBits.length * 0.12;
  if (document.querySelector('.tagline-bar')) tl.from('.tagline-bar', { scaleX: 0, transformOrigin: 'right center', duration: 0.8 }, heroEnd - 0.2);
  if (document.querySelector('[data-tagline]')) tl.fromTo('[data-tagline]', { x: 30 * move, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.12 }, heroEnd - 0.1);
  if (document.querySelector('[data-hero-badge]')) tl.fromTo('[data-hero-badge]', { y: 24 * move, scale: 1 - 0.06 * move, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, ease: 'back.out(1.6)' }, heroEnd);

  /* ---------- Scroll reveals ---------- */
  $$('[data-split]').forEach((el) => {
    const split = splitLines(el);
    gsap.from(split.lines, {
      ...lineFrom, duration: 1.1, stagger: 0.1, ease: 'power4.out', onComplete: split.revert,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  const revealFrom = {
    left: { x: -40 * move },
    right: { x: 40 * move },
    scale: { scale: 1 - 0.06 * move },
  };
  // fromTo with explicit end values everywhere: from() reads the resting position at
  // start-up, and elements with a CSS transform transition (hover lifts) report a
  // mid-transition value, which left whole card grids parked 48px low.
  $$('[data-reveal]').forEach((el) => {
    gsap.fromTo(el, { y: el.dataset.reveal ? 0 : 28 * move, ...revealFrom[el.dataset.reveal], autoAlpha: 0 }, {
      x: 0, y: 0, scale: 1, autoAlpha: 1,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  $$('[data-stagger]').forEach((group) => {
    gsap.fromTo(group.children, { y: 48 * move, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 1, stagger: 0.09,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true },
    });
  });

  $$('[data-clip]').forEach((el) => {
    gsap.fromTo(el, { clipPath: reducedMotion ? 'inset(0% 0% 0% 0% round 28px)' : 'inset(12% 12% 12% 12% round 28px)', autoAlpha: 0 }, {
      clipPath: 'inset(0% 0% 0% 0% round 28px)', autoAlpha: 1, duration: 1.4, ease: 'power3.inOut', clearProps: 'clipPath',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const counter = { v: 0 };
    gsap.to(counter, {
      v: target, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
      onUpdate: () => { el.textContent = Math.round(counter.v); },
    });
  });

  // Footer columns rise in together
  $$('.footer-grid').forEach((grid) => {
    gsap.fromTo(grid.children, { y: 24 * move, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, stagger: 0.08,
      scrollTrigger: { trigger: grid, start: 'top 92%', once: true },
    });
  });

  /* ---------- JS-rendered grids ---------- */
  const reveal = (container) => {
    const items = [...container.children];
    if (!items.length) return;
    gsap.set(items, { autoAlpha: 0, y: 40 * move });
    ScrollTrigger.batch(items, {
      start: 'top 94%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.9, overwrite: true }),
    });
    ScrollTrigger.refresh();
  };
  window.siteMotion = { reveal, refresh: () => ScrollTrigger.refresh(), ready: true };
  pending.splice(0).forEach(reveal);

  /* ---------- Desktop-only scroll choreography ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    $$('[data-scrub-scale]').forEach((el) => {
      gsap.fromTo(el, { scale: 0.92, borderRadius: 48 }, {
        scale: 1, borderRadius: 28, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: 0.6 },
      });
    });
  });
  mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
    $$('[data-scrub-scale]').forEach((el) => {
      gsap.fromTo(el, { y: 40 * move, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  });
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    $$('[data-parallax]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Lines that draw themselves as you scroll (timelines)
    // data-draw="x" draws left to right on wide screens; stacked layouts draw top to bottom
    $$('[data-draw]').forEach((el) => {
      const across = el.dataset.draw === 'x' && window.matchMedia('(min-width: 901px)').matches;
      const axis = across ? 'scaleX' : 'scaleY';
      gsap.fromTo(el, { [axis]: 0 }, {
        [axis]: 1, ease: 'none', transformOrigin: across ? 'left center' : 'top center',
        // The line's container (timeline block) sets the scroll distance, not the 2px line itself
        scrollTrigger: { trigger: el.parentElement.parentElement, start: 'top 75%', end: 'bottom 55%', scrub: 0.4 },
      });
    });

    // Statement text: words brighten as they cross the viewport
    $$('[data-scrub-words]').forEach((el) => {
      if (!window.SplitText) return;
      const split = new window.SplitText(el, { type: 'words' });
      gsap.fromTo(split.words, { opacity: 0.16 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true },
      });
    });

    // Reading progress hairline under the header
    const bar = document.querySelector('.scroll-progress');
    if (bar) {
      gsap.to(bar, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
    }

    // Magnetic primary buttons (pointer devices only)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('.btn-dark, .btn-accent, .wa-fab').forEach((btn) => {
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
  });

  /* WhatsApp button pops in after the hero settles */
  if (document.querySelector('.wa-fab')) gsap.fromTo('.wa-fab', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, delay: 1.4, duration: 0.7, ease: 'back.out(2)', clearProps: 'transform' });

  // Images loading late can shift trigger positions
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.dispatchEvent(new CustomEvent('motion:ready'));
}

// Split headings only after Inter has loaded, so line breaks are final.
// Cap the wait so a slow font never holds the hero back.
// Also wait for DOMContentLoaded, so page scripts have rendered their markup.
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
// readyState is already 'interactive' while deferred scripts run, so wait for the event itself
const domReady = new Promise((r) => (document.readyState === 'complete' ? r() : document.addEventListener('DOMContentLoaded', r, { once: true })));
Promise.all([domReady, Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))])]).then(initMotion);
