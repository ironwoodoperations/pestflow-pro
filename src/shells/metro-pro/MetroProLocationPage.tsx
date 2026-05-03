import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import { formatPhone } from '../../lib/formatPhone'
import { usePageHeroImage } from '../../hooks/usePageHeroImage'
import { usePageContent } from '../../hooks/usePageContent'

export default function MetroProLocationPage() {
  const heroImageUrl = usePageHeroImage('service-area')
  const { id: tenantId } = useTenant()
  const [areas, setAreas] = useState<string[]>([])
  const [phone, setPhone] = useState('')
  const [heroTitle, setHeroTitle] = useState('Our Service Area')
  const [heroSubtitle, setHeroSubtitle] = useState('Professional pest control in your community')

  const { content: locationContent } = usePageContent(tenantId, 'service-area')

  useEffect(() => {
    ;(async () => {
      if (!tenantId) return
      const [seoRes, bizRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'seo').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      ])
      setAreas(Array.isArray(seoRes.data?.value?.service_areas) ? seoRes.data.value.service_areas : [])
      if (bizRes.data?.value?.phone) setPhone(bizRes.data.value.phone)
    })()
  }, [tenantId])

  useEffect(() => {
    if (locationContent?.title) setHeroTitle(locationContent.title)
    if (locationContent?.subtitle) setHeroSubtitle(locationContent.subtitle)
  }, [locationContent])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      {/* Hero */}
      <section className="relative py-20 md:py-28 px-6 text-center" style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        {heroImageUrl && <div className="absolute inset-0 bg-black/60" style={{ zIndex: 0, pointerEvents: 'none' }} />}
        <h1 className="relative z-10 text-5xl md:text-7xl font-bold mb-4 tracking-tight" style={{ color: 'var(--color-nav-text)', fontFamily: 'var(--font-heading)' }}>
          {heroTitle}
        </h1>
        <p className="relative z-10 text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>
          {heroSubtitle}
        </p>
      </section>

      {/* Service Areas Grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: 'var(--color-heading)' }}>
            Communities We Serve
          </h2>
          {areas.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {areas.map((area) => (
                <div key={area} className="flex items-center gap-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                  <span className="font-medium text-sm" style={{ color: 'var(--color-heading)' }}>{area}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Service area information coming soon.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--color-nav-text)' }}>
          Don&apos;t See Your City?
        </h2>
        <p className="mb-8 text-lg" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>
          We may still serve your area — give us a call to find out.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
            >
              Call {formatPhone(phone)}
            </a>
          )}
          <Link
            to="/quote"
            className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90 border-2"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-nav-text)' }}
          >
            Get a Free Quote
          </Link>
        </div>
      </section>

    </div>
  )
}
