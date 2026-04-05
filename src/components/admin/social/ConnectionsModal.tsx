import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { usePlan } from '../../../hooks/usePlan'
import type { IntegrationSettings } from './useSocialData'

const TENANT_ID = import.meta.env.VITE_TENANT_ID

interface Props {
  integrations: IntegrationSettings | null
  onClose: () => void
  onSaved: () => void
}

type ProviderTab = 'export' | 'diy' | 'buffer' | 'ayrshare'
const TABS: { id: ProviderTab; label: string }[] = [
  { id: 'export',   label: 'Hands On'      },
  { id: 'diy',      label: 'DIY'           },
  { id: 'buffer',   label: 'Semi-Auto'     },
  { id: 'ayrshare', label: 'Full Autopilot' },
]

export default function ConnectionsModal({ integrations, onClose, onSaved }: Props) {
  const { canAccess } = usePlan()
  const [activeTab, setActiveTab] = useState<ProviderTab>('export')
  const [form, setForm] = useState({
    active_social_provider: 'export' as string,
    facebook_access_token: '', facebook_page_id: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!integrations) return
    setForm(prev => ({
      ...prev,
      active_social_provider: integrations.active_social_provider || 'export',
      facebook_access_token: integrations.facebook_access_token || '',
      facebook_page_id: integrations.facebook_page_id || '',
    }))
  }, [integrations])

  async function saveFields(fields: Record<string, string>) {
    setSaving(true)
    const { data: current } = await supabase.from('settings').select('value')
      .eq('tenant_id', TENANT_ID).eq('key', 'integrations').maybeSingle()
    const { error } = await supabase.from('settings').upsert(
      { tenant_id: TENANT_ID, key: 'integrations', value: { ...(current?.value || {}), ...fields } },
      { onConflict: 'tenant_id,key' }
    )
    setSaving(false)
    if (error) { toast.error('Failed to save.'); return }
    toast.success('Saved!')
    onSaved()
  }

  function setActive(provider: string) {
    saveFields({ active_social_provider: provider })
    setForm(p => ({ ...p, active_social_provider: provider }))
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
  const isActive = (p: string) => form.active_social_provider === p

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-lg w-full bg-white rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Social Connections</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        <div className="flex border-b">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-medium text-center ${
                activeTab === t.id ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-400'
              }`}>{t.label}</button>
          ))}
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">

          {activeTab === 'export' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Hands On</h4>
              <p className="text-xs text-gray-500">
                Generate and approve your posts here, then copy the captions to post directly on
                your Facebook or Instagram account. No accounts to connect, no tools needed — just
                copy and paste.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700">✓ This mode is always available</div>
              {isActive('export')
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Currently Active</span>
                : <button onClick={() => setActive('export')} disabled={saving} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">Set as Active Provider</button>
              }
            </div>
          )}

          {activeTab === 'diy' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">DIY</h4>
              <p className="text-xs text-gray-500">
                You're in control. Use your own social media scheduling tools to manage your posts.
                We'll help you generate great content — you handle the posting.
              </p>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Facebook Access Token</label>
                <input value={form.facebook_access_token} onChange={e => setForm(p => ({ ...p, facebook_access_token: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Facebook Page ID</label>
                <input value={form.facebook_page_id} onChange={e => setForm(p => ({ ...p, facebook_page_id: e.target.value }))} className={inputCls} />
              </div>
              <p className="text-xs text-gray-400">Instagram posting requires a connected Facebook Business Page.</p>
              <div className="flex gap-2">
                <button onClick={() => saveFields({ facebook_access_token: form.facebook_access_token, facebook_page_id: form.facebook_page_id })} disabled={saving} className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save DIY Settings'}</button>
                {form.facebook_access_token && form.facebook_page_id && !isActive('diy') && (
                  <button onClick={() => setActive('diy')} disabled={saving} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50">Set as Active</button>
                )}
                {isActive('diy') && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium self-center">Active</span>}
              </div>
            </div>
          )}

          {activeTab === 'buffer' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Semi-Automated Posting</h4>
              <p className="text-xs text-gray-500">
                We set this up for you. Your approved posts will be automatically scheduled and sent
                to your connected Facebook page on a consistent posting schedule — no extra accounts
                or tools required on your end.
              </p>
              {isActive('buffer')
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Currently Active</span>
                : <button onClick={() => setActive('buffer')} disabled={saving} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50">Set as Active</button>
              }
            </div>
          )}

          {activeTab === 'ayrshare' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Full Autopilot</h4>
                {canAccess(4) && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive('ayrshare') ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isActive('ayrshare') ? '● Active' : '○ Not active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Sit back and let us handle everything. We connect your accounts and manage your
                posting schedule across Facebook, Instagram, and more. Your posts go out
                consistently — without you lifting a finger. Included with your Elite plan.
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {['Facebook', 'Instagram', 'Google Business Posts', 'Consistent weekly posting schedule', 'AI-generated captions tailored to your business'].map(item => (
                  <li key={item} className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span>{item}</li>
                ))}
              </ul>
              {!isActive('ayrshare') && (
                <button onClick={() => setActive('ayrshare')} disabled={saving} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50">Set as Active</button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-500">
          Active provider: <span className="font-medium text-gray-700 capitalize">{form.active_social_provider}</span>
        </div>
      </div>
    </div>
  )
}
