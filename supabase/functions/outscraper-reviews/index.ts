// Edge function: outscraper-reviews v3 (MCP hotfix)
// Fixes from v2: reviews-v3→reviews-v2 endpoint, limit→reviewsLimit, FID-first priority, raw response logging

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getCorsHeaders(req) {
  const baseDomain = Deno.env.get('APP_BASE_DOMAIN') || 'pestflowpro.ai'
  const escapedBase = baseDomain.replace(/\./g, '\\.')
  const originRegex = new RegExp(`^https://([a-z0-9-]+\\.)?${escapedBase}$`)
  const requestOrigin = req.headers.get('Origin')
  let allowedOrigin = `https://${baseDomain}`
  if (requestOrigin) {
    if (originRegex.test(requestOrigin) || requestOrigin.startsWith('http://localhost:')) {
      allowedOrigin = requestOrigin
    }
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

class AuthError extends Error {
  constructor(status, body) { super(body.error); this.status = status; this.body = body }
}

async function requireTenantUser(req, requestedTenantId) {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''
  const token = authHeader.replace(/^[Bb]earer\s+/, '').trim()
  if (!token) throw new AuthError(401, { error: 'Unauthorized' })
  const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) throw new AuthError(401, { error: 'Unauthorized' })
  const { data: profile, error: profileError } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).maybeSingle()
  if (profileError || !profile?.tenant_id) throw new AuthError(403, { error: 'Forbidden' })
  if (profile.tenant_id !== requestedTenantId) throw new AuthError(403, { error: 'Forbidden' })
  return { user: { id: user.id, email: user.email }, tenantId: profile.tenant_id, role: profile.role }
}

function buildOutscraperQuery(integrations) {
  const fid = (integrations.google_fid ?? '').trim()
  const placeId = (integrations.google_place_id ?? '').trim()
  const cid = (integrations.google_cid ?? '').trim()
  // FID first — best-documented format for SABs (e.g. 0xaaa:0xbbb)
  if (fid) return fid
  if (placeId) return placeId
  if (cid) return `https://www.google.com/maps?cid=${encodeURIComponent(cid)}`
  return null
}

function parseTier(raw) {
  if (raw == null) return 1
  if (typeof raw === 'number') return raw
  const lower = String(raw).toLowerCase()
  if (lower === '4' || lower === 'elite') return 4
  if (lower === '3' || lower === 'pro') return 3
  if (lower === '2' || lower === 'grow' || lower === 'growth') return 2
  const asNum = parseInt(lower, 10)
  return isNaN(asNum) ? 1 : asNum
}

