// Server-side page renderer (one Vercel function for every public HTML page).
//  - Applies admin site-copy overrides to [data-copy] elements, so crawlers see edits.
//  - /blog/:slug and /product/:id: fills the article/product into the template with full
//    head metadata and JSON-LD, so content is visible without JavaScript.
// If the database fails, the page is served exactly as the file.
const { query, hasDb, withTimeout } = require('./_lib/db');
const { getQuery, send, siteUrl } = require('./_lib/http');
const { Editor, PAGES, readTemplate, applyCopy } = require('./_lib/html-edit');
const { postOut, productOut, isIndexable, getPostRow, getProductRow, getPublishedPostRows, getProductRows } = require('./_lib/content');
const { getSettingsSafe } = require('./_lib/settings');
const { ldJson, orgLd, abs } = require('./_lib/seo');
const { escHtml, plainText } = require('./_lib/text');

const CACHE = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' };

async function copyOverrides() {
  if (!hasDb()) return new Map();
  try {
    const rows = await withTimeout(query('SELECT key, value FROM medico_site_copy'), 2000);
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch (err) {
    console.error('[render] site copy unavailable:', err.message);
    return new Map();
  }
}

/** Replace the standard SEO tags in <head> (never duplicate them), then add the rest. */
function setHead(ed, { title, description, canonical, image, card, imageAlt, type, robots, extra = '' }) {
  // Link previews use the branded 1200x630 JPG card; structured data keeps the real photo
  const share = card || image;
  const alt = imageAlt || title;
  const t = ed.$('head title');
  if (t) ed.inner(t, escHtml(title));
  const metas = {
    'meta[name="description"]': `<meta name="description" content="${escHtml(description)}">`,
    'link[rel="canonical"]': `<link rel="canonical" href="${escHtml(canonical)}">`,
    'meta[property="og:title"]': `<meta property="og:title" content="${escHtml(title)}">`,
    'meta[property="og:description"]': `<meta property="og:description" content="${escHtml(description)}">`,
    'meta[property="og:type"]': `<meta property="og:type" content="${type}">`,
    'meta[property="og:url"]': `<meta property="og:url" content="${escHtml(canonical)}">`,
    'meta[property="og:image"]': `<meta property="og:image" content="${escHtml(share)}">`,
    'meta[property="og:image:type"]': card ? '<meta property="og:image:type" content="image/jpeg">' : '',
    'meta[property="og:image:width"]': card ? '<meta property="og:image:width" content="1200">' : '',
    'meta[property="og:image:height"]': card ? '<meta property="og:image:height" content="630">' : '',
    'meta[property="og:image:alt"]': `<meta property="og:image:alt" content="${escHtml(alt)}">`,
    'meta[name="twitter:card"]': '<meta name="twitter:card" content="summary_large_image">',
    'meta[name="twitter:title"]': `<meta name="twitter:title" content="${escHtml(title)}">`,
    'meta[name="twitter:description"]': `<meta name="twitter:description" content="${escHtml(description)}">`,
    'meta[name="twitter:image"]': `<meta name="twitter:image" content="${escHtml(share)}">`,
    'meta[name="twitter:image:alt"]': `<meta name="twitter:image:alt" content="${escHtml(alt)}">`,
    'meta[name="robots"]': robots ? `<meta name="robots" content="${robots}">` : '',
  };
  let missing = '';
  for (const [sel, tag] of Object.entries(metas)) {
    const el = ed.$(`head ${sel}`);
    if (el) ed.outer(el, tag); else missing += tag ? `\n  ${tag}` : '';
  }
  ed.appendTo('head', `${missing}${extra}\n`);
}

/** Branded share card URL; the version changes whenever the title or picture does. */
const cardUrl = (kind, id, ...parts) => `${siteUrl()}/og/${kind}/${encodeURIComponent(id)}.jpg?v=${require('crypto').createHash('md5').update([CARD_DESIGN, ...parts].join('|')).digest('hex').slice(0, 8)}`;
// Bump CARD_DESIGN whenever tools/og-cards.js changes the frames, so caches fetch the new look
const CARD_DESIGN = '2';

const insightCard = (p) => `<a href="/blog/${encodeURIComponent(p.slug)}" class="insight">
            <div class="insight-media" data-media>
              <img src="${escHtml(p.image)}" alt="${escHtml(p.title)}" width="900" height="676" loading="lazy">
              ${fmtShort(p.date) ? `<time datetime="${escHtml(p.date)}">${fmtShort(p.date)}</time>` : ''}
            </div>
            <div class="insight-body">
              <span class="insight-tag">${escHtml(p.category || 'Article')}</span>
              <h3>${escHtml(p.title)}</h3>
              <p>${escHtml(p.subheading || '')}</p>
              <span class="read-link">Read article<svg class="icon"><use href="/assets/icons.svg#i-arrow"/></svg></span>
            </div>
          </a>`;
const fmtShort = (d) => { const x = new Date(`${d}T00:00:00`); return isNaN(x) ? '' : x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };

const ld = (obj) => `\n  <script type="application/ld+json">${ldJson({ '@context': 'https://schema.org', ...obj })}</script>`;
const breadcrumb = (items) => ld({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(url) })),
});
const fmtDate = (d) => { const x = new Date(`${d}T00:00:00`); return isNaN(x) ? '' : x.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); };
/** Data for the client script, so it renders without a second request. */
const inlineData = (id, data) => `<script type="application/json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n`;

