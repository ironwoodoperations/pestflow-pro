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
- What this was: follow-up decision on S308. `settings` had no role gate of its
  own, so S308's plain `settings_member_all` handed scottdevore2@gmail.com
  (role `user` on dang) write access to a paying client's settings, including
  the `integrations` OAuth tokens. Split into member SELECT + role-gated write,
  matching the six already-gated tables. Applied live as a separate migration
  (the S308 file is already stamped). Re-proven: scottdevore2 SELECT 16 /
  UPDATE 0; Kirk (admin) 16 / 16; admin@demo.com coastal 13 / 13, dang 0 / 0.
- CORRECTION to the entry above: "Domain tab save is now unreachable" is no
  longer true. `scott@homeflowpro.ai` now holds `pestflow-pro:admin` in
  `tenant_users`, so the operator can reach that UI. QA_REPORT_S308.md §9 has
  been updated to match.
- Next recommended action: PR #310 is green and complete but is a DRAFT marked
  DO NOT MERGE — the Wave 3 validator gate (Perplexity + Gemini,
  conservative-wins) has NOT been run and is blocking; neither tool is reachable
  from CC Web. Scott also still owes the five-demo browser render (the
  acceptance criterion) and the end-to-end ticket file + email — the egress
  proxy denies *.pestflowpro.ai and the Supabase functions host. Open question
  left undecided: `settings_member_select` is plain membership, so a `user`-role
  member can still READ the integrations tokens (write is closed). Options:
  exclude `key = 'integrations'` from member SELECT, or role-gate SELECT too.
  Known follow-up beyond this PR: current_tenant_id() still reads `profiles` for
  ~70 policies across ~25 tables. Session-close ritual (docs/ROADMAP.md + a
  handoff in docs/handoffs/) is still pending Scott's confirmation — do not
  auto-commit it.

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
- Validator gate: BOTH models APPROVE WITH CONDITIONS. B1/B5/D1/D2 done, B4 audited.
  B2's cheap fix DISPROVEN — revoking EXECUTE from `authenticated` breaks RLS
  (42501); grants restored and matrix re-verified. B3 FAILS on two tables:
  `tenant_isolation_settings_auth` and `tenant_isolation_redirects_write` are
  FOR ALL with no role test, so the admin/manager gate is bypassable by anyone
  whose profiles.tenant_id matches — reported, NOT fixed, per instruction.
- CAVEAT: both verdict texts are PLACEHOLDERS in REVIEW Appendices A and B. The
  verbatim model output was never supplied to the session and was deliberately
  not reconstructed from the conditions summary.
- Next recommended action: Scott merges #310 and deploys. THEN, immediately:
  `DELETE FROM public.operators WHERE user_id='5181b30a-265f-4a70-a323-bf6e3c53641b';`
  — admin@pestflowpro.com was added as a TEMPORARY operator at 17:13Z and its
  credentials are published on the marketing homepage, so until that row is gone
  a public credential is a full Ironwood operator. Verify is_operator() is false
  for it afterwards. Then paste the two verdicts into the REVIEW appendices, and
  decide the two B3 legacy policies (ROADMAP S308 follow-up #2).

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

---
## Session — 2026-08-31 16:12 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `df8f7af` — S308b — role-gate the settings membership write path
- Author: Claude
- Files changed:
  - QA_REPORT_S308.md
  - REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md
  - supabase/migrations/20260831180000_s308b_settings_role_gate.sql
  - supabase/migrations/s308_operator_membership_split_rollback.sql
  - supabase/migrations/s308b_settings_role_gate_rollback.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-08-31 17:09 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `07a6ae2` — S308c — add scott@homeflowpro.ai to the Ironwood allowlist (BOTH copies)
- Author: Claude
- Files changed:
  - src/pages/IronwoodOps.tsx
  - src/pages/admin/IronwoodLogin.tsx
- Note: the brief said one line in IronwoodLogin.tsx. IronwoodOps.tsx:44 holds a
  SECOND copy of the same array and redirects non-members back to /ironwood/login
  on mount, so the one-line change alone would have produced a login -> bounce
  loop. Both copies updated.
- Next recommended action: PR #310 is blocked on Scott, not on code. In order:
  (1) run the Wave 3 validator gate (Perplexity + Gemini, conservative-wins) and
      paste both verdicts into REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md;
  (2) run the acceptance test — all five demo admin dashboards still render as
      admin@demo.com (heartland, coastal, apex, urban-strike, metro) — the egress
      proxy blocks *.pestflowpro.ai from CC Web so it was never run;
  (3) re-file the coastal-pest ticket end to end and confirm the email reaches
      support@homeflowpro.ai;
  (4) decide the `Auth isolation` CI fix — `supabase start -x edge-runtime`, in
      its own PR (recommended) or this one. Three identical 502s, established as
      not this PR's, one comment posted, single re-run spent;
  (5) decide whether `settings` READ should be restricted — S308b closed write,
      but a `user`-role member can still read the integrations OAuth tokens;
  (6) session-close ritual: docs/ROADMAP.md + docs/handoffs/ entry, proposed and
      NOT auto-committed. Follow-ups to carry: collapse the three operator-truth
      sources (two client arrays + operators table) into one; IronwoodLogin is
      signInWithPassword-only so no passwordless session can reach it; whether
      admin@pestflowpro.com should remain an Ironwood login given its credentials
      are published on the marketing homepage.

---
## Session — 2026-08-31 18:13 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `55ef06a` — S308d/S308e — validator gate conditions, plus session close
- Author: Claude
- Files changed:
  - QA_REPORT_S308.md
  - REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md
  - docs/ROADMAP.md
  - docs/handoffs/pestflow-pro-handoff-S308-operator-membership-split.md
  - supabase/migrations/20260831190000_s308d_b1_harden_definer.sql
  - supabase/migrations/20260831200000_s308e_gate_d1_b5.sql
  - supabase/migrations/s308d_b1_harden_definer_rollback.sql
  - supabase/migrations/s308e_gate_d1_b5_rollback.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]
