# Session log — branch `investigate/s296-email-sender`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-25 15:30 UTC
- Branch: `investigate/s296-email-sender`
- Commit: `2a35851` — investigate: every From is pestflow.ai, every Reply-To is already homeflowpro.ai
- Author: Claude
- Files changed:
  - INVESTIGATION_s296-email-sender.md
- Next recommended action: AWAITING SCOTT'S APPROVAL. Report is PR #295 (draft,
  doc-only). No `from:` address has been changed and none may be until he approves.
  Two decisions are his, not the author's: (1) F3 — how `invite-team-member` and
  `password-reset-request` should be branded, since they pass `fromName: businessName`
  and bucket B's `support@homeflowpro.ai` would create a different mismatch;
  recommendation is `{businessName} via HomeFlow Pro` but it is NOT decided.
  (2) Whether the fix widens beyond the seven named files to `notify-new-lead`
  Email A and `send-review-request` — the only true bucket-A senders and the only
  high-volume mail available to warm homeflowpro.ai before the transactional-critical
  mail moves. On approval the fix goes on a SEPARATE branch `fix/s296-email-sender`.
