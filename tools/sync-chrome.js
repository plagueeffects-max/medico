// Stamps the shared head, header, footer and dialog from partials/ into every
// public page, between the <!-- @name --> ... <!-- /@name --> markers.
// Run after editing anything in partials/:  node tools/sync-chrome.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = ['index.html', 'about.html', 'shop.html', 'product.html', 'blog.html', 'blog-post.html', 'privacy-policy.html', 'terms.html'];
const blocks = ['head', 'header', 'footer', 'dialog'];

const partial = (name) => fs.readFileSync(path.join(root, 'partials', `${name}.html`), 'utf8').replace(/\s+$/, '');

let failed = false;
for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');
  for (const name of blocks) {
    const re = new RegExp(`<!-- @${name} -->[\\s\\S]*?<!-- /@${name} -->`);
    if (!re.test(html)) { console.error(`${page}: missing @${name} markers`); failed = true; continue; }
    html = html.replace(re, () => `<!-- @${name} -->\n${partial(name)}\n  <!-- /@${name} -->`);
  }
  // Root-relative paths so pages also work when served from nested URLs (/blog/slug)
  html = html.replace(/(\s(?:href|src|poster|data-src-sm|data-src-lg)=")(?!\/|https?:|mailto:|tel:|#|data:)((?:assets|images|favicon)\/|(?:index|shop|about|blog|blog-post|product|privacy-policy|terms)\.html)/g, '$1/$2');
  html = html.replace(/(srcset=")([^"]+)"/g, (m, a, list) => a + list.split(',').map((s) => s.trim().replace(/^(?!\/|https?:)(images\/)/, '/$1')).join(', ') + '"');
  fs.writeFileSync(file, html);
  console.log(`stamped ${page}`);
}
process.exit(failed ? 1 : 0);
