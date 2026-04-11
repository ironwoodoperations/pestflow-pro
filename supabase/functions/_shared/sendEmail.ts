export async function sendEmail({
  to,
  cc,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string
  cc?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
  const payload: Record<string, unknown> = {
    from: 'PestFlow Pro <noreply@pestflow.ai>',
    to,
    subject,
    html,
  }
  if (cc)      payload.cc       = cc
  if (text)    payload.text     = text
  if (replyTo) payload.reply_to = replyTo

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    throw new Error(`Resend failed: ${err}`)
  }
}
