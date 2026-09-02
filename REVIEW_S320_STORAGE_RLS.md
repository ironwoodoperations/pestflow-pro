# S320 — storage.objects RLS. Validator gate submission.

**Status: SUBMITTED. Awaiting both verdicts.**

⚠️ **The verdict TEXTS are not yet supplied.** Appendices A and B stay placeholders
rather than be reconstructed from a summary — the S309 and S313 precedent. A
reconstruction is indistinguishable from a transcript to a later reader, which is the
entire value of a slot labelled VERBATIM.

---

## What is being changed

Twelve policies on `storage.objects`, across four buckets. No schema change, no data
change, no application code change. The migration is **not applied**; it is applied after
merge and then verified against `pg_policy`.

### Change 1 — a literal UUID is removed from three policies

`logos_insert_tenant_or_operator`, `logos_update_tenant_or_operator` and
`logos_delete_tenant_or_operator` each contain, verbatim from `pg_get_expr`:

```
((bucket_id = 'logos'::text) AND (((storage.foldername(name))[1] = (current_tenant_id())::text)
 OR (auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid)))
```

That UUID is the account `admin@pestflowpro.com`. Its password is published on the
product's own marketing homepage as a demo login. A prior change (S308) deleted that
account's row from `public.operators` as a security fix; these three policies were not
updated, so the account retains INSERT, UPDATE and DELETE on every tenant's logo.

It is replaced with `public.is_operator()` — `SECURITY DEFINER`, `search_path = ''`,
defined as `EXISTS (SELECT 1 FROM public.operators o WHERE o.user_id = (SELECT auth.uid()))`.

### Change 2 — the tenant predicate no longer reads `profiles`

Nine further policies gate on `(storage.foldername(name))[1] = current_tenant_id()::text`.
`current_tenant_id()` is `select tenant_id from public.profiles where id = auth.uid()`.

Accounts created after the project stopped requiring a `profiles` row have none, so the
function returns NULL, the comparison is NULL, and the policy denies. Two live accounts
are in this state and cannot upload to tenants they administer.

The replacement predicate, matching `reports_admin_read` which already exists on this
same table:

```sql
EXISTS (SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role = 'admin')      -- role clause on WRITES only; see below
```

## Facts established against the live database, 2026-09-02

Read from the catalog, not from migration files.

| Function | SECURITY DEFINER | search_path | EXECUTE granted to |
|---|---|---|---|
| `is_operator()` | yes | `''` | postgres, **anon**, **authenticated**, service_role |
| `is_tenant_member(uuid)` | yes | `''` | postgres, **anon**, **authenticated**, service_role |
| `current_tenant_id()` | yes | `pg_catalog, public` | postgres, anon, **authenticated**, service_role |

`public.tenant_users`: RLS enabled, not forced. `authenticated` holds SELECT.
One policy, applying to all roles: `USING (auth.uid() = user_id)`.

### Effective-grant delta, computed per account

`now` = tenants reachable via `current_tenant_id()`. `after` = via the new predicate.

| account | now | after (writes, admin) | after (reads, any member) |
|---|---|---|---|
| `admin@dangpestcontrol.com` | dang | dang | dang |
| `admin@ironwoodopsgrp.com` | pls | pls | pls |
| `admin@pestflowpro.com` | pestflow-pro | pestflow-pro | pestflow-pro |
| `precisionlawnsystems@yahoo.com` | **(none)** | **pls** | pls |
| `scott@homeflowpro.ai` | **(none)** | **pestflow-pro, vita-glow** | same |
| `admin@demo.com` | **pestflow-pro** | **apex-protect, coastal-pest, heartland-pest, metro-pest-concierge, urban-strike** | same |
| `scottdevore2@gmail.com` | (none) | **(none)** | **dang** |

Two rows change in both directions. `admin@demo.com` **loses** `pestflow-pro`: it holds
that tenant only through `profiles` and is not a `tenant_users` member of it.
`scottdevore2@gmail.com` holds `role = 'user'` on `dang` and is the only account for
which the admin-vs-any-member choice differs.

