// Edge function: places-reviews v1
// Fetches Google Place details + reviews server-side, avoiding VITE_* key exposure.
// Auth: C2 — requireTenantUser (JWT required, tenant ownership enforced).
// DEPLOY:
//   supabase functions deploy places-reviews --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { stripVaultSecrets } from '../_shared/secrets/stripVaultSecrets.ts'

interface PlacesReviewsBody {
  tenant_id: string
}

interface NormalizedReview {
  author_name: string
  rating: number
  text: string
  relative_time_description: string
}

interface PlacesReviewsResponse {
  place_id: string
  rating: number
  user_ratings_total: number
  reviews: NormalizedReview[]
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const apiKey         = Deno.env.get('GOOGLE_PLACES_API_KEY') ?? ''

  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  // Parse body
  let body: PlacesReviewsBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  if (!body.tenant_id) {
    return new Response(JSON.stringify({ error: 'tenant_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // C2 auth: verify JWT + tenant ownership
  try {
    await requireTenantUser(req, body.tenant_id)
  } catch (e) {
    if (e instanceof AuthError) {
      return new Response(JSON.stringify(e.body), {
        status: e.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
    throw e
  }

  const tenantId = body.tenant_id

  // Read tenant settings: integrations + business_info
  const [{ data: intRow }, { data: bizRow }] = await Promise.all([
    serviceClient.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
    serviceClient.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
  ])

  const integrations = intRow?.value ?? {}
  const businessInfo = bizRow?.value ?? {}

  let placeId: string = integrations.google_place_id ?? ''

  console.log('[places-reviews] tenant:', tenantId, '| cached place_id:', JSON.stringify(placeId), '| biz name:', businessInfo.name, '| api_key present:', !!apiKey)

  // --- Place ID resolution (if not cached) ---
  if (!placeId) {
    const businessName = businessInfo.name ?? ''
    const businessAddress = businessInfo.address ?? ''

    if (!businessName) {
      return new Response(
        JSON.stringify({ error: 'No place_id and no google_fid/google_cid to resolve from' }),
        { status: 422, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // Build query candidates: try specific first (name + address), fall back to name-only.
    // Service-area businesses (common in pest control) may not have a street address on
    // Google Maps, so the full address query often returns 0 results for SABs.
    const queryAttempts: string[] = []
    if (businessAddress) {
      queryAttempts.push(`${businessName}, ${businessAddress}`)
    }
    queryAttempts.push(businessName)

    const runTextSearch = async (textQuery: string): Promise<string> => {
      const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id',
        },
        body: JSON.stringify({ textQuery }),
      })
      if (!searchRes.ok) {
        const errText = await searchRes.text()
        console.error('[places-reviews] Text Search error:', searchRes.status, errText)
        throw new Error(`Google Places API error: ${searchRes.status}`)
      }
      const json = await searchRes.json()
      const id: string = json?.places?.[0]?.id ?? ''
      console.log('[places-reviews] textQuery:', textQuery, '→ place_id:', id || '(none)')
      return id
    }

    for (const attempt of queryAttempts) {
      try {
        placeId = await runTextSearch(attempt)
      } catch (e) {
        return new Response(
          JSON.stringify({ error: (e as Error).message }),
          { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }
      if (placeId) break
    }

    if (!placeId) {
      console.error('[places-reviews] All query attempts returned no place_id. Attempts:', queryAttempts)
      return new Response(
        JSON.stringify({ error: 'No place_id and no google_fid/google_cid to resolve from' }),
        { status: 422, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // Cache-back: write resolved place_id to settings.integrations (service-role)
    await serviceClient
      .from('settings')
      // S255: strip Vault-managed secrets before the blob round-trip.
      .update({ value: { ...stripVaultSecrets(integrations), google_place_id: placeId } })
      .eq('tenant_id', tenantId)
      .eq('key', 'integrations')

    console.log('[places-reviews] Resolved and cached place_id for tenant', tenantId, '→', placeId)
  }

  // --- Fetch Place Details + Reviews ---
  const detailsRes = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,rating,userRatingCount,reviews',
      },
    },
  )

  if (!detailsRes.ok) {
    const errText = await detailsRes.text()
    console.error('[places-reviews] Place Details error:', detailsRes.status, errText)
    return new Response(
      JSON.stringify({ error: `Google Places API error: ${detailsRes.status}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }

  const detailsJson = await detailsRes.json()

  // Normalize Places API (New) shape → legacy-compatible client shape
  const reviews: NormalizedReview[] = (detailsJson.reviews ?? []).map(
    (r: {
      authorAttribution?: { displayName?: string }
      rating?: number
      text?: { text?: string }
      relativePublishTimeDescription?: string
    }) => ({
      author_name: r.authorAttribution?.displayName ?? 'Google User',
      rating: r.rating ?? 5,
      text: r.text?.text ?? '',
      relative_time_description: r.relativePublishTimeDescription ?? '',
    }),
  )

  const payload: PlacesReviewsResponse = {
    place_id: placeId,
    rating: detailsJson.rating ?? 0,
    user_ratings_total: detailsJson.userRatingCount ?? 0,
    reviews,
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
