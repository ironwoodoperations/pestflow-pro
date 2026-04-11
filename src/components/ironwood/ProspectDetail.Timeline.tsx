import type { Prospect } from './types'

interface Props {
  prospect: Partial<Prospect>
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OnboardingTimeline({ prospect }: Props) {
  const paymentDone = !!(prospect.payment_confirmed_at ||
    prospect.status === 'onboarding' || prospect.status === 'active')

  const steps = [
    {
      label: 'Prospect Added',
      date:  prospect.created_at,
      done:  true,
    },
    {
      label: 'Intake Submitted',
      date:  prospect.intake_submitted_at,
      done:  !!prospect.intake_submitted_at,
    },
    {
      label: 'Invoice Sent',
      date:  prospect.setup_invoice_sent_at,
      done:  !!prospect.setup_invoice_sent_at,
    },
    {
      label: 'Payment Confirmed',
      date:  prospect.payment_confirmed_at,
      done:  paymentDone,
    },
    {
      label: 'Site Provisioned',
      date:  prospect.provisioned_at,
      done:  !!prospect.tenant_id,
    },
  ]

  return (
    <div>
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-3">Onboarding Progress</h3>
      <div className="pl-1">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                step.done
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-500'
              }`}>
                {step.done ? '✓' : <span className="text-gray-600">·</span>}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-px h-4 mt-0.5 ${step.done ? 'bg-emerald-700' : 'bg-gray-700'}`} />
              )}
            </div>
            <div className="pb-0.5 -mt-0.5">
              <span className={`text-xs font-medium ${step.done ? 'text-gray-200' : 'text-gray-500'}`}>
                {step.label}
              </span>
              {step.date && (
                <span className="text-xs text-gray-500 ml-2">{fmt(step.date)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
