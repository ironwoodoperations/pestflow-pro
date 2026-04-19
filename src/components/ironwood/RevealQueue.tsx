import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { notifyTeamsFromClient } from '../../lib/teamsNotify'
import RevealReport from './RevealReport'

interface RevealProspect {
  id: string
  company_name: string
  contact_name: string | null
  phone: string | null
  tier: string | null
  build_path: string | null
  qa_passed_at: string | null
  pipeline_stage: string
  slug: string | null
  tenant_id: string | null
  ps_desktop_old: number | null
  ps_mobile_old: number | null
  ps_desktop_new: number | null
  ps_mobile_new: number | null
}

interface ReportTarget {
  prospectId:   string
  tenantId:     string
  siteUrl:      string
  psDesktopOld: number | null
  psMobileOld:  number | null
  psDesktopNew: number | null
  psMobileNew:  number | null
}

interface Scores {
  desktopOld: string
  mobileOld:  string
  desktopNew: string
  mobileNew:  string
}

type ScoreField = keyof Scores

const SCORE_COL: Record<ScoreField, string> = {
  desktopOld: 'ps_desktop_old',
  mobileOld:  'ps_mobile_old',
  desktopNew: 'ps_desktop_new',
  mobileNew:  'ps_mobile_new',
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
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [scores, setScores]       = useState<Record<string, Scores>>({})
  const [savedFlash, setSavedFlash] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('prospects')
      .select('id, company_name, contact_name, phone, tier, build_path, pipeline_stage, slug, tenant_id, ps_desktop_old, ps_mobile_old, ps_desktop_new, ps_mobile_new')
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

    // Init score inputs from DB values
    const init: Record<string, Scores> = {}
    enriched.forEach(p => {
      init[p.id] = {
        desktopOld: p.ps_desktop_old != null ? String(p.ps_desktop_old) : '',
        mobileOld:  p.ps_mobile_old  != null ? String(p.ps_mobile_old)  : '',
        desktopNew: p.ps_desktop_new != null ? String(p.ps_desktop_new) : '',
        mobileNew:  p.ps_mobile_new  != null ? String(p.ps_mobile_new)  : '',
      }
    })
    setScores(init)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function setScore(prospectId: string, field: ScoreField, val: string) {
    const num = val.replace(/\D/g, '').slice(0, 3)
    setScores(prev => ({
      ...prev,
      [prospectId]: { ...(prev[prospectId] || { desktopOld: '', mobileOld: '', desktopNew: '', mobileNew: '' }), [field]: num },
    }))
  }

  async function saveScore(prospectId: string, field: ScoreField, val: string) {
    const num = val.trim() !== '' ? parseInt(val) : null
    await supabase.from('prospects').update({ [SCORE_COL[field]]: num }).eq('id', prospectId)
    setSavedFlash(prev => ({ ...prev, [prospectId]: true }))
    setTimeout(() => setSavedFlash(prev => ({ ...prev, [prospectId]: false })), 1500)
  }

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

  function openReport(p: RevealProspect) {
    if (!p.tenant_id || !p.slug) { toast.error('Missing client or slug — cannot generate report'); return }
    const s = scores[p.id] || { desktopOld: '', mobileOld: '', desktopNew: '', mobileNew: '' }
    setReportTarget({
      prospectId:   p.id,
      tenantId:     p.tenant_id,
      siteUrl:      `https://${p.slug}.pestflowpro.com`,
      psDesktopOld: s.desktopOld ? parseInt(s.desktopOld) : null,
      psMobileOld:  s.mobileOld  ? parseInt(s.mobileOld)  : null,
      psDesktopNew: s.desktopNew ? parseInt(s.desktopNew) : null,
      psMobileNew:  s.mobileNew  ? parseInt(s.mobileNew)  : null,
    })
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
          {prospects.map((p, i) => {
            const s = scores[p.id] || { desktopOld: '', mobileOld: '', desktopNew: '', mobileNew: '' }
            const allEmpty = !s.desktopOld && !s.mobileOld && !s.desktopNew && !s.mobileNew

            return (
              <div key={p.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
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

                    {/* PageSpeed score inputs — 2×2 grid */}
                    <div className="mt-3">
                      {allEmpty && (
                        <p className="text-xs text-gray-500 mb-2">
                          Run PageSpeed at{' '}
                          <a
                            href="https://pagespeed.web.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 underline hover:text-violet-300"
                          >
                            pagespeed.web.dev
                          </a>
                          {' '}before the reveal call, then enter scores below.
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2" style={{ maxWidth: '260px' }}>
                        {([
                          { field: 'desktopOld' as ScoreField, label: 'Old Desktop' },
                          { field: 'mobileOld'  as ScoreField, label: 'Old Mobile'  },
                          { field: 'desktopNew' as ScoreField, label: 'New Desktop' },
                          { field: 'mobileNew'  as ScoreField, label: 'New Mobile'  },
                        ] as const).map(({ field, label }) => (
                          <label key={field} className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-500">{label}</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              placeholder="—"
                              value={s[field]}
                              onChange={e => setScore(p.id, field, e.target.value)}
                              onBlur={e => saveScore(p.id, field, e.target.value)}
                              className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-white text-xs focus:outline-none focus:border-gray-500"
                            />
                          </label>
                        ))}
                      </div>
                      {savedFlash[p.id] && (
                        <span className="text-xs text-emerald-400 mt-1 block">Saved ✓</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openReport(p)}
                        className="px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-medium rounded-lg transition"
                      >
                        📄 Reveal Report
                      </button>
                      <a
                        href="https://outlook.office.com/book/PestFlowProOnboarding@ironwoodoperationsgroup.com/?ismsaljsauthenabled"
                        target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition"
                      >
                        📅 Book Reveal Call
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
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
              </div>
            )
          })}
        </div>
      )}

      {/* Reveal Report overlay */}
      {reportTarget && (
        <RevealReport
          prospectId={reportTarget.prospectId}
          tenantId={reportTarget.tenantId}
          siteUrl={reportTarget.siteUrl}
          psDesktopOld={reportTarget.psDesktopOld}
          psMobileOld={reportTarget.psMobileOld}
          psDesktopNew={reportTarget.psDesktopNew}
          psMobileNew={reportTarget.psMobileNew}
          onClose={() => setReportTarget(null)}
        />
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
