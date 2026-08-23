import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantBootProvider'
import { getAdminPreset, NEUTRAL_ADMIN_PRESET, type AdminLabelPreset } from '../lib/adminVerticalPreset'

// S285 — resolves the tenant's admin label preset from
// settings.business_info.vertical.
//
// The boot payload (TenantBootProvider) carries id, slug, name, theme and
// colours only — not vertical — so this reads the settings row. Four admin
// surfaces need the same value, so the in-flight promise is cached per tenant:
// four consumers mounting together issue ONE query, and remounts are free for
// the life of the SPA session. The admin is single-tenant per session, so the
// cache never has to be invalidated for correctness; it is keyed by tenant id
// anyway so an Ironwood impersonation switch cannot read the wrong preset.
//
// Vertical is written by provisioning and by the Ironwood settings form, not by
// anything a client admin can reach mid-session, so a stale cache is not a
// scenario worth extra machinery. Reload picks up a change.
const cache = new Map<string, Promise<string | null>>()

function fetchVertical(tenantId: string): Promise<string | null> {
  const hit = cache.get(tenantId)
  if (hit) return hit
  const p = supabase
    .from('settings').select('value').eq('tenant_id', tenantId).eq('key', 'business_info').maybeSingle()
    .then(({ data }) => {
      const v = (data?.value as { vertical?: unknown } | null)?.vertical
      // Anything that is not a string is "not recorded". No null-as-pest branch:
      // one live tenant is deliberately NULL and is not a pest-control business.
      return typeof v === 'string' ? v : null
    })
    .catch(() => null)
  cache.set(tenantId, p)
  return p
}

/** Test seam — resets the module cache between cases. Not used by app code. */
export function __resetAdminPresetCache() {
  cache.clear()
}

/**
 * The resolved preset, plus whether the lookup has settled.
 *
 * Before it settles the preset is NEUTRAL, so the first paint shows platform
 * pages and neutral labels and never a trade the tenant may not be in. A pest
 * tenant sees its service pages appear a moment later; showing pest pages
 * optimistically would mean showing them to an irrigation tenant too.
 */
export function useAdminPreset(): { preset: AdminLabelPreset; vertical: string | null; resolved: boolean } {
  const { id: tenantId } = useTenant()
  const [vertical, setVertical] = useState<string | null>(null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    fetchVertical(tenantId).then(v => {
      if (cancelled) return
      setVertical(v)
      setResolved(true)
    })
    return () => { cancelled = true }
  }, [tenantId])

  return {
    preset: resolved ? getAdminPreset(vertical) : NEUTRAL_ADMIN_PRESET,
    vertical,
    resolved,
  }
}
