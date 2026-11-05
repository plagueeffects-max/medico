// Public API router (one Vercel function). Routes, via vercel.json:
//   GET  /api/posts[?id=]        GET /api/products[?id=]      POST /api/inquiry
//   GET  /api/google-reviews     GET /media/<id>.<ext>
//   GET  /sitemap.xml  /llms.txt  /robots.txt  /indexnow-key.txt
const { query, withTimeout } = require('./_lib/db');
const { getQuery, pathOf, readBody, send, ipHash } = require('./_lib/http');
const { postOut, productOut, getPublishedPostRows, getPostRow, getProductRows, getProductRow } = require('./_lib/content');
const { sitemapXml, robotsTxt, llmsTxt } = require('./_lib/seo');
const { str } = require('./_lib/text');
const googleReviews = require('./_lib/google-reviews');

const SHORT_CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' };

async function posts(req, res, q) {
  if (q.id) {
    const row = await getPostRow(q.id);
    return row ? send(res, 200, { success: true, post: postOut(row) }, SHORT_CACHE) : send(res, 404, { success: false, message: 'Article not found.' });
  }
  const rows = await getPublishedPostRows();
  return send(res, 200, { success: true, posts: rows.map(postOut) }, SHORT_CACHE);
}

async function products(req, res, q) {
  if (q.id) {
    const row = await getProductRow(q.id);
    return row ? send(res, 200, { success: true, product: productOut(row) }, SHORT_CACHE) : send(res, 404, { success: false, message: 'Product not found.' });
  }
  const rows = await getProductRows();
  return send(res, 200, { success: true, products: rows.map(productOut) }, SHORT_CACHE);
}

/** Pure validation, exported for the self-check below. Returns { error } or { data }. */
function validateInquiry(b) {
  const name = str(b.name, 200);
  const phone = str(b.phone, 40);
  const email = str(b.email, 200);
  const message = typeof b.message === 'string' ? b.message.trim() : '';
  if (name.length < 2 || name.length > 80) return { error: 'Please enter your name (2 to 80 characters).' };
  const digits = phone.replace(/[^\d]/g, '');
  if (!/^[+\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) return { error: 'Please enter a valid phone number.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'Please enter a valid email address, or leave it empty.' };
  if (message.length > 2000) return { error: 'Please keep the message under 2000 characters.' };
  return { data: { name, phone, email, organisation: str(b.organisation, 200), interest: str(b.interest, 200), message, page: str(b.page, 300) } };
}

async function inquiry(req, res) {
  if (req.method !== 'POST') return send(res, 405, { success: false, message: 'Method not allowed.' });
  const body = await readBody(req);
  // Honeypot: bots fill every field. Pretend it worked, store nothing.
  if (str(body.website)) return send(res, 200, { success: true });
  const { error, data } = validateInquiry(body);
  if (error) return send(res, 400, { success: false, message: error });
  const ip = ipHash(req);
  const [{ n }] = await query(`SELECT count(*)::int AS n FROM medico_inquiries WHERE ip_hash = $1 AND created_at > now() - interval '10 minutes'`, [ip]);
  if (n >= 5) return send(res, 429, { success: false, message: 'Too many requests. Please call or WhatsApp us instead.' });
  await query(
    `INSERT INTO medico_inquiries (name, phone, email, organisation, interest, message, page, ip_hash, user_agent)
     VALUES ($1,$2,NULLIF($3,''),NULLIF($4,''),NULLIF($5,''),NULLIF($6,''),NULLIF($7,''),$8,$9)`,
    [data.name, data.phone, data.email, data.organisation, data.interest, data.message, data.page, ip, str(req.headers['user-agent'], 300)]
  );
  return send(res, 200, { success: true });
}

async function media(req, res, q) {
  const id = String(q.file || pathOf(req).split('/').pop() || '').split('.')[0];
  if (!/^[a-f0-9]{8,40}$/.test(id)) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  const rows = await withTimeout(query(`SELECT mime, encode(data, 'base64') AS b64 FROM medico_media WHERE id = $1`, [id]), 5000);
  if (!rows[0]) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  return send(res, 200, Buffer.from(rows[0].b64, 'base64'), { 'Content-Type': rows[0].mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
}

const text = (type) => ({ 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' });

const ROUTES = {
  posts, products, inquiry, media,
  'google-reviews': (req, res) => googleReviews(req, res),
  sitemap: async (req, res) => send(res, 200, await sitemapXml(), text('application/xml')),
  llms: async (req, res) => send(res, 200, await llmsTxt(), text('text/plain')),
  robots: (req, res) => send(res, 200, robotsTxt(), text('text/plain')),
  'indexnow-key': (req, res) => (process.env.INDEXNOW_KEY ? send(res, 200, process.env.INDEXNOW_KEY, text('text/plain')) : send(res, 404, 'Not found', { 'Content-Type': 'text/plain' })),
};

/** Route name from ?r=, falling back to the path (/api/posts -> posts). */
const routeOf = (req, q) => q.r || pathOf(req).replace(/^\/api\//, '').split('/')[0];

module.exports = async (req, res) => {
  const q = getQuery(req);
  const fn = ROUTES[routeOf(req, q)];
  if (!fn) return send(res, 404, { success: false, message: 'Not found.' });
  try {
    return await fn(req, res, q);
  } catch (err) {
    console.error('[public api]', err.message);
    return send(res, err.status || 500, { success: false, message: err.status ? err.message : 'Something went wrong. Please try again.' });
  }
};
module.exports.validateInquiry = validateInquiry;

if (require.main === module) {
  const assert = require('assert');
  assert(validateInquiry({ name: 'A', phone: '9419008453' }).error);
  assert(validateInquiry({ name: 'Ali', phone: '12' }).error);
  assert(validateInquiry({ name: 'Ali', phone: '+91 94190 08453', email: 'bad' }).error);
  assert(validateInquiry({ name: 'Ali', phone: '+91 94190 08453', message: 'x'.repeat(2001) }).error);
  assert.strictEqual(validateInquiry({ name: 'Ali', phone: '(0194) 247-1234', email: 'a@b.in' }).data.name, 'Ali');
  console.log('inquiry validation ok');
}
