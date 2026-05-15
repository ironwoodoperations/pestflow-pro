-- S221: Durable provisioning + credentials-email status tracking.
-- Enables Ghost Success recovery: when client drops between provision succeeded
-- and credentials email send, dashboard reload reads this row and shows the
-- correct UI state (Resend Credentials button with accurate last_sent_at).

create table if not exists public.provisioning_status (
  id uuid primary key default gen_random_uuid(),
  correlation_id uuid not null,
  prospect_id uuid references public.prospects(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  operator_user_id uuid references auth.users(id) on delete set null,
  admin_email text not null,
  status text not null check (status in (
    'provision_requested',
    'provision_succeeded',
    'provision_failed',
    'credentials_send_requested',
    'credentials_send_succeeded',
    'credentials_send_failed',
    'credentials_resent'
  )),
  last_sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provisioning_status_correlation_id_idx
  on public.provisioning_status (correlation_id);

create index if not exists provisioning_status_tenant_id_idx
  on public.provisioning_status (tenant_id) where tenant_id is not null;

create index if not exists provisioning_status_prospect_id_idx
  on public.provisioning_status (prospect_id) where prospect_id is not null;

alter table public.provisioning_status enable row level security;

-- Master admins (Ironwood operators on the master tenant) can read all rows.
-- INSERT/UPDATE happen via service_role (bypasses RLS) from the edge functions.
create policy "master_admin_read_provisioning_status"
  on public.provisioning_status
  for select
  using (
    exists (
      select 1
      from public.profiles p
      join public.tenants t on t.id = p.tenant_id
      where p.id = auth.uid()
        and t.slug = 'pestflow-pro'
        and p.role = 'admin'
    )
  );

create or replace function public.update_provisioning_status_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger provisioning_status_updated_at
  before update on public.provisioning_status
  for each row execute function public.update_provisioning_status_updated_at();

comment on table public.provisioning_status is
  'S221: Tracks tenant provisioning + credentials email lifecycle. Enables Ghost Success recovery.';
