# REVIEW — S308 · Split the accidental operator grant

**Branch:** `claude/support-tickets-rls-policies-xbwg8a`
**Date:** 2026-08-31

> # ✅ VALIDATOR GATE COMPLETE — ⛔ STILL DO NOT MERGE (Scott merges)
>
> Both models returned **APPROVE WITH CONDITIONS**. Conservative-wins
> arbitration: every condition either model raised was treated as applying.
> All blocking conditions are addressed below; two are **reported, not fixed**,
> by explicit instruction.
>
> **Both verbatim verdicts are recorded in Appendices A and B**, reproduced
> byte-exact and verified by checksum against the supplied text. Nothing in this
> document paraphrases or reconstructs the models' words.

---

## Framing for the validator models

> We are replacing an **unscoped blanket grant keyed on a stale membership
> table** with (1) an **explicit operator allowlist** and (2) an **additive
> membership predicate sourced from the SSOT table**, on tables that are read
> from a browser SPA under the end user's own JWT.
>
> Before: 13 policies, each `FOR ALL TO authenticated USING (current_tenant_id()
> = '<fixed uuid>')`, where `current_tenant_id()` is
> `SELECT tenant_id FROM profiles WHERE id = auth.uid()`. The expression never
> references the row's `tenant_id`, so it is a blanket grant over the whole
> table, and it keys on `profiles`, which a shared demo account also points at.
>
> After: each becomes `USING (public.is_operator())`, plus per-table membership
> policies reading `tenant_users`. Both helpers are `SECURITY DEFINER`,
> `STABLE`, with `SET search_path TO 'public'`, `REVOKE ALL … FROM PUBLIC` and
> `GRANT EXECUTE … TO authenticated, service_role`. The `operators` table has
> RLS enabled and **no policies**, so it is reachable only through the definer
> function.
>
> The client cannot use `service_role` — this is a Vite SPA and the key would
> ship in the bundle — so the operator predicate must be safely callable by
> `authenticated`. Please assess: privilege-escalation paths, definer-function
> hardening, whether the additive permissive design can grant more than
> intended, and RLS recursion risk.

---

## Verdicts

Both: **APPROVE WITH CONDITIONS**. Verbatim texts in Appendix A (Perplexity) and
Appendix B (Gemini), byte-exact.

**Resolution rule:** conservative-wins. Applied at B1, where Perplexity asked for
`'pg_catalog'` on the search_path and Gemini asked for `search_path = ''` with
full qualification; Gemini's stricter form was taken.

### What both models independently confirmed

- The specific escalation S308 targeted **is closed**.
- `operators` with RLS enabled and **no policies**, reachable only through a
  definer helper, is the **correct pattern**.
- **Operator-only `prospects`** is correct (decision B).
- **`tenants` member-SELECT-only** is right (deviation 1).

### Correction to the S308 brief, recorded per instruction

Gemini is right that **`SECURITY DEFINER` was NOT required for recursion
avoidance**. `tenant_users`' own policy is `auth.uid() = user_id` — self-contained,
referencing no other table — so an inline subquery could not have recursed. The
brief's stated justification was wrong, and this session repeated it in the S308
migration header and commit message.

`SECURITY DEFINER` remains defensible on other grounds: it centralises the
membership rule in one place, and it keeps `operators` opaque to callers who hold
no privilege on it. **The implementation is unchanged** — only the reasoning is
corrected.

---

## What changed

### Database — `20260831170000_s308_operator_membership_split.sql` (applied live)

- `public.operators` — allowlist table, RLS on, **no policies**. Seeded with
  exactly one row: `32b8fbf4-…` (`scott@homeflowpro.ai`), idempotent via
  `ON CONFLICT DO UPDATE`.
- `public.is_operator()` / `public.is_tenant_member(uuid)` — `SECURITY
  DEFINER`, `STABLE`, pinned `search_path`, `REVOKE ALL FROM PUBLIC`, execute
  granted to `authenticated, service_role`.
- 13 `ironwood_admin_*` policies dropped; 13 `<t>_operator_all` created.
- Membership policies per §2 of the QA report, including two conservative
  deviations (`tenants` SELECT-only; `youpest_layout` none).
- `support_tickets`: SELECT / INSERT rewritten onto `tenant_users`, **new
  UPDATE policy** (there was none), all scoped `TO authenticated` rather than
  `{public}`.
- `support_replies`: Host-header `split_part()` derivation retired;
  `service_role_all_replies` untouched.
- Ends with `NOTIFY pgrst, 'reload schema'`.

### Database — `20260831180000_s308b_settings_role_gate.sql` (applied live)

Scott's follow-up decision. `settings_member_all` → `settings_member_select`
(plain membership) + `settings_member_write` (membership AND
`get_my_tenant_role(...) = ANY (ARRAY['admin','manager'])`), matching the six
role-gated tables. `settings` holds the `integrations` OAuth tokens, so the new
membership path must not hand a `user`-role member write on a paying client's
credentials. `tenant_isolation_settings_auth` is untouched, making the new path
deliberately stricter than the legacy one. Own rollback file:
`s308b_settings_role_gate_rollback.sql`; the S308 rollback also clears the new
policy names.

Re-proven: `scottdevore2@gmail.com` (role `user` on `dang`) SELECT 16 /
**UPDATE 0**; Kirk (`admin`) SELECT 16 / **UPDATE 16**; `admin@demo.com` on
coastal-pest 13 / 13 and on `dang` 0 / 0. Exactly one `user`-role row exists in
`tenant_users`, so nothing legitimate breaks.

