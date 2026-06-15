# S267 Wave 1 — Bold-Local Inner-Page Dark Conversion: Spec

**Session:** S267 · **Wave:** 1 (spec only, NO CODE) · **Companion audit:**
`docs/audits/s267-bold-local-dark-audit.md`
**Phase 1.5 / Option 1:** `BL_TOKENS` charcoal is canonical for bold-local; the tenant palette
selects **accent only**. Charcoal surfaces are fixed.
**Goal:** bold-local inner routes (`service` / `blog` / `faq` / `legal`) render on the same
charcoal surface as the bold-local homepage, with WCAG-AA body-text contrast.

This document specifies the **exact** target values and per-component change list for the Wave-2
PR. No source files are changed here.

---

## 1. Target `--color-*` block for bold-local (synced to BL_TOKENS charcoal)

Replace `SHELL_THEMES['bold-local']` in `shared/lib/shellCssVars.ts` (current values in audit §2)
with the following. Each target value is annotated with the BL_TOKENS source it mirrors.

```ts
'bold-local': {
  '--color-primary':         '#F5A623',  // = --bl-accent      (palette-selectable accent)
  '--color-primary-dark':    '#E2541C',  // = --bl-accent-hot
  '--color-primary-light':   '#22282F',  // = --bl-surface-elevated (chip/raised on dark)
  '--color-accent':          '#F5A623',  // = --bl-accent
  '--color-text-on-primary': '#0F1216',  // = --bl-surface  (dark text on amber button)
  '--color-bg-hero':         '#0F1216',  // = --bl-surface
  '--color-bg-hero-end':     '#1A1F27',  // = --bl-surface-2
  '--color-bg-section':      '#0F1216',  // = --bl-surface   (was #f5f5f5 LIGHT)
  '--color-bg-cta':          '#1A1F27',  // = --bl-surface-2 (was #1c1c1e)
  '--color-nav-bg':          '#0F1216',  // = --bl-surface
  '--color-nav-text':        '#FFFFFF',  // = --bl-text
  '--color-footer-bg':       '#0F1216',  // = --bl-surface
  '--color-footer-text':     '#FFFFFF',  // = --bl-text
  '--color-btn-bg':          '#F5A623',  // = --bl-accent
  '--color-btn-text':        '#0F1216',  // = --bl-surface
  '--color-heading':         '#FFFFFF',  // = --bl-text   (was #1c1c1e DARK)
  '--color-body-text':       '#C9CDD2',  // NEW = --bl-text-secondary  (see §2)
  '--color-border':          '#2A3038',  // = --bl-border  (optional, for island borders)
  '--font-heading':          'var(--font-oswald), Oswald, sans-serif',
  '--font-body':             'Inter, sans-serif',
},
```

### 1.1 Required guard in `computeShellCssVars` (palette = accent only)

Per Option 1, the palette must **not** re-derive bold-local surfaces. Add an early bold-local
branch in `computeShellCssVars` (`shared/lib/shellCssVars.ts`, before the generic
`PALETTE_HERO` / `darkenHex` logic at lines 170–194) that:

1. Keeps **all** surface vars from the static charcoal base block (no `PALETTE_HERO`, no
   `darkenHex`, no `lightenHex`).
2. Lets the palette drive **only** `--color-accent` (and, if a tenant accent is set,
   `--color-primary` / `--color-btn-bg` to track it). Default stays `#F5A623`.
3. Recomputes `--color-btn-text` to a readable on-accent value (`#0F1216` for amber-family
   accents; `#FFFFFF` only if a tenant picks a dark accent — guard with a luminance check).

> Without this guard, a tenant `primary_color` such as `#e87800` would re-warm
> `--color-bg-hero/-cta/-nav/-footer` via `PALETTE_HERO`, defeating the conversion.

---

## 2. New token: `--color-body-text`

