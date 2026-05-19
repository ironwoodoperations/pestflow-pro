# PestFlow Pro — Session kickoff: S227

**Session theme:** SEO Analytics — DataForSEO integration (MVP)
**Pattern to mirror:** S225 zernio-analytics skeleton + S226 wire-up — but compressed into one session because the DataForSEO API contract is fully documented and public (no discovery phase like Zernio needed).
**Test/pilot tenant:** Dang (`dangpestcontrol.com`, Elite tier 4)
**Tier gating:** Pro + Elite (`minTier={3}`) on both surfaces
**Surfaces:** Reports tab + SEO Connect tab
**Execution venue:** Claude Code in Scott's Codespace (validator gate tooling available — no waiver dance)

---

## Locked from web research (5/18 planning)

DataForSEO docs confirm **all DFS Labs endpoints are Live-only.** Standard queue ($0.0006/call) is SERP API only, NOT Labs. The four Labs endpoints we use (`ranked_keywords`, `competitors_domain`, `domain_intersection`, `keyword_suggestions`) are synchronous: `fetch → response in ~1–2 seconds`. No task_post / task_get. No async queue. No pingback receiver. No HMAC.

**Architectural impact:** edge fn is dramatically simpler than the originally planned async pattern. Three validator-gate questions (endpoint choice, async polling pattern, HMAC concerns) collapse to non-issues.

**Cost impact:** Labs is billed per task + per item, not a flat queue rate. Per-tenant per-week:

| Call | Frequency | Est. cost |
|---|---|---|
| `ranked_keywords/live` (top 20 for tenant domain) | 1× | ~$0.012 |
| `competitors_domain/live` | 1× | ~$0.010 |
| `domain_intersection/live` (tenant vs competitor) | 3× (one per competitor) | ~$0.030 |
| `keyword_suggestions/live` | One-time per onboarding | ~$0.010 |

**Weekly per tenant: ~$0.05–0.07. Monthly per tenant: ~$0.22–0.30. At 100 tenants: ~$22–30/month total DFS spend.** Original $0.12/tenant/month estimate was anchored to SERP API Standard ($0.0006) — it's ~2–3× higher in Labs Live but absolute spend is still trivial.

---

## Why this looks nothing like the original S227 plan

The original S227 was GSC tile wiring via service-account auth. Blocked by Google's "Failed to add user: email not found" bug (officially acknowledged 5/1/2026, no fix timeline). The OAuth-user-token alternative requires sensitive-scope verification (~4–6 weeks of Google review plus privacy/ToS prerequisites). Both paths off the critical path.

**Pivot:** DataForSEO. Better architectural fit for multi-tenant SaaS regardless of GSC's availability:

| | GSC | DataForSEO |
|---|---|---|
| Per-tenant auth | Required (OAuth or service-account-with-add-user) | None — single account, multi-tenant queries |
| Scale model | OAuth refresh per tenant | Linear API calls per tenant |
| Data depth | Clicks/impressions/CTR/position from Google's own logs | Rankings + competitor visibility + keyword opportunities |
| Latency | Real-user data (24–48h lag) | Snapshot of current SERP |

GCP work from today's planning (service account, JSON key, `GOOGLE_SERVICE_ACCOUNT_KEY` Supabase secret, org policy re-enabled) is parked, not abandoned. Kept ready for if/when Google fixes the bug or for future internal automation.

---

## Locked scoping decisions (do not re-litigate in session)

1. **MVP tiles in v1:**
   - Rankings — top 20 keywords for tenant's domain
   - Competitor visibility — for 1–3 competitor domains
   - Keyword opportunities — top 10 keywords competitors rank for that tenant doesn't
   - **Deferred:** backlinks, on-page issues, AI/LLM mentions
