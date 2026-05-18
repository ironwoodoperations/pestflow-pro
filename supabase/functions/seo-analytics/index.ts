// Edge Function: seo-analytics — S227.
// On-demand + cron-driven DataForSEO Labs snapshot. Mirrors zernio-analytics
// (S226 C2) auth + write pattern: requireTenantUser gate, getCorsHeaders, every
// kind writes its own row to seo_runs (service role). Deploy verify_jwt: true.
//
// CALLER DETECTION (S227 sets this precedent — S224/S225/S226 were manual-only):
//   - User JWT  → requireTenantUser(req, tenant_id) gate (interactive "Run Now").
//   - service_role JWT → internal/cron path: trust, tenant_id from body, skip
//     the user gate. Phase 4 pg_cron invokes via pg_net with the service-role
//     key as Bearer. Detection reads the `role` claim of the platform-validated
//     JWT (verify_jwt:true guarantees the signature before this code runs), NOT
//     a raw string-equality against SUPABASE_SERVICE_ROLE_KEY — the vault copy
//     of that key can legitimately differ from the edge runtime's injected env.
//
//   supabase functions deploy seo-analytics --project-ref biezzykcgzkrwdgqpsar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { createDFSClient } from '../_shared/dataforseo.ts'

type Kind = 'rankings' | 'competitors' | 'opportunities'
const ALL_KINDS: Kind[] = ['rankings', 'competitors', 'opportunities']

// custom_domain is the ADMIN host (admin.dangpestcontrol.com); strip the leading
// admin. for the public marketing domain. Fallback: <subdomain>.pestflowpro.ai.
function resolveTarget(t: { custom_domain: string | null; subdomain: string | null }): string | null {
  if (t.custom_domain) return t.custom_domain.replace(/^admin\./i, '')
  if (t.subdomain) return `${t.subdomain}.pestflowpro.ai`
  return null
}

