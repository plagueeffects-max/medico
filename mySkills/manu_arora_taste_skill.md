---
name: manu-arora-taste
description: The complete, drop-in design engineering taste system based on Manu Arora's design philosophy (Aceternity UI, Vibrant.design, Acebuilder) to permanently eliminate Claude Opus / LLM UI slop across landing pages, admin dashboards, forms, cards, and animations.
---

# Manu Arora Master Design Engineering & Anti-Slop Skill

Use this skill as the definitive source of truth whenever generating, styling, refactoring, or reviewing any frontend interface—from marketing landing pages to complex SaaS admin dashboards. This skill overrides generic LLM statistical defaults (Claude Opus, Sonnet, GPT) and enforces industrial, tactile, high-craft design engineering.

---

## 1. The Global "Anti-Slop" Rulebook (What Opus Pushes vs. Manu's Override)

Claude Opus and similar models default to predictable, low-effort patterns. You MUST strictly ban the left column and enforce the right column across every file:

| Category | What Claude Opus Pushes ("AI Slop") | Manu Arora's Design Engineering Override |
| :--- | :--- | :--- |
| **Color & Gradients** | Neon purple-to-indigo-to-pink gradients (`from-purple-600 via-indigo-600 to-pink-500`) on text, buttons, and borders. | **Restrained, tactile palette**: Neutral monochromatic surfaces (`neutral-50` to `neutral-950`) paired with physical top-to-bottom gradients (`from-blue-500 to-blue-700` or `from-neutral-800 to-neutral-950`). Never use rainbow text clipping. |
| **Background Atmosphere** | Huge blurry color blobs (`blur-3xl bg-purple-500/20 rounded-full`) floating in corners. | **Engineered architectural grids**: 8px/16px radial dot matrices (`radial-gradient`), subtle SVG grid lines masked with radial fade-outs (`[mask-image:radial-gradient(ellipse_at_center,white,transparent)]`), or clean structural framing. |
| **Status Badges** | Rounded pills (`rounded-full`) with pulsing or static green, orange, or red status circles at the start. | **Monochromatic elevated badge**: `rounded-md bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm shadow-black/10 ring-1 ring-black/10`. **STRICTLY ZERO** colored status dots. |
| **Primary Buttons** | Flat `bg-blue-600` or blurry, glowing drop shadows. | **Tactile dual-shadow hardware button**: Directional gradient + crisp 1px top inset highlight + tight dark bottom shadow (`shadow-[inset_0px_1px_0px_rgba(255,255,255,0.25),0px_1px_2px_rgba(0,0,0,0.15)]`). |
| **Secondary / Muted Buttons** | Muddy dark gray fills (`bg-neutral-300` / `bg-neutral-500`) that clash with page contrast. | **Ultra-light soothing neutrals**: `bg-neutral-50` or `bg-neutral-100` (`dark:bg-neutral-900`) with `border border-neutral-200/80` and `text-neutral-700`. |
| **Cards & Bento Cells** | Single-box cards (`bg-white rounded-xl shadow-md border`) or nested cards inside cards. | **Outer / Inner Container Architecture**: An outer tinted chassis (`bg-neutral-100 p-2.5 rounded-2xl border border-neutral-200/60`) cradling an inner clean stage (`bg-white rounded-xl p-4 border border-neutral-200/50`), with titles/descriptions sitting in the outer base below. |
| **Feature Sections** | "The Trio of Doom": 3 identical cards in a row, each with a Lucide icon in a pastel square, bold title, and 2 lines of text. | **Asymmetric Interactive Bento Grid**: Varied column spans (`md:col-span-2`, `md:col-span-1`) where every card houses a **live micro-artifact** (code preview, animated skeleton, interactive toggle, stacked notifications, or beam diagram). |
| **Form Inputs** | Plain `<input class="border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">` boxes. | **Inset Shadow + Bottom Beam Inputs**: Soft recessed surface (`bg-neutral-50 shadow-input`) with an animated radial gradient (`via-blue-500` or `via-cyan-500`) that sweeps across the bottom border on hover/focus (`BottomGradient`). |
| **Nav & Link Hovers** | Basic text color changes (`hover:text-blue-600`) or standard pill backgrounds. | **Figma Bounding Box or Shared `layoutId` Pill**: Either 4 blue corner registration squares joined by a `blue-500` border (Figma canvas style) or a shared Framer Motion `layoutId` background that glides fluidly from link to link without breaking. |
| **Dividers & Separators** | Heavy solid `<hr class="border-gray-300">` lines that slice up the viewport. | **Dashed Schematic Lines & Edge Ticks**: `border-dashed border-neutral-200` (`dark:border-neutral-800`) paired with subtle `+` crosshair intersections or scale tick marks at container corners. |
| **Avatars & Social Proof** | Fake colored initials circles (`JD`, `AS`) or generic broken Unsplash URLs. | **Overlapping Real Avatar Stack**: High-contrast real portraits (`-space-x-2 ring-2 ring-white`) with spring scale-up and a tilted tooltip springing open on hover. |
| **Admin Dashboards** | Bloated multi-colored stat cards with giant percentage badges and bulky permanent sidebars. | **Collapsible Inset App Shell**: Collapsible hover/click sidebar (`60px` to `240px`) sitting inside a `bg-neutral-100` viewport frame, wrapping a recessed main canvas (`bg-white rounded-tl-2xl border-l border-t border-neutral-200`). |

