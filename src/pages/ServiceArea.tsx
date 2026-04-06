import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'
import GoogleMapEmbed from '../components/common/GoogleMapEmbed'

interface LocationItem { slug: string; city: string }

const FALLBACK_CITIES: LocationItem[] = [
  { slug: 'tyler-tx', city: 'Tyler' }, { slug: 'longview-tx', city: 'Longview' },
  { slug: 'jacksonville-tx', city: 'Jacksonville' }, { slug: 'lindale-tx', city: 'Lindale' },
  { slug: 'bullard-tx', city: 'Bullard' }, { slug: 'whitehouse-tx', city: 'Whitehouse' },
]

export default function ServiceArea() {
  const [locations, setLocations] = useState<LocationItem[]>(FALLBACK_CITIES)
  const [address, setAddress] = useState('')
  const [mapsApiKey, setMapsApiKey] = useState('')
  const [phone, setPhone] = useState('')
  const [heroTitle, setHeroTitle] = useState('Our East Texas <span class="text-emerald-400">Service Area</span>')
  const [heroSubtitle, setHeroSubtitle] = useState('We proudly serve Tyler, TX and surrounding communities within 50 miles.')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [locRes, bizRes, intgRes, contentRes] = await Promise.all([
        supabase.from('location_data').select('slug, city').eq('tenant_id', tenantId).eq('is_live', true),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tenantId).eq('page_slug', 'service-area').maybeSingle(),
      ])
      if (locRes.data && locRes.data.length > 0) setLocations(locRes.data)
      if (bizRes.data?.value?.address) setAddress(bizRes.data.value.address)
      if (bizRes.data?.value?.phone) setPhone(bizRes.data.value.phone)
      if (intgRes.data?.value?.google_maps_api_key) setMapsApiKey(intgRes.data.value.google_maps_api_key)
      if (contentRes.data?.title) setHeroTitle(contentRes.data.title)
      if (contentRes.data?.subtitle) setHeroSubtitle(contentRes.data.subtitle)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug="service-area" />

      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-white text-5xl md:text-7xl mb-4" dangerouslySetInnerHTML={{ __html: heroTitle }} />
          <p className="text-gray-300 text-xl">{heroSubtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Communities We Serve</h2>
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
          <GoogleMapEmbed address={address || '1204 S. Main Street, Tyler, TX 75701'} apiKey={mapsApiKey || undefined} />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 mb-4">Don't See Your City?</h2>
          <p className="text-gray-600 mb-8">We may still serve your area. Give us a call to find out.</p>
          {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-10 py-4 text-lg transition">Call {phone}</a>}
        </div>
      </section>

    </div>
  )
}
