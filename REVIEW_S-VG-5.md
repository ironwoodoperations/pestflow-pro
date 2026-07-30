# REVIEW — S-VG-5: Vita Glow Hero Logo (much bigger)

**Branch:** `claude/vita-glow-shell-713b3f` (restarted from `main` after S-VG-4 / PR #241 merged)
**Scope:** CSS-only, `VitaGlowHome.tsx` only — enlarge the hero right-panel logo to nearly fill the cream panel. 2 lines changed.

## Change
The hero logo `<img>` and its wrapper padding, exactly per the brief:
- Logo: `width: min(600px, 80%)` → `width: min(900px, 92%); max-width: 92%`.
- Wrapper padding: `2rem` → `1rem` (was constraining the available width).

`height: auto` and the flex-center wrapper are unchanged, so aspect ratio and centering are preserved automatically.

## Result (verified — see QA)
The logo now fills **~87% of the full panel width** at desktop (up from ~71% in S-VG-4), 84–86% at narrower/mobile widths, with an even ~40px margin all around and ~33px clearance from the gold seam label. Aspect ratio is exactly native (1.222) at every width; mobile (375px) scales down cleanly with no overflow.

## Note on "92%" vs. "~90%+ of panel"
The logo sits inside the panel's padded wrapper, so `width: 92%` resolves against the **content box** (panel minus the `1rem` padding each side), which renders as **~87% of the full panel**. That's the direct consequence of using the brief's two literal values together (`92%` width + `1rem` padding) — the same padding nuance flagged in S-VG-3/S-VG-4. It's a large, clearly "nearly fills the panel" jump with a tasteful even margin, and stays safely clear of the seam and edges. If Scott wants the last few percent (true ~90%+ of the full panel), dropping the padding to `~0.5rem` or raising to `min(900px, 95%)` would get there — flagged here, not applied, to honor the explicit spec and keep the even margin.

## Constraints honored
- Aspect ratio preserved, no stretching (verified 1.222 at all widths).
- Clear of the gold seam on the left (~33px gap to the rotated seam label).
- Mobile scales down, no overflow (84.1% of panel at 375px, 30px even margins).
- CSS only; `VitaGlowHome.tsx` only; no data / `logo_url` / other components touched.

## Verification
`tsc --noEmit` 0 errors · `next build` success · `eslint` 0 errors (pre-existing refresh warning only) · file 123 lines (< 200). Geometry table in `QA_REPORT_S-VG-5.md`.
