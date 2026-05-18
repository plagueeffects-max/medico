# GEO Audit Report: Medico Scientific Service Centre

**Audit Date:** 2026-05-16
**URL:** https://medico-inky.vercel.app/
**Business Type:** Local Business — Medical Equipment Supplier (YMYL)
**Pages Analyzed:** 4 (index.html, shop.html, about.html, blog.html)

---

## Executive Summary

**Overall GEO Score: 30/100 — Critical**

Medico Scientific Service Centre has genuine authority foundations — 25-year operating history, named founder, real customer testimonials, GST registration, verified physical address, and authorised partnerships with Philips, Schiller, and Shalya — but almost none of this is packaged in a way that AI systems can extract, cite, or trust. Three infrastructure failures alone block every AI crawler from reading the site's robots.txt and sitemap: a wildcard `vercel.json` rewrite routes these files to the homepage HTML instead. The shop and blog pages — the two highest-value pages — render all content via JavaScript and are therefore invisible to AI crawlers. There is zero structured data on any page. The site is commercially credible but AI-invisible.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 28/100 | 25% | 7.0 |
| Brand Authority | 22/100 | 20% | 4.4 |
| Content E-E-A-T | 38/100 | 20% | 7.6 |
| Technical GEO | 54/100 | 15% | 8.1 |
| Schema & Structured Data | 4/100 | 10% | 0.4 |
| Platform Optimization | 29/100 | 10% | 2.9 |
| **Overall GEO Score** | | | **30/100** |

---

## Critical Issues (Fix Immediately)

### C1 — Vercel wildcard rewrite blocks all AI crawlers from reading robots.txt and sitemap.xml

**Affected files:** `vercel.json`, `robots.txt`, `sitemap.xml`
**Impact:** All 12+ AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Amazonbot, etc.) request `/robots.txt` and receive the full homepage HTML with a `200 OK` status. The robots directives are never read. The sitemap reference in robots.txt is also unreachable. Every AI crawler is operating without any site structure guidance.

**Root cause:** `vercel.json` contains:
```json
"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
```
This wildcard fires for all unmatched routes — including `/robots.txt`, `/sitemap.xml`, and any future `/llms.txt`.

**Fix:** Replace the `rewrites` block with explicit `routes` in `vercel.json`:
```json
"routes": [
  { "src": "/robots.txt", "dest": "/robots.txt" },
  { "src": "/sitemap.xml", "dest": "/sitemap.xml" },
  { "src": "/llms.txt", "dest": "/llms.txt" },
  { "handle": "filesystem" },
  { "src": "/(.*)", "dest": "/index.html" }
]
```

---

### C2 — Shop and blog content is JavaScript-rendered — invisible to all AI crawlers

**Affected pages:** `shop.html`, `blog.html`
**Impact:** The shop page product grid and the entire blog listing are empty HTML containers populated at runtime by `products-data.js` and `blog-data.js`. An AI crawler fetching either page sees:
```html
<div class="shop-grid" id="productGrid">
    <!-- Populated by JS -->
</div>
```
All product names, descriptions, and blog articles are completely invisible to GPTBot, ClaudeBot, PerplexityBot, and Googlebot. These are the two highest-value commercial and content pages on the site.

**Fix:** Pre-render at least a static HTML snapshot of all products and blog posts in the initial HTML payload. JavaScript can still enhance the UX, but the content must exist in raw HTML. For a static Vercel site, generate `shop.html` and `blog.html` with inline product/post data at build time.

---

### C3 — Zero structured data on any page

**Affected pages:** All
**Impact:** AI systems cannot confirm what this business is, where it operates, who owns it, what it sells, or how customers rate it. The five named 5-star testimonials are invisible to search engines. No entity graph exists for Medico Scientific Service Centre in any AI knowledge base.

**Fix:** Add JSON-LD schema blocks to `index.html` and `about.html`. See Schema section for complete ready-to-use JSON-LD templates.

---

### C4 — Privacy Policy and Terms of Use are dead placeholder links

**Affected pages:** Footer (all pages)
**Impact:** Both links resolve to `href="#"`. This is a legal compliance failure under India's DPDPA 2023 (the site collects names, emails, and phone numbers via contact forms). Google Quality Raters explicitly flag missing legal pages as a trust disqualifier for YMYL sites — which medical equipment supply is. This suppresses rankings and AI citability simultaneously.

