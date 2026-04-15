// Supabase Edge Function: send-sms
// Sends SMS via Textbelt. Called server-side so the API key never touches the browser.
//
// MANUAL STEP REQUIRED after deploy:
//   Set TEXTBELT_API_KEY in Supabase Dashboard → Settings → Edge Functions → Secrets
//   (Dashboard → Edge Functions → send-sms → Secrets tab)
//   Value must be your real Textbelt paid API key — NOT the string "textbelt" (free/sandbox only)
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
    const { to, message, type, key: callerKey } = await req.json() as { tenant_id: string; to: string; message: string; type: string; key?: string }

    // Prefer key passed by caller (resolved with tenant + env fallback upstream),
    // then fall back to env secret directly.
    const TEXTBELT_API_KEY = callerKey?.trim() || Deno.env.get('TEXTBELT_API_KEY')
    if (!TEXTBELT_API_KEY) {
      console.error('[send-sms] TEXTBELT_API_KEY secret is not set — SMS will not send.')
      return new Response(
        JSON.stringify({ success: false, error: 'SMS not configured — TEXTBELT_API_KEY missing' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }
    // Normalize to E.164-style: strip non-digits, prepend 1 if 10-digit US number
    const digits = to.replace(/\D/g, '')
    const phone = digits.length === 10 ? `1${digits}` : digits
    console.log(`[send-sms] Sending ${type || 'sms'} to ${phone.slice(0, 6)}…`)

    const textbeltRes = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message, key: TEXTBELT_API_KEY }),
    })

    const result = await textbeltRes.json()
    // Log full Textbelt response for debugging
    console.log('[send-sms] Textbelt response:', JSON.stringify(result))

    if (!result.success) {
      console.error('[send-sms] Textbelt error:', result.error, '| quota remaining:', result.quotaRemaining)
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-sms] Exception:', String(err))
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
