-- ROLLBACK for S273 part 2 (supabase/migrations/20260617120100_s273_neutralize_profiles_role.sql).
--
-- Re-adds profiles.role (nullable). The original per-row values are NOT recoverable
-- from the column drop; this best-effort backfill copies role from tenant_users for
-- the matching (user_id, tenant_id) so a redeployed legacy code path (requireTenantUser
-- reading profiles.role) would see a sane value. Safe to run before re-deploying the
-- pre-S273 code, never after the column already exists with data.

begin;

alter table public.profiles add column if not exists role text;

update public.profiles p
set role = tu.role
from public.tenant_users tu
where tu.user_id = p.id
  and tu.tenant_id = p.tenant_id
  and p.role is null;

commit;

notify pgrst, 'reload schema';
