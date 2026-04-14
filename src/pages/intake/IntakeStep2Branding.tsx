import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPalettesForShell } from '../../lib/shellThemes'

interface Props {
  form: Record<string, any>
  setForm: (f: Record<string, any>) => void
  token: string
  tier?: string
  buildPath?: string | null
}

const TEMPLATES = [
  { value: 'modern-pro',     label: 'Modern Pro',        desc: 'Dark navy, emerald accents. Clean and authoritative.' },
  { value: 'bold-local',     label: 'Bold & Local',      desc: 'Charcoal background, amber accents. High-energy, community-first.' },
  { value: 'clean-friendly', label: 'Clean & Friendly',  desc: 'White navbar, sky-blue accents. Approachable and residential.' },
  { value: 'rustic-rugged',  label: 'Rustic & Rugged',   desc: 'Warm brown, rust orange. Established and trustworthy.' },
  { value: 'metro-pro',     label: 'Metro Pro',          desc: 'Dark primary nav, sharp corners, diagonal hero. Enterprise and professional.', proOnly: true },
]

export default function IntakeStep2Branding({ form, setForm, token, tier, buildPath }: Props) {
  const [uploading, setUploading] = useState(false)
  const set = (k: string, v: any) => setForm({ ...form, [k]: v })
  const currentTemplate = form.template || 'modern-pro'

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `intake/${token}/logo.${ext}`
    setUploading(true)
    const { error } = await supabase.storage.from('tenant-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('tenant-assets').getPublicUrl(path)
      set('logo_url', urlData.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Branding</h2>
        <p className="text-sm text-gray-500 mt-1">All fields are optional — your rep can fill these in later if needed.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
        <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-orange-50 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-100 transition">
          {uploading ? 'Uploading…' : 'Upload Logo'}
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoUpload} disabled={uploading} />
        </label>
        {form.logo_url && (
          <div className="mt-3">
            <img src={form.logo_url} alt="Logo preview" className="h-16 object-contain rounded border border-gray-200" />
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">Best: PNG with transparent background, 200×60px</p>
      </div>

      {buildPath === 'full_custom' ? (
        <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-5 space-y-3">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">⚡ Pro Custom Build</p>
          <p className="text-sm text-indigo-900 font-medium leading-relaxed">
            Your site will be built to match your existing website — your brand colors, your content, and
            your layout structure — running on PestFlow Pro with the full admin dashboard underneath.
          </p>
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Here's what happens next:</p>
            <ol className="text-sm text-indigo-800 space-y-1 list-none">
              <li className="flex gap-2"><span className="font-bold text-indigo-500">1.</span> We scrape your existing site to capture your content and brand</li>
              <li className="flex gap-2"><span className="font-bold text-indigo-500">2.</span> Our AI analyzes your site and generates a custom layout</li>
              <li className="flex gap-2"><span className="font-bold text-indigo-500">3.</span> Your rep reviews and provisions your new site on a call with you</li>
              <li className="flex gap-2"><span className="font-bold text-indigo-500">4.</span> You get a reveal call to see your site before it goes live</li>
            </ol>
          </div>
          <p className="text-xs text-indigo-600 italic">No action needed on this step — your rep handles the rest.</p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Website Style</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.filter(t => !t.proOnly || tier === 'pro' || tier === 'elite').map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm({ ...form, template: t.value, primary_color: undefined, accent_color: undefined })}
                  className={`text-left p-4 rounded-xl border-2 transition ${currentTemplate === t.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{t.label}</span>
                    {currentTemplate === t.value && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Selected</span>}
                  </div>
                  <p className="text-gray-500 text-xs">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Color Palette</label>
            <div className="grid grid-cols-3 gap-3">
              {getPalettesForShell(currentTemplate).map(p => {
                const isActive = form.primary_color === p.primary && form.accent_color === p.accent
                return (
                  <button key={p.id} type="button"
                    onClick={() => setForm({ ...form, primary_color: p.primary, accent_color: p.accent })}
                    className={`rounded-xl border-2 overflow-hidden transition ${isActive ? 'border-orange-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex h-10">
                      <div className="flex-1" style={{ background: p.primary }} />
                      <div className="w-1/3" style={{ background: p.accent }} />
                    </div>
                    <div className="px-2 py-1.5 bg-white">
                      <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                      {isActive && <p className="text-xs text-orange-600 font-semibold">Selected</p>}
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Pick a preset or choose custom colors below.</p>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Colors (optional)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.primary_color || '#E87800'} onChange={e => set('primary_color', e.target.value)}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
              <span className="text-sm text-gray-600">{form.primary_color || '#E87800'}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Accent Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.accent_color || '#1a1a1a'} onChange={e => set('accent_color', e.target.value)}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
              <span className="text-sm text-gray-600">{form.accent_color || '#1a1a1a'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
