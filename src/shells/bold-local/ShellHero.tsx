import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { resolveTenantId } from '../../lib/tenant'

interface Biz { name?: string; phone?: string }
interface FormState { name: string; phone: string; service: string }

export default function ShellHero() {
  const [headline, setHeadline] = useState('East Texas Pest Control That Gets Results.')
  const [heroSubtext, setHeroSubtext] = useState('Fast. Reliable. Local.')
  const [biz, setBiz] = useState<Biz>({})
  const [ctaText, setCtaText] = useState('Get a Free Estimate')
  const [form, setForm] = useState<FormState>({ name: '', phone: '', service: '' })
  const navigate = useNavigate()

  useEffect(() => {
    resolveTenantId().then(async (tenantId) => {
      if (!tenantId) return
      const [bizRes, custRes, brandRes, contentRes] = await Promise.all([
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'customization').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'branding').maybeSingle(),
        supabase.from('page_content').select('subtitle').eq('tenant_id', tenantId).eq('page_slug', 'home').maybeSingle(),
      ])
      if (bizRes.data?.value) setBiz({ name: bizRes.data.value.name, phone: bizRes.data.value.phone })
      if (custRes.data?.value?.hero_headline) setHeadline(custRes.data.value.hero_headline)
      if (brandRes.data?.value?.cta_text) setCtaText(brandRes.data.value.cta_text)
      if (contentRes.data?.subtitle) setHeroSubtext(contentRes.data.subtitle)
    })
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate('/quote')
  }

  function setField(key: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const inputCls = 'w-full rounded px-3 py-2 text-sm bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <section style={{ background: 'var(--color-bg-hero)' }} className="text-white min-h-[560px] flex flex-col md:flex-row">
      {/* LEFT — headline + CTA */}
      <div className="flex-1 md:w-[60%] flex flex-col justify-center px-8 md:px-14 py-16 relative">
        <div className="absolute top-0 left-0 w-1 h-full hidden md:block" style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true" />
        <span className="text-sm font-bold tracking-widest uppercase mb-4 block" style={{ color: 'var(--color-primary)' }}>
          ★★★★★ Rated #1 in Tyler, TX
        </span>
        <h1 className="font-oswald text-5xl md:text-6xl font-bold uppercase leading-tight mb-6 text-white">
          {headline}
        </h1>
        <p className="text-lg text-gray-300 mb-8">{heroSubtext}</p>
        <a
          href="/quote"
          style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }} className="inline-block font-bold px-8 py-4 text-lg transition w-fit"
        >
          {ctaText}
        </a>
        {biz.phone && (
          <a
            href={`tel:${biz.phone.replace(/\D/g, '')}`}
            className="mt-4 font-semibold transition text-sm inline-block hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            Or call: {biz.phone}
          </a>
        )}
      </div>

      {/* RIGHT — floating estimate card */}
      <div className="md:w-[40%] flex items-center justify-center px-6 md:px-10 py-12 md:py-0">
        <div className="w-full max-w-sm bg-[#141414] border-t-4 rounded-xl shadow-2xl p-6 md:translate-y-8" style={{ borderTopColor: 'var(--color-primary)' }}>
          <h2 className="text-xl font-bold text-white mb-5">Get a Free Estimate</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Your Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="Your Name"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="(XXX) XXX-XXXX"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Service Needed</label>
              <select
                value={form.service}
                onChange={e => setField('service', e.target.value)}
                className={inputCls}
              >
                <option value="">Select a Service</option>
                <option>Residential Pest Control</option>
                <option>Commercial Pest Control</option>
                <option>Termite Treatment</option>
                <option>Mosquito Control</option>
                <option>Rodent Control</option>
                <option>Other</option>
              </select>
            </div>
            <button
              type="submit"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }} className="w-full font-bold py-3 rounded transition text-sm"
            >
              {ctaText}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