| Token | bold-local value | Light shells value | Source |
|---|---|---|---|
| `--color-body-text` | `#C9CDD2` | `#374151` (preserves today's look) | `--bl-text-secondary` / current `LegalPageLayout` fallback |

- Add `--color-body-text` to **every** `SHELL_THEMES` entry in `shared/lib/shellCssVars.ts`
  (and the mirror `src/lib/shellThemes.ts` `THEME_CONFIGS` if it carries the same map) so
  `LegalPageLayout`'s existing `var(--color-body-text, #374151)` becomes token-correct on all
  shells. Only bold-local's value changes behavior (light → `#C9CDD2`).
- Suggested light-shell values: `modern-pro #334155`, `clean-friendly #334155`,
  `rustic-rugged #44403c`, `metro-pro #374151`. (All ≥ 7:1 on their light `--color-bg-section`.)
  These keep current appearance; only the **token plumbing** is new.

---

## 3. Per-component / per-route change list (Wave 2)

Ordering: foundation first (tokens), then per render site. Each item lists the file, the exact
edit intent, and the contrast outcome. **"No change"** rows are listed so reviewers can confirm
they were considered.

### F. Foundation (do first)

| # | File | Change |
|---|---|---|
| F1 | `shared/lib/shellCssVars.ts` | Replace `SHELL_THEMES['bold-local']` block with §1 target; add `--color-body-text` to **all** shells (§2). |
| F2 | `shared/lib/shellCssVars.ts` | Add bold-local guard in `computeShellCssVars` (§1.1) so palette = accent only. |
| F3 | `src/lib/shellThemes.ts` | Mirror the `--color-body-text` additions if the client-side map is authoritative for any path (parity with server twin). |

### A. `/[service]` — pest slug

| # | File | Change |
|---|---|---|
| A1 | `_shells/bold-local/BoldLocalPestPage.tsx` | **No change** — already `--bl-*` charcoal (reference). |

### B. `/[service]` — service-area slug (`[service]/page.tsx` inline + shared sections)

| # | File | Change |
|---|---|---|
| B1 | `[service]/page.tsx` | "Local service" section (line 81) `bg-white` → `var(--color-bg-section)` **or** `--bl-surface-2` island; intro `<p>` `text-gray-600` (92/94/95) → `var(--color-body-text)`. |
| B2 | `[service]/page.tsx` | "We Also Serve" chips section uses `bg-white` chips — switch chip bg to `--bl-surface-elevated` + `--color-body-text`/accent, or accept charcoal section with bordered chips. |
| B3 | `_components/CityFaqAccordion.tsx` | Section `bg-white` → `var(--color-bg-section)`; inner panel `bg-gray-50`→`--bl-surface-2`; `divide-gray-100`→`var(--color-border)`; answer `text-gray-600` → `var(--color-body-text)`. |
| B4 | `_components/sections/WhyChooseUs.tsx` | **No structural change** (white-on-`--color-primary`). ⚠️ Validator must confirm white-on-amber; if it fails, gate decides remedy (see §4). |
| B5 | `_components/sections/Process.tsx` | **No change** — `--color-bg-hero` charcoal + white text, dark-safe. |
| B6 | `_components/sections/CtaBanner.tsx` | **No change** — `--color-bg-cta` charcoal + white text, dark-safe. |

### C. `/faq` (`faq/page.tsx` inline)

| # | File | Change |
|---|---|---|
| C1 | `faq/page.tsx` | Answer `<p>` (line 89) `text-gray-600` → `var(--color-body-text)`. |
| C2 | `faq/page.tsx` | Category `h2` (84) stays `var(--color-primary)` (amber on charcoal ≈ 8.9:1 — OK). Question `h3` (88) `var(--color-heading…)` → white via F1 ✓. |
| C3 | `faq/page.tsx` | Closing CTA section already `--color-bg-cta` + white text — verify only. |

### D. `/blog` (`blog/page.tsx` inline)

| # | File | Change |
|---|---|---|
| D1 | `blog/page.tsx` | Post card (56) `bg-white border-gray-200` → `--bl-surface-2` + `var(--color-border)`; date (65) `text-gray-400` → `var(--color-text-muted)`/`#9AA3AD`; excerpt (67) `text-gray-600` → `var(--color-body-text)`. |
| D2 | `blog/page.tsx` | Newsletter section (76) `bg-white` → `var(--color-bg-section)` or `--bl-surface-2`; body (79) `text-gray-600` → `var(--color-body-text)`; email input (81) `border-gray-300 text-gray-900` → dark-surface input (`--bl-surface-elevated` bg, `--bl-text` text, `--bl-border`). |

### E. `/blog/[post]` (`blog/[post]/page.tsx` inline)

| # | File | Change |
|---|---|---|
| E1 | `blog/[post]/page.tsx` | **`prose prose-gray` → `prose prose-invert`** (or a bold-local prose color override) so Typography body/headings are light on charcoal. Highest-priority contrast fix on this route. |
| E2 | `blog/[post]/page.tsx` | Date (46) `text-gray-400` → `var(--color-text-muted)`. |
| E3 | `blog/[post]/page.tsx` | Closing section (53) `bg-white` → `var(--color-bg-section)`/`--bl-surface-2`. |

### G. Legal (`/privacy /terms /accessibility /sms-terms` via `LegalPageLayout`)

| # | File | Change |
|---|---|---|
| G1 | `_components/LegalPageLayout.tsx` | **No code change needed for body** — `var(--color-body-text, #374151)` now resolves to `#C9CDD2` via F1. Verify only. |
| G2 | `_components/LegalPageLayout.tsx` | "Last Updated" line (14) `text-gray-500` → `var(--color-text-muted)` so the meta line is legible on charcoal. |
| G3 | route files (`privacy/terms/sms-terms/accessibility`) | **No change** — `H2/P/UL/LI` inherit `--color-body-text`; inline links use `var(--color-primary…)` (amber on charcoal ≈ 8.9:1 OK). Verify link contrast in gate. |

> Net code footprint: **2 foundation files** + **~6 inner render sites**. The legal surface
> (4 routes) is fixed almost entirely by the token change alone (F1) — the deliberate payoff of
> routing all legal body text through one token.

---

## 4. Validator gate (Perplexity + Gemini · conservative-wins)

Run **before** the Wave-2 PR is opened. Two independent models review the proposed
charcoal + text pairings for contrast/accessibility; **conservative-wins** — if either model
flags a pairing as failing or borderline, adopt the stricter remedy.

### 4.1 Pairings to validate (computed contrast, for the models to confirm/refute)

| Pairing | FG | BG | Computed ratio | WCAG AA (normal/large) |
|---|---|---|---|---|
| Body text on base surface | `#C9CDD2` | `#0F1216` | ≈ **11.9:1** | ✅ / ✅ |
| Body text on raised surface | `#C9CDD2` | `#1A1F27` | ≈ **10.7:1** | ✅ / ✅ |
| Body text on card | `#C9CDD2` | `#22282F` | ≈ **9.4:1** | ✅ / ✅ |
| Heading (white) on surface | `#FFFFFF` | `#0F1216` | ≈ **18.9:1** | ✅ / ✅ |
| Muted label on surface | `#9AA3AD` | `#0F1216` | ≈ **7.4:1** | ✅ / ✅ |
| Amber accent (links/h2) on surface | `#F5A623` | `#0F1216` | ≈ **8.9:1** | ✅ / ✅ |
| Amber button text | `#0F1216` | `#F5A623` | ≈ **8.9:1** | ✅ / ✅ |
| ⚠️ White on amber (`WhyChooseUs`) | `#FFFFFF` | `#F5A623` | ≈ **2.1:1** | ❌ / ❌ (large fails too) |

### 4.2 Decisions the gate must return

1. **`WhyChooseUs` white-on-amber (B4):** pre-existing failure surfaced by this audit. Gate
   decides: (a) leave as-is (out of S267 scope, log follow-up), (b) darken the section text to
   `--bl-surface`, or (c) change the section bg off `--color-primary`. Conservative-wins implies
   **not shipping a known fail silently** — at minimum log a tracked follow-up if not fixed here.
2. **`prose-invert` (E1):** confirm `prose-invert` (or explicit override) yields AA for body,
   headings, links, `<strong>`, list markers, and blockquotes on `#0F1216`.
3. **Amber links inside legal bodies (G3):** confirm `#F5A623`/`var(--color-primary)` link text
   on `#0F1216` ≥ 4.5:1 (computed 8.9:1) and that underline/hover states remain distinguishable.
4. **Dark form input (D2):** confirm placeholder + entered text contrast on the dark input bg.
5. **Palette-accent guard (F2):** confirm that allowing a tenant to override only the accent
   cannot drop any accent-on-charcoal or text-on-accent pairing below AA; if a low-luminance or
   very-light accent could, recommend an accent luminance clamp / auto `--color-btn-text` flip.

### 4.3 Gate output artifact

Record both models' verdicts (PASS / FLAG + remedy) per pairing in
`docs/audits/s267-validator-gate.md` (mirroring the `s230-validator-gate.md` /
`s237-validator-gate.md` format), apply conservative-wins, and only then open the Wave-2 PR.

---

## 5. Out of scope (explicit)

- Homepage, `/about`, navbar, footer — already `--bl-*` charcoal.
- The 4 homepage-only section components (`ServicesGrid`, `FaqTabs`, `Reviews`, `BlogCarousel`).
- `/contact`, `/quote`, `/reviews`, `/service-area` index — not in the named
  service/blog/faq/legal set (assess in a later wave if desired).
- Any change to the `--bl-*` token values themselves (they are canonical and unchanged).
