# Medico — Production Readiness Audit
**Date:** 2026-04-30  
**Auditor:** Principal Engineering Review  
**Scope:** Full codebase — Security, Architecture, Performance, SEO/a11y, Error Handling

---

## CRITICAL — Do Before Launch

These will either cause a data breach, prevent the site from functioning, or make it
invisible to search engines. Fix every one before going live.

---

### C1 · Auth Bypass: Silent `catch()` Grants Admin Access Without a Valid Token

**Files:** `admin-dashboard.html:118–121` · `admin-shop.html:130–133`

The auth flow checks `sessionStorage` synchronously, then fires an async backend verify.
The `.catch()` block explicitly ignores failures and lets the session continue.

```js
// admin-dashboard.html:118–121  (identical code in admin-shop.html:130–133)
}).catch(() => {
    // Network error or API down — don't log out, just continue
    console.warn('Auth check: API unreachable, continuing with stored token.');
});
```

**Attack vector:** Open DevTools, run `sessionStorage.setItem('medico_admin_auth', 'hacked')`,
navigate to `/admin-dashboard.html`. The synchronous guard passes (token is truthy), the async
`/api/verify-token` returns 401, but the catch silently swallows it — the admin UI loads fully.
No backend needed. This is a complete authentication bypass.

**Fix:**

```js
}).catch(() => {
    // On any network failure, treat as unauthenticated and re-check on next load.
    // Never silently grant access.
    sessionStorage.removeItem('medico_admin_auth');
    window.location.href = 'admin-login.html';
});
```

---

### C2 · Broken Token Design: Token = SHA-256(Password), Never Expires

**Files:** `api/login.js:1–6` · `api/save-blog.js:1–14` · `api/save-product.js:1–14` · `api/verify-token.js:1–6`

```js
// Repeated verbatim in every API file
function generateToken() {
    if (!process.env.ADMIN_PASSWORD) return null;
    return crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex');
}
```

Three compounding problems:

1. **SHA-256 is a fast, unsalted hash** — if the password is weak (e.g. `admin123`), the token is
   crackable from the response in seconds via hashcat/rainbow tables.
2. **The token is deterministic and eternal** — it never rotates, expires, or invalidates. Anyone
   who captures it once has permanent access until the password env var is changed.
3. **Sending the password hash as the session token** conflates authentication (proving who you
   are) with the credential itself. Any token leak is equivalent to a password leak.

**Fix:** Use `crypto.randomBytes(32)` at login time and store the token server-side
(e.g. Vercel KV, Upstash Redis, or even a signed JWT with an expiry):

```js
// api/login.js — replace generateToken() with:
const jwt = require('jsonwebtoken');

function issueToken() {
    return jwt.sign(
        { role: 'admin', iat: Math.floor(Date.now() / 1000) },
        process.env.JWT_SECRET,       // a long random secret, NOT the password
        { expiresIn: '8h' }
    );
}

// In requireAuth (save-blog.js, save-product.js):
function requireAuth(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return false;
    try {
        jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        return true;
    } catch { return false; }
}
```

---

### C3 · Login Fallback Stores the String `'true'` as Auth Token

**File:** `admin-login.html:171`

```js
sessionStorage.setItem('medico_admin_auth', data.token || 'true');
```

If the server responds `{ success: true }` without a `token` field (e.g. during a migration or
API change), the client stores the literal string `'true'`. The guard at
`admin-dashboard.html:104` only checks `if (!token)` — a truthy string passes.
Combined with C1's silent catch, any response that includes `success: true` grants access.

**Fix:**

```js
if (response.ok && data.success && data.token) {
    sessionStorage.setItem('medico_admin_auth', data.token);
    window.location.href = 'admin-dashboard.html';
} else {
    // treat missing token as failure regardless of success flag
    showError(data.message || 'Login failed.');
}
```

---

### C4 · XSS: Unescaped localStorage Data Injected via `innerHTML`

**Files:** `blog-post.html:374` · `product.html:600, 619` · `shop.html:428–472` · `admin-dashboard.html:336–395`

