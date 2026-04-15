import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { formatPhone } from '../../lib/formatPhone'
import { usePageHeroImage } from '../../hooks/usePageHeroImage'
import MetroProWhyChooseUs from './MetroProWhyChooseUs'
import MetroProProcess from './MetroProProcess'
import MetroProReviews from './MetroProReviews'
import MetroProCtaBanner from './MetroProCtaBanner'

interface LocationData { city: string; hero_title: string; meta_title?: string }
interface BizInfo { name: string; phone: string; address: string }

const CITY_FAQS = (city: string) => [
  { q: `Do you service the ${city} area?`, a: `Yes! We provide full pest control services throughout ${city} and surrounding communities. Call us today for same-day scheduling.` },
  { q: `What pests are most common in ${city}?`, a: `Common pests in ${city} include ants, roaches, rodents, mosquitoes, and spiders. Our local technicians are familiar with regional pest pressures and seasonal patterns.` },
  { q: `How quickly can you get to my home in ${city}?`, a: `We offer same-day and next-day appointments for ${city} residents. Call us to check current availability.` },
  { q: `Are your services available year-round in ${city}?`, a: `Yes. Pest activity varies by season, but many pests remain active year-round in this area. We recommend quarterly service plans for continuous protection.` },
]

function titleCase(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface Props { slug: string }

export default function MetroProCityPage({ slug }: Props) {
  const heroImageUrl = usePageHeroImage(slug)
  const [location, setLocation] = useState<LocationData>({ city: '', hero_title: '' })
  const [biz, setBiz] = useState<BizInfo>({ name: '', phone: '', address: '' })

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [locRes, bizRes] = await Promise.all([
        supabase.from('location_data').select('city,hero_title,meta_title').eq('tenant_id', tenantId).eq('slug', slug).eq('is_live', true).maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      ])
      if (locRes.data) setLocation(locRes.data)
      if (bizRes.data?.value) setBiz(bizRes.data.value)
    })
  }, [slug])

  const city = location.city || titleCase(slug)
  const heroTitle = location.hero_title || `${city} Pest Control`

  const faqs = CITY_FAQS(city)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        {heroImageUrl && <div className="absolute inset-0 bg-black/60" style={{ zIndex: 0 }} />}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/30 text-white/90 bg-white/10">
            {city} Service Area
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{heroTitle}</h1>
          <p className="text-white/70 text-lg mb-10">
            {biz.name ? `${biz.name} serves` : 'Professional pest control for'} {city} and surrounding communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              Schedule Inspection
            </Link>
            {biz.phone && (
              <a href={`tel:${biz.phone.replace(/\D/g, '')}`} className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:bg-white/20" style={{ border: '2px solid rgba(255,255,255,0.4)' }}>
                Call Now: {formatPhone(biz.phone)}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Breadcrumb bar */}
      <nav className="py-3 shadow-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-sm text-white/80">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <Link to="/service-area" className="hover:text-white transition">Service Areas</Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <span className="text-white font-medium">{city}</span>
        </div>
      </nav>

      {/* Intro strip */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-xl overflow-hidden" style={{ minHeight: '280px', background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-primary) 100%)' }}>
            <div className="h-full min-h-[280px] flex items-center justify-center">
              <span className="text-white/60 text-xl font-semibold">{city} Pest Control</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Local Service</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              {biz.name || 'Professional Pest Control'} in {city}
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Our licensed technicians provide comprehensive pest control services throughout {city}. Whether you're dealing with ants, roaches, rodents, termites, or mosquitoes, we have the solution.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We combine local knowledge with professional-grade treatments to deliver lasting results for {city} homeowners and businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/quote" className="font-semibold px-6 py-3 rounded-lg text-white text-center transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
                Get Free Quote
              </Link>
              <Link to="/service-area" className="font-semibold px-6 py-3 rounded-lg text-center transition hover:bg-gray-50" style={{ border: '2px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                View Service Area
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <MetroProWhyChooseUs businessName={biz.name} />

      {/* Process */}
      <MetroProProcess />

      {/* City FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: 'var(--color-heading)' }}>
            Frequently Asked Questions — {city}
          </h2>
          <div className="space-y-0 border border-gray-100 rounded-xl px-6 bg-gray-50 divide-y divide-gray-100">
            {faqs.map((faq, i) => (
              <FaqRow key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <MetroProReviews />

      {/* CTA */}
      <MetroProCtaBanner phone={biz.phone} businessName={biz.name} />
    </div>
  )
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-center justify-between py-4 gap-4">
        <span className="font-medium text-sm" style={{ color: 'var(--color-heading)' }}>{q}</span>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <p className="text-gray-600 text-sm pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}
