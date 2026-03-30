import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'

interface LiveForm {
  businessName: string; phone: string; email: string; address: string
  cityStateZip: string; hours: string; tagline: string; license: string
  yearsInBusiness: string; logoUrl: string; primaryColor: string
  template: 'bold' | 'clean' | 'modern' | 'rustic'
  facebookUrl: string; instagramUrl: string; googleUrl: string
  leadEmail: string; facebookPageId: string; facebookToken: string
  googlePlaceId: string; mapsEmbedUrl: string; youtubeId: string
}

const INITIAL: LiveForm = {
  businessName: '', phone: '', email: '', address: '',
  cityStateZip: '', hours: '', tagline: '', license: '',
  yearsInBusiness: '', logoUrl: '', primaryColor: '#10b981',
  template: 'bold',
  facebookUrl: '', instagramUrl: '', googleUrl: '',
  leadEmail: '', facebookPageId: '', facebookToken: '',
  googlePlaceId: '', mapsEmbedUrl: '', youtubeId: '',
}

const TEMPLATES = [
  { value: 'bold' as const, label: 'Bold', desc: 'Dark navy, emerald accents', gradient: 'from-emerald-600 to-gray-900', swatch: '#10b981' },
  { value: 'clean' as const, label: 'Clean', desc: 'White, navy, professional', gradient: 'from-white to-blue-900', swatch: '#1d4ed8' },
  { value: 'modern' as const, label: 'Modern', desc: 'Dark, teal, contemporary', gradient: 'from-gray-800 to-gray-950', swatch: '#14b8a6' },
  { value: 'rustic' as const, label: 'Rustic', desc: 'Brown, amber, inviting', gradient: 'from-amber-600 to-amber-950', swatch: '#d97706' },
]

interface StepDef {
  key: keyof LiveForm | 'template' | 'review'
  label: string
  helper?: string
  type?: 'text' | 'email' | 'color' | 'template' | 'review'
  placeholder?: string
  optional?: boolean
}

const STEPS: StepDef[] = [
  { key: 'businessName', label: 'What is your business name?', helper: 'This appears on every page of your website.', placeholder: 'Apex Pest Solutions' },
  { key: 'phone', label: 'Business phone number?', helper: 'Shown in the header and used for click-to-call.', placeholder: '(903) 555-0100' },
  { key: 'email', label: 'Business email address?', type: 'email', helper: 'Where customer inquiries are sent.', placeholder: 'info@yourbusiness.com' },
  { key: 'address', label: 'Street address?', helper: 'Displayed on your contact page and footer.', placeholder: '123 Main St' },
  { key: 'cityStateZip', label: 'City, State, ZIP?', placeholder: 'Tyler, TX 75701' },
  { key: 'hours', label: 'Business hours?', helper: 'Shown on your contact page and footer.', placeholder: 'Mon–Fri 8am–6pm, Sat 9am–2pm' },
  { key: 'tagline', label: 'Company tagline or slogan?', helper: 'A short phrase shown below your logo.', placeholder: 'Protecting Families Since 2006' },
  { key: 'license', label: 'Pest control license number?', helper: 'Builds trust — displayed in your footer.', placeholder: 'TPCL-12345' },
  { key: 'yearsInBusiness', label: 'How many years in business?', placeholder: '18' },
  { key: 'logoUrl', label: 'Logo URL', helper: "Paste a link to your logo image. Don't have one? That's fine.", placeholder: 'https://...', optional: true },
  { key: 'primaryColor', label: 'Pick your brand color', type: 'color' },
  { key: 'template', label: 'Choose your website style', type: 'template' },
  { key: 'facebookUrl', label: 'Facebook page URL?', placeholder: 'https://facebook.com/yourpage', optional: true },
  { key: 'instagramUrl', label: 'Instagram URL?', placeholder: 'https://instagram.com/yourpage', optional: true },
  { key: 'googleUrl', label: 'Google Business Profile URL?', placeholder: 'https://g.page/yourbusiness', optional: true },
  { key: 'leadEmail', label: 'Where should new lead notifications go?', type: 'email', helper: 'We email you instantly when someone requests a quote.', placeholder: 'owner@yourbusiness.com' },
  { key: 'facebookPageId', label: 'Facebook Page ID?', helper: 'Found in your Facebook Page settings.', placeholder: '123456789', optional: true },
  { key: 'facebookToken', label: 'Facebook Access Token?', helper: 'Required for auto-posting to Facebook.', placeholder: 'EAAG...', optional: true },
  { key: 'googlePlaceId', label: 'Google Place ID?', helper: 'Used to import Google reviews automatically.', placeholder: 'ChIJ...', optional: true },
  { key: 'mapsEmbedUrl', label: 'Google Maps embed URL?', helper: 'Paste from Google Maps → Share → Embed.', placeholder: 'https://www.google.com/maps/embed?pb=...', optional: true },
  { key: 'youtubeId', label: 'Hero video YouTube ID?', helper: 'The ID after youtu.be/ or ?v= in the URL.', placeholder: 'dQw4w9WgXcQ', optional: true },
  { key: 'review' as keyof LiveForm, label: "You're all set!", type: 'review' },
]

