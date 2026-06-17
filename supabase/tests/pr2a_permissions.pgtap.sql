-- S273 PR #2a — pgTAP role-RLS test (role × command × representative-table matrix).
--
-- Proves the split content-table policies + TRUNCATE revoke enforce the permission
-- matrix at the DB:
--   * 'user'   : CANNOT INSERT/UPDATE/DELETE/TRUNCATE content; CAN still SELECT,
--   * 'manager': CAN INSERT/UPDATE/DELETE (where a DELETE policy exists),
--   * 'admin'  : CAN write,
--   * image_library has NO delete policy → even manager DELETE is a no-op,
--   * binding-drift view excludes the operator-tenant membership-less seed.
--
-- Runs against the CI fixture schema + the REAL PR #2a migration applied on top.
-- Identity is simulated via request.jwt.claims + SET ROLE authenticated, so RLS +
-- the SECURITY DEFINER helpers execute in a genuine authenticated context — not as
-- the RLS-bypassing superuser (#1 false-positive guard).

begin;
create extension if not exists pgtap;

select plan(16);

-- ── Seed (superuser; RLS bypassed for setup) ──
insert into public.tenants (id, name, slug, subdomain, entitlement) values
  ('11111111-1111-1111-1111-111111111111', 'Customer Co', 'customer-co', 'customer-co', 2),
  ('92150000-0000-0000-0000-000000000001', 'Ironwood Operator', 'pestflow-pro', 'pestflow-pro', 4);

insert into public.profiles (id, tenant_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),  -- admin
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),  -- manager
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111'),  -- user
  ('dede0000-0000-0000-0000-00000000dead', '92150000-0000-0000-0000-000000000001'); -- operator seed, NO membership
insert into public.tenant_users (tenant_id, user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'manager'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'user');

