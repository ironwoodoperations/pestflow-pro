# S267 Wave 1 — Bold-Local Inner-Page Dark Conversion: Read-Only Audit

**Session:** S267
**Wave:** 1 (audit + spec, NO CODE)
**Phase 1.5 decision (confirmed):** Option 1 — `BL_TOKENS` cool-charcoal is canonical for
bold-local. The tenant palette selects **accent only**; charcoal surfaces are fixed and do
**not** vary with the palette.
**Scope:** bold-local inner routes only — `service`, `blog`, `faq`, `legal`.
**Status:** read-only. No source file was modified in this wave.

---

## 0. Executive summary / honest reconciliation

The session prompt asked for a **"38-component inventory"** under
`app/tenant/[slug]/_components/sections/*`. **That number does not match the current
codebase** and is documented here rather than fabricated to fit:

- `app/tenant/[slug]/_components/sections/` contains exactly **7** components:
  `BlogCarousel`, `CtaBanner`, `FaqTabs`, `Process`, `Reviews`, `ServicesGrid`, `WhyChooseUs`.
- Of those 7, only **3** ever render on a bold-local **inner** route (and only on the
  service-**area** variant of `/[service]`): `WhyChooseUs`, `Process`, `CtaBanner`.
- The remaining 4 (`ServicesGrid`, `FaqTabs`, `Reviews`, `BlogCarousel`) render **only on the
  metro/default homepage** (`page.tsx` fallback branch) — never on bold-local inner routes.
- The real bold-local inner-page contrast surface is a **mix of route-level inline markup**
  (in the `faq`, `blog`, `blog/[post]`, and `/[service]` service-area pages) **plus the shared
  `LegalPageLayout` and `CityFaqAccordion` components** — not 38 section components.

The genuine surface that needs auditing is therefore **9 render sites** (4 inner route files +
2 shared components + 3 shared section components), enumerated in §3. Treat "38" as a stale
estimate from the prompt; the corrected inventory below is the authoritative one.

### The one mechanism that makes this conversion necessary

`app/tenant/[slug]/layout.tsx:169` injects **both** variable sets at `:root` for bold-local:

```tsx
<style dangerouslySetInnerHTML={{ __html: cssVars + `:root{${BL_TOKENS}}` }} />
```

- `cssVars` = `computeShellCssVars('bold-local', …)` → the **`--color-*`** family
  (currently **warm-brown**, with a **light** `--color-bg-section: #f5f5f5`).
- `BL_TOKENS` = the **`--bl-*`** family (charcoal).

The bold-local **homepage** and the **pest** service page, About page, navbar and footer all
read `--bl-*` → they are already dark charcoal. But the **faq / blog / legal / service-area**
inner pages read `--color-*` → they currently render **light** (light gray sections, dark text).
The result is a jarring dark-home / light-inner mismatch. S267 closes that gap by syncing the
bold-local `--color-*` family to the charcoal `--bl-*` values and adding one new body-text token.

---

## 1. Exact current `BL_TOKENS` (verbatim)

**Path note:** the prompt referenced `BoldLocalFonts.ts` as the location, and it is correct —
`BL_TOKENS` still lives in **`app/tenant/[slug]/_shells/bold-local/BoldLocalFonts.ts`**
(it did not move after S265). Full verbatim block below.

