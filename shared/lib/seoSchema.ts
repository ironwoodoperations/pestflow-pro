// JSON-LD schema generation library for PestFlow Pro tenant sites.
// Pure functions: take settings objects, return schema-ready objects.
import { parseHours, parseAddress } from './seoSchema.parsers'
export type { OpeningHoursSpecification, PostalAddressComponents } from './seoSchema.parsers'
export { parseHours, parseAddress }

export interface BusinessInfo {
  name: string
  phone: string
  email: string
  address: string
  hours?: string
  license_number?: string
  license?: string
  city?: string
  state?: string
  zip?: string
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

export function generateLocalBusinessSchema(
  business: BusinessInfo,
  seo: SeoSettings,
  _schema: SchemaConfig,
  social: SocialLinks,
  siteUrl: string
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
    ...(sameAs.length > 0 ? { sameAs } : {}),
    areaServed: (seo.service_areas ?? []).map(area => ({ '@type': 'City', name: area })),
    hasCredential: (seo.certifications ?? []).map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: cert,
    })),
    priceRange: '$$',
    ...(seo.founded_year ? { foundingDate: seo.founded_year } : {}),
    knowsAbout: ['Pest Control', 'Termite Treatment', 'Mosquito Control', 'Rodent Control', 'Bed Bug Treatment', 'Ant Control'],
  }

  const parsedAddress = parseAddress(business.address)
  if (parsedAddress) {
    result.address = { '@type': 'PostalAddress', ...parsedAddress, addressCountry: 'US' }
  }

  if (business.hours) {
    const spec = parseHours(business.hours)
    if (spec) result.openingHoursSpecification = spec
  }

  return result
}

export function generateServiceSchema(
  serviceName: string,
  serviceDescription: string,
  serviceUrl: string,
  siteUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: serviceDescription,
    url: serviceUrl,
    provider: { '@id': `${siteUrl}/#organization` },
    serviceType: 'Pest Control',
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
