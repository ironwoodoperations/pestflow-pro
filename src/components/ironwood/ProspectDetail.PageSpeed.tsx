import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'

interface Props {
  prospectId: string
  slug: string | null
  form: Partial<Prospect>
  onUpdate: (updates: Partial<Prospect>) => void
}

const inp = 'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500 text-center'

export default function PageSpeedSection({ prospectId, slug, form, onUpdate }: Props) {
  const [scores, setScores] = useState({
    ps_desktop_old: form.ps_desktop_old ?? ('' as string | number),
    ps_mobile_old:  form.ps_mobile_old  ?? ('' as string | number),
    ps_desktop_new: form.ps_desktop_new ?? ('' as string | number),
    ps_mobile_new:  form.ps_mobile_new  ?? ('' as string | number),
  })
  const [saving, setSaving] = useState(false)

  const psUrl = slug
    ? `https://pagespeed.web.dev/report?url=https://${slug}.pestflowpro.ai`
    : null

  async function saveScores() {
    setSaving(true)
    const updates = {
      ps_desktop_old: scores.ps_desktop_old !== '' ? Number(scores.ps_desktop_old) : null,
      ps_mobile_old:  scores.ps_mobile_old  !== '' ? Number(scores.ps_mobile_old)  : null,
      ps_desktop_new: scores.ps_desktop_new !== '' ? Number(scores.ps_desktop_new) : null,
      ps_mobile_new:  scores.ps_mobile_new  !== '' ? Number(scores.ps_mobile_new)  : null,
    }
    const { error } = await supabase.from('prospects').update(updates).eq('id', prospectId)
    if (error) toast.error('Save failed: ' + error.message)
    else { onUpdate(updates as Partial<Prospect>); toast.success('PageSpeed scores saved') }
    setSaving(false)
  }

  const deskDelta = scores.ps_desktop_new !== '' && scores.ps_desktop_old !== ''
    ? Number(scores.ps_desktop_new) - Number(scores.ps_desktop_old) : null
  const mobDelta = scores.ps_mobile_new !== '' && scores.ps_mobile_old !== ''
    ? Number(scores.ps_mobile_new) - Number(scores.ps_mobile_old) : null

  const delta = (n: number | null, label: string) => n === null ? null : (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${n >= 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
      {n >= 0 ? '+' : ''}{n} {label}
    </span>
  )

  return (
    <div className="space-y-4">
      {psUrl && (
        <a href={psUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition">
          Open PageSpeed ↗
        </a>
      )}

      <div className="grid grid-cols-3 gap-3 items-end">
        <div />
        <div className="text-xs font-semibold text-gray-400 text-center">Old Site</div>
        <div className="text-xs font-semibold text-gray-400 text-center">New Site</div>

        <div className="text-xs text-gray-500 text-right pr-2">Desktop</div>
        <input type="number" min={0} max={100} className={inp}
          value={scores.ps_desktop_old}
          onChange={e => setScores(s => ({ ...s, ps_desktop_old: e.target.value }))} />
        <input type="number" min={0} max={100} className={inp}
          value={scores.ps_desktop_new}
          onChange={e => setScores(s => ({ ...s, ps_desktop_new: e.target.value }))} />

        <div className="text-xs text-gray-500 text-right pr-2">Mobile</div>
        <input type="number" min={0} max={100} className={inp}
          value={scores.ps_mobile_old}
          onChange={e => setScores(s => ({ ...s, ps_mobile_old: e.target.value }))} />
        <input type="number" min={0} max={100} className={inp}
          value={scores.ps_mobile_new}
          onChange={e => setScores(s => ({ ...s, ps_mobile_new: e.target.value }))} />
      </div>

      {(deskDelta !== null || mobDelta !== null) && (
        <div className="flex gap-2 flex-wrap">
          {delta(deskDelta, 'Desktop')}
          {delta(mobDelta, 'Mobile')}
        </div>
      )}

      <button onClick={saveScores} disabled={saving}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Scores'}
      </button>
    </div>
  )
}
