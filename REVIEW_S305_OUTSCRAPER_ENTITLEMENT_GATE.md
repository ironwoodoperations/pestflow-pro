# Review — S305: outscraper-reviews manual-refresh gate → tenants.entitlement — 2026-08-28

## Branch
`claude/demo-tier-badges-gating-1v74gr` (restarted from `main` @ `9d544aa`; the
prior PR #305 for this branch name is merged and closed)

## What changed

One file, one gate. `supabase/functions/outscraper-reviews/index.ts`:

- The manual-refresh tier gate no longer reads `settings.subscription.tier`.
  It calls `check_tenant_access(p_tenant_id, 4)` — the same SECURITY DEFINER
  RPC six other edge functions already use, which reads `tenants.entitlement`.
- `parseTier` deleted (orphaned; zero remaining references repo-wide).
- Comment added naming `tenants.entitlement` as the S262 source of truth.

Net: **13 insertions, 14 deletions, 1 file.**

## ✅ Validator gate — COMPLETE (2026-08-28)

| Model | Verdict |
|---|---|
| Perplexity | **APPROVE WITH CONDITIONS** |
| Gemini | **APPROVE** |
| **Arbitration (conservative-wins)** | **MERGE APPROVED** |

Perplexity's conditions are hardening items on the shared `check_tenant_access`
RPC, **not objections to this diff**. In its own words: *"None of those
conditions indicate a regression introduced by this diff."* Every condition that
gates **this** change was verified live against the database the same day.

### Question put to both models

> Does reading entitlement from `tenants` under service role, inside a function
> with `verify_jwt=false`, introduce any authorization weakening versus the
> `settings.subscription` read it replaces, given `requireTenantUser` has already
> established membership for the requested tenant?

Framing supplied with the question: this change does **not** introduce a new
entitlement read path. It **deletes** a bespoke one and adopts the established
SECURITY DEFINER access RPC that already governs the AI proxy, social posting,
campaign jobs and `apply-finding-fix` — reuse of an existing audited primitive,
not a new mechanism.

### Live verification (Claude.ai via Supabase MCP, 2026-08-28)

Queried `pg_proc` / `pg_namespace` / `has_*_privilege` on project
`biezzykcgzkrwdgqpsar`:

```
check_tenant_access owner            = postgres  (not application-writable)
proconfig                            = ["search_path=public"]
public schema owner                  = pg_database_owner
public schema ACL                    = anon=U | authenticated=U | service_role=U
                                       (USAGE only — no CREATE to any of them)
has_schema_privilege(anon,'public','CREATE')          = false
has_schema_privilege(authenticated,'public','CREATE') = false
has_function_privilege(anon, EXECUTE)                 = false
has_function_privilege(authenticated, EXECUTE)        = false
has_function_privilege(service_role, EXECUTE)         = true
signature count                                       = 1
```

| Perplexity condition | Status |
|---|---|
| 1 — safe ownership | **SATISFIED** |
| 2 — `public` not writable | **SATISFIED** |
| 3 (first half) — restrictive EXECUTE ACL | **SATISFIED** |

Because `public` is not writable by any untrusted role **and** `public.tenants`
is schema-qualified in the function body, the pinned `search_path` cannot be
hijacked.

### Two things this document must NOT overclaim

**1. TOCTOU — the race exists.** Gemini's framing (that the race "does not exist
here") is too strong and is **not** adopted. The membership-check-to-action race
**does** exist. It is **pre-existing, not widened by this diff**, and inherent to
any design where authorization and the action it authorizes are separate
operations. Perplexity's framing is the one recorded here.

**2. Privilege — this is privilege-NEUTRAL, not privilege-reducing.** Both models
agree that calling a SECURITY DEFINER RPC from a service-role client neither
tightens nor loosens privilege: `service_role` could read `public.tenants`
directly regardless. **The RPC's value is consistency and a single place to
change the access rule — not privilege reduction.** No claim to the contrary
appears anywhere in this document or the QA report (checked).

### Deferred — recorded as follow-ups, deliberately NOT implemented here

- **Condition 3, second half** — an automated assertion that PUBLIC / anon /
  authenticated never gain EXECUTE on `check_tenant_access`. Deferred: it guards
  a **shared primitive with seven consumers** and belongs in its own chore beside
  the CI auth-isolation job, not in a 13-line gate fix.
- **Condition 4** — regression tests (cross-tenant non-member; tier 1–3 denial;
  tier-4 allow; null/error denial). Same reason. **Note:** the `Auth isolation
  (Deno + local Supabase)` job already runs on this PR, but **whether it covers
  these specific cases is unverified** and should be checked when the assertion
  chore is scoped. Do not assume coverage from the job's presence.
- **Perplexity's stricter `search_path = ''` suggestion — DECLINED for this PR.**
  Altering `search_path` on an RPC seven functions call has a **wider blast
  radius than the change under review**, and the attack it defends against is
  already closed by the non-writable `public` schema.

### Flagged by both models independently — pre-existing, backlog

**The cron `apikey` bypasses both `requireTenantUser` AND the tier gate.**
Possession of that key authorizes paid Outscraper refreshes **for any tenant at
any tier**. Untouched by this diff and intentional in design, but it is **the
strongest credential on the endpoint**. Backlog item: a key-rotation process, and
exposure of the key treated as a **billable cross-tenant incident**, not merely a
credential leak.

The two verdicts are reproduced **verbatim** in the appendix at the end of this
document.

## Why the RPC rather than the direct read the brief specified

The brief prescribed `serviceClient.from('tenants').select('entitlement')`.
Wave 1 found that would have been **the only direct entitlement read in a gate
anywhere in the codebase** — all six existing gates go through
`check_tenant_access`, and `apply-finding-fix/index.ts:170` already performs this
exact Elite/tier-4 check that way. A direct read is a second site that a future
change to the access rule would not reach. Raised at the Wave 1 stop; **Scott
confirmed the RPC and stated the brief was wrong on this point.**

## Order-of-operations correction to the brief

The brief states non-configured tenants "422 at `buildOutscraperQuery` before the
tier gate is reached." **Reversed.** The tier gate is at :98 (inside the
`!isCronCall` block); the integrations read and `buildOutscraperQuery` are at
:127+. A non-Elite tenant with no Google identifier gets **403, not 422**. This
does not change the fix — it changes the expected values in the QA table, which
Scott then supplied corrected. The QA report uses the corrected table.

