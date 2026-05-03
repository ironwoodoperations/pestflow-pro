import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Leaf, MapPin, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import StructuredData from './StructuredData'
import { PEST_PAGE_IMG, FALLBACK_PEST_IMG } from '../data/pestImages'
import { useTemplate } from '../context/TemplateContext'
import { usePageHeroImage } from '../hooks/usePageHeroImage'

const MetroProServicePage = lazy(() => import('../shells/metro-pro/MetroProServicePage'))

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

const WHY = [
  { Icon: Shield, title: 'Licensed & Certified', desc: 'Fully licensed, bonded, and insured for your protection.' },
  { Icon: Leaf,   title: 'Family & Pet Safe',    desc: 'EPA-approved treatments safe for your whole family.' },
  { Icon: MapPin, title: 'East Texas Local',     desc: 'We know local pests and how to beat them.' },
  { Icon: Star,   title: 'Satisfaction Guaranteed', desc: "If pests come back, so do we — free of charge." },
]

export default function PestPageTemplate(props: PestPageProps) {
  const { id: tenantId } = useTenant()
  const { template } = useTemplate()
  const heroImageUrl = usePageHeroImage(props.pageSlug)
  const [content, setContent] = useState({ title: '', subtitle: '', intro: '', image_url: '', image_1_url: '', image_2_url: '' })
  const [phone, setPhone] = useState('')

  useEffect(() => {
    ;(async () => {
      const [pageRes, settingsRes] = await Promise.all([
        supabase.from('page_content').select('title, subtitle, intro, image_url, image_1_url, image_2_url').eq('tenant_id', tenantId).eq('page_slug', props.pageSlug).maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      ])
      if (pageRes.data) setContent({ title: pageRes.data.title || '', subtitle: pageRes.data.subtitle || '', intro: pageRes.data.intro || '', image_url: pageRes.data.image_url || '', image_1_url: pageRes.data.image_1_url || '', image_2_url: pageRes.data.image_2_url || '' })
      if (settingsRes.data?.value?.phone) setPhone(settingsRes.data.value.phone)
    })()
  }, [tenantId, props.pageSlug])

  if (template === 'metro-pro') {
    return <Suspense fallback={null}><MetroProServicePage {...props} /></Suspense>
  }

  const heroTitle = content.title || props.heroTitle
  const pestImg = content.image_1_url || content.image_url || PEST_PAGE_IMG[props.pageSlug] || props.introImage || FALLBACK_PEST_IMG
  const pestImg2 = content.image_2_url || pestImg

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <StructuredData type="WebPage" pageSlug={props.pageSlug} />

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        {heroImageUrl && <div className="absolute inset-0 bg-black/60" style={{ zIndex: 0, pointerEvents: 'none' }} />}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-5xl md:text-7xl mb-4" style={{ color: 'var(--color-nav-text)' }}>
            {heroTitle.split(props.heroHighlight).map((part, i, arr) => (
              <span key={i}>{part}{i < arr.length - 1 && <span style={{ color: 'var(--color-primary)' }}>{props.heroHighlight}</span>}</span>
            ))}
          </h1>
          <p className="text-xl mb-8" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>{content.subtitle || props.heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote" className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Get a Free Quote</Link>
            <a href={`tel:${phone}`} className="border-2 font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>Call Us Now</a>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-xl overflow-hidden shadow-lg aspect-[4/3]">
            <img src={pestImg} alt={`${props.heroHighlight} pest control`} loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-oswald tracking-wide text-3xl md:text-4xl mb-4" style={{ color: 'var(--color-heading)' }}>{props.introHeading}</h2>
            <p className="text-gray-600 mb-4">{content.intro || props.introP1}</p>
            <p className="text-gray-600 mb-4">{props.introP2}</p>
            <p className="text-gray-600 mb-6">{props.introP3}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/quote" className="font-bold rounded-lg px-6 py-3 transition text-center hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Get a Free Quote</Link>
              <a href={`tel:${phone}`} className="border-2 font-bold rounded-lg px-6 py-3 transition text-center hover:opacity-90" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>Call {phone}</a>
            </div>
          </div>
        </div>
      </section>

      {/* TREATMENT STEPS */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-12" style={{ color: 'var(--color-nav-text)' }}>Our Treatment Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {props.steps.map((step, i) => (
              <div key={i} className="rounded-xl p-6 shadow-sm text-center" style={{ backgroundColor: 'var(--color-bg-section)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-btn-text)' }}>{i + 1}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading)' }}>{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-10" style={{ color: 'var(--color-heading)' }}>Why Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-xl p-6 text-center border border-gray-100 shadow-sm" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                <div className="flex justify-center mb-4"><Icon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} /></div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading)' }}>{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIAL SECTION */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-10" style={{ color: 'var(--color-nav-text)' }}>{props.specialSectionTitle}</h2>
          {props.pricingCards ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {props.pricingCards.map((plan) => (
                <div key={plan.name} className="rounded-xl p-6 shadow-sm border-t-[3px] text-center" style={{ backgroundColor: 'var(--color-bg-section)', borderTopColor: 'var(--color-primary)' }}>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-heading)' }}>{plan.name}</h3>
                  <p className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>{plan.price}</p>
                  <p className="text-gray-600 text-sm">{plan.desc}</p>
                </div>
              ))}
              <p className="text-center text-sm col-span-full mt-2" style={{ color: 'var(--color-nav-text)', opacity: 0.7 }}>Call for exact pricing tailored to your property.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {props.specialCards.map((card) => (
                <div key={card.title} className="rounded-xl p-6 shadow-sm border-t-[3px]" style={{ backgroundColor: 'var(--color-bg-section)', borderTopColor: 'var(--color-primary)' }}>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading)' }}>{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* READY TO BE PEST-FREE */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-oswald tracking-wide text-4xl md:text-5xl mb-4" style={{ color: 'var(--color-nav-text)' }}>Ready to Be Pest-Free?</h2>
            <p className="mb-6" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>Same-day service available. Request your free quote today.</p>
            <Link to="/quote" className="inline-block font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Get a Free Quote</Link>
          </div>
          <div className="hidden md:block rounded-xl overflow-hidden shadow-md">
            <img src={pestImg2} alt={`${props.heroHighlight} pest control`} loading="lazy" className="w-full h-56 object-cover" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl text-center mb-10" style={{ color: 'var(--color-heading)' }}>Frequently Asked Questions</h2>
          <div className="space-y-6">
            {props.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading)' }}>{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative py-16" style={{ backgroundColor: 'var(--color-bg-cta)', clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center pt-8">
          <h2 className="font-oswald tracking-wide text-4xl md:text-5xl mb-4" style={{ color: 'var(--color-nav-text)' }}>{props.eastTexasCTATitle}</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>Serving Tyler, Longview, and all of East Texas</p>
          <Link to="/quote" className="inline-block font-bold rounded-lg px-10 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Request a Free Quote</Link>
        </div>
      </section>
    </div>
  )
}
