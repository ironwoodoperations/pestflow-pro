import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface LocationItem { slug: string; city: string }

const FALLBACK_CITIES: LocationItem[] = [
  { slug: 'tyler-tx', city: 'Tyler' }, { slug: 'longview-tx', city: 'Longview' },
  { slug: 'jacksonville-tx', city: 'Jacksonville' }, { slug: 'lindale-tx', city: 'Lindale' },
  { slug: 'bullard-tx', city: 'Bullard' }, { slug: 'whitehouse-tx', city: 'Whitehouse' },
]

export default function ServiceArea() {
  const [locations, setLocations] = useState<LocationItem[]>(FALLBACK_CITIES)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const { data } = await supabase.from('location_data').select('slug, city').eq('tenant_id', tenantId).eq('is_live', true)
      if (data && data.length > 0) setLocations(data)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-bangers tracking-wide text-white text-5xl md:text-7xl mb-4">Our East Texas <span className="text-emerald-400">Service Area</span></h1>
          <p className="text-gray-300 text-xl">We proudly serve Tyler, TX and surrounding communities within 50 miles.</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Communities We Serve</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {locations.map((loc) => (
              <Link key={loc.slug} to={`/${loc.slug}`} className="bg-white border-2 border-gray-200 hover:border-emerald-500 rounded-xl p-4 text-center transition group shadow-sm">
                <MapPin className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-gray-900 font-bold group-hover:text-emerald-600 transition">{loc.city}</h3>
                <p className="text-gray-500 text-sm">Pest Control</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border border-gray-200 rounded-xl h-[400px] flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Service Area Map — Configure in Admin</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 mb-4">Don't See Your City?</h2>
          <p className="text-gray-600 mb-8">We may still serve your area. Give us a call to find out.</p>
          <a href="tel:9035550100" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-10 py-4 text-lg transition">Call (903) 555-0100</a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
