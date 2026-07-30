# REVIEW — S-VG-2: Vita Glow Shell Rework

**Branch:** `claude/vita-glow-shell-713b3f` (restarted from `main` after S-VG-1 / PR #238 merged)
**Scope:** Rework the EXISTING `app/tenant/[slug]/_shells/vita-glow/` shell to the approved v3 direction (cream-led, espresso accent-only, gold highlight), fix the serif-not-rendering bug, and wire real-logo rendering. NOT a new shell, NOT a new tenant.

---

## 1. CRITICAL BUG — serif not rendering — ROOT-CAUSED & FIXED

### Diagnosis (proven, not guessed)
The live site rendered headlines in a plain sans-serif instead of Cormorant Garamond. I could not reach the live host (403/Vercel protection) so I diagnosed from build artifacts + a headless computed-style reproduction (Playwright + the real built font CSS).

**Root cause:** next/font/google's `.variable` class defines `--font-cormorant` on the shell **wrapper `<div>`**. But `--vg-font-display` was declared at **`:root`** as `var(--font-cormorant), 'Cormorant Garamond', serif`. A nested `var()` inside a custom property is resolved in the scope where that custom property is **declared** (`:root`), where the wrapper's `--font-cormorant` is **not visible**. With no fallback inside the `var()`, `--vg-font-display` became the guaranteed-invalid value → every heading using `font-family: var(--vg-font-display)` was invalid-at-computed-value-time → it **inherited the ancestor sans-serif** (`<body class="font-sans">`). That yields sans-serif, exactly as reported.

Reproduced precisely (see QA report): a heading using an intermediate `:root` custom property that nested `var(--font-cormorant)` → computed `ui-sans-serif, Arial, sans-serif` (BUG); the same family placed **directly** → computed the real Cormorant. This also explains why it was hard to spot: at worst one would expect `serif`, but the invalid-value inheritance produces sans.

### Fix (`VitaGlowFonts.ts`)
Build the font tokens from next/font's **resolved family** (`cormorantFont.style.fontFamily` / `jostFont.style.fontFamily`) baked directly into `--vg-font-display` / `--vg-font-body` — no nested `var(--font-cormorant)` at `:root`. The value is now valid regardless of wrapper scope. Verified: h1/h2 compute to `__Cormorant_Garamond_16bb0c` in a faithful headless render (screenshot in QA). The `.variable` classes remain on the wrapper (harmless; also ensures the font loads).

> Note (out of scope, flagged for Scott): `dang` and `bold-local` use the same `var(--font-x)`-outside-the-token pattern and may share this latent bug. Not touched here per scope. Worth a follow-up check.

---

## 2. Palette rework — CREAM-LED, espresso accent-only (`VitaGlowFonts.ts` + `shellCssVars.ts`)

New v3 hex in `VITA_GLOW_TOKENS` and `SHELL_THEMES['vita-glow']`:
`--espresso #3B2A21` / `--espresso-deep #2A1D16` / `--cream #F7F2E9` / `--cream-2 #EFE7D8` / `--gold #C9A227` / `--gold-light #E3C77B` / `--taupe #9C8574`.

**Reversal from the live build:** espresso is now ONLY body ink, thin hairline dividers, and the single solid "Book a Consult" button. Every previously-dark surface is now cream:
- Hero right panel → warm cream gradient (`linear-gradient(150deg,#EFE7D8,#E7DCC8 60%,#DFD2BA)`).
- Treatments band → cream-2 (was dark).
- Footer → cream-2 (was ink).
- Home/Services/About CTA bands → cream (were ink).

`computeShellCssVars` guard updated to pin `--color-primary` espresso + `--color-accent` gold and return the base map — a tenant's `branding.primary_color` still cannot re-derive surfaces (verified with hostile `#ff0000`/`#00ff00`: footer/cta stay cream, no dark panels).

---

## 3. Components (all < 200 lines, relative imports)
- **Hero (`VitaGlowHome`)** — split layout: cream-left (eyebrow / oversized Cormorant h1 / lede / solid-espresso Book + ghost-taupe Explore) and a cream-gradient right panel with a **vertical gold seam** carrying a rotated "Hydration + Aesthetics" label. Stacks on mobile (seam hidden). Right panel holds the logo (or droplet fallback).
- **Treatments band** — cream-2, gold hairlines between three cards (1px gold-bg grid gaps), serif italic gold Roman numerals (I/II/III), serif headings, taupe body, gold price line. Cells lighten to white on hover. Content from `page_content` (`services` array) — nothing hardcoded.
- **Services / About / Contact / Footer** — recolored cream-led; espresso ink + gold hairlines; CTA bands now cream (no dark panels); footer light.
- **Accessibility** — `.vg-focus` visible keyboard focus (gold outline) on all links/buttons; `prefers-reduced-motion` disables card/button transitions; hero + treatments responsive; mobile drawer has `aria-expanded`.

---

## 4. Logo
- **Rendering (DONE, in this PR):** nav, hero right panel, and footer render `branding.logo_url` as an `<img>` when set, with the inline droplet glyph as fallback; the glyph remains the section divider (`GoldDivider`). Per the constraint, the logo appears ONLY on cream surfaces (all three placements are cream) — it is never placed on espresso.
- **Hosting (BLOCKED — needs Scott):** the uploaded `ng-logo-clean.png` is **not present on the session filesystem** (only the inline chat image), and this session has **no Supabase Storage upload capability** (no CLI, no service-role credentials, Supabase MCP disconnected, and no Storage-upload MCP tool exists). Per standing orders I stopped rather than guess. I deliberately did **not** set `settings.branding.logo_url` — pointing it at the target URL before the file is uploaded would render a broken image. See QA report for the exact upload path + URL for Scott to complete; rendering lights up automatically once it's set.

---

## 5. Out of scope (untouched)
Provisioning / entitlements / business_info / voice_receptionist; AI social generator; booking config (`square_booking_url` left blank → `/contact` fallback, no hardcoded Square URL); ai-proxy, auth, RLS, Stripe, edge functions. No route-dispatch changes were needed (component APIs unchanged).

## 6. Verification
`tsc --noEmit` (Next) 0 errors · `next build` success · eslint 0 errors (1 pre-existing refresh warning) · headless computed-style proof of Cormorant on h1/h2 · palette guard hostile-input test. Details + screenshot in `QA_REPORT_S-VG-2.md`.
