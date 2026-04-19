import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { INITIAL_FORM, type ClientSetupForm } from './types'
import Step1BusinessInfo from './steps/Step1BusinessInfo'
import Step2PackageBranding from './steps/Step2PackageBranding'
import Step3Domain from './steps/Step3Domain'
import Step4SocialLinks from './steps/Step4SocialLinks'
import Step5PlanSelection from './steps/Step5PlanSelection'
import Step6Review from './steps/Step6Review'
import ClientSetupPayment from './ClientSetupPayment'

const STEP_LABELS = ['Business', 'Branding', 'Domain', 'Social', 'Plan', 'Review']

interface State { form: ClientSetupForm; step: number }

function canAdvance(step: number, form: ClientSetupForm): boolean {
  if (step === 1) return !!(form.biz_name.trim() && form.slug.trim() && form.phone.trim() && form.email.trim() && form.address.trim() && form.admin_password.trim())
  if (step === 2) return !!form.package_type
  if (step === 5) return !!form.plan
  return true
}

export default function ClientSetupWizard() {
  const [state, setState] = useState<State>({ form: INITIAL_FORM, step: 1 })
  const { form, step } = state

  const setForm = (patch: Partial<ClientSetupForm>) =>
    setState(s => ({ ...s, form: { ...s.form, ...patch } }))

  const goBack = () => setState(s => ({ ...s, step: s.step - 1 }))
  const goNext = () => setState(s => ({ ...s, step: s.step + 1 }))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar (6 steps) */}
      {step <= 6 && (
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
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
        {step === 1 && <Step1BusinessInfo form={form} setForm={setForm} />}
        {step === 2 && <Step2PackageBranding form={form} setForm={setForm} />}
        {step === 3 && <Step3Domain form={form} setForm={setForm} />}
        {step === 4 && <Step4SocialLinks form={form} setForm={setForm} />}
        {step === 5 && <Step5PlanSelection form={form} setForm={setForm} />}
        {step === 6 && (
          <Step6Review
            form={form}
            onNext={() => setState(s => ({ ...s, step: 7 }))}
            onBack={() => setState(s => ({ ...s, step: 5 }))}
          />
        )}
        {step === 7 && <ClientSetupPayment form={form} />}

        {step >= 1 && step <= 5 && (
          <div className="mt-8 pt-4 border-t border-gray-100">
            {!canAdvance(step, form) && (step === 1 || step === 2 || step === 5) && (
              <p className="text-xs text-amber-600 mb-3 text-center">
                {step === 1 ? 'Fill in all required fields (*) to continue.' : step === 2 ? 'Select a setup type to continue.' : 'Select a plan to continue.'}
              </p>
            )}
            <div className="flex justify-between">
              <button onClick={goBack} disabled={step === 1}
                className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
                ← Back
              </button>
              <button onClick={goNext} disabled={!canAdvance(step, form)}
                className="px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition">
                {step === 5 ? 'Review →' : 'Next →'}
              </button>
            </div>
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
