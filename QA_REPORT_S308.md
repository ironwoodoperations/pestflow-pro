# QA_REPORT — S308 · Split the accidental operator grant

**Branch:** `claude/support-tickets-rls-policies-xbwg8a`
**Date:** 2026-08-31
**Status:** implementation complete; **validator gate NOT RUN** (Wave 3 blocking)

Every result below was produced against the **live** project
`biezzykcgzkrwdgqpsar` under real RLS. The harness sets `request.jwt.claims`
and `SET LOCAL ROLE authenticated` inside a transaction that is then rolled
back, so `auth.uid()` resolves and policies are genuinely enforced — these are
not predicate evaluations.

---

## 1. Wave 1 — `pg_policies` sweep (verbatim)

### 1a. Literal `profiles` sweep

```sql
SELECT tablename, policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND (coalesce(qual,'') ILIKE '%profiles%' OR coalesce(with_check,'') ILIKE '%profiles%');
```

| tablename | policyname | cmd | roles |
|---|---|---|---|
| ga4_runs | tenant_isolation | ALL | {authenticated} |
| gsc_runs | tenant_isolation | ALL | {authenticated} |
| social_campaigns | social_campaigns_tenant_isolation | ALL | {authenticated} |
| support_tickets | tenant_insert_own_tickets | INSERT | {public} |
| support_tickets | tenant_read_own_tickets | SELECT | {public} |

### 1b. The sweep above is INCOMPLETE — and that is the headline finding

`tenants` carried a policy reading `current_tenant_id()`, which is:

```sql
CREATE FUNCTION public.current_tenant_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog','public'
AS $$ select tenant_id from public.profiles where id = auth.uid() $$;
```

**`current_tenant_id()` reads `profiles`.** It is the membership source for
~70 policies across ~25 tables, none of which contain the string `profiles`.
A text sweep of `pg_policies` cannot find them. `get_my_tenant_role()` *was*
migrated to `tenant_users` in S273; `current_tenant_id()` was not — so every
one of those policies is half-migrated: role check on SSOT, tenant selection
stale.

Per the brief, `current_tenant_id()` is **not** modified here. It returns a
scalar `uuid` and cannot express membership in five tenants; repointing it is a
separate design session.

### 1c. Additivity precondition

```sql
SELECT count(*) FROM pg_policies WHERE schemaname='public' AND permissive='RESTRICTIVE';
-- 0
```

Zero RESTRICTIVE policies in the entire schema, before and after. Permissive
policies OR together, so the new member/operator policies are purely additive
against the untouched `current_tenant_id()` policies.

---

## 2. Classification of the 13 (verified, not assumed)

All 13 were byte-identical: `PERMISSIVE / ALL / {authenticated} /
USING = WITH CHECK = (current_tenant_id() = '9215b06b…'::uuid)`.

| table | `tenant_id`? | group | member policy added |
|---|---|---|---|
| settings | yes | (a) | select + role-gated write (**S308b**, see §3c) |
| page_content | yes | (a) | select + role-gated write |
| blog_posts | yes | (a) | select + role-gated write |
| seo_meta | yes | (a) | select + role-gated write |
| service_areas | yes | (a) | select + role-gated write |
| team_members | yes | (a) | select + role-gated write |
| testimonials | yes | (a) | select + role-gated write |
| tenant_redirects | yes | (a) | `tenant_redirects_member_all` (no role gate today) |
| youpest_layout | yes | (a) | **none — see DEVIATION 2** |
| tenants | no (`id`) | (a) via `id` | **SELECT only — see DEVIATION 1** |
| prospects | **yes** | **(b)** per decision B | none |
| salespeople | no | (b) | none |
| ironwood_integrations | no | (b) | none |

**Role-array verification (decision C).** All 18 role gates across the six
role-gated tables use exactly `ARRAY['admin'::text, 'manager'::text]`. **None
differ.** The member write policies mirror that array verbatim.

**Naming exception.** `tenant_redirects`' policy was
`ironwood_admin_redirects_write`, not `ironwood_admin_tenant_redirects_write`.
Captured correctly in both the migration and the rollback.

---

## 3. Two deviations from the brief

