import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { business_name, contact_name, plan, markdown_content } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PestFlow Pro <onboarding@pestflow.ai>',
        to: ['scott@ironwoodoperationsgroup.com'],
        subject: `New Client Setup — ${business_name} (${plan})`,
        html: `
          <h2>New PestFlow Pro Client Setup</h2>
          <p><strong>Business:</strong> ${business_name}</p>
          <p><strong>Contact:</strong> ${contact_name}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <hr />
          <h3>Full Setup Document</h3>
          <pre style="background:#f5f5f5;padding:16px;border-radius:8px;font-size:12px;white-space:pre-wrap">${markdown_content}</pre>
        `,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error: ${err}`)
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
