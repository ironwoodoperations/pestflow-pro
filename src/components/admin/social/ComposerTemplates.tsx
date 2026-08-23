import { useState } from 'react'
import { INDUSTRY_TEMPLATES, resolveTemplateKey } from './composerTemplateSets'

interface Props {
  industry: string
  /**
   * S285 — settings.business_info.vertical, the CHECK-constrained field.
   * Tried FIRST because `industry` is free text from an onboarding input and
   * does not reliably match any key: pls's stored value is a 154-character
   * service description, vita-glow's is "Medical Aesthetics". Both silently fell
   * through to 'generic' — the right answer by the wrong mechanism, and only by
   * luck.
   */
  vertical?: string | null
  businessName: string
  onSelectTopic: (topic: string) => void
}

export default function ComposerTemplates({ industry, vertical, businessName, onSelectTopic }: Props) {
  const [open, setOpen] = useState(false)
  // vertical -> industry -> generic. The industry path is DELIBERATELY KEPT:
  // 'hvac', 'plumbing' and 'roofing' have template sets but no vertical literal
  // (the constraint permits only 'pest' and 'irrigation'), so removing it would
  // strand three working sets. Migrating the industry column is a separate job.
  const templates = INDUSTRY_TEMPLATES[resolveTemplateKey(vertical, industry)] || INDUSTRY_TEMPLATES['generic']

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
        📋 Use a Template <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map(t => (
            <div key={t.id} className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <span className="text-sm font-medium text-gray-900">{t.name}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{t.description}</p>
              <button onClick={() => { onSelectTopic(t.topicPrompt.replace(/\{businessName\}/g, businessName)); setOpen(false) }}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700">Use →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
