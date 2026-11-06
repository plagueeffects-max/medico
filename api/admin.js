// Admin API router (one Vercel function). /api/admin/<route> (or ?r=<route>).
// Everything except login requires the signed session cookie. The admin has full control:
// the API warns (in its responses) but does not block publishing drafts with open writer markers.
const crypto = require('crypto');
const { query, hasDb } = require('./_lib/db');
const { getQuery, pathOf, readBody, send, siteUrl } = require('./_lib/http');
const auth = require('./_lib/auth');
const { getSettings, saveSettings, SETTINGS_DEFAULTS } = require('./_lib/settings');
const { sanitizeArticle, sanitizeInline, countMarkers } = require('./_lib/sanitize');
const { str, strList, slugify } = require('./_lib/text');
const { PAGES, copyFields } = require('./_lib/html-edit');
const { pingIndexNow, postPaths } = require('./_lib/indexnow');
const { configured: aiConfigured } = require('./_lib/ai/groq');
const { typeCatalogue, typeById } = require('./_lib/ai/blog-types');
const { inferDetails, makeOutline, writeDraft, analyse, withDisclaimer, CATEGORIES } = require('./_lib/ai/writer');
const { saveDraft, startRun, endRun, recentTitles, uniqueSlug, runAuto, BUDGET_MS } = require('./_lib/ai/pipeline');
const { freshNews } = require('./_lib/ai/news');
const { searchCovers, saveCover } = require('./_lib/ai/images');

const ok = (res, data, extra = {}) => send(res, 200, { ok: true, data, ...extra });
const fail = (res, error, status = 400) => send(res, status, { ok: false, error });
const bool = (v, d = false) => (typeof v === 'boolean' ? v : d);
const num = (v) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));
const when = (v) => { const s = str(v, 40); return s && !isNaN(Date.parse(s)) ? new Date(s).toISOString() : null; };

/* ---------------- auth ---------------- */
async function login(req, res) {
  if (req.method !== 'POST') return fail(res, 'Method not allowed.', 405);
  if (!auth.secret() || !process.env.ADMIN_EMAIL) return fail(res, 'Sign-in is not set up. Add ADMIN_EMAIL and ADMIN_PASSWORD (and ADMIN_SESSION_SECRET) in Vercel.', 503);
  if (hasDb() && await auth.tooManyFails(req)) return fail(res, 'Too many attempts. Please wait 15 minutes and try again.', 429);
  const body = await readBody(req);
  if (!auth.checkCredentials(body.email, body.password)) {
    if (hasDb()) await auth.recordFail(req).catch(() => {});
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return fail(res, 'That email or password is not right.', 401);
  }
  if (hasDb()) await auth.clearFails(req).catch(() => {});
  res.setHeader('Set-Cookie', auth.cookieHeader(auth.createToken(process.env.ADMIN_EMAIL), auth.MAX_AGE));
  return ok(res, { email: process.env.ADMIN_EMAIL });
}
const logout = (req, res) => { res.setHeader('Set-Cookie', auth.cookieHeader('', 0)); return ok(res); };
const me = (req, res, q, user) => ok(res, { email: user.sub, ai: aiConfigured() });

