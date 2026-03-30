import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { Plus, Trash2, ArrowLeft, Check } from 'lucide-react'

interface FormData {
  businessName: string; phone: string; email: string; address: string; tagline: string; license: string
  logoUrl: string; primaryColor: string; accentColor: string; template: 'bold' | 'clean' | 'modern' | 'rustic'
  locations: { city: string; slug: string }[]
}

const INITIAL_FORM: FormData = {
  businessName: '', phone: '', email: '', address: '', tagline: '', license: '',
  logoUrl: '', primaryColor: '#10b981', accentColor: '#f5c518', template: 'bold',
  locations: [{ city: '', slug: '' }],
}

const TEMPLATES = [
  { value: 'bold' as const, label: 'Bold', desc: 'Dark navy backgrounds, emerald accents, Bangers display font', colors: 'from-emerald-600 to-gray-900', swatch: '#10b981' },
  { value: 'clean' as const, label: 'Clean', desc: 'White backgrounds, navy accents, professional serif headings', colors: 'from-white to-blue-900', swatch: '#1d4ed8' },
  { value: 'modern' as const, label: 'Modern', desc: 'Dark backgrounds, teal accents, monospace headings', colors: 'from-gray-800 to-gray-950', swatch: '#14b8a6' },
  { value: 'rustic' as const, label: 'Rustic', desc: 'Warm brown backgrounds, amber accents, serif headings', colors: 'from-amber-600 to-amber-950', swatch: '#d97706' },
]