Multiple innerHTML sinks render unsanitized data from localStorage. Because localStorage
is admin-controlled, the immediate risk is self-XSS, but Quill stores raw HTML and any
future code path that corrupts localStorage (or a shared device) can execute arbitrary JS.

**Worst offender — blog-post.html:374:**
```js
// Raw Quill HTML from localStorage, no sanitization
document.getElementById('post-content').innerHTML = blog.content || '';
```

**product.html:600, 619:**
```js
tabDesc.innerHTML = p.longDescription || `<p>${p.description || 'No description available.'}</p>`;
// ...
tabBox.innerHTML = p.inTheBox;
```

**shop.html:335–345 — XSS inside `onclick` attribute:**
```js
html += `
  <button onclick="filterByCategory('${cat}')">  // injection point
      ${cat}                                       // injection point
  </button>`;
```
A category name like `'); alert(document.cookie); ('` breaks both the onclick handler
and the HTML context. Because category names come from localStorage (written by the admin),
this is exploitable on any shared admin device.

**Fix — use DOMPurify for rich text sinks:**
```html
<!-- Add to admin-dashboard.html, admin-shop.html, blog-post.html, product.html -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.5/dist/purify.min.js"></script>
```
```js
// blog-post.html:374 — replace with:
document.getElementById('post-content').innerHTML = DOMPurify.sanitize(blog.content || '');

// product.html:600, 619:
tabDesc.innerHTML = DOMPurify.sanitize(p.longDescription || '');
tabBox.innerHTML  = DOMPurify.sanitize(p.inTheBox || '');
```

**Fix — use `textContent` for non-HTML fields and escape onclick attribute values:**
```js
// shop.html: avoid interpolating data into onclick attributes
const btn = document.createElement('button');
btn.className = `filter-btn${currentCategory === cat ? ' active' : ''}`;
btn.textContent = cat;  // safe: no HTML injection possible
const count = document.createElement('span');
count.className = 'filter-count';
count.textContent = `${catCount}`;
btn.appendChild(count);
btn.addEventListener('click', () => filterByCategory(cat));
list.appendChild(btn);
```

---

### C5 · CORS Wildcard (`*`) on All Admin API Endpoints

**Files:** `api/login.js:9` · `api/verify-token.js:9` · `api/save-blog.js:17` · `api/save-product.js:17`

```js
res.setHeader('Access-Control-Allow-Origin', '*');
```

Every admin API — including `/api/login` — accepts cross-origin POST requests from any website.
A malicious page can submit credential-guessing requests directly to your login endpoint
from the victim's browser, bypassing network-level restrictions.

**Fix:** Restrict to your own origin in production:

```js
const ALLOWED_ORIGIN = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:8082';

res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
res.setHeader('Vary', 'Origin');
```

---

### C6 · Architectural Crisis: All Production Data Lives Only in the Admin's Browser localStorage

**Files:** `assets/js/blog-data.js:53–102` · `assets/js/products-data.js:1–90` · `api/save-blog.js:29–39` · `api/save-product.js:29–38`

On Vercel (your production environment), the filesystem is read-only. The Vercel API
functions explicitly document this and simply echo the data back to the caller:

```js
// api/save-blog.js:29–38 — the entire "save" implementation on Vercel
// NOTE: On Vercel, the filesystem is read-only.
// This endpoint acknowledges the request and returns the blog data
// with base64 images preserved (since we cannot write to disk).
// Images are stored in localStorage via the frontend.
return res.json({ success: true, blog });
```

The consequence: every blog post and product exists only in the admin's browser on the
specific machine they used to create it. Customers visiting the site on any other device
see zero products and zero blog posts (the demo seed data only).

This is the most impactful architectural issue in the project and requires a backend
persistence layer before launch.

**Fix options (in increasing robustness):**

| Option | Effort | Suitable for |
|---|---|---|
| **Vercel KV (Redis)** — store JSON blobs | Low | Content-light sites |
| **PlanetScale / Supabase / Neon** — Postgres | Medium | Full relational data |
| **Contentful / Sanity** — Headless CMS | Medium | Content-heavy sites |
| **Vercel Blob** — file storage for images | Low | Image storage only |

