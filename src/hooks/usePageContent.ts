import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

export interface PageContent {
  slug: string
  title: string | null
  subtitle: string | null
  intro: string | null
  body: string | null
  meta_title: string | null
  meta_description: string | null
  image_urls: string[] | null
  [key: string]: unknown
}

export function usePageContent(slug: string) {
  const [content, setContent] = useState<PageContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId || cancelled) { setLoading(false); return }
      const { data } = await supabase
        .from('page_content')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('page_slug', slug)
        .maybeSingle()
      if (!cancelled) {
        if (data) setContent(data as PageContent)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [slug])

  return { content, loading }
}