async function updateOutscraperError(serviceClient, tenantId, currentIntegrations, errorMessage) {
  await serviceClient.from('settings').update({
    value: { ...currentIntegrations, outscraper_last_error: errorMessage },
  }).eq('tenant_id', tenantId).eq('key', 'integrations')
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const outscraperKey = Deno.env.get('OUTSCRAPER_API_KEY') ?? ''
  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
  if (!body.tenant_id) {
    return new Response(JSON.stringify({ error: 'tenant_id required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }

  const tenantId = body.tenant_id
  const mode = body.mode ?? 'incremental'
  console.log(`[outscraper-reviews v3] request tenant=${tenantId} mode=${mode}`)

  const requestApiKey = req.headers.get('apikey') ?? ''
  let isCronCall = false
  if (requestApiKey) {
    const { data: vaultRow } = await serviceClient.schema('vault').from('decrypted_secrets').select('decrypted_secret').eq('name', 'outscraper_cron_internal_secret').maybeSingle()
    const internalSecret = vaultRow?.decrypted_secret ?? ''
    if (internalSecret && requestApiKey === internalSecret) {
      isCronCall = true
      console.log('[outscraper-reviews v3] auth: internal secret matched')
    }
  }

  if (!isCronCall) {
    try { await requireTenantUser(req, tenantId) } catch (e) {
      if (e instanceof AuthError) return new Response(JSON.stringify(e.body), { status: e.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      throw e
    }
    if (mode === 'manual') {
      const { data: subRow } = await serviceClient.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'subscription').maybeSingle()
      const tier = parseTier(subRow?.value?.tier)
      if (tier < 4) return new Response(JSON.stringify({ error: 'Manual refresh requires Elite plan (tier 4)' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }
  }

  if (mode === 'manual') {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    const { count } = await serviceClient.from('rate_limit_events').select('id', { count: 'exact', head: true }).eq('key', `outscraper:refresh:${tenantId}`).gte('created_at', sixHoursAgo)
    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ error: 'Rate limit: manual refresh allowed once per 6 hours' }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }
  }

  const { data: intRow } = await serviceClient.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
  const integrations = intRow?.value ?? {}
  const outscraperQuery = buildOutscraperQuery(integrations)
  if (!outscraperQuery) {
    return new Response(JSON.stringify({ error: 'No Google identifier configured' }), { status: 422, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
  if (!outscraperKey) {
    return new Response(JSON.stringify({ error: 'Outscraper API key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }

  const reviewLimit = mode === 'incremental' ? 50 : 200

  // FIX 1: reviews-v3 → reviews-v2
  // FIX 2: limit → reviewsLimit
  const outscraperUrl = new URL('https://api.app.outscraper.com/maps/reviews-v2')
  outscraperUrl.searchParams.set('query', outscraperQuery)
  outscraperUrl.searchParams.set('reviewsLimit', String(reviewLimit))
  outscraperUrl.searchParams.set('sort', 'newest')
  outscraperUrl.searchParams.set('async', 'false')

  console.log(`[outscraper-reviews v3] CALLING: ${outscraperUrl.toString()}`)

  let outscraperRes
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)
    outscraperRes = await fetch(outscraperUrl.toString(), { method: 'GET', headers: { 'X-API-KEY': outscraperKey }, signal: controller.signal })
    clearTimeout(timeoutId)
  } catch (e) {
    const isTimeout = e.name === 'AbortError'
    const errMsg = isTimeout ? 'Request timed out (60s)' : e.message
    console.error('[outscraper-reviews v3] FETCH ERROR:', errMsg)
    await updateOutscraperError(serviceClient, tenantId, integrations, errMsg)
    return new Response(JSON.stringify({ error: isTimeout ? 'Outscraper timeout' : 'Network error' }), { status: isTimeout ? 504 : 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }

  const rawText = await outscraperRes.text()
  console.log(`[outscraper-reviews v3] HTTP ${outscraperRes.status} | response length=${rawText.length}`)
  console.log(`[outscraper-reviews v3] RAW RESPONSE (first 3000 chars): ${rawText.slice(0, 3000)}`)

  if (!outscraperRes.ok) {
    const errMsg = `Outscraper API ${outscraperRes.status}: ${rawText.slice(0, 300)}`
    console.error('[outscraper-reviews v3] API error:', errMsg)
    await updateOutscraperError(serviceClient, tenantId, integrations, errMsg)
    return new Response(JSON.stringify({ error: errMsg }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }

  let outscraperJson
  try { outscraperJson = JSON.parse(rawText) } catch (e) {
    console.error('[outscraper-reviews v3] JSON PARSE ERROR:', e.message)
    return new Response(JSON.stringify({ error: 'Outscraper returned non-JSON' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }

  // Try multiple response shapes (Outscraper docs ambiguous on exact nesting)
  // Shape A: { data: [[{reviews_data}]] }   ← nested
  // Shape B: { data: [{reviews_data}] }      ← single nested
  // Shape C: { data: {reviews_data} }         ← unwrapped
  let placeData = {}
  if (Array.isArray(outscraperJson?.data)) {
    const first = outscraperJson.data[0]
    if (Array.isArray(first)) placeData = first[0] ?? {}
    else if (first && typeof first === 'object') placeData = first
  } else if (outscraperJson?.data && typeof outscraperJson.data === 'object') {
    placeData = outscraperJson.data
  }

  const reviewsData = placeData.reviews_data ?? []
  const totalReviews = placeData.reviews_count ?? reviewsData.length

  console.log(`[outscraper-reviews v3] PARSED: reviews=${reviewsData.length} total=${totalReviews} name=${placeData.name ?? '(unknown)'}`)

  let insertedCount = 0
  const fetchedCount = reviewsData.length
  const reviewsWithIds = reviewsData.filter((r) => !!r.review_id)

  if (reviewsWithIds.length > 0) {
    const { data: existingRows } = await serviceClient.from('testimonials').select('google_review_id').eq('tenant_id', tenantId).not('google_review_id', 'is', null)
    const existingIds = new Set((existingRows ?? []).map((r) => r.google_review_id).filter(Boolean))
    const newRows = reviewsWithIds.filter((r) => !existingIds.has(r.review_id)).map((r) => ({
      tenant_id: tenantId,
      author_name: (r.author_title ?? 'Google User').trim() || 'Google User',
      review_text: (r.review_text ?? '').trim(),
      rating: Math.min(5, Math.max(1, Math.round(r.review_rating ?? 5))),
      featured: false,
      source: 'google_outscraper',
      google_review_id: r.review_id,
    }))
    insertedCount = newRows.length
    if (newRows.length > 0) {
      const { error: insertErr } = await serviceClient.from('testimonials').insert(newRows)
      if (insertErr && !insertErr.code?.includes('23505')) {
        console.error('[outscraper-reviews v3] insert error:', insertErr.message)
        await updateOutscraperError(serviceClient, tenantId, integrations, insertErr.message)
        return new Response(JSON.stringify({ error: 'Failed to insert: ' + insertErr.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
      console.log(`[outscraper-reviews v3] INSERTED ${newRows.length} new reviews`)
    }
  }

  if (mode === 'manual') {
    await serviceClient.from('rate_limit_events').insert({ key: `outscraper:refresh:${tenantId}` })
  }

  await serviceClient.from('settings').update({
    value: { ...integrations, outscraper_last_synced_at: new Date().toISOString(), outscraper_review_total: totalReviews, outscraper_last_error: null },
  }).eq('tenant_id', tenantId).eq('key', 'integrations')

  console.log(`[outscraper-reviews v3] DONE: fetched=${fetchedCount} inserted=${insertedCount} total=${totalReviews}`)

  return new Response(JSON.stringify({ success: true, mode, fetched_count: fetchedCount, inserted_count: insertedCount, total_reviews: totalReviews }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
})
