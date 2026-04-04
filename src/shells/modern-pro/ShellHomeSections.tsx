import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { SERVICES } from './ServicesData'

interface Biz { founded_year?: string | number; num_technicians?: number; phone?: string }
interface Testimonial { id: string; author_name: string; review_text: string; rating: number }

export default function ShellHomeSections() {
  const [biz, setBiz] = useState<Biz>({})
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, testRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('testimonials').select('id,author_name,review_text,rating').eq('tenant_id', tenantId).eq('featured', true).limit(3),
      ])
      if (bizRes.data?.value) setBiz(bizRes.data.value)
      if (testRes.data?.length) setTestimonials(testRes.data)
    })
  }, [])

  return (
    <>
      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald text-4xl text-gray-900 text-center mb-10 tracking-wide">Our Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.name} className="bg-slate-800 rounded-xl overflow-hidden hover:bg-slate-700 transition">
                <img src={s.img} alt={s.name} loading="lazy" className="w-full h-36 object-cover" />
                <div className="p-5">
                  <h3 className="text-white font-bold text-lg mb-1">{s.name}</h3>
                  <p className="text-slate-400 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us — 3 stat cards */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-emerald-400 text-4xl font-bold">
                {biz.founded_year ? `Est. ${biz.founded_year}` : 'Est.'}
              </div>
              <div className="text-slate-400 text-sm mt-1">Founded</div>
            </div>
            <div>
              <div className="text-emerald-400 text-4xl font-bold">
                {biz.num_technicians ? `${biz.num_technicians} Techs` : '10+ Techs'}
              </div>
              <div className="text-slate-400 text-sm mt-1">On Staff</div>
            </div>
            <div>
              <div className="text-emerald-400 text-4xl font-bold">✓</div>
              <div className="text-slate-400 text-sm mt-1">Licensed &amp; Insured</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-oswald text-4xl text-gray-900 text-center mb-10 tracking-wide">What Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white rounded-xl p-6 shadow border border-gray-100">
                  <div className="text-emerald-500 mb-3">{'★'.repeat(t.rating)}</div>
                  <p className="text-gray-700 italic mb-4">
                    "{t.review_text.slice(0, 80)}{t.review_text.length > 80 ? '…' : ''}"
                  </p>
                  <p className="text-gray-900 font-bold text-sm">— {t.author_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-14 bg-[#0a0f1e]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <h2 className="text-white font-oswald text-3xl md:text-4xl tracking-wide">Ready to protect your home?</h2>
          <div className="flex items-center gap-6 flex-wrap">
            <Link to="/quote" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3 rounded-lg transition">
              Get a Free Quote
            </Link>
            {biz.phone && (
              <a href={`tel:${biz.phone.replace(/\D/g, '')}`} className="text-gray-300 font-semibold hover:text-white transition">
                {biz.phone}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
