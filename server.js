// Local dev server. Mirrors vercel.json: the same handlers, the same routes, the same headers.
//   npm run dev            (PORT defaults to 8082)
require('dotenv').config();
const path = require('path');
const express = require('express');

const publicApi = require('./api/public');
const adminApi = require('./api/admin');
const render = require('./api/render');
const cron = require('./api/cron');
const { SECURITY_HEADERS } = require('./api/_lib/headers');

const app = express();
const PORT = process.env.PORT || 8082;
app.disable('x-powered-by');

// No body parser: handlers read the body themselves (4 MB cap), exactly as on Vercel.
app.use((req, res, next) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  if (/^\/admin/.test(req.path)) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

/** Mount a handler with fixed params (like a vercel.json route dest query). */
const via = (handler, params = {}) => (req, res) => {
  req.medicoParams = { ...params, ...(req.params.slug ? { slug: req.params.slug } : {}), ...(req.params.file ? { file: req.params.file } : {}) };
  return handler(req, res);
};

// Pages (rendered so site-copy edits and article/product content are in the HTML)
app.get(['/', '/index.html'], via(render, { page: 'index' }));
for (const p of ['about', 'shop', 'blog', 'terms']) app.get(`/${p}.html`, via(render, { page: p }));
app.get('/privacy-policy.html', via(render, { page: 'privacy' }));
app.get('/blog-post.html', via(render, { page: 'post' }));
app.get('/product.html', via(render, { page: 'product' }));
app.get(['/blog/:slug', '/blog/:slug/'], via(render, { page: 'post' }));
app.get(['/product/:slug', '/product/:slug/'], via(render, { page: 'product' }));

// SEO files and media
app.get('/sitemap.xml', via(publicApi, { r: 'sitemap' }));
app.get('/robots.txt', via(publicApi, { r: 'robots' }));
app.get('/llms.txt', via(publicApi, { r: 'llms' }));
app.get('/indexnow-key.txt', via(publicApi, { r: 'indexnow-key' }));
app.get('/media/:file', via(publicApi, { r: 'media' }));

// APIs
for (const r of ['posts', 'products', 'inquiry', 'google-reviews']) app.all(`/api/${r}`, via(publicApi, { r }));
app.all('/api/admin/:route', (req, res) => via(adminApi, { r: req.params.route })(req, res));
app.all('/api/cron', via(cron));

// Admin shell
app.get(['/admin', '/admin/'], (req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));

// Static files (dotfiles such as .env are never served)
// Only public folders and root-level pages; source, docs and tooling stay private
for (const dir of ['assets', 'images', 'favicon', 'Products', 'Blog Assets']) {
  app.use(`/${dir}`, express.static(path.join(__dirname, dir), { dotfiles: 'ignore', index: false }));
}
app.get(/^\/[\w-]+\.(?:html|ico|txt|xml)$/, (req, res, next) => {
  const file = path.join(__dirname, path.basename(req.path));
  require('fs').access(file, (err) => (err ? next() : res.sendFile(file)));
});
app.use((req, res) => res.status(404).type('text/plain').send('Not found'));

app.listen(PORT, () => console.log(`Medico local server: http://localhost:${PORT}  (admin: /admin)`));
