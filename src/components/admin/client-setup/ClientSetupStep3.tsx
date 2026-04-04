import type { ClientSetupForm } from './types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

const SHELLS = [
  { key: 'modern-pro',     name: 'Modern Pro',     desc: 'Navy + emerald, centered hero' },
  { key: 'bold-local',     name: 'Bold Local',     desc: 'Charcoal + amber, 2-col split hero' },
  { key: 'clean-friendly', name: 'Clean & Friendly', desc: 'White + sky, giant phone CTA' },
  { key: 'rustic-rugged',  name: 'Rustic & Rugged',  desc: 'Brown + rust, left/right split' },
]

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function ClientSetupStep3({ form, setForm }: Props) {
  const f = (field: keyof ClientSetupForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ [field]: e.target.value })

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Branding</h2>
      <p className="text-sm text-gray-500 mb-6">Visual identity, domain, and site template.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site Template *</label>
          <div className="grid grid-cols-2 gap-3">
            {SHELLS.map(s => {
              const selected = form.template === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setForm({ template: s.key })}
                  className={`text-left rounded-lg border-2 px-4 py-3 transition ${
                    selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-semibold ${selected ? 'text-emerald-700' : 'text-gray-800'}`}>{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
          <input value={form.logo_url} onChange={f('logo_url')} className={INPUT} placeholder="https://…/logo.png" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={form.primary_color}
              onChange={f('primary_color')}
              className="h-9 w-14 rounded border border-slate-200 cursor-pointer p-0.5"
            />
            <input
              value={form.primary_color}
              onChange={f('primary_color')}
              className="w-36 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              placeholder="#10b981"
              maxLength={7}
            />
            <div className="w-9 h-9 rounded-lg border border-gray-200 flex-shrink-0" style={{ background: form.primary_color }} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
          <input value={form.tagline} onChange={f('tagline')} className={INPUT} placeholder="East Texas's Most Trusted Pest Control" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website Domain</label>
          <input value={form.domain} onChange={f('domain')} className={INPUT} placeholder="ironclad pest.com" />
        </div>
      </div>
    </div>
  )
}