**Fix:** Create actual `/privacy-policy.html` and `/terms.html` pages and link them from the footer. For a Kashmir-based supplier, the privacy policy must address: data collected, storage location, third-party sharing, and user rights under DPDPA 2023.

---

### C5 — No llms.txt file

**Affected:** Entire site
**Impact:** AI agents have no machine-readable brief about this business. For a local supplier with no Wikipedia article and no Reddit presence, `llms.txt` is disproportionately important — it is the one place where the site can author its own AI-readable identity. Note: even if created today, the Vercel rewrite (C1) must be fixed first or it will serve homepage HTML instead.

**Fix after fixing C1:** Create `/llms.txt` in the repo root:
```markdown
# Medico Scientific Service Centre

> Kashmir's trusted supplier of clinical-grade respiratory and life-support
> medical equipment. Established 2000 by Mr. Syed Naseer Ahmad Andrabi.
> 100+ healthcare partners across Jammu & Kashmir. GST: 01AALPI4731K1ZV.
> Authorised partner: Philips (respiratory), Schiller (diagnostics), Shalya (surgical).

## Core Pages

- [Home](https://medico-inky.vercel.app/): Overview, product categories, testimonials
- [Products](https://medico-inky.vercel.app/shop.html): Full catalog — Oxygen Dynamics,
  Anaesthesia, Diagnostics, Emergency & Resuscitation, Critical Care, Sleep & NIV, Surgery
- [About Us](https://medico-inky.vercel.app/about.html): Company history, founder profile,
  certifications, brand partnerships, physical address
- [Blog](https://medico-inky.vercel.app/blog.html): Medical equipment insights

## Key Facts

- Address: 2nd Floor, Iqbal Complex, Batamaloo, Srinagar, J&K 190009
- Phone: +91 94190 08453
- Email: medicosgr@gmail.com
- Founded: 2000
- Service area: Jammu & Kashmir, India
```

---

## High Priority Issues

### H1 — Brand name inconsistency across all pages

Three different names are used: `"Medico Scientific Service Centre"` (index.html), `"Medico Group"` (about.html, blog.html, admin pages), `"Medico"` (shop.html). Every AI model that encounters the site sees two or three different entities. Entity confidence scores fragment. This actively suppresses recognition across all five AI platforms simultaneously.

**Fix:** Standardize to `"Medico Scientific Service Centre"` in every `<title>`, footer, meta description, heading, and OG tag. Update shop, about, and blog page titles:
- `shop.html`: `Medico Scientific Service Centre | Medical Equipment Kashmir`
- `about.html`: `Medico Scientific Service Centre | About Us`
- `blog.html`: `Medico Scientific Service Centre | Insights & Updates`

---

### H2 — Sitemap namespace invalid, missing lastmod dates

Current: `xmlns="http://www.sitemaps.org/schemas/XMLSchema/0.1/"`
Correct: `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`

The namespace `0.1` does not exist in the sitemaps protocol specification. Stricter parsers (including Google Search Console) flag this as invalid.

**Fix:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://medico-inky.vercel.app/</loc><lastmod>2026-05-16</lastmod><priority>1.0</priority></url>
  <url><loc>https://medico-inky.vercel.app/shop.html</loc><lastmod>2026-05-16</lastmod><priority>0.9</priority></url>
  <url><loc>https://medico-inky.vercel.app/about.html</loc><lastmod>2026-05-16</lastmod><priority>0.8</priority></url>
  <url><loc>https://medico-inky.vercel.app/blog.html</loc><lastmod>2026-05-16</lastmod><priority>0.7</priority></url>
