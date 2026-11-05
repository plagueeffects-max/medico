// Writer runs: the daily automatic article and the admin's manual steps. Every run is logged
// in medico_blog_runs. AI articles are saved as drafts unless auto-publish is on, and stay
// noindex until a person reviews them (reviewed_at).
const { query } = require('../db');
const { getSettings } = require('../settings');
const { slugify } = require('../text');
const { inferDetails, writeDraft } = require('./writer');
const { typeById } = require('./blog-types');
const { freshNews, rememberSources } = require('./news');
const { findCover } = require('./images');

const BUDGET_MS = 55000; // Vercel Hobby functions stop at 60s
const FALLBACK_COVERS = ['/images/blog-featured-icu.webp', '/images/blog-biomedical-amc.webp', '/images/blog-sleep-apnea.webp', '/images/blog-surgical-lights.webp',
  '/images/products/oxygen-conc.webp', '/images/products/critical-care.webp', '/images/products/anaesthesia.webp', '/images/products/diagnostics.webp'];

async function startRun(trigger, topic, blogType) {
  if (trigger === 'auto') {
    // The unique run_day is the lock: a second call on the same day inserts nothing
    const rows = await query(
      `INSERT INTO medico_blog_runs (run_day, trigger, status, topic, blog_type) VALUES ((now() AT TIME ZONE 'Asia/Kolkata')::date, 'auto', 'running', $1, $2)
       ON CONFLICT (run_day) DO NOTHING RETURNING id`, [topic, blogType]);
    return rows[0] ? rows[0].id : null;
  }
  const rows = await query(`INSERT INTO medico_blog_runs (trigger, status, topic, blog_type) VALUES ($1, 'running', $2, $3) RETURNING id`, [trigger, topic, blogType]);
  return rows[0].id;
}

async function endRun(id, status, message, { postId = null, topic = null, blogType = null, keepDay = false } = {}) {
  await query(
    `UPDATE medico_blog_runs SET status = $2, message = $3, post_id = $4, topic = COALESCE($5, topic), blog_type = COALESCE($6, blog_type),
       run_day = CASE WHEN $7::boolean THEN run_day ELSE NULL END WHERE id = $1`,
    [id, status, String(message).slice(0, 1000), postId, topic, blogType, keepDay]);
}

async function uniqueSlug(wanted, exceptId = '') {
  const base = slugify(wanted, 80) || `article-${Date.now()}`;
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const taken = await query('SELECT 1 FROM medico_blog_posts WHERE slug = $1 AND id <> $2', [slug, exceptId]);
    if (!taken[0]) return slug;
  }
}

const recentTitles = async () => (await query('SELECT title FROM medico_blog_posts ORDER BY created_at DESC LIMIT 25')).map((r) => r.title);

async function fallbackCover() {
  const recent = new Set((await query(`SELECT cover_image FROM medico_blog_posts ORDER BY created_at DESC LIMIT 6`)).map((r) => r.cover_image));
  return FALLBACK_COVERS.find((c) => !recent.has(c)) || FALLBACK_COVERS[Math.floor(Math.random() * FALLBACK_COVERS.length)];
}

/**
 * Save a writer draft. New post unless postId is given (regenerate: the AI body replaces the
 * old one, reviewed_at is cleared because a person has not read the new text yet).
 */
