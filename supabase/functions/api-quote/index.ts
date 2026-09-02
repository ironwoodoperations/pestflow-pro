// Supabase Edge Function: api-quote
// Public API endpoint for quote/contact form submissions.
//
// POST /api-quote
// Body: { tenant_id, name, email, phone, services?, message?, address?, referral?, customer_sms_consent? }
// Returns: { success: true, lead_id: string }
//
// Customer-ack SMS (s202): if customer_sms_consent === true and the tenant has
// settings.notifications.customer_sms_enabled !== false, dispatch a customer
// acknowledgment SMS via send-sms with type 'customer'. Owner SMS is NOT
// dispatched here — that path runs through the trigger_notify_new_lead chain.
//
// CORS-enabled for cross-origin requests from external websites and the
// Next.js public lead forms (ContactForm, QuoteForm).
//
// SETUP:
// 1. Deploy: supabase functions deploy api-quote --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar
// 2. Set SEND_SMS_INTERNAL_SECRET secret on this function (matches send-sms env var).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizeOriginHost, normalizeRefererHost, isPlatformHost } from '../_shared/originHost.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
}

// ---- S321 unknown-origin probe throttle -------------------------------------
// STEP 3 of the ordering. Deliberately IN-MEMORY: the whole point is to sit in front of the
// database, so anything that queries to decide whether to query is self-defeating.
//
// HONEST LIMIT, stated rather than implied: edge isolate reuse is opportunistic, so this is
// best-effort mitigation, NOT a guarantee. It raises the cost of cycling arbitrary Origin
// values; it does not make it impossible. It is not authorization and nothing downstream
// trusts it.
const PROBE_WINDOW_MS = 60_000
const PROBE_MAX_PER_HOST = 5
const PROBE_MAX_KEYS = 500          // bounded: an attacker cycling hosts cannot grow this map
const probeCounts = new Map<string, { count: number; resetAt: number }>()

function allowUnknownOriginProbe(host: string): boolean {
  const now = Date.now()
  const hit = probeCounts.get(host)

  if (!hit || now >= hit.resetAt) {
    if (probeCounts.size >= PROBE_MAX_KEYS) {
      // Evict expired entries first; if the map is still full, fail CLOSED. A full map means
      // we are being cycled, which is exactly when refusing is the right answer.
      for (const [k, v] of probeCounts) if (now >= v.resetAt) probeCounts.delete(k)
      if (probeCounts.size >= PROBE_MAX_KEYS) return false
    }
    probeCounts.set(host, { count: 1, resetAt: now + PROBE_WINDOW_MS })
    return true
  }

  hit.count += 1
  return hit.count <= PROBE_MAX_PER_HOST
}

// ---- S321 verified-tenant-host lookup ---------------------------------------
// STEP 4. One indexed exact-match query, with a short module-scope cache.
//
// THE CACHE IS AN OPTIMIZATION, NOT AUTHORIZATION TRUTH. It is bounded, has an explicit TTL,
// and FAILS CLOSED on error -- a query that throws returns false (refuse), never true. A
// revoked domain stays admitted for at most VERIFIED_TTL_MS, which is the accepted cost and
// is why the TTL is short.
const VERIFIED_TTL_MS = 60_000
const VERIFIED_MAX_KEYS = 200
const verifiedCache = new Map<string, { ok: boolean; expiresAt: number }>()

