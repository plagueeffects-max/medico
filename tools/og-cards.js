// Renders the link-preview cards (WhatsApp, iMessage, LinkedIn, X) into images/og/.
//   node tools/og-cards.js        (needs Playwright installed locally; not a site dependency)
// Page cards are finished 1200x630 JPGs. The two frame PNGs are transparent overlays that
// api/public.js lays over an article cover or product photo to build those cards on demand.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'og');
const url = (p) => `file:///${path.join(ROOT, p).replace(/\\/g, '/')}`;

// Each card: a short label for the page, and the photo that frames the brand on wide previews
const CARDS = [
  { file: 'home', photo: 'images/hero-poster.webp', pos: '70% 40%', label: 'Medical equipment &amp; service' },
  { file: 'about', photo: 'images/about-hero.webp', pos: '55% 60%', label: 'Serving Kashmir since 2000' },
  { file: 'shop', photo: 'images/shop-hero.webp', pos: '78% 50%', label: 'Equipment catalogue' },
  { file: 'blog', photo: 'images/blog-featured-icu.webp', pos: '50% 50%', label: 'The Medico blog' },
];

const MARK = '<svg viewBox="0 0 64 64"><path d="M8 34h9l3.5-6 4.5 11 6.5-25 6.5 33 4.5-17 3 4h10"/></svg>';
const base = `
  @font-face { font-family: Inter; font-weight: 500; src: url('${url('assets/fonts/inter-500.woff2')}'); }
  @font-face { font-family: Inter; font-weight: 600; src: url('${url('assets/fonts/inter-600.woff2')}'); }
  @font-face { font-family: Inter; font-weight: 800; src: url('${url('assets/fonts/inter-800.woff2')}'); }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; background: transparent; font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; }
  .lockup { display: inline-flex; align-items: center; gap: 14px; text-align: left; }
  .mark { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 15px; background: #fff; box-shadow: 0 8px 24px -10px rgba(0,0,0,.5); }
  .mark svg { width: 40px; height: 40px; fill: none; stroke: #e5181f; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
  .name { font-size: 30px; font-weight: 800; letter-spacing: -.04em; line-height: 1; }
  .name b { color: #ff3b30; }
  .sub { margin-top: 6px; font-size: 11px; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; opacity: .7; }`;

const lockup = (dark) => `<div class="lockup" style="color:${dark ? '#090d16' : '#fff'}"><span class="mark">${MARK}</span><span><div class="name">Medico<b>.</b></div><div class="sub">Scientific Service Centre</div></span></div>`;

// Centre safe zone: WhatsApp's compact preview crops the middle 630x630 square and shrinks it to
// about 80px, so only the brand emblem lives there, big enough to read as an app icon. The page's
// title and description already sit beside the thumbnail as native text, so none is baked in.
// On wide previews (iMessage, LinkedIn, X, WhatsApp's large card) the photo fills the sides.
const pageCard = (c) => `<!doctype html><html><head><style>${base}
  body { position: relative; background: #090d16; color: #fff; }
  .photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: ${c.pos}; filter: saturate(.95) contrast(1.04); }
  .veil { position: absolute; inset: 0; background: radial-gradient(ellipse 560px 400px at 50% 50%, rgba(9,13,22,.9) 0%, rgba(9,13,22,.78) 50%, rgba(9,13,22,.42) 100%); }
  .inner { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .label { display: inline-flex; align-items: center; gap: 14px; font-size: 19px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.72); }
  .label::before, .label::after { content: ''; width: 28px; height: 2px; border-radius: 2px; background: #e5181f; }
  .emblem { display: grid; place-items: center; width: 232px; height: 232px; margin-top: 30px; border-radius: 60px; background: #fff; box-shadow: 0 30px 70px -24px rgba(0,0,0,.7), 0 0 0 10px rgba(255,255,255,.06); }
  .emblem svg { width: 168px; height: 168px; fill: none; stroke: #e5181f; stroke-width: 5.5; stroke-linecap: round; stroke-linejoin: round; }
  .word { margin-top: 30px; font-size: 76px; font-weight: 800; letter-spacing: -.045em; line-height: 1; }
  .word b { color: #ff3b30; }
  .tag { margin-top: 12px; font-size: 15px; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.62); }
</style></head><body>
  <img class="photo" src="${url(c.photo)}">
  <div class="veil"></div>
  <div class="inner">
    <div class="label">${c.label}</div>
    <div class="emblem">${MARK}</div>
    <div class="word">Medico<b>.</b></div>
    <div class="tag">Scientific Service Centre &middot; Srinagar</div>
  </div>
</body></html>`;

// Transparent overlay for generated cards. Everything sits on the centre line so the brand
// survives WhatsApp's square crop: the logo pill at the top, the label at the bottom.
const frame = (label, light) => `<!doctype html><html><head><style>${base}
  .top { position: absolute; top: 30px; left: 50%; transform: translateX(-50%); padding: 10px 22px 10px 10px; border-radius: 22px; background: rgba(255,255,255,.96); box-shadow: 0 10px 30px -12px rgba(9,13,22,.4); }
  .top .mark { width: 48px; height: 48px; box-shadow: none; border: 1px solid rgba(11,18,32,.08); }
  .top .mark svg { width: 34px; height: 34px; }
  .top .name { font-size: 26px; } .top .sub { font-size: 9.5px; }
  .floor { position: absolute; left: 0; right: 0; bottom: 0; height: 150px; background: linear-gradient(180deg, rgba(9,13,22,0) 0%, rgba(9,13,22,.7) 100%); }
  .tag { position: absolute; left: 0; right: 0; bottom: 32px; display: flex; justify-content: center; align-items: center; gap: 12px; color: #fff; font-size: 20px; font-weight: 600; }
  .tag::before, .tag::after { content: ''; width: 28px; height: 3px; border-radius: 3px; background: #e5181f; }
  ${light ? '.floor { display: none; } .tag { color: #090d16; } .top { box-shadow: 0 0 0 1px rgba(11,18,32,.08), 0 10px 30px -14px rgba(9,13,22,.25); }' : ''}
</style></head><body>
  <div class="top">${lockup(true)}</div>
  <div class="floor"></div>
  <div class="tag">${label}</div>
</body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  // Rendered at 2x and downsampled: crisper type than a 1x screenshot
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  const tmp = path.join(os.tmpdir(), 'medico-og.html');
  const render = async (html, file, opts) => {
    fs.writeFileSync(tmp, html);
    await page.goto(`file:///${tmp.replace(/\\/g, '/')}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const shot = await page.screenshot({ type: 'png', omitBackground: Boolean(opts.omitBackground) });
    const img = sharp(shot).resize(1200, 630, { kernel: 'lanczos3' });
    // 4:4:4 keeps red text and thin strokes sharp; the default 4:2:0 smears colour edges
    await (opts.jpeg ? img.jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true }) : img.png({ compressionLevel: 9 })).toFile(path.join(OUT, file));
    console.log('wrote images/og/' + file);
  };
  for (const c of CARDS) await render(pageCard(c), `${c.file}.jpg`, { jpeg: true });
  await render(frame('From the Medico blog'), 'frame-post.png', { omitBackground: true });
  await render(frame('Supplied &amp; serviced by Medico', true), 'frame-product.png', { omitBackground: true });
  await browser.close();
})();