</urlset>
```

---

### H3 — Meta descriptions missing on shop.html, about.html, blog.html

Only `index.html` has a meta description. The shop page — the primary commercial page — has none.

**Add to each page `<head>`:**

`shop.html`:
```html
<meta name="description" content="Browse clinical-grade medical equipment in Kashmir — oxygen concentrators, CPAP/BiPAP machines, anaesthesia workstations, defibrillators, and critical care monitors. Medico Scientific Service Centre, Srinagar.">
```

`about.html`:
```html
<meta name="description" content="Medico Scientific Service Centre — Kashmir's first medical equipment supplier, established 2000. Led by founder Syed Naseer Ahmad Andrabi. Authorised Philips, Schiller, and Shalya partner. 100+ healthcare partners across J&K.">
```

`blog.html`:
```html
<meta name="description" content="Medical equipment insights, clinical guidance, and healthcare updates for Jammu & Kashmir. Published by Medico Scientific Service Centre, Srinagar.">
```

---

### H4 — No canonical tags on any page

URL parameter variants from the shop filter (`shop.html?category=Oxygen+Dynamics`) create uncanonicalized duplicate pages. Without canonicals, Google and AI crawlers may split attention across thin-content URL variants.

**Add to all pages:**
```html
<!-- index.html -->
<link rel="canonical" href="https://medico-inky.vercel.app/">

<!-- shop.html -->
<link rel="canonical" href="https://medico-inky.vercel.app/shop.html">

<!-- about.html -->
<link rel="canonical" href="https://medico-inky.vercel.app/about.html">

<!-- blog.html -->
<link rel="canonical" href="https://medico-inky.vercel.app/blog.html">
```

---

### H5 — OG tags incomplete on homepage, absent on all inner pages

Homepage is missing `og:description` and `og:url`. Shop, about, and blog have no OG tags at all.

**Add to `index.html`:**
```html
<meta property="og:description" content="Kashmir's trusted partner for clinical-grade respiratory and life-support equipment. Serving hospitals & families since 2000.">
<meta property="og:url" content="https://medico-inky.vercel.app/">
<meta property="og:locale" content="en_IN">
```
Replicate appropriate OG tags on all inner pages.

---

### H6 — No Google Business Profile confirmed

GBP is the single highest-leverage action for Google Gemini and Google AI Overviews visibility. It directly feeds the Knowledge Graph for local entities.

**Fix:** Register at business.google.com using:
- Name: `Medico Scientific Service Centre`
- Address: 2nd Floor, Iqbal Complex, Opposite Iqbal Park, Central Market, Batamaloo, Srinagar, J&K 190009
- Phone: `+91 9419008453`
- Category: `Medical Equipment Supplier`
- Website: production domain URL

Once verified, add the GBP URL to the `sameAs` array in all schema blocks.

---

### H7 — No LinkedIn company page (returns 404)

LinkedIn is Bing Copilot's strongest off-site entity signal for B2B companies and is weighted heavily by ChatGPT for professional entity verification.

**Fix:** Create LinkedIn company page at linkedin.com/company/ with:
- Name: `Medico Scientific Service Centre`
- Industry: `Medical Equipment`
- Founded: `2000`
- Location: `Srinagar, Jammu and Kashmir`
- Add LinkedIn URL to footer and to `sameAs` in all schema blocks

---

### H8 — 5 customer testimonials exist but are invisible to search engines

Five named 5-star reviews are in the homepage HTML but have no schema markup. Star ratings cannot appear in SERPs or AI citation responses.

**Fix:** Add `AggregateRating` + `Review` schema to `index.html`. See Schema section for complete JSON-LD.

---

## Medium Priority Issues

### M1 — Security headers not consistently delivered

The `vercel.json` headers block uses `"source": "/(.*)"` but the rewrite conflict means CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy are not delivered on direct `.html` file requests. Only Vercel's platform-level HSTS is reliably present.

**Fix:** After fixing C1 (Vercel routing), ensure the headers block covers `.html` files explicitly:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

---

### M2 — Core Web Vitals risk: LCP and CLS

- Hero uses `<video preload="auto">` — likely the LCP element, no `<link rel="preload">` hint
- `background-attachment: fixed` on testimonials and blog sections — breaks on iOS Safari, causes mobile jank
- 7+ parallax images have no explicit `width`/`height` — causes Cumulative Layout Shift

**Fixes:**
```html
<!-- Add to <head> for hero video preload -->
<link rel="preload" as="video" href="[hero-video-src]">

<!-- Remove or wrap in @media for mobile -->
@media (max-width: 768px) {
  .testimonials-section { background-attachment: scroll; }
  .blog-header { background-attachment: scroll; }
}

