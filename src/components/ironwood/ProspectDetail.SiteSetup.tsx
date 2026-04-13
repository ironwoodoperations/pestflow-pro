import type { Prospect } from './types'

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  form: Partial<Prospect>
  setField: (k: string, v: any) => void
  onBlur: () => void
}

export default function SiteSetupSection({ form, setField, onBlur }: Props) {
  const bi = (form.business_info || {}) as Record<string, any>

  const fallbackEmail =
    form.email?.trim() ||
    bi.email?.trim() ||
    (form as any).intake_data?.business?.email?.trim() ||
    ''

  return (
    <div className="space-y-3">
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
            <p className="text-xs text-red-400 mt-0.5">Must be valid (e.g. admin@company.com)</p>
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

      {/* Read-only contact summary */}
      <div className="grid grid-cols-3 gap-2">
        {(['company_name', 'phone', 'email'] as const).map(k => (
          <div key={k}>
            <label className="text-xs text-gray-400 capitalize">{k === 'company_name' ? 'Business Name' : k}</label>
            <span className="block w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-400 truncate">
              {(form as any)[k] || <span className="italic text-gray-600">from contact</span>}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 italic -mt-1">Business name, phone, and email sync from the Contact section.</p>
    </div>
  )
}