2. **Refresh cadence:** Weekly cron (staggered across tenants via queue-pull pattern — see implementation Phase 4) + manual "Run Now" button rate-limited to weekly-or-less. **Mode:** Live (only option for Labs — see "Locked from web research" above). Synchronous fetch.
3. **Per-tenant query budget:** ~5–7 Labs Live calls/week. Estimated $0.22–0.30/tenant/month. At 100 tenants: ~$22–30/month total DFS spend.
4. **Keyword source:** Hybrid. Customer enters 10–20 seed keywords during onboarding. PFP suggests 10–20 more from DataForSEO's `keyword_suggestions` endpoint based on industry + city. Customer can edit anytime.
5. **Tier gating:** Pro + Elite (`minTier={3}`) on both surfaces. Matches S225's Reports tab pattern.
6. **Surfaces:** Reports tab + SEO Connect tab. Both gated. (This advances the S223 SEO Connect tab buildout — one of the 4–6 connector sessions estimated.)
7. **Backlinks API:** Deferred. Separate DataForSEO subscription (~$50–100/mo). Subscribe after MVP validates.

---

## Infrastructure already in place

| Item | Status |
|---|---|
| DataForSEO account | Funded, $55 balance after $50 deposit |
| `DATAFORSEO_LOGIN` Supabase Edge Function Secret | Set |
| `DATAFORSEO_PASSWORD` Supabase Edge Function Secret | Set |
| 1Password entry | Stored |
| Base URL | `https://api.dataforseo.com/v3/` |
| Auth | HTTP Basic |

**Verify in death-audit (Step 0):** Edge Function Secrets are Dashboard-only, NOT in Vault. Per memory ("Supabase two-store distinction"), confirm `SELECT name FROM vault.secrets` does NOT list these. If a handoff later says "DataForSEO keys are in Vault," that's wrong.

---

## Stale files that must be addressed this session

1. **`docs/audits/s227-kickoff.txt`** — currently has the GSC plan. Full rewrite required as part of S227 deliverables. The Codespace task prompt should treat this file as a known stale input, not a source of truth.
2. **`pestflow-pro-todo-v93.html`** — S227 entry says "GSC tile wiring." Flip to "DataForSEO SEO analytics integration." Log the Google bug + GCP service-account work as a blocked backlog item under P-something so it's not lost. Bump to `v94`.

---

## Step 0 — Death-audit checklist (mandatory, no coding before this completes)

Per memory: "Run full DB state check BEFORE drafting any hunt prompt — row counts, NULL + empty-string breakdowns, FK/index/policy/trigger/view/function inventory." Same applies before ANY new-feature work.

Save all outputs to `docs/audits/s227-death-audit.txt`. Reference S225's `zernio_runs` inventory as the parallel target.

### DB state

```sql
-- 1. Does seo_runs already exist? (Expected: no)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'seo_runs';
```

```sql
-- 2. Tenant columns we'll need: settings (JSONB), industry, city, state, domain, tier
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='tenants'
  AND column_name IN ('settings','industry','city','state','domain','tier','slug')
ORDER BY column_name;
```

```sql
-- 3. Existing settings.seo shape across tenants (probably absent — additive land)
SELECT slug, settings ? 'seo' AS has_seo_key,
       settings->'seo' AS seo_subtree
FROM tenants
ORDER BY slug;
```

```sql
-- 4. What's already in settings JSONB so we don't collide
SELECT slug, jsonb_object_keys(settings) AS top_key
FROM tenants WHERE slug = 'dang';
```

```sql
-- 5. Tier 3 = Pro, Tier 4 = Elite. Both visible per locked decision #5. Mirror S225's minTier={3}.
SELECT DISTINCT tier FROM tenants ORDER BY tier;
```

```sql
-- 6. pg_cron jobs (existing weekly cron pattern to mirror for staggering)
SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;
```

```sql
-- 7. Confirm DataForSEO secrets NOT in Vault (per two-store distinction)
SELECT name FROM vault.secrets WHERE name ILIKE '%dataforseo%';
-- Expected: 0 rows.
```

### Code state

