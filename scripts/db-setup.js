/**
 * Creates / upgrades every medico_* table and adds the starter content.
 * Safe to run any number of times: CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
 * seed rows ON CONFLICT DO NOTHING. No DROP, DELETE or TRUNCATE.
 * The same Neon database is shared with other projects, so only medico_* tables are touched.
 *
 *   node scripts/db-setup.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { neon } = require('@neondatabase/serverless');
const { slugify, rootPath, readTimeOf } = require('../api/_lib/text');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (environment or .env).');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const q = (text, params = []) => sql.query(text, params);

/** Run a browser data script in a sandbox and return its top-level constants. */
function loadBrowserData(file, names) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const store = {};
  const ctx = {
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    window: {}, document: { addEventListener() {} }, console,
    fetch: () => Promise.reject(new Error('offline')),
  };
  vm.createContext(ctx);
  vm.runInContext(`${code}\n;this.__out = { ${names.map((n) => `${n}: typeof ${n} !== 'undefined' ? ${n} : null`).join(', ')} };`, ctx);
  return ctx.__out;
}

async function schema() {
  await q(`CREATE TABLE IF NOT EXISTS medico_blog_posts (
    id VARCHAR(100) PRIMARY KEY,
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(250) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL DEFAULT '',
    cover_image VARCHAR(500),
    gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    category VARCHAR(80) NOT NULL DEFAULT 'Industry News',
    author VARCHAR(120) NOT NULL DEFAULT 'Medico Team',
    read_time VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    meta_title VARCHAR(250),
    meta_description TEXT,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    source_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`);
  await q(`ALTER TABLE medico_blog_posts ADD COLUMN IF NOT EXISTS topic VARCHAR(200)`);
  await q(`ALTER TABLE medico_blog_posts ADD COLUMN IF NOT EXISTS cover_credit JSONB`);
  // AI articles stay noindex and out of the sitemap until a person reviews them
  await q(`ALTER TABLE medico_blog_posts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`);
  await q(`ALTER TABLE medico_blog_posts ADD COLUMN IF NOT EXISTS blog_type VARCHAR(40)`);
  // Writer's end-of-draft checks and the approved outline; never shown publicly
  await q(`ALTER TABLE medico_blog_posts ADD COLUMN IF NOT EXISTS checks JSONB`);
  await q(`ALTER TABLE medico_blog_posts ADD COLUMN IF NOT EXISTS outline JSONB`);
  await q(`ALTER TABLE medico_blog_posts ADD COLUMN IF NOT EXISTS faq JSONB`);
  await q(`CREATE INDEX IF NOT EXISTS idx_medico_blog_posts_live ON medico_blog_posts(status, published_at DESC)`);

  await q(`CREATE TABLE IF NOT EXISTS medico_blog_sources (
    id VARCHAR(100) PRIMARY KEY,
    query VARCHAR(250),
    title VARCHAR(300),
    url TEXT UNIQUE NOT NULL,
    snippet TEXT,
    published_date TIMESTAMPTZ,
    used_in_post_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now()
  )`);

  await q(`CREATE TABLE IF NOT EXISTS medico_blog_topics (
    id VARCHAR(40) PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
    keyword VARCHAR(160) NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    blog_type VARCHAR(40),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    times_used INT NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    cover_image VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT now()
  )`);
  await q(`CREATE UNIQUE INDEX IF NOT EXISTS idx_medico_blog_topics_keyword ON medico_blog_topics(lower(keyword))`);

  // run_day is unique: at most one automatic article per day; failed runs clear it so a retry is allowed
  await q(`CREATE TABLE IF NOT EXISTS medico_blog_runs (
    id VARCHAR(40) PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
    run_day DATE UNIQUE,
    trigger VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    topic VARCHAR(200),
    blog_type VARCHAR(40),
    post_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now()
  )`);
  await q(`CREATE INDEX IF NOT EXISTS idx_medico_blog_runs_created ON medico_blog_runs(created_at DESC)`);

  // Pictures, shrunk to WebP in the browser before upload
  await q(`CREATE TABLE IF NOT EXISTS medico_media (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(200),
    mime VARCHAR(50) NOT NULL,
    data BYTEA NOT NULL,
    bytes INT NOT NULL,
    width INT,
    height INT,
    credit JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
  )`);

  await q(`CREATE TABLE IF NOT EXISTS medico_admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`);

  // Overrides for [data-copy] elements in the public HTML; the HTML file holds the default
  await q(`CREATE TABLE IF NOT EXISTS medico_site_copy (
    key VARCHAR(200) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`);

  await q(`CREATE TABLE IF NOT EXISTS medico_products (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT '',
    brand VARCHAR(100) NOT NULL DEFAULT '',
    price NUMERIC(12,2),
    original_price NUMERIC(12,2),
    stock VARCHAR(60) NOT NULL DEFAULT 'In Stock',
    description TEXT NOT NULL DEFAULT '',
    main_image VARCHAR(500),
    gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    long_description TEXT,
    specifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    in_the_box TEXT,
    sku VARCHAR(100),
    sort_order INT NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`);
  await q(`CREATE INDEX IF NOT EXISTS idx_medico_products_order ON medico_products(sort_order, created_at)`);

  await q(`CREATE TABLE IF NOT EXISTS medico_inquiries (
    id VARCHAR(40) PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
    name VARCHAR(80) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(200),
    organisation VARCHAR(200),
    interest VARCHAR(200),
    message TEXT,
    page VARCHAR(300),
    ip_hash VARCHAR(64),
    user_agent VARCHAR(300),
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    notes TEXT,
    handled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  )`);
  await q(`CREATE INDEX IF NOT EXISTS idx_medico_inquiries_ip ON medico_inquiries(ip_hash, created_at DESC)`);
  await q(`CREATE INDEX IF NOT EXISTS idx_medico_inquiries_created ON medico_inquiries(created_at DESC)`);

  // Failed admin sign-ins, for rate limiting across serverless instances
  await q(`CREATE TABLE IF NOT EXISTS medico_login_attempts (
    id VARCHAR(40) PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
    ip_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`);
  await q(`CREATE INDEX IF NOT EXISTS idx_medico_login_attempts ON medico_login_attempts(ip_hash, created_at DESC)`);
}

