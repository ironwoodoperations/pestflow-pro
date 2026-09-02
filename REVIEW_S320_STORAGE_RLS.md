# S320 — storage.objects RLS. Validator gate submission.

**Status: ROUND 1 CLOSED. Both verdicts APPROVE WITH CONDITIONS, recorded verbatim in
Appendices A and B. All blocking conditions are addressed in the migration.**

| | Appendix A — Gemini | Appendix B — Perplexity |
|---|---|---|
| bytes | 5,468 | 16,533 |
| sha256 | `139a6f8a…3fae58d0` | `37591bf1…7fd6945f` |
| citations | **0** | **10** — supabase ×8, postgresql ×2 |
| verdict | APPROVE WITH CONDITIONS, 2 numbered conditions | APPROVE WITH CONDITIONS, single paragraph, 3 BLOCKING clauses |

Attribution was asserted **programmatically before either slot was written** — the fill
script aborts if A carries a citation or B carries none, which is the discriminator that
caught the S309 round-1 swap. Two descriptors in the submission brief did not survive
measurement and are corrected here rather than repeated: Gemini's sections are plain
`(a)`…`(f)` lines, **not** `####` headings, and Perplexity carries **8** supabase
citations, not 3 — three of those are the citation renderer having consumed `[1]` array
subscripts inside its SQL blocks, which is why its code samples in (d) read oddly. The
texts are recorded as delivered; that corruption is Perplexity's renderer, not an edit.

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
          AND tu.role IN ('admin', 'manager'))   -- INSERT/UPDATE. DELETE is admin-only
                                                --   after round 1; SELECT has no role test.
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

| account | now | after (INSERT/UPDATE, admin+manager) | after (SELECT, any member) |
|---|---|---|---|
| `admin@dangpestcontrol.com` | dang | dang | dang |
| `admin@ironwoodopsgrp.com` | pls | pls | pls |
| `admin@pestflowpro.com` | pestflow-pro | pestflow-pro | pestflow-pro |
| `precisionlawnsystems@yahoo.com` | **(none)** | **pls** | pls |
| `scott@homeflowpro.ai` | **(none)** | **pestflow-pro, vita-glow** | same |
| `admin@demo.com` | **pestflow-pro** | **apex-protect, coastal-pest, heartland-pest, metro-pest-concierge, urban-strike** | same |
| `scottdevore2@gmail.com` | (none) | **(none)** | **dang** |

**The DELETE column is omitted because it is identical.** Re-read from `tenant_users`
2026-09-02: **11 of the 12 membership rows are `role = 'admin'`**, the twelfth is
`scottdevore2@gmail.com` as `role = 'user'` on `dang`, and there are **zero `manager`
rows**. So admin-only DELETE and admin+manager DELETE grant exactly the same set today,
for every account. The arbitration above is entirely about the first manager who gets
created, which is also why it would have shipped invisibly either way.

Two rows change in both directions. `admin@demo.com` **loses** `pestflow-pro`: it holds
that tenant only through `profiles` and is not a `tenant_users` member of it.
`scottdevore2@gmail.com` holds `role = 'user'` on `dang` and is the only account for
which the write-role choice differs at all. The write column is identical whether the
boundary is `admin` or `admin`+`manager`, because **zero `manager` rows exist today** —
which is exactly why an admin-only boundary would have shipped invisibly and only
surfaced the first time a manager was created.

## Decisions taken, for review

1. **Three tiers: `INSERT`/`UPDATE` take `admin`+`manager`, `DELETE` is `admin`-only,
   `SELECT` takes any membership.** *(Round 1 changed this — it was uniform
   admin+manager for all writes when submitted; Gemini made manager-DELETE blocking and
   the arbitration above took it.)*
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

**(a) The write boundary.** *(ANSWERED — the models split; see the arbitration above. DELETE is now admin-only.)* Writes require `role IN ('admin', 'manager')`. The role CHECK
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

# Round 1 outcome — what was taken, and the one disagreement

Both models returned **APPROVE WITH CONDITIONS**. Every blocking condition is addressed
in the migration; nothing was deferred.

## The models disagreed on (a). Conservative won.

This is the only point of genuine conflict, and it is recorded rather than smoothed over
because **both readings are defensible**. This is a judgement split, not one model being
wrong.