<!-- Add width/height to all <img> tags -->
<img src="..." width="800" height="600" loading="lazy" alt="...">
```

---

### M3 — Product category descriptions are non-citable taglines

All 7 product category descriptions are marketing copy with zero specifications, model numbers, or clinical use-case context. AI systems cannot cite them.

Example current: `"High-yield concentrators and portable delivery systems engineered for uninterrupted respiratory support."`

Example improved: `"Philips EverFlo oxygen concentrators delivering up to 5 LPM at 93% purity, suitable for home oxygen therapy and hospital ward use. Available portable units for ambulatory patients. Serving Srinagar hospitals since 2000."`

---

### M4 — About page founder bio is generic, no credentials

`"extensive experience... integrity, dedication, and professionalism"` — adjective stacking with no substance. This is the #1 E-E-A-T anchor for a YMYL site.

**Rewrite approach:** Replace with specific verifiable history — what equipment categories Mr. Andrabi trained in, which hospital accounts were established first, what the technical progression from repair to distribution involved. Add a LinkedIn profile link.

---

### M5 — Blog exists as an empty page — active negative signal

A blog page with zero published articles signals to AI systems and Quality Raters that the site is incomplete. For a YMYL supplier, thin/absent content is actively penalised.

**Fix:** Publish minimum 2 articles per month, each with: visible publish date, author byline (`Syed Naseer Ahmad Andrabi, Founder`), 800+ words, and an embedded FAQ section. Suggested first articles:
1. "CPAP vs BiPAP vs APAP — Which Device Is Right for Sleep Apnea in Kashmir?"
2. "Medical Equipment Suppliers in Srinagar: What to Look for Before You Buy"
3. "How to Maintain an Oxygen Concentrator for Home Use"

---

### M6 — Using Gmail for business contact

`medicosgr@gmail.com` signals a missing digital infrastructure baseline for a 25-year institutional supplier. AI systems and Google Quality Raters notice.

**Fix:** Register a domain email (e.g., `info@medicosgr.in`) and update all page contact references, schema markup, and GBP listing.

---

### M7 — Site operating on vercel.app subdomain

A `vercel.app` subdomain limits brand authority and entity recognition in AI training data. A custom domain dramatically strengthens both.

**Fix:** Register `medicoclinic.in`, `medicokashmir.com`, or `medicosgr.in` and configure as the Vercel production domain.

---

## Low Priority Issues

- Twitter/X Card meta tags missing on all pages (add `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` to all pages)
- No IndexNow support / Bing Webmaster Tools verification (`msvalidate.01` tag absent)
- `Cache-Control: max-age=0` on all assets — prevents client-side caching; increase to `max-age=86400` for static HTML
- `sitemap.html` footer link resolves to `#` — either add real sitemap HTML page or remove the link
- No `Content-Signal:` directives in robots.txt — once routing fixed, add: `Content-Signal: ai-train=yes, search=yes, ai-retrieval=yes, ai-personalization=no`
- No `<noscript>` fallback for JS-rendered sections

---

## Category Deep Dives

### AI Citability (28/100)

**Citability by block:**

| Content Block | Score | Status |
|---|---|---|
| Founder + address + GST block | 68/100 | Near citation-ready |
| Alliance brands + partner count | 65/100 | Near citation-ready |
| About founding statement | 58/100 | Borderline |
| Footer identity tagline | 57/100 | Borderline |
| Named testimonials (product-specific) | 53/100 | Moderate |
| Product category descriptions | 28–33/100 | Citation-unlikely |
| Shop page (~40 words) | 8/100 | Invisible |
| Blog page (no articles) | 5/100 | Invisible |

Zero content blocks clear the 70/100 citation-ready threshold. The founding date + GST number + address block is the closest the site gets. No FAQ content, no product specs, no blog articles, no clinical use-case explanations exist. The site has pockets of good raw material but no architecture designed for AI extraction.

**Highest-leverage citability fixes:**
1. Add FAQPage schema with 5 Q&A pairs targeting local queries
2. Rewrite product category descriptions to include model names and specs
3. Publish blog articles with structured FAQ sections
4. Add `og:description` and publication dates everywhere

---

### Brand Authority (22/100)

