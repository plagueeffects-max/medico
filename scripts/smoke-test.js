/**
 * End-to-end smoke test against a running server (default http://localhost:8090).
 *   PORT=8090 node server.js   then   node scripts/smoke-test.js [baseUrl]
 * Signs in with ADMIN_EMAIL/ADMIN_PASSWORD from .env (never printed), exercises admin CRUD,
 * posts one inquiry, then removes every row it created.
 */
require('dotenv').config();
const assert = require('assert');

const BASE = process.argv[2] || 'http://localhost:8090';
let cookie = '';

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', Origin: BASE, ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  const type = res.headers.get('content-type') || '';
  return { status: res.status, headers: res.headers, json: type.includes('json') ? await res.json() : null, text: type.includes('json') ? '' : await res.text() };
}

(async () => {
  const step = (name) => console.log(`ok  ${name}`);

  let r = await call('POST', '/api/admin/login', { email: process.env.ADMIN_EMAIL, password: 'definitely-wrong' });
  assert.strictEqual(r.status, 401); step('wrong password rejected');

  r = await call('POST', '/api/admin/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  assert.strictEqual(r.status, 200, JSON.stringify(r.json));
  assert(/HttpOnly/i.test(r.headers.get('set-cookie')) && /SameSite=Lax/i.test(r.headers.get('set-cookie'))); step('login sets HttpOnly SameSite cookie');

  r = await call('GET', '/api/admin/me'); assert.strictEqual(r.status, 200); step('session accepted');
  r = await call('GET', '/api/admin/overview'); assert(r.json.ok && typeof r.json.data.posts_live === 'number'); step('overview');

  // Cross-site write is blocked
  const xs = await fetch(`${BASE}/api/admin/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example', Cookie: cookie }, body: '{}' });
  assert.strictEqual(xs.status, 403); step('cross-origin write blocked');

  // Posts CRUD
  r = await call('POST', '/api/admin/posts', { title: 'Smoke test article', excerpt: 'Test', content: '<p>Hello <script>alert(1)</script>world [NEEDS SOURCE].</p>', status: 'published', category: 'Industry News' });
  assert(r.json.ok, JSON.stringify(r.json)); const post = r.json.data; assert.strictEqual(post.markers.needsSource, 1); step(`post created (${post.slug})`);
  r = await call('GET', `/api/admin/posts?id=${post.id}`); assert(!r.json.data.content.includes('<script')); step('content sanitized on save');
  r = await call('GET', `/blog/${post.slug}`); assert.strictEqual(r.status, 200); assert(r.text.includes('Hello world.') && !r.text.includes('[NEEDS SOURCE]')); step('SSR renders post, markers stripped');
  r = await call('PUT', '/api/admin/posts', { id: post.id, title: 'Smoke test article edited', content: '<p>Edited body text here.</p>', status: 'draft', reviewed: true });
  assert(r.json.ok); step('post updated');
  r = await call('GET', `/api/posts?id=${post.id}`); assert.strictEqual(r.status, 404); step('draft hidden from public API');
  r = await call('PATCH', '/api/admin/posts', { id: post.id, status: 'published', is_featured: false }); assert(r.json.ok); step('quick publish');
  r = await call('POST', '/api/admin/preview', { title: 'Preview', content: '<p>Preview body</p>' }); assert(r.text.includes('Preview body') && r.text.includes('noindex')); step('live preview');
  r = await call('DELETE', `/api/admin/posts?id=${post.id}`); assert(r.json.ok); step('post deleted');

  // Products CRUD
  r = await call('POST', '/api/admin/products', { title: 'Smoke Test Monitor', category: 'Critical Care', brand: 'Philips', features: ['A', 'B'], specifications: [{ label: 'Weight', value: '3 kg' }] });
  assert(r.json.ok, JSON.stringify(r.json)); const pid = r.json.data.id; step(`product created (${pid})`);
  r = await call('PUT', '/api/admin/products', { id: pid, title: 'Smoke Test Monitor 2', category: 'Critical Care', is_visible: true }); assert(r.json.ok); step('product updated');
  r = await call('GET', `/api/products?id=${pid}`); assert.strictEqual(r.json.product.title, 'Smoke Test Monitor 2'); step('product visible in public API');
  r = await call('DELETE', `/api/admin/products?id=${pid}`); assert(r.json.ok); step('product deleted');

  // Media upload (1x1 webp) and delete
  const webp = 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
  r = await call('POST', '/api/admin/media', { name: 'smoke', mime: 'image/webp', data: webp, width: 1, height: 1 }); assert(r.json.ok); const media = r.json.data;
  const img = await fetch(BASE + media.url); assert.strictEqual(img.headers.get('content-type'), 'image/webp'); step('media upload + serve');
  r = await call('DELETE', `/api/admin/media?id=${media.id}`); assert(r.json.ok); step('media deleted');

  // Site copy override round trip (only if the pages carry data-copy keys)
  r = await call('GET', '/api/admin/copy'); assert(r.json.ok); const field = r.json.data.fields[0];
  if (field) {
    const had = field.value;
    await call('PUT', '/api/admin/copy', { key: field.key, value: 'SMOKE <strong>copy</strong><script>x</script>' });
    const page = await call('GET', '/'); const shows = page.text.includes('SMOKE <strong>copy</strong>') && !page.text.includes('<script>x');
    if (had === null) await call('DELETE', `/api/admin/copy?key=${encodeURIComponent(field.key)}`); else await call('PUT', '/api/admin/copy', { key: field.key, value: had });
    console.log(`${shows ? 'ok ' : 'NOTE'} site copy override on "${field.key}" ${shows ? 'rendered on /' : '(key not on the home page)'}`);
  }

  // Inquiry: validation, honeypot, store, then delete the test row
  r = await call('POST', '/api/inquiry', { name: 'X', phone: '1' }); assert.strictEqual(r.status, 400); step('inquiry validation');
  r = await call('POST', '/api/inquiry', { name: 'Bot', phone: '9419008453', website: 'spam' }); assert(r.json.success); step('honeypot accepted silently');
  r = await call('POST', '/api/inquiry', { name: 'Smoke Test', phone: '+91 94190 00000', email: 'smoke@example.com', message: 'Test inquiry', page: '/' });
  assert(r.json.success, JSON.stringify(r.json)); step('inquiry stored');
  r = await call('GET', '/api/admin/inquiries'); const mine = r.json.data.filter((i) => i.name === 'Smoke Test' || i.name === 'Bot');
  assert(mine.some((i) => i.name === 'Smoke Test') && !mine.some((i) => i.name === 'Bot')); step('inquiry in inbox, honeypot not stored');
  for (const i of mine) await call('DELETE', `/api/admin/inquiries?id=${i.id}`); step('test inquiry deleted');

  r = await call('GET', '/api/admin/settings'); assert(r.json.ok && Array.isArray(r.json.checks)); step('settings');
  r = await call('GET', '/api/admin/writer'); assert(r.json.ok && r.json.data.types.length === 6); step(`writer catalogue (AI configured: ${r.json.data.configured})`);

  r = await call('POST', '/api/admin/logout'); r = await call('GET', '/api/admin/me'); assert.strictEqual(r.status, 401); step('logout');
  console.log('\nAll smoke tests passed.');
})().catch((err) => { console.error('FAILED:', err.message); process.exit(1); });
