// JSON-LD schema generation library for PestFlow Pro tenant sites.
// Pure functions: take settings objects, return schema-ready objects.
import type { Vertical } from './verticals'
import { parseHours, parseAddress } from './seoSchema.parsers'
export type { OpeningHoursSpecification, PostalAddressComponents } from './seoSchema.parsers'
export { parseHours, parseAddress }

export interface BusinessInfo {
  // Identity
  name: string
  phone: string
  email: string

  // Legacy address/hours (preserved through seo2.5; dropped in
  // post-S168.3 contract commit)
  address: string
  hours?: string

  // Structured address (NEW in seo2.5 — schema.org-canonical names)
  street_address?: string
  address_locality?: string
  address_region?: string
  postal_code?: string
  address_country?: string

  // Geolocation (NEW in seo2.5)
  latitude?: number
  longitude?: number
  geocode_source?: 'manual' | 'google_places'

  // Timezone (NEW in seo2.5; app-only, NOT emitted in JSON-LD)
  timezone?: string

  // Structured hours (NEW in seo2.5)
  hours_structured?: Array<{
    dayOfWeek: string
    opens: string
    closes: string
  }>

  // Licensing
  license_number?: string
  license?: string

  // Branding
  logo_url?: string
}

export interface SeoSettings {
  meta_description: string
  service_areas: string[]
  certifications: string[]
  founded_year: string
  owner_name: string
}

export interface SchemaConfig {
  aggregate_rating: { value: number; count: number }
  service_radius_miles: number
}

export interface SocialLinks {
  facebook?: string
  google_business?: string
  google?: string
  instagram?: string
}

export interface BlogPostInput {
  title: string
  excerpt?: string | null
  slug: string
  published_at?: string | null
  author_name?: string | null
}

// Vertical vocabulary for JSON-LD (S-PLS-1). Callers that pass nothing get the
// historical pest-control values, so every existing tenant's emitted schema is
// byte-identical to the pre-parameterization output. Non-pest tenants pass a
// SchemaVocabulary resolved from their vertical.
export interface SchemaVocabulary {
  knowsAbout: readonly string[]
  serviceType: string
  /**
   * The @type array for LocalBusiness. Optional; defaults to the historical
   * ['LocalBusiness', 'HomeAndConstructionBusiness'] pair so every existing
   * tenant is byte-identical.
   *
   * It is a SLOT, not decoration. @type is a claim about what kind of business
   * this is, exactly as knowsAbout is a claim about what it does — and the two
   * must move together. Today both registered verticals genuinely are
   * home-and-construction trades. The moment a vertical that is NOT (medical
   * aesthetics is the live candidate — see vita-glow) gets a vocabulary, its
   * entry sets this and the type follows the trade instead of silently
   * asserting construction.
   */
  businessType?: readonly string[]
}

/** The @type used when a vocabulary does not override it. */
export const DEFAULT_BUSINESS_TYPE: readonly string[] = Object.freeze([
  'LocalBusiness', 'HomeAndConstructionBusiness',
])

/**
 * The @type for a tenant whose trade is NOT recorded.
 *
 * 'LocalBusiness' alone, deliberately. 'HomeAndConstructionBusiness' is a
 * SUBTYPE claim — asserting it for an unrecorded trade is the same class of
 * fabrication as emitting pest knowsAbout, and it is currently asserted in
 * production for a medical-aesthetics business. LocalBusiness is the documented
 * top type for this rich result and is true of every tenant on the platform.
 */
export const NEUTRAL_BUSINESS_TYPE: readonly string[] = Object.freeze(['LocalBusiness'])

// Frozen (S-PLS-2 hardening): generateLocalBusinessSchema emits a REFERENCE to
// knowsAbout, so without freeze any mutation of an emitted schema — or of this
// exported const by an importer — would corrupt the default for every later
// call process-wide. Freeze fails loudly in strict mode instead.
export const PEST_CONTROL_VOCABULARY: SchemaVocabulary = Object.freeze({
  knowsAbout: Object.freeze(['Pest Control', 'Termite Treatment', 'Mosquito Control', 'Rodent Control', 'Bed Bug Treatment', 'Ant Control']),
  serviceType: 'Pest Control',
})

