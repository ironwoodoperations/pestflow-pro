import type { ClientSetupForm } from './types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
}

function genPassword(slug: string): string {
  if (!slug) return ''
  return slug.charAt(0).toUpperCase() + slug.slice(1) + 'Pest26!'
}

export default function ClientSetupStep2({ form, setForm }: Props) {
  const f = (field: keyof ClientSetupForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ [field]: e.target.value })

  const handleBizName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const autoSlug = toSlug(name)
    setForm({ biz_name: name, slug: autoSlug, admin_password: genPassword(autoSlug) })
  }

  const handleSlug = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
    setForm({ slug: val, admin_password: genPassword(val) })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Business Info</h2>
      <p className="text-sm text-gray-500 mb-6">Core details about the client's business.</p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
            <input value={form.biz_name} onChange={handleBizName} required className={INPUT} placeholder="Ironclad Pest Solutions" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
            <input value={form.contact_name} onChange={f('contact_name')} required className={INPUT} placeholder="Marcus Webb" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Slug *</label>
          <div className="flex items-center gap-1">
            <input
              value={form.slug}
              onChange={handleSlug}
              required
              className={INPUT}
              placeholder="ironclad"
              pattern="[a-z0-9]+"
              maxLength={20}
            />
          </div>
          {form.slug ? (
            <p className="text-xs text-emerald-600 mt-1">
              Live at: <span className="font-medium">{form.slug}.pestflowpro.com</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Lowercase letters and numbers only. Auto-filled from business name.</p>
          )}
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