async function renderPost(ed, slug, res) {
  const row = await withTimeout(getPostRow(slug), 2500).catch(() => undefined);
  if (row === undefined) return null; // database down: serve the template, post.js uses its fallback
  if (!row) {
    ed.attrs(ed.$('#post-missing'), { hidden: null });
    setHead(ed, { title: 'Article not found | Medico blog', description: 'This article may have been moved or removed.', canonical: `${siteUrl()}/blog.html`, image: abs('/images/og/blog.jpg'), type: 'website', robots: 'noindex, follow' });
    return 404;
  }
  if (row.slug !== slug) { res.setHeader('Location', `/blog/${encodeURIComponent(row.slug)}`); return 301; }
  const [s, all] = await Promise.all([getSettingsSafe(), getPublishedPostRows().catch(() => [])]);
  fillPost(ed, row, all, s);
  return 200;
}

/** Fill the article template from a post row (also used by the admin live preview). */
function fillPost(ed, row, all, s) {
  const p = postOut(row);
  const url = `${siteUrl()}/blog/${p.slug}`;
  const image = abs(p.image);
  const author = p.author || 'Medico Team';
  const indexable = isIndexable(row);

  setHead(ed, {
    title: `${p.metaTitle} | Medico blog`,
    description: p.metaDescription || plainText(p.subheading),
    canonical: url, image, type: 'article',
    card: cardUrl('post', p.slug, p.title, p.image, row.updated_at || ''), imageAlt: p.title,
    // Unreviewed AI articles: readable, links followed, kept out of search results
    robots: indexable ? '' : 'noindex, follow',
    extra: `\n  <meta property="article:published_time" content="${new Date(row.published_at || row.created_at).toISOString()}">`
      + `\n  <meta property="article:modified_time" content="${new Date(row.updated_at || row.created_at).toISOString()}">`
      + ld({
        '@type': 'BlogPosting',
        headline: p.title, description: p.metaDescription || p.subheading, image: [image], url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        datePublished: new Date(row.published_at || row.created_at).toISOString(),
        dateModified: new Date(row.updated_at || row.created_at).toISOString(),
        articleSection: p.category, inLanguage: 'en-IN',
        wordCount: plainText(p.content).split(/\s+/).length,
        author: /team/i.test(author) ? { '@type': 'Organization', name: s.business_name, url: `${siteUrl()}/` } : { '@type': 'Person', name: author },
        publisher: orgLd(s),
      })
      + breadcrumb([['Home', '/'], ['Blog', '/blog.html'], [p.title, `/blog/${p.slug}`]])
      + (Array.isArray(row.faq) && row.faq.length ? ld({
        '@type': 'FAQPage',
        mainEntity: row.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) : ''),
  });

  ed.attrs(ed.$('#post'), { hidden: null });
  ed.inner(ed.$('#crumb-title'), escHtml(p.title));
  ed.inner(ed.$('#post-topic'), escHtml(p.category));
  ed.inner(ed.$('#post-title'), escHtml(p.title));
  if (p.subheading) ed.inner(ed.$('#post-sub'), escHtml(p.subheading));
  ed.inner(ed.$('#post-author'), escHtml(author));
  ed.inner(ed.$('#post-avatar'), escHtml(author.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()));
  ed.inner(ed.$('#post-date'), escHtml([fmtDate(p.date), p.readTime].filter(Boolean).join(' · ')));
  ed.attrs(ed.$('#post-cover'), { hidden: null });
  ed.attrs(ed.$('#post-cover-img'), { src: p.image, alt: p.title });
  ed.inner(ed.$('#post-content'), p.content);
  ed.appendTo('body', inlineData('ssr-post', { post: p, posts: all.map(postOut).map(({ content, ...rest }) => rest) }));
}

async function renderProduct(ed, id) {
  const row = await withTimeout(getProductRow(id), 2500).catch(() => undefined);
  if (row === undefined) return null;
  if (!row) {
    ed.attrs(ed.$('#pd-missing'), { hidden: null });
    setHead(ed, { title: 'Product not found | Medico Scientific Service Centre', description: 'This product may have been moved or removed.', canonical: `${siteUrl()}/shop.html`, image: abs('/images/og/shop.jpg'), type: 'website', robots: 'noindex, follow' });
    return 404;
  }
  const p = productOut(row);
  const s = await getSettingsSafe();
  const url = `${siteUrl()}/product/${encodeURIComponent(p.id)}`;
  const image = abs(p.mainImage);
  setHead(ed, {
    title: `${p.title} | ${s.business_name}`,
    description: plainText(p.description).slice(0, 160) || `${p.title} from ${s.business_name}, ${s.address_city}.`,
    canonical: url, image, type: 'product',
    card: cardUrl('product', p.id, p.title, p.mainImage), imageAlt: p.title,
    // No offers/ratings: prices are quoted on request, and we never invent ratings
    extra: ld({
      '@type': 'Product', name: p.title, description: plainText(p.description), image: [image], url,
      category: p.category, ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}), ...(p.sku ? { sku: p.sku } : {}),
    }) + breadcrumb([['Home', '/'], ['Products', '/shop.html'], [p.category, `/shop.html?category=${encodeURIComponent(p.category)}`], [p.title, `/product/${encodeURIComponent(p.id)}`]]),
  });
  ed.attrs(ed.$('#product'), { hidden: null });
  ed.inner(ed.$('#crumb-title'), escHtml(p.title));
  ed.inner(ed.$('#crumb-cat'), escHtml(p.category));
  ed.attrs(ed.$('#crumb-cat'), { href: `/shop.html?category=${encodeURIComponent(p.category)}` });
  ed.inner(ed.$('#pd-category'), escHtml(p.category));
  ed.inner(ed.$('#pd-title'), escHtml(p.title));
  ed.inner(ed.$('#pd-desc'), escHtml(p.description));
  ed.attrs(ed.$('#pd-image'), { src: p.mainImage, alt: p.title });
  if (p.features.length) {
    ed.attrs(ed.$('#pd-features'), { hidden: null });
    ed.inner(ed.$('#pd-features'), p.features.map((f) => `<li><svg class="icon"><use href="/assets/icons.svg#i-check"/></svg>${escHtml(f)}</li>`).join(''));
  }
  if (p.longDescription) ed.inner(ed.$('#panel-desc'), p.longDescription);
  ed.appendTo('body', inlineData('ssr-product', { product: p }));
  return 200;
}

