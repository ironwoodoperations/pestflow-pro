# Session log — branch `fix/s301-modern-pro-hero-scrim`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-26 17:45 UTC
- Branch: `fix/s301-modern-pro-hero-scrim`
- Commit: `058addb` — fix(s301): modern-pro About hero renders the photo, not a 15% ghost of it
- Author: Claude
- Files changed:
  - app/tenant/[slug]/_shells/modern-pro/ModernProAboutPage.tsx
  - app/tenant/[slug]/_shells/modern-pro/modernProAboutHero.test.tsx
- Next recommended action: two items were REPORTED, not fixed, and both are
  Scott's call. (1) ModernProPestPage (the S295 service hero) shares this hero's
  palette — #3FB8AF eyebrow, #94A3B8 subtitle — at a 0.55 scrim, so it measures
  1.96-3.35:1 on a bright photo. It reads fine on the dark pest photography it
  shipped against; PLS's turf and sod shots are where it fails. Fixing it is the
  same two-line pair applied here. (2) ContentPageForm's shared ImageUpload emits
  "Recommended: 1200x600px" for EVERY image field, while ModernProAboutPage
  renders Image 1 at aspectRatio 4/3 — no single number satisfies both, so the
  field needs per-slot guidance rather than a corrected constant. pls currently
  has the same file in page_hero_image_url and image_url, rendered at two
  different aspect ratios on one page.
