// Edge Function: notify-upgrade v12
// Called from BillingTab when a client initiates a plan upgrade checkout.
// Gate: requireTenantAdmin — caller must be admin of the requesting tenant.
//
// Deploy: supabase functions deploy notify-upgrade --no-verify-jwt --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireTenantAdmin, AuthError } from '../_shared/auth/requireTenantUser.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

const TIER_NAMES: Record<number, string> = { 1: 'Starter', 2: 'Grow', 3: 'Pro', 4: 'Elite' }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  try {
    const { tenant_id, old_tier, new_tier, plan_name, monthly_price } = await req.json()
    if (!tenant_id || !new_tier) return json({ error: 'tenant_id and new_tier required' }, 400)

    // Gate: caller must be admin of this tenant
    try {
      await requireTenantAdmin(req, tenant_id)
    } catch (e) {
      if (e instanceof AuthError) return e.toResponse()
      throw e
    }

    const supabaseUrl    = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Fetch tenant name + slug
    const { data: tenant } = await supabase.from('tenants').select('name, slug').eq('id', tenant_id).maybeSingle()
    const tenantName = tenant?.name || tenant_id
    const tenantSlug = tenant?.slug || ''

    const oldName = TIER_NAMES[old_tier] || `Tier ${old_tier}`
    const newName = plan_name || TIER_NAMES[new_tier] || `Tier ${new_tier}`
    const price   = monthly_price ? `$${monthly_price}/mo` : ''

    // Email to sales inbox via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'PestFlow Pro <onboarding@pestflow.ai>',
          to: 'sales@homeflowpro.ai',
          subject: `⬆️ Plan Upgrade: ${tenantName} → ${newName}`,
          html: `<p><strong>${tenantName}</strong> started a plan upgrade to <strong>${newName}</strong> (${price}).</p><p>They moved from ${oldName}. Call to confirm and check in.</p><p>Slug: ${tenantSlug}</p>`,
          reply_to: 'sales@homeflowpro.ai',
        }),
      }).catch(e => console.error('[notify-upgrade] Resend failed:', e.message))
    }

    return json({ success: true })
  } catch (err: any) {
    console.error('[notify-upgrade]', err?.message)
    return json({ error: err?.message || 'Internal server error' }, 500)
  }
})