Both apply the principle decision C established — *things currently DENIED must
not become GRANTED* — to cases the brief's table list did not cover. Both are
strictly more conservative than briefed, and each is one `CREATE POLICY` to
widen later if you disagree.

### DEVIATION 1 — `tenants` gets member **SELECT only**, not member ALL

The brief listed `tenants` among the three "no role gate today → plain
`is_tenant_member` ALL" tables. But authenticated users have **only SELECT** on
`tenants` today (`tenant_isolation_tenants_auth`); there is no member write
path at all except the blanket grant being removed.

`tenants` carries **`entitlement smallint`** — the billing gate S305 made
authoritative — plus `slug`, `is_protected`, `deletion_confirmed`,
`deletion_final_confirmed`. Member ALL would let any tenant admin raise their
own entitlement, rename their slug, or delete their tenant row.

Proven: Kirk's UPDATE against his **own** `tenants` row returns **0 rows**.

### DEVIATION 2 — `youpest_layout` gets **no** member policy

Omitted from the brief's classification. It is tenant-scoped but has no member
write path today — its only authenticated-reachable policy is
`tenant_read_own_layout` (SELECT), which already reads `tenant_users` and is
left in place. Member ALL would have granted INSERT/UPDATE/DELETE that are
denied today. Operator-only write preserves current behaviour exactly. The
table has **zero reads anywhere in `src/`**.

### 3c. S308b — `settings` role-gated (Scott's follow-up decision)

Applied as a separate migration rather than an edit to the already-stamped
S308 file. `settings_member_all` dropped; replaced by `settings_member_select`
(plain membership) + `settings_member_write` (membership AND
`get_my_tenant_role(...) = ANY (ARRAY['admin','manager'])`), the same split as
the six role-gated tables, with the array copied verbatim.

`tenant_isolation_settings_auth` is **untouched**, so the new SSOT-sourced path
is deliberately *stricter* than the legacy `current_tenant_id()` path rather
than relaxing it. Nothing legitimate breaks: `user` is the only role below
admin/manager, and exactly **one** such row exists in `tenant_users`
(`scottdevore2@gmail.com @ dang`) — verified, not assumed.

---

## 4. Before → after access matrix (live, real RLS)

`dang` = `1611b16f…` (paying client) · `coastal-pest` = `a3e8b1c4…` ·
`pls` = `840b6ad1…` · `pestflow-pro` = `9215b06b…`

### 4a. Reads

| user | probe | before | after | verdict |
|---|---|---|---|---|
| **admin@demo.com** | dang settings | **16** | **0** | escalation closed |
| | dang page_content | **22** | **0** | closed |
| | dang blog_posts | **29** | **0** | closed |
| | dang testimonials | **55** | **0** | closed |
| | coastal settings | 13 | 13 | demo preserved |
| | coastal page_content | 19 | 19 | demo preserved |
| | apex service_areas | 5 | 5 | demo preserved |
| | tenants visible | **9 (all)** | 6 | 5 demos + pfp |
| | prospects | **6 (all)** | **0** | sales CRM closed |
| | `is_operator()` | n/a | **false** | required |
| **admin@pestflowpro.com** | dang settings | **16** | **0** | closed |
| | dang testimonials | **55** | **0** | closed |
| | own pfp settings | 13 | 13 | retained |
| | tenants visible | **9 (all)** | **1** | own only |
| | prospects / salespeople | 6 / 3 | **0 / 0** | closed |
| | `is_operator()` | n/a | **false** | required |
| **scott@homeflowpro.ai** | `is_operator()` | n/a | **true** | required |
| | support_tickets | 0 | **5** | 1 → 5, see 4c |
| | tenants | 0 | 9 | operator |
| | dang settings | 0 | 16 | operator |
| | prospects / salespeople | 0 / 0 | 6 / 3 | operator |
| **Kirk** admin@dangpestcontrol.com | dang settings | 16 | 16 | no loss |
| | dang page_content | 22 | 22 | no loss |
| | dang blog_posts | 29 | 29 | no loss |
| | dang testimonials | 55 | 55 | no loss |
| | dang service_areas | 18 | 18 | no loss |
| | coastal settings | 0 | **0** | isolated |
| | tenants visible | 1 | 1 | no change |
| | prospects | 0 | **0** | isolated |
| | support_tickets | 4 | 4 | no loss |
| **Dathan** precisionlawnsystems@yahoo.com (no `profiles` row) | pls settings | **0** | **12** | onboarding path fixed |
| | pls page_content | **0** | **7** | fixed |
| | pls testimonials | **0** | **54** | fixed |
| | pls service_areas | **0** | **5** | fixed |
| | dang settings | 0 | **0** | isolated |
| **scottdevore2@gmail.com** (role `user`) | dang blog_posts | 0 | 29 | SELECT via membership |
| | dang testimonials | 0 | 55 | SELECT via membership |
| | support_tickets | 0 | 4 | can now see dang's |

