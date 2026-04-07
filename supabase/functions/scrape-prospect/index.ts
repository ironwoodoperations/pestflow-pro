// Edge Function: scrape-prospect
// JWT-verified. Scrapes a pest control website and extracts structured data via Claude.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const FIRECRAWL_API_KEY        = Deno.env.get('FIRECRAWL_API_KEY') || ''
const ANTHROPIC_API_KEY        = Deno.env.get('ANTHROPIC_API_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.data?.markdown || null
  } catch {
    return null
  }
}

const EXTRACTION_PROMPT = `Extract business information from this pest control website content. Return ONLY a JSON object with no markdown, no backticks, no explanation. Use null for any field not found.

Fields to extract:
- business_name (string)
- owner_name (string)
- phone (string — main business phone, formatted as found)
- email (string)
- address (string — full street address)
- city (string)
- state (string — 2 letter abbreviation)
- zip (string)
- hours (string — business hours as a single string)
- tagline (string — their slogan or one-line description)
- founded_year (string)
- tech_count (string — number of technicians if mentioned)
- license_number (string)
- about_intro (string — 2-3 sentence description of the company)
- services (array of strings — pest services they offer)
- service_areas (array of strings — cities/towns they serve)
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
    // Verify JWT
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!token) return json({ success: false, error: 'Unauthorized' }, 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || user.email !== 'admin@pestflowpro.com') {
      return json({ success: false, error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const { url } = body
    if (!url) return json({ success: false, error: 'url is required' }, 400)

    // Scrape main page + subpages (best effort)
    const baseUrl = url.replace(/\/$/, '')
    const pages_scraped: string[] = []
    const parts: string[] = []

    const main = await scrapeUrl(baseUrl)
    if (main) { parts.push(main); pages_scraped.push('/') }

    for (const path of ['/about', '/about-us', '/services', '/contact']) {
      const content = await scrapeUrl(`${baseUrl}${path}`)
      if (content) { parts.push(content); pages_scraped.push(path) }
    }

    if (parts.length === 0) {
      return json({ success: false, error: 'Could not scrape any content from that URL' })
    }

    // Limit combined content to avoid token overflow
    const scraped_content = parts.join('\n\n---\n\n').slice(0, 30000)

    // Extract structured data via Claude
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: EXTRACTION_PROMPT + scraped_content }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      return json({ success: false, error: `Anthropic API error: ${err}` })
    }

    const anthropicData = await anthropicRes.json()
    const rawText = anthropicData?.content?.[0]?.text || ''
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let scraped: Record<string, any>
    try {
      scraped = JSON.parse(cleaned)
    } catch {
      return json({ success: false, error: 'Failed to parse extracted data from Claude response' })
    }

    return json({ success: true, scraped, source_url: url, pages_scraped })
  } catch (err) {
    console.error('scrape-prospect error:', err)
    return json({ success: false, error: 'Internal server error' })
  }
})
