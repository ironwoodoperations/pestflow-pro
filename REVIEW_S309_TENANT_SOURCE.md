# REVIEW — S309 · Resolve the acting tenant from `tenant_users`, not `profiles`

**Branch:** `claude/support-tickets-rls-policies-xbwg8a`
**Date:** 2026-08-31
**Base:** `main` @ `bf2d5b6`

> # ⛔ VALIDATOR GATE NOT RUN — AND **NOTHING IS IMPLEMENTED YET**
>
> Unlike S308, this brief requires the gate **before** implementation. No code,
> migration, or edge-function change is in this PR. This document is the
> **submission package**: the change as specified, the core argument, and the
> three questions both models must answer.
>
> Neither Perplexity nor Gemini is reachable from Claude Code Web. **Scott runs
> the gate** and pastes both verdicts verbatim into Appendices A and B.
> Implementation begins only after that, conservative-wins.

---

## The defect

Two consumers resolve the caller's acting tenant from `profiles.tenant_id`, which
S273 retired as membership truth and S308 replaced as the RLS membership source.
Neither moved.

**`invite-team-member/index.ts:72-75`** (deployed v4, `verify_jwt: true`):

```ts
const { data: profile } = await service
  .from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
const tenantId: string | null = profile?.tenant_id ?? null
if (!tenantId) return json({ error: 'Forbidden' }, 403)
```

**`public.list_tenant_members()`** (SECURITY DEFINER, `search_path = public, pg_temp`):

```sql
v_tenant := public.current_tenant_id();          -- server-derived; never from the client
if v_tenant is null then
  return;                                          -- no binding → no rows
end if;
if public.get_my_tenant_role(v_tenant) = 'admin' then
  return query select tu.user_id, u.email::text, tu.role
    from public.tenant_users tu join auth.users u on u.id = tu.user_id
    where tu.tenant_id = v_tenant;
end if;
return;
```

