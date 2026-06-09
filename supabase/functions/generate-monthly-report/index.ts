// Edge Function: generate-monthly-report — S259.
// Async worker that builds a per-tenant, per-month PRESCRIPTIVE SEO/content
// report: deterministic rules detect issues, attach the page + an admin
// deep-link, ai-proxy narrates them into plain-English owner guidance, and the
// result is rendered to a self-contained HTML doc stored in the PRIVATE
// 'reports' bucket and listed to tenant admins on the Reports tab.
//
// Invoked server-to-server by the report-queue worker cron (pg_net) — NOT by a
// browser. Auth (verify_jwt:false): apikey header == GENERATE_MONTHLY_REPORT_INTERNAL_SECRET
// (constant-time, mirrors process-campaign-job / notify-new-lead). Runs as
// SERVICE ROLE.
//
// NEVER calls api.anthropic.com directly — narration routes through
// ai-proxy /internal with a signed delegation envelope (CLAUDE.md #3 / S242).
// On ANY proxy failure (incl. the Pro-tier 403 for sub-Pro tenants) narration
// falls back to templated text — narration failure NEVER fails the report.
//
// DEPLOY verify_jwt:false. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   GENERATE_MONTHLY_REPORT_INTERNAL_SECRET, INTERNAL_DELEGATION_SECRET.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'
import { buildEnvelope, signEnvelope } from '../_shared/delegationEnvelope.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const INTERNAL_SECRET = Deno.env.get('GENERATE_MONTHLY_REPORT_INTERNAL_SECRET') || ''
const DELEGATION_SECRET = Deno.env.get('INTERNAL_DELEGATION_SECRET') || ''
const AI_PROXY_INTERNAL_URL = `${SUPABASE_URL}/functions/v1/ai-proxy/internal`

const STALE_PROCESSING_MS = 15 * 60 * 1000   // a 'processing' row older than this is reclaimable
const NARRATION_MAX_TOKENS = 4096

type Severity = 'high' | 'medium' | 'low'
type Category = 'meta' | 'content' | 'keyword' | 'engagement' | 'technical'

interface Finding {
  id: string
  category: Category
  severity: Severity
  page_slug: string | null   // null = site-wide
  page_name: string
  admin_deeplink: string
  problem: string            // deterministic templated text (always present)
  metric?: string
}

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 }
// Non-service pages — the all-images-empty LOW rule only fires on service/location pages.
const NON_SERVICE_SLUGS = new Set(['home', 'about', 'contact', 'quote', 'faq', 'blog'])

function constantTimeEq(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a); const eb = new TextEncoder().encode(b)
  return ea.length === eb.length && timingSafeEqual(ea, eb)
}
const stripJson = (t: string) => t.replace(/```json|```/g, '').trim()
const titleCase = (slug: string) =>
  slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

