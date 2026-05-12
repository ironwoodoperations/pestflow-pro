import type { ClientSetupForm } from '../types'
import type { GeocodeSource, HoursEntry } from '../../../../../shared/lib/businessInfoValidation'

const IC = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver']

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function HoursGrid({ value, onChange }: { value: HoursEntry[]; onChange: (v: HoursEntry[]) => void }) {
  const get = (d: string) => value.find(e => e.dayOfWeek === d)
  const toggle = (d: string) => { if (get(d)) onChange(value.filter(e => e.dayOfWeek !== d)); else onChange([...value, { dayOfWeek: d, opens: '09:00', closes: '17:00' }]) }
  const setTime = (d: string, f: 'opens' | 'closes', t: string) => onChange(value.map(e => e.dayOfWeek === d ? { ...e, [f]: t } : e))
  return (
    <div className="space-y-2">
      {DAYS.map((day, i) => {
        const e = get(day)
        return (
          <div key={day} className="flex items-center gap-2 flex-wrap">
            <span className="w-20 text-sm font-medium text-gray-700">{day.slice(0, 3)}</span>
            <label className="flex items-center gap-1.5 text-xs text-gray-600"><input type="checkbox" checked={!e} onChange={() => toggle(day)} /> Closed</label>
            <input type="time" value={e?.opens?.slice(0, 5) || ''} onChange={ev => setTime(day, 'opens', ev.target.value)} disabled={!e} data-field={`hours_structured.${i}`} aria-invalid={undefined} className={IC} />
            <input type="time" value={e?.closes?.slice(0, 5) || ''} onChange={ev => setTime(day, 'closes', ev.target.value)} disabled={!e} aria-invalid={undefined} className={IC} />
          </div>
        )
      })}
    </div>
  )
}

export default function Step1BusinessInfo({ form, setForm }: Props) {
  const f = (field: keyof ClientSetupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ [field]: e.target.value })

  function handleBizName(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setForm({ biz_name: name, slug: toSlug(name) })
  }

  function handleSlug(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '').replace(/(^-|-$)/g, '')
    setForm({ slug: val })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Business Info</h2>
      <p className="text-sm text-gray-500 mb-6">Core details about the client's business.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input value={form.biz_name} onChange={handleBizName} required className={IC} placeholder="Acme Pest Solutions" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Slug *</label>
          <input value={form.slug} onChange={handleSlug} required className={IC} placeholder="ironclad-pest" maxLength={40} />
          <p className="text-xs mt-1">
            {form.slug
              ? <span className="text-emerald-600">Your site will be at: <strong>{form.slug}.pestflowpro.ai</strong></span>
              : <span className="text-gray-400">Enter your company name above</span>
            }
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input type="tel" value={form.phone} onChange={f('phone')} required className={IC} placeholder="(903) 555-0100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={f('email')} required className={IC} placeholder="owner@business.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address (legacy) *</label>
          <input value={form.address} onChange={f('address')} required className={IC} placeholder="123 Main St, Tyler TX 75701" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours (legacy)</label>
          <input value={form.hours} onChange={f('hours')} className={IC} placeholder="Mon–Fri 8am–6pm, Sat 9am–2pm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
          <input value={form.tagline} onChange={f('tagline')} className={IC} placeholder="East Texas's Most Trusted Pest Control" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
          <input type="password" value={form.admin_password} onChange={f('admin_password')} required className={IC} placeholder="Temporary password for client login" />
          <p className="text-xs text-gray-400 mt-1">Client will use this to log in to their admin dashboard.</p>
        </div>
      </div>

      {/* Structured Address */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Structured Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: 'street_address',   label: 'Street Address', placeholder: '123 Main St' },
            { key: 'address_locality', label: 'City',           placeholder: 'Tyler' },
            { key: 'address_region',   label: 'State (2-letter)', placeholder: 'TX' },
            { key: 'postal_code',      label: 'ZIP Code',       placeholder: '75701' },
            { key: 'address_country',  label: 'Country Code',   placeholder: 'US' },
          ] as const).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input value={form[key] ?? ''} onChange={f(key)} placeholder={placeholder} className={IC} data-field={key} aria-invalid={undefined} />
            </div>
          ))}
        </div>
      </div>

      {/* Geolocation */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Geolocation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
            <input type="number" step="any" value={form.latitude ?? ''} onChange={e => setForm({ latitude: e.target.value === '' ? '' : Number(e.target.value) })} className={IC} data-field="latitude" aria-invalid={undefined} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
            <input type="number" step="any" value={form.longitude ?? ''} onChange={e => setForm({ longitude: e.target.value === '' ? '' : Number(e.target.value) })} className={IC} data-field="longitude" aria-invalid={undefined} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Geocode Source</label>
            <select value={form.geocode_source ?? ''} onChange={e => setForm({ geocode_source: e.target.value as GeocodeSource | '' })} className={IC} data-field="geocode_source" aria-invalid={undefined}>
              <option value="">— select —</option>
              <option value="manual">Manual</option>
              <option value="google_places">Google Places</option>
            </select>
          </div>
          <div className="flex items-end">
            <button disabled title="Coming soon" className="px-4 py-2 rounded-md border border-gray-200 text-xs text-gray-400 cursor-not-allowed w-full">Geocode from address</button>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Timezone</h3>
        <select value={form.timezone ?? ''} onChange={f('timezone')} className={IC} data-field="timezone" aria-invalid={undefined}>
          <option value="">— select —</option>
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>

      {/* Structured Hours */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Business Hours (structured)</h3>
        <HoursGrid value={form.hours_structured ?? []} onChange={v => setForm({ hours_structured: v })} />
      </div>
    </div>
  )
}