| Platform | Status | Detail |
|---|---|---|
| Wikipedia | Absent | No article, no redirect, 404 |
| Reddit | Absent | Zero posts about this brand |
| LinkedIn | Absent | Company page returns 404 |
| YouTube | Unconfirmed | No official channel found |
| IndiaMART | **Confirmed** | 5-star listing, GST-verified, product catalog (Philips EverFlo, CPAP/BiPAP, ECG), annual turnover 1.5-5 Cr |
| JustDial | Unconfirmed | URL pattern did not resolve |
| Google Business Profile | Unconfirmed | Strong likelihood but not confirmed |

IndiaMART is the only confirmed third-party authority signal. It does not carry the entity-recognition weight of Wikipedia or LinkedIn.

**Highest-leverage brand authority actions:**
1. Create LinkedIn company page (fastest, free, high AI weight)
2. Create and verify Google Business Profile (unlocks Knowledge Graph for Gemini + AI Overviews)
3. Submit a Wikipedia stub article — 25-year operation, named founder, named global brand partnerships, GST-verified, 100+ institutional clients meets notability criteria for a regional business stub
4. Get listed on IndiaMART/JustDial with full NAP (one is already present — verify and expand)

---

### Content E-E-A-T (38/100)

**E-E-A-T dimension scores:**

| Dimension | Score | Key Gap |
|---|---|---|
| Experience | 8/25 | No case studies, no outcome data, no process documentation |
| Expertise | 9/25 | No credentials, no certifications, no technical content depth |
| Authoritativeness | 12/25 | GST + address + 25 years are strong, but no external citations or third-party validation |
| Trustworthiness | 17/25 | HTTPS, full address, phone — but dead Privacy Policy + Terms links are YMYL critical failures |

**YMYL flag:** This site operates in the highest-scrutiny category (medical device supply for direct patient care). The combination of an empty blog, dead legal pages, no professional certifications, no external validation, and generic founder copy means the site carries all the downside risk of YMYL classification with none of the upside. The foundation is sound — 25 years of real operation, real address, real GST, real brand partnerships — but it is not communicated with enough specificity to satisfy YMYL quality evaluation.

---

### Technical GEO (54/100)

**Rendering assessment:** Homepage is fully server-rendered — AI crawlers can read it. Shop and blog pages are JavaScript-rendered shells — AI crawlers see empty containers. This is the most impactful technical GEO failure.

**Key technical metrics:**

| Check | Status |
|---|---|
| HTTPS | ✅ Present |
| HSTS | ✅ Present (Vercel platform-level) |
| robots.txt | ⚠️ Exists but unreadable (Vercel rewrite) |
| sitemap.xml | ⚠️ Exists but unreadable + invalid namespace |
| llms.txt | ❌ Absent |
| Canonical tags | ❌ Missing all pages |
| JSON-LD | ❌ None |
| Meta descriptions | ⚠️ Only index.html |
| OG tags | ⚠️ Partial (index.html only) |
| Twitter Cards | ❌ None |
| CSP | ⚠️ Defined but inconsistently delivered |
| Mobile viewport | ✅ Correct |
| AI crawler directives | ⚠️ Wildcard allow (moot until routing fixed) |

---

### Schema & Structured Data (4/100)

**Confirmed schema found:** Zero. Not one `<script type="application/ld+json">` tag, not one `itemscope` attribute, not one RDFa property exists anywhere in the codebase. The 4 points awarded are for basic OG tags on index.html only.

**Schema opportunity map:**

| Page | Schema to Add | Priority |
|---|---|---|
| index.html | LocalBusiness + MedicalOrganization, WebSite + SearchAction, AggregateRating + Review (×5), ItemList (product categories), Organization | Critical |
| about.html | Person (founder), BreadcrumbList, FAQPage, Organization | Critical |
| shop.html | BreadcrumbList, ItemList, Organization | High |
| blog.html | BreadcrumbList, Organization | Medium |
| blog-post.html (future) | BlogPosting + speakable, Author Person, BreadcrumbList | High |

**Complete JSON-LD blocks are included in the Appendix.**

---

### Platform Optimization (29/100)

| Platform | Score | Top Gap |
|---|---|---|
| Google AI Overviews | 33/100 | No FAQ content, no question-based H2s, no schema |
| Google Gemini | 31/100 | No GBP, no LocalBusiness schema, no YouTube |
| Bing Copilot | 30/100 | No LinkedIn, no Bing Webmaster Tools, sitemap broken |
| Perplexity AI | 27/100 | No community validation (Reddit/Quora), no dated content |
| ChatGPT Web Search | 24/100 | No entity graph (no Wikipedia, no sameAs schema), brand name fragmented |

