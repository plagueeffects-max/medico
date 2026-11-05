// Allow-list sanitizers. Everything saved from the admin editor or the AI writer passes
// through these before it is stored, so public pages can insert it as HTML.

const ARTICLE_TAGS = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'a', 'br', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'figure', 'figcaption', 'code', 'pre']);
const INLINE_TAGS = new Set(['span', 'strong', 'em', 'b', 'i', 'br', 'a']);
const ARTICLE_RENAME = { b: 'strong', i: 'em', h1: 'h2', h5: 'h4', h6: 'h4', div: 'p', caption: 'figcaption' };
const VOID = new Set(['br', 'hr', 'img']);

const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '').trim() : '';
};
const q = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const safeHref = (url) => /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) && !/^\/\//.test(url);
const safeImg = (url) => /^(\/media\/|\/images\/|\/Blog Assets\/|\/Products\/|https:\/\/)/i.test(url);

function linkTag(attrs) {
  const url = attr(attrs, 'href');
  if (!safeHref(url)) return '<a>';
  const external = /^https?:\/\//i.test(url);
  return `<a href="${q(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>`;
}

function clean(html, profile) {
  const allowed = profile === 'inline' ? INLINE_TAGS : ARTICLE_TAGS;
  const rename = profile === 'inline' ? {} : ARTICLE_RENAME;
  return String(html || '')
    .replace(/<(script|style|iframe|object|embed|noscript|template|svg|math|form|textarea|select)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, rawTag, attrs) => {
      const closing = match.startsWith('</');
      const tag = rename[rawTag.toLowerCase()] || rawTag.toLowerCase();
      if (!allowed.has(tag)) return '';
      if (closing) return VOID.has(tag) ? '' : `</${tag}>`;
      if (tag === 'a') return linkTag(attrs);
      if (tag === 'img') {
        const src = attr(attrs, 'src');
        if (!safeImg(src)) return '';
        const alt = attr(attrs, 'alt');
        return `<img src="${q(src)}" alt="${q(alt)}" loading="lazy">`;
      }
      if (tag === 'span') {
        const cls = attr(attrs, 'class').replace(/[^\w\s-]/g, '').trim();
        return cls ? `<span class="${cls}">` : '<span>';
      }
      if ((tag === 'th' || tag === 'td')) {
        const span = attr(attrs, 'colspan');
        return /^\d{1,2}$/.test(span) ? `<${tag} colspan="${span}">` : `<${tag}>`;
      }
      return VOID.has(tag) ? `<${tag}>` : `<${tag}>`;
    })
    .replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '')
    .trim();
}

const sanitizeArticle = (html) => clean(html, 'article');
const sanitizeInline = (html) => clean(html, 'inline');

/** Remove writer markers so they never reach visitors, crawlers, feeds or JSON-LD. */
function stripMarkers(html) {
  return String(html || '')
    // A flag quoted as a block
    .replace(/<blockquote>\s*<p>\s*\[FLAG[\s\S]*?<\/blockquote>/gi, '')
    // A flag paragraph followed by its Intent/Problem/What would help paragraphs (only directly after a flag)
    .replace(/<p>\s*(<strong>)?\s*\[FLAG[^<]*(<\/strong>[^<]*)?<\/p>(\s*<p>\s*(<strong>)?\s*(Intent|Problem|What would help)\s*:[\s\S]*?<\/p>)*/gi, '')
    // Anywhere else: from the [FLAG token to the end of its enclosing block
    .replace(/\[FLAG[\s\S]*?(?=<\/(p|li|td|th|h[2-4]|blockquote)>|$)/gi, '')
    .replace(/\s*\[NEEDS SOURCE\]/gi, '')
    .replace(/<(p|li)>(\s|&nbsp;|<br>|<strong>\s*<\/strong>)*<\/\1>/g, '');
}

/** Marker counts for the editor checklist. */
const countMarkers = (html) => ({
  needsSource: (String(html).match(/\[NEEDS SOURCE\]/gi) || []).length,
  flags: (String(html).match(/\[FLAG/gi) || []).length,
  unverified: (String(html).match(/\bUnverified\b/g) || []).length,
});

module.exports = { sanitizeArticle, sanitizeInline, stripMarkers, countMarkers };

if (require.main === module) {
  const assert = require('assert');
  assert.strictEqual(sanitizeArticle('<p onclick="x()">Hi<script>alert(1)</script></p>'), '<p>Hi</p>');
  assert.strictEqual(sanitizeArticle('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
  assert.strictEqual(sanitizeArticle('<img src="/media/a.webp" onerror="x">'), '<img src="/media/a.webp" alt="" loading="lazy">');
  assert.strictEqual(sanitizeArticle('<img src="data:image/svg+xml,...">'), '');
  assert.strictEqual(sanitizeInline('<span class="text-muted" style="x">a</span><div>b</div>'), '<span class="text-muted">a</span>b');
  assert.strictEqual(stripMarkers('<p>A claim [NEEDS SOURCE].</p><p>[FLAG: Writer input needed] Intent: x. Problem: y. What would help: z.</p>'), '<p>A claim.</p>');
  // Flag split over several paragraphs
  assert.strictEqual(stripMarkers('<p>[FLAG: Writer input needed]</p><p>Intent: x</p><p>Problem: y</p><p>What would help: z</p><p>Next.</p>'), '<p>Next.</p>');
  // Mid-paragraph and in a table cell: the flag text never leaks
  assert.strictEqual(stripMarkers('<p>Units cost less. [FLAG: Writer input needed] Intent: price. Problem: none supplied.</p>'), '<p>Units cost less. </p>');
  assert.strictEqual(stripMarkers('<td>[FLAG: Writer input needed] Intent: x</td>'), '<td></td>');
  // A real "Problem:" paragraph survives
  assert.strictEqual(stripMarkers('<p>Problem: the sieve beds clog in damp rooms.</p>'), '<p>Problem: the sieve beds clog in damp rooms.</p>');
  console.log('sanitize ok');
}
