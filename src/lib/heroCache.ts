// Per-hostname localStorage cache for shell hero content.
// Prevents the flash where shells render a generic fallback headline on first
// paint, then repaint with the tenant's real hero_headline once Supabase
// resolves. On subsequent visits we seed useState() synchronously from this
// cache, so the first paint already shows the correct text.
//
// Keyed by hostname + ?tenant=<slug> query param so dev/preview environments
// testing multiple tenants via query string don't leak cached data between them.

export interface HeroCache {
  headline?: string
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
    return (parsed && typeof parsed === 'object') ? parsed as HeroCache : {}
  } catch {
    return {}
  }
}

export function writeHeroCache(next: HeroCache) {
  try {
    const merged = { ...readHeroCache(), ...next }
    localStorage.setItem(cacheKey(), JSON.stringify(merged))
  } catch {
    /* quota exceeded or SSR — non-fatal */
  }
}