---

## 2. Global Design Tokens (Light & Dark Mode Harmony)

### 2.1 Surface & Color Hierarchy
Never use pure `#000000` for text in light mode or pure `#000000` for cards in dark mode. Always build depth through layered neutral steps:

| Token Role | Light Mode (Default Minimal) | Dark Mode (Aceternity / Linear Dark) |
| :--- | :--- | :--- |
| **Page Canvas** | `bg-white` or `bg-neutral-50/50` | `bg-neutral-950` (`#0A0A0A`) |
| **Outer Card / Sidebar Shell** | `bg-neutral-100/80 border-neutral-200/60` | `bg-neutral-900/80 border-neutral-800/80` |
| **Inner Card / Elevated Stage** | `bg-white border-neutral-200/50 shadow-xs` | `bg-neutral-950 border-neutral-800/60 shadow-inner` |
| **Primary Heading Text** | `text-neutral-800` (never `#000000`) | `text-neutral-100` (or subtle `bg-gradient-to-b from-white to-neutral-400 bg-clip-text`) |
| **Secondary Body / Subtitle** | `text-neutral-500` | `text-neutral-400` |
| **Muted / Caption / Metadata** | `text-neutral-400` | `text-neutral-500` |
| **Structural Borders** | `border-neutral-200` (solid or `border-dashed`) | `border-neutral-800` (solid or `border-dashed`) |
| **Primary Accent** | `from-blue-500 to-blue-700` (or `neutral-800 to-neutral-950`) | `from-blue-500 to-blue-600` (or `from-neutral-100 to-neutral-300 text-neutral-900`) |

### 2.2 Typography & Scannable Rhythm
- **Font Families**:
  - Sans-serif: `Inter`, `Geist`, or `Plus Jakarta Sans` (`font-sans`).
  - Monospace (Code, Metrics, Badges, Timestamps): `Geist Mono` or `JetBrains Mono` (`font-mono`).
- **Heading Rules (`h1` – `h4`)**:
  - Always apply `tracking-tight` (`-0.025em`) or `tracking-tighter` (`-0.04em` on hero titles).
  - Use `text-balance` on all headings so lines wrap evenly without single-word orphans.
  - Hero Headline: `text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100 leading-[1.08]`.
  - Section Headline: `text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100`.
- **Body & Subtitle Rules**:
  - Always apply `text-pretty` and `max-w-xl` or `max-w-2xl` so line lengths never exceed 65–70 characters.
  - Size & Color: `text-base sm:text-lg font-normal text-neutral-500 dark:text-neutral-400 leading-relaxed`.
- **Numeric Discipline**:
  - Every price, counter, table cell, and metric MUST include `tabular-nums` so numbers align vertically and never jitter during animations.

### 2.3 Tactile Shadows & Custom Utilities
Define and use these three signature shadow profiles instead of default `shadow-lg` or `shadow-xl`:
1. **Button Tactile Shadow**:
   `shadow-[inset_0px_1px_0px_rgba(255,255,255,0.25),0px_1px_2px_rgba(0,0,0,0.15)]`
2. **Aceternity Input / Card Multi-Layer Shadow (`shadow-input`)**:
   `shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]`
3. **Elevated Badge / Floating Pill Shadow**:
   `shadow-sm shadow-black/10 ring-1 ring-black/10 dark:ring-white/10`

