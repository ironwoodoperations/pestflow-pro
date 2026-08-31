# Session log — branch `claude/support-tickets-rls-policies-xbwg8a`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-31 14:55 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `0fa17e3` — S307 — point every dead mailto at a real inbox; fix the broken homepage CTA (#309)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/claude-demo-tier-badges-gating-1v74gr.md
  - QA_REPORT_S307.md
  - REVIEW_S307_MAILTO_AND_CTA.md
  - src/components/admin/UpgradeCards.tsx
  - src/components/admin/reports/AIAuthorityTile.tsx
  - src/components/admin/social/ConnectionsModal.tsx
  - src/components/admin/social/SocialUpgradeNudge.tsx
  - src/components/common/LockedSectionCard.tsx
  - src/lib/planCardContent.ts
  - src/pages/PaymentSuccess.tsx
  - src/pages/marketing/sections/MarketingWebsiteShowcase.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-31 15:46 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `d1fef2b` — S308 — split the accidental operator grant into a real operator check and a real membership check
- Author: Claude
- Files changed:
  - QA_REPORT_S308.md
  - REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md
  - src/components/admin/SupportTab.tsx
  - supabase/functions/notify-support-ticket/index.ts
  - supabase/migrations/20260831170000_s308_operator_membership_split.sql
  - supabase/migrations/s308_operator_membership_split_rollback.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-31 15:47 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `76f06bb` — fix(S308): don't timestamp-prefix the rollback migration
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.d/claude-support-tickets-rls-policies-xbwg8a.md
  - REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md
  - supabase/migrations/20260831170000_s308_operator_membership_split.sql
  - supabase/migrations/s308_operator_membership_split_rollback.sql
- Next recommended action: S308 is implemented and applied live; PR #310 is a DRAFT
  marked DO NOT MERGE. Blocking before merge: (1) run the Wave 3 validator gate
  (Perplexity + Gemini, conservative-wins) and paste both verdicts verbatim into
  REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md; (2) render all five demo admin
  dashboards as admin@demo.com — the acceptance criterion, unrunnable from CC Web
  (proxy denies *.pestflowpro.ai); (3) file a coastal-pest ticket end to end and
  confirm email reaches support@homeflowpro.ai. Three decisions open: role-gate
  `settings` or accept that a `user`-role member gets full settings write; the
  Domain tab save is now unreachable (operator has no pestflow-pro membership);
  demo.pestflowpro.ai is a dead CTA (no tenant with slug `demo`). Known follow-up:
  current_tenant_id() still reads `profiles` for ~70 policies across ~25 tables.
