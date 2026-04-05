import type { ClientSetupForm } from '../types'
import { IMPLEMENTATION_PACKAGES } from '../../../../lib/pricingConfig'
import ShellSelector from '../components/ShellSelector'
import PaletteSelector from '../components/PaletteSelector'
import LogoUpload from '../components/LogoUpload'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function Step2PackageBranding({ form, setForm }: Props) {
  const selectedPkg = IMPLEMENTATION_PACKAGES.find(p => p.id === form.package_type)

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Package & Branding</h2>
      <p className="text-sm text-gray-500 mb-6">Select your setup package and visual identity.</p>

      {/* Package cards */}
      <div className="space-y-3 mb-4">
        {IMPLEMENTATION_PACKAGES.map(p => {
          const selected = form.package_type === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setForm({ package_type: p.id })}
              className={`w-full text-left rounded-xl border-2 px-5 py-4 transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <p className={`font-semibold text-sm ${selected ? 'text-emerald-700' : 'text-gray-900'}`}>{p.label}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{p.badge}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{p.description}</p>
            </button>
          )
        })}
      </div>

      <p className="text-sm text-gray-400 mb-6 text-center">
        Most Starter accounts can launch with little or no setup fee.
        Migration and custom work are quoted based on complexity.
      </p>

      {/* Template-based packages: shell + palette + logo */}
      {selectedPkg && !selectedPkg.requiresCurrentSite && (
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

      {/* Migration/custom packages: existing URL + logo + info box */}
      {selectedPkg?.requiresCurrentSite && (
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
