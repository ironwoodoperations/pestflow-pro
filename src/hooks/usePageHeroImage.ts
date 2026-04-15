import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

/**
 * Returns the correct hero background image URL for a given page slug.
 * - If branding.apply_hero_to_all_pages is true → returns the global hero_media image_url
 * - Otherwise → returns page_content.image_url for this specific page
 * Falls back to null when neither is set.
 */
export function usePageHeroImage(pageSlug: string): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return

      const [brandingRes, pageRes, globalRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('page_content').select('image_url').eq('tenant_id', tenantId).eq('page_slug', pageSlug).maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      ])

      const applyToAll = brandingRes.data?.value?.apply_hero_to_all_pages ?? false

      if (applyToAll) {
        // Global mode: use hero_media image_url (or thumbnail_url for legacy format)
        const globalImg = globalRes.data?.value?.image_url || globalRes.data?.value?.thumbnail_url || null
        setImageUrl(globalImg || null)
      } else {
        // Per-page mode: use this page's own hero image
        const pageImg = pageRes.data?.image_url || null
        setImageUrl(pageImg)
      }
    })
  }, [pageSlug])

  return imageUrl
}
