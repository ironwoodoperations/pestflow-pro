import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) throw new Error('url is required')

    const apiKey = Deno.env.get('PAGESPEED_API_KEY') ?? ''
    console.log('API key present:', !!apiKey, '— key length:', apiKey.length)
    const encode = (u: string, strategy: string) =>
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(u)}&strategy=${strategy}&key=${apiKey}`

    const [desktopRes, mobileRes] = await Promise.all([
      fetch(encode(url, 'desktop')),
      fetch(encode(url, 'mobile')),
    ])

    const [desktop, mobile] = await Promise.all([
      desktopRes.json(),
      mobileRes.json(),
    ])

    // Surface Google API errors so the client can distinguish quota/rate issues from real null scores
    const googleError =
      (desktop as Record<string, unknown>).error
      ?? (mobile as Record<string, unknown>).error
      ?? null

    if (googleError) {
      const errMsg = ((googleError as Record<string, unknown>).message as string) ?? 'Google PageSpeed API error'
      console.error('Google PageSpeed API error:', errMsg)
      return new Response(
        JSON.stringify({ desktop: null, mobile: null, apiError: errMsg }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const extract = (data: Record<string, unknown>) => {
      const cats = (data.lighthouseResult as Record<string, unknown>)?.categories as Record<string, { score: number }> | undefined
      if (!cats) return null
      return {
        performance:   Math.round((cats.performance?.score   ?? 0) * 100),
        seo:           Math.round((cats.seo?.score           ?? 0) * 100),
        accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
      }
    }

    return new Response(
      JSON.stringify({ desktop: extract(desktop), mobile: extract(mobile), apiError: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
