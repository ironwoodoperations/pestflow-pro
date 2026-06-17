// S273 — Cross-tenant isolation test for requireTenantUser (the SSOT auth boundary
// that all 18 tenant-context edge functions funnel through).
//
// CONDITION #1 (locked): this test must exercise the CALLER's real authenticated
// context — not service-role privilege, not a mocked DB response. It therefore:
//   1. runs against a REAL local Supabase stack (CI: `supabase start`),
//   2. seeds tenant A, tenant B, and a user who is a tenant_users member of A ONLY,
//   3. MINTS A REAL JWT for that user via GoTrue (signInWithPassword) — a genuine
//      caller bearer token, validated by getUser() inside requireTenantUser,
//   4. asserts: requested = A → role returned; requested = B → 403 (zero rows).
//
// The (user_id, tenant_id) predicate in requireTenantUser is the cross-tenant
// boundary; this proves it holds for a real authenticated caller. The internal
// tenant_users lookup uses the service key BY DESIGN — but the assertion under test
// is driven by the real JWT's resolved user.id against real rows, so service-role
// does not trivialise it (the #1 RLS-test false positive is avoided).
//
// Run locally (requires a running stack — see .github/workflows/ci.yml):
//   supabase start
//   eval "$(supabase status -o env | sed 's/^/export /')"
//   SUPABASE_URL="$API_URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
//     SUPABASE_ANON_KEY="$ANON_KEY" \
//     deno test --allow-net --allow-env supabase/functions/_shared/auth/

import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  throw new Error(
    'requireTenantUser.test.ts needs a live local Supabase stack. Set SUPABASE_URL, ' +
    'SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (CI does this from `supabase status`).',
  )
}

// requireTenantUser reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY at module load —
// they are already set in the env above, so importing now binds them correctly.
const { requireTenantUser } = await import('./requireTenantUser.ts')

// Service-role client — used ONLY for test fixture setup/teardown, never to make the
// assertion pass.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const tenantA = crypto.randomUUID()
const tenantB = crypto.randomUUID()
const suffix = crypto.randomUUID().slice(0, 8)
const email = `iso-test-${suffix}@example.com`
const password = `pw-${crypto.randomUUID()}`
let userId = ''

async function seed() {
  // Two tenants. entitlement is NOT NULL (S262); name NOT NULL. Unique slug/subdomain.
  const { error: tErr } = await admin.from('tenants').insert([
    { id: tenantA, name: `ISO Test A ${suffix}`, slug: `iso-a-${suffix}`, subdomain: `iso-a-${suffix}`, entitlement: 1 },
    { id: tenantB, name: `ISO Test B ${suffix}`, slug: `iso-b-${suffix}`, subdomain: `iso-b-${suffix}`, entitlement: 1 },
  ])
  if (tErr) throw new Error(`seed tenants failed: ${tErr.message}`)

  const { data: created, error: uErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (uErr || !created.user) throw new Error(`seed user failed: ${uErr?.message}`)
  userId = created.user.id

  // Membership in tenant A ONLY — deliberately NOT in tenant B.
  const { error: mErr } = await admin
    .from('tenant_users')
    .insert({ tenant_id: tenantA, user_id: userId, role: 'admin' })
  if (mErr) throw new Error(`seed membership failed: ${mErr.message}`)
}

async function teardown() {
  await admin.from('tenant_users').delete().eq('user_id', userId)
  await admin.from('tenants').delete().in('id', [tenantA, tenantB])
  if (userId) await admin.auth.admin.deleteUser(userId)
}

// Mint a REAL caller JWT (member of A) via GoTrue — this is the authenticated context.
async function mintMemberOfAToken(): Promise<string> {
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await anon.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`signIn failed: ${error?.message}`)
  return data.session.access_token
}

function reqWith(token: string): Request {
  return new Request('https://edge.test/whatever', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

Deno.test('requireTenantUser — cross-tenant isolation (real member-of-A JWT)', async (t) => {
  await seed()
  try {
    const token = await mintMemberOfAToken()

    await t.step('member of A, requesting A → membership granted, role returned', async () => {
      const result = await requireTenantUser(reqWith(token), tenantA)
      assertEquals(result.tenantId, tenantA)
      assertEquals(result.role, 'admin')
      assertEquals(result.user.id, userId)
    })

    await t.step('member of A, requesting B → 403 Forbidden (zero rows)', async () => {
      let status = 0
      try {
        await requireTenantUser(reqWith(token), tenantB)
      } catch (e) {
        status = (e as { status?: number }).status ?? 0
      }
      assertEquals(status, 403, 'caller in tenant A must NOT pass for tenant B')
    })

    await t.step('missing/garbage token → 401 Unauthorized', async () => {
      let status = 0
      try {
        await requireTenantUser(reqWith('not-a-real-jwt'), tenantA)
      } catch (e) {
        status = (e as { status?: number }).status ?? 0
      }
      assert(status === 401 || status === 403, `expected 401/403, got ${status}`)
    })
  } finally {
    await teardown()
  }
})