Minimum viable approach using Vercel KV:
```js
// api/save-blog.js — replace the localStorage echo with:
import { kv } from '@vercel/kv';

const blog = req.body;
blog.id = blog.id || Date.now().toString();
await kv.hset('blogs', { [blog.id]: JSON.stringify(blog) });
return res.json({ success: true, blog });
```

Add a public `/api/get-blogs` endpoint that reads from KV, and update `blog-data.js`
to fetch from the API instead of from localStorage.

---

### C7 · Vercel: Product and Blog Images Won't Load in Production

**File:** `vercel.json:1–28`

The `builds` and `routes` arrays include `assets/**` and `images/**` but not
`Products/**` or `Blog Assets/**`:

```json
{ "src": "assets/**", "use": "@vercel/static" },
{ "src": "images/**", "use": "@vercel/static" }
// Missing: Products/**, Blog Assets/**
```

Any image path like `Products/Oxygen Dynamics/Philips EVERFLO/Images/main.png` will 404
on Vercel even if the file was committed to the repository.

**Fix:**
```json
{ "src": "Products/**", "use": "@vercel/static" },
{ "src": "Blog Assets/**", "use": "@vercel/static" }
```

---

### C8 · Render-Blocking Scripts in `<head>` Without `defer`

**Files:** `shop.html:14` · `product.html:14`

```html
<!-- Blocks HTML parsing; no product cards render until this script executes -->
<script src="assets/js/products-data.js"></script>
```

This script appears in `<head>` without `defer` or `async`. The browser stops parsing HTML
until this script downloads, parses, and executes — directly delaying First Contentful Paint
and Largest Contentful Paint.

**Fix:**
```html
<script src="assets/js/products-data.js" defer></script>
```
Move this to just before `</body>`, or add `defer`. Ensure the inline scripts that call
`ProductsDB` are wrapped in `DOMContentLoaded` (they already are in some places, verify all).

---

## HIGH — Fix Before Launch or Within First Week

---

### H1 · No Rate Limiting on Admin Login Endpoint

**File:** `api/login.js`

No attempt limit on `/api/login`. An attacker can send unlimited password guesses.
Combined with the SHA-256 token design (C2), a weak password is crackable from both
sides (offline via the token hash and online via the login endpoint).

**Fix using Vercel's `@upstash/ratelimit`:**
```js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 min
});

module.exports = async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    const { success } = await ratelimit.limit(ip);
    if (!success) return res.status(429).json({ success: false, message: 'Too many attempts.' });
    // ... rest of handler
};
```

---

### H2 · Auth/Token Logic Duplicated Verbatim Across Every API File

**Files:** `api/login.js:1–6` · `api/save-blog.js:1–14` · `api/save-product.js:1–14` · `api/verify-token.js:1–6`

`generateToken()` and `requireAuth()` are copy-pasted into four separate files. A bug fix
or security update must be applied four times. This is how security regressions happen.

**Fix:** Create `api/_auth.js` and import from it:
```js
// api/_auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return false;
    try {
        jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        return true;
    } catch { return false; }
}

module.exports = { requireAuth };
```
```js
// api/save-blog.js
const { requireAuth } = require('./_auth');
```

---

### H3 · Missing Security Headers Across All Responses

No Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, or
Strict-Transport-Security are set anywhere.

