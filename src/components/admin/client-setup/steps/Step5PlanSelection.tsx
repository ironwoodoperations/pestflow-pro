import { CheckCircle } from 'lucide-react'
import type { ClientSetupForm } from '../types'
import { MONTHLY_PLANS } from '../../../../lib/pricingConfig'

const PACKAGE_FEE_DEFAULTS: Record<string, number> = {
  'template-launch': 0,
  'growth-setup':    1000,
  'site-migration':  2750,
  'custom-rebuild':  0,
}

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function Step5PlanSelection({ form, setForm }: Props) {
  function handlePlanClick(key: ClientSetupForm['plan']) {
    const patch: Partial<ClientSetupForm> = { plan: key }
    // Pre-fill setup fee if not yet customised
    if (form.setup_fee_amount === 0 && form.package_type && PACKAGE_FEE_DEFAULTS[form.package_type] !== undefined) {
      patch.setup_fee_amount = PACKAGE_FEE_DEFAULTS[form.package_type]
    }
    setForm(patch)
  }

  const defaultFee = form.package_type ? (PACKAGE_FEE_DEFAULTS[form.package_type] ?? 0) : 0

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Plan</h2>
      <p className="text-sm text-gray-500 mb-6">Choose the monthly subscription for this client.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {MONTHLY_PLANS.map(p => {
          const key = p.name.toLowerCase() as ClientSetupForm['plan']
          const selected = form.plan === key
          return (
            <button
              key={p.tier}
              type="button"
              onClick={() => handlePlanClick(key)}
              className={`relative text-left rounded-xl border-2 p-5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {selected
                ? <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-emerald-500" />
                : p.badge
                  ? <span className="absolute top-3 right-3 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{p.badge}</span>
                  : null
              }
              <p className={`text-base font-bold mb-0.5 ${selected ? 'text-emerald-700' : 'text-gray-900'}`}>{p.name}</p>
              <p className={`text-lg font-semibold mb-2 ${selected ? 'text-emerald-600' : 'text-gray-700'}`}>${p.price}/mo</p>
              <ul className="space-y-1">
                {p.features.map(f => (
                  <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Setup Fee to Charge ($)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="number"
            min="0"
            step="50"
            value={form.setup_fee_amount}
            onChange={e => setForm({ setup_fee_amount: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Default for this package: ${defaultFee.toLocaleString()}. Enter 0 to waive the setup fee.
        </p>
      </div>
    </div>
  )
}
