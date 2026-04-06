import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface Biz { phone?: string; founded_year?: string | number }

const HERO_IMAGE = 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg'
const BROWN = '#2c1a0e'
const RUST  = '#b5451b'

export default function ShellHero() {
  const [headline, setHeadline] = useState('Built Tough. Built Local. Built for East Texas.')
  const [biz, setBiz] = useState<Biz>({ phone: '(903) 555-0142', founded_year: 2009 })

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, custRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
      ])
      if (bizRes.data?.value) {
        const v = bizRes.data.value
        setBiz({ phone: v.phone || '(903) 555-0142', founded_year: v.founded_year || 2009 })
      }
      if (custRes.data?.value?.hero_headline) setHeadline(custRes.data.value.hero_headline)
    })
  }, [])

  const dialPhone = `tel:${(biz.phone || '').replace(/\D/g, '')}`

  return (
    <section style={{ backgroundColor: 'var(--color-bg-hero)' }} className="flex flex-col md:flex-row min-h-[540px]">
      {/* LEFT — text */}
      <div className="md:w-1/2 flex flex-col justify-center px-10 py-16 relative z-10">
        {/* Est. badge */}
        <span
          className="inline-block text-sm font-bold px-3 py-1 rounded-sm mb-6 w-fit"
          style={{ border: `1px solid ${RUST}`, color: RUST }}
        >
          Est. {biz.founded_year || 2009}
        </span>

        <h1
          className="font-oswald text-5xl font-bold uppercase leading-tight mb-4 text-white"
        >
          {headline}
        </h1>

        <p className="text-gray-300 text-lg mt-2 mb-8">
          Serving Tyler &amp; surrounding counties since {biz.founded_year || 2009}.
        </p>

        <Link
          to="/quote"
          className="inline-block font-bold px-8 py-4 text-white text-lg transition w-fit hover:opacity-90"
          style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)', borderRadius: '2px' }}
        >
          Get a Free Estimate
        </Link>
      </div>

      {/* RIGHT — image + floating card */}
      <div className="md:w-1/2 relative overflow-hidden h-56 md:h-auto">
        <img
          src={HERO_IMAGE}
          alt="Pest control technician"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay to blend with left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2c1a0e]/60 to-transparent" />

        {/* Floating card — visible md+ */}
        <div
          className="hidden md:block absolute top-1/2 left-0 -translate-x-1/3 -translate-y-1/2 rounded-xl p-5 shadow-2xl z-20"
          style={{ backgroundColor: BROWN, border: `1px solid ${RUST}`, minWidth: '180px' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: RUST }}>
            Free Estimate
          </p>
          <p className="text-white font-bold text-xl leading-tight mb-3">
            {biz.phone || '(903) 555-0142'}
          </p>
          <a
            href={dialPhone}
            className="block text-center text-white text-sm font-bold px-4 py-2 rounded transition hover:opacity-80"
            style={{ backgroundColor: RUST }}
          >
            Call Now
          </a>
        </div>
      </div>

      {/* Mobile floating card — below image on small screens */}
      <div
        className="md:hidden mx-6 -mt-6 relative z-20 rounded-xl p-5 shadow-2xl mb-8"
        style={{ backgroundColor: BROWN, border: `1px solid ${RUST}` }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: RUST }}>
          Free Estimate
        </p>
        <p className="text-white font-bold text-xl mb-3">
          {biz.phone || '(903) 555-0142'}
        </p>
        <a
          href={dialPhone}
          className="block text-center text-white text-sm font-bold px-4 py-2 rounded transition"
          style={{ backgroundColor: RUST }}
        >
          Call Now
        </a>
      </div>
    </section>
  )
}