**Fix — add a `vercel.json` headers block:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.quilljs.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.quilljs.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' data:; connect-src 'self';"
        }
      ]
    }
  ]
}
```

---

### H4 · Blog Post and Product Page Titles Set via JavaScript — Not Crawlable

**Files:** `blog-post.html:306` · `product.html:511`

```js
document.title = `Medico Group | ${blog.title}`;
document.title = `${p.title} | Medico`;
```

Search engine crawlers (especially Googlebot with slow JS execution) will index the
static title "Medico Group | Blog Post" for every blog post. Product pages similarly
share one static title.

**Fix:** Since blog/product content is currently in localStorage (fix C6 first), once
you have a server-side data source, generate static pages or use server-side rendering.
Interim: pre-populate `<title>` in the HTML with a reasonable fallback:
```html
<title id="page-title">Medico | Product Details</title>
```
Then also update the `<meta property="og:title">` tag via JS in the same operation.

---

### H5 · No Meta Descriptions or OpenGraph Tags on Any Page

**Files:** `index.html:1–14` · `shop.html:1–15` · `blog.html:1–13` · `blog-post.html:1–14` · `product.html:1–15`

Every `<head>` is missing `<meta name="description">`, `<meta property="og:*">`, and
`<meta name="twitter:*">` tags. Search engines will auto-generate previews (usually
poorly) and social shares will show no image or description.

**Fix — minimum required for each page type:**
```html
<!-- index.html -->
<meta name="description" content="Medico Scientific Service Centre — Kashmir's trusted supplier of clinical-grade respiratory, anaesthesia, and life-support equipment. Serving hospitals, clinics & families since 2000.">
<meta property="og:title" content="Medico Group | Clinical Medical Equipment">
<meta property="og:description" content="Premium respiratory and life-support equipment for healthcare providers across Jammu & Kashmir.">
<meta property="og:image" content="https://your-domain.com/images/medico_shop.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://your-domain.com/">
<link rel="canonical" href="https://your-domain.com/">
```

---

### H6 · No `robots.txt` or `sitemap.xml`

Without `robots.txt`, crawlers apply default rules and may index admin pages.
Without `sitemap.xml`, search engines may not discover all pages.

**Fix — create `robots.txt` at root:**
```
User-agent: *
Allow: /
Disallow: /admin-login.html
Disallow: /admin-dashboard.html
Disallow: /admin-shop.html
Disallow: /api/

Sitemap: https://your-domain.com/sitemap.xml
```

**Create `sitemap.xml`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/XMLSchema/0.1/">
  <url><loc>https://your-domain.com/</loc><priority>1.0</priority></url>
  <url><loc>https://your-domain.com/shop.html</loc><priority>0.9</priority></url>
  <url><loc>https://your-domain.com/blog.html</loc><priority>0.8</priority></url>
  <url><loc>https://your-domain.com/about.html</loc><priority>0.7</priority></url>
</urlset>
```
Add `sitemap.xml` to `vercel.json` builds list:
```json
{ "src": "sitemap.xml", "use": "@vercel/static" },
{ "src": "robots.txt",  "use": "@vercel/static" }
```

---

### H7 · Multiple Autoplay Videos in `<head>` with `preload="auto"` — Massive Bandwidth Cost

**File:** `index.html:29, 78, 92, 108, 120+`

The hero has one full autoplay video with `preload="auto"`, and the category grid
has 4+ additional `<video autoplay loop muted playsinline preload="auto">` cards.
On mobile, this can trigger 50–200 MB of data transfer on first load. Google PageSpeed
penalizes this heavily under LCP and TTI.

**Fix:** Remove `preload="auto"` (browser default is `preload="metadata"`), add `loading`
optimizations, and use `<source>` with compressed WebM variants:

```html
<!-- Replace preload="auto" with metadata for non-hero videos -->
<video autoplay muted loop playsinline preload="metadata" disablePictureInPicture>
    <source src="images/mask.webm" type="video/webm">
    <source src="images/mask.mp4" type="video/mp4">
</video>
```

For the hero video, use `preload="none"` and a poster image that loads first:
```html
<video class="hero-video" autoplay muted loop playsinline
       preload="none" poster="images/hero-poster.webp" disablePictureInPicture>
    <source src="images/video.mp4" type="video/mp4">
</video>
```

---

### H8 · Missing Accessibility Landmarks and ARIA on All Pages

**All HTML pages**

No page has a `<main>` landmark element. Screen reader users cannot jump to content.
Meaningful images use `alt=""`. Interactive elements lack focus styles.

Key issues:
- `index.html:65` — `<img src="images/oxygen.gif" alt="">` on a linked card (decorative `alt` on a navigation element)
- No `<main>` wrapping the primary content on `index.html`, `shop.html`, `blog.html`
- No skip-nav link on any page
- The floating back button in admin pages has `title` but no `aria-label`