**Rollback staged in the same commit:**
`s308_operator_membership_split_rollback.sql` — restores all 13
grants verbatim from their captured `pg_policies` definitions, restores the
pre-S308 ticket/reply policies, drops the helpers and the table. It carries a
warning that applying it reinstates the escalation.

### Code

- `src/components/admin/SupportTab.tsx` — the `if (!error && data)` success-only
  branch had **no else**; an RLS rejection left the modal open with no message.
  Now surfaces the failure, with a specific message for `42501`, logs the code,
  and clears on reopen/cancel/close. The success path was de-nested (the old
  bare block existed only to avoid shadowing `data`).
- `supabase/functions/notify-support-ticket/index.ts` — `requireTenantAdmin` →
  `requireTenantUser` (v17). RLS lets any member file a ticket, so an
  admin-only notify gate meant a `user`-role member could file a ticket that
  emailed nobody. Still resource-bound: `tenant_id` comes from the ticket.
  **Deployed v44 with `verify_jwt: false` passed explicitly**, matching both
  `config.toml:131` and the previously deployed v43.

---

## Reviewer checklist

- [x] No `service_role` key in client code
- [x] `supabase/functions/_shared/auth/` unmodified (`git diff --quiet` clean)
- [x] `current_tenant_id()` untouched; `profiles` not dropped/altered/backfilled
- [x] Rollback staged in the same commit as the change
- [x] Migration ends with `NOTIFY pgrst, 'reload schema'`
- [x] Seed is idempotent (`ON CONFLICT … DO UPDATE`)
- [x] All new policies scoped `TO authenticated`, none `{public}`
- [x] Zero RESTRICTIVE policies — additivity argument holds
- [x] CI: tsc / eslint / build / vitest all green; BL canary empty
- [ ] **Validator gate — NOT RUN**
- [ ] **Five-demo browser render — NOT RUN** (proxy blocks `*.pestflowpro.ai`)
- [ ] **End-to-end ticket email — NOT RUN** (proxy blocks the functions host)

---

## Open decisions for Scott

1. ~~`settings` has no role gate~~ — **resolved by S308b.** One thread remains:
   `settings_member_select` is plain membership, so a `user`-role member can
   still *read* the `integrations` OAuth tokens (verified readable). Write is
   closed; read is not. Narrow options: exclude `key = 'integrations'` from
   member SELECT, or role-gate SELECT too. Flagged, not decided.
2. ~~The Domain tab's save is unreachable~~ — **resolved.**
   `scott@homeflowpro.ai` now holds `pestflow-pro:admin` in `tenant_users`, so
   the operator can reach that UI. See QA report §9.
3. **`https://demo.pestflowpro.ai/admin` is a dead CTA** — no tenant has slug
   `demo`. Report-only, as instructed.
4. **`current_tenant_id()` is still on `profiles`** for ~70 policies across ~25
   tables. Out of scope here; wants its own session.

---

# Validator gate conditions — disposition

| # | Condition | Status |
|---|---|---|
| **B1** | Harden both definer functions | **DONE** — `search_path = ''`, full qualification, `auth.uid()` subselect. Matrix re-run, behaviour-neutral. `20260831190000_s308d_b1_harden_definer.sql` |
| **B2** | Close the RPC exposure | **TESTED, CHEAP FIX DISPROVEN.** Revoking EXECUTE from `authenticated` breaks RLS entirely. Grants restored, matrix re-verified. Schema move → ROADMAP #12 |
| **B3** | Prove the permissive OR-union cannot bypass role gating | **DONE — and it FAILS on two tables.** Six pass; `settings` and `tenant_redirects` have ungated legacy write policies. **Reported, not fixed**, per instruction |
| **B4** | Stale-profiles union audit | **DONE** — exactly one stale user. Report only |
| **B5** | Support-ticket UPDATE boundary | **DONE** — `tenant_id` was mutable; now locked by trigger. `20260831200000_s308e_gate_d1_b5.sql` |
| **D1** | Role-gate `tenant_redirects` | **DONE** — split like the seven. Note the B3 limitation above |
| **D2** | `tenants` column inventory | **DONE** — no secrets or tokens. Member SELECT stands |
| **D3** | Regression tests | **FOLLOW-UP** — ROADMAP #13 |
| **D4** | `current_tenant_id()` on `profiles` | **CONFIRMED OUT OF SCOPE** — ROADMAP, pre-existing |

## B2 — the result, in full

Gemini's condition 1 says `is_tenant_member()` is callable from any browser JWT
via `/rest/v1/rpc/`. The instruction was to test the cheaper fix first.

**Tested. It does not work.** With EXECUTE revoked from `authenticated`, every
query against a table carrying these policies fails:

```
ERROR:  42501: permission denied for function is_operator
```

RLS predicates are evaluated as the **querying role**, so that role must hold
EXECUTE on any function the predicate calls. The revoke does not merely close
the RPC — it disables the policies. Grants were restored immediately and the
full matrix re-verified against its pre-revoke baseline: every value matched.

**A severity correction worth recording.** Both helpers only ever report on
`auth.uid()`. `is_tenant_member(p_tenant_id)` accepts an arbitrary tenant uuid
but answers solely about the *caller* — it is not a cross-user oracle. The most
a caller learns by enumerating it is which tenants they themselves belong to,
which they already know. `is_operator()` likewise reveals only their own status.
The exposure is real but carries no information the caller does not already
hold. That does not remove the case for the schema move; it does mean this is
not urgent.

Separately: `anon` also holds EXECUTE (Supabase's default privileges grant it at
creation; the S308 `REVOKE ALL … FROM PUBLIC` does not remove a role-specific
grant). For `anon`, `auth.uid()` is NULL and both helpers return false. Not
changed — the instruction authorised a revoke test for `authenticated` only.