async function starterContent() {
  const { defaultBlogs } = loadBrowserData('assets/js/blog-data.js', ['defaultBlogs']);
  const { ProductsDB } = loadBrowserData('assets/js/products-data.js', ['ProductsDB']);
  const defaultProducts = (ProductsDB && ProductsDB.defaultProducts) || [];

  for (const b of defaultBlogs || []) {
    const slug = /^\d+$/.test(b.id) ? slugify(b.title) : slugify(b.id);
    const at = `${b.date}T${b.time || '09:00'}:00+05:30`;
    await q(
      `INSERT INTO medico_blog_posts (id, slug, title, excerpt, content, cover_image, gallery_images, category, author, read_time,
         status, published_at, is_featured, ai_generated, reviewed_at, meta_title, meta_description, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,'published',$11,$12,false,$11,$3,$4,$11,$11)
       ON CONFLICT DO NOTHING`,
      [b.id, slug, b.title, b.subheading || '', String(b.content || '').trim(), rootPath(b.image),
       JSON.stringify((b.galleryImages || []).map(rootPath)), b.category || 'Industry News', b.author || 'Medico Team',
       b.readTime || readTimeOf(b.content), at, Boolean(b.featured)]
    );
  }

  for (const [i, p] of defaultProducts.entries()) {
    await q(
      `INSERT INTO medico_products (id, title, category, brand, price, original_price, stock, description, main_image, features, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11) ON CONFLICT DO NOTHING`,
      [p.id, p.title, p.category || '', p.brand || '', p.price ?? null, p.originalPrice ?? null, p.stock || 'In Stock',
       p.description || '', rootPath(p.mainImage), JSON.stringify(p.features || []), i + 1]
    );
  }

  const topics = [
    ['Oxygen therapy at home', 'Choosing and running an oxygen concentrator at home, cylinders as backup, service and filters', 'problem-solution'],
    ['CPAP and sleep apnoea', 'What CPAP/BiPAP does, mask fit, humidifiers, cleaning; diagnosis is by a doctor', 'guide'],
    ['AMC and biomedical maintenance', 'Annual maintenance contracts, preventive maintenance, calibration for hospitals in J&K', 'guide'],
    ['Setting up an ICU', 'Equipment checklist for new ICU beds: monitors, ventilators, infusion, power backup', 'list'],
    ['Anaesthesia workstation care', 'Daily checks, leak tests, vaporiser care, servicing schedule', 'how-to'],
    ['NABH equipment readiness', 'Equipment records, calibration certificates and maintenance logs hospitals keep ready for NABH', 'how-to'],
    ['Winter power backup for oxygen concentrators in Kashmir', 'Power cuts in winter, UPS/inverter sizing, cylinder backup, safe placement', 'problem-solution'],
    ['Patient monitors for clinics and nursing homes', 'Parameters, modularity, central station, service support', 'comparison'],
    ['Defibrillators and AEDs', 'AED vs manual defibrillator, where to place AEDs, battery and pad checks', 'comparison'],
    ['Home care equipment for elderly patients', 'Oxygen, suction, nebulisers, hospital beds; buying vs renting', 'list'],
  ];
  for (const [keyword, notes, type] of topics) {
    await q(`INSERT INTO medico_blog_topics (keyword, notes, blog_type) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [keyword, notes, type]);
  }
}

async function main() {
  console.log('Setting up medico_* tables...');
  await schema();
  await starterContent();
  const rows = await q(`SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'medico\\_%' ORDER BY table_name`);
  for (const { table_name } of rows) {
    // table names come from information_schema and are prefix-checked, so interpolation is safe
    if (!/^medico_[a-z_]+$/.test(table_name)) continue;
    const [{ n }] = await q(`SELECT count(*)::int AS n FROM ${table_name}`);
    console.log(`  ${table_name.padEnd(24)} ${n}`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
