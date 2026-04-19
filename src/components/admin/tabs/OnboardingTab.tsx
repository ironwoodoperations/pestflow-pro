import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import PageHelpBanner from '../PageHelpBanner'

const ITEMS = [
  'Payment received — Stripe confirmed',
  'DNS pointed to Vercel',
  'Logo uploaded and applied',
  'Colors / theme confirmed in admin Settings',
  'Business info reviewed and saved',
  'Integrations filled in (admin Integrations tab)',
  'Social links confirmed',
  'Test lead submitted from public site',
  'SMS notification tested',
  'Login credentials sent to client',
]

interface Props {
  onComplete: () => void
}

export default function OnboardingTab({ onComplete }: Props) {
  const { tenantId } = useTenant()
  const [bizName, setBizName] = useState('')
  const [slug, setSlug] = useState('')
  const [checked, setChecked] = useState<boolean[]>(Array(ITEMS.length).fill(false))
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle(),
      supabase.from('tenants').select('slug').eq('id', tenantId).maybeSingle(),
    ]).then(([bizRes, tenantRes]) => {
      if (bizRes.data?.value?.name) setBizName(bizRes.data.value.name)
      if (tenantRes.data?.slug) setSlug(tenantRes.data.slug)
    })
    const stored = ITEMS.map((_, i) => {
      const v = localStorage.getItem(`onboarding_checklist_${tenantId}_${i}`)
      return v === 'true'
    })
    setChecked(stored)
  }, [tenantId])

  function toggle(i: number) {
    setChecked(prev => {
      const next = [...prev]
      next[i] = !next[i]
      localStorage.setItem(`onboarding_checklist_${tenantId}_${i}`, String(next[i]))
      return next
    })
  }

  async function handleMarkComplete() {
    if (!tenantId) return
    if (!window.confirm('Mark onboarding complete? This tab will be hidden after confirming.')) return
    setSaving(true)
    await supabase.from('settings').upsert(
      { tenant_id: tenantId, key: 'onboarding_complete', value: { complete: true } },
      { onConflict: 'tenant_id,key' }
    )
    setSaving(false)
    setDone(true)
    setTimeout(onComplete, 1500)
  }

  const completedCount = checked.filter(Boolean).length

  return (
    <div>
      <PageHelpBanner
        tab="onboarding"
        title="Onboarding Checklist"
        body="Work through each step to get the client fully set up. Check each item as you complete it. When everything is done, click Mark Onboarding Complete to hide this tab."
      />

      <div className="mb-6">
        {slug && <p className="text-sm text-emerald-600 font-medium mb-0.5">Site: {slug}.pestflowpro.com</p>}
        {bizName && <h2 className="text-xl font-bold text-gray-900">{bizName}</h2>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-semibold text-gray-700">Setup Tasks</span>
          <span className="text-sm text-gray-500">{completedCount}/{ITEMS.length} complete</span>
        </div>
        <div className="divide-y divide-gray-50">
          {ITEMS.map((item, i) => (
            <label key={i} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 flex-shrink-0"
              />
              <span className={`text-sm ${checked[i] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      {done ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-700 font-medium text-center">
          Onboarding marked complete. This tab will now be hidden.
        </div>
      ) : (
        <button
          onClick={handleMarkComplete}
          disabled={saving}
          className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition text-sm"
        >
          {saving ? 'Saving…' : 'Mark Onboarding Complete'}
        </button>
      )}
    </div>
  )
}
