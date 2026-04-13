export interface RevealReportData {
  // Business
  businessName: string
  slug: string
  primaryColor: string
  accentColor: string
  tier: string
  generatedAt: string

  // SEO
  seoScore: number
  schemaTypes: string[]
  cityPages: string[]
  serviceAreas: string[]
  sitemapUrl: string
  hasFaqSchema: boolean
  hasAggregateRating: boolean
  aggregateRating?: { score: number; count: number }

  // Technical
  redirectCount: number
  hasCanonical: boolean
  hasOpenGraph: boolean
  hasSsl: boolean
  legalPagesInstalled: boolean
  googleSearchConsoleVerified: boolean

  // Owner
  ownerName?: string
  foundedYear?: number
  phone?: string
}
