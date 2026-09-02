-- S320 — storage.objects RLS: remove a published credential, and stop reading profiles.
--
-- DO NOT APPLY FROM THE REPO. Claude.ai applies this after merge, then re-reads
-- pg_policy and re-tests an upload as a no-profiles-row admin. A migration file
-- containing the right SQL and a database carrying the right policy are DIFFERENT
-- CLAIMS — S319 shipped three broken functions past a green test that asserted
-- against source text instead of the artifact. Verify against pg_policy.
--
-- ── FINDING 1 — a published credential was hardcoded into three policies ────────
-- logos_{insert,update,delete}_tenant_or_operator each carried
--     OR auth.uid() = '5181b30a-265f-4a70-a323-bf6e3c53641b'::uuid
-- That UUID is admin@pestflowpro.com, whose password is published on the marketing
-- homepage. S308 deleted its operators row as a security fix and missed these, so it
-- retained INSERT/UPDATE/DELETE on EVERY tenant's logo, Dang's included.
-- Replaced with public.is_operator(), the SECURITY DEFINER helper S308 built for this.
--
-- THIS IS A NARROWING, NOT A SUBSTITUTION IN KIND. Do not read it as indirection over
-- the same principal — the principal CHANGES, and that is the point:
--
--   before:  admin@pestflowpro.com    a shared account whose password is published on
--                                     the marketing homepage. INSERT/UPDATE/DELETE on
--                                     EVERY tenant's logo. Revocable only by editing
--                                     three policy expressions.
--   after:   scott@homeflowpro.ai     via is_operator(). The same reach, but a single
--                                     NAMED identity, and revocable by deleting one row
--                                     from public.operators.
--
-- So one account LOSES cross-tenant logo write (the fix) and a different account GAINS
-- it (intended, and stated rather than smuggled in). operators holds exactly one row as
-- of 2026-09-02: scott@homeflowpro.ai, the platform owner and sole operator.
--
-- This is what S308 built the operators table for. The failure it is fixing is that a
-- policy carrying a literal cannot be revoked by removing an operator — which is exactly
-- what S308 tried to do and did not achieve.
--
-- ── FINDING 2 — the tenant predicate read profiles ──────────────────────────────
-- current_tenant_id() is `select tenant_id from profiles where id = auth.uid()`.
-- Accounts provisioned without a profiles row (S273/S308 retired that dependency)
-- get NULL, so `(storage.foldername(name))[1] = current_tenant_id()::text` is NULL,
-- the policy fails closed, and the upload is refused. Reproduced live 2026-09-02:
-- precisionlawnsystems@yahoo.com and scott@homeflowpro.ai both have NO profiles row
-- and cannot upload to their own tenants.
--
-- THE MIGRATION WAS STARTED AND NOT FINISHED. reports_admin_read on this same table
-- ALREADY uses the tenant_users shape below. Both patterns sit side by side today;
-- this finishes the job.
--
-- ── THREE TIERS, stated rather than assumed ────────────────────────────────────
-- CREATE/UPDATE  role IN ('admin', 'manager')
-- DELETE         role = 'admin'   (plus is_operator() on logos)
-- SELECT         any membership
--
-- INSERT/UPDATE are NOT admin-only. tenant_users_role_check admits 'admin', 'manager'
-- and 'user', and this project's content-table policies already let a manager write.
-- Admin-only there would mean a manager can edit a page's content row but cannot upload
-- that page's image — denied with the same opaque "violates row-level security policy"
-- this migration exists to remove. There are zero manager rows today, which is exactly
-- why admin-only would have shipped silently and surfaced on the first manager created.
--
-- DELETE IS SPLIT OUT AND IS ADMIN-ONLY. See the gate arbitration below — this is the
-- one point the two validators disagreed on, and the tighter grant was taken.
-- Storage DELETE is destructive and unversioned: a deleted object is gone, and any
-- public page still referencing it breaks. There is no undo here and no soft delete.
--
-- SELECT takes any membership: a member who can see the admin UI needs to see the
-- images in it.
--
-- READ POLICIES ON THESE BUCKETS ARE NOT A CONFIDENTIALITY CONTROL. Verified 2026-09-02:
-- logos, tenant-assets, social-uploads and videos are all `public = true` in
-- storage.buckets; only `reports` is private. Supabase serves a public bucket over
-- /object/public/... WITHOUT evaluating RLS, so anyone holding a URL reads the object
-- whatever these policies say. What they gate is the authenticated /object/ path and
-- list operations.
--
-- That is why "any membership" is right, and it is NOT a security judgement: narrowing
-- reads would buy nothing against a public URL while breaking listing in the admin UI.
-- Anyone reading this later must not mistake these SELECT policies for privacy.
--
-- Effective-grant delta, computed against live data 2026-09-02 (not estimated):
--   admin@dangpestcontrol.com      dang                  -> dang                  (same)
--   admin@ironwoodopsgrp.com       pls                   -> pls                   (same)
--   admin@pestflowpro.com          pestflow-pro          -> pestflow-pro          (same)
--   precisionlawnsystems@yahoo.com (none)                -> pls                   (THE FIX)
--   scott@homeflowpro.ai           (none)                -> pestflow-pro,vita-glow(THE FIX)
--   admin@demo.com                 pestflow-pro          -> 5 demo tenants        (CHANGES BOTH WAYS)
--   scottdevore2@gmail.com         (none)                -> (none) for writes,
--                                                           dang for reads
--
-- TWO deltas are NOT pure fixes and are called out for the reviewer:
--   * admin@demo.com LOSES pestflow-pro. It holds that only through profiles and is
--     not a tenant_users member of it. admin@pestflowpro.com is the member and keeps
--     it. If the demo login is used to manage the master tenant's assets, this is the
--     line that stops it.
--   * admin@demo.com GAINS the five demo tenants it is actually a member of.
--
-- OPERATORS ARE NOT GRANTED tenant-assets/social-uploads/videos here. is_operator()
-- is added to the logos bucket only, because that is the single bucket where a
-- hardcoded operator grant already existed and is being REPLACED (see the narrowing
-- above — the principal changes, so this is not a substitution in kind). Widening
-- operator reach to the other buckets would be a privilege EXPANSION beyond this fix;
-- if support needs it, that is its own decision. Consequence: scott@homeflowpro.ai
-- cannot upload to pls assets — admin@ironwoodopsgrp.com is the pls admin and can.

