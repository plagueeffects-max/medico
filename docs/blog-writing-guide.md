# Blog writing guide (source of the AI writer's rules)

Source: owner's Google Doc "Blog-Writing-Prompts-Pack" (AdsCult). Six prompts, one per blog type, plus a setup prompt with writing rules that apply to every draft. The AI writer in `api/_lib/ai/` is built from this file; change the rules here first, then the prompt.

## Blog types

| Type | Use it for |
|---|---|
| 1. Comprehensive Guide | Authoritative content that can compete for a competitive keyword |
| 2. Problem-Solution Post | Ranking for problem keywords and positioning the product as the fix |
| 3. List Article | Easy to scan, built around the reader's goal |
| 4. Case Study | A client win where every number is traceable |
| 5. Comparison Post | Buyers ready to choose, honest about our own weaknesses |
| 6. How-To Guide | Instructional searches; every step has a result the reader can check |

Every type runs two steps: outline first (stop for approval), then write.

### 1. Comprehensive Guide
Details: target keyword and close variants; search intent; top-ranking pages (URL, H2s, what each covers well, what it misses); our first-hand expertise (data, client results, processes, opinions); audience and knowledge level; internal links (URL, anchor, section); CTA wording; target length.
- Step 1 coverage map: table of topics every top page covers, gaps they all miss, our angle on each gap using only supplied expertise. If a gap has no supporting expertise, say so; do not fill it.
- Step 2 outline with one line per section on which detail it draws on.
- Step 3 write: cover what top pages agree a reader needs, then at least two sections on our supplied expertise. Explain each technical term the first time in one short clause. Back every claim with a supplied number, source or example, otherwise write [NEEDS SOURCE]. No padding, no unnatural keyword repetition. No invented statistics, studies, quotes or experience.
- End with: word count; which sections carry original expertise; OUTLINE DEVIATIONS (or "None").

### 2. Problem-Solution Post
Details: problem keyword; reader's situation and pain in their own words; root cause; common fixes people try and why each falls short; fixes that need no product; our product (what it does, who it suits, who it does not suit); proof (results with numbers, features); CTA wording.
- Outline marks which section explains the cause, which gives free fixes, where the product first appears.
- Open with the problem in the reader's own words. Explain the cause before any fix. At least three genuinely useful fixes without our product. Introduce the product only where it does the job better, and pair every product mention with supplied proof. Include a section like "Who this is not right for". Calm tone, no exaggeration, no claim beyond the proof. Soft CTA; no new information in the conclusion.
- Check: count product mentions, confirm each has proof beside it, list any that do not.

### 3. List Article
Details: keyword; reader's goal; selection criteria; items (number, name, key facts, best for, limitation, source, date checked); ordering logic; our relationship to any item (own product / affiliate / none); internal links and CTA.
- Title uses the real item count. State selection criteria in the first third. Disclose relationship near the top. Same structure for every item: what it is, best for, limitation, one supporting fact, source. Explain the order in two sentences before the list. Only supplied items; never pad to a round number. Date next to every price or feature. Never invent prices, features, rankings or ratings; flag anything unverified. Short closing section on how to choose by reader type, no new facts.
- End with a table of all items with best-for and limitation.

### 4. Case Study
Details: client (name, industry, size, approval to be named yes/no); starting situation (problem, baseline numbers, date); what we did (steps, tools, timeline); results (before, after, date range, data source per metric); other changes during the period; approved client quote; lesson; CTA wording.
- Structure: challenge, approach, results, lesson. Open on the most specific true detail. Every result with baseline, timeframe and source, ideally in a table. Steps clear enough that a reader learns without hiring us. Name the client only with approval, otherwise anonymise. Quote word for word or no quote. Never round up results, stretch timelines or misattribute outcomes. One honest sentence on what we cannot claim credit for. Lesson gives usable advice, not a summary.
- Check: list every number with the detail it came from; flag untraceable numbers.

### 5. Comparison Post
Details: comparison keyword (X vs Y); reader types; criteria; options (name, pricing, key features, strengths, weaknesses, best for, source, date checked); our relationship; CTA wording.
- Disclose relationship in the first three paragraphs. Open with a short verdict by reader type, no single winner for everyone. One table comparing every option on the same criteria. Date next to each price and feature. State our own weaknesses as plainly as competitors'. Section on who should pick which. Unverified cells say "Unverified". Neutral tone; no "best overall" unless supported.
- Check: list every "Unverified" cell.

### 6. How-To Guide
Details: keyword (how to ...); reader's starting point; requirements (tools, access, time, cost); steps (action, expected result, common mistake, fix); screenshots/examples per step; how to check the whole task worked.
- Outline: steps as action headings. Requirements before step one. Each step one clear action followed by its expected result. Common mistake and fix under the step where it happens. Screenshot under its step. Do not skip or add steps. End with how to check the whole task succeeded. FAQs only from questions raised in the details.
- Check: step count matches details; flag any step with no expected result.

## Writing rules (setup prompt, apply to every draft)

PROCESS
1. Check inputs. If anything required is missing, ask for it. Never invent it.
2. Propose an outline first: H1, every H2 and H3, a word count per section, which keyword goes in which section, which input each section draws on. Wait for approval.
3. Write only after approval. List any change from the approved outline under OUTLINE DEVIATIONS.

SENTENCES
- 6 to 20 words. Complex factual statements may reach 25. Split anything longer.
- Never 3 to 5 word sentences, except one three-word punchy line in the whole piece.
- Vary sentence openings. Never start three sentences in a row with the same word.
- One point per paragraph.
- Only people are the subject of an action ("Teams execute better when the plan is clear", not "Clarity drives execution").
- Cut anything that only restates the previous sentence.

WORDS TO NEVER USE
- Connectors: furthermore, moreover, additionally, nevertheless, consequently, thus, hence.
- Fillers: "it's important to note", "when it comes to", "in today's world", "at the end of the day", "in order to", "whether you are... or...".
- Em dashes anywhere.
- At most one or two per article: leverage, utilise, robust, comprehensive, seamless, elevate, transform, unlock, empower, navigate, landscape, crucial.

HEADINGS
- Written the way a reader would say it out loud.
- No colons, no em dashes, no "Topic: Subtitle".
- Makes sense on its own.

KEYWORDS AND LINKS
- Primary keyword in the first 100 words and in the H1.
- Flow first; drop a keyword that disturbs the sentence.
- Never two keywords in the same paragraph.
- Each internal link once, in its assigned section, never two in one paragraph.

OPENING AND CLOSING
- Intro entry point fits the topic: a hook, the problem, a direct answer, or a short scenario.
- Open on a specific fact or moment, never a generic brand or category line.
- Conclusion adds no new information, never opens with "In conclusion", ends with the CTA.
- FAQs: 2 to 4 sentences per answer, plain language.

HONESTY
- Use only supplied facts, numbers, quotes and examples.
- Mark anything that needs support as [NEEDS SOURCE].
- If a sentence cannot be written specifically because data is missing, insert:
  [FLAG: Writer input needed]
  Intent: what the sentence should say
  Problem: what is missing
  What would help: the detail to supply

## Before publishing
Fix every [NEEDS SOURCE], [FLAG], "Unverified" cell and untraceable number the writer reported.
