// Tests for the in-source `apikey` shared-secret gate added in S211a.
//
// Pattern follows supabase/functions/notify-new-lead/index.test.ts.
// `index.ts` guards `Deno.serve` under `import.meta.main`, so importing it here
// does not start a server — we exercise the exported `handler(req)` directly.
//
// Run:
//   deno test --allow-env --allow-net supabase/functions/publish-scheduled-posts/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const SECRET = 'test-publish-secret-abc123'

// Module-scoped consts in index.ts read SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// inside the handler (not at import time), but we still set them so the
// supabase-js client constructor doesn't barf during the gate-pass tests.
Deno.env.set('SUPABASE_URL', 'https://example.supabase.co')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test')
Deno.env.set('ZERNIO_API_KEY', 'zernio-test')

const { handler } = await import('./index.ts')

const realFetch = globalThis.fetch

interface FetchCall {
  url: string
  init?: RequestInit
}

function installFetchSpy(): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = []
  // Default-OK responder: every external call returns a benign success.
  // - PostgREST social_posts UPDATE...RETURNING → empty array (no posts due)
  // - PostgREST settings → benign value
  // - Zernio → 200 ok
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    calls.push({ url, init })

    if (url.includes('/rest/v1/social_posts')) {
      // Atomic claim: PATCH...RETURNING → no rows due
      return Promise.resolve(new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    if (url.includes('/rest/v1/settings')) {
      return Promise.resolve(new Response(JSON.stringify({ value: { zernio_accounts: {} } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    if (url.includes('zernio.com')) {
      return Promise.resolve(new Response(JSON.stringify({ post: { _id: 'zer_test' } }), {
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
  return new Request('http://local.test/publish-scheduled-posts', {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body ?? {}),
  })
}

Deno.test('1. apikey header missing → 401, no Supabase or Zernio calls', async () => {
  Deno.env.set('PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({})) // no apikey
    assertEquals(res.status, 401)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('/rest/v1/social_posts') ||
      c.url.includes('/rest/v1/settings') ||
      c.url.includes('zernio.com')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('2. apikey header wrong → 401, no Supabase or Zernio calls', async () => {
  Deno.env.set('PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: 'wrong-secret' }))
    assertEquals(res.status, 401)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('/rest/v1/social_posts') ||
      c.url.includes('/rest/v1/settings') ||
      c.url.includes('zernio.com')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})

Deno.test('3. apikey correct + valid empty body → 200, returns fired/published/failed shape', async () => {
  Deno.env.set('PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: SECRET }))
    assertEquals(res.status, 200)
    const body = await res.json()
    assertEquals(typeof body.fired, 'number')
    assertEquals(typeof body.published, 'number')
    assertEquals(typeof body.failed, 'number')
  } finally {
    spy.restore()
  }
})

Deno.test('4. apikey correct + body { post_id: ... } → 200, post_id ignored after S211a drift cleanup', async () => {
  Deno.env.set('PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET', SECRET)
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: SECRET, body: { post_id: 'should-be-ignored' } }))
    assertEquals(res.status, 200)
    // The dead specificPostId branch was stripped — request should succeed and
    // claim-by-scheduled_for_lte_now runs unconditionally. Body shape matches case 3.
    const body = await res.json()
    assertEquals(typeof body.fired, 'number')
  } finally {
    spy.restore()
  }
})

Deno.test('5. PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET unset → 500 regardless of presented header', async () => {
  Deno.env.delete('PUBLISH_SCHEDULED_POSTS_INTERNAL_SECRET')
  const spy = installFetchSpy()
  try {
    const res = await handler(makeReq({ apikey: SECRET }))
    assertEquals(res.status, 500)
    const externalHits = spy.calls.filter((c) =>
      c.url.includes('/rest/v1/social_posts') ||
      c.url.includes('/rest/v1/settings') ||
      c.url.includes('zernio.com')
    )
    assertEquals(externalHits.length, 0)
  } finally {
    spy.restore()
  }
})