### 2.4 Mandatory Class Merging Helper
Every component file must use `cn()` (`clsx` + `tailwind-merge`) so consumer overrides never conflict:
```ts
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 3. Section-by-Section Landing Page Blueprint

When building a landing page, structure every section with architectural framing (such as left/right vertical `border-x border-dashed border-neutral-200 max-w-5xl mx-auto` rails) so the entire page feels like a precision-engineered blueprint.

### 3.1 Navbar (Floating Glass Pill vs. Schematic Rail)
Choose one of Manu's two signature navigation patterns:
1. **The Floating Scroll-Aware Pill**:
   - Starts full-width transparent at `scrollY === 0`.
   - On scroll (`scrollY > 20`), animates width down to `max-w-3xl`, adds `rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-input border border-neutral-200/60 px-4 py-2`.
2. **The Schematic Top Rail**:
   - Full-width `border-b border-dashed border-neutral-200` intersecting the main container's vertical `border-x border-dashed` lines, with small `+` crosshair SVGs placed at the exact intersections.
- **Link Hover Behavior**:
  - Never use plain underline or abrupt color swaps. Use either the **Figma 4-Corner Selection Box** (4 `w-1.5 h-1.5 bg-blue-500` corner squares + `border border-blue-500/70` sharing a Framer Motion `layoutId="nav-box"`) or a soft `bg-neutral-100 rounded-md` pill sharing `layoutId="nav-pill"`.

### 3.2 Hero Section
- **Macro Layout**: Constrained within `max-w-4xl` or `max-w-5xl mx-auto pt-20 pb-16 px-4 text-center`.
- **Top Announcement Badge**:
  - Monochromatic `rounded-md bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm shadow-black/10 ring-1 ring-black/10` with a subtle right chevron `->` that translates `translate-x-0.5` on hover. **Zero green/orange/red dots.**
- **Headline & Subheadline**:
  - `h1` with `tracking-tight text-neutral-800` + `p` with `text-neutral-500 max-w-xl mx-auto mt-4`.
- **CTA Cluster**:
  - Primary tactile gradient button paired with an ultra-light `bg-neutral-50 border border-neutral-200 text-neutral-700` secondary button.
- **Hero Centerpiece Artifact (Never a Static Stock Photo)**:
  - Below the CTAs, present an interactive or layered product stage wrapped in the **Outer/Inner Container pattern**:
    - Outer bezel: `rounded-2xl bg-neutral-100/90 p-2 sm:p-3 border border-neutral-200/70 shadow-xl`.
    - Inner window: `rounded-xl bg-white border border-neutral-200/60 overflow-hidden` featuring a realistic split-pane IDE, live interactive component preview, or 3D perspective scroll container (`rotateX(20deg) -> rotateX(0deg)` on scroll).

### 3.3 Logo Cloud / Social Proof Strip
- **Anti-Slop Rule**: Never display full-saturation clashing brand logos in giant bordered boxes.
- **Manu's Treatment**:
  - Frame the strip between two horizontal `border-y border-dashed border-neutral-200` lines.
  - Render all logos in uniform `grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-200`.
  - If using an infinite marquee, apply horizontal fade masks on both edges: `[mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]`.

### 3.4 Bento Grid Features Section (The Heart of the Page)
- **Grid Structure**: `grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto`. Use asymmetric spans (`md:col-span-2` paired with `md:col-span-1`).
- **Card Anatomy (Outer / Inner Container)**:
  - **Outer Chassis**: `group relative flex flex-col justify-between rounded-2xl bg-neutral-100 dark:bg-neutral-900 p-2.5 border border-neutral-200/60 dark:border-neutral-800`.
  - **Inner Stage (`min-h-[180px]` to `min-h-[220px]`)**: `relative overflow-hidden rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-800/60 p-4 flex items-center justify-center`.
  - **Bottom Metadata (In Outer Chassis)**: Title (`text-sm font-semibold text-neutral-800 mt-3 px-1.5`) and description (`text-xs text-neutral-500 mt-1 px-1.5 pb-1`) sit *outside* and *below* the white inner stage.
- **Micro-Skeletons Inside Bento Cards**:
  Every Bento card's inner stage must contain an engineered micro-illustration that reacts to `group-hover`:
  1. *Card Type A (Code / CLI)*: Mini syntax-highlighted terminal where lines stagger in or a copy button reacts on hover.
  2. *Card Type B (Connected Nodes / Beams)*: Two avatar or service icons connected by an SVG path where a glowing gradient beam (`stroke-dasharray`) travels from source to target **only when hovered or triggered**.
  3. *Card Type C (Stacked Notification List)*: 3 mini notification rows using `shadow-input` that fan out (`translate-y` and `scale`) when the parent card is hovered.
  4. *Card Type D (Interactive Dotted Map / Radar)*: Low-contrast radial dot matrix with 2–3 pinpointed coordinates that reveal a clean tooltip label on hover.

### 3.5 Interactive Product Showcase / Scroll Timeline
- **Timeline / Changelog Pattern**:
  - Left column holds sticky year/version markers (`sticky top-32 text-2xl font-bold text-neutral-400`).
  - A vertical `2px` track (`bg-neutral-200`) runs down the spine, with a scroll-linked gradient beam (`from-blue-500 via-cyan-500 to-transparent`) filling the track height based on scroll progress (`useScroll` + `useTransform`).
  - Right column holds Outer/Inner framed media cards for each milestone.

### 3.6 Testimonials (Card Stack & Marquee Columns)
- **Pattern 1: Interactive Stacked Cards (`CardStack`)**:
  - 3–4 testimonial cards stacked in Z-space using absolute positioning.
  - Each card behind the front card steps up by `scale(1 - index * 0.05)` and `translateY(-index * 10px)` with decreasing opacity.
  - Clicking or a 5-second interval smoothly springs the front card to the back of the stack.
- **Pattern 2: Multi-Column Vertical Marquee**:
  - 3 vertical columns scrolling at slightly different speeds (`25s`, `35s`, `30s`), masked at top and bottom with `linear-gradient(to_bottom,transparent,white_15%,white_85%,transparent)`.
- **Testimonial Content Rule**: Always highlight the key phrase inside the quote using a subtle inline highlight (`bg-blue-50 text-blue-700 px-1 py-0.5 rounded font-medium`). Never use giant cheesy quotation mark icons or 5 yellow star emojis.

### 3.7 Pricing Section
- **Billing Toggle**:
  - Centered segmented pill (`bg-neutral-100 p-1 rounded-lg border border-neutral-200/60`) with a sliding white `layoutId` thumb (`bg-white shadow-xs rounded-md`) switching between "Monthly" and "Yearly".
- **Tier Differentiation (Contrast Inversion, Not Rainbow Borders)**:
  - **Standard Tiers (Starter / Team)**: Light Outer/Inner container (`bg-neutral-100` outer, `bg-white` inner).
  - **Highlighted "Pro" Tier**: Instead of a neon purple glowing border, invert the surface to a sleek **High-Craft Dark Chassis** (`bg-neutral-900 text-white rounded-2xl p-3 border border-neutral-800 shadow-xl`) with an inner stage of `bg-neutral-950 border border-neutral-800` and a subtle top-edge radial spotlight (`bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_70%)]`).
- **Feature Checklist**: Use crisp `14px` monochrome checkmarks inside a `w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center` circle.

### 3.8 FAQ Accordion & Pre-Footer CTA
- **FAQ Accordion**:
  - Wrap each FAQ item in a clean row separated by `border-b border-dashed border-neutral-200` (or subtle Outer/Inner cards).
  - Animate height smoothly using Framer Motion `AnimatePresence` (`height: 0 -> "auto"`, `opacity: 0 -> 1`, `duration: 0.2`), rotating a minimal `+` icon `45deg` into an `×`.
- **Footer**:
  - Clean 4-column link grid above a massive, ultra-subtle watermark brand wordmark (`text-[10vw] font-bold tracking-tighter text-neutral-100 dark:text-neutral-900/60 select-none pointer-events-none leading-none`) clipped at the bottom edge.

---

## 4. Comprehensive Component & Element Specifications

### 4.1 Forms, Inputs & Auth Screens (Aceternity Input System)
Never render plain browser inputs. Every form field, login card, and settings panel must use Manu's recessed input + bottom beam architecture:

```tsx
// 1. Label + Input Container
<div className="flex flex-col space-y-1.5 w-full">
  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 tracking-tight">
    Email Address
  </label>
  {/* Hover group triggers the bottom beam */}
  <div className="group/input relative rounded-lg p-[1px] transition duration-200">
    <input
      type="email"
      placeholder="manu@aceternity.com"
      className="flex h-10 w-full rounded-lg border-none bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] dark:shadow-[0px_0px_1px_1px_#262626] placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700 transition duration-200"
    />
    {/* Signature Bottom Gradient Beam on Hover / Focus-Within */}
    <span className="pointer-events-none absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition duration-300 group-hover/input:opacity-100 group-focus-within/input:opacity-100" />
    <span className="pointer-events-none absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 blur-sm transition duration-300 group-hover/input:opacity-100 group-focus-within/input:opacity-100" />
  </div>
