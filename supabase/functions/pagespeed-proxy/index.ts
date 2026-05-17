// Edge Function: pagespeed-proxy — S224 C2 auth rewrite
// Gate: requireTenantUser — caller must be a user of the requesting tenant.
// Writes results to pagespeed_runs (service role) on every Google call.
//
// Deploy with verify_jwt: true (C2 pattern). tenant_id comes from the request
// body and is validated against the caller's JWT-derived profile.tenant_id.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // 1. CORS preflight bypass (no auth required)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Parse body (tenant_id required for auth scoping)
    const { url, tenant_id } = await req.json()
    if (!url) throw new Error('url is required')
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

    // 4. Service-role client for cache write
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 5. Build Google PageSpeed URLs (now with all 4 categories)
    const apiKey = Deno.env.get('PAGESPEED_API_KEY') ?? ''
    if (!apiKey) console.warn('PAGESPEED_API_KEY missing — Google call will fail')
    const categoryParams =
      '&category=performance&category=seo&category=accessibility&category=best-practices'
    const buildUrl = (strategy: string) =>
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
      `?url=${encodeURIComponent(url)}&strategy=${strategy}` +
      `&key=${apiKey}${categoryParams}`

    // 6. Call Google for both strategies in parallel
    const [desktopRes, mobileRes] = await Promise.all([
      fetch(buildUrl('desktop')),
      fetch(buildUrl('mobile')),
    ])
    const [desktop, mobile] = await Promise.all([
      desktopRes.json(),
      mobileRes.json(),
    ])

    // 7. Detect Google API errors (HTTP 200 wrapping an error body is common)
    const googleError =
      (desktop as Record<string, unknown>).error
      ?? (mobile as Record<string, unknown>).error
      ?? null

    if (googleError) {
      const errObj = googleError as Record<string, unknown>
      const errCode = String(errObj.code ?? '')
      const errMsg = String(errObj.message ?? 'Google PageSpeed API error')
      console.error('Google PageSpeed error:', errCode, errMsg)
      const { error: insertErr } = await supabaseAdmin
        .from('pagespeed_runs')
        .insert({
          tenant_id: tenantId,
          url,
          status: 'error',
          api_error_code: errCode,
          api_error_msg: errMsg,
        })
      if (insertErr) console.error('Error-row insert failed:', insertErr)
      return new Response(
        JSON.stringify({ status: 'error', code: errCode, message: errMsg }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 8. Extract scores from each strategy
    const extract = (data: Record<string, unknown>) => {
      const cats = (data.lighthouseResult as Record<string, unknown>)?.categories as
        | Record<string, { score: number | null }>
        | undefined
      if (!cats) return null
      const pct = (v: number | null | undefined) =>
        v == null ? null : Math.round(v * 100)
      return {
        performance:   pct(cats.performance?.score),
        seo:           pct(cats.seo?.score),
        accessibility: pct(cats.accessibility?.score),
        bestPractices: pct(cats['best-practices']?.score),
      }
    }
    const d = extract(desktop)
    const m = extract(mobile)

    // 9. Insert success row (blocking)
    const { data: row, error: insertErr } = await supabaseAdmin
      .from('pagespeed_runs')
      .insert({
        tenant_id: tenantId,
        url,
        status: 'success',
        desktop_performance:    d?.performance ?? null,
        desktop_seo:            d?.seo ?? null,
        desktop_accessibility:  d?.accessibility ?? null,
        desktop_best_practices: d?.bestPractices ?? null,
        mobile_performance:     m?.performance ?? null,
        mobile_seo:             m?.seo ?? null,
        mobile_accessibility:   m?.accessibility ?? null,
        mobile_best_practices:  m?.bestPractices ?? null,
        desktop_raw: desktop,
        mobile_raw: mobile,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Success-row insert failed:', insertErr)
      throw new Error(`Database write failed: ${insertErr.message}`)
    }

    return new Response(
      JSON.stringify({ status: 'success', row }),
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
