// Tests for the in-source `x-pfp-internal-key` shared-secret gate added in S211a.
//
// Pattern follows supabase/functions/notify-new-lead/index.test.ts.
// `index.ts` guards `Deno.serve` under `import.meta.main`, so importing it here
// does not start a server — we exercise the exported `handler(req)` directly.
//
// Header is `x-pfp-internal-key` (NOT `apikey`) because the ironwood-provision
// caller already sends `apikey: SUPABASE_SERVICE_ROLE_KEY` and reusing `apikey`
// would either drop the gate value (source-side last-wins) or break the gate
// (wire-side WHATWG comma-merge). See S211a PR description for full rationale.
//
// Run:
//   deno test --allow-env --allow-net supabase/functions/provision-tenant/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const SECRET = 'test-provision-secret-abc123'
const HEADER = 'x-pfp-internal-key'

// Module-scoped consts in index.ts read SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// at import time — set them before the dynamic import below.
Deno.env.set('SUPABASE_URL', 'https://example.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test')

const { handler } = await import('./index.ts')

const realFetch = globalThis.fetch

interface FetchCall {
  url: string
  init?: RequestInit
}

function installFetchSpy(): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = []
  // Default-OK responder: every external call returns a benign success.
  // The provisioning logic is NOT what we're testing here — only the gate.
  // Cases 1, 2, 5 verify the gate rejects BEFORE any external call fires;
  // cases 3 and 4 verify the gate passes (response status reflects the
  // downstream provisioning logic, not the gate).
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    calls.push({ url, init })
    // PostgREST onboarding_sessions / tenants / settings / page_content /
    // service_areas / location_data / faqs / testimonials / blog_posts /
    // prospects + auth admin createUser — all return benign success/empty.
    if (url.includes('/auth/v1/admin/users')) {
      return Promise.resolve(new Response(JSON.stringify({ user: { id: '00000000-0000-0000-0000-000000000001' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    if (url.includes('/rest/v1/')) {
      return Promise.resolve(new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
  }) as typeof fetch

  return {
    calls,
    restore: () => {
      globalThis.fetch = realFetch
    },
  }
}

function makeReq(opts: { gateKey?: string; body?: unknown }): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.gateKey !== undefined) headers[HEADER] = opts.gateKey
  return new Request('http://local.test/provision-tenant', {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body ?? {}),
  })
}

const validBody = {
  slug: 'test-tenant',
  admin_email: 'admin@test-tenant.com',
  admin_password: 'TestPass2026!',
  business_info: { name: 'Test Tenant', phone: '5125551212', email: 'info@test-tenant.com', address: '1 Main St', tagline: '', industry: 'pest' },
  branding: { logo_url: '', primary_color: '#10b981', template: 'modern-pro' },
  social_links: { facebook: '', instagram: '', google: '', youtube: '' },
  integrations: { google_place_id: '', ga4_id: '' },
  plan: 'starter',
  subscription: { tier: 1, plan_name: 'Starter', monthly_price: 149 },
}

Deno.test('1. x-pfp-internal-key header missing → 401, no auth admin or PostgREST calls', async () => {
  Deno.env.set('PROVISION_TENANT_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ body: validBody })) // no gate header
    assertEquals(res.status, 401)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('/auth/v1/admin/users') ||
      c.url.includes('/rest/v1/')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('2. x-pfp-internal-key header wrong → 401, no auth admin or PostgREST calls', async () => {
  Deno.env.set('PROVISION_TENANT_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ gateKey: 'wrong-secret', body: validBody }))
    assertEquals(res.status, 401)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('/auth/v1/admin/users') ||
      c.url.includes('/rest/v1/')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('3. apikey header present (not x-pfp-internal-key) → 401 (gate ignores apikey by design)', async () => {
  // Regression guard for the Option 3 split: if a future caller mistakenly sends
  // PROVISION_TENANT_INTERNAL_SECRET via the `apikey` header (for example by
  // copy-pasting from publish-scheduled-posts), the gate must still reject.
  Deno.env.set('PROVISION_TENANT_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: SECRET }
    const req = new Request('http://local.test/provision-tenant', {
      method: 'POST', headers, body: JSON.stringify(validBody),
    })
    const res = await handler(req)
    assertEquals(res.status, 401)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('/auth/v1/admin/users') ||
      c.url.includes('/rest/v1/')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('4. x-pfp-internal-key correct + valid body → gate passes (status reflects downstream)', async () => {
  Deno.env.set('PROVISION_TENANT_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ gateKey: SECRET, body: validBody }))
    // Gate passed — control reaches the provisioning try/catch. Whether the
    // mocked downstream returns 200 or 500 is incidental; the assertion is
    // the gate did NOT short-circuit at 401, AND at least one downstream
    // call was attempted (proving control flow proceeded past the gate).
    assertEquals(res.status === 401, false)
    const downstreamHits = spy.calls.filter((c) =>
      c.url.includes('/auth/v1/admin/users') ||
      c.url.includes('/rest/v1/')
    )
    assertEquals(downstreamHits.length >= 1, true)
  } finally {
    spy.restore()
  }
})

Deno.test('5. PROVISION_TENANT_INTERNAL_SECRET unset → 500 regardless of presented header', async () => {
  Deno.env.delete('PROVISION_TENANT_INTERNAL_SECRET')
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ gateKey: SECRET, body: validBody }))
    assertEquals(res.status, 500)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('/auth/v1/admin/users') ||
      c.url.includes('/rest/v1/')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})
