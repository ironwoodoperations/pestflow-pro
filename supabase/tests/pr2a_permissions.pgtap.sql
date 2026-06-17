-- S273 PR #2a — pgTAP role-RLS test.
--
-- Proves the split content-table policies enforce the permission matrix at the DB:
--   * a 'user'-role member CANNOT INSERT/UPDATE/DELETE content surfaces
--     (incl. the DELETE hole the split closed),
--   * 'manager' and 'admin' CAN,
--   * 'user' CAN still SELECT (read-only),
--   * the binding-drift view excludes the operator-tenant membership-less seed.
--
-- Runs against the CI fixture schema + the REAL PR #2a migration applied on top.
-- Identity is simulated via request.jwt.claims + SET ROLE authenticated, so RLS +
-- the SECURITY DEFINER helpers (current_tenant_id / get_my_tenant_role) execute in a
-- genuine authenticated context — not as the RLS-bypassing superuser (#1 false
-- positive guard).

begin;
create extension if not exists pgtap;

select plan(10);

-- ── Seed (as the superuser test role; RLS bypassed for setup) ──
insert into public.tenants (id, name, slug, subdomain, entitlement) values
  ('11111111-1111-1111-1111-111111111111', 'Customer Co', 'customer-co', 'customer-co', 2),
  ('92150000-0000-0000-0000-000000000001', 'Ironwood Operator', 'pestflow-pro', 'pestflow-pro', 4);

-- Three customer-tenant identities, one per role.
insert into public.profiles (id, tenant_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111');
insert into public.tenant_users (tenant_id, user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'manager'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'user');

-- Operator-tenant profile with NO membership row — the admin@demo.com demo-seed
-- analog. MUST be excluded from drift (operator-tenant exclusion).
insert into public.profiles (id, tenant_id) values
  ('dede0000-0000-0000-0000-00000000dead', '92150000-0000-0000-0000-000000000001');

-- A pre-existing content row for the user UPDATE/DELETE-denial checks.
insert into public.blog_posts (id, tenant_id, note) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'seed');

-- ── Helper: impersonate a uid as the authenticated role ──
-- (inline per-test below; reset between)

-- 1. user CANNOT INSERT blog_posts (WITH CHECK → 42501)
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.blog_posts (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'user role: INSERT blog_posts denied');
reset role; select set_config('request.jwt.claims', '', true);

-- 2. manager CAN INSERT blog_posts
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.blog_posts (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  'manager role: INSERT blog_posts allowed');
reset role; select set_config('request.jwt.claims', '', true);

-- 3. admin CAN INSERT blog_posts
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.blog_posts (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  'admin role: INSERT blog_posts allowed');
reset role; select set_config('request.jwt.claims', '', true);

-- 4. user DELETE is blocked — the seed row remains (the hole the split closed)
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}', true);
set local role authenticated;
delete from public.blog_posts where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
reset role; select set_config('request.jwt.claims', '', true);
select is(
  (select count(*) from public.blog_posts where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd')::int,
  1, 'user role: DELETE blog_posts blocked — row remains');

-- 5. user UPDATE is blocked — note unchanged
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}', true);
set local role authenticated;
update public.blog_posts set note = 'hacked' where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
reset role; select set_config('request.jwt.claims', '', true);
select is(
  (select note from public.blog_posts where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'seed', 'user role: UPDATE blog_posts blocked — note unchanged');

-- 6/7. faqs (live shape was faqs_auth_all, no WITH CHECK)
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.faqs (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'user role: INSERT faqs denied');
reset role; select set_config('request.jwt.claims', '', true);

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.faqs (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  'manager role: INSERT faqs allowed');
reset role; select set_config('request.jwt.claims', '', true);

-- 8/9. image_library (split insert/select/update; no delete policy)
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.image_library (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'user role: INSERT image_library denied');
reset role; select set_config('request.jwt.claims', '', true);

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.image_library (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  'manager role: INSERT image_library allowed');
reset role; select set_config('request.jwt.claims', '', true);

-- 10. binding-drift view empty (operator-tenant membership-less profile excluded)
select is(
  (select count(*) from public.tenant_role_binding_drift)::int,
  0, 'binding drift empty — operator-tenant seed excluded, customer bindings matched');

select * from finish();
rollback;
