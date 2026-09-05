// Edge Function: scrape-prospect v2
// Scrapes a predefined list of URL paths in parallel via Firecrawl (free tier).
// Maps results to page slugs, saves scraped_content on the prospect, returns structured data.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { pathToSlug, extractPageContent, candidatePathsFor, PageContent } from './mapContent.ts'
import { analyzeSite } from './analyzeSite.ts'
import { extractionPromptFor } from './prompts.ts'
import { isIronwoodOperator } from '../_shared/operatorLookup.ts'
import { partitionScrapedPages } from './pageFilter.ts'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const FIRECRAWL_API_KEY         = Deno.env.get('FIRECRAWL_API_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


interface ScrapeResult {
  path: string
  markdown: string
  metadata: Record<string, any>
}

/**
 * S347 — `res.ok` is the status of the FIRECRAWL CALL, not of the page it
 * fetched. Firecrawl happily returns 200 carrying a 404 page, and this function
 * used to accept that as content. The page's own status rides in
 * data.data.metadata.statusCode and is checked in pageFilter.
 */

async function scrapeOne(url: string, path: string): Promise<ScrapeResult | null> {
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const markdown = data?.data?.markdown || ''
    const metadata = data?.data?.metadata || {}
    if (!markdown) return null
    return { path, markdown, metadata }
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    // Verify operator caller by UUID (R3: identity is email, AUTHORIZATION is
    // UUID). S346: the authorized set is public.operators, read through the one
    // shared reader — not a Set in aiAuth.ts, which had drifted into being the
    // exact opposite of the table and 403'd this function twice.
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!token) return json({ success: false, error: 'Unauthorized' }, 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || !(await isIronwoodOperator(supabase, user.id))) {
      return json({ success: false, error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const { url, prospectId, vertical } = body as {
      url?: string; prospectId?: string; vertical?: string | null
    }
    if (!url) return json({ success: false, error: 'url is required' }, 400)

    const baseUrl = url.replace(/\/$/, '')

    // ── S347: RESOLVE THE VERTICAL SERVER-SIDE ────────────────────────────
    // S346 trusted the caller to send it. The first live run against a lawn
    // prospect scraped pest paths anyway, and the client is the one link in
    // that chain this function cannot verify — a browser holding a stale SPA
    // bundle sends the old body and nothing here can tell.
    //
    // The prospect row is authoritative because it is THE SAME RECORD
    // provision-tenant reads at create time: resolving from it means the
    // scrape and the provision cannot disagree about the trade. A supplied
    // `vertical` is used only when the row has none.
    let resolvedVertical: string | null =
      typeof vertical === 'string' && vertical ? vertical : null
    let verticalSource: 'prospect' | 'request' | 'none' = resolvedVertical ? 'request' : 'none'

    if (prospectId) {
      const { data: prospectRow, error: prospectErr } = await supabase
        .from('prospects')
        .select('business_info')
        .eq('id', prospectId)
        .maybeSingle()
      if (prospectErr) {
        console.warn('[scrape-prospect] prospect lookup failed:', prospectErr.message)
      } else {
        const stored = (prospectRow?.business_info as Record<string, unknown> | null)?.vertical
        if (typeof stored === 'string' && stored) {
          resolvedVertical = stored
          verticalSource = 'prospect'
        }
      }
    }

    // S346 — the paths to try come from the vertical's catalog, not from 18
    // hardcoded pest paths. Absent or unregistered falls back to the historical
    // pest list (see mapContent); with the S347 status check those paths now
    // 404 and are discarded rather than written.
    const candidatePaths = candidatePathsFor(resolvedVertical)
    console.log(`[scrape-prospect] vertical: ${resolvedVertical ?? 'none'} (source: ${verticalSource}), ${candidatePaths.length} paths`)

    // Scrape all candidate URLs in parallel
    const results = await Promise.allSettled(
      candidatePaths.map(path => scrapeOne(`${baseUrl}${path}`, path))
    )

    const fetched: ScrapeResult[] = results
      .filter((r): r is PromiseFulfilledResult<ScrapeResult | null> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value as ScrapeResult)

    // S346C — THE COUNTERS MUST RECONCILE. The live run reported "23 paths
    // tried, 1 real page saved (9 skipped)" and 13 were unaccounted for: paths
    // where scrapeOne returned null because the Firecrawl call itself failed or
    // came back with empty markdown. Those never reach partitionScrapedPages, so
    // they appeared in neither counter. tried = unreachable + discarded + kept.
    const unreachable = candidatePaths.length - fetched.length

    // S347 — drop what is not a page: 404s carrying the site's og:title, and
    // soft-404s that render the homepage at HTTP 200. Nine of ten "pages found"
    // on the first live run were one of these.
    const { kept: successful, discarded } = partitionScrapedPages(fetched)

    if (successful.length === 0) {
      return json({
        success: false,
        error: 'Could not scrape any real pages from that URL',
        paths_tried: candidatePaths.length,
        unreachable,
        discarded,
        discarded_count: discarded.length,
        pages_kept: 0,
      })
    }

    // Map results to page slugs
    const scrapedContent: Record<string, PageContent> = {}
    for (const s of successful) {
      const slug = pathToSlug(s.path, resolvedVertical)
      if (!slug) continue
      if (scrapedContent[slug]) continue // first match wins
      const pc = extractPageContent(s.markdown, s.metadata)
      if (pc.title || pc.intro) {
        scrapedContent[slug] = pc
      }
    }

    // Extract prospect fields from homepage markdown via Claude
    const homepage = successful.find(s => s.path === '/') || successful[0]
    const combinedForClaude = successful
      .slice(0, 4)
      .map(s => s.markdown)
      .join('\n\n---\n\n')
      .slice(0, 30000)

    // Run prospect extraction and site recreation analysis in parallel. Both
    // route through ai-proxy's public operator lane (feature
    // 'scrape_prospect_analyze'); the operator's Bearer JWT is forwarded from
    // the incoming request. ai-proxy pins the model + adds anthropic-version.
    // Fail closed — no direct api.anthropic.com fallback.
    const aiProxyUrl = `${SUPABASE_URL}/functions/v1/ai-proxy`
    const authHeader = req.headers.get('Authorization') || ''

    const [aiProxyRes, siteRecreation] = await Promise.all([
      fetch(aiProxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature: 'scrape_prospect_analyze',
          tenant_id: null,
          max_tokens: 1000,
          messages: [{ role: 'user', content: extractionPromptFor(resolvedVertical) + combinedForClaude }],
        }),
      }),
      analyzeSite(homepage.markdown, aiProxyUrl, authHeader, resolvedVertical),
    ])

    let prospectFields: Record<string, any> = {}
    if (aiProxyRes.ok) {
      const aiProxyData = await aiProxyRes.json()
      const rawText = aiProxyData?.content?.[0]?.text || ''
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      try { prospectFields = JSON.parse(cleaned) } catch { /* non-fatal */ }
    }

    // ── S348: THIS FUNCTION NO LONGER WRITES scraped_content ──────────────
    // It used to save the overlay to the prospect row the moment the scrape
    // finished — before the operator had seen a single result, and whether or
    // not they ever accepted it. A run against a real lawn prospect left ten
    // pest-slug pages sitting on the row; Discard was never clicked, because
    // the results were never accepted. provision-tenant reads scraped_content
    // at create time, so those pages were one Create Site away from a client's
    // public website, and had to be cleared by hand.
    //
    // Clearing on Discard alone would NOT have prevented that: nothing was
    // clicked. So the write moves to the point of acceptance — the caller
    // persists it when the operator clicks Apply. The content is returned
    // either way, so nothing the operator can SEE changes.

    return json({
      success: true,
      scraped: prospectFields,
      source_url: url,
      pages_scraped: successful.map(s => s.path),
      // S347 — the operator must be able to see "17 tried, 1 real" rather than
      // "10 pages found". Everything below is reported, not inferred.
      paths_tried: candidatePaths.length,
      unreachable,
      pages_kept: successful.length,
      discarded,
      discarded_count: discarded.length,
      vertical: resolvedVertical,
      vertical_source: verticalSource,
      scrapedContent,
      pagesFound: Object.keys(scrapedContent).length,
      siteRecreation,
    })
  } catch (err) {
    console.error('scrape-prospect error:', err)
    return json({ success: false, error: 'Internal server error' })
  }
})
