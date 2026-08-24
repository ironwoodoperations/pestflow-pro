/**
 * S293 PR B — the tenant's city, parsed from settings.business_info.
 *
 * Callers used to pass `biz.address || biz.city || 'Unknown City'` straight into
 * a prompt under a "City:" label — the whole postal address ("805 W Broadway
 * St, Big Sandy, TX 75755" as a city), and the literal string 'Unknown City'
 * when there was none, next to a system rule REQUIRING the metaTitle to include
 * the city. Every tenant's `business_info.city` is NULL as of 2026-08-24, so the
 * address branch is the one that actually runs.
 *
 * Returns '' when no city can be read. '' means OMIT THE CLAUSE. It does not
 * mean substitute: there is no default city, because a guessed city is a claim
 * about where the business works.
 */
export function cityFromBusinessInfo(biz: unknown): string {
  const v = (biz ?? {}) as { address?: unknown; city?: unknown }
  if (typeof v.city === 'string' && v.city.trim()) return v.city.trim()
  const addr = typeof v.address === 'string' ? v.address : ''
  // "123 Main St, Hawkins, TX 75765" → "Hawkins". Anchored on the state code so
  // a street line cannot be mistaken for a locality.
  const match = addr.match(/,\s*([^,]+?),?\s*[A-Z]{2}\b/)
  return match ? match[1].trim() : ''
}
