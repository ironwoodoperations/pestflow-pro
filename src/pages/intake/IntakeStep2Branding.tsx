import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  form: Record<string, any>
  setForm: (f: Record<string, any>) => void
  token: string
}

const TEMPLATES = [
  { value: 'modern-pro',     label: 'Modern Pro',        desc: 'Dark navy, emerald accents. Clean and authoritative.' },
  { value: 'bold-local',     label: 'Bold & Local',      desc: 'Charcoal background, amber accents. High-energy, community-first.' },
  { value: 'clean-friendly', label: 'Clean & Friendly',  desc: 'White navbar, sky-blue accents. Approachable and residential.' },
  { value: 'rustic-rugged',  label: 'Rustic & Rugged',   desc: 'Warm brown, rust orange. Established and trustworthy.' },
]

export default function IntakeStep2Branding({ form, setForm, token }: Props) {
  const [uploading, setUploading] = useState(false)
  const set = (k: string, v: any) => setForm({ ...form, [k]: v })

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Brand Color</label>
        <div className="flex items-center gap-3">
          <input type="color" value={form.primary_color || '#E87800'} onChange={e => set('primary_color', e.target.value)}
            className="h-10 w-14 rounded border border-gray-300 cursor-pointer" />
          <span className="text-sm text-gray-600">{form.primary_color || '#E87800'}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Website Style</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <button key={t.value} type="button"
              onClick={() => set('template', t.value)}
              className={`text-left p-4 rounded-xl border-2 transition ${form.template === t.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 text-sm">{t.label}</span>
                {form.template === t.value && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Selected</span>}
              </div>
              <p className="text-gray-500 text-xs">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
