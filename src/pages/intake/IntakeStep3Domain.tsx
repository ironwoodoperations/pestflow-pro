interface Props {
  form: Record<string, any>
  setForm: (f: Record<string, any>) => void
}

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

export default function IntakeStep3Domain({ form, setForm }: Props) {
  const set = (k: string, v: any) => setForm({ ...form, [k]: v })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Domain</h2>
        <p className="text-sm text-gray-500 mt-1">All fields optional — your rep will help sort out the domain details.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Do you already have a domain name?</label>
        <div className="flex gap-4">
          {['Yes', 'No', 'Not sure'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input type="radio" name="has_domain" value={opt}
                checked={form.do_you_have_domain === opt}
                onChange={() => set('do_you_have_domain', opt)}
                className="accent-orange-500" />
              {opt}
            </label>
          ))}
        </div>
      </div>

      {form.do_you_have_domain === 'Yes' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain Name</label>
            <input className={inp} value={form.domain_name || ''} onChange={e => set('domain_name', e.target.value)} placeholder="yourcompany.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain Registrar</label>
            <input className={inp} value={form.domain_registrar || ''} onChange={e => set('domain_registrar', e.target.value)} placeholder="e.g. GoDaddy, Namecheap, Google Domains" />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes about your domain (optional)</label>
        <textarea className={`${inp} resize-none`} rows={3} value={form.domain_notes || ''} onChange={e => set('domain_notes', e.target.value)}
          placeholder="Anything else we should know about your domain or hosting…" />
      </div>
    </div>
  )
}
