import type { SeoPageRow, EditorForm } from './seoTypes'

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length
  const color = len > max ? 'text-red-500' : len > max - 10 ? 'text-amber-500' : 'text-gray-400'
  return <span className={`text-xs ${color}`}>{len}/{max}</span>
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
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-medium text-gray-700">Meta Title</label>
          <CharCount value={form.meta_title} max={60} />
        </div>
        <input value={form.meta_title} onChange={e => onChange('meta_title', e.target.value)} className={cls} placeholder="Page title for Google (50–60 chars)" />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-medium text-gray-700">Meta Description</label>
          <CharCount value={form.meta_description} max={160} />
        </div>
        <textarea value={form.meta_description} onChange={e => onChange('meta_description', e.target.value)} rows={2} className={cls} placeholder="Page description for Google (150–160 chars)" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Focus Keyword</label>
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
