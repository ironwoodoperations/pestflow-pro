import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  tenantId: string | null
  prospectId: string | null
}

interface SignalResult {
  label: string
  ok: boolean
  hint: string
}

interface SeoForm {
  meta_description: string
  service_areas: string
  owner_name: string
  founded_year: string
  certifications: string
}

const EMPTY_FORM: SeoForm = {
  meta_description: '',
  service_areas: '',
  owner_name: '',
  founded_year: '',
  certifications: '',
}

function scoreLabel(score: number, total: number): { label: string; color: string } {
  const pct = score / total
  if (pct >= 10 / 12) return { label: 'Excellent', color: 'text-emerald-400' }
  if (pct >= 7 / 12)  return { label: 'Good', color: 'text-blue-400' }
  if (pct >= 4 / 12)  return { label: 'Needs Work', color: 'text-amber-400' }
  return { label: 'Critical Issues', color: 'text-red-400' }
}

function ProgressBar({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100)
  const color = pct >= 83 ? 'bg-emerald-500' : pct >= 58 ? 'bg-blue-500' : pct >= 33 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function SEOHealthPanel({ tenantId, prospectId }: Props) {
  const [signals, setSignals] = useState<SignalResult[]>([])
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SeoForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saved, setSavedFlag] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)

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
    const faqCount = faqRes.count || 0
    const testCount = testRes.count || 0

    const checks: SignalResult[] = [
      {
        label: 'Business name set',
        ok: !!biz.name,
        hint: 'Set in Contact section above',
      },
      {
        label: 'Phone number set',
        ok: !!biz.phone,
        hint: 'Set in Contact section above',
      },
      {
        label: `Address set`,
        ok: !!biz.address,
        hint: 'Set in Contact section above',
      },
      {
        label: `Service areas defined (${(seo.service_areas || []).length})`,
        ok: Array.isArray(seo.service_areas) && seo.service_areas.length > 0,
        hint: 'Add in SEO Settings below',
      },
      {
        label: 'Meta description set',
        ok: !!seo.meta_description,
        hint: 'Add in SEO Settings below',
      },
      {
        label: 'Google Place ID set',
        ok: !!int_.google_place_id,
        hint: 'Add in Integrations section above → google_place_id',
      },
      {
        label: 'Analytics ID set',
        ok: !!int_.google_analytics_id || !!int_.ga4_id,
        hint: 'Add in Integrations section above → google_analytics_id',
      },
      {
        label: 'License number set',
        ok: !!biz.license,
        hint: 'Set in Business Info → License Number',
      },
      {
        label: 'Owner name set',
        ok: !!seo.owner_name,
        hint: 'Add in SEO Settings below',
      },
      {
        label: 'Founded year set',
        ok: !!seo.founded_year,
        hint: 'Add in SEO Settings below',
      },
      {
        label: `FAQ content exists (${faqCount} questions)`,
        ok: faqCount > 0,
        hint: 'Add FAQ content in client admin → FAQs',
      },
      {
        label: 'Testimonials exist',
        ok: testCount > 0,
        hint: 'Add testimonials in client admin → Testimonials',
      },
    ]

    const total = checks.filter(c => c.ok).length
    setSignals(checks)
    setScore(total)

    // Pre-fill the quick-edit form
    setForm({
      meta_description: seo.meta_description || '',
      service_areas: Array.isArray(seo.service_areas) ? seo.service_areas.join(', ') : '',
      owner_name: seo.owner_name || '',
      founded_year: seo.founded_year || '',
      certifications: Array.isArray(seo.certifications) ? seo.certifications.join(', ') : '',
    })

    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    if (tenantId && expanded) load()
  }, [tenantId, expanded, load])

  async function saveSeoSettings() {
    if (!tenantId) return
    setSaving(true)
    const value = {
      meta_description: form.meta_description,
      service_areas: form.service_areas.split(',').map(s => s.trim()).filter(Boolean),
      owner_name: form.owner_name,
      founded_year: form.founded_year,
      certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean),
    }
    await supabase.from('settings')
      .upsert({ tenant_id: tenantId, key: 'seo', value }, { onConflict: 'tenant_id,key' })
    setSaving(false)
    setSavedFlag(true)
    setTimeout(() => setSavedFlag(false), 2000)
    load()
  }

  if (!tenantId) {
    return (
      <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-500">Provision tenant first to configure SEO settings.</p>
      </div>
    )
  }

  const TOTAL = 12
  const { label: ratingLabel, color: ratingColor } = scoreLabel(score, TOTAL)

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/80 hover:bg-gray-800 transition"
      >
        <span className="font-semibold text-gray-200 text-sm">SEO Health Check</span>
        <div className="flex items-center gap-3">
          {!loading && signals.length > 0 && (
            <span className={`text-xs font-medium ${ratingColor}`}>
              {score}/{TOTAL} — {ratingLabel}
            </span>
          )}
          <span className="text-gray-500 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4 bg-gray-900/50">
          {loading ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : (
            <>
              {/* Score bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>SEO Score: {score}/{TOTAL}</span>
                  <span className={ratingColor}>{ratingLabel}</span>
                </div>
                <ProgressBar score={score} total={TOTAL} />
              </div>

              {/* Signal list */}
              <div className="space-y-1.5">
                {signals.map((sig, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 mt-0.5">
                      {sig.ok ? '✅' : score >= 7 ? '⚠️' : '❌'}
                    </span>
                    <div className="min-w-0">
                      <span className={sig.ok ? 'text-gray-300' : 'text-gray-400'}>{sig.label}</span>
                      {!sig.ok && <span className="text-gray-600 ml-1">— {sig.hint}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick-edit SEO settings */}
              <div className="border-t border-gray-700 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">SEO Settings</h4>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Meta Description</label>
                  <textarea
                    value={form.meta_description}
                    onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                    rows={3}
                    placeholder="Brief description for search results (150–160 chars)..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <p className="text-right text-xs text-gray-600 mt-0.5">{form.meta_description.length} / 160</p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Service Areas (comma-separated)</label>
                  <input
                    value={form.service_areas}
                    onChange={e => setForm(f => ({ ...f, service_areas: e.target.value }))}
                    placeholder="Tyler TX, Longview TX, Kilgore TX..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Owner Name</label>
                    <input
                      value={form.owner_name}
                      onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))}
                      placeholder="e.g. Kirk"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Founded Year</label>
                    <input
                      value={form.founded_year}
                      onChange={e => setForm(f => ({ ...f, founded_year: e.target.value }))}
                      placeholder="e.g. 2018"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Certifications (comma-separated)</label>
                  <input
                    value={form.certifications}
                    onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))}
                    placeholder="Licensed by TX Dept of Agriculture, TPCL Certified..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveSeoSettings}
                    disabled={saving}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save SEO Settings'}
                  </button>
                  {saved && <span className="text-xs text-emerald-400">✓ Saved</span>}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
