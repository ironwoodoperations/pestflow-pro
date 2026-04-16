// Per-hostname localStorage cache for shell hero content.
// Prevents the flash where shells render a generic fallback headline on first
// paint, then repaint with the tenant's real hero_headline once Supabase
// resolves. On subsequent visits we seed useState() synchronously from this
// cache, so the first paint already shows the correct text.
//
// Keyed by hostname + ?tenant=<slug> query param so dev/preview environments
// testing multiple tenants via query string don't leak cached data between them.
//
// v:4 — imageUrl normalized via resolveHeroImage (drops stale multi-field variants).
// Caches without v:4 are treated as stale for headline fields.

import { resolveHeroImage } from './resolveHeroImage'

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
    // If cache pre-dates v4, strip the headline fields so shells re-fetch fresh.
    if (cache.v !== 4) {
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
    // Normalize imageUrl: if caller passed a heroMedia-shaped object accidentally,
    // resolve it. Otherwise pass through as-is (already a string or undefined).
    const normalized: HeroCache = { ...next }
    if (normalized.imageUrl && typeof normalized.imageUrl === 'object') {
      normalized.imageUrl = resolveHeroImage(normalized.imageUrl as any) ?? undefined
    }
    const merged = { ...readHeroCache(), ...normalized, v: 4 }
    localStorage.setItem(cacheKey(), JSON.stringify(merged))
  } catch {
    /* quota exceeded or SSR — non-fatal */
  }
}