## B3 — the OR-union proof, and where it fails

The full per-table policy enumeration is in `QA_REPORT_S308.md` §B3, verbatim.

**Six tables PASS.** For `blog_posts`, `page_content`, `seo_meta`,
`service_areas`, `team_members`, `testimonials`, every policy capable of
authorising a write — legacy `_insert`/`_update`/`_delete` and the new
`_member_write` — carries **both** a tenant match and
`get_my_tenant_role(...) = ANY (ARRAY['admin','manager'])`.

**Two tables FAIL.**

| table | ungated write policy | expression |
|---|---|---|
| `settings` | `tenant_isolation_settings_auth` | `FOR ALL … USING/WITH CHECK (tenant_id = current_tenant_id())` |
| `tenant_redirects` | `tenant_isolation_redirects_write` | `FOR ALL … USING/WITH CHECK (tenant_id = current_tenant_id())` |

Neither contains a role test. Because permissive policies OR together, **the
role gate added by S308b and D1 is bypassable on these two tables** by any user
whose `profiles.tenant_id` matches the row — the legacy path authorises the
write on its own.

**Not exploitable by any user that exists today**, and that is luck rather than
design: the only sub-admin member, `scottdevore2@gmail.com` (role `user` on
`dang`), has **no `profiles` row**, so `current_tenant_id()` returns NULL for
them and the legacy policy cannot fire. Grant that account a `profiles` row —
which provisioning used to do routinely — and it gains full write on a paying
client's `settings`, including the `integrations` OAuth tokens, with the role
gate silently bypassed.

**Reported, not fixed.** Removing or narrowing those two legacy policies changes
semantics for existing users and is Scott's call.

*Operator policies (`*_operator_all`, `USING is_operator()`) authorise writes
without a role test by design — operators are global staff, not tenant members.
They are excluded from the claim above deliberately.*

## B4 — stale-profiles union audit (report only)

A user is "stale" when `profiles.tenant_id` names a tenant they hold no
`tenant_users` row for — legacy access to a tenant the SSOT says they are not in.

| user | `profiles` points at | `tenant_users` memberships | verdict |
|---|---|---|---|
| **admin@demo.com** | **pestflow-pro** | apex-protect, coastal-pest, heartland-pest, metro-pest-concierge, urban-strike | **STALE** |
| admin@dangpestcontrol.com | dang | dang | consistent |
| admin@ironwoodopsgrp.com | pls | pls | consistent |
| admin@pestflowpro.com | pestflow-pro | pestflow-pro | consistent |
| precisionlawnsystems@yahoo.com | — | pls | no profiles row |
| scott@homeflowpro.ai | — | pestflow-pro, vita-glow | no profiles row |
| scottdevore2@gmail.com | — | dang | no profiles row |

**Exactly one stale user: `admin@demo.com`**, holding legacy access to
`pestflow-pro` — the Ironwood/platform tenant — through every surviving
`current_tenant_id()` policy, despite not being a member of it. This is the
residue of the original bug. No rows cleared, per instruction.

## D2 — `tenants` column inventory (report only)

| # | column | type | classification |
|---|---|---|---|
| 1 | id | uuid | metadata |
| 2 | name | text | public routing / display |
| 3 | subdomain | text | public routing / display |
| 4 | custom_domain | text | public routing / display |
| 5 | created_at | timestamptz | metadata |
| 6 | slug | text | public routing / display |
| 7 | archived_at | timestamptz | metadata |
| 8 | is_protected | boolean | internal lifecycle flag |
| 9 | deletion_confirmed | boolean | internal lifecycle flag |
| 10 | deletion_final_confirmed | boolean | internal lifecycle flag |
| 11 | render_model | text | metadata |
| 12 | **pestflow_platform_company_id** | uuid | **provider / internal ID** |
| 13 | **entitlement** | smallint | **billing — plan tier gate (S305)** |

**No secrets, tokens, credentials, or internal notes.** Two columns are worth
naming: `entitlement` (the billing tier a member can already infer from their
own UI) and `pestflow_platform_company_id` (an internal join key, not a
credential). Nothing here is withheld from a tenant member today by any other
means. **Member SELECT stands**; the policy is unchanged.

---

# Appendix A — Perplexity verdict (VERBATIM)

Reproduced byte-exact as supplied. Not fenced, because the verdict contains its
own fenced code blocks; fencing it would corrupt them. Nothing below this line
until the Appendix B heading is this session's words.

<!-- BEGIN PERPLEXITY VERBATIM -->
# Verdict: APPROVE WITH CONDITIONS

The change correctly removes the demonstrated cross-tenant blanket grant and replaces it with row-bound tenant membership checks plus a separately modeled operator capability. However, I would condition approval on closing a direct-RPC exposure/implementation-hardening gap around the `SECURITY DEFINER` helpers and on explicitly accepting—or remediating—the remaining permissive legacy-policy union.

## Introduced by this change

### 1. The policy design fixes the stated data breach

The replacement of each blanket policy:

```sql
USING (current_tenant_id() = operator_tenant_id)
```

with:

```sql
USING (public.is_operator())
WITH CHECK (public.is_operator())
```

removes the original flaw because `is_operator()` is tied to the authenticated user’s presence in `operators`, not to a `profiles.tenant_id` value. The newly seeded operator account has no legacy `profiles` row, so it cannot accidentally qualify under the old “operator tenant” identity condition.

The member policies also correctly bind authorization to the **row’s** tenant:

```sql
USING (public.is_tenant_member(tenant_id))
```

and, on `tenants`, correctly use:

```sql
USING (public.is_tenant_member(id))
```

