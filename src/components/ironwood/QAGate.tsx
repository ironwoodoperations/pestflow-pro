import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { notifyTeamsFromClient } from '../../lib/teamsNotify'

const QA_ITEMS: { field: string; label: string; autoCheck?: boolean }[] = [
  { field: 'site_reachable',            label: 'Site is reachable on live or preview URL' },
  { field: 'admin_login_works',         label: 'Admin login tested and working' },
  { field: 'lead_form_submits',         label: 'Lead form submits successfully' },
  { field: 'email_notifications_fire',  label: 'Email notifications firing correctly' },
  { field: 'sms_notifications_fire',    label: 'SMS notifications firing correctly' },
  { field: 'domain_connected',          label: 'Domain connected in Vercel' },
  { field: 'mobile_check_passed',       label: 'Mobile layout checked' },
  { field: 'content_proofed',           label: 'Content proofed (no placeholders, no "TEST TEST")' },
  { field: 'credentials_package_ready', label: 'Customer credentials package ready' },
  { field: 'seo_score_ok',              label: 'SEO health score ≥ 7/12 (check SEO Health panel)', autoCheck: true },
  { field: 'sitemap_accessible',        label: 'sitemap.xml accessible — confirm in browser at /sitemap.xml' },
  { field: 'legal_pages',               label: 'Legal pages present (/privacy, /terms, /sms-terms) and footer links working' },
]

interface Props {
  prospectId: string
  pipelineStage: string
  companyName: string
  tenantId?: string | null
  tier?: string | null
  buildPath?: string | null
  redirectMapComplete?: boolean
  onRevealReady: (passedAt: string) => void
}

