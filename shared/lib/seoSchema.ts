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
}

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
  // lawn, pool, hvac, roof, trailer: registered keys, no vocabulary yet.
  // Deliberately absent — add one before provisioning a tenant in that vertical.
})

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
  vocabulary: SchemaVocabulary = PEST_CONTROL_VOCABULARY
): object {
  const sameAs = [social.facebook, social.google_business || social.google, social.instagram].filter(Boolean)

  const result: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@id': `${siteUrl}/#organization`,
    '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
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
    knowsAbout: vocabulary.knowsAbout,
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
  vocabulary: SchemaVocabulary = PEST_CONTROL_VOCABULARY
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: serviceDescription,
    url: serviceUrl,
    provider: { '@id': `${siteUrl}/#organization` },
    serviceType: vocabulary.serviceType,
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