| | position |
|---|---|
| **Gemini** | **BLOCKING — split DELETE to admin-only.** Storage DELETE is destructive and unversioned; a manager purging assets risks unrecoverable loss and broken public page links. |
| **Perplexity** | **Explicitly do NOT split.** A manager who may edit a page but not remove its image has an *internally inconsistent capability*, and that inconsistency is itself the hazard — it produces broken workflows and opaque Storage RLS failures. Buy recoverability with versioning, soft-delete metadata or an audit trail, "not an inconsistent Storage privilege boundary." |

**ARBITRATION: Gemini taken.** `DELETE` is `role = 'admin'` (plus `is_operator()` on
logos, where that branch already exists). `INSERT` and `UPDATE` keep
`role IN ('admin', 'manager')`.

The reasoning, stated plainly because Perplexity's argument is the better *long-run*
answer and it is being set aside anyway:

- Perplexity's remedy — versioning, soft-delete, audit trail — **does not exist in this
  system**, and an RLS migration is not where it gets built. Its argument is conditional
  on infrastructure nobody has written.
- **The tighter grant costs zero today.** There are no `manager` rows. Both choices are
  invisible in the current system, so the conservative one is free right now and the
  looser one buys nothing yet.
- Conflict resolves toward the recoverable error. Taking Gemini and being wrong means a
  manager is denied a delete and asks an admin. Taking Perplexity and being wrong means
  an asset is gone.

This is revisitable, and should be revisited **together with** Perplexity's remedy rather
than on its own — the moment a `manager` row exists and object versioning or an audit
trail is in place, its coherence argument becomes the stronger one.

## Perplexity's operators condition was a real gap, not a theoretical one

Perplexity made it blocking that no application principal can self-enroll into
`public.operators`, since after this migration one row there is cross-tenant write on
every tenant's logo. Read from the catalog:

```
public.operators   relacl: {postgres=arwdDxtm/postgres,
                            anon=rtm/postgres,
                            authenticated=arwdDxtm/postgres,   <- a=INSERT w=UPDATE d=DELETE
                            service_role=arwdDxtm/postgres}
RLS enabled: TRUE.  Policies: NONE.   operators rows: 1.
```

Re-read from the catalog rather than taken on trust, and it sharpens the finding in two
ways. The gap is on **`authenticated` alone** — `anon` holds only `r/t/m` and never had a
write verb, so the REVOKE against `anon` is a deliberate no-op kept as a tripwire, not a
hole being closed. And the revoke stops at the verbs the gate named: `authenticated`
keeps `t` (TRIGGER) and `m` (MAINTAIN). TRIGGER is the one that is not pure housekeeping,
though it needs a trigger function and `CREATE` on the schema to be reachable. Reported,
not fixed, and on the ROADMAP — widening a revoke past what was reviewed is how a fix
acquires an unreviewed blast radius.

Nothing was exploitable — RLS enabled with zero policies denies everything — but **the
table was protected by the absence of a policy, not by design**. One permissive policy
added later, for any reason, and every logged-in user could insert themselves as an
operator and take cross-tenant write and DELETE on every logo. The ACL is the thing that
should have been holding that shut, and it wasn't.

**Fixed in this PR:** `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ON
public.operators FROM authenticated, anon`. `SELECT` is deliberately kept —
`is_operator()` is `SECURITY DEFINER` and does not need caller `SELECT`, so revoking it
is a separate decision with its own blast radius (S308 B2: a role that cannot evaluate a
predicate makes every policy fail closed). Check **2k** exists so 2j cannot pass by
over-revoking.

## Already satisfied — verified against the catalog, nothing changed

| condition | raised by | state |
|---|---|---|
| `is_operator()` hardening — definer, pinned `search_path`, trusted owner, EXECUTE scope | Perplexity BLOCKING; Gemini (e) | `prosecdef=true`, `search_path=''`, owner `postgres`, EXECUTE to `authenticated` ✅ |
| `authenticated` holds SELECT on `tenant_users` | Gemini (e) item 1, NON-BLOCKING | already true ✅ — and the `GRANT` is now **written explicitly** into the migration so a fresh database reproduces it instead of inheriting a Supabase default. Same reasoning as the S309 `get_my_tenant_role` grant. |
| `storage.foldername` EXECUTE available | Gemini (e) item 2 | default `PUBLIC` EXECUTE ✅ |

## Taken from the non-blocking set

