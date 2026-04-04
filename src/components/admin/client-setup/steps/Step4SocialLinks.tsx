import type { ClientSetupForm } from '../types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function Step4SocialLinks({ form, setForm }: Props) {
  const f = (field: keyof ClientSetupForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ [field]: e.target.value })

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Social Links</h2>
      <p className="text-sm text-gray-500 mb-1">Fill in what you have — we can find the rest during setup.</p>
      <p className="text-xs text-gray-400 mb-6">All fields optional.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page URL</label>
          <input value={form.facebook} onChange={f('facebook')} className={INPUT} placeholder="https://facebook.com/yourpage" type="url" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Business Profile URL</label>
          <input value={form.google} onChange={f('google')} className={INPUT} placeholder="https://maps.google.com/…" type="url" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
          <input value={form.instagram} onChange={f('instagram')} className={INPUT} placeholder="https://instagram.com/yourprofile" type="url" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Channel URL</label>
          <input value={form.youtube} onChange={f('youtube')} className={INPUT} placeholder="https://youtube.com/@yourchannel" type="url" />
        </div>
      </div>
    </div>
  )
}
