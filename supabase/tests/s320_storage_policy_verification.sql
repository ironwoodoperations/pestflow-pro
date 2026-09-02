-- S320 POST-APPLY VERIFICATION — run against the LIVE database after the migration.
--
-- WHY THIS FILE EXISTS, AND WHY IT READS pg_policy RATHER THAN THE MIGRATION:
-- S319 shipped three broken edge functions past a green test named "imports the
-- constant", because the assertion ran against RAW SOURCE TEXT and was satisfied by a
-- COMMENT containing the word it looked for. A migration file that contains the right
-- SQL and a database that carries the right policy are different claims. Everything
-- below interrogates the catalog, which is the artifact that actually gates requests.
--
-- Checks 1 and 2 are catalog assertions. THEY CAN BOTH PASS WHILE UPLOADS STAY BROKEN.
-- Check 3 is the one that matters and it is not SQL — see the bottom of this file.

-- ── 1. No policy expression anywhere on storage.objects still names the published
--       credential's UUID. Covers USING and WITH CHECK, every policy, not just the
--       three we edited — a fourth copy elsewhere would be the same defect.
SELECT
  'CHECK 1 — hardcoded UUID' AS check,
  count(*) AS offending_policies,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
  coalesce(string_agg(polname, ', '), '(none)') AS offenders
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects'
  AND (coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
       || ' ' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), ''))
      LIKE '%5181b30a-265f-4a70-a323-bf6e3c53641b%';

-- ── 2. No tenant-asset policy still calls current_tenant_id().
--       authenticated_read_logos is excluded by name because it never called it;
--       every other policy on the table is in scope.
SELECT
  'CHECK 2 — current_tenant_id()' AS check,
  count(*) AS offending_policies,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
  coalesce(string_agg(polname, ', '), '(none)') AS offenders
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects'
  AND (coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
       || ' ' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), ''))
      LIKE '%current_tenant_id%';

-- ── 2b. ANTI-VACUITY. Checks 1 and 2 are "count = 0" assertions: they also pass if
--        the policies were DROPPED rather than fixed, or if this query is looking at
--        the wrong table. Assert the expected policies EXIST and reference tenant_users.
--        Expected 13, counted explicitly rather than estimated:
--          logos          3  (insert, update, delete)
--          tenant-assets  4  (upload, update, delete, read)
--          social-uploads 3  (upload, delete, read)
--          videos         2  (upload, read)
--                        12  rewritten by S320
--          reports_admin_read  +1  already used tenant_users before S320
--                        13  total
--        The 14th policy on this table, authenticated_read_logos, does not reference
--        tenant_users and is deliberately untouched — so 13, not 14.
SELECT
  'CHECK 2b — policies exist and use tenant_users' AS check,
  count(*) AS policies_using_tenant_users,
  CASE WHEN count(*) = 13 THEN 'PASS' ELSE 'FAIL — expected 13' END AS result
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects'
  AND (coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
       || ' ' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), ''))
      LIKE '%tenant_users%';

-- ── 2f. Total policy count must be 14 — unchanged. S320 rewrites in place and adds
--        or removes nothing. A 13 means a DROP without its CREATE.
SELECT
  'CHECK 2f — total policy count' AS check,
  count(*) AS total_policies,
  CASE WHEN count(*) = 14 THEN 'PASS' ELSE 'FAIL — expected 14' END AS result
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects';

-- ── 2c. The full listing. Read it. The counts above are a smoke test; this is the
--        actual state, and a human should confirm each row says what it should.
SELECT pol.polname,
       CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                       WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE pol.polcmd::text END AS cmd,
       (coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
        || ' ' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '')) LIKE '%tenant_users%' AS uses_tenant_users,
       (coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
        || ' ' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '')) LIKE '%is_operator%'   AS uses_is_operator,
       (coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
        || ' ' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '')) LIKE '%role%'          AS mentions_role,
       pg_get_expr(pol.polqual, pol.polrelid)      AS using_expr,
       pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects'
ORDER BY pol.polname;

