-- S273 PR #2a — Permission Foundation
--
-- get_my_tenant_role() helper + tenant_users hardening + composite index +
-- role-gated content-table write RLS (SPLIT per-command policies) + binding-drift
-- audit view.
--
-- RLS shape decision (validator-confirmed split over the FOR ALL doubled predicate):
-- a single FOR ALL policy gates DELETE only by USING, which has no role check — so a
-- 'user' could DELETE content rows. We therefore split each surface into:
--   SELECT  : tenant-scoped only            (any member views — User read-only)
--   INSERT  : tenant + role in (admin,mgr)  (WITH CHECK)
--   UPDATE  : tenant + role in (admin,mgr)  (USING + WITH CHECK)
--   DELETE  : tenant + role in (admin,mgr)  (USING)
--
-- PRESERVED untouched (verified live via pg_policies): ironwood_admin_*_write
-- (operator own-tenant), anon read policies, and image_library_tenant_select.
-- image_library keeps NO DELETE policy (nobody deletes). Sensitive tables
-- (leads, stripe_payments, ai_proxy_log, *_audit, *_queue, report_*) UNTOUCHED.
--
-- current_tenant_id() (reads profiles.tenant_id) is kept as the tenant binding per
-- the validator decision; this PR adds the ROLE gate on top via get_my_tenant_role().
--
-- ⚠️ VALIDATOR RE-CHECK REQUIRED before apply (split-policy structural RLS change) —
-- Perplexity + Gemini, conservative-wins. Claude.ai applies via MCP after review.
-- Rollback: docs/migrations/s273-pr2a-permission-foundation-rollback.sql

-- ── 1. get_my_tenant_role(): customer-tenant analog of operator_tenant_id() ──
create or replace function public.get_my_tenant_role(p_tenant_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.tenant_users
  where user_id = auth.uid() and tenant_id = p_tenant_id
$$;

revoke all on function public.get_my_tenant_role(uuid) from public, anon;
grant execute on function public.get_my_tenant_role(uuid) to authenticated, service_role;

-- ── 2. tenant_users hardening: drop the 'admin' default, constrain role set ──
alter table public.tenant_users alter column role drop default;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tenant_users'::regclass
      and conname = 'tenant_users_role_check'
  ) then
    alter table public.tenant_users
      add constraint tenant_users_role_check check (role in ('admin','manager','user'));
  end if;
end $$;

-- ── 3. Composite index for the membership lookup (get_my_tenant_role + guards) ──
create index if not exists tenant_users_user_id_tenant_id_idx
  on public.tenant_users (user_id, tenant_id);

-- ── 4a. The 7 uniform FOR-ALL tables: drop tenant_isolation_<t>, install split ──
do $$
declare t text;
begin
  foreach t in array array[
    'blog_posts','social_posts','seo_meta','page_content',
    'testimonials','service_areas','team_members'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'tenant_isolation_'||t, t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (tenant_id = public.current_tenant_id())',
      t||'_select_members', t);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check '
      || '(tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in (''admin'',''manager''))',
      t||'_insert_staff', t);

    execute format(
      'create policy %I on public.%I for update to authenticated using '
      || '(tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in (''admin'',''manager'')) '
      || 'with check (tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in (''admin'',''manager''))',
      t||'_update_staff', t);

    execute format(
      'create policy %I on public.%I for delete to authenticated using '
      || '(tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in (''admin'',''manager''))',
      t||'_delete_staff', t);
  end loop;
end $$;

-- ── 4b. faqs: drop faqs_auth_all (tenant-only, no WITH CHECK), install split ──
--        faqs_anon_read (public read) is preserved.
drop policy if exists faqs_auth_all on public.faqs;

create policy faqs_select_members on public.faqs
  for select to authenticated
  using (tenant_id = public.current_tenant_id());

create policy faqs_insert_staff on public.faqs
  for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in ('admin','manager'));

create policy faqs_update_staff on public.faqs
  for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in ('admin','manager'))
  with check (tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in ('admin','manager'));

create policy faqs_delete_staff on public.faqs
  for delete to authenticated
  using (tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in ('admin','manager'));

-- ── 4c. image_library: add the role gate to INSERT + UPDATE write paths.
--        image_library_tenant_select (tenant-scoped read) is PRESERVED — User views.
--        No DELETE policy is created (preserve the existing no-delete posture).
drop policy if exists image_library_tenant_insert on public.image_library;
drop policy if exists image_library_tenant_update on public.image_library;

create policy image_library_tenant_insert on public.image_library
  for insert to authenticated
  with check (tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in ('admin','manager'));

create policy image_library_tenant_update on public.image_library
  for update to authenticated
  using (tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in ('admin','manager'))
  with check (tenant_id = public.current_tenant_id() and public.get_my_tenant_role(tenant_id) in ('admin','manager'));

-- ── 5. Divergence guard (audit, NOT a hard FK; FK deferred to demo-deauth wave) ──
-- Lists profiles tenant-bindings with no matching tenant_users membership row.
-- Excludes the operator tenant so the shared-login admin@demo.com demo seed
-- (operator-tenant binding, no membership) does NOT trip it. Read-only; a pgTAP
-- assertion (CI) checks this set is empty. No runtime trigger on the provisioning
-- hot path.
create or replace view public.tenant_role_binding_drift as
  select p.id as user_id, p.tenant_id
  from public.profiles p
  where p.tenant_id is not null
    and p.tenant_id <> public.operator_tenant_id()
    and not exists (
      select 1 from public.tenant_users tu
      where tu.user_id = p.id and tu.tenant_id = p.tenant_id
    );

revoke all on public.tenant_role_binding_drift from public, anon, authenticated;
grant select on public.tenant_role_binding_drift to service_role;

notify pgrst, 'reload schema';
