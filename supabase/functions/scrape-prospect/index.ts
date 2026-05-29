// Edge Function: scrape-prospect v2
// Scrapes a predefined list of URL paths in parallel via Firecrawl (free tier).
// Maps results to page slugs, saves scraped_content on the prospect, returns structured data.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { pathToSlug, extractPageContent, PageContent } from './mapContent.ts'
import { analyzeSite } from './analyzeSite.ts'
import { IRONWOOD_OPERATOR_USER_IDS } from '../_shared/aiAuth.ts'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const FIRECRAWL_API_KEY         = Deno.env.get('FIRECRAWL_API_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CANDIDATE_PATHS = [
  '/', '/about', '/about-us', '/services', '/pest-control',
  '/termite-control', '/termite-inspections', '/roach-control',
  '/ant-control', '/mosquito-control', '/bed-bug-control',
  '/flea-tick-control', '/rodent-control', '/scorpion-control',
  '/spider-control', '/wasp-hornet-control', '/contact', '/faq',
]

interface ScrapeResult {
  path: string
  markdown: string
  metadata: Record<string, any>
}

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

const EXTRACTION_PROMPT = `Extract business information from this pest control website content. Return ONLY a JSON object with no markdown, no backticks, no explanation. Use null for any field not found.

Fields:
- business_name (string)
- owner_name (string)
- phone (string)
- email (string)
- address (string)
- city (string)
- state (string — 2-letter abbreviation)
- zip (string)
- hours (string)
- tagline (string)
- founded_year (string)
- tech_count (string)
- license_number (string)
- about_intro (string — 2-3 sentences)
- services (array of strings)
- service_areas (array of strings)
- facebook_url (string)
- instagram_handle (string)
- google_business_url (string)

Website content:
`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    // Verify operator caller by UUID (R3: identity is email, AUTHORIZATION is
    // UUID). Allowlist is the single source of truth in _shared/aiAuth.ts.
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!token) return json({ success: false, error: 'Unauthorized' }, 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || !IRONWOOD_OPERATOR_USER_IDS.has(user.id)) {
      return json({ success: false, error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const { url, prospectId } = body as { url?: string; prospectId?: string }
    if (!url) return json({ success: false, error: 'url is required' }, 400)

    const baseUrl = url.replace(/\/$/, '')

    // Scrape all candidate URLs in parallel
    const results = await Promise.allSettled(
      CANDIDATE_PATHS.map(path => scrapeOne(`${baseUrl}${path}`, path))
    )

    const successful: ScrapeResult[] = results
      .filter((r): r is PromiseFulfilledResult<ScrapeResult | null> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value as ScrapeResult)

    if (successful.length === 0) {
      return json({ success: false, error: 'Could not scrape any content from that URL' })
    }

    // Map results to page slugs
    const scrapedContent: Record<string, PageContent> = {}
    for (const s of successful) {
      const slug = pathToSlug(s.path)
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
          messages: [{ role: 'user', content: EXTRACTION_PROMPT + combinedForClaude }],
        }),
      }),
      analyzeSite(homepage.markdown, aiProxyUrl, authHeader),
    ])

    let prospectFields: Record<string, any> = {}
    if (aiProxyRes.ok) {
      const aiProxyData = await aiProxyRes.json()
      const rawText = aiProxyData?.content?.[0]?.text || ''
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      try { prospectFields = JSON.parse(cleaned) } catch { /* non-fatal */ }
    }

    // Save scraped_content + source_url to prospect record
    if (prospectId && Object.keys(scrapedContent).length > 0) {
      const { error: dbErr } = await supabase
        .from('prospects')
        .update({ scraped_content: scrapedContent, source_url: url })
        .eq('id', prospectId)
      if (dbErr) console.error('Failed to save scraped_content:', dbErr.message)
    }

    return json({
      success: true,
      scraped: prospectFields,
      source_url: url,
      pages_scraped: successful.map(s => s.path),
      scrapedContent,
      pagesFound: Object.keys(scrapedContent).length,
      siteRecreation,
    })
  } catch (err) {
    console.error('scrape-prospect error:', err)
    return json({ success: false, error: 'Internal server error' })
  }
})
