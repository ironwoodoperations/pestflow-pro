// Tests for the in-source `apikey` shared-secret gate added in S200.
//
// Pattern follows supabase/functions/send-sms/_test.ts (Deno.test, std assertions).
// `index.ts` guards `Deno.serve` under `import.meta.main`, so importing it here
// does not start a server — we exercise the exported `handler(req)` directly.
//
// Run:
//   deno test --allow-env --allow-net supabase/functions/notify-new-lead/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const SECRET = 'test-secret-abc123'
const TENANT = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'

// Module-scoped consts in index.ts read SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// at import time — set them before the dynamic import below.
Deno.env.set('SUPABASE_URL', 'https://example.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test')
Deno.env.set('TEXTBELT_API_KEY', 'textbelt-test')
Deno.env.set('RESEND_API_KEY', 'resend-test')

const { handler } = await import('./index.ts')

const realFetch = globalThis.fetch

interface FetchCall {
  url: string
  init?: RequestInit
}

function installFetchSpy(): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = []
  // Default-OK responder: every external call returns a benign success.
  // - PostgREST settings reads → JSON body with .value
  // - Resend → 200 ok
  // - send-sms internal call → 200 ok
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    calls.push({ url, init })

    if (url.includes('/rest/v1/settings')) {
      // supabase-js maybeSingle() expects the row directly when single-row select header is set.
      return Promise.resolve(new Response(JSON.stringify({ value: { lead_email: 'owner@example.com' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    if (url.includes('api.resend.com')) {
      return Promise.resolve(new Response(JSON.stringify({ id: 'msg_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    if (url.includes('/functions/v1/send-sms')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
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

function makeReq(opts: { apikey?: string; body?: unknown }): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.apikey !== undefined) headers['apikey'] = opts.apikey
  return new Request('http://local.test/notify-new-lead', {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body ?? {}),
  })
}

const validBody = {
  type: 'INSERT',
  table: 'leads',
  record: {
    id: 'lead-1',
    tenant_id: TENANT,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '5125551212',
    services: ['Pest Control'],
    message: null,
    created_at: '2026-05-08T15:00:00Z',
  },
}

Deno.test('1. apikey header missing → 401, no Resend or Supabase calls', async () => {
  Deno.env.set('NOTIFY_NEW_LEAD_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ body: validBody })) // no apikey
    assertEquals(res.status, 401)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('api.resend.com') ||
      c.url.includes('/rest/v1/settings') ||
      c.url.includes('/functions/v1/send-sms')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('2. apikey header wrong → 401, no Resend or Supabase calls', async () => {
  Deno.env.set('NOTIFY_NEW_LEAD_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: 'wrong-secret', body: validBody }))
    assertEquals(res.status, 401)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('api.resend.com') ||
      c.url.includes('/rest/v1/settings') ||
      c.url.includes('/functions/v1/send-sms')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('3. apikey correct + body has no tenant_id → 400 (No lead data)', async () => {
  Deno.env.set('NOTIFY_NEW_LEAD_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({
      apikey: SECRET,
      body: { type: 'INSERT', table: 'leads', record: { id: 'x', name: 'x' } },
    }))
    assertEquals(res.status, 400)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('api.resend.com') ||
      c.url.includes('/rest/v1/settings') ||
      c.url.includes('/functions/v1/send-sms')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('4. apikey correct + valid body → 200, Resend called, settings read', async () => {
  Deno.env.set('NOTIFY_NEW_LEAD_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: SECRET, body: validBody }))
    assertEquals(res.status, 200)
    const settingsHits = spy.calls.filter((c) => c.url.includes('/rest/v1/settings'))
    const resendHits = spy.calls.filter((c) => c.url.includes('api.resend.com'))
    // Settings read happens (notifications, branding, business_info, integrations)
    assertEquals(settingsHits.length >= 1, true)
    // At least Email A (visitor) is sent — Resend invoked.
    assertEquals(resendHits.length >= 1, true)
  } finally {
    spy.restore()
  }
})

Deno.test('5. NOTIFY_NEW_LEAD_INTERNAL_SECRET unset → 500 regardless of presented header', async () => {
  Deno.env.delete('NOTIFY_NEW_LEAD_INTERNAL_SECRET')
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: SECRET, body: validBody }))
    assertEquals(res.status, 500)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('api.resend.com') ||
      c.url.includes('/rest/v1/settings') ||
      c.url.includes('/functions/v1/send-sms')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})
