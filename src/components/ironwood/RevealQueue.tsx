import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { notifyTeamsFromClient } from '../../lib/teamsNotify'

interface RevealProspect {
  id: string
  company_name: string
  contact_name: string | null
  phone: string | null
  tier: string | null
  build_path: string | null
  qa_passed_at: string | null
  pipeline_stage: string
}

interface RevisionModal {
  prospectId: string
  companyName: string
}

export default function RevealQueue() {
  const [prospects, setProspects] = useState<RevealProspect[]>([])
  const [loading, setLoading]     = useState(true)
  const [revModal, setRevModal]   = useState<RevisionModal | null>(null)
  const [revNotes, setRevNotes]   = useState('')
  const [saving, setSaving]       = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('prospects')
      .select('id, company_name, contact_name, phone, tier, build_path, pipeline_stage')
      .eq('pipeline_stage', 'reveal_ready')
      .order('updated_at', { ascending: true })
    if (!data) { setLoading(false); return }

    // Fetch qa_passed_at for each
    const ids = data.map(p => p.id)
    const { data: qaRows } = await supabase
      .from('qa_checklists')
      .select('prospect_id, qa_passed_at')
      .in('prospect_id', ids)
    const qaMap: Record<string, string> = {}
    qaRows?.forEach(r => { if (r.qa_passed_at) qaMap[r.prospect_id] = r.qa_passed_at })

    const enriched = data.map(p => ({ ...p, qa_passed_at: qaMap[p.id] ?? null }))
    enriched.sort((a, b) => {
      if (!a.qa_passed_at) return 1
      if (!b.qa_passed_at) return -1
      return new Date(a.qa_passed_at).getTime() - new Date(b.qa_passed_at).getTime()
    })
    setProspects(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleLaunch(p: RevealProspect) {
    setSaving(p.id)
    const { data: { user } } = await supabase.auth.getUser()
    const actor = user?.email || 'ironwood'
    await supabase.from('prospects').update({ pipeline_stage: 'live' }).eq('id', p.id)
    await supabase.from('prospect_activity').insert({
      prospect_id: p.id, actor, action: 'stage_changed',
      detail: 'Reveal approved — moved to Live',
    })
    notifyTeamsFromClient(`🚀 Launch approved: ${p.company_name} is now LIVE`)
    toast.success(`${p.company_name} is now Live!`)
    setProspects(prev => prev.filter(x => x.id !== p.id))
    setSaving(null)
  }

  async function handleRevisionSubmit() {
    if (!revModal || !revNotes.trim()) return
    setSaving(revModal.prospectId)
    const { data: { user } } = await supabase.auth.getUser()
    const actor = user?.email || 'ironwood'
    await supabase.from('prospects')
      .update({ pipeline_stage: 'it_in_progress' }).eq('id', revModal.prospectId)
    await supabase.from('prospect_activity').insert({
      prospect_id: revModal.prospectId, actor, action: 'revision_requested',
      detail: `Revisions requested: ${revNotes.trim()}`,
    })
    await supabase.from('qa_checklists')
      .update({ qa_passed_at: null, updated_at: new Date().toISOString() })
      .eq('prospect_id', revModal.prospectId)
    notifyTeamsFromClient(`🔁 Revisions requested: ${revModal.companyName} — ${revNotes.trim()}`)
    toast.success(`${revModal.companyName} sent back for revisions`)
    setProspects(prev => prev.filter(x => x.id !== revModal.prospectId))
    setRevModal(null); setRevNotes(''); setSaving(null)
  }

  const tierBadge = (tier: string | null) => {
    if (tier === 'pro')    return <span className="px-1.5 py-0.5 text-xs rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700">Pro</span>
    if (tier === 'growth') return <span className="px-1.5 py-0.5 text-xs rounded bg-blue-900/50 text-blue-300 border border-blue-700">Growth</span>
    return <span className="px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-400 border border-gray-600">Starter</span>
  }

  const pathLabel = (p: string | null) => {
    if (p === 'template_launch')    return '🟢 Template'
    if (p === 'firecrawl_migration') return '🔵 Migration'
    if (p === 'full_custom')         return '🟣 Custom'
    return '—'
  }

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  if (loading) return <div className="p-8 text-gray-500 text-sm">Loading reveal queue…</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Reveal Queue</h1>
        <p className="text-sm text-gray-400 mt-0.5">Sites that passed QA and are ready for the reveal call</p>
      </div>

      {prospects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">✅</div>
          <div className="font-medium">No sites in the reveal queue</div>
          <div className="text-sm mt-1">Sites appear here after passing all 9 QA checks</div>
        </div>
      ) : (
        <div className="space-y-4">
          {prospects.map((p, i) => (
            <div key={p.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-mono">#{i + 1}</span>
                    <h3 className="font-semibold text-white">{p.company_name}</h3>
                    {tierBadge(p.tier)}
                    <span className="text-xs text-gray-400">{pathLabel(p.build_path)}</span>
                  </div>
                  {p.contact_name && (
                    <div className="text-xs text-gray-400 mt-1">
                      {p.contact_name}{p.phone ? ` · ${p.phone}` : ''}
                    </div>
                  )}
                  <div className="text-xs text-emerald-500 mt-1">
                    ✓ QA passed {fmtDate(p.qa_passed_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href="https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled"
                    target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition"
                  >
                    📅 Book Reveal Call
                  </a>
                  <button
                    onClick={() => handleLaunch(p)}
                    disabled={saving === p.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {saving === p.id ? '…' : '🚀 Launch Approved'}
                  </button>
                  <button
                    onClick={() => { setRevModal({ prospectId: p.id, companyName: p.company_name }); setRevNotes('') }}
                    disabled={saving === p.id}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs rounded-lg transition disabled:opacity-50"
                  >
                    🔁 Revisions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revision modal */}
      {revModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setRevModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-1">Request Revisions</h3>
            <p className="text-xs text-gray-400 mb-3">{revModal.companyName} — will be sent back to IT In Progress</p>
            <textarea
              value={revNotes}
              onChange={e => setRevNotes(e.target.value)}
              rows={4}
              placeholder="Describe what needs to be changed..."
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRevModal(null)}
                className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition">
                Cancel
              </button>
              <button
                onClick={handleRevisionSubmit}
                disabled={!revNotes.trim() || saving === revModal.prospectId}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              >
                {saving === revModal.prospectId ? 'Saving…' : 'Send Back for Revisions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
