interface Props {
  form: Record<string, any>
  setForm: (f: Record<string, any>) => void
}

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

export default function IntakeStep1Business({ form, setForm }: Props) {
  const set = (k: string, v: string) => setForm({ ...form, [k]: v })

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
      <p className="text-sm text-gray-500">Tell us about your business so we can set up your site correctly.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name <span className="text-red-500">*</span></label>
        <input className={inp} value={form.business_name || ''} onChange={e => set('business_name', e.target.value)} placeholder="Acme Pest Control" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
          <input className={inp} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="(555) 555-5555" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <input type="email" className={inp} value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="contact@yourco.com" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
        <input className={inp} value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="123 Main St" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input className={inp} value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Tyler" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input className={inp} value={form.state || ''} onChange={e => set('state', e.target.value)} placeholder="TX" maxLength={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
          <input className={inp} value={form.zip || ''} onChange={e => set('zip', e.target.value)} placeholder="75701" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
        <input className={inp} value={form.hours || ''} onChange={e => set('hours', e.target.value)} placeholder="Mon–Fri 8am–6pm, Sat 9am–2pm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tagline / Slogan</label>
        <input className={inp} value={form.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="Protecting homes, one treatment at a time." />
      </div>
    </div>
  )
}