-- ── WHY THE INLINE EXISTS AND NOT is_tenant_member() ───────────────────────────
-- An earlier draft of this PR claimed the SECURITY DEFINER helper was "strictly more
-- robust". THAT WAS WRONG, and the inversion is the least obvious thing here.
--
-- is_tenant_member(p_tenant_id uuid) takes a uuid, so calling it requires
--     (storage.foldername(name))[1]::uuid
-- and that cast is applied to an OBJECT KEY — untrusted input. A key whose first path
-- segment is not a valid uuid makes the cast RAISE `invalid input syntax for type uuid`.
-- An RLS predicate that raises does not deny the row; it ERRORS the statement. On a
-- SELECT scanning the bucket, one malformed key takes out the whole query.
--
-- The inline form compares the other direction — tu.tenant_id::text = <text> — casting
-- uuid TO text, never text to uuid. It cannot raise. A malformed key simply fails to
-- match and the row is denied, which is the correct direction.
--
-- The helper's real advantage stands and is secondary: as SECURITY DEFINER it is immune
-- to tenant_users' own grants and RLS, where the inline form inherits both. If
-- `authenticated` ever loses SELECT on tenant_users, or that table's policy narrows,
-- every policy here fails CLOSED — a denial, not an error, so still the safe direction.
-- Having both properties would need a TEXT-taking definer helper. That is a follow-up,
-- not a blocker, and is deliberately not invented here.

