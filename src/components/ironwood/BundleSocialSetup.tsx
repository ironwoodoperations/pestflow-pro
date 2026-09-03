import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
interface Props {
  tenantId: string
}

// Zernio account IDs synced automatically via OAuth — stored in settings.integrations.zernio_accounts
// This panel shows the current connection status for Scott's reference.
// Clients connect their own accounts via the admin Social → Connections tab.

interface ZernioAccount {
  platform: string
  accountId: string
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook:       'Facebook',
  instagram:      'Instagram',
  youtube:        'YouTube',
  googlebusiness: 'Google Business',
  linkedin:       'LinkedIn',
  tiktok:         'TikTok',
}

export default function BundleSocialSetup({ tenantId }: Props) {
  const [open, setOpen]         = useState(false)
  const [accounts, setAccounts] = useState<ZernioAccount[]>([])
  const [profileId, setProfileId] = useState('')
  /**
   * S326 ITEM 3b — "not configured" is a different state from "not created",
   * and the operator needs to be able to tell them apart.
   *
   * Read from settings.integrations.zernio_last_error, which provision-tenant
   * writes as the allowlisted literal 'not_configured' when ZERNIO_API_KEY is
   * unset, and clears to null on a successful create. No new settings KEY was
   * invented for this: it is a field inside the existing `integrations` row,
   * matching the outscraper_last_error / outscraper_last_synced_at convention
   * that places-reviews and outscraper-reviews already use in the same row.
   *
   * provisioning_status was the other candidate and is the wrong shape: it is
   * per-run, keyed by correlation_id, written by ironwood-provision rather than
   * provision-tenant, and this component does not read it. Whether a platform
   * secret is set is a standing fact, not an attribute of one provisioning run.
   */
  const [zernioStatus, setZernioStatus] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!open) return
    async function load() {
      setLoading(true)
      const { data: integ } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'integrations')
        .maybeSingle()
      if (integ?.value) {
        setProfileId(integ.value.zernio_profile_id ?? '')
        setZernioStatus(integ.value.zernio_last_error ?? null)
        const accs: ZernioAccount[] = Object.entries(integ.value.zernio_accounts ?? {}).map(
          ([platform, accountId]) => ({ platform, accountId: accountId as string })
        )
        setAccounts(accs)
      }
      setLoading(false)
    }
    load()
  }, [open, tenantId])

  const connectedCount = accounts.length

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">📱 Social Media Setup (Zernio)</span>
          {connectedCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400">
              {connectedCount} account{connectedCount !== 1 ? 's' : ''} connected
            </span>
          )}
          {!connectedCount && profileId && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300">
              profile ready — no accounts yet
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4 bg-gray-950">
          {loading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <>
              {/* Profile ID */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400">Zernio Profile ID</p>
                {/*
                  S326 ITEM 1b — the previous text read:
                    "No Zernio profile — re-provision this client to generate one."
                  Re-provisioning was, until this same change, an operation that
                  reset the client's admin password and killed their live sessions.
                  So the UI recommended a destructive act as the remedy for a
                  social-media task. It is replaced, not softened, and no button
                  is wired here — lazy creation on first Connect is queued behind
                  the RPC session.

                  ITEM 3b — two distinct states, because the remedies differ: a
                  missing platform secret is Scott's to fix once for the whole
                  deployment, while a missing profile on a configured deployment
                  is a per-tenant gap.
                */}
                {profileId
                  ? <p className="text-xs text-emerald-400 font-mono">{profileId}</p>
                  : zernioStatus === 'not_configured'
                    ? (
                      <div className="space-y-1">
                        <p className="text-xs text-amber-400">
                          Zernio is not configured on this deployment — provisioning skipped profile creation.
                        </p>
                        <p className="text-xs text-gray-500">
                          The <span className="font-mono">ZERNIO_API_KEY</span> Edge Function secret is unset. Until it is set, no
                          tenant gets a profile and Social → Connections will fail for all of them.
                        </p>
                      </div>
                    )
                    : (
                      <div className="space-y-1">
                        <p className="text-xs text-amber-400">No Zernio profile for this tenant yet.</p>
                        <p className="text-xs text-gray-500">
                          Social → Connections will report no profile until one exists. Nothing here creates it — ask
                          engineering rather than re-provisioning, which is not a profile-creation route.
                        </p>
                      </div>
                    )
                }
              </div>

              {/* Connected accounts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400">Connected Accounts</p>
                {accounts.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No accounts connected yet. Client connects their own accounts via the admin Social → Connections tab.
                  </p>
                ) : (
                  accounts.map(({ platform, accountId }) => (
                    <div key={platform} className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">{PLATFORM_LABELS[platform] ?? platform}</span>
                      <span className="text-xs text-emerald-400 font-mono">{accountId}</span>
                    </div>
                  ))
                )}
              </div>

              {profileId && (
                <div className="bg-emerald-900/20 border border-emerald-700 rounded px-3 py-2">
                  <p className="text-xs text-emerald-400 font-medium">✓ Zernio profile provisioned</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Client self-connects social accounts from their admin dashboard.
                    Posting goes live the moment they connect.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
