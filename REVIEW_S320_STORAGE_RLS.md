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

1. **Writes require `role IN ('admin', 'manager')`; reads require any membership.**
   `tenant_users_role_check` admits `admin`, `manager`, `user`, and this project's
   content-table policies already let a manager write. Admin-only storage would mean a
   manager can edit a page's content row but not upload that page's image — the same
   opaque `violates row-level security policy` this change exists to remove. Zero
   `manager` rows exist today, which is why it would have shipped silently.
   Reads take any membership; see the note on public buckets below.
2. **`is_operator()` is added to the logos bucket only, and this is a NARROWING rather
   than a substitution in kind.** The principal changes:
   `admin@pestflowpro.com` (shared, password published on the marketing homepage,
   revocable only by editing three policy expressions) → `scott@homeflowpro.ai` via
   `is_operator()` (single named identity, same reach, revocable by deleting one row from
   `operators`). One account loses cross-tenant logo write; a different one gains it.
   `operators` holds exactly one row. This is what the operators table was built for —
   and the failure being fixed is that a policy carrying a literal cannot be revoked by
   removing an operator, which is what the earlier fix attempted and did not achieve. The other three buckets get no operator
   clause, because adding one would be a privilege expansion beyond the defect. The
   consequence is that an operator who is not a member of a tenant cannot upload that
   tenant's assets.
3. **The inline `EXISTS` is used rather than the `is_tenant_member()` helper.** The
   helper takes `uuid`, so calling it requires `(storage.foldername(name))[1]::uuid` — a
   cast applied to an untrusted object key. A key whose first segment is not a valid uuid
   makes that cast **raise**, and an RLS predicate that raises errors the statement
   rather than denying the row; on a SELECT scanning the bucket one malformed key takes
   out the whole query. The inline form casts `uuid → text` and cannot raise. The
   helper's advantage — immunity to `tenant_users`' own grants and RLS — is real but
   secondary, and its failure direction is a denial rather than an error.
4. **`authenticated_read_logos`** — considered for removal and deliberately kept. It is
   the only SELECT policy on `logos`, so deleting it leaves that bucket with no
   authenticated read path and breaks listing in the admin UI, while the public object
   URL keeps working — which is what would make the breakage confusing to diagnose.
   Removing it safely means replacing it with a tenant-scoped read, a scope expansion
   beyond this change.

5. **Read policies on four of the five buckets are NOT a confidentiality control.**
   `logos`, `tenant-assets`, `social-uploads` and `videos` are all `public = true`; only
   `reports` is private. Supabase serves a public bucket over `/object/public/…` without
   evaluating RLS, so anyone with a URL reads the object whatever these policies say.
   They gate the authenticated `/object/` path and `list`. Any-membership reads are
   therefore correct, but not as a privacy judgement, and this must not be read as one.

6. **Re-upload was checked and is not broken.** `upsert: true` is used only against
   `tenant-assets` and `logos`, both of which have UPDATE policies. `social-uploads` is
   written without upsert from two call sites; `videos` is not written from client code
   at all. No UPDATE policies are added.

## Questions for the validators

**(a) The write boundary.** Writes require `role IN ('admin', 'manager')`. The role CHECK
constraint admits `admin`, `manager`, `user`, and this project's content-table policies
already permit a manager to write. Is admin+manager the right boundary for storage
writes, which include DELETE? Consider that zero `manager` rows exist today, so either
choice is invisible until the first one is created.

**(b) The operator change.** Cross-tenant logo write moves from a hardcoded literal
naming a shared account whose password is published on the company's marketing homepage,
to a single named operator resolved by `is_operator()` — a `SECURITY DEFINER` helper
reading an `operators` table that currently holds one row. Is that a narrowing? Does the
helper introduce any path that widens it — for example if `operators` gains rows, if the
helper's `search_path` or grants change, or if the table is empty?

**(c) Public buckets.** Four of the five buckets are `public = true`; only `reports` is
private. Supabase serves a public bucket over `/object/public/…` without evaluating RLS,
so the SELECT policies do not gate the public object URL. Does that change your view of
the read/write split — specifically, is any-membership for reads correct given the read
policies govern only the authenticated path and `list`?

**(d) The predicate shape.** The inline `EXISTS (SELECT 1 FROM public.tenant_users …)`
reads that table as the querying role, inheriting its grants and RLS. The alternative,
`is_tenant_member(uuid)`, is `SECURITY DEFINER` and inherits neither — but taking a
`uuid` means casting `(storage.foldername(name))[1]::uuid`, a cast on an untrusted object
key that raises rather than denies on a malformed key. Which shape is correct here, and
what is each one's failure mode if the underlying grants change later?

**(e) The effective grant.** Does replacing the literal with `is_operator()`, and
`current_tenant_id()` with the membership test, change the effective grant in any case
beyond those in the delta table above? `admin@demo.com` loses `pestflow-pro`, a tenant it
holds only through `profiles` while not being a member of it — fix or regression?

**(f) Anything else** in the migration or the rollback that would fail, or that grants
more than intended. The rollback deliberately restores the hardcoded literal; is
documenting that sufficient, or should it refuse to restore it?

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