```ts
// app/tenant/[slug]/_shells/bold-local/BoldLocalFonts.ts  (lines 17–61)
export const BL_TOKENS = [
  // Color
  '--bl-surface:#0F1216',
  '--bl-surface-2:#1A1F27',
  '--bl-surface-elevated:#22282F',
  '--bl-accent:#F5A623',
  '--bl-accent-hot:#E2541C',
  '--bl-text:#FFFFFF',
  '--bl-text-secondary:#C9CDD2',
  '--bl-text-muted:#9AA3AD',
  '--bl-border:#2A3038',
  '--bl-border-strong:#3A434F',
  // Typography
  "--bl-font-display:var(--font-barlow,'Barlow Condensed','Oswald',sans-serif)",
  "--bl-font-body:var(--font-inter,'Inter',sans-serif)",
  '--bl-font-weight-regular:400',
  '--bl-font-weight-medium:500',
  '--bl-font-weight-bold:700',
  '--bl-letter-spacing-tight:-0.01em',
  '--bl-letter-spacing-normal:0',
  '--bl-letter-spacing-wide:0.13em',
  '--bl-line-height-tight:1.05',
  '--bl-line-height-normal:1.4',
  '--bl-line-height-loose:1.65',
  // Spacing (tight)
  '--bl-space-xs:0.25rem',
  '--bl-space-sm:0.5rem',
  '--bl-space-md:1rem',
  '--bl-space-lg:1.5rem',
  '--bl-space-xl:2.5rem',
  '--bl-space-2xl:3.5rem',
  '--bl-space-3xl:5rem',
  // Radius (sharp)
  '--bl-radius-sm:0px',
  '--bl-radius-md:0px',
  '--bl-radius-lg:2px',
  '--bl-radius-pill:0px',
  // Shadows (stark / mostly none)
  '--bl-shadow-sm:0 1px 0 rgba(0,0,0,0.4)',
  '--bl-shadow-md:0 4px 0 rgba(0,0,0,0.5)',
  '--bl-shadow-lg:0 8px 0 rgba(0,0,0,0.6)',
  // Transitions
  '--bl-transition-fast:80ms ease',
  '--bl-transition-normal:140ms ease',
].join(';') + ';';
```

**Canonical charcoal color values (the ones the conversion syncs to):**

| Token | Value | Role |
|-------|-------|------|
| `--bl-surface` | `#0F1216` | base dark surface |
| `--bl-surface-2` | `#1A1F27` | raised surface (strips, CTA bands) |
| `--bl-surface-elevated` | `#22282F` | cards / chips |
| `--bl-accent` | `#F5A623` | amber accent (the palette-selectable one) |
| `--bl-accent-hot` | `#E2541C` | hot-orange accent |
| `--bl-text` | `#FFFFFF` | primary heading/body-on-dark |
| `--bl-text-secondary` | `#C9CDD2` | secondary body text |
| `--bl-text-muted` | `#9AA3AD` | muted labels |
| `--bl-border` | `#2A3038` | hairline border |
| `--bl-border-strong` | `#3A434F` | strong border |

---

## 2. Exact current bold-local `--color-*` block (verbatim — the warm-brown being replaced)

**Path:** `shared/lib/shellCssVars.ts`, `SHELL_THEMES['bold-local']`, lines **31–50**.

```ts
// shared/lib/shellCssVars.ts  (lines 31–50)
'bold-local': {
  '--color-primary':         '#f59e0b',
  '--color-primary-dark':    '#d97706',
  '--color-primary-light':   '#fef3c7',
  '--color-accent':          '#f59e0b',
  '--color-text-on-primary': '#1c1c1e',
  '--color-bg-hero':         '#2d1a00',
  '--color-bg-hero-end':     '#1a0f00',
  '--color-bg-section':      '#f5f5f5',
  '--color-bg-cta':          '#1c1c1e',
  '--color-nav-bg':          '#1c1c1e',
  '--color-nav-text':        '#ffffff',
  '--color-footer-bg':       '#1c1c1e',
  '--color-footer-text':     '#ffffff',
  '--color-btn-bg':          '#f59e0b',
  '--color-btn-text':        '#1c1c1e',
  '--color-heading':         '#1c1c1e',
  '--font-heading':          'var(--font-oswald), Oswald, sans-serif',
  '--font-body':             'Inter, sans-serif',
},
```

**The two values that break the dark conversion today:**

- `--color-bg-section: #f5f5f5` — a **light** section background. Every inner page roots its
  body in `var(--color-bg-section)`, so the inner pages are currently light, not charcoal.
- `--color-heading: #1c1c1e` — **near-black** heading text. Fine on light `#f5f5f5`; invisible
  on charcoal.

There is also a **runtime override path** that must be neutralized for bold-local
(see §2.1) — the base block is not the whole story.

### 2.1 The palette-override path (`computeShellCssVars`) — also in scope

