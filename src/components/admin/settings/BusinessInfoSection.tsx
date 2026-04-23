import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import { triggerRevalidate } from '../../../lib/revalidate'
import { validateBusinessInfo, type GeocodeSource, type HoursEntry } from '../../../../shared/lib/businessInfoValidation'

interface BusinessInfoForm {
  name: string; phone: string; email: string; address: string; hours: string
  tagline: string; license: string; after_hours_phone: string; founded_year: string; industry: string
  street_address: string; address_locality: string; address_region: string
  postal_code: string; address_country: string
  latitude: number | ''; longitude: number | ''
  geocode_source: GeocodeSource | ''; timezone: string; hours_structured: HoursEntry[]
}

const IC = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver']

function HoursGrid({ value, onChange, errors }: { value: HoursEntry[]; onChange: (v: HoursEntry[]) => void; errors: Record<string, string> }) {
  const get = (d: string) => value.find(e => e.dayOfWeek === d)
  const toggle = (d: string) => { if (get(d)) onChange(value.filter(e => e.dayOfWeek !== d)); else onChange([...value, { dayOfWeek: d, opens: '09:00', closes: '17:00' }]) }
  const setTime = (d: string, f: 'opens' | 'closes', t: string) => onChange(value.map(e => e.dayOfWeek === d ? { ...e, [f]: t } : e))
  return (
    <div className="space-y-2">
      {DAYS.map((day, i) => {
        const e = get(day); const err = errors[`hours_structured.${i}`]
        return (
          <div key={day} className="flex items-center gap-2 flex-wrap">
            <span className="w-20 text-sm font-medium text-gray-700">{day.slice(0, 3)}</span>
            <label className="flex items-center gap-1.5 text-xs text-gray-600"><input type="checkbox" checked={!e} onChange={() => toggle(day)} /> Closed</label>
            <input type="time" value={e?.opens?.slice(0, 5) || ''} onChange={ev => setTime(day, 'opens', ev.target.value)} disabled={!e} data-field={`hours_structured.${i}`} aria-invalid={err ? 'true' : undefined} aria-describedby={err ? `hs${i}e` : undefined} className={IC} />
            <input type="time" value={e?.closes?.slice(0, 5) || ''} onChange={ev => setTime(day, 'closes', ev.target.value)} disabled={!e} aria-invalid={err ? 'true' : undefined} aria-describedby={err ? `hs${i}e` : undefined} className={IC} />
            {err && <p id={`hs${i}e`} role="alert" className="text-red-600 text-xs mt-0.5 w-full">{err}</p>}
          </div>
        )
      })}
    </div>
  )
}

