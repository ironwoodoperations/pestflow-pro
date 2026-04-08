import { useState } from 'react'

export interface SiteRecreation {
  shell: string
  shellReason: string
  primaryColor: string
  accentColor: string
  heroHeadline: string
  ctaText: string
}

const SHELLS = [
  { id: 'modern-pro',     name: 'Modern Pro' },
  { id: 'clean-friendly', name: 'Clean & Friendly' },
  { id: 'bold-local',     name: 'Bold & Local' },
  { id: 'rustic-rugged',  name: 'Rustic & Rugged' },
  { id: 'youpest',        name: 'YouPest' },
]

const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  initial: SiteRecreation
  onApply: (data: SiteRecreation) => void
}

export default function SiteRecreationCard({ initial, onApply }: Props) {
  const [rec, setRec] = useState<SiteRecreation>(initial)
  const [applied, setApplied] = useState(false)

  const set = (k: keyof SiteRecreation, v: string) =>
    setRec(r => ({ ...r, [k]: v }))

  const handleApply = () => {
    onApply(rec)
    setApplied(true)
  }

  return (
    <div className="mt-4 border border-gray-700 rounded-xl p-4 bg-gray-900">
      <h4 className="font-semibold text-gray-200 text-sm mb-0.5">
        🎨 Site Recreation Analysis
      </h4>
      <p className="text-xs text-gray-500 mb-4">
        Review and edit before applying to prospect
      </p>

      {/* Shell */}
      <div className="mb-3">
        <label className="text-xs text-gray-400">Recommended Shell</label>
        <select className={inp} value={rec.shell}
          onChange={e => set('shell', e.target.value)}>
          {SHELLS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">{rec.shellReason}</p>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-400">Primary Color</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded border border-gray-600 shrink-0"
              style={{ backgroundColor: rec.primaryColor }} />
            <input className={inp} value={rec.primaryColor}
              onChange={e => set('primaryColor', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Accent Color</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded border border-gray-600 shrink-0"
              style={{ backgroundColor: rec.accentColor }} />
            <input className={inp} value={rec.accentColor}
              onChange={e => set('accentColor', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Headline + CTA */}
      <div className="mb-3">
        <label className="text-xs text-gray-400">Hero Headline</label>
        <input className={inp} value={rec.heroHeadline}
          onChange={e => set('heroHeadline', e.target.value)} />
      </div>
      <div className="mb-4">
        <label className="text-xs text-gray-400">CTA Button Text</label>
        <input className={inp} value={rec.ctaText}
          onChange={e => set('ctaText', e.target.value)} />
      </div>

      <button onClick={handleApply}
        className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition">
        Apply to Prospect
      </button>

      {applied && (
        <p className="text-emerald-400 text-xs mt-2 font-medium">
          ✓ Applied to prospect
        </p>
      )}
    </div>
  )
}
