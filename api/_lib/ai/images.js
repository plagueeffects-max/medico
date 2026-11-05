// Cover photo candidates from free, commercially usable sources, always with attribution:
//  - Openverse (no key): CC licences filtered to commercial use
//  - Wikimedia Commons (no key): CC BY / CC BY-SA / CC0 / public domain
//  - Pexels (only when PEXELS_API_KEY is set): Pexels licence
// The chosen photo is copied into medico_media, so the article never depends on the source host.
const crypto = require('crypto');
const { query } = require('../db');

const UA = 'MedicoWebsite/1.0 (https://medico-inky.vercel.app; medicosgr@gmail.com)';
const SKIP = /\b(logo|map|diagram|chart|graph|flag|emblem|seal|icon|coat of arms|signature|poster|banner|screenshot|text|document|stamp|svg|plan|scheme)\b/i;
const LICENCE = /^(cc0|public domain|pd\b|cc by(-sa)? \d)/i;
// Only these hosts may be downloaded into the picture library (no arbitrary URLs: SSRF guard)
const ALLOWED = /^https:\/\/((upload|thumb)\.wikimedia\.org|images\.pexels\.com|live\.staticflickr\.com|farm\d+\.staticflickr\.com|api\.openverse\.org)\//;
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

async function getJson(url, headers = {}) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

async function searchOpenverse(search) {
  const params = new URLSearchParams({ q: search, license_type: 'commercial', page_size: '20', mature: 'false', aspect_ratio: 'wide' });
  const data = await getJson(`https://api.openverse.org/v1/images/?${params}`);
  return (data?.results || [])
    .filter((r) => ALLOWED.test(r.url || '') && !SKIP.test(r.title || '') && (!r.width || r.width >= 1000))
    .map((r) => ({
      source: 'Openverse',
      thumb: r.thumbnail || r.url,
      full: r.url,
      width: r.width || null, height: r.height || null,
      title: strip(r.title || search),
      credit: `Photo: ${strip(r.creator || 'Unknown author').slice(0, 80)}${r.provider ? ` / ${r.provider}` : ''}, ${String(r.license || '').toUpperCase() === 'CC0' ? 'CC0' : `CC ${String(r.license || '').toUpperCase()} ${r.license_version || ''}`.trim()}`,
      creditUrl: r.foreign_landing_url || r.url,
    }));
}

async function searchWikimedia(search) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrsearch: `${search} filetype:bitmap`, gsrlimit: '30',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1280',
  });
  const data = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  return Object.values(data?.query?.pages || {})
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((p) => {
      const info = p.imageinfo && p.imageinfo[0];
      if (!info || !info.thumburl) return null;
      const meta = info.extmetadata || {};
      const licence = strip(meta.LicenseShortName?.value);
      const artist = strip(meta.Artist?.value).replace(/^this (photo|image) was (taken|made) by /i, '').split(/\s*\.?\s*(?:This (?:image|photo)|Feel free)/i)[0].trim() || 'Unknown author';
      const ratio = info.width / info.height;
      if (info.mime !== 'image/jpeg' || info.width < 1000 || ratio < 1.2 || ratio > 2.2 || SKIP.test(p.title) || !LICENCE.test(licence)) return null;
      return {
        source: 'Wikimedia Commons', thumb: info.thumburl.replace(/\/\d+px-/, '/500px-'), full: info.thumburl, width: info.thumbwidth, height: info.thumbheight,
        title: strip(p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '')), credit: `Photo: ${artist.slice(0, 80)} / Wikimedia Commons, ${licence}`, creditUrl: info.descriptionurl,
      };
    })
    .filter(Boolean);
}

async function searchPexels(search) {
  if (!process.env.PEXELS_API_KEY) return [];
  const data = await getJson(`https://api.pexels.com/v1/search?${new URLSearchParams({ query: search, orientation: 'landscape', per_page: '20' })}`, { Authorization: process.env.PEXELS_API_KEY });
  return (data?.photos || []).filter((p) => p.width >= 1600).map((p) => ({
    source: 'Pexels', thumb: p.src.medium, full: `${p.src.original}?auto=compress&cs=tinysrgb&w=1600`, width: 1600, height: Math.round((1600 * p.height) / p.width),
    title: strip(p.alt || search), credit: `Photo: ${strip(p.photographer).slice(0, 80)} / Pexels`, creditUrl: p.url,
  }));
}

async function usedPhotos() {
  try {
    const rows = await query(`SELECT cover_credit->>'url' AS url FROM medico_blog_posts WHERE cover_credit IS NOT NULL`);
    return new Set(rows.map((r) => r.url));
  } catch { return new Set(); }
}

/** Candidates for a search, best source first, skipping photos another article already uses. */
async function searchCovers(search, limit = 12) {
  const [pexels, openverse, wiki, used] = await Promise.all([searchPexels(search), searchOpenverse(search), searchWikimedia(search), usedPhotos()]);
  return [...pexels, ...openverse, ...wiki].filter((c) => !used.has(c.creditUrl)).slice(0, limit);
}

/** Copy a photo into medico_media; returns its /media/ URL. */
async function saveCover(url, name, credit) {
  if (!ALLOWED.test(url)) throw new Error('Only Openverse, Wikimedia or Pexels photos can be imported.');
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000), redirect: 'follow' });
  if (!res.ok || !ALLOWED.test(res.url)) throw new Error('The photo could not be downloaded. Please pick another one.');
  const mime = (res.headers.get('content-type') || '').split(';')[0].trim();
  if (!/^image\/(jpeg|png|webp)$/.test(mime)) throw new Error('That file is not a photo. Please pick another one.');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 3_000_000) throw new Error('That photo is too large. Please pick another one.');
  const id = crypto.randomBytes(10).toString('hex');
  await query(`INSERT INTO medico_media (id, name, mime, data, bytes, credit) VALUES ($1, $2, $3, decode($4, 'base64'), $5, $6::jsonb)`,
    [id, String(name || 'cover').slice(0, 200), mime, buf.toString('base64'), buf.length, credit ? JSON.stringify(credit) : null]);
  return `/media/${id}.${mime.split('/')[1].replace('jpeg', 'jpg')}`;
}

/** Best available photo for the writer's idea; null when nothing usable was found. */
async function findCover(ideas) {
  for (const idea of ideas.filter(Boolean)) {
    for (const c of await searchCovers(idea, 3)) {
      try {
        const credit = { text: c.credit, url: c.creditUrl };
        return { url: await saveCover(c.full, c.title, credit), credit };
      } catch { /* try the next one */ }
    }
  }
  return null;
}

module.exports = { searchCovers, saveCover, findCover };
