import type { Prospect } from './types'

const BI_FIELDS: [string, string][] = [
  ['address','Address'],['hours','Hours'],['tagline','Tagline'],
  ['industry','Industry'],['license','License #'],
  ['certifications','Certifications'],['founded_year','Founded Year'],
  ['num_technicians','# Technicians'],
]
const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  form: Partial<Prospect>
  setField: (k: string, v: any) => void
  onBlur: () => void
}

export default function SiteContentSection({ form, setField, onBlur }: Props) {
  const bi = (form.business_info || {}) as Record<string, any>
  const setBi = (k: string, v: any) => setField('business_info', { ...bi, [k]: v })

  return (
    <div className="space-y-3">
      <p className="text-xs text-amber-400/80 italic">
        Filled automatically after intake submission — review and confirm
      </p>

      {/* Read-only: name, phone, email synced from Contact */}
      <div className="grid grid-cols-3 gap-2">
        {([['company_name','Business Name'],['phone','Phone'],['email','Email']] as [keyof Prospect, string][]).map(([k, lbl]) => (
          <div key={String(k)}>
            <label className="text-xs text-gray-400">{lbl}</label>
            <span className="block w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-400 truncate">
              {(form as any)[k] || <span className="italic text-gray-600">from contact</span>}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 italic -mt-1">Name, phone, and email sync automatically from the Contact section.</p>

      <div className="grid grid-cols-2 gap-2">
        {BI_FIELDS.map(([k, lbl]) => (
          <div key={k}>
            <label className="text-xs text-gray-400">{lbl}</label>
            <input className={inp} value={bi[k] || ''}
              onChange={e => setBi(k, e.target.value)} onBlur={onBlur} />
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs text-gray-400">Service Areas</label>
        <input className={inp} value={form.service_areas || ''}
          placeholder="e.g. Phoenix, Scottsdale, Tempe, Mesa"
          onChange={e => setField('service_areas', e.target.value)} onBlur={onBlur} />
        <p className="text-xs text-gray-600 mt-0.5">Comma-separated cities or counties</p>
      </div>
    </div>
  )
}
