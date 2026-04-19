export type SeoTabId = 'overview' | 'pages' | 'keywords' | 'aio' | 'connect'

export interface SeoPageRow {
  slug: string
  label: string
  url: string
  type: 'pest' | 'service_area' | 'blog' | 'static'
  isLive: boolean
  hasMeta: boolean
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  ogTitle: string
  ogDescription: string
  userEdited: boolean
}

export interface AuditScores {
  performance: number
  accessibility: number
  best_practices: number
  seo: number
}

export interface AuditOpportunity {
  title: string
  savings: string
}

export interface WebVitals {
  lcp: string | null
  tbt: string | null
  cls: string | null
}

export interface AuditResult {
  scores: AuditScores
  opportunities: AuditOpportunity[]
  webVitals: WebVitals
  url: string
  run_at: string
  strategy: 'mobile' | 'desktop'
}

export interface SeoStats {
  totalPages: number
  livePages: number
  seoConfigured: number
  issuesFound: number
}

export interface CoverageItem {
  total: number
  live: number
}

export interface SeoCoverage {
  pest: CoverageItem
  service_area: CoverageItem
  blog: CoverageItem
  static: CoverageItem
}

export interface IntegrationValues {
  google_api_key: string
  google_analytics_id: string
  google_search_console_url: string
}

export interface EditorForm {
  meta_title: string
  meta_description: string
  focus_keyword: string
  og_title: string
  og_description: string
}

export interface ConnectForm {
  google_search_console_url: string
  google_analytics_id: string
}
