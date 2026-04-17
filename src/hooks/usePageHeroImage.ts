import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import { resolveHeroImage } from '../lib/resolveHeroImage'

// Module-level memory cache — zero async overhead on repeat navigations
const heroMemCache = new Map<string, string | null>()

export function clearHeroMemCache(tenantId: string) {
  for (const key of heroMemCache.keys()) {
    if (key.startsWith(`${tenantId}:`)) heroMemCache.delete(key)
  }
}

export function usePageHeroImage(pageSlug: string): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    resolveTenantId().then(id => setTenantId(id ?? null))
  }, [])

  useEffect(() => {
    if (!tenantId) return
    const memKey = `${tenantId}:${pageSlug || 'global'}`

    // Synchronous cache hit — no DB call
    if (heroMemCache.has(memKey)) {
      setImageUrl(heroMemCache.get(memKey) ?? null)
      return
    }

    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      supabase.from('page_content').select('image_url').eq('tenant_id', tenantId).eq('page_slug', pageSlug).maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
    ]).then(([brandingRes, pageRes, globalRes]) => {
      const applyToAll = brandingRes.data?.value?.apply_hero_to_all_pages ?? false
      const pageImg = pageRes.data?.image_url ?? null
      const globalImg = resolveHeroImage(globalRes.data?.value)

      const resolved = (applyToAll || !pageImg || pageImg.trim() === '')
        ? globalImg
        : pageImg

      heroMemCache.set(memKey, resolved ?? null)
      setImageUrl(resolved ?? null)
    })
  }, [tenantId, pageSlug])

  return imageUrl
}
