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
- Next recommended action: superseded — see the latest entry at the end of this file.

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
- Next recommended action: superseded — see the latest entry at the end of this file.

---
## Session — 2026-08-31 18:29 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `4d8ac5f` — docs(S308): record B3 decision as blocked, with the provisioning answer
- Author: Claude
- Files changed:
  - docs/ROADMAP.md
- Validator verdicts are now RECORDED VERBATIM (commit `5e01d0d`): Appendices A and
  B of REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md, byte-exact and verified by
  comparing the embedded regions against source (27,103 and 6,929 bytes).
- B3 DECIDED: leave `tenant_isolation_settings_auth` and
  `tenant_isolation_redirects_write` UNCHANGED. Narrowing them breaks
  admin@demo.com, which has profiles.tenant_id=pestflow-pro but no tenant_users row
  there, so the five demo dashboards render through the legacy path. Recorded as
  BLOCKED on the current_tenant_id() migration.
- PROVISIONING ANSWER (verified): provision-tenant DOES still upsert a profiles row
  (index.ts:428) — but only for the TENANT ADMIN, who is also given
  tenant_users.role='admin', so the role gate passes anyway and nothing is escalated
  at provisioning time. invite-team-member writes NO profiles row (index.ts:120-122),
  so invited `user`/`manager` members cannot reach the legacy path at all. Exposure
  is bounded to ONE existing row: admin@demo.com.
- LATENT PATH, neither model named it: DEMOTION. invite-team-member upserts
  tenant_users.role but never clears profiles.tenant_id, so demoting a provisioned
  admin to `user` silently restores full write on that tenant's settings (including
  integrations OAuth tokens) and tenant_redirects with the role gate bypassed. No
  such user exists today; reachable through ordinary product use.
- Next recommended action: Scott merges #310 and deploys. THEN IMMEDIATELY
  `DELETE FROM public.operators WHERE user_id='5181b30a-265f-4a70-a323-bf6e3c53641b';`
  — admin@pestflowpro.com is a TEMPORARY operator added 17:13Z and its credentials
  are published on the marketing homepage, so until that row is gone a public
  credential is a full Ironwood operator. Verify is_operator() is false for it after.
  Then: the five-demo browser render and the ticket email remain unverified from CC
  Web; ROADMAP has 14 S308 follow-ups.

---
## Session — 2026-08-31 18:37 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `e02d97e` — docs(S308): add a hard gate on B3 — do not demote a provisioned tenant admin
- Author: Claude
- Files changed:
  - docs/ROADMAP.md
- ROADMAP now carries an explicit HARD GATE on the B3 follow-up: DO NOT DEMOTE a
  provisioned tenant admin to `user`/`manager` through the Users tab until B3 is
  resolved. provision-tenant:428 writes a profiles row for tenant admins;
  invite-team-member upserts tenant_users.role and never clears it, so a demoted
  provisioned admin keeps profiles.tenant_id = T and tenant_isolation_settings_auth
  (FOR ALL, no role test) restores full settings write — integrations OAuth tokens
  included — with the role gate bypassed. Same for tenant_redirects.
- Bounded: invited members can NEVER be reached (no profiles row → current_tenant_id()
  is NULL for them, whatever their role). Exposure is provisioned admins plus
  admin@demo.com, which is already in that state deliberately — the demos render
  through it. No user is in the dangerous state today.
- Fixes, both out of scope for S308: (a) stopgap — clear profiles.tenant_id when
  tenant_users.role changes; (b) real fix — complete the current_tenant_id()
  migration, retiring the legacy policy entirely.
- Next recommended action: unchanged from the previous entry — Scott merges #310 and
  deploys, THEN IMMEDIATELY
  `DELETE FROM public.operators WHERE user_id='5181b30a-265f-4a70-a323-bf6e3c53641b';`
  (admin@pestflowpro.com is a TEMPORARY operator whose credentials are published on
  the marketing homepage) and verifies is_operator() is false for it. Still
  unverified from CC Web: the five-demo browser render and the ticket email.

