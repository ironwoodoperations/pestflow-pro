// S347 — decide which scraped paths are REAL pages.
//
// WHY THIS EXISTS. The first live run against a real prospect
// (gviewlawnandlandscape.com, a lawn company) wrote ten rows to the prospect,
// nine of which were the SAME page. provision-tenant overlays those rows onto
// page_content at create time, so the client would have been given service
// pages he never wrote. That is confident, plausible, WRONG content on a
// client's public website — the fabrication class the S283-S300 arc removed,
// arriving through a new door.
//
// THE ACTUAL MECHANISM, established by re-fetching that site rather than
// guessing at it:
//
//   GET /ant-control  ->  metadata.statusCode 404
//                         markdown "# 404\n\n## Page not found\n\n[Go home](/)"
//                         metadata.title "Grandview Lawn and Landscape Solutions — Austin, TX"
//
// It is a REAL 404, not a soft one. scrapeOne only checked `res.ok` on the
// FIRECRAWL API call — which succeeds, because Firecrawl successfully fetched a
// 404 — and never looked at the status of the page it fetched. The site sets a
// site-wide og:title, so extractPageContent lifted a plausible title off the
// error page, the intro came back empty, and `pc.title || pc.intro` let it
// through. Nine identical titles, empty intros. Exactly what was observed.
//
// So the primary signal is EXACT and cannot produce a false positive:
// metadata.statusCode. The homepage-duplicate check below is the secondary net
// for sites that genuinely serve HTTP 200 for unknown paths — the soft-404 this
// was originally reported as. Both are needed; neither subsumes the other.

export interface ScrapedPage {
  path: string
  markdown: string
  metadata: Record<string, unknown>
}

export type DiscardReason = 'http_error' | 'homepage_duplicate' | 'no_content'

export interface Discarded {
  path: string
  reason: DiscardReason
  /** For the operator-facing report: the status we saw, when we saw one. */
  statusCode?: number
}

/** The status of the PAGE Firecrawl fetched — not of the Firecrawl call. */
export function pageStatusCode(metadata: Record<string, unknown> | null | undefined): number | null {
  const raw = (metadata ?? {})['statusCode']
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

/**
 * True when the fetched page reported a non-2xx status.
 *
 * ABSENT status is NOT an error. Firecrawl does not always report one, and
 * treating "unknown" as failure would silently drop real pages — the one
 * outcome that costs the operator something they cannot get back.
 */
export function isHttpError(metadata: Record<string, unknown> | null | undefined): boolean {
  const code = pageStatusCode(metadata)
  if (code === null) return false
  return code < 200 || code >= 300
}

/**
 * Collapse markdown to comparable text: lowercased, whitespace-normalised,
 * with image/link URLs dropped. URLs are dropped because a template that
 * differs only by an absolute self-link is still the same page.
 */
export function normalizeContent(markdown: string): string {
  return (markdown || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Dice coefficient over word tokens. 1 = identical, 0 = disjoint. */
export function similarity(a: string, b: string): number {
  if (a === b) return 1
  const ta = a.split(' ').filter(Boolean)
  const tb = b.split(' ').filter(Boolean)
  if (ta.length === 0 && tb.length === 0) return 1
  if (ta.length === 0 || tb.length === 0) return 0
  const counts = new Map<string, number>()
  for (const t of ta) counts.set(t, (counts.get(t) ?? 0) + 1)
  let overlap = 0
  for (const t of tb) {
    const n = counts.get(t) ?? 0
    if (n > 0) { overlap++; counts.set(t, n - 1) }
  }
  return (2 * overlap) / (ta.length + tb.length)
}

/**
 * Discard threshold. DELIBERATELY LOW, per the standing instruction: discarding
 * a real page loses an input the operator can re-add by hand, while keeping a
 * fake one writes fiction to a client's public site. When uncertain, discard.
 */
export const HOMEPAGE_DUPLICATE_THRESHOLD = 0.9

/**
 * True when this path's content is indistinguishable from the homepage — the
 * classic soft-404, where an unknown path renders the home route with HTTP 200.
 */
export function isHomepageDuplicate(page: ScrapedPage, home: ScrapedPage): boolean {
  if (page.path === home.path) return false
  const a = normalizeContent(page.markdown)
  const b = normalizeContent(home.markdown)
  if (a.length === 0) return true
  return similarity(a, b) >= HOMEPAGE_DUPLICATE_THRESHOLD
}

/**
 * Split scraped results into the pages worth keeping and the ones that are not
 * pages at all.
 *
 * The homepage is resolved FIRST and is never discarded as a duplicate of
 * itself. If the homepage itself errored we cannot compare against it, so the
 * duplicate check is skipped and only the exact status check applies — a
 * missing baseline must not cause every page to be thrown away.
 */
export function partitionScrapedPages(
  pages: readonly ScrapedPage[],
  homePath = '/',
): { home: ScrapedPage | null; kept: ScrapedPage[]; discarded: Discarded[] } {
  const kept: ScrapedPage[] = []
  const discarded: Discarded[] = []

  const homeCandidate = pages.find((p) => p.path === homePath) ?? null
  const home = homeCandidate && !isHttpError(homeCandidate.metadata) ? homeCandidate : null

  for (const page of pages) {
    if (isHttpError(page.metadata)) {
      discarded.push({ path: page.path, reason: 'http_error', statusCode: pageStatusCode(page.metadata) ?? undefined })
      continue
    }
    if (normalizeContent(page.markdown).length === 0) {
      discarded.push({ path: page.path, reason: 'no_content' })
      continue
    }
    if (home && isHomepageDuplicate(page, home)) {
      discarded.push({ path: page.path, reason: 'homepage_duplicate' })
      continue
    }
    kept.push(page)
  }

  return { home, kept, discarded }
}
