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

    const encode = (u: string, strategy: string) =>
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(u)}&strategy=${strategy}`

    const [desktopRes, mobileRes] = await Promise.all([
      fetch(encode(url, 'desktop')),
      fetch(encode(url, 'mobile')),
    ])

    const [desktop, mobile] = await Promise.all([
      desktopRes.json(),
      mobileRes.json(),
    ])

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
      JSON.stringify({ desktop: extract(desktop), mobile: extract(mobile) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
