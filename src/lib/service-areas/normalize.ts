export type NormalizedCity = {
  city: string
  slug: string
  state: string
  isCounty: boolean
  raw: string
}

export type NormalizeResult = {
  accepted: NormalizedCity[]
  rejected: Array<{ raw: string; reason: string }>
}

const SAINT_WHITELIST = ['saint paul', 'saint jo', 'saint hedwig']

export function parseRawInput(input: string | string[] | null | undefined): string[] {
  if (input == null) return []
  if (Array.isArray(input)) return input.map(s => s.trim()).filter(Boolean)
  return input.split(',').map(s => s.trim()).filter(Boolean)
}

export function normalizeCity(raw: string): NormalizedCity | { rejected: string } {
  // Step 1: trim + collapse whitespace
  let s = raw.trim().replace(/\s+/g, ' ')

  // Step 8 early-exit: empty
  if (!s) return { rejected: 'empty' }
  // Step 8 early-exit: too long
  if (s.length > 100) return { rejected: 'too_long' }

  // Step 2: strip trailing zip
  s = s.replace(/\s+\d{5}(-\d{4})?$/, '').trim()

  // Step 3: strip trailing state code
  s = s.replace(/\s*,?\s*(TX|Texas)\s*$/i, '').trim()

  // Step 8: empty after stripping
  if (!s) return { rejected: 'empty' }
  // Step 8: purely numeric
  if (/^\d+$/.test(s)) return { rejected: 'numeric' }

  // Step 4: county detection
  const isCounty = /\bcounty\b/i.test(s)

  // Step 5: abbreviation expansion
  s = s.replace(/^Ft\.?\s+/i, 'Fort ')
  // St. — only expand if result matches whitelist
  const stMatch = s.match(/^St\.?\s+(.+)$/i)
  if (stMatch) {
    const candidate = 'Saint ' + stMatch[1]
    if (SAINT_WHITELIST.includes(candidate.toLowerCase())) {
      s = candidate
    }
    // else leave as-is with original casing preserved
  }
  s = s.replace(/^N\.\s+/i, 'North ')
  s = s.replace(/^S\.\s+/i, 'South ')
  s = s.replace(/^E\.\s+/i, 'East ')
  s = s.replace(/^W\.\s+/i, 'West ')

  // Step 6: title-case (capitalize first char of each word, lowercase rest)
  const city = s
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  // Step 7: slug generation
  const slugBase = city
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  const slug = `${slugBase}-tx`

  return { city, slug, state: 'TX', isCounty, raw }
}

export function normalizeAll(input: string | string[] | null | undefined): NormalizeResult {
  const tokens = parseRawInput(input)
  const accepted: NormalizedCity[] = []
  const rejected: Array<{ raw: string; reason: string }> = []
  const seenSlugs = new Map<string, number>()

  for (const token of tokens) {
    const result = normalizeCity(token)
    if ('rejected' in result) {
      rejected.push({ raw: token, reason: result.rejected })
      continue
    }
    const existing = seenSlugs.get(result.slug)
    if (existing !== undefined) {
      accepted[existing] = result
    } else {
      seenSlugs.set(result.slug, accepted.length)
      accepted.push(result)
    }
  }

  return { accepted, rejected }
}

export function buildJsonbProjection(rows: Array<{ city: string; is_live: boolean }>): string[] {
  return rows
    .filter(r => r.is_live)
    .map(r => r.city)
    .sort((a, b) => a.localeCompare(b))
}