## Decisions taken, for review

1. **Writes require `role = 'admin'`; reads require any membership.** These policies
   include DELETE. `reports_admin_read` on the same table already requires admin.
   Reads are left open to any member so a non-admin who can see the admin UI can see the
   images in it.
2. **`is_operator()` is added to the logos bucket only.** A hardcoded operator grant
   already existed there and is replaced in kind. The other three buckets get no operator
   clause, because adding one would be a privilege expansion beyond the defect. The
   consequence is that an operator who is not a member of a tenant cannot upload that
   tenant's assets.
3. **The inline `EXISTS` is used rather than the `is_tenant_member()` helper**, following
   `reports_admin_read`. The tradeoff is stated in question 3 below.
4. **`authenticated_read_logos`** (`bucket_id = 'logos'` for any authenticated user) is
   left untouched. Narrowing it is a separate decision with its own blast radius.

## Questions for the validators

1. Does replacing `auth.uid() = '5181b30a-…'::uuid` with `public.is_operator()` change
   the effective grant **in any case**? Consider specifically: an account holding that
   UUID but no `operators` row, an account with an `operators` row but a different UUID,
   and any case where the two expressions disagree.

2. Is the `EXISTS (SELECT 1 FROM public.tenant_users …)` predicate evaluable by the
   `authenticated` role in a storage context? A prior finding on this project (S308 B2)
   established that an RLS policy predicate evaluates **as the querying role**, so a
   helper that role cannot execute makes every policy calling it fail closed. The grants
   above were read from the catalog rather than assumed. Is there a case in which this
   predicate is not evaluable, or evaluates to false, for a user who genuinely holds the
   membership row — for example under `tenant_users`' own RLS, or when the storage API
   evaluates policies under a role other than `authenticated`?

3. The inline `EXISTS` reads `public.tenant_users` as the querying role, and is therefore
   subject to that table's grants and RLS. `is_tenant_member(uuid)` is `SECURITY DEFINER`
   and subject to neither. Both are available and both grant EXECUTE to `authenticated`.
   Which is the better choice here, and does the inline form introduce a failure mode the
   helper does not have?

4. Is the write/read split defensible, or should reads also require `role = 'admin'` for
   consistency with `reports_admin_read`, or should writes accept any membership?

5. `admin@demo.com` loses access to the `pestflow-pro` tenant's storage. Is that a
   correct consequence of gating on membership, or a regression to be preserved against?

6. Anything else in the migration or the rollback that would fail, or that grants more
   than intended. The rollback deliberately restores the hardcoded UUID; is documenting
   that sufficient, or should the rollback refuse to restore it?

### Falsification question, asked as written

(a) What would have to be true for this change to be **wrong**? Name the specific
condition, and how it would be observed.

---

# Appendix A — Gemini verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.**
>
> **HOW TO CONFIRM THIS SLOT IS GEMINI** — checked BEFORE filling, never corrected
> after, because S309 round 1 was filed with the two models reversed and the arbitration
> cites appendix letters:
>
> | | Appendix A — **GEMINI** | Appendix B — **PERPLEXITY** |
> |---|---|---|
> | citations | **none** | **inline**, to external sources |
> | structure | numbered sections | prose |
>
> Paste unfenced between the markers, then checksum both and record the byte counts.

<!-- BEGIN APPENDIX A VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE GEMINI VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX A VERDICT -->

# Appendix B — Perplexity verdict (VERBATIM)

> ⚠️ **NOT YET SUPPLIED.** Same convention as Appendix A, whose table gives the test for
> confirming this slot is really Perplexity: **inline citations present**.

<!-- BEGIN APPENDIX B VERDICT — BYTE-EXACT, DO NOT EDIT -->
[PASTE PERPLEXITY VERDICT VERBATIM — NOT YET SUPPLIED]
<!-- END APPENDIX B VERDICT -->
