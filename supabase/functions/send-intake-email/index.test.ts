// Tests for the in-source admin-allowlist gate added in S212.
//
// Pattern follows supabase/functions/notify-new-lead/index.test.ts.
// `index.ts` guards `Deno.serve` under `import.meta.main`, so importing it
// here does not start a server — we exercise the exported `handler(req)`
// directly via fetch-style Request objects.
//
// Coverage strategy:
//   Cases 1, 2, 5 are unit-testable here (no auth.getUser mock needed —
//   missing/invalid tokens trigger the natural error path).
//   Cases 3 (valid JWT, non-admin email → 403) and 4 (valid admin JWT →
//   gate passes) require either a real Supabase project or a mock of
//   createClient/auth.getUser. Per S212 spec fallback, those two cases
//   are deferred to claude.ai post-deploy curl smoke against the live
//   deployed function.
//
// Run:
//   deno test --allow-env --allow-net supabase/functions/send-intake-email/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:54321')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')
Deno.env.set('RESEND_API_KEY', 'test-resend-key')

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
    if (url.includes('/auth/v1/user')) {
      return Promise.resolve(new Response(JSON.stringify({ user: null }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    if (url.includes('api.resend.com')) {
      return Promise.resolve(new Response(JSON.stringify({ id: 'msg_123' }), {
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

function makeReq(opts: { authHeader?: string; body?: unknown }): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.authHeader !== undefined) headers['Authorization'] = opts.authHeader
  return new Request('http://local.test/send-intake-email', {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body ?? {}),
  })
}

const validBody = {
  prospectEmail: 'prospect@example.com',
  prospectName: 'Jane Doe',
  intakeUrl: 'https://pestflowpro.com/intake/abc-token',
  businessName: 'Example Pest',
}

Deno.test('1. Authorization header missing → 401, response has CORS header (S212 hygiene fix), no Resend call', async () => {
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ body: validBody }))
    assertEquals(res.status, 401)
    // S212 hygiene: 401/403 must include CORS so the browser SPA can read
    // the response body on a denied request.
    assertEquals(res.headers.get('Access-Control-Allow-Origin'), '*')
    assertEquals(res.headers.get('Content-Type'), 'application/json')
    const resendHits = spy.calls.filter((c) => c.url.includes('api.resend.com'))
    assertEquals(resendHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('2. Invalid bearer token → 401 with CORS header, no Resend call', async () => {
  // auth.getUser returns null user → handler returns 401 (matches the
  // !user clause in the gate; admin check is skipped on this path).
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ authHeader: 'Bearer not-a-real-jwt', body: validBody }))
    assertEquals(res.status, 401)
    assertEquals(res.headers.get('Access-Control-Allow-Origin'), '*')
    const resendHits = spy.calls.filter((c) => c.url.includes('api.resend.com'))
    assertEquals(resendHits.length, 0)
  } finally {
    spy.restore()
  }
})

// Cases 3 and 4 deferred to claude.ai post-deploy curl smoke (see header).

Deno.test('5. Body validation runs AFTER gate (case 3/4 covered by post-deploy curl)', async () => {
  // Even with an invalid token + invalid body, response is gate rejection
  // (401 here, not 400 body-error). Confirms gate runs BEFORE req.json().
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({
      authHeader: 'Bearer not-a-real-jwt',
      body: { /* missing prospectEmail and intakeUrl */ },
    }))
    assertEquals(res.status, 401)
    assertEquals(res.headers.get('Access-Control-Allow-Origin'), '*')
    const resendHits = spy.calls.filter((c) => c.url.includes('api.resend.com'))
    assertEquals(resendHits.length, 0)
  } finally {
    spy.restore()
  }
})
