// Edge function: outscraper-reviews v1
// Fetches Google reviews via Outscraper API and upserts into testimonials table.
//
// Auth: dual-path (verify_jwt: false — we handle auth internally)
//   Cron / fire-and-forget:  apikey header must match vault secret
//                            'outscraper_cron_internal_secret'
//   Admin manual:            Bearer JWT → requireTenantUser → tier 4 check
//
// Modes:
//   initial     — full sync, up to 200 reviews (first-time or provision-tenant trigger)
//   incremental — newest 50 reviews (recurring cron sync, saves API credits)
//   manual      — full sync up to 200 reviews (admin button, tier 4, rate-limited 6h)
//
// DEPLOY:
//   supabase functions deploy outscraper-reviews --no-verify-jwt \
//     --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

// ── Types ────────────────────────────────────────────────────────────────────

interface RequestBody {
  tenant_id: string
  mode?: 'initial' | 'incremental' | 'manual'
}

interface OutscraperReview {
  review_id?: string
  author_title?: string
  review_rating?: number
  review_text?: string
  review_timestamp?: number
  review_datetime_utc?: string
}

interface OutscraperPlaceData {
  reviews_count?: number
  rating?: number
  reviews_data?: OutscraperReview[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the Outscraper query identifier from integrations settings.
 * Priority: google_cid → google_fid → google_place_id
 * CID (decimal) is wrapped in a Google Maps URL which Outscraper accepts reliably.
 */
function buildOutscraperQuery(integrations: Record<string, string>): string | null {
  const cid = (integrations.google_cid ?? '').trim()
  const fid = (integrations.google_fid ?? '').trim()
  const placeId = (integrations.google_place_id ?? '').trim()

  if (cid) return `https://www.google.com/maps?cid=${encodeURIComponent(cid)}`
  if (fid) return fid   // hex-pair format (0xaaa:0xbbb) accepted by Outscraper directly
  if (placeId) return placeId
  return null
}

/**
 * Parse tier value to an integer.
 * Handles both numeric ('4') and name ('elite', 'pro', 'grow') formats.
 */
function parseTier(raw: string | number | null | undefined): number {
  if (raw == null) return 1
  if (typeof raw === 'number') return raw
  const lower = String(raw).toLowerCase()
  if (lower === '4' || lower === 'elite') return 4
  if (lower === '3' || lower === 'pro') return 3
  if (lower === '2' || lower === 'grow' || lower === 'growth') return 2
  const asNum = parseInt(lower, 10)
  return isNaN(asNum) ? 1 : asNum
}

/**
 * Update settings.integrations with error state (non-blocking on failure).
 */
async function updateOutscraperError(
  serviceClient: ReturnType<typeof createClient>,
  tenantId: string,
  currentIntegrations: Record<string, unknown>,
  errorMessage: string,
): Promise<void> {
  await serviceClient.from('settings').update({
    value: { ...currentIntegrations, outscraper_last_error: errorMessage },
  }).eq('tenant_id', tenantId).eq('key', 'integrations')
}

// ── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const outscraperKey  = Deno.env.get('OUTSCRAPER_API_KEY') ?? ''

  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  if (!body.tenant_id) {
    return new Response(JSON.stringify({ error: 'tenant_id required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const tenantId = body.tenant_id
  const mode     = body.mode ?? 'incremental'

  console.log(`[outscraper-reviews] request tenant=${tenantId} mode=${mode}`)

  // ── Auth: dual-path ────────────────────────────────────────────────────────
  // Path 1: internal secret (cron dispatcher, provision-tenant fire-and-forget)
  // Path 2: Bearer JWT + tier check (admin manual refresh)

  const requestApiKey = req.headers.get('apikey') ?? ''
  let isCronCall = false

  if (requestApiKey) {
    // Read vault secret to validate caller identity
    const { data: vaultRow } = await serviceClient
      .schema('vault')
      .from('decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'outscraper_cron_internal_secret')
      .maybeSingle()

    const internalSecret = vaultRow?.decrypted_secret ?? ''
    if (internalSecret && requestApiKey === internalSecret) {
      isCronCall = true
      console.log('[outscraper-reviews] auth: internal secret matched (cron/provision path)')
    }
  }

  if (!isCronCall) {
    // JWT path — requireTenantUser validates JWT + tenant ownership
    try {
      await requireTenantUser(req, tenantId)
    } catch (e) {
      if (e instanceof AuthError) {
        return new Response(JSON.stringify(e.body), {
          status: e.status, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      throw e
    }

    // Manual mode requires tier 4 (Elite)
    if (mode === 'manual') {
      const { data: subRow } = await serviceClient
        .from('settings').select('value')
        .eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle()
      const tier = parseTier(subRow?.value?.tier)
      if (tier < 4) {
        console.warn('[outscraper-reviews] manual refresh blocked — tier:', tier, 'tenant:', tenantId)
        return new Response(
          JSON.stringify({ error: 'Manual refresh requires Elite plan (tier 4)' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }
    }
    console.log('[outscraper-reviews] auth: JWT validated (admin path)')
  }

  // ── Rate limit: manual mode — once per 6 hours per tenant ─────────────────
  if (mode === 'manual') {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    const { count } = await serviceClient
      .from('rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('key', `outscraper:refresh:${tenantId}`)
      .gte('created_at', sixHoursAgo)

    if ((count ?? 0) > 0) {
      // Find most recent event to compute retry_after
      const { data: latestEvent } = await serviceClient
        .from('rate_limit_events')
        .select('created_at')
        .eq('key', `outscraper:refresh:${tenantId}`)
        .gte('created_at', sixHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const retryAfter = latestEvent
        ? new Date(new Date(latestEvent.created_at).getTime() + 6 * 60 * 60 * 1000).toISOString()
        : null

      console.warn('[outscraper-reviews] rate limited — tenant:', tenantId, 'retry_after:', retryAfter)
      return new Response(
        JSON.stringify({
          error: 'Rate limit: manual refresh allowed once per 6 hours',
          retry_after: retryAfter,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }
  }

  // ── Read tenant integrations ───────────────────────────────────────────────
  const { data: intRow } = await serviceClient
    .from('settings').select('value')
    .eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()

  const integrations: Record<string, string> = intRow?.value ?? {}
  const outscraperQuery = buildOutscraperQuery(integrations)

  if (!outscraperQuery) {
    console.error('[outscraper-reviews] No Google identifier for tenant:', tenantId)
    return new Response(
      JSON.stringify({ error: 'No Google identifier (CID, FID, or Place ID) configured for this tenant' }),
      { status: 422, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }

  if (!outscraperKey) {
    console.error('[outscraper-reviews] OUTSCRAPER_API_KEY env var not set')
    return new Response(
      JSON.stringify({ error: 'Outscraper API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }

  // ── Call Outscraper API ────────────────────────────────────────────────────
  // incremental = newest 50 (saves credits on recurring runs)
  // initial / manual = up to 200 (full sync)
  const reviewLimit = mode === 'incremental' ? 50 : 200

  const outscraperUrl = new URL('https://api.app.outscraper.com/maps/reviews-v3')
  outscraperUrl.searchParams.set('query', outscraperQuery)
  outscraperUrl.searchParams.set('limit', String(reviewLimit))
  outscraperUrl.searchParams.set('sort', 'newest')
  outscraperUrl.searchParams.set('async', 'false')

  console.log(`[outscraper-reviews] calling Outscraper: tenant=${tenantId} mode=${mode} limit=${reviewLimit} query=${outscraperQuery}`)

  let outscraperRes: Response
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)
    outscraperRes = await fetch(outscraperUrl.toString(), {
      method: 'GET',
      headers: { 'X-API-KEY': outscraperKey },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
  } catch (e) {
    const isTimeout = (e as Error).name === 'AbortError'
    const errMsg = isTimeout ? 'Request timed out (30s)' : (e as Error).message
    console.error('[outscraper-reviews] fetch error:', errMsg)
    await updateOutscraperError(serviceClient, tenantId, integrations, errMsg)
    return new Response(
      JSON.stringify({ error: isTimeout ? 'Outscraper request timed out' : 'Network error contacting Outscraper' }),
      { status: isTimeout ? 504 : 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }

  if (!outscraperRes.ok) {
    const errText = await outscraperRes.text()
    const errMsg = `Outscraper API ${outscraperRes.status}: ${errText.slice(0, 300)}`
    console.error('[outscraper-reviews] API error:', errMsg)
    await updateOutscraperError(serviceClient, tenantId, integrations, errMsg)
    return new Response(
      JSON.stringify({ error: `Outscraper API error: ${outscraperRes.status}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }

  const outscraperJson = await outscraperRes.json()

  // Outscraper response shape:
  //   { status: 'Success', data: [[{ name, reviews_count, rating, reviews_data: [...] }]] }
  const placeData: OutscraperPlaceData = outscraperJson?.data?.[0]?.[0] ?? {}
  const reviewsData: OutscraperReview[] = placeData.reviews_data ?? []
  const totalReviews = placeData.reviews_count ?? reviewsData.length

  console.log(`[outscraper-reviews] received ${reviewsData.length} reviews (profile total: ${totalReviews})`)

  // ── Upsert reviews into testimonials ───────────────────────────────────────
  // Strategy: read existing google_review_ids, batch-insert only new rows.
  // The partial unique index is a safety net against concurrent races.
  let insertedCount = 0
  const fetchedCount = reviewsData.length

  // Filter reviews that have a review_id (required for deduplication)
  const reviewsWithIds = reviewsData.filter((r) => !!r.review_id)

  if (reviewsWithIds.length > 0) {
    // 1. Fetch existing google_review_ids for this tenant
    const { data: existingRows } = await serviceClient
      .from('testimonials')
      .select('google_review_id')
      .eq('tenant_id', tenantId)
      .not('google_review_id', 'is', null)

    const existingIds = new Set<string>(
      (existingRows ?? []).map((r) => r.google_review_id as string).filter(Boolean),
    )

    // 2. Build rows to insert (only reviews not already in DB)
    const newRows = reviewsWithIds
      .filter((r) => !existingIds.has(r.review_id!))
      .map((r) => ({
        tenant_id: tenantId,
        author_name: (r.author_title ?? 'Google User').trim() || 'Google User',
        review_text: (r.review_text ?? '').trim(),
        rating: Math.min(5, Math.max(1, Math.round(r.review_rating ?? 5))),
        featured: false,
        source: 'google_outscraper',
        google_review_id: r.review_id!,
      }))

    insertedCount = newRows.length

    if (newRows.length > 0) {
      const { error: insertErr } = await serviceClient.from('testimonials').insert(newRows)
      if (insertErr) {
        // 23505 = unique_violation — partial index caught a concurrent race, safe to ignore
        if (!insertErr.code?.includes('23505')) {
          console.error('[outscraper-reviews] insert error:', insertErr.message)
          await updateOutscraperError(serviceClient, tenantId, integrations, insertErr.message)
          return new Response(
            JSON.stringify({ error: 'Failed to insert reviews: ' + insertErr.message }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          )
        }
        // On conflict, we don't know exactly how many inserted — log and continue
        console.warn('[outscraper-reviews] partial conflict during insert (concurrent run?) — continuing')
      }
      console.log(`[outscraper-reviews] inserted ${newRows.length} new reviews for tenant=${tenantId}`)
    }
  }

  // ── Record rate-limit event for manual mode ───────────────────────────────
  if (mode === 'manual') {
    await serviceClient.from('rate_limit_events').insert({
      key: `outscraper:refresh:${tenantId}`,
    })
  }

  // ── Update settings.integrations with sync metadata ───────────────────────
  const nowIso = new Date().toISOString()
  await serviceClient.from('settings').update({
    value: {
      ...integrations,
      outscraper_last_synced_at: nowIso,
      outscraper_review_total: totalReviews,
      outscraper_last_error: null,
    },
  }).eq('tenant_id', tenantId).eq('key', 'integrations')

  console.log(`[outscraper-reviews] done: tenant=${tenantId} mode=${mode} fetched=${fetchedCount} inserted=${insertedCount} total=${totalReviews}`)

  return new Response(
    JSON.stringify({
      success: true,
      mode,
      fetched_count: fetchedCount,
      inserted_count: insertedCount,
      total_reviews: totalReviews,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
  )
})
