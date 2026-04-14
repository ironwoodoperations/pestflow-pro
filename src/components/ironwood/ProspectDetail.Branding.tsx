import type { Prospect } from './types'
import PaletteSwatches from './PaletteSwatches'

const ALL_SHELLS = [
  { id: 'metro-pro',     name: 'Metro Pro',         proOnly: true },
  { id: 'modern-pro',    name: 'Modern Pro',         proOnly: false },
  { id: 'bold-local',    name: 'Bold & Local',       proOnly: false },
  { id: 'clean-friendly', name: 'Clean & Friendly',  proOnly: false },
  { id: 'rustic-rugged', name: 'Rustic & Rugged',    proOnly: false },
  { id: 'youpest',       name: 'YouPest (Pro/Elite)', proOnly: true },
]
const CU_TOGGLES: [string, string][] = [
  ['show_license','Show License #'],['show_years','Show Years in Business'],
  ['show_technicians','Show # of Technicians'],['show_certifications','Show Certifications'],
]
const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500'

interface Props {
  form: Partial<Prospect>
  setField: (k: string, v: any) => void
  onBlur: () => void
}

export default function BrandingSection({ form, setField, onBlur }: Props) {
  const br = (form.branding || {}) as Record<string, any>
  const cu = (form.customization || {}) as Record<string, any>
  const isProOrElite = form.tier === 'pro' || form.tier === 'elite'
  const isFullCustom = form.build_path === 'full_custom'

  const setBr = (k: string, v: any) => setField('branding', { ...br, [k]: v })
  const setCu = (k: string, v: any) => setField('customization', { ...cu, [k]: v })

  const availableShells = ALL_SHELLS.filter(s => !s.proOnly || isProOrElite)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">

        {/* Shell picker — hidden for full_custom */}
        {isFullCustom ? (
          <div className="col-span-2 rounded-lg bg-gray-700/40 border border-gray-600 p-3 text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-300">Custom Build</span> — Shell and palette are determined during the custom build process. Colors will be extracted from the client's existing site.
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-400">Shell</label>
              <select className={inp} value={br.template || ''}
                onChange={e => { setBr('template', e.target.value); onBlur() }}>
                <option value="">— Select —</option>
                {availableShells.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id === 'metro-pro' && isProOrElite ? `★ ${s.name} — Recommended for Pro` : s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">CTA Button Text</label>
              <input
                className={`${inp} ${!br.cta_text ? 'border-red-500' : ''}`}
                value={br.cta_text || ''}
                onChange={e => setBr('cta_text', e.target.value)}
                onBlur={onBlur}
              />
              {!br.cta_text && <p className="text-red-500 text-xs mt-1">Required before provisioning</p>}
            </div>
            {/* Palette picker — hidden for full_custom */}
            {br.template && (
              <PaletteSwatches
                shell={br.template}
                primary={br.primary_color || ''}
                accent={br.accent_color || ''}
                onSelect={(p, a) => { setField('branding', { ...br, primary_color: p, accent_color: a }); onBlur() }}
              />
            )}
          </>
        )}

        <div>
          <label className="text-xs text-gray-400">Primary Color</label>
          <div className="flex gap-2">
            <input type="color" value={br.primary_color || '#10b981'}
              onChange={e => { setBr('primary_color', e.target.value); onBlur() }}
              className="h-8 w-10 rounded cursor-pointer bg-transparent border-0" />
            <input className={`${inp} flex-1`} value={br.primary_color || ''}
              onChange={e => setBr('primary_color', e.target.value)} onBlur={onBlur} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Accent Color</label>
          <div className="flex gap-2">
            <input type="color" value={br.accent_color || '#0a0f1e'}
              onChange={e => { setBr('accent_color', e.target.value); onBlur() }}
              className="h-8 w-10 rounded cursor-pointer bg-transparent border-0" />
            <input className={`${inp} flex-1`} value={br.accent_color || ''}
              onChange={e => setBr('accent_color', e.target.value)} onBlur={onBlur} />
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-400">Hero Headline</label>
          <input className={inp} value={cu.hero_headline || ''}
            onChange={e => setCu('hero_headline', e.target.value)} onBlur={onBlur} />
        </div>
      </div>

      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Display Options</h4>
      <div className="grid grid-cols-2 gap-2">
        {CU_TOGGLES.map(([k, lbl]) => (
          <label key={k} className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={cu[k] ?? true} onChange={e => { setCu(k, e.target.checked); onBlur() }} />
            {lbl}
          </label>
        ))}
      </div>
    </div>
  )
}
