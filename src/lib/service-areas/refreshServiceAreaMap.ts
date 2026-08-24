import type { SupabaseClient } from '@supabase/supabase-js'

// S293 PR C — regenerate the tenant's service-area map after the city set changes.
//
// THREE call sites change that set: saving a city, deleting one, and toggling
// one live. All three must call this. Fixing one and leaving the others is how
// a stale map would survive — the same "THE SECOND WRITE" failure S290 and S292
// were both caught by, so the helper exists to make the three calls identical.
//
// Staleness is SAFE here by construction: the render path compares the stored
// revision against the live city set and renders NOTHING when they disagree. So
// a failure of this call costs a missing map, never a wrong one. That is why it
// reports rather than blocks, and why it must never be "fixed" by having the
// page fall back to the old image.

export interface RefreshResult {
  ok: boolean
  /** Human-readable reason, when ok is false. */
  error?: string
  /** Cities the geocoder could not place. They are omitted from the map. */
  failures?: string[]
  cities?: number
}

export async function refreshServiceAreaMap(
  supabase: SupabaseClient,
  tenantId: string | null | undefined,
): Promise<RefreshResult> {
  if (!tenantId) return { ok: false, error: 'no tenant' }
  try {
    const { data, error } = await supabase.functions.invoke('service-area-map', {
      body: { tenant_id: tenantId },
    })
    if (error) return { ok: false, error: error.message }
    const body = (data ?? {}) as { error?: string; failures?: string[]; cities?: number }
    if (body.error) return { ok: false, error: body.error }
    return { ok: true, failures: body.failures ?? [], cities: body.cities }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/**
 * The toast line for a refresh, or null when there is nothing worth saying.
 *
 * A city the geocoder could not place is worth saying: it is silently absent
 * from the map, and the operator is the only person who can tell us that
 * "Chapel Hill" needed a state. Nine of dang's eighteen cities have no state
 * recorded, so this is not hypothetical.
 */
export function refreshMessage(result: RefreshResult): string | null {
  if (!result.ok) return `Map not updated: ${result.error ?? 'unknown error'}`
  const failures = result.failures ?? []
  if (failures.length === 0) return null
  const names = failures.map((f) => f.split(':')[0]).join(', ')
  return `Map updated, but these cities could not be located and are not shown: ${names}`
}