const STEPS = [
  { num: 1, title: 'Welcome' },
  { num: 2, title: 'Business Info' },
  { num: 3, title: 'Branding' },
  { num: 4, title: 'Locations' },
  { num: 5, title: 'Launch' },
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const { tenantId } = useTenant()
  const navigate = useNavigate()

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => { setForm(prev => ({ ...prev, [key]: value })) }

  const addLocation = () => {
    if (form.locations.length >= 6) return
    setForm(prev => ({ ...prev, locations: [...prev.locations, { city: '', slug: '' }] }))
  }

  const removeLocation = (index: number) => { setForm(prev => ({ ...prev, locations: prev.locations.filter((_, i) => i !== index) })) }

  const updateLocation = (index: number, field: 'city' | 'slug', value: string) => {
    setForm(prev => ({ ...prev, locations: prev.locations.map((loc, i) => i === index ? { ...loc, [field]: value } : loc) }))
  }

  const handleLaunch = async () => {
    if (!tenantId) return
    setSaving(true)
    const settingsRows = [
      { tenant_id: tenantId, key: 'business_info', value: { name: form.businessName, phone: form.phone, email: form.email, address: form.address, tagline: form.tagline, license: form.license } },
      { tenant_id: tenantId, key: 'branding', value: { logo_url: form.logoUrl, favicon_url: '', primary_color: form.primaryColor, accent_color: form.accentColor, template: form.template } },
      { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: true } },
    ]
    for (const row of settingsRows) { await supabase.from('settings').upsert(row, { onConflict: 'tenant_id,key' }) }
    const locationRows = form.locations.filter(l => l.city && l.slug).map(l => ({ tenant_id: tenantId, city: l.city, slug: l.slug, is_live: false }))
    if (locationRows.length > 0) { await supabase.from('location_data').insert(locationRows) }
    navigate('/admin')
  }

  const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-200">
        <div className="h-full bg-emerald-500 transition-all duration-500 rounded-r-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Step indicators */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-2">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step > s.num ? 'bg-emerald-500 text-white' : step === s.num ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-1 ${step > s.num ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm">Step {step} of {totalSteps} — {STEPS[step - 1].title}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-bangers text-3xl text-emerald-500 text-center mb-8 tracking-wide">PestFlow Pro</h1>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-3xl">🏠</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome to PestFlow Pro!</h2>
            <p className="text-gray-500 max-w-md mx-auto text-base leading-relaxed">
              We'll set up your professional pest control website in about 5 minutes.
              You can always change these settings later from your admin dashboard.
            </p>
            <button onClick={() => setStep(2)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-10 py-4 rounded-lg transition text-lg">
              Get Started →
            </button>
          </div>
        )}

        {/* Step 2 — Business Info */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
              <p className="text-gray-500 text-sm mt-1">This is how customers will find and contact you. It appears on every page of your website.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name *</label>
              <input className={inputClass} value={form.businessName} onChange={e => updateField('businessName', e.target.value)} placeholder="Apex Pest Solutions" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input className={inputClass} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="(903) 555-0100" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input className={inputClass} type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="info@apexpest.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address</label>
              <input className={inputClass} value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="123 Main St, Tyler, TX 75701" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tagline</label>
                <input className={inputClass} value={form.tagline} onChange={e => updateField('tagline', e.target.value)} placeholder="Your local pest experts" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">License Number</label>
                <input className={inputClass} value={form.license} onChange={e => updateField('license', e.target.value)} placeholder="TPCL-12345" />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm"><ArrowLeft size={16} /> Back</button>
              <button onClick={() => setStep(3)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-3 rounded-lg transition">Next →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Branding */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Branding & Design</h2>
              <p className="text-gray-500 text-sm mt-1">Choose a look for your website. These settings control colors, fonts, and layout across all pages.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Logo URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className={inputClass} value={form.logoUrl} onChange={e => updateField('logoUrl', e.target.value)} placeholder="https://example.com/logo.png" />
              <p className="text-xs text-gray-400 mt-1">Don't have one yet? No problem — your business name will be used instead.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer" />
                  <input className={inputClass} value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer" />
                  <input className={inputClass} value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Website Template</label>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button key={t.value} type="button" onClick={() => updateField('template', t.value)}
                    className={`rounded-xl p-4 border-2 transition text-left ${form.template === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-8 flex-1 rounded-lg bg-gradient-to-r ${t.colors}`} />
                      <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: t.swatch }} />
                    </div>
                    <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm"><ArrowLeft size={16} /> Back</button>
              <button onClick={() => setStep(4)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-3 rounded-lg transition">Next →</button>
            </div>
          </div>
        )}

        {/* Step 4 — Locations */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Service Locations</h2>
              <p className="text-gray-500 text-sm mt-1">Each city gets its own SEO-optimized landing page. Add up to 6 — you can always add more later.</p>
            </div>
            {form.locations.map((loc, i) => (
              <div key={i} className="flex items-center gap-3">
                <input className={inputClass} placeholder="City name (e.g. Tyler)" value={loc.city} onChange={e => updateLocation(i, 'city', e.target.value)} />
                <input className={`${inputClass} max-w-[180px]`} placeholder="URL slug (e.g. tyler-tx)" value={loc.slug} onChange={e => updateLocation(i, 'slug', e.target.value)} />
                {form.locations.length > 1 && (
                  <button onClick={() => removeLocation(i)} className="text-gray-400 hover:text-red-500 transition p-1"><Trash2 size={18} /></button>
                )}
              </div>
            ))}
            {form.locations.length < 6 && (
              <button onClick={addLocation} className="flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-600 transition font-medium">
                <Plus size={16} /> Add Another Location
              </button>
            )}
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm"><ArrowLeft size={16} /> Back</button>
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(5)} className="text-gray-500 hover:text-gray-700 text-sm transition">Skip for now</button>
                <button onClick={() => setStep(5)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-3 rounded-lg transition">Next →</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Review & Launch */}
        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Review & Launch</h2>
              <p className="text-gray-500 text-sm mt-1">Everything look good? You can change any of this later from your admin dashboard.</p>
            </div>
            <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business</p>
                  <p className="text-gray-900 font-semibold text-lg">{form.businessName || '—'}</p>
                  {form.phone && <p className="text-gray-500 text-sm">{form.phone}</p>}
                  {form.email && <p className="text-gray-500 text-sm">{form.email}</p>}
                  {form.address && <p className="text-gray-500 text-sm">{form.address}</p>}
                  {form.tagline && <p className="text-gray-400 text-sm italic mt-1">"{form.tagline}"</p>}
                </div>
                <button onClick={() => setStep(2)} className="text-emerald-600 text-sm font-medium hover:underline">Edit</button>
              </div>
              <div className="border-t border-gray-100 pt-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Branding</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-8 h-8 rounded-lg shadow-sm border" style={{ backgroundColor: form.primaryColor }} />
                    <div className="w-8 h-8 rounded-lg shadow-sm border" style={{ backgroundColor: form.accentColor }} />
                    <span className="text-gray-600 text-sm capitalize font-medium">{form.template} template</span>
                  </div>
                </div>
                <button onClick={() => setStep(3)} className="text-emerald-600 text-sm font-medium hover:underline">Edit</button>
              </div>
              <div className="border-t border-gray-100 pt-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Locations</p>
                  {form.locations.filter(l => l.city).length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {form.locations.filter(l => l.city).map((l, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">{l.city}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No locations added — you can add them later</p>
                  )}
                </div>
                <button onClick={() => setStep(4)} className="text-emerald-600 text-sm font-medium hover:underline">Edit</button>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(4)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm"><ArrowLeft size={16} /> Back</button>
              <button onClick={handleLaunch} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-4 rounded-lg transition disabled:opacity-50 text-lg">
                {saving ? 'Launching...' : 'Launch My Site 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
