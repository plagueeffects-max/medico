// sitemap.xml, llms.txt, robots.txt and JSON-LD, built from the database and admin settings.
const { query, withTimeout } = require('./db');
const { getSettingsSafe } = require('./settings');
const { postOut, productOut, isIndexable, getPublishedPostRows, getProductRows, istDate } = require('./content');
const { siteUrl } = require('./http');
const { plainText } = require('./text');

// Move this when the static page templates really change
const STATIC_LASTMOD = '2026-11-05';
const STATIC_PAGES = [
  ['/', 'weekly', '1.0'],
  ['/shop.html', 'weekly', '0.9'],
  ['/about.html', 'monthly', '0.8'],
  ['/blog.html', 'weekly', '0.8'],
  ['/privacy-policy.html', 'yearly', '0.3'],
  ['/terms.html', 'yearly', '0.3'],
];

const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => (/^https?:/.test(p) ? p : `${siteUrl()}${encodeURI(p)}`);
const later = (a, b) => (a > b ? a : b);
/** JSON for <script type="application/ld+json">: "<" escaped so it can never close the tag. */
const ldJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

const safe = (p, fallback) => p.catch(() => fallback);

async function sitemapXml() {
  const [posts, products, copy] = await Promise.all([
    safe(getPublishedPostRows(), []),
    safe(getProductRows(), []),
    safe(withTimeout(query('SELECT max(updated_at) AS at FROM medico_site_copy')), [{}]),
  ]);
  const indexable = posts.filter(isIndexable);
  const copyDay = copy[0]?.at ? istDate(copy[0].at) : '';
  const staticDay = later(STATIC_LASTMOD, copyDay);
  const newestPost = indexable.reduce((m, p) => later(m, istDate(p.updated_at || p.published_at)), staticDay);
  const url = (loc, lastmod, freq, pri, image) =>
    `  <url><loc>${xmlEsc(abs(loc))}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority>${image ? `<image:image><image:loc>${xmlEsc(abs(image))}</image:loc></image:image>` : ''}</url>`;
  const lines = [
    ...STATIC_PAGES.map(([p, f, pr]) => url(p, p === '/blog.html' ? newestPost : staticDay, f, pr)),
    ...indexable.map((r) => { const p = postOut(r); return url(`/blog/${p.slug}`, istDate(r.updated_at || r.published_at), 'monthly', '0.7', p.image); }),
    ...products.map((r) => { const p = productOut(r); return url(`/product/${encodeURIComponent(p.id)}`, istDate(r.updated_at || r.created_at), 'monthly', '0.6', p.mainImage); }),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${lines.join('\n')}\n</urlset>\n`;
}

const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'anthropic-ai', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'cohere-ai', 'Amazonbot', 'CCBot', 'DuckAssistBot'];

function robotsTxt() {
  // A crawler obeys only the most specific group naming it, so each group repeats the disallow list
  const group = (ua) => `User-agent: ${ua}\nAllow: /\nDisallow: /admin\nDisallow: /admin-\nDisallow: /api/\n`;
  return `${[group('*'), ...AI_BOTS.map(group)].join('\n')}\nSitemap: ${siteUrl()}/sitemap.xml\n`;
}

async function llmsTxt() {
  const [s, posts, products] = await Promise.all([getSettingsSafe(), safe(getPublishedPostRows(), []), safe(getProductRows(), [])]);
  const base = siteUrl();
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const address = [s.address_street, s.address_city, `${s.address_region} ${s.address_postcode}`].filter(Boolean).join(', ');
  return [
    `# ${s.business_name}`,
    '',
    `> ${s.business_name} is a ${s.address_city}-based supplier and authorised service centre for clinical-grade medical equipment, serving hospitals, clinics and families across ${s.address_region} since ${s.founded}. Authorised for ${s.brands}.`,
    '',
    '## Core pages',
    '',
    `- [Home](${base}/): company overview, product categories, testimonials, contact`,
    `- [Products](${base}/shop.html): equipment catalogue${cats.length ? ` (${cats.join(', ')})` : ''}`,
    `- [About](${base}/about.html): history, founder, brand partnerships, address`,
    `- [Insights](${base}/blog.html): equipment guidance and healthcare updates for Jammu & Kashmir`,
    '',
    '## Key facts',
    '',
    `- Full name: ${s.business_name}`,
    `- Founded: ${s.founded}`,
    `- Founder: ${s.founder}`,
    `- Address: ${address}`,
    `- Phone: ${s.phone}`,
    `- WhatsApp: +${s.whatsapp}`,
    `- Email: ${s.email}`,
    `- Hours: ${s.hours}`,
    `- GSTIN: ${s.gstin}`,
    `- Service area: ${s.address_region}, India`,
    `- Healthcare partners: ${s.partners_count}`,
    `- Brands: ${s.brands}`,
    ...(s.same_as.length ? [`- Profiles: ${s.same_as.join(', ')}`] : []),
    '',
    '## Services',
    '',
    ...s.services.split(';').map((x) => `- ${x.trim()}`).filter((x) => x.length > 2),
    '',
    '## Products',
    '',
    ...products.map((r) => `- [${r.title}](${base}/product/${encodeURIComponent(r.id)}): ${plainText(r.description)}`),
    '',
    '## Articles',
    '',
    ...posts.filter(isIndexable).map((r) => { const p = postOut(r); return `- [${p.title}](${base}/blog/${p.slug}): ${plainText(p.subheading)}`; }),
    '',
    '## Policies',
    '',
    `- [Privacy Policy](${base}/privacy-policy.html)`,
    `- [Terms of Service](${base}/terms.html)`,
    '',
  ].join('\n');
}

/** Organization reference shared by article and product JSON-LD. */
function orgLd(s) {
  const base = siteUrl();
  return {
    '@type': ['LocalBusiness', 'MedicalOrganization'],
    '@id': `${base}/#organization`,
    name: s.business_name,
    url: `${base}/`,
    telephone: s.phone.replace(/\s+/g, ''),
    email: s.email,
    foundingDate: s.founded,
    taxID: s.gstin,
    logo: `${base}/favicon/web-app-manifest-512x512.png`,
    address: { '@type': 'PostalAddress', streetAddress: s.address_street, addressLocality: s.address_city, addressRegion: s.address_region, postalCode: s.address_postcode, addressCountry: 'IN' },
    ...(s.same_as.length ? { sameAs: s.same_as } : {}),
  };
}

module.exports = { sitemapXml, robotsTxt, llmsTxt, ldJson, orgLd, abs };
