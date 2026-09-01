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

-- ── 2. Replace the zero-arg identity with a required-parameter one ───────────────
-- DROP and CREATE must be in ONE transaction. apply_migration wraps this file in a
-- transaction, so there is no window where neither function exists.
DROP FUNCTION IF EXISTS public.list_tenant_members();

CREATE FUNCTION public.list_tenant_members(p_tenant_id uuid)
RETURNS TABLE(user_id uuid, email text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
begin
  -- A required parameter can still arrive NULL over PostgREST; fail closed rather
  -- than fall back to anything.
  if p_tenant_id is null then
    return;
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
      where tu.tenant_id = p_tenant_id;
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
