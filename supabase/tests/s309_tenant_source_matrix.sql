-- S309 — TENANT-SOURCE AUTHORIZATION MATRIX.
--
-- READ-ONLY. This script SELECTs and calls STABLE functions. It never writes.
--
-- WHAT THIS IS FOR
-- Validator condition 12 (Perplexity, BLOCKING): "prove the identity binding
-- end-to-end" across nine caller shapes. Before S309 there were ZERO tests for
-- either consumer of the tenant source. This is the DB half of that matrix.
--
-- RUN IT: at deploy-verification step 4, after the migration is applied. Also
-- re-run any time tenant_users membership changes shape.
--
-- ============================================================================
-- COVERS (exactly these, nothing else):
--     public.list_tenant_members(p_tenant_id uuid)   -- rows returned
--     public.get_my_tenant_role(p_tenant_id uuid)    -- the authorization test
--   across shapes 1-7 below, driven by REAL membership rows, not fixtures.
--
-- DOES NOT COVER — and these are NOT optional, they are the other half:
--   * Shape 8 (malformed uuid) and shape 9 (absent parameter) are PostgREST-level,
--     not SQL. A malformed uuid fails input casting before the body runs; an absent
--     parameter fails function resolution. Exercise them over HTTP:
--         POST /rest/v1/rpc/list_tenant_members  {"p_tenant_id":"not-a-uuid"} -> 400
--         POST /rest/v1/rpc/list_tenant_members  {}                           -> 404
--     and against the edge function:
--         invoke invite-team-member {"tenant_id":"not-a-uuid",...}            -> 400
--         invoke invite-team-member {email,role} with NO tenant_id            -> 400
--   * The edge function's own admin gate. It calls the SAME get_my_tenant_role
--     through the CALLER's client, so shapes 1-7 below predict it, but a live
--     invoke is what proves the JWT reaches Postgres as auth.uid().
--   * Whether exactly one list_tenant_members signature exists. Checked separately
--     at the bottom of this file.
--
-- THE HARNESS
-- set_config('request.jwt.claims', ...) makes auth.uid() return the chosen user
-- WITHOUT needing a real JWT. Everything runs inside a transaction that ROLLBACKs.
-- NOTE (S308 lesson): never put a REVOKE/GRANT in the same batch as this ROLLBACK —
-- the rollback silently undoes it and the result reads as a pass.
-- ============================================================================

BEGIN;

CREATE TEMP TABLE s309_result(
  shape text, actor text, tenant text,
  expected_role text, actual_role text,
  expected_rows text, actual_rows int,
  verdict text
) ON COMMIT DROP;

DO $$
DECLARE
  r record;
  v_role text;
  v_rows int;
  v_expect_rows text;
