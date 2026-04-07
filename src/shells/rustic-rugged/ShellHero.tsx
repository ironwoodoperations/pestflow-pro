import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface Biz { phone?: string; founded_year?: string | number }

const HERO_IMAGE = '/images/pests/tech_1.jpg'

export default function ShellHero() {
  const [headline, setHeadline] = useState('Built Tough. Built Local. Built for East Texas.')
  const [heroSubtext, setHeroSubtext] = useState('')
  const [biz, setBiz] = useState<Biz>({})
  const [ctaText, setCtaText] = useState('Get a Free Estimate')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, custRes, brandRes, contentRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('page_content').select('subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
      ])
      if (bizRes.data?.value) {
        const v = bizRes.data.value
        setBiz({ phone: v.phone, founded_year: v.founded_year })
      }
      if (custRes.data?.value?.hero_headline) setHeadline(custRes.data.value.hero_headline)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
      if (contentRes.data?.subtitle) setHeroSubtext(contentRes.data.subtitle)
    })
  }, [])

  const dialPhone = `tel:${(biz.phone || '').replace(/\D/g, '')}`

  return (
    <section style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }} className="flex flex-col md:flex-row min-h-[540px]">
      {/* LEFT — text */}
      <div className="md:w-1/2 flex flex-col justify-center px-10 py-16 relative z-10">
        {/* Est. badge */}
        {biz.founded_year && (
          <span
            className="inline-block text-sm font-bold px-3 py-1 rounded-sm mb-6 w-fit"
            style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
          >
            Est. {biz.founded_year}
          </span>
        )}

        <h1
          className="font-oswald text-5xl font-bold uppercase leading-tight mb-4 text-white"
        >
          {headline}
        </h1>

        <p className="text-gray-300 text-lg mt-2 mb-8">
          {heroSubtext || (biz.founded_year ? `Serving Tyler & surrounding counties since ${biz.founded_year}.` : 'Serving Tyler & surrounding counties.')}
        </p>

        <Link
          to="/quote"
          className="inline-block font-bold px-8 py-4 text-white text-lg transition w-fit hover:opacity-90"
          style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)', borderRadius: '2px' }}
        >
          {ctaText}
        </Link>
      </div>

      {/* RIGHT — image + floating card */}
      <div className="md:w-1/2 relative overflow-hidden h-56 md:h-auto">
        <img
          src={HERO_IMAGE}
          alt="Pest control technician"
          className="w-full h-full object-cover"
        />
        {/* Overlay blends image panel with left — tinted to palette */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--color-bg-cta) 90%, transparent), transparent)' }} />

        {/* Floating card — visible md+ */}
        {biz.phone && (
          <div
            className="hidden md:block absolute top-1/2 left-0 -translate-x-1/3 -translate-y-1/2 rounded-xl p-5 shadow-2xl z-20"
            style={{ backgroundColor: 'var(--color-bg-hero)', border: '1px solid var(--color-primary)', minWidth: '180px' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>
              Free Estimate
            </p>
            <p className="text-white font-bold text-xl leading-tight mb-3">{biz.phone}</p>
            <a
              href={dialPhone}
              className="block text-center text-white text-sm font-bold px-4 py-2 rounded transition hover:opacity-80"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Call Now
            </a>
          </div>
        )}
      </div>

      {/* Mobile floating card — below image on small screens */}
      {biz.phone && (
        <div
          className="md:hidden mx-6 -mt-6 relative z-20 rounded-xl p-5 shadow-2xl mb-8"
          style={{ backgroundColor: 'var(--color-bg-hero)', border: '1px solid var(--color-primary)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-primary)' }}>
            Free Estimate
          </p>
          <p className="text-white font-bold text-xl mb-3">{biz.phone}</p>
          <a
            href={dialPhone}
            className="block text-center text-white text-sm font-bold px-4 py-2 rounded transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Call Now
          </a>
        </div>
      )}
    </section>
  )
}
