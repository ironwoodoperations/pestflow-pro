import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Leaf, MapPin, Star, Bug, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface PageContent {
  title: string
  subtitle: string
}

interface Testimonial {
  id: string
  author_name: string
  content: string
  rating: number
}

const DEFAULT_CONTENT: PageContent = {
  title: 'Protect Your Home from Unwanted Pests',
  subtitle: 'Licensed & insured professionals serving East Texas with fast, effective pest control.',
}

const SERVICES = [
  { icon: '🦟', name: 'Mosquito Control', desc: 'Yard treatments that eliminate mosquitoes at the source.', href: '/mosquito-control' },
  { icon: '🕷️', name: 'Spider Control', desc: 'Remove dangerous and nuisance spiders from your home.', href: '/spider-control' },
  { icon: '🐜', name: 'Ant Control', desc: 'Colony elimination for fire ants, carpenter ants & more.', href: '/ant-control' },
  { icon: '🐝', name: 'Wasp & Hornet Control', desc: 'Safe nest removal and prevention treatments.', href: '/wasp-hornet-control' },
  { icon: '🪳', name: 'Cockroach Control', desc: 'Complete roach elimination — inside and out.', href: '/roach-control' },
  { icon: '🐀', name: 'Rodent Control', desc: 'Mice and rat exclusion, trapping & prevention.', href: '/rodent-control' },
]

const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  { id: '1', author_name: 'Sarah M.', content: 'They showed up same day and solved our ant problem completely. Best pest company in Tyler!', rating: 5 },
  { id: '2', author_name: 'James R.', content: 'Professional, on time, and effective. Our mosquito problem is gone. Highly recommend!', rating: 5 },
  { id: '3', author_name: 'Linda K.', content: 'We had a serious roach issue and they knocked it out in one treatment. Amazing service.', rating: 5 },
]

export default function Index() {
  const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT)
  const [testimonials, setTestimonials] = useState<Testimonial[]>(PLACEHOLDER_TESTIMONIALS)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [pageRes, testimonialsRes] = await Promise.all([
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
        supabase.from('testimonials').select('id, author_name, content, rating').eq('tenant_id', tenantId).eq('featured', true).limit(3),
      ])
      if (pageRes.data) {
        setContent({ title: pageRes.data.title || DEFAULT_CONTENT.title, subtitle: pageRes.data.subtitle || DEFAULT_CONTENT.subtitle })
      }
      if (testimonialsRes.data && testimonialsRes.data.length > 0) setTestimonials(testimonialsRes.data)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '600px', background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}
      >
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm mb-6">
            <Shield className="w-4 h-4" /> Licensed & Insured Professionals
          </div>
          <h1 className="font-bangers tracking-wide text-white text-5xl sm:text-6xl md:text-8xl leading-tight mb-6">
            Protect Your Home from{' '}
            <span className="text-emerald-400">Unwanted Pests</span>
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            {content.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-8 py-4 text-lg transition">
              Get a Free Quote
            </Link>
            <Link to="/pest-control" className="border-2 border-white/30 text-white hover:border-white font-bold rounded-lg px-8 py-4 text-lg transition">
              Our Services
            </Link>
          </div>
          <a href="tel:9035550100" className="text-gray-300 text-xl font-semibold hover:text-white transition">
            (903) 555-0100
          </a>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-[#1e293b] py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '2,500+', label: 'Happy Customers', icon: <Star className="w-5 h-5" /> },
              { num: '15+', label: 'Years Experience', icon: <Shield className="w-5 h-5" /> },
              { num: '99%', label: 'Satisfaction Rate', icon: <Bug className="w-5 h-5" /> },
              { num: '<2hrs', label: 'Response Time', icon: <Clock className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-emerald-400 text-2xl md:text-3xl font-bold">{stat.num}</div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-12">
            Our Pest Control Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc) => (
              <Link key={svc.name} to={svc.href} className="bg-white rounded-xl p-6 shadow-sm hover:border-emerald-500 border-2 border-gray-100 transition group">
                <span className="text-4xl block mb-3">{svc.icon}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition">{svc.name}</h3>
                <p className="text-gray-600">{svc.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-12">
            Simple 3-Step Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', color: 'text-emerald-500', title: 'Inspect', desc: 'We identify the problem' },
              { num: '2', color: 'text-yellow-500', title: 'Treat', desc: 'We eliminate the pests' },
              { num: '3', color: 'text-teal-500', title: 'Protect', desc: 'We keep them gone' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <span className={`font-bangers text-8xl ${step.color} opacity-30 block`}>{step.num}</span>
                <h3 className="text-2xl font-bold text-gray-900 -mt-4 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-12">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-8 h-8 text-emerald-500" />, title: 'Licensed & Certified', desc: 'Fully licensed, bonded, and insured for your protection.' },
              { icon: <Leaf className="w-8 h-8 text-emerald-500" />, title: 'Family Safe', desc: 'Kid and pet-friendly treatments that are tough on pests.' },
              { icon: <MapPin className="w-8 h-8 text-emerald-500" />, title: 'East Texas Local', desc: 'We know the local pests and how to beat them.' },
              { icon: <Star className="w-8 h-8 text-emerald-500" />, title: 'Satisfaction Guaranteed', desc: "If pests come back, so do we — at no extra cost." },
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

      {/* TESTIMONIALS */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
            {testimonials.map((t) => (
              <div key={t.id} className="flex-shrink-0 w-80 bg-white rounded-xl p-6 shadow-sm border border-gray-200 snap-start">
                <div className="text-yellow-500 mb-3">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                <p className="text-gray-700 mb-4 italic">"{t.content}"</p>
                <p className="text-gray-900 font-bold">— {t.author_name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-bangers tracking-wide text-4xl md:text-6xl text-white mb-4">Ready to Be Pest-Free?</h2>
          <p className="text-gray-300 text-lg mb-8">Get your free quote today — same-day service available</p>
          <Link to="/quote" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-10 py-4 text-lg transition">
            Request a Free Quote
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
