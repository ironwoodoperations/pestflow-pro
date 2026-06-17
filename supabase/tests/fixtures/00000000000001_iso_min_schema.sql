-- Focused fixture schema for the S273 CI auth/permission tests.
--
-- WHY a fixture instead of the real migration history: the repo's migration set is
-- NOT replayable from zero (e.g. 20260405_fix_rls_policies.sql references
-- public.stripe_payments, never created by an earlier migration — live-only). A
-- from-scratch `supabase start` dies on it. So CI swaps the migration set for this
-- focused schema, then applies the REAL PR #2a migration on top, and runs:
--   - the Deno cross-tenant isolation test (requireTenantUser, real GoTrue JWTs), and
--   - the pgTAP role-RLS test (user cannot write content, manager/admin can).
--
-- The auth.users FK on tenant_users is intentionally omitted here so pgTAP can seed
-- synthetic auth uids; the Deno test inserts real GoTrue users and is unaffected.

create extension if not exists "uuid-ossp";

create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique,
  subdomain text unique,
  entitlement smallint not null default 1,
  created_at timestamptz default now()
);

-- Mirrors the production tenant_users contract: UNIQUE(tenant_id, user_id), role
-- NOT NULL. (PR #2a's migration adds the CHECK + drops the default on top of this.)
create table public.tenant_users (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  created_at timestamptz default now(),
  unique (tenant_id, user_id)
);

-- profiles: tenant binding read by current_tenant_id() (role column intentionally
-- absent — dropped in S273 PR #1).
create table public.profiles (
  id uuid primary key,
  tenant_id uuid,
  full_name text,
  created_at timestamptz default now()
);

-- Helpers the live DB already has (PR #1 + S62). Mirrored so the real PR #2a
-- migration (which references them) applies and pgTAP exercises the real predicates.
create or replace function public.current_tenant_id()
returns uuid language sql security definer stable
set search_path = public, pg_temp
as $$ select tenant_id from public.profiles where id = auth.uid() $$;

create or replace function public.operator_tenant_id()
returns uuid language sql security definer stable
set search_path = public, pg_temp
as $$ select id from public.tenants where slug = 'pestflow-pro' $$;

-- The 9 content surfaces PR #2a re-gates. Minimal shape (id, tenant_id, note) with
-- RLS enabled so the migration's policies actually enforce under pgTAP.
do $$
declare t text;
begin
  foreach t in array array[
    'blog_posts','social_posts','seo_meta','page_content','testimonials',
    'service_areas','team_members','image_library','faqs'
  ]
  loop
    execute format(
      'create table public.%I (id uuid primary key default uuid_generate_v4(), tenant_id uuid not null, note text)', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant all on public.%I to anon, authenticated, service_role', t);
  end loop;
end $$;

-- image_library starts with the live split shape PR #2a edits: tenant-scoped
-- insert/select/update, NO delete policy.
create policy image_library_tenant_insert on public.image_library
  for insert to authenticated
  with check (current_tenant_id() is not null and tenant_id = current_tenant_id());
create policy image_library_tenant_select on public.image_library
  for select to authenticated
  using (current_tenant_id() is not null and tenant_id = current_tenant_id());
create policy image_library_tenant_update on public.image_library
  for update to authenticated
  using (current_tenant_id() is not null and tenant_id = current_tenant_id())
  with check (current_tenant_id() is not null and tenant_id = current_tenant_id());

-- The other 8 start with the live FOR-ALL tenant_isolation_<t> / faqs_auth_all
-- policies PR #2a replaces.
do $$
declare t text;
begin
  foreach t in array array[
    'blog_posts','social_posts','seo_meta','page_content',
    'testimonials','service_areas','team_members'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using (tenant_id = public.current_tenant_id()) '
      || 'with check (tenant_id = public.current_tenant_id())',
      'tenant_isolation_'||t, t);
  end loop;
end $$;

create policy faqs_auth_all on public.faqs
  for all to authenticated
  using (tenant_id in (select p.tenant_id from public.profiles p where p.id = auth.uid()));

grant all on public.tenants to anon, authenticated, service_role;
grant all on public.tenant_users to anon, authenticated, service_role;
grant all on public.profiles to anon, authenticated, service_role;
