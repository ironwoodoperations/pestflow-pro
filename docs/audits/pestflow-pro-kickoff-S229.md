# PestFlow Pro — Session kickoff: S229

**Session theme:** Zernio analytics edge fn — restore followers + GBP block
**Pattern to mirror:** S226 `zernio-analytics` existing edge fn — **patch, not rewrite**
**Test/pilot tenant:** Dang (`zernio_profile_id` + `zernio_accounts` populated; GBP account configured but not flowing through)
**Tier impact:** None — bug fix applies to all tiers
**Surfaces affected:** `supabase/functions/zernio-analytics/index.ts`; downstream `zernio_runs.data` consumed by `SocialAnalyticsTile` (Reports) and the S228 Dashboard Social mini-tile
**Execution venue:** Claude Code Web in Scott's Codespace
**Predecessor:** S228 (admin surface cleanup, PR #91) — assumed merged
**Estimated:** 1–2 hours

---

## TL;DR

MCP probe of `zernio_runs` for Dang (5/18) shows `followers = null` across
facebook/instagram/youtube on **every** successful run, and the `gbp` block is
**missing entirely** from `data` JSONB. The S225 contract was
`{fb, ig, yt, gbp}`; the actual stored shape is
`{facebook, instagram, youtube}`. The edge fn IS calling Zernio successfully —
`reach` + `engagement` populate correctly. It is specifically not returning
followers or GBP.

S229 patches `zernio-analytics/index.ts` to restore followers + the GBP block.
Bug fix to existing response mapping — no new tables, edge fns, cron, or auth.

This unblocks the S228 Dashboard Social mini-tile's intentionally-omitted
followers slot (S228 shipped engagement+reach only; S229 backfills followers
with **zero S228 rework** — the mini-tile reads whatever `zernio_runs.data`
contains).

---

## Validator gate

**NOT required.** This is a bug fix to an existing edge fn's response mapping.
No new caching, auth, payments, CSS architecture, Next.js metadata, RLS, or new
edge-fn behavior. (If Phase 1 reveals followers require a wholly new external
API integration — e.g. direct Meta/YouTube Graph calls — that is a scope change:
stop, surface, and the gate would apply to that new path. Do not expand S229
into it unprompted.)

---

## Locked scoping decisions (do not re-litigate in session)

- **Patch, don't rewrite.** Mirror the S226 structure already in
  `zernio-analytics/index.ts`. Minimal diff to the response-mapping block.
- **Followers source TBD by Phase 1 evidence**, not assumption. Either (a) Zernio
  already returns followers and we fail to map them, (b) followers need a second
  per-account Zernio call, or (c) Zernio does not expose followers at all.
- **GBP block** must appear in `data` when the tenant has a GBP account in
  `zernio_accounts` and GBP activity exists in-window.
- **Do not break current consumers.** `SocialAnalyticsTile` + S228 Dashboard
  Social mini-tile read the current `{facebook, instagram, youtube}` shape.
  Any field/shape rename is a separate, explicit Phase 4 commit with a matching
  consumer migration — not folded silently into the fix.

---

## Phase 1 — Death audit (save to `docs/audits/s229-death-audit.txt`)

Stop and report before any patch.

- **`zernio_runs` probe (Supabase MCP):** confirm `followers = null` on
  facebook/instagram/youtube across every successful Dang run; confirm `gbp`
  key absent from `data`; capture a representative `data` + `data_raw` sample.
- **Read current edge fn source:** `supabase/functions/zernio-analytics/index.ts`
  — identify exactly what Zernio endpoint(s)/fields are requested and how the
  response is mapped into `data`. Pinpoint where followers and GBP drop out.
- **Zernio API capability:** read Zernio API docs (or trace the Zernio
  dashboard's network/devtools) to determine whether the analytics endpoint
  exposes follower counts and GBP analytics, or whether either needs a separate
  endpoint / a paid plan tier.
- **`zernio_accounts` check:** confirm Dang's GBP account is present/configured
  there and what identifier the edge fn would need to thread it through.
- **Document the gap:** "currently requested vs available" — the precise
  before/after of the mapping that must change.

Output: `docs/audits/s229-death-audit.txt` + chat summary. STOP for Scott
acknowledgment.

---

## Phase 2 — Patch `zernio-analytics/index.ts`

Based on Phase 1 evidence, exactly one of:
- **(a)** Zernio returns followers and we're not mapping them → add the follower
  fields to the existing aggregation/mapping. Smallest diff.
- **(b)** Followers require a second per-account profile call → add that call
  (per-account, mirror existing fetch/error handling; respect AbortController/
  timeout norms) and merge into `data`.
- **(c)** Zernio does not expose followers → document why, mark followers
  out-of-scope until Graph APIs are wired (separate future session), and ship
  only the GBP-block fix.

GBP: ensure the `gbp` account in `zernio_accounts` flows through and a `gbp`
block is written to `data` when GBP activity exists in-window.

Codebase-is-truth applies to the edge fn change (SHA-equality / deployed-source
diff post-deploy, per S227 precedent).

---

## Phase 3 — Redeploy + verify

- Redeploy `zernio-analytics` (`verify_jwt` explicit per memory; `_shared/` deps
  in the same `files[]` array if touched).
- Codebase-is-truth: fetch deployed source, diff against repo, block on mismatch.
- Trigger a fresh run for Dang via the existing **"Run Check Now"** path.
- Verify `zernio_runs.data` now populates `followers` across all 3 platforms
  **and** includes a `gbp` block (or, for outcome (c), GBP-only with followers
  explicitly documented out-of-scope).

---

## Phase 4 — Verification matrix

- Per-shell verification, **BL canary first** (though this is edge-fn-only;
  consumers are admin-side).
- Dang admin browser pass: Reports `SocialAnalyticsTile` + S228 Dashboard
  Social mini-tile now show followers.
- **If a field/shape rename is required** (e.g. aligning to the S225
  `{fb, ig, yt, gbp}` contract): do it as a **separate Phase 4 commit** with an
  explicit `SocialAnalyticsTile` (+ Dashboard mini-tile) migration in the same
  commit. Do not break consumers reading the current shape.

---

## Phase 5 — Doc updates

- `docs/handoffs/pestflow-pro-handoff-S229-shipped.md`
- Bump `docs/handoffs/pestflow-pro-todo-v96.html` → `v97`
- Author `docs/audits/pestflow-pro-kickoff-S230.md` (OAuth-based GSC
  integration — testing mode, replaces dead service-account path) as a
  Phase 5 deliverable.

---

## Phase 6 — Ship

Single PR (`s229-zernio-follower-gbp-fix`), branch + PR + manual merge per
v3.1. No hook bypass. Targeted `git add` only.

---

## Risks

1. **Followers may not be exposed by Zernio at all.** The Zernio dashboard
   could be live-fetching follower counts directly from Meta/YouTube Graph
   APIs rather than serving them via its own analytics endpoint. If Phase 1
   confirms this: document it, and either (i) add separate Graph API calls
   (new scope — surface before doing) or (ii) mark followers out-of-scope
   until those are wired. Do not silently expand S229 into a Graph API build.
2. **GBP analytics may be a paid Zernio tier.** Current plan is the $19/mo
   Build plan. GBP analytics could require a higher tier. Check the Zernio
   plan page during Phase 1; if gated, document and defer GBP with a clear
   "blocked on plan upgrade" note.
3. **Field-naming drift.** S225 contract was `{fb, ig, yt, gbp}`; actual is
   `{facebook, instagram, youtube}`. Consumers (`SocialAnalyticsTile`, S228
   Dashboard Social mini-tile) read the current shape. If a rename is needed,
   it is a separate Phase 4 commit with an explicit consumer migration — never
   a silent shape change that breaks the tiles.

---

## Rules carry over (no exceptions)

- Feature branch + PR + manual merge (v3.1 hook enforces)
- Targeted `git add` only — never `git add .` or directory-wide
- No git hook bypass
- Codebase-is-truth for the edge fn change (SHA-equality post-deploy, S227 precedent)
- `verify_jwt` set explicitly on every deploy; `_shared/` deps in same `files[]`
- Stop-on-fail at every phase boundary; implement decisions immediately
- Windows-only references throughout
