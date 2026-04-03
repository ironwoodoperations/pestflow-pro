import type { ClientSetupForm } from './types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function ClientSetupStep5({ form, setForm }: Props) {
  const f = (field: keyof ClientSetupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ [field]: e.target.value })

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Integrations & Notes</h2>
      <p className="text-sm text-gray-500 mb-6">Optional tracking IDs and any extra notes.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Place ID</label>
          <input value={form.google_place_id} onChange={f('google_place_id')} className={INPUT} placeholder="ChIJ…" />
          <p className="text-xs text-gray-400 mt-1">Find this in Google Maps → Share → embed URL</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GA4 Measurement ID</label>
          <input value={form.ga4_id} onChange={f('ga4_id')} className={INPUT} placeholder="G-XXXXXXXXXX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea
            value={form.notes}
            onChange={f('notes')}
            rows={5}
            className={`${INPUT} resize-none`}
            placeholder="Anything special about this client's setup…"
          />
        </div>
      </div>
    </div>
  )
}
