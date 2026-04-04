import type { ClientSetupForm } from '../types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function Step1BusinessInfo({ form, setForm }: Props) {
  const f = (field: keyof ClientSetupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ [field]: e.target.value })

  function handleBizName(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setForm({ biz_name: name, slug: toSlug(name) })
  }

  function handleSlug(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '').replace(/(^-|-$)/g, '')
    setForm({ slug: val })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Business Info</h2>
      <p className="text-sm text-gray-500 mb-6">Core details about the client's business.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input value={form.biz_name} onChange={handleBizName} required className={INPUT} placeholder="Ironclad Pest Solutions" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Slug *</label>
          <input
            value={form.slug}
            onChange={handleSlug}
            required
            className={INPUT}
            placeholder="ironclad-pest"
            maxLength={40}
          />
          <p className="text-xs mt-1">
            {form.slug
              ? <span className="text-emerald-600">Your site will be at: <strong>{form.slug}.pestflowpro.com</strong></span>
              : <span className="text-gray-400">Enter your company name above</span>
            }
          </p>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
          <input value={form.hours} onChange={f('hours')} className={INPUT} placeholder="Mon–Fri 8am–6pm, Sat 9am–2pm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
          <input value={form.tagline} onChange={f('tagline')} className={INPUT} placeholder="East Texas's Most Trusted Pest Control" />
        </div>
      </div>
    </div>
  )
}
