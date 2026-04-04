import { CheckCircle, ExternalLink, Copy } from 'lucide-react'
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
    ['Template', form.template || 'modern-pro'],
    ['Domain', form.domain], ['Tagline', form.tagline],
    ['Primary Color', form.primary_color],
    ['Facebook', form.facebook || '—'], ['Instagram', form.instagram || '—'],
    ['Google', form.google || '—'], ['YouTube', form.youtube || '—'],
    ['Services', form.services || '—'],
    ['Place ID', form.google_place_id || '—'], ['GA4 ID', form.ga4_id || '—'],
    ['Notes', form.notes || '—'],
    ['Tenant ID', form.tenant_id || '— (auto-generated)'],
    ['Admin Email', form.email || '—'],
    ['Admin Password', form.admin_password || '— (not set — user will not be created)'],
  ]

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Provision</h2>
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
        {sending ? 'Provisioning…' : 'Provision Client & Download Setup Doc'}
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

interface SuccessProps {
  result: { slug: string; url: string; email: string; password: string } | null
  onReset: () => void
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm font-mono font-semibold text-gray-800 flex-1 mx-2 truncate">{value}</span>
      <button
        onClick={() => navigator.clipboard.writeText(value)}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        title="Copy"
      >
        <Copy className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ClientSetupSuccess({ result, onReset }: SuccessProps) {
  return (
    <div className="text-center py-6">
      <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
      <p className="text-lg font-semibold text-gray-900 mb-1">Client provisioned successfully</p>
      <p className="text-sm text-gray-500 mb-6">Setup doc downloaded and emailed to Ironwood.</p>

      {result && (
        <div className="text-left rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Client Login Credentials</p>
          <CopyRow label="Live Site" value={result.url} />
          <CopyRow label="Admin Login" value={`${result.url}/admin/login`} />
          <CopyRow label="Email" value={result.email} />
          <CopyRow label="Password" value={result.password} />
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Open Live Site
          </a>
        </div>
      )}

      <button onClick={onReset}
        className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
        Start New Client
      </button>
    </div>
  )
}
