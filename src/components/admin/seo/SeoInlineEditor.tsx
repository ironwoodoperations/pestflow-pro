import type { ReactNode } from 'react'
import type { SeoPageRow, EditorForm, FindingSeverity } from './seoTypes'

// Count pill (e.g. 72/60). Green/amber/red logic unchanged from S2xx — extended
// only by the plain-language guidance line below (see lengthGuidance).
function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length
  const color = len > max ? 'text-red-500' : len > max - 10 ? 'text-amber-500' : 'text-gray-400'
  return <span className={`text-xs ${color}`}>{len}/{max}</span>
}

// Session A — turn the bare counter into plain-English coaching for a pest-control
// owner with no SEO background. NEVER names external tools (consistent with S261).
// Returns null when the field is empty (the placeholder + findings list already
// cover that) so we don't nag a blank field.
type Guidance = { text: string; tone: 'ok' | 'warn' }
function lengthGuidance(value: string, kind: 'title' | 'description'): Guidance | null {
  const len = value.length
  if (len === 0) return null
  if (kind === 'title') {
    if (len > 60) return { text: `${len} characters — Google shows about 60, so trim ~${len - 60}.`, tone: 'warn' }
    return { text: '✓ Good length — Google should show the whole headline.', tone: 'ok' }
  }
  if (len < 70) return { text: `${len} characters — add ~${70 - len}; aim for 70–160.`, tone: 'warn' }
  if (len > 160) return { text: `${len} characters — Google cuts this off; trim ~${len - 160} to fit 160.`, tone: 'warn' }
  return { text: '✓ Good length — Google should show the whole summary.', tone: 'ok' }
}

function GuidanceLine({ guidance }: { guidance: Guidance | null }) {
  if (!guidance) return null
  return (
    <p className={`text-xs mt-1 ${guidance.tone === 'warn' ? 'text-amber-600' : 'text-emerald-600'}`}>
      {guidance.text}
    </p>
  )
}

// Session A — the one-line, plain-English label helper shown under each field name.
function FieldHelp({ children }: { children: ReactNode }) {
  return <p className="text-xs text-gray-500 mt-0.5 mb-1.5">{children}</p>
}

const FINDING_DOT: Record<FindingSeverity, string> = {
  high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-slate-400',
}

// CHANGE 1 — surface the stored monthly-report findings inline, connecting the
// "Needs update (N)" badge → the report → this edit screen. Reuses the findings
// the badge already reads (page.findings); renders nothing when there are none.
function FlaggedFindings({ findings }: { findings: SeoPageRow['findings'] }) {
  if (!findings || findings.length === 0) return null
  return (
    <div className="bg-white border border-amber-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-amber-800 mb-1.5">What this month's report flagged:</p>
      <ul className="space-y-1">
        {findings.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
            <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${FINDING_DOT[f.severity]}`} />
            <span>{f.problem}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// CHANGE 3 — a live Google search-result (SERP) preview. The single best coaching
// tool for a non-expert: they watch their real result update as they type. Purely
// presentational (reads the open form), uses existing palette classes only.
function SerpPreview({ title, description, url, label }: { title: string; description: string; url: string; label: string }) {
  const shownTitle = title.trim() || label
  const shownDesc = description.trim()
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1.5">Google preview</p>
      <p className="text-emerald-700 text-xs truncate">{url}</p>
      <p className="text-blue-700 text-base leading-snug truncate">{shownTitle}</p>
      <p className={`text-sm leading-snug mt-0.5 line-clamp-2 ${shownDesc ? 'text-gray-600' : 'text-gray-400 italic'}`}>
        {shownDesc || 'No description set — Google will pick a snippet from your page, which may not sell your service.'}
      </p>
    </div>
  )
}

interface Props {
  page: SeoPageRow
  form: EditorForm
  saving: boolean
  aiGenerating: boolean
  aiGenerated: boolean
  onChange: (field: keyof EditorForm, value: string) => void
  onSave: () => void
  onCancel: () => void
  onAiGenerate: () => void
}

export default function SeoInlineEditor({ page, form, saving, aiGenerating, aiGenerated, onChange, onSave, onCancel, onAiGenerate }: Props) {
  const cls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
  return (
    <div className="bg-blue-50 border-t border-b border-blue-200 p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-blue-700">Editing SEO — {page.label}</p>
        <div className="flex items-center gap-2">
          {aiGenerated && <span className="text-xs text-emerald-700 font-medium">✓ Generated — review and save</span>}
          <button onClick={onAiGenerate} disabled={aiGenerating || saving}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">
            {aiGenerating
              ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Generating…</>
              : '✨ AI Generate'}
          </button>
        </div>
      </div>

      <FlaggedFindings findings={page.findings} />

      <SerpPreview title={form.meta_title} description={form.meta_description} url={page.url} label={page.label} />

      <div>
        <div className="flex justify-between items-center mb-0.5">
          <label className="text-xs font-medium text-gray-700">Meta Title</label>
          <CharCount value={form.meta_title} max={60} />
        </div>
        <FieldHelp>The headline Google shows in search results.</FieldHelp>
        <input value={form.meta_title} onChange={e => onChange('meta_title', e.target.value)} className={cls} placeholder="Page title for Google (50–60 chars)" />
        <GuidanceLine guidance={lengthGuidance(form.meta_title, 'title')} />
      </div>
      <div>
        <div className="flex justify-between items-center mb-0.5">
          <label className="text-xs font-medium text-gray-700">Meta Description</label>
          <CharCount value={form.meta_description} max={160} />
        </div>
        <FieldHelp>The summary under your title in Google results.</FieldHelp>
        <textarea value={form.meta_description} onChange={e => onChange('meta_description', e.target.value)} rows={2} className={cls} placeholder="Page description for Google (150–160 chars)" />
        <GuidanceLine guidance={lengthGuidance(form.meta_description, 'description')} />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-0.5">Focus Keyword</label>
        <FieldHelp>The one search term you most want this page to show up for (e.g. "pest control Tyler TX").</FieldHelp>
        <input value={form.focus_keyword} onChange={e => onChange('focus_keyword', e.target.value)} className={cls} placeholder="e.g. pest control Tyler TX" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-700">OG Title</label>
            <CharCount value={form.og_title} max={60} />
          </div>
          <input value={form.og_title} onChange={e => onChange('og_title', e.target.value)} className={cls} placeholder="Social share title" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-700">OG Description</label>
            <CharCount value={form.og_description} max={160} />
          </div>
          <input value={form.og_description} onChange={e => onChange('og_description', e.target.value)} className={cls} placeholder="Social share description" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-white">
          Cancel
        </button>
      </div>
    </div>
  )
}