// Irrigation vertical vocabulary (PR A). Frozen for the SAME reason
// PEST_CONTROL_VOCABULARY is: generateLocalBusinessSchema emits knowsAbout BY
// REFERENCE, so an unfrozen array can be mutated process-wide by any caller
// holding an emitted schema. Freeze fails loudly in strict mode instead.
export const IRRIGATION_VOCABULARY: SchemaVocabulary = Object.freeze({
  knowsAbout: Object.freeze([
    'Irrigation', 'Sprinkler System Installation', 'Sprinkler Repair',
    'Drainage Systems', 'French Drains', 'Pond and Lake Pump Systems',
    'Sod Installation', 'Grading',
  ]),
  serviceType: 'Irrigation',
})

// Lawn vertical vocabulary (S323 PR A). Frozen for the same reason the other
// two are: knowsAbout is emitted BY REFERENCE.
//
// EVERY TERM IS A SERVICE THE TRADE PERFORMS, not a claim about any tenant.
// knowsAbout is read by a search engine as "this is what this business does",
// so it stays at trade level exactly as the copy presets do — no licence, no
// region, no rating. The boundary services in the lawn catalog (irrigation
// repair, artificial turf, perimeter pest, mosquito and tick) are deliberately
// NOT listed: a vocabulary is emitted for every tenant in the vertical, and
// most lawn companies do not do them. A term here would assert them for all.
export const LAWN_VOCABULARY: SchemaVocabulary = Object.freeze({
  knowsAbout: Object.freeze([
    'Lawn Care', 'Lawn Fertilization', 'Weed Control', 'Lawn Aeration',
    'Overseeding', 'Turf Disease Control', 'Landscape Maintenance',
    'Tree and Shrub Pruning',
  ]),
  serviceType: 'Lawn Care',
})

// Vertical → vocabulary. Kept in this file, alongside the constants it returns:
// splitting the table from the resolver is how the two drift.
//
// Partial + throw, mirroring getVerticalCopy, NOT a Record defaulting to pest.
// Emitting pest knowsAbout for a pool company is the exact silent failure this
// architecture exists to prevent, and a default branch would guarantee it.
// This costs nothing in reachability: layout.tsx resolves copy and vocabulary
// in the same request, so an unregistered vertical already fails on copy.
const VOCABULARY_BY_VERTICAL: Partial<Record<Vertical, SchemaVocabulary>> = Object.freeze({
  pest: PEST_CONTROL_VOCABULARY,
  irrigation: IRRIGATION_VOCABULARY,
  lawn: LAWN_VOCABULARY,
  // pool, hvac, roof, trailer: registered keys, no vocabulary yet.
  // Deliberately absent — add one before provisioning a tenant in that vertical.
})

/**
 * Resolve a vocabulary from a RAW, possibly-absent vertical. NULL means
 * "trade not recorded", and null is a legitimate, expected answer.
 *
 * WHY THIS EXISTS, and why it does NOT call resolveVertical:
 *
 * resolveVertical ends `: 'pest'` — absent both keys, it returns pest, which is
 * the documented historical behaviour and correct for ROUTING (a pest tenant
 * provisioned before the key existed must still route). But for CLAIMS it is a
 * fabrication: layout.tsx calls getSchemaVocabulary(resolveVertical(tenant)),
 * so a tenant with vertical NULL gets PEST_CONTROL_VOCABULARY. That is live —
 * vita-glow.pestflowpro.ai, a medical-aesthetics business, emits
 * knowsAbout: Pest Control, Termite Treatment, Mosquito Control, Rodent
 * Control, Bed Bug Treatment, Ant Control. It is indexable; that tenant has no
 * noindex.
 *
 * The industry substring fallback is also deliberately not used here. It exists
 * so prose can rescue a tenant with no explicit key; for a schema claim, prose
 * is exactly the wrong evidence. Since S290 provisioning always records the
 * key, so the only tenants reaching null are the ones that genuinely have no
 * recorded trade — which is the case that must emit nothing.
 *
 * Unregistered-but-valid keys (pool, hvac, roof, trailer) also return
 * null rather than throwing, because a missing vocabulary must degrade to
 * "claim nothing" at render time, not take a live site down. getSchemaVocabulary
 * keeps throwing for callers that have already decided a trade is required.
 */
