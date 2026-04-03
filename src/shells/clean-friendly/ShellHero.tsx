import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface HeroMedia { image_url?: string }

export default function ShellHero() {
  const [tagline, setTagline] = useState('Professional Service You Can Trust')
  const [heroMedia, setHeroMedia] = useState<HeroMedia>({})

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, mediaRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'hero_media').maybeSingle(),
      ])
      if (bizRes.data?.value?.tagline) setTagline(bizRes.data.value.tagline)
      if (mediaRes.data?.value) setHeroMedia(mediaRes.data.value)
    })
  }, [])

  const bgStyle = heroMedia.image_url
    ? { backgroundImage: `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url(${heroMedia.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <section
      className="bg-gradient-to-br from-sky-50 to-white py-24 px-4"
      style={bgStyle}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center md:text-left max-w-3xl">
          <div className="inline-block bg-sky-100 text-sky-700 text-xs font-raleway font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Trusted Local Experts
          </div>
          <h1 className="font-raleway text-4xl md:text-6xl font-bold text-slate-800 leading-tight mb-6">
            {tagline}
          </h1>
          <p className="font-raleway text-slate-600 text-lg leading-relaxed mb-8 max-w-xl">
            Fast, friendly, and effective pest control for your home and family. We make it easy to get the help you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-10">
            <Link to="/quote" className="inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-raleway font-semibold rounded-full px-8 py-3 transition shadow-md shadow-sky-200">
              Get Your Free Quote
            </Link>
            <a href="tel:" className="inline-flex items-center justify-center border-2 border-sky-600 text-sky-600 hover:bg-sky-50 font-raleway font-semibold rounded-full px-8 py-3 transition">
              Call Us Now
            </a>
          </div>
          <ul className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start text-slate-600 font-raleway text-sm">
            {['Licensed & Insured', 'Same-Day Service Available', '100% Satisfaction Guaranteed'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
