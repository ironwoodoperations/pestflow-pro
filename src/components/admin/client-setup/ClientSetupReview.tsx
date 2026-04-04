import { CheckCircle } from 'lucide-react'
import { PLAN_LABELS, type ClientSetupForm } from './types'

interface Props {
  form: ClientSetupForm
  sending: boolean
  onExport: () => void
  onBack: () => void
}

export default function ClientSetupReview({ form, sending, onExport, onBack }: Props) {
  const rows: [string, string][] = [
    ['Plan', PLAN_LABELS[form.plan] || '—'],
    ['Business', form.biz_name],
    ['Slug', form.slug ? `${form.slug}.pestflowpro.com` : '— (not set)'],
    ['Contact', form.contact_name],
    ['Phone', form.phone], ['Email', form.email],
    ['Address', form.address], ['Industry', form.industry],
    ['Domain', form.domain], ['Tagline', form.tagline],
    ['Primary Color', form.primary_color],
    ['Facebook', form.facebook || '—'], ['Instagram', form.instagram || '—'],
    ['Google', form.google || '—'], ['YouTube', form.youtube || '—'],
    ['Services', form.services || '—'],
    ['Place ID', form.google_place_id || '—'], ['GA4 ID', form.ga4_id || '—'],
    ['Notes', form.notes || '—'],
    ['Tenant ID', form.tenant_id || '— (not set — provisioning will be skipped)'],
  ]

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Export</h2>
      <div className="rounded-lg border border-gray-100 overflow-hidden mb-6">
        {rows.map(([label, value]) => (
          <div key={label} className="flex text-sm border-b border-gray-50 last:border-0">
            <span className="w-32 flex-shrink-0 px-4 py-2.5 text-gray-500 font-medium bg-gray-50">{label}</span>
            <span className="flex-1 px-4 py-2.5 text-gray-800 break-all">{value}</span>
          </div>
        ))}
      </div>
      <button onClick={onExport} disabled={sending}
        className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition text-sm">
        {sending ? 'Exporting…' : 'Export & Send to Ironwood'}
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

export function ClientSetupSuccess({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-8">
      <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
      <p className="text-lg font-semibold text-gray-900 mb-1">Setup file downloaded and emailed to Ironwood</p>
      <p className="text-sm text-gray-500 mb-6">Check scott@ironwoodoperationsgroup.com for the setup doc.</p>
      <button onClick={onReset}
        className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
        Start New Client
      </button>
    </div>
  )
}
