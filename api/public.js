// Public API router (one Vercel function). Routes, via vercel.json:
//   GET  /api/posts[?id=]        GET /api/products[?id=]      POST /api/inquiry
//   GET  /api/google-reviews     GET /media/<id>.<ext>
//   GET  /og/post/<slug>.jpg     GET /og/product/<id>.jpg   (link-preview cards)
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

/**
 * Link-preview card for one article or product: its picture at 1200x630 with the Medico
 * frame (images/og/frame-*.png, made by tools/og-cards.js) laid on top, as a JPG, because
 * WhatsApp and others render WebP previews unreliably. Any failure falls back to the
 * section's static card, so a share never ends up without a picture.
 */
async function og(req, res, q) {
  const kind = q.kind === 'product' ? 'product' : 'post';
  const fallback = `/images/og/${kind === 'product' ? 'shop' : 'blog'}.jpg`;
  try {
    const row = kind === 'product' ? await withTimeout(getProductRow(q.id), 3000) : await withTimeout(getPostRow(q.id), 3000);
    if (!row) throw new Error('not found');
    const pic = kind === 'product' ? productOut(row).mainImage : postOut(row).image;
    // Fetch from this deployment, so previews and local runs use their own files
    const base = `${req.headers['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http')}://${req.headers.host}`;
    const get = async (u) => { const r = await fetch(/^https?:/.test(u) ? u : base + encodeURI(u), { signal: AbortSignal.timeout(5000) }); if (!r.ok) throw new Error(`${r.status} ${u}`); return Buffer.from(await r.arrayBuffer()); };
    const [photo, frame] = await Promise.all([get(pic), get(`/images/og/frame-${kind}.png`)]);
    const sharp = require('sharp');
    let img;
    if (kind === 'product') {
      // Product shots are cut-outs on white: show the whole device on a soft studio ground
      const { data, info } = await sharp(photo).resize(860, 400, { fit: 'inside' }).flatten({ background: '#ffffff' }).toBuffer({ resolveWithObject: true });
      img = sharp({ create: { width: 1200, height: 630, channels: 3, background: '#ffffff' } })
        .composite([{ input: data, left: Math.round((1200 - info.width) / 2), top: Math.round(110 + (400 - info.height) / 2) }]);
    } else {
      img = sharp(photo).resize(1200, 630, { fit: 'cover', position: 'attention' });
    }
    const flat = await img.flatten({ background: '#ffffff' }).png().toBuffer();
    const out = await sharp(flat).composite([{ input: frame }]).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    return send(res, 200, out, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800' });
  } catch (err) {
    console.error('[og]', err.message);
    res.setHeader('Location', fallback);
    return send(res, 302, '', { 'Cache-Control': 'public, s-maxage=300' });
  }
}

const text = (type) => ({ 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' });

const ROUTES = {
  posts, products, inquiry, media, og,
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
