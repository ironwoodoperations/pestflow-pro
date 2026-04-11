import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

const CORE_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/',                  priority: '1.0', changefreq: 'daily' },
  { path: '/about',             priority: '0.8', changefreq: 'monthly' },
  { path: '/pest-control',      priority: '0.9', changefreq: 'weekly' },
  { path: '/termite-control',   priority: '0.9', changefreq: 'weekly' },
  { path: '/termite-inspections', priority: '0.8', changefreq: 'weekly' },
  { path: '/mosquito-control',  priority: '0.8', changefreq: 'weekly' },
  { path: '/rodent-control',    priority: '0.8', changefreq: 'weekly' },
  { path: '/ant-control',       priority: '0.8', changefreq: 'weekly' },
  { path: '/spider-control',    priority: '0.7', changefreq: 'weekly' },
  { path: '/roach-control',     priority: '0.7', changefreq: 'weekly' },
  { path: '/bed-bug-control',   priority: '0.7', changefreq: 'weekly' },
  { path: '/flea-tick-control', priority: '0.7', changefreq: 'weekly' },
  { path: '/wasp-hornet-control', priority: '0.7', changefreq: 'weekly' },
  { path: '/scorpion-control',  priority: '0.7', changefreq: 'weekly' },
  { path: '/contact',           priority: '0.7', changefreq: 'monthly' },
  { path: '/quote',             priority: '0.7', changefreq: 'monthly' },
  { path: '/faq',               priority: '0.7', changefreq: 'weekly' },
  { path: '/reviews',           priority: '0.6', changefreq: 'weekly' },
  { path: '/service-area',      priority: '0.7', changefreq: 'monthly' },
  { path: '/blog',              priority: '0.6', changefreq: 'daily' },
]

function urlEntry(loc: string, priority: string, changefreq: string, lastmod?: string) {
  return [
    '<url>',
    `  <loc>${loc}</loc>`,
    lastmod ? `  <lastmod>${lastmod}</lastmod>` : '',
    `  <changefreq>${changefreq}</changefreq>`,
    `  <priority>${priority}</priority>`,
    '</url>',
  ].filter(Boolean).join('\n')
}

export default function Sitemap() {
  const [xml, setXml] = useState('')

  useEffect(() => {
    async function generate() {
      const tenantId = await resolveTenantId()

      // Determine canonical origin for this tenant
      let origin = window.location.origin
      if (tenantId) {
        try {
          const { data: domain } = await supabase
            .from('tenant_domains')
            .select('custom_domain')
            .eq('tenant_id', tenantId)
            .eq('verified', true)
            .maybeSingle()
          if (domain?.custom_domain) {
            origin = `https://${domain.custom_domain}`
          }
        } catch { /* non-fatal */ }
      }

      const entries: string[] = []

      // Tenant created_at for lastmod on homepage
      let tenantCreatedAt: string | undefined
      if (tenantId) {
        const { data: tenant } = await supabase.from('tenants').select('created_at').eq('id', tenantId).maybeSingle()
        tenantCreatedAt = tenant?.created_at ? tenant.created_at.split('T')[0] : undefined
      }

      // Core static routes
      for (const route of CORE_ROUTES) {
        entries.push(urlEntry(
          `${origin}${route.path}`,
          route.priority,
          route.changefreq,
          route.path === '/' ? tenantCreatedAt : undefined
        ))
      }

      if (tenantId) {
        // Dynamic location pages
        const { data: locations } = await supabase
          .from('location_data').select('slug, updated_at')
          .eq('tenant_id', tenantId).eq('is_live', true)
        for (const loc of locations || []) {
          entries.push(urlEntry(
            `${origin}/${loc.slug}`,
            '0.7',
            'weekly',
            loc.updated_at ? loc.updated_at.split('T')[0] : undefined
          ))
        }

        // Blog posts
        const { data: posts } = await supabase
          .from('blog_posts').select('slug, updated_at')
          .eq('tenant_id', tenantId).eq('published', true)
        for (const post of posts || []) {
          entries.push(urlEntry(
            `${origin}/blog/${post.slug}`,
            '0.6',
            'monthly',
            post.updated_at ? post.updated_at.split('T')[0] : undefined
          ))
        }

        // Custom pages from page_content
        try {
          const { data: pages } = await supabase
            .from('page_content').select('slug, updated_at')
            .eq('tenant_id', tenantId)
            .not('slug', 'in', '(home,about,contact,quote,faq,reviews,service-area,blog)')
          for (const page of pages || []) {
            if (page.slug) {
              entries.push(urlEntry(
                `${origin}/${page.slug}`,
                '0.6',
                'monthly',
                page.updated_at ? page.updated_at.split('T')[0] : undefined
              ))
            }
          }
        } catch { /* page_content may not have all slugs */ }
      }

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries,
        '</urlset>',
      ].join('\n')

      setXml(sitemap)
    }
    generate()
  }, [])

  useEffect(() => {
    if (!xml) return
    document.title = 'sitemap.xml'
    // Set correct content type hint via a meta tag
    const existing = document.querySelector('meta[http-equiv="Content-Type"]')
    if (!existing) {
      const m = document.createElement('meta')
      m.httpEquiv = 'Content-Type'
      m.content = 'application/xml; charset=utf-8'
      document.head.appendChild(m)
    }
  }, [xml])

  return <pre className="whitespace-pre-wrap text-xs font-mono p-4">{xml || 'Generating sitemap...'}</pre>
}