`heartland_testimonials` reads 0 for admin@demo.com both before and after
because heartland has **0 testimonial rows** — verified directly, not a policy
failure.

### 4b. Writes — the decision-C regression test (blocking)

`UPDATE … SET tenant_id = tenant_id` against `dang`, rows affected:

| user | blog | page | seo | areas | team | testim | settings | tenants row |
|---|---|---|---|---|---|---|---|---|
| **scottdevore2** (role `user`) | **0** | **0** | **0** | **0** | **0** | **0** | **0** † | — |
| **Kirk** (role `admin`) | 29 | — | — | — | — | 55 | 16 | **0** ‡ |
| **admin@demo.com** | — | — | — | — | — | **0** | **0** | — |
| admin@demo.com → *coastal* | — | 19 | — | — | — | — | 13 | — |

**† Closed by S308b.** `settings` had **no role gate** — `tenant_isolation_settings_auth` is plain `ALL` for any member — so S308 initially mirrored that shape and `scottdevore2` gained write on `dang.settings` (16 rows), which holds `business_info`, `branding`, `subscription` and `integrations` (Facebook / Google Business tokens). Scott's follow-up decision role-gates it. Re-proven after S308b:

| user | role on dang | settings SELECT | settings UPDATE |
|---|---|---|---|
| scottdevore2@gmail.com | `user` | 16 | **0** |
| Kirk admin@dangpestcontrol.com | `admin` | 16 | **16** |
| admin@demo.com → coastal-pest | `admin` | 13 | **13** |
| admin@demo.com → dang | none | 0 | **0** |

**Read access is a separate question and is NOT closed.** `settings_member_select` is plain membership, matching the six other tables, so `scottdevore2` can still *read* `dang`'s `integrations` row — verified, 1 row readable — and could not read it at all before S308. For ordinary settings that is the intended repair; for stored OAuth tokens, read is nearly as sensitive as write. Two narrow options if you want it closed: exclude `key = 'integrations'` from `settings_member_select`, or role-gate SELECT too. Flagged, not decided — you specified the write split explicitly and this matches it.

**‡ DEVIATION 1 working:** Kirk cannot touch his own `tenants` row → no
self-service entitlement escalation.

### 4c. Support tickets

| check | before | after |
|---|---|---|
| operator sees tickets | 1 (of 5) | **5** |
| …**with tenant names populated** | n/a | **5 / 5** |
| operator UPDATE status (`SupportPanel.tsx:57`) | **silent no-op, 0 rows** | **1 row** |
| admin@demo.com INSERT ticket for **coastal** (own) | silently rejected | **1 row inserted** |
| admin@demo.com INSERT ticket for **dang** (cross-tenant) | — | **denied, `42501`** |

Cross-tenant denial, verbatim:

```
ERROR:  42501: new row violates row-level security policy for table "support_tickets"
```

The `tenants(name, slug)` embed resolves for the operator because
`tenants_operator_all` grants the join — this is what makes SupportPanel show
tenant names rather than nulls.

---

## 5. Post-change invariants

| invariant | required | actual |
|---|---|---|
| `ironwood_admin_*` policies remaining | 0 | **0** |
| RESTRICTIVE policies in schema | 0 | **0** |
| rows in `operators` | 1 at S308 | **2 as of 17:13Z** — see §10 |
| RLS policies **on** `operators` | 0 | **0** (definer-only reachability) |
| `*_operator_all` policies | 13 | **13** |
| `is_operator()` SECURITY DEFINER | true | **true** |
| `is_operator()` / `is_tenant_member()` search_path | empty (B1) | **`{search_path=""}`** both |
| `settings_member_all` remaining (post-S308b) | 0 | **0** |
| `settings` role gate matches the six | yes | **`ARRAY['admin','manager']`** |