The three-action sequence that improves all five platforms simultaneously:
1. Fix sitemap.xml (correct namespace + domain URLs)
2. Standardize brand name
3. Add LocalBusiness + Organization JSON-LD with `sameAs` array

---

## Quick Wins (Implement This Week)

1. **Fix `vercel.json` routing** — Prevents robots.txt, sitemap.xml, and llms.txt from being served as HTML. This single fix unblocks every subsequent technical action. Effort: 30 minutes.

2. **Standardize brand name** — Change all `"Medico Group"` and `"Medico"` instances to `"Medico Scientific Service Centre"` across all page titles, footers, and meta descriptions. Effort: 1 hour.

3. **Fix sitemap.xml namespace** — Change `XMLSchema/0.1/` to `sitemap/0.9` and add `<lastmod>` dates. Effort: 15 minutes.

4. **Add LocalBusiness + MedicalOrganization JSON-LD to index.html and about.html** — Single most impactful schema action. Full template in Appendix A. Effort: 2 hours.

5. **Add canonical tags + meta descriptions to shop.html, about.html, blog.html** — 3 pages, each needs one `<link rel="canonical">` and one `<meta name="description">`. Copy from H3 and H4 fixes above. Effort: 30 minutes.

---

## 30-Day Action Plan

### Week 1: Infrastructure Unblock
- [ ] Fix `vercel.json` wildcard rewrite (C1) — unblocks everything below
- [ ] Fix sitemap.xml namespace + add lastmod (H2)
- [ ] Standardize brand name to "Medico Scientific Service Centre" across all pages (H1)
- [ ] Add canonical tags to all 4 pages (H4)
- [ ] Add meta descriptions to shop.html, about.html, blog.html (H3)
- [ ] Create and deploy `/llms.txt` (C5)
- [ ] Create actual Privacy Policy and Terms of Use pages (C4)

### Week 2: Schema Implementation
- [ ] Add LocalBusiness + MedicalOrganization JSON-LD to index.html and about.html (C3 / Appendix A)
- [ ] Add AggregateRating + Review schema to index.html — 5 existing testimonials (H8 / Appendix B)
- [ ] Add Person schema for founder to about.html (Appendix C)
- [ ] Add BreadcrumbList to shop.html, about.html, blog.html (Appendix D)
- [ ] Add FAQPage schema + visible FAQ section to about.html (Appendix E)
- [ ] Add WebSite + SearchAction schema to index.html (Appendix F)
- [ ] Add og:description + og:url + og:locale to index.html; add full OG to inner pages (H5)

### Week 3: Off-Page Entity Building
- [ ] Create and verify Google Business Profile (H6)
- [ ] Create LinkedIn company page for Medico Scientific Service Centre (H7)
- [ ] Register Bing Webmaster Tools + add msvalidate.01 tag + submit sitemap (M7 equivalent)
- [ ] Verify/update IndiaMART listing with current product catalog
- [ ] Register domain email (info@medicosgr.in) and update all contact references (M6)
- [ ] Register custom domain and configure as Vercel production domain (M7)

### Week 4: Content & Citability
- [ ] Fix Vercel security headers delivery for .html files (M1)
- [ ] Rewrite 7 product category descriptions with model names + clinical use-cases (M3)
- [ ] Rewrite founder biography with specific verifiable career history (M4)
- [ ] Publish first blog article: "CPAP vs BiPAP vs APAP in Kashmir" with FAQ section + author byline + publish date (M5)
- [ ] Add SSR fallback content to shop.html and blog.html so AI crawlers can read product listings (C2)
- [ ] Fix `background-attachment: fixed` for mobile, add `width`/`height` to images (M2)
- [ ] Add Twitter/X Card meta tags to all pages

---

## Score Projection

| Milestone | Expected Score | Timeline |
|---|---|---|
| After Week 1 (infrastructure) | ~38/100 | Day 7 |
| After Week 2 (schema complete) | ~50/100 | Day 14 |
| After Week 3 (off-page entities) | ~58/100 | Day 21 |
| After Week 4 (content + SSR) | ~66/100 | Day 30 |
| After 60-day content programme | ~74/100 | Day 60 |
| Full optimisation (Wikipedia + blog authority) | ~82/100 | Day 90+ |

