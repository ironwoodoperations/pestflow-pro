import { useState, useEffect, useCallback } from 'react'
import { Lock, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { usePlan } from '../../../hooks/usePlan'
import { useTenant } from '../../../context/TenantBootProvider'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
  onNavigate?: (tab: string) => void
  isDemoTenant?: boolean
}

const PLAN_INFO: Record<number, { name: string; price: number }> = {
  1: { name: 'Starter', price: 149 },
  2: { name: 'Grow',    price: 249 },
  3: { name: 'Pro',     price: 349 },
  4: { name: 'Elite',   price: 499 },
}

interface ZernioAccount {
  _id: string
  platform: string      // Zernio platform key (e.g. 'googlebusiness')
  name: string
  frontendKey: string   // our key (e.g. 'google_business')
}

const PLATFORMS = [
  { key: 'facebook',        zernioKey: 'facebook',       label: 'Facebook',        icon: '📘' },
  { key: 'instagram',       zernioKey: 'instagram',      label: 'Instagram',       icon: '📷' },
  { key: 'youtube',         zernioKey: 'youtube',        label: 'YouTube',         icon: '▶️' },
  { key: 'google_business', zernioKey: 'googlebusiness', label: 'Google Business', icon: '🔍' },
  { key: 'linkedin',        zernioKey: 'linkedin',       label: 'LinkedIn',        icon: '💼' },
]

interface State {
  accounts: ZernioAccount[]
  loading: boolean
  connectingKey: string | null   // zernioKey of platform currently connecting (OAuth open)
  refreshing: boolean
}

export default function ConnectionsModal({ onClose, onNavigate, isDemoTenant = true }: Props) {
  const { tier } = usePlan()
  const { id: tenantId } = useTenant()

  const [state, setState] = useState<State>({
    accounts: [],
    loading: false,
    connectingKey: null,
    refreshing: false,
  })

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

  const loadAccounts = useCallback(async (opts?: { silent?: boolean }) => {
    if (!tenantId) return
    setState(s => ({ ...s, loading: !opts?.silent, refreshing: !!opts?.silent }))
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/zernio-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_accounts', tenantId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (!opts?.silent) toast.error(data?.error || 'Failed to load social connections.')
      } else {
        setState(s => ({ ...s, accounts: data.accounts ?? [], connectingKey: null }))
      }
    } catch {
      if (!opts?.silent) toast.error('Could not reach social connection service.')
    } finally {
      setState(s => ({ ...s, loading: false, refreshing: false }))
    }
  }, [tenantId, supabaseUrl])

  useEffect(() => {
    if (tier >= 2) loadAccounts()
  }, [tier, loadAccounts])

  async function connectPlatform(zernioKey: string, label: string) {
    if (!tenantId) return
    setState(s => ({ ...s, connectingKey: zernioKey }))
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/zernio-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_connect_url', tenantId, platform: zernioKey }),
      })
      const data = await res.json()
      if (!res.ok || !data.authUrl) {
        toast.error(data?.error || `Could not get authorization URL for ${label}.`)
        setState(s => ({ ...s, connectingKey: null }))
        return
      }
      window.open(data.authUrl, '_blank')
      // connectingKey stays set — shows "waiting" UI until user confirms
    } catch {
      toast.error(`Failed to start ${label} connection.`)
      setState(s => ({ ...s, connectingKey: null }))
    }
  }

  async function confirmAuthorization() {
    await loadAccounts({ silent: true })
    // If the platform now shows as connected, connectingKey was cleared inside loadAccounts
    // If it's still pending, show a message
    toast.info('Connection status refreshed.')
  }

  function isConnected(zernioKey: string): ZernioAccount | undefined {
    return state.accounts.find(a => a.platform === zernioKey)
  }

  if (tier < 2) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="max-w-sm w-full bg-white rounded-xl shadow-xl p-6 text-center" onClick={e => e.stopPropagation()}>
          <Lock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Social Connections</h3>
          {isDemoTenant ? (
            <>
              <p className="text-sm text-gray-500 mb-4">Upgrade to Grow to connect your social accounts and enable automated posting.</p>
              <p className="text-xs font-semibold text-amber-700 mb-4">Requires Grow — $249/mo</p>
              {onNavigate
                ? <button onClick={() => { onClose(); onNavigate('billing') }} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Upgrade Plan →</button>
                : <a href="mailto:support@pestflow.ai?subject=Plan Upgrade Request" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 inline-block">Upgrade Plan →</a>
              }
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">Social connections are available on the Growth plan. Contact us to enable this feature.</p>
              <a href="mailto:scott@ironwoodoperationsgroup.com?subject=Social Connections" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 inline-block">Contact us →</a>
            </>
          )}
          <button onClick={onClose} className="block mt-3 mx-auto text-xs text-gray-400 hover:text-gray-600">Close</button>
        </div>
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

        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          <p className="text-xs text-gray-500">
            Connect your social accounts to enable automated posting and scheduling.
            Each platform requires a one-time authorization.
          </p>

          {state.loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading connections…</span>
            </div>
          ) : (
            <div className="space-y-3">
              {PLATFORMS.map(({ key, zernioKey, label, icon }) => {
                const account = isConnected(zernioKey)
                const isPending = state.connectingKey === zernioKey

                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{icon}</span>
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </div>
                      {account ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Circle className="w-3.5 h-3.5" />
                          Not connected
                        </span>
                      )}
                    </div>

                    {account && (
                      <p className="text-xs text-gray-400 mt-1 ml-6">{account.name}</p>
                    )}

                    {!account && !isPending && (
                      <button
                        onClick={() => connectPlatform(zernioKey, label)}
                        className="mt-2 ml-6 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                      >
                        Connect {label}
                      </button>
                    )}

                    {!account && isPending && (
                      <div className="mt-2 ml-6 space-y-1.5">
                        <p className="text-xs text-blue-600 font-medium">
                          Waiting for authorization… Your connection will appear automatically once authorized.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={confirmAuthorization}
                            disabled={state.refreshing}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {state.refreshing && <Loader2 className="w-3 h-3 animate-spin" />}
                            I've completed authorization
                          </button>
                          <button
                            onClick={() => setState(s => ({ ...s, connectingKey: null }))}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!state.loading && (
            <button
              onClick={() => loadAccounts({ silent: true })}
              disabled={state.refreshing}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 disabled:opacity-50"
            >
              {state.refreshing && <Loader2 className="w-3 h-3 animate-spin" />}
              Refresh status
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-500">
          {state.accounts.length > 0
            ? `${state.accounts.length} platform${state.accounts.length !== 1 ? 's' : ''} connected`
            : 'No platforms connected yet'}
          <span className="ml-2 text-gray-400">— {PLAN_INFO[tier]?.name} plan</span>
        </div>
      </div>
    </div>
  )
}
