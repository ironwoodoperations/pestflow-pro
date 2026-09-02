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

-- ── 2g. The write boundary is admin+manager, not admin-only. tenant_users_role_check
--        admits 'admin', 'manager' and 'user', and the S273 content-table policies let a
--        manager write. Admin-only storage would mean a manager can edit a page's
--        content row but not upload its image — the same opaque RLS denial S320 exists
--        to remove, and invisible today because zero manager rows exist.
--        Expect 9 write policies naming manager; 0 naming admin without it.
SELECT
  'CHECK 2g — write policies admit manager' AS check,
  count(*) FILTER (WHERE expr LIKE '%manager%')                                AS admit_manager,
  count(*) FILTER (WHERE expr LIKE '%admin%' AND expr NOT LIKE '%manager%')    AS admin_only,
  CASE WHEN count(*) FILTER (WHERE expr LIKE '%admin%' AND expr NOT LIKE '%manager%') = 0
       THEN 'PASS' ELSE 'FAIL — an admin-only write policy survives' END       AS result
FROM (
  SELECT coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
         || ' ' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') AS expr
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relname = 'objects'
    AND pol.polcmd IN ('a','w','d')          -- INSERT / UPDATE / DELETE only
) w;

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

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK 3 — THE ONE THAT MATTERS. NOT SQL, AND CANNOT BE.
--
-- Everything above can pass while uploads stay broken: the catalog can be perfect
-- while the storage API rejects the request for a reason the catalog does not show.
-- Only a real upload proves it.
--
--   3a. Sign in to the pls admin as a NO-PROFILES-ROW admin —
--       precisionlawnsystems@yahoo.com, or scott@homeflowpro.ai for pestflow-pro /
--       vita-glow — and upload a page hero image. It must SUCCEED. Before S320 this
--       failed with "new row violates row-level security policy".
--   3b. As a non-member of that tenant, attempt the same upload. It must FAIL.
--       A fix that lets everyone in passes 3a and is worse than the bug.
--
-- Record both outcomes. 3a alone is not the test; 3b is what distinguishes a fix
-- from an opening.
-- ══════════════════════════════════════════════════════════════════════════════