-- ── 2g. INSERT/UPDATE admit manager. tenant_users_role_check admits 'admin', 'manager'
--        and 'user', and the S273 content-table policies let a manager write. Admin-only
--        creation would mean a manager can edit a page's content row but not upload its
--        image — the same opaque RLS denial S320 exists to remove, and invisible today
--        because zero manager rows exist.
--        Expect: admit_manager = 6 (4 INSERT + 2 UPDATE), admin_only = 0.
SELECT
  'CHECK 2g — INSERT/UPDATE admit manager' AS check,
  count(*)                                                                     AS create_update_policies,
  count(*) FILTER (WHERE expr LIKE '%manager%')                                AS admit_manager,
  count(*) FILTER (WHERE expr LIKE '%admin%' AND expr NOT LIKE '%manager%')    AS admin_only,
  CASE WHEN count(*) = 6
        AND count(*) FILTER (WHERE expr LIKE '%manager%') = 6
        AND count(*) FILTER (WHERE expr LIKE '%admin%' AND expr NOT LIKE '%manager%') = 0
       THEN 'PASS'
       ELSE 'FAIL — an INSERT/UPDATE policy was narrowed to admin-only, or the count moved'
  END AS result
FROM (
  SELECT coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
         || ' ' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') AS expr
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relname = 'objects'
    AND pol.polcmd IN ('a','w')              -- INSERT / UPDATE only
) w;

-- ── 2i. DELETE IS ADMIN-ONLY. GATE ROUND 1 ARBITRATION — this is the point the two
--        validators split on. Gemini called manager-DELETE BLOCKING (storage DELETE is
--        destructive and unversioned; a purged asset is gone and any public page still
--        referencing it breaks). Perplexity argued explicitly AGAINST splitting, on the
--        grounds that a manager who may edit a page but not remove its image has an
--        incoherent privilege boundary, and that recoverability should be bought with
--        versioning or an audit trail instead. Conservative won: DELETE is admin-only.
--
--        THIS CHECK IS THE ARBITRATION MADE EXECUTABLE. If a later change re-widens
--        DELETE to manager — the exact thing the gate rejected — it fails here.
--        Expect: 3 DELETE policies, 3 admin-only, 0 admitting manager.
SELECT
  'CHECK 2i — DELETE is admin-only' AS check,
  count(*)                                                                  AS delete_policies,
  count(*) FILTER (WHERE expr LIKE '%manager%')                             AS admit_manager,
  count(*) FILTER (WHERE expr LIKE '%admin%' AND expr NOT LIKE '%manager%') AS admin_only,
  CASE WHEN count(*) = 3
        AND count(*) FILTER (WHERE expr LIKE '%manager%') = 0
        AND count(*) FILTER (WHERE expr LIKE '%admin%' AND expr NOT LIKE '%manager%') = 3
       THEN 'PASS'
       ELSE 'FAIL — DELETE re-widened to manager, or a DELETE policy went missing'
  END AS result
FROM (
  SELECT coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') AS expr
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relname = 'objects'
    AND pol.polcmd = 'd'
) d;

-- ── 2h. READ policies must NOT carry a role clause. Reads are any-membership, and on
--        four of five buckets they are not a confidentiality control at all (public
--        buckets bypass RLS on the public object URL) — so a role test there would cost
--        listing in the admin UI and buy nothing.
SELECT
  'CHECK 2h — read policies carry no role test' AS check,
  count(*) AS read_policies_with_role,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects'
  AND pol.polcmd = 'r'
  AND pol.polname <> 'reports_admin_read'   -- pre-existing, admin-only by design
  AND coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') LIKE '%tu.role%';

-- ── 2d. The helpers must be EXECUTABLE BY `authenticated`. S308's finding B2: an RLS
--        predicate evaluates AS THE QUERYING ROLE, so a helper that role cannot execute
--        makes every policy calling it fail closed — silently, and looking like a
--        permissions bug in the app.
SELECT
  'CHECK 2d — helper EXECUTE grants' AS check,
  p.proname,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  CASE WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE') THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'is_operator';

