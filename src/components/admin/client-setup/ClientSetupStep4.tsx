import type { ClientSetupForm } from './types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function ClientSetupStep4({ form, setForm }: Props) {
  const f = (field: keyof ClientSetupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ [field]: e.target.value })

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Social & Services</h2>
      <p className="text-sm text-gray-500 mb-6">Social profiles and what services the business offers.</p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
            <input value={form.facebook} onChange={f('facebook')} className={INPUT} placeholder="https://facebook.com/…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
            <input value={form.instagram} onChange={f('instagram')} className={INPUT} placeholder="https://instagram.com/…" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Business URL</label>
            <input value={form.google} onChange={f('google')} className={INPUT} placeholder="https://maps.google.com/…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
            <input value={form.youtube} onChange={f('youtube')} className={INPUT} placeholder="https://youtube.com/@…" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered</label>
          <textarea
            value={form.services}
            onChange={f('services')}
            rows={4}
            className={`${INPUT} resize-none`}
            placeholder="e.g. General Pest, Termite, Rodent, Mosquito, Bed Bug…"
          />
        </div>
      </div>
    </div>
  )
}