---
## Session — 2026-08-31 19:27 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `c765359` — S310 — docs corrections + artificial-turf content entry for pls
- Author: Claude
- Files changed:
  - docs/ROADMAP.md
  - docs/handoffs/pestflow-pro-handoff-S308-operator-membership-split.md
  - src/lib/__tests__/irrigationServiceSurfaces.test.ts
  - src/shells/_shared/irrigationContent.ts
- Next recommended action: **PR #311 is open (draft) and awaits Scott's merge.** After
  it merges AND Vercel reports READY on main, the `page_content` row for
  `artificial-turf` is applied by Claude.ai — never before READY, or a live tile and
  nav link point at a 404 (that fired on this exact slug on 2026-08-26). Separately,
  **S309 Wave 1 is reported and gated on Scott's answer**: do not touch
  invite-team-member until he replies, and note that `list_tenant_members()` shares
  the same `profiles` defect via `current_tenant_id()`, so fixing only the edge
  function leaves the Users tab half-broken.

### CORRECTION to the entry above (dated 2026-08-31, S308)
That entry says `admin@pestflowpro.com` **is** a TEMPORARY operator with published
credentials. **That is no longer true.** The row was deleted; `public.operators` now
holds ONE row (`scott@homeflowpro.ai`), verified live — `is_operator()` is false for
`5181b30a-…` and true for `32b8fbf4-…`. The earlier line is left in place because
this log is a dated record, but it must not be re-propagated: ROADMAP already notes
that a false claim in `PROJECT_MANIFEST.d/` is immortal and gets read first because
it is recent.

---
## Session — 2026-08-31 19:36 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `1c2e7d9` — S309 Wave 2 — validator gate submission package (NO implementation)
- Author: Claude
- Files changed:
  - REVIEW_S309_TENANT_SOURCE.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-01 16:28 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `ca7d3cc` — S309 gate CLOSED — both verdicts REJECT, recorded verbatim + arbitration
- Author: Claude
- Files changed:
  - REVIEW_S309_TENANT_SOURCE.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-01 16:34 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `51e9e7a` — S309 gate — correct the verdict attribution (A is Gemini, B is Perplexity)
- Author: Claude
- Files changed:
  - PROJECT_MANIFEST.d/claude-support-tickets-rls-policies-xbwg8a.md
  - REVIEW_S309_TENANT_SOURCE.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-01 16:55 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `6f12fb6` — S309 Wave 3 — required tenant_id, hardened definers, nine-shape matrix
- Author: Claude
- Files changed:
  - REVIEW_S309_TENANT_SOURCE.md
  - src/components/admin/settings/UsersSection.tsx
  - supabase/functions/invite-team-member/index.ts
  - supabase/migrations/20260901170000_s309_required_tenant_id.sql
  - supabase/migrations/s309_required_tenant_id_rollback.sql
  - supabase/tests/s309_tenant_source_matrix.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-01 17:17 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `20937c9` — S309 gate round 2 — APPROVE WITH CONDITIONS, both conditions resolved
- Author: Claude
- Files changed:
  - REVIEW_S309_TENANT_SOURCE.md
  - supabase/migrations/20260901170000_s309_required_tenant_id.sql
  - supabase/tests/s309_tenant_source_matrix.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-01 17:20 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `936248e` — S309 — record the round-2 verdict identification criteria in Appendices C and D
- Author: Claude
- Files changed:
  - REVIEW_S309_TENANT_SOURCE.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-01 17:26 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `f1d4e62` — S309 — round-2 verdicts recorded byte-exact in Appendices C and D
- Author: Claude
- Files changed:
  - REVIEW_S309_TENANT_SOURCE.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 00:14 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `ee7e79e` — S323 PR A: the lawn catalog — presets in code, deliberately inert
