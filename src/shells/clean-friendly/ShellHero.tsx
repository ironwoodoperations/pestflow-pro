import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface BusinessInfo { tagline: string; license?: string; founded_year?: string | number; num_technicians?: number; certifications?: string }
interface Customization { hero_headline?: string; show_license?: boolean; show_years?: boolean; show_technicians?: boolean; show_certifications?: boolean }
interface HeroMedia { image_url?: string }

export default function ShellHero() {
  const [biz, setBiz] = useState<BusinessInfo>({ tagline: 'Professional Service You Can Trust' })
  const [custom, setCustom] = useState<Customization>({})
  const [ctaText, setCtaText] = useState('Get Your Free Quote')
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
        setBiz({ tagline: v.tagline || 'Professional Service You Can Trust', license: v.license, founded_year: v.founded_year, num_technicians: v.num_technicians, certifications: v.certifications })
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

  const bgStyle = heroMedia.image_url
    ? { backgroundImage: `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url(${heroMedia.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <section className="bg-gradient-to-br from-sky-50 to-white py-24 px-4" style={bgStyle}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center md:text-left max-w-3xl">
          <div className="inline-block bg-sky-100 text-sky-700 text-xs font-raleway font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Trusted Local Experts
          </div>
          <h1 className="font-raleway text-4xl md:text-6xl font-bold text-slate-800 leading-tight mb-6">{headline}</h1>
          <p className="font-raleway text-slate-600 text-lg leading-relaxed mb-8 max-w-xl">
            Fast, friendly, and effective pest control for your home and family. We make it easy to get the help you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-6">
            <Link to="/quote" className="inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-raleway font-semibold rounded-full px-8 py-3 transition shadow-md shadow-sky-200">
              {ctaText}
            </Link>
            <a href="tel:" className="inline-flex items-center justify-center border-2 border-sky-600 text-sky-600 hover:bg-sky-50 font-raleway font-semibold rounded-full px-8 py-3 transition">
              Call Us Now
            </a>
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {badges.map((b) => (
                <span key={b} className="bg-sky-100 text-sky-700 text-xs font-raleway font-semibold px-3 py-1 rounded-full border border-sky-200">{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