/* ---------------- overview ---------------- */
async function overview(req, res) {
  const [c] = await query(`SELECT
      (SELECT count(*)::int FROM medico_inquiries WHERE created_at > now() - interval '7 days') AS inquiries_week,
      (SELECT count(*)::int FROM medico_inquiries WHERE status = 'new') AS inquiries_new,
      (SELECT count(*)::int FROM medico_blog_posts WHERE status = 'published') AS posts_live,
      (SELECT count(*)::int FROM medico_blog_posts WHERE status = 'published' AND published_at > now() - interval '30 days') AS posts_month,
      (SELECT count(*)::int FROM medico_blog_posts WHERE status = 'draft') AS posts_draft,
      (SELECT count(*)::int FROM medico_blog_posts WHERE ai_generated AND reviewed_at IS NULL) AS posts_unreviewed,
      (SELECT count(*)::int FROM medico_blog_posts WHERE status = 'draft' OR (ai_generated AND reviewed_at IS NULL)) AS posts_waiting,
      (SELECT count(*)::int FROM medico_products WHERE is_visible) AS products_live,
      (SELECT count(*)::int FROM medico_products) AS products_total,
      (SELECT count(*)::int FROM medico_blog_topics WHERE is_active) AS topics,
      (SELECT count(*)::int FROM medico_media) AS pictures,
      (SELECT COALESCE(sum(bytes), 0)::bigint FROM medico_media) AS picture_bytes,
      (SELECT count(*)::int FROM medico_site_copy) AS copy_overrides`);
  const lastRun = (await query(`SELECT r.*, p.slug, p.title FROM medico_blog_runs r LEFT JOIN medico_blog_posts p ON p.id = r.post_id ORDER BY r.created_at DESC LIMIT 1`))[0] || null;
  const review = await query(`SELECT id, title, status, created_at, ai_generated FROM medico_blog_posts WHERE status = 'draft' OR (ai_generated AND reviewed_at IS NULL) ORDER BY created_at DESC LIMIT 6`);
  const inquiries = await query(`SELECT id, name, phone, interest, status, created_at FROM medico_inquiries ORDER BY created_at DESC LIMIT 5`);
  const daily = await query(`SELECT to_char(d, 'YYYY-MM-DD') AS day, (SELECT count(*)::int FROM medico_inquiries WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = d) AS n
    FROM generate_series((now() AT TIME ZONE 'Asia/Kolkata')::date - 13, (now() AT TIME ZONE 'Asia/Kolkata')::date, interval '1 day') AS d`);
  return ok(res, { ...c, picture_bytes: Number(c.picture_bytes), lastRun, review, inquiries, daily, ai: aiConfigured(), cron: Boolean(process.env.CRON_SECRET) });
}

