-- ROLLBACK for S273 PR #2a (supabase/migrations/20260618000000_s273_pr2a_permission_foundation.sql)
--
-- Restores the pre-#2a content-table RLS (single FOR ALL tenant_isolation_* policies,
-- faqs_auth_all, image_library tenant insert/update) and drops the #2a objects.
-- ironwood_admin_*_write / anon read / image_library_tenant_select were never touched.
-- NOTE: re-introduces the User-DELETE hole the split closed — rollback only if the
-- split shape itself must be reverted.

-- 4a. Restore the 7 uniform FOR-ALL policies; drop the split set.
do $$
declare t text;
begin
  foreach t in array array[
    'blog_posts','social_posts','seo_meta','page_content',
    'testimonials','service_areas','team_members'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t||'_select_members', t);
    execute format('drop policy if exists %I on public.%I', t||'_insert_staff', t);
    execute format('drop policy if exists %I on public.%I', t||'_update_staff', t);
    execute format('drop policy if exists %I on public.%I', t||'_delete_staff', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using (tenant_id = public.current_tenant_id()) '
      || 'with check (tenant_id = public.current_tenant_id())',
      'tenant_isolation_'||t, t);
  end loop;
end $$;

-- 4b. faqs
drop policy if exists faqs_select_members on public.faqs;
drop policy if exists faqs_insert_staff on public.faqs;
drop policy if exists faqs_update_staff on public.faqs;
drop policy if exists faqs_delete_staff on public.faqs;
create policy faqs_auth_all on public.faqs
  for all to authenticated
  using (tenant_id in (select p.tenant_id from public.profiles p where p.id = auth.uid()));

-- 4c. image_library
drop policy if exists image_library_tenant_insert on public.image_library;
drop policy if exists image_library_tenant_update on public.image_library;
create policy image_library_tenant_insert on public.image_library
  for insert to authenticated
  with check (current_tenant_id() is not null and tenant_id = current_tenant_id());
create policy image_library_tenant_update on public.image_library
  for update to authenticated
  using (current_tenant_id() is not null and tenant_id = current_tenant_id())
  with check (current_tenant_id() is not null and tenant_id = current_tenant_id());

-- 4d. Restore TRUNCATE to authenticated (pre-#2a grant-all state).
grant truncate on
  public.blog_posts, public.social_posts, public.seo_meta, public.page_content,
  public.faqs, public.service_areas, public.testimonials, public.image_library,
  public.team_members
to authenticated;

-- 5/3/2/1. Drop the #2a objects.
drop view if exists public.tenant_role_binding_drift;
drop index if exists public.tenant_users_user_id_tenant_id_idx;
alter table public.tenant_users drop constraint if exists tenant_users_role_check;
alter table public.tenant_users alter column role set default 'admin';
drop function if exists public.get_my_tenant_role(uuid);

notify pgrst, 'reload schema';