serve(async (req) => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })
  if (!INTERNAL_SECRET) { console.error('[generate-monthly-report] secret not set'); return json(500, { error: 'Server misconfigured' }) }
  if (!constantTimeEq(INTERNAL_SECRET, req.headers.get('apikey') || '')) return json(401, { error: 'Unauthorized' })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'Invalid JSON' }) }
  const tenantId = typeof body.tenant_id === 'string' ? body.tenant_id.trim() : ''
  const period = typeof body.period === 'string' ? body.period.trim() : ''
  if (!tenantId || !/^\d{4}-\d{2}$/.test(period)) return json(400, { error: 'tenant_id and period (YYYY-MM) required' })

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const nowIso = () => new Date().toISOString()

  // ── 1. CLAIM (atomic, idempotent) ──────────────────────────────────────────
  // Two simple guarded updates instead of one OR-filter: first pending/failed,
  // then a stale 'processing' row (>15 min). A fresh 'processing'/'complete' row
  // claims nothing → exit 200 (double-dispatch from the worker is harmless).
  const claim = async () => {
    const pf = await svc.from('report_jobs')
      .update({ status: 'processing', started_at: nowIso() })
      .eq('tenant_id', tenantId).eq('period', period).in('status', ['pending', 'failed'])
      .select('id, attempts')
    if (pf.error) throw new Error(`claim_pf: ${pf.error.message}`)
    if (pf.data && pf.data.length > 0) return pf.data[0]
    const staleTs = new Date(Date.now() - STALE_PROCESSING_MS).toISOString()
    const st = await svc.from('report_jobs')
      .update({ status: 'processing', started_at: nowIso() })
      .eq('tenant_id', tenantId).eq('period', period).eq('status', 'processing').lt('started_at', staleTs)
      .select('id, attempts')
    if (st.error) throw new Error(`claim_stale: ${st.error.message}`)
    return (st.data && st.data.length > 0) ? st.data[0] : null
  }

  let jobRow: { id: string; attempts: number } | null
  try {
    jobRow = await claim()
  } catch (e) {
    console.error('[generate-monthly-report] claim error:', (e as Error).message)
    return json(500, { error: 'claim failed' })
  }
  if (!jobRow) return json(200, { ok: true, note: 'already processing or complete' })

  // bump attempts (best-effort; claim already serialized the winner)
  await svc.from('report_jobs').update({ attempts: (jobRow.attempts ?? 0) + 1 }).eq('id', jobRow.id)

  const failJob = async (msg: string) => {
    await svc.from('report_jobs').update({ status: 'failed', last_error: msg.slice(0, 500), finished_at: nowIso() }).eq('id', jobRow!.id)
    return json(500, { error: 'report generation failed', detail: msg.slice(0, 200) })
  }

  try {
    // ── 2. DETECT ─────────────────────────────────────────────────────────────
    const [metaRes, pageRes, kwRes, gscRes] = await Promise.all([
      svc.from('seo_meta').select('page_slug, meta_title, meta_description, focus_keyword, user_edited').eq('tenant_id', tenantId),
      svc.from('page_content').select('page_slug, title, intro, image_url, page_hero_image_url, image_1_url, image_2_url, image_3_url').eq('tenant_id', tenantId),
      svc.from('keyword_placements').select('keyword, page_slug, suggested_text, applied').eq('tenant_id', tenantId).eq('applied', false),
      svc.from('gsc_runs').select('data, ran_at, status').eq('tenant_id', tenantId).order('ran_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    const metaRows = metaRes.data ?? []
    const pageRows = pageRes.data ?? []
    const kwRows = kwRes.data ?? []
    const gscData = (gscRes.data?.data ?? null) as { total_impressions?: number; top_queries?: Array<{ query: string; clicks: number; impressions: number; position: number }> } | null

    // page_slug → display title (page_content.title, else title-cased slug)
    const titleBySlug = new Map<string, string>()
    for (const p of pageRows) if (p.page_slug && p.title) titleBySlug.set(p.page_slug, p.title)
    const pageName = (slug: string | null) => slug ? (titleBySlug.get(slug) ?? titleCase(slug)) : 'Your website'
    // No URL-param deep-link contract exists in the admin SPA (Dashboard.tsx uses
    // useState for tab selection; SeoPagesTab has no slug filter param). v1 links
    // to the admin dashboard root; the finding text names the page to open.
    const ADMIN_DEEPLINK = '/admin'

    const findings: Finding[] = []
    const ransRules: string[] = []
    let fid = 0
    const nextId = () => `f${fid++}`

    // META — respect user_edited (never nag a human-set page)
    ransRules.push('meta')
    const titleCounts = new Map<string, string[]>()  // normalized title → slugs
    for (const m of metaRows) {
      const slug = m.page_slug as string
      if (m.meta_title && typeof m.meta_title === 'string') {
        const key = m.meta_title.trim().toLowerCase()
        if (key) titleCounts.set(key, [...(titleCounts.get(key) ?? []), slug])
      }
      if (m.user_edited === true) continue  // suppress per-field nags on human-edited pages
      const name = pageName(slug)
      const desc = (m.meta_description ?? '') as string
      const title = (m.meta_title ?? '') as string
      if (!desc.trim()) {
        findings.push({ id: nextId(), category: 'meta', severity: 'high', page_slug: slug, page_name: name, admin_deeplink: ADMIN_DEEPLINK, problem: `The "${name}" page has no meta description — Google often shows a random snippet instead of a sentence that sells your service.` })
      } else if (desc.length < 70 || desc.length > 160) {
        findings.push({ id: nextId(), category: 'meta', severity: 'medium', page_slug: slug, page_name: name, admin_deeplink: ADMIN_DEEPLINK, problem: `The "${name}" page meta description is ${desc.length} characters — aim for 70–160 so Google shows the whole thing.`, metric: `${desc.length} chars` })
      }
      if (!title.trim()) {
        findings.push({ id: nextId(), category: 'meta', severity: 'high', page_slug: slug, page_name: name, admin_deeplink: ADMIN_DEEPLINK, problem: `The "${name}" page has no SEO title — this is the blue clickable headline in Google results.` })
      } else if (title.length > 60) {
        findings.push({ id: nextId(), category: 'meta', severity: 'medium', page_slug: slug, page_name: name, admin_deeplink: ADMIN_DEEPLINK, problem: `The "${name}" page SEO title is ${title.length} characters — over ~60 Google cuts it off with "…".`, metric: `${title.length} chars` })
      }
      // focus_keyword null + tenant has GSC impressions. NOTE: GSC data has no
      // per-page impressions (only tenant aggregate + per-query top_queries), so
      // this uses tenant-level impressions>0 as the gate rather than per-page.
      if (!m.focus_keyword && (gscData?.total_impressions ?? 0) > 0) {
        findings.push({ id: nextId(), category: 'meta', severity: 'medium', page_slug: slug, page_name: name, admin_deeplink: ADMIN_DEEPLINK, problem: `The "${name}" page has no focus keyword set, even though your site is showing up in Google searches — setting one helps you rank for the term you care about.` })
      }
    }
    // duplicate meta_title across 2+ pages → one site-wide MEDIUM
    const dupTitles = [...titleCounts.entries()].filter(([, slugs]) => slugs.length >= 2)
    if (dupTitles.length > 0) {
      const example = dupTitles[0][1].map((s) => pageName(s)).join(', ')
      findings.push({ id: nextId(), category: 'meta', severity: 'medium', page_slug: null, page_name: 'Your website', admin_deeplink: ADMIN_DEEPLINK, problem: `${dupTitles.length} of your pages share the same SEO title (e.g. ${example}). Google may pick the wrong page or treat them as duplicates — give each a unique title.`, metric: `${dupTitles.length} duplicate title group(s)` })
    }

    // KEYWORD — applied=false placements (we already wrote the text; apply it)
    ransRules.push('keyword')
    for (const k of kwRows) {
      const slug = (k.page_slug ?? null) as string | null
      const name = pageName(slug)
      const suggested = typeof k.suggested_text === 'string' ? k.suggested_text : ''
      findings.push({
        id: nextId(), category: 'keyword', severity: 'medium', page_slug: slug, page_name: name, admin_deeplink: ADMIN_DEEPLINK,
        problem: `We already wrote optimized text for the keyword "${k.keyword}" on "${name}" — it just needs to be applied. Turning it on takes one click.`,
        metric: suggested ? truncate(suggested, 120) : undefined,
      })
    }

    // CONTENT — thin intro + all-images-empty service/location page
    ransRules.push('content')
    for (const p of pageRows) {
      const slug = p.page_slug as string
      const name = pageName(slug)
      const intro = (p.intro ?? '') as string
      if (!intro.trim() || intro.length < 120) {
        findings.push({ id: nextId(), category: 'content', severity: 'medium', page_slug: slug, page_name: name, admin_deeplink: ADMIN_DEEPLINK, problem: `The "${name}" page has very little intro text${intro.trim() ? ` (${intro.length} characters)` : ''}. Google and customers both want a few clear sentences about what you do here.`, metric: intro.trim() ? `${intro.length} chars` : 'empty' })
      }
      const imagesAllEmpty = !p.image_url && !p.page_hero_image_url && !p.image_1_url && !p.image_2_url && !p.image_3_url
      if (imagesAllEmpty && !NON_SERVICE_SLUGS.has(slug)) {
        findings.push({ id: nextId(), category: 'content', severity: 'low', page_slug: slug, page_name: name, admin_deeplink: ADMIN_DEEPLINK, problem: `The "${name}" page has no photos. Real photos of your team and work build trust and keep visitors on the page longer.` })
      }
    }

    // ENGAGEMENT — from GSC top_queries (per-query). The spec's per-PAGE
    // impressions-vs-CTR rule is NOT derivable: gsc_runs.data has no per-page
    // breakdown (only tenant aggregates + top_queries). That rule is SKIPPED
    // (flagged). The position 11–20 rule IS supported by top_queries[].position.
    let engagementRan = false
    const topQueries = Array.isArray(gscData?.top_queries) ? gscData!.top_queries : []
    if (topQueries.length > 0) {
      engagementRan = true
      ransRules.push('engagement(position-11-20; per-page-ctr SKIPPED: no per-page GSC data)')
      const page2 = topQueries
        .filter((q) => typeof q.position === 'number' && q.position >= 11 && q.position <= 20)
        .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
        .slice(0, 5)
      for (const q of page2) {
        findings.push({
          id: nextId(), category: 'engagement', severity: 'medium', page_slug: null, page_name: 'Search visibility', admin_deeplink: ADMIN_DEEPLINK,
          problem: `You rank #${Math.round(q.position)} for "${q.query}" — that's page 2 of Google. A small push (a focused page or a few mentions of this phrase) often moves it onto page 1, where almost all the clicks are.`,
          metric: `position ${Math.round(q.position)}`,
        })
      }
    }

    // TECHNICAL — GUARDED OFF in v1. Only emits if a complete pagespeed_runs row
    // exists (0 live). With no rows, no section renders.
    let technicalRan = false
    const psRes = await svc.from('pagespeed_runs').select('url, mobile_performance, mobile_seo').eq('tenant_id', tenantId).eq('status', 'complete').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (psRes.data) {
      technicalRan = true
      ransRules.push('technical')
      const perf = psRes.data.mobile_performance as number | null
      if (typeof perf === 'number' && perf < 50) {
        findings.push({ id: nextId(), category: 'technical', severity: 'high', page_slug: null, page_name: 'Site speed', admin_deeplink: ADMIN_DEEPLINK, problem: `Your site scores ${perf}/100 for mobile speed. Slow pages lose visitors before they call — most people leave if a page takes more than 3 seconds.`, metric: `${perf}/100` })
      }
    }

    console.log(`[generate-monthly-report] tenant:${tenantId} period:${period} findings:${findings.length} rules:[${ransRules.join(' | ')}]`)

    // ── 3+4. NARRATE (one ai-proxy/internal call; fall back to templates) ──────
    const narrations = await narrate(findings, tenantId)

    // business name (same read path the app uses: settings.business_info.name)
    const { data: bizRow } = await svc.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
    const businessName = ((bizRow?.value as { name?: unknown } | null)?.name as string) || 'Your Business'

    // categories that RAN (so the template can affirm healthy ones)
    const ranCategories: Category[] = ['meta', 'content', 'keyword']
    if (engagementRan) ranCategories.push('engagement')
    if (technicalRan) ranCategories.push('technical')

    // ── 5. RENDER ──────────────────────────────────────────────────────────────
    const highCount = findings.filter((f) => f.severity === 'high').length
    const html = renderReport({ businessName, period, findings, narrations, ranCategories })

    // ── 6. STORE ────────────────────────────────────────────────────────────────
    const storagePath = `${tenantId}/${period}.html`
    const enc = new TextEncoder().encode(html)
    const up = await svc.storage.from('reports').upload(storagePath, enc, { contentType: 'text/html; charset=utf-8', upsert: true })
    if (up.error) return await failJob(`storage upload: ${up.error.message}`)

    const upsertRes = await svc.from('tenant_reports').upsert({
      tenant_id: tenantId, period, storage_path: storagePath,
      findings_count: findings.length, high_count: highCount,
      status: 'html_ready', generated_at: nowIso(),
    }, { onConflict: 'tenant_id,period' })
    if (upsertRes.error) return await failJob(`tenant_reports upsert: ${upsertRes.error.message}`)

    // ── 7. FINISH ────────────────────────────────────────────────────────────────
    await svc.from('report_jobs').update({ status: 'complete', finished_at: nowIso(), last_error: null }).eq('id', jobRow.id)
    console.log(`[generate-monthly-report] complete tenant:${tenantId} period:${period} findings:${findings.length} high:${highCount}`)
    return json(200, { ok: true, tenant_id: tenantId, period, findings_count: findings.length, high_count: highCount })

  } catch (e) {
    console.error('[generate-monthly-report] unexpected:', (e as Error)?.message)
    return await failJob((e as Error)?.message || 'worker_error')
  }
})

// ── ai-proxy/internal narration. Batches all findings in one prompt. ANY failure
//    (incl. the Pro-tier 403) returns {} → caller uses templated problem text. ──
async function narrate(findings: Finding[], tenantId: string): Promise<Record<string, string>> {
  if (findings.length === 0) return {}
  try {
    const env = buildEnvelope({
      purpose: 'monthly_report_narration', caller: 'generate-monthly-report',
      acting_tenant: tenantId, acting_user: null, resource: {}, ttl_seconds: 300,
    })
    const system =
      'You write a monthly website report for a pest-control business owner with no SEO background. ' +
      'Rephrase each finding into friendly, encouraging plain-English guidance: (1) what is going on, ' +
      '(2) why it matters for getting more phone calls, and (3) the exact step to fix it. ' +
      'DO NOT invent findings, numbers, or pages that are not in the input. Keep each to 2–4 short sentences. ' +
      'Return ONLY a JSON object keyed by the finding id, where each value is the guidance string. No markdown.'
    const input = findings.map((f) => ({ id: f.id, category: f.category, severity: f.severity, page: f.page_name, problem: f.problem, metric: f.metric ?? null }))
    const res = await fetch(AI_PROXY_INTERNAL_URL, {
      method: 'POST',
      headers: signEnvelope(env, DELEGATION_SECRET),
      body: JSON.stringify({
        max_tokens: NARRATION_MAX_TOKENS, batch_cardinality: findings.length, system,
        messages: [{ role: 'user', content: `Findings:\n${JSON.stringify(input)}` }],
      }),
    })
    if (!res.ok) { console.warn(`[generate-monthly-report] narration proxy ${res.status} — falling back to templates`); return {} }
    const data = await res.json()
    const text = data?.content?.[0]?.text
    if (typeof text !== 'string') return {}
    const parsed = JSON.parse(stripJson(text))
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const f of findings) {
      const v = (parsed as Record<string, unknown>)[f.id]
      if (typeof v === 'string' && v.trim()) out[f.id] = v.trim()
    }
    return out
  } catch (e) {
    console.warn('[generate-monthly-report] narration failed — falling back to templates:', (e as Error)?.message)
    return {}
  }
}