/* ---------------- posts ---------------- */
function postFields(b) {
  return {
    title: str(b.title, 250),
    slug: str(b.slug, 200),
    excerpt: str(b.excerpt, 600),
    content: sanitizeArticle(typeof b.content === 'string' ? b.content : ''),
    cover_image: str(b.cover_image, 500) || null,
    cover_credit: b.cover_credit && typeof b.cover_credit.text === 'string' && b.cover_credit.text.trim()
      ? JSON.stringify({ text: str(b.cover_credit.text, 300), url: /^https:\/\//.test(b.cover_credit.url || '') ? str(b.cover_credit.url, 500) : '' }) : null,
    gallery_images: JSON.stringify(strList(b.gallery_images, 20, 500)),
    category: str(b.category, 80) || 'Industry News',
    author: str(b.author, 120) || 'Medico Team',
    read_time: str(b.read_time, 30) || null,
    status: b.status === 'published' ? 'published' : 'draft',
    published_at: when(b.published_at),
    is_featured: bool(b.is_featured),
    meta_title: str(b.meta_title, 250) || null,
    meta_description: str(b.meta_description, 400) || null,
    faq: JSON.stringify(Array.isArray(b.faq) ? b.faq.filter((f) => f && f.q && f.a).slice(0, 12).map((f) => ({ q: str(f.q, 300), a: str(f.a, 1500) })) : []),
    reviewed: typeof b.reviewed === 'boolean' ? b.reviewed : null,
  };
}

const isLive = (status, at) => status === 'published' && (!at || Date.parse(at) <= Date.now());

async function posts(req, res, q) {
  if (req.method === 'GET') {
    if (q.id) {
      const row = (await query('SELECT * FROM medico_blog_posts WHERE id = $1', [q.id]))[0];
      return row ? ok(res, { ...row, markers: countMarkers(row.content), analysis: analyse(row.content) }) : fail(res, 'Article not found.', 404);
    }
    return ok(res, await query(`SELECT id, slug, title, excerpt, cover_image, category, status, published_at, created_at, updated_at, is_featured,
      ai_generated, reviewed_at, blog_type, topic, (content LIKE '%[NEEDS SOURCE]%' OR content LIKE '%[FLAG%') AS has_markers
      FROM medico_blog_posts ORDER BY COALESCE(published_at, created_at) DESC`), { categories: CATEGORIES });
  }
  const body = req.method === 'DELETE' ? {} : await readBody(req);

  if (req.method === 'POST') {
    const f = postFields(body);
    if (!f.title) return fail(res, 'Please give the article a title.');
    const slug = await uniqueSlug(f.slug || f.title);
    const id = `post-${slug.slice(0, 70)}-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO medico_blog_posts (id, slug, title, excerpt, content, cover_image, cover_credit, gallery_images, category, author, read_time, status, published_at,
         is_featured, meta_title, meta_description, faq, ai_generated, reviewed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12::text,
         CASE WHEN $12::text = 'published' THEN COALESCE($13::timestamptz, now()) ELSE $13::timestamptz END,
         $14,$15,$16,$17::jsonb,false,now())`,
      [id, slug, f.title, f.excerpt, f.content, f.cover_image, f.cover_credit, f.gallery_images, f.category, f.author, f.read_time, f.status,
        f.published_at, f.is_featured, f.meta_title, f.meta_description, f.faq]);
    if (f.is_featured) await query('UPDATE medico_blog_posts SET is_featured = false WHERE id <> $1', [id]);
    if (isLive(f.status, f.published_at)) await pingIndexNow(postPaths(slug));
    return ok(res, { id, slug, markers: countMarkers(f.content) });
  }

  if (req.method === 'PUT') {
    const id = str(body.id, 100);
    const current = (await query('SELECT slug, status, ai_generated, reviewed_at FROM medico_blog_posts WHERE id = $1', [id]))[0];
    if (!current) return fail(res, 'Article not found.', 404);
    const f = postFields(body);
    if (!f.title) return fail(res, 'Please give the article a title.');
    const slug = f.slug && slugify(f.slug, 80) !== current.slug ? await uniqueSlug(f.slug, id) : current.slug;
    await query(
      `UPDATE medico_blog_posts SET slug = $2, title = $3, excerpt = $4, content = $5, cover_image = $6, cover_credit = $7::jsonb, gallery_images = $8::jsonb,
         category = $9, author = $10, read_time = $11, status = $12::text,
         published_at = CASE WHEN $12::text = 'published' THEN COALESCE($13::timestamptz, published_at, now()) ELSE $13::timestamptz END,
         is_featured = $14, meta_title = $15, meta_description = $16, faq = $17::jsonb, updated_at = now(),
         reviewed_at = CASE WHEN $18::boolean IS NULL THEN reviewed_at WHEN $18::boolean THEN COALESCE(reviewed_at, now()) ELSE NULL END
       WHERE id = $1`,
      [id, slug, f.title, f.excerpt, f.content, f.cover_image, f.cover_credit, f.gallery_images, f.category, f.author, f.read_time, f.status,
        f.published_at, f.is_featured, f.meta_title, f.meta_description, f.faq, f.reviewed]);
    if (f.is_featured) await query('UPDATE medico_blog_posts SET is_featured = false WHERE id <> $1', [id]);
    if (current.status === 'published' || isLive(f.status, f.published_at)) await pingIndexNow([...postPaths(slug), ...(slug !== current.slug ? [`/blog/${current.slug}`] : [])]);
    return ok(res, { id, slug, markers: countMarkers(f.content), analysis: analyse(f.content) });
  }

  if (req.method === 'PATCH') {
    // Quick actions from the list: status, featured, reviewed
    const id = str(body.id, 100);
    const sets = [];
    const params = [id];
    if (body.status === 'published' || body.status === 'draft') {
      params.push(body.status);
      sets.push(`status = $${params.length}::text`, `published_at = CASE WHEN $${params.length}::text = 'published' THEN COALESCE(published_at, now()) ELSE published_at END`);
    }
    if (typeof body.is_featured === 'boolean') { params.push(body.is_featured); sets.push(`is_featured = $${params.length}`); }
    if (typeof body.reviewed === 'boolean') sets.push(body.reviewed ? 'reviewed_at = COALESCE(reviewed_at, now())' : 'reviewed_at = NULL');
    if (!sets.length) return fail(res, 'Nothing to change.');
    const [row] = await query(`UPDATE medico_blog_posts SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING slug, status, published_at`, params);
    if (!row) return fail(res, 'Article not found.', 404);
    if (body.is_featured === true) await query('UPDATE medico_blog_posts SET is_featured = false WHERE id <> $1', [id]);
    await pingIndexNow(postPaths(row.slug));
    return ok(res, row);
  }

  if (req.method === 'DELETE') {
    if (!q.id) return fail(res, 'Missing article.');
    await query('UPDATE medico_blog_sources SET used_in_post_id = NULL WHERE used_in_post_id = $1', [q.id]);
    await query('UPDATE medico_blog_runs SET post_id = NULL WHERE post_id = $1', [q.id]);
    const [row] = await query('DELETE FROM medico_blog_posts WHERE id = $1 RETURNING slug, status', [q.id]);
    if (row && row.status === 'published') await pingIndexNow(postPaths(row.slug));
    return ok(res);
  }
  return fail(res, 'Method not allowed.', 405);
}

async function preview(req, res) {
  const body = await readBody(req);
  const f = postFields(body);
  const html = await require('./render').previewPost({
    id: 'preview', slug: slugify(f.slug || f.title) || 'preview', title: f.title || 'Untitled', excerpt: f.excerpt, content: f.content,
    cover_image: f.cover_image, cover_credit: f.cover_credit ? JSON.parse(f.cover_credit) : null, gallery_images: JSON.parse(f.gallery_images),
    category: f.category, author: f.author, read_time: f.read_time, published_at: f.published_at || new Date().toISOString(),
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), meta_title: f.meta_title, meta_description: f.meta_description, faq: JSON.parse(f.faq),
  });
  // Preview must never be indexed or cached
  return send(res, 200, html.replace('<head>', '<head>\n  <meta name="robots" content="noindex, nofollow">'), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
}

/* ---------------- AI writer ---------------- */
async function topics(req, res, q) {
  if (req.method === 'GET') return ok(res, await query('SELECT * FROM medico_blog_topics ORDER BY is_active DESC, created_at ASC'));
  if (req.method === 'DELETE') { await query('DELETE FROM medico_blog_topics WHERE id = $1', [q.id]); return ok(res); }
  const b = await readBody(req);
  const keyword = str(b.keyword, 160);
  if (keyword.length < 2) return fail(res, 'Please type a topic.');
  const type = typeById(b.blog_type) ? b.blog_type : null;
  if (req.method === 'POST') {
    const rows = await query('INSERT INTO medico_blog_topics (keyword, notes, blog_type) VALUES ($1, $2, $3) RETURNING *', [keyword, str(b.notes, 1000), type]);
    return ok(res, rows[0]);
  }
  const rows = await query('UPDATE medico_blog_topics SET keyword = $2, notes = $3, blog_type = $4, is_active = $5, cover_image = NULLIF($6, \'\') WHERE id = $1 RETURNING *',
    [str(b.id, 40), keyword, str(b.notes, 1000), type, bool(b.is_active, true), str(b.cover_image, 500)]);
  return ok(res, rows[0]);
}

async function writer(req, res) {
  if (req.method === 'GET') {
    const runs = await query(`SELECT r.*, p.slug, p.title, p.status AS post_status FROM medico_blog_runs r LEFT JOIN medico_blog_posts p ON p.id = r.post_id ORDER BY r.created_at DESC LIMIT 40`);
    return ok(res, { runs, types: typeCatalogue(), configured: aiConfigured(), cron: Boolean(process.env.CRON_SECRET), categories: CATEGORIES });
  }
  if (!aiConfigured()) return fail(res, 'AI writer not configured: add GROQ_API_KEY.', 503);
  const b = await readBody(req);
  const deadline = Date.now() + BUDGET_MS;
  const settings = await getSettings();
  const typeId = typeById(b.type) ? b.type : null;
  const details = b.details && typeof b.details === 'object' ? Object.fromEntries(Object.entries(b.details).map(([k, v]) => [k, str(v, 4000)])) : {};
  const guessed = strList(b.guessed, 20, 60);
  const topic = str(b.topic, 200) || str(b.keywords, 200) || details.keyword || '';

  // Fill details from loose keywords (also picks the type when none was chosen)
  if (b.action === 'infer') {
    const keywords = str(b.keywords, 1000);
    if (keywords.length < 2) return fail(res, 'Type a few words to write about.');
    return ok(res, await inferDetails({ keywords, typeId, settings, deadline }));
  }
  if (!typeId && b.action !== 'auto') return fail(res, 'Choose a blog type first (or let the AI pick from keywords).');

  if (b.action === 'outline') {
    const news = b.useNews ? await freshNews(`${topic} ${settings.blog_region}`).catch(() => []) : [];
    const outline = await makeOutline({ typeId, details, guessed, settings, recentTitles: await recentTitles(), news, deadline });
    return ok(res, { outline, news });
  }

  if (b.action === 'write') {
    const runId = await startRun('manual', topic, typeId);
    try {
      const news = Array.isArray(b.news) ? b.news.filter((n) => n && /^https:\/\//.test(n.url)).slice(0, 6).map((n) => ({ title: str(n.title, 300), url: str(n.url, 1000), source: str(n.source, 120), published: str(n.published, 60), snippet: str(n.snippet, 400) }))
        : b.useNews ? await freshNews(`${topic} ${settings.blog_region}`).catch(() => []) : [];
      const outline = b.outline && Array.isArray(b.outline.sections) ? b.outline : null;
      const draft = await writeDraft({ typeId, details, guessed, outline, settings, recentTitles: await recentTitles(), news, deadline });
      const saved = await saveDraft({ draft, typeId, topic, outline, news, publish: false, postId: str(b.postId, 100) || null, deadline });
      await endRun(runId, 'draft', `Draft "${draft.title}" saved for review.`, { postId: saved.id });
      return ok(res, { ...saved, checks: draft.checks });
    } catch (err) {
      await endRun(runId, 'failed', err.message).catch(() => {});
      return fail(res, err.message, 502);
    }
  }

  // Run the daily automatic job now (same rules as the schedule, including one per day)
  if (b.action === 'auto') return ok(res, await runAuto());
  return fail(res, 'Unknown writer action.');
}

async function covers(req, res, q) {
  if (req.method === 'GET') {
    const search = str(q.q, 100);
    if (search.length < 2) return fail(res, 'Type what the photo should show.');
    return ok(res, await searchCovers(search, 18));
  }
  const b = await readBody(req);
  const credit = { text: str(b.credit, 300), url: /^https:\/\//.test(b.creditUrl || '') ? str(b.creditUrl, 500) : '' };
  try {
    return ok(res, { url: await saveCover(str(b.url, 1000), str(b.title, 200), credit), credit });
  } catch (err) { return fail(res, err.message, 502); }
}

/* ---------------- products ---------------- */
function productFields(b) {
  return {
    title: str(b.title, 250), category: str(b.category, 100), brand: str(b.brand, 100),
    price: num(b.price), original_price: num(b.originalPrice ?? b.original_price), stock: str(b.stock, 60) || 'In Stock',
    description: str(b.description, 2000), main_image: str(b.mainImage ?? b.main_image, 500) || null,
    gallery_images: JSON.stringify(strList(b.galleryImages ?? b.gallery_images, 20, 500)),
    features: JSON.stringify(strList(b.features, 20, 300)),
    long_description: sanitizeArticle(str(b.longDescription ?? b.long_description, 50000)) || null,
    specifications: JSON.stringify(Array.isArray(b.specifications) ? b.specifications.filter((s) => s && s.label).slice(0, 40).map((s) => ({ label: str(s.label, 120), value: str(s.value, 400) })) : []),
    in_the_box: sanitizeArticle(str(b.inTheBox ?? b.in_the_box, 10000)) || null,
    sku: str(b.sku, 100) || null, sort_order: Math.round(num(b.sort_order) || 0), is_visible: bool(b.is_visible, true),
  };
}

async function products(req, res, q) {
  if (req.method === 'GET') return ok(res, q.id ? (await query('SELECT * FROM medico_products WHERE id = $1', [q.id]))[0] || null : await query('SELECT * FROM medico_products ORDER BY sort_order, created_at'));
  if (req.method === 'DELETE') { await query('DELETE FROM medico_products WHERE id = $1', [q.id]); return ok(res); }
  const b = await readBody(req);
  const f = productFields(b);
  if (!f.title) return fail(res, 'Please give the product a name.');
  const cols = Object.keys(f);
  const vals = Object.values(f);
  const cast = (c) => (['gallery_images', 'features', 'specifications'].includes(c) ? '::jsonb' : '');
  if (req.method === 'POST') {
    const id = slugify(str(b.id, 100) || f.title, 60) || `product-${Date.now().toString(36)}`;
    const exists = (await query('SELECT 1 FROM medico_products WHERE id = $1', [id]))[0];
    const finalId = exists ? `${id}-${Date.now().toString(36)}` : id;
    await query(`INSERT INTO medico_products (id, ${cols.join(', ')}) VALUES ($1, ${cols.map((c, i) => `$${i + 2}${cast(c)}`).join(', ')})`, [finalId, ...vals]);
    return ok(res, { id: finalId });
  }
  const id = str(b.id, 100);
  const [row] = await query(`UPDATE medico_products SET ${cols.map((c, i) => `${c} = $${i + 2}${cast(c)}`).join(', ')}, updated_at = now() WHERE id = $1 RETURNING id`, [id, ...vals]);
  return row ? ok(res, row) : fail(res, 'Product not found.', 404);
}

/* ---------------- inquiries ---------------- */
async function inquiries(req, res, q) {
  if (req.method === 'GET') {
    const status = ['new', 'handled', 'archived'].includes(q.status) ? q.status : null;
    return ok(res, await query(`SELECT id, name, phone, email, organisation, interest, message, page, status, notes, handled_at, created_at FROM medico_inquiries
      ${status ? 'WHERE status = $1' : ''} ORDER BY created_at DESC LIMIT 500`, status ? [status] : []));
  }
  if (req.method === 'DELETE') { await query('DELETE FROM medico_inquiries WHERE id = $1', [q.id]); return ok(res); }
  const b = await readBody(req);
  const status = ['new', 'handled', 'archived'].includes(b.status) ? b.status : 'handled';
  const [row] = await query(`UPDATE medico_inquiries SET status = $2::varchar, notes = COALESCE($3::text, notes), handled_at = CASE WHEN $2::varchar = 'new' THEN NULL ELSE COALESCE(handled_at, now()) END
    WHERE id = $1 RETURNING id, status, notes, handled_at`, [str(b.id, 40), status, typeof b.notes === 'string' ? b.notes.slice(0, 2000) : null]);
  return row ? ok(res, row) : fail(res, 'Inquiry not found.', 404);
}

/* ---------------- media ---------------- */
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif' };
async function media(req, res, q) {
  if (req.method === 'GET') {
    const rows = await query('SELECT id, name, mime, bytes, width, height, credit, created_at FROM medico_media ORDER BY created_at DESC LIMIT 500');
    return ok(res, rows.map((r) => ({ ...r, url: `/media/${r.id}.${EXT[r.mime] || 'webp'}` })));
  }
  if (req.method === 'DELETE') {
    const pattern = `%/media/${q.id}.%`;
    if (q.force !== '1') {
      const used = await query(`SELECT 'an article' AS place, title AS name FROM medico_blog_posts WHERE cover_image LIKE $1 OR content LIKE $1 OR gallery_images::text LIKE $1
        UNION ALL SELECT 'a product', title FROM medico_products WHERE main_image LIKE $1 OR gallery_images::text LIKE $1 OR long_description LIKE $1
        UNION ALL SELECT 'the site text', key FROM medico_site_copy WHERE value LIKE $1 LIMIT 1`, [pattern]);
      if (used[0]) return send(res, 409, { ok: false, error: `This picture is used by ${used[0].place} ("${used[0].name}"). Delete anyway?`, inUse: true });
    }
    await query('DELETE FROM medico_media WHERE id = $1', [q.id]);
    return ok(res);
  }
  const b = await readBody(req);
  const mime = str(b.mime, 40);
  if (!EXT[mime]) return fail(res, 'Please choose a photo (JPG, PNG or WebP).');
  const buf = Buffer.from(String(b.data || '').replace(/^data:[^,]+,/, ''), 'base64');
  if (!buf.length) return fail(res, 'The picture was empty.');
  if (buf.length > 3_000_000) return fail(res, 'This picture is too large. Please choose a smaller one.', 413);
  const id = crypto.randomBytes(10).toString('hex');
  await query(`INSERT INTO medico_media (id, name, mime, data, bytes, width, height) VALUES ($1,$2,$3,decode($4,'base64'),$5,$6,$7)`,
    [id, str(b.name, 200) || 'picture', mime, buf.toString('base64'), buf.length, num(b.width), num(b.height)]);
  return ok(res, { id, url: `/media/${id}.${EXT[mime]}`, bytes: buf.length });
}

/* ---------------- settings ---------------- */
function setupChecks() {
  return [
    { label: 'Database connected', done: hasDb(), fix: 'Add DATABASE_URL in Vercel.' },
    { label: 'Admin sign-in configured', done: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD), fix: 'Add ADMIN_EMAIL and ADMIN_PASSWORD in Vercel.' },
    { label: 'Separate session secret', done: Boolean(process.env.ADMIN_SESSION_SECRET), fix: 'Add ADMIN_SESSION_SECRET (long random text). Without it sessions are signed with a key derived from the password.' },
    { label: 'AI writer key', done: aiConfigured(), fix: 'AI writer not configured: add GROQ_API_KEY (console.groq.com).' },
    { label: 'Daily schedule protected', done: Boolean(process.env.CRON_SECRET), fix: 'Add CRON_SECRET in Vercel so the daily article can run.' },
    { label: 'Site address', done: Boolean(process.env.SITE_URL), fix: `Add SITE_URL (currently using ${siteUrl()}).` },
    { label: 'IndexNow pings', done: Boolean(process.env.INDEXNOW_KEY), fix: 'Optional: add INDEXNOW_KEY (32 hex characters) to tell Bing about new articles.' },
    { label: 'Pexels photos', done: Boolean(process.env.PEXELS_API_KEY), fix: 'Optional: add PEXELS_API_KEY for more cover photo choices.' },
  ];
}
async function settings(req, res) {
  if (req.method === 'GET') return ok(res, await getSettings(), { checks: setupChecks(), defaults: SETTINGS_DEFAULTS });
  const b = await readBody(req);
  if (typeof b.blog_every_days === 'number') b.blog_every_days = Math.min(30, Math.max(1, Math.round(b.blog_every_days)));
  if (!['short', 'medium', 'long'].includes(b.blog_length)) delete b.blog_length;
  if (Array.isArray(b.same_as)) b.same_as = b.same_as.filter((u) => /^https:\/\//.test(u)).slice(0, 20).map((u) => str(u, 300));
  for (const [k, v] of Object.entries(b)) if (typeof v === 'string') b[k] = v.trim().slice(0, 1000);
  await saveSettings(b);
  return ok(res, await getSettings());
}

/* ---------------- site copy ---------------- */
async function copy(req, res, q) {
  if (req.method === 'GET') {
    const overrides = new Map((await query('SELECT key, value, updated_at FROM medico_site_copy')).map((r) => [r.key, r]));
    const seen = new Map();
    for (const [page, { file, label }] of Object.entries(PAGES)) {
      let fields = [];
      try { fields = copyFields(file); } catch { continue; }
      for (const f of fields) {
        if (!f.key) continue;
        const shared = /^(chrome|footer|header|dialog|nav)\./.test(f.key);
        if (seen.has(f.key)) { seen.get(f.key).pages.push(label); continue; }
        const o = overrides.get(f.key);
        seen.set(f.key, { key: f.key, label: f.label, default: f.value, value: o ? o.value : null, updatedAt: o ? o.updated_at : null, group: shared ? 'Shared (header, footer, dialog)' : label, pages: [label] });
      }
    }
    // Overrides whose element no longer exists in any page
    const orphans = [...overrides.values()].filter((o) => !seen.has(o.key)).map((o) => ({ key: o.key, value: o.value, updatedAt: o.updated_at }));
    return ok(res, { fields: [...seen.values()], orphans });
  }
  if (req.method === 'DELETE') { await query('DELETE FROM medico_site_copy WHERE key = $1', [str(q.key, 200)]); return ok(res); }
  const b = await readBody(req);
  const key = str(b.key, 200);
  if (!/^[\w.-]+$/.test(key)) return fail(res, 'Unknown text field.');
  const value = sanitizeInline(typeof b.value === 'string' ? b.value : '');
  await query(`INSERT INTO medico_site_copy (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [key, value]);
  return ok(res, { key, value });
}

/* ---------------- router ---------------- */
const ROUTES = { login, logout, me, overview, posts, preview, topics, writer, covers, products, inquiries, media, settings, copy };
const PUBLIC = new Set(['login', 'logout']);

/** Same-origin check for state-changing requests (SameSite=Lax plus this blocks CSRF). */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host || new URL(origin).host === req.headers['x-forwarded-host']; } catch { return false; }
}

module.exports = async (req, res) => {
  const q = getQuery(req);
  const name = q.r || pathOf(req).replace(/^\/api\/admin\/?/, '').split('/')[0];
  const fn = ROUTES[name];
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!fn) return fail(res, 'Not found.', 404);
  if (req.method !== 'GET' && !sameOrigin(req)) return fail(res, 'Cross-site request blocked.', 403);
  const user = auth.session(req);
  if (!PUBLIC.has(name) && !user) return fail(res, 'Please sign in again.', 401);
  try {
    return await fn(req, res, q, user);
  } catch (err) {
    console.error(`[admin api] ${req.method} ${name}`, err);
    const msg = err.status ? err.message : err.code === '23505' ? 'Something with that name or address already exists.' : /DATABASE_URL/.test(err.message) ? 'The database is not connected.'
      // Signed-in admins see the real reason (handy when debugging); anonymous callers never see internals
      : (user && err.message) || 'Something went wrong. Please try again.';
    return fail(res, msg, err.status || 500);
  }
};
