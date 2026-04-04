import { useState, useEffect } from 'react'
import { Shield, Clock, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'
import { SERVICES } from './ServicesData'

interface Biz { founded_year?: string | number; phone?: string; address?: string }
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

  const city = biz.address ? (biz.address.split(',')[0]?.trim() || 'East Texas') : 'East Texas'

  return (
    <>
      {/* Our Services Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-oswald text-4xl text-gray-900 text-center mb-10 tracking-wide">Our Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s) => (
              <a key={s.name} href="/pest-control"
                className="rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition group">
                <img src={s.img} alt={s.name} loading="lazy" className="w-full h-36 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-sky-600 transition">{s.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{s.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Google Reviews Strip */}
      {testimonials.length > 0 && (
        <section className="py-10 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-gray-700 font-semibold mb-4">⭐ What Our Customers Are Saying</p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {testimonials.map((t) => (
                <div key={t.id}
                  className="flex-shrink-0 w-64 bg-white shadow border border-gray-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
                    {t.author_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{t.author_name}</p>
                    <div className="text-yellow-500 text-xs mb-1">{'★'.repeat(t.rating)}</div>
                    <p className="text-gray-600 text-xs line-clamp-2">{t.review_text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Local Matters */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <Shield className="w-10 h-10 text-sky-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Locally Owned</h3>
            <p className="text-gray-600 text-sm">We live and work in your community. Our reputation depends on your satisfaction.</p>
          </div>
          <div className="text-center">
            <Clock className="w-10 h-10 text-sky-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Fast Response</h3>
            <p className="text-gray-600 text-sm">Same-day and next-day service available. We don't make you wait weeks.</p>
          </div>
          <div className="text-center">
            <MapPin className="w-10 h-10 text-sky-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Your Neighbors Trust Us</h3>
            <p className="text-gray-600 text-sm">
              Serving {city} families since {biz.founded_year || 'day one'}. Ask your neighbors.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-sky-700 text-center">
        {biz.phone && (
          <a href={`tel:${biz.phone.replace(/\D/g, '')}`}
            className="block text-white font-oswald text-5xl font-bold mb-3 hover:text-sky-200 transition">
            {biz.phone}
          </a>
        )}
        <p className="text-sky-200 text-lg mb-6">Call today — same-day service available</p>
        <a href="/quote"
          className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white hover:text-sky-700 transition">
          Schedule Online
        </a>
      </section>
    </>
  )
}
