import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'
import { formatPhone } from '../lib/formatPhone'
import GoogleMapEmbed from '../components/common/GoogleMapEmbed'
import { useTemplate } from '../context/TemplateContext'

const DangServiceAreaMap = lazy(() => import('../shells/dang/components/DangServiceAreaMap'))

interface LocationItem { slug: string; city: string }

const FALLBACK_CITIES: LocationItem[] = [
  { slug: 'tyler-tx', city: 'Tyler' }, { slug: 'longview-tx', city: 'Longview' },
  { slug: 'jacksonville-tx', city: 'Jacksonville' }, { slug: 'lindale-tx', city: 'Lindale' },
  { slug: 'bullard-tx', city: 'Bullard' }, { slug: 'whitehouse-tx', city: 'Whitehouse' },
]

export default function ServiceArea() {
  const { template } = useTemplate()
  const [locations, setLocations] = useState<LocationItem[]>(FALLBACK_CITIES)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [mapsApiKey, setMapsApiKey] = useState('')
  const [heroTitle, setHeroTitle] = useState('Our Service Area')
  const [heroSubtitle, setHeroSubtitle] = useState('We proudly serve your community and surrounding areas within 50 miles.')

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

  const isDang = template === 'dang'

  return (
    <div className="min-h-screen" style={{ backgroundColor: isDang ? '#faf7f4' : 'var(--color-bg-section)' }}>
      <StructuredData type="WebPage" pageSlug="service-area" />

      {isDang ? (
        <section style={{
          position: 'relative',
          background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`,
          paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
            <h1 style={{
              fontFamily: '"Bangers", cursive',
              fontSize: 'clamp(42px, 7vw, 88px)',
              color: 'hsl(45, 95%, 60%)',
              fontStyle: 'italic', letterSpacing: '0.05em',
              WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000',
              margin: 0, lineHeight: 1.05,
            }}>
              {heroTitle.toUpperCase()}
            </h1>
            <p style={{ color: '#fff', fontSize: '1.1rem', marginTop: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
              {heroSubtitle}
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
            <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
          </div>
        </section>
      ) : (
        <section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="font-oswald tracking-wide text-5xl md:text-7xl mb-4" style={{ color: 'var(--color-nav-text)' }} dangerouslySetInnerHTML={{ __html: heroTitle }} />
            <p className="text-xl" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>{heroSubtitle}</p>
          </div>
        </section>
      )}

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-10" style={{ color: 'var(--color-heading)' }}>Communities We Serve</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {locations.map((loc) => (
              <Link key={loc.slug} to={`/${loc.slug}`} className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center transition group shadow-sm hover:border-[color:var(--color-primary)]">
                <MapPin className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                <h3 className="font-bold transition group-hover:text-[color:var(--color-primary)]" style={{ color: 'var(--color-heading)' }}>{loc.city}</h3>
                <p className="text-gray-500 text-sm">Pest Control</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: isDang ? '#fff' : 'var(--color-bg-cta)' }}>
        <div className="max-w-4xl mx-auto px-4">
          {isDang ? (
            <Suspense fallback={<div style={{ height: '400px', background: '#f5f0ea', borderRadius: '0.75rem' }} />}>
              <DangServiceAreaMap />
            </Suspense>
          ) : (
            <GoogleMapEmbed address={address || '1204 S. Main Street, Tyler, TX 75701'} apiKey={mapsApiKey || undefined} />
          )}
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl mb-4" style={{ color: 'var(--color-heading)' }}>Don't See Your City?</h2>
          <p className="text-gray-600 mb-8">We may still serve your area. Give us a call to find out.</p>
          {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} className="inline-block font-bold rounded-lg px-10 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Call {formatPhone(phone)}</a>}
        </div>
      </section>

    </div>
  )
}
