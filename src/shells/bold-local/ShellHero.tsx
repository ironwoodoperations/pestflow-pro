import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface BusinessInfo { tagline: string; license?: string; founded_year?: string | number; num_technicians?: number; certifications?: string }
interface Customization { hero_headline?: string; show_license?: boolean; show_years?: boolean; show_technicians?: boolean; show_certifications?: boolean }
interface HeroMedia { image_url?: string }

export default function ShellHero() {
  const [biz, setBiz] = useState<BusinessInfo>({ tagline: 'Local Pest Control You Can Count On' })
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
        setBiz({ tagline: v.tagline || 'Local Pest Control You Can Count On', license: v.license, founded_year: v.founded_year, num_technicians: v.num_technicians, certifications: v.certifications })
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

  const sectionStyle = heroMedia.image_url
    ? { backgroundImage: `url(${heroMedia.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <section className="relative bg-[#1c1c1c] text-white py-24 px-4 overflow-hidden" style={sectionStyle}>
      {heroMedia.image_url && <div className="absolute inset-0 bg-[#1c1c1c]/75" />}
      <div className="absolute top-0 right-0 w-2 h-full bg-[#d97706]" aria-hidden="true" />
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-block bg-[#d97706] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          Local. Trusted. Proven.
        </div>
        <h1 className="font-oswald text-5xl md:text-6xl font-bold tracking-wide mb-6 leading-tight text-white">
          {headline}
        </h1>
        <Link to="/quote" className="inline-block bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-lg px-8 py-4 rounded-xl transition shadow-lg shadow-amber-900/40 mb-6">
          {ctaText}
        </Link>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {badges.map((b) => (
              <span key={b} className="bg-[#d97706]/20 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/30">{b}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