**Fix — minimum structural changes:**
```html
<!-- Every page: wrap primary content -->
<main id="main-content">
  <!-- page content here -->
</main>

<!-- Add as first element in <body>: -->
<a href="#main-content" class="skip-link">Skip to content</a>

<!-- CSS for skip link: -->
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 9999;
    transition: top 0.2s;
}
.skip-link:focus { top: 0; }
```

```html
<!-- index.html:65 — fix alt on product category card -->
<img src="images/oxygen.gif" alt="Oxygen concentrator device" class="card-bg-media blend-multiply">
```

---

### H9 · `express` v5 (RC) and `body-parser` v2 in Production

**File:** `package.json`

```json
"express": "^5.2.1",
"body-parser": "^2.2.2"
```

Express 5 is in release candidate stage. For a production medical business site,
use the LTS-stable Express 4.x.

**Fix:**
```bash
npm install express@^4.21.2 body-parser@^1.20.3
```

---

### H10 · `index.html` Title Is Not Business-Appropriate for SEO

**File:** `index.html:7`

```html
<title>Medico Group | Clinical Tech-Noir</title>
```

"Clinical Tech-Noir" is a visual design theme description, not a keyword a customer
would search for. This wastes the most valuable on-page SEO signal.

**Fix:**
```html
<title>Medico Scientific Service Centre | Medical Equipment Kashmir</title>
```

---

## LOW — Fix Within First Month

---

### L1 · No Structured Data (JSON-LD) for Products and Blog Posts

Product pages lack `Product` schema; blog posts lack `Article` schema. These enable
rich results (star ratings, prices, breadcrumbs) in Google Search.

**Fix — add to `product.html` after product data loads:**
```js
function injectProductSchema(p) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.title,
        "description": p.description,
        "sku": p.sku,
        "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": p.price,
            "availability": p.stock === 'In Stock'
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock"
        }
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
}
```

---

### L2 · Images Missing Explicit `width`/`height` — Layout Shift (CLS)

**Files:** `index.html`, `shop.html`, `product.html`

Images without explicit dimensions cause Cumulative Layout Shift while loading,
which Google uses as a Core Web Vitals ranking signal.

**Fix — add dimensions to all `<img>` tags:**
```html
<!-- Before -->
<img src="images/logo.svg" alt="Medico">

<!-- After -->
<img src="images/logo.svg" alt="Medico" width="160" height="40">
```

For dynamic product images, use CSS aspect-ratio instead:
```css
.product-image-wrap { aspect-ratio: 1 / 1; }
```

---

### L3 · Particle Canvas Animation Runs When Tab Is Hidden (Wasted CPU)

**File:** `assets/js/main.js:288–304`

`requestAnimationFrame` loops unconditionally even when the tab is in the background,
burning CPU and battery.

**Fix:**
```js
function animateParticles() {
    if (document.hidden) {
        requestAnimationFrame(animateParticles); // stay in queue but skip frame
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}
```

---

### L4 · `alert()` Used for Storage Quota Errors

**File:** `assets/js/blog-data.js:70–73`

```js
} catch (e) {
    alert("Storage quota exceeded! Try deleting old blogs or uploading smaller images.");
}
```

`alert()` blocks the browser thread, cannot be styled, and is dismissed without
the user understanding what happened. Replace with an in-page toast or banner.

---

### L5 · Seven Identical Parallax Event-Handler Blocks in `main.js`

**File:** `assets/js/main.js:57–243`

The code registers `mouseenter`/`mouseleave` handlers for cards `.ac-1` through `.ac-7`
with identical logic repeated seven times. This makes adding an 8th category require
editing five separate blocks. Extract to a loop:

