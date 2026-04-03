import { CheckCircle } from 'lucide-react'
import type { ClientSetupForm } from './types'
import { PLAN_LABELS } from './types'

interface Props {
  form: ClientSetupForm
  setForm: (patch: Partial<ClientSetupForm>) => void
}

const PLANS: { key: ClientSetupForm['plan']; name: string; price: string; tagline: string }[] = [
  { key: 'starter', name: 'Starter', price: '$149/mo', tagline: 'Website + CRM + basic SEO' },
  { key: 'grow',    name: 'Grow',    price: '$249/mo', tagline: 'Full SEO + Blog + Social scheduling' },
  { key: 'pro',     name: 'Pro',     price: '$349/mo', tagline: 'AI tools + campaigns + advanced reports' },
  { key: 'elite',   name: 'Elite',   price: '$499/mo', tagline: 'All platforms + live reviews + priority support' },
]

export default function ClientSetupStep1({ form, setForm }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Plan</h2>
      <p className="text-sm text-gray-500 mb-6">Choose the plan this client is signing up for.</p>
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
              {selected && (
                <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-emerald-500" />
              )}
              <p className={`text-base font-bold mb-0.5 ${selected ? 'text-emerald-700' : 'text-gray-900'}`}>
                {p.name}
              </p>
              <p className={`text-lg font-semibold mb-1 ${selected ? 'text-emerald-600' : 'text-gray-700'}`}>
                {p.price}
              </p>
              <p className="text-xs text-gray-500 leading-snug">{p.tagline}</p>
            </button>
          )
        })}
      </div>
      {form.plan && (
        <p className="mt-4 text-xs text-gray-400 text-center">
          Selected: <span className="font-medium text-gray-600">{PLAN_LABELS[form.plan]}</span>
        </p>
      )}
    </div>
  )
}