export function resolveSchemaVocabulary(
  vertical: string | null | undefined,
): SchemaVocabulary | null {
  if (typeof vertical !== 'string') return null
  const vocabulary = (VOCABULARY_BY_VERTICAL as Record<string, SchemaVocabulary | undefined>)[vertical]
  return vocabulary ?? null
}

export function getSchemaVocabulary(vertical: Vertical): SchemaVocabulary {
  const vocabulary = VOCABULARY_BY_VERTICAL[vertical]
  if (!vocabulary) {
    throw new Error(
      `[getSchemaVocabulary] no schema vocabulary registered for vertical "${vertical}". ` +
        `It is a registered key but has no vocabulary yet — add one in ` +
        `shared/lib/seoSchema.ts. Refusing to emit pest knowsAbout for it.`,
    )
  }
  return vocabulary
}

export function generateLocalBusinessSchema(
  business: BusinessInfo,
  seo: SeoSettings,
  _schema: SchemaConfig,
  social: SocialLinks,
  siteUrl: string,
  // NULL means "trade not recorded" — knowsAbout is omitted and @type narrows.
  // The DEFAULT stays pest so no-arg callers (the Vite SEOHead) are unchanged;
  // null must be passed deliberately, which is what resolveSchemaVocabulary
  // returns.
  vocabulary: SchemaVocabulary | null = PEST_CONTROL_VOCABULARY
): object {
  const sameAs = [social.facebook, social.google_business || social.google, social.instagram].filter(Boolean)

  const result: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@id': `${siteUrl}/#organization`,
    '@type': vocabulary
      ? (vocabulary.businessType ?? DEFAULT_BUSINESS_TYPE)
      : NEUTRAL_BUSINESS_TYPE,
    name: business.name,
    telephone: business.phone,
    email: business.email,
    url: siteUrl,
    ...(business.logo_url ? { image: business.logo_url, logo: business.logo_url } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    areaServed: (seo.service_areas ?? []).map(area => ({ '@type': 'City', name: area })),
    hasCredential: (seo.certifications ?? []).map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: cert,
    })),
    priceRange: '$$',
    ...(seo.founded_year ? { foundingDate: seo.founded_year } : {}),
    // OMITTED, not genericised, when the trade is unrecorded.
    //
    // Google's structured-data guidelines require markup to describe content
    // visible on the page and forbid marking up "irrelevant or misleading
    // content". knowsAbout is a claim of topical expertise; a generic stand-in
    // ("Home Services") would be a claim we cannot substantiate against any
    // visible page content, which is the schema equivalent of the fabricated
    // copy this arc has spent nine PRs removing. It is also not a Google rich-
    // result input for LocalBusiness — it is read by AI crawlers and knowledge
    // graphs — so omitting it costs no rich result and removes a false signal.
    ...(vocabulary ? { knowsAbout: vocabulary.knowsAbout } : {}),
  }

  // PostalAddress: structured keys preferred, legacy string as fallback.
  let postalAddress: Record<string, string> | null = null
  const hasStructuredAddress =
    !!business.street_address &&
    !!business.address_locality &&
    !!business.address_region &&
    !!business.postal_code

  if (hasStructuredAddress) {
    postalAddress = {
      '@type': 'PostalAddress',
      streetAddress: business.street_address!,
      addressLocality: business.address_locality!,
      addressRegion: business.address_region!,
      postalCode: business.postal_code!,
      addressCountry: business.address_country ?? 'US',
    }
  } else if (business.address) {
    const parsed = parseAddress(business.address)
    if (parsed) {
      postalAddress = {
        '@type': 'PostalAddress',
        streetAddress: parsed.streetAddress,
        addressLocality: parsed.addressLocality,
        addressRegion: parsed.addressRegion,
        postalCode: parsed.postalCode,
        addressCountry: 'US',
      }
    }
  }
  if (postalAddress) {
    result.address = postalAddress
  }

  // GeoCoordinates: emit only when both lat AND lng are finite numbers.
  if (
    typeof business.latitude === 'number' &&
    typeof business.longitude === 'number' &&
    Number.isFinite(business.latitude) &&
    Number.isFinite(business.longitude)
  ) {
    result.geo = {
      '@type': 'GeoCoordinates',
      latitude: business.latitude,
      longitude: business.longitude,
    }
  }

  // openingHoursSpecification: structured array preferred, parseHours fallback.
  // Canonicalize to Google LocalBusiness docs form: dayOfWeek as full
  // schema.org URI, opens/closes as HH:MM:SS.
  type RawOhs = { dayOfWeek: string[]; opens: string; closes: string }
  let rawOhs: RawOhs[] | null = null

  if (Array.isArray(business.hours_structured) && business.hours_structured.length > 0) {
    rawOhs = business.hours_structured.map(h => ({
      dayOfWeek: [h.dayOfWeek], // wrap single-string into array to match OHS type
      opens: h.opens,
      closes: h.closes,
    }))
  } else if (business.hours) {
    const parsed = parseHours(business.hours)
    if (parsed && parsed.length > 0) {
      rawOhs = parsed.map(o => ({
        dayOfWeek: o.dayOfWeek, // already string[] from parseHours
        opens: o.opens,
        closes: o.closes,
      }))
    }
  }

  if (rawOhs && rawOhs.length > 0) {
    const addUri = (d: string) => (d.startsWith('http') ? d : 'https://schema.org/' + d)
    const addSeconds = (t: string) => (t.length === 5 ? t + ':00' : t)
    result.openingHoursSpecification = rawOhs.map(h => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dayOfWeek.map(addUri),
      opens: addSeconds(h.opens),
      closes: addSeconds(h.closes),
    }))
  }

  return result
}

