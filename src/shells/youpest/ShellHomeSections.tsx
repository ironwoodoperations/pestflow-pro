import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Clock, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { SERVICES } from './ServicesData'

const ACCENT = '#22c55e'
const DARK   = '#1a1a1a'

const TRUST = [
  { icon: ShieldCheck, title: 'Licensed & Insured', desc: 'Fully licensed and insured technicians on every job.' },
  { icon: Clock,       title: 'Same-Day Service',   desc: 'Call before noon and we\'ll be there today.' },
  { icon: Star,        title: '5-Star Rated',        desc: 'Hundreds of satisfied customers across the area.' },
]

export default function ShellHomeSections() {
  const [businessName, setBusinessName] = useState('You Pest Control')
  const [testimonials, setTestimonials] = useState<{ author_name: string; review_text: string; rating: number }[]>([])

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      const [bizRes, reviewRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('testimonials').select('author_name,review_text,rating')
          .eq('tenant_id', tenantId).eq('featured', true).limit(3),
      ])
      if (bizRes.data?.value?.name) setBusinessName(bizRes.data.value.name)
      if (reviewRes.data?.length) setTestimonials(reviewRes.data)
    })
  }, [])

  return (
    <>
      {/* Trust bar */}
      <section style={{ background: DARK }} className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRUST.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 items-start">
              <div style={{ background: ACCENT + '22' }} className="p-3 rounded-xl flex-shrink-0">
                <Icon size={22} style={{ color: ACCENT }} />
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-1">{title}</p>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-white font-black text-3xl text-center mb-2">Our Services</h2>
          <p className="text-gray-400 text-center mb-10">Professional solutions for every pest problem.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(s => (
              <div key={s.name} className="bg-gray-900 rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform">
                {s.img && <img src={s.img} alt={s.name} className="w-full h-40 object-cover" loading="lazy" />}
                <div className="p-5">
                  <p style={{ color: ACCENT }} className="font-bold mb-1">{s.name}</p>
                  <p className="text-gray-400 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: ACCENT }} className="py-16 px-4 text-center">
        <h2 className="text-white font-black text-3xl mb-4">Ready to Live Pest-Free?</h2>
        <p className="text-green-100 mb-8 text-lg">Contact {businessName} today for a free inspection.</p>
        <Link to="/contact"
          className="inline-block bg-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg"
          style={{ color: DARK }}>
          Get a Free Inspection
        </Link>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 px-4 bg-gray-950">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-white font-black text-3xl text-center mb-10">What Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl p-6">
                  <div className="flex mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm mb-4">"{t.review_text}"</p>
                  <p className="text-white font-semibold text-sm">— {t.author_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