-- ── 2e. The inline EXISTS reads public.tenant_users AS THE QUERYING ROLE, so it is
--        subject to tenant_users' OWN grants and RLS — unlike a SECURITY DEFINER
--        helper. If either changes, every storage policy here fails closed.
SELECT
  'CHECK 2e — authenticated can read tenant_users' AS check,
  has_table_privilege('authenticated', 'public.tenant_users', 'SELECT') AS can_select,
  (SELECT count(*) FROM pg_policy pol
     JOIN pg_class c ON c.oid = pol.polrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='tenant_users' AND pol.polcmd IN ('r','*')) AS select_policies,
  'Expect can_select=true AND a policy admitting auth.uid()=user_id rows' AS note;

-- ── 2j. public.operators MUST NOT BE WRITABLE BY APPLICATION ROLES. Raised as a
--        BLOCKING condition by the round-1 gate, and it was a real gap, not a
--        theoretical one. Read live before this migration:
--
--            public.operators   relacl: authenticated=arwdDxtm/postgres
--            RLS enabled: TRUE.   Policies: NONE.
--
--        The ACL granted authenticated INSERT. Nothing was exploitable, because RLS
--        enabled with zero policies denies everything — but the table was protected BY
--        THE ABSENCE OF A POLICY, not by design. After S320 an operators row is
--        cross-tenant INSERT/UPDATE/DELETE on every tenant's logo, so one permissive
--        policy added later for any reason would have handed self-enrollment to every
--        logged-in user.
--
--        SELECT is deliberately still granted — is_operator() is SECURITY DEFINER and
--        does not need caller SELECT, so revoking it is a separate decision (S308 B2:
--        a role that cannot evaluate a predicate makes every policy fail closed).
--        Expect every write verb false for both roles; select_authenticated true.
SELECT
  'CHECK 2j — operators ACL closed to app roles' AS check,
  r.rolname,
  has_table_privilege(r.rolname, 'public.operators', 'INSERT')   AS ins,
  has_table_privilege(r.rolname, 'public.operators', 'UPDATE')   AS upd,
  has_table_privilege(r.rolname, 'public.operators', 'DELETE')   AS del,
  has_table_privilege(r.rolname, 'public.operators', 'TRUNCATE') AS trunc,
  has_table_privilege(r.rolname, 'public.operators', 'REFERENCES') AS refs,
  has_table_privilege(r.rolname, 'public.operators', 'SELECT')   AS sel,
  CASE WHEN NOT has_table_privilege(r.rolname, 'public.operators', 'INSERT')
        AND NOT has_table_privilege(r.rolname, 'public.operators', 'UPDATE')
        AND NOT has_table_privilege(r.rolname, 'public.operators', 'DELETE')
        AND NOT has_table_privilege(r.rolname, 'public.operators', 'TRUNCATE')
        AND NOT has_table_privilege(r.rolname, 'public.operators', 'REFERENCES')
       THEN 'PASS'
       ELSE 'FAIL — an application role can still write to operators'
  END AS result
FROM (VALUES ('authenticated'), ('anon')) AS r(rolname);

-- ── 2k. ANTI-VACUITY FOR 2j. Revoking every verb including SELECT would also pass the
--        FAIL condition above while breaking a decision that was made deliberately.
--        This asserts the kept grant is still there, so 2j cannot pass by over-revoking.
SELECT
  'CHECK 2k — operators SELECT deliberately retained' AS check,
  has_table_privilege('authenticated', 'public.operators', 'SELECT') AS authenticated_select,
  CASE WHEN has_table_privilege('authenticated', 'public.operators', 'SELECT')
       THEN 'PASS'
       ELSE 'FAIL — SELECT was revoked too; that was not the decision (see migration header)'
  END AS result;

-- ── 2l. The operators table still holds exactly the rows we think it does. The whole
--        logos operator branch is only as narrow as this table's contents. A row added
--        here is a silent cross-tenant logo grant, so it is listed rather than counted.
SELECT
  'CHECK 2l — operators roster' AS check,
  o.user_id,
  u.email,
  (SELECT count(*) FROM public.operators) AS total_rows,
  'Expect exactly 1 row: scott@homeflowpro.ai' AS note
FROM public.operators o
LEFT JOIN auth.users u ON u.id = o.user_id;