`computeShellCssVars(template, primaryColor, accentColor)` (same file, lines 159–201) mutates
the base block at request time based on `tenant.primary_color`:

- If `primary` matches a `PALETTE_HERO` key (lines 117–137), it overrides
  `--color-bg-hero / -end / -cta / -nav-bg / -nav-text / -footer-bg / -footer-text`.
- Else for non-`clean-friendly` templates it calls
  `darkenHex(primaryColor, 0.35)` / `darkenHex(primaryColor, 0.2)` to derive
  `--color-bg-hero` / `--color-bg-hero-end` from the primary.
- `--color-btn-bg` follows accent (or primary); `--color-btn-text` is `#ffffff` or `#1c1c1e`.

**Consequence:** even after we rewrite the static `bold-local` base block to charcoal, a tenant
whose `primary_color` is, say, `#e87800` would have `--color-bg-hero` re-derived to a **warm**
value by `PALETTE_HERO['#e87800']` / `darkenHex`, re-introducing brown surfaces. Phase-1.5
Option 1 ("palette selects accent only") therefore requires a **bold-local guard** in
`computeShellCssVars` so that, for `template === 'bold-local'`, **only** `--color-accent` (and
`--color-primary` if we choose to track accent) is palette-driven and **all surface vars stay
charcoal**. This is documented as a spec item, not changed in this wave.

---

## 3. The corrected inner-route component inventory (contrast-audit surface)

Bold-local inner routes and what actually renders on each. For each render site: the
`--color-*` / `--bl-*` vars it reads, and **every** place a body/heading text color is set,
flagged as **[TOKEN]** (token-driven) or **[TW-DEFAULT]** (hardcoded Tailwind/ literal — the
contrast risks on a dark surface).

### Route → component map (bold-local)

| Inner route | File / component | Token family | Dark-ready today? |
|---|---|---|---|
| `/[service]` — **pest** slug | `_shells/bold-local/BoldLocalPestPage.tsx` | `--bl-*` | ✅ already charcoal |
| `/[service]` — **service-area** slug | inline markup in `[service]/page.tsx` + `WhyChooseUs` + `Process` + `CtaBanner` + `CityFaqAccordion` | `--color-*` + TW grays | ❌ light/mixed |
| `/blog` | inline markup in `blog/page.tsx` | `--color-*` + TW grays | ❌ light |
| `/blog/[post]` | inline markup in `blog/[post]/page.tsx` (+ `prose prose-gray`) | `--color-*` + TW grays | ❌ light |
| `/faq` | inline markup in `faq/page.tsx` | `--color-*` + TW grays | ❌ light |
| `/privacy`, `/terms`, `/accessibility`, `/sms-terms` | `LegalPageLayout.tsx` (wrapper) + inline `H2/P/UL/LI` | `--color-*` + missing `--color-body-text` | ❌ light / undefined token |

> Out of scope but confirmed dark already (dedicated bold-local components, `--bl-*`):
> `/` (home shell), `/about` (`BoldLocalAboutPage`), navbar (`BoldLocalNavbar`),
> footer (`BoldLocalFooter`). Not part of this conversion.

---

### 3.1 `BoldLocalPestPage.tsx` — `/[service]` (pest slug) — ✅ reference / no change

Fully `--bl-*` driven, already charcoal. **This is the gold standard** the other pages should
match. Color usages (all [TOKEN]):

- Root/sections bg: `var(--bl-surface)`, `var(--bl-surface-2)`, `var(--bl-accent)` (CTA bar).
- Headings: `color: var(--bl-text)` (via `HEAD_STYLE`). Eyebrows: `var(--bl-accent)`.
- Body text: `var(--bl-text-secondary)` (blurbs, signs, treatment), `var(--bl-text-muted)`
  (license labels, stats labels, secondary note).
- Borders: `var(--bl-border)`, `rgba(245,166,35,0.25)`.
- **No Tailwind-default text colors.** No change required.

---

### 3.2 `[service]/page.tsx` — service-area branch (non-pest slug) — ❌ mixed

Inline markup (lines 57–126). Color usages:

