-- ROLLBACK for S273 part 1 (supabase/migrations/20260617120000_s273_drop_user_roles_has_role.sql).
--
-- Recreates the legacy structure (table + RLS policy + has_role()). Row DATA is NOT
-- restored — the table was dropped. This only matters if a legacy code path that reads
-- user_roles is redeployed; the SSOT (tenant_users) is unaffected by either direction.

begin;

create table if not exists public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  role text not null,
  created_at timestamptz default now()
);

alter table public.user_roles enable row level security;

drop policy if exists "tenant_access_user_roles" on public.user_roles;
create policy "tenant_access_user_roles" on public.user_roles for all using (auth.uid() = user_id);

create or replace function public.has_role(required_role text)
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
end;
$$;

commit;

notify pgrst, 'reload schema';
