# CLAUDE.md

## Build Commands
- **Install dependencies:** `npm install`
- **Start dev server:** `npm run dev` or `node server.js`

## Technology Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend:** Node.js, Express (used for API or serving content)
- **Deployment:** Vercel (see `vercel.json`)

## Formatting & Conventions
- **Web Aesthetics:** Ensure premium, high-quality design. Use modern typography and carefully selected color palettes. Do not use TailwindCSS unless explicitly requested. Avoid glassmorphism unless instructed.
- **HTML/CSS:** Use semantic HTML5. Maintain vanilla CSS conventions, using classes thoughtfully to maintain the aesthetic. Keep the layout responsive.
- **JavaScript:** Use modern ES6+ features in JS files. Use 2-space indentation.
- **Images/Media:** Prefer `.webp` format for optimized performance. Ensure proper styling for layout consistency.

## Project Context
- **Business:** Medico Scientific Service Centre - Medical Equipment Supplier in J&K.
- **Business Details:** Refer to `llms.txt` for contact info, product categories, and services.
- **Core Pages:** `index.html`, `shop.html`, `about.html`, `blog.html`


## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /setup-gbrain, /sync-gbrain, /retro, /investigate, /document-release, /document-generate, /codex, /cso, /autoplan, /pair-agent, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore