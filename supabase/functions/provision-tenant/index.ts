// Supabase Edge Function: provision-tenant
// Pre-populates settings rows for a newly created tenant.
// Called by the Client Setup Wizard after export, using the service role key
// so it can write to any tenant's settings.
//
// SETUP:
// 1. Set env vars in Supabase Dashboard (auto-set by Supabase):
//    - SUPABASE_URL
//    - SUPABASE_SERVICE_ROLE_KEY
// 2. Deploy: supabase functions deploy provision-tenant --project-ref biezzykcgzkrwdgqpsar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

interface RequestBody {
  tenant_id: string
  slug?: string
  business_info: {
    name: string
    phone: string
    email: string
    address: string
    tagline: string
    industry: string
  }
  branding: {
    logo_url: string
    primary_color: string
    template: string
  }
  social_links: {
    facebook: string
    instagram: string
    google: string
    youtube: string
  }
  integrations: {
    google_place_id: string
    ga4_id: string
  }
  plan: string
  subscription: {
    tier: number
    plan_name: string
    monthly_price: number
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const body: RequestBody = await req.json()
    const { tenant_id, slug, business_info, branding, social_links, integrations, plan, subscription } = body

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'tenant_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const settingsRows = [
      {
        tenant_id,
        key: 'business_info',
        value: {
          name: business_info.name || '',
          phone: business_info.phone || '',
          email: business_info.email || '',
          address: business_info.address || '',
          tagline: business_info.tagline || '',
          industry: business_info.industry || 'Pest Control',
          hours: '',
          license: '',
        },
      },
      {
        tenant_id,
        key: 'branding',
        value: {
          logo_url: branding.logo_url || '',
          favicon_url: '',
          primary_color: branding.primary_color || '#10b981',
          accent_color: '#f5c518',
          template: branding.template || 'modern-pro',
        },
      },
      {
        tenant_id,
        key: 'social_links',
        value: {
          facebook: social_links.facebook || '',
          instagram: social_links.instagram || '',
          google: social_links.google || '',
          youtube: social_links.youtube || '',
        },
      },
      {
        tenant_id,
        key: 'integrations',
        value: {
          google_place_id: integrations.google_place_id || '',
          ga4_id: integrations.ga4_id || '',
          facebook_access_token: '',
          facebook_page_id: '',
          google_api_key: '',
        },
      },
      {
        tenant_id,
        key: 'subscription',
        value: {
          tier: subscription.tier || 1,
          plan_name: subscription.plan_name || 'Starter',
          monthly_price: subscription.monthly_price || 149,
          plan,
        },
      },
    ]

    for (const row of settingsRows) {
      const { error } = await supabase
        .from('settings')
        .upsert(row, { onConflict: 'tenant_id,key' })
      if (error) {
        console.error(`Failed to upsert ${row.key}:`, error.message)
      }
    }

    // Store the slug on the tenant row so subdomain routing works immediately
    const resolvedSlug = slug || business_info.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
    if (resolvedSlug) {
      const { error: slugError } = await supabase
        .from('tenants')
        .update({ slug: resolvedSlug })
        .eq('id', tenant_id)
      if (slugError) console.error('Failed to set tenant slug:', slugError.message)
    }

    const liveUrl = resolvedSlug ? `https://${resolvedSlug}.pestflowpro.com` : null

    return new Response(JSON.stringify({ success: true, slug: resolvedSlug, url: liveUrl }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('provision-tenant error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
