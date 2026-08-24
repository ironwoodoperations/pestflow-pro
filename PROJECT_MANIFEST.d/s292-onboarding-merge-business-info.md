# Session log — branch `s292-onboarding-merge-business-info`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-24 12:45 UTC
- Branch: `s292-onboarding-merge-business-info`
- Commit: `bc37a91` — S292: merge into business_info instead of replacing it — the CLASS, not the keys
- Author: Claude
- Files changed:
  - docs/ROADMAP.md
  - docs/handoffs/pestflow-pro-handoff-S290-provisioning-deployed.md
  - src/lib/businessInfoMerge.test.ts
  - src/lib/businessInfoMerge.ts
  - src/pages/admin/Onboarding.tsx
- Next recommended action: PR #287 is open and draft, awaiting Scott's review.
  After merge, nothing needs deploying — this is client-side code and goes live
  with the next Vercel deploy of `main`. Two things left for whoever picks up:
  (1) `prospects` RLS permits only the operator tenant and `service_role`, so the
  CRM-bridge upsert in `handleLaunch` is DENIED from a client session and has
  always failed silently — reported in #287, not changed, because widening that
  policy is a tenant-isolation decision. (2) Vita Glow's `profiles` row is still
  missing and it is the TENANT ADMIN; fix before that project unparks, or it
  presents as PLS did (empty reads, RLS error on write). Still open from S290:
  S291 (Claude as a third AI Authority engine, unblocked), the S289 backfill
  (unapplied, Claude.ai's to run), and the vacuity audit of existing scan-style
  guards.
