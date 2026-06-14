# PestFlow Pro — S266 Handoff (SHIPPED)

**Date:** 2026-06-14 · **Session:** S266 · **Orchestrator:** Claude.ai (MCP-first)
**Theme:** Theming source-of-truth consolidation — Phase 1 scoped DOWN to SPA-honesty after source verification revealed the public charcoal remap is a 38-component dark-mode conversion, not a value-swap. SPA fixes shipped; public conversion deferred to Phase 1.5.

## What shipped (in main)
- **PR #190** — SPA theming honesty + metro key bug fix:
  - src/lib/shellThemes.ts: renamed THEME_CONFIGS key 'metro-pro-shell' → 'metro-pro' (was undefined-lookup → metro tenants silently fell back to modern-pro GREEN in admin/intake preview; affected pestflow-pro's own marketing site + metro-pest-concierge). Values aligned to server twin (blue #1565C0/#00ACC1, not slate). Added bold-local to: themeKey union, THEME_CONFIGS, PALETTES (bl-1/2/3), PALETTE_HERO (#e87800/#b91c1c/#15803d).
  - shared/lib/shellCssVars.ts: comment-only — removed stale 'metro-pro-shell' reference.
  - CLAUDE.md: "Four shells" → "Five shells" with correct list (modern-pro | clean-friendly | rustic-rugged | metro-pro | bold-local).
  - Build clean (Vite + Next). Public renderer / BL_TOKENS / *_shells/ UNTOUCHED.
- **PR #191** — ROADMAP.md updated to Phase 1.5 entry; shipped follow-ups cleared.

## HEADLINE FINDING (confirmed in source, supersedes S265 theory)
The S265 "charcoal-home / blue-blog split" is NOT a test artifact — it's structural and live. In app/tenant/[slug]/layout.tsx the bold-local branch renders BoldLocalNavbar/Footer + `children`. The home uses shell sections (read --bl-* → charcoal). But inner routes (/[service], /blog, /faq, /reviews, legal, all _components/sections/*) render SHARED components that read --color-* → warm-brown (#2d1a00). Same tenant, two color systems split BY ROUTE.

## Why the public charcoal remap was NOT done (deferred to Phase 1.5)
Remapping bold-local's --color-* to charcoal is a dark-mode conversion of the entire shared page system, not a value swap:
- 38 shared components read --color-* (148× --color-primary, 54× --color-heading, etc.).
- NO --color-text / --color-body-text token is DEFINED in shellCssVars (--color-body-text is read once, never defined). Body text is Tailwind-default, not token-driven — flipping backgrounds to charcoal would put black text on charcoal across every inner page.
- --color-heading and --color-text-on-primary are dark (#1c1c1e) — invisible on charcoal.
- Requires full 38-component text-color contrast audit + validator gate. Shipping blind near live system = the exact S265 "option-2-in-one-blind-PR" trap. Correctly deferred.

## Validator gate (ran, conservative-wins)
Perplexity + Gemini both: two :root blocks with different namespaces (--color-* vs --bl-*) do NOT cascade-interact; only real risk is contrast on shared --color-* consumers. Confirmed the deferral is correct.

## Live-state facts (carry forward)
- 7 tenants, theme rows unchanged: bold-local (urban-strike), clean-friendly (coastal-pest), metro-pro (metro-pest-concierge, pestflow-pro), modern-pro (apex-protect, dang), rustic-rugged (heartland-pest).
- ALL tenants have NULL primary/accent/palette in settings.branding — nobody has overridden palette; palette-picker does not drive public site.
- dang = standalone (middleware slug path), modern-pro — untouched by all theming work.

## Next session (S267) — Phase 1.5
bold-local public inner-page dark conversion. Define a real --color-text/--color-body-text token, audit 38 _components for hardcoded text colors, remap bold-local --color-* to charcoal (#0F1216/#1A1F27 + amber #F5A623), validator-gate, verify contrast WCAG AA. BLOCKS full shell+palette choice to customer #2. Ship on its own.

## Process note
S266 nearly closed WITHOUT this handoff doc — orchestrator must direct CC to write the shipped-handoff at session end and carry it in a merged PR, else the next session has no repo state to read.
