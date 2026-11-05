// Turns a blog type + details (or just keywords) into an outline, then a full draft.
// Rules come from style-guide.js (system prompt) and blog-types.js (per-type instructions).
const { askJson } = require('./groq');
const { BLOG_TYPES, TYPE_IDS, typeById } = require('./blog-types');
const { systemPrompt, DISCLAIMER, BANNED_CONNECTORS, BANNED_FILLERS, LIMITED_WORDS } = require('./style-guide');
const { sanitizeArticle, countMarkers } = require('../sanitize');
const { plainText, slugify, escHtml } = require('../text');

const CATEGORIES = ['Clinical Insights', 'Product Guides', 'Healthcare Infrastructure', 'Patient Care', 'Industry News'];
const LENGTHS = { short: '700 to 900', medium: '1100 to 1400', long: '1600 to 2000' };
const clip = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const today = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

function detailsBlock(type, details = {}, guessed = []) {
  const lines = type.fields.map((f) => {
    const v = String(details[f.key] || '').trim();
    const tag = guessed.includes(f.key) ? ' (GUESSED by AI from keywords: an assumption about angle or audience, not a fact)' : '';
    return `- ${f.label}: ${v || '(not supplied)'}${v ? tag : ''}`;
  });
  return `Blog type: ${type.label} (${type.useFor})\nMy details:\n${lines.join('\n')}`;
}

function newsBlock(news) {
  if (!news || !news.length) return 'No news reports supplied. Do not claim any recent event happened.';
  return `News reports you may use as supplied facts (name the publication when you use one):\n${news
    .map((n, i) => `[${i + 1}] "${n.title}" (${n.source}, ${n.published || 'recent'})${n.snippet && n.snippet !== n.title ? `\n    ${n.snippet}` : ''}`)
    .join('\n')}`;
}

const recentBlock = (titles) => (titles && titles.length
  ? `Articles already on the site. Do not repeat their angle or headline:\n${titles.map((t) => `- ${t}`).join('\n')}`
  : '');

/** "Just keywords": pick the type (unless given) and fill reasonable details, marking every guess. */
async function inferDetails({ keywords, typeId, settings, deadline }) {
  const types = BLOG_TYPES.map((t) => `- "${t.id}": ${t.label}. ${t.useFor}. Fields: ${t.fields.map((f) => `"${f.key}" (${f.label})`).join(', ')}`).join('\n');
  const user = `Today is ${today()}. Region: ${settings.blog_region}.
The owner typed these keywords: "${keywords}"
${typeId ? `The blog type is fixed: "${typeId}".` : 'Choose the blog type that fits these keywords best.'}

Blog types:
${types}

Fill the chosen type's fields with reasonable details for an article about these keywords. Only angle, audience, keyword and structure may be guessed. Never invent facts, numbers, prices, client names, results or quotes: leave such fields empty.

Return JSON: {"type": "<type id>", "details": {"<field key>": "<value>"}, "reason": "one sentence on why this type"}`;
  const { raw } = await askJson({ model: settings.ai_model, system: systemPrompt(settings), user, maxTokens: 1500, deadline, accept: (r) => r && typeof r.details === 'object' });
  const type = TYPE_IDS.includes(typeId) ? typeId : TYPE_IDS.includes(raw.type) ? raw.type : 'guide';
  const fields = typeById(type).fields.map((f) => f.key);
  const details = {};
  for (const k of fields) if (raw.details[k]) details[k] = clip(raw.details[k], 2000);
  return { type, details, guessed: Object.keys(details), reason: clip(raw.reason, 300) };
}

/** Step 1: outline (plus coverage map for the Comprehensive Guide). */
async function makeOutline({ typeId, details, guessed = [], settings, recentTitles = [], news = [], deadline }) {
  const type = typeById(typeId) || typeById('guide');
  const user = `Today is ${today()}. Region: ${settings.blog_region}.
${detailsBlock(type, details, guessed)}

${newsBlock(news)}

${recentBlock(recentTitles)}

Step 1 only: propose the outline. Do not write the article.
${type.outline}
Target length: ${details.length || LENGTHS[settings.blog_length] || LENGTHS.medium} words.

Return JSON:
{
  "h1": "headline under 70 characters with the primary keyword, no colon",
  ${type.hasCoverageMap ? '"coverage_map": [{"topic": "", "top_pages_cover": "yes/partly/no", "gap": "", "our_angle": "from supplied expertise, or \\"No supporting expertise supplied\\""}],' : ''}
  "sections": [{"level": "h2 or h3", "heading": "", "words": 150, "keyword": "keyword placed here or empty", "draws_on": "which detail this section uses"}],
  "missing_inputs": ["required details that are missing and would improve the article"]
}`;
  const { raw, model } = await askJson({ model: settings.ai_model, system: systemPrompt(settings), user, maxTokens: 2500, deadline, accept: (r) => r && Array.isArray(r.sections) && r.sections.length });
  return {
    h1: clip(raw.h1, 120),
    coverageMap: Array.isArray(raw.coverage_map) ? raw.coverage_map.slice(0, 20).map((c) => ({ topic: clip(c.topic, 200), topPagesCover: clip(c.top_pages_cover, 20), gap: clip(c.gap, 300), ourAngle: clip(c.our_angle, 400) })) : [],
    sections: raw.sections.slice(0, 30).map((s) => ({ level: s.level === 'h3' ? 'h3' : 'h2', heading: clip(s.heading, 160), words: Number(s.words) || 0, keyword: clip(s.keyword, 120), drawsOn: clip(s.draws_on, 300) })),
    missingInputs: Array.isArray(raw.missing_inputs) ? raw.missing_inputs.slice(0, 15).map((m) => clip(m, 300)) : [],
    model,
  };
}