export default function BusinessInfoSection() {
  const { tenantId } = useTenant()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<BusinessInfoForm>({
    name: '', phone: '', email: '', address: '', hours: '', tagline: '', license: '',
    after_hours_phone: '', founded_year: '', industry: 'Pest Control',
    street_address: '', address_locality: '', address_region: '', postal_code: '', address_country: '',
    latitude: '', longitude: '', geocode_source: '', timezone: '', hours_structured: [],
  })
  const extraDbFields = useRef<Record<string, unknown>>({})

  useEffect(() => {
    if (!tenantId) return
    supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as Record<string, unknown>
          setForm(prev => ({ ...prev,
            name: String(v.name || ''), phone: String(v.phone || ''), email: String(v.email || ''),
            address: String(v.address || ''), hours: String(v.hours || ''),
            tagline: String(v.tagline || ''), license: String(v.license || ''),
            after_hours_phone: String(v.after_hours_phone || ''), founded_year: String(v.founded_year || ''),
            industry: String(v.industry || 'Pest Control'),
            street_address: String(v.street_address || ''), address_locality: String(v.address_locality || ''),
            address_region: String(v.address_region || ''), postal_code: String(v.postal_code || ''),
            address_country: String(v.address_country || ''),
            latitude: typeof v.latitude === 'number' ? v.latitude : '',
            longitude: typeof v.longitude === 'number' ? v.longitude : '',
            geocode_source: String(v.geocode_source || '') as GeocodeSource | '',
            timezone: String(v.timezone || ''),
            hours_structured: Array.isArray(v.hours_structured) ? v.hours_structured as HoursEntry[] : [],
          }))
          const { name: _n, phone: _p, email: _e, address: _a, hours: _h, tagline: _t, license: _l,
            after_hours_phone: _ah, founded_year: _fy, year_founded: _yf, industry: _i,
            street_address: _sa, address_locality: _al, address_region: _ar, postal_code: _pc, address_country: _ac,
            latitude: _lat, longitude: _lng, geocode_source: _gs, timezone: _tz, hours_structured: _hs,
            ...extras } = v
          extraDbFields.current = extras
        }
        setLoading(false)
      })
  }, [tenantId])

  const setField = <K extends keyof BusinessInfoForm>(key: K, val: BusinessInfoForm[K]) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => Object.fromEntries(Object.entries(prev).filter(e => e[0] !== (key as string))))
  }

  async function handleSave() {
    if (!tenantId) return
    const v = validateBusinessInfo(form)
    if (Object.keys(v).length > 0) {
      setErrors(v)
      const first = Object.keys(v)[0]
      toast.error(v[first])
      document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus()
      return
    }
    setErrors({})
    setSaving(true)
    const payload: Record<string, unknown> = { ...extraDbFields.current, ...form,
      latitude: form.latitude !== '' ? Number(form.latitude) : undefined,
      longitude: form.longitude !== '' ? Number(form.longitude) : undefined,
      geocode_source: form.geocode_source || undefined,
    }
    const { error } = await supabase.from('settings').upsert({ tenant_id: tenantId, key: 'business_info', value: payload }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    if (error) { toast.error(`Failed to save: ${error.message}`); return }
    toast.success('Business info saved!')
    const { data: sd } = await supabase.auth.getSession()
    if (sd.session?.access_token) await triggerRevalidate({ type: 'settings', tenantId }, sd.session.access_token)
  }
  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><p className="text-gray-400">Loading...</p></div>

  const fields: { label: string; key: keyof BusinessInfoForm; type?: string; placeholder?: string }[] = [
    { label: 'Business Name', key: 'name', placeholder: 'Acme Pest Control' },
    { label: 'Phone Number', key: 'phone', placeholder: '(903) 555-0100' },
    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'info@acmepest.com' },
    { label: 'Street Address (legacy)', key: 'address', placeholder: '123 Main St, Tyler, TX 75701' },
    { label: 'Business Hours (legacy)', key: 'hours', placeholder: 'Mon-Fri 8am-6pm, Sat 9am-2pm' },
    { label: 'Tagline', key: 'tagline', placeholder: 'Fast. Effective. Guaranteed.' },
    { label: 'License Number', key: 'license', placeholder: 'TPCL #12345' },
    { label: 'After-Hours Phone', key: 'after_hours_phone', placeholder: '(903) 555-0199' },
    { label: 'Year Founded', key: 'founded_year', placeholder: '2010' },
    { label: 'Industry / Business Type', key: 'industry', placeholder: 'Pest Control, HVAC...' },
  ]
  const addrFields: { key: 'street_address' | 'address_locality' | 'address_region' | 'postal_code' | 'address_country'; label: string; placeholder: string }[] = [
    { key: 'street_address', label: 'Street Address', placeholder: '123 Main St' },
    { key: 'address_locality', label: 'City', placeholder: 'Tyler' },
    { key: 'address_region', label: 'State (2-letter)', placeholder: 'TX' },
    { key: 'postal_code', label: 'ZIP Code', placeholder: '75701' },
    { key: 'address_country', label: 'Country Code', placeholder: 'US' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Business Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key as string}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key] as string} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder} className={IC} data-field={f.key as string} aria-invalid={errors[f.key as string] ? 'true' : undefined} aria-describedby={errors[f.key as string] ? `${f.key as string}-err` : undefined} />
              {errors[f.key as string] && <p id={`${f.key as string}-err`} role="alert" className="text-red-600 text-sm mt-1">{errors[f.key as string]}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100">Structured Address & Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addrFields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
              <input value={form[f.key]} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder} className={IC} data-field={f.key} aria-invalid={errors[f.key] ? 'true' : undefined} aria-describedby={errors[f.key] ? `${f.key}-err` : undefined} />
              {errors[f.key] && <p id={`${f.key}-err`} role="alert" className="text-red-600 text-sm mt-1">{errors[f.key]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitude</label>
            <input type="number" step="any" value={form.latitude} onChange={e => setField('latitude', e.target.value === '' ? '' : Number(e.target.value))} className={IC} data-field="latitude" aria-invalid={errors.latitude ? 'true' : undefined} aria-describedby={errors.latitude ? 'latitude-err' : undefined} />
            {errors.latitude && <p id="latitude-err" role="alert" className="text-red-600 text-sm mt-1">{errors.latitude}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitude</label>
            <input type="number" step="any" value={form.longitude} onChange={e => setField('longitude', e.target.value === '' ? '' : Number(e.target.value))} className={IC} data-field="longitude" aria-invalid={errors.longitude ? 'true' : undefined} aria-describedby={errors.longitude ? 'longitude-err' : undefined} />
            {errors.longitude && <p id="longitude-err" role="alert" className="text-red-600 text-sm mt-1">{errors.longitude}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Geocode Source</label>
            <select value={form.geocode_source} onChange={e => setField('geocode_source', e.target.value as GeocodeSource | '')} className={IC} data-field="geocode_source" aria-invalid={errors.geocode_source ? 'true' : undefined} aria-describedby={errors.geocode_source ? 'geocode_source-err' : undefined}><option value="">— select —</option><option value="manual">Manual</option><option value="google_places">Google Places</option></select>
            {errors.geocode_source && <p id="geocode_source-err" role="alert" className="text-red-600 text-sm mt-1">{errors.geocode_source}</p>}
          </div>
          <div>
            <button disabled title="Coming soon — todo: seo-option-c-upgrade" className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-400 cursor-not-allowed w-full mt-6">Geocode from address</button>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
            <select value={form.timezone} onChange={e => setField('timezone', e.target.value)} className={IC} data-field="timezone" aria-invalid={errors.timezone ? 'true' : undefined} aria-describedby={errors.timezone ? 'timezone-err' : undefined}>
              <option value="">— select —</option>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
            {errors.timezone && <p id="timezone-err" role="alert" className="text-red-600 text-sm mt-1">{errors.timezone}</p>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Business Hours</h3>
        <HoursGrid value={form.hours_structured} onChange={v => setField('hours_structured', v)} errors={errors} />
      </div>
      <div>
        <button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Business Info'}</button>
      </div>
    </div>
  )
}