**The former exploit is now permanent coverage** (Perplexity). Check **2m** asserts the
published-credential UUID appears in no `storage.objects` policy expression *and* holds
no `operators` row — the two ways that exact grant could come back. Its own
`tenant_users` membership is reported but not failed on: that membership is legitimate
and is not the exploit.

## Recorded, not implemented — ROADMAP

Canonical object-key validation client-side, operator-bypass audit logging,
public-vs-private bucket reassessment for `tenant-assets`/`videos`, cross-tenant
copy/move bounds, and a TEXT-taking `is_tenant_member()` overload. All five are real;
none belongs in an RLS migration. Written to `docs/ROADMAP.md` with the reasoning intact
so they are not re-derived from scratch.

## What both models converged on, and it is the point

**End-to-end tests under the real authenticated role, not a privileged SQL session.**
Perplexity: *"Unit-testing the SQL predicate under a privileged SQL session is not
enough."* Check 3 in the verification script is now a ten-row matrix (3a–3j) covering
the no-`profiles`-row admin, the non-member, manager write vs manager DELETE, admin
DELETE, `role='user'`, cross-tenant, the no-membership user denied *without* a SQL error,
a malformed key that must not abort a listing query, and `anon`. Everything in section 2
can pass while uploads stay broken.

---

# Appendix A — Gemini verdict (VERBATIM)

> ✅ **FILLED 2026-09-02. 5,468 bytes, sha256 `139a6f8ab42eeaab300ebe624cce3f55ba8e98e07d0a10fb1549b8553fae58d0`.**
>
> **HOW THIS SLOT WAS CONFIRMED AS GEMINI** — asserted BEFORE the write, never corrected
> after, because S309 round 1 was filed with the two models reversed and the arbitration
> cites appendix letters:
>
> | | Appendix A — **GEMINI** | Appendix B — **PERPLEXITY** |
> |---|---|---|
> | citations | **none** — measured 0 ✅ | **inline** — measured 10 ✅ |
> | structure | numbered sections | prose |
>
> The fill script raises before writing either slot if A has any `](http` match or B has
> none. It ran clean.

<!-- BEGIN APPENDIX A VERDICT — BYTE-EXACT, DO NOT EDIT -->
Assessment of the Six Points
(a) Write Boundary & Separation of DELETE
Assessment: The internal review call to include `manager` in `INSERT` and `UPDATE` was correct, but leaving `DELETE` coupled to `manager` is wrong.

* Insert / Update: Allowing `manager` aligns storage capabilities with content-table application policies, preventing opaque upload/replacement failures when managers build or edit tenant pages.

* Delete: Storage `DELETE` operations are destructive and unversioned. In a multi-tenant setup, allowing a manager role to purge assets permanently can lead to unrecoverable data loss or broken public page links. `DELETE` should be explicitly separated and restricted to `admin` only (or `admin` + `is_operator()`).

(b) Operator Substitution & Security Analysis
Assessment: The PR’s characterization as a NARROWING is correct. Routing through `is_operator()` does NOT widen the grant under edge cases.

* Narrowing: Replacing an exposed, publicly available credential with a tracked, single-principal table lookup significantly reduces exposure.

* Empty `operators` Table: If `operators` contains zero rows, `EXISTS (SELECT 1 FROM public.operators WHERE ...)` evaluates to `FALSE`. It fails closed and does not open access.

* `INSERT` into `operators`: Because `is_operator()` is `SECURITY DEFINER`, any escalation risk lies in table-level permissions. If regular users could insert into `operators`, privilege escalation would occur. However, because table privileges are restricted to superusers/migration roles, this path does not widen access.

(c) Public Buckets & Read Policies
Assessment: Your team’s approach is correct. Narrowing read policies on public buckets adds no practical confidentiality benefit and introduces unnecessary operational risk.

* Public CDN vs. Storage API: Since `public = true` buckets serve objects over `/object/public/...` without evaluating RLS, attempting to restrict `SELECT` policies for confidentiality creates a false sense of security.

* Purpose of `SELECT` Policies: On public buckets, `SELECT` policies govern authenticated API actions (such as `supabase.storage.from('bucket').list()`). Allowing any valid tenant member (`role IN ('admin', 'manager', 'user')`) to run `list()` ensures dashboard pickers and asset browsers work seamlessly for all legitimate users without leaking objects across tenant boundaries.

(d) Predicate Shape: Inline `EXISTS` vs. `SECURITY DEFINER` Helper
Assessment: The inline `EXISTS` form with explicit `text` comparison is the correct, production-ready shape to ship.