- Author: Claude
- Files changed:
  - app/tenant/[slug]/[service]/page.tsx
  - app/tenant/[slug]/_lib/serviceData.ts
  - shared/lib/seoSchema.test.ts
  - shared/lib/seoSchema.ts
  - src/lib/__tests__/adminVerticalPreset.test.ts
  - src/lib/__tests__/lawnCatalog.test.ts
  - src/lib/adminVerticalPreset.ts
  - src/shells/_shared/lawnContent.ts
  - src/shells/_shared/serviceEntry.ts
  - src/shells/_shared/verticalCopy.test.ts
  - src/shells/_shared/verticalCopy.ts
  - src/shells/_shared/verticalCopyPresets.test.ts
  - supabase/functions/_shared/provisioningSeed.test.ts
  - supabase/functions/_shared/verticalCopy.ts
  - supabase/functions/generate-monthly-report/narrationPrompt.test.ts
- PR: https://github.com/ironwoodoperations/pestflow-pro/pull/330 (draft)
- Next recommended action: S323 PR B — service selection at provisioning, built as
  a GENERAL mechanism rather than a lawn special case. BLOCKED on Scott: the S323
  brief is truncated mid-sentence in the validator-gate section ("PR B touches
  provisioning and a wizard write path — the S292 handleLaunch defect destroyed
  fourteen"), and whether PR B needs a gate is the missing clause. PR C (widen
  settings_business_info_vertical_valid to admit 'lawn', untimestamped migration
  plus rollback) comes LAST, only after A and B are merged — widening the CHECK
  ahead of the presets 500s a whole site.

