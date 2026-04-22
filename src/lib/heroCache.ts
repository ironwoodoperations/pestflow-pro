// Per-hostname localStorage cache for theme hero content.
// Prevents the flash where themes render a generic fallback headline on first
// paint, then repaint with the tenant's real hero_headline once Supabase
// resolves. On subsequent visits we seed useState() synchronously from this
// cache, so the first paint already shows the correct text.
//
// Keyed by hostname + ?tenant=<slug> query param so dev/preview environments
// testing multiple tenants via query string don't leak cached data between them.
//
// v:4 — imageUrl normalized via resolveHeroImage; savedAt added for cache-bust.
// Caches without v:4 are treated as stale for headline fields.

import { resolveHeroImage } from './resolveHeroImage'

export interface HeroCache {
  v?: number
  savedAt?: number
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
  imageUrl?: string
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
    let result: HeroCache
    // If cache pre-dates v4, strip the headline fields so shells re-fetch fresh.
    if (cache.v !== 4) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { headline: _h, heroHeadline: _hh, customHeadline: _ch, ...rest } = cache
      result = rest
    } else {
      result = { ...cache }
    }
    // For old-style fixed filenames (hero.jpg), append cache-bust if missing.
    if (result.imageUrl && !result.imageUrl.includes('?v=') && /\/hero\./.test(result.imageUrl)) {
      result.imageUrl = `${result.imageUrl}?v=${result.savedAt || Date.now()}`
    }
    return result
  } catch {
    return {}
  }
}

export function writeHeroCache(next: HeroCache) {
  try {
    // Normalize imageUrl: if caller passed a heroMedia-shaped object accidentally,
    // resolve it. Otherwise pass through as-is (already a string or undefined).
    const normalized: HeroCache = { ...next }
    if (normalized.imageUrl && typeof normalized.imageUrl === 'object') {
      normalized.imageUrl = resolveHeroImage(normalized.imageUrl as any) ?? undefined
    }
    const merged = { ...readHeroCache(), ...normalized, v: 4, savedAt: Date.now() }
    localStorage.setItem(cacheKey(), JSON.stringify(merged))
  } catch {
    /* quota exceeded or SSR — non-fatal */
  }
}

/** Call after saving a new hero image so the theme re-fetches from DB on next load. */
export function clearHeroCacheImageUrl() {
  try {
    const raw = localStorage.getItem(cacheKey())
    if (!raw) return
    const entry = JSON.parse(raw)
    if (!entry || typeof entry !== 'object') return
    delete entry.imageUrl
    delete entry.thumbnailUrl
    localStorage.setItem(cacheKey(), JSON.stringify(entry))
  } catch { /* non-fatal */ }
}
