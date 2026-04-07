import { useState, useEffect } from 'react'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'

interface BusinessInfo { name: string; phone: string; email: string; address: string; hours: string }
interface SocialLinks { facebook: string; instagram: string; google: string }
interface FormState { name: string; email: string; phone: string; message: string; smsConsent: boolean }

export default function ContactPage() {
  const [tenantId, setTenantId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<BusinessInfo>({ name: 'Ironclad Pest Solutions', phone: '(903) 555-0100', email: '', address: '', hours: '' })
  const [social, setSocial] = useState<SocialLinks>({ facebook: '', instagram: '', google: '' })
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', message: '', smsConsent: false })
  const [heroTitle, setHeroTitle] = useState('Contact Us')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [ownerSmsNumber, setOwnerSmsNumber] = useState('')

  useEffect(() => {
    resolveTenantId().then(async (tid) => {
      if (!tid) return
      setTenantId(tid)
      const [settingsRes, contentRes, intRes] = await Promise.all([
        supabase.from('settings').select('key, value').eq('tenant_id', tid).in('key', ['business_info', 'social_links']),
        supabase.from('page_content').select('title, subtitle').eq('tenant_id', tid).eq('page_slug', 'contact').maybeSingle(),
        supabase.from('settings').select('value').eq('tenant_id', tid).eq('key', 'integrations').maybeSingle(),
      ])
      if (contentRes.data?.title) setHeroTitle(contentRes.data.title)
      if (contentRes.data?.subtitle) setHeroSubtitle(contentRes.data.subtitle)
      if (intRes.data?.value?.owner_sms_number) setOwnerSmsNumber(intRes.data.value.owner_sms_number)
      const { data } = settingsRes
      if (data) {
        for (const row of data) {
          if (row.key === 'business_info' && row.value) setInfo({ name: row.value.name || 'Ironclad Pest Solutions', phone: row.value.phone || '(903) 555-0100', email: row.value.email || '', address: row.value.address || '', hours: row.value.hours || '' })
          if (row.key === 'social_links' && row.value) setSocial({ facebook: row.value.facebook || '', instagram: row.value.instagram || '', google: row.value.google || '' })
        }
      }
    })
  }, [])

  function updateField(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { toast.error('Please fill in your name and email.'); return }
    setSubmitting(true)
    const { error } = await supabase.from('leads').insert({ tenant_id: tenantId, name: form.name, email: form.email, phone: form.phone, message: form.message })
    setSubmitting(false)
    if (error) { toast.error('Something went wrong. Please try again or call us directly.'); return }

    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    }
    if (form.smsConsent && form.phone) {
      fetch(fnUrl, { method: 'POST', headers, body: JSON.stringify({ tenant_id: tenantId, to: form.phone, message: `Hi ${form.name}, thanks for contacting ${info.name}! We received your message and will be in touch shortly.`, type: 'customer' }) }).catch(() => {})
    }
    if (ownerSmsNumber) {
      fetch(fnUrl, { method: 'POST', headers, body: JSON.stringify({ tenant_id: tenantId, to: ownerSmsNumber, message: `📬 New contact from ${form.name} — ${form.phone} — "${form.message?.slice(0, 80)}". Check CRM: https://dangpestcontrol.com/admin`, type: 'owner' }) }).catch(() => {})
    }

    toast.success("Message sent! We'll get back to you soon.")
    setForm({ name: '', email: '', phone: '', message: '', smsConsent: false })
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-section)' }}>

      <section className="py-16" style={{ background: 'linear-gradient(135deg, var(--color-bg-hero) 0%, var(--color-bg-hero-end) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-oswald tracking-wide text-4xl md:text-6xl mb-4" style={{ color: 'var(--color-nav-text)' }}>{heroTitle}</h1>
          <p className="text-lg" style={{ color: 'var(--color-nav-text)', opacity: 0.75 }}>
            {heroSubtitle || <>Have a question or need service? Call us at{' '}
            <a href={`tel:${info.phone}`} className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>{info.phone}</a></>}
          </p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-oswald tracking-wide text-2xl mb-6" style={{ color: 'var(--color-heading)' }}>Send Us a Message</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={inputClass} required /></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="sms_consent"
                  required
                  checked={form.smsConsent}
                  onChange={e => updateField('smsConsent', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="sms_consent" className="text-sm text-gray-600">
                  I agree to receive text messages from {info.name} regarding my inquiry. Message and data rates may apply. Reply STOP to opt out.
                </label>
              </div>
              <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea value={form.message} onChange={(e) => updateField('message', e.target.value)} rows={5} className={`${inputClass} resize-none`} /></div>
              <button type="submit" disabled={submitting} className="w-full font-bold rounded-lg px-6 py-4 text-lg transition disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-hero)', color: 'var(--color-nav-text)' }}>
              <h3 className="font-oswald tracking-wide text-xl mb-4" style={{ color: 'var(--color-primary)' }}>Get in Touch</h3>
              <ul className="space-y-4">
                {info.phone && <li className="flex items-start gap-3"><Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} /><a href={`tel:${info.phone}`} className="hover:underline">{info.phone}</a></li>}
                {info.email && <li className="flex items-start gap-3"><Mail className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} /><a href={`mailto:${info.email}`} className="hover:underline">{info.email}</a></li>}
                {info.address && <li className="flex items-start gap-3"><MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} /><span>{info.address}</span></li>}
                {info.hours && <li className="flex items-start gap-3"><Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} /><span>{info.hours}</span></li>}
              </ul>
              {(social.facebook || social.instagram || social.google) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Follow Us</h4>
                  <div className="flex gap-3">
                    {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[color:var(--color-primary)] transition">Facebook</a>}
                    {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[color:var(--color-primary)] transition">Instagram</a>}
                    {social.google && <a href={social.google} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[color:var(--color-primary)] transition">Google</a>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
