import type { ClientSetupForm } from '../types'
import ShellSelector from '../components/ShellSelector'
import PaletteSelector from '../components/PaletteSelector'
import LogoUpload from '../components/LogoUpload'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

const PACKAGES = [
  { key: 'standard' as const, name: 'Standard Build',    price: '$2,000 setup', desc: 'Template-based site built in 1–2 business days' },
  { key: 'custom'   as const, name: 'Custom Migration',  price: '$3,500 setup', desc: 'We rebuild your existing site structure using your current content' },
  { key: 'premium'  as const, name: 'Premium Migration', price: '$5,000 setup', desc: 'Full custom redesign using your existing site as the foundation' },
]

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function Step2PackageBranding({ form, setForm }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Package & Branding</h2>
      <p className="text-sm text-gray-500 mb-6">Select your setup package and visual identity.</p>

      {/* Package cards */}
      <div className="space-y-3 mb-6">
        {PACKAGES.map(p => {
          const selected = form.package_type === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setForm({ package_type: p.key })}
              className={`w-full text-left rounded-xl border-2 px-5 py-4 transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <p className={`font-semibold text-sm ${selected ? 'text-emerald-700' : 'text-gray-900'}`}>{p.name}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{p.price}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Standard: shell + palette + logo */}
      {form.package_type === 'standard' && (
        <div className="space-y-5">
          <ShellSelector value={form.template} onChange={shell => setForm({ template: shell, palette_id: '', primary_color: '#10b981', accent_color: '#0a0f1e' })} />
          {form.template && (
            <PaletteSelector
              shell={form.template}
              selectedId={form.palette_id}
              onChange={(primary, accent, id) => setForm({ primary_color: primary, accent_color: accent, palette_id: id })}
            />
          )}
          <LogoUpload value={form.logo_url} onChange={url => setForm({ logo_url: url })} />
        </div>
      )}

      {/* Custom / Premium: existing URL + logo + info box */}
      {(form.package_type === 'custom' || form.package_type === 'premium') && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your current website URL</label>
            <input
              value={form.current_website_url}
              onChange={e => setForm({ current_website_url: e.target.value })}
              className={INPUT}
              placeholder="https://yoursite.com"
              type="url"
            />
          </div>
          <LogoUpload value={form.logo_url} onChange={url => setForm({ logo_url: url })} />
          <div className="bg-blue-950 border border-blue-700 rounded-lg p-4 text-sm text-blue-300">
            We'll use your existing site as the foundation for your new PestFlow Pro site.
            No template selection needed — our team handles the design.
          </div>
        </div>
      )}
    </div>
  )
}
