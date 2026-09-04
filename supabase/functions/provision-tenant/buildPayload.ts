// provision-tenant's PAYLOAD BUILDER — pure, and deliberately separate from
// index.ts (S340).
//
// index.ts imports from https://esm.sh, which Node's ESM loader rejects, so
// vitest CANNOT load it — vitest.config.ts excludes
// `supabase/functions/*/index.test.ts` for exactly that reason. Everything that
// DECIDES what gets provisioned therefore lives here, where it can be executed
// in CI. index.ts is auth, I/O and one RPC call around this function.
//
// ═══ WHAT THIS FILE DOES NOT DO ═══
//
// It does not write anything, and it does not merge against existing rows.
// public.provision_tenant_atomic owns the writes, and merge_setting_value (S336)
// owns the settings merge DB-side — so this builder emits the values it WANTS
// and the database decides how they land on top of what is already there. That
// is why mergeSettingsRead / dropEmptyOverwrites / mergeBusinessInfo are gone
// from the edge: a second copy of the merge rule is the drift S336 removed.
//
// THE RPC GENERATES NOTHING (gate answer C2 — projecting the service catalog
// into Postgres was rejected). Every seed row it inserts is built here.

import {
  buildPageContentRows,
  buildPageSeoMeta,
  buildSeoSettings,
  buildServiceAreaHeroTitle,
  buildServiceAreaSeo,
  validateVertical,
} from '../_shared/provisioningSeed.ts'
import { generateAuthorityPrompts } from '../_shared/authorityPrompts.ts'
import { normalizeAll } from '../_shared/service-areas.ts'
import { catalogSlugsFor } from '../../../shared/lib/serviceCatalog.ts'

/** The contract version provision_tenant_atomic accepts. It rejects any other. */
export const PAYLOAD_VERSION = '1'

/**
 * Service-area caps by entitlement. NULL = unlimited (Elite).
 *
 * Checked here so the operator gets "7 cities selected, Growth allows 5" instead
 * of a constraint name. The RPC checks it again and trg_enforce_location_cap is
 * the final backstop — three layers, and this one exists purely for the message.
 */
export const ENTITLEMENT_CAP: Readonly<Record<number, number | null>> =
  Object.freeze({ 1: 3, 2: 5, 3: 10, 4: null })

/** Plan labels, for the cap message only. Tier mapping per CLAUDE.md. */
export const ENTITLEMENT_LABEL: Readonly<Record<number, string>> =
  Object.freeze({ 1: 'Starter', 2: 'Growth', 3: 'Pro', 4: 'Elite' })

export function capForEntitlement(entitlement: number): number | null {
  return Object.prototype.hasOwnProperty.call(ENTITLEMENT_CAP, entitlement)
    ? ENTITLEMENT_CAP[entitlement]
    : null
}

// ── payload shape ───────────────────────────────────────────────────────────

export interface PageContentRow {
  page_slug: string
  title: string
  subtitle: string
  intro: string
  hero_headline: string
}
export interface SeoMetaRow {
  page_slug: string
  meta_title: string
  meta_description: string
  focus_keyword: string
}
export interface ServiceAreaRow {
  city: string
  slug: string
  state: string
  hero_title: string
  meta_title: string
  meta_description: string
  focus_keyword: string
}
export interface BlogPostRow {
  title: string
  slug: string
  excerpt: string
  content: string
  published_at: string
}

export interface ProvisionPayload {
  payload_version: string
  mode: 'create' | 'reprovision'
  slug: string
  tenant_id: string | null
  auth_user_id: string
  entitlement: number
  vertical: string | null
  /** Top-level, and NOT the same as settings.business_info: the RPC reads
   *  `p_payload#>>'{business_info,name}'` for tenants.name. Omitting it silently
   *  names the tenant after its slug. */
  business_info: { name: string }
  services: string[]
  settings: Record<string, unknown>
  page_content: PageContentRow[]
  seo_meta: SeoMetaRow[]
  service_areas: ServiceAreaRow[]
  authority_prompts: string[]
  blog_posts: BlogPostRow[]
  prospect_id: string | null
  onboarding_session_id: string | null
  queue_zernio: boolean
  queue_outscraper: boolean
}

