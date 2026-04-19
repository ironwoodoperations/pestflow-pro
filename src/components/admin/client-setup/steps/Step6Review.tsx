import { PLAN_LABELS, type ClientSetupForm } from '../types'
import { IMPLEMENTATION_PACKAGES } from '../../../../lib/pricingConfig'

const THEME_NAMES: Record<string, string> = {
  'modern-pro':     'Modern Pro',
  'bold-local':     'Bold Local',
  'clean-friendly': 'Clean & Friendly',
  'rustic-rugged':  'Rustic & Rugged',
}

interface Props {
  form: ClientSetupForm
  onNext: () => void
  onBack: () => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex text-sm border-b border-gray-50 last:border-0">
      <span className="w-36 flex-shrink-0 px-4 py-2.5 text-gray-500 font-medium bg-gray-50">{label}</span>
      <span className="flex-1 px-4 py-2.5 text-gray-800 break-all">{value}</span>
    </div>
  )
}

export default function Step6Review({ form, onNext, onBack }: Props) {
  const pkg = IMPLEMENTATION_PACKAGES.find(p => p.id === form.package_type)
  const domainDisplay = form.no_domain
    ? 'No domain yet'
    : form.domain
      ? `${form.domain}${form.domain_registrar ? ` via ${form.domain_registrar}` : ''}`
      : '— not set'

  const socialFilled = [form.facebook, form.google, form.instagram, form.youtube].filter(Boolean)

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Client Details</h2>
      <p className="text-sm text-gray-500 mb-4">Confirm everything looks correct, then proceed to generate the payment link.</p>

      <div className="rounded-lg border border-gray-100 overflow-hidden mb-6">
        <Row label="Business" value={form.biz_name || '— not set'} />
        <Row label="Site URL" value={form.slug ? <span className="text-emerald-600 font-medium">{form.slug}.pestflowpro.com</span> : '— not set'} />
        <Row label="Contact" value={`${form.phone || '—'} · ${form.email || '—'}`} />
        <Row label="Address" value={form.address || '—'} />
        <Row label="Setup Type" value={pkg
          ? <span>{pkg.label} <span className="text-gray-400 text-xs">{pkg.badge}</span></span>
          : '— not selected'
        } />
        {pkg && !pkg.requiresCurrentSite && (
          <>
            <Row label="Template" value={THEME_NAMES[form.template] || form.template || '—'} />
            <Row label="Palette" value={
              form.primary_color
                ? <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: form.primary_color }} />
                    <span className="w-4 h-4 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: form.accent_color }} />
                    {form.palette_id || 'custom'}
                  </span>
                : '—'
            } />
          </>
        )}
        {pkg?.requiresCurrentSite && (
          <Row label="Source site" value={form.current_website_url || '—'} />
        )}
        <Row label="Logo" value={form.logo_url ? '✅ Uploaded' : 'Will add later'} />
        <Row label="Domain" value={domainDisplay} />
        <Row label="Social" value={socialFilled.length > 0 ? socialFilled.join(', ') : 'Will fill in during setup'} />
        <Row label="Plan" value={PLAN_LABELS[form.plan] || '— not selected'} />
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-sm"
      >
        Continue to Payment →
      </button>
      <div className="flex justify-start mt-6 pt-4 border-t border-gray-100">
        <button onClick={onBack}
          className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          ← Back
        </button>
      </div>
    </div>
  )
}