```js
// Replace the 7 blocks with:
const parallaxMap = [
    { card: '.ac-1', parallax: '#equipment-parallax',   props: ['--px',  '--py']  },
    { card: '.ac-2', parallax: '#equipment-parallax-2', props: ['--px2', '--py2'] },
    { card: '.ac-3', parallax: '#equipment-parallax-3', props: ['--px3', '--py3'] },
    { card: '.ac-4', parallax: '#equipment-parallax-4', props: ['--px4', '--py4'] },
    { card: '.ac-5', parallax: '#equipment-parallax-5', props: ['--px5', '--py5'] },
    { card: '.ac-6', parallax: '#equipment-parallax-6', props: ['--px6', '--py6'] },
    { card: '.ac-7', parallax: '#equipment-parallax-7', props: ['--px7', '--py7'] },
];

parallaxMap.forEach(({ card, parallax, props }) => {
    const cardEl = document.querySelector(card);
    const parallaxEl = document.getElementById(parallax.slice(1));
    if (!cardEl || !parallaxEl) return;
    cardEl.addEventListener('mouseenter', () => parallaxEl.classList.add('active'));
    cardEl.addEventListener('mouseleave', () => {
        parallaxEl.classList.remove('active');
        parallaxEl.style.setProperty(props[0], '0px');
        parallaxEl.style.setProperty(props[1], '0px');
    });
});
```

---

### L6 · Placeholder `href="#"` Links in Footer

**File:** `blog-post.html:234`, and all pages sharing the same footer

```html
<li><a href="#">Contact</a></li>
<li><a href="#">Certifications</a></li>
```

These are dead links that return a 404-equivalent experience and reduce crawl efficiency.
Replace with real destination pages or remove until they exist.

---

### L7 · No `loading="lazy"` on Below-the-Fold Images

**Files:** `index.html`, `about.html`, `shop.html` (product grid images)

Images below the fold are loaded eagerly. Add `loading="lazy"` to all images
not in the first viewport:

```html
<img src="images/about_us2.png" alt="About Medico" loading="lazy" width="600" height="400">
```

Note: do NOT apply `loading="lazy"` to the hero image — that would delay the LCP element.

---

## Summary Checklist

### Critical (8 items)
- [ ] **C1** — Fix auth bypass in `admin-dashboard.html:118–121` and `admin-shop.html:130–133`
- [ ] **C2** — Replace SHA-256 token scheme with JWT in all four API files
- [ ] **C3** — Remove `|| 'true'` fallback in `admin-login.html:171`
- [ ] **C4** — Add DOMPurify to all `innerHTML` sinks; escape onclick attributes
- [ ] **C5** — Replace `Access-Control-Allow-Origin: *` with explicit origin in all API files
- [ ] **C6** — Migrate data persistence from localStorage to a real backend (Vercel KV minimum)
- [ ] **C7** — Add `Products/**` and `Blog Assets/**` to `vercel.json` builds and routes
- [ ] **C8** — Add `defer` to `<script src="assets/js/products-data.js">` in `shop.html` and `product.html`

### High (10 items)
- [ ] **H1** — Add rate limiting to `/api/login` (Upstash Ratelimit)
- [ ] **H2** — Extract `generateToken`/`requireAuth` to shared `api/_auth.js`
- [ ] **H3** — Add security headers block to `vercel.json`
- [ ] **H4** — Fix static page titles for blog-post and product pages
- [ ] **H5** — Add meta description and OpenGraph tags to all pages
- [ ] **H6** — Add `robots.txt` and `sitemap.xml`
- [ ] **H7** — Change video `preload="auto"` to `preload="metadata"`; add poster to hero video
- [ ] **H8** — Add `<main>`, skip-nav link, and fix `alt=""` on linked images
- [ ] **H9** — Downgrade `express` to `^4.21.2` and `body-parser` to `^1.20.3`
- [ ] **H10** — Rename `index.html` title to include actual business keywords

### Low (7 items)
- [ ] **L1** — Add JSON-LD structured data to `product.html` and `blog-post.html`
- [ ] **L2** — Add explicit `width`/`height` to all `<img>` tags
- [ ] **L3** — Pause particle canvas animation on `document.hidden`
- [ ] **L4** — Replace `alert()` with in-page error toast in `blog-data.js:70–73`
- [ ] **L5** — Refactor 7× repeated parallax handlers in `main.js` into a data-driven loop
- [ ] **L6** — Replace all `href="#"` placeholder links in the footer
- [ ] **L7** — Add `loading="lazy"` to below-the-fold images across all pages
