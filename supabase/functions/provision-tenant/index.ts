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
  prospect_id?: string
  onboarding_session_id?: string
  business_info: { name: string; phone: string; email: string; address: string; tagline: string; industry: string }
  branding: { logo_url: string; primary_color: string; template: string }
  customization?: {
    hero_headline?: string
    show_license?: boolean
    show_years?: boolean
    show_technicians?: boolean
    show_certifications?: boolean
  }
  social_links: { facebook: string; instagram: string; google: string; youtube: string }
  integrations: { google_place_id: string; ga4_id: string }
  plan: string
  subscription: { tier: number; plan_name: string; monthly_price: number }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const body: RequestBody = await req.json()
    const { slug, admin_email, admin_password, prospect_id, onboarding_session_id,
            business_info: bi, branding, customization: bodyCustomization,
            social_links: social, integrations, subscription } = body

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

    // BUG C: Validate admin email has a dot after @
    if (resolvedAdminEmail) {
      const atIdx = resolvedAdminEmail.indexOf('@')
      const afterAt = atIdx >= 0 ? resolvedAdminEmail.slice(atIdx + 1) : ''
      if (atIdx < 0 || !afterAt.includes('.')) {
        return new Response(JSON.stringify({ success: false, error: 'Admin email must be a valid address (e.g. admin@company.com)' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
        })
      }
    }

    // Step 1: Resolve or create tenant row
    let tenantId = body.tenant_id?.trim() || ''
    if (!tenantId) {
      // SAFEGUARD: Refuse to provision if slug already exists — never overwrite an existing tenant
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', resolvedSlug)
        .maybeSingle()
      if (existing) {
        console.warn(`[provision-tenant] BLOCKED — slug "${resolvedSlug}" already exists (tenant ${existing.id})`)
        return new Response(JSON.stringify({
          error: 'Tenant slug already exists',
          existingSlug: resolvedSlug,
          suggestion: resolvedSlug + '2',
        }), { status: 409, headers: { 'Content-Type': 'application/json', ...CORS } })
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
      const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
        email:         resolvedAdminEmail,
        password:      resolvedAdminPassword,
        email_confirm: true,
      })
      if (createUserError) {
        if (createUserError.message?.includes('already been registered') || createUserError.message?.includes('already exists')) {
          console.warn('Auth user already exists for email:', resolvedAdminEmail, '— proceeding with existing user')
        } else {
          console.error('createUser failed:', createUserError.message)
          return new Response(JSON.stringify({ success: false, error: `Failed to create admin user: ${createUserError.message}` }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
          })
        }
      }
      if (!createUserError && authData?.user) {
        const companyName = wbi.name || bi?.name || resolvedSlug
        // tenant_users
        const { error: tuError } = await supabase
          .from('tenant_users')
          .insert({ tenant_id: tenantId, user_id: authData.user.id, role: 'admin' })
        if (tuError && tuError.code !== '23505') {
          console.error('Failed to insert tenant_users:', tuError.message)
        }
        // BUG A: profiles
        const { error: profError } = await supabase
          .from('profiles')
          .insert({ id: authData.user.id, tenant_id: tenantId, full_name: companyName + ' Admin', role: 'admin' })
        if (profError && profError.code !== '23505') {
          console.error('Failed to insert profiles:', profError.message)
        }
        // BUG B: user_roles
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'admin' })
        if (roleError && roleError.code !== '23505') {
          console.error('Failed to insert user_roles:', roleError.message)
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
        favicon_url:   wbr.favicon_url   || branding?.favicon_url   || '',
        primary_color: wbr.primary_color || branding?.primary_color || '#E87800',
        accent_color:  wbr.accent_color  || branding?.accent_color  || '#1a1a1a',
        template:      wbr.template      || branding?.template      || 'modern-pro',
        cta_text:      wbr.cta_text      || branding?.cta_text      || 'Get a Free Quote',
      }},
      { tenant_id: tenantId, key: 'customization', value: {
        hero_headline:        wcu.hero_headline        ?? bodyCustomization?.hero_headline ?? (wbi.tagline || bi?.tagline || ''),
        show_license:         wcu.show_license         ?? bodyCustomization?.show_license         ?? true,
        show_years:           wcu.show_years           ?? bodyCustomization?.show_years           ?? true,
        show_technicians:     wcu.show_technicians     ?? bodyCustomization?.show_technicians     ?? true,
        show_certifications:  wcu.show_certifications  ?? bodyCustomization?.show_certifications  ?? true,
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
      { tenant_id: tenantId, key: 'notifications',        value: { cc_email: '', lead_email: resolvedAdminEmail || email } },
      { tenant_id: tenantId, key: 'demo_mode',            value: { active: false, seeded_at: '' } },
      { tenant_id: tenantId, key: 'subscription', value: {
        tier:          wsub.tier          ?? subscription?.tier          ?? 1,
        plan_name:     wsub.plan_name     || subscription?.plan_name     || 'Starter',
        monthly_price: wsub.monthly_price || subscription?.monthly_price || 149,
      }},
    ]

    for (const row of settingsRows) {
      const { error } = await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' })
      if (error) console.error(`Failed to upsert ${row.key}:`, error.message)
    }

    // Step 4: Seed page_content rows for the new tenant
    const businessName = wbi.name || bi?.name || resolvedSlug
    const pageContentRows = [
      { tenant_id: tenantId, page_slug: 'home',                title: `${businessName} — Professional Pest Control`,  subtitle: 'Licensed & insured professionals. Fast, effective results.', intro: '' },
      { tenant_id: tenantId, page_slug: 'about',               title: `About ${businessName}`, subtitle: 'Locally owned and operated.', intro: '' },
      { tenant_id: tenantId, page_slug: 'pest-control',        title: 'Pest Control Services', subtitle: 'Comprehensive pest management solutions.', intro: '' },
      { tenant_id: tenantId, page_slug: 'termite-control',     title: 'Termite Control', subtitle: 'Protect your home from termite damage.', intro: '' },
      { tenant_id: tenantId, page_slug: 'termite-inspections', title: 'Termite Inspections', subtitle: 'Thorough inspections by certified professionals.', intro: '' },
      { tenant_id: tenantId, page_slug: 'roach-control',       title: 'Roach Control', subtitle: 'Fast, effective cockroach elimination.', intro: '' },
      { tenant_id: tenantId, page_slug: 'ant-control',         title: 'Ant Control', subtitle: 'Stop ants before they take over.', intro: '' },
      { tenant_id: tenantId, page_slug: 'mosquito-control',    title: 'Mosquito Control', subtitle: 'Enjoy your yard again.', intro: '' },
      { tenant_id: tenantId, page_slug: 'bed-bug-control',     title: 'Bed Bug Treatment', subtitle: 'Sleep easy again — bed bugs eliminated.', intro: '' },
      { tenant_id: tenantId, page_slug: 'flea-tick-control',   title: 'Flea & Tick Control', subtitle: 'Protect your family and pets.', intro: '' },
      { tenant_id: tenantId, page_slug: 'rodent-control',      title: 'Rodent Control', subtitle: 'Exclusion and elimination, done right.', intro: '' },
      { tenant_id: tenantId, page_slug: 'scorpion-control',    title: 'Scorpion Control', subtitle: 'Safe, effective scorpion treatments.', intro: '' },
      { tenant_id: tenantId, page_slug: 'spider-control',     title: 'Spider Control', subtitle: 'Fast, effective spider elimination.', intro: '' },
      { tenant_id: tenantId, page_slug: 'wasp-hornet-control', title: 'Wasp & Hornet Control', subtitle: 'Safe removal of nests — we handle the dangerous work.', intro: '' },
      { tenant_id: tenantId, page_slug: 'contact',             title: 'Contact Us', subtitle: "We're here to help.", intro: '' },
      { tenant_id: tenantId, page_slug: 'faq',                 title: 'Frequently Asked Questions', subtitle: 'Answers to common questions.', intro: '' },
      { tenant_id: tenantId, page_slug: 'quote',               title: 'Get a Free Quote', subtitle: 'Fast response, honest pricing.', intro: '' },
    ]
    for (const row of pageContentRows) {
      const { error: pcErr } = await supabase.from('page_content').upsert(row, { onConflict: 'tenant_id,page_slug' })
      if (pcErr) console.error(`Failed to upsert page_content ${row.page_slug}:`, pcErr.message)
    }

    // Step 5: Overlay page_content with real scraped data (if available on the prospect)
    if (prospect_id) {
      try {
        const { data: prospect } = await supabase
          .from('prospects')
          .select('scraped_content')
          .eq('id', prospect_id)
          .maybeSingle()

        const sc = prospect?.scraped_content as Record<string, { title?: string; subtitle?: string; intro?: string }> | null
        if (sc && Object.keys(sc).length > 0) {
          for (const [slug, pc] of Object.entries(sc)) {
            if (!pc.title && !pc.intro) continue
            const { error: scErr } = await supabase.from('page_content').upsert({
              tenant_id: tenantId,
              page_slug: slug,
              title:    pc.title    || undefined,
              subtitle: pc.subtitle || undefined,
              intro:    pc.intro    || undefined,
            }, { onConflict: 'tenant_id,page_slug' })
            if (scErr) console.error(`scraped page_content upsert failed for ${slug}:`, scErr.message)
          }
          console.log(`Seeded ${Object.keys(sc).length} page_content rows from scraped_content`)
        }
      } catch (scrapedErr: any) {
        console.error('scraped_content seeding failed (non-fatal):', scrapedErr?.message)
      }
    }

    // Step 6: Seed youpest_layout if this is a Pro (youpest template) tenant
    if (prospect_id) {
      try {
        const { data: proProspect } = await supabase
          .from('prospects')
          .select('youpest_layout, source_url, branding')
          .eq('id', prospect_id)
          .maybeSingle()

        const template = wbr.template || branding?.template || ''
        if (template === 'youpest' && proProspect?.youpest_layout) {
          const { error: ylErr } = await supabase
            .from('youpest_layout')
            .upsert({
              tenant_id:      tenantId,
              layout_config:  proProspect.youpest_layout,
              status:         'applied',
              generated_from: proProspect.source_url || (proProspect.branding as any)?.source_url || '',
            }, { onConflict: 'tenant_id' })
          if (ylErr) console.error('youpest_layout upsert failed:', ylErr.message)
          else console.log('youpest_layout seeded for tenant', tenantId)
        }
      } catch (ylSeedErr: any) {
        console.error('youpest_layout seeding failed (non-fatal):', ylSeedErr?.message)
      }
    }

    // Step 7: Mark onboarding session as consumed
    if (onboarding_session_id && wd) {
      await supabase
        .from('onboarding_sessions')
        .update({ consumed: true })
        .eq('id', onboarding_session_id)
    }

    // Step 8: Create Zernio profile for social media posting (non-fatal)
    try {
      const ZERNIO_API_KEY = Deno.env.get('ZERNIO_API_KEY')
      if (ZERNIO_API_KEY) {
        const zernioRes = await fetch('https://zernio.com/api/v1/profiles', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${ZERNIO_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: businessName || resolvedSlug,
            description: `PestFlow Pro tenant: ${resolvedSlug}`,
          }),
        })
        const zernioData = await zernioRes.json()
        const zernioProfileId: string | undefined = zernioData?.profile?._id

        if (zernioProfileId) {
          console.log(`[provision-tenant] Zernio profile created: ${zernioProfileId}`)
          const { data: existingIntg } = await supabase
            .from('settings')
            .select('value')
            .eq('tenant_id', tenantId)
            .eq('key', 'integrations')
            .maybeSingle()
          const currentIntg = existingIntg?.value ?? {}
          await supabase
            .from('settings')
            .update({ value: { ...currentIntg, zernio_profile_id: zernioProfileId } })
            .eq('tenant_id', tenantId)
            .eq('key', 'integrations')

          // Register webhook so Zernio sends account.connected + post status events
          try {
            const webhookUrl = `${SUPABASE_URL}/functions/v1/zernio-webhook`
            await fetch('https://zernio.com/api/v1/webhooks', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${ZERNIO_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: webhookUrl,
                events: ['account.connected', 'post.published', 'post.failed', 'post.partial'],
                profileId: zernioProfileId,
              }),
            })
            console.log(`[provision-tenant] Zernio webhook registered: ${webhookUrl}`)
          } catch (webhookErr: any) {
            console.error('Zernio webhook registration failed (non-fatal):', webhookErr?.message)
          }
        } else {
          console.warn('[provision-tenant] Zernio profile creation returned no ID:', JSON.stringify(zernioData))
        }
      }
    } catch (zernioErr: any) {
      console.error('Zernio profile creation failed (non-fatal):', zernioErr?.message)
    }

    // Step 9: Seed from intake_data (non-fatal)
    if (prospect_id) {
      try {
        const { data: prosp } = await supabase
          .from('prospects')
          .select('intake_data, company_name')
          .eq('id', prospect_id)
          .maybeSingle()

        const intake = prosp?.intake_data as Record<string, any> | null
        const ib = intake?.business || {}
        const city  = (ib.city  || '').trim()
        const state = (ib.state || '').trim()
        const bizForSeo = ib.business_name || businessName

        // 9a: Overlay business_info with intake data
        if (city || state || ib.zip || ib.address) {
          const { data: existingBiRow } = await supabase.from('settings').select('value')
            .eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
          const currentBi = existingBiRow?.value ?? {}
          const fullAddress = [ib.address, city, state, ib.zip].filter(Boolean).join(', ')
          await supabase.from('settings').update({
            value: {
              ...currentBi,
              ...(ib.business_name ? { name: ib.business_name } : {}),
              ...(ib.phone    ? { phone: ib.phone }       : {}),
              ...(ib.email    ? { email: ib.email }       : {}),
              ...(fullAddress ? { address: fullAddress }  : {}),
              ...(ib.hours    ? { hours: ib.hours }       : {}),
              ...(ib.tagline  ? { tagline: ib.tagline }   : {}),
            }
          }).eq('tenant_id', tenantId).eq('key', 'business_info')
          console.log('[provision-tenant] business_info overlaid from intake_data')
        }

        // 9a-br: Overlay branding with intake_data.branding (logo, colors, template)
        const ib_br = (intake?.branding || {}) as Record<string, any>
        if (ib_br.logo_url || ib_br.primary_color || ib_br.accent_color || ib_br.template) {
          const { data: existingBrRow } = await supabase.from('settings').select('value')
            .eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle()
          const currentBr = existingBrRow?.value ?? {}
          await supabase.from('settings').update({
            value: {
              ...currentBr,
              ...(ib_br.logo_url      ? { logo_url:      ib_br.logo_url }      : {}),
              ...(ib_br.primary_color ? { primary_color: ib_br.primary_color } : {}),
              ...(ib_br.accent_color  ? { accent_color:  ib_br.accent_color }  : {}),
              ...(ib_br.template      ? { template:      ib_br.template }      : {}),
            }
          }).eq('tenant_id', tenantId).eq('key', 'branding')
          console.log('[provision-tenant] branding overlaid from intake_data')
        }

        // 9b: Seed SEO settings key
        const serviceArea = [city, state].filter(Boolean).join(', ')
        const metaDesc = ib.tagline
          ? `${bizForSeo} — ${ib.tagline}. Serving ${serviceArea || 'your area'}.`
          : `Professional pest control services by ${bizForSeo}. Serving ${serviceArea || 'your area'} and surrounding areas.`
        await supabase.from('settings').upsert(
          { tenant_id: tenantId, key: 'seo', value: {
            meta_description: metaDesc,
            service_areas: serviceArea ? [serviceArea] : [],
            focus_keyword: city ? `pest control ${city.toLowerCase()}` : 'pest control',
          }},
          { onConflict: 'tenant_id,key' }
        )

        // 9b-seo: Per-page SEO meta on page_content rows
        if (city) {
          const phone9 = ib.phone || ''
          const pageSeoMap: Record<string, { meta_title: string; meta_description: string }> = {
            'home':           { meta_title: `${bizForSeo} | Pest Control in ${city}${state ? ', ' + state : ''}`, meta_description: `${bizForSeo} offers professional pest control in ${city}. Licensed technicians, fast response, guaranteed results. Call for a free quote.` },
            'about':          { meta_title: `About ${bizForSeo} | Local Pest Control`,               meta_description: `Learn about ${bizForSeo}, your local pest control experts in ${city}${state ? ', ' + state : ''}. Family-owned, fully licensed and insured.` },
            'pest-control':   { meta_title: `Pest Control Services | ${bizForSeo}`,                  meta_description: `Comprehensive pest control services in ${city}. Ants, roaches, spiders, and more. Fast, effective, guaranteed.` },
            'termite-control':{ meta_title: `Termite Control & Treatment | ${bizForSeo}`,            meta_description: `Professional termite control in ${city}. Protect your home from costly termite damage. Free inspections available.` },
            'rodent-control': { meta_title: `Rodent Control | ${bizForSeo}`,                        meta_description: `Get rid of mice and rats in ${city}. Humane and effective rodent removal by ${bizForSeo}.` },
            'mosquito-control':{ meta_title: `Mosquito Treatment | ${bizForSeo}`,                   meta_description: `Mosquito control services in ${city}. Enjoy your yard again. Call ${bizForSeo} for a free quote.` },
            'contact':        { meta_title: `Contact ${bizForSeo} | ${city} Pest Control`,          meta_description: `Contact ${bizForSeo} for pest control in ${city}${state ? ', ' + state : ''}. ${phone9 ? 'Call ' + phone9 + ' or r' : 'R'}equest a free quote online.` },
          }
          for (const [pageSlug, seo] of Object.entries(pageSeoMap)) {
            await supabase.from('page_content').update({ meta_title: seo.meta_title, meta_description: seo.meta_description })
              .eq('tenant_id', tenantId).eq('page_slug', pageSlug)
          }
          console.log('[provision-tenant] per-page SEO meta seeded')
        }

        // 9c: Seed location_data row for primary city
        if (city) {
          const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          await supabase.from('location_data').upsert({
            tenant_id:        tenantId,
            city,
            slug:             citySlug,
            hero_title:       `Pest Control in ${city}${state ? ', ' + state : ''}`,
            intro:            `${bizForSeo} provides professional pest control in ${city}${state ? ', ' + state : ''}. Call today for a free estimate.`,
            is_live:          false,
            meta_title:       `Pest Control ${city}${state ? ', ' + state : ''} | ${bizForSeo}`,
            meta_description: metaDesc,
            focus_keyword:    `pest control ${city.toLowerCase()}`,
          }, { onConflict: 'tenant_id,city' })
          console.log(`[provision-tenant] location_data seeded for ${city}`)
        }

        // 9d: Seed 3 starter blog posts
        const postNow = new Date().toISOString()
        const day7ago = new Date(Date.now() - 7  * 86400000).toISOString()
        const day14ago= new Date(Date.now() - 14 * 86400000).toISOString()
        const starterPosts = [
          { tenant_id: tenantId, title: 'Top 5 Signs You Have a Pest Problem', slug: 'top-5-signs-pest-problem',
            excerpt: 'Early detection is the key to stopping a pest problem before it becomes a full infestation.',
            content: '<p>Early detection is the key to stopping a pest problem before it becomes a full infestation. Here are the top signs to watch for in your home...</p>',
            published_at: postNow },
          { tenant_id: tenantId, title: 'How to Prevent Pests This Season', slug: 'seasonal-pest-prevention-tips',
            excerpt: 'Seasonal changes bring new pest activity. These simple steps can keep your home protected year-round.',
            content: '<p>Every season brings different pest pressures. Here\'s how to stay ahead of them with simple preventive measures around your home...</p>',
            published_at: day7ago },
          { tenant_id: tenantId, title: 'Why Professional Pest Control Beats DIY', slug: 'professional-vs-diy-pest-control',
            excerpt: 'DIY products can reduce pest activity temporarily — but rarely eliminate the root cause.',
            content: '<p>Store-bought sprays and traps can temporarily reduce pest activity, but they rarely eliminate the root cause. Professional pest control delivers better, longer-lasting results...</p>',
            published_at: day14ago },
        ]
        for (const post of starterPosts) {
          const { error: blogErr } = await supabase.from('blog_posts').upsert(post, { onConflict: 'tenant_id,slug' })
          if (blogErr) console.error(`[provision-tenant] blog_posts upsert failed (${post.slug}):`, blogErr.message)
        }
        console.log('[provision-tenant] 3 starter blog posts seeded')

        // 9e: Advance prospect stage to it_in_progress
        await supabase.from('prospects').update({ pipeline_stage: 'it_in_progress' }).eq('id', prospect_id)
        console.log('[provision-tenant] prospect stage → it_in_progress')

      } catch (intakeErr: any) {
        console.error('[provision-tenant] intake seeding failed (non-fatal):', intakeErr?.message)
      }
    }

    // Teams notification (non-fatal)
    try {
      const TEAMS_WEBHOOK_URL = Deno.env.get('TEAMS_WEBHOOK_URL')
      if (TEAMS_WEBHOOK_URL && TEAMS_WEBHOOK_URL !== 'PLACEHOLDER') {
        await fetch(TEAMS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'message',
            attachments: [{
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: {
                type: 'AdaptiveCard', version: '1.4',
                body: [{ type: 'TextBlock', wrap: true, size: 'Medium',
                  text: `🎉 Site provisioned: **${businessName}** — https://${resolvedSlug}.pestflowpro.com` }],
              },
            }],
          }),
        })
      }
    } catch { /* non-fatal */ }

    const liveUrl = `https://${resolvedSlug}.pestflowpro.com`
    return new Response(JSON.stringify({ success: true, tenant_id: tenantId, slug: resolvedSlug, url: liveUrl }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err: any) {
    console.error('provision-tenant error:', err?.message)
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