* Casting Risk (`::uuid`): If a `SECURITY DEFINER` helper takes a `uuid` parameter, evaluating `(storage.foldername(name))[1]::uuid` on an arbitrary string key (e.g., `logos/manifest.json` or path-traversal attempts) causes Postgres to throw `22P02: invalid input syntax for type uuid`. In a bulk `list()` or scanning `SELECT` query, a single malformed object name aborts the entire transaction.

* The Inline `EXISTS` Path: Casting `tu.tenant_id::text` to match the path string avoids `22P02` errors entirely. If the path does not match a valid UUID string in `tenant_users`, `EXISTS` safely evaluates to `FALSE` (deny) rather than throwing an exception.

* Verdict: Ship the inline `EXISTS` with `uuid -> text` casting.

(e) Permission & Execution Failure Modes
Assessment: Granting `EXECUTE` on `is_operator()` to `authenticated` is sufficient for the operator check. However, there are two additional permission failure modes in these predicates:

1. `SELECT` Grant on `public.tenant_users`: Because the inline `EXISTS` executes under the querying role (e.g., `authenticated`), the `authenticated` role must have explicit `SELECT` privileges on `public.tenant_users`. If `REVOKE SELECT ON public.tenant_users FROM authenticated;` is run, all storage policies using this predicate will fail closed with a `permission denied for table tenant_users` error.

2. `EXECUTE` Grant on `storage.foldername`: The policies rely on `storage.foldername()`. The `authenticated` and `anon` roles must maintain `EXECUTE` privileges on the `storage.foldername(text)` function.

(f) Additional Findings

1. `storage.foldername(name)[1]` Null/Empty Path Edge Case:
If an object is uploaded directly to the root of a bucket without a folder (e.g., `logos/header.png` instead of `logos/<tenant_id>/header.png`), `storage.foldername(name)[1]` evaluates to `NULL`.

   * In `tu.tenant_id::text = NULL`, the condition yields `NULL` (falsy), correctly denying access.

   * However, ensure root-level uploads are explicitly prevented at the client level so legitimate files are not lost to orphan paths.

2. Cross-Tenant Copy/Move Operations:
Supabase Storage copy/move actions require `SELECT` on the source object and `INSERT` on the target path. If cross-tenant asset duplication is ever built, policy bounds must account for source vs. destination folder evaluation.

Final Verdict
APPROVE WITH CONDITIONS

1. [BLOCKING] Separate `DELETE` Policies: Split the `DELETE` policies from `INSERT`/`UPDATE` across all buckets. Restrict `DELETE` strictly to `role = 'admin'` (and `is_operator()`), revoking storage object deletion capabilities from the `manager` role.

2. [NON-BLOCKING] Verify `tenant_users` Table Grants: Ensure continuous integration/migrations explicitly enforce `GRANT SELECT ON public.tenant_users TO authenticated;` so policy evaluations under regular user sessions do not fail on permission lookup.
<!-- END APPENDIX A VERDICT -->

# Appendix B — Perplexity verdict (VERBATIM)

> ✅ **FILLED 2026-09-02. 16,533 bytes, sha256 `37591bf15179fdb6c5393925d6fc609f57bbb25298488822bb1497457fd6945f`.**
> Same convention as Appendix A, whose table gives the test for confirming this slot is
> really Perplexity: **inline citations present** — measured 10 (supabase ×8,
> postgresql ×2).
>
> Recorded as delivered. The SQL blocks in section (d) contain citation links where `[1]`
> array subscripts should be; that is Perplexity's citation renderer consuming the
> subscript, not a recommendation to write that SQL, and it is **not** silently repaired
> here — a VERBATIM slot that has been tidied is no longer a transcript.

