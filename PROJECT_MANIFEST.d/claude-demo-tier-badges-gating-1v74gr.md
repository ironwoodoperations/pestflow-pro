# Session log — branch `claude/demo-tier-badges-gating-1v74gr`

_Per-session entries written by the Ironwood Stop hook. One file per branch so
independent branches never conflict on a shared log (S261-3). Index: ../PROJECT_MANIFEST.md._

---
## Session — 2026-08-28 13:12 UTC
- Branch: `claude/demo-tier-badges-gating-1v74gr`
- Commit: `0daeaaa` — S304 task2: review + QA report for demo tier badges
- Author: Claude
- Files changed:
  - QA_REPORT_S304.md
  - REVIEW_S304_DEMO_TIER_BADGES.md
- Next recommended action: PR #305 is open as a DRAFT awaiting Scott's manual
  review + merge. Once merged, verify the tier badges on the real apex host
  (pestflowpro.ai/demos) — they cannot render on a Vercel preview URL, since
  subdomainRouter's APEX_HOSTS only matches pestflowpro.ai / www.pestflowpro.ai.
  Session close ritual (ROADMAP update + docs/handoffs entry) is still PENDING —
  drafts were offered but NOT written, per the "wait for Scott's confirmation"
  rule. Carry-forward follow-up logged as L1 in REVIEW_S304: outscraper-reviews
  edge fn still gates on settings.subscription.tier rather than
  tenants.entitlement — the last gating read of the key S262 retired.

---
## Session — 2026-08-28 13:34 UTC
- Branch: `claude/demo-tier-badges-gating-1v74gr`
- Commit: `883266e` — S305 — outscraper-reviews gates on tenants.entitlement, not settings.subscription
- Author: Claude
- Files changed:
  - QA_REPORT_S305.md
  - REVIEW_S305_OUTSCRAPER_ENTITLEMENT_GATE.md
  - supabase/functions/outscraper-reviews/index.ts
- Next recommended action: PR #306 is OPEN and DRAFT, and is **BLOCKED on the
  Perplexity + Gemini validator gate, which was NOT RUN** (neither tool is
  reachable from Claude Code Web). Scott runs it and records both verdicts in
  REVIEW_S305 before merge. Do not read green CI as clearance.
- **Deploy state, stated precisely so it is not guessed later:**
  `outscraper-reviews` is deployed at **v18**, and **v18 does NOT contain this
  change** — it still gates on `settings.subscription.tier`. Verified 2026-08-28.
  The deploy happens byte-exact from `main` via MCP **after** merge, then is
  confirmed with `get_edge_function`. **Merged will not mean deployed for this
  function; check the version before asserting either way.**
- Behavioral impact when it does deploy: **none today.** All 9 tenants have
  `entitlement == settings.subscription.tier`; the old and new gate paths were
  tabulated against live data and 9 of 9 rows match (table in QA_REPORT_S305).
  Any observable difference would mean the change is wrong.
- Also still open from S304 close: the ROADMAP edits + S304 handoff were drafted
  and are awaiting Scott's confirmation; nothing was committed. The drafted
  ROADMAP amendment about `settings.subscription` still gating one function
  should be rewritten as **resolved** once #306 merges AND deploys.
