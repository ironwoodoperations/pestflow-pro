export interface PageSpeedScores {
  performance: number
  seo: number
  accessibility: number
  bestPractices: number
}

export interface RevealReportData {
  // Business
  businessName: string
  slug: string
  primaryColor: string
  accentColor: string
  tier: string
  generatedAt: string

  // PageSpeed (live from Google API)
  desktop: PageSpeedScores | null
  mobile: PageSpeedScores | null
  oldSiteDesktop?: number
  oldSiteMobile?: number

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