-- ── 2m. THE FORMER EXPLOIT, ASSERTED GONE. Perplexity asked for permanent coverage of
--        the exact published-credential path rather than a general "no literals" sweep.
--        5181b30a-… is admin@pestflowpro.com, whose password is on the marketing
--        homepage. It must appear in NO policy expression on storage.objects, AND it
--        must not have acquired the grant back through the operators table.
SELECT
  'CHECK 2m — published demo credential has no logo write' AS check,
  (SELECT count(*) FROM pg_policy pol
     JOIN pg_class c ON c.oid = pol.polrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='storage' AND c.relname='objects'
      AND (coalesce(pg_get_expr(pol.polqual, pol.polrelid),'')
        || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid),''))
          LIKE '%5181b30a-265f-4a70-a323-bf6e3c53641b%')      AS policies_naming_it,
  (SELECT count(*) FROM public.operators
    WHERE user_id = '5181b30a-265f-4a70-a323-bf6e3c53641b')   AS operators_rows,
  (SELECT count(*) FROM public.tenant_users
    WHERE user_id = '5181b30a-265f-4a70-a323-bf6e3c53641b'
      AND role IN ('admin','manager'))                        AS tenant_write_rows,
  'policies_naming_it MUST be 0 and operators_rows MUST be 0. tenant_write_rows is '
  || 'informational — its own tenant membership is legitimate and is NOT the exploit.' AS note;

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 3 — THE ONE THAT MATTERS. NOT SQL, AND CANNOT BE.
--
-- Everything above can pass while uploads stay broken: the catalog can be perfect
-- while the storage API rejects the request for a reason the catalog does not show.
-- Only a real upload proves it.
--
-- BOTH VALIDATORS CONVERGED ON THIS, and it is the reason the matrix below is longer
-- than "does the upload work". Perplexity: "Unit-testing the SQL predicate under a
-- privileged SQL session is not enough." Run every row AS THE REAL AUTHENTICATED ROLE,
-- through the storage API, in a browser — not in the SQL editor as postgres.
--
--   3a. NO-PROFILES-ROW ADMIN, own tenant, upload — MUST SUCCEED.
--       precisionlawnsystems@yahoo.com on pls, or scott@homeflowpro.ai on
--       pestflow-pro / vita-glow. Before S320 this failed with "new row violates
--       row-level security policy". This is the outage being fixed.
--   3b. NON-MEMBER of that tenant, same upload — MUST FAIL.
--       3a alone is not the test. A change that lets everyone in passes 3a and is
--       worse than the bug.
--   3c. MANAGER, own tenant, upload and replace (upsert) — MUST SUCCEED.
--       Requires creating a manager row; there are none today, which is exactly why
--       an admin-only write boundary would have shipped invisibly.
--   3d. MANAGER, own tenant, DELETE — MUST NOW FAIL.
--       This is the gate arbitration in the live system. If it succeeds, the DELETE
--       split did not take.
--   3e. ADMIN, own tenant, DELETE — MUST SUCCEED. The other half of 3d: a split that
--       denies everyone is not the intended outcome.
--   3f. role = 'user', own tenant, any write — MUST FAIL. Reads must still work.
--   3g. Member of tenant A writing under tenant B's prefix — MUST FAIL.
--   3h. Authenticated user with NO tenant_users row — MUST be denied, and denied
--       CLEANLY: a permission error naming tenant_users means the GRANT did not take
--       and every policy is failing closed for the wrong reason.
--   3i. A malformed key such as 'garbage/file.png' — the object must be excluded from
--       a LISTING QUERY WITHOUT ABORTING IT. This is the whole reason the inline
--       EXISTS was chosen over is_tenant_member(uuid): the helper's ::uuid cast raises
--       22P02 on a key like this and takes out the entire query rather than denying
--       one row. If listing errors here, the predicate shape decision was wrong.
--   3j. anon, any write — MUST FAIL.
--
-- Record every outcome. 3d and 3i are the two that are new in round 2 and the two most
-- likely to be skipped, because both need a state nobody has today: a manager row, and
-- a deliberately malformed object key.
-- ══════════════════════════════════════════════════════════════════════════════
