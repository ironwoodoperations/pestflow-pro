import type { Prospect } from './types'
import PaletteSwatches from './PaletteSwatches'

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

const SHELLS = [
  { id: 'modern-pro',      name: 'Modern Pro' },
  { id: 'bold-local',      name: 'Bold & Local' },
  { id: 'clean-friendly',  name: 'Clean & Friendly' },
  { id: 'rustic-rugged',   name: 'Rustic & Rugged' },
]
// name, phone, email are auto-populated from Contact section — read-only here
const BI_FIELDS: [string, string][] = [
  ['address','Address'],['hours','Hours'],['tagline','Tagline'],
  ['industry','Industry'],['license','License #'],
  ['certifications','Certifications'],['founded_year','Founded Year'],
  ['num_technicians','# Technicians'],
]
const CU_TOGGLES: [string, string][] = [
  ['show_license','Show License #'],['show_years','Show Years in Business'],
  ['show_technicians','Show # of Technicians'],['show_certifications','Show Certifications'],
]

const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  form: Partial<Prospect>
  setField: (k: string, v: any) => void
  onBlur: () => void
}

export default function SiteSetupSection({ form, setField, onBlur }: Props) {
  const bi = (form.business_info || {}) as Record<string, any>
  const br = (form.branding || {}) as Record<string, any>
  const cu = (form.customization || {}) as Record<string, any>

  const fallbackEmail =
    form.email?.trim() ||
    bi.email?.trim() ||
    (form as any).intake_data?.business?.email?.trim() ||
    ''

  const setBi = (k: string, v: any) => setField('business_info', { ...bi, [k]: v })
  const setBr = (k: string, v: any) => setField('branding', { ...br, [k]: v })
  const setCu = (k: string, v: any) => setField('customization', { ...cu, [k]: v })

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1">Site Setup</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400">Slug</label>
          <input className={inp} value={form.slug || ''}
            onChange={e => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} onBlur={onBlur} />
        </div>
        <div>
          <label className="text-xs text-gray-400">Admin Email</label>
          <input type="email"
            className={`${inp} ${form.admin_email && !isValidEmail(form.admin_email) ? 'border-red-500 focus:border-red-500' : ''}`}
            value={form.admin_email || ''}
            onChange={e => setField('admin_email', e.target.value)} onBlur={onBlur} />
          {form.admin_email && !isValidEmail(form.admin_email) && (
            <p className="text-xs text-red-400 mt-0.5">Must be a valid email (e.g. admin@company.com)</p>
          )}
          {!form.admin_email && fallbackEmail && (
            <button type="button"
              onClick={() => { setField('admin_email', fallbackEmail); onBlur() }}
              className="text-xs text-emerald-400 hover:text-emerald-300 mt-0.5 underline text-left">
              Use {fallbackEmail}
            </button>
          )}
          {!form.admin_email && !fallbackEmail && form.slug && (
            <p className="text-xs text-gray-600 mt-0.5">Suggested: admin@{form.slug}.com</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-400">Admin Password</label>
          <input className={inp} value={form.admin_password || ''}
            onChange={e => setField('admin_password', e.target.value)} onBlur={onBlur} />
        </div>
      </div>

      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Business Info</h4>
      {/* Name, Phone, Email are synced from Contact section above */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {([['company_name','Business Name'],['phone','Phone'],['email','Email']] as [keyof typeof form, string][]).map(([k, lbl]) => (
          <div key={String(k)}>
            <label className="text-xs text-gray-400">{lbl}</label>
            <div className="flex items-center gap-1">
              <span className="block w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-400 truncate">
                {(form as any)[k] || <span className="italic text-gray-600">from contact</span>}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 italic -mt-1 mb-2">Name, phone, and email sync automatically from the Contact section.</p>
      <div className="grid grid-cols-2 gap-2">
        {BI_FIELDS.map(([k, lbl]) => (
          <div key={k}>
            <label className="text-xs text-gray-400">{lbl}</label>
            <input className={inp} value={bi[k] || ''}
              onChange={e => setBi(k, e.target.value)} onBlur={onBlur} />
          </div>
        ))}
      </div>

      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Branding</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400">Shell</label>
          <select className={inp} value={br.template || ''}
            onChange={e => { setBr('template', e.target.value); onBlur() }}>
            <option value="">— Select —</option>
            {SHELLS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">CTA Button Text</label>
          <input className={inp} value={br.cta_text || ''} onChange={e => setBr('cta_text', e.target.value)} onBlur={onBlur} />
        </div>
        {br.template && (
          <PaletteSwatches
            shell={br.template}
            primary={br.primary_color || ''}
            accent={br.accent_color || ''}
            onSelect={(p, a) => { setBr('primary_color', p); setBr('accent_color', a); onBlur() }}
          />
        )}
        <div>
          <label className="text-xs text-gray-400">Primary Color</label>
          <div className="flex gap-2">
            <input type="color" value={br.primary_color || '#10b981'} onChange={e => { setBr('primary_color', e.target.value); onBlur() }}
              className="h-8 w-10 rounded cursor-pointer bg-transparent border-0" />
            <input className={`${inp} flex-1`} value={br.primary_color || ''} onChange={e => setBr('primary_color', e.target.value)} onBlur={onBlur} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Accent Color</label>
          <div className="flex gap-2">
            <input type="color" value={br.accent_color || '#0a0f1e'} onChange={e => { setBr('accent_color', e.target.value); onBlur() }}
              className="h-8 w-10 rounded cursor-pointer bg-transparent border-0" />
            <input className={`${inp} flex-1`} value={br.accent_color || ''} onChange={e => setBr('accent_color', e.target.value)} onBlur={onBlur} />
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-400">Hero Headline</label>
          <input className={inp} value={cu.hero_headline || ''} onChange={e => setCu('hero_headline', e.target.value)} onBlur={onBlur} />
        </div>
      </div>

      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Display Options</h4>
      <div className="grid grid-cols-2 gap-2">
        {CU_TOGGLES.map(([k, lbl]) => (
          <label key={k} className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={cu[k] ?? true} onChange={e => { setCu(k, e.target.checked); onBlur() }} />
            {lbl}
          </label>
        ))}
      </div>
    </div>
  )
}