## CI gates (run locally)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npx eslint src --max-warnings 200` | **PASS** — 0 errors, 178 pre-existing warnings |
| `npm run build` (vite + next) | **PASS** |
| BL canary `git diff --name-only origin/main -- src/shells app` | **empty** |

## Constraint compliance

| Constraint | Status |
|---|---|
| Threshold unchanged (Elite, ≥ 4) | **PASS** — `p_required_tier: 4`; pls at Pro still 403 |
| 403 body string byte-identical | **PASS** — `'Manual refresh requires Elite plan (tier 4)'` unchanged |
| Cron bypass untouched | **PASS** — gate stays inside `if (!isCronCall)`; no line in that path altered |
| 6-hour rate limit untouched | **PASS** — not in the diff |
| Outscraper call / response parsing / `stripVaultSecrets` untouched | **PASS** — not in the diff |
| `verify_jwt` unchanged | **PASS** — `supabase/config.toml` is not in the changed set; `[functions.outscraper-reviews] verify_jwt = false` stands |
| No `settings.subscription` VALUES altered in the DB | **PASS** — only read-only `select` statements were issued this session |
| `_shared/auth/` not edited | **PASS** — not in the changed set |
| Function NOT deployed from the branch | **PASS** — no deploy attempted; see below |
| `parseTier` removed, zero references | **PASS** — verified repo-wide across `supabase/`, `src/`, `shared/` |
| Diff touches no other edge function | **PASS** — one file |

