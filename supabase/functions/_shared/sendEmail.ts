/**
 * sendEmail — shared Resend helper for all HomeFlow Pro edge functions.
 *
 * fromName: REQUIRED. Customer-facing emails should pass the tenant's
 * business name. Platform/internal emails should pass PLATFORM_NAME from
 * shared/lib/platformBrand.ts — import the constant, never retype the string.
 * Never default — the wrong choice has shipped to prod before.
 *
 * S317. This said "should pass 'PestFlow Pro'" until the platform/vertical
 * split. That line was instructions to reproduce the bug: it is guidance, so a
 * reader acting on it reintroduced the pest brand into a lawn client's inbox.
 * The sending DOMAIN (@pestflow.ai) is deliberately untouched — platformBrand
 * is user-visible copy only and must not rename domains.
 */
export async function sendEmail({
  to,
  cc,
  subject,
  html,
  text,
  replyTo,
  fromName,
  idempotencyKey,
}: {
  to: string
  cc?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  fromName: string
  idempotencyKey?: string
}): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
  const payload: Record<string, unknown> = {
    from: `${fromName} <noreply@pestflow.ai>`,
    to,
    subject,
    html,
  }
  if (cc)      payload.cc       = cc
  if (text)    payload.text     = text
  if (replyTo) payload.reply_to = replyTo

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${RESEND_API_KEY}`,
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    throw new Error(`Resend failed: ${err}`)
  }
}