async function saveDraft({ draft, typeId, topic, outline, news, publish, postId, deadline }) {
  let cover = null;
  if (!postId && Date.now() < deadline - 12000) cover = await findCover([draft.imageQuery, topic]).catch(() => null);
  const coverUrl = cover ? cover.url : postId ? null : await fallbackCover();
  const sources = (news || []).map((n) => ({ title: n.title, source: n.source, url: n.url }));
  const notes = `Written by ${draft.checks.model} as a ${typeById(typeId)?.label || typeId}${news && news.length ? ` from ${news.length} news report(s)` : ''}.`;

  if (postId) {
    const slug = (await query('SELECT slug, status FROM medico_blog_posts WHERE id = $1', [postId]))[0];
    if (!slug) throw new Error('That article no longer exists.');
    await query(
      `UPDATE medico_blog_posts SET title = $2, excerpt = $3, content = $4, category = $5, meta_title = $6, meta_description = $7,
         checks = $8::jsonb, outline = $9::jsonb, faq = $10::jsonb, blog_type = $11, topic = COALESCE($12, topic), source_urls = $13::jsonb,
         ai_generated = true, reviewed_at = NULL, review_notes = $14, read_time = NULL, updated_at = now() WHERE id = $1`,
      [postId, draft.title, draft.excerpt, draft.content, draft.category, draft.metaTitle, draft.metaDescription, JSON.stringify(draft.checks),
        outline ? JSON.stringify(outline) : null, JSON.stringify(draft.faq), typeId, topic, JSON.stringify(sources), notes]);
    return { id: postId, slug: slug.slug };
  }

  const slug = await uniqueSlug(draft.slug || draft.title);
  const id = `ai-${slug.slice(0, 60)}-${Date.now().toString(36)}`;
  await query(
    `INSERT INTO medico_blog_posts (id, slug, title, excerpt, content, cover_image, cover_credit, category, status, published_at, ai_generated,
       source_urls, meta_title, meta_description, topic, review_notes, checks, outline, faq, blog_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::text,CASE WHEN $10::boolean THEN now() END,true,$11::jsonb,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18::jsonb,$19)`,
    [id, slug, draft.title, draft.excerpt, draft.content, coverUrl, cover ? JSON.stringify(cover.credit) : null, draft.category,
      publish ? 'published' : 'draft', Boolean(publish), JSON.stringify(sources), draft.metaTitle, draft.metaDescription,
      String(topic || '').slice(0, 200) || null, notes, JSON.stringify(draft.checks), outline ? JSON.stringify(outline) : null, JSON.stringify(draft.faq), typeId]);
  if (news && news.length) await rememberSources(news, String(topic || draft.title), id);
  return { id, slug };
}

/** Daily schedule: pick the least recently used topic, write in one go, save as draft by default. */
async function runAuto() {
  const start = Date.now();
  const deadline = start + BUDGET_MS;
  const settings = await getSettings();
  if (!settings.blog_auto_enabled) return { status: 'skipped', message: 'Automatic writing is turned off.' };
  const last = await query(`SELECT ((now() AT TIME ZONE 'Asia/Kolkata')::date - max(run_day)) AS days FROM medico_blog_runs WHERE trigger = 'auto' AND run_day IS NOT NULL`);
  const days = last[0] && last[0].days;
  if (days !== null && days !== undefined && days < settings.blog_every_days) return { status: 'skipped', message: `Not due yet (writes every ${settings.blog_every_days} day(s)).` };

  const topic = (await query(`SELECT * FROM medico_blog_topics WHERE is_active ORDER BY last_used_at ASC NULLS FIRST, times_used ASC, random() LIMIT 1`))[0];
  if (!topic) return { status: 'skipped', message: 'No active topics. Add one in the AI writer.' };
  const runId = await startRun('auto', topic.keyword, topic.blog_type);
  if (!runId) return { status: 'skipped', message: "Today's article has already been written." };

  try {
    const [inferred, news, titles] = await Promise.all([
      inferDetails({ keywords: `${topic.keyword}. ${topic.notes || ''}`, typeId: topic.blog_type, settings, deadline }),
      freshNews(`${topic.keyword} ${settings.blog_region}`).catch(() => []),
      recentTitles(),
    ]);
    const draft = await writeDraft({ typeId: inferred.type, details: inferred.details, guessed: inferred.guessed, settings, recentTitles: titles, news, deadline });
    const saved = await saveDraft({ draft, typeId: inferred.type, topic: topic.keyword, news, publish: settings.blog_auto_publish, deadline });
    await query('UPDATE medico_blog_topics SET times_used = times_used + 1, last_used_at = now() WHERE id = $1', [topic.id]);
    const status = settings.blog_auto_publish ? 'published' : 'draft';
    const message = settings.blog_auto_publish ? `Published "${draft.title}" (noindex until reviewed).` : `Saved "${draft.title}" to drafts for review.`;
    await endRun(runId, status, message, { postId: saved.id, blogType: inferred.type, keepDay: true });
    return { status, message, postId: saved.id, slug: saved.slug };
  } catch (err) {
    console.error('[writer auto]', err.message);
    // Clearing run_day lets a retry happen (next cron, or the admin)
    await endRun(runId, 'failed', err.message).catch(() => {});
    return { status: 'failed', message: err.message };
  }
}

module.exports = { runAuto, saveDraft, startRun, endRun, recentTitles, uniqueSlug, BUDGET_MS };