| Location (line) | Setter | Flag |
|---|---|---|
| root `div` bg (58) | `var(--color-bg-section)` | [TOKEN] → becomes charcoal ✓ |
| hero `<section>` bg (59) | `linear-gradient(var(--color-bg-hero) → var(--color-bg-hero-end))` | [TOKEN] |
| hero `h1` (62), subtitle (63) | `text-white` / `text-white/70` | [TW-DEFAULT] but on dark hero — OK |
| breadcrumb nav bg (71) | `var(--color-primary)` + `text-white/80` | [TOKEN bg] |
| **"local service" `<section className="py-16 bg-white">` (81)** | `bg-white` | **[TW-DEFAULT bg]** → white island on charcoal |
| eyebrow (89) | `var(--color-accent)` | [TOKEN] |
| `h2` (90) | `var(--color-primary)` | [TOKEN] |
| **intro `<p>` body (92, 94, 95)** | `text-gray-600` | **[TW-DEFAULT]** dark-on-dark risk if bg flips |
| "We Also Serve" `h2` (113) | `var(--color-heading, #1a1a1a)` | [TOKEN w/ dark fallback] |
| chips (116) | `var(--color-primary)` borders/text on `bg-white` | [TW-DEFAULT bg] |

Because this section uses `bg-white` explicitly, the body text remains readable **inside the
white island**, but the island clashes with the charcoal page. Decision needed (spec): convert
island to `--bl-surface-2` + light text, **or** leave white islands intact. Spec recommends
converting to charcoal for consistency.

---

### 3.3 `faq/page.tsx` — `/faq` — ❌ light

| Location (line) | Setter | Flag |
|---|---|---|
| root `div` bg (65) | `var(--color-bg-section)` | [TOKEN] → charcoal ✓ |
| hero `<section>` bg (70–72) | image OR `linear-gradient(var(--color-bg-hero) → -end)` | [TOKEN] |
| hero `h1` (75) `text-white`, sub (76) `text-white/75` | [TW-DEFAULT on dark hero] OK |
| FAQ `<section>` bg (80) | `var(--color-bg-section)` | [TOKEN] → charcoal ✓ |
| category `h2` (84) | `var(--color-primary)` | [TOKEN] |
| **question `h3` (88)** | `var(--color-heading, #1a1a1a)` | [TOKEN] → white after sync ✓ |
| **answer `<p>` (89)** | `text-gray-600` | **[TW-DEFAULT]** → fails on charcoal |
| non-CF closing CTA `<section>` bg (121) | `var(--color-bg-cta, #0a1628)` | [TOKEN] |
| CTA `h2`/`p` (123–124) | `text-white` / `text-white/75` | [TW-DEFAULT on dark] OK |

`isCF` branch (lines 98–119) is clean-friendly only — not bold-local; ignore.

---

### 3.4 `blog/page.tsx` — `/blog` — ❌ light

| Location (line) | Setter | Flag |
|---|---|---|
| root `div` bg (40) | `var(--color-bg-section)` | [TOKEN] → charcoal ✓ |
| hero (42–44) | image OR `var(--color-bg-hero) → -end`; `text-white`/`/75` | [TOKEN] / OK |
| posts `<section>` bg (52) | `var(--color-bg-section)` | [TOKEN] → charcoal ✓ |
| **post card (56)** | `bg-white` + `border-gray-200` | **[TW-DEFAULT bg]** white island |
| card image wrap bg (57) | `var(--color-primary)` | [TOKEN] |
| **card date (65)** | `text-gray-400` | **[TW-DEFAULT]** |
| **card title `h3` (66)** | `var(--color-heading, #1a1a1a)` | [TOKEN] → white ✓ but on white card |
| **card excerpt (67)** | `text-gray-600` | **[TW-DEFAULT]** |
| "Read More" (68) | `var(--color-primary)` | [TOKEN] |
| **newsletter `<section>` (76)** | `bg-white` | **[TW-DEFAULT bg]** |
| newsletter `h2` (78) | `var(--color-heading, #1a1a1a)` | [TOKEN] |
| **newsletter `<p>` (79)** | `text-gray-600` | **[TW-DEFAULT]** |
| email input (81) | `border-gray-300 text-gray-900` | **[TW-DEFAULT]** |

