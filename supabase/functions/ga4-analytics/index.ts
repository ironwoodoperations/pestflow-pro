// Edge Function: ga4-analytics — S231 Phase 2
// On-demand + cron-driven Google Analytics 4 snapshot via OAuth 2.0.
// Mirrors gsc-analytics (S230) auth + write pattern: requireTenantUser gate,
// getCorsHeaders, every call writes a row to ga4_runs (service role).
// Deploy verify_jwt: true.
//
// CALLER DETECTION (mirrors S230):
//   - User JWT  → requireTenantUser(req, tenant_id) gate (interactive "Run Now").
//   - service_role JWT → cron/internal path: trust, tenant_id from body.
//     verify_jwt:true guarantees signature. Detection reads the `role` claim.
//
//   supabase functions deploy ga4-analytics --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { getTenantSecret, VaultSecretMissingError } from '../_shared/secrets/getTenantSecret.ts'

function isServiceRoleToken(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    if (!payload) return false
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return claims.role === 'service_role'
  } catch {
    return false
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tenant_id } = await req.json().catch(() => ({}))
    if (!tenant_id) throw new Error('tenant_id is required')

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || ''
    const token = authHeader.replace(/^[Bb]earer\s+/, '').trim()
    const isInternal = token.length > 0 && isServiceRoleToken(token)

    if (!isInternal) {
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
    }
    const tenantId = tenant_id

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const clientId     = Deno.env.get('GSC_OAUTH_CLIENT_ID') ?? ''
    const clientSecret = Deno.env.get('GSC_OAUTH_CLIENT_SECRET') ?? ''
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Google Analytics not configured. Contact your account manager.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Load tenant integrations.
    const { data: intSetting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('tenant_id', tenantId)
      .eq('key', 'integrations')
      .maybeSingle()

    const integrations = (intSetting?.value ?? {}) as {
      ga4_property_id?: string | null
    }

    const writeRun = async (row: Record<string, unknown>) => {
      const { data, error } = await supabaseAdmin
        .from('ga4_runs')
        .insert({ tenant_id: tenantId, ...row })
        .select()
        .single()
      if (error) {
        console.error('[ga4-analytics] run insert failed:', error.message)
        throw new Error(`Database write failed: ${error.message}`)
      }
      return data
    }

    // S254: GA4 OAuth refresh token now lives in Vault (was
    // settings.integrations.ga4_oauth_refresh_token). Fail-hard helper:
    // "missing" = not connected (unconfigured); a Vault access error is surfaced
    // loudly as an error run rather than attempting a token exchange with a null
    // refresh token.
    let refreshToken: string
    try {
      refreshToken = await getTenantSecret(supabaseAdmin, tenantId, 'ga4_oauth_refresh_token')
    } catch (e) {
      if (e instanceof VaultSecretMissingError) {
        const run = await writeRun({ status: 'unconfigured' })
        return new Response(
          JSON.stringify({ status: 'unconfigured', message: 'Google Analytics 4 not connected.', run }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      const msg = e instanceof Error ? e.message : String(e)
      const run = await writeRun({ status: 'error', api_error_code: 'vault_read_error', api_error_msg: msg })
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to read Google Analytics credentials from Vault.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const propertyId = integrations.ga4_property_id
    if (!propertyId) {
      const run = await writeRun({
        status: 'error',
        api_error_code: 'no_property_id',
        api_error_msg: 'No GA4 property ID configured. Add ga4_property_id to tenant integrations.',
      })
      return new Response(
        JSON.stringify({ status: 'error', message: 'No GA4 property ID configured.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Exchange refresh token for a short-lived access token. Same OAuth client as GSC (S230).
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })
    const tokenBody = await tokenRes.json().catch(() => null)

    if (!tokenRes.ok) {
      const errorCode = tokenBody?.error ?? String(tokenRes.status)
      const isRevoked = errorCode === 'invalid_grant'
      const run = await writeRun({
        status: 'error',
        api_error_code: isRevoked ? 'token_revoked' : errorCode,
        api_error_msg: isRevoked
          ? 'Google authorization was revoked. Reconnect Google Analytics.'
          : (tokenBody?.error_description ?? `Token exchange failed: ${tokenRes.status}`),
      })
      return new Response(
        JSON.stringify({
          status: 'error',
          message: isRevoked
            ? 'Google authorization was revoked. Reconnect Google Analytics.'
            : 'Failed to mint Google access token.',
          run,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const accessToken = tokenBody?.access_token
    if (!accessToken) {
      const run = await writeRun({
        status: 'error',
        api_error_code: 'no_access_token',
        api_error_msg: 'Token exchange succeeded but no access_token in response.',
      })
      return new Response(
        JSON.stringify({ status: 'error', message: 'Token exchange returned no access token.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // GA4 Data API property path. Store just the numeric ID; prepend "properties/".
    const propertyPath = propertyId.startsWith('properties/')
      ? propertyId
      : `properties/${propertyId}`

    const ga4BaseUrl = `https://analyticsdata.googleapis.com/v1beta/${propertyPath}:runReport`
    const authHeader2 = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

    // Call 1: channel group breakdown (users, sessions, engagement rate, page views).
    const channelRes = await fetch(ga4BaseUrl, {
      method: 'POST',
      headers: authHeader2,
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'engagementRate' },
          { name: 'screenPageViews' },
        ],
      }),
    })
    const channelBody = await channelRes.json().catch(() => null)

    if (!channelRes.ok) {
      const run = await writeRun({
        status: 'error',
        data_raw: channelBody,
        api_error_code: channelBody?.error?.status ?? String(channelRes.status),
        api_error_msg: channelBody?.error?.message ?? `GA4 API error: ${channelRes.status}`,
      })
      return new Response(
        JSON.stringify({ status: 'error', message: 'GA4 Data API request failed.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Call 2: top 10 pages by page views.
    const pagesRes = await fetch(ga4BaseUrl, {
      method: 'POST',
      headers: authHeader2,
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 10,
      }),
    })
    const pagesBody = await pagesRes.json().catch(() => null)

    // Aggregate channel rows.
    type ChannelRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }
    const channelRows: ChannelRow[] = channelBody?.rows ?? []

    let totalUsers = 0
    let totalSessions = 0
    let weightedEngagement = 0
    let totalPageViews = 0

    const channels: Array<{ channel: string; sessions: number; users: number }> = []

    for (const r of channelRows) {
      const channel  = r.dimensionValues?.[0]?.value ?? 'Unknown'
      const users    = parseInt(r.metricValues?.[0]?.value ?? '0', 10)
      const sessions = parseInt(r.metricValues?.[1]?.value ?? '0', 10)
      const engRate  = parseFloat(r.metricValues?.[2]?.value ?? '0')
      const views    = parseInt(r.metricValues?.[3]?.value ?? '0', 10)

      totalUsers    += users
      totalSessions += sessions
      weightedEngagement += engRate * sessions
      totalPageViews += views

      channels.push({ channel, sessions, users })
    }

    const avgEngagementRate = totalSessions > 0
      ? Math.round((weightedEngagement / totalSessions) * 10000) / 10000
      : 0

    // Sort channels by sessions desc.
    channels.sort((a, b) => b.sessions - a.sessions)

    // Top pages.
    type PageRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }
    const pageRows: PageRow[] = pagesBody?.rows ?? []
    const topPages = pageRows.map((r) => ({
      page:  r.dimensionValues?.[0]?.value ?? '/',
      views: parseInt(r.metricValues?.[0]?.value ?? '0', 10),
    }))

    const data = {
      total_users:          totalUsers,
      total_sessions:       totalSessions,
      avg_engagement_rate:  avgEngagementRate,
      total_page_views:     totalPageViews,
      channels,
      top_pages: topPages,
    }

    const dataRaw = { channel_report: channelBody, pages_report: pagesBody }
    const run = await writeRun({ status: 'success', data, data_raw: dataRaw })

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
