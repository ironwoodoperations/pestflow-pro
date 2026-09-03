// Edge Function: notify-support-ticket v17
// Called from SupportTab after a new ticket insert.
// Sends email notification to support@homeflowpro.ai via Resend.
// Gate: requireTenantUser — caller must be a MEMBER of the ticket's tenant.
//
// S308: was requireTenantAdmin. RLS lets any tenant_users member file a ticket
// (support_tickets.tenant_insert_own_tickets checks is_tenant_member), so an
// admin-only notify gate meant a `user`-role member could insert a ticket that
// emailed nobody — the same silent failure in a new place. The gate is still
// resource-bound: tenant_id is derived from the ticket being acted on, so a
// caller who belongs to tenant A cannot notify on tenant B's ticket.
//
// Deploy: ./scripts/deploy-function.sh notify-support-ticket --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantUser, AuthError } from '../_shared/auth/requireTenantUser.ts'
import { PLATFORM_NAME } from '../../../shared/lib/platformBrand.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

  try {
    const { ticketId } = await req.json()
    if (!ticketId) return json({ error: 'ticketId required' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch ticket first — we need tenant_id for the auth gate
    const { data: ticket, error: ticketErr } = await supabase
      .from('support_tickets')
      .select('*, tenants(name)')
      .eq('id', ticketId)
      .maybeSingle()

    if (ticketErr || !ticket) return json({ error: 'Ticket not found' }, 404)

    // Gate: caller must be a member of this ticket's tenant
    try {
      await requireTenantUser(req, ticket.tenant_id)
    } catch (e) {
      if (e instanceof AuthError) return e.toResponse()
      throw e
    }

    // Get tenant notification email for reply-to
    const { data: notifSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('tenant_id', ticket.tenant_id)
      .eq('key', 'notifications')
      .maybeSingle()

    const tenantEmail: string = notifSettings?.value?.lead_email || ''
    const tenantName: string = (ticket.tenants as any)?.name ?? ticket.tenant_id

    const subject = `[${ticket.priority.toUpperCase()}] New Support Ticket: ${ticket.subject}`
    const body = `Tenant: ${tenantName}\nPriority: ${ticket.priority}\nSubject: ${ticket.subject}\n\n${ticket.body}\n\nView in Ironwood: https://pestflowpro.com/ironwood`

    const emailPayload: Record<string, unknown> = {
      from: `${PLATFORM_NAME} <noreply@pestflow.ai>`,
      to: ['support@homeflowpro.ai'],
      subject,
      text: body,
    }
    if (tenantEmail) emailPayload.reply_to = tenantEmail

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify(emailPayload),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return json({ error: `Resend failed: ${err}` }, 500)
    }

    return json({ success: true })
  } catch (err: any) {
    console.error('notify-support-ticket error:', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
