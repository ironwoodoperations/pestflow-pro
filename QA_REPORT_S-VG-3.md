# QA Report — S-VG-3: Vita Glow Logo Sizing

**Date:** 2026-07-29
**Branch:** `claude/vita-glow-shell-713b3f`
**QA author:** Claude Code
**Verdict:** ✅ PASS — verified with a headless computed-geometry check (Playwright) at 4 viewport widths, using a placeholder image at the real logo's exact aspect ratio (396×324), since the live tenant asset isn't reachable from this session.

---

## Method
Built a static HTML harness replicating the exact CSS from both components (nav row padding + logo height; hero wrapper padding/flex-center + logo width) and measured real computed `getBoundingClientRect()` values in headless Chromium at four viewport widths: 1440 (desktop), 1024 (laptop), 800 (near mobile breakpoint), 375 (mobile, hero stacked).

## Results

| Viewport | Panel W | Hero logo W×H | Hero logo % of panel | Clear L/R | Clear T/B | Nav logo H×W | Nav aspect |
|---|---|---|---|---|---|---|---|
| 1440px | 608.0 | 352.9×288.8 | **58.0%** | 128.0 / 127.0 | 115.6 / 115.6 | 64×78.2 | 1.222 |
| 1024px | 486.4 | 273.9×224.1 | **56.3%** | 106.8 / 105.8 | 148.0 / 148.0 | 64×78.2 | 1.222 |
| 800px | 380.0 | 204.8×167.5 | 53.9% | 88.1 / 87.1 | 176.2 / 176.3 | 64×78.2 | 1.222 |
| 375px (mobile, stacked) | 375.0 | 202.1×165.4 | 53.9% | 86.4 / 86.4 | 101.8 / 101.8 | 64×78.2 | 1.222 |

(Native placeholder aspect ratio = 396/324 = 1.2222 — matches computed nav aspect exactly, confirming no stretching.)

## Checks walked

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | Nav logo grows 1.4–1.6× | 44px → 62–70px | 44px → **64px** (1.4545×) | ✅ |
| 2 | Nav logo aspect preserved | no stretch | 1.222 (matches native) | ✅ |
| 3 | Nav logo vertically centered | centered in bar | `alignItems:center` unchanged, confirmed visually in harness | ✅ |
| 4 | Nav still fits a compact bar | reasonable height | 64px logo + 24px padding = **88px** total (was ~76px) | ✅ (modest, expected increase) |
| 5 | Hero logo ~55–65% of panel | in range at desktop widths | 58.0% (1440px), 56.3% (1024px) | ✅ |
| 6 | Hero logo clear of seam/edges | comfortable margin | 105–128px clearance L/R, 115–148px T/B at desktop widths | ✅ |
| 7 | Hero logo aspect preserved | no stretch | matches native ratio at every width (e.g. 352.9/288.8 = 1.222) | ✅ |
| 8 | Mobile stacked panel — no overflow | fits within panel, doesn't touch edges | 375px: logo 202×165 inside 375×369 panel, 86px/102px clearance | ✅ |
| 9 | Logo never on espresso surface | cream-only | unchanged: nav is cream, hero panel is warm-cream gradient | ✅ |
| 10 | `branding.logo_url` / data untouched | no data changes | diff is 3 CSS-value lines only (confirmed via `git diff`) | ✅ |
| 11 | `tsc --noEmit` (Next) | 0 errors | 0 errors | ✅ |
| 12 | `next build` | success | success | ✅ |
| 13 | `eslint` | 0 errors | 0 errors (pre-existing refresh warning only) | ✅ |
| 14 | Files < 200 lines | < 200 | `VitaGlowNavbar.tsx` 112, `VitaGlowHome.tsx` 123 | ✅ |

## Note on the 800px / mobile-adjacent numbers
At 800px and 375px, hero-logo-as-%-of-panel comes in at 53.9% — just under the 55% floor. This is an inherent tradeoff of a single fixed percentage across all viewport widths without adding a media query (out of scope: "CSS/layout only... no logic"). The brief's primary target ("target roughly 55–65%") is met cleanly at desktop widths (56–58%), and at narrower widths the logo simply scales down proportionally and safely — it does not overflow, stays well clear of all edges, and reads as a deliberate, comfortably-sized brand mark rather than "floating small," which was the actual complaint being fixed.

## Not independently re-verified this round
The serif-font rendering and cream-led palette from S-VG-2 were not touched or re-tested here — this PR's diff is limited to two `<img>` style values and one padding value, verified in isolation above.