---

### 3.5 `blog/[post]/page.tsx` — `/blog/[post]` — ❌ light

| Location (line) | Setter | Flag |
|---|---|---|
| root `div` bg (31) | `var(--color-bg-section)` | [TOKEN] → charcoal ✓ |
| hero image wrap bg (34) | `var(--color-primary)` | [TOKEN] |
| "Back to Blog" (43) | `var(--color-primary)` | [TOKEN] |
| **article `h1` (44)** | `var(--color-heading, #1a1a1a)` | [TOKEN] → white ✓ |
| **date (46)** | `text-gray-400` | **[TW-DEFAULT]** |
| **article body (50)** | `prose prose-gray` (Tailwind Typography) | **[TW-DEFAULT]** — `.prose` sets near-black body/headings; fails on charcoal |
| **closing `<section>` (53)** | `bg-white` | **[TW-DEFAULT bg]** white island |
| closing `h2` (55) | `var(--color-heading, #1a1a1a)` | [TOKEN] |

> `prose prose-gray` is the single biggest contrast risk: the Tailwind Typography plugin sets
> dark `--tw-prose-body`/`-headings`. On charcoal it needs `prose-invert` (or a bold-local
> prose color override). Called out explicitly in the spec.

---

### 3.6 `LegalPageLayout.tsx` — `/privacy /terms /accessibility /sms-terms` — ❌ token gap

```tsx
// _components/LegalPageLayout.tsx
<main … style={{ backgroundColor: 'var(--color-bg-section)' }}>        // [TOKEN] → charcoal ✓
  <h1 … style={{ color: 'var(--color-heading, inherit)' }}>{title}</h1>  // [TOKEN] → white ✓
  <p className="text-sm text-gray-500 …">Last Updated: …</p>            // [TW-DEFAULT]
  <div … style={{ color: 'var(--color-body-text, #374151)' }}>          // [TOKEN — but UNDEFINED, see §4]
    {children}                                                          // inline H2/P/UL/LI inherit this color
  </div>
</main>
```

The legal route bodies (`privacy/terms/sms-terms/accessibility` `H2/P/UL/LI` helpers) set **no**
explicit color → they inherit the wrapper `<div>`'s `var(--color-body-text, #374151)`. So the
**entire legal body is governed by one token**: `--color-body-text`. Inline links inside legal
bodies use `var(--color-primary,#0ea5e9)` [TOKEN] — fine. The only [TW-DEFAULT] is the
"Last Updated" `text-gray-500` line (14).

---

### 3.7 Shared section components used on the service-area inner page

**`WhyChooseUs.tsx`** — section bg `var(--color-primary)` [TOKEN]; all text `text-white` /
`text-white/70` / `text-white/60` [TW-DEFAULT on colored bg]. Cards `bg-white/10`. **Dark-safe**
*provided* `--color-primary` stays a saturated color with white-readable contrast. ⚠️ Note: with
amber `#F5A623` primary, `text-white` on amber is a **pre-existing** low-contrast condition
(~1.9:1) — flagged for the validator but it is not introduced by this conversion.

**`Process.tsx`** — section bg `var(--color-bg-hero)` [TOKEN] → charcoal ✓; text `text-white` /
`text-white/60` / `/50` [TW-DEFAULT on dark] OK; step circles `var(--color-accent)`. Dark-safe.

**`CtaBanner.tsx`** — section bg `var(--color-bg-cta)` [TOKEN] → charcoal ✓; heading/body
`text-white` / `text-white/70` OK; one button hardcoded `#ffffff` bg / `#1a1a1a` text (24) —
white pill on charcoal, acceptable. Dark-safe.

**`CityFaqAccordion.tsx`** — section `bg-white` **[TW-DEFAULT bg]** white island; inner panel
`bg-gray-50` + `divide-gray-100`; question `var(--color-heading,#1a1a1a)` [TOKEN]; **answer
`text-gray-600` [TW-DEFAULT]**. Needs conversion (white island + gray body on charcoal).