**Live consequence.** Three accounts have no `profiles` row and therefore cannot
invite anyone and see an empty team list: `precisionlawnsystems@yahoo.com` (pls
admin — **a paying client's admin**), `scott@homeflowpro.ai`,
`scottdevore2@gmail.com`. The UI shows "Invitation failed."

**The split that hides it:** `provision-tenant:428` writes a `profiles` row for the
tenant admin, so *provisioned* admins work. `invite-team-member` writes only
`tenant_users`, so *invited* admins never get one — and cannot themselves invite.

---

## THE CORE ARGUMENT — read this before answering (a)

**`profiles.tenant_id` is NOT an authorization source in either consumer today.**

In both, `profiles` supplies a **candidate** tenant id, and `tenant_users`
**authorizes** it:

| step | `list_tenant_members()` | `invite-team-member` |
|---|---|---|
| candidate tenant | `current_tenant_id()` → `profiles.tenant_id` | `profiles.tenant_id` (`:72-74`) |
| **authorization** | `get_my_tenant_role(v_tenant) = 'admin'` | `get_my_tenant_role(tenantId) !== 'admin'` → 403 (`:78-79`) |
| source of that check | **`tenant_users`** | **`tenant_users`** |
| on NULL | `= 'admin'` is NULL → false → **fails closed** | `!== 'admin'` → **403** |

`get_my_tenant_role` is:

```sql
SELECT role FROM public.tenant_users
WHERE user_id = (SELECT auth.uid()) AND tenant_id = p_tenant_id;
```

The proposal changes **where the candidate comes from** and leaves the
authorization step **byte-unchanged**. Therefore it is **strictly no weaker** than
current behaviour.

**The obvious objection is "you are letting the client name the tenant."** The
answer: the client-named value is subjected to **the same admin check** the
server-derived one is. A caller who names a tenant they are not an admin of gets
the same 403 / zero rows they get today. The client cannot name a tenant into
existence, cannot name someone else's membership, and cannot bypass
`get_my_tenant_role` — which reads `tenant_users` under the caller's own
`auth.uid()`.

What the change *does* fix is the case where the candidate is **wrong or absent**
for a legitimately-authorized caller — which is the entire bug.

---

## Questions for both models

**(a) Equivalence of strength.** Given the argument above — candidate vs.
authorization separated, `get_my_tenant_role(...) = 'admin'` unchanged and reading
`tenant_users` — is caller-supplied `tenant_id` + that verification **equivalent in
strength** to the current server-derived path? If you believe it is weaker, name the
concrete caller who gains something they cannot obtain today.

**(b) `DEFAULT NULL` on a SECURITY DEFINER function.** We are replacing
`list_tenant_members()` with `list_tenant_members(p_tenant_id uuid DEFAULT NULL)` —
**one signature, no overload**, deliberately, because a duplicate overload caused
PGRST203 ambiguity in S274. Does a defaulted parameter on a SECURITY DEFINER
function create any **resolution hazard PostgREST would expose** — ambiguity,
argument coercion, a callable shape we do not intend, or a way to reach the
function with an unintended argument type?

**(c) Should the fallback branch exist at all?** The spec has
`p_tenant_id IS NULL → current_tenant_id()` so pre-deploy frontends keep working
during the rollout window. Is that transitional fallback **acceptable**, or does
retaining a `profiles`-derived path — even temporarily, even behind a default —
undermine the change enough that a **downtime window** is the better choice? Note
the deploy order below is designed so the window is brief and one-directional.

---

## The change, as specified (NOT yet implemented)

**A. Migration.** Replace `list_tenant_members()` with
`list_tenant_members(p_tenant_id uuid DEFAULT NULL)`. One signature. `NULL` falls
back to `public.current_tenant_id()`. **Everything after tenant selection is
unchanged**: the NULL guard, the `get_my_tenant_role(...) = 'admin'` test, the
returned columns, `SECURITY DEFINER`, and the `search_path`. Header comment states
the DEFAULT is transitional and names the follow-up that removes it. Rollback file
alongside, **untimestamped** (`s309_..._rollback.sql`) — see the S308 trap where a
timestamped rollback shared the migration's version and would have undone it on a
fresh `db push`.

**B. `invite-team-member`.** Read `tenant_id` from the request body, **required**,
400 if absent or not a uuid. Delete the `profiles` read at `:72-75`. Keep the
`get_my_tenant_role` admin gate exactly as-is. `verify_jwt` stays TRUE and is passed
**explicitly** on deploy. **Untouched:** last-admin 409, email-exists magiclink
branch, anti-enumeration shape, and the locally-built
`${origin}/set-password?token_hash=...&type=invite` link.

**C. `UsersSection.tsx`.** Import `useTenant()`, send `tenant_id` on the invite call
and pass it to the `list_tenant_members` RPC. (Verified: the component does not
currently import it, but `TenantBootProvider` exposes `id` and `useTenant()` is
already used elsewhere in the same Settings tree.)

**D. Tests.** There are currently **zero** for either consumer. Minimum: cross-tenant
caller denied; non-admin member denied; **admin with no `profiles` row ALLOWED**
(this is the bug); NULL/absent `tenant_id` rejected by the edge function.

**No `profiles` fallback in the edge function** — the fallback exists only in the
SQL function, only for the rollout window.

---

## Deploy order (not optional; no downtime if followed)

1. **Merge.** Vercel builds the frontend, which now sends `tenant_id`. Deployed v4
   ignores the extra body field, so behaviour is unchanged in this window.
2. **Wait for Vercel READY.**
3. Claude.ai applies the migration via MCP and deploys the edge function.
4. **Verify by re-reading the deployed body and re-querying `pg_get_functiondef`.
   A version increment is not evidence** — S305 precedent.

---

## DISCLOSURE — a behaviour change on a shared published login

After this lands, **`admin@demo.com` gets a POPULATED Users list on the five demo
tenants where it sees an empty one today.** Verified live 2026-08-31:

| fact | value |
|---|---|
| `profiles.tenant_id` points at | `pestflow-pro` |
| `get_my_tenant_role('pestflow-pro')` for it | **NULL** — it has no membership there |
| real `tenant_users` memberships | **5** — apex-protect, coastal-pest, heartland-pest, metro-pest-concierge, urban-strike, **all `admin`** |
| today's `list_tenant_members()` result | **zero rows** (candidate tenant is one it is not a member of) |

That is **correct behaviour** — it is an admin on those five tenants and should see
their members. But it is a visible change on a login whose credentials are published
on `/demos/admin`, so it is stated here rather than discovered. It grants nothing it
was not already authorized for: the same `= 'admin'` test gates the result.

---

## Out of scope — not touched

`current_tenant_id()` itself (ROADMAP #8, ~70 policies across ~25 tables),
`provision-tenant:349` / `:428`, the B3 legacy policies
(`tenant_isolation_settings_auth`, `tenant_isolation_redirects_write`),
`admin_delete_tenant`.

---

# Gate outcome — **REJECT** (conservative-wins)

**Both verdicts are REJECT. Implementation of A–D as specified does NOT proceed.**
Conservative-wins arbitration does not require the two to agree on *why*; one REJECT
is sufficient, and there are two.

This section is the arbitration record. The verdicts themselves are byte-exact in the
appendices and are not edited, summarised or softened by anything written here.

## Live verification of every BLOCKING condition

Run against production on 2026-09-01 rather than assumed. **Most are already satisfied
— that is a finding, not a dismissal:** neither model could see the schema, so both
raised conditions the database already meets.

| # | Condition | Raised by | Live state |
|---|---|---|---|
| 1 | `UNIQUE (user_id, tenant_id)` on `tenant_users` | B | ✅ **SATISFIED** — `tenant_users_tenant_id_user_id_key UNIQUE (tenant_id, user_id)`; **zero** duplicate rows |
| 2 | `role` constrained to a role vocabulary | B | ✅ **SATISFIED** — `CHECK (role = ANY (ARRAY['admin','manager','user']))` |
| 3 | `profiles(id)` unique — multirow failure mode | B | ✅ **SATISFIED** — `profiles_pkey PRIMARY KEY (id)` |
| 4 | Revoke `CREATE` on `public` from untrusted roles | B | ✅ **SATISFIED** — only `pg_database_owner` holds `C`; `PUBLIC`, `anon`, `authenticated`, `service_role` hold `U` (USAGE) only |
| 5 | No default `PUBLIC` EXECUTE on the RPC | A | ✅ **SATISFIED** — acl is `postgres`, `authenticated`, `service_role`. **`anon` is NOT granted** |
| 6 | Exactly one visible `list_tenant_members` signature | B | ✅ **SATISFIED TODAY** — one function, zero arguments. Becomes live work: see item 9 |
| 7 | Index on `(user_id, tenant_id)` | B | ✅ **SATISFIED** — and **two redundant indexes exist** (`idx_tenant_users_user_tenant` and `tenant_users_user_id_tenant_id_idx` are identical). New minor follow-up; not this PR |
| 8 | `NOTIFY pgrst, 'reload schema'` after signature change | A, B | ✅ **ALREADY MANDATED** by the standing migration rules |
| 9 | Harden `SECURITY DEFINER` `search_path` | A (F-01), B | ⚠️ **OPEN — real work.** See the contradiction below |
| 10 | Drop the `DEFAULT NULL` fallback | A (F-02), B | ⚠️ **OPEN — changes spec item A** |
| 11 | Bind authorization to the mutation (one variable) | B | ⚠️ **OPEN — implementation discipline + test** |
| 12 | Prove identity binding end-to-end with real JWTs | B | ⚠️ **OPEN — test matrix, six caller shapes** |
| 13 | Audit invitation semantics (dedup scope, default role, acceptance re-check, audit fields) | B | ⚠️ **OPEN** |
| 14 | Accept or remove the shared demo account's cross-tenant admin | B | ✅ **CLOSED — VERIFIED-EMPTY, not accepted-risk.** See below |
| 15 | Rename `current_tenant_id()` → `legacy_profile_tenant_id()` | B | ⛔ **OUT OF SCOPE** by standing instruction — it is ROADMAP #8 and reaches ~70 policies across ~25 tables. Recorded, not actioned |

**New, found during this verification and raised by neither model:**
`public.current_tenant_id()` carries **`=X/postgres` (PUBLIC EXECUTE) and an explicit
`anon` grant** — the loosest grant of the five functions examined. It is the only one
of them `anon` can call. Impact today is nil (`auth.uid()` is NULL without a JWT, so it
returns NULL), but it is inconsistent with the other four and worth tightening when
ROADMAP #8 is done.

## Condition 14 — CLOSED as verified-empty, not accepted as a risk

The finding was **correct in form and empty in fact.** It is recorded this way so a
future reader does not reopen it as an outstanding privacy decision.

The verdict reasoned that a shared credential holding `admin` in five tenants becomes
"an aggregation point for five tenants' member directories" and that "every person with
access to those shared credentials can enumerate those tenants' user email addresses."
That is sound reasoning about a roster-listing RPC. It just does not describe this
database.

Verified live 2026-09-01 — each of the five demo tenants has **exactly one**
`tenant_users` row, and it is `admin@demo.com` itself:

| tenant | member rows | member emails | roles |
|---|---|---|---|
| apex-protect | 1 | `admin@demo.com` | admin |
| coastal-pest | 1 | `admin@demo.com` | admin |
| heartland-pest | 1 | `admin@demo.com` | admin |
| metro-pest-concierge | 1 | `admin@demo.com` | admin |
| urban-strike | 1 | `admin@demo.com` | admin |

So after the change `admin@demo.com` sees five rosters each containing **only itself**.
**No other party's email address is reachable through this RPC on any of the five.**
There is no directory to aggregate. The disclosure noted in the Wave 2 submission —
that the account goes from an empty Users list to a populated one — remains true and is
still the correct behaviour; what it populates with is the account's own row.

This closes on FACT, not on policy. It re-opens if and only if a second member is ever
added to any demo tenant, at which point the verdict's reasoning applies in full and the
question becomes a real one.

## Where the two verdicts contradict each other — F-01

They give **opposite** instructions on the same clause, so this cannot be resolved by
adopting both:

- **Appendix A** calls `pg_temp` in a `SECURITY DEFINER` `search_path` a *"known
  PostgreSQL security anti-pattern"* and a **BLOCKING** *"critical vulnerability"*,
  and instructs `SET search_path TO 'pg_catalog', 'public'`.
- **Appendix B** states that `pg_temp` placed **last** is *"materially better than an
  unpinned path"* and is what *"PostgreSQL specifically recommends"*, and separately
  faults `current_tenant_id()` — the function A holds up as correct — precisely
  **for omitting `pg_temp`**.

Live, both `get_my_tenant_role` and `list_tenant_members` are
`SET search_path TO 'public', 'pg_temp'` — `pg_temp` **last**.

**Resolution: adopt B's stronger form, which satisfies both.** `SET search_path = ''`
with every object fully qualified moots the disagreement — there is no path to hijack
and no ordering to argue about. It is also **already the in-repo precedent**: S308's
`is_operator()` and `is_tenant_member()` were shipped with `search_path=""`. Applying it
to these two functions makes the whole helper set consistent and needs no new judgement.

## Two factual errors about this codebase, recorded

These do **not** change the REJECT — a rejection stands on its strongest condition, and
conditions 9–14 are untouched by them. They are recorded so the conditions are not
implemented against a mistaken premise.

1. **Appendix A's (a) does not support its own conclusion.** It answers *"No — it is
   structurally WEAKER"*, then its worked example is a user who *"belongs to Tenant A in
   `tenant_users`"* gaining access **to Tenant A**. That is the authorized case and the
   entire point of the fix, not an escalation. Its concrete caller gains nothing they
   are not already an admin of.
2. **Appendix A's "hidden vulnerability" misstates the gate.** It claims the change lets
   *"any active user in `tenant_users` … query the email membership roster of any tenant
   they belong to."* The live body gates on
   `if public.get_my_tenant_role(v_tenant) = 'admin' then` — **membership is not
   sufficient; admin is required.** A `member` or `manager` receives zero rows. Verified
   against `pg_get_functiondef` on 2026-09-01, not from the submission text.

Appendix B reaches the opposite conclusion on (a) — *"equivalent in authorization
strength"*, with **no concrete non-admin caller found** — and rejects on the surrounding
`SECURITY DEFINER` posture and unproven end-to-end binding instead. That is the
substantive rejection of the two.

## What the next brief must change

1. **`p_tenant_id` becomes REQUIRED.** Both verdicts reject the `DEFAULT NULL` fallback;
   A wants it gone outright, B accepts it only behind telemetry, an owner, a dated
   removal migration and an alert on legacy calls — machinery this project does not
   have. Conservative-wins takes A's form: **no default, no `current_tenant_id()` path
   inside the function.**
2. **Therefore the old identity must be dropped, not replaced.** `CREATE OR REPLACE`
   cannot change the argument list, so `list_tenant_members(p_tenant_id uuid)` is a new
   function and `list_tenant_members()` must be explicitly `DROP`ped in the same
   transaction, or both signatures coexist and PostgREST sees an overload. B is right
   about this and it is the single most likely way a careless implementation breaks.
3. **This makes the deploy order MANDATORY, not merely preferred** — a required
   parameter means the old frontend bundle breaks the instant the migration lands.
   Frontend first, Vercel READY confirmed, then the migration and the edge function.
4. **`search_path = ''` + full qualification** on `get_my_tenant_role` and
   `list_tenant_members`, matching S308's helpers.
5. **Test matrix (B, condition 12)** — no membership; member; manager; admin in one
   tenant; admin in several; **admin with no `profiles` row** (the bug); requested
   tenant ≠ any membership; malformed UUID; absent parameter.
6. **Condition 14 is Scott's** and gates nothing technical: is the shared
   `admin@demo.com` credential, published on `/demos/admin`, intended to expose five
   tenants' member email directories to whoever holds it?

---

# Wave 3 — implemented against the corrected conditions

Scope was fixed by Scott and NOT exceeded. Items 1-5 and 7 are implemented; item 6 is a
REPORT ONLY, below, because acting on it is scope growth.

## What was built

| # | Condition | Done |
|---|---|---|
| 1 | `p_tenant_id` REQUIRED — no default, no `current_tenant_id()` inside the function | ✅ migration |
| 2 | `DROP FUNCTION public.list_tenant_members()` in the SAME transaction as the `(uuid)` create | ✅ migration |
| 3 | `search_path = ''` + full qualification on BOTH helpers, proven behaviour-neutral | ✅ see proof below |
| 4 | Authorization bound to the mutation through ONE variable | ✅ edge function |
| 5 | Nine-shape test matrix | ✅ `supabase/tests/s309_tenant_source_matrix.sql` |
| 6 | Invitation-semantics audit | 📋 **REPORTED ONLY — see below** |
| 7 | `NOTIFY pgrst, 'reload schema'` | ✅ migration |

## Condition 3 — behaviour-neutrality PROVEN, not asserted

The S308 B1 method: capture the access matrix, change nothing in production, compare.

`get_my_tenant_role` was rebuilt under a throwaway name
(`public._s309_probe_role`) carrying the S309 body verbatim — `search_path = ''`, fully
qualified — and both functions were evaluated over the **full cross product of every
user and every tenant** under a simulated JWT.

| | value |
|---|---|
| pairs evaluated | **63** (7 users x 9 tenants) |
| mismatches (`old IS DISTINCT FROM new`) | **0** |
| non-NULL results, old / new | **12 / 12** |
| matrix md5, before | `f01541121cef8c385f19287b15278d72` |
| matrix md5, new body | `f01541121cef8c385f19287b15278d72` — **identical** |

The probe was dropped immediately (`0` functions matching `_s309%` remain). **The live
`get_my_tenant_role` was never modified to run this test**, so the deploy order below is
still intact and production carries no trace of the experiment.

The 12 non-NULL pairs include a non-admin (`scottdevore2@gmail.com` is `user` on `dang`),
a multi-tenant admin (`admin@demo.com`, five tenants) and a single-tenant admin — the
shapes that matter are all exercised rather than being all-admin.

## Condition 6 — invitation semantics, REPORTED NOT CHANGED

Seven findings from reading `invite-team-member`. **Nothing here was altered.** Several
are pre-existing and none is caused by the tenant-source change; they are the answer to
"audit invitation semantics before trusting the admin gate."

1. **Dedup scope is correct.** The upsert is `onConflict: 'tenant_id,user_id'`, backed by
   the real `UNIQUE (tenant_id, user_id)` constraint. Re-inviting updates the role in
   that tenant only. No cross-tenant collision. ✅
2. **There is no default role, and admin is reachable in one step.** `role` is required
   and validated against `['admin','manager','user']`, so nothing is silently granted —
   but an admin can mint another **admin** in the same single call, with no second
   authorization. Gemini's condition asked for a non-admin default unless a separately
   authorized workflow grants admin. One compromised admin session can therefore create
   a persistent second admin quietly.
3. **An existing platform user is added with NO consent step.** If the email already
   exists globally, the function resolves the user id (via a `magiclink` link that is
   generated and never delivered) and **immediately upserts membership**. Any tenant
   admin can attach any existing user to their tenant by knowing their email; that user
   is simply told afterwards. Bounded — it grants access TO the inviter's tenant and
   discloses nothing about the invitee's other tenants — but the invitee never agreed.
4. **Membership is written BEFORE the invite is accepted.** For a new user the
   `tenant_users` row exists the moment the invite is sent, whether or not they ever set
   a password. There is no `status` / `invited_at` / `accepted_at` column, so the roster
   cannot distinguish a pending invite from an active member, and an abandoned invite
   leaves a permanent member row.
5. **No audit trail whatsoever.** No actor, verified tenant, requested tenant, target
   email, assigned role or correlation id is recorded anywhere. The only trace of a
   failure is a `console.error`. Condition 13 asks for audit events; there is no table
   for them.
6. **The response is an account-existence oracle.** It returns `{status:'invited'}` for a
   new email and `{status:'added'}` for one that already has a platform account. Any
   authenticated tenant admin can enumerate which addresses have accounts, one call at a
   time. (This is distinct from the anti-enumeration shape on the 403/404 paths, which is
   intact and was not touched.)
7. **"Resend" may not resend anything actionable.** `handleResend` re-invokes the same
   endpoint; for an EXISTING user that takes branch 3 and sends an "added to your team"
   email pointing at the login page, not a fresh set-password link. The button says
   resend invitation.

**Recommendation, for a separate brief:** 4 and 5 together are the ones worth doing first
— a `status` column plus an audit row make 2, 3 and 6 observable rather than invisible.
6 is a one-line change (return an identical status either way) but it changes a response
shape the frontend switches on, so it is not a drive-by.

## Deploy order — MANDATORY, not preferred

A required parameter breaks the old frontend bundle the instant the migration lands.
The migration in this PR is **written but NOT applied**; the probe above deliberately
avoided touching the live function precisely so this ordering holds.

1. Merge — Vercel builds the frontend that sends `tenant_id`.
2. Wait for Vercel **READY**. Not "deployed", READY.
3. **Then** Claude.ai applies the migration and deploys the edge function.
4. Verify by re-reading the deployed function body and `pg_get_functiondef`, and by
   running `supabase/tests/s309_tenant_source_matrix.sql`. **A version increment is not
   evidence** (S305).

## Note for the resubmission prompt

The adversarial framing used on the first submission — "I want findings, not
reassurance", "attack this argument" — should be dropped. It makes a null finding read
as a failed assignment, so under conservative-wins the gate rejects nearly everything and
stops carrying information. Ask for a straight verdict with reasoning instead.

**Keep falsification question (a) exactly as written.** It is what exposed that Gemini's
"structurally WEAKER" answer was supported by an example describing the *authorized*
case — the single most useful output of the whole gate.

---

# Gate round 2 — **APPROVE WITH CONDITIONS** from both, conditions resolved

Both models returned APPROVE WITH CONDITIONS on the re-scoped Wave 3 implementation.
Both BLOCKING conditions were verified against production and resolved in the migration.
**No third gate round.**

## BLOCKING 1 (both models) — explicit EXECUTE on `get_my_tenant_role(uuid)`

Live ACL, re-confirmed 2026-09-01:

```
postgres=X/postgres | authenticated=X/postgres | service_role=X/postgres
```

`authenticated` **already holds an explicit grant** and **PUBLIC is already absent**, so
the 42501 both models predicted **cannot occur on this database** — and
`CREATE OR REPLACE` preserves an existing ACL, so the migration was never going to
remove it either. The condition is, on production, already met.

**It is added anyway, for a reason neither model could see.** On a FRESH database this
migration runs as a plain `CREATE`, which picks up PostgreSQL's default `PUBLIC EXECUTE`.
A migration that rebuilds a *different* ACL than production is a divergence that only
shows up on a rebuild — the worst time to find it. So the grants are stated explicitly:

```sql
REVOKE ALL ON FUNCTION public.get_my_tenant_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_role(uuid) TO authenticated, service_role;
```

**This is reproducing the live ACL, NOT new hardening**, and the distinction is
load-bearing. Revoking from `PUBLIC` is safe. **Revoking from `authenticated` is not**,
and S308's B2 proved it on this exact database: an RLS policy predicate evaluates **as
the querying role**, so a role without EXECUTE cannot evaluate a policy that calls the
helper, and every such policy fails closed. `get_my_tenant_role` is called by S308b's
`settings` policies. **Do not generalise this REVOKE** — the migration says so at the
line itself, not only here.

## BLOCKING 2 (Perplexity) — dependencies on the zero-arg function

The evidence, not just the conclusion. Verified live 2026-09-01:

| dependency probe | count |
|---|---|
| zero-arg `list_tenant_members()` exists | **1** (so the DROP is not a no-op) |
| `pg_depend`, excluding `internal`/`pin` deptypes | **0** |
| policies referencing it (`qual` / `with_check`) | **0** |
| other functions referencing it (`prosrc`) | **0** |
| views referencing it (`definition`) | **0** |
| triggers referencing it (non-internal) | **0** |

Combined with `UsersSection.tsx` being the only in-repo caller, the DROP is safe.

**No `CASCADE`.** A bare `DROP` is correct *because* the dependency set is empty —
`CASCADE` would convert "nothing depends on this" from a verified fact into an
assumption, and silently destroy whatever a future dependency turned out to be.

## Non-blocking — ACCEPTED

**1. RAISE on NULL instead of returning zero rows** (Perplexity's form).

```sql
IF p_tenant_id IS NULL THEN
  RAISE EXCEPTION 'tenant_id is required' USING ERRCODE = '22004';
END IF;
```

Gemini preferred the empty return. **Both are fail-closed, so this is not a
conservative-wins conflict** — picking either is a style call, and the reasoning is
recorded rather than the preference. Taking the raise because an empty list is
indistinguishable from "you are not an admin" and from "an old bundle called this
without a tenant." This project has been burned repeatedly by real faults presenting as
innocuous empty state — the S309 bug itself surfaced as an empty Users tab, and S311's
blank testimonial cards were the same shape of problem. An error names the cause at the
moment it happens. `22004` is `null_value_not_allowed`; PostgREST surfaces it as a 400,
matching the edge function, which already 400s on this exact condition.

The nine-shape matrix script previously expected zero rows here. It now carries a
**shape 0** that asserts the raise, and the HTTP section records that
`{"p_tenant_id": null}` moves from `200 []` to `400`.

**2. `ORDER BY u.email, tu.user_id` on the member list.** S311's lesson applied
directly: a query with no `ORDER BY` has no defined order, and an unspecified order is a
defect waiting to be observed. `user_id` last makes the ordering total if two rows ever
share an email.

## Non-blocking — DECLINED, with reasons

**1. Gemini: drop the "redundant" `u.email::text` cast. DECLINED.** It is not redundant.
The `RETURNS TABLE` column is declared `text` and `auth.users.email` is `varchar`. The
cast is what makes the declared return type and the actual column type agree; removing
it invites an assignment-cast surprise at some future PostgreSQL version. **Keep it.**

**2. Perplexity: keep the zero-arg function temporarily for a zero-downtime rollout.
DECLINED — this is the rejected fallback arriving by another route.** A retained
`list_tenant_members()` that derives the tenant from `current_tenant_id()` is
functionally the `DEFAULT NULL` fallback that **gate round 1 rejected**, wearing a
different signature. It reintroduces exactly what was removed: a second execution path
inside a privileged function whose tenant source is the broken one, reachable by any
caller that omits the parameter. The deploy window is **minutes** and affects **one
admin tab**, against permanently retaining the defect the whole change exists to remove.
**Recorded here so it is not proposed a third time.**

**3. Rename `current_tenant_id()` → `legacy_profile_tenant_id()`. DECLINED — scope.**
Still ROADMAP #8, still ~70 policies across ~25 tables. The rename is right and it is
not this PR's.

---

# Appendix A — Gemini verdict (VERBATIM)

> **SUPPLIED 2026-09-01. VERDICT: REJECT.** Recorded byte-exact between the markers
> below. NOT fenced — the verdict contains its own ```sql blocks, and wrapping it
> in a fence would break them (the S308 lesson). Nothing is paraphrased, reordered or
> truncated.
>
> ✅ **ATTRIBUTION CONFIRMED BY SCOTT 2026-09-01: this appendix is GEMINI.**
> Both texts arrived in one message as "the gate for 312 from Perplexity and
> Gemini" and were first recorded in that stated order, which put Perplexity here.
> That was wrong. The doc flagged the risk at the time — the OTHER verdict carries
> inline source citations, which reads as Perplexity — and Scott confirmed the
> reversal by re-sending this text labelled "This is Gemini".
>
> **Only the two appendix HEADINGS were changed.** Neither verdict body was moved,
> re-split or re-pasted: Appendix A still holds the same 7,882 bytes it held on
> first commit and Appendix B the same 22,288, both re-verified after the relabel.
> The arbitration section above cites appendix LETTERS, never model names, so every
> cross-reference in it remains correct and untouched. Appendix A is therefore
> Gemini and Appendix B is Perplexity — the reverse of this document's original
> placeholder order, which is left as-is rather than shuffling verdict text.

<!-- BEGIN APPENDIX A VERDICT — BYTE-EXACT, DO NOT EDIT -->
Here is an adversarial security review of the proposed changes, breaking down the systemic risks, answering your specific questions, and providing actionable conditions.
---
## 1. Adversarial Analysis of Proposed Changes
### (a) Is caller-supplied candidate equivalent to server-derived?
**No. It is structurally WEAKER because `current_tenant_id()` is currently leaking cross-tenant authorization state, and making `p_tenant_id` caller-supplied expands the reach of this flaw.**
* **Concrete Caller:** Any user who belongs to *Tenant A* in `tenant_users` but has a legacy `profiles.tenant_id` set to *Tenant B* (where they are **not** a member).
* **What they gain today:** Nothing. `get_my_tenant_role(Tenant B)` returns `NULL`, and `list_tenant_members()` returns zero rows.
* **What they gain under the proposal:** If they supply `p_tenant_id = Tenant A` (their actual target), `get_my_tenant_role(Tenant A)` checks `tenant_users`, finds their role, and grants access.
* **The Hidden Vulnerability:** Look closely at `list_tenant_members()`:
```sql
select tu.user_id, u.email::text, tu.role
from public.tenant_users tu
join auth.users u on u.id = tu.user_id
where tu.tenant_id = v_tenant;
```
`list_tenant_members()` is marked **`SECURITY DEFINER`**. When executing inside a `SECURITY DEFINER` function, RLS policies on underlying tables (`auth.users`, `public.tenant_users`) are **bypassed** under the owner’s context (usually `postgres` or `supabase_admin`).
Because `list_tenant_members()` queries `auth.users` directly without additional application-level column filtering, **it leaks email addresses of all members in `p_tenant_id**`. Under the current behavior, a broken state blocked access. Under the new behavior, passing arbitrary `p_tenant_id` UUIDs allows **any active user in `tenant_users` to query the email membership roster of any tenant they belong to, bypassing standard RLS barriers on `auth.users**`.
Furthermore, if a malicious tenant admin manipulates candidate inputs to `invite-team-member`, they can now explicitly target tenants where their `tenant_users` entry grants admin privileges, even if legacy `profiles` previously pinned them elsewhere. While this fixes functional state, doing so without tightening table-level grant permissions on the `SECURITY DEFINER` functions introduces unnecessary exposure.
---
### (b) Hazards of `DEFAULT NULL` on PostgREST RPC
**YES, a severe schema caching and parameter exposure hazard exists.**
1. **PostgREST OpenAPI / Schema Cache Invalidation:** PostgREST builds its OpenAPI spec and endpoint routing based on PostgreSQL system catalogs. When altering an existing RPC signature (`list_tenant_members() -> list_tenant_members(p_tenant_id uuid DEFAULT NULL)`), PostgREST requires an explicit `NOTIFY pgrst, 'reload schema'` or container restart. If clients call the RPC during or immediately after deployment without a cache reload, PostgREST can reject requests with `404 Not Found` or `400 Bad Request` (unknown parameter `p_tenant_id`).
2. **Null-Handling Bypass in PostgREST:** In PostgREST RPC calls, passing `{"p_tenant_id": null}` explicitly in the JSON payload behaves differently than omitting the key.
* If omitted: Uses the default (`NULL` fallback logic).
* If explicitly `null`: Evaluates `v_tenant := NULL`, which hits the `if v_tenant is null then return; end if;` branch.
* However, if a client passes an unparsed or malformed string, PostgREST might yield unpredictable type coercion errors prior to function entry.
---
### (c) Should the NULL fallback branch exist?
**No. A brief deployment window with an empty state is significantly safer than introducing temporal, insecure fallback code into production.**
* **Case for NULL Fallback:** Avoids downtime or broken UI states for users running stale frontend bundles during a rolling deployment.
* **Case against NULL Fallback:** The fallback relies on `current_tenant_id()`, which you explicitly identified as **broken** (it returns `NULL` for pure `tenant_users` members and arbitrary values for multi-tenant users). Keeping the fallback preserves the exact logic bug you are trying to fix for any client that fails to pass `p_tenant_id`. It creates two execution paths inside a `SECURITY DEFINER` routine—one untrusted client path and one legacy broken server path.
* **Verdict:** **Drop the `DEFAULT NULL` fallback completely.** Atomic deployments or requiring the parameter (`p_tenant_id uuid`) forces callers to explicitly declare intent and prevents subtle, latent fallback bugs.
---
## 2. Additional Vulnerabilities & Assessment
### `SET search_path` Misconfigurations
* `public.current_tenant_id()` uses `SET search_path TO 'pg_catalog', 'public'`.
* `public.get_my_tenant_role` and `public.list_tenant_members` use `SET search_path TO 'public', 'pg_temp'`.
**Critical Vulnerability (`pg_temp` exploitation):**
Including `pg_temp` in a `SECURITY DEFINER` function's `search_path` is a known PostgreSQL security anti-pattern. If an attacker can create temporary tables or functions in their session (`pg_temp`), a `SECURITY DEFINER` function executing with elevated privileges may resolve objects in `pg_temp` prior to standard catalog objects under certain call conditions, leading to **privilege escalation**.
**Correct Configuration:**
All `SECURITY DEFINER` functions in Supabase/Postgres **MUST** explicitly specify:
```sql
SET search_path TO 'pg_catalog', 'public';
```
`pg_temp` must be omitted or placed last strictly when temporary objects are required and controlled.
---
### Shared Demo Account & Multi-Tenant Email Exposure
* **Is it acceptable?** Yes, from an authorization perspective: if an account holds `admin` role in `tenant_users` for 5 tenants, it *should* be able to view and manage members for those 5 tenants.
* **Security Risk:** Because `list_tenant_members()` accesses `auth.users`, it exposes user emails across tenants. For shared demo accounts or multi-tenant users, ensure that administrative actions and email reads are logged for auditing to prevent insider data scraping.
---
### Additional Flaws in Existing Bodies
1. **Direct Query on `auth.users` inside `SECURITY DEFINER`:**
`auth.users` contains sensitive fields (password hashes, metadata, MFA secrets). Joining `auth.users` directly in a `SECURITY DEFINER` function without explicit column safety or `REVOKE EXECUTE ON FUNCTION` safeguards means any authenticated user who can invoke `list_tenant_members()` receives direct access to account email addresses across tenants.
2. **Missing `REVOKE EXECUTE` Grants:**
By default in Postgres, `PUBLIC` is granted `EXECUTE` on newly created functions in the `public` schema. If `list_tenant_members()` is exposed via PostgREST without explicit `REVOKE EXECUTE ON FUNCTION public.list_tenant_members(...) FROM PUBLIC;` and `GRANT EXECUTE ... TO authenticated;`, unauthenticated (`anon`) callers may attempt invocation.
---
## Findings Summary
| ID | Severity | Finding |
| --- | --- | --- |
| **F-01** | **BLOCKING** | `pg_temp` present in `SECURITY DEFINER` `search_path` (`get_my_tenant_role`, `list_tenant_members`), posing a schema hijacking risk. |
| **F-02** | **BLOCKING** | `DEFAULT NULL` fallback retains legacy broken/ambiguous context derivation logic in a privileged function. |
| **F-03** | **NON-BLOCKING** | `auth.users` direct join in `SECURITY DEFINER` exposes internal user metadata across tenant boundaries if role validation fails or is misconfigured. |
| **F-04** | **NON-BLOCKING** | Lack of explicit PostgREST schema cache reload (`NOTIFY pgrst`) during RPC signature mutation. |
---
REJECT
*(To convert to **APPROVE WITH CONDITIONS**, satisfy BLOCKING conditions F-01 and F-02: remove `pg_temp` from all `search_path` declarations, set `search_path TO 'pg_catalog', 'public'`, drop the `DEFAULT NULL` parameter fallback, and issue a schema cache reload upon deployment.)*
<!-- END APPENDIX A VERDICT -->

# Appendix B — Perplexity verdict (VERBATIM)

> **SUPPLIED 2026-09-01. VERDICT: REJECT.** Same convention as Appendix A —
> byte-exact between markers, not fenced.
>
> ✅ **ATTRIBUTION CONFIRMED BY SCOTT 2026-09-01: this appendix is PERPLEXITY.**
> See the note in Appendix A for why the two headings were swapped after the
> first commit. This is the verdict carrying inline source citations, and it is
> the substantive rejection of the two — it finds NO concrete non-admin caller
> who gains anything, and rejects on SECURITY DEFINER posture and unproven
> end-to-end identity binding instead.

<!-- BEGIN APPENDIX B VERDICT — BYTE-EXACT, DO NOT EDIT -->
The proposed tenant-selection change is **not inherently weaker** than the current path, provided `get_my_tenant_role()` is truly complete, unspoofable authorization for the selected tenant and the edge function’s actual invite mutation is bound to that same verified tenant. However, the submitted function bodies contain pre-existing and potentially serious SECURITY DEFINER exposure risks that must be audited and corrected before approval.
## (a) Authorization equivalence
**Answer: equivalent in authorization strength for the stated two consumers**, with an important scope limitation.
Today the effective predicate for either operation is:
\[
\text{profiles.tenant\_id}(auth.uid()) = T
\quad \land \quad
\text{tenant\_users}(auth.uid(), T).role = \texttt{admin}
\]
After the change, the predicate becomes:
\[
\text{caller supplies } T
\quad \land \quad
\text{tenant\_users}(auth.uid(), T).role = \texttt{admin}
\]
The first condition today is not an authorization assertion—it is a lossy tenant selector. The authorization decision is the membership/role lookup against `tenant_users`, keyed to `auth.uid()`. A caller can propose any UUID after the change, but they receive members or gain invitation authority only if `tenant_users` says that the JWT subject is an admin for exactly that UUID.
I do **not** find a concrete non-admin caller who gains access they cannot obtain today solely from changing the candidate source:
- A user who belongs to tenant A as `member` can submit tenant A, but `get_my_tenant_role(A)` returns `member`, so the strict equality test denies them.
- That user can submit tenant B, where they have no membership. The role function returns `NULL`, and `NULL = 'admin'` does not pass the `IF`; they get no data / a 403.
- A user who is an admin of tenant A can submit tenant A and obtain A’s member list or invite authority. They already had that authority only when `profiles.tenant_id` happened to equal A. The change restores the intended authorization, particularly for multi-tenant administrators.
- An admin of tenants A through E can now select and administer each of A through E. That is an expansion of **reachable authorized scope**, but not an expansion of **authorization privilege**: every newly reachable tenant is one where the user is already an admin according to the authoritative membership relation.
The claim would become **weaker** if any one of these assumptions is false:
1. `tenant_users` allows duplicate `(user_id, tenant_id)` rows with different roles, or the role function can return more than one row.
2. A user can write, self-promote, or otherwise influence their own `tenant_users.role` or membership row through another endpoint, an RLS policy, a trigger, or a SECURITY DEFINER helper.
3. The downstream invitation code uses a different tenant ID from the verified request tenant—for example, it authorizes request-body `tenant_id` but inserts an invite into a separately client-controlled field.
4. The edge function is callable with a JWT whose subject does not reach Postgres as the same identity used by `auth.uid()`.
5. `get_my_tenant_role` is callable in another context where request JWT claims are absent, stale, overwritten, or set under a privileged database role.
**BLOCKING — prove the identity binding end-to-end.** Test the edge function with valid JWTs for: no membership, member, admin in one tenant, admin in multiple tenants, missing profile, and mismatched requested tenant. The database call must run under the caller JWT and `auth.uid()` must equal the JWT `sub`, not the edge function’s service role or a pooled/session residue. Supabase documents that `auth.uid()` is the authenticated request identity and returns `NULL` without one; SECURITY DEFINER changes table/RLS privilege behavior but does not inherently make an unauthenticated identity valid. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
**BLOCKING — enforce one authoritative role per user/tenant.** Add or verify a unique constraint such as `UNIQUE (user_id, tenant_id)` on `tenant_users`, and make `role` constrained to the allowed role vocabulary. With the body shown, two role rows cause the SQL function to error (“more than one row returned”), producing a denial of service for that user/tenant rather than an authorization bypass; nevertheless it is a correctness and availability defect in the authorization primitive.
**BLOCKING — bind authorization to mutation.** In `invite-team-member`, retain the validated UUID as one variable and use that exact value both for `get_my_tenant_role(p_tenant_id := v_tenant_id)` and every invite creation, tenant lookup, redirect URL, audit record, or downstream service call. Do not authorize `body.tenant_id` and later use a second raw body field, hostname-derived ID, or client-generated tenant reference.
**NON-BLOCKING — use boolean/EXISTS rather than a text scalar for authorization.** A `public.is_tenant_admin(p_tenant_id uuid) RETURNS boolean` function expressed as `EXISTS (...)` removes cardinality ambiguity and makes the intent explicit. It does not materially change the conclusion if uniqueness is already enforced. For example:
```sql
CREATE OR REPLACE FUNCTION private.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users AS tu
    WHERE tu.user_id = (SELECT auth.uid())
      AND tu.tenant_id = p_tenant_id
      AND tu.role = 'admin'
  );
$$;
```
## (b) DEFAULT NULL, PostgREST, caching, exposure
A single `list_tenant_members(p_tenant_id uuid DEFAULT NULL)` signature does **not** itself create an overload-resolution hazard. It is specifically safer than retaining both `list_tenant_members()` and `list_tenant_members(uuid)` because PostgreSQL considers a no-argument call ambiguous when both signatures are viable through a default argument. PostgreSQL documents exactly that class of ambiguity: `foo(int)` plus `foo(int, int default 42)` makes `foo(10)` ambiguous. [postgresql](https://www.postgresql.org/docs/current/sql-createfunction.html)
With exactly one signature:
- `rpc/list_tenant_members` with no body argument invokes the same function and applies the default `NULL`.
- `rpc/list_tenant_members` with `{"p_tenant_id":"<uuid>"}` invokes the same function with the supplied UUID.
- `{"p_tenant_id": null}` is distinct operationally only in how the parameter is supplied, not semantically: the body receives NULL and takes the fallback branch.
- A malformed UUID should fail input casting at PostgREST/Postgres before the function body executes; that is a client error, not an authorization bypass.
- There is no second function identity for PostgREST’s schema cache to choose between. PostgREST maps JSON object keys to named function parameters and supports omitted defaulted parameters. It does require a schema-cache refresh after changing a function signature or definition. [docs.postgrest](https://docs.postgrest.org/en/latest/references/api/functions.html)
There is no special privilege “exposure” caused by `DEFAULT NULL`. The exposure is from granting EXECUTE on a SECURITY DEFINER RPC that returns `auth.users.email`, and from any untrusted-object resolution inside that privileged function. A default only creates an intentional legacy call mode.
**BLOCKING — refresh schema cache and exercise both invocation forms during rollout.** After migration, explicitly refresh/reload PostgREST’s schema cache; otherwise clients may see stale “function not found”/parameter-discovery failures even though the database definition is correct. Test no-arg RPC, named-UUID RPC, explicit-null RPC, invalid UUID, unknown JSON parameter, and an old frontend client against the actual deployed PostgREST/Supabase version. PostgREST explicitly notes that its schema cache must be refreshed after functions are created or changed. [docs.postgrest](https://docs.postgrest.org/en/latest/references/api/functions.html)
**BLOCKING — ensure there is literally one visible compatible function.** “No overload is created” must mean more than no intended new overload. Inspect `pg_proc` for same-name functions across exposed/search-path schemas and for signatures PostgREST can discover. Also check for a historical `list_tenant_members()` function left behind by a migration. `CREATE OR REPLACE FUNCTION` cannot change input argument types; changing from `()` to `(uuid DEFAULT NULL)` creates a different function identity unless the old one is deliberately dropped. PostgreSQL states that `CREATE OR REPLACE` cannot change argument types, and different input argument lists are distinct overloaded functions. [postgresql](https://www.postgresql.org/docs/current/sql-createfunction.html)
A safe migration shape is:
```sql
BEGIN;
-- Create/replace the UUID signature first.
CREATE OR REPLACE FUNCTION public.list_tenant_members(p_tenant_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, email text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
...
$$;
-- Verify all dependency/caller migration consequences, then remove legacy identity.
DROP FUNCTION IF EXISTS public.list_tenant_members();
-- Explicit grants, in the same transaction.
REVOKE ALL ON FUNCTION public.list_tenant_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_tenant_members(uuid) TO authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
```
The precise DDL must reflect dependencies and your roles, but the important point is that the legacy `()` identity must not coexist if defaulted UUID calls need to work unambiguously.
**NON-BLOCKING — do not overstate plan-cache risk.** PostgreSQL’s `STABLE` marking is appropriate for a read-only function whose result may change between statements but is stable within a statement. The `list_tenant_members` PL/pgSQL body has no generic “default argument caching” problem. The relevant operational cache is primarily PostgREST’s schema metadata cache, not a cached default value. PostgreSQL describes `STABLE` as appropriate for database lookups whose result can change across statements. [postgresql](https://www.postgresql.org/docs/current/sql-createfunction.html)
## (c) Fallback branch decision
### Argument for retaining it temporarily
The fallback prevents an avoidable outage during a staggered deployment:
- Old frontend bundles, long-lived browser tabs, mobile/webview clients, CDN-cached assets, and rollback scenarios may continue calling the zero-argument RPC.
- The fallback preserves the exact legacy behavior for profile-backed single-tenant users: the old caller gets results only where the scalar profile binding points to a tenant in which they are an admin.
- It does not appear to grant a caller access beyond what that same caller could receive through the legacy path, assuming `get_my_tenant_role` is sound.
- It offers a safer **availability** transition for ordinary profile-backed tenants while the new frontend rolls out.
### Argument for removing it immediately
The fallback retains an obsolete authorization-adjacent dependency and its failure modes:
- Missing-profile users—the live defect population—still get an empty result if they reach the old call path.
- Multi-tenant admins still get an arbitrarily selected tenant rather than explicit tenant context.
- It lets “no tenant supplied” mean “implicitly choose a legacy tenant,” which is ambiguous operationally and makes observability and incident diagnosis worse.
- It risks becoming permanent technical debt. A “named follow-up” is not a security control unless it has an owner, deadline, rollout metric, and a hard deletion migration.
- It can conceal incomplete frontend migration because calls still “work” for the easiest population.
### My choice
Keep the fallback only as a **strictly time-boxed compatibility shim**, not as a durable behavior.
**BLOCKING — convert the follow-up into an enforced removal plan.** Ship the default only with: a named owner; a fixed removal release/date; telemetry that distinguishes omitted, explicit NULL, and supplied tenant IDs; an alert/dashboard for legacy calls; and a migration that drops/replaces the default once legacy traffic reaches zero. The compatibility endpoint must be removed, not merely documented as deprecated.
**NON-BLOCKING — prefer an explicit no-tenant error once the frontend is universal.** After cutover, make `p_tenant_id` required and reject NULL rather than silently return no rows. A 400/clear RPC error is diagnostically better than an empty team-list state that looks like “there are no users.”
I would not choose a deliberate window where the Users tab returns nothing for legitimate users merely to avoid this fallback. That is an availability regression, not a meaningful authorization hardening, given that the fallback retains the old restrictive semantics. But it is acceptable only while observability makes its removal enforceable.
## SECURITY DEFINER findings
### Search paths
`get_my_tenant_role`:
```sql
SET search_path TO 'public', 'pg_temp'
```
is materially better than an unpinned path because it puts `pg_temp` **last**. PostgreSQL specifically recommends trusted schemas followed by `pg_temp` for SECURITY DEFINER routines, because a temp schema can otherwise mask unqualified relation names and is normally writable by arbitrary users. [postgresql](https://www.postgresql.org/docs/current/sql-createfunction.html)
But neither function should be treated as unquestionably safe based only on the shown `SET` clause:
| Function | Assessment | Concern |
|---|---|---|
| `current_tenant_id()` | Less exposed in its body because `public.profiles` is qualified; `auth.uid()` uses an explicit schema. `pg_catalog, public` is reasonable only if `public` is trusted. | It omits explicit `pg_temp`. PostgreSQL’s conservative guidance is to include `pg_temp` last. More importantly, `public` must not be writable by untrusted database roles. |
| `get_my_tenant_role()` | `pg_temp` is correctly last. | `role`, `public.tenant_users`, `auth.uid`, and `p_tenant_id` are not the primary name-resolution issue; however, `public` is still in a privileged function’s lookup path. Its safety depends on no untrusted CREATE privilege there. |
| `list_tenant_members()` | `pg_temp` is correctly last. | It uses unqualified `u.email` only as a column reference and otherwise schema-qualifies `public.tenant_users` and `auth.users`; yet it calls `public.current_tenant_id()` and `public.get_my_tenant_role()` by qualified name. The path is still unnecessary breadth for a privileged routine. |
**BLOCKING — establish and verify schema trust.** Revoke `CREATE` on `public` and every schema present in these SECURITY DEFINER functions’ paths from `PUBLIC`, `authenticated`, `anon`, and any tenant-controlled database role. Audit ownership and `CREATE` grants rather than assuming Supabase defaults. PostgreSQL’s requirement is not merely “set some search path”; it is to exclude schemas writable by untrusted users, with `pg_temp` forced last. [postgresql](https://www.postgresql.org/docs/current/sql-createfunction.html)
**BLOCKING — normalize SECURITY DEFINER hardening.** Move privileged functions to a non-exposed `private` schema if possible, use `SET search_path = ''`, and schema-qualify every object in their bodies. Supabase’s current guidance explicitly recommends an empty path plus qualified names for SECURITY DEFINER functions and warns that a SECURITY DEFINER function in an API-exposed schema is callable through the Data API with the creator’s privileges. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
For example, a hardened role function should look closer to:
```sql
CREATE OR REPLACE FUNCTION private.get_my_tenant_role(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tu.role
  FROM public.tenant_users AS tu
  WHERE tu.user_id = (SELECT auth.uid())
    AND tu.tenant_id = p_tenant_id
$$;
```
That statement assumes the owner, grants, and `auth` schema accessibility are configured correctly in your environment. Test it rather than copying it blindly.
### Privilege and data exposure
`list_tenant_members()` is a sensitive data-release primitive because it crosses from `public.tenant_users` to `auth.users` and returns other members’ email addresses. As a SECURITY DEFINER function, it may bypass RLS depending on owner privileges. Supabase notes that SECURITY DEFINER executes with the creator/owner’s privileges and that an owner such as `postgres` can bypass RLS. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
**BLOCKING — audit EXECUTE grants and API exposure.** Revoke the default PUBLIC EXECUTE privilege, grant only the minimum intended role(s), and perform create/replace plus privilege changes atomically. PostgreSQL documents that functions receive EXECUTE for PUBLIC by default and recommends revoking/granting in one transaction for SECURITY DEFINER functions. [postgresql](https://www.postgresql.org/docs/current/sql-createfunction.html)
**BLOCKING — decide whether direct RPC is intentionally supported.** If the normal UI invokes this via `supabase.rpc`, then direct RPC is part of your threat model: any authenticated user can call it with arbitrary UUIDs, and the database function must stand alone as the sole authorization boundary. If it is not intended as a public Data API surface, locate it in `private`, revoke client access, and call it only from a properly authenticated server path.
### Additional body-level concerns
**BLOCKING — the existing `current_tenant_id()` is unsafe as a general “current tenant” primitive.** It encodes a false single-tenant invariant, and any future function that treats its result as authoritative rather than merely a compatibility selector can silently misroute reads or writes. Rename it to something like `legacy_profile_tenant_id()` immediately if it remains; remove it once legacy callers are gone. Its current name encourages future misuse.
**BLOCKING — `current_tenant_id()` has an unhandled multirow failure mode if `profiles.id` is not unique.** The scalar SQL subquery/function result expects at most one row. Verify a primary key or unique constraint on `profiles(id)`. This is likely true in a conventional profile table, but it is not established by the copied function body.
**BLOCKING — validate mutation-time invitation semantics, not only the admin gate.** The prompt shows authorization sequence but not how invites are created. Verify all of the following:
- Existing membership/invitation deduplication is tenant-scoped.
- The invitee cannot select or alter tenant/role through a separate field.
- Default invited role is non-admin unless a separately authorized workflow grants admin.
- Email normalization and identity collision behavior cannot attach an existing user to the wrong tenant.
- The invitation acceptance flow re-checks tenant/invite state, expiry, and intended recipient rather than trusting only an opaque client value.
- Audit events record actor, verified tenant, requested tenant, target email, assigned role, and correlation ID.
**NON-BLOCKING — return an explicit authorization result at the edge boundary.** The database function’s zero-row behavior is safe, but endpoint-level failures should distinguish malformed UUID (400), unauthenticated (401), and verified-but-not-admin/non-member (403) without revealing tenant existence. Do not return different messages for “tenant exists but you are not a member” versus “tenant does not exist.”
**NON-BLOCKING — index for the actual authorization path.** Ensure an index/unique key beginning with `(user_id, tenant_id)` for role lookup and an index beginning with `(tenant_id)` for listing all members. This is primarily availability protection: an authorization function that becomes slow under tenant growth creates practical denial-of-service pressure. Supabase recommends indexes on columns used by RLS/policy filters; the same rationale applies to membership authorization lookups. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
## Demo-account email disclosure
It is acceptable **only if it matches the intended membership policy**: the shared demo account is genuinely an `admin` in all five tenants, and tenant admins are supposed to view the full membership roster and member email addresses for their own tenant.
The change causes that account to see personal data it could not reach through this particular broken function before, but the prior non-disclosure was accidental—caused by a stale scalar pointing to an unrelated sixth tenant—not a real authorization rule. Correcting a bug that deprived authorized administrators of tenant member data does not weaken authorization.
That said, this is a real **data-visibility behavior change**, not merely a reliability fix:
- The shared demo account becomes an aggregation point for five tenants’ member directories.
- Every person with access to those shared credentials can enumerate those tenants’ user email addresses.
- If the account is shared across prospects, support staff, or unrelated customers, “admin” is too broad a role for the privacy model even though the database logic is functioning correctly.
**BLOCKING — explicitly accept or remove the shared-account cross-tenant access model.** Confirm that the same human/operator group is authorized to view all five tenant directories and their email addresses. If not, remove the shared account’s admin memberships, replace it with per-tenant demo identities, or define a restricted demo/support role that cannot call roster-listing RPCs. This changes my verdict because a technically valid role check cannot compensate for overbroad role assignment.
**NON-BLOCKING — minimize returned identity data.** If the Users tab does not require raw email for every admin workflow, return a display name or masked email by default and expose full email only through a narrower permission. This is privacy minimization, not a substitute for the membership authorization gate.
REJECT
<!-- END APPENDIX B VERDICT -->

# Appendix C — Gemini verdict, round 2 (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** The round-2 arbitration above was provided by Scott in
> summary form — the BLOCKING conditions, the accepted and declined non-blocking items,
> and the APPROVE WITH CONDITIONS outcome — but the raw verdict TEXTS were not included
> in that message.
>
> **Nothing here is reconstructed from the summary.** Paraphrasing a verdict into a slot
> labelled VERBATIM would make the record worse than leaving it empty, because a future
> reader cannot tell a reconstruction from a transcript. Replace this block with the raw
> Gemini output, unedited, using the same non-fenced marker convention as Appendices A
> and B — the verdicts contain their own code fences, so they must not be wrapped in one.

<!-- BEGIN APPENDIX C VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE GEMINI ROUND-2 VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX C VERDICT -->

# Appendix D — Perplexity verdict, round 2 (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** Same convention and same reason as Appendix C.

<!-- BEGIN APPENDIX D VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE PERPLEXITY ROUND-2 VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX D VERDICT -->
