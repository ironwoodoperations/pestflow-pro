import type { ClientSetupForm } from '../types'

const INPUT = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

const REGISTRARS = [
  'GoDaddy', 'Namecheap', 'Google Domains', 'Cloudflare', 'Network Solutions',
  'Squarespace', 'Wix', 'Bluehost', 'HostGator', 'Other',
]

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function Step3Domain({ form, setForm }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Domain</h2>
      <p className="text-sm text-gray-500 mb-6">Where does this client's domain live?</p>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.no_domain}
            onChange={e => setForm({ no_domain: e.target.checked, domain: '', domain_registrar: '' })}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700">I don't have a domain yet</span>
        </label>

        {form.no_domain ? (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
            No problem — we can help you register a domain during onboarding.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current domain</label>
              <input
                value={form.domain}
                onChange={e => setForm({ domain: e.target.value })}
                className={INPUT}
                placeholder="e.g. ironclad-pest.com"
                type="text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain registrar</label>
              <select
                value={form.domain_registrar}
                onChange={e => setForm({ domain_registrar: e.target.value })}
                className={INPUT}
              >
                <option value="">Select registrar…</option>
                {REGISTRARS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 leading-relaxed">
        We'll need to update your domain's DNS settings to point to your new site.
        Our team will walk you through this during onboarding — no technical knowledge needed.
      </p>
    </div>
  )
}