```bash
# Orphaned SEO files
find . -type f \( -name "*seo*" -o -name "*SEO*" \) \
  -not -path "./node_modules/*" -not -path "./.git/*"

# Existing references to a future seo_runs name
grep -r "seo_runs" --include="*.ts*" --include="*.sql" \
  --include="*.tsx" --exclude-dir=node_modules .

# DataForSEO references already in repo
grep -ri "dataforseo" --exclude-dir=node_modules \
  --include="*.ts*" --include="*.md" --include="*.sql" .

# C2 pattern reference — confirm zernio-analytics shape to mirror
ls supabase/functions/zernio-analytics/
cat supabase/functions/zernio-analytics/index.ts | head -80

# SEO Connect tab current state — what's mounted, what tier gating is in use
grep -rn "SEOConnect\|seo-connect\|SeoConnect" \
  src/ --include="*.tsx" --include="*.ts"

# Reports tab tile inventory (to know where to mount)
grep -n "Tile" src/admin/tabs/ReportsTab.tsx 2>/dev/null \
  || grep -rn "ReportsTab" src/ --include="*.tsx" | head
```

### Architectural-pattern read

Three files to read and summarize in the audit doc before designing anything:

1. `supabase/functions/zernio-analytics/index.ts` — auth pattern, response shape, error handling, table write.
2. `src/hooks/useZernioRuns.ts` (or wherever S225 placed it) — fetch pattern, loading/error state.
3. The S225 migration file for `zernio_runs` — column-by-column. **This is the template for `seo_runs`.**

If any of these are NOT in their expected locations, note it and adjust before drafting Phase 1.

---

## Validator gate — Perplexity + Gemini, BEFORE any implementation

Per memory: validator gate is non-negotiable for caching, auth, payments, CSS architecture, Next.js metadata, RLS, and Supabase edge function behavior. Third-party API integration with Basic Auth to an external service, multi-tenant scheduled cron, and new RLS-protected table all qualify.

**Three of the six originally-drafted questions resolved during planning** (DFS docs review on 5/18):
- ~~Q: DFS endpoint choice + queue mode~~ → Labs Live-only. Locked.
- ~~Q: Async polling vs pingback~~ → Moot. Labs is synchronous; no async layer.
- ~~Q: Cron staggering pattern for 100+~~ → Locked: queue-pull pattern (see Phase 4).

Three remain. Run BOTH validators independently. Where they conflict, document reasoning for which wins.

### Q1 — Schema design for `seo_runs`

> "Mirror S225 `zernio_runs` (17 cols: id, tenant_id, ran_at, status, api_error_code, api_error_msg, data_raw, data + standard timestamps). We have three distinct run kinds — rankings, competitors, opportunities — fetched synchronously from DataForSEO Labs Live endpoints. No async task IDs needed (Labs is synchronous). Options: (A) one row per (tenant_id, kind, ran_at) with a `kind` discriminator and per-kind JSONB shape; (B) one row per tenant per snapshot with three nested objects in `data`; (C) separate tables per kind. Which scales best for the 'latest snapshot per tenant per kind' read pattern, weekly write pattern, and a hypothetical 4th tile later (e.g. backlinks once we subscribe to the separate DFS Backlinks API)? Also: where does the queue-pull cron read 'last successful run' — a column on `tenants`, or a derived `MAX(ran_at)` from `seo_runs`?"

### Q2 — Error handling, freshness, rate limiting

> "Three failure modes to handle: (1) DataForSEO returns HTTP 200 with `status_code != 20000` in the body (their convention for logical errors) — how to surface to the tile; (2) edge fn timeout mid-run (we make 3–7 sequential Labs Live calls per tenant, each ~1–2 seconds; total ~10–14s, occasional spikes possible) — partial-write strategy, retry, mark-errored?; (3) 'Run Now' button rate-limit — enforced where? Edge fn timestamp check, Postgres RPC, both? How does the S225/S226 PageSpeed pattern handle this? What's the right UX for 'last successful run was N days ago' vs 'currently running' vs 'failed last attempt'? Also: confirm Supabase edge function default timeout accommodates 3–7 sequential 1–2s calls plus DB writes."

### Q3 — HTTP Basic Auth + Deno fetch + edge fn ergonomics

> "DataForSEO uses HTTP Basic Auth: `Authorization: Basic ${btoa(login + ':' + password)}`. Any Deno-specific gotchas — `btoa` availability, encoding, connection reuse? Edge function makes 3–7 sequential Live calls per run. Any pooling concerns? Should we factor the Basic Auth header construction into `_shared/` per S218 pattern (memory: `_shared/` deps must be in same `files` array on `deploy_edge_function`)? Or keep inline?"

