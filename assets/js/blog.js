// Medico insights: renders articles from BlogDB, topic filter, search, subscribe.
(() => {
  const TOPICS = [
    ['All', 'i-file-text'],
    ['Clinical Insights', 'i-stethoscope'],
    ['Product Updates', 'i-clipboard'],
    ['Healthcare Infrastructure', 'i-hospital'],
    ['Patient Care', 'i-heart-pulse'],
    ['Industry News', 'i-news'],
  ];
  const DEFAULT_TOPIC = 'Industry News';

  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg class="icon"><use href="assets/icons.svg#${id}"/></svg>`;
  const topicOf = (b) => b.category || DEFAULT_TOPIC;
  const readTime = (b) => Math.max(2, Math.round(String(b.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).length / 200));
  const fmtDate = (d) => {
    const date = new Date(`${d}T00:00:00`);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const url = (b) => `blog-post.html?id=${encodeURIComponent(b.id)}`;

  const blogs = BlogDB.getBlogs().slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const featured = blogs.find((b) => b.featured) || blogs[0];
  const rest = blogs.filter((b) => b !== featured);

  /* ---------- Featured ---------- */
  if (featured) {
    document.getElementById('featured').innerHTML = `
      <div class="featured-copy">
        <p class="eyebrow" data-reveal>Featured article</p>
        <h2 class="h3-display" data-split>${esc(featured.title)}</h2>
        <p class="featured-desc" data-reveal>${esc(featured.subheading)}</p>
        <a href="${url(featured)}" class="btn btn-dark" data-reveal>Read full article${icon('i-arrow')}</a>
      </div>
      <a href="${url(featured)}" class="featured-media" tabindex="-1" aria-hidden="true" data-clip>
        <img src="${esc(featured.image || 'images/medico-shop.webp')}" alt="" loading="lazy">
        <span class="featured-meta"><span class="pill pill-accent">${esc(topicOf(featured))}</span><span class="pill">${icon('i-clock')}${readTime(featured)} min read</span></span>
      </a>`;
    document.getElementById('featured-wrap').hidden = false;
  }

  /* ---------- Topics ---------- */
  const topicRow = document.getElementById('topic-row');
  const count = (t) => (t === 'All' ? blogs.length : blogs.filter((b) => topicOf(b) === t).length);
  topicRow.innerHTML = TOPICS.map(([t, ic], i) => `
    <button type="button" class="topic${i === 0 ? ' is-active' : ''}" data-topic="${esc(t)}" aria-pressed="${i === 0}">
      <span class="topic-icon">${icon(ic)}</span>
      <span class="topic-text"><span class="topic-name">${t === 'All' ? 'All articles' : esc(t)}</span><span class="topic-count">${count(t)}</span></span>
    </button>`).join('');

  /* ---------- Grid ---------- */
  const grid = document.getElementById('article-grid');
  const counter = document.getElementById('article-count');
  const card = (b, i, list) => `
    <article class="article-card${i === 0 && list.length > 3 && list.length % 3 === 1 ? ' is-wide' : ''}" style="--i:${i}">
      <a href="${url(b)}" class="article-media" tabindex="-1" aria-hidden="true">
        <img src="${esc(b.image || 'images/medico-shop.webp')}" alt="" loading="lazy">
      </a>
      <div class="article-body">
        <div class="article-meta"><span class="pill pill-accent">${esc(topicOf(b))}</span><span class="article-time">${icon('i-clock')}${readTime(b)} min read</span></div>
        <h3><a href="${url(b)}">${esc(b.title)}</a></h3>
        <p>${esc(b.subheading)}</p>
        <span class="article-link">Read more${icon('i-arrow')}</span>
      </div>
    </article>`;

  let topic = 'All';
  let query = '';
  let first = true;
  function render() {
    // While searching, include the featured article too
    const pool = query ? blogs : rest;
    const list = pool.filter((b) =>
      (topic === 'All' || topicOf(b) === topic) &&
      (!query || [b.title, b.subheading, topicOf(b)].some((f) => f && f.toLowerCase().includes(query))));
    counter.textContent = list.length;
    grid.innerHTML = list.length
      ? list.map(card).join('')
      : `<div class="empty-state">${icon('i-search')}<h3>No articles found</h3><p>Try another topic or search term.</p></div>`;
    if (first) { first = false; window.siteMotion.reveal(grid); }
    else { grid.querySelectorAll('.article-card').forEach((el) => el.classList.add('is-entering')); window.siteMotion.refresh(); }
  }

  topicRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.topic');
    if (!btn) return;
    topic = btn.dataset.topic;
    topicRow.querySelectorAll('.topic').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    render();
  });

  const searchInput = document.getElementById('blog-search-input');
  searchInput.addEventListener('input', () => { query = searchInput.value.trim().toLowerCase(); render(); });
  document.getElementById('blog-search').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('latest').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Subscribe (hands off to WhatsApp, no backend) ---------- */
  const form = document.getElementById('newsletter-form');
  const note = document.getElementById('newsletter-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email');
    if (!email.checkValidity() || !email.value.trim()) {
      form.classList.add('has-error');
      note.textContent = 'Please enter a valid email address.';
      email.focus();
      return;
    }
    form.classList.remove('has-error');
    note.textContent = 'Opening WhatsApp to confirm your subscription…';
    const msg = `Hello Medico, please add me to your insights updates. Email: ${email.value.trim()}`;
    const win = window.open(`https://wa.me/919419008453?text=${encodeURIComponent(msg)}`, '_blank');
    if (win) win.opener = null;
  });

  render();
})();
