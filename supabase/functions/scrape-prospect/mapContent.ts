// Helper: map URL paths to page slugs and extract structured content from markdown
//
// S346 — VERTICAL-AWARE. This file used to know 18 hardcoded pest paths and map
// only pest slugs, so scraping a lawn company fetched /, /about, /services,
// /contact and /faq and mapped almost nothing: none of their mowing, stonework,
// landscape or turf pages. Paths and slugs now come from the vertical's entry in
// shared/lib/serviceCatalog.ts — the same catalog provisioning validates against,
// imported rather than restated so the two cannot drift.

import { catalogSlugsFor } from '../../../shared/lib/serviceCatalog.ts'

/** Pages every tenant has whatever the trade. Not catalog entries. */
export const PLATFORM_PATHS: readonly string[] = Object.freeze([
  '/', '/about', '/about-us', '/services', '/contact', '/faq',
])

/**
 * The paths to try for a vertical: the platform pages plus one per catalog slug.
 *
 * We scrape what might EXIST on their site. That is deliberately not the same
 * question as what the S342 picker selected for provisioning — a prospect who
 * selected seven lawn services may well have pages for the other ten, and those
 * pages are exactly the content worth reading.
 *
 * Vertical absent or unregistered: fall back to the historical pest list rather
 * than scraping nothing. An unknown trade still has a website.
 */
export function candidatePathsFor(vertical?: string | null): readonly string[] {
  const slugs = catalogSlugsFor(vertical)
  if (slugs.length === 0) return LEGACY_PEST_PATHS

  const out: string[] = [...PLATFORM_PATHS]
  const seen = new Set<string>(out)
  for (const slug of slugs) {
    const path = '/' + slug
    if (!seen.has(path)) { seen.add(path); out.push(path) }
  }
  return Object.freeze(out)
}

/**
 * The pre-S346 hardcoded list, kept verbatim as the unknown-vertical fallback.
 * For 'pest' this is the same SET candidatePathsFor derives from the catalog
 * (order differs; the paths are fetched in parallel, so order is not behaviour).
 * A test pins that equality — if the pest catalog changes, this list is stale.
 */
const LEGACY_PEST_PATHS: readonly string[] = Object.freeze([
  '/', '/about', '/about-us', '/services', '/pest-control',
  '/termite-control', '/termite-inspections', '/roach-control',
  '/ant-control', '/mosquito-control', '/bed-bug-control',
  '/flea-tick-control', '/rodent-control', '/scorpion-control',
  '/spider-control', '/wasp-hornet-control', '/contact', '/faq',
])

/**
 * Map a scraped path to a page slug, for the tenant's vertical.
 *
 * 'pest' and the unknown fallback delegate to the untouched pre-S346 function,
 * so the one vertical that was working cannot regress in the course of
 * generalising for the others. A registered non-pest vertical gets an exact
 * catalog match plus the platform pages — no pest fuzzy matching, because
 * '/termite-control' on a lawn site is not a lawn service page.
 *
 * Unmatched returns null and the page is skipped: better to map nothing than to
 * file a page under a slug the tenant does not sell.
 */
export function pathToSlug(urlPath: string, vertical?: string | null): string | null {
  const p = urlPath.toLowerCase()
  if (p === '/' || p === '' || p === '/home') return 'home'

  const slugs = catalogSlugsFor(vertical)
  if (slugs.length === 0 || vertical === 'pest') return legacyPestSlug(p)

  const bare = p.replace(/^\/+/, '').replace(/\/+$/, '')
  for (const slug of slugs) if (bare === slug) return slug
  if (p.includes('about')) return 'about'
  if (p.includes('contact')) return 'contact'
  if (p.includes('faq')) return 'faq'
  return null
}

/** The pre-S346 mapping, unchanged. Pest correctness is byte-for-byte this. */
function legacyPestSlug(p: string): string | null {
  if (p.includes('termite-inspect')) return 'termite-inspections'
  if (p.includes('termite')) return 'termite-control'
  if (p.includes('roach')) return 'roach-control'
  if (p.includes('ant-control') || p === '/ant') return 'ant-control'
  if (p.includes('mosquito')) return 'mosquito-control'
  if (p.includes('bed-bug')) return 'bed-bug-control'
  if (p.includes('flea')) return 'flea-tick-control'
  if (p.includes('rodent')) return 'rodent-control'
  if (p.includes('scorpion')) return 'scorpion-control'
  if (p.includes('spider')) return 'spider-control'
  if (p.includes('wasp')) return 'wasp-hornet-control'
  if (p.includes('service') || p.includes('pest-control')) return 'pest-control'
  if (p.includes('about')) return 'about'
  if (p.includes('contact')) return 'contact'
  if (p.includes('faq')) return 'faq'
  return null
}

export interface PageContent {
  title: string | null
  intro: string | null
  subtitle: string | null
}

export function extractPageContent(
  markdown: string,
  metadata: Record<string, any>,
): PageContent {
  const title = (metadata?.title as string | undefined) || extractH1(markdown) || null
  const subtitle = (metadata?.description as string | undefined) || null
  const intro = extractIntro(markdown) || null
  return { title, intro, subtitle }
}

function extractH1(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function extractIntro(md: string): string | null {
  for (const line of md.split('\n')) {
    const t = line.trim()
    if (
      t.length >= 50 &&
      !t.startsWith('#') &&
      !t.startsWith('!') &&
      !t.startsWith('|') &&
      !t.startsWith('>')
    ) {
      return t.slice(0, 400)
    }
  }
  return null
}
