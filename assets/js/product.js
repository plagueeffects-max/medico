// Medico product page: renders one ProductsDB entry by ?id=.
// Text is escaped; admin-authored HTML (overview, in-the-box) is sanitised.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg class="icon"><use href="assets/icons.svg#${id}"/></svg>`;
  const safeUrl = (u) => (/^(https?:|data:(image|video)\/|images\/|assets\/|Products\/)/i.test(String(u)) ? u : '');
  const sanitize = (html) => (window.DOMPurify ? window.DOMPurify.sanitize(html) : esc(String(html).replace(/<[^>]*>/g, ' ')));
  const FALLBACK = 'images/products/oxygen.webp';

  const id = new URLSearchParams(window.location.search).get('id');
  const all = ProductsDB.getProducts();
  const p = all.find((x) => x.id === id);
  if (!p) { $('pd-missing').hidden = false; return; }

  document.title = `${p.title} | Medico Scientific Service Centre`;
  const catUrl = `shop.html?category=${encodeURIComponent(p.category)}`;
  $('crumb-cat').textContent = p.category;
  $('crumb-cat').href = catUrl;
  $('crumb-title').textContent = p.title;
  $('pd-category').textContent = p.category;
  $('pd-title').textContent = p.title;
  $('pd-desc').textContent = p.description || '';

  const onRequest = p.stock && p.stock !== 'In Stock';
  const stock = $('pd-stock-pill');
  stock.textContent = onRequest ? p.stock : 'In stock';
  stock.classList.add(onRequest ? 'pill-warn' : 'pill-ok');
  if (p.brand) { $('pd-brand').hidden = false; $('pd-brand').textContent = p.brand; }
  if (p.sku) { $('pd-sku').hidden = false; $('pd-sku').textContent = `SKU ${p.sku}`; }
  if (Array.isArray(p.features) && p.features.length) {
    $('pd-features').hidden = false;
    $('pd-features').innerHTML = p.features.map((f) => `<li>${icon('i-check')}${esc(f)}</li>`).join('');
  }
  if (Number(p.price) > 0) {
    $('pd-price-wrap').hidden = false;
    $('pd-price').textContent = `₹${Number(p.price).toLocaleString('en-IN')}`;
  }

  $('pd-quote').dataset.product = p.title;
  $('pd-whatsapp').href = `https://wa.me/919419008453?text=${encodeURIComponent(`Hello Medico, I'm interested in ${p.title}. Please share details and pricing.`)}`;

  // Gallery (images or short videos)
  const media = [p.mainImage, ...(p.galleryImages || [])].map(safeUrl).filter(Boolean);
  const stage = $('pd-image');
  const show = (src) => {
    const isVideo = /\.(webm|mp4)$/i.test(src) || src.startsWith('data:video');
    const current = stage.parentElement.querySelector('video');
    if (current) current.remove();
    if (isVideo) {
      stage.hidden = true;
      const v = document.createElement('video');
      Object.assign(v, { src, autoplay: true, loop: true, muted: true, playsInline: true });
      stage.after(v);
    } else {
      stage.hidden = false;
      stage.src = src;
    }
  };
  stage.alt = p.title;
  stage.addEventListener('error', () => { if (!stage.src.endsWith(FALLBACK)) stage.src = FALLBACK; });
  show(media[0] || FALLBACK);
  if (media.length > 1) {
    const thumbs = $('pd-thumbs');
    thumbs.hidden = false;
    thumbs.innerHTML = media.map((src, i) => `<button type="button" data-i="${i}" aria-current="${i === 0}" aria-label="Show image ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('');
    thumbs.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      thumbs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b === btn)));
      show(media[Number(btn.dataset.i)]);
    });
  }

  // Tabs
  if (p.longDescription) $('panel-desc').innerHTML = sanitize(p.longDescription);
  else { $('tab-desc').remove(); $('panel-desc').remove(); }
  const specs = Array.isArray(p.specifications) ? p.specifications : [];
  if (specs.length) {
    $('panel-specs').innerHTML = `<dl class="spec-list">${specs.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`).join('')}</dl>`;
  } else $('tab-specs').remove();
  if (p.inTheBox) $('panel-box').innerHTML = sanitize(p.inTheBox);
  else $('tab-box').remove();

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const hasDetails = tabs.length > 0;
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });
  if (tabs.length < 2) document.querySelector('.tabs').hidden = true;
  if (hasDetails) select(tabs[0]);

  $('product').hidden = false;
  $('pd-details').hidden = !hasDetails;

  // Related: same category first, then the rest
  const related = all
    .filter((x) => x.id !== p.id)
    .sort((a, b) => (b.category === p.category) - (a.category === p.category))
    .slice(0, 3);
  if (related.length) {
    $('pd-related-grid').innerHTML = related.map((r) => {
      const href = `product.html?id=${encodeURIComponent(r.id)}`;
      const req = r.stock && r.stock !== 'In Stock';
      return `
      <article class="item-card">
        <div class="item-top"><span class="pill ${req ? 'pill-warn' : 'pill-ok'}">${req ? esc(r.stock) : 'In stock'}</span></div>
        <a href="${href}" class="item-media" tabindex="-1" aria-hidden="true"><img src="${esc(safeUrl(r.mainImage) || FALLBACK)}" alt="" loading="lazy"></a>
        <div class="item-body">
          <h3><a href="${href}">${esc(r.title)}</a></h3>
          <p>${esc(r.description)}</p>
          <div class="item-foot">${r.brand ? `<span class="pill">${esc(r.brand)}</span>` : '<span></span>'}<span class="item-link">View details${icon('i-arrow')}</span></div>
        </div>
      </article>`;
    }).join('');
    $('pd-related').hidden = false;
    window.siteMotion.reveal($('pd-related-grid'));
  }
})();
