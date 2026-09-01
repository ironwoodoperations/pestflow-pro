-- S309 Wave 3 — the caller names the tenant; tenant_users still authorizes it.
--
-- WHY
-- `list_tenant_members()` and `invite-team-member` both derived the caller's acting
-- tenant from `profiles.tenant_id` — the table S273 retired as membership truth and
-- S308 replaced as the RLS membership source. Neither consumer moved. Live effect:
-- an admin with no `profiles` row cannot invite anyone and sees an empty team list.
-- `provision-tenant` writes a profiles row, so PROVISIONED admins work;
-- `invite-team-member` writes only `tenant_users`, so INVITED admins never get one
-- and cannot themselves invite.
--
-- `profiles.tenant_id` was never the authorization step. It supplied a CANDIDATE
-- tenant; `get_my_tenant_role(...) = 'admin'` against `tenant_users` is what
-- authorizes. This migration changes where the candidate comes from and leaves the
-- authorization test byte-unchanged.
--
-- VALIDATOR GATE (2026-09-01): Gemini and Perplexity BOTH returned REJECT on the
-- first submission. Conservative-wins. This migration is the re-scoped form that
-- satisfies their blocking conditions. Verdicts are recorded byte-exact in
-- REVIEW_S309_TENANT_SOURCE.md (Appendix A = Gemini, Appendix B = Perplexity).
--
-- WHAT CHANGED FROM THE REJECTED SPEC
--   * `p_tenant_id` is REQUIRED. No DEFAULT NULL, and no `current_tenant_id()` path
--     inside the function. Both verdicts rejected the fallback: one outright, the
--     other only behind telemetry, an owner, a dated removal migration and an alert
--     on legacy calls — machinery this project does not have.
--   * The zero-argument identity is DROPPED explicitly, in this same transaction.
--     `CREATE OR REPLACE FUNCTION` cannot change an argument list, so
--     `list_tenant_members(uuid)` is a NEW function; leaving `list_tenant_members()`
--     in place would give PostgREST two candidates — the PGRST203 ambiguity S274
--     already cost us once.
--   * `search_path = ''` with every object fully qualified, on BOTH helpers. This is
--     the one point where the two verdicts flatly contradicted each other: Gemini
--     called `pg_temp` in a SECURITY DEFINER path a critical anti-pattern, while
--     Perplexity said `pg_temp` placed LAST is exactly what PostgreSQL recommends
--     and faulted `current_tenant_id()` for omitting it. An empty search_path moots
--     the disagreement — there is no path to hijack and no ordering to argue about —
--     and it is already the in-repo precedent from S308's `is_operator()` and
--     `is_tenant_member()`.
--
-- DELIBERATELY NOT CHANGED
--   * EXECUTE grants on `get_my_tenant_role` are untouched. S308's B2 tested the
--     "revoke from authenticated" hardening and DISPROVED it: an RLS policy predicate
--     evaluates as the querying role, so revoking EXECUTE breaks every policy that
--     calls the function. `get_my_tenant_role` is used by S308b's settings policies.
--   * `current_tenant_id()` itself — ROADMAP #8, ~70 policies across ~25 tables.
--     Out of scope by standing instruction. It keeps its own definition and grants.

