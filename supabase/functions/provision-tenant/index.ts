// Supabase Edge Function: provision-tenant v5
// Auto-creates tenant row if tenant_id not supplied.
// Creates auth user, seeds tenant_users, and provisions all required settings.
// Called by the Client Setup Wizard using the anon key (CORS-open).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  tenant_id?: string
  slug?: string
  admin_email?: string
  admin_password?: string
  business_info: { name: string; phone: string; email: string; address: string; tagline: string; industry: string }
  branding: { logo_url: string; primary_color: string; template: string }
  social_links: { facebook: string; instagram: string; google: string; youtube: string }
  integrations: { google_place_id: string; ga4_id: string }
  plan: string
  subscription: { tier: number; plan_name: string; monthly_price: number }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const body: RequestBody = await req.json()
    const { slug, admin_email, admin_password, business_info: bi,
            branding, social_links: social, integrations, subscription } = body

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Resolve slug — prefer explicit, fall back to slugified biz name
    const resolvedSlug = (slug || bi.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)).trim()
    if (!resolvedSlug) {
      return new Response(JSON.stringify({ error: 'slug or business_info.name is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Step 1: Resolve or create tenant row
    let tenantId = body.tenant_id?.trim() || ''
    if (!tenantId) {
      // Check if slug already exists (idempotent)
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', resolvedSlug)
        .maybeSingle()
      if (existing) {
        tenantId = existing.id
      } else {
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({ slug: resolvedSlug, name: bi.name || resolvedSlug })
          .select('id')
          .single()
        if (tenantError || !newTenant) {
          return new Response(JSON.stringify({ error: 'Failed to create tenant: ' + (tenantError?.message || 'unknown') }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
          })
        }
        tenantId = newTenant.id
      }
    } else {
      // Ensure slug and name are set on provided tenant row
      await supabase.from('tenants').update({ slug: resolvedSlug, name: bi.name || resolvedSlug }).eq('id', tenantId)
    }

    // Step 2: Create auth user via Admin API, insert into tenant_users
    if (admin_email && admin_password) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: admin_email,
        password: admin_password,
        email_confirm: true,
      })
      if (authError) {
        console.error('Failed to create auth user:', authError.message)
      } else if (authData.user) {
        const { error: tuError } = await supabase
          .from('tenant_users')
          .insert({ tenant_id: tenantId, user_id: authData.user.id, role: 'admin' })
        if (tuError && tuError.code !== '23505') {
          console.error('Failed to insert tenant_users:', tuError.message)
        }
      }
    }

    // Step 3: Seed all 11 required settings keys
    const email = bi.email || ''
    const settingsRows = [
      { tenant_id: tenantId, key: 'business_info', value: { name: bi.name||'', phone: bi.phone||'', email, address: bi.address||'', tagline: bi.tagline||'', industry: bi.industry||'Pest Control', hours: '', license: '', certifications: '', founded_year: '', num_technicians: '' } },
      { tenant_id: tenantId, key: 'branding', value: { logo_url: branding.logo_url||'', favicon_url: '', primary_color: branding.primary_color||'#10b981', accent_color: '#f5c518', template: branding.template||'modern-pro', cta_text: 'Get a Free Inspection' } },
      { tenant_id: tenantId, key: 'customization', value: { hero_headline: bi.tagline||'', show_license: true, show_years: true, show_technicians: true, show_certifications: true } },
      { tenant_id: tenantId, key: 'social_links', value: { facebook: social.facebook||'', instagram: social.instagram||'', google: social.google||'', youtube: social.youtube||'' } },
      { tenant_id: tenantId, key: 'integrations', value: { google_place_id: integrations.google_place_id||'', google_analytics_id: integrations.ga4_id||'', google_maps_api_key: '', pexels_api_key: '', textbelt_api_key: '', owner_sms_number: '', ayrshare_api_key: '', facebook_access_token: '', facebook_page_id: '' } },
      { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: true } },
      { tenant_id: tenantId, key: 'hero_media', value: { youtube_id: '', thumbnail_url: '' } },
      { tenant_id: tenantId, key: 'holiday_mode', value: { enabled: false, holiday: '', message: '', auto_schedule: '' } },
      { tenant_id: tenantId, key: 'notifications', value: { cc_email: '', lead_email: email, monthly_report_email: email } },
      { tenant_id: tenantId, key: 'demo_mode', value: { active: false, seeded_at: '' } },
      { tenant_id: tenantId, key: 'subscription', value: { tier: subscription.tier||1, plan_name: subscription.plan_name||'Starter', monthly_price: subscription.monthly_price||99 } },
    ]

    for (const row of settingsRows) {
      const { error } = await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
      if (error) console.error(`Failed to upsert ${row.key}:`, error.message)
    }

    const liveUrl = `https://${resolvedSlug}.pestflowpro.com`
    return new Response(JSON.stringify({ success: true, tenant_id: tenantId, slug: resolvedSlug, url: liveUrl }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    console.error('provision-tenant error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
