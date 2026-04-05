import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { usePlan } from '../../../hooks/usePlan'
import type { IntegrationSettings } from './useSocialData'

const TENANT_ID = import.meta.env.VITE_TENANT_ID

interface Props {
  integrations: IntegrationSettings | null
  onClose: () => void
  onSaved: () => void
  onNavigate?: (tab: string) => void
}

type ProviderTab = 'export' | 'diy' | 'buffer' | 'ayrshare'
const TABS: { id: ProviderTab; label: string; tier: number }[] = [
  { id: 'export',   label: 'Hands On',       tier: 1 },
  { id: 'diy',      label: 'DIY',            tier: 2 },
  { id: 'buffer',   label: 'Semi-Auto',      tier: 3 },
  { id: 'ayrshare', label: 'Full Autopilot', tier: 4 },
]

const TIER_PROVIDER: Record<number, ProviderTab> = { 1: 'export', 2: 'diy', 3: 'buffer', 4: 'ayrshare' }
const PLAN_INFO: Record<number, { name: string; price: number }> = {
  1: { name: 'Starter', price: 149 },
  2: { name: 'Grow',    price: 249 },
  3: { name: 'Pro',     price: 349 },
  4: { name: 'Elite',   price: 499 },
}

export default function ConnectionsModal({ integrations, onClose, onSaved, onNavigate }: Props) {
  const { tier } = usePlan()
  const [activeTab, setActiveTab] = useState<ProviderTab>('export')
  const [form, setForm] = useState({ facebook_access_token: '', facebook_page_id: '' })
  const [saving, setSaving] = useState(false)

  const activeProvider = TIER_PROVIDER[tier] || 'export'

  useEffect(() => {
    if (!integrations) return
    setForm({
      facebook_access_token: integrations.facebook_access_token || '',
      facebook_page_id: integrations.facebook_page_id || '',
    })
  }, [integrations])

  async function saveFbCredentials() {
    setSaving(true)
    const { data: current } = await supabase.from('settings').select('value')
      .eq('tenant_id', TENANT_ID).eq('key', 'integrations').maybeSingle()
    const { error } = await supabase.from('settings').upsert(
      { tenant_id: TENANT_ID, key: 'integrations', value: { ...(current?.value || {}), facebook_access_token: form.facebook_access_token, facebook_page_id: form.facebook_page_id } },
      { onConflict: 'tenant_id,key' }
    )
    setSaving(false)
    if (error) { toast.error('Failed to save.'); return }
    toast.success('Saved!')
    onSaved()
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'

  function ActiveBadge() {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">✓ Your Active Mode</span>
  }

  function LockedBadge({ tabTier }: { tabTier: number }) {
    const info = PLAN_INFO[tabTier]
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center mt-2">
        <Lock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
        <p className="text-xs font-semibold text-amber-700 mb-3">Requires {info.name} — ${info.price}/mo</p>
        {onNavigate
          ? <button onClick={() => { onClose(); onNavigate('billing') }} className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">Upgrade Plan →</button>
          : <a href="mailto:support@pestflow.ai?subject=Plan Upgrade Request" className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 inline-block">Upgrade Plan →</a>
        }
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-lg w-full bg-white rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Social Connections</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        <div className="flex border-b">
          {TABS.map(t => {
            const isLocked = t.tier > tier
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2.5 text-xs font-medium text-center ${activeTab === t.id ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-400'}`}>
                {t.label}
                {isLocked && <Lock className="inline-block w-3 h-3 ml-0.5 text-amber-400 align-middle" />}
              </button>
            )
          })}
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">

          {activeTab === 'export' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Hands On</h4>
              <p className="text-xs text-gray-500">Generate and approve your posts here, then copy the captions to post directly on your Facebook or Instagram account. No accounts to connect, no tools needed — just copy and paste.</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700">✓ This mode is always available on all plans</div>
              {activeProvider === 'export' && <ActiveBadge />}
            </div>
          )}

          {activeTab === 'diy' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">DIY</h4>
              <p className="text-xs text-gray-500">You're in control. Use your own social media scheduling tools to manage your posts. We'll help you generate great content — you handle the posting.</p>
              {tier < 2 ? <LockedBadge tabTier={2} /> : (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Facebook Access Token</label>
                    <input value={form.facebook_access_token} onChange={e => setForm(p => ({ ...p, facebook_access_token: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Facebook Page ID</label>
                    <input value={form.facebook_page_id} onChange={e => setForm(p => ({ ...p, facebook_page_id: e.target.value }))} className={inputCls} />
                  </div>
                  <p className="text-xs text-gray-400">Instagram posting requires a connected Facebook Business Page.</p>
                  <div className="flex items-center gap-2">
                    <button onClick={saveFbCredentials} disabled={saving} className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save DIY Settings'}</button>
                    {activeProvider === 'diy' && <ActiveBadge />}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'buffer' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Semi-Automated Posting</h4>
              <p className="text-xs text-gray-500">We set this up for you. Your approved posts will be automatically scheduled and sent to your connected Facebook page on a consistent posting schedule — no extra accounts or tools required on your end.</p>
              {tier < 3 ? <LockedBadge tabTier={3} /> : activeProvider === 'buffer' && <ActiveBadge />}
            </div>
          )}

          {activeTab === 'ayrshare' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Full Autopilot</h4>
              <p className="text-xs text-gray-500">Sit back and let us handle everything. We connect your accounts and manage your posting schedule across Facebook, Instagram, and more. Your posts go out consistently — without you lifting a finger. Included with your Elite plan.</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {['Facebook', 'Instagram', 'Google Business Posts', 'Consistent weekly posting schedule', 'AI-generated captions tailored to your business'].map(item => (
                  <li key={item} className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span>{item}</li>
                ))}
              </ul>
              {tier < 4 ? <LockedBadge tabTier={4} /> : activeProvider === 'ayrshare' && <ActiveBadge />}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-500">
          Active mode: <span className="font-medium text-gray-700">{TABS.find(t => t.id === activeProvider)?.label}</span>
          <span className="ml-2 text-gray-400">(set by {PLAN_INFO[tier]?.name} plan)</span>
        </div>
      </div>
    </div>
  )
}
