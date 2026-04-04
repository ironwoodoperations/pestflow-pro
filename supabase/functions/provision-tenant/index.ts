// Supabase Edge Function: provision-tenant v3
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
  tenant_id: string
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
    const { tenant_id, slug, admin_email, admin_password, business_info: bi,
            branding, social_links: social, integrations, subscription } = body

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'tenant_id is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fix A + B: Create auth user via Admin API (handles all columns correctly),
    // then insert into tenant_users so has_role check passes on first login.
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
          .insert({ tenant_id, user_id: authData.user.id, role: 'admin' })
          .select()
          .single()
        if (tuError && tuError.code !== '23505') {
          console.error('Failed to insert tenant_users:', tuError.message)
        }
      }
    }

    // Fix C: Seed ALL required settings keys so the dashboard loads without errors.
    const email = bi.email || ''
    const settingsRows = [
      { tenant_id, key: 'business_info', value: { name: bi.name||'', phone: bi.phone||'', email, address: bi.address||'', tagline: bi.tagline||'', industry: bi.industry||'Pest Control', hours: '', license: '', certifications: '', founded_year: '', num_technicians: '' } },
      { tenant_id, key: 'branding', value: { logo_url: branding.logo_url||'', favicon_url: '', primary_color: branding.primary_color||'#10b981', accent_color: '#f5c518', template: branding.template||'modern-pro', cta_text: 'Get a Free Inspection' } },
      { tenant_id, key: 'customization', value: { hero_headline: bi.tagline||'', show_license: true, show_years: true, show_technicians: true, show_certifications: true } },
      { tenant_id, key: 'social_links', value: { facebook: social.facebook||'', instagram: social.instagram||'', google: social.google||'', youtube: social.youtube||'' } },
      { tenant_id, key: 'integrations', value: { google_place_id: integrations.google_place_id||'', google_analytics_id: integrations.ga4_id||'', google_maps_api_key: '', pexels_api_key: '', textbelt_api_key: '', owner_sms_number: '', ayrshare_api_key: '', facebook_access_token: '', facebook_page_id: '' } },
      { tenant_id, key: 'onboarding_complete', value: { complete: true } },
      { tenant_id, key: 'hero_media', value: { youtube_id: '', thumbnail_url: '' } },
      { tenant_id, key: 'holiday_mode', value: { enabled: false, holiday: '', message: '', auto_schedule: '' } },
      { tenant_id, key: 'notifications', value: { cc_email: '', lead_email: email, monthly_report_email: email } },
      { tenant_id, key: 'demo_mode', value: { active: false, seeded_at: '' } },
      { tenant_id, key: 'subscription', value: { tier: subscription.tier||1, plan_name: subscription.plan_name||'Starter', monthly_price: subscription.monthly_price||99 } },
    ]

    for (const row of settingsRows) {
      const { error } = await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
      if (error) console.error(`Failed to upsert ${row.key}:`, error.message)
    }

    // Store slug on tenant row so subdomain routing works immediately.
    const resolvedSlug = slug || bi.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
    if (resolvedSlug) {
      const { error: slugError } = await supabase.from('tenants').update({ slug: resolvedSlug }).eq('id', tenant_id)
      if (slugError) console.error('Failed to set tenant slug:', slugError.message)
    }

    const liveUrl = resolvedSlug ? `https://${resolvedSlug}.pestflowpro.com` : null
    return new Response(JSON.stringify({ success: true, slug: resolvedSlug, url: liveUrl }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    console.error('provision-tenant error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
