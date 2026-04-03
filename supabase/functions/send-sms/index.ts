// Supabase Edge Function: send-sms
// Sends SMS via Textbelt. Called server-side so the API key never touches the browser.
//
// MANUAL STEP REQUIRED after deploy:
//   Set TEXTBELT_API_KEY in Supabase Dashboard → Settings → Edge Functions → Secrets
//
// Deploy: supabase functions deploy send-sms --project-ref biezzykcgzkrwdgqpsar

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const TEXTBELT_API_KEY = Deno.env.get('TEXTBELT_API_KEY')
    if (!TEXTBELT_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'SMS not configured' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const { to, message } = await req.json() as { tenant_id: string; to: string; message: string; type: string }

    const textbeltRes = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: to, message, key: TEXTBELT_API_KEY }),
    })

    const result = await textbeltRes.json()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
