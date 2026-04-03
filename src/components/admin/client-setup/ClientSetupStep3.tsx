import type { ClientSetupForm } from './types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

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
      <p className="text-sm text-gray-500 mb-6">Visual identity and domain info.</p>
      <div className="space-y-4">
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
