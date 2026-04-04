import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Leaf, MapPin, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from './StructuredData'
import { PEST_PAGE_IMG, FALLBACK_PEST_IMG } from '../data/pestImages'

export interface TreatmentStep { title: string; desc: string }
export interface SpecialCard { title: string; desc: string }
export interface FAQItem { q: string; a: string }

export interface PestPageProps {
  pageSlug: string; heroTitle: string; heroHighlight: string; heroSubtitle: string
  introHeading: string; introP1: string; introP2: string; introP3: string
  steps: TreatmentStep[]; stepColors?: string[]
  specialSectionTitle: string; specialCards: SpecialCard[]; faqs: FAQItem[]
  eastTexasCTATitle: string
  pricingCards?: { name: string; price: string; desc: string }[]
  introImage?: string; videoUrl?: string
}

const STEP_COLORS_DEFAULT = ['bg-emerald-500', 'bg-yellow-500', 'bg-teal-500', 'bg-slate-600']
const CTA_COLORS: Record<string, string> = {
  'modern-pro': 'bg-emerald-700', 'bold-local': 'bg-amber-600',
  'clean-friendly': 'bg-sky-600',  'rustic-rugged': 'bg-[#8b3a1a]',
}
const WHY = [
  { Icon: Shield, title: 'Licensed & Certified', desc: 'Fully licensed, bonded, and insured for your protection.' },
  { Icon: Leaf,   title: 'Family & Pet Safe',    desc: 'EPA-approved treatments safe for your whole family.' },
  { Icon: MapPin, title: 'East Texas Local',     desc: 'We know local pests and how to beat them.' },
  { Icon: Star,   title: 'Satisfaction Guaranteed', desc: "If pests come back, so do we — free of charge." },
]

export default function PestPageTemplate(props: PestPageProps) {
  const [content, setContent] = useState({ title: '', subtitle: '', intro: '', image_url: '' })
  const [phone, setPhone] = useState('(903) 555-0100')
  const [template, setTemplate] = useState('modern-pro')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [pageRes, settingsRes, brandRes] = await Promise.all([
        supabase.from('page_content').select('title, subtitle, intro, image_url').eq('tenant_id', tenantId).eq('page_slug', props.pageSlug).maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (pageRes.data) setContent({ title: pageRes.data.title || '', subtitle: pageRes.data.subtitle || '', intro: pageRes.data.intro || '', image_url: pageRes.data.image_url || '' })
      if (settingsRes.data?.value?.phone) setPhone(settingsRes.data.value.phone)
      if (brandRes.data?.value?.template) setTemplate(brandRes.data.value.template)
    })
  }, [props.pageSlug])

  const heroTitle = content.title || props.heroTitle
  const stepColors = props.stepColors || STEP_COLORS_DEFAULT
  const pestImg = content.image_url || PEST_PAGE_IMG[props.pageSlug] || props.introImage || FALLBACK_PEST_IMG
  const ctaBgClass = CTA_COLORS[template] || 'bg-yellow-500'

  return (
    <div className="min-h-screen bg-white">
      <StructuredData type="WebPage" pageSlug={props.pageSlug} />

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 60%, #0f3d2e 100%)' }}>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-white text-5xl md:text-7xl mb-4">
            {heroTitle.split(props.heroHighlight).map((part, i, arr) => (
              <span key={i}>{part}{i < arr.length - 1 && <span className="text-emerald-400">{props.heroHighlight}</span>}</span>
            ))}
          </h1>
          <p className="text-gray-300 text-xl mb-8">{content.subtitle || props.heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-8 py-4 text-lg transition">Get a Free Quote</Link>
            <a href={`tel:${phone}`} className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold rounded-lg px-8 py-4 text-lg transition">Call Us Now</a>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-xl overflow-hidden shadow-lg aspect-[4/3]">
            <img src={pestImg} alt={`${props.heroHighlight} pest control`} loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 mb-4">{props.introHeading}</h2>
            <p className="text-gray-600 mb-4">{content.intro || props.introP1}</p>
            <p className="text-gray-600 mb-4">{props.introP2}</p>
            <p className="text-gray-600 mb-6">{props.introP3}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition text-center">Get a Free Quote</Link>
              <a href={`tel:${phone}`} className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold rounded-lg px-6 py-3 transition text-center">Call {phone}</a>
            </div>
          </div>
        </div>
      </section>

      {/* TREATMENT STEPS */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-12">Our Treatment Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {props.steps.map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className={`w-12 h-12 ${stepColors[i] || 'bg-emerald-500'} text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4`}>{i + 1}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Why Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-[#f8fafc] rounded-xl p-6 text-center">
                <div className="flex justify-center mb-4"><Icon className="w-8 h-8 text-emerald-500" /></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIAL SECTION */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">{props.specialSectionTitle}</h2>
          {props.pricingCards ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {props.pricingCards.map((plan) => (
                <div key={plan.name} className="bg-white rounded-xl p-6 shadow-sm border-t-[3px] border-emerald-500 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-emerald-600 mb-2">{plan.price}</p>
                  <p className="text-gray-600 text-sm">{plan.desc}</p>
                </div>
              ))}
              <p className="text-center text-gray-500 text-sm col-span-full mt-2">Call for exact pricing tailored to your property.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {props.specialCards.map((card) => (
                <div key={card.title} className="bg-white rounded-xl p-6 shadow-sm border-t-[3px] border-emerald-500">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* READY TO BE PEST-FREE */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-oswald tracking-wide text-4xl md:text-5xl text-white mb-4">Ready to Be Pest-Free?</h2>
            <p className="text-gray-300 mb-6">Same-day service available. Request your free quote today.</p>
            <Link to="/quote" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-8 py-4 text-lg transition">Get a Free Quote</Link>
          </div>
          <div className="hidden md:block rounded-xl overflow-hidden shadow-md">
            <img src={pestImg} alt={`${props.heroHighlight} pest control`} loading="lazy" className="w-full h-56 object-cover" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {props.faqs.map((faq, i) => (
              <div key={i}><h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3><p className="text-gray-600">{faq.a}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA — shell-coordinated color */}
      <section className={`relative py-16 ${ctaBgClass}`} style={{ clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center pt-8">
          <h2 className="font-oswald tracking-wide text-4xl md:text-5xl text-white mb-4">{props.eastTexasCTATitle}</h2>
          <p className="text-white/70 text-lg mb-8">Serving Tyler, Longview, and all of East Texas</p>
          <Link to="/quote" className="inline-block bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg px-10 py-4 text-lg transition">Request a Free Quote</Link>
        </div>
      </section>
    </div>
  )
}
