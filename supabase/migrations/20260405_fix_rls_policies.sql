-- =========================================================
-- Fix RLS: tenant isolation via current_tenant_id() helper
-- =========================================================

-- Step 1: Helper function
create or replace function public.current_tenant_id()
returns uuid language sql security definer stable as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

-- =========================================================
-- Step 2: Tenant-scoped tables — drop broad policies, add isolated ones
-- =========================================================

-- page_content
drop policy if exists "tenant_access_page_content" on public.page_content;
create policy "tenant_isolation_page_content" on public.page_content
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- seo_meta
drop policy if exists "tenant_access_seo_meta" on public.seo_meta;
create policy "tenant_isolation_seo_meta" on public.seo_meta
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- blog_posts
drop policy if exists "tenant_access_blog_posts" on public.blog_posts;
create policy "tenant_isolation_blog_posts" on public.blog_posts
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- location_data
drop policy if exists "tenant_access_location_data" on public.location_data;
create policy "tenant_isolation_location_data" on public.location_data
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- testimonials
drop policy if exists "tenant_access_testimonials" on public.testimonials;
create policy "tenant_isolation_testimonials" on public.testimonials
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- leads
drop policy if exists "tenant_access_leads" on public.leads;
drop policy if exists "leads_policy" on public.leads;
create policy "tenant_isolation_leads" on public.leads
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- keyword_tracker
drop policy if exists "tenant_access_keyword_tracker" on public.keyword_tracker;
create policy "tenant_isolation_keyword_tracker" on public.keyword_tracker
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- keyword_placements
drop policy if exists "tenant_access_keyword_placements" on public.keyword_placements;
create policy "tenant_isolation_keyword_placements" on public.keyword_placements
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- page_snapshots
drop policy if exists "tenant_access_page_snapshots" on public.page_snapshots;
create policy "tenant_isolation_page_snapshots" on public.page_snapshots
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- social_posts
drop policy if exists "tenant_access_social_posts" on public.social_posts;
create policy "tenant_isolation_social_posts" on public.social_posts
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- =========================================================
-- Step 3: settings — anon public read + authenticated tenant write
-- =========================================================
drop policy if exists "anon_read_settings" on public.settings;
drop policy if exists "tenant_access_settings" on public.settings;
drop policy if exists "settings_policy" on public.settings;

create policy "anon_read_settings" on public.settings
  for select to anon using (true);

create policy "tenant_isolation_settings_auth" on public.settings
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- =========================================================
-- Step 4: tenants — anon public read + authenticated own row
-- =========================================================
drop policy if exists "anon_read_tenants" on public.tenants;
drop policy if exists "tenant_access_tenants" on public.tenants;
drop policy if exists "tenants_policy" on public.tenants;

create policy "anon_read_tenants" on public.tenants
  for select to anon using (true);

create policy "tenant_isolation_tenants_auth" on public.tenants
  for select to authenticated
  using (id = public.current_tenant_id());

-- =========================================================
-- Step 5: stripe_payments — authenticated tenant isolation
-- =========================================================
drop policy if exists "tenant_access_stripe_payments" on public.stripe_payments;
drop policy if exists "stripe_payments_policy" on public.stripe_payments;
create policy "tenant_isolation_stripe_payments" on public.stripe_payments
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- =========================================================
-- Step 6: Storage buckets — social-uploads and videos only
-- (logos bucket intentionally left alone — pre-auth wizard)
-- =========================================================

-- social-uploads
drop policy if exists "tenant_upload_social" on storage.objects;
drop policy if exists "tenant_read_social" on storage.objects;

create policy "tenant_upload_social" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'social-uploads' AND
    (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

create policy "tenant_read_social" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'social-uploads' AND
    (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

-- videos
drop policy if exists "tenant_upload_videos" on storage.objects;
drop policy if exists "tenant_read_videos" on storage.objects;

create policy "tenant_upload_videos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

create policy "tenant_read_videos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

-- Step 7: profiles and user_roles — already correct (auth.uid() scoped), not touched
