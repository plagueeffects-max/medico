// Readers and output mappers for posts and products. Every public output of a post
// (API JSON, SSR, llms.txt, JSON-LD) goes through postOut, which strips writer markers.
const { query, withTimeout } = require('./db');
const { stripMarkers } = require('./sanitize');
const { rootPath, readTimeOf, escHtml } = require('./text');

const IST = 'Asia/Kolkata';
const istDate = (d) => (d ? new Date(d).toLocaleDateString('en-CA', { timeZone: IST }) : '');
const istTime = (d) => (d ? new Date(d).toLocaleTimeString('en-GB', { timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: false }) : '');

const isIndexable = (row) => !row.ai_generated || Boolean(row.reviewed_at);
const LIVE = `status = 'published' AND (published_at IS NULL OR published_at <= now())`;

/** Public post shape: identical to defaultBlogs entries in assets/js/blog-data.js, plus optional extras. */
function postOut(row) {
  let content = stripMarkers(row.content || '');
  // FAQ entries from the editor are shown in the article (FAQ structured data must match visible text)
  const faq = (Array.isArray(row.faq) ? row.faq : []).filter((f) => f && f.q && f.a && !content.includes(escHtml(f.q)));
  if (faq.length) content += `\n<h2>Frequently asked questions</h2>\n${faq.map((f) => `<h3>${escHtml(f.q)}</h3>\n<p>${escHtml(f.a)}</p>`).join('\n')}`;
  const out = {
    id: row.id,
    title: row.title,
    subheading: row.excerpt || '',
    category: row.category,
    author: row.author || 'Medico Team',
    date: istDate(row.published_at || row.created_at),
    time: istTime(row.published_at || row.created_at),
    readTime: row.read_time || readTimeOf(content),
    image: rootPath(row.cover_image) || '/images/blog-featured-icu.webp',
    galleryImages: (row.gallery_images || []).map(rootPath),
    content,
    featured: Boolean(row.is_featured),
    slug: row.slug,
    metaTitle: row.meta_title || row.title,
    metaDescription: row.meta_description || row.excerpt || '',
  };
  if (row.cover_credit && row.cover_credit.text) out.coverCredit = { text: row.cover_credit.text, url: row.cover_credit.url || '' };
  return out;
}

/** Public product shape: identical to defaultProducts entries, optional fields only when set. */
function productOut(row) {
  const out = {
    id: row.id,
    title: row.title,
    category: row.category,
    brand: row.brand,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    originalPrice: row.original_price === null || row.original_price === undefined ? null : Number(row.original_price),
    stock: row.stock,
    description: row.description,
    mainImage: rootPath(row.main_image) || '/images/products/oxygen.webp',
    features: row.features || [],
  };
  if ((row.gallery_images || []).length) out.galleryImages = row.gallery_images.map(rootPath);
  if (row.long_description) out.longDescription = stripMarkers(row.long_description);
  if ((row.specifications || []).length) out.specifications = row.specifications;
  if (row.in_the_box) out.inTheBox = row.in_the_box;
  if (row.sku) out.sku = row.sku;
  return out;
}

const getPublishedPostRows = () =>
  withTimeout(query(`SELECT * FROM medico_blog_posts WHERE ${LIVE} ORDER BY is_featured DESC, published_at DESC NULLS LAST`));

/** By id or slug, live posts only. */
async function getPostRow(idOrSlug) {
  const rows = await withTimeout(query(`SELECT * FROM medico_blog_posts WHERE (id = $1 OR slug = $1) AND ${LIVE} LIMIT 1`, [idOrSlug]));
  return rows[0] || null;
}

const getProductRows = () => withTimeout(query(`SELECT * FROM medico_products WHERE is_visible ORDER BY sort_order, created_at`));
async function getProductRow(id) {
  const rows = await withTimeout(query(`SELECT * FROM medico_products WHERE id = $1 AND is_visible LIMIT 1`, [id]));
  return rows[0] || null;
}

module.exports = { postOut, productOut, isIndexable, getPublishedPostRows, getPostRow, getProductRows, getProductRow, istDate };
