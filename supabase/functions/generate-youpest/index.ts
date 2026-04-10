// Edge Function: generate-youpest
// Analyzes scraped prospect data via Claude and generates a layout_config JSON
// for the youpest Pro-tier shell renderer. Stores result in prospects.youpest_layout.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const ANTHROPIC_API_KEY        = Deno.env.get('ANTHROPIC_API_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are an expert web designer analyzing pest control websites.
You output a JSON layout_config that recreates the structure and feel of the
analyzed site as closely as possible. You match:
- Section order (what appears first, second, third on their homepage)
- Hero style (does the original have a full-width image? split layout? centered text?)
- Nav style (is their nav transparent over the hero, or solid?)
- Content tone (professional/corporate vs friendly/family vs bold/aggressive)
- Trust signals they emphasize (years in business, technician count, guarantees)

You return ONLY valid JSON. No preamble. No markdown. No explanation.
The JSON must exactly match the layout_config schema provided.`

const USER_PROMPT_TEMPLATE = (sourceUrl: string, businessName: string, homepageMarkdown: string) =>
`Analyze this pest control website and return a layout_config JSON.

Source URL: ${sourceUrl}
Business Name: ${businessName}

Scraped homepage content:
${homepageMarkdown}

Available section types and variants:
- hero: full-bleed | split | centered | video-bg
- trust-bar: (no variants — just an items array of trust badges)
- services-grid: cards | icon-list | large-tiles
- about-strip: left-image | right-image | centered
- why-choose-us: icons | checklist | numbered
- cta-banner: (no variants — headline + cta text)

Nav styles: transparent-overlay | solid | minimal
Footer styles: full | minimal | centered

Rules:
1. sections array must have 4-6 items in the order they should appear on the page
2. Always include hero as the first section
3. Always include cta-banner as the last section
4. Choose variants that best match the original site's style
5. Extract real copy from the scraped content for headlines, subheadlines, trust items,
   why-us points — do not invent generic placeholder text
6. Extract or infer primary and accent colors from the scraped content description
7. hero.bg should be "primary" unless the site uses a photo hero (then use "image")

Return ONLY the layout_config JSON object matching this schema:
{
  "nav": { "style": "transparent-overlay|solid|minimal", "links": [{"label": "...", "href": "..."}] },
  "sections": [
    { "id": "hero", "type": "hero", "variant": "full-bleed|split|centered|video-bg",
      "headline": "...", "subheadline": "...", "cta": "...", "bg": "primary|accent|dark|light|image" },
    { "id": "trust-bar", "type": "trust-bar", "items": ["...", "..."] },
    { "id": "services", "type": "services-grid", "variant": "cards|icon-list|large-tiles", "headline": "..." },
    { "id": "about", "type": "about-strip", "variant": "left-image|right-image|centered",
      "headline": "...", "body": "..." },
    { "id": "why-us", "type": "why-choose-us", "variant": "icons|checklist|numbered",
      "headline": "...", "points": ["...", "..."] },
    { "id": "cta-banner", "type": "cta-banner", "headline": "...", "cta": "..." }
  ],
  "footer": { "style": "full|minimal|centered" },
  "colors": { "primary": "#hexcolor", "accent": "#hexcolor" }
}

Return the layout_config JSON now.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { prospect_id } = await req.json()
    if (!prospect_id) {
      return new Response(JSON.stringify({ error: 'prospect_id is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch prospect record
    const { data: prospect, error: pErr } = await supabase
      .from('prospects')
      .select('id, company_name, source_url, scraped_content, business_info, branding, slug')
      .eq('id', prospect_id)
      .maybeSingle()

    if (pErr || !prospect) {
      return new Response(JSON.stringify({ error: 'Prospect not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // SAFEGUARD: If this prospect has a slug set, check it doesn't already exist as a live tenant
    const prospectSlug = (prospect as any).slug || ''
    if (prospectSlug) {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', prospectSlug)
        .maybeSingle()
      if (existingTenant) {
        console.warn(`[generate-youpest] BLOCKED — slug "${prospectSlug}" already exists as tenant ${existingTenant.id}`)
        return new Response(JSON.stringify({
          error: 'Tenant slug already exists',
          existingSlug: prospectSlug,
          suggestion: prospectSlug + '2',
        }), { status: 409, headers: { 'Content-Type': 'application/json', ...CORS } })
      }
    }

    // Extract relevant fields
    const businessName = prospect.company_name || (prospect.business_info as any)?.name || 'Unknown'
    const sourceUrl    = prospect.source_url || ''

    // Build homepage markdown from scraped_content
    let homepageMarkdown = ''
    const sc = prospect.scraped_content as Record<string, any> | null
    if (sc) {
      const home = sc['home'] || sc['homepage'] || sc
      if (typeof home === 'string') {
        homepageMarkdown = home
      } else if (home && typeof home === 'object') {
        const parts: string[] = []
        if (home.title)    parts.push(`# ${home.title}`)
        if (home.subtitle) parts.push(home.subtitle)
        if (home.intro)    parts.push(home.intro)
        if (home.body)     parts.push(home.body)
        if (home.content)  parts.push(home.content)
        for (const [slug, pageData] of Object.entries(sc)) {
          if (slug === 'home') continue
          const pd = pageData as any
          if (pd?.title) parts.push(`\n## ${slug}: ${pd.title}`)
          if (pd?.subtitle) parts.push(pd.subtitle)
        }
        homepageMarkdown = parts.join('\n')
      }
    }

    if (!homepageMarkdown) {
      homepageMarkdown = `Business: ${businessName}. No scraped content available.`
    }

    // Call Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: USER_PROMPT_TEMPLATE(sourceUrl, businessName, homepageMarkdown) }],
      }),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      console.error('Claude API error:', errText)
      return new Response(JSON.stringify({ error: 'Claude API error', raw: errText }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content?.[0]?.text || ''

    // Strip backticks before JSON.parse
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let layoutConfig: Record<string, any>
    try {
      layoutConfig = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('JSON parse failed. Raw Claude response:', rawText)
      return new Response(JSON.stringify({ error: 'Failed to parse Claude response', raw: rawText }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Upsert into prospects.youpest_layout
    const { error: updateErr } = await supabase
      .from('prospects')
      .update({ youpest_layout: layoutConfig })
      .eq('id', prospect_id)

    if (updateErr) {
      console.error('Failed to save youpest_layout:', updateErr.message)
      return new Response(JSON.stringify({ error: 'Failed to save layout', detail: updateErr.message }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    return new Response(JSON.stringify({ success: true, layout_config: layoutConfig }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err: any) {
    console.error('generate-youpest error:', err?.message)
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
