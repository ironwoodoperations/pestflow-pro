import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import ServicesGrid from '../../components/public/ServicesGrid'

const STEPS = [
  { num: '1', title: 'Call Us', desc: 'Reach us anytime — same-day available.' },
  { num: '2', title: 'Free Inspection', desc: 'We assess your property at no cost.' },
  { num: '3', title: 'Treatment Plan', desc: 'A custom plan built for your situation.' },
  { num: '4', title: 'Guaranteed', desc: 'We come back if pests return.' },
]

interface Biz { phone?: string }
interface Testimonial { id: string; author_name: string; review_text: string; rating: number }

export default function ShellHomeSections() {
  const [biz, setBiz] = useState<Biz>({})
  const [featured, setFeatured] = useState<Testimonial | null>(null)
  const [ctaText, setCtaText] = useState('Get a Free Quote')

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, testRes, brandRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('testimonials').select('id,author_name,review_text,rating').eq('tenant_id', tenantId).eq('featured', true).limit(1),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (testRes.data?.length) setFeatured(testRes.data[0])
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
    })
  }, [])

  return (
    <>
      {/* Process Steps */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center px-4">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 w-1/2 h-px bg-slate-200" />
                )}
                <div className="text-8xl font-bold text-slate-200 leading-none select-none">{step.num}</div>
                <h3 className="text-slate-800 font-semibold text-lg -mt-4 mb-1">{step.title}</h3>
                <p className="text-slate-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServicesGrid ctaText={ctaText} />

      {/* Featured Pull Quote */}
      {featured && (
        <section className="py-20 bg-slate-50 overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="text-8xl text-slate-200 font-serif leading-none select-none mb-4">"</div>
            <p className="text-xl italic text-slate-700 max-w-2xl mx-auto mb-6">{featured.review_text}</p>
            <p className="text-slate-500 text-sm uppercase tracking-widest mb-3">{featured.author_name}</p>
            <div className="text-emerald-500">{'★'.repeat(featured.rating)}</div>
          </div>
        </section>
      )}

      {/* Split Bottom CTA */}
      <section className="flex flex-col md:flex-row min-h-[200px]">
        <div className="flex-1 bg-slate-800 flex flex-col justify-center px-10 py-16">
          <h2 className="font-oswald text-white text-3xl md:text-4xl mb-3 tracking-wide">
            Ready to protect your home?
          </h2>
          <p className="text-slate-400">Expert pest control with a satisfaction guarantee.</p>
        </div>
        <div className="flex-1 bg-emerald-600 flex flex-col justify-center items-center px-10 py-16 gap-4">
          {biz.phone && (
            <a href={`tel:${biz.phone.replace(/\D/g, '')}`}
              className="text-white font-bold text-3xl hover:text-emerald-200 transition">
              {biz.phone}
            </a>
          )}
          <span className="text-emerald-300 text-sm">or</span>
          <a href="/quote"
            className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white hover:text-emerald-600 transition">
            {ctaText}
          </a>
        </div>
      </section>
    </>
  )
}
