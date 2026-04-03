import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface BusinessInfo { tagline: string; license?: string; founded_year?: string | number; num_technicians?: number; certifications?: string }
interface Customization { hero_headline?: string; show_license?: boolean; show_years?: boolean; show_technicians?: boolean; show_certifications?: boolean }
interface HeroMedia { image_url?: string }

const CREAM = '#f5e6d3'
const RUST = '#c2410c'
const BROWN = '#3b1f0e'

export default function ShellHero() {
  const [biz, setBiz] = useState<BusinessInfo>({ tagline: 'Tough on Pests. Easy on You.' })
  const [custom, setCustom] = useState<Customization>({})
  const [ctaText, setCtaText] = useState('Get a Free Estimate')
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({})

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes, brandRes, custRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
      ])
      if (bizRes.data?.value) {
        const v = bizRes.data.value
        setBiz({ tagline: v.tagline || 'Tough on Pests. Easy on You.', license: v.license, founded_year: v.founded_year, num_technicians: v.num_technicians, certifications: v.certifications })
      }
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
      if (custRes.data?.value) setCustom(custRes.data.value)
    })
  }, [])

  const headline = custom.hero_headline || biz.tagline

  const badges: string[] = []
  if (custom.show_license && biz.license) badges.push(`License #${biz.license}`)
  if (custom.show_years && biz.founded_year) badges.push(`Est. ${biz.founded_year}`)
  if (custom.show_technicians && biz.num_technicians) badges.push(`${biz.num_technicians} Technicians`)
  if (custom.show_certifications && biz.certifications) badges.push(biz.certifications)

  const overlayStyle: React.CSSProperties = heroMedia.image_url
    ? { backgroundImage: `linear-gradient(rgba(59,31,14,0.82), rgba(59,31,14,0.82)), url(${heroMedia.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: BROWN }

  return (
    <section style={overlayStyle} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center md:text-left max-w-3xl">
          <h1 className="font-oswald text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ color: CREAM }}>
            {headline}
          </h1>
          <p className="font-raleway text-lg leading-relaxed mb-8 max-w-xl" style={{ color: 'rgba(245,230,211,0.8)' }}>
            Dependable pest control from people who know this land. We get the job done right the first time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-6">
            <Link
              to="/quote"
              style={{ backgroundColor: RUST, color: CREAM, borderRadius: '4px' }}
              className="inline-flex items-center justify-center font-raleway font-semibold px-8 py-3 transition hover:opacity-90"
            >
              {ctaText}
            </Link>
            <a
              href="tel:"
              style={{ borderColor: CREAM, color: CREAM, borderRadius: '4px' }}
              className="inline-flex items-center justify-center border-2 font-raleway font-semibold px-8 py-3 transition hover:opacity-75"
            >
              Call Now
            </a>
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {badges.map((b) => (
                <span key={b} className="text-xs font-raleway font-semibold px-3 py-1 border" style={{ color: CREAM, borderColor: RUST, borderRadius: '4px' }}>{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
