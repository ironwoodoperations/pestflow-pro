import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Leaf, MapPin, Star, Bug, Rat } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import { useTemplate } from '../hooks/useTemplate'
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
  title: "East Texas's Most Trusted Pest Control",
  subtitle: 'Fast. Effective. Guaranteed.',
}

const SERVICES = [
  { icon: '🦟', name: 'Mosquitoes', desc: 'Yard treatments that eliminate mosquitoes at the source.', href: '/mosquito-control' },
  { icon: '🕷️', name: 'Spiders', desc: 'Remove dangerous and nuisance spiders from your home.', href: '/spider-control' },
  { icon: '🐜', name: 'Ants', desc: 'Colony elimination for fire ants, carpenter ants & more.', href: '/ant-control' },
  { icon: '🐝', name: 'Wasps & Hornets', desc: 'Safe nest removal and prevention treatments.', href: '/wasp-control' },
  { icon: '🪳', name: 'Cockroaches', desc: 'Complete roach elimination — inside and out.', href: '/cockroach-control' },
  { icon: '🐀', name: 'Rodents', desc: 'Mice and rat exclusion, trapping & prevention.', href: '/rodent-control' },
]

const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  { id: '1', author_name: 'Sarah M.', content: 'They showed up same day and solved our ant problem completely. Best pest company in Tyler!', rating: 5 },
  { id: '2', author_name: 'James R.', content: 'Professional, on time, and effective. Our mosquito problem is gone. Highly recommend!', rating: 5 },
  { id: '3', author_name: 'Linda K.', content: 'We had a serious roach issue and they knocked it out in one treatment. Amazing service.', rating: 5 },
]

export default function Index() {
  const { tokens } = useTemplate()
  const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT)
  const [testimonials, setTestimonials] = useState<Testimonial[]>(PLACEHOLDER_TESTIMONIALS)

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return

      const [pageRes, testimonialsRes] = await Promise.all([
        supabase
          .from('page_content')
          .select('title, subtitle')
          .eq('tenant_id', tenantId)
          .eq('page_slug', 'home')
          .maybeSingle(),
        supabase
          .from('testimonials')
          .select('id, author_name, content, rating')
          .eq('tenant_id', tenantId)
          .eq('featured', true)
          .limit(3),
      ])

      if (pageRes.data) {
        setContent({
          title: pageRes.data.title || DEFAULT_CONTENT.title,
          subtitle: pageRes.data.subtitle || DEFAULT_CONTENT.subtitle,
        })
      }
      if (testimonialsRes.data && testimonialsRes.data.length > 0) {
        setTestimonials(testimonialsRes.data)
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          background: '#ff6a00',
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="font-bangers tracking-wide text-white text-5xl sm:text-6xl md:text-8xl leading-tight mb-6">
            {content.title}
          </h1>
          <p className="text-white text-xl md:text-2xl mb-8 opacity-90">
            {content.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/quote"
              className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold rounded-lg px-8 py-4 text-lg transition"
            >
              Get a Free Quote
            </Link>
            <Link
              to="/pest-control"
              className="bg-transparent border-2 border-white/50 text-white hover:border-white font-bold rounded-lg px-8 py-4 text-lg transition"
            >
              Our Services
            </Link>
          </div>
          <a href="tel:9035550100" className="text-white text-2xl font-bangers tracking-wide hover:underline">
            📞 (903) 555-0100
          </a>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> 4.9/5 Google Rating
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold">
              <Shield className="w-5 h-5 text-green-600" /> Licensed &amp; Insured
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold">
              <Bug className="w-5 h-5 text-orange-500" /> 12+ Pest Types
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold">
              <MapPin className="w-5 h-5 text-blue-600" /> East Texas Local
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-12">
            Complete Pest Protection
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc) => (
              <Link
                key={svc.name}
                to={svc.href}
                className="bg-gray-100 rounded-xl p-6 hover:border-orange-500 border-2 border-transparent transition group"
              >
                <span className="text-4xl block mb-3">{svc.icon}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition">
                  {svc.name}
                </h3>
                <p className="text-gray-600">{svc.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-12">
            Simple 3-Step Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', color: 'text-orange-500', title: 'Inspect', desc: 'We identify the problem' },
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
              { icon: <Shield className="w-8 h-8 text-orange-500" />, title: 'Licensed & Certified', desc: 'Fully licensed, bonded, and insured for your protection.' },
              { icon: <Leaf className="w-8 h-8 text-green-500" />, title: 'Family Safe', desc: 'Kid and pet-friendly treatments that are tough on pests.' },
              { icon: <MapPin className="w-8 h-8 text-blue-500" />, title: 'East Texas Local', desc: 'We know the local pests and how to beat them.' },
              { icon: <Star className="w-8 h-8 text-yellow-500" />, title: 'Satisfaction Guaranteed', desc: "If pests come back, so do we — at no extra cost." },
            ].map((item) => (
              <div key={item.title} className="bg-gray-100 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bangers tracking-wide text-4xl md:text-5xl text-gray-900 text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="flex-shrink-0 w-80 bg-white rounded-xl p-6 shadow-sm border border-gray-200 snap-start"
              >
                <div className="text-yellow-500 mb-3">
                  {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                </div>
                <p className="text-gray-700 mb-4 italic">"{t.content}"</p>
                <p className="text-gray-900 font-bold">— {t.author_name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section
        className="py-16"
        style={{
          background: '#ff6a00',
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-bangers tracking-wide text-4xl md:text-6xl text-white mb-4">
            Ready to Be Pest-Free?
          </h2>
          <p className="text-white text-lg mb-8 opacity-90">
            Get your free quote today — same-day service available
          </p>
          <Link
            to="/quote"
            className="inline-block bg-white text-orange-600 hover:bg-gray-100 font-bold rounded-lg px-10 py-4 text-lg transition"
          >
            Request a Free Quote
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
