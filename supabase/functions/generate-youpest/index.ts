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

const SYSTEM_PROMPT = `You analyze pest control websites and output a JSON layout config that matches
their site structure as closely as possible. You return ONLY valid JSON — no
preamble, no markdown fences, no explanation. Match section order, hero style,
and nav/footer patterns from the scraped content.`

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
      .select('id, company_name, source_url, scraped_content, hero_headline, business_info, branding')
      .eq('id', prospect_id)
      .maybeSingle()

    if (pErr || !prospect) {
      return new Response(JSON.stringify({ error: 'Prospect not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Extract relevant fields
    const businessName  = prospect.company_name || (prospect.business_info as any)?.name || 'Unknown'
    const sourceUrl     = prospect.source_url || (prospect.scraped_content as any)?.source_url || ''
    const primaryColor  = (prospect.branding as any)?.primary_color || '#E87800'
    const accentColor   = (prospect.branding as any)?.accent_color  || '#1a1a1a'

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
        // Include all page slugs as context
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

    const userPrompt = `Here is the scraped homepage content from ${sourceUrl}:

${homepageMarkdown}

Business name: ${businessName}
Extracted primary color: ${primaryColor}
Extracted accent color: ${accentColor}

Return a layout_config JSON object matching the schema you were given.
Preserve section order, tone, and structure from their existing site.`

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
        messages: [{ role: 'user', content: userPrompt }],
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
