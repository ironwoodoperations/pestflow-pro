import type { ClientSetupForm } from './types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function ClientSetupStep2({ form, setForm }: Props) {
  const f = (field: keyof ClientSetupForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ [field]: e.target.value })

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Business Info</h2>
      <p className="text-sm text-gray-500 mb-6">Core details about the client's business.</p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
            <input value={form.biz_name} onChange={f('biz_name')} required className={INPUT} placeholder="Ironclad Pest Solutions" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
            <input value={form.contact_name} onChange={f('contact_name')} required className={INPUT} placeholder="Marcus Webb" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input type="tel" value={form.phone} onChange={f('phone')} required className={INPUT} placeholder="(903) 555-0100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={f('email')} required className={INPUT} placeholder="owner@business.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <input value={form.address} onChange={f('address')} required className={INPUT} placeholder="123 Main St, Tyler TX 75701" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
          <input value={form.industry} onChange={f('industry')} required className={INPUT} placeholder="Pest Control" />
        </div>
      </div>
    </div>
  )
}
