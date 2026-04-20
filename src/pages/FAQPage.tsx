import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import StructuredData from '../components/StructuredData'
import { usePageHeroImage } from '../hooks/usePageHeroImage'

const FAQ_CATEGORIES = [
  {
    title: 'General',
    faqs: [
      { q: 'What pests do you treat?', a: 'We treat all common East Texas pests including mosquitoes, spiders, ants, wasps, cockroaches, fleas, ticks, rodents, scorpions, bed bugs, and termites.' },
      { q: 'Are you licensed and insured?', a: 'Yes. We are fully licensed by the Texas Department of Agriculture, bonded, and insured. All technicians hold current pest control licenses.' },
      { q: 'Do you offer free estimates?', a: 'Yes. We provide free inspections and estimates for all pest control services. Call us or fill out our online quote form to schedule.' },
      { q: 'What areas do you serve?', a: 'We serve Tyler, Longview, Jacksonville, Lindale, Bullard, Whitehouse, and all of East Texas within a 50-mile radius.' },
    ],
  },
  {
    title: 'Treatments',
    faqs: [
      { q: 'Are your treatments safe for kids and pets?', a: 'Yes. All products are EPA-approved and applied by licensed technicians. Treatments are safe once dry, typically within 30-60 minutes.' },
      { q: 'How long do treatments take?', a: 'Most treatments take 45-90 minutes depending on the size of your home and the type of pest being treated.' },
      { q: 'Do I need to leave my home during treatment?', a: 'For most treatments, no. We will advise you if any specific precautions are needed for your particular treatment plan.' },
      { q: 'How soon will I see results?', a: 'Many pests are eliminated within 24-48 hours. Some treatments (like bait systems) take 1-2 weeks to fully eliminate the colony. Your technician will set expectations.' },
    ],
  },
  {
    title: 'Pricing',
    faqs: [
      { q: 'How much does pest control cost?', a: 'Costs vary by service type and home size. General pest control plans start at $49/month. Contact us for a free estimate tailored to your needs.' },
      { q: 'Do you offer service plans?', a: 'Yes. We offer monthly, quarterly, and annual plans. Plans include scheduled treatments plus free re-treatments between visits if pests return.' },
      { q: 'Do you offer a guarantee?', a: 'Yes. All services are backed by our satisfaction guarantee. If pests return between scheduled treatments, we will retreat at no additional cost.' },
    ],
  },
]

export default function FAQPage() {
  const heroImageUrl = usePageHeroImage('faq')
  const [heroTitle, setHeroTitle] = useState('Frequently Asked Questions')
  const [heroSubtitle, setHeroSubtitle] = useState('Everything you need to know about our pest control services.')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    resolveTenantId().then(async (tid) => {
      if (!tid) return
      const [pageRes, bizRes] = await Promise.all([
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tid).eq('page_slug', 'faq').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tid).eq('key', 'business_info').maybeSingle(),
      ])
      if (pageRes.data?.title) setHeroTitle(pageRes.data.title)
      if (pageRes.data?.subtitle) setHeroSubtitle(pageRes.data.subtitle)
      if (bizRes.data?.value?.phone) setPhone(bizRes.data.value.phone)
    })
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <StructuredData type="WebPage" pageSlug="faq" />

      <section className="relative py-20 md:py-28" style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        {heroImageUrl && <div className="absolute inset-0 bg-black/60" style={{ zIndex: 0, pointerEvents: 'none' }} />}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-5xl md:text-7xl mb-4" style={{ color: 'var(--color-nav-text)' }}>{heroTitle}</h1>
          <p className="text-xl" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>{heroSubtitle}</p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-4xl mx-auto px-4">
          {FAQ_CATEGORIES.map((cat) => (
            <div key={cat.title} className="mb-12">
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>{cat.title}</h2>
              <div className="space-y-6">
                {cat.faqs.map((faq, i) => (
                  <div key={i}>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading)' }}>{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-oswald tracking-wide text-3xl md:text-4xl mb-4" style={{ color: 'var(--color-nav-text)' }}>Still Have Questions?</h2>
          <p className="mb-8" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>We're here to help. Call us or request a quote online.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={`tel:${phone}`} className="border-2 font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>Call Us Now</a>
            <Link to="/quote" className="font-bold rounded-lg px-8 py-4 text-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>Get a Free Quote</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