-- ══ GATE ROUND 1 — both verdicts APPROVE WITH CONDITIONS ══════════════════════
-- Full texts recorded byte-exact in REVIEW_S320_STORAGE_RLS.md, Appendices A and B.
--
-- THE MODELS DISAGREED ON ONE POINT, and it is recorded rather than smoothed over
-- because both readings are defensible and the split is a judgement call, not one
-- model being wrong:
--
--   Gemini      BLOCKING. Split DELETE to admin-only. Storage DELETE is destructive
--               and unversioned; letting a manager purge assets risks unrecoverable
--               loss and broken public page links.
--   Perplexity  Explicitly do NOT split. An authorization model where a manager may
--               edit a page but not remove its image is internally inconsistent, and
--               that inconsistency is itself the hazard. If recoverability is the
--               concern, buy it with versioning, soft-delete or an audit trail —
--               not by making the privilege boundary incoherent.
--
--   ARBITRATION — CONSERVATIVE WINS. Gemini taken. DELETE is admin-only; INSERT and
--   UPDATE keep IN ('admin', 'manager'). Perplexity's reasoning is sound and its
--   remedy (versioning/audit) is the better long-run answer, but it is not built and
--   this migration is not the place to build it. The practical cost of the tighter
--   grant is ZERO TODAY — there are no manager rows — so the conservative choice is
--   free right now and can be revisited with Perplexity's remedy in hand.
--
-- PERPLEXITY'S BLOCKING CONDITION ON operators WAS VERIFIED LIVE AND IS A REAL GAP.
-- It asked whether any application principal can self-enroll into public.operators,
-- since after this migration an operator row is cross-tenant write on every tenant's
-- logo. Read from the catalog 2026-09-02:
--
--     public.operators   relacl: authenticated=arwdDxtm/postgres   <- INCLUDES INSERT
--     RLS enabled: TRUE.   Policies: NONE.
--
-- Nothing is exploitable today: RLS on with zero policies denies everything. But the
-- table is protected BY ACCIDENT — by the absence of a policy — not by design. One
-- permissive policy added later for any reason and any authenticated user could insert
-- themselves into operators and take cross-tenant write and DELETE on every logo.
-- That is a latent privilege-escalation path sitting one migration away, and the ACL
-- is the thing that should have been holding it shut.
--
-- FIXED BELOW: the write verbs are revoked from authenticated and anon. SELECT is
-- deliberately KEPT — is_operator() is SECURITY DEFINER and does not need caller
-- SELECT, so revoking it would be a separate decision, and S308's B2 finding is that
-- casually revoking from authenticated is how policies get broken. Write verbs only.
--
-- ALREADY SATISFIED — verified against the catalog, changed nothing:
--   is_operator()        prosecdef=true, search_path='', owner=postgres, EXECUTE to
--                        authenticated. Covers Perplexity's is_operator hardening
--                        blocker and Gemini (e).
--   tenant_users         authenticated holds SELECT. Covers Gemini's non-blocking
--                        grant condition — but the GRANT is written explicitly below
--                        anyway, so a fresh database REPRODUCES it instead of relying
--                        on a Supabase default. Same reasoning as the S309
--                        get_my_tenant_role grant.
--   storage.foldername   default PUBLIC EXECUTE. Covers Gemini (e) item 2.
--
-- NOT DONE HERE, recorded as ROADMAP items — all three are real, none belongs in an
-- RLS migration: canonical object-key validation on the client, audit logging of
-- operator-bypass writes, and reassessing whether tenant-assets and videos should be
-- private buckets at all.

BEGIN;

-- ── PREREQUISITE GRANTS ────────────────────────────────────────────────────────
-- Written explicitly so a fresh database reproduces the state these policies need,
-- rather than inheriting it from a Supabase default that could change.

-- The inline EXISTS below reads tenant_users AS THE QUERYING ROLE, so authenticated
-- must hold SELECT on it. Already true in production; asserted here so it survives a
-- rebuild. If this is ever revoked, every policy in this file fails CLOSED with
-- `permission denied for table tenant_users` — a denial, not a data leak, but it
-- reproduces exactly the outage this migration exists to end.
GRANT SELECT ON public.tenant_users TO authenticated;

