import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import { resolveHeroImage } from '../lib/resolveHeroImage'

/**
 * Returns the correct hero background image URL for a given page slug.
 * - If branding.apply_hero_to_all_pages is true → returns the global hero_media image
 * - Otherwise → returns page_content.image_url for this specific page
 * Falls back to null when neither is set.
 */
export function usePageHeroImage(pageSlug: string): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    resolveTenantId().then(id => setTenantId(id ?? null))
  }, [])

  useEffect(() => {
    if (!tenantId) return
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

      setImageUrl(resolved ?? null)
    })
  }, [tenantId, pageSlug])

  return imageUrl
}
