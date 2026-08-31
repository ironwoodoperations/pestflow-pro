# REVIEW — S308 · Split the accidental operator grant

**Branch:** `claude/support-tickets-rls-policies-xbwg8a`
**Date:** 2026-08-31

> # ⛔ DO NOT MERGE — VALIDATOR GATE **NOT RUN**
>
> This change rewrites RLS on every admin surface plus the five live demo
> dashboards. The Wave 3 gate (Perplexity + Gemini, conservative-wins) is
> **blocking and has not been run.** Neither model is reachable from Claude
> Code Web. **Scott runs the gate and pastes both verdicts verbatim below
> before this merges.**

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

### Perplexity — PENDING

```
(paste verbatim)
```

### Gemini — PENDING

```
(paste verbatim)
```

**Resolution rule:** conservative-wins. If either model flags a widening, take
the narrower reading.

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

**Rollback staged in the same commit:**
`20260831170000_s308_operator_membership_split_rollback.sql` — restores all 13
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

1. **`settings` has no role gate**, so `scottdevore2@gmail.com` (role `user` on
   `dang`) gains full write on the paying client's settings, including the
   `integrations` tokens. Implemented as briefed; flagging because it is the
   one place where the change grants something denied today. One policy swap to
   role-gate it.
2. **The Domain tab's save is now unreachable through the browser** — the sole
   operator has no `pestflow-pro` membership, and `admin@pestflowpro.com` is no
   longer an operator. See QA report §9.
3. **`https://demo.pestflowpro.ai/admin` is a dead CTA** — no tenant has slug
   `demo`. Report-only, as instructed.
4. **`current_tenant_id()` is still on `profiles`** for ~70 policies across ~25
   tables. Out of scope here; wants its own session.
