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
