import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

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
  { value: 'bold' as const, label: 'Bold', desc: 'Dark navy, emerald accents, Bangers headlines', colors: 'from-emerald-600 to-gray-900' },
  { value: 'clean' as const, label: 'Clean', desc: 'White/navy, professional & trustworthy', colors: 'from-white to-blue-900' },
  { value: 'modern' as const, label: 'Modern', desc: 'Dark theme, sleek & contemporary', colors: 'from-gray-800 to-gray-950' },
  { value: 'rustic' as const, label: 'Rustic', desc: 'Warm brown, amber accents, inviting', colors: 'from-amber-600 to-amber-950' },
]

function HelpToggle({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-1">
      <button type="button" onClick={() => setOpen(!open)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Help
      </button>
      {open && <p className="text-xs text-gray-500 mt-1">{text}</p>}
    </div>
  )
}

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

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-bangers text-3xl text-emerald-500 text-center mb-2 tracking-wide">PestFlow Pro</h1>
        <p className="text-gray-500 text-center mb-8">Step {step} of {totalSteps}</p>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to PestFlow Pro!</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Let's set up your pest control website in just a few minutes. We'll walk you through
              your business info, branding, and service locations.
            </p>
            <button onClick={() => setStep(2)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-3 rounded-lg transition">
              Get Started
            </button>
          </div>
        )}

        {/* Step 2 — Business Info */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name *</label>
              <input className={inputClass} value={form.businessName} onChange={e => updateField('businessName', e.target.value)} placeholder="Acme Pest Control" />
              <HelpToggle text="Your official business name as it should appear on your website." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input className={inputClass} value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input className={inputClass} type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="info@yourbusiness.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input className={inputClass} value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="123 Main St, City, ST 12345" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
              <input className={inputClass} value={form.tagline} onChange={e => updateField('tagline', e.target.value)} placeholder="Your local pest experts" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
              <input className={inputClass} value={form.license} onChange={e => updateField('license', e.target.value)} placeholder="LIC-12345" />
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 transition text-sm">Back</button>
              <button onClick={() => setStep(3)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2 rounded-lg transition">Next</button>
            </div>
          </div>
        )}

        {/* Step 3 — Branding */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Branding</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo URL</label>
              <input className={inputClass} value={form.logoUrl} onChange={e => updateField('logoUrl', e.target.value)} placeholder="https://example.com/logo.png" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                  <input className={inputClass} value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                  <input className={inputClass} value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Template</label>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button key={t.value} type="button" onClick={() => updateField('template', t.value)}
                    className={`rounded-xl p-4 border-2 transition text-left ${form.template === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`h-8 rounded-lg bg-gradient-to-r ${t.colors} mb-3`} />
                    <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700 transition text-sm">Back</button>
              <button onClick={() => setStep(4)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2 rounded-lg transition">Next</button>
            </div>
          </div>
        )}

        {/* Step 4 — Locations */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Service Locations</h2>
            <p className="text-gray-500 text-sm mb-4">Add up to 6 cities you service. Each gets its own landing page.</p>
            {form.locations.map((loc, i) => (
              <div key={i} className="flex items-center gap-3">
                <input className={inputClass} placeholder="City name" value={loc.city} onChange={e => updateLocation(i, 'city', e.target.value)} />
                <input className={inputClass} placeholder="url-slug" value={loc.slug} onChange={e => updateLocation(i, 'slug', e.target.value)} />
                {form.locations.length > 1 && (
                  <button onClick={() => removeLocation(i)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
                )}
              </div>
            ))}
            {form.locations.length < 6 && (
              <button onClick={addLocation} className="flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-600 transition font-medium">
                <Plus size={16} /> Add Location
              </button>
            )}
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(3)} className="text-gray-500 hover:text-gray-700 transition text-sm">Back</button>
              <button onClick={() => setStep(5)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2 rounded-lg transition">Next</button>
            </div>
          </div>
        )}

        {/* Step 5 — Launch */}
        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Review & Launch</h2>
            <div className="bg-[#f8fafc] rounded-xl p-6 border border-gray-100 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</p>
                <p className="text-gray-900 font-medium">{form.businessName || '—'}</p>
                {form.phone && <p className="text-gray-500 text-sm">{form.phone}</p>}
                {form.email && <p className="text-gray-500 text-sm">{form.email}</p>}
                {form.address && <p className="text-gray-500 text-sm">{form.address}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Branding</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: form.primaryColor }} />
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: form.accentColor }} />
                  <span className="text-gray-500 text-sm capitalize">{form.template} template</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Locations</p>
                {form.locations.filter(l => l.city).map((l, i) => (
                  <p key={i} className="text-gray-500 text-sm">{l.city} ({l.slug})</p>
                ))}
                {!form.locations.some(l => l.city) && <p className="text-gray-400 text-sm">No locations added</p>}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(4)} className="text-gray-500 hover:text-gray-700 transition text-sm">Back</button>
              <button onClick={handleLaunch} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-lg transition disabled:opacity-50">
                {saving ? 'Launching...' : 'Launch My Site'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