// verify_jwt:true validates the signature before this runs, so the decoded
// `role` claim is trustworthy. service_role => internal/cron caller.
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
    const { tenant_id, kind, action, keyword } = await req.json().catch(() => ({}))
    if (!tenant_id) throw new Error('tenant_id is required')

    // Auth — internal/cron (service-role bearer) bypasses the user gate.
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

    const dfsLogin = Deno.env.get('DATAFORSEO_LOGIN') ?? ''
    const dfsPassword = Deno.env.get('DATAFORSEO_PASSWORD') ?? ''
    if (!dfsLogin || !dfsPassword) {
      return new Response(
        JSON.stringify({ error: 'SEO analytics not configured. Contact your account manager.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const dfs = createDFSClient({ login: dfsLogin, password: dfsPassword })

    // Resolve tenant target domain + configured competitors.
    const { data: tenantRow } = await supabaseAdmin
      .from('tenants').select('custom_domain, subdomain').eq('id', tenantId).maybeSingle()
    const target = tenantRow ? resolveTarget(tenantRow) : null
    if (!target) {
      return new Response(
        JSON.stringify({ error: 'No resolvable domain for this tenant.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: seoSetting } = await supabaseAdmin
      .from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'seo_analytics').maybeSingle()
    const seoCfg = (seoSetting?.value ?? {}) as { seed_keywords?: string[]; competitors?: string[] }
    const configuredCompetitors = (seoCfg.competitors ?? [])
      .map((c) => c.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').trim())
      .filter(Boolean).slice(0, 3)

    // Onboarding "Suggest more keywords" — NOT persisted (kind CHECK allows 3).
    if (action === 'suggestions') {
      const seed = (keyword || seoCfg.seed_keywords?.[0] || target).toString()
      const { data, error } = await dfs.keywordSuggestions({ keyword: seed, limit: 20 })
      return new Response(
        JSON.stringify(error ? { status: 'error', message: error.message } : { status: 'success', suggestions: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Weekly "Run Now" rate limit (validator Q2). User-triggered only — cron
    // (internal) has its own 7-day freshness filter in the dispatch query.
    if (!isInternal) {
      const { data: allowed } = await supabaseAdmin
        .rpc('seo_run_now_allowed', { p_tenant_id: tenantId, p_kind: kind ?? null })
      if (allowed === false) {
        const { data: retryAfter } = await supabaseAdmin
          .rpc('seo_run_next_allowed_at', { p_tenant_id: tenantId, p_kind: kind ?? null })
        return new Response(
          JSON.stringify({ error: 'Rate limited — SEO analytics runs weekly.', rate_limited: true, retry_after: retryAfter }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    const writeRun = async (row: Record<string, unknown>) => {
      const { data, error } = await supabaseAdmin
        .from('seo_runs').insert({ tenant_id: tenantId, ...row }).select().single()
      if (error) {
        console.error('[seo-analytics] run insert failed:', error.message)
        throw new Error(`Database write failed: ${error.message}`)
      }
      return data
    }

    const kindsToRun: Kind[] = kind && ALL_KINDS.includes(kind) ? [kind] : ALL_KINDS
    const runs: unknown[] = []

    // Continue-on-error: each kind succeeds or fails on its own row.
    for (const k of kindsToRun) {
      if (k === 'rankings') {
        const { data, error } = await dfs.rankedKeywords({ target, limit: 20 })
        if (error) {
          runs.push(await writeRun({ kind: k, status: 'error', api_error_code: error.code, api_error_msg: error.message }))
        } else {
          const items = ((data?.[0] as { items?: Array<Record<string, unknown>> })?.items ?? []).map((it) => {
            const ki = (it.keyword_data as { keyword_info?: { search_volume?: number } } | undefined)
            const se = (it.ranked_serp_element as { serp_item?: { rank_absolute?: number; relative_url?: string; url?: string } } | undefined)?.serp_item
            return {
              keyword: (it.keyword_data as { keyword?: string } | undefined)?.keyword ?? null,
              position: se?.rank_absolute ?? null,
              search_volume: ki?.keyword_info?.search_volume ?? null,
              url: se?.url ?? se?.relative_url ?? null,
            }
          })
          runs.push(await writeRun({ kind: k, status: 'success', data: { target, items }, data_raw: data }))
        }
      } else if (k === 'competitors') {
        const { data, error } = await dfs.competitorsDomain({ target, limit: 3 })
        if (error) {
          runs.push(await writeRun({ kind: k, status: 'error', api_error_code: error.code, api_error_msg: error.message }))
        } else {
          const items = ((data?.[0] as { items?: Array<Record<string, unknown>> })?.items ?? []).map((it) => {
            const m = (it.metrics as { organic?: { pos_1?: number; etv?: number; count?: number } } | undefined)?.organic
            return {
              domain: (it.domain as string) ?? null,
              avg_position: (it.avg_position as number) ?? null,
              intersections: m?.count ?? null,
              visibility: m?.etv ?? null,
            }
          })
          runs.push(await writeRun({ kind: k, status: 'success', data: { target, items }, data_raw: data }))
        }
      } else if (k === 'opportunities') {
        // Competitors: configured list, else top from a fresh competitorsDomain call.
        let competitors = configuredCompetitors
        if (competitors.length === 0) {
          const { data: cd } = await dfs.competitorsDomain({ target, limit: 3 })
          competitors = ((cd?.[0] as { items?: Array<{ domain?: string }> })?.items ?? [])
            .map((i) => i.domain).filter((d): d is string => !!d).slice(0, 3)
        }
        if (competitors.length === 0) {
          runs.push(await writeRun({ kind: k, status: 'error', api_error_code: 'no_competitors', api_error_msg: 'No competitor domains configured or discoverable.' }))
        } else {
          for (const competitor of competitors) {
            // target1=competitor, target2=tenant + intersections:false =>
            // keywords the COMPETITOR ranks for that the tenant does NOT.
            // first_domain_serp_element = competitor (populated),
            // second_domain_serp_element = tenant (null when it doesn't rank).
            const { data, error } = await dfs.domainIntersection({ target1: competitor, target2: target, limit: 10 })
            if (error) {
              runs.push(await writeRun({ kind: k, status: 'error', api_error_code: error.code, api_error_msg: `${competitor}: ${error.message}` }))
            } else {
              const items = ((data?.[0] as { items?: Array<Record<string, unknown>> })?.items ?? []).map((it) => {
                const fd = it.first_domain_serp_element as { rank_absolute?: number } | undefined
                const sd = it.second_domain_serp_element as { rank_absolute?: number } | undefined
                const kd = it.keyword_data as { keyword?: string; keyword_info?: { search_volume?: number } } | undefined
                return {
                  keyword: kd?.keyword ?? null,
                  competitor_position: fd?.rank_absolute ?? null,
                  target_position: sd?.rank_absolute ?? null,
                  search_volume: kd?.keyword_info?.search_volume ?? null,
                }
              })
              runs.push(await writeRun({ kind: k, status: 'success', data: { target, competitor, items }, data_raw: data }))
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ status: 'success', runs }),
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
