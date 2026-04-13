interface Props {
  form: Record<string, any>
  setForm: (f: Record<string, any>) => void
}

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

const FIELDS: [string, string, string][] = [
  ['facebook_url',       'Facebook Page',          'https://facebook.com/yourbusiness'],
  ['instagram_url',      'Instagram Profile',      'https://instagram.com/yourbusiness'],
  ['google_business_url','Google Business Profile','https://maps.google.com/…'],
  ['youtube_url',        'YouTube Channel',        'https://youtube.com/@yourbusiness'],
]

export default function IntakeStep4Social({ form, setForm }: Props) {
  const set = (k: string, v: string) => setForm({ ...form, [k]: v })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Social Media</h2>
        <p className="text-sm text-gray-500 mt-1">Paste any links to your existing social profiles. All optional.</p>
      </div>

      {/* Panel 1 — How Your Social Media Works */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-slate-700 p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">How Your Social Media Works</h3>
        <ol className="space-y-2 mb-3">
          <li className="flex gap-3 text-sm text-gray-700">
            <span className="flex-shrink-0 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span><strong>You write it</strong> — Log into your dashboard, go to the Social tab, and write your post. The built-in AI can generate captions for you.</span>
          </li>
          <li className="flex gap-3 text-sm text-gray-700">
            <span className="flex-shrink-0 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span><strong>You schedule it</strong> — Pick your platforms, date, and time. Hit Schedule.</span>
          </li>
          <li className="flex gap-3 text-sm text-gray-700">
            <span className="flex-shrink-0 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span><strong>The platform posts it</strong> — Your post goes live automatically. No logging into each platform.</span>
          </li>
        </ol>
        <p className="text-xs text-gray-500">Connects to: Facebook · Instagram · YouTube · LinkedIn</p>
      </div>

      {/* Panel 2 — One-Time Setup */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-500 p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-2">One-Time Setup</h3>
        <p className="text-sm text-gray-700 mb-3">
          To enable automatic posting, we need to connect your accounts on our end. All we need is admin access on your Facebook Page — Instagram connects through it automatically.
        </p>
        <div className="bg-orange-50 rounded-lg px-4 py-2.5 mb-3 text-sm font-semibold text-orange-900">
          Add <span className="font-mono">hello@pestflowpro.com</span> as Admin on your Facebook Page
        </div>
        <ol className="space-y-1 mb-3">
          <li className="text-xs text-gray-600 flex gap-2">
            <span className="text-orange-500 font-bold">1.</span>
            Go to your Facebook Page → Settings → Page Roles
          </li>
          <li className="text-xs text-gray-600 flex gap-2">
            <span className="text-orange-500 font-bold">2.</span>
            Click "Add New Page Role" → enter hello@pestflowpro.com → set role to Admin → Save
          </li>
          <li className="text-xs text-gray-600 flex gap-2">
            <span className="text-orange-500 font-bold">3.</span>
            That's it. We handle everything else.
          </li>
        </ol>
        <p className="text-xs text-gray-400 italic">No passwords needed. Admin access only — removable at any time from your Facebook Settings.</p>
      </div>

      {FIELDS.map(([key, label, placeholder]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input className={inp} value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Any other notes?</label>
        <textarea className={`${inp} resize-none`} rows={3} value={form.any_other_notes || ''} onChange={e => set('any_other_notes', e.target.value)}
          placeholder="Anything else you'd like us to know…" />
      </div>
    </div>
  )
}
