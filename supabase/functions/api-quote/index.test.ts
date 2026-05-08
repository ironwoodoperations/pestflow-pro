// Tests for the customer-ack SMS gating added in S202.
//
// Pattern follows supabase/functions/notify-new-lead/index.test.ts.
// `index.ts` guards `Deno.serve` under `import.meta.main`, so importing it here
// does not start a server — we exercise the exported `handler(req)` directly.
//
// Run:
//   deno test --allow-env --allow-net supabase/functions/api-quote/index.test.ts

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const SECRET = 'a'.repeat(64)
const TENANT = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'

// Module-level Deno.env reads happen at import time.
Deno.env.set('SUPABASE_URL', 'https://example.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test')
Deno.env.set('SEND_SMS_INTERNAL_SECRET', SECRET)

const { handler } = await import('./index.ts')

const realFetch = globalThis.fetch

interface FetchCall {
  url: string
  init?: RequestInit
}

// Build a fetch stub. settingsResponses: per-key responses for PostgREST settings reads.
function installFetchSpy(opts: {
  customerSmsEnabled: boolean | null  // null → no row (defaults to true)
}): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = []
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    calls.push({ url, init })

    // tenants existence check
    if (url.includes('/rest/v1/tenants')) {
      return Promise.resolve(new Response(JSON.stringify({ id: TENANT }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }))
    }
    // leads insert returns the created row
    if (url.includes('/rest/v1/leads')) {
      return Promise.resolve(new Response(JSON.stringify({ id: 'lead-1' }), {
        status: 201, headers: { 'Content-Type': 'application/json' },
      }))
    }
    // settings reads: distinguish notifications vs business_info by query string
    if (url.includes('/rest/v1/settings')) {
      if (url.includes('key=eq.notifications')) {
        if (opts.customerSmsEnabled === null) {
          return Promise.resolve(new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } }))
        }
        return Promise.resolve(new Response(JSON.stringify({
          value: { customer_sms_enabled: opts.customerSmsEnabled },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      // business_info
      return Promise.resolve(new Response(JSON.stringify({
        value: { name: 'Test Pest Co' },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    // send-sms internal call
    if (url.includes('/functions/v1/send-sms')) {
      return Promise.resolve(new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }))
    }
    return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
  }) as typeof fetch
  return { calls, restore: () => { globalThis.fetch = realFetch } }
}

function makeReq(body: unknown): Request {
  return new Request('http://local.test/api-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const baseBody = {
  tenant_id: TENANT,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '5125551212',
  message: 'I have a pest problem',
}

Deno.test('1. customer_sms_consent:true + tenant has customer_sms_enabled:true → send-sms called type=customer', async () => {
  const spy = installFetchSpy({ customerSmsEnabled: true })
  try {
    const res = await handler(makeReq({ ...baseBody, customer_sms_consent: true }))
    assertEquals(res.status, 201)
    const smsHits = spy.calls.filter((c) => c.url.includes('/functions/v1/send-sms'))
    assertEquals(smsHits.length, 1)
    const body = JSON.parse(String(smsHits[0].init?.body ?? '{}'))
    assertEquals(body.type, 'customer')
    assertEquals(body.to, baseBody.phone)
  } finally {
    spy.restore()
  }
})

Deno.test('2. customer_sms_consent:true + tenant has customer_sms_enabled:false → send-sms NOT called', async () => {
  const spy = installFetchSpy({ customerSmsEnabled: false })
  try {
    const res = await handler(makeReq({ ...baseBody, customer_sms_consent: true }))
    assertEquals(res.status, 201)
    const smsHits = spy.calls.filter((c) => c.url.includes('/functions/v1/send-sms'))
    assertEquals(smsHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('3. customer_sms_consent:false + tenant has customer_sms_enabled:true → send-sms NOT called', async () => {
  const spy = installFetchSpy({ customerSmsEnabled: true })
  try {
    const res = await handler(makeReq({ ...baseBody, customer_sms_consent: false }))
    assertEquals(res.status, 201)
    const smsHits = spy.calls.filter((c) => c.url.includes('/functions/v1/send-sms'))
    assertEquals(smsHits.length, 0)
  } finally {
    spy.restore()
  }
})
