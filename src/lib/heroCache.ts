// Per-hostname localStorage cache for shell hero content.
// Prevents the flash where shells render a generic fallback headline on first
// paint, then repaint with the tenant's real hero_headline once Supabase
// resolves. On subsequent visits we seed useState() synchronously from this
// cache, so the first paint already shows the correct text.
//
// Keyed by hostname + ?tenant=<slug> query param so dev/preview environments
// testing multiple tenants via query string don't leak cached data between them.
//
// v:2 — added heroHeadline field (sourced exclusively from page_content.hero_headline).
// Caches without v:2 are treated as stale for the headline field only.

export interface HeroCache {
  v?: number
  heroHeadline?: string
  headline?: string       // deprecated — use heroHeadline; kept for subtitle compat
  subtitle?: string
  intro?: string
  customHeadline?: string
  bizName?: string
  tagline?: string
  phone?: string
  address?: string
  foundedYear?: string | number
  numTechnicians?: number
  ctaText?: string
  thumbnailUrl?: string
  youtubeId?: string
}

function cacheKey(): string {
  try {
    const host = window.location.hostname
    const tenantParam = new URLSearchParams(window.location.search).get('tenant')
    return tenantParam ? `pfp_hero_${host}?tenant=${tenantParam}` : `pfp_hero_${host}`
  } catch {
    return 'pfp_hero_default'
  }
}

export function readHeroCache(): HeroCache {
  try {
    const raw = localStorage.getItem(cacheKey())
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const cache = parsed as HeroCache
    // If cache pre-dates v3, strip the headline fields so shells re-fetch fresh.
    if (cache.v !== 3) {
      const { headline: _h, heroHeadline: _hh, customHeadline: _ch, ...rest } = cache
      return rest
    }
    return cache
  } catch {
    return {}
  }
}

export function writeHeroCache(next: HeroCache) {
  try {
    const merged = { ...readHeroCache(), ...next, v: 3 }
    localStorage.setItem(cacheKey(), JSON.stringify(merged))
  } catch {
    /* quota exceeded or SSR — non-fatal */
  }
}
