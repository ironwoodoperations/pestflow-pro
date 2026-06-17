-- Focused fixture schema for the S273 cross-tenant isolation test.
--
-- WHY a fixture instead of the real migration history: the repo's migration set is
-- NOT replayable from zero — e.g. 20260405_fix_rls_policies.sql references
-- public.stripe_payments, which no earlier migration creates (the table exists only
-- on the live remote). A from-scratch `supabase start` therefore dies on the second
-- migration. The isolation test exercises requireTenantUser, which reads ONLY
-- tenant_users, so CI swaps the migration set for this minimal schema and runs the
-- test against a real Postgres + real GoTrue (real JWTs) — full authenticated
-- context, just a focused schema. (Replayable full-history migrations are a separate,
-- pre-existing cleanup, out of scope for this PR.)

create extension if not exists "uuid-ossp";

create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique,
  subdomain text unique,
  entitlement smallint not null default 1,
  created_at timestamptz default now()
);

-- Mirrors the production tenant_users contract used by requireTenantUser:
-- UNIQUE(tenant_id, user_id), role NOT NULL, FK to auth.users + tenants.
create table public.tenant_users (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz default now(),
  unique (tenant_id, user_id)
);
