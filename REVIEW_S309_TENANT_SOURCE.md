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

# Appendix A — Perplexity verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** Placeholder. Replace everything between the fences with
> the raw Perplexity output, unedited. Nothing here is paraphrased or reconstructed.

```
[PASTE PERPLEXITY VERDICT VERBATIM — NOT YET SUPPLIED]
```

# Appendix B — Gemini verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** Placeholder, same convention as Appendix A.

```
[PASTE GEMINI VERDICT VERBATIM — NOT YET SUPPLIED]
```
