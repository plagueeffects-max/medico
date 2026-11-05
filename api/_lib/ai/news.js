// Recent Google News stories for a search, de-duplicated against stories already used.
const { query } = require('../db');

const decode = (t) => String(t || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();
const tag = (xml, name) => (xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) || [])[1] || '';

/** Never throws; [] on any failure. */
async function searchNews(search, days = 21) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${search} when:${days}d`)}&hl=en-IN&gl=IN&ceid=IN:en`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MedicoBot/1.0)' }, signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const xml = await res.text();
    return (xml.match(/<item>[\s\S]*?<\/item>/g) || []).slice(0, 20).map((item) => {
      const source = decode(tag(item, 'source'));
      const title = decode(tag(item, 'title')).replace(new RegExp(`\\s+-\\s+${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
      return { title, url: decode(tag(item, 'link')), source: source || 'News', published: decode(tag(item, 'pubDate')), snippet: decode(tag(item, 'description')).slice(0, 400) };
    }).filter((n) => n.title && /^https:\/\//.test(n.url));
  } catch { return []; }
}

async function freshNews(search, limit = 4) {
  const items = await searchNews(search);
  if (!items.length) return [];
  const used = await query('SELECT url, lower(title) AS title FROM medico_blog_sources WHERE url = ANY($1) OR lower(title) = ANY($2)',
    [items.map((i) => i.url), items.map((i) => i.title.toLowerCase())]);
  const urls = new Set(used.map((u) => u.url));
  const titles = new Set(used.map((u) => u.title));
  return items.filter((i) => !urls.has(i.url) && !titles.has(i.title.toLowerCase())).slice(0, limit);
}

async function rememberSources(items, search, postId) {
  for (const item of items) {
    await query(
      `INSERT INTO medico_blog_sources (id, query, title, url, snippet, published_date, used_in_post_id)
       VALUES (md5($3), $1, $2, $3, $4, $5, $6) ON CONFLICT (url) DO UPDATE SET used_in_post_id = EXCLUDED.used_in_post_id`,
      [search.slice(0, 250), item.title.slice(0, 300), item.url, item.snippet, isNaN(Date.parse(item.published)) ? null : new Date(item.published).toISOString(), postId]
    );
  }
}

module.exports = { searchNews, freshNews, rememberSources };