module.exports = async (req, res) => {
  const q = getQuery(req);
  let page = q.page || 'index';

  // Old query-string article/product URLs move to the clean ones
  if (page === 'post' && !q.slug && q.id) return send(res, 301, '', { Location: `/blog/${encodeURIComponent(q.id)}` });
  if (page === 'product' && !q.slug && q.id) return send(res, 301, '', { Location: `/product/${encodeURIComponent(q.id)}` });
  if (!PAGES[page]) page = 'index';

  let html;
  try { html = readTemplate(PAGES[page].file); } catch (err) {
    console.error('[render] template missing:', err.message);
    return send(res, 500, 'Page unavailable', { 'Content-Type': 'text/plain' });
  }

  try {
    const ed = new Editor(html);
    let status = 200;
    if (page === 'post' && q.slug) status = (await renderPost(ed, q.slug, res)) || 200;
    if (page === 'product' && q.slug) status = (await renderProduct(ed, q.slug)) || 200;
    if (status === 301) return send(res, 301, '', { 'Cache-Control': CACHE['Cache-Control'] });
    // Listing data inline: robots.txt blocks /api/ for crawlers, so the listings must not depend on a fetch
    if (page === 'blog') {
      const rows = await getPublishedPostRows().catch(() => null);
      if (rows && rows.length) ed.appendTo('body', inlineData('ssr-posts', { posts: rows.map(postOut).map(({ content, ...rest }) => rest) }));
    }
    // Home "From the blog": the two newest articles, so the cards arrive finished with live links
    if (page === 'index') {
      const rows = await withTimeout(getPublishedPostRows(), 2500).catch(() => null);
      const latest = (rows || []).map(postOut).sort((x, y) => String(y.date).localeCompare(String(x.date))).slice(0, 2);
      const cards = [...ed.$$('a.insight')].filter((el) => !el.classList.contains('insight-more'));
      if (latest.length === 2) latest.forEach((p, i) => cards[i] && ed.outer(cards[i], insightCard(p)));
    }
    if (page === 'shop' || (page === 'product' && q.slug)) {
      const rows = await withTimeout(getProductRows(), 2500).catch(() => null);
      if (rows && rows.length) ed.appendTo('body', inlineData('ssr-products', { products: rows.map(productOut) }));
    }
    applyCopy(ed, await copyOverrides());
    const headers = status === 404 ? { ...CACHE, 'Cache-Control': 'public, s-maxage=60' } : CACHE;
    const s = await getSettingsSafe();
    return send(res, status, withDomain(finalize(ed.edits.length ? ed.toString() : html, page, s)), headers);
  } catch (err) {
    console.error('[render]', err);
    return send(res, 200, withDomain(html), CACHE);
  }
};