// ── Self-contained HTML (inline CSS, no external fetches, PDF-friendly). ──
function renderReport(args: {
  businessName: string; period: string; findings: Finding[]
  narrations: Record<string, string>; ranCategories: Category[]
}): string {
  const { businessName, period, findings, narrations, ranCategories } = args
  const highCount = findings.filter((f) => f.severity === 'high').length
  const periodLabel = formatPeriod(period)

  const CATEGORY_META: Record<Category, { label: string; healthy: string }> = {
    meta: { label: 'Page titles & descriptions', healthy: '✓ All your page titles and descriptions look good this month.' },
    content: { label: 'Page content & photos', healthy: '✓ Your pages have solid content and imagery this month.' },
    keyword: { label: 'Keyword opportunities', healthy: '✓ No unused keyword suggestions waiting — nice work.' },
    engagement: { label: 'Search visibility', healthy: '✓ No page-2 rankings flagged this month.' },
    technical: { label: 'Site speed & technical', healthy: '✓ No technical issues flagged this month.' },
  }
  const CATEGORY_ORDER: Category[] = ['meta', 'content', 'keyword', 'engagement', 'technical']
  const SEV_LABEL: Record<Severity, string> = { high: 'High priority', medium: 'Worth doing', low: 'Nice to have' }
  const SEV_COLOR: Record<Severity, string> = { high: '#dc2626', medium: '#d97706', low: '#2563eb' }

  const summary = findings.length === 0
    ? 'Everything we checked looks healthy this month — no action needed.'
    : `${findings.length} ${findings.length === 1 ? 'thing' : 'things'} to improve this month` +
      (highCount > 0 ? `, ${highCount} high priority.` : '.')

  const sections: string[] = []
  for (const cat of CATEGORY_ORDER) {
    if (!ranCategories.includes(cat)) continue   // category did not run (e.g. technical: no data) → omit silently
    const catFindings = findings.filter((f) => f.category === cat).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    if (catFindings.length === 0) {
      sections.push(`<section class="cat"><h2>${escapeHtml(CATEGORY_META[cat].label)}</h2><p class="healthy">${escapeHtml(CATEGORY_META[cat].healthy)}</p></section>`)
      continue
    }
    const items = catFindings.map((f) => {
      const narration = narrations[f.id] || f.problem  // template fallback
      const metric = f.metric ? `<span class="metric">${escapeHtml(f.metric)}</span>` : ''
      return (
        `<div class="finding">` +
        `<div class="fhead"><span class="sev" style="background:${SEV_COLOR[f.severity]}">${SEV_LABEL[f.severity]}</span>` +
        `<span class="page">${escapeHtml(f.page_name)}</span>${metric}</div>` +
        `<p class="narr">${escapeHtml(narration)}</p>` +
        `<a class="fix" href="${escapeHtml(f.admin_deeplink)}">Fix it here →</a>` +
        `</div>`
      )
    }).join('')
    sections.push(`<section class="cat"><h2>${escapeHtml(CATEGORY_META[cat].label)}</h2>${items}</section>`)
  }

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(businessName)} — ${escapeHtml(periodLabel)} Report</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;background:#f8fafc;margin:0;padding:24px;line-height:1.5}
  .wrap{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px}
  header{border-bottom:2px solid #10b981;padding-bottom:16px;margin-bottom:24px}
  h1{font-size:22px;margin:0 0 4px}
  .period{color:#6b7280;font-size:14px;margin:0}
  .summary{margin:16px 0 0;font-size:16px;font-weight:600;color:#065f46}
  section.cat{margin:24px 0}
  section.cat h2{font-size:16px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:0 0 12px}
  .healthy{color:#047857;font-size:14px;margin:0}
  .finding{border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:12px;background:#fff}
  .fhead{display:block;margin-bottom:6px}
  .sev{display:inline-block;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-right:8px;text-transform:uppercase;letter-spacing:.02em}
  .page{font-weight:700;font-size:14px;color:#111827}
  .metric{color:#6b7280;font-size:12px;margin-left:8px}
  .narr{margin:6px 0 10px;font-size:14px;color:#374151}
  .fix{display:inline-block;font-size:13px;font-weight:600;color:#0e7490;text-decoration:none}
  footer{margin-top:28px;border-top:1px solid #e5e7eb;padding-top:14px;color:#9ca3af;font-size:12px;text-align:center}
</style></head>
<body><div class="wrap">
  <header>
    <h1>${escapeHtml(businessName)}</h1>
    <p class="period">Monthly Website Report — ${escapeHtml(periodLabel)}</p>
    <p class="summary">${escapeHtml(summary)}</p>
  </header>
  ${sections.join('\n  ')}
  <footer>Generated by PestFlow Pro · ${escapeHtml(periodLabel)}</footer>
</div></body></html>`
}

function formatPeriod(period: string): string {
  const [y, m] = period.split('-')
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const idx = parseInt(m, 10) - 1
  return idx >= 0 && idx < 12 ? `${months[idx]} ${y}` : period
}