---

## Appendix A: LocalBusiness + MedicalOrganization JSON-LD

Add to `<head>` of `index.html` and `about.html`:

```json
{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "MedicalOrganization"],
  "@id": "https://medico-inky.vercel.app/#organization",
  "name": "Medico Scientific Service Centre",
  "description": "Kashmir's trusted supplier of clinical-grade medical equipment including oxygen concentrators, CPAP/BiPAP machines, anaesthesia workstations, defibrillators, and critical care monitors. Serving hospitals, clinics, and families across Jammu & Kashmir since 2000.",
  "url": "https://medico-inky.vercel.app/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://medico-inky.vercel.app/favicon.ico"
  },
  "image": "https://medico-inky.vercel.app/images/medico_shop.webp",
  "telephone": "+91-9419008453",
  "email": "medicosgr@gmail.com",
  "foundingDate": "2000",
  "founder": {
    "@type": "Person",
    "@id": "https://medico-inky.vercel.app/about.html#founder",
    "name": "Syed Naseer Ahmad Andrabi",
    "jobTitle": "Founder & Proprietor"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "2nd Floor, Iqbal Complex, Opposite Iqbal Park, Central Market, Batamaloo",
    "addressLocality": "Srinagar",
    "addressRegion": "Jammu and Kashmir",
    "postalCode": "190009",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "34.0836",
    "longitude": "74.7973"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "09:00",
    "closes": "20:00"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-9419008453",
    "contactType": "customer service",
    "availableLanguage": ["English","Hindi","Urdu","Kashmiri"]
  },
  "areaServed": {
    "@type": "State",
    "name": "Jammu and Kashmir"
  },
  "knowsAbout": [
    "Oxygen concentrators","CPAP machines","BiPAP machines",
    "Anaesthesia workstations","Defibrillators","Critical care monitors",
    "Medical equipment maintenance","Respiratory equipment"
  ],
  "taxID": "01AALPI4731K1ZV",
  "sameAs": [
    "REPLACE_WITH_GOOGLE_BUSINESS_PROFILE_URL",
    "REPLACE_WITH_LINKEDIN_COMPANY_URL",
    "REPLACE_WITH_FACEBOOK_URL",
    "REPLACE_WITH_INDIAMART_URL"
  ]
}
```

---

## Appendix B: AggregateRating + Review JSON-LD

Add to `index.html` (separate `<script>` block):

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://medico-inky.vercel.app/#organization",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "5",
    "reviewCount": "5"
  },
  "review": [
    {
      "@type": "Review",
      "author": {"@type": "Person", "name": "Zishan Kashani"},
      "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
      "reviewBody": "The best service providers. Very cooperative staff. Flawless compliance and maintenance routines."
    },
    {
      "@type": "Review",
      "author": {"@type": "Person", "name": "Mushtaq A Siddiqi"},
      "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
      "reviewBody": "Very professional and prompt services. The hardware quality and post-sale courtesies are too obvious."
    },
    {
      "@type": "Review",
      "author": {"@type": "Person", "name": "Ikra Nabi"},
      "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
      "reviewBody": "Best for CPAP, BIPAP, and critical medical equipments in the Srinagar region. Unmatched expertise."
    },
    {
      "@type": "Review",
      "author": {"@type": "Person", "name": "Wajid Nazir"},
      "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
      "reviewBody": "It's one of the best service centres in Kashmir. The owner is highly knowledgeable, and the staff is intensely professional."
    },
    {
      "@type": "Review",
      "author": {"@type": "Person", "name": "Nanuboya Renzoo"},
      "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
      "reviewBody": "CPAP is one of the best products. Using it for my father for the last few months. His condition has improved vastly due to the reliable equipment."
    }
  ]
}
```

---

## Appendix C: Person (Founder) JSON-LD

Add to `about.html`:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://medico-inky.vercel.app/about.html#founder",
  "name": "Syed Naseer Ahmad Andrabi",
  "jobTitle": "Founder & Proprietor",
  "worksFor": {"@id": "https://medico-inky.vercel.app/#organization"},
  "knowsAbout": [
    "Medical equipment supply","Respiratory devices","Oxygen therapy",
    "CPAP and BiPAP therapy","Medical device distribution in Jammu and Kashmir"
  ],
  "sameAs": ["REPLACE_WITH_LINKEDIN_PROFILE_URL"]
}
```