export default function QAGate({ prospectId, pipelineStage, companyName, tenantId, tier, buildPath, redirectMapComplete, onRevealReady }: Props) {
  const [qa, setQa]       = useState<Record<string, any> | null>(null)
  const [saving, setSaving] = useState(false)
  const [moving, setMoving] = useState(false)
  const notesTimer          = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isProOrElite = tier === 'pro' || tier === 'elite'
  const redirectRequired = isProOrElite && buildPath !== 'template_launch'
  const redirectOk = !redirectRequired || !!redirectMapComplete

  const visible = ['it_in_progress', 'reveal_ready'].includes(pipelineStage)

  // Calculate SEO score from tenant settings and auto-check seo_score_ok
  const autoCheckSeoScore = useCallback(async (checklistId: string) => {
    if (!tenantId) return
    const [bizRes, seoRes, intRes, faqRes, testRes] = await Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'seo').maybeSingle(),
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle(),
      supabase.from('faqs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ])
    const biz = bizRes.data?.value || {}
    const seo = seoRes.data?.value || {}
    const int_ = intRes.data?.value || {}
    let score = 0
    if (biz.name) score++
    if (biz.phone) score++
    if (biz.address) score++
    if (Array.isArray(seo.service_areas) && seo.service_areas.length > 0) score++
    if (seo.meta_description) score++
    if (int_.google_place_id) score++
    if (int_.google_analytics_id || int_.ga4_id) score++
    if (biz.license) score++
    if (seo.owner_name) score++
    if (seo.founded_year) score++
    if ((faqRes.count || 0) > 0) score++
    if ((testRes.count || 0) > 0) score++
    const ok = score >= 7
    await supabase.from('qa_checklists')
      .update({ seo_score_ok: ok, updated_at: new Date().toISOString() })
      .eq('id', checklistId)
  }, [tenantId])

  const load = useCallback(async () => {
    const { data } = await supabase.from('qa_checklists')
      .select('*').eq('prospect_id', prospectId).maybeSingle()
    if (data) {
      // Auto-compute seo_score_ok on each load if tenant is provisioned
      if (tenantId) await autoCheckSeoScore(data.id)
      const { data: refreshed } = await supabase.from('qa_checklists')
        .select('*').eq('prospect_id', prospectId).maybeSingle()
      setQa(refreshed)
    } else {
      setQa(data)
    }
  }, [prospectId, tenantId, autoCheckSeoScore])

  useEffect(() => { if (visible) load() }, [visible, load])

  async function initChecklist() {
    const { data } = await supabase.from('qa_checklists')
      .insert({ prospect_id: prospectId }).select().single()
    if (data) setQa(data)
  }

  async function toggleCheck(field: string) {
    if (!qa) return
    const next = !qa[field]
    const patch: Record<string, any> = { [field]: next, updated_at: new Date().toISOString() }
    setSaving(true)
    const { data } = await supabase.from('qa_checklists')
      .update(patch).eq('prospect_id', prospectId).select().single()
    if (data) setQa(data)
    setSaving(false)
  }

  function saveNotesDebounced(val: string) {
    setQa(q => q ? { ...q, reveal_notes: val } : q)
    clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      await supabase.from('qa_checklists')
        .update({ reveal_notes: val, updated_at: new Date().toISOString() })
        .eq('prospect_id', prospectId)
    }, 500)
  }

  async function moveToRevealReady() {
    if (!qa?.qa_passed_at) return
    setMoving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const actor = user?.email || 'ironwood'
    await supabase.from('qa_checklists')
      .update({ qa_passed_by: actor }).eq('prospect_id', prospectId)
    await supabase.from('prospects')
      .update({ pipeline_stage: 'reveal_ready' }).eq('id', prospectId)
    try {
      await supabase.from('prospect_activity').insert({
        prospect_id: prospectId, actor, action: 'qa_passed',
        detail: 'QA checklist complete — moved to Reveal Ready',
      })
    } catch (e) { console.error('[activity log]', e) }
    notifyTeamsFromClient(`✅ QA passed: ${companyName} is ready for reveal call`)
    toast.success(`${companyName} moved to Reveal Ready`)
    onRevealReady(qa.qa_passed_at)
    setMoving(false)
  }

  if (!visible) return null

  if (!qa) {
    return (
      <div>
        <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-3">QA Checklist</h3>
        <button onClick={initChecklist}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition">
          Initialize QA Checklist
        </button>
      </div>
    )
  }

  const passed = QA_ITEMS.filter(i => qa[i.field]).length
  const total  = QA_ITEMS.length
  const allDone = passed === total && redirectOk

  return (
    <div>
      <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-1 mb-3">QA Checklist</h3>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{passed} / {total} checks passed</span>
          {qa.qa_passed_at && <span className="text-emerald-400">✓ QA Complete</span>}
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div className="bg-emerald-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(passed / total) * 100}%` }} />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2 mb-4">
        {QA_ITEMS.map(item => (
          <label key={item.field} className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!qa[item.field]}
              onChange={() => toggleCheck(item.field)}
              disabled={saving}
              className="mt-0.5 flex-shrink-0 accent-emerald-500"
            />
            <span className={`text-xs ${qa[item.field] ? 'text-gray-300' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </label>
        ))}

        {/* Redirect map — conditional item */}
        {redirectRequired ? (
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={!!redirectMapComplete}
              disabled
              className="mt-0.5 flex-shrink-0 accent-emerald-500"
            />
            <span className={`text-xs ${redirectMapComplete ? 'text-gray-300' : 'text-gray-400'}`}>
              301 redirect map complete
              {!redirectMapComplete && <span className="text-amber-500 ml-1">(mark complete in Redirect Map panel above)</span>}
            </span>
          </label>
        ) : (
          <div className="flex items-start gap-2.5">
            <input type="checkbox" checked disabled className="mt-0.5 flex-shrink-0 accent-gray-600" />
            <span className="text-xs text-gray-600">
              301 redirect map — N/A for this build tier/path
            </span>
          </div>
        )}
      </div>

      {/* Reveal notes */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 block mb-1">Reveal Notes</label>
        <textarea
          value={qa.reveal_notes || ''}
          onChange={e => saveNotesDebounced(e.target.value)}
          rows={2}
          placeholder="Notes for the reveal call..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {/* QA complete banner */}
      {allDone && pipelineStage !== 'reveal_ready' && (
        <div className="p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
          <p className="text-sm text-emerald-300 font-medium mb-2">
            ✓ QA Complete — Ready to advance to Reveal Queue
          </p>
          <button onClick={moveToRevealReady} disabled={moving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
            {moving ? 'Moving…' : 'Move to Reveal Ready →'}
          </button>
        </div>
      )}
    </div>
  )
}
