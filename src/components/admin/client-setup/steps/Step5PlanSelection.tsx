import { CheckCircle } from 'lucide-react'
import type { ClientSetupForm } from '../types'
import { MONTHLY_PLANS } from '../../../../lib/pricingConfig'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

export default function Step5PlanSelection({ form, setForm }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Plan</h2>
      <p className="text-sm text-gray-500 mb-6">Choose the monthly subscription for this client.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MONTHLY_PLANS.map(p => {
          const key = p.name.toLowerCase() as ClientSetupForm['plan']
          const selected = form.plan === key
          return (
            <button
              key={p.tier}
              type="button"
              onClick={() => setForm({ plan: key })}
              className={`relative text-left rounded-xl border-2 p-5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {selected && <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-emerald-500" />}
              {p.badge && (
                <span className="absolute top-3 right-3 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {p.badge}
                </span>
              )}
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
    </div>
  )
}
