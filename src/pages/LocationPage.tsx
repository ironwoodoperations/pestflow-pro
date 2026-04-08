import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Leaf, MapPin, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'
import VideoImage from '../components/VideoImage'
import LocationMap from '../components/shared/LocationMap'
import { PEST_VIDEOS } from '../data/pestVideos'

interface LocationData { city: string; hero_title: string; intro_video_url: string; meta_title?: string; meta_description?: string; focus_keyword?: string }
interface OtherLocation { slug: string; city: string }

const SERVICES = [
  { icon: '🦟', name: 'Mosquito Control', href: '/mosquito-control' },
  { icon: '🕷️', name: 'Spider Control', href: '/spider-control' },
  { icon: '🐜', name: 'Ant Control', href: '/ant-control' },
  { icon: '🐝', name: 'Wasp Control', href: '/wasp-hornet-control' },
  { icon: '🪳', name: 'Roach Control', href: '/roach-control' },
  { icon: '🐀', name: 'Rodent Control', href: '/rodent-control' },
]

export default function LocationPage({ slug }: { slug: string }) {
  const [location, setLocation] = useState<LocationData>({ city: '', hero_title: '', intro_video_url: '' })
  const [otherLocations, setOtherLocations] = useState<OtherLocation[]>([])
  const [phone, setPhone] = useState('')
  const [bizAddress, setBizAddress] = useState('')
  const [bizName, setBizName] = useState('')

  function titleCase(s: string) { return s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) }

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [locRes, allLocsRes, settingsRes] = await Promise.all([
        supabase.from('location_data').select('city, hero_title, intro_video_url, meta_title, meta_description, focus_keyword').eq('tenant_id', tenantId).eq('slug', slug).eq('is_live', true).maybeSingle(),
        supabase.from('location_data').select('slug, city').eq('tenant_id', tenantId).eq('is_live', true).neq('slug', slug),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      ])
      if (locRes.data) setLocation(locRes.data)
      if (allLocsRes.data) setOtherLocations(allLocsRes.data)
      const biz = settingsRes.data?.value || {}
      if (biz.phone) setPhone(biz.phone)
      if (biz.address) setBizAddress(biz.address)
      if (biz.name) setBizName(biz.name)
    })
  }, [slug])

  const city = location.city || titleCase(slug)
  const heroTitle = location.hero_title || `${city} Pest Control`

  // Apply meta tags
  useEffect(() => {
    const pageTitle = location.meta_title || `${city} Pest Control | ${bizName || 'Pest Control'}`
    document.title = pageTitle
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el) }
      el.content = content
    }
    if (location.meta_description) setMeta('description', location.meta_description)
    if (location.focus_keyword) setMeta('keywords', location.focus_keyword)
  }, [location, city, bizName])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <StructuredData type="WebPage" pageSlug={slug} />

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-5xl md:text-7xl mb-4" style={{ color: 'var(--color-nav-text)' }}>{heroTitle}</h1>
          <p className="text-xl mb-8" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>Protecting East Texas Homes & Businesses</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote" className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Get a Free Quote</Link>
            {phone && <a href={`tel:${phone}`} className="border-2 font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-80" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>Call Us Now</a>}
          </div>
        </div>
        <img src="/banner-img.png" alt="" loading="lazy" className="absolute bottom-0 left-0 w-full opacity-20 pointer-events-none" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      </section>

      {/* INTRO */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="border-2 rounded-lg overflow-hidden h-80 flex items-center justify-center" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-bg-cta)' }}>
              <VideoImage src="/images/pests/tech_1.jpg" alt={`Pest control in ${city}`} videoUrl={PEST_VIDEOS.general[0]?.url} className="w-full h-full" />
            </div>
            <div>
              <h2 className="font-oswald tracking-wide text-3xl md:text-4xl mb-4" style={{ color: 'var(--color-heading)' }}>Professional Pest Control in {city}</h2>
              <p className="text-gray-600 mb-4">Professional pest control serving {city} and surrounding areas. Our certified technicians use the latest treatments to eliminate pests and keep your home protected year-round.</p>
              <p className="text-gray-600 mb-4">From mosquitoes and spiders to rodents and termites, we handle every type of pest common to East Texas. We offer same-day service and free estimates.</p>
              <p className="text-gray-600 mb-6">Don't let pests take over your property. Contact us today for a thorough inspection and customized treatment plan for your {city} home or business.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/quote" className="font-bold rounded-lg px-6 py-3 transition text-center hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Get a Free Quote</Link>
                {phone && <a href={`tel:${phone}`} className="border-2 font-bold rounded-lg px-6 py-3 transition text-center hover:opacity-80" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>Call {phone}</a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-10" style={{ color: 'var(--color-heading)' }}>Our Pest Control Services in {city}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc) => (
              <Link key={svc.name} to={svc.href} className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 transition group hover:opacity-90" style={{ '--hover-border': 'var(--color-primary)' } as React.CSSProperties}>
                <span className="text-4xl block mb-3">{svc.icon}</span>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-heading)' }}>{svc.name}</h3>
                <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Learn more →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-10" style={{ color: 'var(--color-heading)' }}>Why Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: Shield, title: 'Licensed & Certified', desc: 'Fully licensed, bonded, and insured for your peace of mind.' },
              { Icon: Leaf,   title: 'Family Safe', desc: 'Kid and pet-friendly treatments that are tough on pests.' },
              { Icon: MapPin, title: 'Local Experts', desc: `We know ${city} pests and the best way to eliminate them.` },
              { Icon: Star,   title: 'Satisfaction Guaranteed', desc: "If pests come back, so do we — free of charge." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="flex justify-center mb-4"><item.Icon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} /></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-4xl md:text-6xl mb-4" style={{ color: 'var(--color-nav-text)' }}>Ready for a Pest-Free {city}?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>Same-day service available. Call or request a quote online.</p>
          <Link to="/quote" className="inline-block font-bold rounded-lg px-10 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Get a Free Quote</Link>
        </div>
      </section>

      {/* WE ALSO SERVE */}
      {otherLocations.length >= 2 && (
        <section className="py-12" style={{ backgroundColor: 'var(--color-bg-section)' }}>
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-heading)' }}>We Also Serve</h2>
            <p className="text-gray-500 text-sm mb-6">Pest control services throughout East Texas</p>
            <div className="flex flex-wrap justify-center gap-3">
              {otherLocations.slice(0, 6).map((loc) => (
                <Link key={loc.slug} to={`/${loc.slug}`} className="px-4 py-2 rounded-full border bg-white text-sm font-medium transition hover:opacity-80" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                  {loc.city} Pest Control
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GOOGLE MAPS */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Find Us on the Map</h2>
          <LocationMap address={bizAddress} city={city} businessName={bizName} />
        </div>
      </section>
    </div>
  )
}
