import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Leaf, MapPin, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'
import VideoImage from '../components/VideoImage'
import { PEST_VIDEOS } from '../data/pestVideos'

interface LocationData { city: string; hero_title: string; intro_video_url: string }
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
  const [phone, setPhone] = useState('(903) 555-0100')
  const [mapsEmbedUrl, setMapsEmbedUrl] = useState('')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [locRes, allLocsRes, settingsRes, intgRes] = await Promise.all([
        supabase.from('location_data').select('city, hero_title, intro_video_url').eq('tenant_id', tenantId).eq('slug', slug).eq('is_live', true).maybeSingle(),
        supabase.from('location_data').select('slug, city').eq('tenant_id', tenantId).eq('is_live', true).neq('slug', slug),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
      ])
      if (locRes.data) setLocation({ city: locRes.data.city || titleCase(slug), hero_title: locRes.data.hero_title || '', intro_video_url: locRes.data.intro_video_url || '' })
      if (allLocsRes.data) setOtherLocations(allLocsRes.data)
      if (settingsRes.data?.value?.phone) setPhone(settingsRes.data.value.phone)
      if (intgRes.data?.value?.google_maps_embed_url) setMapsEmbedUrl(intgRes.data.value.google_maps_embed_url)
    })
  }, [slug])

  function titleCase(s: string) { return s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) }
  const city = location.city || titleCase(slug)
  const heroTitle = location.hero_title || `${city} Pest Control`

  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug={slug} />

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-white text-5xl md:text-7xl mb-4">{heroTitle}</h1>
          <p className="text-gray-300 text-xl mb-8">Protecting East Texas Homes & Businesses</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-8 py-4 text-lg transition">Get a Free Quote</Link>
            <a href={`tel:${phone}`} className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold rounded-lg px-8 py-4 text-lg transition">Call Us Now</a>
          </div>
        </div>
        <img src="/banner-img.png" alt="" loading="lazy" className="absolute bottom-0 left-0 w-full opacity-20 pointer-events-none" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      </section>

      {/* INTRO */}
      <section className="py-16" style={{ backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="border-2 border-emerald-500 rounded-lg overflow-hidden bg-[#0a0f1e] h-80 flex items-center justify-center">
              <VideoImage src="https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&w=800" alt={`Pest control in ${city}`} videoUrl={PEST_VIDEOS.general[0]?.url} className="w-full h-full" />
            </div>
            <div>
              <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 mb-4">Professional Pest Control in {city}</h2>
              <p className="text-gray-600 mb-4">Professional pest control serving {city} and surrounding areas. Our certified technicians use the latest treatments to eliminate pests and keep your home protected year-round.</p>
              <p className="text-gray-600 mb-4">From mosquitoes and spiders to rodents and termites, we handle every type of pest common to East Texas. We offer same-day service and free estimates.</p>
              <p className="text-gray-600 mb-6">Don't let pests take over your property. Contact us today for a thorough inspection and customized treatment plan for your {city} home or business.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition text-center">Get a Free Quote</Link>
                <a href={`tel:${phone}`} className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold rounded-lg px-6 py-3 transition text-center">Call {phone}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Our Pest Control Services in {city}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc) => (
              <Link key={svc.name} to={svc.href} className="bg-white rounded-xl p-6 shadow-sm hover:border-emerald-500 border-2 border-gray-100 transition group">
                <span className="text-4xl block mb-3">{svc.icon}</span>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition">{svc.name}</h3>
                <p className="text-emerald-500 text-sm mt-1 font-medium">Learn more →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Why Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-8 h-8 text-emerald-500" />, title: 'Licensed & Certified', desc: 'Fully licensed, bonded, and insured for your peace of mind.' },
              { icon: <Leaf className="w-8 h-8 text-emerald-500" />, title: 'Family Safe', desc: 'Kid and pet-friendly treatments that are tough on pests.' },
              { icon: <MapPin className="w-8 h-8 text-emerald-500" />, title: 'Local Experts', desc: `We know ${city} pests and the best way to eliminate them.` },
              { icon: <Star className="w-8 h-8 text-emerald-500" />, title: 'Satisfaction Guaranteed', desc: "If pests come back, so do we — free of charge." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Location pages use dark navy (not yellow diagonal) */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-4xl md:text-6xl text-white mb-4">Ready for a Pest-Free {city}?</h2>
          <p className="text-gray-300 text-lg mb-8">Same-day service available. Call or request a quote online.</p>
          <Link to="/quote" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-10 py-4 text-lg transition">Get a Free Quote</Link>
        </div>
      </section>

      {/* WE ALSO SERVE */}
      {otherLocations.length >= 2 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">We Also Serve</h2>
            <p className="text-gray-500 text-sm mb-6">Pest control services throughout East Texas</p>
            <div className="flex flex-wrap justify-center gap-3">
              {otherLocations.slice(0, 6).map((loc) => (
                <Link key={loc.slug} to={`/${loc.slug}`} className="px-4 py-2 rounded-full border border-emerald-200 bg-white text-emerald-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-400 transition-colors">
                  {loc.city} Pest Control
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GOOGLE MAPS */}
      {mapsEmbedUrl ? (
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Find Us on the Map</h2>
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100" style={{ height: '400px' }}>
              <iframe src={mapsEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Service area map" />
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center" style={{ height: '300px' }}>
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="font-medium">Map not configured</p>
                <p className="text-sm mt-1">Add a Google Maps embed URL in Settings → Integrations</p>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
