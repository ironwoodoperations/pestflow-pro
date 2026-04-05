// Supabase Edge Function: provision-tenant v13
// Reads onboarding_sessions for wizard data (name, colors, shell, etc.) when available.
// Falls back to direct body fields for legacy/manual calls.
// Creates auth user, seeds tenant_users, and provisions all 11 required settings keys.

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
  onboarding_session_id?: string
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
    const { slug, admin_email, admin_password, onboarding_session_id,
            business_info: bi, branding, social_links: social,
            integrations, subscription } = body

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // --- Fetch onboarding session wizard data (preferred path) ---
    let wd: Record<string, any> | null = null
    if (onboarding_session_id) {
      const { data: sessionRow } = await supabase
        .from('onboarding_sessions')
        .select('wizard_data')
        .eq('id', onboarding_session_id)
        .eq('consumed', false)
        .maybeSingle()
      if (sessionRow?.wizard_data) {
        wd = sessionRow.wizard_data
        console.log(`Loaded wizard data from onboarding_session ${onboarding_session_id}`)
      } else {
        console.warn(`onboarding_session ${onboarding_session_id} not found or already consumed — falling back to body fields`)
      }
    }

    // Helper: prefer wizard data field, fall back to direct body field
    const wbi  = wd?.business_info  || {}
    const wbr  = wd?.branding       || {}
    const wcu  = wd?.customization  || {}
    const wsl  = wd?.social_links   || {}
    const wsub = wd?.subscription   || {}

    // Resolve slug
    const resolvedSlug = (wd?.slug || slug || bi.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)).trim()
    if (!resolvedSlug) {
      return new Response(JSON.stringify({ error: 'slug or business_info.name is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    // Resolve admin credentials — wizard data takes priority
    const resolvedAdminEmail    = (wd ? (wbi.email || admin_email) : admin_email) || ''
    const resolvedAdminPassword = (wd ? (wd.admin_password || admin_password) : admin_password) || ''

    // Step 1: Resolve or create tenant row
    let tenantId = body.tenant_id?.trim() || ''
    if (!tenantId) {
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', resolvedSlug)
        .maybeSingle()
      if (existing) {
        tenantId = existing.id
      } else {
        const name = wbi.name || bi.name || resolvedSlug
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({ slug: resolvedSlug, name })
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
      const name = wbi.name || bi.name || resolvedSlug
      await supabase.from('tenants').update({ slug: resolvedSlug, name }).eq('id', tenantId)
    }

    // Step 2: Create auth user
    if (resolvedAdminEmail && resolvedAdminPassword) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email:         resolvedAdminEmail,
        password:      resolvedAdminPassword,
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
    } else {
      console.warn('Skipping auth user creation — missing email or password')
    }

    // Step 3: Seed all 11 required settings keys using wizard data where available
    const email = wbi.email || bi.email || ''

    const settingsRows = [
      { tenant_id: tenantId, key: 'business_info', value: {
        name:            wbi.name            || bi.name    || '',
        phone:           wbi.phone           || bi.phone   || '',
        email,
        address:         wbi.address         || bi.address || '',
        hours:           wbi.hours           || '',
        tagline:         wbi.tagline         || bi.tagline || '',
        industry:        wbi.industry        || 'Pest Control',
        license:         wbi.license         || '',
        certifications:  wbi.certifications  || '',
        founded_year:    wbi.founded_year    || '',
        num_technicians: wbi.num_technicians || '',
      }},
      { tenant_id: tenantId, key: 'branding', value: {
        logo_url:      wbr.logo_url      || branding?.logo_url      || '',
        favicon_url:   wbr.favicon_url   || '',
        primary_color: wbr.primary_color || branding?.primary_color || '#10b981',
        accent_color:  wbr.accent_color  || '#0a0f1e',
        template:      wbr.template      || branding?.template      || 'modern-pro',
        cta_text:      wbr.cta_text      || 'Get a Free Quote',
      }},
      { tenant_id: tenantId, key: 'customization', value: {
        hero_headline:        wcu.hero_headline        ?? (wbi.tagline || bi.tagline || ''),
        show_license:         wcu.show_license         ?? true,
        show_years:           wcu.show_years           ?? true,
        show_technicians:     wcu.show_technicians     ?? true,
        show_certifications:  wcu.show_certifications  ?? true,
      }},
      { tenant_id: tenantId, key: 'social_links', value: {
        facebook:  wsl.facebook  || social?.facebook  || '',
        instagram: wsl.instagram || social?.instagram || '',
        google:    wsl.google    || social?.google    || '',
        youtube:   wsl.youtube   || social?.youtube   || '',
      }},
      { tenant_id: tenantId, key: 'integrations', value: {
        google_place_id:     integrations?.google_place_id || '',
        google_analytics_id: integrations?.ga4_id          || '',
        google_maps_api_key: '',
        pexels_api_key:      '',
        textbelt_api_key:    '',
        owner_sms_number:    (wbi.phone || bi.phone || '').replace(/\D/g, ''),
        ayrshare_api_key:    '',
        facebook_access_token: '',
        facebook_page_id:    '',
      }},
      { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: false } },
      { tenant_id: tenantId, key: 'hero_media',           value: { youtube_id: '', thumbnail_url: '' } },
      { tenant_id: tenantId, key: 'holiday_mode',         value: { enabled: false, holiday: '', message: '', auto_schedule: '' } },
      { tenant_id: tenantId, key: 'notifications',        value: { cc_email: '', lead_email: email, monthly_report_email: email } },
      { tenant_id: tenantId, key: 'demo_mode',            value: { active: false, seeded_at: '' } },
      { tenant_id: tenantId, key: 'subscription', value: {
        tier:          wsub.tier          || subscription?.tier          || 1,
        plan_name:     wsub.plan_name     || subscription?.plan_name     || 'Starter',
        monthly_price: wsub.monthly_price || subscription?.monthly_price || 149,
      }},
    ]

    for (const row of settingsRows) {
      const { error } = await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
      if (error) console.error(`Failed to upsert ${row.key}:`, error.message)
    }

    // Step 4: Mark onboarding session as consumed
    if (onboarding_session_id && wd) {
      await supabase
        .from('onboarding_sessions')
        .update({ consumed: true })
        .eq('id', onboarding_session_id)
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
