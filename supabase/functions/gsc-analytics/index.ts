// Edge Function: gsc-analytics — S230
// On-demand + cron-driven Google Search Console snapshot via OAuth 2.0.
// Mirrors seo-analytics (S227) auth + write pattern: requireTenantUser gate,
// getCorsHeaders, every call writes a row to gsc_runs (service role).
// Deploy verify_jwt: true.
//
// CALLER DETECTION (mirrors S227):
//   - User JWT  → requireTenantUser(req, tenant_id) gate (interactive "Run Now").
//   - service_role JWT → cron/internal path: trust, tenant_id from body.
//     verify_jwt:true guarantees signature. Detection reads the `role` claim.
//
//   supabase functions deploy gsc-analytics --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { getTenantSecret, VaultSecretMissingError } from '../_shared/secrets/getTenantSecret.ts'

// verify_jwt:true validates signature before this code runs.
// Reading `role` claim from the already-trusted JWT is safe.
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

// Normalise a GSC property identifier.
// Accepts: sc-domain:foo.com | https://foo.com/ | foo.com | http://foo.com
// Returns: URL-prefix form with https scheme + trailing slash, OR sc-domain:… unchanged.
function normaliseSiteUrl(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('sc-domain:')) return trimmed
  // Strip any existing scheme so we can re-add https consistently.
  const stripped = trimmed.replace(/^https?:\/\//i, '')
  // Ensure no trailing slash is duplicated then add one.
  return `https://${stripped.replace(/\/$/, '')}/`
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

    const gscClientId     = Deno.env.get('GSC_OAUTH_CLIENT_ID') ?? ''
    const gscClientSecret = Deno.env.get('GSC_OAUTH_CLIENT_SECRET') ?? ''
    if (!gscClientId || !gscClientSecret) {
      return new Response(
        JSON.stringify({ error: 'Google Search Console not configured. Contact your account manager.' }),
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
      gsc_site_url?: string | null
      google_search_console_url?: string | null
    }

    const writeRun = async (row: Record<string, unknown>) => {
      const { data, error } = await supabaseAdmin
        .from('gsc_runs')
        .insert({ tenant_id: tenantId, ...row })
        .select()
        .single()
      if (error) {
        console.error('[gsc-analytics] run insert failed:', error.message)
        throw new Error(`Database write failed: ${error.message}`)
      }
      return data
    }

    // Check refresh token first — gate on unconfigured before anything else.
    // S254: GSC OAuth refresh token now lives in Vault (was
    // settings.integrations.gsc_oauth_refresh_token). Fail-hard helper:
    // "missing" = not connected (unconfigured); a Vault access error is surfaced
    // loudly as an error run rather than attempting a token exchange with a null
    // refresh token.
    let refreshToken: string
    try {
      refreshToken = await getTenantSecret(supabaseAdmin, tenantId, 'gsc_oauth_refresh_token')
    } catch (e) {
      if (e instanceof VaultSecretMissingError) {
        const run = await writeRun({ status: 'unconfigured' })
        return new Response(
          JSON.stringify({ status: 'unconfigured', message: 'Google Search Console not connected.', run }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      const msg = e instanceof Error ? e.message : String(e)
      const run = await writeRun({ status: 'error', api_error_code: 'vault_read_error', api_error_msg: msg })
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to read Google Search Console credentials from Vault.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Resolve site URL: prefer explicit gsc_site_url, fallback to google_search_console_url.
    const rawSiteUrl = integrations.gsc_site_url || integrations.google_search_console_url || ''
    if (!rawSiteUrl) {
      const run = await writeRun({
        status: 'error',
        api_error_code: 'no_site_url',
        api_error_msg: 'No GSC property URL configured. Add gsc_site_url to tenant integrations.',
      })
      return new Response(
        JSON.stringify({ status: 'error', message: 'No GSC property URL configured.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const siteUrl = normaliseSiteUrl(rawSiteUrl)

    // Exchange refresh token for a short-lived access token.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: gscClientId,
        client_secret: gscClientSecret,
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
          ? 'Google authorization was revoked. Reconnect Google Search Console.'
          : (tokenBody?.error_description ?? `Token exchange failed: ${tokenRes.status}`),
      })
      return new Response(
        JSON.stringify({
          status: 'error',
          message: isRevoked
            ? 'Google authorization was revoked. Reconnect Google Search Console.'
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

    // Build date range: 30 days ago → yesterday (GSC lags by ~1-2 days).
    const today = new Date()
    const endDate = new Date(today.getTime() - 1 * 86400000).toISOString().split('T')[0]
    const startDate = new Date(today.getTime() - 31 * 86400000).toISOString().split('T')[0]

    // Call GSC Search Analytics API.
    const gscUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`
    const gscRes = await fetch(gscUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 1000,
      }),
    })
    const gscBody = await gscRes.json().catch(() => null)

    if (!gscRes.ok) {
      const run = await writeRun({
        status: 'error',
        data_raw: gscBody,
        api_error_code: gscBody?.error?.status ?? String(gscRes.status),
        api_error_msg: gscBody?.error?.message ?? `GSC API error: ${gscRes.status}`,
      })
      return new Response(
        JSON.stringify({ status: 'error', message: 'Google Search Console API request failed.', run }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Aggregate across all query rows.
    type GscRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }
    const rows: GscRow[] = gscBody?.rows ?? []

    let totalClicks = 0
    let totalImpressions = 0
    let weightedCtr = 0
    let weightedPosition = 0

    for (const r of rows) {
      totalClicks      += r.clicks      ?? 0
      totalImpressions += r.impressions ?? 0
      weightedCtr      += (r.ctr       ?? 0) * (r.impressions ?? 0)
      weightedPosition += (r.position  ?? 0) * (r.impressions ?? 0)
    }

    const avgCtr      = totalImpressions > 0 ? weightedCtr / totalImpressions : 0
    const avgPosition = totalImpressions > 0 ? weightedPosition / totalImpressions : 0

    // Top 10 queries by clicks (already ordered by clicks desc by default in GSC response).
    const topQueries = rows
      .slice()
      .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0))
      .slice(0, 10)
      .map((r) => ({
        query:       r.keys?.[0] ?? '',
        clicks:      r.clicks      ?? 0,
        impressions: r.impressions ?? 0,
        position:    r.position    ?? 0,
      }))

    const data = {
      total_clicks:      totalClicks,
      total_impressions: totalImpressions,
      avg_ctr:           Math.round(avgCtr * 10000) / 10000,
      avg_position:      Math.round(avgPosition * 100) / 100,
      top_queries:       topQueries,
    }

    const run = await writeRun({ status: 'success', data, data_raw: gscBody })

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
