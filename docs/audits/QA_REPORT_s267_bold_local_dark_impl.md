# QA Report — S267 Wave 2: bold-local inner-page dark conversion (implementation)

**Branch:** `feat/s267-bold-local-dark-impl`
**Spec:** `docs/audits/s267-bold-local-dark-spec.md` · **Audit:** `docs/audits/s267-bold-local-dark-audit.md`
**Validator gate:** `docs/audits/s267-validator-gate.md` (PASS)

## Build / typecheck / lint

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | ✅ exit 0, no errors |
| Lint | `npx eslint .` (changed files) | ✅ exit 0 — only pre-existing warnings, none on changed lines |
| Build | `npm run build` (vite + next) | ✅ exit 0 — all 17 tenant routes compiled, ISR/SSG intact |

## What shipped

### Foundation (bold-local-scoped via the `--color-*` block — zero Dang risk)
- `shared/lib/shellCssVars.ts` (server twin) and `src/lib/shellThemes.ts` (admin-preview twin):
  - `bold-local` `--color-*` block synced to BL_TOKENS charcoal (each value mapped to its `--bl-*` source).
  - **New tokens** added to all shells: `--color-body-text` (bold-local `#C9CDD2`; light themes `#374151` = exact prior `LegalPageLayout` fallback) and `--color-text-muted` (bold-local `#9AA3AD`; light themes `#6b7280` = exact Tailwind `gray-500`). `--color-border` (`#2A3038`) added to bold-local.
  - **Guard** in `computeShellCssVars` + `applyTheme`: for `bold-local`, surfaces stay charcoal and the palette drives **accent only** (bypasses `PALETTE_HERO`/`darkenHex`). Adds `relativeLuminance`/`readableTextOn` helpers for accent-button text contrast.

### Per-component (gated behind `template === 'bold-local'`)
- `app/tenant/[slug]/[service]/page.tsx` — service-area branch: section/“We Also Serve” backgrounds + intro/​chips.
- `app/tenant/[slug]/_components/CityFaqAccordion.tsx` — `isBoldLocal` prop; dark panel + body text.
- `app/tenant/[slug]/faq/page.tsx` — answer body text.
- `app/tenant/[slug]/blog/page.tsx` — cards, dates, excerpts, newsletter band + email input.
- `app/tenant/[slug]/blog/[post]/page.tsx` — date, `prose prose-gray` → `prose-invert`, closing band.
- `app/tenant/[slug]/_components/LegalPageLayout.tsx` — "Last Updated" line → `--color-text-muted` (body was already token-driven; auto-switches).

### Separately-labeled commit
- `app/tenant/[slug]/_components/sections/WhyChooseUs.tsx` — pre-existing white-on-amber (2.03:1) fix: band on charcoal CTA surface for bold-local only. **Isolated in its own commit** so Dang's risk surface stays legible.

## Deviation from the literal spec (approved)

The spec's per-component edits were written as **unconditional** swaps, but the inner-route files
(`faq`/`blog`/`blog/[post]`/legal/service-area) are **shared across all 5 themes** — the template
dispatch only fires for *pest* service slugs. Applied unconditionally, the swaps would change
Dang, and `prose-invert` would make Dang's blog body invisible. Per the hard "no Dang change"
constraint (user-confirmed via AskUserQuestion → "Gate dark edits to bold-local"), **every
per-component dark edit is gated** behind `template === 'bold-local'`; all other themes hit the
exact original code path. Gating is an established pattern here (cf. `ContactFormBoldLocal`).

## Dang (modern-pro) impact: NONE — confirmed

- **Token layer:** the only modern-pro additions are `--color-body-text: #374151` and
  `--color-text-muted: #6b7280`, which equal the literal values modern-pro consumers already used
  as fallbacks (`var(--color-body-text, #374151)`, `text-gray-500`, `var(--color-text-muted, #6b7280)`).
  `computeShellCssVars('modern-pro', …)` output is otherwise unchanged. The bold-local guard only
  triggers for `template === 'bold-local'`.
- **Component layer:** for `template !== 'bold-local'` every gated branch renders the original
  markup (`bg-white`/`#ffffff`, `text-gray-600`, `text-gray-400`, `prose prose-gray`,
  `bg-gray-50`, `var(--color-primary)` band). Background `bg-white` → inline `#ffffff` is
  CSS-identical.
- **Validator no-op rows** (gate doc) confirm modern-pro token values still resolve to their prior
  colors. **Dang renders byte-identical.**

## Validator gate

Deterministic WCAG 2.1 AA computation (Perplexity/Gemini not available as tools — see gate doc for
disclosure). **All 13 in-scope charcoal pairings PASS** (worst 6.47:1, AA floor 4.5:1). The single
pre-existing failure (white-on-amber 2.03:1) is fixed (→16.55:1). Nothing blocked.

## Out of scope / not regressed (logged)

Service-area hero CTA buttons and breadcrumb band use white text on a saturated accent across
**all** themes (pre-existing, not introduced here). Recommend a separate cross-theme accent-band
pass.

## Handoff action (NOT done from CC Web)

After merge, **purge the ISR cache for affected bold-local tenant(s)** so the charcoal inner pages
go live (routes use `revalidate = 300`). This is a separate Claude.ai / MCP step — intentionally
not attempted from this environment.
