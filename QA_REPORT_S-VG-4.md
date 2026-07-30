# QA Report — S-VG-4: Vita Glow Polish

**Date:** 2026-07-30
**Branch:** `claude/vita-glow-shell-713b3f`
**QA author:** Claude Code
**Verdict:** ✅ PASS — headless computed-geometry check (Playwright, placeholder image at the real 396×324 aspect) at desktop + mobile widths; build/type/lint all clean.

## Geometry results

| Viewport | Nav plaque | Nav logo aspect | Hero % of panel | Hero clear L/R/T | Hero aspect | Footer plaque |
|---|---|---|---|---|---|---|
| 1440px | 99×72px | 1.222 (native) | **71.4%** | 87 / 86 / 82px | 1.222 | 94×70px |
| 375px (mobile) | 99×72px | 1.222 | 66.3% | 63 / 63 / 83px | 1.222 | 94×70px |

## Checks walked

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | Nav logo on subtle warm plaque | rounded, slightly-darker-than-cream, understated | cream-2 fill + gold hairline + radius 10 + light padding | ✅ |
| 2 | Nav logo aspect + centering preserved | no stretch, vertically centered | aspect 1.222, `alignItems:center` | ✅ |
| 3 | Footer logo on subtle warm plaque | same treatment, stands out on cream-2 footer | deeper warm #E7DCC8 + gold hairline + radius 10 | ✅ |
| 4 | Hero logo enlarged toward ~80% | `min(600px,80%)`, fills more of panel | 71.4% of full panel (80% of padded content box), up from 58% | ✅ |
| 5 | Hero logo clear of seam/edges | comfortable margin | 82–87px clearance at desktop, 63px at mobile | ✅ |
| 6 | Hero logo aspect + centered | no stretch, centered | aspect 1.222, unchanged flex-center | ✅ |
| 7 | Badge text = "Powered by Ironwood Operations Group" | exact text | swapped; styling/placement unchanged | ✅ |
| 8 | Badge change is vita-glow-only | other footers untouched | other shells + shared Footer still read "PestFlow Pro" | ✅ |
| 9 | Copyright links to dashboard | `/admin`, subtle styling | `<a href="/admin">`, muted taupe, no underline | ✅ |
| 10 | `/admin` is the correct route | verified | `src/App.tsx` Route `/admin` → Dashboard; middleware routes `/admin*` to Vite admin | ✅ |
| 11 | Logo stays on light/warm surface | no dark bg | nav cream + cream-2 plaque; footer cream-2 + #E7DCC8 plaque | ✅ |
| 12 | Mobile scales cleanly | no overflow | 375px: hero 66% of panel, plaques unchanged, all clear | ✅ |
| 13 | `tsc` / `next build` / `eslint` | clean | 0 errors each (pre-existing refresh warning only) | ✅ |
| 14 | Files < 200 lines | < 200 | Navbar 114, Home 123, Footer 95 | ✅ |
| 15 | No data/logic/palette changes | CSS + text + 1 link only | diff = +9/−5 across 3 files, confirmed via `git diff` | ✅ |

## Notes
- **Hero 71.4% vs. literal "80%":** the brief gave both the intent ("~80% of the panel") and the exact CSS (`min(600px, 80%)`). Because the logo sits inside a `2rem`-padded wrapper, 80% of that content box = ~71% of the full panel — the same padding nuance documented in S-VG-3. I used the brief's literal value; the result is a clear, safe enlargement (58% → 71%) that "fills more of the panel" without touching the seam/edges. If Scott wants a true 80%-of-panel, bumping to `min(680px, 90%)` would get there — flagged, not applied, to keep clearances safe.
- **Badge `href`:** text changed to Ironwood as instructed; link target left at `pestflowpro.ai` since the brief scoped this to text only.
- Placeholder image used for measurement (real tenant asset not reachable from this session); geometry/aspect conclusions hold for any image at the logo's 396×324 ratio.
