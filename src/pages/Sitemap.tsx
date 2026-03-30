import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

const STATIC_ROUTES = [
  '/', '/about', '/contact', '/quote', '/faq', '/reviews', '/service-area', '/blog', '/pricing',
  '/spider-control', '/mosquito-control', '/ant-control', '/wasp-hornet-control',
  '/roach-control', '/flea-tick-control', '/rodent-control', '/scorpion-control',
  '/bed-bug-control', '/pest-control', '/termite-control', '/termite-inspections',
]

export default function Sitemap() {
  const [xml, setXml] = useState('')

  useEffect(() => {
    async function generate() {
      const origin = window.location.origin
      const tenantId = await resolveTenantId()
      const urls: string[] = []

      // Static routes
      for (const route of STATIC_ROUTES) {
        urls.push(`<url><loc>${origin}${route}</loc><changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq><priority>${route === '/' ? '1.0' : '0.8'}</priority></url>`)
      }

      // Dynamic locations
      if (tenantId) {
        const { data: locations } = await supabase.from('location_data').select('slug').eq('tenant_id', tenantId).eq('is_live', true)
        for (const loc of locations || []) {
          urls.push(`<url><loc>${origin}/${loc.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
        }

        // Blog posts
        const { data: posts } = await supabase.from('blog_posts').select('slug').eq('tenant_id', tenantId).eq('published', true)
        for (const post of posts || []) {
          urls.push(`<url><loc>${origin}/blog/${post.slug}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`)
        }
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
      setXml(sitemap)
    }
    generate()
  }, [])

  // Render as plain text XML
  useEffect(() => {
    if (!xml) return
    document.title = 'sitemap.xml'
  }, [xml])

  return <pre className="whitespace-pre-wrap text-xs font-mono p-4">{xml || 'Generating sitemap...'}</pre>
}
