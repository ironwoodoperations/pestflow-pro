// Tests for the in-source `apikey` shared-secret gate added in S202.
//
// Pattern follows supabase/functions/notify-new-lead/index.test.ts.
// `index.ts` guards `Deno.serve` under `import.meta.main`, so importing it here
// does not start a server — we exercise the exported `handler(req)` directly.
//
// Run:
//   deno test --allow-env --allow-net supabase/functions/send-sms/index.test.ts

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const SECRET = 'a'.repeat(64) // 64-byte hex secret length parity with vault entry

// Module-scoped consts in index.ts read SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// AND SEND_SMS_INTERNAL_SECRET at import time — set them before the dynamic import.
Deno.env.set('SUPABASE_URL', 'https://example.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test')
Deno.env.set('TEXTBELT_API_KEY', 'textbelt-test')
Deno.env.set('SEND_SMS_INTERNAL_SECRET', SECRET)

const { handler } = await import('./index.ts')

const realFetch = globalThis.fetch

interface FetchCall {
  url: string
  init?: RequestInit
}

function installFetchSpy(): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = []
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    calls.push({ url, init })
    if (url.includes('textbelt.com')) {
      return Promise.resolve(new Response(JSON.stringify({ success: true, textId: 'tb_123', quotaRemaining: 100 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    if (url.includes('/rest/v1/')) {
      return Promise.resolve(new Response('[]', {
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

function makeReq(opts: { apikey?: string | null; body?: unknown }): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.apikey !== undefined && opts.apikey !== null) headers['apikey'] = opts.apikey
  return new Request('http://local.test/send-sms', {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body ?? {}),
  })
}

// Use a non-FL/OK number (TX 512) + lead-notification type to skip quiet-hours
// gate and reach the Textbelt fetch path on the happy path.
const validBody = { tenant_id: 'tenant-1', to: '5125551212', message: 'hi', type: 'lead-notification' }

Deno.test('1. apikey header missing → 401, no Textbelt call', async () => {
  Deno.env.set('SEND_SMS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ body: validBody }))
    assertEquals(res.status, 401)
    assertEquals(spy.calls.filter((c) => c.url.includes('textbelt.com')).length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('2. apikey wrong (correct length, wrong value) → 401, no Textbelt call', async () => {
  Deno.env.set('SEND_SMS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const wrong = 'b'.repeat(64) // same length, different value
    const res = await handler(makeReq({ apikey: wrong, body: validBody }))
    assertEquals(res.status, 401)
    assertEquals(spy.calls.filter((c) => c.url.includes('textbelt.com')).length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('3. apikey wrong length → 401 (length pre-check fast path)', async () => {
  Deno.env.set('SEND_SMS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: 'short', body: validBody }))
    assertEquals(res.status, 401)
    assertEquals(spy.calls.filter((c) => c.url.includes('textbelt.com')).length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('4. apikey correct + valid body → 200 + Textbelt fetch attempted', async () => {
  Deno.env.set('SEND_SMS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: SECRET, body: validBody }))
    assertEquals(res.status, 200)
    const tbHits = spy.calls.filter((c) => c.url.includes('textbelt.com'))
    assertEquals(tbHits.length, 1)
  } finally {
    spy.restore()
  }
})

Deno.test('5. apikey correct + missing `to` → 200-with-error-body preserved', async () => {
  Deno.env.set('SEND_SMS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: SECRET, body: { tenant_id: 'tenant-1', message: 'hi', type: 'lead-notification' } }))
    // Pre-existing behavior: missing `to` flows through decideDispatch, which
    // returns kind:'invalid' (reason:'invalid'); handler responds 200 with
    // {success:false, error:'invalid SMS recipient'}. No Textbelt call.
    assertEquals(res.status, 200)
    const body = await res.json()
    assertEquals(body.success, false)
    assertEquals(spy.calls.filter((c) => c.url.includes('textbelt.com')).length, 0)
  } finally {
    spy.restore()
  }
})