---

## 6. CI

| check | result |
|---|---|
| `tsc --noEmit` | **pass** (rc 0) |
| `eslint src --max-warnings 200` | **pass** — 0 errors, 178 warnings |
| `npm run build` | **pass** (rc 0) |
| `vitest run` | **pass** — 42 files, 1164 tests |
| BL canary `-- src/shells app` | **EMPTY** ✓ |

The canary initially showed three files; that was a **stale local
`origin/main` ref**, not this branch. After `git fetch origin main` the branch
contains exactly one prior commit and the canary is empty.

---

## 7. What I could NOT verify from CC Web — Scott must run these

1. **The five-demo browser render (the acceptance criterion).** The egress
   proxy denies `*.pestflowpro.ai` and `biezzykcgzkrwdgqpsar.supabase.co`
   (`connect_rejected`, 403 CONNECT). I could not load a dashboard. The
   underlying reads are proven above at the RLS layer for coastal-pest,
   apex-protect and the tenants list, but **the rendered pages are unverified.**
   Check all five: heartland-pest, coastal-pest, apex-protect, urban-strike,
   metro-pest-concierge — settings, page content, testimonials, service areas.
2. **End-to-end ticket file + email.** The RLS insert is proven (4c), and
   `notify-support-ticket` v44 is deployed, but I could not invoke the function
   over HTTPS, so **delivery to support@homeflowpro.ai is unverified.**
3. **Validator gate** — Perplexity + Gemini. Not reachable from CC Web.

---

## 8. Out of scope, confirmed unchanged

- `current_tenant_id()` — untouched.
- `profiles` — not dropped, altered, or backfilled.
- `service_role_all_replies` — unchanged.
- `supabase/functions/_shared/auth/` — **unmodified** (`git diff --quiet` clean).
  It was included verbatim in the edge-function deploy bundle because
  `index.ts` imports it; the file itself was not edited.
- **`prospects` onboarding upsert still fails**, exactly as before this PR.
  `src/pages/admin/Onboarding.tsx:160-165` already logs rather than throws, and
  its comment documents the deferral. **This is not a regression from S308** —
  decision B kept `prospects` operator-only deliberately. Recorded here so a
  future reader does not misattribute it.

---

## 9. Report-only finding (per decision A)

`src/pages/marketing/sections/MarketingCRM.tsx:92` links "Try the live
dashboard" to `https://demo.pestflowpro.ai/admin`.

```sql
SELECT count(*) FROM tenants WHERE slug='demo';           -- 0
SELECT string_agg(slug,', ') FROM tenants WHERE slug ILIKE '%demo%';  -- NULL
```

**There is no tenant with slug `demo`, and none resembling it.** Confirmed dead
CTA, same class as the one fixed in S307. Not fixed here, as instructed.

### Related — now resolved

`DomainSection` (`SettingsTab.tsx:32`) renders only when
`tenant.slug === 'pestflow-pro'` and writes `tenants.custom_domain` /
`subdomain`, which now requires `is_operator()`. When this report was first
written, `scott@homeflowpro.ai` had no `tenant_users` row for `pestflow-pro`,
so the sole operator could not reach that UI and the Domain tab's save was
unreachable by anyone.

**Re-checked at S308b time: `scott@homeflowpro.ai` now holds
`pestflow-pro:admin` in `tenant_users`** (alongside `vita-glow:admin`). The
operator can therefore reach the pestflow-pro admin and the Domain tab save
works. No action needed; recorded because the earlier version of this report
said otherwise.

---

# 10. Validator-gate work (post-approval)

Both models returned APPROVE WITH CONDITIONS. Disposition of every condition is
in `REVIEW_S308_OPERATOR_MEMBERSHIP_SPLIT.md`. This section carries the evidence.

## 10.1 A second operators row appeared during the session — NOT mine

```sql
SELECT o.user_id, u.email, o.note, o.created_at
FROM public.operators o JOIN auth.users u ON u.id = o.user_id ORDER BY o.created_at;
```