**Output of validator gate:** A 5–10 line decision log committed to `docs/audits/s227-validator-decisions.md` BEFORE any code lands. Each decision: what was chosen, what Perplexity said, what Gemini said, who won and why.

---

## Implementation order (locked: migration-first)

Per memory: "If you find yourself adding columns to zernio_runs, sequence migration-first (additive, nothing else reads them). Same applies to new seo_runs table." Confirmed — `seo_runs` is a brand-new additive table with no readers until Phase 5.

### Phase 1 — Migration

- `supabase/migrations/<timestamp>_s227_seo_runs.sql` — table + RLS (tenant-isolation SELECT TO `authenticated`, anon REVOKEd per S225 pattern) + indexes (at minimum: `(tenant_id, kind, ran_at DESC)`).
- Additive `tenants.settings.seo` JSONB subtree shape documented as comment in migration. **No data backfill** — empty JSONB is the correct null state.
- Rollback script at `docs/migrations/s227-seo-runs-rollback.sql` in the SAME commit.
- Apply via `apply_migration` MCP. Add `NOTIFY pgrst, 'reload schema'` as final statement.
- Verify column count + RLS via Supabase MCP after apply (mirror S225's "17 cols + RLS + grants" check).

### Phase 2 — Edge function `seo-analytics`

- C2 pattern: `requireTenantUser` + `verify_jwt:true`.
- HTTP Basic Auth to DataForSEO (per validator gate Q3).
- **Synchronous flow:** for each tenant, fetch 3–5 Labs Live endpoints sequentially (~1–2s each), write each result as a `seo_runs` row tagged by `kind` (rankings / competitors / opportunities). No task_post / task_get. No async layer. No pingback receiver.
- Order of calls: `ranked_keywords/live` → `competitors_domain/live` → one `domain_intersection/live` per competitor (1–3 calls).
- On `status_code != 20000` from DFS body: write row with `status='error'`, `api_error_code` + `api_error_msg` populated. Tile renders error state. Do NOT short-circuit subsequent kinds — each kind succeeds or fails independently.
- Per memory: `verify_jwt` does NOT persist across deploys; set explicitly every deploy (`verify_jwt: True` here).

### Phase 3 — Manual "Run Now" trigger

- Same `seo-analytics` edge fn, called from the tile UI with an explicit user JWT.
- Rate limit enforced server-side: read latest `ran_at` for `(tenant_id, kind)`, reject if < 7 days (per validator gate Q2 decision).
- Optimistic UI on the button — disabled state immediately, "rate-limited until <date>" tooltip on rejection.

### Phase 4 — Cron scheduler (queue-pull, scales to 100+)

**Locked pattern:** queue-pull, not mod-arithmetic sharding.

- One pg_cron job: every 30 minutes, pick the next batch of tenants where `tier >= 3` AND `last_seo_run_at < now() - interval '7 days'`, in ascending order of `last_seo_run_at` (oldest first).
- Batch size: `LIMIT 3` per tick (≈3 tenants × ~14s edge fn time = ~42s; well within edge fn timeout and cron-tick window).
- After successful run, write `tenants.last_seo_run_at = now()` (or derive from `MAX(seo_runs.ran_at)` per validator gate Q1 outcome).
- **Self-balancing:** at 3 tenants, runs all of them in one tick weekly. At 100 tenants, processes ~3/tick × 48 ticks/day × 7 days = 1,008 capacity vs 100 needed — plenty of headroom. At 500 tenants, batch size can rise to 5–10 without code change.
- pg_cron migration committed in same file as the table OR as a separate scheduler migration. Document the schedule in the migration comment.
- Filter: `tier >= 3` (Pro + Elite per locked decision #5).

### Phase 5 — Hook `useSeoRuns`

- Mirror `useZernioRuns`. Return `{ data, loading, error, runNow, lastRunAt }` per kind.

### Phase 6 — UI `SeoAnalyticsTile`

- Three sub-views: Rankings table, Competitor visibility table, Keyword opportunities table.
- States: loading, error, empty ("No data yet — runs weekly"), success.
- Last-run timestamp.
- "Run Now" button with rate-limit-aware disabled state + tooltip.

### Phase 7 — Mount on Reports tab + SEO Connect tab

- Both gated `minTier={4}`.
- Reports tab: standalone tile.
- SEO Connect tab: tile mounted within the existing SEO connector grid (the grid being built out per S223's 4–6 session plan).
- **CC Web scope-narrowing trap from S225:** Explicitly enumerate BOTH mount points in the PR description and verify both ship before merge.

### Phase 8 — Onboarding UI

- Form to capture: 10–20 seed keywords (chip input), 1–3 competitor domains (URL input with validation).
- "Suggest more keywords" button → calls a fourth edge fn op or inlines into `seo-analytics` → returns suggestions from DFS `keyword_suggestions` based on `(industry, city)`.
- Editable from the SEO Connect tab anytime, not just during initial onboarding.
- Persists to `tenants.settings.seo` JSONB.

### Phase 9 — Doc updates

- **Full rewrite** `docs/audits/s227-kickoff.txt` with DataForSEO content (replace stale GSC content).
- Bump `pestflow-pro-todo-v93.html` → `v94`:
  - Flip S227 entry: "GSC tile wiring" → "DataForSEO SEO analytics integration."
  - Log a new blocked backlog item: "Google add-user bug (acknowledged 5/1/2026) — GCP service-account auth path parked. Resume when Google fixes OR when service-account use cases multiply enough to justify OAuth user-token + sensitive-scope verification (4–6 weeks)."
- `docs/handoff/s227-shipped.md` written at session end (mirror S225 structure exactly).
- `pestflow-pro-kickoff-S228.md` written at session end.

### Phase 10 — Cache purge

Memory rule: "ISR cache purge is mandatory with every DB edit." `seo_runs` is admin-only, so public-tenant ISR is NOT affected by writes here. **However**, if onboarding UI in Phase 8 writes to `tenants.settings` (the same JSONB that public shells read), THEN cache purge IS required — `revalidatePath('/tenant/[slug]', 'layout')` with pattern form. Validate during Phase 8 implementation whether `settings.seo` is read by any public tenant shell route. If yes: purge in same commit. If no: document the no-purge decision in PR body.

---

## Verification matrix

### Per-shell

| Shell | Required? | Notes |
|---|---|---|
| BL (bold-local) canary | ✅ Mandatory | Memory: BL inverts foreground tokens vs all others. Always smoke. |
| All other shells | ✅ | Standard smoke — tile renders, no console errors. |

### Per-tier (Reports tab AND SEO Connect tab)

| Tier | Reports tile | SEO Connect tile |
|---|---|---|
| Elite (4) | Visible, data | Visible, data |
| Pro (3) | Visible, data | Visible, data |
| Starter (≤ 2) | Hidden | Hidden |

### Per-tenant

| Tenant | Test |
|---|---|
| Dang (real Elite, real domain) | Real rankings, real competitor data, real opportunities flowing from DFS. |
| One demo Pro/Elite tenant | Empty-state OR seeded fixture, depending on whether onboarding is populated. Confirms Pro tier sees the tile. |
| One demo Starter tenant | Tile hidden on both surfaces. |
| `pestflow-pro` master | Hidden (master is not a normal tenant — confirm gate logic handles it). |

### Per-flow

| Flow | Check |
|---|---|
| Manual "Run Now" first call | Sync fetch completes in ~10–15s, rows written for each kind, tile updates. |
| Manual "Run Now" second call within window | Rejected with rate-limit error. UI shows tooltip. |
| Weekly cron tick | Picks oldest-due tenants (`tier ≥ 3`, `last_seo_run_at < now() - 7 days`), processes batch of 3, writes rows. |
| Onboarding: enter seeds → save | Persists to `tenants.settings.seo`. Next cron run picks up new keywords. |
| Suggest more keywords | DFS `keyword_suggestions/live` returns suggestions, UI lets user select N to add. |
| Simulated DFS failure (bad password) | Row written with status=error, api_error_code populated, tile shows error state — NOT a crash. Subsequent kinds in the same run still attempt independently. |
| DevTools Network Payload tab on every write | Source of truth per memory. Capture and confirm shape matches expected schema. |

### Per-validator (post-merge)

| Check | Required |
|---|---|
| Death-audit doc committed to `docs/audits/s227-death-audit.txt` | ✅ |
| Validator decisions doc committed to `docs/audits/s227-validator-decisions.md` | ✅ |
| PR body explicitly enumerates BOTH mount points (Reports + SEO Connect) shipped | ✅ — anti-S225-narrowing measure |
| Codebase-is-truth: deployed edge fn source matches `main` | ✅ Verify via Supabase MCP fetch + git diff |
| Rollback script staged in same commit as migration | ✅ |

---

## Deliverables at session end

1. **PR merged** to `main` (feature branch → PR → Scott review → manual merge; v3.1 hook enforces).
2. **`docs/handoff/s227-shipped.md`** mirroring S225 structure (what shipped, decisions locked, verification table, memory updates, on-the-horizon, retrospective).
3. **`pestflow-pro-todo-v94.html`** — S227 closed, S228 candidate items surfaced, Google bug logged as blocked backlog.
4. **`pestflow-pro-kickoff-S228.md`** — recommended next ship (likely Places API server-side refactor, GA4 wiring, or backlinks-subscription pickup, depending on what surfaces during S227).
5. **`docs/audits/s227-kickoff.txt`** rewritten for DataForSEO (replaces stale GSC content).
6. **`docs/audits/s227-death-audit.txt`** with Step 0 outputs.
7. **`docs/audits/s227-validator-decisions.md`** with Perplexity + Gemini decision log.
8. **Browser-session UX verification on Dang** — Scott opens Dang admin → Reports → sees real DataForSEO data in tile. Same on SEO Connect tab.

---

## Rules carry over (no exceptions)

- Feature branch + PR. No direct push to `main` (v3.1 hook enforces).
- `protect-files.sh` should not fire — no migrations to blocked paths, no auth/Stripe/provisioning touches.
- Validator gate required (see above). Third-party API integration with token-based auth from settings qualifies.
- Context window: notify at 50%, 60%, 70%. 80% = hard stop, wrap and hand off.
- Stop-on-fail discipline. Zero-grep prompts must enumerate every call site the grep covers.
- Codebase-is-truth asterisk: verify deployed edge fn source matches repo before declaring done.
- `verify_jwt` flag must be set explicitly on every deploy (does not persist).
- DevTools Network Payload tab = source of truth on any write bug surfaced during verification.
- Implement decisions immediately — if a decision is made in conversation, rewrite the prompt/code in that turn, not the next.
- "Log it and move on" for mid-session discoveries outside scope.
- Windows-only references. No Mac/Cmd/Apple language.

---

## Non-obvious risks to flag during session

1. **`tenants.settings.seo` JSONB read paths.** If ANY public tenant shell reads `settings.seo` (it shouldn't, but verify in death-audit), Phase 8 onboarding writes need ISR cache purge. Default assumption: admin-only, no purge needed. Validate during Phase 8.
2. **Edge fn timeout headroom.** Synchronous Labs calls take ~1–2s each. 3–7 sequential calls + DB writes = ~10–15s per tenant. Supabase edge fn default timeout should accommodate, but validator gate Q2 must confirm. If timeout is too tight, split the run across kinds (each kind = separate edge fn invocation).
3. **CC Web/Codespace scope narrowing.** S225 silently dropped consumer #2. The PR description for S227 must explicitly enumerate both mount points (Reports tab AND SEO Connect tab) as line-item shipped/not-shipped. Pre-merge scope check on Scott's side.
4. **GCP service account work parked, not abandoned.** Do NOT delete `GOOGLE_SERVICE_ACCOUNT_KEY` Supabase secret. Do NOT revert org policy. Log Google's add-user bug + parking decision in the todo HTML as a blocked backlog item so the GCP work is recoverable if/when Google fixes the bug.
5. **DFS Labs vs SERP API cost confusion.** Anyone reading the brief should know the $0.0006/call number floating in DFS marketing is SERP API Standard queue, NOT what we're using. Labs Live = per-task + per-item, roughly $0.01–0.02/call. Don't let cost-table conversations later in the year drift back to the wrong number.
