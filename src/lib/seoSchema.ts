// JSON-LD schema generation library for PestFlow Pro tenant sites
// All functions are pure — they take settings objects, return schema-ready objects

export interface BusinessInfo {
  name: string
  phone: string
  email: string
  address: string
  city?: string
  state?: string
  zip?: string
  hours?: string
  license_number?: string
  license?: string
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

export function generateLocalBusinessSchema(
  business: BusinessInfo,
  seo: SeoSettings,
  schema: SchemaConfig,
  social: SocialLinks,
  siteUrl: string
): object {
  const sameAs = [
    social.facebook,
    social.google_business || social.google,
    social.instagram,
  ].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'PestControlService'],
    name: business.name,
    telephone: business.phone,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.city || '',
      addressRegion: business.state || '',
      postalCode: business.zip || '',
      addressCountry: 'US',
    },
    url: siteUrl,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    areaServed: seo.service_areas.map(area => ({
      '@type': 'City',
      name: area,
    })),
    hasCredential: seo.certifications.map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: cert,
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: schema.aggregate_rating.value,
      reviewCount: schema.aggregate_rating.count,
      bestRating: '5',
    },
    openingHours: business.hours || 'Mo-Fr 08:00-17:00',
    priceRange: '$$',
    ...(seo.founded_year ? { foundingDate: seo.founded_year } : {}),
    knowsAbout: [
      'Pest Control',
      'Termite Treatment',
      'Mosquito Control',
      'Rodent Control',
      'Bed Bug Treatment',
      'Ant Control',
    ],
  }
}

export function generateServiceSchema(
  business: BusinessInfo,
  serviceName: string,
  serviceDescription: string,
  serviceUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: serviceDescription,
    url: serviceUrl,
    provider: {
      '@type': 'LocalBusiness',
      name: business.name,
      telephone: business.phone,
    },
    areaServed: {
      '@type': 'State',
      name: business.state || 'TX',
    },
    serviceType: 'Pest Control',
  }
}

export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateBreadcrumbSchema(
  siteUrl: string,
  crumbs: Array<{ name: string; url: string }>
): object {
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

export function generateWebsiteSchema(
  businessName: string,
  siteUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: businessName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateRatingSchema(
  businessName: string,
  rating: number,
  reviewCount: number
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessName,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
      bestRating: '5',
    },
  }
}

export function generateAboutSchema(
  business: BusinessInfo,
  seo: SeoSettings,
  siteUrl: string
): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${business.name}`,
    url: `${siteUrl}/about`,
    description: seo.meta_description || `Learn about ${business.name}`,
    isPartOf: {
      '@type': 'WebSite',
      name: business.name,
      url: siteUrl,
    },
  }

  if (seo.owner_name) {
    schema.author = {
      '@type': 'Person',
      name: seo.owner_name,
      worksFor: {
        '@type': 'LocalBusiness',
        name: business.name,
      },
    }
  }

  return schema
}
