import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import HolidayBanner from '../components/HolidayBanner'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface PageData {
  title: string
  subtitle: string
  intro: string
}

export default function CustomPage({ slug }: { slug: string }) {
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) { setLoading(false); return }
      const { data } = await supabase
        .from('page_content')
        .select('title, subtitle, intro')
        .eq('tenant_id', tenantId)
        .eq('page_slug', slug)
        .maybeSingle()
      setPage(data ?? null)
      setLoading(false)
    })
  }, [slug])

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--color-bg-hero)' }} />

  return (
    <div>
      <HolidayBanner />
      <Navbar />

      <section style={{ background: 'var(--color-bg-hero)', padding: '80px 0 60px' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          {page?.subtitle && (
            <p className="text-sm font-semibold uppercase tracking-widest mb-3"
               style={{ color: 'var(--color-accent)' }}>
              {page.subtitle}
            </p>
          )}
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6"
              style={{ color: 'var(--color-heading)' }}>
            {page?.title || slug.replace(/-/g, ' ')}
          </h1>
        </div>
      </section>

      <section style={{ background: 'var(--color-bg-section)', padding: '60px 0' }}>
        <div className="max-w-3xl mx-auto px-6">
          {page?.intro ? (
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {page.intro}
            </div>
          ) : (
            <p className="text-gray-500 text-center">Content coming soon.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
