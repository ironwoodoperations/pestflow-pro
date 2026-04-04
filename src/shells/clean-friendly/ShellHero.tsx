import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface Biz { name?: string; phone?: string }

const HERO_IMAGE = 'https://images.pexels.com/photos/5025639/pexels-photo-5025639.jpeg'

const STRIPS = [
  { icon: '🏠', title: 'Residential', sub: 'Protecting your home and family' },
  { icon: '🏢', title: 'Commercial', sub: 'Keeping your business pest-free' },
  { icon: '🪲', title: 'Termites', sub: 'Full termite inspection & treatment' },
]

export default function ShellHero() {
  const [biz, setBiz] = useState<Biz>({ phone: '(903) 555-0142' })

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const res = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'business_info')
        .maybeSingle()
      if (res.data?.value) {
        setBiz({ name: res.data.value.name, phone: res.data.value.phone || '(903) 555-0142' })
      }
    })
  }, [])

  const dialPhone = `tel:${(biz.phone || '').replace(/\D/g, '')}`

  return (
    <>
      {/* Hero section */}
      <section
        className="relative flex items-center justify-center min-h-[65vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/80 to-sky-900/60" />

        <div className="relative z-10 text-center px-4 py-16">
          {biz.name && (
            <p className="text-xl font-semibold text-sky-200 tracking-widest uppercase mb-2">
              {biz.name}
            </p>
          )}
          <a
            href={dialPhone}
            className="block text-6xl md:text-8xl font-black text-white tracking-tight leading-none mb-3 drop-shadow-lg hover:text-sky-100 transition"
            style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
          >
            {biz.phone || '(903) 555-0142'}
          </a>
          <p className="text-xl text-sky-200 mt-2 mb-6">Call for Same-Day Service</p>
          <Link
            to="/quote"
            className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-bold px-8 py-4 rounded-full transition shadow-lg text-lg"
          >
            Get a Free Quote
          </Link>
        </div>
      </section>

      {/* Service strips */}
      <div className="bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-700">
          {STRIPS.map((s, i) => (
            <Link
              key={i}
              to="/services"
              className="flex flex-col items-start py-6 px-8 cursor-pointer hover:bg-gray-800 transition group"
            >
              <span className="text-3xl mb-2" aria-hidden="true">{s.icon}</span>
              <span className="text-white font-bold text-lg group-hover:text-sky-400 transition">{s.title}</span>
              <span className="text-gray-400 text-sm mt-1">{s.sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
