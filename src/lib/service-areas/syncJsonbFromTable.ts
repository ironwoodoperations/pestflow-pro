import type { SupabaseClient } from '@supabase/supabase-js'
import { buildJsonbProjection } from './normalize'

/**
 * Re-derives settings.seo.service_areas JSONB from the service_areas table
 * and writes it atomically. Call after any insert/update/delete on service_areas.
 * Returns an error string on failure, null on success.
 */
export async function syncServiceAreasJsonb(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<string | null> {
  const { data: rows, error: fetchErr } = await supabase
    .from('service_areas')
    .select('city, is_live')
    .eq('tenant_id', tenantId)
  if (fetchErr) return fetchErr.message

  const projection = buildJsonbProjection(rows ?? [])

  const { data: seoRow } = await supabase
    .from('settings')
    .select('value')
    .eq('tenant_id', tenantId)
    .eq('key', 'seo')
    .maybeSingle()

  const currentValue = (seoRow?.value ?? {}) as Record<string, unknown>

  const { error: updateErr } = await supabase
    .from('settings')
    .upsert(
      { tenant_id: tenantId, key: 'seo', value: { ...currentValue, service_areas: projection } },
      { onConflict: 'tenant_id,key' },
    )

  return updateErr ? updateErr.message : null
}