export interface BuildFailure {
  ok: false
  status: number
  code: string
  error: string
}
export interface BuildSuccess {
  ok: true
  payload: ProvisionPayload
  /** CRM service-area tokens normalizeAll refused, with its reason
   *  ('empty' | 'numeric' | 'too_long'). Surfaced by index.ts in the response so
   *  a dropped city is visible, not just logged. */
  rejectedAreaTokens: Array<{ raw: string; reason: string }>
}
export type BuildResult = BuildSuccess | BuildFailure

// ── inputs: everything index.ts has already fetched ─────────────────────────

export interface LegalTemplate { page_slug: string; title: string; intro: string }

export interface BuildPayloadInput {
  mode: 'create' | 'reprovision'
  slug: string
  tenantId: string | null
  authUserId: string
  entitlement: number
  /** Already validated by validateVertical in index.ts; re-checked here. */
  vertical: string | null
  /** onboarding_sessions.wizard_data sub-objects, or {} when absent. */
  wizard: {
    business_info?: Record<string, any>
    branding?: Record<string, any>
    customization?: Record<string, any>
    social_links?: Record<string, any>
    subscription?: Record<string, any>
  }
  /** Direct body fields — the legacy/manual path. */
  body: {
    business_info?: Record<string, any>
    branding?: Record<string, any>
    customization?: Record<string, any>
    social_links?: Record<string, any>
    integrations?: Record<string, any>
    subscription?: Record<string, any>
    plan?: string
    social_facebook?: string
    social_instagram?: string
    social_google?: string
    social_youtube?: string
  }
  adminEmail: string
  resolvedTimezone: string
  /** prospects.intake_data */
  intake: Record<string, any> | null
  /** prospects.scraped_content */
  scrapedContent: Record<string, { title?: string; subtitle?: string; intro?: string }> | null
  /** prospects.service_areas, verbatim. */
  rawServiceAreas: string | null
  /** page_content rows read from the demo tenant, for the legal seed. */
  legalTemplates: LegalTemplate[]
  prospectId: string | null
  onboardingSessionId: string | null
  /** Demo and operator tenants get no AI Authority prompts. Resolved by
   *  index.ts, which can read settings.demo_mode and operator_tenant_id(). */
  skipAuthorityPrompts?: boolean
  queueZernio: boolean
  queueOutscraper: boolean
  /** Injected so blog timestamps are deterministic under test. */
  now?: Date
}

// ── validation ──────────────────────────────────────────────────────────────

/**
 * Every requested slug must be in the canonical shared/lib catalog.
 *
 * NOTE, and this is a real gap rather than a formality: NOTHING IN THE DATABASE
 * ENFORCES THIS. tenant_services carries only a slug-SHAPE check
 * (`^[a-z0-9]+(-[a-z0-9]+)*$`) and provision_tenant_atomic checks shape and
 * duplicates — neither knows the catalog. This edge check is therefore the ONLY
 * thing standing between a typo and a tenant_services row for a service that
 * has no page, no title and no admin entry. Verified against the live schema.
 */
export function validateServiceSlugs(
  vertical: string | null,
  services: readonly string[],
): BuildFailure | null {
  if (services.length === 0) return null
  const allowed = new Set(catalogSlugsFor(vertical))
  const unknown = services.filter((s) => !allowed.has(s))
  if (unknown.length > 0) {
    return {
      ok: false, status: 400, code: 'service_not_in_catalog',
      error: `Unknown service slug(s) for vertical '${vertical ?? 'none'}': ${unknown.join(', ')}. `
        + `The canonical catalog is shared/lib/serviceCatalog.ts.`,
    }
  }
  return null
}

/** "7 cities selected, Growth allows 5" — a readable 400, not a constraint name. */
export function validateServiceAreaCap(
  entitlement: number,
  requested: number,
): BuildFailure | null {
  const cap = capForEntitlement(entitlement)
  if (cap === null || requested <= cap) return null
  const label = ENTITLEMENT_LABEL[entitlement] ?? `entitlement ${entitlement}`
  return {
    ok: false, status: 400, code: 'service_area_cap_exceeded',
    error: `${requested} cities selected, ${label} allows ${cap}`,
  }
}

