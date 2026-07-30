# QA Report — S-VG-5: Vita Glow Hero Logo (much bigger)

**Date:** 2026-07-30
**Branch:** `claude/vita-glow-shell-713b3f`
**QA author:** Claude Code
**Verdict:** ✅ PASS — headless computed-geometry check (Playwright, placeholder image at the real 396×324 aspect) at desktop, laptop, and mobile widths; build/type/lint clean.

## Geometry results

| Viewport | Panel W | Logo W×H | % of full panel | Even margin L/R | Gap to seam label | Aspect |
|---|---|---|---|---|---|---|
| 1440px | 608 | 529×433 | **87.0%** | 40 / 39px | 33.0px | 1.222 (native) |
| 1024px | 486 | 417×341 | 85.8% | 35 / 34px | 28.1px | 1.222 |
| 375px (mobile) | 375 | 316×258 | 84.1% | 30 / 30px | n/a (seam hidden) | 1.222 |

## Checks walked

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | Hero logo nearly fills panel | much bigger, ~90%+ | 87.0% of full panel (92% of padded content box), up from 71% | ✅ |
| 2 | Centered | horizontally + vertically | even L/R + T/B margins at all widths | ✅ |
| 3 | Aspect preserved | no stretch | 1.222 == native at every width | ✅ |
| 4 | Clear of gold seam (left) | small even gap | ~33px to the rotated seam label at desktop | ✅ |
| 5 | Small even margin to edges | even, not touching | 39–40px desktop, 30px mobile, symmetric | ✅ |
| 6 | Mobile scales, no overflow | fits panel | 375px: 316px logo in 375px panel, 30px each side | ✅ |
| 7 | CSS-only, one file | `VitaGlowHome.tsx` only | 2 lines (`padding 2rem→1rem`, `width min(600,80%)→min(900,92%)+max-width:92%`) | ✅ |
| 8 | `tsc` / `next build` / `eslint` | clean | 0 errors each (pre-existing refresh warning only) | ✅ |
| 9 | File < 200 lines | < 200 | 123 | ✅ |

## Notes
- **87% vs. "~90%+":** brief specified both the intent (nearly fill panel) and exact CSS (`min(900px, 92%)` + `max-width: 92%`, padding `~1rem`). `92%` resolves against the padded content box → ~87% of the full panel. Used the literal spec; it's a clear "nearly fills" result (71% → 87%) with a tasteful even margin. A true 90%+ of the full panel would need padding `~0.5rem` or width `95%` — flagged in REVIEW, not applied.
- Placeholder image (396×324, the real logo's ratio) used for measurement since the live tenant asset isn't reachable from this session; geometry/aspect conclusions hold for any image at that ratio. Also confirms the recurring reminder: the real logo still needs hosting (Supabase Storage upload + `branding.logo_url`), pending on Scott — until then the droplet-glyph fallback renders and this sizing applies to the real asset once set.
