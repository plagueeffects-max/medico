// The six blog types from docs/blog-writing-guide.md, as data. The admin writer form is
// generated from `fields`; `outline`, `write` and `checks` go into the prompts.
// Change docs/blog-writing-guide.md first, then mirror the change here.

const BLOG_TYPES = [
  {
    id: 'guide',
    label: 'Comprehensive Guide',
    useFor: 'Authoritative content that can compete for a competitive keyword',
    fields: [
      { key: 'keyword', label: 'Target keyword and close variants', type: 'text', hint: 'e.g. oxygen concentrator for home use, home oxygen machine' },
      { key: 'intent', label: 'Search intent', type: 'text', hint: 'What the searcher wants to get done' },
      { key: 'top_pages', label: 'Top-ranking pages', type: 'textarea', hint: 'URL, their H2s, what each covers well, what it misses' },
      { key: 'expertise', label: 'Our first-hand expertise', type: 'textarea', hint: 'Data, client results, processes, opinions from Medico' },
      { key: 'audience', label: 'Audience and knowledge level', type: 'text' },
      { key: 'links', label: 'Internal links', type: 'textarea', hint: 'URL | anchor | section, one per line' },
      { key: 'cta', label: 'CTA wording', type: 'text' },
      { key: 'length', label: 'Target length (words)', type: 'text', hint: 'e.g. 1500' },
    ],
    outline: 'First build a coverage map: topics every top page covers, gaps they all miss, and our angle on each gap using only the supplied expertise. If a gap has no supporting expertise, say so and do not fill it. Then the outline, one line per section on which detail it draws on.',
    write: 'Cover what top pages agree a reader needs, then at least two sections built on our supplied expertise. Explain each technical term the first time in one short clause. Back every claim with a supplied number, source or example, otherwise write [NEEDS SOURCE]. No padding, no unnatural keyword repetition. No invented statistics, studies, quotes or experience.',
    checks: 'Report: word count; which sections carry original expertise; OUTLINE DEVIATIONS (or "None").',
    hasCoverageMap: true,
  },
  {
    id: 'problem-solution',
    label: 'Problem-Solution Post',
    useFor: 'Ranking for problem keywords and positioning the product as the fix',
    fields: [
      { key: 'keyword', label: 'Problem keyword', type: 'text' },
      { key: 'situation', label: "Reader's situation and pain, in their own words", type: 'textarea' },
      { key: 'root_cause', label: 'Root cause', type: 'textarea' },
      { key: 'common_fixes', label: 'Common fixes people try, and why each falls short', type: 'textarea' },
      { key: 'free_fixes', label: 'Fixes that need no product', type: 'textarea' },
      { key: 'product', label: 'Our product', type: 'textarea', hint: 'What it does, who it suits, who it does not suit' },
      { key: 'proof', label: 'Proof', type: 'textarea', hint: 'Results with numbers, features' },
      { key: 'cta', label: 'CTA wording', type: 'text' },
    ],
    outline: 'Mark which section explains the cause, which gives the free fixes, and where the product first appears.',
    write: "Open with the problem in the reader's own words. Explain the cause before any fix. Give at least three genuinely useful fixes that need no product from us. Introduce the product only where it does the job better, and pair every product mention with supplied proof. Include a section like \"Who this is not right for\". Calm tone, no exaggeration, no claim beyond the proof. Soft CTA; no new information in the conclusion.",
    checks: 'Report: count of product mentions, confirm each has proof beside it, list any that do not; OUTLINE DEVIATIONS (or "None").',
  },
  {
    id: 'list',
    label: 'List Article',
    useFor: "Easy to scan, built around the reader's goal",
    fields: [
      { key: 'keyword', label: 'Keyword', type: 'text' },
      { key: 'goal', label: "Reader's goal", type: 'text' },
      { key: 'criteria', label: 'Selection criteria', type: 'textarea' },
      { key: 'items', label: 'Items', type: 'textarea', hint: 'One per line: name | key facts | best for | limitation | source | date checked' },
      { key: 'ordering', label: 'Ordering logic', type: 'text' },
      { key: 'relationship', label: 'Our relationship to any item', type: 'text', hint: 'Own product / authorised dealer / none' },
      { key: 'links', label: 'Internal links', type: 'textarea' },
      { key: 'cta', label: 'CTA wording', type: 'text' },
    ],
    outline: 'Title uses the real item count. Plan: selection criteria in the first third, relationship disclosure near the top, order explained before the list, the same structure for every item.',
    write: 'Title uses the real item count. State the selection criteria in the first third. Disclose our relationship near the top. Use the same structure for every item: what it is, best for, limitation, one supporting fact, source. Explain the order in two sentences before the list. Only supplied items; never pad to a round number. Put a date next to every price or feature. Never invent prices, features, rankings or ratings; write "Unverified" for anything not supplied. Short closing section on how to choose by reader type, with no new facts. End the article with an HTML <table> of all items with columns Item, Best for, Limitation.',
    checks: 'Report: item count used vs supplied; any "Unverified" values; OUTLINE DEVIATIONS (or "None").',
  },
  {
    id: 'case-study',
    label: 'Case Study',
    useFor: 'A client win where every number is traceable',
    fields: [
      { key: 'client', label: 'Client', type: 'textarea', hint: 'Name, industry, size, approval to be named (yes/no)' },
      { key: 'starting', label: 'Starting situation', type: 'textarea', hint: 'Problem, baseline numbers, date' },
      { key: 'approach', label: 'What we did', type: 'textarea', hint: 'Steps, tools, timeline' },
      { key: 'results', label: 'Results', type: 'textarea', hint: 'Before, after, date range, data source per metric' },
      { key: 'other_changes', label: 'Other changes during the period', type: 'textarea' },
      { key: 'quote', label: 'Approved client quote (word for word)', type: 'textarea' },
      { key: 'lesson', label: 'Lesson', type: 'textarea' },
      { key: 'cta', label: 'CTA wording', type: 'text' },
    ],
    outline: 'Structure: challenge, approach, results, lesson. Plan the opening on the most specific true detail and a results table.',
    write: 'Structure: challenge, approach, results, lesson. Open on the most specific true detail. Give every result with its baseline, timeframe and source, ideally in an HTML <table>. Make the steps clear enough that a reader learns without hiring us. Name the client only if approval is "yes", otherwise anonymise. Quote word for word or use no quote. Never round up results, stretch timelines or misattribute outcomes. Include one honest sentence on what we cannot claim credit for. The lesson gives usable advice, not a summary.',
    checks: 'Report: every number used with the supplied detail it came from; flag untraceable numbers; OUTLINE DEVIATIONS (or "None").',
  },
  {
    id: 'comparison',
    label: 'Comparison Post',
    useFor: 'Buyers ready to choose, honest about our own weaknesses',
    fields: [
      { key: 'keyword', label: 'Comparison keyword (X vs Y)', type: 'text' },
      { key: 'reader_types', label: 'Reader types', type: 'text' },
      { key: 'criteria', label: 'Criteria', type: 'textarea' },
      { key: 'options', label: 'Options', type: 'textarea', hint: 'One per line: name | pricing | key features | strengths | weaknesses | best for | source | date checked' },
      { key: 'relationship', label: 'Our relationship', type: 'text' },
      { key: 'cta', label: 'CTA wording', type: 'text' },
    ],
    outline: 'Plan: relationship disclosure in the first three paragraphs, a short verdict by reader type, one comparison table, a "who should pick which" section.',
    write: 'Disclose our relationship in the first three paragraphs. Open with a short verdict by reader type, with no single winner for everyone. Include one HTML <table> comparing every option on the same criteria. Put a date next to each price and feature. State our own weaknesses as plainly as competitors\'. Include a section on who should pick which. Any table cell without supplied data says "Unverified". Neutral tone; no "best overall" unless the supplied details support it.',
    checks: 'Report: list every "Unverified" cell; OUTLINE DEVIATIONS (or "None").',
  },
  {
    id: 'how-to',
    label: 'How-To Guide',
    useFor: 'Instructional searches; every step has a result the reader can check',
    fields: [
      { key: 'keyword', label: 'Keyword (how to ...)', type: 'text' },
      { key: 'starting_point', label: "Reader's starting point", type: 'text' },
      { key: 'requirements', label: 'Requirements', type: 'textarea', hint: 'Tools, access, time, cost' },
      { key: 'steps', label: 'Steps', type: 'textarea', hint: 'One per line: action | expected result | common mistake | fix' },
      { key: 'examples', label: 'Screenshots or examples per step', type: 'textarea' },
      { key: 'verify', label: 'How to check the whole task worked', type: 'textarea' },
    ],
    outline: 'Steps as action headings. Requirements before step one.',
    write: 'Put the requirements before step one. Each step is one clear action followed by its expected result. Put the common mistake and its fix under the step where it happens. Do not skip or add steps beyond the supplied ones. End with how to check the whole task succeeded. FAQs only from questions raised in the details.',
    checks: 'Report: step count vs supplied steps; flag any step with no expected result; OUTLINE DEVIATIONS (or "None").',
  },
];

const TYPE_IDS = BLOG_TYPES.map((t) => t.id);
const typeById = (id) => BLOG_TYPES.find((t) => t.id === id) || null;

/** Public catalogue for the admin form (no prompt text needed there, but harmless). */
const typeCatalogue = () => BLOG_TYPES.map(({ id, label, useFor, fields, hasCoverageMap }) => ({ id, label, useFor, fields, hasCoverageMap: Boolean(hasCoverageMap) }));

module.exports = { BLOG_TYPES, TYPE_IDS, typeById, typeCatalogue };
