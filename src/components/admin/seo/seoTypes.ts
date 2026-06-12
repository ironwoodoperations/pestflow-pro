export type SeoTabId = 'overview' | 'pages' | 'keywords' | 'aio' | 'connect'

export type FindingSeverity = 'high' | 'medium' | 'low'

// S263 — the closed set of columns a one-click apply can target.
export type FixField = 'intro' | 'meta_title' | 'meta_description' | 'focus_keyword'

// Session A — a single open monthly-report finding scoped to a page, carrying the
// plain-English `problem` text so the inline editor can surface what was flagged.
// S263 — extended with the fields the Fix-Chain needs: the finding id, its target
// field, any cached suggested_fix, and whether it is one-click applyable.
export interface PageFinding {
  id: string
  severity: FindingSeverity
  problem: string
  category: string
  fixField: FixField | null
  suggestedFix: string | null
  // page-scoped AND has a mapped target field → eligible for Generate/Apply.
  applyable: boolean
}

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
  // S260-3 — open (unresolved) monthly-report findings scoped to this page's slug.
  // Site-wide findings (page_slug null) are excluded upstream, so these are
  // always page-scoped. Absent when the page has no open findings.
  needsUpdate?: boolean
  findingCount?: number
  findingSeverity?: FindingSeverity
  // Session A — the open findings' plain-English text (high→low), for inline display
  // in the editor. Reuses the same rows the badge counts; absent when none are open.
  findings?: PageFinding[]
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
