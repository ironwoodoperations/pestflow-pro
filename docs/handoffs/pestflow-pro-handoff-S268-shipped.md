# PestFlow Pro — S268 Handoff (SHIPPED)

**Date:** 2026-06-15 · **Session:** S268 · **Orchestrator:** Claude.ai (MCP-first) + Claude Code
**Shipped via:** PR #197 (Wave 2 implementation) → this close-out (handoff + ROADMAP).
**Theme:** Custom-color palette fallback — `computeShellCssVars` now produces a full, coherent
surface set for any custom (non-preset) primary instead of half-applying a palette it had no preset
for.

## The diagnosis (what "purple" actually was)

The reported purple on coastal-pest was **not a hardcode and not a bug in the preset path.** It was
coastal-pest's own genuinely-saved `settings.branding` primary `#7c3aed` rendering exactly as stored.
The real defect surfaced underneath it: **custom colors half-applied.** `PALETTE_HERO` only covers the
**16 preset hexes**, so any custom primary outside that set got a hero/accent treatment but no matching
derived surface set — buttons and accents moved to the custom color while surrounding surfaces stayed
on the base shell's defaults, producing a visible "split" (half-applied) look rather than a coherent
palette.

## Wave 2 — implementation (PR #197, MERGED)

**Single-file fix:** `shared/lib/shellCssVars.ts` (`computeShellCssVars`).

- For a custom (non-`PALETTE_HERO`) primary, derive a **full coherent surface set** rather than
  half-applying. The derivation is **keyed off the base shell's hero luminance** (light vs dark) so the
  generated surfaces match the shell they're layered onto, instead of assuming one luminance.
- **The 16-entry `PALETTE_HERO` preset path is byte-identical** — presets still short-circuit to their
  curated hero/surface values; only the custom-color branch changed.
- **bold-local early return untouched** (it pins charcoal + accent-only per S267) and **accent handling
  untouched.**

**Two guards on the derived custom set:**
- **G1 — `contrastRatio`:** keeps buttons **>=3:1** against the hero (non-text contrast floor, so CTAs
  stay visible on the hero surface).
- **G2 — `ensureContrast`:** lifts derived surfaces until **text contrast is >=4.5:1** (WCAG AA body
  text), so generated surfaces never produce unreadable copy.

## Validator gate

Validator-gated with **Perplexity + Gemini, conservative-wins** (the stricter of the two model verdicts
governs). The guards (G1 3:1 buttons, G2 4.5:1 text) encode the conservative outcome deterministically.

## Prod verification (live)

PR #197 merge auto-deployed `main` to Vercel **production** (`42935d4`, READY). coastal-pest
(`#2E6F95` / `#7AB87A`) verified live across every public surface:

- home
- service-area
- reviews
- ant-control (service page)
- contact
- about
- blog
- footer

All routes render **blue/green**, **zero purple**, and the **half-apply split is gone** — surfaces,
buttons, and accents now read as one coherent palette.

## Live-state facts (carry forward)

- The fix is general: any tenant with a custom (non-preset) primary now gets a full derived surface set,
  not just coastal-pest. Preset-palette tenants are unaffected (byte-identical path).
- bold-local (urban-strike) is unaffected — its early return still pins charcoal + accent-only (S267).

## Open / pending (carried to next)

- Carried-over cosmetic bold-local prod nits from S267 (FAQ "General" red label; "OUR HIT PLAN" dim
  label) — unrelated to this fix, still non-blocking.
- Twin-sync discipline: `shared/lib/shellCssVars.ts` (server renderer) and `src/lib/shellThemes.ts`
  (admin/intake preview) must stay aligned. This session's fix was in the server twin
  (`shellCssVars.ts`); if the admin preview needs to mirror the custom-color derivation, pair the edit.
