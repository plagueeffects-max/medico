// Medico article page: renders one article from /blog/<slug> (or legacy ?id=).
// The server already renders the article into the page; this script adds the gallery,
// share button and related articles. Article HTML is sanitised server-side and again here.
(async () => {
  const $ = (id) => document.getElementById(id);
  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg class="icon"><use href="/assets/icons.svg#${id}"/></svg>`;
  const topicOf = (b) => b.category || 'Industry News';
  const readTime = (b) => parseInt(b.readTime, 10) || Math.max(2, Math.round(String(b.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).length / 200));
  const fmtDate = (d) => {
    const date = new Date(`${d}T00:00:00`);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const safeUrl = (u) => (/^(https?:|data:image\/|\/(?!\/))/i.test(String(u)) ? u : '');

  const fromPath = window.location.pathname.match(/^\/blog\/([^/]+)/);
  const id = fromPath ? decodeURIComponent(fromPath[1]) : new URLSearchParams(window.location.search).get('id');
  let ssr = null;
  try { ssr = JSON.parse(document.getElementById('ssr-post').textContent).post; } catch { /* not server-rendered */ }
  const blogs = await BlogDB.load();
  const blog = ssr || (id && blogs.find((b) => b.id === id || b.slug === id));
  if (!blog) {
    // Server-rendered content stays visible even if the client lookup misses
    if ($('post').hidden) $('post-missing').hidden = false;
    return;
  }

  document.title = `${blog.title} | Medico Insights`;
  $('crumb-title').textContent = blog.title;
  $('post-topic').textContent = topicOf(blog);
  $('post-title').textContent = blog.title;
  if (blog.subheading) $('post-sub').textContent = blog.subheading; else $('post-sub').remove();
  const author = blog.author || 'Medico Team';
  $('post-author').textContent = author;
  $('post-avatar').textContent = author.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase();
  $('post-date').textContent = [fmtDate(blog.date), `${readTime(blog)} min read`].filter(Boolean).join(' · ');

  // Cover image + optional gallery
  const images = [blog.image, ...(blog.galleryImages || [])].map(safeUrl).filter(Boolean);
  if (images.length) {
    const cover = $('post-cover-img');
    cover.src = images[0];
    cover.parentElement.classList.toggle('is-product', /\/products\//.test(images[0]));
    cover.alt = blog.title;
    $('post-cover').hidden = false;
    if (images.length > 1) {
      const count = $('post-cover-count');
      const thumbs = $('post-thumbs');
      count.hidden = false;
      thumbs.hidden = false;
      count.textContent = `1 / ${images.length}`;
      thumbs.innerHTML = images.map((src, i) => `<button type="button" data-i="${i}" aria-current="${i === 0}" aria-label="Show image ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('');
      thumbs.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const i = Number(btn.dataset.i);
        thumbs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b === btn)));
        cover.style.opacity = 0;
        setTimeout(() => { cover.src = images[i]; cover.style.opacity = 1; }, 200);
        count.textContent = `${i + 1} / ${images.length}`;
      });
    }
  }

  // DOMPurify loads from a CDN; without it, fall back to plain text rather than raw HTML
  // Photo credit for sourced cover images (new element: .post-cover-credit)
  if (blog.coverCredit && blog.coverCredit.text && !document.querySelector('.post-cover-credit')) {
    const credit = document.createElement('figcaption');
    credit.className = 'post-cover-credit';
    credit.innerHTML = /^https:\/\//.test(blog.coverCredit.url || '')
      ? `<a href="${esc(blog.coverCredit.url)}" target="_blank" rel="noopener nofollow">${esc(blog.coverCredit.text)}</a>`
      : esc(blog.coverCredit.text);
    $('post-cover').appendChild(credit);
  }

  // Server-rendered content is already in place; only fill it when rendering client-side
  const content = $('post-content');
  if (!ssr) {
    if (window.DOMPurify) content.innerHTML = window.DOMPurify.sanitize(blog.content || '');
    else content.textContent = String(blog.content || '').replace(/<[^>]*>/g, ' ');
  }
  $('post').hidden = false;

  // Share
  $('share-btn').addEventListener('click', async () => {
    const data = { title: blog.title, url: window.location.href };
    if (navigator.share) { try { await navigator.share(data); } catch { /* dismissed */ } return; }
    try {
      await navigator.clipboard.writeText(data.url);
      $('share-btn').lastChild.textContent = 'Link copied';
    } catch { window.prompt('Copy this link', data.url); }
  });

  // Related articles: same topic first, then newest
  const related = blogs
    .filter((b) => b.id !== blog.id && b.slug !== blog.slug)
    .sort((a, b) => (topicOf(b) === topicOf(blog)) - (topicOf(a) === topicOf(blog)) || String(b.date).localeCompare(String(a.date)))
    .slice(0, 3);
  if (related.length) {
    $('related-grid').innerHTML = related.map((b) => `
      <article class="article-card">
        <a href="${BlogDB.url(b)}" class="article-media${/\/products\//.test(b.image || '') ? ' is-product' : ''}" tabindex="-1" aria-hidden="true"><img src="${esc(safeUrl(b.image) || '/images/medico-shop.webp')}" alt="" loading="lazy"></a>
        <div class="article-body">
          <div class="article-meta"><span class="pill pill-accent">${esc(topicOf(b))}</span><span class="article-time">${icon('i-clock')}${readTime(b)} min read</span></div>
          <h3><a href="${BlogDB.url(b)}">${esc(b.title)}</a></h3>
          <p>${esc(b.subheading)}</p>
          <span class="article-link">Read more${icon('i-arrow')}</span>
        </div>
      </article>`).join('');
    $('related').hidden = false;
    window.siteMotion.reveal($('related-grid'));
  }
})();
