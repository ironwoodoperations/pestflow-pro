import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Prospect } from './types'

const PLATFORM_LABELS: Record<string, string> = {
  facebook:       'Facebook',
  instagram:      'Instagram',
  youtube:        'YouTube',
  googlebusiness: 'Google Business',
  linkedin:       'LinkedIn',
  tiktok:         'TikTok',
}

interface Props {
  form: Partial<Prospect>
  // setField / onBlur retained in signature for compatibility — no longer used
  setField: (k: string, v: any) => void
  onBlur: () => void
}

export default function SocialSection({ form }: Props) {
  const [accounts, setAccounts] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)

  const tenantId = form.tenant_id

  useEffect(() => {
    if (!tenantId) { setAccounts(null); return }
    setLoading(true)
    supabase.from('settings').select('value')
      .eq('tenant_id', tenantId).eq('key', 'integrations').maybeSingle()
      .then(({ data }) => {
        setAccounts(data?.value?.zernio_accounts ?? {})
        setLoading(false)
      })
  }, [tenantId])

  if (!tenantId) {
    return (
      <p className="text-xs text-gray-500 italic">
        Provision this tenant first to see their social connection status.
      </p>
    )
  }

  if (loading) {
    return <p className="text-xs text-gray-400">Loading…</p>
  }

  const connectedPlatforms = Object.entries(accounts ?? {}).filter(([, id]) => !!id)

  if (connectedPlatforms.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          Client has not connected social accounts yet. They can connect from their admin dashboard → Social → Connections.
        </p>
        <p className="text-xs text-gray-500 italic">
          Connection status updates automatically once they authorize a platform.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-400 mb-1">Connected via Zernio OAuth</p>
      <div className="flex flex-wrap gap-2">
        {connectedPlatforms.map(([platform]) => (
          <span key={platform}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/30 border border-emerald-700 rounded-full text-xs text-emerald-300 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            {PLATFORM_LABELS[platform] ?? platform}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1 italic">
        Client connected these accounts from their admin dashboard.
      </p>
    </div>
  )
}