## Deployment posture

**Not deployed, deliberately.** Per the S229 lesson (deployed-ahead-of-repo
state), Scott deploys byte-exact from `main` via MCP **after** merge, then
verifies with `get_edge_function`. Nothing in this session touched the deployed
function.

## Findings

### CRITICAL / HIGH
- none

### MEDIUM

**M1 — the gate and the button disagreed, and the button was the correct one.**
Worth recording because it inverts the intuition. `TestimonialsTab.tsx:318` wraps
Refresh Now in `<FeatureGate minTier={4}>`, and `FeatureGate` reads `usePlan()` →
`tenants.entitlement`. So the **frontend has been reading the source of truth all
along** while the **server** read the drifting copy. The practical exposure was
therefore not a hidden button but the reverse: a stale-HIGH
`settings.subscription.tier` on a tenant whose `entitlement` is below 4 would
have let a **direct API call** succeed with the UI correctly hiding the control.
No tenant is in that state today (all nine aligned), which is why this ships as a
no-op. Closed by this change.

### LOW

**L1 — `parseTier`'s string branches described a tier vocabulary nothing else
uses.** It coerced `'elite'`/`'pro'`/`'grow'`/`'growth'` and bare numerals. S262
removed the string→number coercion from the client for exactly this reason (the
client-vs-edge drift where string-`'elite'` passed on one side and failed on the
other). This was the last surviving instance of that coercion. Deleted with the
gate, not separately.

**L2 — six tenants carry an empty-string `google_place_id` key.** Surfaced while
building the QA table: `settings.integrations` has the key present but blank for
every tenant except dang and pls. Harmless — `buildOutscraperQuery` treats blank
as absent — but a `? 'google_place_id'` presence test reads as "configured" and
is not. Noted so a future audit does not miscount configured tenants as seven.
Not touched.

## Notes for Scott

- The change is a **behavioral no-op today** and that is the acceptance
  criterion, not a caveat: all nine tenants have `entitlement ==
  settings.subscription.tier`, so any observable difference would mean the change
  is wrong. The nine-row old-vs-new proof is in the QA report; every row matches.
- After this merges, **zero gating reads of `settings.subscription` remain** in
  the repo. The key is cosmetic metadata everywhere, as the ROADMAP has claimed
  since S262 — the claim becomes true rather than nearly true.
