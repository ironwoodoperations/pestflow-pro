# PestFlow Pro — S267 Handoff (SHIPPED)

**Date:** 2026-06-15 · **Session:** S267 · **Orchestrator:** Claude.ai (MCP-first) + Claude Code
**Shipped via:** PR #193 (Wave 1 audit/spec) → PR #194 (Wave 2 implementation) → PR #195 (this close-out: handoff + ROADMAP).
**Theme:** Theming Phase 1.5 — bold-local public inner-page **dark conversion**. The S266-deferred
charcoal remap, executed: bold-local inner routes now render charcoal to match the already-dark
homepage, gated so no other theme (esp. Dang/modern-pro) changes.

## The decision that anchored the work (Phase 1.5, Option 1)

**BL_TOKENS cool-charcoal is canonical for bold-local; the palette selects ACCENT only.** The
bold-local homepage components already read `--bl-*` (charcoal) and hardcode `--bl-accent` amber,
so the palette never varied the homepage. Inner pages were the only warm-brown surface. Option 1
pins all bold-local surfaces to charcoal and lets the palette drive only the accent — matching the
homepage exactly.

## Wave 1 — audit + spec (PRs #193, merged docs-only)

- Captured `BL_TOKENS` (still in `app/tenant/[slug]/_shells/bold-local/BoldLocalFonts.ts`) and the
  warm-brown bold-local `--color-*` block (`shared/lib/shellCssVars.ts`).
- **Corrected the S266 "38-component" estimate to the verified 9 render sites.** `_components/sections/*`
  has only 7 components, and just 3 (`WhyChooseUs`/`Process`/`CtaBanner`) ever reach a bold-local
  inner route. The real contrast surface is the inline markup in `[service]` (service-area branch),
  `faq`, `blog`, `blog/[post]`, plus shared `LegalPageLayout` and `CityFaqAccordion`.
- **Found the dangling token:** `--color-body-text` was *referenced* once (`LegalPageLayout.tsx`)
  but **never defined** — it always fell back to `#374151`, which fails on charcoal. This is the one
  genuinely new token the conversion needed.
- Mechanism confirmed: `layout.tsx` injects **both** `--color-*` (warm) and `--bl-*` (charcoal) at
  `:root` for bold-local; homepage reads `--bl-*` (dark), inner pages read `--color-*` (was light).

## Wave 2 — implementation (PR #194, MERGED)

**Foundation (bold-local-scoped via the `--color-*` block; zero Dang risk):**
- Synced the bold-local `--color-*` block to BL_TOKENS charcoal in **both twins** — `shared/lib/shellCssVars.ts`
  (server, public renderer) and `src/lib/shellThemes.ts` (admin/intake preview), kept in sync to
  prevent twin drift.
- **New tokens on all shells:** `--color-body-text` (bold-local `#C9CDD2` = `--bl-text-secondary`;
  light themes `#374151` = the exact prior fallback → no change) and `--color-text-muted` (bold-local
  `#9AA3AD`; light themes `#6b7280` = exact Tailwind `gray-500` → no change). `--color-border` added
  to bold-local. This makes `LegalPageLayout`'s `var(--color-body-text)` token-correct everywhere.
- **Guard** in `computeShellCssVars` + `applyTheme`: for `template === 'bold-local'`, surfaces stay
  charcoal and the palette drives accent only (bypasses `PALETTE_HERO`/`darkenHex`). Added
  `relativeLuminance`/`readableTextOn` helpers for accent-button text contrast.

**Per-component (gated behind `template === 'bold-local'`):**
`[service]` service-area branch, `faq` answer text, `blog` cards/dates/excerpts/newsletter+input,
`blog/[post]` (`prose prose-gray` → `prose-invert`), `CityFaqAccordion` (new `isBoldLocal` prop),
`LegalPageLayout` muted line. Separately-labeled commit (`76bc56e`): `WhyChooseUs` white-on-amber fix.

**Key deviation from the literal spec (user-approved via AskUserQuestion → "Gate dark edits to
bold-local"):** the inner-route files are SHARED across all 5 themes — the template dispatch only
fires for *pest* slugs. Applied unconditionally, the spec's swaps would change Dang, and
`prose-invert` would blank Dang's blog body. So every per-component dark edit is gated; all other
themes hit the exact original light path.

## Validator gate (deterministic WCAG 2.1 AA — `docs/audits/s267-validator-gate.md`)

- **13/13 charcoal pairings PASS AA**, worst 6.47:1 (muted `#9AA3AD` on surface-2 `#1A1F27`).
- Pre-existing **WhyChooseUs white-on-amber 2.03:1 → 16.55:1** (band moved to charcoal CTA surface on
  bold-local only).
- Dang no-op rows confirm modern-pro tokens still resolve to their prior literal values.
- Disclosure: Perplexity/Gemini are not wired as callable tools in this env, so the gate was run as
  the deterministic WCAG contrast computation (the objective ground truth) rather than fabricating
  model quotes.

## Prod verification (live)

PR #194 merge auto-deployed `main` to Vercel **production** (`dpl_8a1QD…`, sha `a5464dd`, READY). A new
Vercel production deployment ships with a **cold ISR cache** (no inheritance of the prior Full Route
Cache), so no forced purge/empty-commit was needed — the merge itself reset the cache. All four inner
routes (service-area / blog / faq / service pages) **visually confirmed charcoal** on prod at
`urban-strike.pestflowpro.ai`.

## Cosmetic follow-ups observed on prod (logged to ROADMAP Open Follow-ups; non-blocking)

1. **FAQ category label "General" renders red on charcoal** — a category-tag color outside the
   conversion's `--color-*` scope; harmonize with the bold-local palette.
2. **Service-page "OUR HIT PLAN" section-label renders dim** — check legibility / intended contrast
   (likely a muted eyebrow needing a brighter token on the dark surface).

## Live-state facts (carry forward)

- 7 tenants; theme rows unchanged. bold-local = **urban-strike** (the only bold-local tenant; the one
  affected by this conversion). dang = modern-pro, standalone — **untouched** by all theming work.
- All tenants still have NULL primary/accent/palette in `settings.branding` — palette overrides are
  not in play; bold-local renders canonical charcoal + amber regardless.

## Open / pending (carried to next)

- The two cosmetic prod nits above (FAQ red label; "OUR HIT PLAN" dim label).
- Phase 1.5 unblocks **full shell+palette choice for customer #2** — bold-local is now end-to-end
  charcoal (home + inner), so it can be offered without the warm-inner inconsistency.
- Twin-sync discipline: `shared/lib/shellCssVars.ts` (server) and `src/lib/shellThemes.ts` (admin
  preview) must stay aligned — both were updated together this session; keep them paired in future
  theming edits.
