import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'

interface StructuredDataProps {
  type: 'LocalBusiness' | 'WebPage' | 'BlogPosting'
  pageSlug?: string
}

export default function StructuredData({ type, pageSlug }: StructuredDataProps) {
  const { id: tenantId } = useTenant()
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    ;(async () => {

      if (type === 'LocalBusiness') {
        const { data } = await supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
        const info = data?.value || {}
        setSchema({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: info.name || 'PestFlow Pro',
          telephone: info.phone || '',
          email: info.email || '',
          address: info.address || '',
          url: window.location.origin,
          priceRange: '$$',
          areaServed: 'East Texas',
        })
      } else if (type === 'WebPage' && pageSlug) {
        const { data } = await supabase.from('seo_meta').select('meta_title, meta_description').eq('tenant_id', tenantId).eq('page_slug', pageSlug).maybeSingle()
        setSchema({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: data?.meta_title || pageSlug,
          description: data?.meta_description || '',
          url: window.location.href,
        })
      } else if (type === 'BlogPosting' && pageSlug) {
        const { data } = await supabase.from('blog_posts').select('title, excerpt').eq('tenant_id', tenantId).eq('slug', pageSlug).maybeSingle()
        setSchema({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data?.title || '',
          description: data?.excerpt || '',
          url: window.location.href,
        })
      }
    })()
  }, [tenantId, type, pageSlug])

  useEffect(() => {
    if (!schema) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'structured-data'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => { document.getElementById('structured-data')?.remove() }
  }, [schema])

  return null
}