| email | note | created_at |
|---|---|---|
| scott@homeflowpro.ai | scott@homeflowpro.ai — sole Ironwood operator (S308) | 2026-08-31 15:35:28Z |
| **admin@pestflowpro.com** | **TEMPORARY — S308 verification. Remove once scott@homeflowpro.ai can reach /ironwood.** | **2026-08-31 17:13:05Z** |

Added by Scott, deliberately, after S308 was applied. **Not touched.** It
supersedes the S308 invariant "operators has exactly one row", which is why that
row of §5 is corrected rather than left standing.

**This is a live exposure while it lasts.** `admin@pestflowpro.com / pf123demo`
is published on the marketing homepage (`MarketingCRM.tsx:93`), and that account
now satisfies `is_operator()` — blanket read+write on all 13 tables across every
tenant, which is precisely the hole S308 closed. Confirmed live: it reads
`dang`'s settings (16 rows), all 9 tenants, all 6 prospects.

**The removal precondition is met in this branch but NOT in production.** S308c
adds `scott@homeflowpro.ai` to both client allowlists, so the note's condition —
"once scott@homeflowpro.ai can reach /ironwood" — becomes true only once PR #310
is merged **and deployed**. Sequencing:

1. Merge and deploy PR #310.
2. Confirm `scott@homeflowpro.ai` can sign in at `/ironwood` and the console loads.
3. `DELETE FROM public.operators WHERE user_id = '5181b30a-265f-4a70-a323-bf6e3c53641b';`
4. Re-verify `is_operator()` is false for `admin@pestflowpro.com`.

Until step 3, the published demo credential is an Ironwood operator.

## 10.2 B1 — definer hardening, before/after

Applied `SET search_path = ''` with full qualification and the `auth.uid()`
scalar subselect. Post-change function definitions confirmed from `pg_proc`;
`proconfig` reads `{search_path=""}` for both.

Behaviour-neutral: the seven-user matrix was captured post-B1 and every value
matched the pre-B1 baseline in §4.

## 10.3 B2 — the revoke test (cheap fix DISPROVEN)

```
REVOKE EXECUTE ON FUNCTION public.is_operator() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM authenticated;
```

Every subsequent query against a table carrying these policies:

```
ERROR:  42501: permission denied for function is_operator
```

RLS predicates evaluate as the querying role, so that role must hold EXECUTE on
functions the predicate calls. Grants restored immediately.

**Post-restore verification — every value matches the pre-revoke baseline:**

| user | probe | baseline | after restore |
|---|---|---|---|
| admin@demo.com | coastal settings SELECT / UPDATE | 13 / 13 | **13 / 13** |
| | coastal page_content | 19 | **19** |
| | dang settings SELECT / UPDATE | 0 / 0 | **0 / 0** |
| | tenants / prospects / tickets | 6 / 0 / 1 | **6 / 0 / 1** |
| scottdevore2 | dang settings / blog SELECT | 16 / 29 | **16 / 29** |
| | dang settings / blog UPDATE | 0 / 0 | **0 / 0** |
| Kirk | dang settings SELECT / UPDATE | 16 / 16 | **16 / 16** |
| | dang blog UPDATE | 29 | **29** |

Also found: `anon` holds EXECUTE too (Supabase default privileges grant it at
creation; `REVOKE ALL … FROM PUBLIC` does not remove a role-specific grant). Not
changed — only an `authenticated` revoke test was authorised. Impact is nil for
`anon`: `auth.uid()` is NULL, so both helpers return false.

## 10.4 B3 — full policy enumeration (VERBATIM)

Query used:

```sql
SELECT tablename, cmd, policyname, permissive, roles::text,
       coalesce(qual,'—') AS using_expr, coalesce(with_check,'—') AS check_expr
FROM pg_policies
WHERE schemaname='public' AND tablename IN (...)
  AND ('authenticated' = ANY(roles) OR 'public' = ANY(roles))
ORDER BY tablename, cmd, policyname;
```

Shorthand below: `T` = `tenant_id = current_tenant_id()`,
`R` = `get_my_tenant_role(tenant_id) = ANY (ARRAY['admin'::text, 'manager'::text])`,
`M` = `is_tenant_member(tenant_id)`, `O` = `is_operator()`. All PERMISSIVE, all
`{authenticated}`.

