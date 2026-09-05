-- S343 ITEM 4 — admin_delete_tenant has NEVER been able to delete a tenant.
--
-- ⚠️  NOT APPLIED BY THE PR THAT ADDS THIS FILE. CC Web does not apply
-- migrations. Claude.ai applies it and then PROVES it by actually deleting a
-- tenant: provision a throwaway, delete it, and confirm zero rows remain across
-- all eleven tables. A deletion fix that has not deleted anything is not tested.
--
-- ═══ THE DEFECT, reproduced live on 2026-09-04 ═══
--
--   23514: Cannot demote or remove the last admin of tenant <uuid>
--   CONTEXT: PL/pgSQL function tenant_users_block_last_admin() line 9
--   SQL statement "DELETE FROM ONLY public.tenant_users WHERE $1 = tenant_id"
--   SQL statement "DELETE FROM public.tenants WHERE id = p_tenant_id"
--
-- admin_delete_tenant deletes the tenants row, which cascades to tenant_users,
-- and this trigger refuses to remove the last admin. EVERY tenant has a last
-- admin, so the sanctioned deletion path could not delete anything, ever. That
-- is why the deleted CityShield tenant left 17 orphan page_content rows, and why
-- cleaning up a throwaway tenant required disabling the trigger by hand.
--
-- ═══ WHY THIS FIXES THE TRIGGER AND NOT THE FUNCTION ═══
--
-- The brief preferred the narrower option: have admin_delete_tenant delete
-- tenant_users explicitly, before the tenants row, "in an order the trigger
-- permits". READING THE TRIGGER SHOWS THERE IS NO SUCH ORDER. It counts OTHER
-- admins of the same tenant excluding the row being removed:
--
--   if (select count(*) from public.tenant_users
--       where tenant_id = OLD.tenant_id and role = 'admin'
--         and user_id <> OLD.user_id) = 0 then raise ...
--
-- Whichever admin row goes last has zero others by construction, and the common
-- case is a single admin that raises on the first delete. Demoting first is
-- blocked by the same trigger. So the function cannot be fixed alone.
--
-- ═══ WHY THE PARENT-EXISTENCE TEST IS THE RIGHT SIGNAL ═══
--
-- Verified empirically rather than assumed, on temporary tables inside a rolled
-- back transaction: when ON DELETE CASCADE fires a child row trigger, THE PARENT
-- ROW IS ALREADY GONE from the trigger's snapshot. RI cascade actions run as
-- AFTER triggers on the parent, after its delete is complete.
--
-- So "the tenant no longer exists" cleanly identifies a cascade from tenant
-- deletion, and it is exactly the case where the protection is meaningless:
-- there is no tenant left to be the last admin OF. It cannot be spoofed by a
-- caller, needs no flag, no session variable and no trigger disabling.
--
-- WHAT STAYS PROTECTED, which is the whole point of touching this carefully:
-- while the tenant EXISTS, demoting or removing its last admin still raises,
-- for every writer and every path. Only the tenant-is-gone case relaxes.
--
-- The body below is the live function verbatim (read with pg_get_functiondef)
-- plus the one new guard, so the diff is reviewable as a diff.

create or replace function public.tenant_users_block_last_admin()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  -- S343 — the tenant itself is being deleted; this DELETE is the FK cascade,
  -- not a demotion. Nothing is left to protect, and blocking it made
  -- admin_delete_tenant impossible. Verified: the parent row is already gone
  -- from the snapshot by the time a cascade fires this trigger.
  if TG_OP = 'DELETE'
     and not exists (select 1 from public.tenants t where t.id = OLD.tenant_id) then
    return OLD;
  end if;

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
$function$;
