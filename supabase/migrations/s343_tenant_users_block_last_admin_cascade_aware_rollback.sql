-- S343 ITEM 4 — ROLLBACK: restore the pre-S343 trigger body.
--
-- ⚠️  RESTORES A KNOWN-BROKEN STATE. With this in place admin_delete_tenant
-- CANNOT DELETE ANY TENANT — every tenant has a last admin, and the cascade from
-- `DELETE FROM tenants` trips the raise. Roll back only if the cascade-aware
-- guard is found to cause a worse problem, and expect tenant deletion to stop
-- working again the moment you do.
--
-- Verbatim the body read from pg_get_functiondef() before S343.

create or replace function public.tenant_users_block_last_admin()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
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
$function$;