---

### 3.8 The 4 homepage-only section components (NOT on bold-local inner routes)

For completeness (so the "every component under sections/*" instruction is fully discharged) —
these render only via `page.tsx`'s **default/metro** branch and are **never** reached on
bold-local inner routes. No change in this conversion:

- `ServicesGrid.tsx` — `bg-white`, `text-gray-500`, `var(--color-heading/-accent/-primary)`.
- `FaqTabs.tsx` — `bg-white`, `bg-gray-50`, `text-gray-600`, hardcoded `#f1f3f5`/`#555`.
- `Reviews.tsx` — `#f1f3f5` bg, `bg-white` cards, `text-gray-600/-500/-400`.
- `BlogCarousel.tsx` — `bg-white`, `text-gray-400/-500`, `var(--color-heading/-primary)`.

---

## 4. The body-text-token gap

**Does any `--color-text` / `--color-body-text` token exist?** — **No.**

- Grep across the repo: `--color-body-text` is **referenced** in exactly one source file
  (`_components/LegalPageLayout.tsx:15`, as `var(--color-body-text, #374151)`) and mentioned in
  `docs/ROADMAP.md`. It is **never defined** in `shared/lib/shellCssVars.ts`,
  `src/lib/shellThemes.ts`, or anywhere else → it **always** resolves to its fallback `#374151`
  (a dark slate gray).
- A generic `--color-text` is **not defined** anywhere. (`--color-text-on-primary` and
  `--color-text-muted` exist but are different roles: on-button text and a muted label that is
  itself only referenced, never defined for the `--color-*` family — `--color-text-muted` falls
  back to `#6b7280` in `ModernProServicesGrid`.)

**Why this is the one genuinely new token:** on the converted charcoal surface, `#374151` body
text gives ≈ 1.7:1 contrast on `#0F1216` — fails WCAG badly. Every legal page body inherits this
single token, and the same value is the natural target for replacing the scattered
`text-gray-600 / -500 / -400` Tailwind defaults on faq/blog/service-area pages.

**Proposed minimal new token:**

| Token | Value | Rationale |
|---|---|---|
| `--color-body-text` | `#C9CDD2` | Exactly `--bl-text-secondary`. Already the established bold-local secondary-body color; ≈ **11.9:1** on `#0F1216` (AAA). Reuses the existing reference site in `LegalPageLayout` (no new wiring there). |

> Adding `--color-body-text` to **all** `SHELL_THEMES` entries (not just bold-local) is the
> clean fix so `LegalPageLayout` is token-correct on every shell — but the **only value that
> changes behavior this wave** is the bold-local one. Light shells should define
> `--color-body-text` to their existing dark body value (e.g. `#374151`) to preserve current
> appearance. This is detailed in the spec.

---

## Appendix A — files read for this audit

- `app/tenant/[slug]/_shells/bold-local/BoldLocalFonts.ts` (BL_TOKENS)
- `shared/lib/shellCssVars.ts` (SHELL_THEMES, PALETTE_HERO, computeShellCssVars)
- `app/tenant/[slug]/layout.tsx` (token injection mechanism)
- `app/tenant/[slug]/page.tsx` (homepage shell dispatch — scope confirmation)
- `app/tenant/[slug]/[service]/page.tsx` (service + service-area)
- `app/tenant/[slug]/_shells/bold-local/BoldLocalPestPage.tsx` (reference dark page)
- `app/tenant/[slug]/faq/page.tsx`, `blog/page.tsx`, `blog/[post]/page.tsx`
- `app/tenant/[slug]/privacy/page.tsx`, `terms/page.tsx`, `sms-terms/page.tsx`, `accessibility/page.tsx`
- `app/tenant/[slug]/_components/LegalPageLayout.tsx`, `CityFaqAccordion.tsx`
- `app/tenant/[slug]/_components/sections/{WhyChooseUs,Process,CtaBanner,ServicesGrid,FaqTabs,Reviews,BlogCarousel}.tsx`
- `app/tenant/[slug]/about/page.tsx` (scope confirmation — BoldLocalAboutPage already dark)
