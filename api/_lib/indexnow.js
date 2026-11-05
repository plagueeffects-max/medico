// Tell Bing and other IndexNow engines that pages changed. Only on production, only when
// INDEXNOW_KEY is set. The key is served at /indexnow-key.txt (see api/public.js).
// Serverless functions stop after the response, so the ping is awaited (with a short timeout).
const { siteUrl } = require('./http');

async function pingIndexNow(paths) {
  const key = process.env.INDEXNOW_KEY;
  if (!key || process.env.VERCEL_ENV !== 'production' || !paths.length) return;
  const base = siteUrl();
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(base).host, key, keyLocation: `${base}/indexnow-key.txt`, urlList: paths.map((p) => `${base}${p}`) }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.status !== 200 && res.status !== 202) console.error(`[indexnow] ${res.status}`);
  } catch (err) {
    console.error('[indexnow]', err.message);
  }
}

const postPaths = (slug) => [`/blog/${slug}`, '/blog.html', '/sitemap.xml'];

module.exports = { pingIndexNow, postPaths };
