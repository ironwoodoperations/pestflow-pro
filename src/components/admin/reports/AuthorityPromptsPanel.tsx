// S289 — the AI Authority prompt list, editable by the tenant.
//
// Until now there was NO surface for these at all: the AI Authority tile shows
// scores, and the prompts behind those scores existed only as rows someone had
// typed into the database by hand for one tenant. A generated list nobody can
// correct is a list that goes stale the first time a business adds a service or
// stops covering a town, so generation and editing ship together.
//
// These are SEARCH QUERIES issued on the tenant's behalf, not copy published
// about them — "best pest control in Tyler TX" asks a question, it does not
// claim an answer. Suggestions are built from the tenant's own facts only.

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Sparkles, Trash2, Plus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../context/TenantBootProvider'
import { useAdminPreset } from '../../../hooks/useAdminPreset'
import { generateAuthorityPrompts } from '../../../../supabase/functions/_shared/authorityPrompts'

interface PromptRow { id: string; prompt_text: string; active: boolean }

export default function AuthorityPromptsPanel() {
  const { id: tenantId } = useTenant()
  const { preset, vertical } = useAdminPreset()
  const [rows, setRows] = useState<PromptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  const load = useCallback(() => {
    if (!tenantId) return
    supabase.from('ai_authority_prompts')
      .select('id, prompt_text, active').eq('tenant_id', tenantId).order('created_at')
      .then(({ data }) => { setRows((data as PromptRow[]) || []); setLoading(false) })
  }, [tenantId])

  useEffect(() => { load() }, [load])

  async function suggest() {
    if (!tenantId) return
    const [{ data: biRow }, { data: saRows }] = await Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      supabase.from('service_areas').select('city, state').eq('tenant_id', tenantId),
    ])
    const bi = (biRow?.value ?? {}) as { name?: string; address?: string }
    const m = (bi.address || '').match(/,\s*([^,]+),?\s*([A-Z]{2})\b/)
    const generated = generateAuthorityPrompts({
      businessName: bi.name || '',
      city: m ? m[1].trim() : '',
      state: m ? m[2].trim() : '',
      serviceAreas: (saRows as Array<{ city: string; state: string | null }>) || [],
      serviceSlugs: preset.servicePageSlugs,
    })
    const existing = new Set(rows.map(r => r.prompt_text.toLowerCase()))
    const fresh = generated.filter(p => !existing.has(p.toLowerCase()))
    setSuggestions(fresh)
    if (fresh.length === 0) {
      toast.info(generated.length === 0
        ? 'Nothing to suggest yet — add your service areas and business address first.'
        : 'Your list already covers every suggestion.')
    }
  }

  async function add(text: string) {
    if (!tenantId || !text.trim()) return
    setSaving(true)
    const { error } = await supabase.from('ai_authority_prompts')
      .insert({ tenant_id: tenantId, prompt_text: text.trim(), active: true })
    setSaving(false)
    if (error) { toast.error(`Could not add: ${error.message}`); return }
    setDraft(''); setSuggestions(s => s.filter(p => p !== text)); load()
  }

  async function update(id: string, patch: Partial<PromptRow>) {
    const { error } = await supabase.from('ai_authority_prompts').update(patch).eq('id', id)
    if (error) { toast.error(`Could not save: ${error.message}`); return }
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function remove(id: string) {
    const { error } = await supabase.from('ai_authority_prompts').delete().eq('id', id)
    if (error) { toast.error(`Could not delete: ${error.message}`); return }
    setRows(rs => rs.filter(r => r.id !== id))
  }

  if (loading) return <div className="bg-white rounded-xl border border-gray-100 p-6 text-gray-400">Loading…</div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Search questions we ask the AI engines</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            These are the questions we put to AI search engines to see whether they mention you. Edit them to match how your customers actually search.
          </p>
        </div>
        <button onClick={suggest} disabled={saving}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40">
          <Sparkles size={14} /> Suggest from my business
        </button>
      </div>

      {rows.length === 0 && suggestions.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">
          No questions yet — nothing is being checked. Use “Suggest from my business”, or add your own below.
        </p>
      )}

      {rows.map(r => (
        <div key={r.id} className="flex items-center gap-2">
          <input type="checkbox" checked={r.active} onChange={e => update(r.id, { active: e.target.checked })}
            className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" title={r.active ? 'Active' : 'Paused'} />
          <input
            className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${r.active ? '' : 'text-gray-400 line-through'}`}
            value={r.prompt_text}
            onChange={e => setRows(rs => rs.map(x => (x.id === r.id ? { ...x, prompt_text: e.target.value } : x)))}
            onBlur={e => update(r.id, { prompt_text: e.target.value.trim() })}
          />
          <button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-500 p-1" title="Delete"><Trash2 size={15} /></button>
        </div>
      ))}

      {suggestions.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Suggested for {preset.entityLabels.service}{vertical ? '' : ' — add your trade in Settings for better suggestions'}
          </p>
          {suggestions.map(p => (
            <div key={p} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-600">{p}</span>
              <button onClick={() => add(p)} disabled={saving}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-40">Add →</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Add your own question, e.g. how customers describe what you do"
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(draft) }}
        />
        <button onClick={() => add(draft)} disabled={saving || !draft.trim()}
          className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-40">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  )
}