export function generateServiceSchema(
  serviceName: string,
  serviceDescription: string,
  serviceUrl: string,
  siteUrl: string,
  vocabulary: SchemaVocabulary | null = PEST_CONTROL_VOCABULARY
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: serviceDescription,
    url: serviceUrl,
    provider: { '@id': `${siteUrl}/#organization` },
    // Same rule as knowsAbout: serviceType names a trade, so an unrecorded
    // trade emits no serviceType rather than a guessed one. The Service node
    // still carries name, description and provider, all of which come from the
    // tenant's own page.
    ...(vocabulary ? { serviceType: vocabulary.serviceType } : {}),
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

export function generateBreadcrumbSchema(siteUrl: string, crumbs: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${siteUrl}${crumb.url}`,
    })),
  }
}

export function generateWebsiteSchema(businessName: string, siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: businessName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateRatingSchema(businessName: string, rating: number, reviewCount: number): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessName,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: rating, reviewCount, bestRating: '5' },
  }
}

export function generateAboutSchema(business: BusinessInfo, seo: SeoSettings, siteUrl: string): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${business.name}`,
    url: `${siteUrl}/about`,
    description: seo.meta_description || `Learn about ${business.name}`,
    isPartOf: { '@type': 'WebSite', name: business.name, url: siteUrl },
  }
  if (seo.owner_name) {
    schema.author = {
      '@type': 'Person',
      name: seo.owner_name,
      worksFor: { '@id': `${siteUrl}/#organization` },
    }
  }
  return schema
}

export function generateBlogPostingSchema(post: BlogPostInput, siteUrl: string): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    url: `${siteUrl}/blog/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/blog/${post.slug}` },
    publisher: { '@id': `${siteUrl}/#organization` },
  }
  if (post.excerpt) schema.description = post.excerpt
  if (post.published_at) schema.datePublished = post.published_at
  if (post.author_name) schema.author = { '@type': 'Person', name: post.author_name }
  return schema
}
