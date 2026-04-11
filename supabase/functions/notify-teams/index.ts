// Supabase Edge Function: notify-teams
// Posts a message to Microsoft Teams via webhook.
// No JWT required — called from the browser client.
//
// Deploy: supabase functions deploy notify-teams --project-ref biezzykcgzkrwdgqpsar --no-verify-jwt
// Secret:  supabase secrets set TEAMS_WEBHOOK_URL=<your-webhook-url> --project-ref biezzykcgzkrwdgqpsar

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function notifyTeams(message: string): Promise<void> {
  const webhookUrl = Deno.env.get('TEAMS_WEBHOOK_URL')
  if (!webhookUrl || webhookUrl === 'PLACEHOLDER') return
  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: message,
              wrap: true,
              size: "Medium"
            }
          ]
        }
      }
    ]
  }
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'message required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    await notifyTeams(message)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[notify-teams]', e)
    return new Response(JSON.stringify({ error: 'internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