// Contact links and the homepage schema follow Admin > Settings and Admin > Site text,
// so an edited phone number or FAQ never leaves a stale link or stale structured data behind.
const BUILT_IN = { tel: 'tel:+919419008453', wa: 'wa.me/919419008453', mail: 'mailto:medicosgr@gmail.com' };
function finalize(out, page, s) {
  const tel = `tel:+${String(s.phone).replace(/\D/g, '')}`;
  const wa = `wa.me/${String(s.whatsapp).replace(/\D/g, '')}`;
  const mail = `mailto:${s.email}`;
  if (tel !== BUILT_IN.tel) out = out.split(BUILT_IN.tel).join(tel);
  if (wa !== BUILT_IN.wa) out = out.split(BUILT_IN.wa).join(wa);
  if (mail !== BUILT_IN.mail) out = out.split(BUILT_IN.mail).join(mail);
  // Business facts written into the page (legal pages, footer) follow Admin > Settings too
  const fact = { business_name: s.business_name, phone: s.phone, email: s.email, gstin: s.gstin,
    address: [s.address_street, s.address_city, [s.address_region, s.address_postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ') };
  out = out.replace(/(<span data-setting="(\w+)">)[^<]*(<\/span>)/g, (m, open, key, close) => (fact[key] ? open + escHtml(fact[key]) + close : m));
  if (page !== 'index') return out;

  const scripts = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  return out.replace(scripts, (whole, body) => {
    let data;
    try { data = JSON.parse(body); } catch { return whole; }
    const types = [].concat(data['@type']);
    if (types.includes('LocalBusiness')) {
      const org = orgLd(s);
      const merged = {
        '@context': 'https://schema.org', ...data, ...org,
        image: data.image,
        founder: { ...(data.founder || {}), '@type': 'Person', name: s.founder },
        openingHoursSpecification: { ...(data.openingHoursSpecification || {}), opens: s.opens, closes: s.closes },
        contactPoint: { ...(data.contactPoint || {}), telephone: org.telephone },
      };
      return `<script type="application/ld+json">\n${ldJson(merged)}\n  </script>`;
    }
    if (types.includes('FAQPage')) {
      // Read the questions back out of the rendered page, overrides included
      const pairs = [];
      for (let i = 1; i <= 30; i++) {
        const q = out.match(new RegExp(`data-copy="home\\.faq\\.${i}\\.q">([\\s\\S]*?)</span>`));
        const a = out.match(new RegExp(`data-copy="home\\.faq\\.${i}\\.a">([\\s\\S]*?)</p>`));
        if (!q || !a) break;
        pairs.push([plainText(q[1]), plainText(a[1])]);
      }
      if (!pairs.length) return whole;
      const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: pairs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) };
      return `<script type="application/ld+json">\n${ldJson(faq)}\n  </script>`;
    }
    return whole;
  });
}

// The static pages carry the preview domain in canonicals, OG tags and JSON-LD;
// swap it for SITE_URL so a custom domain needs no HTML edits.
const PREVIEW_ORIGIN = 'https://medico-inky.vercel.app';
function withDomain(out) {
  const base = siteUrl();
  return base && base !== PREVIEW_ORIGIN ? out.split(PREVIEW_ORIGIN).join(base) : out;
}

/** Admin live preview: the article template filled with an unsaved post row. */
async function previewPost(row) {
  const ed = new Editor(readTemplate(PAGES.post.file));
  const [s, all] = await Promise.all([getSettingsSafe(), getPublishedPostRows().catch(() => [])]);
  fillPost(ed, { ...row, ai_generated: true, reviewed_at: null }, all, s);
  applyCopy(ed, await copyOverrides());
  
  // Inject live preview viewport helper styles to prevent header bleed in iPhone chassis
  const previewStyles = `
    <style id="medico-live-preview-viewport-styles">
      @media (max-width: 640px) {
        .site-header {
          padding-top: 32px !important;
          background: rgba(255, 255, 255, 0.94) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06) !important;
        }
      }
      /* Hardware clipping & ultra-slim scrollbar to stay inside device mockup */
      html {
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
      }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 99px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.35); }
    </style>
  `;
  const rendered = ed.toString();
  return rendered.replace('</head>', `${previewStyles}\n</head>`);
}
module.exports.previewPost = previewPost;
