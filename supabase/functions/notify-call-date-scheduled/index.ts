// Edge Function: notify-call-date-scheduled
// Fires a Power Automate webhook when a prospect's call_date is set/changed.
// Silently no-ops if POWER_AUTOMATE_CALL_DATE_WEBHOOK_URL is not configured.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const webhookUrl = Deno.env.get('POWER_AUTOMATE_CALL_DATE_WEBHOOK_URL')
    if (!webhookUrl) return new Response(null, { status: 204, headers: CORS })

    const body = await req.json()

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error('Power Automate webhook error:', res.status, await res.text().catch(() => ''))
      return json({ error: 'Webhook responded with error' }, 502)
    }

    return json({ ok: true })
  } catch (err) {
    console.error('notify-call-date-scheduled error:', err)
    return json({ ok: false })
  }
})
