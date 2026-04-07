import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import ServicesGrid from '../../components/public/ServicesGrid'

interface Biz { founded_year?: string | number; num_technicians?: number; phone?: string; address?: string }
interface Testimonial { id: string; author_name: string; review_text: string; rating: number }

export default function ShellHomeSections() {
  const [biz, setBiz] = useState<Biz>({})
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [ctaText, setCtaText] = useState('Get a Free Estimate')

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

  const region = biz.address ? (biz.address.split(',')[1]?.trim() || 'your area') : 'your area'

  return (
    <>
      <ServicesGrid ctaText={ctaText} />

      {/* Trust Strip */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="font-oswald text-5xl font-bold" style={{ color: 'var(--color-heading)' }}>
              {biz.founded_year || '—'}
            </div>
            <div className="font-raleway text-gray-500 text-sm mt-1">Est.</div>
          </div>
          <div>
            <div className="font-oswald text-5xl font-bold" style={{ color: 'var(--color-heading)' }}>
              {biz.num_technicians ? `${biz.num_technicians}+` : '10+'}
            </div>
            <div className="font-raleway text-gray-500 text-sm mt-1">Technicians</div>
          </div>
          <div>
            <div className="font-oswald text-5xl font-bold" style={{ color: 'var(--color-heading)' }}>✓</div>
            <div className="font-raleway text-gray-500 text-sm mt-1">Licensed &amp; Insured</div>
          </div>
        </div>
      </section>

      {/* Testimonials with Side Panel */}
      {testimonials.length > 0 && (
        <section>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row">
            <div className="md:w-1/3 p-10 flex flex-col justify-center" style={{ backgroundColor: 'var(--color-bg-hero)' }}>
              <div className="text-8xl font-serif leading-none mb-4 select-none" style={{ color: 'var(--color-primary)' }}>"</div>
              <h3 className="font-oswald text-2xl mb-3" style={{ color: 'var(--color-nav-text)' }}>What Our Customers Say</h3>
              <p className="text-sm" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Trusted by homeowners across {region}</p>
            </div>
            <div className="md:w-2/3 divide-y divide-gray-100" style={{ backgroundColor: 'var(--color-bg-section)' }}>
              {testimonials.map((t) => (
                <div key={t.id} className="p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900 text-sm">{t.author_name}</span>
                    <span className="text-sm" style={{ color: 'var(--color-primary)' }}>{'★'.repeat(t.rating)}</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    "{t.review_text.slice(0, 120)}{t.review_text.length > 120 ? '…' : ''}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guarantee Section */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-1/2 border-l-4 pl-6" style={{ borderLeftColor: 'var(--color-primary)' }}>
            <h3 className="font-oswald text-3xl mb-2" style={{ color: 'var(--color-heading)' }}>
              Your Satisfaction,<br />Guaranteed
            </h3>
            <div className="w-12 h-1 mt-3" style={{ backgroundColor: 'var(--color-primary)' }} />
          </div>
          <ul className="md:w-1/2 space-y-4 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5" style={{ color: 'var(--color-primary)' }}>✓</span>
              We'll come back at no charge if pests return
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold mt-0.5" style={{ color: 'var(--color-primary)' }}>✓</span>
              Licensed, background-checked technicians every time
            </li>
          </ul>
        </div>
      </section>

      {/* Bottom CTA Band */}
      <section style={{ backgroundColor: 'var(--color-bg-cta)' }} className="py-16 text-center">
        <h2 className="font-oswald text-4xl mb-6 tracking-wide" style={{ color: 'var(--color-nav-text)' }}>Ready to Get Started?</h2>
        <a
          href="/quote"
          style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }} className="inline-block font-bold px-10 py-4 rounded-lg text-lg transition mb-4"
        >
          {ctaText}
        </a>
        {biz.phone && <p className="text-gray-400 mt-4">{biz.phone}</p>}
      </section>
    </>
  )
}