### The six that PASS

Identical shape on `blog_posts`, `page_content`, `seo_meta`, `service_areas`,
`team_members`, `testimonials` (`testimonials` has no separate INSERT row in the
listing; its writes are covered by `_insert`/`_update`/`_delete` and the two ALL
policies exactly as the others):

| cmd | policy | USING | WITH CHECK | write-capable? | gated? |
|---|---|---|---|---|---|
| SELECT | `<t>_member_select` | `M` | — | no | n/a |
| SELECT | `<t>_select` | `T` | — | no | n/a |
| INSERT | `<t>_insert` | — | `T AND R` | **yes** | ✅ tenant + role |
| UPDATE | `<t>_update` | `T AND R` | `T AND R` | **yes** | ✅ tenant + role |
| DELETE | `<t>_delete` | `T AND R` | — | **yes** | ✅ tenant + role |
| ALL | `<t>_member_write` | `M AND R` | `M AND R` | **yes** | ✅ tenant + role |
| ALL | `<t>_operator_all` | `O` | `O` | **yes** | operator-only, by design |

**Every member write path on these six requires both a tenant match and the
admin/manager role test.** Condition 5 satisfied here.

### The two that FAIL

**`settings`**

| cmd | policy | USING | WITH CHECK | gated? |
|---|---|---|---|---|
| SELECT | `settings_member_select` | `M` | — | n/a |
| ALL | `settings_member_write` | `M AND R` | `M AND R` | ✅ |
| ALL | `settings_operator_all` | `O` | `O` | operator |
| **ALL** | **`tenant_isolation_settings_auth`** | **`T`** | **`T`** | ❌ **NO ROLE TEST** |

**`tenant_redirects`** (after D1)

| cmd | policy | USING | WITH CHECK | gated? |
|---|---|---|---|---|
| SELECT | `tenant_redirects_member_select` | `M` | — | n/a |
| SELECT | `tenant_isolation_redirects_read` | `T` | — | n/a |
| ALL | `tenant_redirects_member_write` | `M AND R` | `M AND R` | ✅ |
| ALL | `tenant_redirects_operator_all` | `O` | `O` | operator |
| **ALL** | **`tenant_isolation_redirects_write`** | **`T`** | **`T`** | ❌ **NO ROLE TEST** |

**Conclusion: the role gate on these two tables is bypassable.** Permissive
policies OR together, so a user whose `profiles.tenant_id` matches gets the write
from the legacy policy regardless of role. Not exploitable by any account that
exists today only because the sole `user`-role member has no `profiles` row.
**Reported, not fixed** — narrowing those policies changes semantics for existing
users. Per the B3 instruction, work stopped here.

## 10.5 B5 — ticket tenant lock, proven both ways

Cross-tenant move, as the operator:

```
ERROR:  23514: support_tickets.tenant_id is immutable
        (attempted 1611b16f-381b-4d4f-ba3a-fbde56ad425b -> 9215b06b-3eb5-49a1-a16e-7ff214bf6783)
CONTEXT:  PL/pgSQL function public.support_tickets_lock_tenant() line 4 at RAISE
```

Legitimate status change, same operator, same ticket: **1 row updated.** The lock
blocks reassignment without touching the operator workflow.

## 10.6 D1 — `tenant_redirects` role gate

`tenant_redirects_member_all` dropped; `_member_select` + `_member_write` created
with the array copied verbatim. Confirmed in `pg_policies`.

**Proof is structural, not data-driven, and that limit is stated deliberately:**
`tenant_redirects` holds 1 row total and **0 rows for `dang`**, so a
`scottdevore2` write probe would return 0 whether or not the gate works. The
guarantee rests on the policy text above, not on a probe.

## 10.7 End-to-end ticket test — partially confirmed

A real ticket landed from the live app at **2026-08-31 17:25:43Z**,
`tenant_id = coastal-pest`, subject "asfsaf" — filed by Scott, not by this
session. **The insert path is confirmed working end to end through the browser**,
which is the half of the acceptance test the RLS change owns.

**Email delivery remains unverified from here** — the egress proxy blocks the
Supabase functions host, so `notify-support-ticket` could not be invoked or
observed. Scott confirms delivery to support@homeflowpro.ai.