const outlineText = (o) => [
  `H1: ${o.h1}`,
  ...o.sections.map((s) => `${s.level.toUpperCase()}: ${s.heading} (${s.words || '?'} words${s.keyword ? `; keyword: ${s.keyword}` : ''}${s.drawsOn ? `; draws on: ${s.drawsOn}` : ''})`),
].join('\n');

/** Step 2: the full draft. Without an outline the writer plans silently and writes in one go. */
async function writeDraft({ typeId, details, guessed = [], outline = null, settings, recentTitles = [], news = [], deadline }) {
  const type = typeById(typeId) || typeById('guide');
  const user = `Today is ${today()}. Region: ${settings.blog_region}.
${detailsBlock(type, details, guessed)}

${newsBlock(news)}

${recentBlock(recentTitles)}
${settings.blog_extra_instructions ? `\nOwner's extra instructions: ${settings.blog_extra_instructions}\n` : ''}
${outline ? `Approved outline (follow it; list any change under outline_deviations):\n${outlineText(outline)}` : 'No outline was approved. Plan the outline silently following the rules, then write.'}

Write the full article now.
${type.write}
Target length: ${details.length || LENGTHS[settings.blog_length] || LENGTHS.medium} words.

Return JSON with exactly these keys:
{
  "title": "H1 under 70 characters, primary keyword included, no colon",
  "slug": "short-url-slug",
  "excerpt": "one or two plain sentences under 160 characters on what the reader gets",
  "meta_title": "under 60 characters",
  "meta_description": "under 155 characters",
  "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(', ')},
  "content": "the article body as HTML using only <p>, <h2>, <h3>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <a href>, <table>, <thead>, <tbody>, <tr>, <th>, <td>. No <h1>, do not repeat the title, no FAQ section (put FAQs in the faq key).",
  "faq": [{"q": "question a reader would ask", "a": "2 to 4 plain sentences"}],
  "image_query": "two or three plain words for a cover photo search, like 'oxygen concentrator' or 'hospital ward'. No place names, no brand names.",
  "type_checks": ["${type.checks.replace(/"/g, "'")} One item per finding."],
  "outline_deviations": "list of changes from the approved outline, or None"
}`;
  const { raw, model } = await askJson({
    model: settings.ai_model, system: systemPrompt(settings), user, maxTokens: 7000, timeoutMs: 40000, deadline,
    accept: (r) => r && typeof r.content === 'string' && plainText(r.content).length > 600,
  });

  const faq = Array.isArray(raw.faq) ? raw.faq.filter((f) => f && f.q && f.a).slice(0, 8).map((f) => ({ q: stripDashes(clip(f.q, 200)), a: stripDashes(clip(f.a, 800)) })) : [];
  let content = stripDashes(sanitizeArticle(String(raw.content)));
  if (faq.length) content += `\n<h2>Frequently asked questions</h2>\n${faq.map((f) => `<h3>${escHtml(f.q)}</h3>\n<p>${escHtml(f.a)}</p>`).join('\n')}`;
  if (news.length) content += `\n<h2>Sources</h2>\n<ul>${news.map((n) => `<li><a href="${escHtml(n.url)}">${escHtml(n.title)}</a> (${escHtml(n.source)})</li>`).join('')}</ul>`;
  content = withDisclaimer(content);

  const title = stripDashes(clip(raw.title, 120)).replace(/[.,]+$/, '') || (outline && outline.h1) || 'Untitled draft';
  const supplied = [JSON.stringify(details), JSON.stringify(news), JSON.stringify(settings)].join(' ');
  return {
    title,
    slug: slugify(raw.slug || title, 80),
    excerpt: stripDashes(clip(raw.excerpt, 300)),
    metaTitle: stripDashes(clip(raw.meta_title || title, 120)),
    metaDescription: stripDashes(clip(raw.meta_description || raw.excerpt, 200)),
    category: CATEGORIES.includes(raw.category) ? raw.category : 'Product Guides',
    content,
    faq,
    imageQuery: clip(raw.image_query, 60).replace(/[^\w\s&-]/g, ''),
    checks: {
      ...analyse(content),
      untraceableNumbers: untraceableNumbers(content, supplied),
      type: type.label,
      typeChecks: Array.isArray(raw.type_checks) ? raw.type_checks.slice(0, 30).map((c) => clip(c, 500)) : [clip(raw.type_checks, 2000)].filter(Boolean),
      outlineDeviations: outline ? clip(Array.isArray(raw.outline_deviations) ? raw.outline_deviations.join('; ') : raw.outline_deviations, 2000) || 'None' : 'No outline approved (written directly).',
      guessedInputs: guessed.map((k) => type.fields.find((f) => f.key === k)?.label || k),
      model,
      generatedAt: new Date().toISOString(),
    },
  };
}

/** Em dashes are banned: clause dashes become commas, word-joining dashes become hyphens. */
function stripDashes(html) {
  return String(html)
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s+–\s+/g, ', ')
    .replace(/(\w)–(\w)/g, '$1-$2')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([.<])/g, '$1');
}

/** Numbers in the article that appear nowhere in the supplied details, news or business facts. */
function untraceableNumbers(html, supplied) {
  const have = new Set((String(supplied).match(/\d[\d,.]*/g) || []).map((n) => n.replace(/[,.]+$/, '').replace(/,/g, '')));
  const found = plainText(html.replace(/<h2>(Frequently asked questions|Sources)<\/h2>[\s\S]*$/i, '')).match(/[^.]*?\d[\d,.]*\s?(%|percent|watts?|W\b|litres?|L\b|hours?|minutes?|days?|years?|kg|₹|Rs\.?)?[^.]*\./g) || [];
  const out = [];
  for (const sentence of found) {
    for (const n of sentence.match(/\d[\d,.]*/g) || []) {
      const clean = n.replace(/[,.]+$/, '').replace(/,/g, '');
      if (clean.length && !have.has(clean) && !/^(19|20)\d\d$/.test(clean)) { out.push(`${n.replace(/[,.]+$/, '')}: "${sentence.trim().slice(0, 140)}"`); break; }
    }
  }
  return out.slice(0, 25);
}

const withDisclaimer = (html) => (/not medical advice/i.test(html) ? html : `${html}\n${DISCLAIMER}`);

/** Style checks for the "Before publishing" panel. Flags only; meaning is never rewritten. */
function analyse(html) {
  const text = plainText(html);
  const lower = text.toLowerCase();
  const count = (w) => (lower.match(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]")}\\b`, 'g')) || []).length;
  const banned = [...BANNED_CONNECTORS, ...BANNED_FILLERS].map((w) => [w, count(w)]).filter(([, n]) => n).map(([w, n]) => `${w} (${n})`);
  const overused = LIMITED_WORDS.map((w) => [w, count(w)]).filter(([, n]) => n > 2).map(([w, n]) => `${w} (${n})`);
  const paragraphs = (html.match(/<(p|li)>[\s\S]*?<\/\1>/g) || []).map(plainText);
  const sentences = paragraphs.flatMap((p) => p.split(/(?<=[.!?])\s+/)).map((s) => s.trim()).filter(Boolean);
  const words = (s) => s.split(/\s+/).filter(Boolean).length;
  return {
    wordCount: words(text),
    markers: countMarkers(html),
    bannedWords: banned,
    overusedWords: overused,
    longSentences: sentences.filter((s) => words(s) > 25).length,
    shortSentences: sentences.filter((s) => words(s) >= 3 && words(s) <= 5 && !/\[|:$/.test(s)).length,
    emDashes: (html.match(/—/g) || []).length,
    headingsWithColons: (html.match(/<h[23]>[^<]*:[^<]*<\/h[23]>/g) || []).length,
  };
}

module.exports = { inferDetails, makeOutline, writeDraft, analyse, stripDashes, withDisclaimer, untraceableNumbers, CATEGORIES };

if (require.main === module) {
  const assert = require('assert');
  assert.strictEqual(stripDashes('<p>Power cuts — common in winter — hurt.</p>'), '<p>Power cuts, common in winter, hurt.</p>');
  assert.strictEqual(stripDashes('5–10 litres'), '5-10 litres');
  const a = analyse('<h2>Why: now</h2><p>Moreover, the unit runs all night in order to help. Yes it works.</p>');
  assert(a.bannedWords.some((w) => w.startsWith('moreover')) && a.bannedWords.some((w) => w.startsWith('in order to')));
  assert.strictEqual(a.headingsWithColons, 1);
  assert(withDisclaimer('<p>x</p>').includes('not medical advice'));
  const u = untraceableNumbers('<p>Units draw 300 watts. Founded in 2000. We have 5 engineers.</p>', '{"x":"5 engineers"}');
  assert.strictEqual(u.length, 1); assert(u[0].startsWith('300'));
  console.log('writer ok');
}
