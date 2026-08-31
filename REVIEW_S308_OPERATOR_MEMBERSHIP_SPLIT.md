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
> **The verbatim verdict texts were not supplied to this session.** Appendices A
> and B are placeholders. They must be filled with the real model output before
> this doc is a complete record — see the note in each appendix. Nothing in this
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
Appendix B (Gemini) — **not yet supplied, see the placeholders**.

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

> ⚠️ **NOT SUPPLIED.** The instruction was to append this byte-exact, but no
> Perplexity output was provided to the session that wrote this document. The
> text below is a placeholder, **not** the model's words. Nothing here is
> paraphrased or reconstructed from the conditions summary — doing so would put
> invented text in a security record.
>
> **To complete:** replace everything between the fences with the raw Perplexity
> output, unedited.

```
[PASTE PERPLEXITY VERDICT VERBATIM — NOT YET SUPPLIED]
```

Conditions attributed to Perplexity in the arbitration brief, for cross-checking
once the real text lands:
- Condition 1 — add `'pg_catalog'` to the definer search_path (superseded by
  Gemini's stricter `search_path = ''` under conservative-wins; see B1).
- Condition 2 — stale-profiles union audit (see B4).
- Also noted as pre-existing and non-blocking: `current_tenant_id()` on
  `profiles`; a global RESTRICTIVE tenant-isolation policy (ROADMAP #14).

# Appendix B — Gemini verdict (VERBATIM)

> ⚠️ **NOT SUPPLIED.** Same as Appendix A — no Gemini output was provided to
> this session. Placeholder only.
>
> **To complete:** replace everything between the fences with the raw Gemini
> output, unedited.

```
[PASTE GEMINI VERDICT VERBATIM — NOT YET SUPPLIED]
```

Conditions attributed to Gemini in the arbitration brief, for cross-checking
once the real text lands:
- Condition 1 — RPC exposure of `is_tenant_member()`; move to a non-exposed
  schema (see B2 — cheap fix tested and disproven; ROADMAP #12).
- Condition 3 — `tenants` column inventory (see D2).
- Condition 4 — support-ticket UPDATE boundary (see B5 — fixed).
- Condition 5 — the permissive OR-union cannot be assumed to enforce role
  gating (see B3 — **fails on two tables**).
- Condition 6 — role-gate `tenant_redirects` (see D1 — done).
- Condition 7 — RLS regression test suite (ROADMAP #13).
- Correction — `SECURITY DEFINER` was not required for recursion avoidance
  (recorded above; implementation unchanged).
- Also: `SET search_path = ''` with full qualification (see B1).