async function isVerifiedTenantHost(host: string): Promise<boolean> {
  const now = Date.now()
  const cached = verifiedCache.get(host)
  if (cached && now < cached.expiresAt) return cached.ok

  let ok = false
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    // Exact match on an indexed column. NOT ilike, NOT a wildcard, NOT select-all-then-filter.
    const { data, error } = await supabase
      .from('tenant_domains')
      .select('tenant_id')
      .eq('custom_domain', host)
      .eq('verified', true)
      .maybeSingle()
    if (error) {
      // Fail CLOSED. An unavailable database must not admit an unknown origin.
      console.error('[api-quote] tenant_domains lookup failed:', error.code ?? 'unknown')
      return false
    }
    ok = !!data
  } catch (e) {
    console.error('[api-quote] tenant_domains lookup threw:', e instanceof Error ? e.name : 'unknown')
    return false
  }

  if (verifiedCache.size >= VERIFIED_MAX_KEYS) {
    for (const [k, v] of verifiedCache) if (now >= v.expiresAt) verifiedCache.delete(k)
    if (verifiedCache.size >= VERIFIED_MAX_KEYS) verifiedCache.clear()
  }
  verifiedCache.set(host, { ok, expiresAt: now + VERIFIED_TTL_MS })
  return ok
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // ---- S321 ORIGIN ADMISSION -------------------------------------------------
  //
  // WHAT THIS CONTROL IS, stated because it was previously unstated and therefore
  // over-trusted: a BROWSER-ORIGIN ADMISSION POLICY and CSRF defence. It is NOT
  // authentication, and it does NOT stop scripted submissions -- that is the rate
  // limiter's job, below. A request carrying neither Origin nor Referer is not checked at
  // all (see the `hadOriginSignal` branch); that bypass is PRE-EXISTING, is LEFT AS IS on
  // purpose, and is documented rather than closed: shutting it would break non-browser
  // integrations and is its own decision with its own blast radius.
  //
  // ORDER OF OPERATIONS IS LOAD-BEARING AND WAS THE GATE'S BLOCKING FINDING.
  //   1. parse the header with URL()          -- never regex a raw Origin
  //   2. platform host?  -> accept, ZERO DB   -- existing tenants gain no query
  //   3. non-platform    -> in-memory throttle BEFORE any DB call
  //   4. then ONE indexed exact-match lookup on tenant_domains
  // Reversing 3 and 4 turns this into an unauthenticated L7 DoS: an attacker cycling
  // arbitrary Origin values would force one Postgres query per request, in front of the
  // rate limiter. Do not reorder.

  const rawOrigin = req.headers.get('origin')
  const rawReferer = req.headers.get('referer')

  // Origin and Referer are DIFFERENT GRAMMARS and are parsed independently. The old code
  // did `origin ?? referer` and regexed whichever it got -- but a Referer is a full URL
  // with a path, so it could never satisfy an origin-shaped pattern honestly. If Origin is
  // present but unparseable we REJECT; we do not fall back to Referer, because falling back
  // lets a caller sending a hostile Origin get a second, laxer attempt.
  let originHost: string | null = null
  let hadOriginSignal = false

  if (rawOrigin) {
    hadOriginSignal = true
    originHost = normalizeOriginHost(rawOrigin)
  } else if (rawReferer) {
    hadOriginSignal = true
    originHost = normalizeRefererHost(rawReferer)
  }

  const forbidden = () => new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })

  if (hadOriginSignal) {
    if (!originHost) {
      // Present but malformed, http, ported, path-bearing, or userinfo-smuggling.
      console.warn('[api-quote] origin rejected: unparseable or disallowed shape')
      return forbidden()
    }

    if (!isPlatformHost(originHost)) {
      // STEP 3 -- cheap, in-memory, BEFORE the database. See the ordering note above.
      if (!allowUnknownOriginProbe(originHost)) {
        console.warn('[api-quote] origin rejected: unknown-origin probe throttled')
        return forbidden()
      }

      // STEP 4 -- one indexed exact-match lookup. Never a scan, never a pattern match,
      // never a fetch-all. custom_domain is stored as a bare host, which is why the
      // normalizer returns a host and not a URL.
      const verified = await isVerifiedTenantHost(originHost)
      if (!verified) {
        console.warn('[api-quote] origin rejected: not a verified tenant domain')
        return forbidden()
      }
    }
  }
  // ---------------------------------------------------------------------------

  const clientIp = (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim())
    || req.headers.get('cf-connecting-ip')
    || 'unknown'

  const supabaseForRL = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { count: rlCount } = await supabaseForRL
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('key', `api-quote:${clientIp}`)
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

  if ((rlCount ?? 0) >= 5) {
    console.warn('[api-quote] rate limit hit for IP:', clientIp)
    return new Response(JSON.stringify({ error: 'Too many submissions. Please try again in a few minutes.' }), {
      status: 429,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  await supabaseForRL.from('rate_limit_events').insert({
    key: `api-quote:${clientIp}`,
    created_at: new Date().toISOString(),
  })
  // ────────────────────────────────────────────────────────────────────

  try {
    const body = await req.json()
    const { tenant_id, name, email, phone, services, message, customer_sms_consent } = body

    if (!tenant_id || !name || !email || !phone) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        required: ['tenant_id', 'name', 'email', 'phone'],
      }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: tenant } = await supabase.from('tenants').select('id').eq('id', tenant_id).maybeSingle()
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Invalid tenant_id' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()

    const { data: lead, error } = await supabase.from('leads').insert({
      tenant_id,
      name: trimmedName,
      email: email.trim().toLowerCase(),
      phone: trimmedPhone,
      services: Array.isArray(services) ? services : services ? [services] : null,
      message: message?.trim() || null,
    }).select('id').maybeSingle()

    if (error || !lead) {
      return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Customer-ack SMS — optional, non-fatal. Owner SMS is the trigger's job.
    if (customer_sms_consent === true && trimmedPhone) {
      const { data: notifRow } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenant_id)
        .eq('key', 'notifications')
        .maybeSingle()
      const customerSmsEnabled = notifRow?.value?.customer_sms_enabled !== false

      if (customerSmsEnabled) {
        const { data: bizRow } = await supabase
          .from('settings')
          .select('value')
          .eq('tenant_id', tenant_id)
          .eq('key', 'business_info')
          .maybeSingle()
        const businessName: string = bizRow?.value?.name || 'our team'
        // Canonical template (post-S202): mirrors ContactForm's prior browser-side copy.
        const customerMessage = `Hi ${trimmedName}, thanks for contacting ${businessName}! We received your message and will be in touch shortly.`
        const SEND_SMS_INTERNAL_SECRET = Deno.env.get('SEND_SMS_INTERNAL_SECRET') ?? ''
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SEND_SMS_INTERNAL_SECRET,
            },
            body: JSON.stringify({
              tenant_id,
              to: trimmedPhone,
              message: customerMessage,
              type: 'customer',
            }),
          })
        } catch (err) {
          console.error('[api-quote] customer SMS dispatch failed (non-fatal):', String(err))
        }
      } else {
        console.log(`[api-quote] customer SMS skipped — tenant ${tenant_id} has customer_sms_enabled=false`)
      }
    }

    return new Response(JSON.stringify({ success: true, lead_id: lead.id }), {
      status: 201,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}
