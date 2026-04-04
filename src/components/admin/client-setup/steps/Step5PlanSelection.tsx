import { CheckCircle } from 'lucide-react'
import type { ClientSetupForm } from '../types'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

const PLANS: { key: ClientSetupForm['plan']; name: string; price: string; features: string[] }[] = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$99/mo',
    features: ['Website', 'CRM', 'Basic SEO', 'Up to 3 locations', 'Team access'],
  },
  {
    key: 'grow',
    name: 'Grow',
    price: '$149/mo',
    features: ['All Starter features', 'Full SEO suite', 'Blog', 'Social scheduling'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$249/mo',
    features: ['All Grow features', 'AI tools', 'Advanced reports', 'Campaigns'],
  },
  {
    key: 'elite',
    name: 'Elite',
    price: '$499/mo',
    features: ['All Pro features', 'Social analytics', 'Ayrshare autopilot', 'Live reviews'],
  },
]

export default function Step5PlanSelection({ form, setForm }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Plan</h2>
      <p className="text-sm text-gray-500 mb-6">Choose the monthly subscription for this client.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map(p => {
          const selected = form.plan === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setForm({ plan: p.key })}
              className={`relative text-left rounded-xl border-2 p-5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {selected && <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-emerald-500" />}
              <p className={`text-base font-bold mb-0.5 ${selected ? 'text-emerald-700' : 'text-gray-900'}`}>{p.name}</p>
              <p className={`text-lg font-semibold mb-2 ${selected ? 'text-emerald-600' : 'text-gray-700'}`}>{p.price}</p>
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
