// Medico Insights: Renders articles from BlogDB (API with bundled fallback), topic filter, search, subscribe.
(async () => {
  const TOPICS = [
    'All',
    'Clinical Insights',
    'Product Guides',
    'Healthcare Infrastructure',
    'Patient Care',
    'Industry News',
  ];

  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg class="icon"><use href="/assets/icons.svg#${id}"/></svg>`;
  const topicOf = (b) => b.category || 'Industry News';
  const readTimeOf = (b) => b.readTime || `${Math.max(2, Math.round(String(b.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).length / 200))} min read`;
  const fmtDate = (d) => {
    if (!d) return '';
    const date = new Date(`${d}T00:00:00`);
    return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const url = (b) => BlogDB.url(b);

  const blogs = (await BlogDB.load()).slice();
  const featured = blogs.find((b) => b.featured) || blogs[0];
  const rest = blogs.filter((b) => b.id !== featured?.id);

  /* ---------- Featured Article Bento Card ---------- */
  if (featured) {
    document.getElementById('featured').innerHTML = `
      <div class="featured-copy">
        <div class="featured-tags-row">
          <span class="featured-badge-crimson"><span class="bullet">&bull;</span> FEATURED ARTICLE</span>
          <span class="featured-cat-pill">${esc(topicOf(featured))}</span>
        </div>
        <h2 class="featured-title"><a href="${url(featured)}">${esc(featured.title)}</a></h2>
        <p class="featured-desc">${esc(featured.subheading)}</p>
        <div class="featured-byline-row">
          <span>${esc(featured.author || 'Medico Team')}</span>
          <span class="sep">&middot;</span>
          <span>${fmtDate(featured.date)}</span>
          <span class="sep">&middot;</span>
          <span>${readTimeOf(featured)}</span>
        </div>
        <div class="featured-cta-row">
          <a href="${url(featured)}" class="btn btn-dark-pill">Read full article${icon('i-arrow')}</a>
        </div>
      </div>
      <a href="${url(featured)}" class="featured-media-stage" tabindex="-1" aria-hidden="true">
        <img src="${esc(featured.image || '/images/blog-featured-icu.webp')}" alt="${esc(featured.title)}" loading="lazy">
      </a>`;
    document.getElementById('featured-wrap').hidden = false;
  }

  /* ---------- Category Filter Pills ---------- */
  const topicRow = document.getElementById('topic-row');
  const countOf = (t) => (t === 'All' ? blogs.length : blogs.filter((b) => topicOf(b) === t).length);

  topicRow.innerHTML = TOPICS.map((t, i) => `
    <button type="button" class="topic-pill${i === 0 ? ' is-active' : ''}" data-topic="${esc(t)}" aria-pressed="${i === 0}">
      ${t === 'All' ? `All articles (${countOf('All')})` : `${esc(t)} (${countOf(t)})`}
    </button>`).join('');

  /* ---------- Articles Grid ---------- */
  const grid = document.getElementById('article-grid');
  const counter = document.getElementById('article-count');

  const card = (b, i) => `
    <article class="blog-card" style="--i:${i}">
      <a href="${url(b)}" class="blog-card-media${/\/products\//.test(b.image || '') ? ' is-product' : ''}" tabindex="-1" aria-hidden="true">
        <img src="${esc(b.image || '/images/blog-featured-icu.webp')}" alt="${esc(b.title)}" loading="lazy">
      </a>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span class="blog-cat-tag">${esc(topicOf(b))}</span>
          <span class="blog-card-time">${icon('i-clock')}${readTimeOf(b)}</span>
        </div>
        <h3 class="blog-card-title"><a href="${url(b)}">${esc(b.title)}</a></h3>
        <p class="blog-card-desc">${esc(b.subheading)}</p>
        <a href="${url(b)}" class="blog-card-link">Read more${icon('i-arrow')}</a>
      </div>
    </article>`;

  let currentTopic = 'All';
  let query = '';
  let first = true;

  function render() {
    // When searching or viewing 'All', show from the curated list
    const pool = query ? blogs : (currentTopic === 'All' ? rest : blogs);
    const list = pool.filter((b) =>
      (currentTopic === 'All' || topicOf(b) === currentTopic) &&
      (!query || [b.title, b.subheading, topicOf(b)].some((f) => f && f.toLowerCase().includes(query))));

    counter.textContent = currentTopic === 'All' && !query ? blogs.length : list.length;

    grid.innerHTML = list.length
      ? list.map(card).join('')
      : `<div class="empty-state">${icon('i-search')}<h3>No articles found</h3><p>Try selecting another topic or searching with different keywords.</p></div>`;

    if (first) {
      first = false;
      if (window.siteMotion && window.siteMotion.reveal) window.siteMotion.reveal(grid);
    } else {
      grid.querySelectorAll('.blog-card').forEach((el) => el.classList.add('is-entering'));
      if (window.siteMotion && window.siteMotion.refresh) window.siteMotion.refresh();
    }
  }

  topicRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.topic-pill');
    if (!btn) return;
    currentTopic = btn.dataset.topic;
    topicRow.querySelectorAll('.topic-pill').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    render();
  });

  const searchInput = document.getElementById('blog-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      query = searchInput.value.trim().toLowerCase();
      render();
    });
  }

  const searchForm = document.getElementById('blog-search');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------- Subscribe Form ---------- */
  const form = document.getElementById('newsletter-form');
  const note = document.getElementById('newsletter-note');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletter-email');
      if (!email.checkValidity() || !email.value.trim()) {
        form.classList.add('has-error');
        if (note) note.textContent = 'Please enter a valid email address.';
        email.focus();
        return;
      }
      form.classList.remove('has-error');
      if (note) note.textContent = 'Opening WhatsApp to confirm your subscription…';
      const msg = `Hello Medico, please add me to your insights updates. Email: ${email.value.trim()}`;
      const win = window.open(`https://wa.me/919419008453?text=${encodeURIComponent(msg)}`, '_blank');
      if (win) win.opener = null;
    });
  }

  render();
})();
