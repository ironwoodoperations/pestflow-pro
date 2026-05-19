// Edge Function: zernio-analytics — S226
// On-demand social analytics snapshot. Mirrors the pagespeed-proxy (S224 C2)
// auth + write pattern: requireTenantUser gate, getCorsHeaders, every call
// writes a row to zernio_runs (service role).
//
// Deploy with verify_jwt: true (C2 pattern). tenant_id comes from the request
// body and is validated against the caller's JWT-derived profile.tenant_id.
//   supabase functions deploy zernio-analytics --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

// Zernio platform string → frontend/storage key (google_business is the exception)
const FROM_ZERNIO: Record<string, string> = {
  facebook: 'facebook',
  instagram: 'instagram',
  youtube: 'youtube',
  linkedin: 'linkedin',
  tiktok: 'tiktok',
  googlebusiness: 'google_business',
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // 1. CORS preflight bypass (no auth required)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Parse body (tenant_id required for auth scoping)
    const { tenant_id } = await req.json().catch(() => ({}))
    if (!tenant_id) throw new Error('tenant_id is required')

    // 3. Auth — validate JWT + tenant ownership
    try {
      await requireTenantUser(req, tenant_id)
    } catch (e) {
      if (e instanceof AuthError) {
        return new Response(JSON.stringify(e.body), {
          status: e.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw e
    }
    const tenantId = tenant_id

    // 4. Service-role client for settings read + run write
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const zernioApiKey = Deno.env.get('ZERNIO_API_KEY') ?? ''
    if (!zernioApiKey) {
      return new Response(
        JSON.stringify({ error: 'Social analytics not configured. Contact your account manager.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 5. Load tenant Zernio profile + connected accounts
    const { data: setting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'integrations')
      .maybeSingle()

    const integrations = (setting?.value ?? {}) as {
      zernio_profile_id?: string
    }
    const profileId = integrations.zernio_profile_id

    const writeRun = async (row: Record<string, unknown>) => {
      const { data, error } = await supabaseAdmin
        .from('zernio_runs')
        .insert({ tenant_id: tenantId, ...row })
        .select()
        .single()
      if (error) {
        console.error('[zernio-analytics] run insert failed:', error.message)
        throw new Error(`Database write failed: ${error.message}`)
      }
      return data
    }

    if (!profileId) {
      const run = await writeRun({
        status: 'error',
        api_error_code: 'no_profile',
        api_error_msg: 'No Zernio profile connected for this tenant.',
      })
      return new Response(
        JSON.stringify({ status: 'error', message: 'No Zernio profile connected.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Build fromDate = 30 days ago (YYYY-MM-DD)
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    // Single call — post-level analytics for all posts in window (up to 100).
    // Note: runs with >100 posts in 30 days will aggregate only the first 100.
    const analyticsUrl =
      `https://zernio.com/api/v1/analytics?profileId=${encodeURIComponent(profileId)}&fromDate=${fromDate}&limit=100`
    const analyticsRes = await fetch(analyticsUrl, {
      headers: { 'Authorization': `Bearer ${zernioApiKey}` },
    })
    const analyticsBody = await analyticsRes.json().catch(() => null)

    if (!analyticsRes.ok) {
      const run = await writeRun({
        status: 'error',
        data: null,
        data_raw: analyticsBody,
        api_error_code: String(analyticsRes.status),
        api_error_msg:
          analyticsBody?.error || analyticsBody?.message || `Zernio API error: ${analyticsRes.status}`,
      })
      return new Response(
        JSON.stringify({ status: 'error', message: 'Zernio analytics fetch failed.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Accumulate raw metric buckets per storage key across all posts
    const acc: Record<string, {
      likes: number; comments: number; shares: number
      saves: number; clicks: number; views: number
      reach: number; impressions: number
    }> = {}

    for (const post of (analyticsBody?.posts ?? []) as Array<{
      platforms?: Array<{ platform: string; analytics?: Record<string, number> }>
    }>) {
      for (const p of post.platforms ?? []) {
        const key = FROM_ZERNIO[p.platform] ?? p.platform
        if (!acc[key]) {
          acc[key] = {
            likes: 0, comments: 0, shares: 0, saves: 0,
            clicks: 0, views: 0, reach: 0, impressions: 0,
          }
        }
        const a = p.analytics ?? {}
        acc[key].likes       += a.likes       ?? 0
        acc[key].comments    += a.comments    ?? 0
        acc[key].shares      += a.shares      ?? 0
        acc[key].saves       += a.saves       ?? 0
        acc[key].clicks      += a.clicks      ?? 0
        acc[key].views       += a.views       ?? 0
        acc[key].reach       += a.reach       ?? 0
        acc[key].impressions += a.impressions ?? 0
      }
    }

    // Normalize into {followers, engagement, reach} per platform.
    // youtube: views are reach, not engagement (views already counted in reach).
    // google_business: GBP deprecated per-post analytics; impressions → reach.
    const data: Record<string, { followers: number | null; engagement: number; reach: number }> = {}

    for (const [key, m] of Object.entries(acc)) {
      if (key === 'youtube') {
        data[key] = { followers: null, engagement: m.likes + m.comments + m.shares, reach: m.views }
      } else if (key === 'google_business') {
        data[key] = { followers: null, engagement: m.clicks + m.likes, reach: m.impressions }
      } else {
        data[key] = {
          followers: null,
          engagement: m.likes + m.comments + m.shares + m.saves + m.clicks,
          reach: m.reach,
        }
      }
    }

    // S229: merge account-level follower counts from accounts[] (ignored pre-S229
    // — followers was hardcoded null). Additive only: engagement/reach computed
    // above from posts[] are left untouched. This ALSO surfaces platforms that
    // have a connected account but no posts in-window (previously omitted
    // entirely because `data` was built solely from posts[]). Same FROM_ZERNIO
    // normalization as the posts[] path (googlebusiness → google_business).
    for (const acct of (analyticsBody?.accounts ?? []) as Array<{
      platform?: string; followersCount?: number | null
    }>) {
      if (!acct.platform) continue
      const key = FROM_ZERNIO[acct.platform] ?? acct.platform
      if (!data[key]) {
        data[key] = { followers: null, engagement: 0, reach: 0 }
      }
      data[key].followers = acct.followersCount ?? null
    }

    const run = await writeRun({ status: 'success', data, data_raw: analyticsBody })

    return new Response(
      JSON.stringify({ status: 'success', run }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const msg = (err as Error).message
    const isAuth = msg.toLowerCase().includes('unauth') || msg.toLowerCase().includes('tenant')
    return new Response(
      JSON.stringify({ error: msg }),
      {
        status: isAuth ? 401 : 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      },
    )
  }
})