-- ── 1. get_my_tenant_role — body semantics unchanged, path hardened ──────────────
-- Same predicate, same STABLE/SECURITY DEFINER, same owner, same grants. Only the
-- search_path and the qualification of `tenant_users` change. Proven behaviour-neutral
-- by a 63-pair (7 users x 9 tenants) access matrix captured before and after.
CREATE OR REPLACE FUNCTION public.get_my_tenant_role(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
  SELECT tu.role
  FROM public.tenant_users AS tu
  WHERE tu.user_id = (SELECT auth.uid())
    AND tu.tenant_id = p_tenant_id;
$fn$;

-- GATE ROUND 2, BLOCKING 1 (both models). This REPRODUCES THE LIVE ACL; it is NOT new
-- hardening. Production today is already
--     {postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres}
-- with PUBLIC absent and `authenticated` holding an EXPLICIT grant, so the 42501 both
-- models predicted cannot occur here — CREATE OR REPLACE preserves an existing ACL.
-- It is added for a reason neither model could see: on a FRESH database this file runs
-- as a plain CREATE and would pick up the default PUBLIC EXECUTE. The migration must
-- rebuild production, not diverge from it.
--
-- READ THIS BEFORE COPYING THE PATTERN: revoking from PUBLIC is safe. Revoking from
-- `authenticated` is NOT, and S308's B2 proved it on this database — an RLS policy
-- predicate evaluates AS THE QUERYING ROLE, so a role without EXECUTE cannot evaluate
-- a policy that calls this helper, and every such policy fails closed. S308b's settings
-- policies call get_my_tenant_role. DO NOT GENERALISE THIS REVOKE.
REVOKE ALL ON FUNCTION public.get_my_tenant_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_role(uuid) TO authenticated, service_role;

-- ── 2. Replace the zero-arg identity with a required-parameter one ───────────────
-- DROP and CREATE must be in ONE transaction. apply_migration wraps this file in a
-- transaction, so there is no window where neither function exists.
--
-- GATE ROUND 2, BLOCKING 2 (Perplexity): prove nothing depends on the zero-arg identity
-- before dropping it. Verified live 2026-09-01 — ALL FIVE counts zero:
--     pg_depend (excluding internal/pin) ... 0
--     policies referencing ................. 0
--     other functions referencing .......... 0
--     views referencing .................... 0
--     triggers referencing ................. 0
-- and UsersSection.tsx is the only in-repo caller. NO CASCADE — a bare DROP is correct
-- precisely BECAUSE the dependency set is empty; CASCADE would silently destroy
-- whatever a future dependency turns out to be.
DROP FUNCTION IF EXISTS public.list_tenant_members();

CREATE FUNCTION public.list_tenant_members(p_tenant_id uuid)
RETURNS TABLE(user_id uuid, email text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
begin
  -- A required parameter can still arrive NULL over PostgREST. Both models agreed the
  -- NULL path must fail closed; they differed on HOW, and both forms are fail-closed,
  -- so this is a style choice rather than a conservative-wins conflict.
  --
  -- Taking Perplexity's RAISE over Gemini's empty return DELIBERATELY: an empty list is
  -- indistinguishable from "you are not an admin" and from "an old bundle called this
  -- without a tenant", and this project has repeatedly been burned by real faults that
  -- present as innocuous empty state — the S309 bug itself showed up as an empty Users
  -- tab. An error names the cause at the moment it happens. 22004 is
  -- null_value_not_allowed; PostgREST surfaces it as a 400, matching the edge
  -- function, which already 400s on exactly this condition.
  if p_tenant_id is null then
    raise exception 'tenant_id is required' using errcode = '22004';
  end if;

  -- THE authorization step, byte-unchanged from the pre-S309 body: strict equality,
  -- so a NULL role (no membership) is false and fails closed. Membership alone is
  -- NOT sufficient — a 'member'/'manager' gets zero rows. Gemini's verdict stated
  -- the opposite; the live body has always required admin.
  if public.get_my_tenant_role(p_tenant_id) = 'admin' then
    return query
      select tu.user_id, u.email::text, tu.role
      from public.tenant_users AS tu
      join auth.users AS u on u.id = tu.user_id
      where tu.tenant_id = p_tenant_id
      -- S311's lesson applied here: a query with no ORDER BY has no defined order, and
      -- an unspecified order is a defect waiting to be observed. user_id breaks the tie
      -- if two rows ever share an email, so the ordering is TOTAL.
      order by u.email, tu.user_id;
  end if;

  return;   -- non-admin / no membership → zero rows
end;
$fn$;

-- Explicit grants in the same transaction as the CREATE (PostgreSQL's documented
-- guidance for SECURITY DEFINER). PUBLIC gets EXECUTE on a new function by default;
-- revoke it, then grant only what actually calls this. `anon` is NOT granted — the
-- pre-S309 function did not grant it either, so this preserves that posture.
REVOKE ALL ON FUNCTION public.list_tenant_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_tenant_members(uuid) TO authenticated, service_role;

-- PostgREST caches the schema; a changed function signature is invisible until it
-- reloads, which would surface as "function not found" on a correct database.
NOTIFY pgrst, 'reload schema';