BEGIN
  -- Seven shapes, each resolved from live membership rather than invented.
  FOR r IN
    WITH admin_multi AS (   -- shape 5: admin of more than one tenant
      SELECT tu.user_id FROM public.tenant_users tu
      WHERE tu.role = 'admin' GROUP BY tu.user_id HAVING count(*) > 1 LIMIT 1
    ),
    admin_single AS (       -- shape 4: admin of exactly one tenant
      SELECT tu.user_id FROM public.tenant_users tu
      WHERE tu.role = 'admin' GROUP BY tu.user_id HAVING count(*) = 1 LIMIT 1
    )
    SELECT '4. admin, one tenant' AS shape, tu.user_id, tu.tenant_id, tu.role AS expect
      FROM public.tenant_users tu JOIN admin_single a ON a.user_id = tu.user_id
     WHERE tu.role = 'admin'
    UNION ALL
    SELECT '5. admin, several tenants', tu.user_id, tu.tenant_id, tu.role
      FROM public.tenant_users tu JOIN admin_multi a ON a.user_id = tu.user_id
     WHERE tu.role = 'admin'
    UNION ALL
    SELECT '2. member (role=user)', tu.user_id, tu.tenant_id, tu.role
      FROM public.tenant_users tu WHERE tu.role = 'user'
    UNION ALL
    SELECT '3. manager', tu.user_id, tu.tenant_id, tu.role
      FROM public.tenant_users tu WHERE tu.role = 'manager'
    UNION ALL
    -- shape 6: admin whose profiles row is ABSENT. This is the live defect: before
    -- S309 these callers got zero rows and "Invitation failed." Every INVITED admin
    -- is in this state, because invite-team-member writes only tenant_users.
    SELECT '6. admin, NO profiles row', tu.user_id, tu.tenant_id, tu.role
      FROM public.tenant_users tu
      LEFT JOIN public.profiles p ON p.id = tu.user_id
     WHERE tu.role = 'admin' AND p.id IS NULL
    UNION ALL
    -- shape 7: a real user asking about a tenant they hold NO membership in.
    SELECT '7. tenant not in any membership', u.id, t.id, NULL
      FROM auth.users u CROSS JOIN public.tenants t
     WHERE NOT EXISTS (SELECT 1 FROM public.tenant_users tu
                        WHERE tu.user_id = u.id AND tu.tenant_id = t.id)
     LIMIT 3
    UNION ALL
    -- shape 1: an authenticated identity with NO membership anywhere at all.
    SELECT '1. no membership anywhere', u.id, t.id, NULL
      FROM auth.users u CROSS JOIN public.tenants t
     WHERE NOT EXISTS (SELECT 1 FROM public.tenant_users tu WHERE tu.user_id = u.id)
     LIMIT 2
  LOOP
    PERFORM set_config('request.jwt.claims',
             json_build_object('sub', r.user_id, 'role', 'authenticated')::text, true);

    v_role := public.get_my_tenant_role(r.tenant_id);
    SELECT count(*) INTO v_rows FROM public.list_tenant_members(r.tenant_id);

    -- The ONLY rule: admin sees the roster, everyone else sees nothing.
    v_expect_rows := CASE WHEN r.expect = 'admin' THEN '> 0' ELSE '= 0' END;

    INSERT INTO s309_result
    SELECT r.shape,
           (SELECT email FROM auth.users WHERE id = r.user_id),
           (SELECT slug  FROM public.tenants WHERE id = r.tenant_id),
           r.expect, v_role, v_expect_rows, v_rows,
           CASE
             WHEN v_role IS DISTINCT FROM r.expect                       THEN 'FAIL role'
             WHEN r.expect = 'admin'     AND v_rows = 0                  THEN 'FAIL admin got no rows'
             WHEN r.expect IS DISTINCT FROM 'admin' AND v_rows <> 0      THEN 'FAIL non-admin got rows'
             ELSE 'pass'
           END;
  END LOOP;

  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo '=== S309 authorization matrix (shapes 1-7) ==='
SELECT * FROM s309_result ORDER BY shape, actor, tenant;

\echo '=== SUMMARY — any non-zero failure count is a BLOCKING regression ==='
SELECT count(*) FILTER (WHERE verdict = 'pass')      AS passed,
       count(*) FILTER (WHERE verdict <> 'pass')     AS failed,
       count(*)                                       AS total
FROM s309_result;

\echo '=== Shapes with NO live data (the matrix is silent, not green, on these) ==='
-- A shape with zero rows was not tested. Stated explicitly so an empty result is
-- never mistaken for a pass — the S281/S286 vacuity lesson.
SELECT s.shape, coalesce(c.n, 0) AS rows_exercised
FROM (VALUES ('1. no membership anywhere'),('2. member (role=user)'),('3. manager'),
             ('4. admin, one tenant'),('5. admin, several tenants'),
             ('6. admin, NO profiles row'),('7. tenant not in any membership')) s(shape)
LEFT JOIN (SELECT shape, count(*) n FROM s309_result GROUP BY shape) c USING (shape)
ORDER BY 1;

\echo '=== EXACTLY ONE list_tenant_members signature must exist (PGRST203 guard) ==='
SELECT pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef, p.proconfig,
       coalesce(array_to_string(p.proacl, ' | '), '(default: PUBLIC EXECUTE)') AS acl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'list_tenant_members';

ROLLBACK;
