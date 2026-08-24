# Session log — branch `s290-provisioning-vertical`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-24 03:43 UTC
- Branch: `s290-provisioning-vertical`
- Commit: `50e8e78` — S290: de-pest provisioning and capture the vertical where it is known
- Author: Claude
- Files changed:
  - docs/audits/s282-rendered/client-setup.ClientSetupWizard.html
  - docs/audits/s282-rendered/client-setup.Step1BusinessInfo.html
  - docs/audits/s282-rendered/onboarding.StepBusinessInfo.html
  - src/components/admin/client-setup/ClientSetupPayment.tsx
  - src/components/admin/client-setup/steps/Step1BusinessInfo.tsx
  - src/components/admin/client-setup/types.ts
  - src/components/admin/onboarding/StepBusinessInfo.tsx
  - src/components/admin/onboarding/types.ts
  - src/lib/adminVerticalPreset.ts
  - src/pages/admin/Onboarding.tsx
  - supabase/functions/_shared/provisioningSeed.test.ts
  - supabase/functions/_shared/provisioningSeed.ts
  - supabase/functions/provision-tenant/index.ts
  - supabase/migrations/20260824040000_s290_record_mcp_applied_changes.sql
- Next recommended action: PR #285 is open as a DRAFT awaiting Scott's review.
  After merge, Claude.ai must DEPLOY provision-tenant via MCP and verify with
  get_edge_function — merged is not deployed, and the seeding change has no
  effect until it is. The companion migration
  (20260824040000_s290_record_mcp_applied_changes.sql) is written to be a no-op
  against current live state. S291 (Claude as a third AI Authority engine) was
  blocked behind S290 and is unblocked once #285 merges and deploys.
  Still unapplied from S289: docs/audits/s289-authority-prompt-backfill.sql
  (pls + vita-glow, 11 prompts, $1.05/month) — Claude.ai applies it via MCP.
