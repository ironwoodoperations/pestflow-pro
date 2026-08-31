# S308 — the operator grant was never an operator check

**Session:** S308 (+ S308b, S308c, S308d, S308e)
**Branch:** `claude/support-tickets-rls-policies-xbwg8a` · PR #310
**Date:** 2026-08-31
**State:** validator gate **PASSED** (both models APPROVE WITH CONDITIONS), CI green,
**NOT merged** — Scott merges.

---

## What shipped

### The bug

13 policies named `ironwood_admin_*` were each `FOR ALL TO authenticated USING
(current_tenant_id() = '9215b06b…'::uuid)`. Two independent faults:

1. **Wrong identity source.** `current_tenant_id()` reads `profiles`, the pre-S273
   membership table. `get_my_tenant_role()` was migrated to `tenant_users` in S273;
   `current_tenant_id()` was not.
2. **The grant was unscoped.** The expression never references the row's `tenant_id`
   — it is a blanket grant over the whole table, not "your tenant's rows".

`admin@demo.com` shares `profiles.tenant_id` with `admin@pestflowpro.com`, so the
database classified the shared demo account — credentials published on
`/demos/admin` — as Ironwood staff.

**Measured live before the change:** `admin@demo.com` could read *and write* every
row of `dang`'s settings (16), page_content (22), blog_posts (29), testimonials (55)
— a paying client — plus all 9 tenants and all 6 prospects. **After: 0.**

### The fix

Each blanket grant became `USING (public.is_operator())`, plus membership policies
reading `tenant_users`. All new policies are permissive and the legacy
`current_tenant_id()` policies are untouched, so nothing that worked lost access.
`operators` has RLS on and **no policies** — reachable only through the definer
helper. Both models independently endorsed that pattern.

Support tickets were the same root cause: SELECT/INSERT moved onto `tenant_users`, a
**first-ever UPDATE policy** added, and all scoped `TO authenticated` rather than
`{public}`.

---

## Verified live state

| fact | value |
|---|---|
| `ironwood_admin_*` policies remaining | **0** |
| `*_operator_all` policies | **13** |
| RESTRICTIVE policies in schema | **0** (unchanged; see follow-up 14) |
| RLS policies on `operators` | **0** — definer-only reachability |
| `is_operator()` / `is_tenant_member()` | SECURITY DEFINER, `search_path = ''`, fully qualified |
| `support_tickets` UPDATE policy | exists (there was none), operator-only |
| `support_tickets.tenant_id` | immutable — trigger, proven both ways |
| `notify-support-ticket` | **v44 deployed**, `verify_jwt:false` passed explicitly |
| CI on head | ci / Validate / Auth isolation / Vercel all **green** |

**Access, before → after:** `admin@demo.com` on `dang` 16/22/29/55 → **0**; its five
demo tenants unchanged (coastal 13 settings / 19 page_content, apex 5 service_areas).
Kirk unchanged on all five tables — **no losses**. Dathan, who has **no `profiles`
row**, went 0 → 12/7/54/5 on pls: the onboarding path for Grandview now works.
Operator sees **5 tickets, up from 1, with tenant names populated**.

**End-to-end ticket file confirmed** — a real ticket landed from the live app at
17:25:43Z on coastal-pest. Email delivery unverified from CC Web (proxy blocks the
functions host).

---

## Judgement calls, so the next session does not relitigate them

- **`tenants` gets member SELECT only, not ALL.** It carries `entitlement` — the S305
  billing gate — plus `slug`, `is_protected` and the deletion flags. Member ALL would
  have allowed self-service entitlement escalation. Proven: Kirk's UPDATE on his own
  tenant row returns 0 rows. Both models agreed this was right.
- **`youpest_layout` gets no member policy.** No member write path existed; adding one
  would grant what is denied today.
- **`prospects` is operator-only** despite having a `tenant_id` column (6 rows, 1
  populated). It is the sales CRM. `Onboarding.tsx:160-165` already documented this as
  a deferred tenant-isolation decision; the member policy would have silently made it.
  The onboarding upsert **still fails exactly as before** — logged, not thrown. That is
  not a regression from this PR.
- **`SECURITY DEFINER` was NOT required for recursion avoidance.** The S308 brief said
  it was; Gemini corrected it and the correction is recorded in the REVIEW doc.
  `tenant_users`' policy is self-contained, so an inline subquery could not recurse.
  The pattern is still right for centralising semantics and keeping `operators` opaque
  — but do not repeat the wrong justification. Implementation unchanged.

---

## Two traps worth remembering

**A rollback file with a timestamp prefix is a loaded gun.** The S308 rollback was
first named `20260831170000_s308_..._rollback.sql` — the same 14-digit version as the
migration it reverts, sorting immediately after it. A fresh `supabase db push` would
have applied the change and then undone it, silently reinstating the escalation. CI
could not catch it: the auth-isolation job replaces the migration set with a fixture.
Convention is now explicit — rollbacks are **not** timestamp-prefixed
(`s281_business_info_vertical_check_rollback.sql` had it right).

**"One line" was two.** S308c added `scott@homeflowpro.ai` to the Ironwood allowlist.
There are **two copies of that array** — `IronwoodLogin.tsx:5` and
`IronwoodOps.tsx:44` — and `IronwoodOps` redirects anyone outside its own copy back to
the login page. Patching only the login would have produced an infinite bounce with
the change looking applied.

---

## Open / pending (carried to next)

Full list with detail is in **`docs/ROADMAP.md` → Open Follow-ups → S308**. The two
that are time-sensitive:

1. **REMOVE THE TEMPORARY OPERATOR ROW immediately after deploy.**
   `admin@pestflowpro.com` was added to `operators` at 17:13Z for verification. Its
   credentials are **published on the marketing homepage**, so until it is removed a
   public credential is a full Ironwood operator — the same shape as the bug this
   session closed. S308c satisfies the removal precondition in the branch; it is true
   in production only after #310 merges and deploys.
2. **`settings` and `tenant_redirects` role gates are bypassable.** Their legacy
   `tenant_isolation_*` policies are `FOR ALL` with no role test, and permissive
   policies OR together. Not exploitable by any account that exists today only because
   the one `user`-role member has no `profiles` row. Reported, not fixed — narrowing
   them changes semantics for existing users.

Then: `settings` READ still exposes `integrations` tokens to any member; three
sources of operator truth; `current_tenant_id()` still on `profiles` across ~25
tables; one stale `profiles` row (`admin@demo.com`); the RPC schema move (cheap fix
tested and disproven); an RLS regression suite; a global RESTRICTIVE backstop.

---

## Still unverified from CC Web

- **The five-demo browser render** — the acceptance criterion. The egress proxy denies
  `*.pestflowpro.ai`. RLS-layer reads are proven for coastal-pest and apex-protect;
  the rendered pages are not.
- **`notify-support-ticket` email delivery** to support@homeflowpro.ai.
- **Both validator verdicts are placeholders** in `REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md`
  Appendices A and B — the verbatim texts were never supplied to the session. They
  must be pasted in before that document is a complete record.