</div>
```

- **Checkboxes, Toggles & Selects**:
  - **Switches**: `w-9 h-5 rounded-full` track (`bg-neutral-200` unchecked, `bg-blue-600` checked) with a `w-4 h-4 rounded-full bg-white shadow-sm` thumb animated via Framer Motion `layout` spring (`stiffness: 500, damping: 30`).
  - **OTP / Verification Codes**: 6 individual `w-10 h-12 rounded-lg bg-neutral-50 shadow-input text-center font-mono text-base font-semibold text-neutral-800` slots with the bottom gradient beam appearing on the active slot.

### 4.2 Stacked Cards, Spotlight Cards & Hover Effects

1. **Card Hover Effect (Shared Sliding Backdrop Grid)**:
   - In a 3x2 grid of cards, track `hoveredIndex`. Render a shared `<motion.span layoutId="card-hover-bg" className="absolute inset-0 bg-neutral-200/70 dark:bg-neutral-800/80 block rounded-2xl -z-10" />` that physically glides from card to card as the cursor moves across the grid.
2. **Mouse-Tracking Radial Spotlight Card**:
   - Track cursor `(mouseX, mouseY)` relative to the card bounding box. Render a `pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition duration-300` overlay with `background: radial-gradient(350px circle at ${mouseX}px ${mouseY}px, rgba(59,130,246,0.08), transparent 80%)`.
3. **3D Perspective Card (`CardContainer` / `CardItem`)**:
   - For hero product cards or feature callouts, apply subtle `perspective: 1000px` on the parent and calculate `(clientX - center) / 25` rotation on mousemove, translating inner badges/layers forward with `translateZ(30px)` on hover.
4. **Stacked Notification / Deck Cards (`CardStack`)**:
   - Maintain an array of cards where index `0` is front (`z-30 scale-100 translate-y-0`), index `1` is middle (`z-20 scale-[0.95] -translate-y-2.5 opacity-90`), and index `2` is back (`z-10 scale-[0.90] -translate-y-5 opacity-75`). Use `bg-white rounded-xl border border-neutral-200/80 shadow-input p-4`.

### 4.3 Admin Dashboards & SaaS Application Shells

When building an internal tool, SaaS dashboard, or admin portal, never dump generic white cards onto a gray screen. Use Manu's **Inset App Shell Architecture**:

1. **The Viewport Frame & Collapsible Sidebar**:
   - The root layout is `flex h-screen w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden`.
   - **Sidebar (`bg-neutral-100 dark:bg-neutral-900`)**: Collapses to `w-[60px]` by default (showing only crisp `18px` icons) and smoothly springs open to `w-[240px]` on hover or pin (`animate={{ width: open ? 240 : 60 }}` with `stiffness: 300, damping: 30`). Labels fade in with `opacity: open ? 1 : 0` and `whitespace-pre`.
   - **Main Content Canvas (The Recessed Stage)**: Sits inside the frame as `<main className="flex-1 bg-white dark:bg-neutral-950 md:rounded-tl-2xl border-t border-l border-neutral-200 dark:border-neutral-800 overflow-y-auto p-6 sm:p-8 shadow-xs">`. This single `rounded-tl-2xl` inset corner immediately gives the app a custom Linear/Aceternity industrial feel.
2. **KPI Metric Cards**:
   - Wrap KPI rows in an **Outer/Inner Container** strip or separate them with `divide-x divide-dashed divide-neutral-200`.
   - Each KPI card has:
     - Top label: `text-xs font-medium text-neutral-500`.
     - Main value: `text-2xl font-semibold tracking-tight text-neutral-800 font-mono tabular-nums mt-1`.
     - Trend badge: Subtle monochromatic or soft tinted pill (`bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded px-1.5 py-0.5 text-[11px] font-mono`), paired with a minimal 1.5px stroke SVG sparkline.
3. **Data Tables**:
   - No heavy zebra striping or thick black headers.
   - Header row: `bg-neutral-50/80 text-[11px] font-medium uppercase tracking-wider text-neutral-500 border-y border-neutral-200/80`.
   - Body rows: `border-b border-dashed border-neutral-200/70 hover:bg-neutral-50/80 transition-colors duration-100`.
   - Status cells: Use the **Monochromatic Elevated Badge** (`rounded-md bg-white px-2 py-0.5 text-xs text-neutral-600 shadow-xs ring-1 ring-black/10`) or subtle semantic border tint—never loud solid neon pills.
4. **Command Palette (`Cmd+K` Modal) & Dialogs**:
   - Backdrop: `bg-black/20 dark:bg-black/50 backdrop-blur-xs`.
   - Modal Container: Outer/Inner framed modal (`bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200/80 shadow-2xl` wrapping an inner `bg-white rounded-xl overflow-hidden`).
   - Keyboard Shortcut Hints (`<kbd>`): `inline-flex items-center justify-center rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] border border-neutral-200`.
5. **Empty States & Loading Skeletons**:
   - **Empty States**: Never just write `"No data found"`. Render a muted dashed schematic illustration (e.g., 2 stacked ghost cards with `border-dashed border-neutral-300`) inside an Outer/Inner container with a tactile Primary CTA button below.
   - **Loading Skeletons**: Avoid jarring high-contrast pulsing bars. Use `bg-neutral-100 dark:bg-neutral-800/60 rounded-md` with a smooth translucent shimmer gradient sweeping across.

---

## 5. Animation & Micro-Interaction Physics

1. **Timing & Spring Constants**:
   - **Micro-Hovers (Buttons, Links, Badges)**: `150ms` to `200ms` CSS transition (`transition-all duration-150 ease-out`).
   - **Shared Layout Transitions (`layoutId` pills, tabs, bounding boxes)**: `type: "spring", stiffness: 380, damping: 30`.
   - **Drawers, Sidebars & Expanding Containers**: `type: "spring", stiffness: 300, damping: 28`.
   - **Asymmetric Enter/Exit Rule**: Entrance animations take `~200ms`; exit animations must complete in `~120ms` (`35-40%` faster) so the UI never feels like it is blocking the user.
2. **Continuous vs. Event-Driven Motion**:
   - **Strictly Ban**: Continuous infinite bouncing icons, permanent pulsing glow rings, or laser beams firing simultaneously across the screen.
   - **Enforce**: Animations must be **event-driven** (triggered when a message is sent, when a card is hovered, or scrubbed via scroll position).
3. **Seamless Hover Continuity**:
   - When dragging the cursor across a navbar, tab bar, or feature grid, the highlight box (`layoutId`) must glide continuously from item to item without flickering, unmounting, or breaking its border.

---

## 6. Pre-Flight Self-Audit Checklist (Run Before Returning Code)

Before finalizing any UI code, verify every item below:
- [ ] **Zero AI Slop Colors**: Are there any `purple-600`, `indigo-600`, or `pink-500` gradients or floating `blur-3xl` background blobs? *(If yes, replace with neutral/blue tactile tokens and radial dot/dashed grids.)*
- [ ] **Badge Purity**: Do any badges have green, orange, or red status circles at the start? *(If yes, remove the dot immediately and apply `rounded-md bg-white shadow-sm shadow-black/10 ring-1 ring-black/10`.)*
- [ ] **Outer/Inner Card Architecture**: Are cards and bento cells using the two-layer chassis (`bg-neutral-100 rounded-2xl p-2.5` outer + `bg-white rounded-xl` inner + text in the outer base)?
- [ ] **Button Depth**: Do primary buttons have the top-to-bottom gradient and dual inset/drop shadow, and are secondary buttons dropped down to `bg-neutral-50` / `bg-neutral-100`?
- [ ] **Typography & Contrast**: Are headings using `tracking-tight text-neutral-800` (never `#000000`), subtitles `text-neutral-500`, and metrics `tabular-nums`?
- [ ] **Dividers & Hovers**: Are section borders using `border-dashed border-neutral-200`, and do nav links use either the Figma 4-corner bounding box or a fluid `layoutId` glider?
- [ ] **Inputs & Forms**: Do inputs use the recessed `shadow-input` profile and the hover/focus `BottomGradient` beam?