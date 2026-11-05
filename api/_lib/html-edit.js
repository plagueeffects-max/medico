// Edits HTML templates by splicing the original string at parser offsets, so everything
// not explicitly changed stays byte-identical (no re-serialisation by the parser).
const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const { sanitizeInline } = require('./sanitize');

const ROOT = path.join(__dirname, '..', '..');

// Public pages whose [data-copy] text the admin can edit, in admin display order
const PAGES = {
  index: { file: 'index.html', label: 'Home' },
  about: { file: 'about.html', label: 'About' },
  shop: { file: 'shop.html', label: 'Products' },
  blog: { file: 'blog.html', label: 'Blog' },
  post: { file: 'blog-post.html', label: 'Article page' },
  product: { file: 'product.html', label: 'Product page' },
  privacy: { file: 'privacy-policy.html', label: 'Privacy policy' },
  terms: { file: 'terms.html', label: 'Terms' },
};

const cache = new Map();
/** Template source; cached per instance on Vercel (files never change after deploy). */
function readTemplate(file) {
  if (process.env.VERCEL && cache.has(file)) return cache.get(file);
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  cache.set(file, html);
  return html;
}

/** End offset of an element's opening tag (quote-aware, so ">" inside attributes is skipped). */
function openTagEnd(html, start) {
  let quote = null;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quote) { if (c === quote) quote = null; } else if (c === '"' || c === "'") quote = c; else if (c === '>') return i + 1;
  }
  return html.length;
}

/** Offsets of an element: outer [start,end], opening tag end, inner [innerStart,innerEnd]. */
function spans(html, el) {
  const [start, end] = el.range;
  const open = openTagEnd(html, start);
  const closeLen = `</${el.rawTagName}>`.length;
  const hasClose = html.slice(end - closeLen, end).toLowerCase() === `</${el.rawTagName.toLowerCase()}>`;
  return { start, end, open, innerStart: open, innerEnd: hasClose ? end - closeLen : open };
}

class Editor {
  constructor(html) {
    this.html = html;
    this.root = parse(html, { comment: false, blockTextElements: { script: true, style: true, noscript: true, pre: true } });
    this.edits = [];
  }
  $(sel) { return this.root.querySelector(sel); }
  $$(sel) { return this.root.querySelectorAll(sel); }
  add(start, end, text, weak = false) {
    // Overlapping edits: strong (page data) beats weak (site copy); first strong edit wins
    const clash = this.edits.findIndex((e) => start < e.end && end > e.start);
    if (clash !== -1) {
      if (weak || !this.edits[clash].weak) return false;
      this.edits.splice(clash, 1);
    }
    this.edits.push({ start, end, text, weak });
    return true;
  }
  inner(el, html, weak = false) { if (!el) return; const s = spans(this.html, el); this.add(s.innerStart, s.innerEnd, html, weak); }
  outer(el, html) { if (!el) return; this.add(el.range[0], el.range[1], html); }
  /** Rewrite an element's opening tag: set/remove attributes, keep everything else. */
  attrs(el, changes) {
    if (!el) return;
    const s = spans(this.html, el);
    let tag = this.html.slice(s.start, s.open);
    for (const [name, value] of Object.entries(changes)) {
      const re = new RegExp(`\\s${name}(\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+))?(?=[\\s>/])`, 'i');
      tag = tag.replace(re, '');
      if (value !== null && value !== undefined && value !== false) {
        const v = value === true ? '' : `="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
        tag = tag.replace(/\s*(\/?)>$/, ` ${name}${v}$1>`);
      }
    }
    this.add(s.start, s.open, tag);
  }
  insertBefore(el, html) { if (el) this.add(el.range[0], el.range[0], html); }
  /** Insert just before </head> or </body>. */
  appendTo(tagName, html) {
    const i = this.html.toLowerCase().lastIndexOf(`</${tagName}>`);
    if (i !== -1) this.edits.push({ start: i, end: i, text: html, weak: false });
  }
  toString() {
    let out = this.html;
    for (const e of [...this.edits].sort((a, b) => b.start - a.start || b.end - a.end)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
    return out;
  }
}

/** Every [data-copy] element in a page: key, label, default inner HTML. */
function copyFields(file) {
  const html = readTemplate(file);
  const root = parse(html, { comment: false });
  return root.querySelectorAll('[data-copy]').map((el) => {
    const s = spans(html, el);
    return { key: el.getAttribute('data-copy'), label: el.getAttribute('data-copy-label') || '', value: html.slice(s.innerStart, s.innerEnd).trim() };
  });
}

/** Apply site-copy overrides as weak edits (page data wins on overlap). */
function applyCopy(ed, overrides) {
  if (!overrides || !overrides.size) return;
  for (const el of ed.$$('[data-copy]')) {
    const key = el.getAttribute('data-copy');
    if (overrides.has(key)) ed.inner(el, sanitizeInline(overrides.get(key)), true);
  }
}

module.exports = { Editor, PAGES, readTemplate, copyFields, applyCopy, spans };
