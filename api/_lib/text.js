// Small text helpers shared by the API, the seed script and the writer.

function slugify(text, max = 80) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '');
}

const plainText = (html) =>
  String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Stored paths are root-relative ("/images/x.webp"); older data used "images/x.webp". */
const rootPath = (u) => {
  const s = String(u || '').trim();
  if (!s || /^(https?:|data:|\/)/i.test(s)) return s;
  return `/${s}`;
};

const readTimeOf = (html) => `${Math.max(2, Math.round(plainText(html).split(/\s+/).length / 200))} min read`;

const str = (v, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v, maxItems = 30, max = 300) => (Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, maxItems) : []);

module.exports = { slugify, plainText, escHtml, rootPath, readTimeOf, str, strList };
