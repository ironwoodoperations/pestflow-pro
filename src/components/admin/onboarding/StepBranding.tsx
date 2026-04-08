import { ArrowLeft } from 'lucide-react'
import type { FormData } from './types'
import { INPUT_CLASS } from './types'

const TEMPLATES = [
  { value: 'bold-local' as const,     label: 'Bold',   desc: 'Dark navy backgrounds, emerald accents, Oswald display font', colors: 'from-emerald-600 to-gray-900', swatch: '#10b981' },
  { value: 'clean-friendly' as const, label: 'Clean',  desc: 'White backgrounds, navy accents, professional serif headings', colors: 'from-white to-blue-900', swatch: '#1d4ed8' },
  { value: 'modern-pro' as const,     label: 'Modern', desc: 'Dark backgrounds, teal accents, monospace headings', colors: 'from-gray-800 to-gray-950', swatch: '#14b8a6' },
  { value: 'rustic-rugged' as const,  label: 'Rustic', desc: 'Warm brown backgrounds, amber accents, serif headings', colors: 'from-amber-600 to-amber-950', swatch: '#d97706' },
]

interface Props {
  form: FormData
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  onNext: () => void
  onBack: () => void
}

export default function StepBranding({ form, updateField, onNext, onBack }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Branding & Design</h2>
        <p className="text-gray-500 text-sm mt-1">Choose a look for your website. These settings control colors, fonts, and layout across all pages.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Logo URL <span className="text-gray-400 font-normal">(optional)</span></label>
        <input className={INPUT_CLASS} value={form.logoUrl} onChange={e => updateField('logoUrl', e.target.value)} placeholder="https://example.com/logo.png" />
        <p className="text-xs text-gray-400 mt-1">Don't have one yet? No problem — your business name will be used instead.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer" />
            <input className={INPUT_CLASS} value={form.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Accent Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer" />
            <input className={INPUT_CLASS} value={form.accentColor} onChange={e => updateField('accentColor', e.target.value)} />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Website Template</label>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <button key={t.value} type="button" onClick={() => updateField('template', t.value)}
              className={`rounded-xl p-4 border-2 transition text-left ${form.template === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-8 flex-1 rounded-lg bg-gradient-to-r ${t.colors}`} />
                <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: t.swatch }} />
              </div>
              <p className="font-semibold text-sm text-gray-900">{t.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition text-sm"><ArrowLeft size={16} /> Back</button>
        <button onClick={onNext} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-3 rounded-lg transition">Next →</button>
      </div>
    </div>
  )
}
