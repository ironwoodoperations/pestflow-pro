import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import ServicesGrid from '../../components/public/ServicesGrid'

interface Biz { founded_year?: string | number; num_technicians?: number; phone?: string }
interface Testimonial { id: string; author_name: string; review_text: string; rating: number }

export default function ShellHomeSections() {
  const [biz, setBiz] = useState<Biz>({})
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [ctaText, setCtaText] = useState('Get a Free Quote')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, testRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('testimonials').select('id,author_name,review_text,rating').eq('tenant_id', tenantId).eq('featured', true).limit(3),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (testRes.data?.length) setTestimonials(testRes.data)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
    })
  }, [])

  return (
    <>
      <ServicesGrid ctaText={ctaText} />

      {/* Why Choose Us — 3 stat cards */}
      <section className="py-12" style={{ backgroundColor: 'var(--color-bg-hero)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {biz.founded_year ? `Est. ${biz.founded_year}` : 'Est.'}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Founded</div>
            </div>
            <div>
              <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {biz.num_technicians ? `${biz.num_technicians} Techs` : '10+ Techs'}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>On Staff</div>
            </div>
            <div>
              <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>✓</div>
              <div className="text-sm mt-1" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Licensed &amp; Insured</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-oswald text-4xl text-center mb-10 tracking-wide" style={{ color: 'var(--color-heading)' }}>What Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white rounded-xl p-6 shadow border border-gray-100">
                  <div className="mb-3" style={{ color: 'var(--color-primary)' }}>{'★'.repeat(t.rating)}</div>
                  <p className="text-gray-700 italic mb-4">
                    "{t.review_text.slice(0, 80)}{t.review_text.length > 80 ? '…' : ''}"
                  </p>
                  <p className="text-gray-900 font-bold text-sm">— {t.author_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section style={{ backgroundColor: 'var(--color-bg-cta)' }} className="py-14">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <h2 className="font-oswald text-3xl md:text-4xl tracking-wide" style={{ color: 'var(--color-nav-text)' }}>Ready to protect your home?</h2>
          <div className="flex items-center gap-6 flex-wrap">
            <Link to="/quote" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }} className="font-bold px-8 py-3 rounded-lg transition">
              {ctaText}
            </Link>
            {biz.phone && (
              <a href={`tel:${biz.phone.replace(/\D/g, '')}`} className="font-semibold transition hover:opacity-80" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>
                {biz.phone}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
