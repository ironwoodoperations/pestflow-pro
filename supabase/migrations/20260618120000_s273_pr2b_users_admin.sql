-- S273 PR #2b — Users tab support: member-list RPC + last-admin lockout guard.
--
-- Two objects, both validator-mandated (see docs/specs/S273_pr2b_invite_reset_setpassword.md):
--   1. list_tenant_members()  — SECURITY DEFINER read for the admin Users tab. tenant_users
--      SELECT RLS is self-row-only (the PR #2a recursion guard), so an admin cannot list other
--      members via a direct query. This definer fn returns the roster WITHOUT relaxing RLS or
--      adding a tenant_users SELECT policy (which would risk the recursion #2a deliberately avoided).
--      Takes NO caller-supplied tenant arg — derives the tenant internally from the caller
--      (current_tenant_id), strict `= 'admin'` gate (NULL role fails closed), returns only the
--      three fields the tab needs (no auth metadata / recovery / audit columns).
--   2. tenant_users_block_last_admin — BEFORE UPDATE OR DELETE trigger that prevents demoting or
--      removing a tenant's LAST admin (incl. self), which would zero out admins → unrecoverable.
--      Fires on every path; the invite edge fn's service-role upsert bypasses RLS but NOT triggers.

-- ── 1. list_tenant_members(): admin-only roster, tenant derived server-side ──
create or replace function public.list_tenant_members()
returns table (user_id uuid, email text, role text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();          -- server-derived; never from the client
  if v_tenant is null then
    return;                                          -- no binding → no rows
  end if;
  if public.get_my_tenant_role(v_tenant) = 'admin' then   -- strict; NULL → false → fail closed
    return query
      select tu.user_id, u.email::text, tu.role
      from public.tenant_users tu
      join auth.users u on u.id = tu.user_id
      where tu.tenant_id = v_tenant;
  end if;
  return;                                            -- non-admin / NULL role → zero rows
end;
$$;

revoke all on function public.list_tenant_members() from public, anon;
grant execute on function public.list_tenant_members() to authenticated, service_role;

-- ── 2. Last-admin lockout guard ──
create or replace function public.tenant_users_block_last_admin()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (TG_OP = 'UPDATE' and OLD.role = 'admin' and NEW.role <> 'admin')
     or (TG_OP = 'DELETE' and OLD.role = 'admin') then
    if (select count(*) from public.tenant_users
        where tenant_id = OLD.tenant_id
          and role = 'admin'
          and user_id <> OLD.user_id) = 0 then
      raise exception 'Cannot demote or remove the last admin of tenant %', OLD.tenant_id
        using errcode = 'check_violation';
    end if;
  end if;
  return case when TG_OP = 'DELETE' then OLD else NEW end;
end;
$$;

drop trigger if exists trg_tenant_users_block_last_admin on public.tenant_users;
create trigger trg_tenant_users_block_last_admin
  before update or delete on public.tenant_users
  for each row execute function public.tenant_users_block_last_admin();
