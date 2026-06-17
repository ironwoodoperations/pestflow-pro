-- S273 — Role-store SSOT reconciliation (part 1 of 2): drop the DEAD legacy role store.
--
-- PR #1 investigation finding: has_role() has ZERO callers — it is not referenced by
-- any application code and not used in any RLS policy (grepped across all .sql + src).
-- user_roles is write-only (provision-tenant + two dev scripts, all stripped in this
-- PR). tenant_users.role is the single source of truth.
--
-- NOT ordering-sensitive: nothing reads these objects, so dropping them is safe at any
-- point relative to the code deploy. (The profiles.role drop in part 2 IS ordering-
-- sensitive and must run only AFTER the reroute code is live — see that migration.)
--
-- Rollback: docs/migrations/s273-drop-user-roles-has-role-rollback.sql

begin;

-- Self-select policy on user_roles (CASCADE on the table drop would also remove it;
-- dropped explicitly for clarity).
drop policy if exists "tenant_access_user_roles" on public.user_roles;

-- has_role() reads user_roles — drop the function before the table.
drop function if exists public.has_role(text);

drop table if exists public.user_roles;

commit;

-- Reload PostgREST's schema cache so the dropped objects disappear from the API.
notify pgrst, 'reload schema';
