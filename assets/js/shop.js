// Medico products page: filters, search, sort, layout toggle, saved items.
// Counts and filter options come from ProductsDB, so admin edits show up here.
(() => {
  const products = ProductsDB.getProducts();
  const params = new URLSearchParams(window.location.search);
  const state = {
    category: params.get('category') || 'All',
    search: (params.get('q') || '').trim().toLowerCase(),
    availability: [],
    brands: [],
    sort: 'featured',
  };
  let saved = new Set();
  try { saved = new Set(JSON.parse(localStorage.getItem('medico_favs') || '[]')); } catch { /* private mode */ }

  const $ = (id) => document.getElementById(id);
  const grid = $('product-grid');
  const searchInput = $('equipment-search');
  const categoryList = $('category-list');
  const resultCount = $('result-count');
  const filters = $('filters');
  const filtersToggle = $('filters-toggle');

  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg class="icon"><use href="assets/icons.svg#${id}"/></svg>`;
  const countBy = (key) => products.reduce((m, p) => (p[key] ? m.set(p[key], (m.get(p[key]) || 0) + 1) : m), new Map());

  /* ---------- Sidebar ---------- */
  function renderCategories() {
    const counts = countBy('category');
    const cats = ['All', ...ProductsDB.getCategories().filter((c) => counts.has(c))];
    categoryList.innerHTML = cats.map((c) => `
      <li><button type="button" class="category-btn${state.category === c ? ' is-active' : ''}" data-cat="${esc(c)}" aria-pressed="${state.category === c}">
        <span>${c === 'All' ? 'All products' : esc(c)}</span><span class="count">${c === 'All' ? products.length : counts.get(c)}</span>
      </button></li>`).join('');
  }
  function renderChecks(listId, name, key) {
    const counts = countBy(key);
    $(listId).innerHTML = [...counts.keys()].sort().map((v) => `
      <li><label class="check-row"><input type="checkbox" name="${name}" value="${esc(v)}"><span>${esc(v)}</span><span class="count">${counts.get(v)}</span></label></li>`).join('');
  }

  categoryList.addEventListener('click', (e) => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderCategories();
    apply();
  });
  document.addEventListener('change', (e) => {
    if (e.target.name === 'availability' || e.target.name === 'brand') {
      const picked = (name) => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
      state.availability = picked('availability');
      state.brands = picked('brand');
      apply();
    }
  });
  searchInput.value = params.get('q') || '';
  searchInput.addEventListener('input', () => { state.search = searchInput.value.trim().toLowerCase(); apply(); });
  $('sort-select').addEventListener('change', (e) => { state.sort = e.target.value; apply(); });
  $('reset-filters').addEventListener('click', () => {
    Object.assign(state, { category: 'All', search: '', availability: [], brands: [], sort: 'featured' });
    searchInput.value = '';
    $('sort-select').value = 'featured';
    document.querySelectorAll('.check-row input').forEach((cb) => { cb.checked = false; });
    renderCategories();
    apply();
  });

  /* ---------- Layout toggle ---------- */
  const setLayout = (list) => {
    grid.classList.toggle('is-list', list);
    $('grid-view').classList.toggle('is-active', !list);
    $('list-view').classList.toggle('is-active', list);
    $('grid-view').setAttribute('aria-pressed', String(!list));
    $('list-view').setAttribute('aria-pressed', String(list));
  };
  $('grid-view').addEventListener('click', () => setLayout(false));
  $('list-view').addEventListener('click', () => setLayout(true));

  /* ---------- Mobile filter sheet ---------- */
  const setSheet = (open) => {
    filters.classList.toggle('is-open', open);
    filtersToggle.setAttribute('aria-expanded', String(open));
  };
  filtersToggle.addEventListener('click', () => setSheet(true));
  $('filters-done').addEventListener('click', () => setSheet(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setSheet(false); });
  document.addEventListener('click', (e) => {
    if (filters.classList.contains('is-open') && !filters.contains(e.target) && !filtersToggle.contains(e.target)) setSheet(false);
  });

  /* ---------- Results ---------- */
  function filtered() {
    let list = products.filter((p) =>
      (state.category === 'All' || p.category === state.category) &&
      (!state.availability.length || state.availability.includes(p.stock)) &&
      (!state.brands.length || state.brands.includes(p.brand)) &&
      (!state.search || [p.title, p.category, p.brand, p.description].some((f) => f && f.toLowerCase().includes(state.search))));
    if (state.sort === 'name-asc') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (state.sort === 'name-desc') list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    return list;
  }

  function card(p, i) {
    const onRequest = p.stock && p.stock !== 'In Stock';
    const isSaved = saved.has(p.id);
    const href = `product.html?id=${encodeURIComponent(p.id)}`;
    return `
      <article class="item-card" style="--i:${i}">
        <div class="item-top">
          <span class="pill ${onRequest ? 'pill-accent' : 'pill-ok'}">${onRequest ? esc(p.stock) : 'In stock'}</span>
          <button type="button" class="fav-btn${isSaved ? ' is-saved' : ''}" data-fav="${esc(p.id)}" aria-pressed="${isSaved}" aria-label="Save ${esc(p.title)}">${icon('i-heart')}</button>
        </div>
        <a href="${href}" class="item-media" tabindex="-1" aria-hidden="true">
          <img src="${esc(p.mainImage || 'images/products/oxygen.webp')}" alt="" loading="lazy">
        </a>
        <div class="item-body">
          <h3><a href="${href}">${esc(p.title)}</a></h3>
          <p>${esc(p.description)}</p>
          <div class="item-foot">
            ${p.brand ? `<span class="pill">${esc(p.brand)}</span>` : '<span></span>'}
            <span class="item-link">View details${icon('i-arrow')}</span>
          </div>
        </div>
      </article>`;
  }

  let firstRender = true;
  function apply() {
    const list = filtered();
    resultCount.textContent = `${list.length} ${list.length === 1 ? 'product' : 'products'}`;
    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state">
          ${icon('i-search')}
          <h3>No equipment matches</h3>
          <p>Try a different search or clear the filters. Our team can also source equipment not listed here.</p>
          <button type="button" class="btn btn-dark btn-sm" data-reset>Reset filters</button>
        </div>`;
      return;
    }
    grid.innerHTML = list.map(card).join('');
    if (firstRender) {
      firstRender = false;
      window.siteMotion.reveal(grid);
    } else {
      grid.querySelectorAll('.item-card').forEach((el) => el.classList.add('is-entering'));
      window.siteMotion.refresh();
    }
  }

  grid.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) { $('reset-filters').click(); return; }
    const fav = e.target.closest('[data-fav]');
    if (!fav) return;
    const id = fav.dataset.fav;
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    fav.classList.toggle('is-saved', saved.has(id));
    fav.setAttribute('aria-pressed', String(saved.has(id)));
    try { localStorage.setItem('medico_favs', JSON.stringify([...saved])); } catch { /* private mode */ }
  });

  renderCategories();
  renderChecks('availability-list', 'availability', 'stock');
  renderChecks('brand-list', 'brand', 'brand');
  apply();
})();