-- Content rows for update/delete checks (all customer tenant).
insert into public.blog_posts (id, tenant_id, note) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'seed'),  -- user denial
  ('d2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'seed'),  -- manager update
  ('d3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'seed');  -- manager delete
insert into public.faqs (id, tenant_id, note) values
  ('ff111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'seed');  -- user delete denial
insert into public.image_library (id, tenant_id, note) values
  ('ee111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'seed');  -- manager update / no-delete

-- jwt-claim constants
\set user_claims  '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}'
\set mgr_claims   '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}'
\set admin_claims '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}'

-- ════════ blog_posts (simple) — full role × command matrix ════════
-- user: INSERT denied
select set_config('request.jwt.claims', :'user_claims', true); set local role authenticated;
select throws_ok($$ insert into public.blog_posts (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'user: INSERT blog_posts denied');
reset role; select set_config('request.jwt.claims', '', true);

-- user: UPDATE denied (note unchanged)
select set_config('request.jwt.claims', :'user_claims', true); set local role authenticated;
update public.blog_posts set note = 'hacked' where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
reset role; select set_config('request.jwt.claims', '', true);
select is((select note from public.blog_posts where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'seed', 'user: UPDATE blog_posts blocked — note unchanged');

-- user: DELETE denied (row remains — the hole the split closed)
select set_config('request.jwt.claims', :'user_claims', true); set local role authenticated;
delete from public.blog_posts where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
reset role; select set_config('request.jwt.claims', '', true);
select is((select count(*) from public.blog_posts where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd')::int,
  1, 'user: DELETE blog_posts blocked — row remains');

-- user: TRUNCATE denied (revoke; RLS does not cover TRUNCATE)
select set_config('request.jwt.claims', :'user_claims', true); set local role authenticated;
select throws_ok($$ truncate public.blog_posts $$, '42501', null, 'user: TRUNCATE blog_posts denied');
reset role; select set_config('request.jwt.claims', '', true);

-- manager: INSERT / UPDATE / DELETE allowed
select set_config('request.jwt.claims', :'mgr_claims', true); set local role authenticated;
select lives_ok($$ insert into public.blog_posts (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  'manager: INSERT blog_posts allowed');
reset role; select set_config('request.jwt.claims', '', true);

select set_config('request.jwt.claims', :'mgr_claims', true); set local role authenticated;
update public.blog_posts set note = 'mgr' where id = 'd2222222-2222-2222-2222-222222222222';
reset role; select set_config('request.jwt.claims', '', true);
select is((select note from public.blog_posts where id = 'd2222222-2222-2222-2222-222222222222'),
  'mgr', 'manager: UPDATE blog_posts allowed');

select set_config('request.jwt.claims', :'mgr_claims', true); set local role authenticated;
delete from public.blog_posts where id = 'd3333333-3333-3333-3333-333333333333';
reset role; select set_config('request.jwt.claims', '', true);
select is((select count(*) from public.blog_posts where id = 'd3333333-3333-3333-3333-333333333333')::int,
  0, 'manager: DELETE blog_posts allowed');

-- admin: INSERT allowed
select set_config('request.jwt.claims', :'admin_claims', true); set local role authenticated;
select lives_ok($$ insert into public.blog_posts (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  'admin: INSERT blog_posts allowed');
reset role; select set_config('request.jwt.claims', '', true);

-- ════════ faqs (divergent live shape: was faqs_auth_all, no WITH CHECK) ════════
select set_config('request.jwt.claims', :'user_claims', true); set local role authenticated;
select throws_ok($$ insert into public.faqs (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'user: INSERT faqs denied');
reset role; select set_config('request.jwt.claims', '', true);

select set_config('request.jwt.claims', :'user_claims', true); set local role authenticated;
delete from public.faqs where id = 'ff111111-1111-1111-1111-111111111111';
reset role; select set_config('request.jwt.claims', '', true);
select is((select count(*) from public.faqs where id = 'ff111111-1111-1111-1111-111111111111')::int,
  1, 'user: DELETE faqs blocked — row remains');

select set_config('request.jwt.claims', :'mgr_claims', true); set local role authenticated;
select lives_ok($$ insert into public.faqs (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  'manager: INSERT faqs allowed');
reset role; select set_config('request.jwt.claims', '', true);

-- ════════ image_library (divergent: split insert/select/update, NO delete) ════════
select set_config('request.jwt.claims', :'user_claims', true); set local role authenticated;
select throws_ok($$ insert into public.image_library (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'user: INSERT image_library denied');
reset role; select set_config('request.jwt.claims', '', true);

select set_config('request.jwt.claims', :'mgr_claims', true); set local role authenticated;
select lives_ok($$ insert into public.image_library (tenant_id) values ('11111111-1111-1111-1111-111111111111') $$,
  'manager: INSERT image_library allowed');
reset role; select set_config('request.jwt.claims', '', true);

select set_config('request.jwt.claims', :'mgr_claims', true); set local role authenticated;
update public.image_library set note = 'mgr' where id = 'ee111111-1111-1111-1111-111111111111';
reset role; select set_config('request.jwt.claims', '', true);
select is((select note from public.image_library where id = 'ee111111-1111-1111-1111-111111111111'),
  'mgr', 'manager: UPDATE image_library allowed');

-- no DELETE policy on image_library → even manager DELETE is a no-op (row remains)
select set_config('request.jwt.claims', :'mgr_claims', true); set local role authenticated;
delete from public.image_library where id = 'ee111111-1111-1111-1111-111111111111';
reset role; select set_config('request.jwt.claims', '', true);
select is((select count(*) from public.image_library where id = 'ee111111-1111-1111-1111-111111111111')::int,
  1, 'image_library: no DELETE policy — manager DELETE is a no-op');

-- ════════ binding-drift audit ════════
select is((select count(*) from public.tenant_role_binding_drift)::int,
  0, 'binding drift empty — operator-tenant seed excluded, customer bindings matched');

select * from finish();
rollback;