---

## Appendix D: BreadcrumbList JSON-LD

Add to respective pages:

```json
// shop.html
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://medico-inky.vercel.app/"},
    {"@type": "ListItem", "position": 2, "name": "Medical Equipment", "item": "https://medico-inky.vercel.app/shop.html"}
  ]
}

// about.html
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://medico-inky.vercel.app/"},
    {"@type": "ListItem", "position": 2, "name": "About Us", "item": "https://medico-inky.vercel.app/about.html"}
  ]
}

// blog.html
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://medico-inky.vercel.app/"},
    {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://medico-inky.vercel.app/blog.html"}
  ]
}
```

---

## Appendix E: FAQPage JSON-LD

Add to `about.html` or new FAQ section on `index.html`:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What types of medical equipment does Medico Scientific Service Centre supply in Kashmir?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Medico Scientific Service Centre supplies clinical-grade medical equipment across Jammu & Kashmir, including oxygen concentrators and portable delivery systems, CPAP and BiPAP machines for sleep apnea and non-invasive ventilation, anaesthesia workstations, defibrillators and resuscitation devices, critical care patient monitors, diagnostic equipment, and surgical instruments. We serve hospitals, nursing homes, clinics, and individual patients."
      }
    },
    {
      "@type": "Question",
      "name": "Where is Medico Scientific Service Centre located in Srinagar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Medico Scientific Service Centre is at 2nd Floor, Iqbal Complex, Opposite Iqbal Park, Central Market, Batamaloo, Srinagar, Jammu and Kashmir 190009. Open 7 days a week. Phone: +91 9419008453. Email: medicosgr@gmail.com."
      }
    },
    {
      "@type": "Question",
      "name": "Does Medico Scientific Service Centre provide after-sales service and maintenance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Medico Scientific Service Centre provides professional installation, staff training, preventive maintenance, and repair services for all equipment supplied. Technical support is available 7 days a week."
      }
    },
    {
      "@type": "Question",
      "name": "Which medical equipment brands does Medico Scientific Service Centre deal in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Medico Scientific Service Centre is an authorised partner for Philips (respiratory and sleep therapy), Schiller (diagnostics and pulmonary function testing), and Shalya (surgical equipment)."
      }
    },
    {
      "@type": "Question",
      "name": "How long has Medico Scientific Service Centre been operating in Jammu & Kashmir?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Founded in 2000 by Mr. Syed Naseer Ahmad Andrabi, Medico Scientific Service Centre has over 25 years of operation and serves 100+ healthcare partners across Jammu & Kashmir."
      }
    }
  ]
}
```

---

## Appendix F: WebSite + SearchAction JSON-LD

Add to `index.html`:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://medico-inky.vercel.app/#website",
  "url": "https://medico-inky.vercel.app/",
  "name": "Medico Scientific Service Centre",
  "description": "Kashmir's trusted partner for clinical-grade respiratory and life-support medical equipment since 2000.",
  "publisher": {"@id": "https://medico-inky.vercel.app/#organization"},
  "inLanguage": "en-IN"
}
```

---

## Appendix G: Pages Analyzed

| URL | Title | Critical Issues | GEO Issues Total |
|---|---|---|---|
| https://medico-inky.vercel.app/ | Medico Scientific Service Centre \| Medical Equipment Kashmir | C3, H4, H5 incomplete OG | 9 |
| https://medico-inky.vercel.app/shop.html | Medico \| Professional Medical Equipment | C2 (JS-rendered), C3, H1, H3, H4, H5 | 12 |
| https://medico-inky.vercel.app/about.html | Medico Group \| About Us | C3, C4, H1, H3, H4, H5 | 11 |
| https://medico-inky.vercel.app/blog.html | Medico Group \| Insights & Updates | C2 (JS-rendered, no posts), C3, H1, H3, H4, H5 | 13 |

---

*Generated by GEO Audit Skill — Claude Code*
*Audit methodology: Georgia Tech / Princeton / IIT Delhi GEO framework (2024)*
