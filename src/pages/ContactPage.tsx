import { useState, useEffect } from 'react'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { resolveTenantId } from '../lib/tenant'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface BusinessInfo { name: string; phone: string; email: string; address: string; hours: string }
interface SocialLinks { facebook: string; instagram: string; google: string }
interface FormState { name: string; email: string; phone: string; message: string }

export default function ContactPage() {
  const [tenantId, setTenantId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<BusinessInfo>({ name: 'PestFlow Pro', phone: '(903) 555-0100', email: '', address: '', hours: '' })
  const [social, setSocial] = useState<SocialLinks>({ facebook: '', instagram: '', google: '' })
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', message: '' })

  useEffect(() => {
    resolveTenantId().then(async (tid) => {
      if (!tid) return
      setTenantId(tid)
      const { data } = await supabase.from('settings').select('key, value').eq('tenant_id', tid).in('key', ['business_info', 'social_links'])
      if (data) {
        for (const row of data) {
          if (row.key === 'business_info' && row.value) setInfo({ name: row.value.name || 'PestFlow Pro', phone: row.value.phone || '(903) 555-0100', email: row.value.email || '', address: row.value.address || '', hours: row.value.hours || '' })
          if (row.key === 'social_links' && row.value) setSocial({ facebook: row.value.facebook || '', instagram: row.value.instagram || '', google: row.value.google || '' })
        }
      }
    })
  }, [])

  function updateField(field: keyof FormState, value: string) { setForm((prev) => ({ ...prev, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { toast.error('Please fill in your name and email.'); return }
    setSubmitting(true)
    const { error } = await supabase.from('leads').insert({ tenant_id: tenantId, name: form.name, email: form.email, phone: form.phone, message: form.message })
    setSubmitting(false)
    if (error) { toast.error('Something went wrong. Please try again or call us directly.'); return }
    toast.success("Message sent! We'll get back to you soon.")
    setForm({ name: '', email: '', phone: '', message: '' })
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 50%, #0f3d2e 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-bangers tracking-wide text-4xl md:text-6xl text-white mb-4">Contact Us</h1>
          <p className="text-gray-400 text-lg">
            Have a question or need service? Call us at{' '}
            <a href={`tel:${info.phone}`} className="text-emerald-400 font-bold hover:underline">{info.phone}</a>
          </p>
        </div>
      </section>

      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bangers tracking-wide text-2xl text-gray-900 mb-6">Send Us a Message</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={inputClass} required /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputClass} /></div>
              <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea value={form.message} onChange={(e) => updateField('message', e.target.value)} rows={5} className={`${inputClass} resize-none`} /></div>
              <button type="submit" disabled={submitting} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-4 text-lg transition disabled:opacity-50">
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            <div className="bg-[#0a0f1e] text-white rounded-xl p-6">
              <h3 className="font-bangers tracking-wide text-xl text-emerald-400 mb-4">Get in Touch</h3>
              <ul className="space-y-4">
                {info.phone && <li className="flex items-start gap-3"><Phone className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" /><a href={`tel:${info.phone}`} className="hover:underline">{info.phone}</a></li>}
                {info.email && <li className="flex items-start gap-3"><Mail className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" /><a href={`mailto:${info.email}`} className="hover:underline">{info.email}</a></li>}
                {info.address && <li className="flex items-start gap-3"><MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" /><span>{info.address}</span></li>}
                {info.hours && <li className="flex items-start gap-3"><Clock className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" /><span>{info.hours}</span></li>}
              </ul>
              {(social.facebook || social.instagram || social.google) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Follow Us</h4>
                  <div className="flex gap-3">
                    {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">Facebook</a>}
                    {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">Instagram</a>}
                    {social.google && <a href={social.google} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">Google</a>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