---
## Session — 2026-09-03 02:39 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `7452745` — S325: gate demo affordances on the tenant's demo_mode row, not the hostname
- Author: Claude
- Files changed:
  - src/components/admin/SocialTab.tsx
  - src/components/admin/TierToggle.tsx
  - src/components/admin/__tests__/demoAffordance.test.tsx
  - src/components/ironwood/IronwoodSocial.tsx
  - src/lib/demoAffordance.ts
  - src/pages/admin/Dashboard.tsx
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 13:13 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `c7222dd` — docs(S324): land the provisioning write-set investigation in the repo
- Author: Claude
- Files changed:
  - docs/audits/INVESTIGATION_S324_PROVISIONING_WRITE_SET.md
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 13:36 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `1113d0b` — S326: three hardening fixes ahead of the provisioning RPC
- Author: Claude
- Files changed:
  - src/components/ironwood/BundleSocialSetup.tsx
  - src/components/ironwood/__tests__/bundleSocialSetupCopy.test.tsx
  - supabase/functions/provision-tenant/index.ts
  - supabase/functions/provision-tenant/s326Hardening.test.ts
  - supabase/migrations/s326_ai_authority_prompts_unique.sql
  - supabase/migrations/s326_ai_authority_prompts_unique_rollback.sql
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 17:39 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `11ec6c4` — S327: a pre-deploy freshness guard, and the manifest-hook deadlock
- Author: Claude
- Files changed:
  - .claude/hooks/session-end.sh
  - .claude/hooks/session-end.test.sh
  - .github/workflows/ci.yml
  - .github/workflows/redeploy-edge-on-shared-change.yml
  - scripts/deploy-function.sh
  - scripts/deploy-function.test.sh
  - supabase/functions/ai-proxy/index.ts
  - supabase/functions/api-quote/index.ts
  - supabase/functions/apply-finding-fix/index.ts
  - supabase/functions/ga4-analytics/index.ts
  - supabase/functions/gsc-analytics/index.ts
  - supabase/functions/invite-team-member/index.ts
  - supabase/functions/list-checkout-sessions/index.ts
  - supabase/functions/notify-new-lead/index.ts
  - supabase/functions/notify-support-ticket/index.ts
  - supabase/functions/notify-upgrade/index.ts
  - supabase/functions/password-reset-request/index.ts
  - supabase/functions/places-reviews/index.ts
  - supabase/functions/post-to-social/index.ts
  - supabase/functions/process-sms-queue/index.ts
  - supabase/functions/provision-tenant/index.ts
  - supabase/functions/publish-scheduled-posts/index.ts
  - supabase/functions/send-credentials-email/index.ts
  - supabase/functions/send-intake-email/index.ts
  - supabase/functions/send-reveal-ready/index.ts
  - supabase/functions/send-review-request/index.ts
  - supabase/functions/send-sms/index.ts
  - supabase/functions/seo-analytics/index.ts
  - supabase/functions/zernio-analytics/index.ts
  - supabase/functions/zernio-connect/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 18:25 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `c8559d3` — S327 — a pre-deploy freshness guard, and the manifest-hook deadlock (#335)
- Author: csdevore2
- Files changed:
  - .claude/hooks/session-end.sh
  - .claude/hooks/session-end.test.sh
  - .github/workflows/ci.yml
  - .github/workflows/redeploy-edge-on-shared-change.yml
  - PROJECT_MANIFEST.d/claude-support-tickets-rls-policies-xbwg8a.md
  - scripts/deploy-function.sh
  - scripts/deploy-function.test.sh
  - supabase/functions/ai-proxy/index.ts
  - supabase/functions/api-quote/index.ts
  - supabase/functions/apply-finding-fix/index.ts
  - supabase/functions/ga4-analytics/index.ts
  - supabase/functions/gsc-analytics/index.ts
  - supabase/functions/invite-team-member/index.ts
  - supabase/functions/list-checkout-sessions/index.ts
  - supabase/functions/notify-new-lead/index.ts
  - supabase/functions/notify-support-ticket/index.ts
  - supabase/functions/notify-upgrade/index.ts
  - supabase/functions/password-reset-request/index.ts
  - supabase/functions/places-reviews/index.ts
  - supabase/functions/post-to-social/index.ts
  - supabase/functions/process-sms-queue/index.ts
  - supabase/functions/provision-tenant/index.ts
  - supabase/functions/publish-scheduled-posts/index.ts
  - supabase/functions/send-credentials-email/index.ts
  - supabase/functions/send-intake-email/index.ts
  - supabase/functions/send-reveal-ready/index.ts
  - supabase/functions/send-review-request/index.ts
  - supabase/functions/send-sms/index.ts
  - supabase/functions/seo-analytics/index.ts
  - supabase/functions/zernio-analytics/index.ts
  - supabase/functions/zernio-connect/index.ts
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 18:50 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `f12c20a` — S328 Item 0 — the _shared consumer audit, and a runnable emergency-override line (#336)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/claude-support-tickets-rls-policies-xbwg8a.md
  - scripts/deploy-function.sh
  - scripts/deploy-function.test.sh
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 19:26 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `fa33901` — S329: self-service social connect — auth gate, lazy profile, tenant-correct return URL
- Author: Claude
- Files changed:
  - shared/lib/resolveSiteUrl.ts
  - src/components/admin/social/ConnectionsModal.tsx
  - supabase/functions/post-to-social/index.ts
  - supabase/functions/publish-scheduled-posts/index.ts
  - supabase/functions/zernio-analytics/index.ts
  - supabase/functions/zernio-connect/connectLogic.test.ts
  - supabase/functions/zernio-connect/connectLogic.ts
  - supabase/functions/zernio-connect/index.ts
  - tsconfig.json
- Next recommended action: [Fill in next session: read this line, write what comes next]

---
## Session — 2026-09-03 19:40 UTC
- Branch: `claude/support-tickets-rls-policies-xbwg8a`
- Commit: `08dfbd1` — S329 — self-service social connect: auth gate, lazy profile, tenant-correct return URL (#337)
- Author: csdevore2
- Files changed:
  - PROJECT_MANIFEST.d/claude-support-tickets-rls-policies-xbwg8a.md
  - shared/lib/resolveSiteUrl.ts
  - src/components/admin/social/ConnectionsModal.tsx
  - supabase/functions/post-to-social/index.ts
  - supabase/functions/publish-scheduled-posts/index.ts
  - supabase/functions/zernio-analytics/index.ts
  - supabase/functions/zernio-connect/connectLogic.test.ts
  - supabase/functions/zernio-connect/connectLogic.ts
  - supabase/functions/zernio-connect/index.ts
  - tsconfig.json
- Next recommended action: [Fill in next session: read this line, write what comes next]
