# Session log — branch `s289-authority-prompt-seeding`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-24 01:43 UTC
- Branch: `s289-authority-prompt-seeding`
- Commit: `6d7d80a` — S289: AI Authority prompt generation, seeding and editing
- Author: Claude
- Files changed:
  - docs/audits/s289-authority-prompt-backfill.sql
  - scripts/generate-authority-backfill.ts
  - src/components/admin/ReportsTab.tsx
  - src/components/admin/reports/AuthorityPromptsPanel.tsx
  - supabase/functions/_shared/authorityPrompts.test.ts
  - supabase/functions/_shared/authorityPrompts.ts
  - supabase/functions/provision-tenant/index.ts
- Next recommended action: DE-PEST `provision-tenant`. Found while wiring S289's
  seeding hook, and it is the reason that hook is gated rather than live: the
  function writes NO `settings.business_info.vertical` at all (zero occurrences)
  and seeds pest content for every new tenant regardless of trade —
  `:546` home title `"${businessName} — Professional Pest Control"`, `:548` twelve
  pest service `page_content` rows, and `:731` a `seo_meta` description ending
  "Fast, effective, guaranteed." That last one writes a rule (b) CAPACITY CLAIM
  straight to the database, in the one code path every future customer passes
  through. Larger than S289 and deliberately not started here.

  Two things are gated on Scott, not on code:
  (1) COST — applying `docs/audits/s289-authority-prompt-backfill.sql` takes the
      platform from 30 to 232 AI Authority jobs per run (~7.7x). The file is
      generated and idempotent; applying it is Claude.ai's via MCP after Scott
      picks a cadence. Nothing runs until then.
  (2) REMI PROVIDER — still unanswered across S279–S289. S289's VAPI grep
      resolved the sub-question: `vapi_assistant_id` / `vapi_phone_number_id`
      have exactly ONE reader, `voice-intake/index.ts:177-178`, which uses them
      to resolve the tenant for an inbound call. Zero readers in `src/`. The keys
      are safe to drop only once VAPI is decommissioned AND `voice-intake` is
      undeployed — so the key cleanup is downstream of the provider decision, not
      independent of it.

---
## Session — 2026-08-24 02:38 UTC
- Branch: `s289-authority-prompt-seeding`
- Commit: `6748912` — chore(s289): drop the now-unused totalJobs — lint back to the 223 baseline
- Author: Claude
- Files changed:
  - scripts/generate-authority-backfill.ts
- Next recommended action: PR #284 is green on `6748912` and awaiting Scott's manual
  review + merge. After merge: apply `docs/audits/s289-authority-prompt-backfill.sql`
  via MCP (3 inserts, 21 prompts, demo tenants excluded), then **S290 — de-pest
  provisioning**, which is the live rule (b) fabrication path and is ordered ahead of
  S291 (Claude as a third AI Authority engine) by S291's own brief.