export default function OnboardingLive() {
  const [stepIdx, setStepIdx] = useState(0)
  const [form, setForm] = useState<LiveForm>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const { tenantId } = useTenant()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const current = STEPS[stepIdx]
  const total = STEPS.length

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [stepIdx])

  const next = useCallback(() => { if (stepIdx < total - 1) setStepIdx(s => s + 1) }, [stepIdx, total])
  const prev = useCallback(() => { if (stepIdx > 0) setStepIdx(s => s - 1) }, [stepIdx])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && current.type !== 'review') { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [next, current.type])

  const updateField = (key: keyof LiveForm, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  async function handleFinish() {
    if (!tenantId) return
    setSaving(true)
    const fullAddress = [form.address, form.cityStateZip].filter(Boolean).join(', ')
    await supabase.from('settings').upsert([
      { tenant_id: tenantId, key: 'business_info', value: { name: form.businessName, phone: form.phone, email: form.email, address: fullAddress, hours: form.hours, tagline: form.tagline, license: form.license } },
      { tenant_id: tenantId, key: 'branding', value: { logo_url: form.logoUrl, primary_color: form.primaryColor, template: form.template } },
      { tenant_id: tenantId, key: 'social_links', value: { facebook: form.facebookUrl, instagram: form.instagramUrl, google: form.googleUrl } },
      { tenant_id: tenantId, key: 'notifications', value: { lead_email: form.leadEmail } },
      { tenant_id: tenantId, key: 'integrations', value: { facebook_page_id: form.facebookPageId, facebook_access_token: form.facebookToken, google_place_id: form.googlePlaceId, google_maps_embed_url: form.mapsEmbedUrl } },
      { tenant_id: tenantId, key: 'hero_media', value: { youtube_id: form.youtubeId } },
      { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: true } },
    ], { onConflict: 'tenant_id,key' })
    setSaving(false)
    setDone(true)
    setTimeout(() => navigate('/admin'), 3000)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-3">You're all set!</h1>
          <p className="text-gray-400 text-xl">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  const inputClass = 'w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition'

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((stepIdx + 1) / total) * 100}%` }} />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-bangers text-emerald-500 text-xl tracking-wide">PestFlow Pro</span>
        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm font-medium rounded-full">{stepIdx + 1} of {total}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-xl">
          {/* Label */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{current.label}</h2>
          {current.helper && <p className="text-gray-500 text-base mb-6">{current.helper}</p>}
          {!current.helper && current.type !== 'template' && current.type !== 'review' && <div className="mb-6" />}

          {/* Input — standard text/email */}
          {(!current.type || current.type === 'text' || current.type === 'email') && (
            <input
              ref={inputRef}
              type={current.type === 'email' ? 'email' : 'text'}
              value={(form as unknown as Record<string, string>)[current.key] || ''}
              onChange={e => updateField(current.key as keyof LiveForm, e.target.value)}
              placeholder={current.placeholder}
              className={inputClass}
              autoFocus
            />
          )}

          {/* Input — color picker */}
          {current.type === 'color' && (
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={form.primaryColor}
                onChange={e => updateField('primaryColor', e.target.value)}
                className="w-20 h-20 rounded-xl border-2 border-gray-200 cursor-pointer"
              />
              <input
                ref={inputRef}
                value={form.primaryColor}
                onChange={e => updateField('primaryColor', e.target.value)}
                className={inputClass}
                autoFocus
              />
            </div>
          )}

          {/* Input — template selector */}
          {current.type === 'template' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {TEMPLATES.map(t => (
                <button key={t.value} type="button" onClick={() => { updateField('template', t.value); setTimeout(next, 300) }}
                  className={`rounded-xl p-5 border-2 transition text-left ${form.template === t.value ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-10 flex-1 rounded-lg bg-gradient-to-r ${t.gradient}`} />
                    <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: t.swatch }} />
                  </div>
                  <p className="font-bold text-gray-900">{t.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Review screen */}
          {current.type === 'review' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mt-4">
              {form.businessName && <div><p className="text-xs text-gray-400 uppercase font-semibold">Business</p><p className="text-gray-900 font-semibold text-lg">{form.businessName}</p>{form.phone && <p className="text-gray-500 text-sm">{form.phone} · {form.email}</p>}</div>}
              {form.address && <div><p className="text-xs text-gray-400 uppercase font-semibold">Address</p><p className="text-gray-700 text-sm">{form.address}{form.cityStateZip && `, ${form.cityStateZip}`}</p></div>}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg shadow border" style={{ background: form.primaryColor }} />
                <span className="text-gray-600 capitalize">{form.template} template</span>
              </div>
            </div>
          )}

          {/* Skip link for optional */}
          {current.optional && current.type !== 'review' && (
            <button onClick={next} className="block mt-3 text-sm text-gray-400 hover:text-gray-600 transition">
              Skip for now →
            </button>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {stepIdx > 0 ? (
              <button onClick={prev} className="text-gray-500 hover:text-gray-700 font-medium py-4 px-6 rounded-lg transition">← Back</button>
            ) : <div />}
            {current.type === 'review' ? (
              <button onClick={handleFinish} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-10 rounded-xl text-lg transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Finish & Launch 🚀'}
              </button>
            ) : current.type !== 'template' ? (
              <button onClick={next} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-10 rounded-xl text-lg transition">Next →</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