<!-- BEGIN APPENDIX B VERDICT — BYTE-EXACT, DO NOT EDIT -->
The migration fixes both verified blockers and, on the facts provided, is structurally sound. The most important remaining caveat is not the policy predicate itself: it is governance around the privileged `operators` table and the `SECURITY DEFINER` functions’ ownership, `search_path`, and grants.
## (a) Write boundary
**Admin + manager is the right boundary** for insert, update, and delete, assuming the application’s existing authorization model genuinely permits managers to edit the corresponding tenant content.
The decisive issue is consistency of the authorization model, not an abstract rule that deletion should always be admin-only:
- `tenant_users.role` explicitly recognizes `admin`, `manager`, and `user`.
- Existing content-table RLS already lets managers write content.
- A manager who can change a page but cannot upload, replace, or remove that page’s image has an internally inconsistent capability. In practice this produces broken content workflows and opaque Storage RLS failures.
- The audit confirms all client-side upsert paths have an UPDATE policy, so allowing manager update is not merely theoretical; it is required for the actual `upsert: true` usage on `tenant-assets` and `logos`.
I would **not** split DELETE into admin-only merely because it is DELETE. That would be a product-authorization decision, and nothing in the stated model says managers are intended to be unable to remove assets. If you want recoverability, use retention/versioning, soft-delete metadata, an audit trail, or restore tooling—not an inconsistent Storage privilege boundary.
One nuance: allow managers to delete only if they are meant to delete the *asset itself*, including assets a different tenant member uploaded. The proposed tenant-scoped predicate does exactly that, which is normally correct for shared tenant-owned content.
**Assessment:** Correct.
## (b) Operator substitution
Calling this a **narrowing** is correct in the security-relevant sense, even though it changes which principal has cross-tenant logo authority.
The old condition was effectively:
```sql
auth.uid() = '<published-demo-account-uuid>'
```
That granted a publicly exposed, shared credential global insert/update/delete authority over every tenant logo. Replacing it with `is_operator()` means:
- The old demo principal loses its global Storage write authority.
- One distinct platform-owner principal gains global Storage write authority through membership in `operators`.
- The new authority is centrally revocable by deleting that specific `operators` row.
- The policy no longer embeds a durable, hard-to-audit identity exception in three independent policies.
That is **not** a strictly set-theoretic narrowing of principals at every instant—the new operator previously had no grant, and now has one. But it is a clear narrowing of the *risk model*: from a published/shared credential to a controlled, named, revocable operator authorization source. “Narrowing rather than like-for-like replacement” is accurate and appropriately candid.
A correctly implemented `is_operator()` does **not** widen access in either scenario you asked about:
| Scenario | Effect |
|---|---|
| `operators` is empty | `is_operator()` returns false for everyone; the operator bypass disappears and normal tenant-role checks remain. This is fail-closed, not widened. |
| The caller cannot insert into `operators` | The caller cannot bootstrap global logo authority. This is required for the design to be safe. |
| A caller can insert into `operators` directly or indirectly | This is a critical privilege-escalation path: they can make themselves an operator and obtain cross-tenant logo write authority. |
The condition is therefore: verify that `authenticated`, `anon`, tenant application roles, and any user-reachable RPC/function owner cannot `INSERT`, `UPDATE`, or otherwise cause insertion into `public.operators`. Also verify that no broad `FOR INSERT` RLS policy, permissive RPC, trigger path, or service endpoint allows self-enrollment.
For a `SECURITY DEFINER` helper, the function must also be hardened:
- Owned by a tightly controlled non-user-facing owner.
- `search_path` explicitly pinned, ideally `SET search_path = pg_catalog, public` or narrower with referenced relations schema-qualified.
- `operators` schema-qualified in the function body.
- `EXECUTE` granted only to the roles that need policy evaluation; `authenticated` is appropriate if policies apply to authenticated traffic.
- No dynamic SQL or caller-controlled identifier construction.
Supabase recommends using RLS policies on `storage.objects` for Storage authorization, while PostgreSQL confirms policy expressions normally run with the querying user’s privileges; `SECURITY DEFINER` functions deliberately cross that boundary, so their ownership and invocation grants matter. [supabase](https://supabase.com/docs/guides/storage/security/access-control)
**Assessment:** Correct characterization, with one **blocking** verification: non-privileged application identities must have no self-service path to mutate `operators`.
## (c) Public buckets
Yes—public-bucket status substantially changes the meaning of “reads accept any membership.”
For `logos`, `tenant-assets`, `social-uploads`, and `videos`, direct public object retrieval bypasses the `storage.objects` SELECT policy. Anyone with, or able to derive, a `/object/public/...` URL can retrieve the object. Supabase’s documentation states that public buckets bypass access control for retrieving and serving files, while access controls still apply to write-type operations. [supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals)
So the SELECT policies in those four buckets are **not confidentiality controls for object bytes**. They still matter for authenticated Storage API paths, especially listing and metadata/object operations performed through paths that do evaluate RLS. Therefore:
- “Reads accept any membership” is reasonable as an authenticated API/listing rule.
- Narrowing public-bucket SELECT to a tenant membership test can reduce cross-tenant discovery through authenticated list/API access.
- It cannot make the underlying images confidential once the bucket is public and a public URL is known or enumerable.
- It can still be valuable as a UI hygiene and metadata-disclosure control: prevent a tenant user from using authenticated listing endpoints to browse other tenants’ object names, sizes, timestamps, and paths.
There is a residual confidentiality argument only for **metadata/listing behavior**, not for public object delivery. If any of these objects are intended to be confidential—customer property photos, internal social drafts, videos with sensitive information, documents accidentally stored under these prefixes—the bucket should be private, and delivery should use RLS-authorized downloads or signed URLs. Public/private is bucket-wide in Supabase Storage; you cannot make only selected tenant folders genuinely private within a public bucket. [supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals)
**Assessment:** Correct, provided the PR does not overstate tenant SELECT policies as confidentiality protection for public URLs.
## (d) Predicate shape
I would ship the **inline `EXISTS` with `tenant_id::text = foldername [supabase](https://supabase.com/docs/guides/storage/security/access-control)`** shape, subject to verifying the querying role can successfully evaluate it under `tenant_users` grants and RLS.
Its key safety advantage is malformed-path behavior:
```sql
tu.tenant_id::text = (storage.foldername(name)) [supabase](https://supabase.com/docs/guides/storage/security/access-control)
```
A malformed, missing, or arbitrary folder component is just a non-match. `EXISTS` becomes false, so the policy denies that object row. It does not try to reinterpret attacker- or legacy-controlled path text as a UUID.
By contrast:
```sql
is_tenant_member((storage.foldername(name)) [supabase](https://supabase.com/docs/guides/storage/security/access-control)::uuid)
```
can throw `invalid input syntax for type uuid` for malformed object keys. In an RLS predicate, that is not a clean deny; it can abort the SQL operation, including a scanning/listing SELECT that encounters a malformed existing key. This is a real operational availability and robustness defect, particularly because object names are persistent data and may predate constraints or include manually/admin-created paths.
The tradeoff is exactly as stated:
| Predicate shape | Main strength | Main failure mode |
|---|---|---|
| Inline `EXISTS` against `tenant_users` | Safe text comparison; malformed path denies instead of raising | Depends on querying role having usable table privileges and passing `tenant_users` RLS |
| `SECURITY DEFINER is_tenant_member(uuid)` | Avoids caller-side `tenant_users` grants/RLS dependency | Casting arbitrary folder input to UUID can raise and abort the operation; helper grants/ownership become another dependency |
The inline policy’s dependency on `tenant_users` permissions is not inherently wrong. It is visible, testable, and aligned with application RLS already using that table. PostgreSQL documents that policy expressions execute with the querying user’s privileges, except where a security-definer function changes that execution context. [postgresql](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
Before shipping, run actual policy-path tests—not just helper tests—under the JWT/database role used by browser requests:
- Authenticated admin and manager: own-tenant insert, update/upsert, delete allowed.
- Authenticated user: read behavior according to the policy; writes denied.
- Authenticated member of tenant A: all writes to tenant B prefix denied.
- Authenticated user with no `tenant_users` row: denied, no SQL error.
- Unauthenticated/`anon`: denied for writes.
- A legacy or malformed key such as `garbage/file.png`: denied or excluded without aborting a Storage listing query.
- An empty folder component or top-level object: denied without aborting.
- A normal UUID tenant prefix that has no tenant membership: denied.
**Assessment:** The inline `EXISTS` is the better production choice.
## (e) Policy-time permissions
Yes: granting `EXECUTE` on `is_operator()` to `authenticated` is sufficient **for authenticated policy evaluation to invoke that function**, assuming the policies themselves are assigned to/apply to `authenticated` as expected.
If `EXECUTE` is revoked from the effective querying role, PostgreSQL cannot invoke the function while evaluating the RLS expression; the affected policy path errors/fails closed. That follows from PostgreSQL’s privilege model: policy expressions run with the invoking user’s privileges, while security-definer functions use their owner’s authority once the caller is permitted to invoke them. [postgresql](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
Other permission-sensitive dependencies in these policies include:
- **`tenant_users` table privileges:** The inline `EXISTS` requires that the querying role have the needed ability to access `public.tenant_users`, normally `SELECT`.
- **`tenant_users` RLS policies:** Even with table `SELECT`, the query sees only rows permitted by that table’s own RLS. A restrictive or broken `tenant_users` SELECT policy can make the Storage condition falsely deny.
- **Function dependencies called by `tenant_users` RLS:** If `tenant_users` RLS itself invokes helpers, those helpers’ `EXECUTE` grants and function internals can also fail closed.
- **Schema `USAGE`:** The querying role needs `USAGE` on the schema for direct references such as `public.tenant_users`; normally this is already present, but it is still a dependency.
- **`storage.foldername` execution availability:** If it is a function whose execute privilege is not broadly available to the querying role, or if custom privilege hardening changed defaults, that can similarly break policy evaluation.
- **`auth.uid()` availability:** Usually available in Supabase’s intended roles, but it is part of the policy evaluation chain and should be covered by an end-to-end test rather than assumed.
- **`is_operator()`’s internal dependencies:** Since it is `SECURITY DEFINER`, ordinary caller `SELECT` on `operators` should not be required. But the *function owner* must retain privileges to read `operators`, and the function must remain valid after ownership/grant changes.
Supabase’s RLS guidance specifically recommends tests that assert allow/deny behavior per operation and role; in this case, that testing should include failure-oriented permission regressions, not only happy-path policy assertions. [supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
**Assessment:** Correct, but `EXECUTE` on `is_operator()` is only one permission dependency; the inline `tenant_users` query is the other major one.
## (f) Additional findings
I do not see another demonstrated policy-logic blocker in the proposed change. The following are conditions I would require or recommend before final merge/deployment:
- **BLOCKING — Prove `operators` cannot be self-mutated by application principals.** Audit SQL grants, table RLS policies, all RPCs, Edge Functions/API routes using service credentials, triggers, and admin tooling. The sole operator row is a global cross-tenant write grant for `logos`; the table must be a tightly controlled platform-administration boundary.
- **BLOCKING — Verify `is_operator()` is safely defined.** Confirm explicit safe `search_path`, schema-qualified relation references, trusted owner, no caller-controlled dynamic SQL, and the owner’s continued ability to read `operators`. A vulnerable `SECURITY DEFINER` function can create privilege escalation independently of the policy’s logic.
- **BLOCKING — Execute end-to-end Storage policy tests under the real authenticated role.** Include the matrix above, especially the previously broken “tenant_users-only paying admin” case and the `upsert: true` paths. Unit-testing the SQL predicate under a privileged SQL session is not enough.
- **BLOCKING — Verify the inline `tenant_users` EXISTS is evaluable by the real browser/query role.** It must have the necessary schema/table permissions and a `tenant_users` RLS path that exposes a user’s own membership row. Otherwise the new rule silently reproduces the availability outage as universal denials.
- **NON-BLOCKING — Constrain object-key structure outside RLS.** RLS safely denies malformed keys with the current text comparison, but API-side validation should require a canonical UUID first path segment and reject paths such as top-level objects, empty first segments, traversal-like strings, or unexpected Unicode normalization. This makes storage names predictable and reduces operational debris.
- **NON-BLOCKING — Add a regression test that proves the published demo credential cannot modify any tenant logo.** The exact former exploit should be permanent test coverage, alongside tests proving the designated operator can perform only the intended platform-level logo operation.
- **NON-BLOCKING — Reassess whether public buckets are intentional for each asset class.** If tenant assets or videos can contain sensitive customer data, make those buckets private and provide authenticated/signed delivery. Tenant-scoped SELECT policies alone cannot protect object contents in a public bucket. [supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- **NON-BLOCKING — Consider visibility semantics for authenticated listing.** For public buckets, tenant-scoped SELECT is still sensible to prevent authenticated cross-tenant browsing and metadata exposure, even though it cannot restrict direct public URL retrieval.
- **NON-BLOCKING — Consider event/audit logging for operator bypass writes.** Cross-tenant logo mutation is a high-impact support/admin capability. Record actor ID, target tenant prefix, bucket, object key, operation, and request correlation data.
VERDICT — **APPROVE WITH CONDITIONS**: **BLOCKING**—lock down and verify `operators` mutation paths; harden/verify `is_operator()`; confirm real-role evaluation of inline `tenant_users` policy and run end-to-end regression tests. **NON-BLOCKING**—validate canonical paths, add exploit regression coverage and operator audit logging, and reassess public-bucket suitability for any sensitive asset types.
<!-- END APPENDIX B VERDICT -->
