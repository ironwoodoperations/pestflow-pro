import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface BusinessInfo { tagline: string; founded_year?: string | number }
interface HeroMedia { image_url?: string }

const CREAM = '#f5e6d3'
const RUST = '#c2410c'
const BROWN = '#3b1f0e'

export default function ShellHero() {
  const [info, setInfo] = useState<BusinessInfo>({ tagline: 'Tough on Pests. Easy on You.' })
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({})

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      ])
      if (bizRes.data?.value) {
        const v = bizRes.data.value
        setInfo(prev => ({
          tagline: v.tagline || prev.tagline,
          founded_year: v.founded_year,
        }))
      }
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
    })
  }, [])

  const overlayStyle: React.CSSProperties = heroMedia.image_url
    ? {
        backgroundImage: `linear-gradient(rgba(59,31,14,0.82), rgba(59,31,14,0.82)), url(${heroMedia.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { backgroundColor: BROWN }

  return (
    <section style={overlayStyle} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center md:text-left max-w-3xl">
          <h1 className="font-oswald text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ color: CREAM }}>
            {info.tagline}
          </h1>
          <p className="font-raleway text-lg leading-relaxed mb-8 max-w-xl" style={{ color: 'rgba(245,230,211,0.8)' }}>
            Dependable pest control from people who know this land. We get the job done right the first time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
            <Link
              to="/quote"
              style={{ backgroundColor: RUST, color: CREAM, borderRadius: '4px' }}
              className="inline-flex items-center justify-center font-raleway font-semibold px-8 py-3 transition hover:opacity-90"
            >
              Get a Free Estimate
            </Link>
            <a
              href="tel:"
              style={{ borderColor: CREAM, color: CREAM, borderRadius: '4px' }}
              className="inline-flex items-center justify-center border-2 font-raleway font-semibold px-8 py-3 transition hover:opacity-75"
            >
              Call Now
            </a>
          </div>
          {info.founded_year && (
            <div
              style={{ borderColor: RUST, color: CREAM, borderRadius: '4px' }}
              className="inline-block border text-sm font-raleway px-3 py-1"
            >
              Serving the Region Since {info.founded_year}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