-- public.operators is a PLATFORM-ADMINISTRATION BOUNDARY. After this migration, one
-- row in it means cross-tenant INSERT/UPDATE/DELETE on every tenant's logo.
--
-- Its ACL granted authenticated the full arwdDxtm set — INSERT included. It was not
-- exploitable, because RLS is enabled with zero policies and that denies everything.
-- But that is protection by ABSENCE: add one permissive policy later, for any reason,
-- and self-enrollment as an operator becomes available to every logged-in user.
-- Raised as a BLOCKING condition by the round-1 gate; the ACL is closed here so the
-- table is protected by design and not by an accident nobody documented.
--
-- SELECT is intentionally NOT revoked: is_operator() is SECURITY DEFINER and does not
-- need caller SELECT, so removing it is a separate decision with its own blast radius
-- (S308 B2 — a role that cannot evaluate a predicate makes every policy fail closed).
--
-- THE FULL ACL, read live 2026-09-02 rather than summarised:
--     postgres=arwdDxtm/postgres
--     anon=rtm/postgres
--     authenticated=arwdDxtm/postgres      <- a = INSERT, w = UPDATE, d = DELETE
--     service_role=arwdDxtm/postgres
--
-- So the gap is on `authenticated` alone. `anon` holds only r/t/m and never had a write
-- verb — the second REVOKE below is a deliberate no-op, kept so a future GRANT to anon
-- has to survive a line that visibly says otherwise. Do not read it as anon having had
-- write access; it did not.
--
-- RESIDUAL, REPORTED NOT FIXED: authenticated keeps `t` (TRIGGER) and `m` (MAINTAIN),
-- because the round-1 condition named the write verbs and widening the revoke past what
-- was reviewed is how a fix acquires an unreviewed blast radius. TRIGGER is the one that
-- is not merely housekeeping — it permits attaching a trigger to this table, which needs
-- a trigger function and CREATE on the schema to be useful, so it is not reachable on
-- its own. Worth closing in its own change; noted in ROADMAP.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.operators FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.operators FROM anon;

-- ── logos ──────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS logos_insert_tenant_or_operator ON storage.objects;
CREATE POLICY logos_insert_tenant_or_operator ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role IN ('admin', 'manager')
      )
      OR public.is_operator()
    )
  );

DROP POLICY IF EXISTS logos_update_tenant_or_operator ON storage.objects;
CREATE POLICY logos_update_tenant_or_operator ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role IN ('admin', 'manager')
      )
      OR public.is_operator()
    )
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role IN ('admin', 'manager')
      )
      OR public.is_operator()
    )
  );

DROP POLICY IF EXISTS logos_delete_tenant_or_operator ON storage.objects;
-- DELETE is ADMIN-ONLY (gate arbitration, Gemini BLOCKING). is_operator() is retained:
-- the operator branch is the platform-owner path this migration exists to make revocable.
CREATE POLICY logos_delete_tenant_or_operator ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id::text = (storage.foldername(name))[1]
          AND tu.user_id = auth.uid()
          AND tu.role = 'admin'
      )
      OR public.is_operator()
    )
  );

-- ── tenant-assets ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_assets ON storage.objects;
CREATE POLICY tenant_upload_assets ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS tenant_update_assets ON storage.objects;
CREATE POLICY tenant_update_assets ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS tenant_delete_assets ON storage.objects;
-- DELETE is ADMIN-ONLY (gate arbitration, Gemini BLOCKING).
CREATE POLICY tenant_delete_assets ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

-- READ: any membership, per the write/read split documented above.
DROP POLICY IF EXISTS tenant_read_assets ON storage.objects;
CREATE POLICY tenant_read_assets ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'tenant-assets'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
    )
  );

-- ── social-uploads ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_social ON storage.objects;
CREATE POLICY tenant_upload_social ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'social-uploads'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS social_uploads_tenant_delete ON storage.objects;
-- DELETE is ADMIN-ONLY (gate arbitration, Gemini BLOCKING).
CREATE POLICY social_uploads_tenant_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'social-uploads'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role = 'admin'
    )
  );

DROP POLICY IF EXISTS tenant_read_social ON storage.objects;
CREATE POLICY tenant_read_social ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'social-uploads'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
    )
  );

-- ── videos ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_upload_videos ON storage.objects;
CREATE POLICY tenant_upload_videos ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
        AND tu.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS tenant_read_videos ON storage.objects;
CREATE POLICY tenant_read_videos ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id::text = (storage.foldername(name))[1]
        AND tu.user_id = auth.uid()
    )
  );

COMMIT;

-- NOT TOUCHED, deliberately:
--   authenticated_read_logos  — bucket_id = 'logos' for any authenticated user.
--     CONSIDERED FOR REMOVAL AND DELIBERATELY KEPT. It is the ONLY SELECT policy on the
--     logos bucket, so deleting it leaves logos with no authenticated read path at all
--     and breaks listing in the admin UI. The public object URL would still work (public
--     bucket), which is exactly what would make the breakage confusing to diagnose.
--     Removing it safely means REPLACING it with a tenant-scoped read — a scope
--     expansion beyond this migration, and its own decision. Recorded, not done.
--   reports_admin_read        — already the target shape. Left byte-identical so the
--     diff shows only what changed.
