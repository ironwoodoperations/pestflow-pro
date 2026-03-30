import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Leaf, MapPin, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from './Navbar'
import Footer from './Footer'

export interface TreatmentStep {
  title: string
  desc: string
}

export interface SpecialCard {
  title: string
  desc: string
}

export interface FAQItem {
  q: string
  a: string
}

export interface PestPageProps {
  pageSlug: string
  heroTitle: string
  heroHighlight: string
  heroSubtitle: string
  introHeading: string
  introP1: string
  introP2: string
  introP3: string
  steps: TreatmentStep[]
  stepColors?: string[]
  specialSectionTitle: string
  specialCards: SpecialCard[]
  faqs: FAQItem[]
  eastTexasCTATitle: string
  pricingCards?: { name: string; price: string; desc: string }[]
}

const STEP_COLORS_DEFAULT = ['bg-emerald-500', 'bg-yellow-500', 'bg-teal-500', 'bg-slate-600']

export default function PestPageTemplate(props: PestPageProps) {
  const [content, setContent] = useState({ title: '', subtitle: '', intro: '' })
  const [phone, setPhone] = useState('(903) 555-0100')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [pageRes, settingsRes] = await Promise.all([
        supabase.from('page_content').select('title, subtitle, intro').eq('tenant_id', tenantId).eq('page_slug', props.pageSlug).maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      ])
      if (pageRes.data) setContent({ title: pageRes.data.title || '', subtitle: pageRes.data.subtitle || '', intro: pageRes.data.intro || '' })
      if (settingsRes.data?.value?.phone) setPhone(settingsRes.data.value.phone)
    })
  }, [props.pageSlug])

  const heroTitle = content.title || props.heroTitle
  const stepColors = props.stepColors || STEP_COLORS_DEFAULT

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 60%, #0f3d2e 100%)' }}>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-bangers tracking-wide text-white text-5xl md:text-7xl mb-4">
            {heroTitle.split(props.heroHighlight).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <span className="text-emerald-400">{props.heroHighlight}</span>}
              </span>
            ))}
          </h1>
          <p className="text-gray-300 text-xl mb-8">{content.subtitle || props.heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-8 py-4 text-lg transition">Get a Free Quote</Link>
            <a href={`tel:${phone}`} className="border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold rounded-lg px-8 py-4 text-lg transition">Call Us Now</a>
          </div>
        </div>
        <img src="/banner-img.png" alt="" className="absolute bottom-0 left-0 w-full opacity-20 pointer-events-none" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      </section>

      {/* INTRO */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="border-2 border-emerald-500 rounded-lg bg-[#0a0f1e] h-72 flex items-center justify-center">
              <span className="text-emerald-400 text-xl font-semibold">{props.heroHighlight}</span>
            </div>
            <div>
              <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 mb-4">{props.introHeading}</h2>
              <p className="text-gray-600 mb-4">{content.intro || props.introP1}</p>
              <p className="text-gray-600 mb-4">{props.introP2}</p>
              <p className="text-gray-600 mb-6">{props.introP3}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition text-center">Get a Free Quote</Link>
                <a href={`tel:${phone}`} className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold rounded-lg px-6 py-3 transition text-center">Call {phone}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TREATMENT STEPS */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-12">Our Treatment Process</h2>
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
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Why Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-8 h-8 text-emerald-500" />, title: 'Licensed & Certified', desc: 'Fully licensed, bonded, and insured for your protection.' },
              { icon: <Leaf className="w-8 h-8 text-emerald-500" />, title: 'Family & Pet Safe', desc: 'EPA-approved treatments safe for your whole family.' },
              { icon: <MapPin className="w-8 h-8 text-emerald-500" />, title: 'East Texas Local', desc: 'We know local pests and how to beat them.' },
              { icon: <Star className="w-8 h-8 text-emerald-500" />, title: 'Satisfaction Guaranteed', desc: "If pests come back, so do we — free of charge." },
            ].map((item) => (
              <div key={item.title} className="bg-[#f8fafc] rounded-xl p-6 text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIAL SECTION */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">{props.specialSectionTitle}</h2>
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

      {/* DARK NAVY CTA */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-white mb-4">Ready to Be Pest-Free?</h2>
            <p className="text-gray-300 mb-6">Same-day service available. Request your free quote today.</p>
            <Link to="/quote" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-8 py-4 text-lg transition">Get a Free Quote</Link>
          </div>
          <div className="hidden md:flex border-2 border-emerald-500 rounded-lg bg-[#0a0f1e]/50 h-56 items-center justify-center">
            <span className="text-emerald-400/50 text-lg">Service Photo</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-3xl md:text-4xl text-gray-900 text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {props.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EAST TEXAS YELLOW CTA */}
      <section className="relative py-16" style={{ background: '#f5c518', clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center pt-8">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-[#0a0f1e] mb-4">{props.eastTexasCTATitle}</h2>
          <p className="text-[#0a0f1e]/70 text-lg mb-8">Serving Tyler, Longview, and all of East Texas</p>
          <Link to="/quote" className="inline-block bg-[#0a0f1e] hover:bg-[#1a2744] text-white font-bold rounded-lg px-10 py-4 text-lg transition">Request a Free Quote</Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
