import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  prospect: {
    id: string
    company_name: string
    intake_data: any
    intake_submitted_at: string
    slug?: string
  }
}

const THEME_LABELS: Record<string, string> = {
  'modern-pro':     'Modern Pro',
  'bold-local':     'Bold & Local',
  'clean-friendly': 'Clean & Friendly',
  'rustic-rugged':  'Rustic & Rugged',
  'metro-pro':      'Metro Pro',
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null
  return (
    <div className="flex gap-3 py-1 border-b border-gray-100 print:border-gray-300">
      <span className="w-40 shrink-0 text-xs text-gray-500 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 break-all">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 pb-1 border-b border-gray-200">{title}</h3>
      {children}
    </div>
  )
}

export default function IntakeSubmissionViewer({ isOpen, onClose, prospect }: Props) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const d = prospect.intake_data || {}
  const biz = d.business || {}
  const brand = d.branding || {}
  const domain = d.domain || {}
  const social = d.social || {}

  const submittedAt = new Date(prospect.intake_submitted_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const hasSocial = Object.values(social).some(v => v)

  return (
    <>
      <style>{`@media print {
        body > *:not(#intake-viewer-print) { display: none !important; }
        #intake-viewer-print { position: static !important; padding: 24px !important; box-shadow: none !important; }
        #intake-viewer-print .no-print { display: none !important; }
      }`}</style>

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 no-print" onClick={onClose}>
        <div
          id="intake-viewer-print"
          className="relative bg-white w-full max-w-2xl mx-4 rounded-xl shadow-2xl p-8"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Client Intake Submission</h2>
                <p className="text-sm text-gray-500 mt-0.5">{prospect.company_name}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none no-print">×</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Submitted {submittedAt}</p>
          </div>

          {/* Business Info */}
          <Section title="Business Info">
            <Field label="Business Name"    value={biz.business_name} />
            <Field label="Owner Name"       value={biz.owner_name} />
            <Field label="Phone"            value={biz.phone} />
            <Field label="Email"            value={biz.email} />
            <Field label="Street Address"   value={biz.address} />
            <Field label="City"             value={biz.city} />
            <Field label="State"            value={biz.state} />
            <Field label="Zip"              value={biz.zip} />
            <Field label="Business Hours"   value={biz.hours} />
            <Field label="Tagline"          value={biz.tagline} />
            <Field label="License #"        value={biz.license_number} />
            <Field label="Founded Year"     value={biz.founded_year} />
            <Field label="# Technicians"    value={biz.num_technicians} />
          </Section>

          {/* Branding */}
          <Section title="Branding">
            <Field label="Website Style" value={THEME_LABELS[brand.template] ?? brand.template} />
            {brand.cta_text && <Field label="CTA Button Text" value={brand.cta_text} />}
            {(brand.primary_color || brand.accent_color) && (
              <div className="flex gap-3 py-1 border-b border-gray-100">
                <span className="w-40 shrink-0 text-xs text-gray-500 pt-0.5">Colors</span>
                <div className="flex items-center gap-3">
                  {brand.primary_color && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded border border-gray-200" style={{ background: brand.primary_color }} />
                      <span className="text-xs text-gray-600">{brand.primary_color}</span>
                    </div>
                  )}
                  {brand.accent_color && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded border border-gray-200" style={{ background: brand.accent_color }} />
                      <span className="text-xs text-gray-600">{brand.accent_color}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {brand.logo_url && (
              <div className="flex gap-3 py-1 border-b border-gray-100">
                <span className="w-40 shrink-0 text-xs text-gray-500 pt-0.5">Logo</span>
                <img src={brand.logo_url} alt="Logo" style={{ maxHeight: 80 }} className="object-contain rounded border border-gray-100" />
              </div>
            )}
          </Section>

          {/* Domain */}
          <Section title="Domain">
            <Field label="Has Domain"   value={domain.has_domain === true ? 'Yes' : domain.has_domain === false ? 'No' : domain.has_domain} />
            <Field label="Domain Name"  value={domain.domain_name} />
            <Field label="Registrar"    value={domain.domain_registrar} />
          </Section>

          {/* Social (conditional) */}
          {hasSocial && (
            <Section title="Social Links">
              <Field label="Facebook"  value={social.facebook_url} />
              <Field label="Instagram" value={social.instagram_url} />
              <Field label="Google"    value={social.google_business_url} />
              <Field label="YouTube"   value={social.youtube_url} />
            </Section>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 no-print">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition">
              Close
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition">
              🖨 Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
