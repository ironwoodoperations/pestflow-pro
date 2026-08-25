# Session log — branch `s296-stage0-brief`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-25 15:41 UTC
- Branch: `s296-stage0-brief`
- Commit: `31ec740` — docs(S296): stage 0 design + validator gate brief — no code
- Author: Claude
- Files changed:
  - STAGE0_s296-sending-domain.md
- Next recommended action: BLOCKED on the validator gate. Stage 0 is designed, not
  implemented — no `from:` address changed. Scott must run the five questions in
  `STAGE0_s296-sending-domain.md` through Perplexity AND Gemini (question 3,
  mixed-domain staging vs one clean switch, is the one that can overturn the staged
  order rather than tune it), and decide the two "also in scope" items —
  recommendation is to hold both and ship them inside stage 0, because
  `send-reveal-ready:84` is COUPLED: renaming its `fromName` to `PLATFORM_NAME`
  before the domain moves yields `HomeFlow Pro <noreply@pestflow.ai>` to prospects,
  which is exactly the mismatch the S294 deferral existed to avoid. No stage-0 code
  may be written until the gate clears.

---
## Session — 2026-08-25 15:53 UTC
- Branch: `s296-stage0-brief`
- Commit: `c8f77f5` — docs(S296): incorporate gate outcome — subdomain, fail-closed, webhooks
- Author: Claude
- Files changed:
  - STAGE0_s296-sending-domain.md
- Next recommended action: Gate CLEARED (Scott ran it) and returned three changes, all
  incorporated: send from `mail.homeflowpro.ai` not the apex; fail CLOSED on an unset
  `MAIL_SENDING_DOMAIN`, read inside the request handler; Resend webhooks instrumented
  BEFORE cutover. Still doc-only — no `from:` address changed. THREE BLOCKERS before
  stage 0 can be implemented: (1) gate questions 3, 4 and 5 came back UNCOVERED — Q3
  (mixed-domain staging) can still overturn the staged order, and Q4 (DMARC) must be
  re-prompted WITH the subdomain, since a subdomain inherits the apex policy unless it
  publishes its own `_dmarc` record and the apex is Scott's human mail; (2) the
  `email_events` table is a schema change needing Scott's approval as a migration;
  (3) DNS + Resend verification for `mail.homeflowpro.ai`. SEQUENCING HAZARD, do not
  lose: fail-closed breaks stage 0's no-op property unless `MAIL_SENDING_DOMAIN` is set
  to `pestflow.ai` BEFORE the fail-closed code deploys — deploying it against an unset
  secret stops all mail. Withdrawn this session: the "phishing-shaped header" argument
  and the warming-volume rationale.

---
## Session — 2026-08-25 16:08 UTC
- Branch: `s296-stage0-brief`
- Commit: `678b397` — docs(S296): gate closed — DNS resolved, policy escalation is a first-class risk
- Author: Claude
- Files changed:
  - STAGE0_s296-sending-domain.md
- Next recommended action: Gate now CLOSED on all five questions and the `email_events`
  migration is APPROVED — but stage 0 is STILL not implementable, and the two things
  blocking it came out of DNS Scott resolved, not out of the validators. IN ORDER:
  (1) add a `rua` Scott controls to `_dmarc.homeflowpro.ai` — today it points at GoDaddy
  (`dmarc_rua@onsecureserver.net`), so he receives NO aggregate reports for the domain he
  is migrating onto; Resend webhooks do NOT close that gap, because they report what
  Resend did with a message while aggregate reports say what RECEIVERS did with the
  authentication. (2) stand up `mail.homeflowpro.ai` as a FULL second domain setup — own
  `_dmarc`, own Resend verification, own DKIM, own Return-Path subdomain — because there
  is no `sp=` on the apex, so it inherits `p=quarantine`. (3) only then implement stage 0,
  in this order: `email_events` + `resend-webhook` FIRST, then set
  `MAIL_SENDING_DOMAIN=pestflow.ai`, THEN deploy the fail-closed helper.
  THE FIRST-CLASS RISK, do not lose it: the cutover is a DMARC POLICY ESCALATION.
  `pestflow.ai` is `p=none`, so an alignment failure is DELIVERED today; `homeflowpro.ai`
  is `p=quarantine`, so the identical failure goes to SPAM. The margin that has been
  absorbing SPF/DKIM imperfection does not exist on the destination — which is why stage 4
  (credentials, invite, password reset) is where it bites, and why webhooks must land
  first. CARRIED ASSUMPTION, deliberately visible: Q3 (staged vs one clean switch) is
  Scott's JUDGEMENT CALL, not a validated finding. Re-examine it first if delivery
  degrades. Also open: S298 investigation PR #298 awaiting approval to write
  `fix/s298-seo-fix-chain-vertical`.