// ── the builder ─────────────────────────────────────────────────────────────

const TIER_PRICES: Record<string, number> = { starter: 149, growth: 249, pro: 349, elite: 499 }

function tierStrFor(entitlement: number): string {
  return entitlement === 4 ? 'elite' : entitlement === 3 ? 'pro' : entitlement === 2 ? 'growth' : 'starter'
}

/** Non-empty trimmed string, else ''. Mirrors the old `a || b || ''` chains. */
const s = (...vals: unknown[]): string => {
  for (const v of vals) {
    if (typeof v === 'number') return String(v)
    if (typeof v === 'string' && v.trim() !== '') return v
  }
  return ''
}

export function buildProvisionPayload(input: BuildPayloadInput): BuildResult {
  const wbi = input.wizard.business_info ?? {}
  const wbr = input.wizard.branding ?? {}
  const wcu = input.wizard.customization ?? {}
  const wsl = input.wizard.social_links ?? {}
  const wsub = input.wizard.subscription ?? {}
  const bi = input.body.business_info ?? {}
  const intake = input.intake ?? {}
  const ib = (intake.business ?? {}) as Record<string, any>
  const ibr = (intake.branding ?? {}) as Record<string, any>

  // ── vertical ──────────────────────────────────────────────────────────────
  const vCheck = validateVertical(input.vertical)
  if (vCheck.error) {
    return { ok: false, status: 400, code: 'vertical_invalid', error: vCheck.error }
  }
  const vertical = vCheck.vertical

  if (input.entitlement < 1 || input.entitlement > 4 || !Number.isInteger(input.entitlement)) {
    return {
      ok: false, status: 400, code: 'entitlement_invalid',
      error: `entitlement must be an integer 1..4, got ${input.entitlement}`,
    }
  }

  // ── the service selection ─────────────────────────────────────────────────
  // Provisioning has no per-service picker: a recorded vertical means the whole
  // catalog for that trade, which is exactly the set buildPageContentRows seeds
  // pages for. Read from the canonical module, never restated.
  const services = [...catalogSlugsFor(vertical)]

  // NOTE, honestly: this list is DERIVED from the catalog one line above, so
  // today the check below cannot fire. It is not theatre and it is not a claim
  // that untrusted input is being filtered — it is the guard for the moment
  // `services` becomes caller-supplied (a per-service picker is the obvious next
  // step), and validateServiceSlugs is unit-tested directly against slugs that
  // DO violate it. Nothing in the database enforces catalog membership, so when
  // that day comes this is the only check there is.
  const slugErr = validateServiceSlugs(vertical, services)
  if (slugErr) return slugErr

  // The RPC rejects a recorded vertical with an empty selection. Catch it here
  // with a message that names the cause.
  if (vertical && services.length === 0) {
    return {
      ok: false, status: 400, code: 'vertical_has_no_services',
      error: `vertical '${vertical}' has no services in the canonical catalog`,
    }
  }

  // ── identity / naming ─────────────────────────────────────────────────────
  const businessName = s(ib.business_name, wbi.name, bi.name, input.slug)
  const heroHeadline = s(wcu.hero_headline, input.body.customization?.hero_headline, businessName)
  const city = s(ib.city)
  const state = s(ib.state)
  const email = s(ib.email, wbi.email, bi.email)
  const phone = s(ib.phone, wbi.phone, bi.phone)

  // ── service areas, and the cap ────────────────────────────────────────────
  //
  // THE ZIP-PREFIX DRAFT CITIES ARE GONE (owner decision). They guessed up to
  // seven cities from three digits of a postal code and asserted service areas
  // the client never confirmed — for one prospect that produced 11 cities
  // against a cap of 10, and the resulting RAISE was swallowed by the broad
  // 'intake seeding failed (non-fatal)' catch, silently skipping the seo
  // projection, the prompts, the prospect stage AND the four legal pages.
  // Only cities the CRM actually recorded are seeded now.
  const { accepted: areas, rejected: rejectedAreaTokens } = normalizeAll(input.rawServiceAreas)

  const capErr = validateServiceAreaCap(input.entitlement, areas.length)
  if (capErr) return capErr

  const service_areas: ServiceAreaRow[] = areas.map((a) => {
    const seo = buildServiceAreaSeo(vertical, a.city, a.state, businessName)
    return {
      city: a.city,
      slug: a.slug,
      state: a.state,
      hero_title: buildServiceAreaHeroTitle(vertical, a.city),
      meta_title: seo.meta_title,
      meta_description: seo.meta_description,
      focus_keyword: seo.focus_keyword,
    }
  })

  // ── page_content ──────────────────────────────────────────────────────────
  // The RPC inserts page_content MISSING-ONLY, so the scraped overlay has to be
  // folded in HERE. As two rows for the same slug it would simply be dropped.
  const scraped = input.scrapedContent ?? {}
  const page_content: PageContentRow[] = buildPageContentRows({
    vertical, businessName, heroHeadline,
  }).map((row) => {
    const sc = scraped[row.page_slug]
    if (!sc || (!sc.title && !sc.intro)) return row
    return {
      ...row,
      title: s(sc.title, row.title),
      subtitle: s(sc.subtitle, row.subtitle),
      intro: s(sc.intro, row.intro),
    }
  })

  // Legal pages, templated from the demo tenant's rows.
  //
  // S317 — the needles below are SEARCH PATTERNS, not copy. The template rows
  // literally contain "PestFlow Pro", the .com address and the old phone number;
  // swapping a needle for PLATFORM_NAME stops it matching and every newly
  // provisioned tenant silently keeps the demo text.
  const legalName = businessName || 'Your Business'
  const legalDomain = `${input.slug}.pestflowpro.com`
  const legalEmail = email || `info@${legalDomain}`
  const phoneDigits = phone.replace(/\D/g, '')
  const legalPhone = phoneDigits.length === 10
    ? `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`
    : phone
  for (const t of input.legalTemplates) {
    page_content.push({
      page_slug: t.page_slug,
      title: t.title,
      subtitle: '',
      intro: (t.intro ?? '')
        .replaceAll('PestFlow Pro, LLC', `${legalName}, LLC`)
        .replaceAll('PESTFLOW PRO, LLC', `${legalName.toUpperCase()}, LLC`)
        .replaceAll('PestFlow Pro', legalName)
        .replaceAll('PESTFLOW PRO', legalName.toUpperCase())
        .replaceAll('sales@pestflowpro.com', legalEmail)
        .replaceAll('https://pestflowpro.com/', `https://${legalDomain}/`)
        .replaceAll('https://pestflowpro.com', `https://${legalDomain}`)
        .replaceAll('pestflowpro.com', legalDomain)
        .replaceAll('(430) 367-5601', legalPhone),
      hero_headline: t.title,
    })
  }

  // ── seo_meta ──────────────────────────────────────────────────────────────
  //
  // SCOPE IS NARROW ON PURPOSE. seo_meta spans four URL classes: seeded pages,
  // service-area pages, blog posts, and platform routes with no page_content row
  // at all (verified live: 256 rows, 136 of them with no page_content). Only the
  // first two are URLs provisioning itself creates, so only those are seeded.
  // No meta is invented for /pricing, /reviews or blog.
  //
  // buildPageSeoMeta covers home, about, the service pages, contact and quote —
  // it has no entry for faq, and none is invented here. focus_keyword is left
  // empty for these: the generator produces one per AREA, not per page, and a
  // guessed keyword is the kind of assertion this seed exists to avoid.
  const pageSeo = buildPageSeoMeta({ vertical, businessName, city, state, phone })
  const seo_meta: SeoMetaRow[] = Object.keys(pageSeo).map((page_slug) => ({
    page_slug,
    meta_title: pageSeo[page_slug].meta_title,
    meta_description: pageSeo[page_slug].meta_description,
    focus_keyword: '',
  }))
  for (const a of service_areas) {
    seo_meta.push({
      page_slug: a.slug,
      meta_title: a.meta_title,
      meta_description: a.meta_description,
      focus_keyword: a.focus_keyword,
    })
  }

  // ── authority prompts ─────────────────────────────────────────────────────
  // Demo and operator tenants get NONE — index.ts resolves that gate, since it
  // needs settings.demo_mode and operator_tenant_id(). Live areas only, and now
  // trivially so: the draft cities that motivated the old is_live filter are
  // gone with the zip-prefix map.
  const authority_prompts = input.skipAuthorityPrompts
    ? []
    : generateAuthorityPrompts({
      businessName,
      city, state,
      serviceAreas: service_areas.map((a) => ({ city: a.city, state: a.state })),
      serviceSlugs: services,
    })

  // ── blog posts: PEST ONLY, and that is the honest state ───────────────────
  // These are authored articles, not labels. "Top 5 Signs You Have a Pest
  // Problem" under a pool company's byline is the same defect as pest page
  // titles. Any other vertical gets an empty blog rather than someone else's.
  const now = input.now ?? new Date()
  const blog_posts: BlogPostRow[] = vertical === 'pest'
    ? [
      { title: 'Top 5 Signs You Have a Pest Problem', slug: 'top-5-signs-pest-problem',
        excerpt: 'Early detection is the key to stopping a pest problem before it becomes a full infestation.',
        content: '<p>Early detection is the key to stopping a pest problem before it becomes a full infestation. Here are the top signs to watch for in your home...</p>',
        published_at: now.toISOString() },
      { title: 'How to Prevent Pests This Season', slug: 'seasonal-pest-prevention-tips',
        excerpt: 'Seasonal changes bring new pest activity. These simple steps can keep your home protected year-round.',
        content: '<p>Every season brings different pest pressures. Here\'s how to stay ahead of them with simple preventive measures around your home...</p>',
        published_at: new Date(now.getTime() - 7 * 86400000).toISOString() },
      { title: 'Why Professional Pest Control Beats DIY', slug: 'professional-vs-diy-pest-control',
        excerpt: 'DIY products can reduce pest activity temporarily — but rarely eliminate the root cause.',
        content: '<p>Store-bought sprays and traps can temporarily reduce pest activity, but they rarely eliminate the root cause. Professional pest control delivers better, longer-lasting results...</p>',
        published_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
    ]
    : []

  // ── settings ──────────────────────────────────────────────────────────────
  const tierStr = tierStrFor(input.entitlement)
  const addrParts = [wbi.street_address, wbi.address_locality, wbi.address_region, wbi.postal_code]
  const addrFilled = addrParts.filter((v: unknown) => v && String(v).trim()).length
  const bizAddrKeys = addrFilled === 4
    ? {
      street_address: wbi.street_address, address_locality: wbi.address_locality,
      address_region: wbi.address_region, postal_code: wbi.postal_code,
    }
    : {}
  const bizGeoKeys = (typeof wbi.latitude === 'number' && typeof wbi.longitude === 'number')
    ? { latitude: wbi.latitude, longitude: wbi.longitude }
    : {}
  const bizHoursKeys: Record<string, unknown> =
    (Array.isArray(wbi.hours_structured) && wbi.hours_structured.length > 0)
      ? { hours_structured: wbi.hours_structured, timezone: input.resolvedTimezone }
      : { timezone: input.resolvedTimezone }

  const fullAddress = [ib.address, city, state, ib.zip].filter(Boolean).join(', ')
  const seoSeed = buildSeoSettings({
    vertical, businessName, city, state, tagline: s(ib.tagline),
  })

  const settings: Record<string, unknown> = {
    business_info: {
      name: businessName,
      phone,
      email,
      address: s(fullAddress, wbi.address, bi.address),
      hours: s(ib.hours, wbi.hours),
      tagline: s(ib.tagline, wbi.tagline, bi.tagline),
      industry: s(wbi.industry),
      ...(vertical ? { vertical } : {}),
      license: s(ib.license_number, wbi.license),
      certifications: s(wbi.certifications),
      founded_year: s(ib.founded_year, wbi.founded_year, wbi.year_founded),
      num_technicians: s(ib.num_technicians, wbi.num_technicians),
      owner_name: s(ib.owner_name, wbi.owner_name, bi.owner_name),
      after_hours_phone: s(wbi.after_hours_phone),
      ...bizAddrKeys,
      ...(wbi.address_country ? { address_country: wbi.address_country } : {}),
      ...bizGeoKeys,
      ...(wbi.geocode_source ? { geocode_source: wbi.geocode_source } : {}),
      ...bizHoursKeys,
    },
    branding: {
      logo_url: s(ibr.logo_url, wbr.logo_url, input.body.branding?.logo_url),
      favicon_url: s(wbr.favicon_url, input.body.branding?.favicon_url),
      primary_color: s(ibr.primary_color, wbr.primary_color, input.body.branding?.primary_color, '#E87800'),
      accent_color: s(ibr.accent_color, wbr.accent_color, input.body.branding?.accent_color, '#1a1a1a'),
      theme: s(ibr.template, wbr.template, input.body.branding?.template, 'modern-pro'),
      cta_text: s(ibr.cta_text, wbr.cta_text, input.body.branding?.cta_text, 'Get a Free Quote'),
    },
    customization: {
      hero_headline: wcu.hero_headline ?? input.body.customization?.hero_headline
        ?? s(wbi.tagline, bi.tagline),
      show_license: wcu.show_license ?? input.body.customization?.show_license ?? true,
      show_years: wcu.show_years ?? input.body.customization?.show_years ?? true,
      show_technicians: wcu.show_technicians ?? input.body.customization?.show_technicians ?? true,
      show_certifications: wcu.show_certifications ?? input.body.customization?.show_certifications ?? true,
    },
    social_links: {
      facebook: s(wsl.facebook, input.body.social_links?.facebook, input.body.social_facebook),
      instagram: s(wsl.instagram, input.body.social_links?.instagram, input.body.social_instagram),
      google: s(wsl.google, input.body.social_links?.google, input.body.social_google),
      youtube: s(wsl.youtube, input.body.social_links?.youtube, input.body.social_youtube),
    },
    // S255 — facebook_access_token and textbelt_api_key are Vault secrets and are
    // NOT seeded as empty placeholders here.
    integrations: {
      google_place_id: s(input.body.integrations?.google_place_id),
      google_analytics_id: s(input.body.integrations?.ga4_id),
      google_maps_api_key: '',
      owner_sms_number: phone.replace(/\D/g, ''),
      facebook_page_id: '',
    },
    onboarding_complete: { complete: false },
    hero_media: {
      master_hero_image_url: '', image_url: '', mode: 'image',
      url: '', thumbnail_url: '', video_url: '', youtube_id: '',
    },
    holiday_mode: { enabled: false, holiday: '', message: '', auto_schedule: '' },
    notifications: { cc_email: '', lead_email: s(input.adminEmail, email) },
    demo_mode: { active: false, seeded_at: '' },
    subscription: {
      tier: tierStr,
      plan: tierStr,
      plan_name: tierStr.charAt(0).toUpperCase() + tierStr.slice(1),
      monthly_price: (typeof wsub.monthly_price === 'number' ? wsub.monthly_price : null)
        ?? (typeof input.body.subscription?.monthly_price === 'number' ? input.body.subscription.monthly_price : null)
        ?? TIER_PRICES[tierStr] ?? 149,
      status: 'active',
    },
    // service_areas is deliberately ABSENT: the RPC projects it from the rows it
    // actually persisted, never from the payload.
    seo: {
      meta_description: seoSeed.meta_description,
      focus_keyword: seoSeed.focus_keyword,
    },
  }

  return {
    ok: true,
    payload: {
      payload_version: PAYLOAD_VERSION,
      mode: input.mode,
      slug: input.slug,
      tenant_id: input.tenantId,
      auth_user_id: input.authUserId,
      entitlement: input.entitlement,
      vertical,
      business_info: { name: businessName },
      services,
      settings,
      page_content,
      seo_meta,
      service_areas,
      authority_prompts,
      blog_posts,
      prospect_id: input.prospectId,
      onboarding_session_id: input.onboardingSessionId,
      queue_zernio: input.queueZernio,
      queue_outscraper: input.queueOutscraper,
    },
    rejectedAreaTokens,
  }
}