- The ROADMAP amendment I drafted at S304 close (narrowing the "settings.subscription
  is display metadata" entry to note this exception) should be **rewritten as
  resolved** rather than added as an open caveat, once this merges.

---

# Appendix — validator verdicts, verbatim

Reproduced exactly as returned. Their internal heading levels are theirs, not
this document's. Nothing below has been edited, summarised, or reordered.

## Appendix A — Perplexity, verbatim

# Verdict: APPROVE WITH CONDITIONS
The code change **does not weaken authorization**; it closes a real authorization gap caused by using a drift-prone display metadata blob rather than the canonical `tenants.entitlement` value. The RPC result check is fail-closed for all relevant `.rpc()` result states.
The conditions are limited to hardening/verifying the **already-existing shared RPC**, not reverting this diff:
1. **Verify and continuously enforce safe ownership of `check_tenant_access`.** The function owner must be a tightly controlled role, ideally a dedicated non-login owner—not an application-writable role. Because it is `SECURITY DEFINER`, it runs with its owner’s privileges rather than the SQL caller’s privileges.
2. **Ensure the `public` schema is not writable by untrusted roles**, including `authenticated`, `anon`, and roles reachable through tenant-controlled database operations. The function’s `SET search_path TO 'public'` is a pinned search path, which is materially safer than inheriting the caller’s path, but `public` must itself remain a trusted schema.
3. **Keep the current restrictive EXECUTE ACL**—`service_role` and `postgres` only—and add an automated migration/test assertion that `PUBLIC`, `anon`, and `authenticated` do not receive EXECUTE on this function.
4. **Add or retain regression tests** proving that: a non-member cannot invoke manual refresh for another tenant; a member of a tier 1–3 tenant receives 403; a tier-4 member is permitted; and `NULL`, RPC errors, and unexpected non-boolean results produce 403.
None of those conditions indicate a regression introduced by this diff. They are defense-in-depth requirements appropriate for maintaining a shared `SECURITY DEFINER` authorization primitive.
## Introduced by this diff
### Authorization source is improved, not weakened
**No authorization weakening is introduced by replacing the direct `settings` read with `check_tenant_access`.**
Before, authorization was effectively:
```ts
tier = parseTier(settings.subscription.tier)
allow if tier >= 4
```
After, it is:
```ts
allowed = check_tenant_access(tenantId, 4)
allow only if allowed === true
```
The latter checks:
```sql
exists (
  select 1
  from public.tenants
  where id = p_tenant_id
    and entitlement >= p_required_tier
)
```
That is stricter and correctly aligned with the system’s designated entitlement source:
- `settings.subscription` is explicitly described as a JSONB **display-data** blob.
- `tenants.entitlement` is a typed `smallint`, restricted to 1–4, and controlled through operator/provisioning paths.
- The frontend already uses `entitlement`, so the backend and frontend now share the same authorization decision source.
- A stale-high settings value could previously allow a direct API call even after a downgrade. This diff removes that bypass.
The behavioral no-op across the current nine tenants is useful rollout evidence, but it should not be treated as a security guarantee: the purpose of the change is precisely to remain correct when the two sources later diverge.
### SECURITY DEFINER does not create a bypass here
The fact that the function is `SECURITY DEFINER` means the database query runs with the privileges of the function owner, potentially bypassing RLS on `public.tenants`. That is not, by itself, an authorization bypass in this request flow.
The important boundary is that the RPC:
- Takes only a tenant UUID and a required tier.
- Returns only a boolean.
- Does not expose tenant data.
- Does not modify data.
- Does not perform an action on behalf of the supplied tenant.
- Is invoked only after `requireTenantUser(req, tenantId)` has validated the bearer token and confirmed membership in **that exact body-supplied `tenantId`**.
In other words, `SECURITY DEFINER` lets the RPC see the authoritative entitlement row despite RLS; it does not convert an unauthorized caller into an authorized one. The authorization to request the paid action is still established by `requireTenantUser`, and the RPC adds the plan/entitlement predicate.
Supabase’s guidance is that `SECURITY DEFINER` functions must pin their `search_path`; this function does so with `SET search_path TO 'public'`. The SQL body also schema-qualifies `public.tenants`, reducing resolution ambiguity further. [supabase](https://supabase.com/docs/guides/database/functions)
### p_tenant_id is safe in this ordering
Passing `tenantId` from the request body to the RPC is safe under the stated order:
1. The request supplies `tenantId`.
2. `requireTenantUser(req, tenantId)` authenticates the bearer token.
3. It checks membership for `(user_id, tenant_id)` using that exact value.
4. Only then does the tier gate call:
   ```ts
   .rpc('check_tenant_access', {
     p_tenant_id: tenantId,
     p_required_tier: 4
   })
   ```
That eliminates the meaningful confused-deputy case: an attacker cannot submit another tenant’s UUID and borrow that tenant’s Elite entitlement, because they must first have a membership row for the same UUID. Membership in Tenant A plus knowledge of Tenant B’s UUID does not pass the membership check for Tenant B.
There is also no relevant TOCTOU privilege escalation between the membership check and the entitlement check:
- If membership is revoked between the two reads, the worst outcome is one request potentially proceeding based on a membership snapshot that was valid milliseconds earlier. That general revocation-race behavior already exists whenever authorization and action are separate operations.
- If entitlement is downgraded between the gate and the external paid scrape, the same short authorization-to-action race exists in both the old and new versions.
- Crucially, the diff does not introduce either race, broaden their window in a meaningful way, or turn the RPC into a cross-tenant operation.
If the product requires strict atomic revocation semantics for paid external calls, the membership check, entitlement decision, rate-limit reservation, and job creation would need to be made transactional or represented by a single database-side authorization/reservation operation. That is a broader architecture issue, not a reason to reject this targeted source-of-truth fix.
### `.rpc()` handling is complete and fail-closed
This condition is correct:
```ts
if (gateErr || allowed !== true) {
  return forbiddenResponse
}
```
It permits the request only when both of these are true:
```ts
gateErr == null
allowed === true
```
Every other result denies access:
| RPC outcome | `gateErr` | `allowed` | Result |
|---|---:|---:|---|
| Successful boolean `true` | null | true | Allowed |
| Successful boolean `false` | null | false | 403 |
| SQL `NULL` return | null | null | 403 |
| Empty/unexpected response | null | undefined | 403 |
| PostgREST RPC/signature/permission error | non-null | commonly null | 403 |
| Database error | non-null | commonly null | 403 |
| Network/fetch error surfaced by client | non-null | commonly null | 403 |
| Unexpected truthy non-boolean value | null or non-null | e.g. `"true"`, `1` | 403 |
Yes: with Supabase/PostgREST responses, it is possible in principle to observe `data` that is null or otherwise absent without treating that as a successful authorization result. That is why strict comparison is preferable here to a truthiness check such as `if (!allowed)`. The submitted code uses the correct strict form, `allowed !== true`.
For this SQL function, a normal result should be a Boolean `true` or `false` because `EXISTS` is non-null. Even so, the caller correctly treats a nullish or malformed result as denial. Supabase’s JavaScript API exposes RPC results as `{ data, error }`, and error cases commonly yield `data: null` with a populated error object. [supabase](https://supabase.com/docs/reference/javascript/rpc)
### parseTier removal is not a regression
Removing `parseTier` is correct and beneficial given the new source:
- The old path accepted heterogeneous JSONB representations: numeric values and string aliases such as `"elite"`, `"pro"`, and `"growth"`.
- The new source is `tenants.entitlement`, a typed smallint constrained in practice to the tier range 1–4.
- There is no legitimate string-format entitlement to preserve.
- The old fallback of treating absent, null, or malformed settings data as tier 1 was safely fail-closed, but it also relied on a non-authoritative record.
- The new implementation delegates the entire comparison to PostgreSQL:
  ```sql
  entitlement >= p_required_tier
  ```
  avoiding JSON shape assumptions and JavaScript coercion behavior.
The fixed threshold is preserved exactly: `p_required_tier: 4`. The denial response is also unchanged: HTTP 403 with the same Elite/tier-4 message.
## Pre-existing issues
These are **not introduced or worsened by this diff** and should not block it. They are worth tracking because the function is production-facing and initiates a paid third-party action.
### Platform JWT verification is disabled
`verify_jwt=false` is a pre-existing configuration choice. It can be safe only because the function explicitly implements both authentication paths:
- Cron: exact `apikey` comparison against the Vault secret.
- User request: bearer-token validation through `auth.getUser(token)`, followed by exact tenant membership validation.
The diff neither alters that control flow nor expands the cron bypass. In particular, the new RPC is reached only after `requireTenantUser` for non-cron calls, while cron calls retain their existing bypass.
The main pre-existing review item is ensuring that the cron secret has sufficient entropy, is not logged, is compared in a manner appropriate to the runtime, and is rotated through a documented operational process. That is unrelated to the authorization-source replacement.
### Cron authorization scope
The cron caller bypasses both tenant membership and the tier gate by design. If the cron request body can select arbitrary tenants, possession of the cron key authorizes paid refreshes for arbitrary tenant IDs. That may be appropriate for trusted internal automation, but it is the strongest credential in this endpoint’s model.
Again, this is unchanged: the diff explicitly leaves the cron bypass untouched. It should be documented as an intentional privileged internal capability, and cron-key exposure should be treated as a potentially billable cross-tenant impact incident.
### Existing SECURITY DEFINER maintenance risk
The shared function has several positive properties already verified:
- Exactly one signature exists, avoiding PostgREST overload-resolution ambiguity.
- `anon` and `authenticated` lack EXECUTE.
- `service_role` has the required EXECUTE grant.
- The function body is read-only and returns only `boolean`.
- The relation is schema-qualified as `public.tenants`.
- A fixed search path is present.
- It is already the standardized gate used by six other edge functions, including an identical tier-4 requirement.
The residual pre-existing risk is operational: a future migration could accidentally change function ownership, grant EXECUTE to `PUBLIC` or `authenticated`, make `public` writable to an untrusted role, remove the pinned search path, or add unsafe unqualified references. Since a definer function executes with its owner’s rights, those changes could have consequences beyond this endpoint. Supabase explicitly recommends setting a fixed `search_path` for security-definer functions and schema-qualifying referenced objects; the present function is substantially aligned with that guidance, though `search_path = ''` plus fully qualified references is the stricter convention. [supabase](https://supabase.com/docs/guides/database/functions)
### Service-role use is already privileged
The edge function already uses a client constructed with `SUPABASE_SERVICE_ROLE_KEY`. That client can query `public.tenants` directly, so using the RPC does not grant the Edge Function a new class of database access.
The security boundary is not “whether this server-side code can read entitlement”—it already can. The boundary is whether untrusted HTTP callers can cause privileged behavior for an arbitrary tenant. The existing exact-tenant membership check is what prevents that for non-cron callers; the new RPC then evaluates entitlement from the canonical source.
## Ship criteria
Ship this diff after confirming the following concrete assertions in the deployment environment:
- `check_tenant_access(uuid, integer)` remains the only matching function signature.
- Its owner is a controlled, non-login database role with no tenant-controlled write path.
- `PUBLIC`, `anon`, and `authenticated` have no `EXECUTE`; only the narrowly necessary server-side role retains it.
- `public` is not creatable/writable by untrusted roles, or the function is hardened further to `SET search_path = ''` while retaining `public.tenants`.
- Automated tests exercise strict failure denial for RPC error, `false`, `null`, and `undefined`/unexpected results.
- Integration tests confirm body tenant substitution is denied: a valid user from Tenant A must receive 403 when requesting Tenant B, regardless of Tenant B’s entitlement.
- The existing cron path is separately tested and operationally documented as intentional privileged access.
Subject to those conditions, this is the correct authorization change: it removes a stale-high metadata authorization bypass, makes the backend match the frontend’s canonical entitlement check, and preserves fail-closed behavior.

---

## Appendix B — Gemini, verbatim

Final Verdict
Verdict: APPROVE

The proposed diff improves the authorization model by replacing a drift-prone JSONB display metadata lookup with the system’s canonical source of truth (`public.tenants.entitlement`). It introduces no security regressions, handles failure modes safely, and poses no vulnerability or TOCTOU risks.

Detailed Analysis of Questions
1. Does replacing the `settings` table read with this `SECURITY DEFINER` RPC weaken authorization?
No.

* Execution context: The caller in the original implementation was already `serviceClient` (using `SUPABASE_SERVICE_ROLE_KEY`), which inherently bypasses RLS and possesses superuser-equivalent data access across all tables. Switching from a direct `settings` query to a `SECURITY DEFINER` RPC changes nothing regarding privilege escalation because the caller already held maximum data access privileges.

* Scope reduction: Rather than granting the function blanket SELECT rights to full settings/subscription blobs, the RPC acts as an intent-specific authorization gate returning a boolean (`exists (...)`).

* Source of truth: The old code queried `settings`, a display-oriented metadata JSONB store susceptible to data drift. The new code queries `tenants.entitlement`, which is guarded by RLS and designated as the immutable source of truth for authorization decisions.

2. Is the fail-closed handling correct and complete for `supabase-js .rpc()`?
Yes.

* Condition evaluation: `if (gateErr || allowed !== true)`

* Behavior on edge cases:

   * PostgREST or Network Error: `gateErr` is populated ($\neq \text{null}$). The expression evaluates to `true` and returns a `403`.

   * Database Exception: `gateErr` is populated with a `PostgrestError` object. The expression evaluates to `true` and returns a `403`.

   * Null/Undefined Return: If `allowed` is `null`, `undefined`, or anything other than strict boolean `true`, `allowed !== true` evaluates to `true` and returns a `403`.

   * Success Path: Only when `gateErr` is `null` (or `undefined`) AND `allowed === true` does the execution proceed.

* Conclusion: The condition strictly enforces a fail-closed posture across all failure states (network timeouts, database errors, and unexpected NULL returns).

3. Safety of passing user-controlled `tenantId` to the RPC
Yes, it is completely safe.

* Ordering & Authentication: The request flow enforces tenant membership in Step 3a via `requireTenantUser(req, tenantId)` before Step 3b (the tier gate check) is reached.

* Authentication Guarantee: Step 3a validates that the authenticated caller (`user_id` extracted from a validated JWT) is actively associated with the requested `tenantId` in `tenant_users`.

* Confused Deputy & Cross-Tenant Bypasses: An attacker cannot supply an arbitrary `tenantId` (e.g., a Tier 4 tenant's ID they do not belong to) to bypass the gate, because Step 3a will reject the request with a `403` prior to executing the tier gate.

* TOCTOU Concerns: A Time-of-Check to Time-of-Use issue does not exist here. Tenant membership and tier entitlement are discrete, low-frequency state properties verified within the same request lifecycle.

4. Evaluation of `SECURITY DEFINER` Implementation Details

* `search_path` Pinning: The function explicitly sets `SET search_path TO 'public'`. This prevents `search_path` hijacking attacks (e.g., creating malicious shadow tables in temporary schemas).

* Ownership & Grants: The function is owned by `postgres` and its execution ACL is explicitly constrained (`postgres=X/postgres | service_role=X/postgres`). Public/anon/authenticated execution grants are stripped, meaning it can only be invoked by internal administrative roles or the `service_role` key.

* Redundancy: Calling a `SECURITY DEFINER` function from a `service_role` client is functionally redundant from a privilege standpoint (since `service_role` already bypasses RLS), but it acts as a clean, standardized database-level authorization boundary.

5. Impact of Removing `parseTier` String Coercion
No regression.

* The database column `tenants.entitlement` is typed as a SQL `smallint` (constrained to integer values 1–4).

* String coercion (`'elite' -> 4`, `'pro' -> 3`) was only necessary because the legacy `settings.subscription` store maintained untyped, freeform JSONB data.

* Because the RPC evaluates an integer comparison (`entitlement >= p_required_tier`), string-to-number type coercion in JavaScript/TypeScript is obsolete and its deletion removes dead code safely.

Findings & Observations
Introduced by This Diff

* None. The diff replaces an ad-hoc JSONB lookup with a centralized, fail-closed database RPC check. No security vulnerabilities, regressions, or weaknesses are introduced.

Pre-Existing Issues (Surrounding Code)

* Bypassing Tier Gate for Cron Execution (Informational):

   * Location: Step 2 & Step 3.

   * Observation: When `isCronCall = true` (authenticated via the `apikey` header matching Vault), the code completely bypasses `requireTenantUser` and the `mode === 'manual'` tier check (Step 3).

   * Impact: If an attacker obtains the cron `apikey`, they can trigger manual scrapes for any tenant regardless of tier. This is an intentional design choice for platform crons, but relies entirely on the secrecy of the cron `apikey`. This pre-exists the diff and is neither created nor worsened by this change.