That is the missing row predicate that the old `ironwood_admin_*` policies lacked.

The reported outcomes are consistent with this: the published demo user loses access to the paying tenant’s rows, while users who exist only in `tenant_users` gain intended access. That is exactly the desired migration direction.

PostgreSQL combines applicable permissive policies with logical OR, so removing the unconditional old policy is essential; the new policies themselves do not recreate that table-wide condition. [postgresql](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### 2. A direct callable capability is introduced

`is_tenant_member(p_tenant_id uuid)` is callable by every `authenticated` user because of:

```sql
GRANT EXECUTE ON both TO authenticated, service_role;
```

and because it resides in `public`, which is normally exposed through Supabase’s Data API / PostgREST RPC mechanism. Callable database functions can be reached through `/rpc`, subject to database privileges. [docs.postgrest](https://docs.postgrest.org/en/v12/references/api/functions.html)

That direct call does **not** let an attacker discover whether *someone else* belongs to a tenant. It evaluates only:

```sql
tu.user_id = auth.uid()
AND tu.tenant_id = p_tenant_id
```

So it answers only: “Is the caller a member of this UUID?”

That is generally low-impact and not a tenant-isolation bypass. A caller already knows their own tenant memberships through the application or through the rows they can access. The UUID must also be guessed or acquired elsewhere; this function does not enumerate tenant IDs.

Still, this is an externally callable membership oracle and therefore an API surface you probably do not need. The same applies to `is_operator()`: it lets every logged-in user determine whether **they themselves** are an operator. That result is not sensitive in the ordinary sense, but the function’s *privilege boundary* is sensitive.

**Condition 1 — move helpers out of the exposed API schema, or explicitly prevent RPC exposure.**  
Create a non-exposed schema such as `private` or `security`, move these functions there, and reference them schema-qualified from policies:

```sql
CREATE SCHEMA IF NOT EXISTS security;

CREATE FUNCTION security.is_operator() ...
CREATE FUNCTION security.is_tenant_member(p_tenant_id uuid) ...
```

Then grant only the schema/function access needed for policy execution. Supabase specifically advises that `SECURITY DEFINER` functions should not live in an exposed schema because callers can invoke them through the Data API with the definer’s privileges. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

If moving them is operationally impractical, confirm from the PostgREST/Supabase API configuration that RPC exposure is disabled for these functions and retain a test proving `/rpc/is_operator` and `/rpc/is_tenant_member` are unavailable to browser JWTs. Merely assuming they will not be called is not a control.

### 3. `search_path` hardening is incomplete

The functions use:

```sql
SET search_path TO 'public'
```

and reference unqualified table names:

```sql
FROM public.operators o
FROM public.tenant_users tu
```

The relations themselves are qualified, which avoids the most obvious table-name hijack. However, this is still weaker than the recommended `SECURITY DEFINER` pattern:

```sql
SET search_path = ''
```

with every referenced object schema-qualified. Supabase’s guidance is explicit: pin the path to empty and qualify names, so a caller cannot redirect unqualified names to attacker-controlled objects under the function owner’s authority. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

In these exact SQL bodies, the practical escalation path appears limited because all table references are already `public.*` and the functions use only built-in SQL constructs. But the setup is brittle: a later maintenance edit such as an unqualified helper function, cast, operator, or type could turn this into a privilege-escalation vulnerability.

**Condition 2 — recreate both functions with `SET search_path = ''` and fully qualify every non-built-in dependency.** For example:

```sql
CREATE OR REPLACE FUNCTION security.is_operator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.operators AS o
    WHERE o.user_id = (SELECT auth.uid())
  );
$$;
```

Do the same for `is_tenant_member`. Use `(SELECT auth.uid())` if you want the common Supabase policy-performance pattern, though that is primarily a performance/readability choice rather than a correctness fix. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 4. `operators` with RLS and no policies is a sound pattern

Yes: an RLS-enabled `operators` table with no policies defaults to deny for roles subject to RLS. That prevents browser clients from listing staff identities, inspecting notes, or inferring operator status by querying the table. PostgreSQL’s default behavior is deny-all when RLS is enabled and no applicable policy exists. [postgresql](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

Using a narrowly scoped, boolean-returning definer function to consult that table is preferable to granting client-side `SELECT` on `operators`.

There are operational caveats, but not a reason to reject:

- The function owner must retain `SELECT` on `public.operators`.
- If the table owner owns the function and bypasses RLS, that is fine provided the function remains a narrow boolean predicate.
- Do not grant direct table privileges to `authenticated`.
- Manage operator admission/removal only through an audited administrative migration, secured server-side workflow, or a tightly controlled administrative function—not through either browser SPA.
- Ensure the table has RLS enabled in every environment and is not accidentally replaced/recreated without it.

The `PRIMARY KEY (user_id)` is appropriate and makes the lookup selective.

### 5. The `tenants` policy is correct structurally, but full-row reads need an explicit product decision

`tenants` should be **member SELECT only**, not member `FOR ALL`. That avoids allowing clients to update `entitlement`, `slug`, deletion flags, or other tenancy lifecycle fields. The stated reason—preventing self-service plan escalation—is correct.

However, a `SELECT *` policy exposes **every column** in the row to every member of that tenant. RLS filters rows, not columns. PostgreSQL privileges can additionally be column-specific, and Supabase emphasizes that grants and policies are both part of the access decision. [postgresql](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

Whether that is safe depends on actual columns, which are not fully listed:

| Column/category | Assessment |
|---|---|
| `slug` | Normally appropriate for all tenant members; it is needed for tenant routing and branding. |
| `entitlement` / billing tier | Often acceptable to members, but it is business-sensitive and may reveal plan limits or commercial status. It should be deliberately product-approved rather than exposed by accident. |
| Deletion flags / lifecycle state | Usually acceptable to admins, but potentially confusing or operationally sensitive for ordinary users. |
| Billing provider IDs, Stripe customer/subscription IDs, invoice metadata, internal support flags, internal notes, provisioning secrets | Should not be returned to all tenant members. |
| Domain verification tokens, integration credentials, API keys, webhook secrets | Must not be accessible to ordinary tenant members; ideally they should not live in `tenants` at all. |

**Condition 3 — inventory `public.tenants` columns before approval and either:**

- confirm that every column is appropriate for every tenant member, or
- revoke broad table `SELECT` from `authenticated` and expose a safe projection through a security-invoker view / dedicated safe table / RPC, or
- use column-level `SELECT` grants where compatible with the client’s query pattern.

This condition applies even if `entitlement`, `slug`, and flags are the only sensitive-looking columns currently known; the risk is that `SELECT` permission means full-row access.

### 6. Operator-only `prospects` is appropriate

No objection. A `tenant_id` field is not automatically a tenancy boundary. If `prospects` represents internal sales/CRM/provisioning data and the field is only a sparse backlink, treating it as a tenant-accessible resource would be a data-model error.

Operator-only access is the appropriate control if tenants must not see or modify their internal sales records, regardless of whether one of six records happens to contain their tenant ID. The measured reduction from six visible prospect rows to zero for the demo user supports that this removes an unintended exposure.

The same reasoning supports operator-only treatment of:

- `salespeople`
- `ironwood_integrations`
- `youpest_layout`

provided these are truly global/internal resources and no customer-facing workflow requires tenant access.

### 7. The support-ticket change is an intended privilege expansion

The first-ever operator `UPDATE` policy on `support_tickets` / `support_replies` grants a capability that was formerly effectively denied or silently filtered. That is an intentional and apparently necessary operational fix.

It is safe only if the `WITH CHECK` on the new policy prevents an operator from changing the ticket/reply’s tenant association in a way that creates an unauthorized cross-tenant reassignment. An operator is intentionally global, so this is not a cross-tenant exposure *to the operator*, but moving a record between tenants can corrupt isolation, audit history, notifications, metrics, and customer visibility.

**Condition 4 — verify the operator update policy’s `WITH CHECK` and column grants.**  
At minimum, decide explicitly whether operators may mutate ownership/boundary columns such as `tenant_id`, `created_by`, requester/customer IDs, or ticket linkage IDs. If they should not, deny column-level update access or add a restrictive immutable-boundary policy/trigger.

## Pre-existing issues

### 1. Legacy `current_tenant_id()` policies remain a material authorization inconsistency

This change leaves approximately 70 policies across approximately 25 tables dependent on:

```sql
current_tenant_id() = row.tenant_id
```

where `current_tenant_id()` reads legacy `profiles.tenant_id`, not `tenant_users`.

That is a **pre-existing** identity-source weakness. It is not introduced by this change, and you have said scalar legacy semantics cannot represent five memberships. It should not block this specific remediation if those policies are unchanged and this review is scoped to the applied change.

But it remains security-relevant:

- A user with a stale, incorrect, or attacker-influenced `profiles.tenant_id` may receive access to that one tenant wherever legacy policies remain.
- A user who has multiple legitimate `tenant_users` memberships but one legacy profile row will have inconsistent access depending on the table.
- A user with no `profiles` row can be denied access to legacy-governed tables despite valid current membership.
- If a published/demo account is ever again assigned the operator tenant in `profiles`, it could regain legacy access wherever a surviving legacy policy is improperly unscoped or overly broad.

This particular change improves seven tables and the support tables by adding current-SSOT policies, but it does not resolve the system-wide old-source problem.

**Not a blocking condition for this change**, but it needs an owned migration plan and a policy inventory. The correct eventual redesign is not simply “make `current_tenant_id()` return one arbitrary membership”; it is to replace row-level ownership checks with an existential membership predicate such as `is_tenant_member(row.tenant_id)` and use a separate role predicate for write authority.

### 2. Pre-existing permissive policies can override the new member-write role gate

This is the most important union-analysis finding.

For the seven role-gated tables, the new intended member write rule is:

```sql
is_tenant_member(tenant_id)
AND get_my_tenant_role(tenant_id) IN ('admin', 'manager')
```

But the old policies survive and are permissive. PostgreSQL evaluates multiple applicable permissive policies as OR, including for `USING` and `WITH CHECK`. [postgresql](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

Therefore, for a user whose `profiles.tenant_id` equals a row’s tenant ID:

- The old policy can authorize the row under the legacy predicate.
- The new `member_write` role gate does **not** constrain that legacy path.
- A `user`-role person may still write if any surviving old policy on that table grants writes based only on `current_tenant_id()`, or grants a broader role condition than `admin`/`manager`.

This is a direct answer to question 7: **yes, two policies expressing “the same” intended rule through different membership sources are dangerous when they are permissive, because they are not an intersection.** The stricter new policy does not “add a check” to an old permissive policy; it creates another allowed path.

You state that the seven tables “already gate writes behind `get_my_tenant_role(tenant_id) IN ('admin','manager')`.” If that statement means every surviving old write policy includes precisely this row-bound role test, then a normal `user` remains unable to write through the old route. In that narrow case, the duplication is not itself an escalation, though it remains hard to audit and can diverge later.

However, the policy definitions shown only establish the old `ironwood_admin_*` policies were dropped. They do not establish the exact surviving legacy write policy definitions for those seven tables. The measured “user-role member: no INSERT/UPDATE/DELETE” result is valuable but is not enough by itself to prove the absence of all broader cases across all commands, all table grants, and all member/profile combinations.

**Condition 5 — produce and review the effective policy matrix for all seven tables, then prove the OR-union cannot bypass role gating.** For each of:

- `blog_posts`
- `page_content`
- `seo_meta`
- `service_areas`
- `team_members`
- `testimonials`
- `settings`

enumerate every existing policy applicable to `authenticated`, grouped by operation. Verify that every policy capable of authorizing `INSERT`, `UPDATE`, or `DELETE` requires both:

```sql
row tenant matches an authorized tenant identity
```

and:

```sql
get_my_tenant_role(row_tenant) IN ('admin', 'manager')
```

For `INSERT`, verify the equivalent check is in `WITH CHECK`; for `UPDATE`, verify it applies both to the old row via `USING` and the resulting row via `WITH CHECK`.

If any old policy permits write based only on `current_tenant_id()`—or its role expression differs—drop/replace it as part of the remediation. Do not rely on a separate permissive policy to “tighten” it.

### 3. `tenant_redirects` has an intentional but broader write grant

The new rule is effectively:

```sql
FOR ALL
USING (is_tenant_member(tenant_id))
WITH CHECK (is_tenant_member(tenant_id))
```

That grants every tenant member, including role `user`, `INSERT`, `UPDATE`, and `DELETE` on redirects for each tenant they belong to.

This is not an accidental cross-tenant flaw: it is row-scoped using current SSOT membership. But it is a **new capability** wherever a legitimate tenant member lacked legacy access, and it may be over-broad within a tenant. Redirects can alter SEO, traffic routing, campaign attribution, and destination URLs. In many SaaS designs they should be admin/manager-managed, not universally member-writable.

The user’s role model is already used for content/settings tables, so role-gating redirects would be more consistent unless the product explicitly treats redirect management as an all-member capability.

**Condition 6 — make an explicit product authorization decision for `tenant_redirects`.**  
If ordinary `user` members should not manage redirects, change it to the same `admin`/`manager` write gate used by the seven tables, with a member-select policy if needed. If all members are intended to manage redirects, document it and add tests for a `user` member’s allowed operations.

### 4. Existing grants must still be audited

RLS does not replace object-level grants. A request must have the table-operation grant before policy evaluation, and adding policies does not revoke existing grants. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

This is largely **pre-existing configuration risk**, not an issue caused by this migration. Still, its relevance is heightened because the change adds `FOR ALL` policies. Ensure that:

- `authenticated` has only the intended table operation privileges for each table.
- `anon` does not retain a write grant merely because an RLS policy happens not to match.
- `operators` has no `authenticated` table grant.
- `tenants` grants only `SELECT` to `authenticated` if browser clients do not need direct DML.
- `prospects`, `salespeople`, `ironwood_integrations`, and `youpest_layout` do not carry grants that become relevant through an accidental future policy.

This does not block the stated change if already true, but it belongs in the test suite because a missing grant and an RLS-filtered denial behave differently.

## Direct answers

### 1. Is the additive union broader than intended?

**Yes, potentially, in specific cases.**

| Case | Broader path | Status |
|---|---|---|
| User has a valid `tenant_users` membership but no `profiles` row | New member policies allow access where old policies denied it | **Intended** migration benefit. |
| Multi-tenant user accesses a non-profile tenant | New member policies allow access where `current_tenant_id()` denied it | **Intended** for tables receiving the new policies. |
| Valid tenant member, role `user`, on the seven write-gated tables | Could write if any surviving permissive legacy write policy lacks or weakens the exact role test | **Must be verified; blocking condition.** |
| User with stale/mismatched `profiles.tenant_id` | May retain legacy access to that profile tenant in addition to `tenant_users`-based access | **Pre-existing weakness retained**, not introduced; may create an unintended union on covered tables. |
| Operator with no `profiles` row | Gets operator access only through `operators` | **Intended.** |
| Legitimate non-operator member of `tenant_redirects` | Gets full DML for their tenant | **Introduced/expanded capability**; condition on role intent. |
| Tenant member on `tenants` | Gains full-row read for their tenant | **Intended structurally**, but column exposure must be reviewed. |
| Any authenticated caller invoking the helper directly | Learns only their own operator/membership boolean | **Introduced API surface**, not a row-data access path; move helpers out of the exposed schema. |

The old global `ironwood_admin_*` routes are gone, so the specific former “profile says operator tenant, therefore read/write every row of every protected table” path is removed.

### 2. Is direct `EXECUTE` safe?

**Functionally, yes; exposure-wise, conditionally.**

The functions are safe *as written* with respect to impersonation because the caller cannot pass a `user_id`; the functions anchor checks to `auth.uid()`. Calling:

```sql
is_tenant_member(any_uuid)
```

reveals only whether the caller is a member of that candidate UUID, not whether any other user is a member.

But direct execution of a `SECURITY DEFINER` function in `public` is still an avoidable public API capability. Supabase recommends placing such functions outside exposed schemas; otherwise a function can be invoked through the Data API with creator privileges. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

Move them to a non-exposed schema and pin `search_path = ''`.

### 3. Is no-policy `operators` correct?

**Yes.** It is a good deny-by-default capability table pattern. The table remains opaque to browser roles, while the narrow function reveals only a boolean authorization result. No security hazard follows from no policies alone; the operational requirement is disciplined ownership, grants, and audited operator provisioning/removal.

### 4. Is `SECURITY DEFINER` required?

**No, not for the stated recursion reason.**

An inline predicate against `tenant_users`:

```sql
EXISTS (
  SELECT 1
  FROM public.tenant_users tu
  WHERE tu.user_id = auth.uid()
    AND tu.tenant_id = target_table.tenant_id
)
```

should be safe from **infinite recursion** if `tenant_users`’ only applicable policy is self-contained:

```sql
auth.uid() = user_id
```

That policy does not query the protected target table or `tenant_users` again, so it does not form a cycle. Recursive-policy failures occur when policies read back into themselves directly or through a chain of protected relations. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

The `SECURITY DEFINER` form is therefore not required for correctness or recursion avoidance in this described design. It is defensible for:

- centralizing current-membership semantics across many policies,
- avoiding dependence on future changes to `tenant_users` RLS,
- possibly improving policy planning/performance,
- keeping membership rows opaque.

But it does hide dependency on function ownership and `BYPASSRLS`. If the function is owned by a Supabase privileged owner such as `postgres`, it can bypass `tenant_users` RLS; that is intentional only because the SQL body is tightly constrained to the caller’s `auth.uid()`. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

For `operators`, a definer function is more compelling because the table intentionally has no client-visible policy at all. Inlining against it would return no rows to authenticated callers unless you added an RLS policy, which would expose the operator relation in a less controlled way.

### 5. Is `tenants` member-SELECT-only right?

**Yes for mutation control; conditional for read exposure.**

Do not give members `FOR ALL` on the table. The SELECT-only design prevents entitlement escalation and lifecycle mutations.

Approve the read policy only after the full column inventory confirms there are no internal billing IDs, payment metadata, secrets, internal notes, or operational fields inappropriate for every tenant member. `entitlement`, `slug`, and deletion flags alone are not inherently disqualifying, but they should be deliberately exposed rather than incidentally returned through `SELECT *`.

### 6. Objection to operator-only `prospects`?

**No.** The column name `tenant_id` does not dictate authorization semantics. The described provisioning-backlink use case makes operator-only appropriate and safer.

### 7. Risk from duplicate role checks?

**Yes, because permissive policies OR together.** The new role check does not restrict surviving legacy policy paths. It is harmless only if every legacy write policy independently contains an equally strict row-bound current role check. Verify exact SQL per operation; do not infer it from policy names or one observed test.

### 8. Other flags

- **Introduced:** direct RPC exposure of `public` `SECURITY DEFINER` helpers; move them to a non-exposed schema.
- **Introduced:** `SET search_path TO 'public'` rather than empty pinned path; harden it.
- **Introduced/intentional:** all-member DML on `tenant_redirects`; confirm that role model is intended.
- **Introduced/intentional:** full `tenants` row visibility to every member; conduct column exposure review.
- **Pre-existing:** `profiles` remains an outdated, scalar authorization source across roughly 70 policies.
- **Pre-existing:** policy unions can become difficult to reason about whenever old and new permissive policies coexist.
- **Pre-existing/verify:** table grants may be broader than intended; grants and RLS need separate auditing.
- **Operational:** add regression tests covering each operation and role, not only successful/failed aggregate counts. In particular, test allowed writes with `RETURNING`; a denied `USING` clause can silently match zero rows. Supabase documents this distinction and recommends explicit per-operation RLS tests. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Approval conditions

1. Move `is_operator()` and `is_tenant_member()` to a non-exposed schema, or prove and continuously test that direct RPC invocation is unavailable to browser clients.
2. Recreate both definer functions with `SET search_path = ''` and schema-qualify all dependencies.
3. Review every column in `public.tenants`; restrict or project columns that are not appropriate for all tenant members.
4. Verify support-ticket/reply `UPDATE` cannot unintentionally mutate tenant-boundary or ownership columns; restrict those columns if operators should not change them.
5. Produce a table-by-table, operation-by-operation audit of all surviving policies on the seven role-gated tables and prove no permissive legacy policy bypasses the `admin`/`manager` requirement.
6. Explicitly decide whether ordinary members may perform all DML on `tenant_redirects`; add the same role gate if not.
7. Add automated RLS regression tests covering `SELECT`, `INSERT`, `UPDATE`, and `DELETE` for: unauthenticated users, published demo users, ordinary tenant members, tenant admin/manager users, multi-tenant users, users with `tenant_users` but no `profiles` row, stale-profile users, and the seeded operator.
<!-- END PERPLEXITY VERBATIM -->

# Appendix B — Gemini verdict (VERBATIM)

Reproduced byte-exact as supplied, same convention as Appendix A.

<!-- BEGIN GEMINI VERBATIM -->
## Verdict

**APPROVE WITH CONDITIONS**

The change successfully closes the primary high-severity vulnerability (the blanket cross-tenant access via the published demo credentials) while restoring correct multi-tenant visibility through `tenant_users`. However, two conditions must be addressed prior to final security sign-off.

---

## Required Conditions for Approval

1. **Fix `search_path` on standard helpers (Introduced Defect):**
`is_operator()` and `is_tenant_member()` specify `SET search_path TO 'public'`. In Postgres `SECURITY DEFINER` functions, referencing unqualified schemas or leaving `pg_catalog` out of the explicit search path permits potential schema-shadowing attacks if untrusted users can create objects in `public`.
* **Required Fix:** Update both functions to explicitly specify `SET search_path TO 'pg_catalog', 'public'`.


2. **Audit legacy `current_tenant_id()` policy overlap on dual-membership users (Introduced Risk):**
Because all policies are `PERMISSIVE` and old policies were left untouched, any user who possesses *both* a stale `profiles.tenant_id` and active `tenant_users` rows gains the logical **UNION** of both authorization sets.
* **Required Fix:** Verify via SQL audit that no active users retain a non-null `profiles.tenant_id` that maps to a tenant they should no longer access under `tenant_users`.



---

## Detailed Analysis & Questions Addressed

### 1. Additive Design & Union of Old/New Policies

* **Verdict:** **Introduced Risk (Low/Medium)**
* **Analysis:** Because Supabase combines `PERMISSIVE` policies with logical `OR`, a user gets access if *either* the surviving legacy policy (`current_tenant_id() = tenant_id`) OR the new policy (`is_tenant_member(tenant_id)`) evaluates to `TRUE`.
* **Broader-than-intended Cases:**
* **Stale Profile Mismatch:** If User A was moved to Tenant Y in `tenant_users` but their legacy `profiles.tenant_id` still points to Tenant X, they now have full access to *both* Tenant X and Tenant Y.
* **Role Escalation via Legacy Path:** If a legacy policy grants `ALL` based on `current_tenant_id()` without checking `get_my_tenant_role()`, but the new member policy requires `admin`/`manager`, the legacy policy will evaluate to `TRUE` and bypass the role restriction for that single legacy tenant.



### 2. Direct Invocation of SECURITY DEFINER Helpers

* **Verdict:** **Introduced Risk (Low / Intended Behavior)**
* **Analysis:**
* **Function Access:** Granting `EXECUTE` on `is_tenant_member(uuid)` to `authenticated` allows an attacker to brute-force or probe UUIDs via PostgREST RPC (`/rest/v1/rpc/is_tenant_member`) to check if their own `auth.uid()` is registered to that `tenant_id`.
* **Impact:** This is a zero-information-leak scenario regarding *other* users. It only answers: *"Am I (the requester) in tenant X?"* Since the user already knows their own identity, probing whether they are in a tenant does not leak third-party membership or sensitive data.
* **`is_operator()` Access:** Calling `is_operator()` simply returns `true` or `false` for the caller's own ID. This exposes no operational metadata or table structures.



### 3. `operators` Table RLS & Access Pattern

* **Verdict:** **Pre-Existing Pattern / Best Practice (No Issue Introduced)**
* **Analysis:** Enabling RLS with zero policies on `public.operators` makes it completely unreadable and unwritable to `authenticated` and `anon` roles via PostgREST. Because `is_operator()` is `SECURITY DEFINER` (executing as the table owner/creator role which bypasses RLS), it can safely read `public.operators`.
* **Operational Note:** Table owners, Postgres superusers, and `service_role` can still manage `operators`. This is the standard, secure pattern for internal security tables in Supabase.

### 4. Necessity of SECURITY DEFINER vs. Inlining

* **Verdict:** **Correct Design (No Issue Introduced)**
* **Analysis:**
* **Recursion Avoidance:** If `is_tenant_member()` were inlined or `SECURITY INVOKER`, evaluating RLS on table `X` would query `tenant_users`. If `tenant_users` itself ever adds policies referencing helper functions or subqueries, infinite RLS recursion occurs (`stack depth limit exceeded`).
* **Definer Leaks:** `SECURITY DEFINER` executes with the owner's privileges. It does not hide anything dangerous here because the query inside is strictly constrained by `WHERE user_id = auth.uid()`. It cannot be manipulated by caller inputs to return arbitrary data.



### 5. `tenants` Member-SELECT-Only Policy

* **Verdict:** **Safe Design (Introduced - Good)**
* **Analysis:** Gating `tenants` to `SELECT` only prevents clients from modifying `entitlement` (billing tier) or soft-deletion flags.
* **Read-Side Risk Evaluation:** Exposing `slug`, `entitlement`, and metadata to authenticated members of that specific tenant is standard for frontend feature gating (e.g., showing/hiding UI components based on tier). It introduces no cross-tenant leakage since `is_tenant_member(id)` restricts rows to tenants the user belongs to.

### 6. `prospects` Gated as Operator-Only

* **Verdict:** **Safe & Correct (Introduced - Good)**
* **Analysis:** `prospects` acts as an internal CRM tracking table. The `tenant_id` column being a sparse provisioning backlink means it is an internal entity relationship, not a tenant-boundary security field. Denying tenant member access completely and restricting it to `is_operator()` avoids competitive data leaks between prospects and paying clients.

### 7. Duplicated Role Checks Across Legacy & New Policies

* **Verdict:** **No Functional Risk / Operational Debt (Pre-Existing / Introduced Interface)**
* **Analysis:** Having two policies check roles via different paths (one via legacy `current_tenant_id()` and one via `is_tenant_member()`) carries no direct security vulnerability; if either passes, access is allowed.
* **Maintenance Risk:** If role permissions diverge in the future (e.g., adding a `'billing_admin'` role to the new policy but forgetting the legacy policy), access behavior will become inconsistent across migrated vs. non-migrated users.

---

## Issues Categorization Matrix

| Issue Description | Source | Severity | Mitigation / Action |
| --- | --- | --- | --- |
| `search_path` missing `pg_catalog` in `SECURITY DEFINER` functions | **INTRODUCED** | **Medium** | Append `'pg_catalog'` to `SET search_path` on both helper functions. |
| Permissive policy union allowing stale `profiles` access | **INTRODUCED** | **Low-Medium** | Run a one-time data sanitization query clearing stale `profiles.tenant_id` entries. |
| Incomplete legacy migration (`profiles` vs `tenant_users`) | **PRE-EXISTING** | **High (Technical Debt)** | Complete the legacy migration and deprecate `current_tenant_id()`. |
| Lack of `RESTRICTIVE` policies for global tenant isolation | **PRE-EXISTING** | **Medium** | Introduce a global `RESTRICTIVE` policy enforcing tenant boundaries across all tables. |
<!-- END GEMINI VERBATIM -->
