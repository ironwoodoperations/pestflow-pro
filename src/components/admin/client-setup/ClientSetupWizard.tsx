import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { INITIAL_FORM, PLAN_LABELS, type ClientSetupForm } from './types'
import ClientSetupStep1 from './ClientSetupStep1'
import ClientSetupStep2 from './ClientSetupStep2'
import ClientSetupStep3 from './ClientSetupStep3'
import ClientSetupStep4 from './ClientSetupStep4'
import ClientSetupStep5 from './ClientSetupStep5'
import ClientSetupReview from './ClientSetupReview'
import ClientSetupPayment from './ClientSetupPayment'

const STEP_LABELS = ['Plan', 'Business', 'Branding', 'Social', 'Integrations', 'Review', 'Payment']

interface State { form: ClientSetupForm; step: number }

function isStep2Valid(f: ClientSetupForm) {
  return f.biz_name.trim() && f.slug.trim() && f.contact_name.trim() && f.phone.trim() && f.email.trim() && f.address.trim() && f.industry.trim()
}

export default function ClientSetupWizard() {
  const [state, setState] = useState<State>({ form: INITIAL_FORM, step: 1 })
  const { form, step } = state

  const setForm = (patch: Partial<ClientSetupForm>) =>
    setState(s => ({ ...s, form: { ...s.form, ...patch } }))

  const canNext = () => {
    if (step === 1) return !!form.plan
    if (step === 2) return !!isStep2Valid(form)
    return true
  }

  const PLAN_MAP: Record<string, string> = { ...PLAN_LABELS }
  void PLAN_MAP

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={n} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <CheckCircle size={14} /> : n}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
        {step === 1 && <ClientSetupStep1 form={form} setForm={setForm} />}
        {step === 2 && <ClientSetupStep2 form={form} setForm={setForm} />}
        {step === 3 && <ClientSetupStep3 form={form} setForm={setForm} />}
        {step === 4 && <ClientSetupStep4 form={form} setForm={setForm} />}
        {step === 5 && <ClientSetupStep5 form={form} setForm={setForm} />}
        {step === 6 && (
          <ClientSetupReview
            form={form}
            onNext={() => setState(s => ({ ...s, step: 7 }))}
            onBack={() => setState(s => ({ ...s, step: 5 }))}
          />
        )}
        {step === 7 && (
          <ClientSetupPayment form={form} />
        )}

        {step < 6 && (
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <button onClick={() => setState(s => ({ ...s, step: s.step - 1 }))} disabled={step === 1}
              className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
              Back
            </button>
            <button onClick={() => setState(s => ({ ...s, step: s.step + 1 }))} disabled={!canNext()}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition">
              {step === 5 ? 'Review →' : 'Next →'}
            </button>
          </div>
        )}

        {step === 7 && (
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <button onClick={() => setState(s => ({ ...s, step: 6 }))}
              className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              ← Back
            </button>
            <button onClick={() => setState({ form: INITIAL_FORM, step: 1 })}
              className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">
              Start New Client
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
