import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantBootProvider'
import type { PestPageProps } from '../../components/PestPageTemplate'
import { usePageHeroImage } from '../../hooks/usePageHeroImage'
import { usePageContent } from '../../hooks/usePageContent'

const SERVICE_TABS = ['Service FAQ\'s', 'Pest Facts', 'Prevention Tips']

const PEST_IMAGES: Record<string, string> = {
  'pest-control':          '/images/pests/pest_control.jpg',
  'roach-control':         '/images/pests/roach.jpg',
  'rodent-control':        '/images/pests/rodent.jpg',
  'mosquito-control':      '/images/pests/Mosquito.jpg',
  'termite-control':       '/images/pests/termite_control.jpg',
  'termite-inspections':   '/images/pests/termite_inspection.jpg',
  'ant-control':           '/images/pests/ant.jpg',
  'spider-control':        '/images/pests/spider.jpg',
  'bed-bug-control':       '/images/pests/bed_bug.jpg',
  'wasp-hornet-control':   '/images/pests/wasp_hornet.jpg',
  'scorpion-control':      '/images/pests/scorpion.jpg',
  'flea-tick-control':     '/images/pests/flea_tik.jpg',
}

const GUARANTEES = [
  'Satisfaction guaranteed on all service plans',
  'Free callbacks between scheduled services',
  'Licensed and insured technicians',
  'Environmentally responsible products',
  'Transparent pricing — no hidden fees',
]

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="divide-y divide-gray-100">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left flex items-center justify-between py-4 gap-4"
          >
            <span className="font-medium text-sm" style={{ color: 'var(--color-heading)' }}>{item.q}</span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="text-gray-600 text-sm pb-4 leading-relaxed">{item.a}</p>}
        </div>
      ))}
    </div>
  )
}

export default function MetroProServicePage(props: PestPageProps) {
  const heroImageUrl = usePageHeroImage(props.pageSlug)
  const { id: tenantId } = useTenant()
  const [phone, setPhone] = useState('')
  const [bizName, setBizName] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [content, setContent] = useState({ title: '', subtitle: '', intro: '' })

  const { content: pageContent } = usePageContent(tenantId, props.pageSlug)

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      .then(({ data }) => {
        if (data?.value?.phone) setPhone(data.value.phone)
        if (data?.value?.name) setBizName(data.value.name)
      })
  }, [tenantId])

  useEffect(() => {
    if (pageContent) setContent({ title: pageContent.title || '', subtitle: pageContent.subtitle || '', intro: pageContent.intro || '' })
  }, [pageContent])

  const heroTitle = content.title || props.heroTitle
  const serviceName = props.heroHighlight

  // Build service-specific FAQs for tabs
  const tabFaqs = [
    props.faqs, // Service FAQs
    [
      { q: `What are the most common signs of ${serviceName.toLowerCase()} activity?`, a: `Look for droppings, damage, or other physical evidence specific to ${serviceName.toLowerCase()}. A professional inspection can confirm what you're dealing with.` },
      { q: `How quickly can ${serviceName.toLowerCase()} cause damage?`, a: 'Depending on the pest, damage can escalate quickly. Early detection and treatment is always the most cost-effective approach.' },
      { q: `Are ${serviceName.toLowerCase()} dangerous to my family?`, a: 'Some pests pose direct health risks through bites or disease transmission. Others cause structural or property damage. Our technicians will explain the specific risks for your situation.' },
      { q: `What time of year is ${serviceName.toLowerCase()} most active?`, a: 'Activity varies by species and climate. We\'ll advise on the best treatment timing for your region and pest pressure.' },
    ],
    [
      { q: 'What can I do to prevent future infestations?', a: 'Seal entry points, eliminate food and water sources, reduce clutter, and maintain a regular pest control service schedule.' },
      { q: 'How important is perimeter treatment?', a: 'Treating the exterior of your home creates a barrier that stops pests before they get inside. This is the foundation of any good prevention program.' },
      { q: 'Does landscaping affect pest activity?', a: 'Yes. Overgrown vegetation, mulch against foundations, and standing water all create harborage areas and pest pathways. We\'ll identify these during our inspection.' },
      { q: 'How often should I schedule preventive treatments?', a: 'Quarterly service is our most popular option for year-round protection. We also offer monthly and bi-monthly plans for higher-risk properties.' },
    ],
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      {/* Interior hero */}
      <section className="py-16 md:py-20 relative overflow-hidden" style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        {heroImageUrl && <div className="absolute inset-0 bg-black/60" style={{ zIndex: 0, pointerEvents: 'none' }} />}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">{heroTitle}</h1>
          <p className="text-white/70 text-lg">{content.subtitle || props.heroSubtitle}</p>
        </div>
      </section>

      {/* Breadcrumb bar */}
      <nav className="py-3 shadow-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-sm text-white/80">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <Link to="/pest-control" className="hover:text-white transition">Services</Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <span className="text-white font-medium">{serviceName}</span>
        </div>
      </nav>

      {/* Split intro */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Service image */}
          <div
            className="rounded-xl overflow-hidden relative"
            style={{
              minHeight: '280px',
              backgroundImage: `url(${PEST_IMAGES[props.pageSlug] || '/images/pests/pest_control.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
            <div className="relative z-10 h-full min-h-[280px] flex items-center justify-center">
              <span className="text-white text-xl font-semibold">{serviceName}</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>{props.introHeading}</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">{content.intro || props.introP1}</p>
            <p className="text-gray-600 mb-6 leading-relaxed">{props.introP2}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/quote" className="font-semibold px-6 py-3 rounded-lg text-white text-center transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
                Schedule Inspection
              </Link>
              {phone && (
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-semibold px-6 py-3 rounded-lg text-center transition hover:bg-gray-50" style={{ border: '2px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                  Call {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-hero)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            How Our {serviceName} Process Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {props.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4" style={{ backgroundColor: 'var(--color-accent)' }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learn More tab section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--color-heading)' }}>
            Learn More About {serviceName}
          </h2>
          <div className="flex gap-2 mb-6 flex-wrap">
            {SERVICE_TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className="px-5 py-2 rounded-full text-sm font-medium transition"
                style={activeTab === i ? { backgroundColor: 'var(--color-primary)', color: '#fff' } : { backgroundColor: '#f1f3f5', color: '#555' }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="border border-gray-100 rounded-xl px-6 bg-gray-50">
            <Accordion items={tabFaqs[activeTab] || props.faqs} />
          </div>
        </div>
      </section>

      {/* Year-round protection strip */}
      <section className="py-12" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-white text-center mb-6">Year-Round Protection — What's Included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GUARANTEES.map((g, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/90">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                {g}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-cta)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Get Started Today</h2>
          <p className="text-white/70 mb-8">
            {bizName ? `${bizName} is ready to help with your ${serviceName.toLowerCase()} problem.` : `Our team is ready to help.`} Same-day appointments available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote" className="font-semibold px-8 py-3.5 rounded-lg text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
              Schedule Inspection
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-semibold px-8 py-3.5 rounded-lg transition hover:bg-white/20 text-white" style={{ border: '2px solid rgba(255,255,255,0.4)' }}>
                Call Now
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
