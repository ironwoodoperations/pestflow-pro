import type { Prospect } from './types'

interface Props {
  prospect: Partial<Prospect>
  onConfirm: () => void
  onCancel: () => void
}

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

function Check({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
      {pass
        ? <span className="text-green-500 text-lg leading-none">✓</span>
        : <span className="text-red-500 text-lg leading-none">✗</span>
      }
      <span className={`text-sm ${pass ? 'text-gray-700' : 'text-red-700 font-medium'}`}>{label}</span>
    </div>
  )
}

function Warning({ label, pass }: { label: string; pass: boolean }) {
  if (pass) {
    return (
      <div className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
        <span className="text-green-500 text-lg leading-none">✓</span>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-amber-500 text-lg leading-none">⚠</span>
      <span className="text-sm text-amber-700 font-medium">{label}</span>
    </div>
  )
}

export default function PreProvisionChecklist({ prospect, onConfirm, onCancel }: Props) {
  const bi = (prospect.business_info || {}) as Record<string, any>
  const br = (prospect.branding || {}) as Record<string, any>

  const required = [
    { label: 'Business Name',          pass: !!prospect.company_name?.trim() },
    { label: 'Owner Name',             pass: !!prospect.contact_name?.trim() },
    { label: 'Phone Number',           pass: !!prospect.phone?.trim() },
    { label: 'Email Address',          pass: !!(prospect.email?.trim() || prospect.admin_email?.trim()) },
    { label: 'Business Address',       pass: !!bi.address?.trim() },
    { label: 'Business Hours',         pass: !!bi.hours?.trim() },
    { label: 'Shell selected',         pass: !!br.template },
    { label: 'Palette selected',       pass: !!br.primary_color },
    { label: 'CTA Button Text',        pass: !!br.cta_text?.trim() },
    { label: 'At least one service area', pass: !!prospect.service_areas?.trim() },
    { label: 'Admin Email',            pass: !!prospect.admin_email?.trim() && isValidEmail(prospect.admin_email.trim()) },
    { label: 'Admin Password',         pass: !!prospect.admin_password?.trim() },
  ]

  const warnings = [
    {
      label: 'Setup Fee Paid',
      pass: !!prospect.payment_confirmed_at || ['paid', 'onboarding', 'provisioned', 'active'].includes(prospect.status || ''),
    },
  ]

  const failCount = required.filter(c => !c.pass).length
  const allPass = failCount === 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <h3 className="font-bold text-gray-900 text-lg mb-1">Ready to Create Site?</h3>
        <p className="text-sm text-gray-500 mb-4">Confirm all required fields are complete before provisioning.</p>

        <div className="mb-4">
          {required.map((c, i) => <Check key={i} label={c.label} pass={c.pass} />)}
        </div>

        {warnings.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Warnings (non-blocking)</p>
            {warnings.map((w, i) => <Warning key={i} label={w.label} pass={w.pass} />)}
          </div>
        )}

        {!allPass && (
          <p className="text-sm text-red-600 font-medium mb-4">
            Fix {failCount} issue{failCount !== 1 ? 's' : ''} before provisioning.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={!allPass}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Confirm — Create Site
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
