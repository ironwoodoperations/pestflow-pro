import { useState } from 'react'
import { Lock } from 'lucide-react'
import { usePlan } from '../../../hooks/usePlan'

interface Props {
  onClose: () => void
  onNavigate?: (tab: string) => void
}

type ProviderTab = 'export' | 'diy' | 'bundle' | 'full_auto'
const TABS: { id: ProviderTab; label: string; tier: number }[] = [
  { id: 'export',    label: 'Hands On',      tier: 1 },
  { id: 'diy',       label: 'DIY',           tier: 2 },
  { id: 'bundle',    label: 'Semi-Auto',     tier: 3 },
  { id: 'full_auto', label: 'Full Autopilot', tier: 4 },
]

const TIER_PROVIDER: Record<number, ProviderTab> = { 1: 'export', 2: 'diy', 3: 'bundle', 4: 'full_auto' }
const PLAN_INFO: Record<number, { name: string; price: number }> = {
  1: { name: 'Starter', price: 149 },
  2: { name: 'Grow',    price: 249 },
  3: { name: 'Pro',     price: 349 },
  4: { name: 'Elite',   price: 499 },
}

export default function ConnectionsModal({ onClose, onNavigate }: Props) {
  const { tier } = usePlan()
  const [activeTab, setActiveTab] = useState<ProviderTab>('export')
  const activeProvider = TIER_PROVIDER[tier] || 'export'

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
              <p className="text-xs text-gray-500">You're in control. Use your own social media scheduling tools — Buffer, Hootsuite, Later, or any tool you prefer. We generate the content; you handle the posting.</p>
              {tier < 2 ? <LockedBadge tabTier={2} /> : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                    <p className="font-semibold">How to use DIY mode:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-600">
                      <li>Write or generate posts in the Content Queue</li>
                      <li>Copy the caption text from each approved post</li>
                      <li>Paste into Buffer, Hootsuite, or your preferred tool</li>
                      <li>Schedule and publish from there</li>
                    </ol>
                  </div>
                  <p className="text-xs text-gray-400">Your social media account credentials are managed by PestFlow Pro — contact your account manager if you need to update your connected accounts.</p>
                  {activeProvider === 'diy' && <ActiveBadge />}
                </>
              )}
            </div>
          )}

          {activeTab === 'bundle' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Multi-platform scheduling via bundle.social</h4>
              <p className="text-xs text-gray-500">Approved posts in your Content Queue are automatically sent to your social accounts via bundle.social. No token required — posting is managed by PestFlow Pro on your behalf.</p>
              {tier < 3 ? <LockedBadge tabTier={3} /> : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 space-y-1">
                    <p className="font-semibold">How Semi-Auto works:</p>
                    <ol className="list-decimal list-inside space-y-1 text-emerald-600">
                      <li>Write or generate posts in the Content Queue</li>
                      <li>Approve the post — it enters the publishing queue</li>
                      <li>bundle.social delivers it to your connected accounts</li>
                      <li>Track results in the Analytics tab</li>
                    </ol>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                    Powered by <strong>bundle.social</strong> — managed by your PestFlow Pro account manager.
                    Contact Scott to connect your Facebook or Instagram account.
                  </div>
                  {activeProvider === 'bundle' && <ActiveBadge />}
                </>
              )}
            </div>
          )}

          {activeTab === 'full_auto' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Full multi-platform posting via bundle.social</h4>
              <p className="text-xs text-gray-500">Sit back and let us handle everything. We connect your accounts and manage your posting schedule across Facebook, Instagram, and more. Your posts go out consistently — without you lifting a finger. Included with your Elite plan.</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {['Facebook', 'Instagram', 'Google Business Posts', 'Consistent weekly posting schedule', 'AI-generated captions tailored to your business'].map(item => (
                  <li key={item} className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span>{item}</li>
                ))}
              </ul>
              {tier < 4 ? <LockedBadge tabTier={4} /> : activeProvider === 'full_auto' && <ActiveBadge />}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-500">
          Active mode: <span className="font-medium text-gray-700">{TABS.find(t => t.id === activeProvider || (t.id === 'bundle' && activeProvider === 'bundle'))?.label ?? 'Hands On'}</span>
          <span className="ml-2 text-gray-400">(set by {PLAN_INFO[tier]?.name} plan)</span>
        </div>
      </div>
    </div>
  )
}
